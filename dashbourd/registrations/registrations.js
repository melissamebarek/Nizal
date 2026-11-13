
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // CONFIGURATION
    // =========================
    const API_URL = "http://localhost:5000/api/registrations/";
    const ITEMS_PER_PAGE = 10;

    // =========================
    // ELEMENTS
    // =========================
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const competitionFilter = document.getElementById("competitionFilter");
    const sportFilter = document.getElementById("sportFilter");
    const tableBody = document.getElementById("registrationsTable");
    const emptyState = document.getElementById("emptyState");
    const paginationInfo = document.getElementById("paginationInfo");
    const paginationButtons = document.getElementById("paginationButtons");

    let registrations = [];
    let filteredRegistrations = [];
    let currentPage = 1;

    // =========================
    // SIDEBAR
    // =========================
    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    // =========================
    // STATUS TRANSLATION
    // =========================
    const STATUS_LABELS = {
        submitted: "Inscription envoyée",
        reviewing: "En cours d’examen",
        accepted: "Acceptée",
        rejected: "Refusée",
        cancelled: "Annulée",

        // Support existing French status values too.
        "inscription envoyée": "Inscription envoyée",
        "en cours d’examen": "En cours d’examen",
        "acceptée": "Acceptée",
        "refusée": "Refusée",
        "annulée": "Annulée"
    };

    function normalizeStatus(status) {
        const key = String(status || "").trim().toLowerCase();
        return STATUS_LABELS[key] || status || "Inconnu";
    }

    function statusClass(status) {
        const key = String(status || "").trim().toLowerCase();

        const classes = {
            submitted: "submitted",
            reviewing: "reviewing",
            accepted: "accepted",
            rejected: "rejected",
            cancelled: "cancelled"
        };

        if (classes[key]) return classes[key];

        const label = normalizeStatus(status).toLowerCase();

        if (label === "inscription envoyée") return "submitted";
        if (label === "en cours d’examen") return "reviewing";
        if (label === "acceptée") return "accepted";
        if (label === "refusée") return "rejected";
        if (label === "annulée") return "cancelled";

        return "submitted";
    }

    // =========================
    // SAFE HTML
    // =========================
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

    // =========================
    // TEXT NORMALIZATION
    // =========================
    function normalizeText(value) {
        return String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function getCompetitionName(registration) {
        return registration.competition_name
            || registration.competition_title
            || registration.competition
            || `Compétition #${registration.competition_id}`;
    }

    function getSport(registration) {
        return registration.category_sport
            || registration.sport
            || "—";
    }

    function getCategory(registration) {
        return registration.category_age
            || registration.age_category
            || "—";
    }

    function getWeight(registration) {
        return registration.category_weight
            || registration.weight_category
            || "—";
    }

    function getRegistrationDate(registration) {
        const value = registration.created_at;

        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(date);
    }

    function getInitials(firstName, lastName) {
        const first = String(firstName || "").trim().charAt(0);
        const last = String(lastName || "").trim().charAt(0);

        return (first + last).toUpperCase() || "?";
    }

    function getFullName(registration) {
        return [
            registration.first_name,
            registration.last_name
        ].filter(Boolean).join(" ") || "Participant inconnu";
    }

    // =========================
    // DYNAMIC COMPETITION FILTER
    // =========================
    function populateCompetitionFilter() {
        if (!competitionFilter) return;

        const selectedValue = competitionFilter.value;

        competitionFilter.innerHTML =
            '<option value="">Toutes les compétitions</option>';

        const competitions = new Map();

        registrations.forEach(registration => {
            const name = getCompetitionName(registration);
            competitions.set(name, name);
        });

        [...competitions.keys()]
            .sort((a, b) => a.localeCompare(b, "fr"))
            .forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                competitionFilter.appendChild(option);
            });

        if ([...competitions.keys()].includes(selectedValue)) {
            competitionFilter.value = selectedValue;
        }
    }

    // =========================
    // SEARCH + FILTER
    // =========================
    function filterRegistrations() {
        const query = normalizeText(searchInput?.value || "");
        const selectedStatus = statusFilter?.value || "";
        const selectedCompetition = competitionFilter?.value || "";
        const selectedSport = sportFilter?.value || "";

        filteredRegistrations = registrations.filter(registration => {
            const searchableText = normalizeText([
                registration.registration_number,
                registration.first_name,
                registration.last_name,
                registration.email,
                registration.phone,
                getCompetitionName(registration),
                getSport(registration),
                registration.discipline,
                getCategory(registration),
                getWeight(registration),
                registration.club_name,
                registration.gender
            ].join(" "));

            const statusLabel = normalizeText(
                normalizeStatus(registration.status)
            );

            const competitionName = getCompetitionName(registration);
            const sport = getSport(registration);

            const matchesSearch =
                !query || searchableText.includes(query);

            const matchesStatus =
                !selectedStatus ||
                statusLabel === normalizeText(selectedStatus);

            const matchesCompetition =
                !selectedCompetition ||
                competitionName === selectedCompetition;

            const matchesSport =
                !selectedSport ||
                normalizeText(sport) === normalizeText(selectedSport);

            return matchesSearch
                && matchesStatus
                && matchesCompetition
                && matchesSport;
        });

        currentPage = 1;
        renderTable();
    }

    // =========================
    // RENDER ONE ROW
    // =========================
    function renderRow(registration) {
        const id = Number(registration.id);
        const registrationNumber = registration.registration_number
            || `INS-${String(id).padStart(5, "0")}`;

        const fullName = getFullName(registration);
        const email = registration.email || "—";
        const competitionName = getCompetitionName(registration);
        const sport = getSport(registration);
        const ageCategory = getCategory(registration);
        const weightCategory = getWeight(registration);
        const statusLabel = normalizeStatus(registration.status);
        const cssStatus = statusClass(registration.status);

        return `
            <tr
                data-search="${escapeHTML([
                    registrationNumber,
                    fullName,
                    email,
                    competitionName,
                    sport,
                    ageCategory,
                    weightCategory
                ].join(" "))}"
                data-status="${escapeHTML(statusLabel)}"
                data-competition="${escapeHTML(competitionName)}"
                data-sport="${escapeHTML(sport)}"
            >
                <td>
                    <strong>#${escapeHTML(registrationNumber)}</strong>
                </td>

                <td>
                    <div class="participant">
                        <div class="participant-avatar">
                            ${escapeHTML(
                                getInitials(
                                    registration.first_name,
                                    registration.last_name
                                )
                            )}
                        </div>

                        <div>
                            <strong>${escapeHTML(fullName)}</strong>
                            <span>${escapeHTML(email)}</span>
                        </div>
                    </div>
                </td>

                <td>
                    <strong>${escapeHTML(competitionName)}</strong>
                    <span class="sub-text">${escapeHTML(sport)}</span>
                </td>

                <td>
                    <span class="category">
                        ${escapeHTML(ageCategory)}
                    </span>
                    <span class="sub-text">
                        ${escapeHTML(weightCategory)}
                    </span>
                </td>

                <td>${escapeHTML(getRegistrationDate(registration))}</td>

                <td>
                    <span class="status ${escapeHTML(cssStatus)}">
                        ${escapeHTML(statusLabel)}
                    </span>
                </td>

                <td>
                    <a
                        href="registration-details.html?id=${encodeURIComponent(id)}"
                        class="view-btn"
                        title="Voir les détails"
                        aria-label="Voir les détails de ${escapeHTML(fullName)}"
                    >
                        <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </td>
            </tr>
        `;
    }

    // =========================
    // PAGINATION
    // =========================
    function renderPagination() {
        if (!paginationInfo || !paginationButtons) return;

        const total = filteredRegistrations.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

        if (total === 0) {
            paginationInfo.textContent = "Aucune inscription à afficher";
            paginationButtons.innerHTML = "";
            return;
        }

        const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

        paginationInfo.textContent =
            `Affichage de ${start} à ${end} sur ${total} inscription(s)`;

        let buttonsHTML = `
            <button
                type="button"
                data-page="${currentPage - 1}"
                ${currentPage === 1 ? "disabled" : ""}
                aria-label="Page précédente"
            >
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        `;

        for (let page = 1; page <= totalPages; page++) {
            buttonsHTML += `
                <button
                    type="button"
                    data-page="${page}"
                    class="${page === currentPage ? "active" : ""}"
                    ${page === currentPage ? 'aria-current="page"' : ""}
                >
                    ${page}
                </button>
            `;
        }

        buttonsHTML += `
            <button
                type="button"
                data-page="${currentPage + 1}"
                ${currentPage === totalPages ? "disabled" : ""}
                aria-label="Page suivante"
            >
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;

        paginationButtons.innerHTML = buttonsHTML;
    }

    // =========================
    // RENDER TABLE
    // =========================
    function renderTable() {
        if (!tableBody) return;

        const total = filteredRegistrations.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }

        if (total === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-row">
                        Aucune inscription à afficher.
                    </td>
                </tr>
            `;

            if (emptyState) {
                emptyState.style.display = "block";
            }

            renderPagination();
            return;
        }

        if (emptyState) {
            emptyState.style.display = "none";
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = filteredRegistrations.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );

        tableBody.innerHTML = pageItems.map(renderRow).join("");

        renderPagination();
    }

    // =========================
    // LOAD API DATA
    // =========================
    async function loadRegistrations() {
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row">
                    Chargement des inscriptions...
                </td>
            </tr>
        `;

        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(
                    `Erreur HTTP ${response.status}`
                );
            }

            const result = await response.json();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error(
                    result.message || "Format de réponse API invalide."
                );
            }

            registrations = result.data;
            filteredRegistrations = [...registrations];

            populateCompetitionFilter();
            filterRegistrations();

        } catch (error) {
            console.error(
                "Erreur lors du chargement des inscriptions :",
                error
            );

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-row">
                        Impossible de charger les inscriptions.
                        Vérifiez que le backend est démarré et que l'API
                        ${escapeHTML(API_URL)} est accessible.
                    </td>
                </tr>
            `;

            if (emptyState) {
                emptyState.style.display = "none";
            }

            if (paginationInfo) {
                paginationInfo.textContent =
                    "Erreur de chargement";
            }

            if (paginationButtons) {
                paginationButtons.innerHTML = "";
            }
        }
    }

    // =========================
    // EVENT LISTENERS
    // =========================
    if (searchInput) {
        searchInput.addEventListener("input", filterRegistrations);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", filterRegistrations);
    }

    if (competitionFilter) {
        competitionFilter.addEventListener("change", filterRegistrations);
    }

    if (sportFilter) {
        sportFilter.addEventListener("change", filterRegistrations);
    }

    if (paginationButtons) {
        paginationButtons.addEventListener("click", event => {
            const button = event.target.closest("button[data-page]");

            if (!button || button.disabled) return;

            const requestedPage = Number(button.dataset.page);
            const totalPages = Math.ceil(
                filteredRegistrations.length / ITEMS_PER_PAGE
            );

            if (
                Number.isInteger(requestedPage) &&
                requestedPage >= 1 &&
                requestedPage <= totalPages
            ) {
                currentPage = requestedPage;
                renderTable();
            }
        });
    }

    // =========================
    // INITIAL LOAD
    // =========================
    loadRegistrations();
});
