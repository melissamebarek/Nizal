
/* =========================
   NIZAL CART
   Connected to product page
========================= */

const CART_KEY = "nizalCart";

/* =========================
   HTML ELEMENTS
========================= */

const cartItems = document.querySelector("#cartItems");
const cartLayout = document.querySelector("#cartLayout");
const orderSummary = document.querySelector("#orderSummary");

const cartHeading = document.querySelector(".cart-heading");
const headingDescription = document.querySelector("#headingDescription");
const headingItemCount = document.querySelector("#headingItemCount");
const breadcrumb = document.querySelector("#cartBreadcrumb");
const emptyCart = document.querySelector("#emptyCart");

const subtotalElement = document.querySelector("#subtotal");
const discountElement = document.querySelector("#discount");
const totalElement = document.querySelector("#total");

const checkoutButton = document.querySelector("#checkoutButton");
const checkoutMessage = document.querySelector("#checkoutMessage");

/* =========================
   CART STORAGE
========================= */

function getCart() {
    try {
        const savedCart = JSON.parse(
            localStorage.getItem(CART_KEY) || "[]"
        );

        return Array.isArray(savedCart) ? savedCart : [];
    } catch (error) {
        console.error("Erreur de lecture du panier :", error);
        return [];
    }
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let cart = getCart();

/* =========================
   HELPERS
========================= */

function formatPrice(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
        return "0 DA";
    }

    return value.toLocaleString("fr-DZ", {
        maximumFractionDigits: 2
    }) + " DA";
}

// Prevent product data from being interpreted as HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getProductId(item) {
    return String(item.productId ?? item.id ?? "");
}

function getVariantId(item) {
    return String(item.variantId ?? "default");
}

function getQuantity(item) {
    return Math.max(1, Number(item.quantity) || 1);
}

// item.price is already the discounted unit price
// when the product page saves a discounted product.
function getUnitPrice(item) {
    const price = Number(item.price);
    return Number.isFinite(price) ? Math.max(0, price) : 0;
}

function getOriginalPrice(item) {
    const price = Number(item.originalPrice);

    if (item.originalPrice !== undefined &&
        item.originalPrice !== null &&
        Number.isFinite(price)) {
        return Math.max(0, price);
    }

    return getUnitPrice(item);
}

function getItemDiscount(item) {
    return Math.max(
        0,
        getOriginalPrice(item) - getUnitPrice(item)
    );
}

function getImage(item) {
    return item.image || "";
}

/* =========================
   PRICE CALCULATIONS
========================= */

// Total of discounted product prices, including quantities.
function getSubtotal() {
    return cart.reduce((sum, item) => {
        return sum + getUnitPrice(item) * getQuantity(item);
    }, 0);
}

// Loyalty discount is separate from product discounts.
// No loyalty discount is applied in this version.
function getDiscount() {
    return 0;
}

function getTotal() {
    return Math.max(0, getSubtotal() - getDiscount());
}

function getTotalQuantity() {
    return cart.reduce((sum, item) => {
        return sum + getQuantity(item);
    }, 0);
}

/* =========================
   DISPLAY EMPTY CART
========================= */

function renderEmptyCart() {
    cartHeading.hidden = false;

    headingDescription.hidden = true;
    breadcrumb.hidden = true;
    cartLayout.hidden = true;
    orderSummary.hidden = true;
    emptyCart.hidden = false;

    headingItemCount.textContent = "(0 article)";

    cartItems.replaceChildren();

    subtotalElement.textContent = formatPrice(0);
    discountElement.textContent = formatPrice(0);
    totalElement.textContent = formatPrice(0);

    checkoutMessage.textContent = "";
}

/* =========================
   DISPLAY PRODUCTS
========================= */

function renderCart() {
    // Remove invalid entries from the displayed cart.
    cart = cart.filter(item =>
        item &&
        typeof item === "object" &&
        (item.productId != null || item.id != null)
    );

    const hasItems = cart.length > 0;

    cartHeading.hidden = false;
    headingDescription.hidden = !hasItems;
    breadcrumb.hidden = !hasItems;
    cartLayout.hidden = !hasItems;
    orderSummary.hidden = !hasItems;
    emptyCart.hidden = hasItems;

    headingItemCount.textContent =
        `(${getTotalQuantity()} article${getTotalQuantity() > 1 ? "s" : ""})`;

    if (!hasItems) {
        renderEmptyCart();
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => {
        const name = escapeHTML(item.name || "Produit NIZAL");
        const category = escapeHTML(item.category || "BOUTIQUE NIZAL");
        const description = escapeHTML(item.description || "");

        const color = escapeHTML(item.color || "Non précisée");
        const size = escapeHTML(item.size || "Non précisée");

        const quantity = getQuantity(item);
        const unitPrice = getUnitPrice(item);
        const originalPrice = getOriginalPrice(item);
        const itemDiscount = getItemDiscount(item);
        const lineTotal = unitPrice * quantity;

        const image = getImage(item);

        const imageHTML = image
            ? `<img src="${escapeHTML(image)}"
                    alt="${name}"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.hidden=false;">
               <div class="image-fallback" hidden>Image indisponible</div>`
            : `<div class="image-fallback">Image indisponible</div>`;

        const oldPriceHTML = itemDiscount > 0
            ? `<span class="old-price"
                     style="text-decoration:line-through;color:#888;margin-right:8px">
                    ${formatPrice(originalPrice)}
               </span>`
            : "";

        const discountHTML = itemDiscount > 0
            ? `<span class="discount-badge"
                     style="display:inline-block;background:#fee2e2;color:#b91c1c;padding:3px 7px;border-radius:4px;font-size:12px;margin-top:6px">
                    -${formatPrice(itemDiscount)}
               </span>`
            : "";

        return `
            <article class="cart-item"
                data-cart-index="${index}"
                data-product-id="${escapeHTML(getProductId(item))}"
                data-variant-id="${escapeHTML(getVariantId(item))}">

                <div class="product-visual">
                    ${imageHTML}
                </div>

                <div class="product-info">

                    <div class="product-category">
                        ${category}
                    </div>

                    <h2 class="product-name">
                        ${name}
                    </h2>

                    ${description
                        ? `<p class="product-description">${description}</p>`
                        : ""}

                    <div class="product-meta">
                        <span>
                            Taille : <strong>${size}</strong>
                        </span>

                        <span>
                            Couleur : <strong>${color}</strong>
                        </span>
                    </div>

                    <p class="cart-quantity" style="margin-top:10px">
                        Quantité : <strong>${quantity}</strong>
                    </p>

                    <div class="product-actions">
                        <button
                            class="remove-button"
                            type="button"
                            data-action="remove"
                            data-index="${index}">
                            ✕ Supprimer
                        </button>
                    </div>

                </div>

                <div class="product-price">
                    <span class="stock-badge">✓ Ajouté au panier</span>

                    <span class="price-label">
                        Prix unitaire
                    </span>

                    <div class="price-original">
                        ${oldPriceHTML}
                    </div>

                    <strong class="price-value">
                        ${formatPrice(unitPrice)}
                    </strong>

                    ${discountHTML}

                    <div class="line-total" style="margin-top:12px">
                        <span class="price-label">Total</span>
                        <strong>${formatPrice(lineTotal)}</strong>
                    </div>

                </div>

            </article>
        `;
    }).join("");

    updatePrices();
    saveCart();
}

/* =========================
   UPDATE PRICE SUMMARY
========================= */

function updatePrices() {
    subtotalElement.textContent = formatPrice(getSubtotal());
    discountElement.textContent = formatPrice(getDiscount());
    totalElement.textContent = formatPrice(getTotal());
}

/* =========================
   REMOVE ONE VARIANT
========================= */

cartItems.addEventListener("click", event => {
    const button = event.target.closest('[data-action="remove"]');

    if (!button) return;

    const index = Number(button.dataset.index);

    if (!Number.isInteger(index) || index < 0 || index >= cart.length) {
        return;
    }

    // Remove only the selected cart line.
    // Other variants of the same product remain.
    cart.splice(index, 1);

    saveCart();
    renderCart();
});

/* =========================
   CHECKOUT
========================= */

checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) return;

    window.location.href = "confirme.html";
});

/* =========================
   MOBILE MENU
========================= */

const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");

if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));

        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Fermer le menu" : "Ouvrir le menu"
        );
    });
}

/* =========================
   CART COUNT
========================= */

function updateCartCount() {
    const count = getTotalQuantity();

    const cartLink = document.querySelector(
        'a[aria-label="Cart"], a[aria-label="Panier"]'
    );

    if (cartLink) {
        cartLink.setAttribute("aria-label", `Panier (${count})`);
        cartLink.dataset.cartCount = count;
    }
}

/* =========================
   SYNC WHEN CART CHANGES
   IN ANOTHER TAB
========================= */

window.addEventListener("storage", event => {
    if (event.key === CART_KEY) {
        cart = getCart();
        renderCart();
        updateCartCount();
    }
});

/* =========================
   INITIALIZE
========================= */

renderCart();
updateCartCount();