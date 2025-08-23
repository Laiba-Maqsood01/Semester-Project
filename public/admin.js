function logout() {
  fetch('/admin/logout').then(() => window.location.href = '/index.html');
}

const homeBtn = document.getElementById('homeBtn');
const manageBtn = document.getElementById('manageBtn');
const homeSection = document.getElementById('homeSection');
const manageSection = document.getElementById('manageSection');
const ordersBtn = document.getElementById('ordersBtn');
const ordersSection = document.getElementById('orderSection');
const feedbackBtn = document.getElementById('feedbackBtn');
const feedbackSection = document.getElementById('feedbackSection');


homeBtn.addEventListener('click', () => {
  document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
  homeSection.style.display = 'block';
});

manageBtn.addEventListener('click', () => {
  document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
  manageSection.style.display = 'block';
});

ordersBtn.addEventListener('click', () => {
  document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
  ordersSection.style.display = 'block';
  loadOrders();
});

feedbackBtn.addEventListener('click', () => {
  document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
  feedbackSection.style.display = 'block';
  loadFeedback();
});

//Manage Products
let currentCategory = "";

document.getElementById("categorySelect").addEventListener("change", (e) => {
  currentCategory = e.target.value;
  resetForm();
  loadProducts(currentCategory);
});
//IF anything does not work check it
document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentCategory) return alert("Please select a category first.");

  const form = e.target;
  const formData = new FormData(form);
  formData.append("category", currentCategory);

  const productId = form.productId.value;
  let url = "/products";
  let method = "POST";

  if (productId) {
    url = `/products/${productId}`;
    method = "PUT";
  }

  const res = await fetch(url, {
    method,
    body: formData,
  });

  const data = await res.json();
  if (data.success) {
    resetForm();
    loadProducts(currentCategory);
  }
});

async function loadProducts(category) {
  const res = await fetch(`/products?category=${category}`);
  const products = await res.json();
  const tbody = document.querySelector("#productTable tbody");
  tbody.innerHTML = "";

  products.forEach((product) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><img src="/uploads/${product.image}" width="50"></td>
      <td>${product.title}</td>
      <td>${product.price}</td>
      <td>${product.stock}</td>
      <td>${product.category}</td>
      <td>
        <button onclick="editProduct('${product._id}', '${product.title}', ${product.price}, ${product.stock}, '${product.category}')">Edit</button>
        <button onclick="deleteProduct('${product._id}', '${product.category}')">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function editProduct(id, title, price, stock, category) {
  const form = document.getElementById("productForm");
  form.productId.value = id;
  form.title.value = title;
  form.price.value = price;
  form.stock.value = stock; 
  form.image.required = false;

  document.getElementById("submitButton").textContent = "Save Changes";
}


function resetForm() {
  const form = document.getElementById("productForm");
  form.reset();
  form.productId.value = "";
  document.getElementById("submitButton").textContent = "Add Product";
}

async function deleteProduct(id, category) {
  if (!confirm("Delete this product?")) return;

  await fetch(`/products/${id}?category=${category}`, {
    method: "DELETE",
  });

  loadProducts(currentCategory);
}


//View All Orders 
document.addEventListener('DOMContentLoaded', loadOrders);

async function loadOrders() {
  const container = document.getElementById('ordersList');
  container.innerHTML = '';

  const res = await fetch('/api/orders');
  const orders = await res.json();

  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const summary = document.createElement('div');
    summary.className = 'order-summary';
    summary.setAttribute('data-id', order._id); //we have used it to immediately change the status at summary also
    summary.innerHTML = `
      <div>
      <p>OrderID: ${order._id}</p> 
        <p>Name: ${order.name} </p>
        <small>Status: <span style="color: #ffe;">${order.status}</span></small>
      </div>
      <div class="toggle-icon">+</div>
    `;

    const details = document.createElement('div');
    details.className = 'order-details';
    details.innerHTML = `
      <p><strong>Contact:</strong> ${order.contact}</p>
      <p><strong>Address:</strong> ${order.address}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      <p><strong>Total:</strong> Rs. ${order.total}</p>
      <div class="order-items">
        <strong>Items:</strong>
        <ul>
          ${order.items.map(i => `<li>${i.title} (x${i.quantity}) - Rs. ${i.price}</li>`).join('')}
        </ul>
      </div>
      <label><strong>Update Status:</strong></label>
 
      <select class="status-dropdown" onchange="updateOrderStatus('${order._id}', this.value)">
        <option ${order.status === 'pending' ? 'selected' : ''}>pending</option>
        <option ${order.status === 'shipped' ? 'selected' : ''}>shipped</option>
        <option ${order.status === 'delivered' ? 'selected' : ''}>delivered</option>
        <option ${order.status === 'cancelled' ? 'selected' : ''}>cancelled</option>
      </select>

    `;

    summary.addEventListener('click', () => {
      details.classList.toggle('open');
      summary.classList.toggle('active');
    });

    card.appendChild(summary);
    card.appendChild(details);
    container.appendChild(card);
  });
}

function updateOrderStatus(id, newStatus) {
  fetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  }).then(res => {
    if (!res.ok) {
      alert('Failed to update order status');
    } else {
      //Update the status in the summary DOM
      const statusSpan = document.querySelector(`.order-summary[data-id="${id}"] span`);
      if (statusSpan) {
        statusSpan.textContent = newStatus;
      }
    }
  });
}

// load all feedbacks
async function loadFeedback() {
  const container = document.getElementById('feedbackContainer');
  container.innerHTML = '';

  const res = await fetch('/api/feedback');
  const feedbacks = await res.json();

  feedbacks.forEach(fb => {
    const card = document.createElement('div');
    card.className = 'feedback-card';
    card.innerHTML = `
      <h4>${fb.subject}</h4>
      <p><strong>Name:</strong> ${fb.name}</p>
      <p><strong>Email:</strong> ${fb.email}</p>
      <p><strong>Message:</strong> ${fb.message}</p>
    `;
    container.appendChild(card);
  });
}
;



