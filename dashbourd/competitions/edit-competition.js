// ===============================
// GET COMPETITION ID
// ===============================

console.log("EDIT PAGE URL:", window.location.href);
console.log("EDIT PAGE QUERY:", window.location.search);

const params = new URLSearchParams(window.location.search);
const competitionId = params.get("id");

console.log("Competition ID:", competitionId);


// ===============================
// ELEMENTS
// ===============================

const form =
    document.getElementById("competitionForm");

const categoryList =
    document.getElementById("categoryList");

const addCategory =
    document.getElementById("addCategory");

const documentsList =
    document.getElementById("documentsList");

const addDocument =
    document.getElementById("addDocument");


// ===============================
// COVER IMAGE ELEMENTS
// ===============================

const coverImageInput =
    document.getElementById("coverImage");

const coverImagePreview =
    document.getElementById("coverImagePreview");

const coverImagePlaceholder =
    document.getElementById("coverImagePlaceholder");

const removeCoverImageBtn =
    document.getElementById("removeCoverImage");


// ===============================
// COVER IMAGE STATE
// ===============================

let currentCoverImage = null;

// Base64 of newly selected image
let selectedCoverImageFile = null;

// True when admin clicks "Supprimer"
let coverImageRemoved = false;


// ===============================
// MOBILE SIDEBAR
// ===============================

const mobileMenu =
    document.querySelector(".mobile-menu");

const sidebar =
    document.querySelector(".sidebar");


if (mobileMenu) {

    mobileMenu.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}


// ===============================
// CHECK ID
// ===============================

if (!competitionId) {

    alert("Compétition introuvable.");

    window.location.href =
        "competitions.html";

}


// ===============================
// COVER IMAGE - SELECT
// ===============================

if (coverImageInput) {

    coverImageInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }


            // =========================
            // CHECK FILE TYPE
            // =========================

            if (!file.type.startsWith("image/")) {

                alert(
                    "Veuillez sélectionner une image valide."
                );

                coverImageInput.value = "";

                return;
            }


            // =========================
            // CHECK FILE SIZE
            // =========================

            const maxSize =
                5 * 1024 * 1024;

            if (file.size > maxSize) {

                alert(
                    "L'image ne doit pas dépasser 5 MB."
                );

                coverImageInput.value = "";

                return;
            }


            // =========================
            // CONVERT IMAGE TO BASE64
            // =========================

            const reader =
                new FileReader();


            reader.onload = event => {

                const base64Image =
                    event.target.result;


                // Save Base64
                selectedCoverImageFile =
                    base64Image;


                // New image is selected
                coverImageRemoved =
                    false;


                // =========================
                // PREVIEW
                // =========================

                if (coverImagePreview) {

                    coverImagePreview.src =
                        base64Image;

                    coverImagePreview.style.display =
                        "block";

                }


                if (coverImagePlaceholder) {

                    coverImagePlaceholder.style.display =
                        "none";

                }


                console.log(
                    "Cover image converted to Base64."
                );

                console.log(
                    "Image size:",
                    Math.round(
                        base64Image.length / 1024
                    ),
                    "KB"
                );

            };


            reader.onerror = () => {

                alert(
                    "Impossible de lire l'image."
                );

                coverImageInput.value = "";

                selectedCoverImageFile =
                    null;

            };


            reader.readAsDataURL(file);

        }
    );

}


// ===============================
// COVER IMAGE - REMOVE
// ===============================

if (removeCoverImageBtn) {

    removeCoverImageBtn.addEventListener(
        "click",
        () => {

            // Remove selected new image
            selectedCoverImageFile =
                null;


            // Remove existing image
            currentCoverImage =
                null;


            // Mark image as removed
            coverImageRemoved =
                true;


            // Reset input
            if (coverImageInput) {

                coverImageInput.value = "";

            }


            // Hide preview
            if (coverImagePreview) {

                coverImagePreview.src = "";

                coverImagePreview.style.display =
                    "none";

            }


            // Show placeholder
            if (coverImagePlaceholder) {

                coverImagePlaceholder.style.display =
                    "flex";

            }

        }
    );

}


// ===============================
// LOAD COMPETITION
// ===============================

async function loadCompetition() {

    try {

        const response =
            await fetch(
                `http://localhost:5000/api/competitions/${competitionId}`
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Failed to load competition"
            );

        }


        console.log(
            "Competition loaded:",
            result.data
        );


        populateForm(
            result.data
        );


    } catch (error) {

        console.error(
            "Error loading competition:",
            error
        );


        alert(
            "Impossible de charger la compétition."
        );


        window.location.href =
            "competitions.html";

    }

}


// ===============================
// POPULATE FORM
// ===============================

function populateForm(competition) {

    document.title =
        `Modifier ${competition.name} — NIZAL`;


    // =========================
    // GENERAL
    // =========================

    document.getElementById(
        "competitionName"
    ).value =
        competition.name || "";


    document.getElementById(
        "sport"
    ).value =
        competition.sport || "";


    document.getElementById(
        "discipline"
    ).value =
        competition.discipline || "";


    document.getElementById(
        "description"
    ).value =
        competition.description || "";


    // =========================
    // COVER IMAGE
    // =========================

    currentCoverImage =
        competition.cover_image || null;


    coverImageRemoved =
        false;


    selectedCoverImageFile =
        null;


    if (currentCoverImage) {

        if (coverImagePreview) {

            coverImagePreview.src =
                currentCoverImage;

            coverImagePreview.style.display =
                "block";

        }


        if (coverImagePlaceholder) {

            coverImagePlaceholder.style.display =
                "none";

        }

    } else {

        if (coverImagePreview) {

            coverImagePreview.src = "";

            coverImagePreview.style.display =
                "none";

        }


        if (coverImagePlaceholder) {

            coverImagePlaceholder.style.display =
                "flex";

        }

    }


    // =========================
    // DATE & LOCATION
    // =========================

    document.getElementById(
        "date"
    ).value =
        formatDateForInput(
            competition.start_date
        );


    document.getElementById(
        "startTime"
    ).value =
        formatTimeForInput(
            competition.start_time
        );


    document.getElementById(
        "endTime"
    ).value =
        formatTimeForInput(
            competition.end_time
        );


    document.getElementById(
        "location"
    ).value =
        competition.location || "";


    document.getElementById(
        "city"
    ).value =
        competition.city || "";


    document.getElementById(
        "organizer"
    ).value =
        competition.organizer || "";


    // =========================
    // REGISTRATION
    // =========================

    document.getElementById(
        "openingDate"
    ).value =
        formatDateForInput(
            competition.opening_date
        );


    document.getElementById(
        "closingDate"
    ).value =
        formatDateForInput(
            competition.closing_date
        );


    document.getElementById(
        "registrationFee"
    ).value =
        competition.registration_fee || 0;


    document.getElementById(
        "maxParticipants"
    ).value =
        competition.max_participants || "";


    document.getElementById(
        "conditions"
    ).value =
        competition.eligibility || "";


    // =========================
    // CATEGORIES
    // =========================

    if (competition.categories) {

        renderCategories(
            competition.categories
        );

    }


    // =========================
    // DOCUMENTS
    // =========================

    if (competition.documents) {

        renderDocuments(
            competition.documents
        );

    }

}


// ===============================
// RENDER CATEGORIES
// ===============================

function renderCategories(categories) {

    categoryList.innerHTML = "";


    categories.forEach(category => {

        const item =
            document.createElement("div");


        item.className =
            "category-item";


        item.innerHTML = `

            <div class="category-grid">

                <div class="form-group">

                    <label>
                        Genre
                    </label>

                    <select class="category-gender">

                        <option value="Hommes">
                            Hommes
                        </option>

                        <option value="Femmes">
                            Femmes
                        </option>

                        <option value="Mixte">
                            Mixte
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Catégorie d'âge
                    </label>

                    <input
                        type="text"
                        class="category-age"
                        value="${escapeHtml(
                            category.age_category || ""
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Catégorie de poids
                    </label>

                    <input
                        type="text"
                        class="category-weight"
                        value="${escapeHtml(
                            category.weight_category || ""
                        )}"
                    >

                </div>


                <button
                    type="button"
                    class="remove-category"
                    title="Supprimer"
                >

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        `;


        const gender =
            item.querySelector(
                ".category-gender"
            );


        gender.value =
            category.gender ||
            "Hommes";


        categoryList.appendChild(
            item
        );

    });

}


// ===============================
// ADD CATEGORY
// ===============================

if (addCategory) {

    addCategory.addEventListener(
        "click",
        () => {

            const category =
                document.createElement("div");


            category.className =
                "category-item";


            category.innerHTML = `

                <div class="category-grid">

                    <div class="form-group">

                        <label>
                            Genre
                        </label>

                        <select class="category-gender">

                            <option value="Hommes">
                                Hommes
                            </option>

                            <option value="Femmes">
                                Femmes
                            </option>

                            <option value="Mixte">
                                Mixte
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Catégorie d'âge
                        </label>

                        <input
                            type="text"
                            class="category-age"
                            placeholder="Ex. 18 – 24 ans"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Catégorie de poids
                        </label>

                        <input
                            type="text"
                            class="category-weight"
                            placeholder="Ex. -66 kg"
                        >

                    </div>


                    <button
                        type="button"
                        class="remove-category"
                        title="Supprimer"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            `;


            categoryList.appendChild(
                category
            );

        }
    );

}


// ===============================
// REMOVE CATEGORY
// ===============================

categoryList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".remove-category"
            );


        if (!button) {
            return;
        }


        const item =
            button.closest(
                ".category-item"
            );


        if (item) {

            item.remove();

        }

    }
);


// ===============================
// RENDER DOCUMENTS
// ===============================

function renderDocuments(documents) {

    documentsList.innerHTML = "";


    documents.forEach(
        (documentData, index) => {

            const item =
                createDocumentElement(
                    documentData,
                    index + 1
                );


            documentsList.appendChild(
                item
            );

        }
    );

}


// ===============================
// CREATE DOCUMENT ELEMENT
// ===============================

function createDocumentElement(
    documentData = {},
    number
) {

    const documentItem =
        document.createElement("div");


    documentItem.className =
        "document-item";


    const maxFileSize =
        documentData.max_file_size || 5;


    documentItem.innerHTML = `

        <div class="document-header">

            <strong>
                Document ${number}
            </strong>

            <button
                type="button"
                class="remove-document"
            >

                <i class="fa-solid fa-trash"></i>

            </button>

        </div>


        <div class="form-grid">

            <div class="form-group">

                <label>
                    Nom du document
                </label>

                <input
                    type="text"
                    class="document-name"
                    value="${escapeHtml(
                        documentData.name || ""
                    )}"
                    placeholder="Ex. Licence sportive"
                >

            </div>


            <div class="form-group">

                <label>
                    Formats acceptés
                </label>

                <input
                    type="text"
                    class="document-formats"
                    value="${escapeHtml(
                        documentData.accepted_formats || ""
                    )}"
                    placeholder="PDF, JPG, PNG"
                >

            </div>


            <div class="form-group">

                <label>
                    Taille maximale
                </label>

                <select class="document-size">

                    <option value="2">
                        2 MB
                    </option>

                    <option value="5">
                        5 MB
                    </option>

                    <option value="10">
                        10 MB
                    </option>

                </select>

            </div>


            <div class="form-group full">

                <label>
                    Description / instructions
                </label>

                <textarea
                    class="document-description"
                    rows="3"
                    placeholder="Instructions pour le participant..."
                >${escapeHtml(
                    documentData.description || ""
                )}</textarea>

            </div>

        </div>


        <label class="checkbox">

            <input
                type="checkbox"
                class="document-required"
                ${documentData.is_required ? "checked" : ""}
            >

            <span>
                Document obligatoire
            </span>

        </label>

    `;


    const sizeSelect =
        documentItem.querySelector(
            ".document-size"
        );


    sizeSelect.value =
        String(maxFileSize);


    return documentItem;

}


// ===============================
// ADD DOCUMENT
// ===============================

if (addDocument) {

    addDocument.addEventListener(
        "click",
        () => {

            const documentNumber =
                documentsList.children.length + 1;


            const documentItem =
                createDocumentElement(
                    {},
                    documentNumber
                );


            documentsList.appendChild(
                documentItem
            );

        }
    );

}


// ===============================
// REMOVE DOCUMENT
// ===============================

documentsList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".remove-document"
            );


        if (!button) {
            return;
        }


        const item =
            button.closest(
                ".document-item"
            );


        if (item) {

            item.remove();

            refreshDocumentNumbers();

        }

    }
);


// ===============================
// REFRESH DOCUMENT NUMBERS
// ===============================

function refreshDocumentNumbers() {

    const documents =
        documentsList.querySelectorAll(
            ".document-item"
        );


    documents.forEach(
        (item, index) => {

            const title =
                item.querySelector(
                    ".document-header strong"
                );


            if (title) {

                title.textContent =
                    `Document ${index + 1}`;

            }

        }
    );

}


// ===============================
// COLLECT CATEGORIES
// ===============================

function collectCategories() {

    const items =
        categoryList.querySelectorAll(
            ".category-item"
        );


    return Array.from(items).map(
        item => {

            return {

                sport:
                    document.getElementById(
                        "sport"
                    ).value,

                discipline:
                    document.getElementById(
                        "discipline"
                    ).value.trim(),

                gender:
                    item.querySelector(
                        ".category-gender"
                    ).value,

                age_category:
                    item.querySelector(
                        ".category-age"
                    ).value.trim(),

                weight_category:
                    item.querySelector(
                        ".category-weight"
                    ).value.trim()

            };

        }
    );

}


// ===============================
// COLLECT DOCUMENTS
// ===============================

function collectDocuments() {

    const items =
        documentsList.querySelectorAll(
            ".document-item"
        );


    return Array.from(items).map(
        item => {

            return {

                name:
                    item.querySelector(
                        ".document-name"
                    ).value.trim(),

                description:
                    item.querySelector(
                        ".document-description"
                    ).value.trim(),

                is_required:
                    item.querySelector(
                        ".document-required"
                    ).checked,

                accepted_formats:
                    item.querySelector(
                        ".document-formats"
                    ).value.trim(),

                max_file_size:
                    Number(
                        item.querySelector(
                            ".document-size"
                        ).value
                    )

            };

        }
    );

}


// ===============================
// SUBMIT
// ===============================

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const submitButton =
            form.querySelector(
                'button[type="submit"]'
            );


        // =========================
        // COVER IMAGE
        // =========================

        let coverImageValue =
            currentCoverImage;


        // User removed image
        if (coverImageRemoved) {

            coverImageValue =
                null;

        }


        // User selected a NEW image
        if (
            selectedCoverImageFile &&
            !coverImageRemoved
        ) {

            coverImageValue =
                selectedCoverImageFile;

        }


        // =========================
        // DATA
        // =========================

        const data = {

            name:
                document.getElementById(
                    "competitionName"
                ).value.trim(),

            description:
                document.getElementById(
                    "description"
                ).value.trim(),

            sport:
                document.getElementById(
                    "sport"
                ).value,

            discipline:
                document.getElementById(
                    "discipline"
                ).value.trim(),

            // IMPORTANT:
            // This is now either:
            // - existing image URL
            // - Base64 new image
            // - null
            cover_image:
                coverImageValue,

            location:
                document.getElementById(
                    "location"
                ).value.trim(),

            city:
                document.getElementById(
                    "city"
                ).value.trim(),

            start_date:
                document.getElementById(
                    "date"
                ).value,

            start_time:
                document.getElementById(
                    "startTime"
                ).value,

            end_time:
                document.getElementById(
                    "endTime"
                ).value,

            organizer:
                document.getElementById(
                    "organizer"
                ).value.trim(),

            opening_date:
                document.getElementById(
                    "openingDate"
                ).value,

            closing_date:
                document.getElementById(
                    "closingDate"
                ).value,

            registration_fee:
                Number(
                    document.getElementById(
                        "registrationFee"
                    ).value
                ) || 0,

            max_participants:
                Number(
                    document.getElementById(
                        "maxParticipants"
                    ).value
                ) || null,

            eligibility:
                document.getElementById(
                    "conditions"
                ).value.trim(),

            categories:
                collectCategories(),

            documents:
                collectDocuments()

        };


        // =========================
        // DEBUG
        // =========================

        console.log(
            "================================"
        );

        console.log(
            "UPDATE COMPETITION"
        );

        console.log(
            "Competition ID:",
            competitionId
        );

        console.log(
            "Cover image exists:",
            !!data.cover_image
        );

        if (data.cover_image) {

            console.log(
                "Cover image type:",
                data.cover_image.startsWith(
                    "data:image/"
                )
                    ? "NEW BASE64 IMAGE"
                    : "EXISTING IMAGE URL"
            );

            console.log(
                "Cover image length:",
                data.cover_image.length
            );

        }

        console.log(
            "Full data:",
            data
        );

        console.log(
            "================================"
        );


        // =========================
        // REQUEST
        // =========================

        try {

            submitButton.disabled =
                true;


            submitButton.innerHTML =
                `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Enregistrement...
                `;


            const response =
                await fetch(
                    `http://localhost:5000/api/competitions/${competitionId}/edit`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data)

                    }
                );


            const result =
                await response.json();


            console.log(
                "Update API response:",
                result
            );


            // =========================
            // ERROR
            // =========================

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Failed to update competition"
                );

            }


            // =========================
            // SUCCESS
            // =========================

            alert(
                "Les modifications ont été enregistrées avec succès."
            );


            window.location.href =
                `competition-details.html?id=${competitionId}`;


        } catch (error) {

            console.error(
                "Error updating competition:",
                error
            );


            alert(
                error.message ||
                "Impossible d'enregistrer les modifications."
            );


            submitButton.disabled =
                false;


            submitButton.innerHTML =
                `
                <i class="fa-solid fa-check"></i>
                Enregistrer les modifications
                `;

        }

    }
);


// ===============================
// FORMAT DATE FOR INPUT
// ===============================

function formatDateForInput(date) {

    if (!date) {
        return "";
    }


    if (
        typeof date === "string" &&
        date.includes("T")
    ) {

        return date.split("T")[0];

    }


    return String(date).substring(
        0,
        10
    );

}


// ===============================
// FORMAT TIME FOR INPUT
// ===============================

function formatTimeForInput(time) {

    if (!time) {
        return "";
    }


    return String(time).substring(
        0,
        5
    );

}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// ===============================
// INITIAL LOAD
// ===============================

loadCompetition();