document.addEventListener('DOMContentLoaded', () => {
    const state = {
        articles: [],
        filtered: [],
        activeCategory: 'All',
        searchQuery: '',
        isLoading: false
    };

    const articleGrid = document.querySelector('#articleGrid');
    const categoryList = document.querySelector('#categoryList');
    const searchInput = document.querySelector('#searchInput');
    const refreshBtn = document.querySelector('#refreshBtn');
    const lastRefreshed = document.querySelector('#lastRefreshed');
    const feedTitle = document.querySelector('#feedTitle');
    const articleCount = document.querySelector('#articleCount');
    const bookmarksPanel = document.querySelector('#bookmarksPanel');
    const bookmarkToggleBtn = document.querySelector('#bookmarkToggleBtn');
    const bookmarksList = document.querySelector('#bookmarksList');
    const clearBookmarksBtn = document.querySelector('#clearBookmarksBtn');
    const bookmarkConfirm = document.querySelector('#bookmarkConfirm');
    const confirmClearBtn = document.querySelector('#confirmClearBtn');
    const cancelClearBtn = document.querySelector('#cancelClearBtn');
    const ARTICLES_CACHE_KEY = 'rss-cached-articles';
    let lastRefreshDate = null;

    // Starts the app, renders static UI, wires events, and loads feeds.
    function init() {
        renderSidebar();
        renderBookmarksPanel();
        loadAllFeeds();

        searchInput.addEventListener('input', handleSearch);
        refreshBtn.addEventListener('click', handleRefresh);
        categoryList.addEventListener('click', (event) => {
            const button = event.target.closest('[data-category]');
            if (button) {
                handleCategoryClick(button.dataset.category);
            }
        });
        articleGrid.addEventListener('click', (event) => {
            const button = event.target.closest('[data-bookmark-id]');
            if (button) {
                handleBookmarkToggle(button.dataset.bookmarkId, button);
            }
        });
        bookmarkToggleBtn.addEventListener('click', () => {
            const isHidden = bookmarksPanel.classList.toggle('is-hidden');
            bookmarkToggleBtn.setAttribute('aria-expanded', String(!isHidden));
        });
        clearBookmarksBtn.addEventListener('click', () => {
            bookmarkConfirm.hidden = false;
        });
        confirmClearBtn.addEventListener('click', () => {
            clearAllBookmarks();
            bookmarkConfirm.hidden = true;
            syncBookmarkFlags();
            renderArticles(state.filtered);
            renderBookmarksPanel();
        });
        cancelClearBtn.addEventListener('click', () => {
            bookmarkConfirm.hidden = true;
        });
    }

    // Loads all feeds, keeps sample data visible, caches successful results, and refreshes the UI.
    async function loadAllFeeds() {
        state.isLoading = true;

        const wasOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        const skeletonShown = state.articles.length === 0 && typeof SAMPLE_ARTICLES === 'undefined';

        if (typeof SAMPLE_ARTICLES !== 'undefined' && state.articles.length === 0) {
            state.articles = SAMPLE_ARTICLES;
            syncBookmarkFlags();
            applyFilters();
            lastRefreshed.textContent = 'Showing demo stories while live feeds load...';
        } else if (state.articles.length === 0) {
            showLoadingSkeleton();
        }

        // Flags a slow connection if the fetch is still pending after ~5 seconds.
        const slowNetworkTimer = setTimeout(() => {
            if (skeletonShown) {
                showSlowNetworkNotice();
            }
        }, 5000);

        try {
            // Offline devices skip straight to the cached/demo fallback below instead of
            // waiting on a live fetch that has no chance of succeeding.
            if (wasOffline) {
                throw new Error('Offline: navigator.onLine reported false.');
            }

            const liveArticles = await fetchAllFeeds(FEEDS);

            if (liveArticles.length > 0) {
                state.articles = liveArticles;
                localStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify(liveArticles));
                lastRefreshDate = new Date();
                syncBookmarkFlags();
                applyFilters();
                updateLastRefreshed();
            } else {
                lastRefreshed.textContent = 'Live feeds unavailable. Showing demo stories.';
            }
        } catch (error) {
            const cached = getCachedArticles();
            const unavailableReason = wasOffline ? "You're offline." : 'Live feeds unavailable.';

            if (cached.length > 0) {
                state.articles = cached;
                syncBookmarkFlags();
                applyFilters();
                lastRefreshed.textContent = wasOffline
                    ? "You're offline — showing cached articles."
                    : 'Live feeds unavailable. Showing cached stories.';
            } else if (state.articles.length === 0 && typeof SAMPLE_ARTICLES !== 'undefined') {
                state.articles = SAMPLE_ARTICLES;
                syncBookmarkFlags();
                applyFilters();
                lastRefreshed.textContent = `${unavailableReason} Showing demo stories.`;
            } else {
                lastRefreshed.textContent = `${unavailableReason} Showing current stories.`;
            }

            console.error('Feed load failed.', error);
        } finally {
            clearTimeout(slowNetworkTimer);
            state.isLoading = false;
        }
    }

    // Applies category and search filters, then renders the matching articles.
    function applyFilters() {
        const query = state.searchQuery.toLowerCase().trim();

        state.filtered = state.articles.filter((article) => {
            const matchesCategory = state.activeCategory === 'All' || article.category === state.activeCategory;
            const matchesSearch =
                !query ||
                article.title.toLowerCase().includes(query) ||
                article.description.toLowerCase().includes(query) ||
                article.sourceName.toLowerCase().includes(query) ||
                article.category.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });

        renderArticles(state.filtered);
    }

    // Renders article cards into the main grid.
    function renderArticles(articles) {
        articleGrid.textContent = '';
        feedTitle.textContent = state.activeCategory === 'All' ? 'All Stories' : state.activeCategory;
        articleCount.textContent = `${articles.length} article${articles.length === 1 ? '' : 's'}`;

        if (articles.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No articles match this view.';
            articleGrid.appendChild(empty);
            return;
        }

        articles.forEach((article) => {
            articleGrid.appendChild(buildArticleCard(article));
        });
    }

    // Builds and returns one article card element.
    function buildArticleCard(article) {
        const card = document.createElement('article');
        card.className = `article-card ${getCategoryClass(article.category)}`;

        if (article.image) {
            const image = document.createElement('img');
            image.className = 'article-image';
            image.src = article.image;
            image.alt = '';
            image.loading = 'lazy';
            card.appendChild(image);
        }

        const body = document.createElement('div');
        body.className = 'article-body';

        const meta = document.createElement('div');
        meta.className = 'card-meta';

        const badge = document.createElement('span');
        badge.className = 'category-badge';
        badge.textContent = article.category;

        const readTime = document.createElement('span');
        readTime.className = 'read-time';
        readTime.textContent = `${article.readTime} min`;

        meta.append(badge, readTime);

        const source = document.createElement('div');
        source.className = 'source-line';
        source.textContent = `${article.sourceName}`;

        const title = document.createElement('h2');
        title.className = 'article-title';

        const titleLink = document.createElement('a');
        titleLink.href = article.link;
        titleLink.target = '_blank';
        titleLink.rel = 'noopener noreferrer';
        titleLink.textContent = article.title;

        title.appendChild(titleLink);

        const description = document.createElement('p');
        description.className = 'article-description';
        description.textContent = article.description || 'No summary available.';

        const footer = document.createElement('div');
        footer.className = 'card-footer';

        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = getReadableDate(article.pubDate);

        const bookmarkBtn = document.createElement('button');
        bookmarkBtn.className = article.bookmarked ? 'bookmark-btn is-bookmarked' : 'bookmark-btn';
        bookmarkBtn.type = 'button';
        bookmarkBtn.dataset.bookmarkId = article.id;
        bookmarkBtn.setAttribute('aria-label', article.bookmarked ? 'Remove bookmark' : 'Add bookmark');
        bookmarkBtn.title = article.bookmarked ? 'Remove bookmark' : 'Add bookmark';
        bookmarkBtn.textContent = article.bookmarked ? '★' : '☆';

        footer.append(timestamp, bookmarkBtn);
        body.append(meta, source, title, description, footer);
        card.appendChild(body);

        return card;
    }

    // Renders the category sidebar from the FEEDS object.
    function renderSidebar() {
        categoryList.textContent = '';
        const categories = ['All', ...Object.keys(FEEDS)];

        categories.forEach((category) => {
            const group = document.createElement('div');
            group.className = 'category-group';

            const button = document.createElement('button');
            button.className = category === state.activeCategory ? 'category-btn active' : 'category-btn';
            button.type = 'button';
            button.dataset.category = category;
            button.textContent = category;

            group.appendChild(button);

            if (category !== 'All') {
                const feedList = document.createElement('div');
                feedList.className = 'feed-source-list';

                FEEDS[category].forEach((feed) => {
                    const feedName = document.createElement('span');
                    feedName.className = 'feed-source';
                    feedName.textContent = feed.name;
                    feedList.appendChild(feedName);
                });

                group.appendChild(feedList);
            }

            categoryList.appendChild(group);
        });
    }

    // Renders saved bookmarks in the right panel.
    function renderBookmarksPanel() {
        const bookmarks = getBookmarks();
        bookmarksList.textContent = '';

        if (bookmarks.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No bookmarks yet.';
            bookmarksList.appendChild(empty);
            return;
        }

        bookmarks.forEach((article) => {
            const item = document.createElement('article');
            item.className = 'bookmark-item';

            const link = document.createElement('a');
            link.href = article.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = article.title;

            const meta = document.createElement('p');
            meta.textContent = `${article.sourceName} • ${getReadableDate(article.pubDate)}`;

            item.append(link, meta);
            bookmarksList.appendChild(item);
        });
    }

    // Updates the search query and reapplies filters.
    function handleSearch(event) {
        state.searchQuery = event.target.value;
        applyFilters();
    }

    // Updates the active category and reapplies filters.
    function handleCategoryClick(category) {
        state.activeCategory = category;
        renderSidebar();
        applyFilters();
    }

    // Adds or removes a bookmark and refreshes bookmark-related UI.
    function handleBookmarkToggle(articleId, btnEl) {
        const article = state.articles.find((item) => item.id === articleId);

        if (!article) {
            return;
        }

        if (isBookmarked(articleId)) {
            removeBookmark(articleId);
            article.bookmarked = false;
            btnEl.classList.remove('is-bookmarked');
            btnEl.textContent = '☆';
            btnEl.setAttribute('aria-label', 'Add bookmark');
            btnEl.title = 'Add bookmark';
        } else {
            addBookmark(article);
            article.bookmarked = true;
            btnEl.classList.add('is-bookmarked');
            btnEl.textContent = '★';
            btnEl.setAttribute('aria-label', 'Remove bookmark');
            btnEl.title = 'Remove bookmark';
        }

        syncBookmarkFlags();
        renderBookmarksPanel();
    }

    // Inserts animated loading cards into the article grid.
    function showLoadingSkeleton() {
        articleGrid.textContent = '';
        articleCount.textContent = 'Loading...';

        for (let index = 0; index < 6; index += 1) {
            const card = document.createElement('div');
            card.className = 'skeleton-card';

            const image = document.createElement('div');
            image.className = 'skeleton-block skeleton-image';

            const content = document.createElement('div');
            content.className = 'skeleton-content';

            ['short', 'medium', '', 'medium', 'short'].forEach((size) => {
                const line = document.createElement('div');
                line.className = size ? `skeleton-block skeleton-line ${size}` : 'skeleton-block skeleton-line';
                content.appendChild(line);
            });

            card.append(image, content);
            articleGrid.appendChild(card);
        }
    }

    // Appends a "still working on it" hint below the skeleton when a fetch is taking a while.
    function showSlowNetworkNotice() {
        if (articleGrid.querySelector('.slow-network-notice')) {
            return;
        }

        const notice = document.createElement('div');
        notice.className = 'slow-network-notice';
        notice.textContent = 'Still fetching feeds...';
        articleGrid.appendChild(notice);
    }

    // Displays an error or fallback message in the article grid.
    function showError(message) {
        articleGrid.textContent = '';

        const error = document.createElement('div');
        error.className = 'error-state';

        const title = document.createElement('strong');
        title.textContent = 'Feed update issue';

        const text = document.createElement('span');
        text.textContent = message;

        error.append(title, text);
        articleGrid.appendChild(error);
    }

    // Updates the top bar last-refreshed text.
    function updateLastRefreshed() {
        if (!lastRefreshDate) {
            lastRefreshed.textContent = 'Last updated: never';
            return;
        }

        lastRefreshed.textContent = `Last updated: ${getReadableDate(lastRefreshDate)}`;
    }

    // Clears current articles and fetches every feed again.
    function handleRefresh() {
        if (state.isLoading) {
            return;
        }

        state.articles = [];
        state.filtered = [];
        loadAllFeeds();
    }

    // Syncs article bookmark flags with localStorage.
    function syncBookmarkFlags() {
        const bookmarkedIds = new Set(getBookmarks().map((article) => article.id));

        state.articles = state.articles.map((article) => ({
            ...article,
            bookmarked: bookmarkedIds.has(article.id)
        }));
    }

    // Gets cached articles from localStorage when the live proxy is unavailable.
    function getCachedArticles() {
        try {
            const cached = localStorage.getItem(ARTICLES_CACHE_KEY);
            const parsed = cached ? JSON.parse(cached) : [];

            return parsed.map((article) => ({
                ...article,
                pubDate: new Date(article.pubDate)
            }));
        } catch (error) {
            console.error('Could not read cached articles.', error);
            return [];
        }
    }

    // Converts category names into CSS class names.
    function getCategoryClass(category) {
        return `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
    }

    init();
});