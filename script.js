// DATA MANAGEMENT
let users = {};
let currentUser = null;
let cart = [];
let userWallets = {};
let userProducts = {};
let transactionHistory = {};

// CONSTANTS
const MIN_WITHDRAW = 200000;
const MAX_WITHDRAW = 2000000;
const WITHDRAW_FEE_PERCENT = 15;

// BANK INFO
const BANK_CONFIG = {
  bank: 'TPBank',
  account: '10004525267',
  accountName: 'HOANG GIA BAO',
  accountNameENC: 'HOANG%20GIA%20BAO',
  storeName: 'CTY%20TNHH%20TRUYEN%20THONG%20MEDIA%20ABNMXH'
};

// INITIALIZE
function initUser(email) {
    if (!userWallets[email]) {
        userWallets[email] = { depositBalance: 0, sellBalance: 0 };
        userProducts[email] = [];
        transactionHistory[email] = [];
    }
}

// UPDATE UI AFTER LOGIN/LOGOUT
function updateUIAfterAuth() {
    if (currentUser) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('userInfo').style.display = 'inline-block';
        document.getElementById('userName').textContent = currentUser.split('@')[0];
        
        if (users[currentUser].isSeller) {
            document.getElementById('sellProductBtn').style.display = 'inline-block';
            updateMyProducts();
        }
    } else {
        document.getElementById('loginBtn').style.display = 'inline-block';
        document.getElementById('registerBtn').style.display = 'inline-block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('sellProductBtn').style.display = 'none';
    }
}

// MODAL SWITCHING
function switchToRegister() {
    closeLoginModal();
    showRegisterModal();
}

function switchToLogin() {
    closeRegisterModal();
    showLoginModal();
}

// LOGIN HANDLING
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (users[email] && users[email].password === password) {
        currentUser = email;
        initUser(email);
        alert('✅ Đăng nhập thành công!');
        updateBalance();
        updateUIAfterAuth();
        closeLoginModal();
    } else {
        alert('❌ Email hoặc mật khẩu không chính xác!');
    }
}

// REGISTER HANDLING
function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirm').value = '';
    document.getElementById('isSeller').checked = false;
    document.getElementById('sellerInfo').style.display = 'none';
}

function toggleSellerInfo() {
    const isSeller = document.getElementById('isSeller').checked;
    document.getElementById('sellerInfo').style.display = isSeller ? 'block' : 'none';
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;

    if (password !== confirm) {
        alert('❌ Mật khẩu không khớp!');
        return;
    }

    if (users[email]) {
        alert('❌ Email đã được đăng ký!');
        return;
    }

    users[email] = {
        name: name,
        password: password,
        isSeller: document.getElementById('isSeller').checked,
        shopName: document.getElementById('shopName').value || name,
        shopDesc: document.getElementById('shopDesc').value || 'Cửa hàng'
    };

    initUser(email);
    alert('✅ Đăng ký thành công! Vui lòng đăng nhập.');
    closeRegisterModal();
}

function handleLogout() {
    if (confirm('Bạn chắc chắn muốn đăng xuất?')) {
        currentUser = null;
        cart = [];
        updateUIAfterAuth();
        updateCart();
        alert('✅ Đã đăng xuất!');
    }
}

// CART MANAGEMENT
function addToCart(productName, price) {
    if (!currentUser) {
        alert('⚠️ Vui lòng đăng nhập trước!');
        showLoginModal();
        return;
    }

    cart.push({ name: productName, price });
    alert(`✅ Đã thêm "${productName}" vào giỏ hàng!`);
    updateCart();
}

function updateCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = '';

    let total = 0;
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <span>${item.name} - ${item.price.toLocaleString('vi-VN')} VNĐ</span>
            <button onclick="removeFromCart(${index})" style="background: var(--danger); color: white; border: none; padding: 0.5rem 1rem; border-radius: 3px; cursor: pointer;">Xóa</button>
        `;
        cartItemsDiv.appendChild(cartItem);
        total += item.price;
    });

    document.getElementById('cart-total').textContent = total.toLocaleString('vi-VN') + ' VNĐ';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function checkout() {
    if (!currentUser) {
        alert('⚠️ Vui lòng đăng nhập!');
        return;
    }

    if (cart.length === 0) {
        alert('⚠️ Giỏ hàng trống!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const wallet = userWallets[currentUser];

    if (wallet.depositBalance < total) {
        alert('❌ Số dư ví nạp không đủ! Vui lòng nạp thêm tiền.');
        return;
    }

    wallet.depositBalance -= total;
    transactionHistory[currentUser].push({
        type: 'mua hàng',
        amount: total,
        date: new Date().toLocaleString('vi-VN'),
        items: cart.map(item => item.name).join(', ')
    });

    alert('✅ Thanh toán thành công!');
    cart = [];
    updateCart();
    updateBalance();
}

// WALLET MANAGEMENT
function updateBalance() {
    if (currentUser) {
        const wallet = userWallets[currentUser];
        document.getElementById('depositBalance').textContent = (wallet.depositBalance || 0).toLocaleString('vi-VN') + ' VNĐ';
        document.getElementById('sellBalance').textContent = (wallet.sellBalance || 0).toLocaleString('vi-VN') + ' VNĐ';
    }
}

function showDepositModal() {
    if (!currentUser) {
        alert('⚠️ Vui lòng đăng nhập!');
        return;
    }
    document.getElementById('depositModal').style.display = 'block';
    document.getElementById('depositStep1').style.display = 'block';
    document.getElementById('depositStep2').style.display = 'none';
}

function closeDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
}

function handleDepositAmount(event) {
    event.preventDefault();
    const amount = parseInt(document.getElementById('depositAmount').value);
    const method = document.getElementById('paymentMethod').value;

    if (method === 'Chọn phương thức thanh toán') {
        alert('⚠️ Vui lòng chọn phương thức thanh toán!');
        return;
    }

    if (method === 'bank') {
        // Hiển thị QR code
        showQRCode(amount);
    } else {
        alert('🚀 Sắp hỗ trợ ' + (method === 'momo' ? 'MoMo' : 'Thẻ Cào') + '!');
    }
}

// GENERATE QR CODE
function showQRCode(amount) {
    const qrUrl = `https://vietqr.app/img?bank=${BANK_CONFIG.bank}&acc=${BANK_CONFIG.account}&template=&showinfo=true&fullacc=true&holder=${BANK_CONFIG.accountNameENC}&store=${BANK_CONFIG.storeName}&amount=${amount}`;
    
    document.getElementById('qrCode').src = qrUrl;
    document.getElementById('bankInfo').innerHTML = `
        <strong>🏦 Thông tin chuyển khoản:</strong><br>
        Ngân hàng: ${BANK_CONFIG.bank}<br>
        Số tài khoản: ${BANK_CONFIG.account}<br>
        Chủ tài khoản: ${BANK_CONFIG.accountName}<br>
        <br>
        <strong style="color: var(--primary);">Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ</strong><br>
        <br>
        💬 Nội dung: Tên email hoặc SĐT của bạn
    `;
    
    document.getElementById('depositStep1').style.display = 'none';
    document.getElementById('depositStep2').style.display = 'block';

    // Auto nhận tiền sau 3 giây
    setTimeout(() => {
        autoReceiveDeposit(amount, 'bank');
    }, 3000);
}

function goBackDepositStep1() {
    document.getElementById('depositStep1').style.display = 'block';
    document.getElementById('depositStep2').style.display = 'none';
}

// AUTO NHẬN TIỀN
function autoReceiveDeposit(amount, method) {
    userWallets[currentUser].depositBalance += amount;
    transactionHistory[currentUser].push({
        type: 'nạp tiền',
        amount: amount,
        method: method === 'bank' ? 'Sepay/Chuyển khoản' : method,
        status: 'thành công',
        date: new Date().toLocaleString('vi-VN')
    });

    alert(`✅ Nạp tiền thành công ngay lập tức!\n+${amount.toLocaleString('vi-VN')} VNĐ\n\nTiền đã được cộng vào ví nạp của bạn!`);
    updateBalance();
    closeDepositModal();
}

function showWithdrawModal() {
    if (!currentUser) {
        alert('⚠️ Vui lòng đăng nhập!');
        return;
    }
    document.getElementById('withdrawModal').style.display = 'block';
}

function closeWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'none';
}

// UPDATE WITHDRAW FEE DISPLAY
document.addEventListener('DOMContentLoaded', function() {
    const withdrawInput = document.getElementById('withdrawAmount');
    if (withdrawInput) {
        withdrawInput.addEventListener('input', function() {
            const amount = parseInt(this.value) || 0;
            const fee = Math.floor(amount * (WITHDRAW_FEE_PERCENT / 100));
            const receive = amount - fee;
            
            let message = `Min: ${MIN_WITHDRAW.toLocaleString('vi-VN')} VNĐ | Max: ${MAX_WITHDRAW.toLocaleString('vi-VN')} VNĐ`;
            if (amount > 0) {
                message += `<br>Phí: ${fee.toLocaleString('vi-VN')} VNĐ | Nhận: ${receive.toLocaleString('vi-VN')} VNĐ`;
            }
            document.getElementById('withdrawFee').innerHTML = message;
        });
    }
});

function handleWithdraw(event) {
    event.preventDefault();
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const bank = document.getElementById('bankAccount').value;

    if (amount < MIN_WITHDRAW) {
        alert(`❌ Số tiền rút tối thiểu là ${MIN_WITHDRAW.toLocaleString('vi-VN')} VNĐ!`);
        return;
    }

    if (amount > MAX_WITHDRAW) {
        alert(`❌ Số tiền rút tối đa là ${MAX_WITHDRAW.toLocaleString('vi-VN')} VNĐ!`);
        return;
    }

    if (bank === 'Chọn tài khoản ngân hàng') {
        alert('⚠️ Vui lòng chọn tài khoản ngân hàng!');
        return;
    }

    const wallet = userWallets[currentUser];
    if (wallet.sellBalance < amount) {
        alert('❌ Số dư ví bán không đủ!');
        return;
    }

    const fee = Math.floor(amount * (WITHDRAW_FEE_PERCENT / 100));
    const receive = amount - fee;

    wallet.sellBalance -= amount;
    transactionHistory[currentUser].push({
        type: 'rút tiền',
        amount: amount,
        fee: fee,
        receive: receive,
        bank: bank,
        date: new Date().toLocaleString('vi-VN')
    });

    alert(`✅ Rút tiền thành công!\n═══════════════════════════\nSố tiền: ${amount.toLocaleString('vi-VN')} VNĐ\nPhí (15%): ${fee.toLocaleString('vi-VN')} VNĐ\nBạn nhận: ${receive.toLocaleString('vi-VN')} VNĐ\n════════════════════════��══\nNgân hàng: ${bank}\nSẽ chuyển trong 1-24 giờ`);
    updateBalance();
    closeWithdrawModal();
    event.target.reset();
}

// SELL PRODUCT MANAGEMENT
function showSellModal() {
    if (!currentUser) {
        alert('⚠️ Vui lòng đăng nhập!');
        return;
    }
    if (!users[currentUser].isSeller) {
        alert('❌ Bạn chưa đăng ký làm người bán!');
        return;
    }
    document.getElementById('sellModal').style.display = 'block';
}

function closeSellModal() {
    document.getElementById('sellModal').style.display = 'none';
}

function handleSellProduct(event) {
    event.preventDefault();
    const name = document.getElementById('productName').value;
    const price = parseInt(document.getElementById('productPrice').value);
    const desc = document.getElementById('productDesc').value;

    userProducts[currentUser].push({
        name: name,
        price: price,
        desc: desc,
        id: Date.now()
    });

    alert('✅ Sản phẩm đã được đăng bán!');
    closeSellModal();
    event.target.reset();
    updateMyProducts();
}

function updateMyProducts() {
    if (!currentUser || !users[currentUser].isSeller) return;
    
    const productsDiv = document.getElementById('my-products');
    const products = userProducts[currentUser] || [];
    
    if (products.length === 0) {
        productsDiv.innerHTML = '<p style="text-align: center; color: #999;">Chưa có sản phẩm nào</p>';
        return;
    }

    productsDiv.innerHTML = '';
    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <div>
                <h4>${product.name}</h4>
                <p>${product.desc}</p>
                <strong>${product.price.toLocaleString('vi-VN')} VNĐ</strong>
            </div>
            <button onclick="simulateSale(${product.id})" class="btn-primary">Bán được</button>
        `;
        productsDiv.appendChild(item);
    });
}

function simulateSale(productId) {
    const products = userProducts[currentUser] || [];
    const product = products.find(p => p.id === productId);
    
    if (product) {
        userWallets[currentUser].sellBalance += product.price;
        transactionHistory[currentUser].push({
            type: 'bán hàng',
            amount: product.price,
            productName: product.name,
            date: new Date().toLocaleString('vi-VN')
        });
        
        alert(`✅ Bán được "${product.name}"\n+${product.price.toLocaleString('vi-VN')} VNĐ\n\nTiền đã được thêm vào ví bán!`);
        updateBalance();
        updateMyProducts();
    }
}

function showHistoryModal() {
    if (!currentUser) {
        alert('⚠️ Vui lòng đăng nhập!');
        return;
    }

    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    const history = transactionHistory[currentUser] || [];
    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #999;">Chưa có giao dịch nào</p>';
    } else {
        history.reverse().forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'history-item';
            let details = `${transaction.type.toUpperCase()} - ${transaction.amount.toLocaleString('vi-VN')} VNĐ`;
            
            if (transaction.status) details += `<br>Trạng thái: ${transaction.status}`;
            if (transaction.items) details += `<br>Sản phẩm: ${transaction.items}`;
            if (transaction.method) details += `<br>Phương thức: ${transaction.method}`;
            if (transaction.bank) details += `<br>Ngân hàng: ${transaction.bank}`;
            if (transaction.fee) details += `<br>Phí: ${transaction.fee.toLocaleString('vi-VN')} VNĐ`;
            if (transaction.receive) details += `<br>Nhận: ${transaction.receive.toLocaleString('vi-VN')} VNĐ`;
            if (transaction.productName) details += `<br>Sản phẩm: ${transaction.productName}`;
            
            item.innerHTML = `<strong>${transaction.date}</strong><br>${details}`;
            historyList.appendChild(item);
        });
    }

    document.getElementById('historyModal').style.display = 'block';
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

// CLOSE MODAL WHEN CLICK OUTSIDE
window.onclick = function(event) {
    const modals = ['loginModal', 'registerModal', 'depositModal', 'withdrawModal', 'sellModal', 'historyModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}

// INITIAL LOAD
window.addEventListener('load', () => {
    updateCart();
    updateUIAfterAuth();
});