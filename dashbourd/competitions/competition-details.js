// =========================
// GET COMPETITION ID
// =========================

const params = new URLSearchParams(window.location.search);
const competitionId = params.get("id");


// =========================
// ELEMENTS
// =========================

const deleteModal = document.getElementById("deleteModal");

const deleteButtons = [
    document.getElementById("deleteCompetition"),
    document.getElementById("deleteCompetitionBottom")
];

const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

const editButton = document.getElementById("editCompetition");



// =========================
// CHECK ID
// =========================

if (!competitionId) {

    alert("Compétition introuvable.");

    window.location.href = "competitions.html";

}


// =========================
// LOAD COMPETITION
// =========================

async function loadCompetition() {

    try {

        const response = await fetch(
            `http://localhost:5000/api/competitions/${competitionId}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Competition not found"
            );
        }

        renderCompetition(result.data);

    } catch (error) {

        console.error(
            "Error loading competition:",
            error
        );

        alert(
            "Impossible de charger les détails de la compétition."
        );

        window.location.href = "competitions.html";

    }

}


// =========================
// RENDER COMPETITION
// =========================

function renderCompetition(competition) {

    // Title
    document.title =
        `${competition.name} — NIZAL`;


    // Breadcrumb
    const breadcrumbTitle =
        document.querySelector(".breadcrumb span");

    if (breadcrumbTitle) {
        breadcrumbTitle.textContent =
            competition.name;
    }


    // Main title
    const pageTitle =
        document.querySelector(".title-row h1");

    if (pageTitle) {
        pageTitle.textContent =
            competition.name;
    }


    // Cover sport
    const coverSport =
        document.querySelector(".cover-sport");

    if (coverSport) {
        coverSport.textContent =
            competition.sport || "-";
    }


    // Cover title
    const coverTitle =
        document.querySelector(".cover-overlay h2");

    if (coverTitle) {
        coverTitle.textContent =
            competition.name;
    }


    // Cover image
    const coverImage =
        document.querySelector(".competition-cover img");

    if (coverImage) {
       coverImage.src = competition.cover_image;


        coverImage.alt =
            competition.name;

    }


    // =========================
    // GENERAL INFO
    // =========================

    const infoItems =
        document.querySelectorAll(
            ".section-card:first-of-type .info-item"
        );

    if (infoItems.length >= 3) {

        infoItems[0]
            .querySelector("strong")
            .textContent =
            competition.sport || "-";

        infoItems[1]
            .querySelector("strong")
            .textContent =
            competition.discipline || "-";

        infoItems[2]
            .querySelector("strong")
            .textContent =
            competition.organizer || "-";

        const description =
            infoItems[3]?.querySelector("p");

        if (description) {

            description.textContent =
                competition.description || "-";

        }

    }


    // =========================
    // DATE & TIME
    // =========================

    const infoRows =
        document.querySelectorAll(
            ".info-row"
        );

    if (infoRows.length >= 5) {

        infoRows[0]
            .querySelector("strong")
            .textContent =
            formatDateLong(
                competition.start_date
            );

        infoRows[1]
            .querySelector("strong")
            .textContent =
            competition.start_time || "-";

        infoRows[2]
            .querySelector("strong")
            .textContent =
            competition.end_time || "-";

        infoRows[3]
            .querySelector("strong")
            .textContent =
            competition.location || "-";

        infoRows[4]
            .querySelector("strong")
            .textContent =
            competition.city || "-";

    }


    // =========================
    // REGISTRATION INFO
    // =========================

    const miniStats =
        document.querySelectorAll(
            ".mini-stat"
        );

    if (miniStats.length >= 4) {

        miniStats[0]
            .querySelector("strong")
            .textContent =
            formatDateLong(
                competition.opening_date
            );

        miniStats[1]
            .querySelector("strong")
            .textContent =
            formatDateLong(
                competition.closing_date
            );

        miniStats[2]
            .querySelector("strong")
            .textContent =
            formatPrice(
                competition.registration_fee
            );

        miniStats[3]
            .querySelector("strong")
            .textContent =
            `${Number(competition.registration_count) || 0} / ${competition.max_participants || 0}`;

    }

    renderDocuments(competition.documents);

    // =========================
    // STATUS
    // =========================

    updateStatus(competition);

}


function renderDocuments(documents) {

    const documentsList =
        document.querySelector(".documents-list");

    if (!documentsList) {
        return;
    }

    documentsList.replaceChildren();

    if (!Array.isArray(documents) || documents.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "Aucun document requis pour cette compétition.";
        documentsList.appendChild(emptyMessage);
        return;
    }

    documents.forEach(documentData => {
        const item = document.createElement("div");
        item.className = "document-item";

        const icon = document.createElement("div");
        icon.className = "document-icon";
        icon.innerHTML = '<i class="fa-solid fa-file-lines"></i>';

        const info = document.createElement("div");
        info.className = "document-info";

        const name = document.createElement("strong");
        name.textContent = documentData.name || "Document";
        info.appendChild(name);

        const details = [
            documentData.description,
            documentData.accepted_formats,
            documentData.max_file_size
                ? `Max. ${documentData.max_file_size} MB`
                : null
        ].filter(Boolean);

        const detailText = document.createElement("span");
        detailText.textContent =
            details.join(" — ") || "Aucune précision supplémentaire";
        info.appendChild(detailText);

        const isRequired =
            documentData.is_required === true ||
            documentData.is_required === 1 ||
            documentData.is_required === "1";

        const requirement = document.createElement("span");
        requirement.className = isRequired ? "required" : "optional";
        requirement.textContent = isRequired ? "Obligatoire" : "Optionnel";

        item.append(icon, info, requirement);
        documentsList.appendChild(item);
    });

}


// =========================
// UPDATE STATUS
// =========================

function updateStatus(competition) {

    const status =
        getCompetitionStatus(competition);

    const statusBadge =
        document.querySelector(".status-badge");

    if (!statusBadge) {
        return;
    }

    statusBadge.textContent =
        status.label;

    statusBadge.className =
        `status-badge ${status.className}`;

}


// =========================
// STATUS LOGIC
// =========================

function getCompetitionStatus(competition) {

    const today = new Date();

    const openingDate =
        competition.opening_date
            ? new Date(competition.opening_date)
            : null;

    const closingDate =
        competition.closing_date
            ? new Date(competition.closing_date)
            : null;

    const startDate =
        competition.start_date
            ? new Date(competition.start_date)
            : null;


    if (
        openingDate &&
        closingDate &&
        today >= openingDate &&
        today <= closingDate
    ) {

        return {
            label: "Inscription ouverte",
            className: "open"
        };

    }


    if (
        closingDate &&
        today > closingDate &&
        startDate &&
        today < startDate
    ) {

        return {
            label: "Inscription fermée",
            className: "closed"
        };

    }


    if (
        startDate &&
        today < startDate
    ) {

        return {
            label: "À venir",
            className: "upcoming"
        };

    }


    if (
        startDate &&
        today >= startDate
    ) {

        return {
            label: "En cours",
            className: "open"
        };

    }


    return {
        label: "À venir",
        className: "upcoming"
    };

}


// =========================
// DATE FORMAT
// =========================

function formatDateLong(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date)) {
        return "-";
    }

    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

}


// =========================
// PRICE FORMAT
// =========================

function formatPrice(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0 DZD";
    }

    return Number(value).toLocaleString(
        "fr-FR"
    ) + " DZD";

}


// =========================
// DELETE MODAL
// =========================

// Open delete modal

deleteButtons.forEach(button => {

    if (button) {

        button.addEventListener(
            "click",
            () => {

                deleteModal.classList.add("show");

            }
        );

    }

});

editButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    console.log("Edit button clicked. Competition ID:", competitionId);

    window.location.href =
        `edit-competition.html?id=${competitionId}`;
});
// Cancel

if (cancelDelete) {

    cancelDelete.addEventListener(
        "click",
        () => {

            deleteModal.classList.remove("show");

        }
    );

}


// =========================
// DELETE COMPETITION
// =========================

if (confirmDelete) {

    confirmDelete.addEventListener(
        "click",
        async () => {

            try {

                confirmDelete.disabled = true;

                confirmDelete.textContent =
                    "Suppression...";


                const response =
                    await fetch(
                        `http://localhost:5000/api/competitions/${competitionId}/delete`,
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
                        "Failed to delete competition"
                    );

                }


                deleteModal.classList.remove(
                    "show"
                );


                alert(
                    "La compétition a été supprimée avec succès."
                );


                window.location.href =
                    "competitions.html";


            } catch (error) {

                console.error(
                    "Error deleting competition:",
                    error
                );


                alert(
                    "Impossible de supprimer la compétition."
                );


                confirmDelete.disabled = false;

                confirmDelete.innerHTML =
                    `<i class="fa-solid fa-trash"></i>
                     Supprimer`;

            }

        }
    );

}


// =========================
// CLOSE MODAL OUTSIDE
// =========================

if (deleteModal) {

    deleteModal.addEventListener(
        "click",
        event => {

            if (
                event.target === deleteModal
            ) {

                deleteModal.classList.remove(
                    "show"
                );

            }

        }
    );

}


// =========================
// MOBILE SIDEBAR
// =========================

const mobileMenu =
    document.querySelector(".mobile-menu");

const sidebar =
    document.querySelector(".sidebar");

if (mobileMenu) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


// =========================
// INITIAL LOAD
// =========================

loadCompetition();