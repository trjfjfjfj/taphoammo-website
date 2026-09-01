# 🎁 ChoTaiNguyenMMO - Nền Tảng Mua Bán & Nạp Tiền

![QR thanh toán - Ngân hàng TMCP Tiên Phong - 10004525267 - HOANG GIA BAO](https://vietqr.app/img?bank=TPBank&acc=10004525267&template=&showinfo=true&fullacc=true&holder=HOANG%20GIA%20BAO&store=CTY%20TNHH%20TRUY%E1%BB%80N%20TH%C3%94NG%20MEDIA%20ABNMXH)

## 📋 Giới Thiệu

**ChoTaiNguyenMMO** là nền tảng an toàn để mua bán hàng hoá, nạp tiền và rút tiền với các tính năng:

✅ **Đăng ký/Đăng nhập** - Tài khoản người dùng  
✅ **Ví Nạp** - Dùng để mua hàng  
✅ **Ví Bán** - Nhận tiền từ bán hàng  
✅ **Nạp Tiền** - QR code tự động + Auto nhận (1-5 phút)  
✅ **Rút Tiền** - Min 200k, Max 2 triệu, phí 15%  
✅ **Mua Hàng** - Thẻ điện thoại, thẻ game, thẻ cào, dịch vụ internet  
✅ **Bán Hàng** - Người bán có thể đăng sản phẩm  
✅ **Lịch Sử Giao Dịch** - Theo dõi tất cả giao dịch  

---

## 🌐 Website

- **GitHub Pages**: https://trjfjfjfj.github.io/chotainguyenmmo/
- **Tên Miền**: http://chotainguyenmmo.cloud

---

## 🚀 Cài Đặt & Chạy

### Frontend (GitHub Pages)
```bash
# Clone repo
git clone https://github.com/trjfjfjfj/chotainguyenmmo.git
cd chotainguyenmmo

# Mở tệp index.html trong trình duyệt
open index.html
```

### Backend (Node.js)
```bash
# Cài đặt dependencies
npm install

# Chạy server
npm start

# Server chạy tại: http://localhost:5000
```

---

## 🗄️ Database

Hiện tại sử dụng **SQLite** (nâng cấp lên MongoDB/MySQL sau)

### Cài Đặt Database
```bash
# Cài đặt SQLite3
npm install sqlite3

# Tạo database
node db/init.js
```

---

## 🔐 Cấu Hình Sepay

### Biến Môi Trường (`.env`)
```
PORT=5000
MERCHANT_ID=SP-TEST-HG63994A
SECRET_KEY=spsk_test_7B1GRUqbRc64zTc4Fw2qpHxBb15dARaM
DATABASE_URL=sqlite:./database.db
```

### Webhook Callback
Setup trên https://my.sepay.vn/:
```
URL: https://chotainguyenmmo.cloud/api/deposit/callback
Method: POST
```

---

## 📡 API Endpoints

### Xác Thực
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Ví Tiền
```
GET /api/wallet/balance
POST /api/deposit/create-checkout
POST /api/withdraw
GET /api/transactions
```

### Sản Phẩm
```
GET /api/products
POST /api/products (Người bán)
DELETE /api/products/:id (Người bán)
```

---

## 💳 Thông Tin Ngân Hàng

| Thông Tin | Chi Tiết |
|-----------|----------|
| 🏦 Ngân Hàng | Tiên Phong (TPBank) |
| 💳 Số Tài Khoản | 10004525267 |
| 👤 Chủ Tài Khoản | HOANG GIA BAO |
| 🏪 Tên Cửa Hàng | CTY TNHH TRUYỀN THÔNG MEDIA ABNMXH |

---

## 📊 Cấu Trúc Thư Mục

```
├── index.html              # Trang chủ
├── styles.css              # CSS
├── script.js               # JavaScript Frontend
├── server.js               # Backend Express
├── package.json            # Dependencies
├── db/
│   ├── init.js            # Khởi tạo database
│   └── schema.sql         # Schema database
├── api/
│   ├── auth.js            # Auth routes
│   ├── wallet.js          # Wallet routes
│   ├── products.js        # Products routes
│   └── deposit.js         # Deposit routes
└── README.md              # Tài liệu
```

---

## 🔄 Quy Trình Nạp Tiền

```
1. Người dùng nhấn "Nạp Tiền"
   ↓
2. Chọn số tiền + ph��ơng thức "Chuyển khoản Ngân hàng"
   ��
3. Hệ thống sinh QR code VietQR tự động
   ↓
4. Người dùng quét QR trên ứng dụng ngân hàng
   ↓
5. Chuyển khoản (nội dung: email hoặc SĐT)
   ↓
6. Sepay nhận callback → Server xác nhận
   ↓
7. Auto cộng tiền vào Ví Nạp ✅ (1-5 phút)
```

---

## 💰 Điều Kiện Rút Tiền

| Điều Kiện | Giá Trị |
|-----------|--------|
| Số tiền tối thiểu | 200.000 VNĐ |
| Số tiền tối đa | 2.000.000 VNĐ |
| Phí rút | 15% |
| Thời gian chuyển | 1-24 giờ |

**Ví dụ:**
- Rút: 500.000 VNĐ
- Phí: 75.000 VNĐ
- Nhận: 425.000 VNĐ

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- HTML5 / CSS3
- Vanilla JavaScript
- Responsive Design

### Backend
- Node.js + Express
- SQLite3
- Sepay API
- VietQR API

### Deployment
- Frontend: GitHub Pages
- Backend: Heroku / Render / VPS
- Domain: chotainguyenmmo.cloud

---

## 📝 Ghi Chú

- Mật khẩu được mã hoá (bcrypt)
- JWT Token cho xác thực
- CORS enabled cho frontend
- Environment variables bảo vệ thông tin nhạy cảm

---

## 📞 Liên Hệ

- **Email**: support@chotainguyenmmo.cloud
- **Hotline**: 1900-1000-123
- **Website**: chotainguyenmmo.cloud

---

## 📄 License

MIT License - Tự do sử dụng & phát triển

---

**Phát triển bởi: HOANG GIA BAO**  
**Cập nhật lần cuối: 2026**