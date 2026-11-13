const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const stockFilter = document.getElementById("stockFilter");

const productsTable = document.getElementById("productsTable");
const emptyState = document.getElementById("emptyState");

let products = [];


// ===============================
// NORMALIZE TEXT
// ===============================

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

}


// ===============================
// LEVENSHTEIN
// ===============================

function levenshteinDistance(a, b) {

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {

        for (let j = 1; j <= a.length; j++) {

            if (b.charAt(i - 1) === a.charAt(j - 1)) {

                matrix[i][j] =
                    matrix[i - 1][j - 1];

            } else {

                matrix[i][j] = Math.min(

                    matrix[i - 1][j] + 1,

                    matrix[i][j - 1] + 1,

                    matrix[i - 1][j - 1] + 1

                );

            }
        }
    }

    return matrix[b.length][a.length];

}


// ===============================
// FUZZY MATCH
// ===============================

function fuzzyMatch(query, text) {

    query = normalizeText(query);
    text = normalizeText(text);

    if (!query) {
        return true;
    }

    if (text.includes(query)) {
        return true;
    }

    const words = text.split(/\s+/);

    return words.some(word => {

        const distance =
            levenshteinDistance(query, word);

        const maxDistance =
            query.length <= 4 ? 1 : 2;

        return distance <= maxDistance;

    });

}


// ===============================
// FORMAT PRICE
// ===============================

function formatPrice(price) {

    return Number(price || 0)
        .toLocaleString("fr-FR") + " DZD";

}


// ===============================
// GET PRODUCT STOCK
// ===============================

function getProductStock(product) {

    if (
        !Array.isArray(product.variants) ||
        product.variants.length === 0
    ) {
        return 0;
    }

    return product.variants.reduce(
        (total, variant) => {

            return total +
                (Number(variant.stock) || 0);

        },
        0
    );

}


// ===============================
// GET PRODUCT STATUS
// ===============================

function getProductStatus(stock) {

    if (stock === 0) {

        return {
            className: "out",
            text: "Indisponible"
        };

    }

    if (stock <= 5) {

        return {
            className: "low",
            text: "Stock faible"
        };

    }

    return {
        className: "available",
        text: "Disponible"
    };

}


// ===============================
// GET MAIN IMAGE
// ===============================

function getMainImage(product) {

    if (
        Array.isArray(product.images) &&
        product.images.length > 0
    ) {

        const mainImage =
            product.images.find(
                image => Number(image.is_main) === 1
            );

        if (mainImage) {
            return mainImage.image_url;
        }

        return product.images[0].image_url;
    }

    // Fallback if product has no image
    return "https://via.placeholder.com/100x100?text=NIZAL";

}


// ===============================
// GET VARIANT LABEL
// ===============================

function getVariantLabel(product) {

    if (
        !Array.isArray(product.variants) ||
        product.variants.length === 0
    ) {
        return "Aucune variante";
    }

    const colors = [
        ...new Set(
            product.variants
                .map(variant => variant.color)
                .filter(Boolean)
        )
    ];

    const sizes = [
        ...new Set(
            product.variants
                .map(variant => variant.size)
                .filter(Boolean)
        )
    ];

    const parts = [];

    if (colors.length > 0) {
        parts.push(colors.join(" / "));
    }

    if (sizes.length > 0) {
        parts.push(sizes.join(" / "));
    }

    return parts.length > 0
        ? parts.join(" — ")
        : "Aucune variante";

}


// ===============================
// RENDER PRODUCTS
// ===============================

function renderProducts(productList) {

    productsTable.innerHTML = "";

    productList.forEach(product => {

        const stock =
            getProductStock(product);

        const status =
            getProductStatus(stock);

        const image =
            getMainImage(product);

        const variantLabel =
            getVariantLabel(product);

        const row =
            document.createElement("tr");

        row.dataset.name =
            product.name || "";

        row.dataset.category =
            product.category || "";

        row.dataset.stock =
            status.className;

        row.dataset.id =
            product.id;

        row.innerHTML = `
            <td>
                <div class="product-cell">

                    <img
                        src="${image}"
                        alt="${escapeHtml(product.name)}"
                    >

                    <div>
                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <span>
                            ${escapeHtml(variantLabel)}
                        </span>
                    </div>

                </div>
            </td>

            <td>
                ${escapeHtml(product.category || "—")}
            </td>

            <td>
                <strong>
                    ${formatPrice(product.price)}
                </strong>
            </td>

            <td>
                ${stock}
            </td>

            <td>
                <span class="stock-badge ${status.className}">
                    ${status.text}
                </span>
            </td>

            <td>
                <a
                    href="product-details.html?id=${product.id}"
                    class="action-btn"
                    title="Voir le produit"
                >
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </td>
        `;

        productsTable.appendChild(row);

    });

}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ===============================
// FILTER PRODUCTS
// ===============================

function filterProducts() {

    const query =
        normalizeText(searchInput.value);

    const category =
        categoryFilter.value;

    const stock =
        stockFilter
            ? stockFilter.value
            : "";

    let visibleCount = 0;

    const rows =
        Array.from(
            productsTable.querySelectorAll("tr")
        );

    rows.forEach(row => {

        const name =
            row.dataset.name || "";

        const rowCategory =
            row.dataset.category || "";

        const rowStock =
            row.dataset.stock || "";

        const matchesSearch =
            fuzzyMatch(query, name);

        const matchesCategory =
            !category ||
            normalizeText(rowCategory) ===
            normalizeText(category);

        const matchesStock =
            !stock ||
            rowStock === stock;

        const visible =
            matchesSearch &&
            matchesCategory &&
            matchesStock;

        row.style.display =
            visible ? "" : "none";

        if (visible) {
            visibleCount++;
        }

    });

    emptyState.classList.toggle(
        "show",
        visibleCount === 0
    );

}


// ===============================
// LOAD PRODUCTS
// ===============================

async function loadProducts() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/products"
        );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Failed to fetch products"
            );

        }

        products =
            Array.isArray(result.data)
                ? result.data
                : [];

        /*
         * The GET /api/products endpoint currently
         * returns product information.
         *
         * We fetch the variants and images separately
         * so the table can calculate stock and display
         * the main image.
         */

        const productsWithDetails =
            await Promise.all(

                products.map(async product => {

                    try {

                        const detailResponse =
                            await fetch(
                                `http://localhost:5000/api/products/${product.id}`
                            );

                        const detailResult =
                            await detailResponse.json();

                        if (
                            detailResponse.ok &&
                            detailResult.success
                        ) {

                            return detailResult.data;

                        }

                    } catch (error) {

                        console.error(
                            `Failed to load product ${product.id}:`,
                            error
                        );

                    }

                    return product;

                })

            );

        products =
            productsWithDetails;

        renderProducts(products);

        filterProducts();

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );

        products = [];

        productsTable.innerHTML = "";

        emptyState.classList.add("show");

    }

}


// ===============================
// EVENTS
// ===============================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterProducts
    );

}

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        filterProducts
    );

}

if (stockFilter) {

    stockFilter.addEventListener(
        "change",
        filterProducts
    );

}


// ===============================
// MOBILE SIDEBAR
// ===============================

const mobileMenu =
    document.querySelector(".mobile-menu");

const sidebar =
    document.querySelector(".sidebar");

if (mobileMenu) {

    mobileMenu.addEventListener(
        "click",
        () => {

            if (sidebar) {
                sidebar.classList.toggle("open");
            }

        }
    );

}


// ===============================
// INITIAL LOAD
// ===============================

loadProducts();
