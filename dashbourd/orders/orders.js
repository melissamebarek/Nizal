"use strict";

/* =========================
   CONFIGURATION
========================= */

const ORDERS_API_URL = "http://localhost:5000/api/orders";

/* =========================
   SIDEBAR
========================= */

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

/* =========================
   ELEMENTS
========================= */

const table = document.getElementById("ordersTable");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

let orders = [];
let loadingOrders = false;
let ordersError = false;

/* =========================
   STATUS MAPPING
========================= */

const STATUS_LABELS = {
    new: "Nouvelle commande",
    preparing: "En préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée"
};

function normalizeStatus(status) {
    const value = String(status || "").trim().toLowerCase();

    if (STATUS_LABELS[value]) {
        return STATUS_LABELS[value];
    }

    // Also accept statuses already written in French.
    const frenchStatuses = [
        "Nouvelle commande",
        "En préparation",
        "Expédiée",
        "Livrée",
        "Annulée"
    ];

    return frenchStatuses.find(
        label => normalizeText(label) === normalizeText(value)
    ) || value || "Nouvelle commande";
}

function getStatusClass(status) {
    switch (normalizeStatus(status)) {
        case "Nouvelle commande":
            return "new";
        case "En préparation":
            return "preparing";
        case "Expédiée":
            return "shipped";
        case "Livrée":
            return "delivered";
        case "Annulée":
            return "cancelled";
        default:
            return "";
    }
}

/* =========================
   NORMALIZE TEXT
========================= */

function normalizeText(text) {
    return String(text ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/* =========================
   FUZZY SEARCH
========================= */

function levenshteinDistance(a, b) {
    const matrix = Array.from(
        { length: b.length + 1 },
        () => []
    );

    for (let i = 0; i <= b.length; i++) {
        matrix[i][0] = i;
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function fuzzyMatch(text, query) {
    text = normalizeText(text);
    query = normalizeText(query);

    if (!query || text.includes(query)) {
        return true;
    }

    const words = text.split(/\s+/).filter(Boolean);
    const queryWords = query.split(/\s+/).filter(Boolean);

    return queryWords.every(queryWord =>
        words.some(word => {
            const tolerance = queryWord.length <= 4 ? 1 : 2;
            return levenshteinDistance(queryWord, word) <= tolerance;
        })
    );
}

/* =========================
   SAFE HTML
========================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

/* =========================
   PRICE & DATE
========================= */

function formatPrice(price) {
    const value = Number(price || 0);

    return value.toLocaleString("fr-FR", {
        maximumFractionDigits: 2
    }) + " DZD";
}

function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* =========================
   NORMALIZE API ORDER
========================= */

function normalizeOrder(order) {
    const items = Array.isArray(order.items)
        ? order.items
        : Array.isArray(order.order_items)
            ? order.order_items
            : [];

    const productNames = items
        .map(item => item.product_name || item.name)
        .filter(Boolean);

    const totalQuantity = items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );

    return {
        databaseId: order.id,
        id: order.order_number || `#${order.id}`,
        customer: order.customer_name || "Client inconnu",
        email: order.customer_email || order.email || "E-mail non renseigné",
        phone: order.customer_phone || "",
        products: productNames.length
            ? [...new Set(productNames)].join(" + ")
            : "Aucun détail produit",
        quantity: totalQuantity,
        total: Number(order.total ?? 0),
        date: formatDate(order.created_at),
        status: normalizeStatus(order.status),
        items
    };
}

/* =========================
   LOAD ALL ORDERS
========================= */

async function loadOrders() {
    loadingOrders = true;
    ordersError = false;

    table.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;padding:30px;">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Chargement des commandes...
            </td>
        </tr>
    `;

    emptyState.style.display = "none";

    try {
        const response = await fetch(ORDERS_API_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                `Erreur HTTP ${response.status}. Vérifiez la route GET /api/orders.`
            );
        }

        const result = await response.json();

        // Supports either { success: true, data: [...] }
        // or a direct array response.
        const apiOrders = Array.isArray(result)
            ? result
            : result.data;

        if (!Array.isArray(apiOrders)) {
            throw new Error(
                result.message || "Format de réponse API invalide."
            );
        }

        orders = apiOrders.map(normalizeOrder);

        // Show most recent orders first.
        orders.sort((a, b) => {
            const aId = Number(a.databaseId || 0);
            const bId = Number(b.databaseId || 0);
            return bId - aId;
        });

        loadingOrders = false;
        renderOrders();

    } catch (error) {
        loadingOrders = false;
        ordersError = true;

        console.error("Erreur lors du chargement des commandes :", error);

        table.innerHTML = "";
        emptyState.style.display = "block";

        emptyState.querySelector("h3").textContent =
            "Impossible de charger les commandes";

        emptyState.querySelector("p").textContent =
            "Vérifiez que le backend fonctionne et que GET /api/orders renvoie les commandes.";

    }
}

/* =========================
   RENDER ORDERS
========================= */

function renderOrders() {
    if (loadingOrders || ordersError) return;

    const query = searchInput.value;
    const selectedStatus = statusFilter.value;

    const filtered = orders.filter(order => {
        const searchableText = [
            order.id,
            order.customer,
            order.email,
            order.phone,
            order.products
        ].join(" ");

        const matchesSearch = fuzzyMatch(searchableText, query);

        const matchesStatus =
            selectedStatus === "all" ||
            normalizeText(order.status) === normalizeText(selectedStatus);

        return matchesSearch && matchesStatus;
    });

    table.innerHTML = "";

    if (filtered.length === 0) {
        emptyState.style.display = "block";
        pagination.style.display = "none";

        emptyState.querySelector("h3").textContent =
            orders.length === 0
                ? "Aucune commande pour le moment"
                : "Aucune commande trouvée";

        emptyState.querySelector("p").textContent =
            orders.length === 0
                ? "Les commandes enregistrées apparaîtront ici."
                : "Aucune commande ne correspond à votre recherche.";

        return;
    }

    emptyState.style.display = "none";

    

    filtered.forEach(order => {
        const row = document.createElement("tr");

        const orderIdentifier = order.databaseId ?? order.id;
       const detailsURL =
    `order-details.html?id=${encodeURIComponent(order.databaseId)}`;

        row.innerHTML = `
            <td>
                <span class="order-number">
                    ${escapeHTML(order.id)}
                </span>
            </td>

            <td>
                <div class="customer">
                    <strong>${escapeHTML(order.customer)}</strong>
                    <span>${escapeHTML(order.email)}</span>
                </div>
            </td>

            <td>
                <span class="products-count">
                    ${escapeHTML(order.products)}
                    · ${order.quantity} article${order.quantity > 1 ? "s" : ""}
                </span>
            </td>

            <td>
                <span class="order-total">
                    ${formatPrice(order.total)}
                </span>
            </td>

            <td>${escapeHTML(order.date)}</td>

            <td>
                <span class="status ${getStatusClass(order.status)}">
                    ${escapeHTML(order.status)}
                </span>
            </td>

            <td>
                <a
                    href="${detailsURL}"
                    class="view-order"
                    title="Voir la commande"
                    aria-label="Voir la commande ${escapeHTML(order.id)}"
                >
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </td>
        `;

        table.appendChild(row);
    });
}

/* =========================
   EVENTS
========================= */

searchInput.addEventListener("input", renderOrders);
statusFilter.addEventListener("change", renderOrders);

/* =========================
   INITIAL LOAD
========================= */

loadOrders();