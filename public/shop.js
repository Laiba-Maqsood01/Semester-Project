document.addEventListener('DOMContentLoaded', () => {
  const category = document.body.dataset.category;
  fetchProducts(category);
});

async function fetchProducts(category) {
  const res = await fetch(`/products?category=${category}`);
  const products = await res.json();

  const container = document.getElementById('productContainer');
  container.innerHTML = '';

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      <img src="/uploads/${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p>Price: Rs ${product.price}</p>
      <button onclick="addToCart('${product._id}', '${product.title}', ${product.price}, '${product.image}', '${product.category}')" ${product.stock === 0 ? 'disabled' : ''}> ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'} </button>
    `;

    container.appendChild(card);
  });
}


//Add to cart
async function addToCart(id, title, price, image, category) {
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId: id,
        title,
        price,
        image,
        category: category
      }),
      credentials: 'include'
    });

    if (response.ok) {
      alert('Product added to cart!');
    } else {
      // alert('Failed to add product to cart.');
      alert('Please logIn before adding products to cart');
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    alert('Something went wrong. Try again.');
  }
}

