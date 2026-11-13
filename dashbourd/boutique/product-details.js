document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       MOBILE SIDEBAR
    ========================= */

    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }


    /* =========================
       GET PRODUCT ID
    ========================= */

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        window.location.href = "products.html";
        return;
    }


    /* =========================
       ELEMENTS
    ========================= */

    const mainImage = document.getElementById("mainImage");
    const thumbnailsContainer =
        document.querySelector(".thumbnails");

    const deleteBtn =
        document.getElementById("deleteBtn");

    const dangerDeleteBtn =
        document.getElementById("dangerDeleteBtn");

    const deleteModal =
        document.getElementById("deleteModal");

    const overlay =
        document.getElementById("overlay");

    const cancelDelete =
        document.getElementById("cancelDelete");

    const confirmDelete =
        document.getElementById("confirmDelete");

    const editBtn =
        document.querySelector('a[href="edit-product.html"]');


    /* =========================
       LOAD PRODUCT
    ========================= */

    async function loadProduct() {

        try {

            const response = await fetch(
                `http://localhost:5000/api/products/${productId}`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Produit introuvable"
                );
            }

            const product = result.data;

            renderProduct(product);

        } catch (error) {

            console.error(
                "Load product error:",
                error
            );

            alert("Impossible de charger le produit.");

            window.location.href = "products.html";
        }
    }


    /* =========================
       RENDER PRODUCT
    ========================= */

    function renderProduct(product) {

        /* =========================
           BASIC INFO
        ========================= */

        const title =
            document.querySelector(".page-header h1");

        const breadcrumb =
            document.querySelector(".breadcrumb span");

        if (title) {
            title.textContent =
                product.name || "Produit";
        }

        if (breadcrumb) {
            breadcrumb.textContent =
                product.name || "Produit";
        }

        /* =========================
           STATUS
        ========================= */

        const totalStock =
            getTotalStock(product);

        const status =
            getProductStatus(totalStock);

        const statusElement =
            document.querySelector(".page-header .status");

        if (statusElement) {

            statusElement.className =
                `status ${status.className}`;

            statusElement.innerHTML = `
                <span></span>
                ${status.text}
            `;
        }

        /* =========================
           EDIT LINK
        ========================= */

        if (editBtn) {
            editBtn.href =
                `edit-product.html?id=${product.id}`;
        }

        /* =========================
           INFORMATION
        ========================= */

        const infoItems =
            document.querySelectorAll(
                ".info-list .info-item"
            );

        if (infoItems.length >= 5) {

            infoItems[0]
                .querySelector("strong")
                .textContent =
                product.name || "—";

            infoItems[1]
                .querySelector("strong")
                .textContent =
                product.category || "—";

            infoItems[2]
                .querySelector("strong")
                .textContent =
                formatPrice(product.price);

            infoItems[3]
                .querySelector("strong")
                .textContent =
                `${Number(product.discount || 0)}%`;

            const finalPrice =
                calculateFinalPrice(
                    product.price,
                    product.discount
                );

            infoItems[4]
                .querySelector("strong")
                .textContent =
                formatPrice(finalPrice);
        }

        /* =========================
           DESCRIPTION
        ========================= */

        const description =
            document.querySelector(".description p");

        if (description) {
            description.textContent =
                product.description || "Aucune description.";
        }

        /* =========================
           IMAGES
        ========================= */

        renderImages(product.images || []);

        /* =========================
           VARIANTS
        ========================= */

        renderVariants(
            product.variants || []
        );
    }


    /* =========================
       IMAGES
    ========================= */

    function renderImages(images) {

        if (!mainImage || !thumbnailsContainer) {
            return;
        }

        thumbnailsContainer.innerHTML = "";

        if (!Array.isArray(images) || images.length === 0) {

            mainImage.src =
                "https://via.placeholder.com/1000x700?text=NIZAL";

            return;
        }

        const main =
            images.find(
                image => Number(image.is_main) === 1
            ) || images[0];

        mainImage.src =
            main.image_url;

        images.forEach((image, index) => {

            const button =
                document.createElement("button");

            button.className =
                "thumbnail";

            if (
                image.id === main.id ||
                index === 0
            ) {
                button.classList.add("active");
            }

            button.dataset.image =
                image.image_url;

            button.innerHTML = `
                <img
                    src="${image.image_url}"
                    alt="Photo du produit"
                >
            `;

            button.addEventListener(
                "click",
                () => {

                    mainImage.src =
                        image.image_url;

                    document
                        .querySelectorAll(".thumbnail")
                        .forEach(item => {
                            item.classList.remove("active");
                        });

                    button.classList.add("active");
                }
            );

            thumbnailsContainer.appendChild(button);
        });
    }


    /* =========================
       VARIANTS
    ========================= */

    function renderVariants(variants) {

        const tbody =
            document.querySelector(
                ".stock-card tbody"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = "";

        let totalStock = 0;
        let availableCount = 0;

        variants.forEach(variant => {

            const stock =
                Number(variant.stock) || 0;

            totalStock += stock;

            if (stock > 0) {
                availableCount++;
            }

            const status =
                getVariantStatus(stock);

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    <span class="color-name">

                        <span
                            class="color-dot ${getColorClass(
                                variant.color
                            )}">
                        </span>

                        ${escapeHtml(
                            variant.color || "—"
                        )}

                    </span>
                </td>

                <td>
                    ${escapeHtml(
                        variant.size || "—"
                    )}
                </td>

                <td class="stock-number ${
                    stock === 0
                        ? "zero"
                        : stock <= 5
                            ? "low"
                            : ""
                }">
                    ${stock}
                </td>

                <td>
                    <span
                        class="stock-status ${status.className}"
                    >
                        <span></span>
                        ${status.text}
                    </span>
                </td>
            `;

            tbody.appendChild(row);
        });

        /* =========================
           STOCK TOTAL
        ========================= */

        const stockTotal =
            document.querySelector(
                ".stock-total strong"
            );

        if (stockTotal) {
            stockTotal.textContent =
                `${totalStock} unités`;
        }

        /* =========================
           SUMMARY CARDS
        ========================= */

        const summaryCards =
            document.querySelectorAll(
                ".summary-card"
            );

        if (summaryCards.length >= 3) {

            summaryCards[0]
                .querySelector("strong")
                .textContent =
                totalStock;

            summaryCards[1]
                .querySelector("strong")
                .textContent =
                variants.length;

            summaryCards[2]
                .querySelector("strong")
                .textContent =
                availableCount;
        }
    }


    /* =========================
       STOCK STATUS
    ========================= */

    function getProductStatus(stock) {

        if (stock === 0) {
            return {
                className: "unavailable",
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


    function getVariantStatus(stock) {

        if (stock === 0) {
            return {
                className: "unavailable",
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


    /* =========================
       TOTAL STOCK
    ========================= */

    function getTotalStock(product) {

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


    /* =========================
       FINAL PRICE
    ========================= */

    function calculateFinalPrice(
        price,
        discount
    ) {

        const originalPrice =
            Number(price) || 0;

        const discountValue =
            Number(discount) || 0;

        return (
            originalPrice -
            (
                originalPrice *
                discountValue /
                100
            )
        );
    }


    /* =========================
       FORMAT PRICE
    ========================= */

    function formatPrice(price) {

        return Number(price || 0)
            .toLocaleString("fr-FR") +
            " DZD";
    }


    /* =========================
       COLOR CLASS
    ========================= */

    function getColorClass(color) {

        const value =
            String(color || "")
                .toLowerCase()
                .trim();

        if (
            value.includes("rouge") ||
            value.includes("red")
        ) {
            return "red";
        }

        if (
            value.includes("noir") ||
            value.includes("black")
        ) {
            return "black";
        }

        if (
            value.includes("blanc") ||
            value.includes("white")
        ) {
            return "white";
        }

        if (
            value.includes("bleu") ||
            value.includes("blue")
        ) {
            return "blue";
        }

        if (
            value.includes("vert") ||
            value.includes("green")
        ) {
            return "green";
        }

        if (
            value.includes("jaune") ||
            value.includes("yellow")
        ) {
            return "yellow";
        }

        return "";
    }


    /* =========================
       ESCAPE HTML
    ========================= */

    function escapeHtml(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================
       DELETE MODAL
    ========================= */

    function openDeleteModal() {

        if (deleteModal) {
            deleteModal.classList.add("show");
        }

        if (overlay) {
            overlay.classList.add("show");
        }

        document.body.style.overflow =
            "hidden";
    }


    function closeDeleteModal() {

        if (deleteModal) {
            deleteModal.classList.remove("show");
        }

        if (overlay) {
            overlay.classList.remove("show");
        }

        document.body.style.overflow = "";
    }


    if (deleteBtn) {
        deleteBtn.addEventListener(
            "click",
            openDeleteModal
        );
    }

    if (dangerDeleteBtn) {
        dangerDeleteBtn.addEventListener(
            "click",
            openDeleteModal
        );
    }

    if (cancelDelete) {
        cancelDelete.addEventListener(
            "click",
            closeDeleteModal
        );
    }

    if (overlay) {
        overlay.addEventListener(
            "click",
            closeDeleteModal
        );
    }


    /* =========================
       DELETE PRODUCT
    ========================= */

    if (confirmDelete) {

        confirmDelete.addEventListener(
            "click",
            async () => {

                confirmDelete.disabled = true;

                confirmDelete.textContent =
                    "Suppression...";

                try {

                    const response =
                        await fetch(
                            `http://localhost:5000/api/products/${productId}/delete`,
                            {
                                method: "DELETE"
                            }
                        );

                    const result =
                        await response.json();

                    if (
                        !response.ok ||
                        !result.success
                    ) {
                        throw new Error(
                            result.message ||
                            "Erreur lors de la suppression"
                        );
                    }

                    window.location.href =
                        "products.html";

                } catch (error) {

                    console.error(
                        "Delete product error:",
                        error
                    );

                    alert(
                        "Impossible de supprimer le produit."
                    );

                    confirmDelete.disabled =
                        false;

                    confirmDelete.textContent =
                        "Supprimer";
                }
            }
        );
    }


    /* =========================
       ESCAPE KEY
    ========================= */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                closeDeleteModal();
            }

        }
    );


    /* =========================
       START
    ========================= */

    loadProduct();

});

