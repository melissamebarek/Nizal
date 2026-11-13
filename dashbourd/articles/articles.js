/* =========================
   ELEMENTS
========================= */

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const tableBody = document.getElementById("articlesTable");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");

let rows = [];
let articles = [];

async function fetchArticles() {
    try {
        const response = await fetch("http://localhost:5000/api/articles");

        if (!response.ok) {
            throw new Error("Failed to fetch articles");
        }

        const result = await response.json();

        articles = result.data || [];

        console.log("Articles loaded:", articles);

        renderArticles();

    } catch (error) {
        console.error("Error loading articles:", error);
    }
}


function renderArticles() {

    tableBody.innerHTML = "";

    rows = [];

    articles.forEach(article => {

        const row = document.createElement("tr");

        row.dataset.title = article.title || "";
        row.dataset.category = article.category || "";
        row.dataset.status = article.status || "";

        const date = article.created_at
            ? new Date(article.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
            : "-";

        const statusLabel ="published"
        row.innerHTML = `
            <td>
                <div class="article-cell">

                    <div class="article-image">
                        ${
                            article.cover_image
                                ? `<img src="${article.cover_image}" alt="${article.title}">`
                                : `<i class="fa-solid fa-newspaper"></i>`
                        }
                    </div>

                    <div class="article-info">
                        <strong>${article.title}</strong>
                        <span>
                            ${article.content
                                ? article.content.replace(/<[^>]*>/g, "").substring(0, 60) + "..."
                                : ""}
                        </span>
                    </div>

                </div>
            </td>

            <td>
                <span class="category-badge">
                    ${article.category}
                </span>
            </td>

            <td>NIZAL</td>

            <td>${date}</td>

            <td>
                <span class="status ${article.status}">
                    ${statusLabel}
                </span>
            </td>

            <td>
                <a href="article-details.html?id=${article.id}"
                   class="view-btn"
                   title="Voir les détails">
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </td>
        `;

        tableBody.appendChild(row);

        rows.push(row);
    });

    filterArticles();
}


/* =========================
   NORMALIZE TEXT
   Makes search accent-insensitive
========================= */

function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


/* =========================
   LEVENSHTEIN DISTANCE
========================= */

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


/* =========================
   FUZZY MATCH
========================= */

function fuzzyMatch(query, text) {

    query = normalizeText(query);
    text = normalizeText(text);

    if (!query) {
        return true;
    }

    // Exact substring
    if (text.includes(query)) {
        return true;
    }

    // Check each word
    const words = text.split(/\s+/);

    return words.some(word => {

        if (word.includes(query)) {
            return true;
        }

        const maxDistance =
            query.length <= 4 ? 1 :
            query.length <= 7 ? 2 :
            3;

        return levenshteinDistance(query, word) <= maxDistance;
    });
}


/* =========================
   FILTER ARTICLES
========================= */

function filterArticles() {

    const query = searchInput.value.trim();

    const selectedCategory = categoryFilter.value;

    let visibleCount = 0;

    rows.forEach(row => {

        const title =
            row.dataset.title || "";

        const category =
            row.dataset.category || "";

        const status =
            row.dataset.status || "";


        const matchesSearch =
            fuzzyMatch(query, title) ||
            fuzzyMatch(query, category);


        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;


        const shouldShow =
            matchesSearch &&
            matchesCategory;


        row.style.display =
            shouldShow ? "" : "none";


        if (shouldShow) {
            visibleCount++;
        }

    });


    /* =========================
       EMPTY STATE
    ========================= */

    if (visibleCount === 0) {

        emptyState.style.display = "flex";

    } else {

        emptyState.style.display = "none";
    }


    /* =========================
       RESULT COUNT
    ========================= */

    resultCount.textContent =
        `${visibleCount} article${visibleCount !== 1 ? "s" : ""}`;
}


/* =========================
   EVENTS
========================= */

searchInput.addEventListener(
    "input",
    filterArticles
);

categoryFilter.addEventListener(
    "change",
    filterArticles
);


/* =========================
   MOBILE SIDEBAR
========================= */

const mobileMenu =
    document.getElementById("mobileMenu");

const sidebar =
    document.getElementById("sidebar");


mobileMenu.addEventListener("click", () => {

    sidebar.classList.toggle("open");

});


/* =========================
   CLOSE SIDEBAR
   WHEN CLICKING NAV LINK
========================= */

document.querySelectorAll(".nav-item")
    .forEach(item => {

        item.addEventListener("click", () => {

            sidebar.classList.remove("open");

        });

    });


/* =========================
   INITIAL FILTER
========================= */

fetchArticles();