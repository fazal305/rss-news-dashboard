// Fetches an RSS feed through the AllOrigins CORS proxy and returns raw XML text.
async function fetchFeed(feedUrl) {
    try {
        const proxyUrl = PROXY_PREFIX + encodeURIComponent(feedUrl);
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`Feed request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.contents) {
            throw new Error('Proxy response did not include RSS contents.');
        }

        return data.contents;
    } catch (error) {
        console.error(`Failed to fetch feed: ${feedUrl}`, error);
        throw error;
    }
}

// Parses raw RSS XML into article objects.
function parseRSS(xmlText, sourceName, category) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const parserError = xmlDoc.querySelector('parsererror');

    if (parserError) {
        throw new Error(`Could not parse RSS XML for ${sourceName}`);
    }

    return extractArticles(xmlDoc, sourceName, category);
}

// Extracts normalized article objects from RSS item nodes.
function extractArticles(xmlDoc, sourceName, category) {
    const items = Array.from(xmlDoc.querySelectorAll('item'));

    return items.map((item) => {
        const title = item.querySelector('title')?.textContent?.trim() || 'Untitled article';
        const rawDescription = item.querySelector('description')?.textContent || '';
        const cleanDescription = stripHTML(rawDescription);
        const description =
            cleanDescription.length > 180
                ? `${cleanDescription.slice(0, 177).trim()}...`
                : cleanDescription;
        const link = item.querySelector('link')?.textContent?.trim() || '#';
        const pubDateText = item.querySelector('pubDate')?.textContent?.trim() || '';
        const parsedDate = new Date(pubDateText);
        const pubDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        const wordCount = cleanDescription.split(/\s+/).filter(Boolean).length || title.split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));
        const mediaContent = item.getElementsByTagName('media:content')[0];
        const enclosure = item.querySelector('enclosure');
        const imageFromMedia = mediaContent?.getAttribute('url') || '';
        const enclosureType = enclosure?.getAttribute('type') || '';
        const imageFromEnclosure = enclosureType.startsWith('image/') ? enclosure.getAttribute('url') : '';
        const imageFromDescription = rawDescription.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || '';
        const image = imageFromMedia || imageFromEnclosure || imageFromDescription || '';

        return {
            id: link || `${title}-${pubDate.toISOString()}`,
            title,
            description,
            link,
            pubDate,
            sourceName,
            category,
            readTime,
            image,
            bookmarked: false
        };
    });
}

// Removes HTML tags from a string and returns readable plain text.
function stripHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html || '';
    return template.content.textContent.replace(/\s+/g, ' ').trim();
}

// Fetches every feed source, parses articles, and returns one newest-first article array.
async function fetchAllFeeds(feedsObject) {
    const feedTasks = [];

    Object.entries(feedsObject).forEach(([category, feeds]) => {
        feeds.forEach((feed) => {
            const task = fetchFeed(feed.url)
                .then((xmlText) => parseRSS(xmlText, feed.name, category))
                .catch((error) => {
                    console.error(`Skipping ${feed.name}`, error);
                    return [];
                });

            feedTasks.push(task);
        });
    });

    const results = await Promise.all(feedTasks);
    const articles = results.flat();

    return articles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

// Converts a date object into a compact relative timestamp.
function getReadableDate(dateObj) {
    const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (Number.isNaN(date.getTime()) || diffMinutes < 1) {
        return 'just now';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes} min ago`;
    }

    if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }

    if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}