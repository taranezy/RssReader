const axios = require('axios');
const cheerio = require('cheerio');

/**
 * RSS Proxy Service - Converts any website to RSS/Atom/JSON feed
 * by analyzing HTML structure and detecting article patterns
 */
class RssProxyService {
  constructor() {
    this.timeout = 15000;
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  /**
   * Check if a URL is a standard RSS/Atom feed
   */
  async isStandardFeed(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout,
        responseType: 'text'
      });

      const content = response.data;
      // Check for RSS/Atom/JSON Feed markers
      return (
        content.includes('<rss') ||
        content.includes('<feed') ||
        content.includes('<?xml') ||
        content.includes('"version":"https://jsonfeed.org')
      );
    } catch (error) {
      console.error('Error checking feed type:', error.message);
      return false;
    }
  }

  /**
   * Extract feed URL from HTML if available
   * Looks for RSS/Atom feed links in:
   * 1. HTML head meta links (highest priority)
   * 2. Body links with RSS/Feed keywords (fallback)
   */
  async detectFeedUrl(url) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      const feedLinks = [];
      
      // Priority 1: Look for feed links in HTML head (rel="alternate")
      $('link[rel="alternate"][type*="xml"], link[rel="alternate"][type*="rss"], link[rel="alternate"][type*="atom"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          feedLinks.push({
            type: $(el).attr('type'),
            href: this.resolveUrl(url, href),
            title: $(el).attr('title'),
            priority: 'head-meta'
          });
        }
      });

      // If found in head, return immediately
      if (feedLinks.length > 0) {
        console.log(`[RSS Proxy] Found feed URL in HTML head: ${feedLinks[0].href}`);
        return feedLinks[0].href;
      }

      // Priority 2: Look for feed links in body (links with RSS/Feed keywords)
      const feedKeywords = ['rss', 'atom', '/feed', '.xml'];
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().toLowerCase().trim();
        
        // More strict validation: must look like an RSS/Feed URL, not a regular article link
        // Check for explicit feed patterns
        const hasRssFeedPattern = (
          /\.xml$/.test(href) ||                    // ends with .xml
          /[?&]feed=/i.test(href) ||                // ?feed= or &feed=
          /\/feed\/?$/i.test(href) ||               // /feed or /feed/
          /\/feeds\/?$/i.test(href) ||              // /feeds or /feeds/
          /\/rss\/?$/i.test(href) ||                // /rss or /rss/
          /\/atom\.xml/i.test(href) ||              // /atom.xml
          /rss\.xml/i.test(href)                    // rss.xml
        );

        // Also accept links with explicit "RSS" or "Atom" text
        const isExplicitFeedLink = (
          text.includes('rss') || 
          text.includes('atom') ||
          text.includes('subscribe to')
        );

        if ((hasRssFeedPattern || isExplicitFeedLink) && !href.startsWith('#') && !href.startsWith('javascript:')) {
          const resolvedUrl = this.resolveUrl(url, href);
          feedLinks.push({
            href: resolvedUrl,
            title: $(el).text().trim(),
            priority: 'body-link'
          });
        }
      });

      if (feedLinks.length > 0) {
        console.log(`[RSS Proxy] Found potential feed URL in page: ${feedLinks[0].href}`);
        return feedLinks[0].href;
      }

      return null;
    } catch (error) {
      console.error('Error detecting feed URL:', error.message);
      return null;
    }
  }

  /**
   * Convert HTML page to RSS feed by analyzing article patterns
   * Strategy:
   * 1. Check if page has a link to an actual feed -> fetch and return it
   * 2. If no feed link found -> scrape articles from current page
   */
  async convertHtmlToRss(url, siteTitle = null) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      
      // Get site title if not provided
      if (!siteTitle) {
        siteTitle = $('title').text() || $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;
      }

      // STEP 1: Try to find an actual feed URL on this page
      const feedUrl = await this.detectFeedUrl(url);
      
      if (feedUrl && feedUrl !== url) {
        // Found a feed link! Fetch it directly
        console.log(`[RSS Proxy] Following feed URL: ${feedUrl}`);
        try {
          const feedResponse = await axios.get(feedUrl, {
            headers: this.headers,
            timeout: this.timeout,
            responseType: 'text'
          });
          
          // Verify it's actually a valid feed
          const feedContent = feedResponse.data;
          if (feedContent.includes('<rss') || feedContent.includes('<feed') || feedContent.includes('<?xml')) {
            console.log(`[RSS Proxy] Successfully fetched feed from: ${feedUrl}`);
            return feedContent; // Return the actual feed directly
          }
        } catch (feedError) {
          console.log(`[RSS Proxy] Could not fetch feed from ${feedUrl}, falling back to article extraction: ${feedError.message}`);
        }
      }

      // STEP 2: No valid feed found, proceed with article extraction
      console.log(`[RSS Proxy] No feed link found, extracting articles from: ${url}`);
      const articles = [];

      // Extract articles using common patterns
      const articleSelectors = [
        'article',
        '[class*="post"]',
        '[class*="article"]',
        '[class*="entry"]',
        '[class*="item"]',
        '[class*="content"]'
      ];

      for (const selector of articleSelectors) {
        $(selector).each((i, element) => {
          if (articles.length >= 20) return; // Limit to 20 articles

          const $elem = $(element);
          const article = this.extractArticle($elem, $, url);
          
          if (article && article.title && article.link) {
            articles.push(article);
          }
        });

        if (articles.length >= 20) break;
      }

      // If still no articles, try to find them by common link patterns
      if (articles.length === 0) {
        articles.push(...this.extractArticlesFromLinks($, url));
      }

      // STEP 3: Enrich articles with full content from their pages
      console.log(`[RSS Proxy] Fetching full content for ${articles.length} articles...`);
      const enrichedArticles = [];
      for (const article of articles) {
        try {
          // Only fetch if we have a valid link
          if (article.link) {
            const fullContent = await this.fetchFullArticleContent(article.link);
            if (fullContent && fullContent.length > 0) {
              // Use full content if available, combine with existing summary
              article.description = fullContent;
            }
          }
          enrichedArticles.push(article);
        } catch (error) {
          console.log(`Error enriching article: ${error.message}`);
          enrichedArticles.push(article);
        }
      }

      return this.generateRssFeed(siteTitle, url, enrichedArticles);
    } catch (error) {
      console.error('Error converting HTML to RSS:', error.message);
      throw error;
    }
  }

  /**
   * Extract full article content from article page
   * Fetches the article URL and extracts the full body text
   */
  async fetchFullArticleContent(articleUrl) {
    try {
      const response = await axios.get(articleUrl, {
        headers: this.headers,
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      
      // Try multiple selectors to find article content
      const contentSelectors = [
        'article',
        '[class*="article-body"]',
        '[class*="article-content"]',
        '[class*="post-content"]',
        '[class*="entry-content"]',
        '[class*="content-body"]',
        '[class*="article-text"]',
        '.content',
        '#content',
        'main'
      ];

      let fullContent = '';

      // Try each selector
      for (const selector of contentSelectors) {
        const $content = $(selector);
        if ($content.length) {
          // Extract all text from paragraphs
          const paragraphs = [];
          $content.find('p').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 0) {
              paragraphs.push(text);
            }
          });

          if (paragraphs.length > 0) {
            fullContent = paragraphs.join('\n\n');
            break;
          }

          // Fallback: get all text content
          fullContent = $content.text().trim();
          if (fullContent.length > 100) {
            break;
          }
        }
      }

      // Limit content to first 2000 characters to keep feed manageable
      if (fullContent) {
        fullContent = fullContent.substring(0, 2000);
        if (fullContent.length === 2000) {
          fullContent += '...[Read more on the original site]';
        }
      }

      return fullContent;
    } catch (error) {
      console.log(`Could not fetch full content from ${articleUrl}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract article data from an element
   */
  extractArticle($elem, $, baseUrl) {
    const article = {};

    // Extract title
    article.title = 
      $elem.find('h1, h2, h3, [class*="title"], [class*="headline"]').first().text().trim() ||
      $elem.find('a').first().text().trim();

    // Extract link - prioritize direct article links (with /clanak/ or similar patterns)
    let linkElem = null;
    const allLinks = $elem.find('a[href]');
    
    // First, try to find a direct article link by looking for article patterns
    for (let i = 0; i < allLinks.length; i++) {
      const href = $(allLinks[i]).attr('href');
      if (href && this.isValidArticleLink(href, $(allLinks[i]).text().trim(), baseUrl)) {
        linkElem = $(allLinks[i]);
        break;
      }
    }
    
    // If no direct article link found, just use the first link
    if (!linkElem || !linkElem.attr('href')) {
      linkElem = allLinks.first();
    }
    
    article.link = this.resolveUrl(baseUrl, linkElem.attr('href'));

    // Extract description/summary
    article.description = 
      $elem.find('[class*="summary"], [class*="excerpt"], p').first().text().trim() ||
      $elem.find('p').first().text().trim();

    // Extract image
    const img = $elem.find('img').first();
    article.image = this.resolveUrl(baseUrl, img.attr('src'));

    // Extract date
    const dateText = 
      $elem.find('[class*="date"], [class*="time"], time').first().attr('datetime') ||
      $elem.find('[class*="date"], [class*="time"], time').first().text();
    
    if (dateText) {
      try {
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
          article.pubDate = parsedDate.toISOString();
        } else {
          article.pubDate = new Date().toISOString();
        }
      } catch (e) {
        article.pubDate = new Date().toISOString();
      }
    } else {
      article.pubDate = new Date().toISOString();
    }

    // Extract author
    article.author = 
      $elem.find('[class*="author"], [class*="by"]').first().text().trim() ||
      $elem.find('[rel="author"]').first().text().trim();

    return article;
  }

  /**
   * Extract articles by finding link patterns
   */
  extractArticlesFromLinks($, baseUrl) {
    const articles = [];
    const seen = new Set();

    $('a[href]').each((i, elem) => {
      if (articles.length >= 20) return;

      const $link = $(elem);
      const href = $link.attr('href');
      const title = $link.text().trim();

      // Filter out navigation links and duplicates
      if (!this.isValidArticleLink(href, title, baseUrl) || seen.has(href)) {
        return;
      }

      seen.add(href);
      const resolvedUrl = this.resolveUrl(baseUrl, href);

      // Get parent container for more context
      const $container = $link.closest('[class*="item"], [class*="post"], [class*="article"], div');
      const description = $container.find('p').first().text().trim();
      const img = $container.find('img').first().attr('src');

      articles.push({
        title: title || resolvedUrl,
        link: resolvedUrl,
        description: description || 'No description available',
        image: this.resolveUrl(baseUrl, img),
        pubDate: new Date().toISOString(),
        author: 'Unknown'
      });
    });

    return articles;
  }

  /**
   * Check if a link looks like an article
   * Prioritizes direct article links (like /clanak/ on politika.rs)
   */
  isValidArticleLink(href, title, baseUrl) {
    if (!href || !title) return false;
    
    const excludePatterns = [
      /^#/, // anchors
      /^javascript:/, // javascript
      /\.(css|js|png|jpg|gif|jpeg)$/, // files
      /\?.*ref=/, // tracking
      /(logout|login|signin|register|account|settings|admin|cdn|assets)/, // util pages
    ];

    const url = href.toLowerCase();
    
    // Check if it matches exclusion patterns
    if (excludePatterns.some(pattern => pattern.test(url))) {
      return false;
    }

    // If title is too short, it's not an article
    if (title.length < 5) {
      return false;
    }

    // Positive indicators of real article links - these are REQUIRED
    // Politika.rs uses /scc/clanak/ pattern
    // Medium uses /p/ pattern  
    // Dev.to uses /@user/slug pattern
    const articlePatterns = [
      /\/clanak\//, // Serbian news sites (PRIORITY)
      /\/article\//, // Common pattern
      /\/news\//, // Common pattern
      /\/post\//, // Blog pattern
      /\/blog\//, // Blog pattern
      /\/story\//, // Story pattern
      /\/(?:\d{4}\/\d{2}\/\d{2})\//, // Date-based patterns
      /\/p\//, // Medium-style
      /\/@.*\//, // Dev.to style
    ];

    // Check if it matches a strong article pattern
    const isStrongArticleLink = articlePatterns.some(pattern => pattern.test(url));
    
    // STRICT MODE: If we don't recognize the pattern explicitly, assume it's not an article
    // This prevents category pages and section pages from being treated as articles
    if (!isStrongArticleLink) {
      return false;
    }

    return true;
  }

  /**
   * Resolve relative URLs
   */
  resolveUrl(baseUrl, relativeUrl) {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http')) return relativeUrl;
    if (relativeUrl.startsWith('//')) return 'https:' + relativeUrl;

    try {
      const base = new URL(baseUrl);
      return new URL(relativeUrl, base).toString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate RSS feed XML from articles
   */
  generateRssFeed(title, url, articles) {
    const pubDate = new Date().toUTCString();
    const domain = new URL(url).hostname;

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${this.escapeXml(title)}</title>
    <link>${this.escapeXml(url)}</link>
    <description>Generated RSS feed from ${domain}</description>
    <language>en-us</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <generator>RSS-Proxy-Service/1.0</generator>`;

    articles.forEach(article => {
      const image = article.image ? `<media:content url="${this.escapeXml(article.image)}" medium="image" />` : '';
      rss += `
    <item>
      <title>${this.escapeXml(article.title)}</title>
      <link>${this.escapeXml(article.link)}</link>
      <description>${this.escapeXml(article.description)}</description>
      <pubDate>${new Date(article.pubDate).toUTCString()}</pubDate>
      <author>${this.escapeXml(article.author || 'Unknown')}</author>
      <guid isPermaLink="false">${this.escapeXml(article.link)}</guid>
      ${image}
    </item>`;
    });

    rss += `
  </channel>
</rss>`;

    return rss;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate JSON Feed format
   */
  generateJsonFeed(title, url, articles) {
    return {
      version: 'https://jsonfeed.org/version/1.1',
      title: title,
      home_page_url: url,
      feed_url: url,
      description: `Generated JSON feed from ${new URL(url).hostname}`,
      icon: null,
      favicon: null,
      language: 'en-us',
      items: articles.map(article => ({
        id: article.link,
        content_html: `<p>${this.escapeXml(article.description)}</p>${article.image ? `<img src="${article.image}" />` : ''}`,
        url: article.link,
        title: article.title,
        summary: article.description,
        image: article.image || null,
        date_published: article.pubDate,
        author: {
          name: article.author || 'Unknown'
        }
      }))
    };
  }
}

module.exports = RssProxyService;
