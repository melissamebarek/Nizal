/* =========================
   ELEMENTS
========================= */

const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobileMenu");

const articleTitle = document.getElementById("articleTitle");
const articleCategory = document.getElementById("articleCategory");
const articleEditor = document.getElementById("articleEditor");

const imageInput = document.getElementById("imageInput");

const linkModal = document.getElementById("linkModal");
const videoModal = document.getElementById("videoModal");
const previewModal = document.getElementById("previewModal");

const saveStatus = document.getElementById("saveStatus");
const saveDot = document.getElementById("saveDot");
const lastSaved = document.getElementById("lastSaved");

const wordCount = document.getElementById("wordCount");
const imageCount = document.getElementById("imageCount");
const videoCount = document.getElementById("videoCount");

const summaryWords = document.getElementById("summaryWords");
const summaryImages = document.getElementById("summaryImages");
const summaryVideos = document.getElementById("summaryVideos");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const coverInput = document.getElementById("coverInput");
const coverImage = document.getElementById("coverImage");
const changeCoverBtn = document.getElementById("changeCoverBtn");
const removeCoverBtn = document.getElementById("removeCoverBtn");


/* =========================
   ARTICLE ID
========================= */

const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");


/* =========================
   MOBILE SIDEBAR
========================= */

if (mobileMenu) {

    mobileMenu.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

}


/* =========================
   SAVED SELECTION
========================= */

let savedSelection = null;

function saveSelection() {

    const selection = window.getSelection();

    if (!selection.rangeCount) {
        return;
    }

    const range = selection.getRangeAt(0);

    if (articleEditor.contains(range.commonAncestorContainer)) {
        savedSelection = range.cloneRange();
    }

}

function restoreSelection() {

    if (!savedSelection) {
        return;
    }

    const selection = window.getSelection();

    selection.removeAllRanges();
    selection.addRange(savedSelection);

}


/* =========================
   EDITOR FOCUS
========================= */

articleEditor.addEventListener("mouseup", saveSelection);
articleEditor.addEventListener("keyup", saveSelection);


/* =========================
   FORMAT BUTTONS
========================= */

document.querySelectorAll("[data-command]").forEach(button => {

    button.addEventListener("click", () => {

        articleEditor.focus();

        const command = button.dataset.command;

        document.execCommand(command, false, null);

        updateCounters();
        scheduleAutosave();

    });

});


/* =========================
   FORMAT SELECT
========================= */

document
    .getElementById("formatSelect")
    .addEventListener("change", function () {

        articleEditor.focus();

        document.execCommand(
            "formatBlock",
            false,
            this.value
        );

        updateCounters();
        scheduleAutosave();

    });


/* =========================
   IMAGE INSERT
========================= */

document
    .getElementById("imageBtn")
    .addEventListener("click", () => {

        saveSelection();
        imageInput.click();

    });


imageInput.addEventListener("change", function () {

    const files = Array.from(this.files);

    if (!files.length) {
        return;
    }

    restoreSelection();

    files.forEach(file => {

        if (!file.type.startsWith("image/")) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "article-media";

            const image =
                document.createElement("img");

            image.src =
                event.target.result;

            image.alt =
                "Image de l'article";

            const deleteBtn =
                createDeleteButton(
                    "Supprimer l’image"
                );

            wrapper.appendChild(image);
            wrapper.appendChild(deleteBtn);

            insertNodeAtCursor(wrapper);

            const paragraph =
                document.createElement("p");

            paragraph.innerHTML = "<br>";

            wrapper.after(paragraph);

            updateCounters();
            scheduleAutosave();

        };

        reader.readAsDataURL(file);

    });

    imageInput.value = "";

});


/* =========================
   INSERT NODE
========================= */

function insertNodeAtCursor(node) {

    articleEditor.focus();

    const selection =
        window.getSelection();

    if (!selection.rangeCount) {

        articleEditor.appendChild(node);

        return;

    }

    const range =
        selection.getRangeAt(0);

    if (
        !articleEditor.contains(
            range.commonAncestorContainer
        )
    ) {

        articleEditor.appendChild(node);

        return;

    }

    range.deleteContents();

    range.insertNode(node);

    range.setStartAfter(node);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

}


/* =========================
   DELETE BUTTON
========================= */

function createDeleteButton(title) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "media-delete-btn";

    button.title =
        title;

    button.innerHTML =
        '<i class="fa-solid fa-xmark"></i>';

    button.addEventListener("click", function (event) {

        event.preventDefault();
        event.stopPropagation();

        const media =
            button.closest(".article-media");

        if (media) {

            media.remove();

            updateCounters();
            scheduleAutosave();

        }

    });

    return button;

}


/* =========================
   INITIAL MEDIA BUTTONS
========================= */

function setupMediaDeleteButtons() {

    const mediaItems =
        articleEditor.querySelectorAll(
            ".article-media"
        );

    mediaItems.forEach(media => {

        let deleteButton =
            media.querySelector(
                ".media-delete-btn"
            );

        if (deleteButton) {

            if (
                deleteButton.dataset.ready === "true"
            ) {
                return;
            }

            deleteButton.dataset.ready =
                "true";

            deleteButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    media.remove();

                    updateCounters();
                    scheduleAutosave();

                }
            );

            return;
        }

        const image =
            media.querySelector("img");

        const video =
            media.querySelector("iframe");

        if (image || video) {

            deleteButton =
                createDeleteButton(
                    image
                        ? "Supprimer l’image"
                        : "Supprimer la vidéo"
                );

            media.appendChild(
                deleteButton
            );

        }

    });

}


/* =========================
   VIDEO MODAL
========================= */

document
    .getElementById("videoBtn")
    .addEventListener("click", () => {

        saveSelection();

        openModal(videoModal);

        setTimeout(() => {

            document
                .getElementById("videoUrl")
                .focus();

        }, 100);

    });


/* =========================
   INSERT VIDEO
========================= */

document
    .getElementById("insertVideoBtn")
    .addEventListener("click", () => {

        const input =
            document.getElementById(
                "videoUrl"
            );

        const url =
            input.value.trim();

        if (!url) {

            showToast(
                "Veuillez entrer une URL vidéo."
            );

            return;

        }

        const embedUrl =
            convertToEmbedUrl(url);

        if (!embedUrl) {

            showToast(
                "URL vidéo non valide."
            );

            return;

        }

        restoreSelection();

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "article-media article-video";

        const videoWrapper =
            document.createElement("div");

        videoWrapper.className =
            "video-wrapper";

        const iframe =
            document.createElement("iframe");

        iframe.src =
            embedUrl;

        iframe.title =
            "Vidéo de l'article";

        iframe.setAttribute(
            "allowfullscreen",
            ""
        );

        videoWrapper.appendChild(
            iframe
        );

        wrapper.appendChild(
            videoWrapper
        );

        const deleteButton =
            createDeleteButton(
                "Supprimer la vidéo"
            );

        wrapper.appendChild(
            deleteButton
        );

        insertNodeAtCursor(wrapper);

        const paragraph =
            document.createElement("p");

        paragraph.innerHTML =
            "<br>";

        wrapper.after(paragraph);

        closeModal(videoModal);

        input.value = "";

        updateCounters();
        scheduleAutosave();

    });


/* =========================
   YOUTUBE EMBED
========================= */

function convertToEmbedUrl(url) {

    try {

        const parsed =
            new URL(url);

        if (
            parsed.hostname.includes(
                "youtube.com"
            )
        ) {

            const videoId =
                parsed.searchParams.get("v");

            if (videoId) {

                return `https://www.youtube.com/embed/${videoId}`;

            }

        }

        if (
            parsed.hostname.includes(
                "youtu.be"
            )
        ) {

            const videoId =
                parsed.pathname.substring(1);

            if (videoId) {

                return `https://www.youtube.com/embed/${videoId}`;

            }

        }

        if (
            parsed.hostname.includes(
                "youtube.com"
            ) &&
            parsed.pathname.startsWith(
                "/embed/"
            )
        ) {

            return url;

        }

        return url;

    } catch {

        return null;

    }

}


/* =========================
   LINK MODAL
========================= */

document
    .getElementById("linkBtn")
    .addEventListener("click", () => {

        saveSelection();

        openModal(linkModal);

        setTimeout(() => {

            document
                .getElementById("linkText")
                .focus();

        }, 100);

    });


/* =========================
   INSERT LINK
========================= */

document
    .getElementById("insertLinkBtn")
    .addEventListener("click", () => {

        const text =
            document
                .getElementById("linkText")
                .value
                .trim();

        const url =
            document
                .getElementById("linkUrl")
                .value
                .trim();

        if (!text || !url) {

            showToast(
                "Veuillez remplir les deux champs."
            );

            return;

        }

        restoreSelection();

        articleEditor.focus();

        const link =
            document.createElement("a");

        link.href =
            url;

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";

        link.textContent =
            text;

        insertNodeAtCursor(link);

        closeModal(linkModal);

        document
            .getElementById("linkText")
            .value = "";

        document
            .getElementById("linkUrl")
            .value = "";

        updateCounters();
        scheduleAutosave();

    });


/* =========================
   MODAL HELPERS
========================= */

function openModal(modal) {

    modal.classList.add("active");

}

function closeModal(modal) {

    modal.classList.remove("active");

}


document
    .querySelectorAll("[data-close]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const modalId =
                    button.dataset.close;

                const modal =
                    document.getElementById(
                        modalId
                    );

                closeModal(modal);

            }
        );

    });


document
    .querySelectorAll(".modal-overlay")
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    closeModal(overlay);

                }

            }
        );

    });


document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        document
            .querySelectorAll(
                ".modal-overlay.active"
            )
            .forEach(modal => {

                closeModal(modal);

            });

    }
);


/* =========================
   COVER IMAGE
========================= */

changeCoverBtn.addEventListener(
    "click",
    () => {

        coverInput.click();

    }
);


coverInput.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];

        if (!file) {
            return;
        }

        if (
            !file.type.startsWith("image/")
        ) {

            showToast(
                "Veuillez sélectionner une image."
            );

            return;

        }

        const reader =
            new FileReader();

        reader.onload =
            function (event) {

                coverImage.src =
                    event.target.result;

                coverImage.style.display =
                    "block";

                removeCoverBtn.style.display =
                    "flex";

                scheduleAutosave();

            };

        reader.readAsDataURL(file);

    }
);


removeCoverBtn.addEventListener(
    "click",
    () => {

        coverImage.src = "";

        coverImage.style.display =
            "none";

        removeCoverBtn.style.display =
            "none";

        scheduleAutosave();

    }
);


/* =========================
   COUNTERS
========================= */

function updateCounters() {

    const text =
        articleEditor.innerText
            .trim()
            .replace(/\s+/g, " ");

    const words =
        text
            ? text.split(" ").length
            : 0;

    const images =
        articleEditor.querySelectorAll(
            "img"
        ).length;

    const videos =
        articleEditor.querySelectorAll(
            ".article-video"
        ).length;

    wordCount.textContent =
        words;

    imageCount.textContent =
        images;

    videoCount.textContent =
        videos;

    summaryWords.textContent =
        words;

    summaryImages.textContent =
        images;

    summaryVideos.textContent =
        videos;

}


/* =========================
   ARTICLE CHANGE
========================= */

articleTitle.addEventListener(
    "input",
    () => {

        scheduleAutosave();

    }
);


articleCategory.addEventListener(
    "change",
    () => {

        scheduleAutosave();

    }
);


articleEditor.addEventListener(
    "input",
    () => {

        updateCounters();

        scheduleAutosave();

    }
);


/* =========================
   AUTOSAVE
========================= */

let autosaveTimer = null;


function scheduleAutosave() {

    setSavingState();

    clearTimeout(
        autosaveTimer
    );

    autosaveTimer =
        setTimeout(
            saveDraft,
            2500
        );

}


function setSavingState() {

    saveStatus.textContent =
        "Enregistrement automatique...";

    saveDot.classList.add(
        "saving"
    );

    saveDot.classList.remove(
        "error"
    );

}


function saveDraft() {

    try {

        const article = {

            title:
                articleTitle.value,

            category:
                articleCategory.value,

            content:
                articleEditor.innerHTML,

            cover:
                coverImage.src,

            updatedAt:
                new Date().toISOString()

        };

        localStorage.setItem(
            "nizal_edit_article_draft",
            JSON.stringify(article)
        );

        saveStatus.textContent =
            "Enregistré";

        saveDot.classList.remove(
            "saving",
            "error"
        );

        lastSaved.textContent =
            "Dernière modification : maintenant";

    } catch (error) {

        saveStatus.textContent =
            "Erreur d'enregistrement";

        saveDot.classList.remove(
            "saving"
        );

        saveDot.classList.add(
            "error"
        );

    }

}


/* =========================
   LOAD ARTICLE FROM API
========================= */

async function loadArticle() {

    if (!articleId) {

        console.error(
            "Article ID missing"
        );

        showToast(
            "ID de l'article manquant."
        );

        return;

    }

    try {

        const response =
            await fetch(
                `http://localhost:5000/api/articles/${articleId}`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Erreur lors du chargement."
            );

        }

        const article =
            result.data;

        articleTitle.value =
            article.title || "";

        articleCategory.value =
            article.category || "";

        articleEditor.innerHTML =
            article.content || "";

        if (article.cover_image) {

            coverImage.src =
                article.cover_image;

            coverImage.style.display =
                "block";

            removeCoverBtn.style.display =
                "flex";

        } else {

            coverImage.src = "";

            coverImage.style.display =
                "none";

            removeCoverBtn.style.display =
                "none";

        }

        updateCounters();
        setupMediaDeleteButtons();

        saveStatus.textContent =
            "Article chargé";

        saveDot.classList.remove(
            "saving",
            "error"
        );

    } catch (error) {

        console.error(
            "Error loading article:",
            error
        );

        showToast(
            "Impossible de charger l'article."
        );

    }

}


/* =========================
   SAVE BUTTON
========================= */

document
    .getElementById("saveBtn")
    .addEventListener(
        "click",
        saveArticle
    );


/* =========================
   SAVE ARTICLE TO BACKEND
========================= */

async function saveArticle() {

    const title =
        articleTitle.value.trim();

    if (!articleId) {

        showToast(
            "ID de l'article manquant."
        );

        return;

    }

    if (!title) {

        showToast(
            "Le titre de l'article est obligatoire."
        );

        articleTitle.focus();

        return;

    }

    const saveButton =
        document.getElementById(
            "saveBtn"
        );

    try {

        saveButton.disabled = true;

        saveStatus.textContent =
            "Enregistrement...";

        saveDot.classList.add(
            "saving"
        );

        const response =
            await fetch(
                `http://localhost:5000/api/articles/${articleId}/update`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title:
                            title,

                        category:
                            articleCategory.value,

                        cover_image:
                            coverImage.src || null,

                        content:
                            articleEditor.innerHTML,

                        status:
                            "published"

                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Erreur lors de la modification."
            );

        }

        localStorage.removeItem(
            "nizal_edit_article_draft"
        );

        saveStatus.textContent =
            "Enregistré";

        saveDot.classList.remove(
            "saving",
            "error"
        );

        lastSaved.textContent =
            "Dernière modification : maintenant";

        showToast(
            "Article enregistré avec succès."
        );

        setTimeout(() => {

            window.location.href =
                `article-details.html?id=${articleId}`;

        }, 900);

    } catch (error) {

        console.error(
            "Update article error:",
            error
        );

        saveStatus.textContent =
            "Erreur d'enregistrement";

        saveDot.classList.remove(
            "saving"
        );

        saveDot.classList.add(
            "error"
        );

        showToast(
            "Erreur lors de l'enregistrement."
        );

    } finally {

        saveButton.disabled = false;

    }

}


/* =========================
   CANCEL
========================= */

document
    .getElementById("cancelBtn")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                `article-details.html?id=${articleId}`;

        }
    );


/* =========================
   PREVIEW
========================= */

document
    .getElementById("previewBtn")
    .addEventListener(
        "click",
        () => {

            const previewTitle =
                document.getElementById(
                    "previewTitle"
                );

            const previewCategory =
                document.getElementById(
                    "previewCategory"
                );

            const previewContent =
                document.getElementById(
                    "previewContent"
                );

            previewTitle.textContent =
                articleTitle.value ||
                "Sans titre";

            previewCategory.textContent =
                articleCategory.value;

            const clone =
                articleEditor.cloneNode(
                    true
                );

            clone
                .querySelectorAll(
                    ".media-delete-btn"
                )
                .forEach(button => {

                    button.remove();

                });

            previewContent.innerHTML =
                clone.innerHTML;

            openModal(
                previewModal
            );

        }
    );


/* =========================
   TOAST
========================= */

let toastTimer = null;


function showToast(message) {

    toastMessage.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================
   INITIALIZE
========================= */

loadArticle();

setupMediaDeleteButtons();

updateCounters();


setTimeout(() => {

    setupMediaDeleteButtons();

    updateCounters();

}, 100);