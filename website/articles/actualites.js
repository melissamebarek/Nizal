'use strict';

const ARTICLES_API_URL = 'http://localhost:5000/api/articles';
const API_BASE_URL = new URL(ARTICLES_API_URL).origin;
const ARTICLES_PER_PAGE = 6;
const FALLBACK_IMAGE = '../../assest/logo.png';

let articles = [];
let filteredArticles = [];
let activeCategory = 'all';
let visibleArticlesCount = ARTICLES_PER_PAGE;

const elements = {
  featuredImage: document.getElementById('featured-image'),
  featuredCategory: document.getElementById('featured-category'),
  featuredDate: document.getElementById('featured-date'),
  featuredAuthor: document.getElementById('featured-author'),
  featuredTitle: document.getElementById('featured-title'),
  featuredContent: document.getElementById('featured-content'),
  featuredLink: document.getElementById('featured-link'),
  secondary: document.getElementById('secondary-articles'),
  newsGrid: document.getElementById('news-matrix-container'),
  mostRead: document.getElementById('most-read-articles'),
  loadMoreButton: document.getElementById('load-more-btn'),
  loadMoreText: document.getElementById('load-more-text'),
  loadMoreIcon: document.getElementById('load-more-icon'),
  categoryFilters: Array.from(document.querySelectorAll('[data-category-filter]'))
};

function firstValue(article, keys, fallback = '') {
  for (const key of keys) {
    const value = article?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return fallback;
}

function articleTitle(article) {
  return String(firstValue(article, ['title', 'titre', 'name'], 'Actualité NIZAL'));
}

function articleContent(article) {
  // The backend stores rich text as HTML. Keep it as HTML for safe rendering below.
  return String(firstValue(article, ['content', 'contenu', 'description', 'excerpt', 'resume'], 'Découvrez cette actualité sur NIZAL.'));
}

function articleContentText(article) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(articleContent(article), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

// Allow common formatting from the article editor while removing scripts, event handlers,
// dangerous URLs, embedded documents, and other active content.
function safeHtmlFragment(html) {
  const parsed = new DOMParser().parseFromString(String(html), 'text/html');
  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'A', 'IMG']);
  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || '');
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();

    const tag = node.tagName;
    if (!allowedTags.has(tag)) {
      const fragment = document.createDocumentFragment();
      // Drop active/embedded elements entirely; preserve text for unknown formatting wrappers.
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'SVG', 'MATH'].includes(tag)) return fragment;
      Array.from(node.childNodes).forEach(child => fragment.append(cleanNode(child)));
      return fragment;
    }

    const clean = document.createElement(tag.toLowerCase());
    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|\/|\.\.?\/|#)/i.test(href) && !/^\s*javascript:/i.test(href)) {
        clean.setAttribute('href', href);
        if (/^https?:/i.test(href)) {
          clean.setAttribute('target', '_blank');
          clean.setAttribute('rel', 'noopener noreferrer');
        }
      }
    } else if (tag === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (/^(https?:|data:image\/(png|jpe?g|gif|webp);base64,)/i.test(src)) {
        clean.setAttribute('src', src);
        clean.setAttribute('alt', node.getAttribute('alt') || '');
        clean.className = 'max-w-full h-auto';
      } else {
        return document.createDocumentFragment();
      }
    }
    Array.from(node.childNodes).forEach(child => clean.append(cleanNode(child)));
    return clean;
  };

  const fragment = document.createDocumentFragment();
  Array.from(parsed.body.childNodes).forEach(node => fragment.append(cleanNode(node)));
  return fragment;
}

function setSafeHtml(element, html) {
  if (element) element.replaceChildren(safeHtmlFragment(html));
}

function coverImageSource(value) {
  const raw = String(value || '').trim();
  if (!raw) return FALLBACK_IMAGE;
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:image/')) return raw;
  // Accept a bare Base64 value and infer its common image type from its signature.
  const compact = raw.replace(/^data:[^,]*;base64,/i, '').replace(/\s/g, '');
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(compact) && compact.length > 80) {
    let mime = 'image/jpeg';
    if (compact.startsWith('iVBORw0KGgo')) mime = 'image/png';
    else if (compact.startsWith('R0lGOD')) mime = 'image/gif';
    else if (compact.startsWith('UklGR')) mime = 'image/webp';
    return `data:${mime};base64,${compact}`;
  }
  if (raw.startsWith('/')) return `${API_BASE_URL}${raw}`;
  if (raw.startsWith('uploads/')) return `${API_BASE_URL}/${raw}`;
  if (raw.startsWith('assest/') || raw.startsWith('assets/')) return `../../${raw}`;
  return `${API_BASE_URL}/${raw.replace(/^\.\//, '')}`;
}

function articleCategory(article) {
  return String(firstValue(article, ['category', 'categorie', 'discipline', 'sport'], 'ACTUALITÉS'));
}

function articleAuthor(article) {
  return String(firstValue(article, ['author', 'auteur', 'created_by_name', 'author_name'], 'RÉDACTION NIZAL'));
}

function articleDateValue(article) {
  return firstValue(article, ['published_at', 'created_at', 'date_publication', 'date', 'updated_at'], '');
}

function formatDate(value) {
  if (!value) return 'DATE NON DISPONIBLE';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(date).toUpperCase();
}

function timeAgo(value) {
  if (!value) return 'NIZAL';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 60) return minutes <= 1 ? 'Il y a 1 minute' : `Il y a ${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'Il y a 1 heure' : `Il y a ${hours} heures`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'Hier' : `Il y a ${days} jours`;
  return formatDate(value);
}

function articleImage(article) {
  return coverImageSource(firstValue(article, ['cover_image', 'image', 'image_url', 'image_path', 'photo', 'thumbnail'], ''));
}

function articleUrl(article) {
  const id = firstValue(article, ['id', 'article_id', 'articleId'], '');
  return id === '' ? './article.html' : `./article.html?id=${encodeURIComponent(id)}`;
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createArticleCard(article) {
  const link = document.createElement('a');
  link.href = articleUrl(article);
  link.className = 'bg-white border border-gray-200 group flex flex-col overflow-hidden shadow-xs hover:shadow-md transition-all duration-300';
  link.style.cursor = 'pointer';

  const imageWrapper = createElement('div', 'relative aspect-[16/10] overflow-hidden bg-gray-100');
  const image = document.createElement('img');
  image.src = articleImage(article);
  image.alt = articleTitle(article);
  image.loading = 'lazy';
  image.onerror = () => { image.onerror = null; image.src = FALLBACK_IMAGE; };
  image.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out';

  const categoryWrapper = createElement('div', 'absolute top-space-xs left-space-xs');
  const category = createElement('span', 'px-2 py-0.5 bg-[#e10600] text-white font-label-md text-label-md uppercase font-bold', articleCategory(article));
  categoryWrapper.append(category);
  imageWrapper.append(image, categoryWrapper);

  const body = createElement('div', 'p-space-md flex flex-col justify-between flex-grow gap-space-xs');
  const bodyTop = document.createElement('div');
  const dateRow = createElement('div', 'flex items-center justify-between text-gray-500 font-label-md text-label-md mb-1', timeAgo(articleDateValue(article)));
  const title = createElement('h3', 'font-headline-sm text-headline-sm uppercase text-gray-950 group-hover:text-[#e10600] transition-colors leading-snug m-0', articleTitle(article));
  const content = createElement('p', 'font-body-sm text-body-sm text-gray-600 mt-2 line-clamp-3', articleContentText(article));
  bodyTop.append(dateRow, title, content);

  const footer = createElement('div', 'pt-space-sm flex items-center justify-between text-gray-500 border-t border-gray-100 mt-2');
  const author = createElement('span', 'font-body-sm text-body-sm text-gray-500', articleAuthor(article));
  const arrow = createElement('span', 'material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform text-gray-700', 'arrow_forward');
  footer.append(author, arrow);
  body.append(bodyTop, footer);
  link.append(imageWrapper, body);
  return link;
}

function createSecondaryCard(article) {
  const link = document.createElement('a');
  link.href = articleUrl(article);
  link.className = 'bg-[#f8f9fa] border border-gray-200 group hover:bg-white hover:shadow-md transition-all flex flex-col overflow-hidden';
  link.style.cursor = 'pointer';

  const imageWrapper = createElement('div', 'w-full h-32 overflow-hidden');
  const image = document.createElement('img');
  image.src = articleImage(article);
  image.alt = articleTitle(article);
  image.loading = 'lazy';
  image.onerror = () => { image.onerror = null; image.src = FALLBACK_IMAGE; };
  image.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300';
  imageWrapper.append(image);

  const body = createElement('div', 'p-space-md flex flex-col gap-space-xs');
  const meta = createElement('div', 'flex items-center justify-between');
  meta.append(
    createElement('span', 'px-space-xs py-0.5 bg-[#0057ff] text-white font-label-md text-label-md uppercase tracking-wider font-bold', articleCategory(article)),
    createElement('span', 'font-body-sm text-body-sm text-gray-500', timeAgo(articleDateValue(article)))
  );
  const title = createElement('h4', 'font-headline-sm text-headline-sm uppercase text-gray-950 group-hover:text-[#0057ff] transition-colors m-0 leading-snug', articleTitle(article));
  const content = createElement('p', 'font-body-sm text-body-sm text-gray-600 line-clamp-2', articleContentText(article));
  body.append(meta, title, content);
  link.append(imageWrapper, body);
  return link;
}

function renderFeatured(article) {
  if (!article) {
    setText(elements.featuredTitle, 'Aucune actualité disponible');
    setText(elements.featuredContent, 'Les actualités publiées apparaîtront ici.');
    if (elements.featuredLink) elements.featuredLink.hidden = true;
    return;
  }

  if (elements.featuredImage) {
    elements.featuredImage.src = articleImage(article);
    elements.featuredImage.alt = articleTitle(article);
    elements.featuredImage.onerror = () => {
      elements.featuredImage.onerror = null;
      elements.featuredImage.src = FALLBACK_IMAGE;
    };
  }
  setText(elements.featuredCategory, articleCategory(article));
  setText(elements.featuredDate, formatDate(articleDateValue(article)));
  setText(elements.featuredAuthor, articleAuthor(article));
  setText(elements.featuredTitle, articleTitle(article));
  setSafeHtml(elements.featuredContent, articleContent(article));
  if (elements.featuredLink) {
    elements.featuredLink.href = articleUrl(article);
    elements.featuredLink.hidden = false;
  }
}

function renderSecondary() {
  if (!elements.secondary) return;
  elements.secondary.replaceChildren();
  filteredArticles.slice(1, 4).forEach(article => elements.secondary.append(createSecondaryCard(article)));
  if (filteredArticles.length <= 1) elements.secondary.hidden = true;
  else elements.secondary.hidden = false;
}

function renderNewsGrid() {
  if (!elements.newsGrid) return;
  elements.newsGrid.replaceChildren();
  const news = filteredArticles.slice(1);
  const visible = news.slice(0, visibleArticlesCount);

  if (visible.length === 0) {
    elements.newsGrid.append(createElement('p', 'font-body-md text-body-md text-gray-600', filteredArticles.length ? 'Aucune autre actualité pour le moment.' : 'Aucune actualité ne correspond à cette catégorie.'));
  } else {
    visible.forEach(article => elements.newsGrid.append(createArticleCard(article)));
  }

  const hasMore = visibleArticlesCount < news.length;
  if (elements.loadMoreButton) elements.loadMoreButton.hidden = !hasMore;
  setText(elements.loadMoreText, hasMore ? 'CHARGER PLUS D’ACTUALITÉS' : 'TOUTES LES ACTUALITÉS AFFICHÉES');
  if (elements.loadMoreIcon) elements.loadMoreIcon.textContent = hasMore ? 'expand_more' : 'check';
}

function renderMostRead() {
  if (!elements.mostRead) return;
  elements.mostRead.replaceChildren();
  filteredArticles.slice(1, 6).forEach((article, index) => {
    const link = document.createElement('a');
    link.className = 'group flex items-start gap-space-md';
    link.href = articleUrl(article);
    const numberClass = index === 0
      ? 'font-data-metric text-data-metric text-[#e10600] leading-none shrink-0 w-8'
      : 'font-data-metric text-data-metric text-gray-400 leading-none shrink-0 w-8 group-hover:text-[#e10600] transition-colors';
    link.append(createElement('span', numberClass, String(index + 1).padStart(2, '0')));
    const body = createElement('div', 'flex flex-col');
    body.append(
      createElement('span', 'font-headline-sm text-[16px] leading-tight uppercase text-gray-950 group-hover:text-[#e10600] transition-colors', articleTitle(article)),
      createElement('span', 'font-body-sm text-body-sm text-gray-500 mt-1', articleCategory(article))
    );
    link.append(body);
    elements.mostRead.append(link);
  });
  if (filteredArticles.length <= 1) {
    elements.mostRead.append(createElement('p', 'font-body-sm text-body-sm text-gray-500', 'Aucune autre actualité disponible.'));
  }
}

function normalizeCategory(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function categoryMatches(article, filter) {
  if (filter === 'all') return true;

  const category = normalizeCategory(articleCategory(article));
  const aliases = {
    boxing: ['boxing', 'boxe', 'box'],
    karate: ['karate'],
    judo: ['judo'],
    wrestling: ['wrestling', 'lutte', 'catch', 'grappling'],
    'nizal-news': ['nizal news', 'nizal', 'actualites', 'news'],
    interviews: ['interview', 'interviews', 'entretien'],
    events: ['event', 'events', 'evenement', 'evenements', 'competition', 'competitions', 'championnat', 'championnats']
  };

  return (aliases[filter] || [filter]).some(alias => {
    const normalizedAlias = normalizeCategory(alias);
    return category === normalizedAlias || category.includes(normalizedAlias);
  });
}

function applyCategoryFilter(filter) {
  activeCategory = filter || 'all';
  filteredArticles = articles.filter(article => categoryMatches(article, activeCategory));
  visibleArticlesCount = ARTICLES_PER_PAGE;

  elements.categoryFilters.forEach(link => {
    const selected = link.dataset.categoryFilter === activeCategory;
    link.setAttribute('aria-pressed', String(selected));
    link.classList.toggle('is-active', selected);
    link.classList.toggle('bg-[#e10600]', selected);
    link.classList.toggle('text-white', selected);
    link.classList.toggle('border-[#e10600]', selected);
    link.classList.toggle('bg-white', !selected);
    link.classList.toggle('border-gray-200', !selected);
  });

  renderAll();

  const grid = document.getElementById('news-matrix-container');
  if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAll() {
  renderFeatured(filteredArticles[0]);
  renderSecondary();
  renderNewsGrid();
  renderMostRead();
}

async function loadArticles() {
  if (elements.newsGrid) {
    elements.newsGrid.setAttribute('aria-live', 'polite');
    elements.newsGrid.append(createElement('p', 'font-body-md text-body-md text-gray-600', 'Chargement des actualités…'));
  }

  try {
    const response = await fetch(ARTICLES_API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    const result = await response.json();
    if (result.success === false) throw new Error(result.message || 'Impossible de récupérer les articles.');

    const data = Array.isArray(result) ? result : result.data;
    if (!Array.isArray(data)) throw new Error('Format de réponse API inattendu : data doit être un tableau.');

    articles = data;
    filteredArticles = [...articles];
    activeCategory = 'all';
    visibleArticlesCount = ARTICLES_PER_PAGE;
    renderAll();
  } catch (error) {
    console.error('Erreur lors du chargement des actualités :', error);
    setText(elements.featuredTitle, 'Impossible de charger les actualités');
    setText(elements.featuredContent, 'Vérifiez que le serveur backend est lancé et que l’API /api/articles est accessible.');
    if (elements.newsGrid) {
      elements.newsGrid.replaceChildren(createElement('p', 'font-body-md text-body-md text-red-600', 'Erreur de chargement. Vérifiez le backend et la connexion à l’API.'));
    }
    if (elements.secondary) elements.secondary.replaceChildren();
    if (elements.mostRead) elements.mostRead.replaceChildren();
    if (elements.loadMoreButton) elements.loadMoreButton.hidden = true;
  }
}

if (elements.loadMoreButton) {
  elements.loadMoreButton.addEventListener('click', () => {
    visibleArticlesCount += ARTICLES_PER_PAGE;
    renderNewsGrid();
  });
}

elements.categoryFilters.forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    applyCategoryFilter(link.dataset.categoryFilter || 'all');
  });
});

loadArticles();
