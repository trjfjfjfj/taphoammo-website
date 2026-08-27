# TapHoaMmo Backend

## 📋 Cài đặt

```bash
npm install
npm start
```

## 🔑 Biến Môi Trường

Tạo file `.env`:
```
PORT=5000
MERCHANT_ID=SP-TEST-HG63994A
SECRET_KEY=spsk_test_7B1GRUqbRc64zTc4Fw2qpHxBb15dARaM
```

## 📡 API Endpoints

### Đăng ký
```
POST /api/auth/register
{
  "name": "Tên người dùng",
  "email": "email@example.com",
  "password": "password",
  "isSeller": false,
  "shopName": "Tên cửa hàng (nếu là seller)"
}
```

### Đăng nhập
```
POST /api/auth/login
{
  "email": "email@example.com",
  "password": "password"
}
```

### Lấy số dư ví
```
GET /api/wallet/balance
Header: x-user-email: email@example.com
```

### Tạo checkout Sepay
```
POST /api/deposit/create-checkout
Header: x-user-email: email@example.com
{
  "amount": 100000
}
```

### Callback Sepay (tự động từ Sepay)
```
POST /api/deposit/callback
(Sepay sẽ gửi khi thanh toán)
```

### Rút tiền
```
POST /api/withdraw
Header: x-user-email: email@example.com
{
  "amount": 500000,
  "bankAccount": "Vietcombank"
}
```

### Lịch sử giao dịch
```
GET /api/transactions
Header: x-user-email: email@example.com
```

## 🌐 Tích hợp Frontend

Cập nhật `script.js` để gọi các endpoint này.

## 📝 Ghi chú

- Hiện tại dùng database giả lập (memory), sau nâng cấp lên MongoDB/MySQL
- Mật khẩu được mã hóa base64 (tạm), sau dùng bcrypt
- Sepay callback cần setup trên https://my.sepay.vn/