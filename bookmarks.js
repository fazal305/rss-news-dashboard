const BOOKMARKS_KEY = 'rss-bookmarks';

// Returns all bookmarked article objects from localStorage.
function getBookmarks() {
    try {
        const stored = localStorage.getItem(BOOKMARKS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Could not read bookmarks from localStorage.', error);
        return [];
    }
}

// Saves bookmarked article objects to localStorage.
function saveBookmarks(arr) {
    try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(arr));
    } catch (error) {
        console.error('Could not save bookmarks to localStorage.', error);
    }
}

// Adds an article to bookmarks if it is not already saved.
function addBookmark(article) {
    const bookmarks = getBookmarks();
    const exists = bookmarks.some((item) => item.id === article.id);

    if (!exists) {
        bookmarks.unshift({ ...article, bookmarked: true });
        saveBookmarks(bookmarks);
    }
}

// Removes an article from bookmarks by article id.
function removeBookmark(articleId) {
    const bookmarks = getBookmarks();
    const updated = bookmarks.filter((article) => article.id !== articleId);
    saveBookmarks(updated);
}

// Checks whether an article id is currently bookmarked.
function isBookmarked(articleId) {
    return getBookmarks().some((article) => article.id === articleId);
}

// Clears all bookmarks after inline confirmation from the bookmarks panel.
function clearAllBookmarks() {
    saveBookmarks([]);
}