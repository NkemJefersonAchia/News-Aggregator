const API_KEY = "API KEY"; // <--- PASTE YOUR KEY HERE

// API CONSTANTS
const BASE_URL = "https://gnews.io/api/v4/top-headlines";
const SEARCH_URL = "https://gnews.io/api/v4/search";

// APPLICATION STATE
let articles = [];
let savedArticles = JSON.parse(localStorage.getItem('newswire_saved')) || [];


document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Display current date in header
    const dateElement = document.getElementById('currentDate');
    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    dateElement.textContent = currentDate;
    
    // Update saved articles count
    updateSavedCount();
    
    // Initial fetch if API key is configured
    if (API_KEY && API_KEY !== "YOUR_API_KEY_HERE") {
        fetchNews(); 
    } else {
        showError("Configuration Error: Please add your GNews API Key in script.js (line 17)");
    }
}

/**
 * Fetch news articles from GNews API
 */
async function fetchNews() {
    const query = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categorySelect').value;
    const container = document.getElementById('newsFeed');
    const btn = document.getElementById('fetchBtn');
    const errorDiv = document.getElementById('errorContainer');

    // Reset UI state
    errorDiv.classList.add('hidden');
    container.style.opacity = '0.5';
    btn.innerHTML = '<span class="loader"></span>';

    try {
        // Build API URL
        let url = buildApiUrl(query, category);

        // Fetch data
        const response = await fetch(url);
        const data = await response.json();

        // Handle API errors
        if (response.status !== 200) {
            throw new Error(data.errors || "Failed to fetch news. Check API Key or Quota.");
        }

        // Update state and render
        articles = data.articles;
        renderArticles(articles, 'newsFeed');

    } catch (error) {
        console.error('Fetch Error:', error);
        showError(error.message);
    } finally {
        // Restore UI state
        container.style.opacity = '1';
        btn.textContent = "FETCH WIRE";
    }
}

/**
 * Build API URL based on search query and category
 * @param {string} query - Search query
 * @param {string} category - News category
 * @returns {string} Complete API URL
 */
function buildApiUrl(query, category) {
    let url = `${BASE_URL}?lang=en&apikey=${API_KEY}`;
    
    if (query && query !== "General") {
        // Use search endpoint for specific queries
        url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&lang=en&apikey=${API_KEY}`;
    } else if (category) {
        // Use category filter for top headlines
        url += `&topic=${category}`;
    }
    
    return url;
}


/**
 * Display error message to user
 * @param {string} msg - Error message to display
 */
function showError(msg) {
    const el = document.getElementById('errorContainer');
    el.textContent = msg;
    el.classList.remove('hidden');
}

/**
 * Render articles in specified container
 * @param {Array} list - Array of article objects
 * @param {string} containerId - Target container ID
 */
function renderArticles(list, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Handle empty results
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 italic text-gray-500">
                No headlines found. Try a different search term or category.
            </div>
        `;
        return;
    }

    // Render each article
    list.forEach((article) => {
        const articleHtml = createArticleCard(article);
        container.innerHTML += articleHtml;
    });
}

/**
 * Create HTML for a single article card
 * @param {Object} article - Article data object
 * @returns {string} HTML string for article card
 */
function createArticleCard(article) {
    // Check if article is saved
    const isSaved = savedArticles.some(a => a.url === article.url);
    
    // Format date
    const dateStr = new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Create image HTML if available
    const imgHtml = article.image 
        ? `<div class="w-full md:w-1/3 h-48 bg-gray-100 border border-black overflow-hidden">
            <img src="${article.image}" 
                 class="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-500" 
                 alt="${article.title}"
                 onerror="this.parentElement.style.display='none'">
           </div>`
        : '';

    // Sanitize description
    const description = article.description 
        ? escapeHtml(article.description) 
        : 'No description available.';

    return `
        <article class="article-card flex flex-col md:flex-row gap-6 group">
            ${imgHtml}
            <div class="flex-1 flex flex-col">
                <div class="flex items-center gap-3 mb-2">
                    <span class="tag">${escapeHtml(article.source.name)}</span>
                    <span class="text-xs text-gray-500 font-sans-serif uppercase">${dateStr}</span>
                </div>
                <h3 class="text-2xl font-bold leading-tight mb-2 hover:underline font-serif">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(article.title)}
                    </a>
                </h3>
                <p class="text-gray-700 mb-4 text-sm flex-grow">${description}</p>
                <div class="flex justify-between items-center mt-auto pt-2">
                    <a href="${article.url}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="underline font-bold text-sm hover:text-gray-600">
                        Read Full Story &rarr;
                    </a>
                    <button onclick="toggleSave('${article.url}')" 
                            class="text-xs font-bold uppercase border border-black px-4 py-1 transition-all ${isSaved ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}"
                            aria-label="${isSaved ? 'Remove from saved' : 'Save article'}">
                        ${isSaved ? 'Saved ✓' : 'Save +'}
                    </button>
                </div>
            </div>
        </article>
    `;
}


/**
 * Toggle save state for an article
 * @param {string} url - Unique article URL identifier
 */
function toggleSave(url) {
    const index = savedArticles.findIndex(a => a.url === url);
    
    if (index !== -1) {
        // Remove from saved
        savedArticles.splice(index, 1);
    } else {
        // Add to saved
        const item = articles.find(a => a.url === url);
        if (item) {
            savedArticles.push(item);
        }
    }
    
    // Persist to localStorage
    localStorage.setItem('newswire_saved', JSON.stringify(savedArticles));
    updateSavedCount();
    
    // Refresh current view
    if (!document.getElementById('view-saved').classList.contains('hidden')) {
        renderArticles(savedArticles, 'savedFeed');
        document.getElementById('emptySaved').classList.toggle('hidden', savedArticles.length > 0);
    } else {
        renderArticles(articles, 'newsFeed');
    }
}

function clearSaved() {
    if (confirm("Clear all archived articles? This cannot be undone.")) {
        savedArticles = [];
        localStorage.setItem('newswire_saved', JSON.stringify([]));
        updateSavedCount();
        renderArticles([], 'savedFeed');
        document.getElementById('emptySaved').classList.remove('hidden');
    }
}


function updateSavedCount() {
    document.getElementById('savedCount').textContent = savedArticles.length;
}

/**
 * Switch between feed and saved views
 * @param {string} view - View identifier ('feed' or 'saved')
 */
function switchView(view) {
    const feed = document.getElementById('view-feed');
    const saved = document.getElementById('view-saved');
    const btnFeed = document.getElementById('btn-feed');
    const btnSaved = document.getElementById('btn-saved');
    const emptySaved = document.getElementById('emptySaved');

    if (view === 'feed') {
        // Show feed view
        feed.classList.remove('hidden');
        saved.classList.add('hidden');
        
        // Update button styles
        btnFeed.classList.remove('bg-white', 'text-black');
        btnFeed.classList.add('bg-black', 'text-white');
        btnSaved.classList.remove('bg-black', 'text-white');
        btnSaved.classList.add('bg-white', 'text-black');
    } else {
        // Show saved view
        feed.classList.add('hidden');
        saved.classList.remove('hidden');
        
        // Render saved articles
        renderArticles(savedArticles, 'savedFeed');
        emptySaved.classList.toggle('hidden', savedArticles.length > 0);
        
        // Update button styles
        btnSaved.classList.remove('bg-white', 'text-black');
        btnSaved.classList.add('bg-black', 'text-white');
        btnFeed.classList.remove('bg-black', 'text-white');
        btnFeed.classList.add('bg-white', 'text-black');
    }
}


/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}