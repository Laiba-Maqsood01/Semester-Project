document.addEventListener('DOMContentLoaded', async () => {
  const cartTableBody = document.querySelector('#cartTable tbody');
  const subtotalEl = document.getElementById('subtotal');
  const checkoutForm = document.getElementById('finalOrderForm');
  const proceedBtn = document.getElementById('proceedToCheckout');

  let cartItems = [];

  async function loadCart() {
    const res = await fetch('/api/cart/items');
    cartItems = await res.json();
    renderTable();
    updateSubtotal();
  }

  function renderTable() {
    cartTableBody.innerHTML = '';

    cartItems.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox" class="select-item" data-id="${item._id}"  data-category="${item.category}" checked></td>
        <td><img src="/uploads/${item.image}" alt="${item.title}" width="60"></td>
        <td>${item.title}</td>
        <td>${item.price}</td>
        <td>
          <div class="quantity-controls">
            <button class="qty-btn" data-action="decrease" data-id="${item._id}">−</button>
            <span class="qty-display" data-id="${item._id}">${item.quantity}</span>
            <button class="qty-btn" data-action="increase" data-id="${item._id}">+</button>
          </div>
        </td>
        <td class="row-total" data-id="${item._id}">${item.price * item.quantity}</td>
        <td><button class="remove-btn" data-id="${item._id}">Remove</button></td>
      `;
      cartTableBody.appendChild(row);
    });
  }

  function updateSubtotal() {
    let total = 0;
    document.querySelectorAll('.select-item').forEach(checkbox => {
      if (checkbox.checked) {
        const item = cartItems.find(i => i._id === checkbox.dataset.id);
        if (item) total += item.price * item.quantity;
      }
    });
    subtotalEl.textContent = `Subtotal: ${total}`;
  }

  // Event Delegation for Quantity & Remove
  cartTableBody.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    const item = cartItems.find(i => i._id === id);

    if (!item) return;

    // Quantity Update
    if (target.classList.contains('qty-btn')) {
      const action = target.dataset.action;
      if (action === 'increase') item.quantity++;
      if (action === 'decrease' && item.quantity > 1) item.quantity--;

      // Update in DB
      await fetch(`/api/cart/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity })
      });

      // Update DOM directly (no reload)
      const qtyDisplay = document.querySelector(`.qty-display[data-id="${id}"]`);
      const rowTotal = document.querySelector(`.row-total[data-id="${id}"]`);
      if (qtyDisplay) qtyDisplay.textContent = item.quantity;
      if (rowTotal) rowTotal.textContent = item.price * item.quantity;

      updateSubtotal(); // Recalculate subtotal
    }

    // Remove Item
    if (target.classList.contains('remove-btn')) {
      const res = await fetch(`/api/cart/remove/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cartItems = cartItems.filter(i => i._id !== id); // Update local array
        renderTable(); // Rerender table
        updateSubtotal();
      }
    }
  });

  // Checkbox Subtotal Trigger
  cartTableBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('select-item')) updateSubtotal();
  });

  // Show Checkout Form
  proceedBtn.addEventListener('click', () => {
    checkoutForm.style.display = 'block';
    window.scrollTo({ top: checkoutForm.offsetTop, behavior: 'smooth' });
  });

  // Submit Final Order
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = checkoutForm.querySelector('#name').value;
    const contact = checkoutForm.querySelector('#contact').value;
    const address = checkoutForm.querySelector('#address').value;
    //add this also
    const email = checkoutForm.querySelector('#checkoutEmail').value;
    const paymentMethod = checkoutForm.querySelector('#payment').value;

    const selectedItems = Array.from(document.querySelectorAll('.select-item'))
      .filter(cb => cb.checked)
      .map(cb => {
        const item = cartItems.find(i => i._id.toString()  === cb.dataset.id);
        return {
          id: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category
        };
      })


    if (selectedItems.length === 0) {
      alert('Please select at least one item to order.');
      return;
    }
    if(!paymentMethod){
      alert('Please select a payment method.');
      return;
    }

    const res = await fetch('/place-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, contact, address, email, paymentMethod, items: selectedItems })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Order placed successfully!');
      checkoutForm.reset();
      checkoutForm.style.display = 'none';
      await loadCart(); // Reload cart
    } else {
      alert(data.message || 'Error placing order.');
    }
  });

  // Init
  loadCart();
    // QR Code Logic
const paymentSelect = document.getElementById('payment');
const qrContainer = document.getElementById('qrContainer');
const qrImage = document.getElementById('qrCodeImage');

paymentSelect.addEventListener('change', () => {
  const method = paymentSelect.value;
  if (method === 'JazzCash') {
    qrImage.src = 'img/scan-qr-new.webp'; // Adjust path if needed
    qrContainer.style.display = 'block';
  } else if (method === 'EasyPaisa') {
    qrImage.src = 'img/scan-qr-new.webp'; // Adjust path if needed
    qrContainer.style.display = 'block';
  } else {
    qrContainer.style.display = 'none';
  }
});

});
