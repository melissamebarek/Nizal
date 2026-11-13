(function () {
    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        return;
    }

    const dashboardUrl = new URL("./", document.currentScript.src);
    const currentPath = window.location.pathname.toLowerCase();
    const sidebarStylesheet = new URL("sidabar.css", dashboardUrl).href;

    if (![...document.styleSheets].some(stylesheet => stylesheet.href === sidebarStylesheet)) {
        const stylesheetLink = document.createElement("link");
        stylesheetLink.rel = "stylesheet";
        stylesheetLink.href = sidebarStylesheet;
        document.head.append(stylesheetLink);
    }

    const sections = [
        { key: "home", label: "Accueil", icon: "fa-house", path: "index.html" },
        { key: "articles", label: "Articles", icon: "fa-newspaper", path: "articles/articles.html" },
        { key: "products", label: "Produits & Boutique", icon: "fa-bag-shopping", path: "boutique/products.html" },
        { key: "competitions", label: "Compétitions", icon: "fa-trophy", path: "competitions/competitions.html" },
        { key: "registrations", label: "Inscriptions", icon: "fa-file-signature", path: "registrations/registrations.html" },
        { key: "orders", label: "Commandes", icon: "fa-box", path: "orders/orders.html" }
    ];

    const activeKey = currentPath.includes("/articles/") ? "articles"
        : currentPath.includes("/boutique/") ? "products"
        : currentPath.includes("/competitions/") ? "competitions"
        : currentPath.includes("/registrations/") ? "registrations"
        : currentPath.includes("/orders/") ? "orders"
        : "home";

    sidebar.innerHTML = `
        <a class="logo" href="${new URL("index.html", dashboardUrl)}" aria-label="NIZAL, accueil">
            <img src="${new URL("../assest/logo.png", dashboardUrl)}" alt="NIZAL" class="logoimg">
        </a>
        <nav class="sidebar-nav" aria-label="Navigation principale">
            ${sections.map(section => `
                <a href="${new URL(section.path, dashboardUrl)}" class="nav-item${section.key === activeKey ? " active" : ""}"${section.key === activeKey ? ' aria-current="page"' : ""}>
                    <i class="fa-solid ${section.icon}" aria-hidden="true"></i>
                    <span>${section.label}</span>
                </a>
            `).join("")}
        </nav>
    `;

    sidebar.id = "sidebar";

    document.addEventListener("click", event => {
        const target = event.target instanceof Element ? event.target : event.target.parentElement;
        const menuButton = target.closest(".mobile-menu, #mobileMenu, #menuBtn, .menu-btn");

        if (menuButton) {
            event.preventDefault();
            event.stopImmediatePropagation();
            sidebar.classList.toggle("open");
            return;
        }

        if (
            window.innerWidth <= 760 &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(target)
        ) {
            sidebar.classList.remove("open");
        }
    }, true);
})();
