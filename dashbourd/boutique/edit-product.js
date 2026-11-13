document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       MOBILE SIDEBAR
    ========================== */

    const menuBtn =
        document.getElementById("menuBtn");

    const sidebar =
        document.getElementById("sidebar");

    if (menuBtn && sidebar) {

        menuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });

    }


    /* =========================
       PRODUCT ID
    ========================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const productId =
        params.get("id");


    if (!productId) {

        window.location.href =
            "products.html";

        return;
    }


    /* =========================
       ELEMENTS
    ========================== */

    const form =
        document.getElementById("productForm");

    const toast =
        document.getElementById("toast");

    const priceInput =
        document.getElementById("price");

    const discountInput =
        document.getElementById("discount");

    const finalPrice =
        document.getElementById("finalPrice");

    const variantsContainer =
        document.getElementById(
            "variantsContainer"
        );

    const addVariantBtn =
        document.getElementById(
            "addVariantBtn"
        );

    const photoInput =
        document.getElementById(
            "photoInput"
        );

    const photoGrid =
        document.getElementById(
            "photoGrid"
        );


    /* =========================
       PRICE CALCULATION
    ========================== */

    function updateFinalPrice() {

        const price =
            Number(priceInput.value) || 0;

        const discount =
            Number(discountInput.value) || 0;

        const result =
            price -
            (
                price *
                discount /
                100
            );

        finalPrice.textContent =
            `${Math.round(result)
                .toLocaleString("fr-FR")} DZD`;
    }


    priceInput.addEventListener(
        "input",
        updateFinalPrice
    );

    discountInput.addEventListener(
        "input",
        updateFinalPrice
    );


    /* =========================
       VARIANT STATUS
    ========================== */

    function updateVariantStatus(row) {

        const stockInput =
            row.querySelector(
                ".stock-input"
            );

        const status =
            row.querySelector(
                ".variant-status"
            );

        const stock =
            Number(stockInput.value) || 0;


        status.classList.remove(
            "available",
            "low",
            "unavailable"
        );


        if (stock === 0) {

            status.textContent =
                "Indisponible";

            status.classList.add(
                "unavailable"
            );

        } else if (stock <= 5) {

            status.textContent =
                "Stock faible";

            status.classList.add(
                "low"
            );

        } else {

            status.textContent =
                "Disponible";

            status.classList.add(
                "available"
            );
        }

        updateStockSummary();
    }


    /* =========================
       STOCK SUMMARY
    ========================== */

    function updateStockSummary() {

        const rows =
            variantsContainer.querySelectorAll(
                ".variant-row"
            );

        let totalStock = 0;
        let available = 0;

        rows.forEach(row => {

            const stockInput =
                row.querySelector(
                    ".stock-input"
                );

            const stock =
                Number(stockInput.value) || 0;

            totalStock += stock;

            if (stock > 0) {
                available++;
            }
        });


        const totalStockElement =
            document.getElementById(
                "totalStock"
            );

        const variantCountElement =
            document.getElementById(
                "variantCount"
            );

        const availableCountElement =
            document.getElementById(
                "availableCount"
            );


        if (totalStockElement) {
            totalStockElement.textContent =
                totalStock;
        }

        if (variantCountElement) {
            variantCountElement.textContent =
                rows.length;
        }

        if (availableCountElement) {
            availableCountElement.textContent =
                available;
        }
    }


    /* =========================
       SETUP VARIANT
    ========================== */

    function setupVariant(row) {

        const stockInput =
            row.querySelector(
                ".stock-input"
            );

        const removeBtn =
            row.querySelector(
                ".remove-variant"
            );


        if (stockInput) {

            stockInput.addEventListener(
                "input",
                () => {
                    updateVariantStatus(row);
                }
            );

        }


        if (removeBtn) {

            removeBtn.addEventListener(
                "click",
                () => {

                    row.remove();

                    updateStockSummary();
                }
            );

        }


        updateVariantStatus(row);
    }


    /* =========================
       ADD VARIANT
    ========================== */

    function addVariant() {

        const row =
            document.createElement("div");

        row.className =
            "variant-row";

        row.innerHTML = `

            <div>

                <div class="color-input">

                

                    <input
                        type="text"
                        value="Bleu"
                        class="color-name-input">

                </div>

            </div>


            <div>

                <select class="size-input">

                    <option selected>S</option>
                    <option>M</option>
                    <option>L</option>
                    <option>XL</option>
                    <option>XXL</option>

                </select>

            </div>


            <div>

                <input
                    type="number"
                    class="stock-input"
                    value="0"
                    min="0">

            </div>


            <div>

                <span class="variant-status unavailable">
                    Indisponible
                </span>

            </div>


            <div>

                <button
                    type="button"
                    class="remove-variant"
                    title="Supprimer">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        `;


        variantsContainer.appendChild(
            row
        );

        setupVariant(row);

        updateStockSummary();
    }


    /* =========================
       INITIAL VARIANTS
    ========================== */

    document
        .querySelectorAll(
            "#variantsContainer .variant-row"
        )
        .forEach(row => {

            setupVariant(row);

        });


    if (addVariantBtn) {

        addVariantBtn.addEventListener(
            "click",
            addVariant
        );

    }


    /* =========================
       PHOTOS
    ========================== */

    function setupPhoto(photo) {

        const deleteBtn =
            photo.querySelector(
                ".delete-photo"
            );

        const mainBtn =
            photo.querySelector(
                ".set-main"
            );


        if (deleteBtn) {

            deleteBtn.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    photo.remove();

                    updateMainPhoto();
                }
            );

        }


        if (mainBtn) {

            mainBtn.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    setMainPhoto(photo);
                }
            );

        }
    }


    /* =========================
       SET MAIN PHOTO
    ========================== */

    function setMainPhoto(photo) {

        document
            .querySelectorAll(
                ".photo-item"
            )
            .forEach(item => {

                item.classList.remove(
                    "is-main"
                );

                const badge =
                    item.querySelector(
                        ".main-photo"
                    );

                if (badge) {
                    badge.remove();
                }

            });


        photo.classList.add(
            "is-main"
        );


        const badge =
            document.createElement(
                "span"
            );

        badge.className =
            "main-photo";

        badge.textContent =
            "Photo principale";


        photo.appendChild(
            badge
        );
    }


    /* =========================
       KEEP MAIN PHOTO
    ========================== */

    function updateMainPhoto() {

        const photos =
            document.querySelectorAll(
                ".photo-item"
            );

        if (photos.length === 0) {
            return;
        }


        const currentMain =
            document.querySelector(
                ".photo-item.is-main"
            );


        if (currentMain) {
            return;
        }


        setMainPhoto(
            photos[0]
        );
    }


    /* =========================
       ADD NEW PHOTOS
    ========================== */

    photoInput.addEventListener(
        "change",
        event => {

            const files =
                Array.from(
                    event.target.files
                );


            files.forEach(file => {

                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {
                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (e) {

                        const photo =
                            document.createElement(
                                "div"
                            );

                        photo.className =
                            "photo-item";


                        /*
                         * Keep the Base64 image
                         * on the element.
                         */

                        photo.dataset.image =
                            e.target.result;


                        photo.innerHTML = `

                            <img
                                src="${e.target.result}"
                                alt="Photo du produit">

                            <div class="photo-actions">

                                <button
                                    type="button"
                                    class="photo-btn delete-photo"
                                    title="Supprimer">

                                    <i class="fa-solid fa-trash"></i>

                                </button>

                                <button
                                    type="button"
                                    class="photo-btn set-main"
                                    title="Définir comme principale">

                                    <i class="fa-solid fa-star"></i>

                                </button>

                            </div>

                        `;


                        const addPhoto =
                            document.querySelector(
                                ".add-photo"
                            );


                        photoGrid.insertBefore(
                            photo,
                            addPhoto
                        );


                        setupPhoto(
                            photo
                        );


                        const photoCount =
                            document.querySelectorAll(
                                ".photo-item"
                            ).length;


                        if (
                            photoCount === 1
                        ) {

                            setMainPhoto(
                                photo
                            );

                        }

                    };


                reader.readAsDataURL(
                    file
                );

            });


            photoInput.value = "";
        }
    );


    /* =========================
       INITIAL PHOTOS
    ========================== */

    document
        .querySelectorAll(
            ".photo-item"
        )
        .forEach(photo => {

            setupPhoto(
                photo
            );

        });


    updateMainPhoto();


    /* =========================
       FILE → BASE64
    ========================== */

    function fileToBase64(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();

                reader.onload =
                    () => {
                        resolve(
                            reader.result
                        );
                    };

                reader.onerror =
                    () => {
                        reject(
                            new Error(
                                "Impossible de lire l'image."
                            )
                        );
                    };

                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    /* =========================
       LOAD PRODUCT
    ========================== */

    async function loadProduct() {

        try {

            const response =
                await fetch(
                    `http://localhost:5000/api/products/${productId}`
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Produit introuvable."
                );
            }


            const product =
                result.data;


            fillProductForm(
                product
            );


        } catch (error) {

            console.error(
                "Load product error:",
                error
            );

            alert(
                "Impossible de charger le produit."
            );

            window.location.href =
                "products.html";
        }
    }


    /* =========================
       FILL PRODUCT FORM
    ========================== */

    function fillProductForm(product) {

        /* =========================
           BASIC INFO
        ========================== */

        document.getElementById(
            "productName"
        ).value =
            product.name || "";


        document.getElementById(
            "category"
        ).value =
            product.category || "";


        priceInput.value =
            product.price || 0;


        discountInput.value =
            product.discount || 0;


        document.getElementById(
            "description"
        ).value =
            product.description || "";


        updateFinalPrice();


        /* =========================
           BREADCRUMB
        ========================== */

        const productLink =
            document.querySelector(
                ".breadcrumb a:nth-of-type(2)"
            );


        if (productLink) {

            productLink.textContent =
                product.name ||
                "Produit";

            productLink.href =
                `product-details.html?id=${product.id}`;
        }


        /* =========================
           PHOTOS
        ========================= */

        renderProductPhotos(
            product.images || []
        );


        /* =========================
           VARIANTS
        ========================== */

        renderProductVariants(
            product.variants || []
        );
    }


    /* =========================
       RENDER PRODUCT PHOTOS
    ========================== */

    function renderProductPhotos(images) {

        document
            .querySelectorAll(
                ".photo-item"
            )
            .forEach(photo => {

                photo.remove();

            });


        if (
            !Array.isArray(images) ||
            images.length === 0
        ) {

            return;
        }


        const addPhoto =
            document.querySelector(
                ".add-photo"
            );


        images.forEach(
            (image, index) => {

                const photo =
                    document.createElement(
                        "div"
                    );

                photo.className =
                    "photo-item";


                if (
                    Number(image.is_main) === 1
                ) {

                    photo.classList.add(
                        "is-main"
                    );

                }


                photo.dataset.imageId =
                    image.id;

                photo.dataset.image =
                    image.image_url;


                photo.innerHTML = `

                    <img
                        src="${image.image_url}"
                        alt="Photo du produit">

                    <div class="photo-actions">

                        <button
                            type="button"
                            class="photo-btn delete-photo"
                            title="Supprimer">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                        <button
                            type="button"
                            class="photo-btn set-main"
                            title="Définir comme principale">

                            <i class="fa-solid fa-star"></i>

                        </button>

                    </div>

                    ${
                        Number(image.is_main) === 1
                            ? `
                                <span class="main-photo">
                                    Photo principale
                                </span>
                              `
                            : ""
                    }

                `;


                photo.dataset.existing =
                    "true";


                photoGrid.insertBefore(
                    photo,
                    addPhoto
                );


                setupPhoto(
                    photo
                );

            }
        );


        updateMainPhoto();
    }


    /* =========================
       RENDER PRODUCT VARIANTS
    ========================== */

    function renderProductVariants(
        variants
    ) {

        variantsContainer.innerHTML =
            "";


        if (
            !Array.isArray(variants) ||
            variants.length === 0
        ) {

            return;
        }


        variants.forEach(
            variant => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "variant-row";


                row.innerHTML = `

                    <div>

                        <div class="color-input">

                            <input
                                type="text"
                                value="${escapeHtml(
                                    variant.color || ""
                                )}"
                                class="color-name-input">

                        </div>

                    </div>


                    <div>

                        <select class="size-input">

                            <option value="">
                                Taille
                            </option>

                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>

                        </select>

                    </div>


                    <div>

                        <input
                            type="number"
                            class="stock-input"
                            value="${Number(
                                variant.stock
                            ) || 0}"
                            min="0">

                    </div>


                    <div>

                        <span class="variant-status">
                            Indisponible
                        </span>

                    </div>


                    <div>

                        <button
                            type="button"
                            class="remove-variant"
                            title="Supprimer">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                `;


                variantsContainer.appendChild(
                    row
                );


                const sizeInput =
                    row.querySelector(
                        ".size-input"
                    );


                sizeInput.value =
                    variant.size || "";


                setupVariant(
                    row
                );

            }
        );


        updateStockSummary();
    }


    /* =========================
       COLOR HEX
    ========================== */

    function getColorHex(color) {

        const value =
            String(
                color || ""
            )
                .toLowerCase()
                .trim();


        const colors = {

            rouge: "#ef4444",
            red: "#ef4444",

            noir: "#111827",
            black: "#111827",

            blanc: "#ffffff",
            white: "#ffffff",

            bleu: "#0057ff",
            blue: "#0057ff",

            vert: "#22c55e",
            green: "#22c55e",

            jaune: "#eab308",
            yellow: "#eab308",

            orange: "#f97316",

            violet: "#8b5cf6",
            purple: "#8b5cf6",

            rose: "#ec4899",
            pink: "#ec4899"
        };


        return colors[value] ||
            "#0057ff";
    }


    /* =========================
       ESCAPE HTML
    ========================== */

    function escapeHtml(value) {

        return String(
            value || ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    /* =========================
       FORM SUBMIT
    ========================== */

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /* =========================
               BASIC DATA
            ========================= */

            const name =
                document
                    .getElementById(
                        "productName"
                    )
                    .value
                    .trim();


            const category =
                document
                    .getElementById(
                        "category"
                    )
                    .value;


            const description =
                document
                    .getElementById(
                        "description"
                    )
                    .value
                    .trim();


            const price =
                Number(
                    priceInput.value
                );


            const discount =
                Number(
                    discountInput.value
                ) || 0;


            /* =========================
               VALIDATION
            ========================== */

            if (!name) {

                alert(
                    "Veuillez saisir le nom du produit."
                );

                return;
            }


            if (!category) {

                alert(
                    "Veuillez sélectionner une catégorie."
                );

                return;
            }


            if (
                Number.isNaN(price) ||
                price < 0
            ) {

                alert(
                    "Veuillez saisir un prix valide."
                );

                return;
            }


            /* =========================
               VARIANTS
            ========================= */

            const variantRows =
                Array.from(
                    variantsContainer.querySelectorAll(
                        ".variant-row"
                    )
                );


            const variants =
                variantRows.map(
                    row => {

                        const color =
                            row
                                .querySelector(
                                    ".color-name-input"
                                )
                                .value
                                .trim();


                        const size =
                            row
                                .querySelector(
                                    ".size-input"
                                )
                                .value;


                        const stock =
                            Number(
                                row
                                    .querySelector(
                                        ".stock-input"
                                    )
                                    .value
                            ) || 0;


                        return {
                            color,
                            size,
                            stock
                        };

                    }
                );


            /* =========================
               PHOTOS
            ========================== */

            const photoElements =
                Array.from(
                    document.querySelectorAll(
                        ".photo-item"
                    )
                );


            let images = [];


            try {

                images =
                    await Promise.all(
                        photoElements.map(
                            async photo => {

                                /*
                                 * Existing image:
                                 * use its current Base64/URL.
                                 */

                                if (
                                    photo.dataset.existing ===
                                    "true"
                                ) {

                                    return {

                                        image_url:
                                            photo.dataset.image,

                                        is_main:
                                            photo.classList.contains(
                                                "is-main"
                                            )
                                    };
                                }


                                /*
                                 * New image:
                                 * already stored as Base64
                                 * in data-image.
                                 */

                                if (
                                    photo.dataset.image
                                ) {

                                    return {

                                        image_url:
                                            photo.dataset.image,

                                        is_main:
                                            photo.classList.contains(
                                                "is-main"
                                            )
                                    };
                                }


                                return null;

                            }
                        )
                    );


                images =
                    images.filter(
                        Boolean
                    );

            } catch (error) {

                console.error(
                    "Image preparation error:",
                    error
                );

                alert(
                    "Impossible de préparer les images."
                );

                return;
            }


            /* =========================
               PAYLOAD
            ========================== */

            const productData = {

                name,

                category,

                description,

                price,

                discount,

                images,

                variants

            };


            /* =========================
               SUBMIT BUTTON
            ========================== */

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalButtonHTML =
                submitButton
                    ? submitButton.innerHTML
                    : "";


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Enregistrement...
                `;
            }


            /* =========================
               UPDATE BACKEND
            ========================== */

            try {

                const response =
                    await fetch(
                        `http://localhost:5000/api/products/${productId}/edit`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    productData
                                )
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
                        "Erreur lors de la modification."
                    );
                }


                /* =========================
                   SUCCESS
                ========================== */

                toast.classList.add(
                    "show"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            `product-details.html?id=${productId}`;

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Update product error:",
                    error
                );


                alert(
                    error.message ||
                    "Impossible de modifier le produit."
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML =
                        originalButtonHTML;
                }
            }

        }
    );


    /* =========================
       INITIAL LOAD
    ========================== */

    updateFinalPrice();

    updateStockSummary();

    loadProduct();

});