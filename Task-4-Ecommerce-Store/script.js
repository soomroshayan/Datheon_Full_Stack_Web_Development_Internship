const API_URL = "https://fakestoreapi.com/products";
const TAX_RATE = 0.08; // 8%
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 10;

// Application State
const state = {
  products: [],
  selectedCategory: "all",
  searchQuery: "",
  cart: JSON.parse(localStorage.getItem("datheon_cart") || "[]")
};

// DOM Elements
const productGridEl = document.getElementById("productGrid");
const statusBoxEl = document.getElementById("statusBox");
const categoryFiltersEl = document.getElementById("categoryFilters");
const searchInputEl = document.getElementById("searchInput");

const cartBadgeEl = document.getElementById("cartBadge");
const openCartBtnEl = document.getElementById("openCartBtn");
const closeCartBtnEl = document.getElementById("closeCartBtn");
const cartDrawerEl = document.getElementById("cartDrawer");
const cartItemsEl = document.getElementById("cartItems");
const backdropEl = document.getElementById("backdrop");

const subtotalValEl = document.getElementById("subtotalVal");
const taxValEl = document.getElementById("taxVal");
const shippingValEl = document.getElementById("shippingVal");
const totalValEl = document.getElementById("totalVal");
const checkoutBtnEl = document.getElementById("checkoutBtn");

const checkoutModalEl = document.getElementById("checkoutModal");
const closeModalBtnEl = document.getElementById("closeModalBtn");
const checkoutFormEl = document.getElementById("checkoutForm");
const modalTotalValEl = document.getElementById("modalTotalVal");
const orderConfirmationEl = document.getElementById("orderConfirmation");
const confirmationMsgEl = document.getElementById("confirmationMsg");
const doneOrderBtnEl = document.getElementById("doneOrderBtn");

// Fetch Products
async function fetchProducts() {
  try {
    statusBoxEl.textContent = "Loading product catalog...";
    statusBoxEl.classList.remove("hidden");

    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error("Failed to load products from FakeStoreAPI.");
    }

    state.products = await res.json();
    statusBoxEl.classList.add("hidden");
    renderProducts();
  } catch (err) {
    statusBoxEl.textContent = err.message || "Error loading catalog.";
  }
}

// Filter & Render Catalog
function getFilteredProducts() {
  return state.products.filter((item) => {
    const matchesCategory =
      state.selectedCategory === "all" || item.category === state.selectedCategory;
    const matchesSearch = item.title
      .toLowerCase()
      .includes(state.searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const filtered = getFilteredProducts();

  if (filtered.length === 0) {
    productGridEl.innerHTML = "";
    statusBoxEl.textContent = "No matching products found.";
    statusBoxEl.classList.remove("hidden");
    return;
  }

  statusBoxEl.classList.add("hidden");
  productGridEl.innerHTML = filtered
    .map(
      (product) => `
      <article class="product-card">
        <div>
          <div class="product-top">
            <span class="category-badge">${product.category}</span>
            <span class="rating-text">★ ${product.rating?.rate ?? "4.5"} (${product.rating?.count ?? 0})</span>
          </div>
          <div class="product-img-wrap">
            <img src="${product.image}" alt="${product.title}" loading="lazy" />
          </div>
          <h2 class="product-title" title="${product.title}">${product.title}</h2>
        </div>

        <div class="product-footer">
          <span class="product-price">$${Number(product.price).toFixed(2)}</span>
          <button class="add-btn" type="button" onclick="addToCart(${product.id})">
            Add to Cart
          </button>
        </div>
      </article>
    `
    )
    .join("");
}

// Cart State Persistence
function saveCart() {
  localStorage.setItem("datheon_cart", JSON.stringify(state.cart));
}

// Required Cart Actions
function addToCart(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCartDrawer();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
}

function updateQuantity(productId, delta) {
  const item = state.cart.find((i) => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  renderCart();
}

function calculateTotal() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const shipping =
    subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + tax + shipping;

  return { subtotal, tax, shipping, total };
}

function renderCart() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadgeEl.textContent = totalItems;

  if (state.cart.length === 0) {
    cartItemsEl.innerHTML = `<p class="empty-cart">Your cart is currently empty.</p>`;
    checkoutBtnEl.disabled = true;
  } else {
    checkoutBtnEl.disabled = false;
    cartItemsEl.innerHTML = state.cart
      .map(
        (item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.title}" />
          <div class="cart-item-info">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            <div class="qty-controls">
              <button class="qty-btn" type="button" onclick="updateQuantity(${item.id}, -1)">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" type="button" onclick="updateQuantity(${item.id}, 1)">+</button>
              <button class="remove-btn" type="button" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  const { subtotal, tax, shipping, total } = calculateTotal();
  subtotalValEl.textContent = `$${subtotal.toFixed(2)}`;
  taxValEl.textContent = `$${tax.toFixed(2)}`;
  shippingValEl.textContent = shipping === 0 && subtotal > 0 ? "FREE" : `$${shipping.toFixed(2)}`;
  totalValEl.textContent = `$${total.toFixed(2)}`;
  modalTotalValEl.textContent = `$${total.toFixed(2)}`;
}

// Drawer & Modal Controls
function openCartDrawer() {
  cartDrawerEl.classList.add("open");
  backdropEl.classList.remove("hidden");
}

function closeCartDrawer() {
  cartDrawerEl.classList.remove("open");
  if (checkoutModalEl.classList.contains("hidden")) {
    backdropEl.classList.add("hidden");
  }
}

function openCheckoutModal() {
  checkoutFormEl.classList.remove("hidden");
  orderConfirmationEl.classList.add("hidden");
  checkoutModalEl.classList.remove("hidden");
  backdropEl.classList.remove("hidden");
}

function closeCheckoutModal() {
  checkoutModalEl.classList.add("hidden");
  if (!cartDrawerEl.classList.contains("open")) {
    backdropEl.classList.add("hidden");
  }
}

// Event Listeners
categoryFiltersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;

  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  state.selectedCategory = btn.dataset.category;
  renderProducts();
});

searchInputEl.addEventListener("input", (e) => {
  state.searchQuery = e.target.value.trim();
  renderProducts();
});

openCartBtnEl.addEventListener("click", openCartDrawer);
closeCartBtnEl.addEventListener("click", closeCartDrawer);
backdropEl.addEventListener("click", () => {
  closeCartDrawer();
  closeCheckoutModal();
});

checkoutBtnEl.addEventListener("click", openCheckoutModal);
closeModalBtnEl.addEventListener("click", closeCheckoutModal);

checkoutFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("customerName").value.trim();
  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const { total } = calculateTotal();

  state.cart = [];
  saveCart();
  renderCart();

  checkoutFormEl.classList.add("hidden");
  orderConfirmationEl.classList.remove("hidden");
  confirmationMsgEl.textContent = `Thank you, ${name}! Order ${orderId} ($${total.toFixed(2)}) has been confirmed.`;
});

doneOrderBtnEl.addEventListener("click", () => {
  checkoutFormEl.reset();
  closeCheckoutModal();
  closeCartDrawer();
});

// Initialize
renderCart();
fetchProducts();