/* =========================
   MOBILE SIDEBAR
========================= */

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");

mobileMenu.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});


document.querySelectorAll(".nav-item").forEach(item => {

    item.addEventListener("click", () => {
        sidebar.classList.remove("open");
    });

});


/* =========================
   DELETE MODAL
========================= */

const deleteModal =
    document.getElementById("deleteModal");

const cancelDelete =
    document.getElementById("cancelDelete");

const confirmDelete =
    document.getElementById("confirmDelete");

const deleteButtons = [
    document.getElementById("deleteArticleBtn"),
    document.getElementById("deleteArticleBtnSide"),
    document.getElementById("deleteArticleBtnDanger")
];


/* Open modal */

deleteButtons.forEach(button => {

    if (!button) return;

    button.addEventListener("click", () => {

        deleteModal.classList.add("show");

    });

});


/* Close modal */

cancelDelete.addEventListener("click", () => {

    deleteModal.classList.remove("show");

});


/* Close when clicking outside */

deleteModal.addEventListener("click", event => {

    if (event.target === deleteModal) {

        deleteModal.classList.remove("show");

    }

});


const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

const title = document.querySelector(".title-row h1");
const status = document.querySelector(".title-row .status");
const meta = document.querySelector(".article-meta");

const articleContent = document.querySelector(".article-content");
const coverImage = document.querySelector(".cover-image img");

const editLinks = document.querySelectorAll(
    'a[href^="edit-article.html"]'
);



// =========================
// LOAD ARTICLE
// =========================

async function loadArticle() {

    if (!articleId) {
        console.error("Article ID missing");
        return;
    }

    try {

        const response = await fetch(
            `http://localhost:5000/api/articles/${articleId}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        renderArticle(result.data);

    } catch (error) {

        console.error("Error loading article:", error);
    }
}


function renderArticle(article) {

    title.textContent = article.title;

    status.textContent =
        article.status === "published"
            ? "Publié"
            : "Brouillon";

    status.className =
        `status ${article.status}`;

    const date = article.created_at
        ? new Date(article.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
        : "-";

    meta.innerHTML = `
        <span>
            <i class="fa-solid fa-layer-group"></i>
            ${article.category}
        </span>

        <span>
            <i class="fa-solid fa-user"></i>
            NIZAL
        </span>

        <span>
            <i class="fa-regular fa-calendar"></i>
            ${date}
        </span>
    `;

    if (article.cover_image) {
        coverImage.src = article.cover_image;
        coverImage.alt = article.title;
    }

    articleContent.innerHTML = `
       

        ${article.content}
    `;

    editLinks.forEach(link => {
        link.href = `edit-article.html?id=${article.id}`;
    });
}


// =========================
// DELETE MODAL
// =========================

function openDeleteModal() {
    deleteModal.classList.add("active");
}

function closeDeleteModal() {
    deleteModal.classList.remove("active");
}


// Open modal from any delete button
deleteButtons.forEach(button => {

    if (!button) return;

    button.addEventListener("click", openDeleteModal);

});


// Cancel
cancelDelete.addEventListener("click", closeDeleteModal);


// Confirm delete
confirmDelete.addEventListener("click", async () => {

    try {

        const response = await fetch(
            `http://localhost:5000/api/articles/${articleId}/delete`,
            {
                method: "DELETE"
            }
        );

        const text = await response.text();

        console.log("DELETE status:", response.status);
        console.log("DELETE response:", text);

        if (!response.ok) {
            throw new Error(text);
        }

        closeDeleteModal();

        const toast = document.getElementById("toast");

        if (toast) {
            toast.classList.add("show");
        }

        setTimeout(() => {
            window.location.href = "articles.html";
        }, 1200);

    } catch (error) {

        console.error("Delete error:", error);

    }

});


// =========================
// START
// =========================

loadArticle();

