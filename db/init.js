const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Tạo thư mục db nếu chưa tồn tại
if (!fs.existsSync(path.join(__dirname, '../db'))) {
  fs.mkdirSync(path.join(__dirname, '../db'), { recursive: true });
}

const DB_PATH = path.join(__dirname, '../database.db');

// Kết nối database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Lỗi kết nối database:', err);
  } else {
    console.log('✅ Kết nối database thành công');
    initDatabase();
  }
});

// Khởi tạo schema
function initDatabase() {
  db.serialize(() => {
    // Bảng Users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        is_seller BOOLEAN DEFAULT 0,
        shop_name TEXT,
        shop_desc TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bảng Wallets
    db.run(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        deposit_balance INTEGER DEFAULT 0,
        sell_balance INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Bảng Products
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Bảng Transactions
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        fee INTEGER DEFAULT 0,
        receive INTEGER,
        status TEXT DEFAULT 'pending',
        order_id TEXT,
        method TEXT,
        bank_account TEXT,
        product_name TEXT,
        items TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Bảng Orders
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'completed',
        items TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('✅ Database schema khởi tạo thành công!');
  });
}

module.exports = db;