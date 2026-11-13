/* =========================
   ELEMENTS
========================= */

const articleForm = document.getElementById("articleForm");
const articleTitle = document.getElementById("articleTitle");
const articleCategory = document.getElementById("articleCategory");
const articleEditor = document.getElementById("articleEditor");
const coverInput = document.getElementById("coverInput");
const coverPreview = document.getElementById("coverPreview");
const publishBtn = document.getElementById("publishBtn");
const previewBtn = document.getElementById("previewBtn");
const autosaveText = document.getElementById("autosaveText");
const saveDot = document.getElementById("saveDot");
const wordCount = document.getElementById("wordCount");
const summaryWords = document.getElementById("summaryWords");
const summaryImages = document.getElementById("summaryImages");
const summaryVideos = document.getElementById("summaryVideos");
const titleError = document.getElementById("titleError");
const categoryError = document.getElementById("categoryError");

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");

const formatBlock = document.getElementById("formatBlock");

const linkBtn = document.getElementById("linkBtn");
const linkModal = document.getElementById("linkModal");
const linkUrl = document.getElementById("linkUrl");
const linkText = document.getElementById("linkText");
const insertLinkBtn = document.getElementById("insertLinkBtn");

const imageBtn = document.getElementById("imageBtn");
const articleImageInput = document.getElementById("articleImageInput");

const videoBtn = document.getElementById("videoBtn");
const videoModal = document.getElementById("videoModal");
const videoUrl = document.getElementById("videoUrl");
const insertVideoBtn = document.getElementById("insertVideoBtn");

const previewModal = document.getElementById("previewModal");
const previewContent = document.getElementById("previewContent");

const toast = document.getElementById("toast");


/* =========================
   STATE
========================= */

let coverImage = null;
let autosaveTimer = null;
let savedState = null;
let savedSelection = null;


/* =========================
   MOBILE SIDEBAR
========================= */

mobileMenu.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
        sidebar.classList.remove("open");
    });
});


/* =========================
   RICH TEXT COMMANDS
========================= */

document.querySelectorAll(".editor-toolbar button[data-command]")
    .forEach(button => {

        button.addEventListener("mousedown", event => {
            event.preventDefault();
        });

        button.addEventListener("click", () => {
            articleEditor.focus();

            document.execCommand(
                button.dataset.command,
                false,
                null
            );

            editorChanged();
        });
    });


/* =========================
   FORMAT BLOCK
========================= */

formatBlock.addEventListener("change", () => {
    articleEditor.focus();

    document.execCommand(
        "formatBlock",
        false,
        formatBlock.value
    );

    editorChanged();
});


/* =========================
   SELECTION
========================= */

function saveSelection() {
    const selection = window.getSelection();

    if (
        selection.rangeCount > 0 &&
        articleEditor.contains(selection.anchorNode)
    ) {
        savedSelection = selection.getRangeAt(0);
    }
}

function restoreSelection() {
    if (!savedSelection) return;

    const selection = window.getSelection();

    selection.removeAllRanges();
    selection.addRange(savedSelection);
}


/* =========================
   LINK
========================= */

linkBtn.addEventListener("mousedown", event => {
    event.preventDefault();
    saveSelection();
});

linkBtn.addEventListener("click", () => {
    linkModal.classList.add("show");
    linkUrl.focus();
});

insertLinkBtn.addEventListener("click", () => {
    const url = linkUrl.value.trim();
    const text = linkText.value.trim();

    if (!url) {
        linkUrl.focus();
        return;
    }

    articleEditor.focus();
    restoreSelection();

    if (text) {
        document.execCommand(
            "insertHTML",
            false,
            `<a href="${escapeAttribute(url)}"
                target="_blank"
                rel="noopener noreferrer">
                ${escapeHTML(text)}
            </a>`
        );
    } else {
        document.execCommand("createLink", false, url);
    }

    linkUrl.value = "";
    linkText.value = "";

    closeModal(linkModal);
    editorChanged();
});


/* =========================
   IMAGE
========================= */

imageBtn.addEventListener("mousedown", event => {
    event.preventDefault();
    saveSelection();
});

imageBtn.addEventListener("click", () => {
    articleImageInput.click();
});

articleImageInput.addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = event => {
        articleEditor.focus();
        restoreSelection();

        document.execCommand(
            "insertHTML",
            false,
            `<img
                src="${event.target.result}"
                alt="Image de l'article"
            >`
        );

        editorChanged();
    };

    reader.readAsDataURL(file);
    event.target.value = "";
});


/* =========================
   VIDEO
========================= */

videoBtn.addEventListener("mousedown", event => {
    event.preventDefault();
    saveSelection();
});

videoBtn.addEventListener("click", () => {
    videoModal.classList.add("show");
    videoUrl.focus();
});

insertVideoBtn.addEventListener("click", () => {
    const url = videoUrl.value.trim();

    if (!url) {
        videoUrl.focus();
        return;
    }

    articleEditor.focus();
    restoreSelection();

    const safeUrl = escapeAttribute(url);

    document.execCommand(
        "insertHTML",
        false,
        `<div
            class="article-video"
            data-video-url="${safeUrl}"
        >
            <i class="fa-solid fa-play"></i>
            <strong>Vidéo intégrée</strong>
            <br>
            <small>${escapeHTML(url)}</small>
        </div>`
    );

    videoUrl.value = "";

    closeModal(videoModal);
    editorChanged();
});


/* =========================
   COVER IMAGE
========================= */

coverInput.addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file || !file.type.startsWith("image/")) return;

    coverImage = file;

    const reader = new FileReader();

    reader.onload = event => {
    coverImage.data = event.target.result;

    coverPreview.classList.add("has-image");

    coverPreview.innerHTML = `
        <img
            src="${event.target.result}"
            alt="Image de couverture"
        >
    `;
};

    reader.readAsDataURL(file);

    markAsChanged();
});


/* =========================
   EDITOR CHANGE
========================= */

articleEditor.addEventListener("input", editorChanged);
articleTitle.addEventListener("input", markAsChanged);
articleCategory.addEventListener("change", markAsChanged);

function editorChanged() {
    updateCounters();
    markAsChanged();
}


/* =========================
   COUNTERS
========================= */

function updateCounters() {
    const text = articleEditor.innerText.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const images = articleEditor.querySelectorAll("img").length;
    const videos = articleEditor.querySelectorAll(".article-video").length;

    wordCount.textContent =
        `${words} mot${words !== 1 ? "s" : ""}`;

    summaryWords.textContent = words;
    summaryImages.textContent = images;
    summaryVideos.textContent = videos;
}


/* =========================
   AUTOSAVE
========================= */

function markAsChanged() {
    setAutosaveStatus(
        "saving",
        "Modifications en attente..."
    );

    clearTimeout(autosaveTimer);

    autosaveTimer = setTimeout(autoSave, 2500);
}

function autoSave() {
    const data = getArticleData();

    localStorage.setItem(
        "nizal_article_draft",
        JSON.stringify(data)
    );

    savedState = JSON.stringify(data);

    setAutosaveStatus(
        "saved",
        "Enregistré automatiquement"
    );
}

function setAutosaveStatus(type, message) {
    saveDot.className = "save-dot";

    if (type) {
        saveDot.classList.add(type);
    }

    autosaveText.textContent = message;
}


/* =========================
   GET ARTICLE DATA
========================= */

function getArticleData() {
    return {
        title: articleTitle.value.trim(),
        category: articleCategory.value,
        cover: coverImage ? coverImage.data : null,
        content: articleEditor.innerHTML,
        updatedAt: new Date().toISOString()
    };
}


/* =========================
   VALIDATION
========================= */

function validateArticle() {
    let valid = true;

    titleError.textContent = "";
    categoryError.textContent = "";

    if (!articleTitle.value.trim()) {
        titleError.textContent =
            "Le titre est obligatoire.";
        valid = false;
    }

    if (!articleCategory.value) {
        categoryError.textContent =
            "Veuillez sélectionner une catégorie.";
        valid = false;
    }

    if (!articleEditor.innerText.trim()) {
        showToast(
            "Le contenu de l'article est obligatoire."
        );
        valid = false;
    }

    return valid;
}


/* =========================
   PUBLISH
========================= */

publishBtn.addEventListener("click", async () => {

    if (!validateArticle()) return;

    const article = getArticleData();

    try {

        const response = await fetch(
            "http://localhost:5000/api/articles/create",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: article.title,
                    category: article.category,
                    cover_image: article.cover,
                    content: article.content,
                    status: "published"
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        localStorage.removeItem("nizal_article_draft");
savedState = null;

showToast("Article publié avec succès.");

setTimeout(() => {
    window.location.href = "articles.html";
}, 1200);

    } catch (error) {

        console.error("Publish error:", error);

        showToast("Erreur lors de la publication.");
    }
});


/* =========================
   PREVIEW
========================= */

previewBtn.addEventListener("click", () => {

    previewContent.innerHTML = "";

    const cover = coverPreview.querySelector("img");

    if (cover) {
        const previewCover = cover.cloneNode(true);
        previewCover.classList.add("preview-cover");
        previewContent.appendChild(previewCover);
    }

    const title = document.createElement("h1");

    title.textContent =
        articleTitle.value || "Sans titre";

    previewContent.appendChild(title);

    const content = document.createElement("div");

    content.innerHTML = articleEditor.innerHTML;

    previewContent.appendChild(content);

    previewModal.classList.add("show");
});


/* =========================
   MODALS
========================= */

document.querySelectorAll("[data-close]").forEach(button => {

    button.addEventListener("click", () => {

        const modal =
            document.getElementById(button.dataset.close);

        closeModal(modal);
    });
});

document.querySelectorAll(".modal-overlay").forEach(modal => {

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeModal(modal);
        }
    });
});

function closeModal(modal) {
    modal.classList.remove("show");
}


/* =========================
   TOAST
========================= */

function showToast(message) {

    toast.querySelector("span").textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}


/* =========================
   LOAD EXISTING DRAFT
========================= */

function loadDraft() {

    const draft =
        localStorage.getItem("nizal_article_draft");

    if (!draft) return;

    try {

        const data = JSON.parse(draft);

        if (data.title) {
            articleTitle.value = data.title;
        }

        if (data.category) {
            articleCategory.value = data.category;
        }

        if (data.content) {
            articleEditor.innerHTML = data.content;
        }

        updateCounters();

        setAutosaveStatus(
            "saved",
            "Brouillon récupéré"
        );

    } catch (error) {

        console.error(
            "Erreur lors du chargement du brouillon:",
            error
        );
    }
}


/* =========================
   INITIALIZATION
========================= */

updateCounters();
loadDraft();