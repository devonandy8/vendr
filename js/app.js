const LISTINGS = [
  { id: "macbook", title: "MacBook Air M1", category: "shop", price: 4200, blurb: "Used, 8/256, campus pickup.", color: "#dbe7ff" },
  { id: "airpods", title: "AirPods Pro", category: "shop", price: 890, blurb: "Clean case, still loud.", color: "#efe7ff" },
  { id: "kicks", title: "Campus sneakers", category: "shop", price: 320, blurb: "Size 43, barely worn.", color: "#ffe3d4" },
  { id: "braids", title: "Knotless braids", category: "services", price: 250, blurb: "Hostel appointments this week.", color: "#ffe8ef" },
  { id: "print", title: "Same-day printing", category: "services", price: 15, blurb: "Notes, posters, bindings.", color: "#e8fff3" },
  { id: "jollof", title: "Jollof combo", category: "food", price: 45, blurb: "Campus kitchen, 20 min.", color: "#ffe7c7" },
  { id: "waakye", title: "Waakye plate", category: "food", price: 35, blurb: "Vendor near the gate.", color: "#fff3d0" },
  { id: "room", title: "Single room, East", category: "stay", price: 1800, blurb: "Semester rate, 8 min walk.", color: "#e7f3ff" },
  { id: "hostel", title: "Shared hostel bed", category: "stay", price: 700, blurb: "Quiet block, Wi-Fi included.", color: "#f0ece4" },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "shop", label: "Shop" },
  { id: "services", label: "Services" },
  { id: "food", label: "Food" },
  { id: "stay", label: "Stay" },
];

const STORAGE_KEYS = {
  cart: "vendr-cart",
  waitlist: "vendr-waitlist",
  tickets: "vendr-tickets",
};

const state = {
  category: "all",
  query: "",
  cart: readJson(STORAGE_KEYS.cart, []),
};

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatCedis(amount) {
  return `GH₵ ${Number(amount).toLocaleString("en-GH")}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function setupNav() {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".menu-toggle");
  if (!nav || !toggle) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function listingMatches(item) {
  const haystack = `${item.title} ${item.blurb} ${item.category}`.toLowerCase();
  const queryOk = haystack.includes(state.query);
  const categoryOk = state.category === "all" || item.category === state.category;
  return queryOk && categoryOk;
}

function renderChips() {
  const root = document.getElementById("category-chips");
  if (!root) return;
  root.innerHTML = CATEGORIES.map(
    (category) =>
      `<button class="chip ${state.category === category.id ? "active" : ""}" data-category="${category.id}" type="button">${category.label}</button>`
  ).join("");
}

function renderListings() {
  const root = document.getElementById("listings");
  if (!root) return;
  const items = LISTINGS.filter(listingMatches);
  if (!items.length) {
    root.innerHTML = `<p class="empty">Nothing matches that search. Try another campus find.</p>`;
    return;
  }
  root.innerHTML = items
    .map(
      (item) => `
      <article class="listing">
        <div class="listing-media" style="background:${item.color}"></div>
        <div class="listing-body">
          <p class="kicker">${item.category}</p>
          <h3>${item.title}</h3>
          <p>${item.blurb}</p>
          <p class="price">${formatCedis(item.price)}</p>
          <button class="btn" type="button" data-add="${item.id}">Add to cart</button>
        </div>
      </article>`
    )
    .join("");
}

function cartTotal() {
  return state.cart.reduce((sum, line) => {
    const item = LISTINGS.find((listing) => listing.id === line.id);
    return sum + (item ? item.price * line.qty : 0);
  }, 0);
}

function renderCart() {
  const root = document.getElementById("cart-items");
  const total = document.getElementById("cart-total");
  if (!root || !total) return;
  if (!state.cart.length) {
    root.innerHTML = `<p class="empty">Your demo cart is empty.</p>`;
    total.textContent = formatCedis(0);
    return;
  }
  root.innerHTML = state.cart
    .map((line) => {
      const item = LISTINGS.find((listing) => listing.id === line.id);
      if (!item) return "";
      return `<div class="cart-item">
        <div>
          <strong>${item.title}</strong>
          <div>${line.qty} × ${formatCedis(item.price)}</div>
        </div>
        <button type="button" data-remove="${item.id}">Remove</button>
      </div>`;
    })
    .join("");
  total.textContent = formatCedis(cartTotal());
}

function addToCart(id) {
  const existing = state.cart.find((line) => line.id === id);
  if (existing) existing.qty += 1;
  else state.cart.push({ id, qty: 1 });
  writeJson(STORAGE_KEYS.cart, state.cart);
  renderCart();
  const item = LISTINGS.find((listing) => listing.id === id);
  showToast(`${item.title} added to cart`);
}

function removeFromCart(id) {
  state.cart = state.cart.filter((line) => line.id !== id);
  writeJson(STORAGE_KEYS.cart, state.cart);
  renderCart();
}

function setupMarket() {
  const search = document.getElementById("market-search");
  const chips = document.getElementById("category-chips");
  const listings = document.getElementById("listings");
  const checkout = document.getElementById("checkout-form");
  if (!search || !chips || !listings) return;

  renderChips();
  renderListings();
  renderCart();

  search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderListings();
  });

  chips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderChips();
    renderListings();
  });

  listings.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    addToCart(button.dataset.add);
  });

  document.getElementById("cart-items")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    removeFromCart(button.dataset.remove);
  });

  checkout?.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.getElementById("checkout-status");
    if (!state.cart.length) {
      status.className = "form-status err";
      status.textContent = "Add something to the cart first.";
      return;
    }
    const data = Object.fromEntries(new FormData(checkout));
    if (!data.name?.trim() || !data.hall?.trim() || !data.phone?.trim()) {
      status.className = "form-status err";
      status.textContent = "Name, hall, and phone are required.";
      return;
    }
    const order = {
      id: `VND-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      buyer: data,
      items: state.cart,
      total: cartTotal(),
    };
    const orders = readJson("vendr-orders", []);
    orders.unshift(order);
    writeJson("vendr-orders", orders);
    state.cart = [];
    writeJson(STORAGE_KEYS.cart, state.cart);
    renderCart();
    checkout.reset();
    status.className = "form-status ok";
    status.textContent = `Order ${order.id} placed. Pickup note sent for ${data.hall}.`;
    showToast(`Order ${order.id} confirmed`);
  });
}

function setupWaitlist() {
  const form = document.getElementById("waitlist-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.getElementById("waitlist-status");
    const email = String(new FormData(form).get("email") || "").trim();
    const campus = String(new FormData(form).get("campus") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.className = "form-status err";
      status.textContent = "Enter a valid email.";
      return;
    }
    const waitlist = readJson(STORAGE_KEYS.waitlist, []);
    if (!waitlist.some((entry) => entry.email === email)) {
      waitlist.push({ email, campus, at: new Date().toISOString() });
      writeJson(STORAGE_KEYS.waitlist, waitlist);
    }
    form.reset();
    status.className = "form-status ok";
    status.textContent = "You’re on the list. We’ll ping you when Vendr opens on your campus.";
  });
}

function setupSupportForm() {
  const form = document.getElementById("support-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.getElementById("support-status");
    const data = Object.fromEntries(new FormData(form));
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      status.className = "form-status err";
      status.textContent = "Please complete name, email, and message.";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      status.className = "form-status err";
      status.textContent = "That email doesn’t look right.";
      return;
    }
    const tickets = readJson(STORAGE_KEYS.tickets, []);
    const ticket = {
      id: `SUP-${Date.now().toString().slice(-6)}`,
      ...data,
      at: new Date().toISOString(),
    };
    tickets.unshift(ticket);
    writeJson(STORAGE_KEYS.tickets, tickets);
    const subject = encodeURIComponent(`Vendr support ${ticket.id}`);
    const body = encodeURIComponent(`${data.message}\n\nFrom ${data.name} <${data.email}>`);
    window.location.href = `mailto:support@campusmarket.app?subject=${subject}&body=${body}`;
    status.className = "form-status ok";
    status.textContent = `Ticket ${ticket.id} saved. Your email app should open next.`;
    form.reset();
  });
}

function setupYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupMarket();
  setupWaitlist();
  setupSupportForm();
  setupYear();
});
