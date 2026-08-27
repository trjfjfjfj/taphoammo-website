// DATA MANAGEMENT
let users = {};
let currentUser = null;
let cart = [];
let walletBalance = {};
let transactionHistory = {};

// LOGIN HANDLING
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;

    // Simulate login (in real app, use backend authentication)
    currentUser = email;
    if (!users[email]) {
        users[email] = { password, created: new Date() };
        walletBalance[email] = 0;
        transactionHistory[email] = [];
    }

    alert('✅ Đ��ng nhập thành công!');
    updateBalance();
    closeLoginModal();
    event.target.reset();
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

    if (walletBalance[currentUser] < total) {
        alert('❌ Số dư không đủ! Vui lòng nạp tiền.');
        return;
    }

    walletBalance[currentUser] -= total;
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
        document.getElementById('balance').textContent = (walletBalance[currentUser] || 0).toLocaleString('vi-VN') + ' VNĐ';
    }
}

function showDepositModal() {
    if (!currentUser) {
        alert('⚠️ Vui lòng đăng nhập!');
        return;
    }
    document.getElementById('depositModal').style.display = 'block';
}

function closeDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
}

function handleDeposit(event) {
    event.preventDefault();
    const amount = parseInt(document.getElementById('depositAmount').value);
    const method = document.getElementById('paymentMethod').value;

    if (method === 'Chọn phương thức thanh toán') {
        alert('⚠️ Vui lòng chọn phương thức thanh toán!');
        return;
    }

    walletBalance[currentUser] += amount;
    transactionHistory[currentUser].push({
        type: 'nạp tiền',
        amount: amount,
        method: method,
        date: new Date().toLocaleString('vi-VN')
    });

    alert(`✅ Nạp tiền thành công! +${amount.toLocaleString('vi-VN')} VNĐ`);
    updateBalance();
    closeDepositModal();
    event.target.reset();
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

function handleWithdraw(event) {
    event.preventDefault();
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const bank = document.getElementById('bankAccount').value;

    if (bank === 'Chọn tài khoản ngân hàng') {
        alert('⚠️ Vui lòng chọn tài khoản ngân hàng!');
        return;
    }

    if (walletBalance[currentUser] < amount) {
        alert('❌ Số dư không đủ!');
        return;
    }

    walletBalance[currentUser] -= amount;
    transactionHistory[currentUser].push({
        type: 'rút tiền',
        amount: amount,
        bank: bank,
        date: new Date().toLocaleString('vi-VN')
    });

    alert(`✅ Rút tiền thành công! -${amount.toLocaleString('vi-VN')} VNĐ sẽ chuyển vào tài khoản ${bank} trong 1-24 giờ`);
    updateBalance();
    closeWithdrawModal();
    event.target.reset();
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
            if (transaction.items) details += `<br>Sản phẩm: ${transaction.items}`;
            if (transaction.method) details += `<br>Phương thức: ${transaction.method}`;
            if (transaction.bank) details += `<br>Ngân hàng: ${transaction.bank}`;
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
    let modal = document.getElementById('loginModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }

    modal = document.getElementById('depositModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }

    modal = document.getElementById('withdrawModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }

    modal = document.getElementById('historyModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// INITIAL LOAD
window.addEventListener('load', () => {
    updateCart();
});