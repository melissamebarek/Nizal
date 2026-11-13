"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:5000/api";
    const routes = {
        articles: `${API_BASE}/articles`,
        products: `${API_BASE}/products`,
        registrations: `${API_BASE}/registrations`,
        orders: `${API_BASE}/orders`,
        competitions: `${API_BASE}/competitions`
    };

    async function loadCollection(url, label) {
        const response = await fetch(url, {
            headers: { Accept: "application/json" }
        });

        let result;
        try {
            result = await response.json();
        } catch {
            throw new Error(`${label} : réponse du serveur invalide.`);
        }

        if (!response.ok || result.success === false) {
            throw new Error(result.message || `${label} : erreur HTTP ${response.status}.`);
        }

        const collection = Array.isArray(result) ? result : result.data;
        if (!Array.isArray(collection)) {
            throw new Error(`${label} : format de réponse API invalide.`);
        }

        return collection;
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    }

    function formatDate(value) {
        if (!value) return "Date inconnue";
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
        const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value);
        if (Number.isNaN(date.getTime())) return "Date inconnue";
        return new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }

    function relativeDate(value) {
        if (!value) return "Date inconnue";
        const date = parseDate(value);
        if (!date) return formatDate(value);

        const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
        if (minutes < 1) return "À l’instant";
        if (minutes < 60) return `Il y a ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Il y a ${hours} h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
        return formatDate(value);
    }

    function parseDate(value) {
        if (!value) return null;
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
        const normalized = String(value).replace(" ", "T");
        const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function renderError(id, message) {
        const element = document.getElementById(id);
        if (!element) return;
        element.textContent = message;
        element.classList.add("dashboard-error");
    }

    function statusText(competition, today) {
        const opening = parseDate(competition.opening_date);
        const closing = parseDate(competition.closing_date);
        if (opening && opening > today) return { label: "À venir", className: "upcoming" };
        if (closing && closing < today) return { label: "Terminée", className: "upcoming" };
        if (opening || closing) return { label: "Ouverte", className: "open" };
        const start = parseDate(competition.start_date);
        if (start && start >= today) return { label: "À venir", className: "upcoming" };
        return { label: "Planifiée", className: "upcoming" };
    }

    function renderCompetitions(competitions) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = competitions
            .map(competition => ({ competition, start: parseDate(competition.start_date) }))
            .filter(item => item.start && item.start >= today)
            .sort((first, second) => first.start - second.start);
        const openCount = competitions.filter(competition => {
            const opening = parseDate(competition.opening_date);
            const closing = parseDate(competition.closing_date);
            return (!opening || opening <= today) && (!closing || closing >= today);
        }).length;

        setText("upcomingCompetitionsCount", upcoming.length);
        setText("openCompetitionsCount", openCount);

        const list = document.getElementById("competitionList");
        if (!list) return;
        list.replaceChildren();

        if (!upcoming.length) {
            const empty = document.createElement("p");
            empty.className = "dashboard-empty";
            empty.textContent = "Aucune compétition à venir.";
            list.append(empty);
            return;
        }

        upcoming.slice(0, 3).forEach(({ competition }) => {
            const row = document.createElement("div");
            row.className = "competition-item";

            const iconWrap = document.createElement("div");
            iconWrap.className = "competition-icon";
            const icon = document.createElement("i");
            icon.className = "fa-solid fa-trophy";
            iconWrap.append(icon);

            const info = document.createElement("div");
            info.className = "competition-info";
            const name = document.createElement("strong");
            name.textContent = competition.name || "Compétition sans nom";
            const meta = document.createElement("span");
            meta.textContent = [
                competition.city || competition.location,
                formatDate(competition.start_date)
            ].filter(Boolean).join(" · ");
            info.append(name, meta);

            const state = statusText(competition, today);
            const badge = document.createElement("span");
            badge.className = `status ${state.className}`;
            badge.textContent = state.label;

            row.append(iconWrap, info, badge);
            list.append(row);
        });
    }

    function renderActivity(collections, hasPartialFailure = false) {
        const entries = [
            ...collections.registrations.map(item => ({
                type: "registration",
                label: `Nouvelle inscription : ${[item.first_name, item.last_name].filter(Boolean).join(" ") || item.registration_number || `#${item.id}`}`,
                date: item.created_at,
                icon: "fa-clipboard-check",
                color: "blue",
                href: `registrations/registration-details.html?id=${encodeURIComponent(item.id)}`
            })),
            ...collections.orders.map(item => ({
                type: "order",
                label: `Nouvelle commande : ${item.order_number || `#${item.id}`}`,
                date: item.created_at,
                icon: "fa-box",
                color: "red",
                href: "orders/orders.html"
            })),
            ...collections.articles.map(item => ({
                type: "article",
                label: item.status === "published"
                    ? `Article publié : ${item.title || "Sans titre"}`
                    : `Article créé : ${item.title || "Sans titre"}`,
                date: item.published_at || item.created_at,
                icon: "fa-newspaper",
                color: "blue",
                href: "articles/articles.html"
            })),
            ...collections.products.map(item => ({
                type: "product",
                label: `Produit ajouté : ${item.name || "Sans nom"}`,
                date: item.created_at,
                icon: "fa-store",
                color: "red",
                href: "boutique/products.html"
            }))
        ].filter(item => parseDate(item.date))
            .sort((first, second) => parseDate(second.date) - parseDate(first.date))
            .slice(0, 5);

        const list = document.getElementById("activityList");
        if (!list) return;
        list.replaceChildren();

        if (!entries.length) {
            const empty = document.createElement("p");
            empty.className = "dashboard-empty";
            empty.textContent = hasPartialFailure
                ? "Activités indisponibles. Vérifiez la connexion au serveur."
                : "Aucune activité récente.";
            list.append(empty);
            return;
        }

        entries.forEach(entry => {
            const row = document.createElement("div");
            row.className = "activity-item";
            const iconWrap = document.createElement("div");
            iconWrap.className = `activity-icon ${entry.color}`;
            const icon = document.createElement("i");
            icon.className = `fa-solid ${entry.icon}`;
            iconWrap.append(icon);

            const info = document.createElement("div");
            info.className = "activity-info";
            const label = document.createElement("strong");
            label.textContent = entry.label;
            const date = document.createElement("span");
            date.textContent = relativeDate(entry.date);
            info.append(label, date);

            const link = document.createElement("a");
            link.href = entry.href;
            link.className = "activity-link";
            link.setAttribute("aria-label", `Ouvrir : ${entry.label}`);
            link.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';

            row.append(iconWrap, info, link);
            list.append(row);
        });

        if (hasPartialFailure) {
            const warning = document.createElement("p");
            warning.className = "dashboard-warning";
            warning.textContent = "Certaines activités n’ont pas pu être chargées.";
            list.append(warning);
        }
    }

    async function loadDashboard() {
        const endpoints = Object.entries(routes);
        const results = await Promise.allSettled(
            endpoints.map(([, url]) => loadCollection(url, "Chargement des données"))
        );
        const data = {};
        const failures = [];

        results.forEach((result, index) => {
            const [key] = endpoints[index];
            if (result.status === "fulfilled") {
                data[key] = result.value;
                return;
            }

            data[key] = [];
            console.error(`Dashboard ${key} API request failed:`, result.reason);
            failures.push(key);
        });

        const countLabels = {
            articles: "articlesCount",
            products: "productsCount",
            registrations: "registrationsCount",
            orders: "ordersCount"
        };
        Object.entries(countLabels).forEach(([key, id]) => {
            if (failures.includes(key)) {
                renderError(id, "Erreur");
            } else {
                setText(id, data[key].length);
            }
        });

        if (failures.includes("competitions")) {
            renderError("upcomingCompetitionsCount", "Erreur");
            renderError("openCompetitionsCount", "Erreur");
            renderError("competitionList", "Impossible de charger les compétitions.");
        } else {
            renderCompetitions(data.competitions);
        }

        renderActivity(
            data,
            failures.some(key => ["registrations", "orders", "articles", "products"].includes(key))
        );
    }

    loadDashboard();
});
