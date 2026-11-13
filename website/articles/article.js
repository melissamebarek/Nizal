(() => {
  "use strict";

  const API_BASE = "http://localhost:5000/api/articles";
  const FALLBACK_IMAGE = "https://placehold.co/1200x800/111827/ffffff?text=NIZAL";

  const $ = (id) => document.getElementById(id);
  const titleEl = $("article-title");
  const excerptEl = $("article-excerpt");
  const authorEl = $("article-author");
  const dateEl = $("article-date");
  const coverEl = $("article-cover");
  const contentEl = $("article-content");
  const categoryEl = $("article-category");

  function formatDate(value) {
    if (!value) return "Date non disponible";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date non disponible";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    }).format(date);
  }

  function plainTextFromHtml(value) {
    const parsed = new DOMParser().parseFromString(String(value || ""), "text/html");
    return (parsed.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  function showError(message) {
    titleEl.textContent = "Article indisponible";
    excerptEl.textContent = message;
    contentEl.innerHTML = "";
    const error = document.createElement("p");
    error.className = "article-error";
    error.textContent = message;
    contentEl.appendChild(error);
  }

  async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get("id");

    if (!articleId || !/^\d+$/.test(articleId)) {
      showError("Aucun identifiant d’article valide n’a été fourni dans l’URL. Ouvrez un article depuis la page Actualités.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(articleId)}`, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Cet article n’existe pas ou n’est pas disponible.");
        throw new Error(`Erreur du serveur (${response.status}).`);
      }

      const result = await response.json();
      // Supports APIs returning either { success, data: article } or the article directly.
      const article = result && result.data ? result.data : result;
      if (!article || typeof article !== "object" || article.id == null) {
        throw new Error("Le serveur n’a pas renvoyé un article valide.");
      }

      const title = article.title || "Article sans titre";
      const rawContent = article.content || "";
      const excerpt = plainTextFromHtml(rawContent).slice(0, 220);

      document.title = `${title} | NIZAL`;
      titleEl.textContent = title;
      excerptEl.textContent = excerpt ? `${excerpt}${excerpt.length >= 220 ? "…" : ""}` : "Aucun résumé disponible pour cet article.";
      authorEl.textContent = article.author || "NIZAL Rédaction";
      dateEl.textContent = formatDate(article.published_at || article.created_at);
      categoryEl.textContent = article.category && article.category !== "all" ? article.category : "Actualités";

      if (article.cover_image) {
        // Supports data URLs, Base64-only strings, and ordinary image URLs.
        const image = String(article.cover_image).trim();
        coverEl.src = image.startsWith("data:") || /^https?:\/\//i.test(image)
          ? image
          : `data:image/jpeg;base64,${image}`;
      } else {
        coverEl.src = FALLBACK_IMAGE;
      }
      coverEl.alt = title;
      coverEl.onerror = () => { coverEl.onerror = null; coverEl.src = FALLBACK_IMAGE; };

      if (window.DOMPurify) {
        contentEl.innerHTML = DOMPurify.sanitize(rawContent, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
          FORBID_ATTR: ["style"]
        });
      } else {
        // Safe fallback: render as text if the sanitizer CDN cannot be loaded.
        contentEl.textContent = plainTextFromHtml(rawContent) || "Aucun contenu disponible.";
      }

      if (!contentEl.textContent.trim()) {
        contentEl.textContent = "Aucun contenu disponible pour cet article.";
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l’article :", error);
      showError(error.message || "Impossible de charger cet article. Vérifiez que le backend est lancé.");
    }
  }

  document.addEventListener("DOMContentLoaded", loadArticle);
})();
