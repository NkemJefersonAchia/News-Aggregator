// Replace with your actual EventRegistry API key
const API_KEY = "YOUR_API_KEY_HERE";
const API_ENDPOINT = "https://eventregistry.org/api/v1/article/getArticles";

// App state
let currentArticles = [];
let bookmarkedArticles = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadSavedArticles();
    setupEventListeners();
    updateBookmarkCounter();
    fetchNews();
});

function setupEventListeners() {
    document.getElementById('fetchBtn').addEventListener('click', fetchNews);
    document.getElementById('btn-feed').addEventListener('click', () => showView('feed'));
    document.getElementById('btn-saved').addEventListener('click', () => showView('saved'));
    document.getElementById('clearBtn').addEventListener('click', clearAllSaved);

    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') fetchNews();
    });

    document.getElementById('categorySelect').addEventListener('change', fetchNews);
}

function loadSavedArticles() {
    const saved = localStorage.getItem('torime_saved');
    bookmarkedArticles = saved ? JSON.parse(saved) : [];
}

function saveToBrowser() {
    localStorage.setItem('torime_saved', JSON.stringify(bookmarkedArticles));
}

async function fetchNews() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categorySelect').value;
    const feedContainer = document.getElementById('newsFeed');
    const fetchButton = document.getElementById('fetchBtn');
    const errorBox = document.getElementById('errorContainer');

    errorBox.classList.remove('show');
    feedContainer.classList.add('loading');
    fetchButton.textContent = 'Loading...';

    try {
        const requestBody = {
            action: "getArticles",
            apiKey: API_KEY,
            lang: "eng",
            articlesSortBy: "date",
            articlesCount: 20
        };

        if (searchTerm && searchTerm.toLowerCase() !== "general") {
            requestBody.keyword = searchTerm;
        }

        if (category) {
            requestBody.categoryUri = category;
        }

        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!data.articles || !data.articles.results || data.articles.results.length === 0) {
            currentArticles = [];
            displayArticles([], 'newsFeed');
            return;
        }

       currentArticles = data.articles.results.map(a => ({
    title: a.title,
    description: a.body || a.summary || '',
    url: a.url,
    image: a.image || '',
    source: typeof a.source === 'string' ? a.source : (a.source?.title || a.source?.name || 'Unknown'),
    publishedAt: a.date || ''
}));

        displayArticles(currentArticles, 'newsFeed');

    } catch (err) {
        console.error(err);
        errorBox.textContent = "Failed to fetch news. Check your API key or network.";
        errorBox.classList.add('show');
    } finally {
        feedContainer.classList.remove('loading');
        fetchButton.textContent = 'Find Stories';
    }
}

// Truncate text for preview
function truncateText(text, maxLength = 200) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function displayArticles(articles, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!articles.length) {
        container.innerHTML = '<div class="empty-state"><p>No stories found. Try a different search.</p></div>';
        return;
    }

    articles.forEach(article => {
        const el = createArticleElement(article);
        container.appendChild(el);
    });
}

function createArticleElement(article) {
    const div = document.createElement('div');
    div.className = 'article-card';

    const isBookmarked = bookmarkedArticles.some(a => a.url === article.url);
    const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric'}) : '';
    const sourceName = typeof article.source === 'string' ? article.source : 'Unknown';

    div.innerHTML = `
        ${article.image ? `<div class="article-image"><img src="${article.image}" alt="${escapeText(article.title)}"></div>` : ''}
        <div class="article-content">
            <div class="article-meta">
                <span class="source-tag">${escapeText(sourceName)}</span>
                <span class="article-date">${date}</span>
            </div>
            <h3 class="article-title">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">${escapeText(article.title)}</a>
            </h3>
            <p class="article-description">${escapeText(truncateText(article.description, 200))}</p>
            <div class="article-actions">
                <a href="${article.url}" target="_blank" class="read-link">Read Full Story →</a>
                <button class="save-btn ${isBookmarked ? 'saved' : ''}" data-url="${article.url}">
                    ${isBookmarked ? 'Saved ✓' : 'Save +'}
                </button>
            </div>
        </div>
    `;

    div.querySelector('.save-btn').addEventListener('click', () => toggleBookmark(article.url));

    return div;
}

function escapeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleBookmark(url) {
    const index = bookmarkedArticles.findIndex(a => a.url === url);
    if (index > -1) bookmarkedArticles.splice(index,1);
    else {
        const article = currentArticles.find(a => a.url === url);
        if (article) bookmarkedArticles.push(article);
    }
    saveToBrowser();
    updateBookmarkCounter();

    const viewSavedVisible = !document.getElementById('view-saved').classList.contains('hidden');
    if (viewSavedVisible) displayArticles(bookmarkedArticles, 'savedFeed');
    else displayArticles(currentArticles, 'newsFeed');
    toggleEmptyState();
}

function clearAllSaved() {
    if (!confirm('Remove all saved stories?')) return;
    bookmarkedArticles = [];
    saveToBrowser();
    updateBookmarkCounter();
    displayArticles([], 'savedFeed');
    toggleEmptyState();
}

function updateBookmarkCounter() {
    document.getElementById('savedCount').textContent = bookmarkedArticles.length;
}

function showView(viewName) {
    const feed = document.getElementById('view-feed');
    const saved = document.getElementById('view-saved');
    const btnFeed = document.getElementById('btn-feed');
    const btnSaved = document.getElementById('btn-saved');

    if (viewName === 'feed') {
        feed.classList.remove('hidden');
        saved.classList.add('hidden');
        btnFeed.classList.add('active');
        btnSaved.classList.remove('active');
    } else {
        feed.classList.add('hidden');
        saved.classList.remove('hidden');
        btnFeed.classList.remove('active');
        btnSaved.classList.add('active');
        displayArticles(bookmarkedArticles, 'savedFeed');
        toggleEmptyState();
    }
}

function toggleEmptyState() {
    const empty = document.getElementById('emptySaved');
    if (bookmarkedArticles.length === 0) empty.classList.remove('hidden');
    else empty.classList.add('hidden');
}
