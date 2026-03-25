const API_BASE = '/api';
let token = localStorage.getItem('token') || '';
let loggedInUser = JSON.parse(localStorage.getItem('user') || 'null');
let menuItems = [];
let currentOrderItems = [];
let selectedBillOrder = null;

const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = new bootstrap.Toast(document.getElementById('appToast'));

const showToast = (msg, type = 'primary') => {
  const toastEl = document.getElementById('appToast');
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  document.getElementById('toastMsg').textContent = msg;
  toast.show();
};

const toggleLoading = (isLoading) => {
  loadingOverlay.classList.toggle('d-none', !isLoading);
};

const api = async (url, options = {}) => {
  toggleLoading(true);
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } finally {
    toggleLoading(false);
  }
};

const setAuthState = () => {
  const isLoggedIn = Boolean(token);
  authSection.classList.toggle('d-none', isLoggedIn);
  appSection.classList.toggle('d-none', !isLoggedIn);
};

const renderMenu = () => {
  const list = document.getElementById('menuList');
  list.innerHTML = menuItems
    .map(
      (item) => `
      <div class="col-md-4">
        <div class="card menu-card h-100 shadow-sm">
          <img src="${item.image}" class="card-img-top" alt="${item.name}" />
          <div class="card-body">
            <h5>${item.name}</h5>
            <p class="mb-1">₹${item.price.toFixed(2)}</p>
            <p class="text-muted">${item.category}</p>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-primary" onclick="addToOrder('${item._id}')">Add to Order</button>
              ${
                loggedInUser?.role === 'admin'
                  ? `<button class="btn btn-sm btn-warning" onclick='editMenuItem(${JSON.stringify(item)})'>Edit</button>
                     <button class="btn btn-sm btn-danger" onclick="deleteMenuItem('${item._id}')">Delete</button>`
                  : ''
              }
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join('');
};

const renderCurrentOrder = () => {
  const subTotal = currentOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('orderSubTotal').textContent = `Subtotal: ₹${subTotal.toFixed(2)}`;

  const container = document.getElementById('selectedItems');
  if (currentOrderItems.length === 0) {
    container.innerHTML = '<p class="text-muted">No items selected yet.</p>';
    return;
  }

  container.innerHTML = `
    <table class="table table-bordered">
      <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th><th>Action</th></tr></thead>
      <tbody>
        ${currentOrderItems
          .map(
            (item) => `
            <tr>
              <td>${item.name}</td>
              <td>₹${item.price.toFixed(2)}</td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" onclick="updateQty('${item.menuItem}', -1)">-</button>
                  <button class="btn btn-outline-secondary" disabled>${item.quantity}</button>
                  <button class="btn btn-outline-secondary" onclick="updateQty('${item.menuItem}', 1)">+</button>
                </div>
              </td>
              <td>₹${(item.price * item.quantity).toFixed(2)}</td>
              <td><button class="btn btn-sm btn-danger" onclick="removeOrderItem('${item.menuItem}')">Remove</button></td>
            </tr>
          `
          )
          .join('')}
      </tbody>
    </table>
  `;
};

const renderOrders = async () => {
  const orders = await api('/orders');
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = orders
    .map(
      (order) => `
      <tr style="cursor:pointer" onclick='previewBill(${JSON.stringify(order)})'>
        <td>${new Date(order.createdAt).toLocaleString()}</td>
        <td>${order.customerName || '-'}</td>
        <td>${order.tableNumber || '-'}</td>
        <td>₹${order.total.toFixed(2)}</td>
        <td>
          <select class="form-select form-select-sm" onchange="changeStatus('${order._id}', this.value)">
            ${['pending', 'served', 'paid']
              .map((s) => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`)
              .join('')}
          </select>
        </td>
      </tr>
    `
    )
    .join('');
};

const renderDashboard = async () => {
  const data = await api('/orders/dashboard/summary');
  document.getElementById('totalOrdersToday').textContent = data.totalOrdersToday;
  document.getElementById('totalRevenue').textContent = `₹${data.totalRevenue.toFixed(2)}`;
  document.getElementById('popularItems').innerHTML =
    data.popularItems.map((item) => `<li>${item.name} (${item.quantity})</li>`).join('') || '<li>No orders today</li>';
};

const fetchMenu = async () => {
  const search = document.getElementById('menuSearch').value;
  const category = document.getElementById('menuFilterCategory').value;
  menuItems = await api(`/menu?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
  renderMenu();
};

window.addToOrder = (id) => {
  const found = menuItems.find((item) => item._id === id);
  if (!found) return;
  const existing = currentOrderItems.find((item) => item.menuItem === id);
  if (existing) existing.quantity += 1;
  else currentOrderItems.push({ menuItem: id, name: found.name, price: found.price, quantity: 1 });
  renderCurrentOrder();
  showToast('Item added to order', 'success');
};

window.updateQty = (id, delta) => {
  const item = currentOrderItems.find((i) => i.menuItem === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) currentOrderItems = currentOrderItems.filter((i) => i.menuItem !== id);
  renderCurrentOrder();
};

window.removeOrderItem = (id) => {
  currentOrderItems = currentOrderItems.filter((item) => item.menuItem !== id);
  renderCurrentOrder();
};

window.editMenuItem = (item) => {
  document.getElementById('menuItemId').value = item._id;
  document.getElementById('menuName').value = item.name;
  document.getElementById('menuPrice').value = item.price;
  document.getElementById('menuCategory').value = item.category;
  document.getElementById('menuImage').value = item.image;
};

window.deleteMenuItem = async (id) => {
  if (!confirm('Delete this menu item?')) return;
  await api(`/menu/${id}`, { method: 'DELETE' });
  showToast('Menu item deleted', 'success');
  await fetchMenu();
};

window.changeStatus = async (id, status) => {
  await api(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  showToast('Order status updated', 'success');
  await renderDashboard();
};

window.previewBill = (order) => {
  selectedBillOrder = order;
  const billContent = document.getElementById('billContent');
  billContent.innerHTML = `
    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    <p><strong>Customer:</strong> ${order.customerName || '-'}</p>
    <p><strong>Table:</strong> ${order.tableNumber || '-'}</p>
    <table class="table table-sm table-bordered">
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>
        ${order.items
          .map(
            (item) =>
              `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price.toFixed(2)}</td><td>₹${(
                item.price * item.quantity
              ).toFixed(2)}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>
    <p><strong>Subtotal:</strong> ₹${order.subtotal.toFixed(2)}</p>
    <p><strong>GST (${order.gstRate}%):</strong> ₹${order.gstAmount.toFixed(2)}</p>
    <h5><strong>Grand Total:</strong> ₹${order.total.toFixed(2)}</h5>
  `;
  document.getElementById('printBillBtn').disabled = false;
  document.getElementById('downloadPdfBtn').disabled = false;
  showToast('Bill preview updated', 'info');
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    token = data.token;
    loggedInUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setAuthState();
    await bootApp();
    showToast(`Welcome ${loggedInUser.name}`, 'success');
  } catch (error) {
    showToast(error.message, 'danger');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  token = '';
  loggedInUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentOrderItems = [];
  setAuthState();
  showToast('Logged out successfully', 'secondary');
});

document.getElementById('menuForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (loggedInUser?.role !== 'admin') return showToast('Only admin can manage menu', 'warning');

  const payload = {
    name: document.getElementById('menuName').value,
    price: Number(document.getElementById('menuPrice').value),
    category: document.getElementById('menuCategory').value,
    image: document.getElementById('menuImage').value || undefined
  };

  const id = document.getElementById('menuItemId').value;
  if (id) {
    await api(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Menu item updated', 'success');
  } else {
    await api('/menu', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Menu item created', 'success');
  }

  e.target.reset();
  document.getElementById('menuItemId').value = '';
  await fetchMenu();
});

document.getElementById('menuFilterBtn').addEventListener('click', fetchMenu);
document.getElementById('menuSearch').addEventListener('input', fetchMenu);

document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (currentOrderItems.length === 0) return showToast('Add menu items before placing order', 'warning');

  const payload = {
    customerName: document.getElementById('customerName').value,
    tableNumber: document.getElementById('tableNumber').value,
    gstRate: Number(document.getElementById('gstRate').value),
    items: currentOrderItems.map((item) => ({ menuItem: item.menuItem, quantity: item.quantity }))
  };

  await api('/orders', { method: 'POST', body: JSON.stringify(payload) });
  showToast('Order created successfully', 'success');

  currentOrderItems = [];
  e.target.reset();
  renderCurrentOrder();
  await renderOrders();
  await renderDashboard();
});

document.getElementById('printBillBtn').addEventListener('click', () => {
  window.print();
});

document.getElementById('downloadPdfBtn').addEventListener('click', () => {
  if (!selectedBillOrder) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Restaurant Bill', 20, 20);
  doc.setFontSize(11);
  doc.text(`Date: ${new Date(selectedBillOrder.createdAt).toLocaleString()}`, 20, 30);
  doc.text(`Customer: ${selectedBillOrder.customerName || '-'}`, 20, 38);
  doc.text(`Table: ${selectedBillOrder.tableNumber || '-'}`, 20, 46);

  let y = 58;
  selectedBillOrder.items.forEach((item, idx) => {
    doc.text(
      `${idx + 1}. ${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`,
      20,
      y
    );
    y += 8;
  });

  y += 4;
  doc.text(`Subtotal: ₹${selectedBillOrder.subtotal.toFixed(2)}`, 20, y);
  y += 8;
  doc.text(`GST (${selectedBillOrder.gstRate}%): ₹${selectedBillOrder.gstAmount.toFixed(2)}`, 20, y);
  y += 8;
  doc.text(`Total: ₹${selectedBillOrder.total.toFixed(2)}`, 20, y);
  doc.save(`bill-${selectedBillOrder._id}.pdf`);
});

document.getElementById('darkModeBtn').addEventListener('click', () => {
  const html = document.documentElement;
  html.setAttribute('data-bs-theme', html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
});

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((x) => x.classList.remove('active'));
    btn.classList.add('active');

    ['dashboardSection', 'menuSection', 'ordersSection', 'billingSection'].forEach((id) => {
      document.getElementById(id).classList.add('d-none');
    });
    document.getElementById(btn.dataset.section).classList.remove('d-none');
  });
});

const bootApp = async () => {
  renderCurrentOrder();
  await fetchMenu();
  await renderOrders();
  await renderDashboard();
};

(async function init() {
  setAuthState();
  if (token) {
    try {
      await api('/auth/profile');
      await bootApp();
    } catch {
      token = '';
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState();
    }
  }
})();
