const express = require('express');
const { SePayPgClient } = require('sepay-pg-node');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SEPAY CONFIG
const SEPAY_CLIENT = new SePayPgClient({
  env: 'sandbox',
  merchant_id: 'SP-TEST-HG63994A',
  secret_key: 'spsk_test_7B1GRUqbRc64zTc4Fw2qpHxBb15dARaM'
});

// DATABASE GIẢ LẬP (dùng tạm, sau dùng MongoDB/MySQL)
let users = {};
let userWallets = {};
let transactions = {};

// ==================== AUTHENTICATION ====================

// Đăng ký
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, isSeller, shopName } = req.body;

  if (users[email]) {
    return res.status(400).json({ error: 'Email đã tồn tại' });
  }

  users[email] = {
    name,
    password: hashPassword(password),
    isSeller,
    shopName: shopName || name,
    createdAt: new Date()
  };

  userWallets[email] = {
    depositBalance: 0,
    sellBalance: 0
  };

  res.json({ success: true, message: 'Đăng ký thành công' });
});

// Đăng nhập
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!users[email] || users[email].password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu sai' });
  }

  res.json({
    success: true,
    user: {
      email,
      name: users[email].name,
      isSeller: users[email].isSeller
    }
  });
});

// ==================== WALLET ====================

// Lấy số dư ví
app.get('/api/wallet/balance', (req, res) => {
  const email = req.headers['x-user-email'];
  
  if (!email || !userWallets[email]) {
    return res.status(401).json({ error: 'Không tìm thấy người dùng' });
  }

  res.json(userWallets[email]);
});

// ==================== SEPAY CHECKOUT ====================

// Tạo link checkout Sepay
app.post('/api/deposit/create-checkout', (req, res) => {
  const email = req.headers['x-user-email'];
  const { amount } = req.body;

  if (!email || !userWallets[email]) {
    return res.status(401).json({ error: 'Không tìm thấy người dùng' });
  }

  if (!amount || amount < 10000) {
    return res.status(400).json({ error: 'Số tiền tối thiểu là 10,000 VNĐ' });
  }

  try {
    // Tạo order ID duy nhất
    const orderId = `ORD-${email.split('@')[0]}-${Date.now()}`;

    // Khởi tạo checkout URL
    const checkoutURL = SEPAY_CLIENT.checkout.initCheckoutUrl();

    // Khởi tạo form fields
    const checkoutFormfields = SEPAY_CLIENT.checkout.initOneTimePaymentFields({
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: orderId,
      order_amount: amount,
      currency: 'VND',
      order_description: `Nạp tiền TapHoaMmo - ${email}`,
      success_url: `https://chotainguyenmmo.cloud/deposit-success?order_id=${orderId}&email=${email}`,
      error_url: `https://chotainguyenmmo.cloud/deposit-error?order_id=${orderId}`,
      cancel_url: `https://chotainguyenmmo.cloud/deposit-cancel?order_id=${orderId}`,
    });

    // Lưu order
    if (!transactions[email]) {
      transactions[email] = [];
    }

    transactions[email].push({
      orderId,
      amount,
      status: 'pending',
      type: 'deposit',
      createdAt: new Date()
    });

    res.json({
      success: true,
      checkoutURL,
      checkoutFormfields,
      orderId
    });
  } catch (error) {
    console.error('Lỗi tạo checkout:', error);
    res.status(500).json({ error: 'Lỗi tạo checkout' });
  }
});

// ==================== SEPAY CALLBACK ====================

// Callback từ Sepay (khi thanh toán thành công)
app.post('/api/deposit/callback', (req, res) => {
  const { order_invoice_number, status, order_amount } = req.body;

  console.log('📞 Nhận callback từ Sepay:', req.body);

  if (status === '00') {
    // Thanh toán thành công
    const [, userName] = order_invoice_number.split('-');
    const email = Object.keys(users).find(e => e.startsWith(userName));

    if (email && userWallets[email]) {
      // Auto cộng tiền vào ví nạp
      userWallets[email].depositBalance += order_amount;

      // Update transaction
      const transaction = transactions[email].find(t => t.orderId === order_invoice_number);
      if (transaction) {
        transaction.status = 'success';
        transaction.completedAt = new Date();
      }

      console.log(`✅ Cộng ${order_amount} VNĐ vào ví của ${email}`);
      res.json({ success: true, message: 'Thanh toán thành công' });
    } else {
      res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
  } else {
    // Thanh toán thất bại
    const [, userName] = order_invoice_number.split('-');
    const email = Object.keys(users).find(e => e.startsWith(userName));

    if (email && transactions[email]) {
      const transaction = transactions[email].find(t => t.orderId === order_invoice_number);
      if (transaction) {
        transaction.status = 'failed';
      }
    }

    console.log(`❌ Thanh toán thất bại: ${order_invoice_number}`);
    res.json({ success: false, message: 'Thanh toán thất bại' });
  }
});

// ==================== WITHDRAW ====================

const MIN_WITHDRAW = 200000;
const MAX_WITHDRAW = 2000000;
const WITHDRAW_FEE = 0.15; // 15%

// Rút tiền
app.post('/api/withdraw', (req, res) => {
  const email = req.headers['x-user-email'];
  const { amount, bankAccount } = req.body;

  if (!email || !userWallets[email]) {
    return res.status(401).json({ error: 'Không tìm thấy người dùng' });
  }

  if (amount < MIN_WITHDRAW) {
    return res.status(400).json({ error: `Số tiền rút tối thiểu là ${MIN_WITHDRAW.toLocaleString('vi-VN')} VNĐ` });
  }

  if (amount > MAX_WITHDRAW) {
    return res.status(400).json({ error: `Số tiền rút tối đa là ${MAX_WITHDRAW.toLocaleString('vi-VN')} VNĐ` });
  }

  if (userWallets[email].sellBalance < amount) {
    return res.status(400).json({ error: 'Số dư ví bán không đủ' });
  }

  const fee = Math.floor(amount * WITHDRAW_FEE);
  const receive = amount - fee;

  // Trừ tiền từ ví bán
  userWallets[email].sellBalance -= amount;

  // Lưu transaction
  if (!transactions[email]) {
    transactions[email] = [];
  }

  transactions[email].push({
    type: 'withdraw',
    amount,
    fee,
    receive,
    bankAccount,
    status: 'completed',
    createdAt: new Date()
  });

  res.json({
    success: true,
    message: 'Rút tiền thành công',
    details: {
      amount,
      fee,
      receive,
      bankAccount
    }
  });
});

// ==================== LỊCH SỬ ====================

app.get('/api/transactions', (req, res) => {
  const email = req.headers['x-user-email'];

  if (!email) {
    return res.status(401).json({ error: 'Không tìm thấy người dùng' });
  }

  res.json({
    transactions: transactions[email] || []
  });
});

// ==================== HELPER ====================

function hashPassword(password) {
  // Tạm dùng, sau dùng bcrypt
  return Buffer.from(password).toString('base64');
}

// ==================== SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});

module.exports = app;