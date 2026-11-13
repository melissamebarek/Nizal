const searchableItems = [
  {
    type: "article",
    title: "La méthode Daghestan sous le microscope des préparateurs",
    description: "MMA, préparation physique, aérobie et lutte au sol.",
    keywords: "mma daghestan entraînement préparateur préparation combat",
    url: "articles/article.html"
  },
  {
    type: "article",
    title: "Canelo Álvarez répond avec fermeté aux provocations de Benavidez",
    description: "Boxe anglaise, duel des super-moyens et négociations.",
    keywords: "boxe canelo alvarez benavidez mexique super moyens",
    url: "articles/article.html"
  },
  {
    type: "article",
    title: "ADCC 2026 : la domination sans partage des nouveaux prodiges No-Gi",
    description: "Jiu-jitsu, grappling et combat de soumission sans kimono.",
    keywords: "adcc jiu jitsu grappling no gi soumission",
    url: "articles/article.html"
  },
  {
    type: "article",
    title: "Rodtang officialise sa montée de catégorie pour un défi historique",
    description: "Muay Thaï, nouvelle division et ceinture mondiale.",
    keywords: "rodtang muay thai boxe défi ceinture catégorie",
    url: "articles/article.html"
  },
  {
    type: "article",
    title: "Tournoi de qualification mondial : 4 espoirs algériens qualifiés",
    description: "Lutte gréco-romaine et équipe nationale algérienne.",
    keywords: "tournoi qualification lutte algérie istanbul mondial",
    url: "articles/article.html"
  },
  {
    type: "article",
    title: "Le KO dévastateur qui a éteint l'arène de Tokyo au 1er round",
    description: "Kick-boxing et analyse d'un arrêt spectaculaire.",
    keywords: "ko kickboxing tokyo high kick combat",
    url: "articles/article.html"
  },
  {
    type: "article",
    title: "Unification des poids lourds : la stratégie et la pression à Riyad",
    description: "Décryptage technique des camps Volkov et Benkhelifa.",
    keywords: "poids lourds stratégie riyad volkov benkhelifa boxe",
    url: "articles/article.html"
  },
  {
    type: "event",
    title: "NIZAL Fight Night 01",
    description: "14 juin 2026 à Alger, Coupole Olympique. Poids welter et poids lourds.",
    keywords: "mma combat alger coupole olympique juin boxe",
    url: "event/eventDetails.html"
  },
  {
    type: "event",
    title: "Algeria Combat Championship",
    description: "4 juillet 2026 à Oran. Grand tournoi Muay Thaï et K-1.",
    keywords: "oran muay thai kickboxing k1 juillet championnat",
    url: "event/eventDetails.html"
  },
  {
    type: "event",
    title: "NIZAL Open Grappling & No-Gi",
    description: "22 août 2026 à Alger. Jiu-jitsu, grappling et règles ADCC.",
    keywords: "alger août jiu jitsu grappling adcc submission",
    url: "event/eventDetails.html"
  },
  {
    type: "event",
    title: "National MMA Challenge",
    description: "19 septembre 2026 à Constantine. Détection de jeunes talents.",
    keywords: "constantine mma septembre jeunes talents tournoi",
    url: "event/eventDetails.html"
  },
  {
    type: "product",
    title: "Gants NIZAL Pro Fight 16oz",
    description: "Gants de combat avec mousse triple densité et cuir résistant.",
    keywords: "gants boxe combat 16oz protection équipement",
    url: "boutique/proudct.html"
  },
  {
    type: "product",
    title: "Rashguard NIZAL Strike Pro Compression",
    description: "Tenue MMA respirante et extensible, homologuée grappling.",
    keywords: "rashguard mma vêtement femme compression",
    url: "boutique/proudct.html"
  },
  {
    type: "product",
    title: "Pack Protection NIZAL",
    description: "Casque de sparring et protège-tibias pour l'entraînement.",
    keywords: "casque protection protège tibias enfant sécurité sparring",
    url: "boutique/proudct.html"
  },
  {
    type: "product",
    title: "Gants de Sparring NIZAL Hexa-Shield",
    description: "Gants conçus pour préserver les articulations pendant les sessions.",
    keywords: "gants sparring sac paos entraînement",
    url: "boutique/proudct.html"
  },
  {
    type: "product",
    title: "Short de Combat NIZAL Octagon Elite",
    description: "Short de combat conçu pour les coups de pied et la mobilité.",
    keywords: "short combat fightshort vêtement mma femme",
    url: "boutique/proudct.html"
  },
  {
    type: "product",
    title: "Protège-Tibias NIZAL Iron-Flex",
    description: "Protection intégrale du tibia et du métatarse pour le Muay Thaï.",
    keywords: "protège tibias muay thai kick enfant protection",
    url: "boutique/proudct.html"
  },
  {
    type: "product",
    title: "Short de Combat Fight Elite Pro",
    description: "Short léger et résistant avec fentes d'aisance latérales.",
    keywords: "short combat vêtements homme mma",
    url: "boutique/proudct.html"
  },
  {
    type: "product",
    title: "Pack Accessoires : Bandes 4.5m & Corde Pro",
    description: "Bandes de boxe respirantes et corde à sauter de vitesse.",
    keywords: "accessoires bandes boxe corde entraînement",
    url: "boutique/proudct.html"
  },
  {
    type: "product",
    title: "Chaussures de Boxe NIZAL Speed-Knock",
    description: "Chaussures montantes avec maintien de cheville et semelle antidérapante.",
    keywords: "chaussures boxe homme équipement",
    url: "boutique/proudct.html"
  }
];

const form = document.getElementById("site-search-form");
const input = document.getElementById("site-search-input");
const results = document.getElementById("search-results");
const count = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const filterButtons = document.querySelectorAll(".filter-button");
const labels = { article: "Actualité", event: "Événement", product: "Produit" };
let activeType = "all";

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function editDistance(left, right) {
  const distances = Array.from(
    { length: left.length + 1 },
    (_, leftIndex) => Array.from({ length: right.length + 1 }, (_, rightIndex) => (
      leftIndex === 0 ? rightIndex : rightIndex === 0 ? leftIndex : 0
    ))
  );

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      distances[leftIndex][rightIndex] = Math.min(
        distances[leftIndex - 1][rightIndex] + 1,
        distances[leftIndex][rightIndex - 1] + 1,
        distances[leftIndex - 1][rightIndex - 1] + (
          left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
        )
      );

      if (
        leftIndex > 1 &&
        rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        distances[leftIndex][rightIndex] = Math.min(
          distances[leftIndex][rightIndex],
          distances[leftIndex - 2][rightIndex - 2] + 1
        );
      }
    }
  }

  return distances[left.length][right.length];
}

function wordSimilarity(queryWord, textWords) {
  let best = 0;

  for (const textWord of textWords) {
    if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
      best = Math.max(best, Math.min(queryWord.length, textWord.length) / Math.max(queryWord.length, textWord.length));
      continue;
    }

    const distance = editDistance(queryWord, textWord);
    const allowedDistance = queryWord.length < 5 ? 1 : Math.floor(queryWord.length * 0.35);
    if (distance <= allowedDistance) {
      best = Math.max(best, 1 - distance / Math.max(queryWord.length, textWord.length));
    }
  }

  return best;
}

function scoreItem(item, query) {
  const queryWords = normalize(query).split(/\s+/).filter(Boolean);
  const titleWords = normalize(item.title).split(/\s+/);
  const allWords = normalize(`${item.title} ${item.description} ${item.keywords}`).split(/\s+/);
  if (!queryWords.length) return 0;

  const scores = queryWords.map((word) => Math.max(
    wordSimilarity(word, titleWords) * 1.15,
    wordSimilarity(word, allWords)
  ));
  const matched = scores.filter((score) => score >= 0.52).length;
  if (matched !== queryWords.length) return 0;

  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function renderResults() {
  const query = input.value.trim();
  const matches = searchableItems
    .filter((item) => activeType === "all" || item.type === activeType)
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score);

  results.replaceChildren();
  count.textContent = query ? `${matches.length} résultat${matches.length === 1 ? "" : "s"}` : "";
  emptyState.hidden = !query || matches.length > 0;

  for (const { item } of matches) {
    const card = document.createElement("a");
    card.className = "result-card";
    card.href = item.url;

    const type = document.createElement("span");
    type.className = "result-type";
    type.textContent = labels[item.type];

    const title = document.createElement("strong");
    title.textContent = item.title;

    const description = document.createElement("p");
    description.textContent = item.description;

    card.append(type, title, description);
    results.append(card);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderResults();
});

input.addEventListener("input", renderResults);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeType = button.dataset.type;
    filterButtons.forEach((filter) => {
      const isActive = filter === button;
      filter.classList.toggle("active", isActive);
      filter.setAttribute("aria-pressed", String(isActive));
    });
    renderResults();
  });
});

const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
input.value = initialQuery;
renderResults();
