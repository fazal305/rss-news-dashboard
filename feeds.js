const PROXY_PREFIX = 'https://api.allorigins.win/get?url=';

const FEEDS = {
    Technology: [
        { name: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
    ],
    AI: [
        { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/' },
        { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' }
    ],
    Science: [
        { name: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
        { name: 'New Scientist', url: 'https://www.newscientist.com/feed/home/' }
    ],
    Development: [
        { name: 'CSS Tricks', url: 'https://css-tricks.com/feed/' },
        { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/' },
        { name: 'Dev.to', url: 'https://dev.to/feed' }
    ],
    Security: [
        { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' },
        { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' }
    ]
};