
"use strict";

/* =========================================
   CONFIGURATION
========================================= */

const API_URL = "http://localhost:5000/api/orders";

const params = new URLSearchParams(window.location.search);
const orderId = params.get("id");

/* =========================================
   STATUS CONFIGURATION
========================================= */

const STATUS_LABELS = {
    new: "Nouvelle commande",
    preparing: "En préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée"
};

const STATUS_CLASSES = {
    new: "new",
    preparing: "preparing",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled"
};

const STATUS_STEPS = [
    "new",
    "preparing",
    "shipped",
    "delivered"
];

const ALLOWED_TRANSITIONS = {
    new: ["preparing"],
    preparing: ["shipped"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
};

const DELIVERY_LABELS = {
    bureau: "Bureau",
    domicile: "À domicile"
};

const PAYMENT_LABELS = {
    cash_on_delivery: "Paiement à la livraison"
};

/* =========================================
   ELEMENTS
========================================= */

const statusModal = document.getElementById("statusModal");
const cancelModal = document.getElementById("cancelModal");

const changeStatusBtn = document.getElementById("changeStatusBtn");
const cancelOrderBtn = document.getElementById("cancelOrderBtn");

const closeStatusModal = document.getElementById("closeStatusModal");
const closeCancelModal = document.getElementById("closeCancelModal");

const keepOrderBtn = document.getElementById("keepOrderBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

const statusBadge = document.getElementById("orderStatusBadge");

const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

let currentOrder = null;
let currentStatus = "new";
let toastTimer = null;
let actionInProgress = false;

/* =========================================
   HELPERS
========================================= */

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = value ?? "—";
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatPrice(value) {
    const number = Number(value);

    return (
        (Number.isFinite(number) ? number : 0)
            .toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }) + " DZD"
    );
}

function formatDate(value) {
    if (!value) return "Date non renseignée";

    // MySQL DATETIME is commonly returned without a timezone.
    const date = new Date(
        typeof value === "string" && !value.includes("T")
            ? value.replace(" ", "T")
            : value
    );

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getStatusLabel(status) {
    const normalized = String(status || "new").toLowerCase();

    return STATUS_LABELS[normalized] || String(status || "Inconnu");
}

function showToast(title, message, type = "info") {
    if (!toast || !toastTitle || !toastMessage) {
        console.log(`${title}: ${message}`);
        return;
    }

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    toast.classList.remove("success", "error", "info");
    toast.classList.add(type, "show");

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

function openModal(modal) {
    if (modal) {
        modal.classList.add("show");
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove("show");
    }
}

function setActionLoading(loading) {
    actionInProgress = loading;

    if (confirmCancelBtn) {
        confirmCancelBtn.disabled = loading;

        if (!confirmCancelBtn.dataset.originalText) {
            confirmCancelBtn.dataset.originalText =
                confirmCancelBtn.textContent.trim();
        }

        confirmCancelBtn.textContent = loading
            ? "Annulation en cours..."
            : confirmCancelBtn.dataset.originalText;
    }

    if (changeStatusBtn) {
        changeStatusBtn.disabled =
            loading ||
            currentStatus === "cancelled" ||
            currentStatus === "delivered";
    }

    if (cancelOrderBtn) {
        cancelOrderBtn.disabled =
            loading ||
            currentStatus === "cancelled" ||
            currentStatus === "shipped" ||
            currentStatus === "delivered";
    }

    document
        .querySelectorAll(".status-options button")
        .forEach(button => {
            button.disabled = loading;
        });
}

/* =========================================
   API HELPER
========================================= */

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.success === false) {
        throw new Error(
            result?.message ||
            `Erreur serveur HTTP ${response.status}`
        );
    }

    if (!result) {
        throw new Error("Réponse invalide du serveur.");
    }

    return result;
}

/* =========================================
   LOAD ORDER DETAILS
========================================= */

async function loadOrderDetails() {
    if (!orderId) {
        showPageError(
            "Identifiant manquant. Ouvrez cette page depuis une commande."
        );
        return false;
    }

    setText("orderTitle", "Chargement de la commande...");
    setText("breadcrumbOrderNumber", "Chargement...");

    try {
        const result = await apiRequest(
            `${API_URL}/${encodeURIComponent(orderId)}`,
            {
                method: "GET"
            }
        );

        const order = result.data || result.order || result;

        if (!order || order.id == null) {
            throw new Error(
                "La réponse API ne contient pas de commande valide."
            );
        }

        currentOrder = order;
        currentStatus = String(order.status || "new").toLowerCase();

        renderOrder(order);

        return true;
    } catch (error) {
        console.error("Erreur chargement commande :", error);

        showPageError(
            error.message ||
            "Une erreur est survenue pendant le chargement."
        );

        return false;
    }
}

/* =========================================
   ERROR DISPLAY
========================================= */

function showPageError(message) {
    const products = getElement("orderProducts");

    if (products) {
        products.innerHTML = `
            <div class="empty-products">
                <p class="error-message">${escapeHTML(message)}</p>
            </div>
        `;
    }

    setText("orderTitle", "Impossible de charger la commande");
    setText("breadcrumbOrderNumber", "Erreur");
    setText("orderDate", message);

    showToast("Erreur", message, "error");
}

/* =========================================
   RENDER COMPLETE ORDER
========================================= */

function renderOrder(order) {
    const orderNumber = order.order_number || `#${order.id}`;
    const items = Array.isArray(order.items) ? order.items : [];

    setText("breadcrumbOrderNumber", orderNumber);
    setText("orderTitle", `Commande ${orderNumber}`);
    setText("orderDate", `Commandée le ${formatDate(order.created_at)}`);
    setText("historyCreatedAt", formatDate(order.created_at));

    renderStatus(order.status);
    renderProducts(items);
    renderSummary(order, items);
    renderCustomer(order);
    renderOrderInfo(order, items);
    renderHistory(order);
}

/* =========================================
   RENDER PRODUCTS
========================================= */

function renderProducts(items) {
    const container = getElement("orderProducts");

    if (!container) {
        console.error('Élément "#orderProducts" introuvable.');
        return;
    }

    if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = `
            <div class="empty-products">
                <p>Aucun produit dans cette commande.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => {
        const name =
            item.product_name ||
            item.current_product_name ||
            item.name ||
            "Produit";

        const quantity = Math.max(0, Number(item.quantity) || 0);
        const unitPrice = Number(item.unit_price) || 0;

        const subtotal = item.subtotal != null
            ? Number(item.subtotal)
            : unitPrice * quantity;

        const color = item.variant_color || "";
        const size = item.variant_size || "";

        const variant = [color, size].filter(Boolean).join(" / ");

        const imageSource =
            item.cover_image ||
            item.product_image ||
            item.image ||
            item.image_url ||
            "";

        let imageHTML = `
            <div class="order-product-image order-product-placeholder">
                <i class="fa-solid fa-shirt"></i>
            </div>
        `;

        if (imageSource) {
            let imageURL = String(imageSource).trim();

            if (
                !imageURL.startsWith("data:image/") &&
                !/^https?:\/\//i.test(imageURL) &&
                !imageURL.startsWith("/") &&
                !imageURL.startsWith("blob:")
            ) {
                imageURL = `data:image/jpeg;base64,${imageURL}`;
            }

            imageHTML = `
                <img
                    class="order-product-image"
                    src="${escapeHTML(imageURL)}"
                    alt="${escapeHTML(name)}"
                    loading="lazy"
                >
            `;
        }

        return `
            <article class="order-product">
                <div class="order-product-visual">
                    ${imageHTML}
                </div>

                <div class="order-product-details">
                    <h3 class="order-product-name">
                        ${escapeHTML(name)}
                    </h3>

                    ${
                        variant
                            ? `
                                <div class="order-product-variant">
                                    ${
                                        color
                                            ? `
                                                <span
                                                    class="variant-color-dot"
                                                    style="background-color: ${escapeHTML(
                                                        getColorCode(color)
                                                    )}"
                                                ></span>
                                            `
                                            : ""
                                    }
                                    <span>${escapeHTML(variant)}</span>
                                </div>
                            `
                            : ""
                    }

                    <div class="order-product-meta">
                        <div class="order-product-unit">
                            <span>Prix unitaire</span>
                            <strong>${formatPrice(unitPrice)}</strong>
                        </div>

                        <div class="order-product-quantity">
                            <span>Quantité</span>
                            <strong>${quantity}</strong>
                        </div>
                    </div>
                </div>

                <div class="order-product-total">
                    <strong>${formatPrice(subtotal)}</strong>
                </div>
            </article>
        `;
    }).join("");

    container.querySelectorAll(".order-product-image").forEach(image => {
        if (image.tagName !== "IMG") return;

        image.addEventListener("error", () => {
            const placeholder = document.createElement("div");

            placeholder.className =
                "order-product-image order-product-placeholder";

            placeholder.innerHTML =
                '<i class="fa-solid fa-shirt"></i>';

            image.replaceWith(placeholder);
        }, { once: true });
    });
}

function getColorCode(color) {
    const colors = {
        rouge: "#e5242a",
        red: "#e5242a",
        noir: "#222222",
        black: "#222222",
        blanc: "#ffffff",
        white: "#ffffff",
        bleu: "#2463eb",
        blue: "#2463eb",
        vert: "#159447",
        green: "#159447",
        jaune: "#facc15",
        yellow: "#facc15",
        gris: "#9ca3af",
        gray: "#9ca3af",
        grey: "#9ca3af"
    };

    return colors[String(color || "").toLowerCase()] || "#9ca3af";
}

/* =========================================
   RENDER SUMMARY
========================================= */

function renderSummary(order, items) {
    const subtotalFromItems = items.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;

        return sum + (
            item.subtotal != null
                ? Number(item.subtotal)
                : price * quantity
        );
    }, 0);

    const subtotal = order.subtotal != null
        ? Number(order.subtotal)
        : subtotalFromItems;

    const total = Number(order.total) || 0;

    const shipping = order.shipping_fee != null
        ? Number(order.shipping_fee)
        : Math.max(0, total - subtotal);

    setText("orderSubtotal", formatPrice(subtotal));
    setText("orderShipping", formatPrice(shipping));
    setText("orderTotal", formatPrice(total));
}

/* =========================================
   RENDER CUSTOMER
========================================= */

function renderCustomer(order) {
    const customerName = order.customer_name || "Client";

    const initials = customerName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join("");

    setText("customerAvatar", initials || "C");
    setText("customerName", customerName);
    setText("customerEmail", order.customer_email || "E-mail non renseigné");
    setText("customerPhone", order.customer_phone || "Téléphone non renseigné");
}

/* =========================================
   RENDER ORDER INFORMATION
========================================= */

function renderOrderInfo(order, items) {
    const orderNumber = order.order_number || `#${order.id}`;

    const itemCount = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
    );

    const address = [
        order.shipping_address,
        order.city,
        order.wilaya_name
    ]
        .filter(value => value != null && String(value).trim() !== "")
        .join(", ");

    const deliveryType =
        DELIVERY_LABELS[order.delivery_type] ||
        order.delivery_type ||
        "Non précisée";

    const paymentMethod =
        PAYMENT_LABELS[order.payment_method] ||
        order.payment_method ||
        "Paiement à la livraison";

    setText("infoOrderNumber", orderNumber);
    setText("infoOrderDate", formatDate(order.created_at));
    setText("orderItemsCount", String(itemCount));
    setText("infoOrderTotal", formatPrice(order.total));
    setText("orderDeliveryType", deliveryType);
    setText("orderAddress", address || "Adresse non renseignée");
    setText("orderPayment", paymentMethod);
}

/* =========================================
   RENDER HISTORY
========================================= */

function renderHistory(order) {
    const container = getElement("orderHistory");

    if (!container) return;

    // The current API does not provide a status audit log.
    container.innerHTML = `
        <div class="history-item">
            <div class="history-icon">
                <i class="fa-solid fa-receipt"></i>
            </div>

            <div>
                <strong>Commande enregistrée</strong>
                <span>${escapeHTML(formatDate(order.created_at))}</span>
            </div>
        </div>
    `;

    if (order.status === "cancelled") {
        container.insertAdjacentHTML("beforeend", `
            <div class="history-item">
                <div class="history-icon">
                    <i class="fa-solid fa-ban"></i>
                </div>

                <div>
                    <strong>Commande annulée</strong>
                    <span>${escapeHTML(formatDate(order.updated_at))}</span>
                </div>
            </div>
        `);
    } else if (order.status && order.status !== "new") {
        container.insertAdjacentHTML("beforeend", `
            <div class="history-item">
                <div class="history-icon">
                    <i class="fa-solid fa-arrows-rotate"></i>
                </div>

                <div>
                    <strong>Statut actuel : ${escapeHTML(
                        getStatusLabel(order.status)
                    )}</strong>
                    <span>${escapeHTML(formatDate(order.updated_at))}</span>
                </div>
            </div>
        `);
    }
}

/* =========================================
   RENDER STATUS
========================================= */

function renderStatus(status) {
    currentStatus = String(status || "new").toLowerCase();

    if (statusBadge) {
        statusBadge.textContent = getStatusLabel(currentStatus);
        statusBadge.className = "status";
        statusBadge.classList.add(
            STATUS_CLASSES[currentStatus] || "new"
        );
    }

    const currentStepIndex = STATUS_STEPS.indexOf(currentStatus);

    document.querySelectorAll(".progress-step").forEach(step => {
        const stepStatus = step.dataset.status;
        const stepIndex = STATUS_STEPS.indexOf(stepStatus);

        step.classList.remove("active", "completed");

        if (currentStatus === "cancelled") return;

        if (stepIndex !== -1 && stepIndex < currentStepIndex) {
            step.classList.add("completed");
        } else if (stepStatus === currentStatus) {
            step.classList.add("active");
        }
    });

    const isFinal =
        currentStatus === "cancelled" ||
        currentStatus === "delivered";

    const cannotCancel =
        currentStatus === "cancelled" ||
        currentStatus === "shipped" ||
        currentStatus === "delivered";

    if (cancelOrderBtn) {
        cancelOrderBtn.disabled = cannotCancel || actionInProgress;
    }

    if (changeStatusBtn) {
        changeStatusBtn.disabled = isFinal || actionInProgress;
    }

    const notice = getElement("statusNotice");

    if (notice) {
        if (currentStatus === "cancelled") {
            notice.textContent =
                "Cette commande a été annulée et le stock a été restauré.";
            notice.hidden = false;
        } else {
            notice.textContent = "";
            notice.hidden = true;
        }
    }

    // Disable status options that aren't valid for the current status.
    document.querySelectorAll(".status-options button").forEach(button => {
        const targetStatus = button.dataset.status;
        const allowed =
            ALLOWED_TRANSITIONS[currentStatus] || [];

        button.disabled =
            actionInProgress ||
            !allowed.includes(targetStatus);
    });
}

/* =========================================
   MODAL EVENTS
========================================= */

if (changeStatusBtn) {
    changeStatusBtn.addEventListener("click", () => {
        if (!currentOrder || actionInProgress) return;

        if (
            currentStatus === "cancelled" ||
            currentStatus === "delivered"
        ) {
            showToast(
                "Modification impossible",
                "Cette commande est dans un état final.",
                "error"
            );
            return;
        }

        openModal(statusModal);
    });
}

if (cancelOrderBtn) {
    cancelOrderBtn.addEventListener("click", () => {
        if (!currentOrder || actionInProgress) return;

        if (
            currentStatus === "cancelled" ||
            currentStatus === "shipped" ||
            currentStatus === "delivered"
        ) {
            showToast(
                "Annulation impossible",
                "Cette commande ne peut plus être annulée.",
                "error"
            );
            return;
        }

        openModal(cancelModal);
    });
}

if (closeStatusModal) {
    closeStatusModal.addEventListener("click", () => {
        closeModal(statusModal);
    });
}

if (closeCancelModal) {
    closeCancelModal.addEventListener("click", () => {
        closeModal(cancelModal);
    });
}

if (keepOrderBtn) {
    keepOrderBtn.addEventListener("click", () => {
        closeModal(cancelModal);
    });
}

document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !actionInProgress) {
        closeModal(statusModal);
        closeModal(cancelModal);
    }
});

/* =========================================
   CHANGE ORDER STATUS
========================================= */

async function requestStatusChange(newStatus) {
    if (!currentOrder || actionInProgress) return;

    const allowed =
        ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
        showToast(
            "Modification impossible",
            "Cette transition de statut n'est pas autorisée.",
            "error"
        );
        return;
    }

    setActionLoading(true);

    try {
        await apiRequest(
            `${API_URL}/${encodeURIComponent(orderId)}/edit`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        closeModal(statusModal);

        const reloaded = await loadOrderDetails();

        if (reloaded) {
            showToast(
                "Statut modifié",
                `La commande est maintenant : ${getStatusLabel(currentStatus)}.`,
                "success"
            );
        }
    } catch (error) {
        console.error("Erreur modification statut :", error);

        showToast(
            "Échec de la modification",
            error.message || "Impossible de modifier le statut.",
            "error"
        );
    } finally {
        setActionLoading(false);
        renderStatus(currentStatus);
    }
}

document.querySelectorAll(".status-options button").forEach(button => {
    button.addEventListener("click", () => {
        const newStatus = button.dataset.status;

        if (newStatus) {
            requestStatusChange(newStatus);
        }
    });
});

/* =========================================
   CANCEL ORDER & RESTORE STOCK
========================================= */

async function confirmOrderCancellation() {
    if (!currentOrder || actionInProgress) return;

    if (
        currentStatus === "cancelled" ||
        currentStatus === "shipped" ||
        currentStatus === "delivered"
    ) {
        closeModal(cancelModal);

        showToast(
            "Annulation impossible",
            "Cette commande ne peut plus être annulée.",
            "error"
        );
        return;
    }

    setActionLoading(true);

    try {
        await apiRequest(
            `${API_URL}/${encodeURIComponent(orderId)}/cancel`,
            {
                method: "PATCH",
                body: JSON.stringify({})
            }
        );

        closeModal(cancelModal);

        const reloaded = await loadOrderDetails();

        if (reloaded) {
            showToast(
                "Commande annulée",
                "La commande a été annulée et le stock a été restauré.",
                "success"
            );
        }
    } catch (error) {
        console.error("Erreur annulation commande :", error);

        showToast(
            "Échec de l'annulation",
            error.message || "Impossible d'annuler la commande.",
            "error"
        );
    } finally {
        setActionLoading(false);
        renderStatus(currentStatus);
    }
}

if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener(
        "click",
        confirmOrderCancellation
    );
}

/* =========================================
   INITIALIZATION
========================================= */

loadOrderDetails();
