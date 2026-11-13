// =========================
// MOBILE SIDEBAR
// =========================

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.querySelector(".sidebar");

if (mobileMenu) {
    mobileMenu.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}


// =========================
// ELEMENTS
// =========================

const searchInput = document.getElementById("searchInput");
const tableBody = document.getElementById("competitionTable");
const emptyState = document.getElementById("emptyState");


// =========================
// LOAD COMPETITIONS
// =========================

async function loadCompetitions() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/competitions"
        );

        const result = await response.json();

        if (!result.success) {
            throw new Error("Failed to load competitions");
        }

        renderCompetitions(result.data);

    } catch (error) {

        console.error("Error loading competitions:", error);

        tableBody.innerHTML = "";

        emptyState.style.display = "block";

        emptyState.querySelector("h3").textContent =
            "Impossible de charger les compétitions";

        emptyState.querySelector("p").textContent =
            "Vérifiez que le serveur est démarré.";

    }

}


// =========================
// RENDER COMPETITIONS
// =========================

function renderCompetitions(competitions) {

    tableBody.innerHTML = "";

    if (!competitions || competitions.length === 0) {

        emptyState.style.display = "block";

        updateCompetitionCount(0);

        return;
    }

    emptyState.style.display = "none";


    competitions.forEach(competition => {

        const row = document.createElement("tr");

        const status = getCompetitionStatus(competition);

        const registrationCount = Number(competition.registration_count) || 0;

        const maxParticipants =
            competition.max_participants || 0;


        row.innerHTML = `

            <td>

                <div class="competition-name">

                   

                    <div>

                        <strong>
                            ${escapeHtml(competition.name)}
                        </strong>

                        <span>
                            ${escapeHtml(
                                competition.discipline ||
                                competition.sport ||
                                ""
                            )}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHtml(competition.sport || "-")}
            </td>


            <td>
                ${escapeHtml(
                    competition.city ||
                    competition.location ||
                    "-"
                )}
            </td>


            <td>
                ${formatDate(competition.start_date)}
            </td>


            <td>
                ${registrationCount} / ${maxParticipants}
            </td>


            <td>

                <span class="status ${status.className}">
                    ${status.label}
                </span>

            </td>


            <td>

                <a
                    href="competition-details.html?id=${competition.id}"
                    class="action-btn"
                >

                    <i class="fa-solid fa-eye"></i>

                </a>

            </td>

        `;


        tableBody.appendChild(row);

    });


    updateCompetitionCount(competitions.length);

}


// =========================
// COMPETITION STATUS
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


    // Registration open

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


    // Registration closed

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


    // Upcoming

    if (
        startDate &&
        today < startDate
    ) {

        return {
            label: "À venir",
            className: "upcoming"
        };

    }


    // In progress

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
// FORMAT DATE
// =========================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date)) {
        return "-";
    }

    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// =========================
// UPDATE COUNT
// =========================

function updateCompetitionCount(count) {

    const footerCount =
        document.querySelector(".table-footer span");

    if (!footerCount) {
        return;
    }

    footerCount.textContent =
        `${count} compétition${count > 1 ? "s" : ""}`;

}


// =========================
// ESCAPE HTML
// =========================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;

}


// =========================
// NORMALIZE TEXT
// =========================

function normalizeText(text) {

    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();

}


// =========================
// LEVENSHTEIN DISTANCE
// =========================

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
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );

            }

        }

    }

    return matrix[b.length][a.length];

}


// =========================
// FUZZY MATCH
// =========================

function fuzzyMatch(text, query) {

    text = normalizeText(text);
    query = normalizeText(query);

    if (!query) {
        return true;
    }

    if (text.includes(query)) {
        return true;
    }

    const words = text.split(/\s+/);
    const queryWords = query.split(/\s+/);

    return queryWords.every(queryWord => {

        return words.some(word => {

            if (queryWord.length <= 2) {
                return word.startsWith(queryWord);
            }

            const distance =
                levenshteinDistance(
                    queryWord,
                    word
                );

            const allowedDistance =
                queryWord.length <= 5
                    ? 1
                    : 2;

            return distance <= allowedDistance;

        });

    });

}


// =========================
// SEARCH
// =========================

searchInput.addEventListener("input", () => {

    const query = searchInput.value;

    const rows =
        tableBody.querySelectorAll("tr");

    let visibleRows = 0;


    rows.forEach(row => {

        const rowText = row.textContent;

        const matches =
            fuzzyMatch(rowText, query);


        if (matches) {

            row.style.display = "";

            visibleRows++;

        } else {

            row.style.display = "none";

        }

    });


    if (visibleRows === 0) {

        emptyState.style.display = "block";

    } else {

        emptyState.style.display = "none";

    }

});


// =========================
// INITIAL LOAD
// =========================

loadCompetitions();