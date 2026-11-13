/* =========================
   SIDEBAR
========================= */

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}


/* =========================
   ELEMENTS
========================= */

const productForm = document.getElementById("productForm");

const photoInput = document.getElementById("photoInput");
const photosGrid = document.getElementById("photosGrid");
const addPhoto = document.querySelector(".add-photo");

const priceInput = document.getElementById("price");
const discountInput = document.getElementById("discount");
const finalPrice = document.getElementById("finalPrice");

const addVariantBtn = document.getElementById("addVariantBtn");
const variantsContainer = document.getElementById("variantsContainer");
const variantEmpty = document.getElementById("variantEmpty");

const totalStock = document.getElementById("totalStock");
const totalVariants = document.getElementById("totalVariants");
const availableVariants = document.getElementById("availableVariants");
const unavailableVariants = document.getElementById("unavailableVariants");

const photoCount = document.getElementById("photoCount");
const summaryVariants = document.getElementById("summaryVariants");
const summaryStock = document.getElementById("summaryStock");

const productStatus = document.getElementById("productStatus");

const toast = document.getElementById("toast");


/* =========================
   PHOTOS
========================= */

let photoItems = [];


function createPhotoItem(file) {

    const photo = document.createElement("div");

    photo.className = "photo-item";

    /*
       Keep the original File object.
       We need it later to send the image
       to the backend as Base64.
    */
    photo.file = file;

    const image = document.createElement("img");

    image.src = URL.createObjectURL(file);

    image.alt = "Photo produit";

    const badge = document.createElement("span");

    badge.className = "main-photo";

    badge.textContent = "Photo principale";

    const actions = document.createElement("div");

    actions.className = "photo-actions";


    /* =========================
       MAIN PHOTO BUTTON
    ========================= */

    const mainButton = document.createElement("button");

    mainButton.type = "button";

    mainButton.className = "photo-action";

    mainButton.title =
        "Définir comme photo principale";

    mainButton.innerHTML = `
        <i class="fa-solid fa-star"></i>
    `;


    /* =========================
       DELETE BUTTON
    ========================= */

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
        "photo-action delete-photo";

    deleteButton.title =
        "Supprimer la photo";

    deleteButton.innerHTML = `
        <i class="fa-solid fa-trash"></i>
    `;


    actions.appendChild(mainButton);
    actions.appendChild(deleteButton);

    photo.appendChild(image);
    photo.appendChild(actions);


    /* =========================
       SET MAIN
    ========================= */

    mainButton.addEventListener("click", () => {

        document
            .querySelectorAll(".photo-item")
            .forEach(item => {

                item.classList.remove("is-main");

                const oldBadge =
                    item.querySelector(".main-photo");

                if (oldBadge) {
                    oldBadge.remove();
                }
            });


        photo.classList.add("is-main");

        photo.insertAdjacentElement(
            "afterbegin",
            badge
        );
    });


    /* =========================
       DELETE PHOTO
    ========================= */

    deleteButton.addEventListener("click", () => {

        const wasMain =
            photo.classList.contains("is-main");

        const index =
            photoItems.indexOf(photo);

        if (index !== -1) {
            photoItems.splice(index, 1);
        }

        photo.remove();


        if (wasMain && photoItems.length > 0) {
            setMainPhoto(photoItems[0]);
        }

        updatePhotoSummary();
    });


    photoItems.push(photo);

    return photo;
}


function setMainPhoto(photo) {

    document
        .querySelectorAll(".photo-item")
        .forEach(item => {

            item.classList.remove("is-main");

            const badge =
                item.querySelector(".main-photo");

            if (badge) {
                badge.remove();
            }
        });


    photo.classList.add("is-main");


    const badge =
        document.createElement("span");

    badge.className = "main-photo";

    badge.textContent =
        "Photo principale";


    photo.insertAdjacentElement(
        "afterbegin",
        badge
    );
}


photoInput.addEventListener("change", () => {

    const files =
        Array.from(photoInput.files);

    files.forEach(file => {

        if (!file.type.startsWith("image/")) {
            return;
        }

        const photo =
            createPhotoItem(file);

        photosGrid.insertBefore(
            photo,
            addPhoto
        );
    });


    if (
        photoItems.length > 0 &&
        !document.querySelector(
            ".photo-item.is-main"
        )
    ) {
        setMainPhoto(photoItems[0]);
    }

    updatePhotoSummary();

    /* Allow selecting same file again */
    photoInput.value = "";
});


function updatePhotoSummary() {

    const count =
        photoItems.length;

    if (photoCount) {
        photoCount.textContent =
            count;
    }
}


/* =========================
   CONVERT FILE TO BASE64
========================= */

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = () => {
            reject(
                new Error(
                    "Impossible de lire l'image."
                )
            );
        };

        reader.readAsDataURL(file);
    });
}


/* =========================
   PRICE
========================= */

function updateFinalPrice() {

    const price =
        Number(priceInput.value) || 0;

    const discount =
        Number(discountInput.value) || 0;


    const discountedPrice =
        price -
        (
            price *
            discount /
            100
        );


    finalPrice.textContent =
        `${Math.max(
            0,
            discountedPrice
        ).toLocaleString("fr-FR")} DZD`;
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
   VARIANTS
========================= */

function createVariant() {

    const row =
        document.createElement("div");

    row.className =
        "variant-row";


    /* =========================
       COLOR
    ========================= */

    const colorField =
        document.createElement("div");

    colorField.className =
        "variant-field";

    colorField.innerHTML = `
        <label>Couleur</label>

        <input
            type="text"
            class="variant-color"
            placeholder="Ex. Rouge"
        >
    `;


    /* =========================
       SIZE
    ========================= */

    const sizeField =
        document.createElement("div");

    sizeField.className =
        "variant-field";

    sizeField.innerHTML = `
        <label>Taille</label>

        <select class="variant-size">

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
    `;


    /* =========================
       STOCK
    ========================= */

    const stockField =
        document.createElement("div");

    stockField.className =
        "variant-field";

    stockField.innerHTML = `
        <label>Stock</label>

        <input
            type="number"
            class="variant-stock"
            min="0"
            value="0"
        >
    `;


    /* =========================
       STATUS
    ========================= */

    const statusField =
        document.createElement("div");

    statusField.className =
        "variant-field";

    statusField.innerHTML = `
        <label>Statut</label>

        <div class="variant-status unavailable">
            Indisponible
        </div>
    `;


    /* =========================
       DELETE
    ========================= */

    const deleteField =
        document.createElement("div");

    deleteField.className =
        "variant-delete";

    deleteField.innerHTML = `
        <button
            type="button"
            class="remove-variant"
            title="Supprimer la variante"
        >
            <i class="fa-solid fa-trash"></i>
        </button>
    `;


    row.appendChild(colorField);
    row.appendChild(sizeField);
    row.appendChild(stockField);
    row.appendChild(statusField);
    row.appendChild(deleteField);


    /* Insert before empty state */

    variantsContainer.insertBefore(
        row,
        variantEmpty
    );


    /* =========================
       STOCK CHANGE
    ========================= */

    const stockInput =
        row.querySelector(".variant-stock");

    stockInput.addEventListener(
        "input",
        () => {
            updateVariant(row);
        }
    );


    /* =========================
       DELETE VARIANT
    ========================= */

    row
        .querySelector(".remove-variant")
        .addEventListener(
            "click",
            () => {

                row.remove();

                updateVariants();
            }
        );


    updateVariant(row);
    updateVariants();
}


/* =========================
   UPDATE ONE VARIANT
========================= */

function updateVariant(row) {

    const stockInput =
        row.querySelector(
            ".variant-stock"
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


    if (stock <= 0) {

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


    updateVariants();
}


/* =========================
   UPDATE ALL VARIANTS
========================= */

function updateVariants() {

    const rows =
        Array.from(
            variantsContainer.querySelectorAll(
                ".variant-row"
            )
        );


    const count =
        rows.length;


    let stock = 0;
    let available = 0;
    let unavailable = 0;


    rows.forEach(row => {

        const stockInput =
            row.querySelector(
                ".variant-stock"
            );

        const value =
            Number(stockInput.value) || 0;


        stock += value;


        if (value > 0) {
            available++;
        } else {
            unavailable++;
        }
    });


    /* =========================
       EMPTY STATE
    ========================= */

    if (count === 0) {

        variantEmpty.style.display =
            "flex";

    } else {

        variantEmpty.style.display =
            "none";
    }


    /* =========================
       STOCK SUMMARY
    ========================= */

    totalStock.textContent =
        stock;

    totalVariants.textContent =
        count;

    availableVariants.textContent =
        available;

    unavailableVariants.textContent =
        unavailable;


    /* RIGHT SIDE SUMMARY */

    summaryVariants.textContent =
        count;

    summaryStock.textContent =
        stock;


    /* PRODUCT STATUS */

    updateProductStatus(stock);
}


/* =========================
   PRODUCT STATUS
========================= */

function updateProductStatus(stock) {

    const dot =
        productStatus.querySelector(
            ".status-dot"
        );

    const title =
        productStatus.querySelector(
            "strong"
        );

    const description =
        productStatus.querySelector(
            "small"
        );


    if (stock <= 0) {

        dot.style.background =
            "#9aa2ae";

        title.textContent =
            "Indisponible";

        description.textContent =
            "Ajoutez du stock pour rendre le produit disponible.";

    } else if (stock <= 5) {

        dot.style.background =
            "#c77700";

        title.textContent =
            "Stock faible";

        description.textContent =
            "Le stock du produit est actuellement faible.";

    } else {

        dot.style.background =
            "#16864a";

        title.textContent =
            "Disponible";

        description.textContent =
            "Le produit peut être vendu.";
    }
}


/* =========================
   ADD VARIANT BUTTON
========================= */

addVariantBtn.addEventListener(
    "click",
    createVariant
);


/* =========================
   FORM SUBMIT
========================= */

productForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /* =========================
           BASIC DATA
        ========================= */

        const name =
            document
                .getElementById("productName")
                .value
                .trim();

        const category =
            document.getElementById(
                "category"
            ).value;

        const description =
            document.getElementById(
                "description"
            ).value.trim();

        const price =
            Number(
                priceInput.value
            );

        const discount =
            Number(
                discountInput.value
            ) || 0;


        /* =========================
           BASIC VALIDATION
        ========================= */

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
            variantRows.map(row => {

                const color =
                    row
                        .querySelector(
                            ".variant-color"
                        )
                        .value
                        .trim();

                const size =
                    row
                        .querySelector(
                            ".variant-size"
                        )
                        .value;

                const stock =
                    Number(
                        row
                            .querySelector(
                                ".variant-stock"
                            )
                            .value
                    ) || 0;

                return {
                    color,
                    size,
                    stock
                };
            });


        /* =========================
           IMAGES
        ========================= */

        let images = [];

        try {

            images =
                await Promise.all(
                    photoItems.map(
                        async photo => {

                            const imageUrl =
                                await fileToBase64(
                                    photo.file
                                );

                            return {
                                image_url:
                                    imageUrl,

                                is_main:
                                    photo.classList.contains(
                                        "is-main"
                                    )
                            };
                        }
                    )
                );

        } catch (error) {

            console.error(
                "Image conversion error:",
                error
            );

            alert(
                "Impossible de préparer les images."
            );

            return;
        }


        /* =========================
           PAYLOAD
        ========================= */

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
        ========================= */

        const submitButton =
            productForm.querySelector(
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
                Ajout en cours...
            `;
        }


        /* =========================
           SEND TO BACKEND
        ========================= */

        try {

            const response =
                await fetch(
                    "http://localhost:5000/api/products/create",
                    {
                        method: "POST",

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
                    "Erreur lors de la création du produit."
                );
            }


            /* =========================
               SUCCESS
            ========================= */

            toast.classList.add("show");


            setTimeout(() => {

                window.location.href =
                    "products.html";

            }, 1800);


        } catch (error) {

            console.error(
                "Create product error:",
                error
            );


            alert(
                error.message ||
                "Impossible de créer le produit."
            );


            /* Restore button */

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
   INITIAL STATE
========================= */

updateFinalPrice();

updateVariants();

updatePhotoSummary();
