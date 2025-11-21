// Replace with your actual GNews API key
const API_KEY = "bc2fd17457498339fca2e8374cc0baf9";

const API_ENDPOINTS = {
    headlines: "https://gnews.io/api/v4/top-headlines",
    search: "https://gnews.io/api/v4/search"
};

// App state
let currentArticles = [];
let bookmarkedArticles = [];

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadSavedArticles();
    setupEventListeners();
    updateBookmarkCounter();
    
    if (API_KEY === "YOUR_API_KEY_HERE") {
        showError("Please add your GNews API key in script.js");
    } else {
        fetchNews();
    }
});

function setupEventListeners() {
    document.getElementById('fetchBtn').addEventListener('click', fetchNews);
    document.getElementById('btn-feed').addEventListener('click', () => showView('feed'));
    document.getElementById('btn-saved').addEventListener('click', () => showView('saved'));
    document.getElementById('clearBtn').addEventListener('click', clearAllSaved);
    
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchNews();
        }
    });
    
    document.getElementById('categorySelect').addEventListener('change', fetchNews);
}

function loadSavedArticles() {
    try {
        const saved = localStorage.getItem('torime_saved');
        if (saved) {
            bookmarkedArticles = JSON.parse(saved);
        }
    } catch (error) {
        console.log('Could not load saved articles:', error);
        bookmarkedArticles = [];
    }
}

function saveToBrowser() {
    try {
        localStorage.setItem('torime_saved', JSON.stringify(bookmarkedArticles));
    } catch (error) {
        console.log('Could not save articles:', error);
    }
}

async function fetchNews() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categorySelect').value;
    const feedContainer = document.getElementById('newsFeed');
    const fetchButton = document.getElementById('fetchBtn');
    const errorBox = document.getElementById('errorContainer');
    
    errorBox.classList.remove('show');
    feedContainer.classList.add('loading');
    fetchButton.innerHTML = '<span class="loader"></span>';
    
    try {
        const apiUrl = buildRequestUrl(searchTerm, category);
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors || 'Failed to load news. Check your API key.');
        }
        
        currentArticles = data.articles || [];
        displayArticles(currentArticles, 'newsFeed');
        
    } catch (error) {
        console.error('Error fetching news:', error);
        showError(error.message);
    } finally {
        feedContainer.classList.remove('loading');
        fetchButton.textContent = 'Find Stories';
    }
}

function buildRequestUrl(searchTerm, category) {
    let url = `${API_ENDPOINTS.headlines}?lang=en&apikey=${API_KEY}`;
    
    if (searchTerm && searchTerm.toLowerCase() !== 'general') {
        url = `${API_ENDPOINTS.search}?q=${encodeURIComponent(searchTerm)}&lang=en&apikey=${API_KEY}`;
    } else if (category) {
        url += `&topic=${category}`;
    }
    
    return url;
}

function showError(message) {
    const errorBox = document.getElementById('errorContainer');
    errorBox.textContent = message;
    errorBox.classList.add('show');
}

function displayArticles(articles, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!articles || articles.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No stories found. Try a different search.</p></div>';
        return;
    }
    
    articles.forEach(article => {
        const articleElement = createArticleElement(article);
        container.appendChild(articleElement);
    });
}

function createArticleElement(article) {
    const articleDiv = document.createElement('div');
    articleDiv.className = 'article-card';
    
    const isBookmarked = bookmarkedArticles.some(saved => saved.url === article.url);
    const publishDate = formatDate(article.publishedAt);
    
    articleDiv.innerHTML = `
        <div class="article-layout">
            ${article.image ? `
                <div class="article-image">
                    <img src="${article.image}" alt="${escapeText(article.title)}">
                </div>
            ` : ''}
            
            <div class="article-content">
                <div class="article-meta">
                    <span class="source-tag">${escapeText(article.source.name)}</span>
                    <span class="article-date">${publishDate}</span>
                </div>
                
                <h3 class="article-title">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                        ${escapeText(article.title)}
                    </a>
                </h3>
                
                <p class="article-description">
                    ${escapeText(article.description || 'No description available')}
                </p>
                
                <div class="article-actions">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-link">
                        Read Full Story →
                    </a>
                    <button class="save-btn ${isBookmarked ? 'saved' : ''}" data-url="${article.url}">
                        ${isBookmarked ? 'Saved ✓' : 'Save +'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const saveButton = articleDiv.querySelector('.save-btn');
    saveButton.addEventListener('click', () => toggleBookmark(article.url));
    
    return articleDiv;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function escapeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleBookmark(articleUrl) {
    const index = bookmarkedArticles.findIndex(article => article.url === articleUrl);
    
    if (index > -1) {
        bookmarkedArticles.splice(index, 1);
    } else {
        const article = currentArticles.find(a => a.url === articleUrl);
        if (article) {
            bookmarkedArticles.push(article);
        }
    }
    
    saveToBrowser();
    updateBookmarkCounter();
    
    const currentView = document.getElementById('view-saved').classList.contains('hidden') ? 'feed' : 'saved';
    
    if (currentView === 'saved') {
        displayArticles(bookmarkedArticles, 'savedFeed');
        toggleEmptyState();
    } else {
        displayArticles(currentArticles, 'newsFeed');
    }
}

function clearAllSaved() {
    if (confirm('Remove all saved stories? This cannot be undone.')) {
        bookmarkedArticles = [];
        saveToBrowser();
        updateBookmarkCounter();
        displayArticles([], 'savedFeed');
        toggleEmptyState();
    }
}

function updateBookmarkCounter() {
    document.getElementById('savedCount').textContent = bookmarkedArticles.length;
}

function showView(viewName) {
    const feedView = document.getElementById('view-feed');
    const savedView = document.getElementById('view-saved');
    const feedButton = document.getElementById('btn-feed');
    const savedButton = document.getElementById('btn-saved');
    
    if (viewName === 'feed') {
        feedView.classList.remove('hidden');
        savedView.classList.add('hidden');
        feedButton.classList.add('active');
        savedButton.classList.remove('active');
    } else {
        feedView.classList.add('hidden');
        savedView.classList.remove('hidden');
        feedButton.classList.remove('active');
        savedButton.classList.add('active');
        
        displayArticles(bookmarkedArticles, 'savedFeed');
        toggleEmptyState();
    }
}

function toggleEmptyState() {
    const emptyMessage = document.getElementById('emptySaved');
    if (bookmarkedArticles.length === 0) {
        emptyMessage.classList.remove('hidden');
    } else {
        emptyMessage.classList.add('hidden');
    }
}