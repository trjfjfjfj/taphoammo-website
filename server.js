const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const { SePayPgClient } = require('sepay-pg-node');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// DATABASE
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error('❌ Lỗi database:', err);
  else console.log('✅ Database kết nối');
});

// SEPAY CONFIG
const SEPAY_CLIENT = new SePayPgClient({
  env: 'sandbox',
  merchant_id: process.env.MERCHANT_ID || 'SP-TEST-HG63994A',
  secret_key: process.env.SECRET_KEY || 'spsk_test_7B1GRUqbRc64zTc4Fw2qpHxBb15dARaM'
});

// CONSTANTS
const MIN_WITHDRAW = 200000;
const MAX_WITHDRAW = 2000000;
const WITHDRAW_FEE = 0.15;

// ==================== AUTH ====================

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, isSeller, shopName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (email, name, password, is_seller, shop_name) VALUES (?, ?, ?, ?, ?)`,
      [email, name, hashedPassword, isSeller ? 1 : 0, shopName || name],
      function (err) {
        if (err) {
          return res.status(400).json({ error: 'Email đã tồn tại' });
        }

        // Tạo wallet cho user
        db.run(
          `INSERT INTO wallets (user_id, deposit_balance, sell_balance) VALUES (?, ?, ?)`,
          [this.lastID, 0, 0],
          (err) => {
            if (err) console.error(err);
            res.json({ success: true, message: 'Đăng ký thành công' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Email không tồn tại' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Mật khẩu sai' });
    }

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, isSeller: user.is_seller }
    });
  });
});

// ==================== WALLET ====================

app.get('/api/wallet/balance/:userId', (req, res) => {
  const { userId } = req.params;

  db.get(`SELECT * FROM wallets WHERE user_id = ?`, [userId], (err, wallet) => {
    if (err || !wallet) {
      return res.status(404).json({ error: 'Không tìm thấy ví' });
    }
    res.json(wallet);
  });
});

// ==================== DEPOSIT ====================

app.post('/api/deposit/create-checkout', (req, res) => {
  const { userId, amount } = req.body;

  if (amount < 10000) {
    return res.status(400).json({ error: 'Số tiền tối thiểu là 10.000 VNĐ' });
  }

  try {
    const orderId = `ORD-${userId}-${Date.now()}`;
    const checkoutURL = SEPAY_CLIENT.checkout.initCheckoutUrl();

    const checkoutFormfields = SEPAY_CLIENT.checkout.initOneTimePaymentFields({
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: orderId,
      order_amount: amount,
      currency: 'VND',
      order_description: `Nạp tiền ChoTaiNguyenMMO - ${userId}`,
      success_url: `https://chotainguyenmmo.cloud/deposit-success?order_id=${orderId}`,
      error_url: `https://chotainguyenmmo.cloud/deposit-error`,
      cancel_url: `https://chotainguyenmmo.cloud/deposit-cancel`
    });

    // Lưu transaction
    db.run(
      `INSERT INTO transactions (user_id, type, amount, status, order_id) VALUES (?, ?, ?, ?, ?)`,
      [userId, 'deposit', amount, 'pending', orderId]
    );

    res.json({ success: true, checkoutURL, checkoutFormfields, orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi tạo checkout' });
  }
});

// Callback từ Sepay
app.post('/api/deposit/callback', (req, res) => {
  const { order_invoice_number, status, order_amount } = req.body;

  console.log('📞 Nhận callback từ Sepay:', req.body);

  if (status === '00') {
    // Lấy userId từ transaction
    db.get(
      `SELECT user_id FROM transactions WHERE order_id = ?`,
      [order_invoice_number],
      (err, transaction) => {
        if (err || !transaction) {
          return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
        }

        // Cộng tiền vào ví
        db.run(
          `UPDATE wallets SET deposit_balance = deposit_balance + ? WHERE user_id = ?`,
          [order_amount, transaction.user_id],
          (err) => {
            if (err) console.error(err);

            // Update transaction status
            db.run(
              `UPDATE transactions SET status = ? WHERE order_id = ?`,
              ['success', order_invoice_number]
            );

            console.log(`✅ Cộng ${order_amount} VNĐ cho user ${transaction.user_id}`);
            res.json({ success: true, message: 'Thanh toán thành công' });
          }
        );
      }
    );
  } else {
    // Thanh toán thất bại
    db.run(
      `UPDATE transactions SET status = ? WHERE order_id = ?`,
      ['failed', order_invoice_number]
    );
    res.json({ success: false, message: 'Thanh toán thất bại' });
  }
});

// ==================== WITHDRAW ====================

app.post('/api/withdraw', (req, res) => {
  const { userId, amount, bankAccount } = req.body;

  if (amount < MIN_WITHDRAW || amount > MAX_WITHDRAW) {
    return res.status(400).json({
      error: `Số tiền phải từ ${MIN_WITHDRAW.toLocaleString('vi-VN')} đến ${MAX_WITHDRAW.toLocaleString('vi-VN')} VNĐ`
    });
  }

  db.get(`SELECT * FROM wallets WHERE user_id = ?`, [userId], (err, wallet) => {
    if (err || !wallet || wallet.sell_balance < amount) {
      return res.status(400).json({ error: 'Số dư ví bán không đủ' });
    }

    const fee = Math.floor(amount * WITHDRAW_FEE);
    const receive = amount - fee;

    // Trừ tiền từ ví
    db.run(
      `UPDATE wallets SET sell_balance = sell_balance - ? WHERE user_id = ?`,
      [amount, userId],
      (err) => {
        if (err) console.error(err);

        // Lưu transaction
        db.run(
          `INSERT INTO transactions (user_id, type, amount, fee, receive, bank_account, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, 'withdraw', amount, fee, receive, bankAccount, 'completed']
        );

        res.json({
          success: true,
          message: 'Rút tiền thành công',
          details: { amount, fee, receive, bankAccount }
        });
      }
    );
  });
});

// ==================== TRANSACTIONS ====================

app.get('/api/transactions/:userId', (req, res) => {
  const { userId } = req.params;

  db.all(
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi server' });
      }
      res.json({ transactions: transactions || [] });
    }
  );
});

// ==================== PRODUCTS ====================

app.get('/api/products', (req, res) => {
  db.all(`SELECT * FROM products ORDER BY created_at DESC`, (err, products) => {
    if (err) return res.status(500).json({ error: 'Lỗi server' });
    res.json({ products: products || [] });
  });
});

app.post('/api/products', (req, res) => {
  const { userId, name, price, description } = req.body;

  db.run(
    `INSERT INTO products (user_id, name, price, description) VALUES (?, ?, ?, ?)`,
    [userId, name, price, description],
    function (err) {
      if (err) return res.status(500).json({ error: 'Lỗi server' });
      res.json({ success: true, productId: this.lastID });
    }
  );
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM products WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Lỗi server' });
    res.json({ success: true });
  });
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});

module.exports = app;