/* =========================
   ELEMENTS
========================= */

const form = document.getElementById("competitionForm");

const addDocumentBtn =
    document.getElementById("addDocumentBtn");

const documentsList =
    document.getElementById("documentsList");

const documentsEmpty =
    document.getElementById("documentsEmpty");

const mobileMenu =
    document.getElementById("mobileMenu");

const sidebar =
    document.querySelector(".sidebar");


/* =========================
   MOBILE SIDEBAR
========================= */

if (mobileMenu) {

    mobileMenu.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}


/* =========================
   COVER IMAGE
========================= */

const coverImageInput =
    document.getElementById("coverImage");

const coverImagePreview =
    document.getElementById("coverImagePreview");

const coverImagePlaceholder =
    document.getElementById("coverImagePlaceholder");

const removeCoverImageBtn =
    document.getElementById("removeCoverImage");

let coverImageBase64 = null;


/* =========================
   SELECT COVER IMAGE
========================= */

if (coverImageInput) {

    coverImageInput.addEventListener("change", (event) => {

        const file = event.target.files[0];

        if (!file) {
            return;
        }


        // Check image type
        if (!file.type.startsWith("image/")) {

            alert(
                "Veuillez sélectionner une image valide."
            );

            coverImageInput.value = "";

            return;
        }


        // Max 5 MB
        const maxSize =
            5 * 1024 * 1024;

        if (file.size > maxSize) {

            alert(
                "L'image ne doit pas dépasser 5 MB."
            );

            coverImageInput.value = "";

            return;
        }


        // Convert image to Base64
        const reader =
            new FileReader();

        reader.onload = (event) => {

            coverImageBase64 =
                event.target.result;


            // Preview
            if (coverImagePreview) {

                coverImagePreview.src =
                    coverImageBase64;

                coverImagePreview.style.display =
                    "block";

            }


            if (coverImagePlaceholder) {

                coverImagePlaceholder.style.display =
                    "none";

            }


            console.log(
                "Cover image selected:",
                coverImageBase64.substring(0, 50) + "..."
            );

        };


        reader.readAsDataURL(file);

    });

}


/* =========================
   REMOVE COVER IMAGE
========================= */

if (removeCoverImageBtn) {

    removeCoverImageBtn.addEventListener("click", () => {

        coverImageBase64 = null;


        if (coverImageInput) {
            coverImageInput.value = "";
        }


        if (coverImagePreview) {

            coverImagePreview.src = "";

            coverImagePreview.style.display =
                "none";

        }


        if (coverImagePlaceholder) {

            coverImagePlaceholder.style.display =
                "flex";

        }

    });

}

/* =========================
   DOCUMENTS
========================= */

let documentCount = 0;


if (addDocumentBtn) {

    addDocumentBtn.addEventListener("click", () => {

        documentCount++;

        documentsEmpty.style.display = "none";


        const documentItem =
            document.createElement("div");

        documentItem.className = "document-item";


        documentItem.innerHTML = `

            <div class="document-number">
                ${documentCount}
            </div>


            <div class="document-fields">

                <div class="document-field">

                    <label>
                        Nom du document
                    </label>

                    <input
                        type="text"
                        class="document-name"
                        placeholder="Ex : Carte d'identité"
                    >

                </div>


                <div class="document-field">

                    <label>
                        Description / instructions
                    </label>

                    <input
                        type="text"
                        class="document-description"
                        placeholder="Informations supplémentaires..."
                    >

                </div>


                <div class="document-row">


                    <div class="document-field">

                        <label>
                            Formats acceptés
                        </label>

                        <input
                            type="text"
                            class="document-formats"
                            placeholder="PDF, JPG, PNG"
                        >

                    </div>


                    <div class="document-field">

                        <label>
                            Taille maximale
                        </label>

                        <select class="document-size">

                            <option value="2048">
                                2 MB
                            </option>

                            <option value="5120">
                                5 MB
                            </option>

                            <option value="10240">
                                10 MB
                            </option>

                        </select>

                    </div>


                    <label class="required-check">

                        <input
                            type="checkbox"
                            class="document-required"
                            checked
                        >

                        Document obligatoire

                    </label>


                </div>

            </div>


            <button
                type="button"
                class="remove-document"
            >

                <i class="fa-solid fa-trash"></i>

            </button>

        `;


        documentsList.appendChild(documentItem);


        /* =========================
           REMOVE DOCUMENT
        ========================= */

        const removeBtn =
            documentItem.querySelector(".remove-document");


        removeBtn.addEventListener("click", () => {

            documentItem.remove();

            documentCount--;

            updateDocumentNumbers();


            if (documentsList.children.length === 0) {

                documentsEmpty.style.display = "flex";

            }

        });

    });

}


/* =========================
   UPDATE DOCUMENT NUMBERS
========================= */

function updateDocumentNumbers() {

    const items =
        documentsList.querySelectorAll(".document-item");

    items.forEach((item, index) => {

        const number =
            item.querySelector(".document-number");

        if (number) {
            number.textContent = index + 1;
        }

    });

}


/* =========================
   GET DOCUMENTS
========================= */

function getDocuments() {

    const items =
        documentsList.querySelectorAll(".document-item");

    const documents = [];


    items.forEach(item => {

        const name =
            item.querySelector(".document-name")?.value.trim();

        const description =
            item.querySelector(".document-description")?.value.trim();

        const formats =
            item.querySelector(".document-formats")?.value.trim();

        const maxFileSize =
            item.querySelector(".document-size")?.value;

        const required =
            item.querySelector(".document-required")?.checked;


        if (!name) {
            return;
        }


        documents.push({

            name: name,

            description:
                description || null,

            accepted_formats:
                formats || null,

            max_file_size:
                maxFileSize
                    ? Number(maxFileSize)
                    : null,

            is_required:
                required

        });

    });


    return documents;

}


/* =========================
   GET CATEGORIES
========================= */

function getCategories() {

    const categoryStructure =
        document.querySelector(".category-structure");

    if (!categoryStructure) {
        return [];
    }


    const selects =
        categoryStructure.querySelectorAll("select");


    if (selects.length < 3) {
        return [];
    }


    return [

        {

            sport:
                document.getElementById("sport").value,

            discipline:
                document.getElementById("discipline").value,

            gender:
                selects[0].value,

            age_category:
                selects[1].value,

            weight_category:
                selects[2].value

        }

    ];

}


/* =========================
   FORM SUBMIT
========================= */

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    try {

        /* =========================
           GET BASIC FIELDS
        ========================= */

        const name =
            document.getElementById("competitionName").value.trim();

        const sport =
            document.getElementById("sport").value;

        const discipline =
            document.getElementById("discipline").value.trim();


        const description =
            document.querySelector(
                'textarea[placeholder="Décrivez la compétition..."]'
            ).value.trim();


        /* =========================
           DATE & TIME
        ========================= */

        const dateInputs =
            document.querySelectorAll(
                'input[type="date"]'
            );


        const timeInputs =
            document.querySelectorAll(
                'input[type="time"]'
            );


        const startDate =
            dateInputs[0]?.value || null;

        const startTime =
            timeInputs[0]?.value || null;

        const endTime =
            timeInputs[1]?.value || null;


        /* =========================
           LOCATION
        ========================= */

        const location =
            document.querySelector(
                'input[placeholder="Ex : Palais des Sports d\'Alger"]'
            ).value.trim();


        const organizer =
            document.querySelector(
                'input[placeholder="Nom de l\'organisateur"]'
            ).value.trim();


        /* =========================
           REGISTRATION
        ========================= */

        const openingDate =
            dateInputs[1]?.value || null;

        const closingDate =
            dateInputs[2]?.value || null;


        const registrationFee =
            document.querySelector(
                '.input-with-suffix input'
            ).value || 0;


        const maxParticipants =
            document.querySelector(
                'input[placeholder="Ex : 50"]'
            ).value || null;


        const eligibility =
            document.querySelector(
                'textarea[placeholder="Conditions et critères d\'éligibilité..."]'
            ).value.trim();


        /* =========================
           CATEGORIES
        ========================= */

        const categories =
            getCategories();


        /* =========================
           DOCUMENTS
        ========================= */

        const documents =
            getDocuments();


        /* =========================
           DATA
        ========================= */

        const competitionData = {

            name,

            description,

            sport,

            discipline,

            location,

            city: null,

            start_date:
                startDate,

            start_time:
                startTime,

            end_time:
                endTime,

            organizer,

            cover_image:
                coverImageBase64,

            opening_date:
                openingDate,

            closing_date:
                closingDate,

            registration_fee:
                Number(registrationFee),

            max_participants:
                maxParticipants
                    ? Number(maxParticipants)
                    : null,

            eligibility,

            categories,

            documents

        };


        console.log(
            "Competition data:",
            competitionData
        );


        /* =========================
           API REQUEST
        ========================= */

        const response =
            await fetch(
                "http://localhost:5000/api/competitions/create",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            competitionData
                        )

                }
            );


        const result =
            await response.json();


        console.log(
            "API response:",
            result
        );


        /* =========================
           ERROR
        ========================= */

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Erreur lors de la création de la compétition."
            );

        }


        /* =========================
           SUCCESS
        ========================= */

        alert(
            "La compétition a été créée avec succès."
        );


        window.location.href =
            "competitions.html";


    } catch (error) {

        console.error(
            "Create competition error:",
            error
        );


        alert(
            error.message ||
            "Impossible de créer la compétition."
        );

    }

});