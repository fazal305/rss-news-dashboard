# RSS News Dashboard

A cyberpunk-style RSS feed reader and news dashboard built with vanilla HTML, CSS, and JavaScript. It fetches RSS feeds, parses XML in the browser with `DOMParser`, displays stories in a responsive dashboard, and saves bookmarked articles with `localStorage`.

## Live Project

- GitHub Repository: [fazal305/rss-news-dashboard](https://github.com/fazal305/rss-news-dashboard)
- Live Demo: [https://fazal305.github.io/rss-news-dashboard/](https://fazal305.github.io/rss-news-dashboard/)

## Overview

RSS News Dashboard is a single-page web app designed as a portfolio project. It brings multiple news sources into one interface and organizes them by category. The app uses a three-column layout on desktop, with feed categories on the left, article cards in the center, and saved bookmarks on the right.

Because many RSS feeds block direct browser requests, the app uses a CORS proxy to request feed XML safely from the frontend. If live feeds fail, the interface can still show demo or cached articles so the dashboard does not feel empty.

## Features

- Live RSS feed fetching
- XML parsing with native `DOMParser`
- Category filtering
- Search across article title, summary, source, and category
- Bookmark and unbookmark articles
- Saved bookmarks with `localStorage`
- Right-side bookmarks panel
- Refresh button for reloading feeds
- Last-updated status text
- Loading skeleton cards
- Cached or demo content fallback
- Responsive layout for desktop, tablet, and mobile
- Dark neon cyberpunk UI
- No frameworks, no libraries, no build step

## Feed Categories

The dashboard includes RSS sources grouped into:

- Technology
- AI
- Science
- Development
- Security

Example sources include Hacker News, The Verge, Ars Technica, TechCrunch, MIT Technology Review AI, NASA, Dev.to, Smashing Magazine, Krebs on Security, and The Hacker News.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
- DOMParser
- localStorage
- RSS/XML
- GitHub Pages

## Project Structure

```text
rss-news-dashboard/
├── index.html
├── styles.css
├── app.js
├── rss-parser.js
├── bookmarks.js
├── feeds.js
├── sample-data.js
├── favicon.svg
├── README.md
└── .gitignore
