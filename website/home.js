"use strict";

(() => {
    const API_BASE = "http://localhost:5000/api";
    const FALLBACK_IMAGE = "../assest/logo.png";
    const articleGrid = document.getElementById("home-feature-grid");
    const eventGrid = document.getElementById("event-grid");
    const productGrid = document.getElementById("product-grid");
    const tournamentCount = document.getElementById("home-tournament-count");

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function parseDate(value) {
        if (!value) return null;
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
        const normalized = String(value).replace(" ", "T");
        const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value, options = {}) {
        const date = parseDate(value);
        if (!date) return "Date à confirmer";
        return new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            ...options
        }).format(date);
    }

    function imageSource(value) {
        const raw = String(value || "").trim();
        if (!raw) return FALLBACK_IMAGE;
        if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
        if (raw.startsWith("/")) return `${API_BASE.replace(/\/api$/, "")}${raw}`;
        if (raw.startsWith("uploads/")) return `${API_BASE.replace(/\/api$/, "")}/${raw}`;
        if (raw.startsWith("assest/") || raw.startsWith("assets/")) return `../${raw}`;
        if (/^[A-Za-z0-9+/]+={0,2}$/.test(raw.replace(/\s/g, "")) && raw.length > 80) {
            const base64 = raw.replace(/\s/g, "");
            const mime = base64.startsWith("iVBORw0KGgo")
                ? "image/png"
                : base64.startsWith("R0lGOD")
                    ? "image/gif"
                    : base64.startsWith("UklGR")
                        ? "image/webp"
                        : "image/jpeg";
            return `data:${mime};base64,${base64}`;
        }
        return `${API_BASE.replace(/\/api$/, "")}/${raw.replace(/^\.\//, "")}`;
    }

    function setLoading(container, message) {
        if (!container) return;
        container.replaceChildren(element("p", "col-span-full py-8 text-center text-on-surface-variant", message));
    }

    function setError(container, message, retry) {
        if (!container) return;
        container.replaceChildren();
        const wrapper = element("div", "col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800");
        wrapper.append(element("p", "", message));
        const button = element("button", "mt-3 rounded-lg bg-red-700 px-4 py-2 text-white", "Réessayer");
        button.type = "button";
        button.addEventListener("click", retry);
        wrapper.append(button);
        container.append(wrapper);
    }

    async function getCollection(endpoint) {
        const response = await fetch(`${API_BASE}/${endpoint}`, {
            headers: { Accept: "application/json" }
        });

        let result;
        try {
            result = await response.json();
        } catch {
            throw new Error("Le serveur a renvoyé une réponse invalide.");
        }

        if (!response.ok || result.success === false) {
            throw new Error(result.message || `Erreur HTTP ${response.status}.`);
        }

        const collection = Array.isArray(result) ? result : result.data;
        if (!Array.isArray(collection)) {
            throw new Error("Format de réponse API invalide.");
        }
        return collection;
    }

    function articleText(article) {
        const content = article.content || article.description || article.excerpt || "";
        const parser = new DOMParser();
        return (parser.parseFromString(String(content), "text/html").body.textContent || "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function createArticleCard(article, featured) {
        const title = article.title || article.name || "Actualité NIZAL";
        const date = article.published_at || article.created_at;
        const url = `articles/article.html?id=${encodeURIComponent(article.id)}`;
        const card = element(
            "a",
            featured
                ? "lg:col-span-7 flex flex-col rounded-xl overflow-hidden bg-surface-container-low shadow-sm hover:shadow-md transition-shadow group"
                : "flex gap-space-md p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors group"
        );
        card.href = url;

        const imageWrap = element(
            "div",
            featured
                ? "relative h-72 sm:h-96 w-full overflow-hidden"
                : "w-32 h-24 sm:w-36 sm:h-28 rounded-md overflow-hidden shrink-0"
        );
        const image = element(
            "img",
            `w-full h-full object-cover group-hover:scale-105 transition-transform ${featured ? "duration-500" : "duration-300"}`
        );
        image.src = imageSource(article.cover_image || article.image || article.image_url);
        image.alt = title;
        image.loading = "lazy";
        image.addEventListener("error", () => {
            image.src = FALLBACK_IMAGE;
        }, { once: true });
        imageWrap.append(image);
        card.append(imageWrap);

        const category = article.category || article.sport || "ACTUALITÉS";
        if (featured) {
            const badge = element(
                "span",
                "absolute top-4 left-4 px-3 py-1 bg-primary-container text-on-primary font-headline-sm text-xs uppercase tracking-widest rounded",
                category
            );
            imageWrap.append(badge);

            const content = element("div", "p-space-lg flex flex-col gap-space-xs flex-1 justify-between bg-surface-container-lowest");
            const info = element("div", "flex items-center gap-space-sm text-on-surface-variant font-label-sm text-label-sm mb-2");
            info.append(
                element("span", "text-secondary-container font-bold uppercase", category),
                element("span", "", "•"),
                element("span", "", formatDate(date))
            );
            content.append(
                info,
                element("h3", "font-headline-md text-headline-md uppercase text-on-surface group-hover:text-primary transition-colors mb-2", title),
                element("p", "font-body-md text-body-md text-on-surface-variant", articleText(article).slice(0, 260) || "Découvrez cette actualité sur NIZAL.")
            );
            const callToAction = element("span", "pt-space-md font-label-md text-label-md uppercase tracking-wider text-primary font-bold inline-flex items-center gap-1");
            callToAction.append(document.createTextNode("Lire l’article complet "));
            callToAction.append(element("span", "material-symbols-outlined text-[16px]", "chevron_right"));
            content.append(callToAction);
            card.append(content);
        } else {
            const content = element("div", "flex flex-col justify-between flex-1 min-w-0");
            const titleBlock = element("div");
            titleBlock.append(
                element("span", "font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold", category),
                element("h4", "font-headline-sm text-headline-sm uppercase text-on-surface truncate group-hover:text-secondary transition-colors", title)
            );
            content.append(titleBlock, element("span", "font-label-sm text-label-sm text-on-surface-variant", formatDate(date)));
            card.append(content);
        }
        return card;
    }

    async function loadArticles() {
        if (!articleGrid) return;
        setLoading(articleGrid, "Chargement des actualités…");
        try {
            const articles = await getCollection("articles");
            const published = articles
                .filter(article => !article.status || String(article.status).toLowerCase() === "published")
                .sort((first, second) =>
                    (parseDate(second.published_at || second.created_at)?.getTime() || 0) -
                    (parseDate(first.published_at || first.created_at)?.getTime() || 0)
                )
                .slice(0, 4);
            articleGrid.replaceChildren();
            if (!published.length) {
                setLoading(articleGrid, "Aucune actualité publiée pour le moment.");
                return;
            }

            articleGrid.classList.add("lg:grid-cols-12");
            articleGrid.append(createArticleCard(published[0], true));
            const secondary = element("div", "lg:col-span-5 flex flex-col gap-space-md");
            published.slice(1).forEach(article => secondary.append(createArticleCard(article, false)));
            articleGrid.append(secondary);
        } catch (error) {
            console.error("Erreur chargement actualités de l’accueil :", error);
            setError(articleGrid, `Impossible de charger les actualités. ${error.message}`, loadArticles);
        }
    }

    function eventStatus(event, today) {
        const opening = parseDate(event.opening_date);
        const closing = parseDate(event.closing_date);
        if (opening && opening > today) return "Inscriptions à venir";
        if (closing && closing < today) return "Inscriptions clôturées";
        if (opening || closing) return "Inscriptions ouvertes";
        return "Événement à venir";
    }

    function createEventCard(event) {
        const title = event.name || "Compétition NIZAL";
        const date = parseDate(event.start_date);
        const url = `event/eventDetails.html?id=${encodeURIComponent(event.id)}`;
        const card = element("article", "bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-space-md");
        const top = element("div", "flex items-start justify-between");
        const dateBlock = element("div", "px-3 py-2 rounded bg-surface-container flex flex-col items-center min-w-[64px]");
        dateBlock.append(
            element("span", "font-display text-headline-md text-primary leading-none", date ? String(date.getDate()).padStart(2, "0") : "—"),
            element("span", "font-label-sm text-label-sm uppercase font-bold text-on-surface", date ? new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", "").toUpperCase() : "DATE")
        );
        top.append(dateBlock, element("span", "px-2.5 py-1 rounded-full text-xs font-label-sm uppercase bg-secondary-container/10 text-secondary-container font-bold", event.sport || event.discipline || "Compétition"));

        const details = element("div");
        const state = element("span", "inline-flex items-center gap-1.5 text-xs text-on-surface-variant font-label-sm uppercase mb-1");
        const dot = element("span", "w-1.5 h-1.5 rounded-full bg-emerald-500");
        state.append(dot, document.createTextNode(eventStatus(event, new Date(new Date().setHours(0, 0, 0, 0)))));
        details.append(
            state,
            element("h3", "font-headline-md text-headline-md uppercase text-on-surface", title)
        );
        const location = event.city || event.location || "Lieu à confirmer";
        const locationRow = element("p", "font-body-md text-body-md text-on-surface-variant flex items-center gap-1 mt-1");
        locationRow.append(element("span", "material-symbols-outlined text-[16px] text-primary", "location_on"), document.createTextNode(location));
        details.append(locationRow);

        const footer = element("div", "pt-space-sm flex items-center justify-between");
        footer.append(
            element("span", "font-label-sm text-label-sm text-on-surface-variant font-medium", formatDate(event.start_date)),
            element("a", "px-4 py-2 rounded bg-primary-container text-on-primary font-headline-sm text-xs uppercase tracking-wider hover:bg-primary transition-colors", "Voir l’événement")
        );
        footer.querySelector("a").href = url;
        card.append(top, details, footer);
        return card;
    }

    async function loadEvents() {
        if (!eventGrid) return;
        setLoading(eventGrid, "Chargement des événements…");
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const events = (await getCollection("competitions"))
                .filter(event => {
                    const date = parseDate(event.start_date);
                    return date && date >= today;
                })
                .sort((first, second) => parseDate(first.start_date) - parseDate(second.start_date));

            if (tournamentCount) tournamentCount.textContent = `${events.length} événements à venir`;
            eventGrid.replaceChildren();
            if (!events.length) {
                setLoading(eventGrid, "Aucun événement à venir pour le moment.");
                return;
            }
            events.slice(0, 3).forEach(event => eventGrid.append(createEventCard(event)));
        } catch (error) {
            console.error("Erreur chargement événements de l’accueil :", error);
            if (tournamentCount) tournamentCount.textContent = "Événements indisponibles";
            setError(eventGrid, `Impossible de charger les événements. ${error.message}`, loadEvents);
        }
    }

    function productImage(product) {
        return product.cover_image || product.image_url || product.image || product.imageUrl || "";
    }

    function formatPrice(value) {
        return `${new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 2 }).format(Number(value) || 0)} DA`;
    }

    function createProductCard(product) {
        const card = element("a", "bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between shadow-sm hover:shadow-md transition-all group");
        card.href = `boutique/proudct.html?id=${encodeURIComponent(product.id)}`;
        const imageWrap = element("div", "relative bg-surface-container-lowest rounded-lg p-4 mb-space-sm flex items-center justify-center overflow-hidden aspect-square");
        const imageValue = productImage(product);
        if (Number(product.discount) > 0) {
            imageWrap.append(element("span", "absolute top-2 left-2 px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-[10px] uppercase font-bold", `-${Number(product.discount)}%`));
        }
        const image = element("img", "max-h-48 max-w-full object-contain group-hover:scale-105 transition-transform duration-300");
        image.src = imageSource(imageValue);
        image.alt = product.name || "Produit NIZAL";
        image.loading = "lazy";
        image.addEventListener("error", () => {
            image.src = FALLBACK_IMAGE;
        }, { once: true });
        imageWrap.append(image);

        const info = element("div");
        info.append(
            element("span", "font-label-sm text-label-sm uppercase text-secondary", product.category || "Boutique NIZAL"),
            element("h3", "font-headline-sm text-headline-sm uppercase text-on-surface line-clamp-1", product.name || "Produit NIZAL"),
            element("p", "font-body-sm text-body-sm text-on-surface-variant line-clamp-2", product.description || "")
        );
        const price = Number(product.price) || 0;
        const discount = Math.min(100, Math.max(0, Number(product.discount) || 0));
        const priceBlock = element("div", "pt-space-md flex items-center justify-between mt-auto");
        priceBlock.append(
            element("span", "font-display text-headline-sm text-primary", formatPrice(price * (1 - discount / 100))),
            element("span", "h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-1.5 shadow-sm", "Voir le produit")
        );
        card.append(imageWrap, info, priceBlock);
        return card;
    }

    async function loadProducts() {
        if (!productGrid) return;
        setLoading(productGrid, "Chargement des produits…");
        try {
            const products = await getCollection("products");
            productGrid.replaceChildren();
            if (!products.length) {
                setLoading(productGrid, "Aucun produit disponible pour le moment.");
                return;
            }
            products.slice(0, 4).forEach(product => productGrid.append(createProductCard(product)));
        } catch (error) {
            console.error("Erreur chargement produits de l’accueil :", error);
            setError(productGrid, `Impossible de charger les produits. ${error.message}`, loadProducts);
        }
    }

    loadArticles();
    loadEvents();
    loadProducts();
})();
