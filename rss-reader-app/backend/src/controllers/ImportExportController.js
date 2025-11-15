/**
 * ImportExportController - Handle data import/export operations
 * Single Responsibility: Import/Export XML backup data
 */
class ImportExportController {
  constructor(userRepository, feedRepository, itemRepository, databaseService) {
    this.userRepository = userRepository;
    this.feedRepository = feedRepository;
    this.itemRepository = itemRepository;
    this.db = databaseService;
  }

  /**
   * GET /api/export - Export all user data as XML
   * Returns XML containing feeds and items for backup
   */
  exportData(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Get all feeds for user
      const feeds = this.feedRepository.getAllFeeds(userId);
      
      // Get all items for user
      const items = this.itemRepository.getUserItems(userId, {});

      // Generate XML
      const xml = this.generateXML(feeds, items);

      res.json({
        success: true,
        data: xml,
        feedsCount: feeds ? feeds.length : 0,
        itemsCount: items ? items.length : 0
      });
    } catch (error) {
      console.error('[ImportExportController.exportData] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/import - Import user data from XML
   * Replaces all user's current feeds and items with imported data
   */
  importData(req, res) {
    try {
      const userId = req.user?.id;
      console.log('\n========== /api/import ENDPOINT CALLED ==========');
      console.log(`User ID: ${userId}`);
      console.log('========== START IMPORT ==========\n');
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { xmlData } = req.body;
      if (!xmlData) {
        return res.status(400).json({
          success: false,
          error: 'No XML data provided'
        });
      }

      console.log(`[ImportExportController.importData] Received XML data: ${xmlData.length} bytes`);

      // Parse XML
      const result = this.parseXML(xmlData);

      // Clear existing feeds (items will be cascaded deleted)
      const existingFeeds = this.feedRepository.getAllFeeds(userId);
      for (const feed of existingFeeds) {
        this.feedRepository.deleteFeed(feed.id, userId);
      }

      // Import feeds
      let feedsImported = 0;
      let itemsImported = 0;

      if (result.feeds && Array.isArray(result.feeds)) {
        for (const feedData of result.feeds) {
          try {
            const feed = {
              id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              url: feedData.url,
              title: feedData.title,
              description: feedData.description || '',
              color: feedData.color || '#4ECDC4',
              category: feedData.category || '',
              isActive: true,
              addedDate: feedData.addedDate || new Date().toISOString()
            };

            console.log(`[ImportExportController.importData] Creating feed: "${feed.title}" with category: "${feed.category}"`);
            this.db.createFeed(feed, userId);
            feedsImported++;

            // Import items for this feed if they exist
            if (feedData.items && Array.isArray(feedData.items)) {
              for (const itemData of feedData.items) {
                try {
                  this.db.createItem({
                    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    feedId: feed.id,
                    feedTitle: feed.title,
                    title: itemData.title || 'Untitled',
                    description: itemData.description || '',
                    link: itemData.link || '',
                    pubDate: itemData.pubDate || new Date().toISOString(),
                    categories: itemData.categories || '[]',
                    isRead: itemData.isRead ? 1 : 0,
                    author: null,
                    content: null,
                    imageUrl: null
                  }, userId);
                  itemsImported++;
                } catch (itemError) {
                  console.error(`[ImportExportController] Error importing item: ${itemError.message}`);
                }
              }
            }
          } catch (feedError) {
            console.error(`[ImportExportController] Error importing feed ${feedData.title}: ${feedError.message}`);
          }
        }
      }

      console.log(`[ImportExportController] Imported ${feedsImported} feeds and ${itemsImported} items for user ${userId}`);
      console.log('========== END IMPORT ==========\n');

      res.json({
        success: true,
        data: {
          feedsImported,
          itemsImported
        }
      });
    } catch (error) {
      console.error('[ImportExportController.importData] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generate XML string from feeds and items
   * Format: Custom XML backup format
   */
  generateXML(feeds, items) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss-reader-backup>\n';
    xml += '  <metadata>\n';
    xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
    xml += '  </metadata>\n';
    xml += '  <feeds>\n';

    // Create a map of items by feed
    const itemsByFeed = new Map();
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!itemsByFeed.has(item.feedId)) {
          itemsByFeed.set(item.feedId, []);
        }
        itemsByFeed.get(item.feedId).push(item);
      }
    }

    // Add feeds with their items
    if (feeds && Array.isArray(feeds)) {
      for (const feed of feeds) {
        xml += `    <feed>\n`;
        xml += `      <id>${this.escapeXML(feed.id)}</id>\n`;
        xml += `      <url>${this.escapeXML(feed.url)}</url>\n`;
        xml += `      <title>${this.escapeXML(feed.title)}</title>\n`;
        xml += `      <description>${this.escapeXML(feed.description || '')}</description>\n`;
        xml += `      <color>${this.escapeXML(feed.color)}</color>\n`;
        xml += `      <category>${this.escapeXML(feed.category || '')}</category>\n`;
        xml += `      <addedDate>${this.escapeXML(feed.addedDate || '')}</addedDate>\n`;
        
        // Add items for this feed
        const feedItems = itemsByFeed.get(feed.id) || [];
        if (feedItems.length > 0) {
          xml += `      <items>\n`;
          for (const item of feedItems) {
            xml += `        <item>\n`;
            xml += `          <title>${this.escapeXML(item.title)}</title>\n`;
            xml += `          <description>${this.escapeXML(item.description || '')}</description>\n`;
            xml += `          <link>${this.escapeXML(item.link || '')}</link>\n`;
            xml += `          <pubDate>${this.escapeXML(item.pubDate || '')}</pubDate>\n`;
            xml += `          <isRead>${item.isRead ? '1' : '0'}</isRead>\n`;
            xml += `          <categories>${this.escapeXML(item.categories || '[]')}</categories>\n`;
            xml += `        </item>\n`;
          }
          xml += `      </items>\n`;
        } else {
          xml += `      <items />\n`;
        }

        xml += `    </feed>\n`;
      }
    }

    xml += '  </feeds>\n';
    xml += '</rss-reader-backup>\n';

    return xml;
  }

  /**
   * Parse XML string and extract feeds and items
   * Supports both custom XML format and OPML (Feedly/Pocket) format
   */
  parseXML(xmlData) {
    try {
      // Check if it's OPML format (Feedly/Pocket export)
      if (xmlData.includes('<opml') || xmlData.includes('<outline')) {
        return this.parseOPML(xmlData);
      }
      
      // Otherwise parse as custom RSS Reader format
      return this.parseCustomXML(xmlData);
    } catch (error) {
      console.error('[ImportExportController] XML Parse error:', error.message);
      throw new Error(`Failed to parse XML: ${error.message}`);
    }
  }

  /**
   * Parse OPML format (used by Feedly, Pocket, and other services)
   * OPML uses outline tags with xmlUrl for feed URL and text for title
   * Categories are preserved in folder structure
   */
  parseOPML(xmlData) {
    console.log('[ImportExportController] Parsing OPML format (Feedly/Pocket)');
    const feeds = [];
    try {
      // Extract body content
      const bodyMatch = xmlData.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (!bodyMatch || !bodyMatch[1]) {
        throw new Error('No <body> tag found in OPML');
      }

      const bodyContent = bodyMatch[1];
      let globalProcessingLog = '';

      // Recursively process outline elements
      const processOutlines = (xml, parentFolder = '') => {
        let i = 0;
        
        while (i < xml.length) {
          // Find next opening outline tag
          const openMatch = xml.substring(i).match(/<outline\s[^>]*>/);
          if (!openMatch) break;

          const openTagStart = i + openMatch.index;
          const openTag = openMatch[0];
          const openTagEnd = openTagStart + openTag.length;

          // Check if this is a self-closing tag (ends with />)
          if (openTag.endsWith('/>')) {
            // Self-closing tag - must be a feed
            const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
            const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
            
            if (urlMatch && urlMatch[1]) {
              const url = urlMatch[1];
              const title = textMatch ? textMatch[1] : 'Untitled Feed';
              
              const feed = {
                id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                url: url,
                title: title || 'Untitled Feed',
                description: '',
                color: this.getRandomColor(),
                category: parentFolder,
                addedDate: new Date().toISOString(),
                items: []
              };

              feeds.push(feed);
              if (parentFolder) {
                console.log(`[ImportExportController] Added feed: "${feed.title}" in category: "${parentFolder}"`);
              } else {
                console.log(`[ImportExportController] Added standalone feed: "${feed.title}"`);
              }
            }

            i = openTagEnd;
          } else {
            // Non-self-closing tag - must find matching </outline>
            let closeTagIndex = -1;
            let nestLevel = 0;
            let searchPos = openTagEnd;

            // Find the matching </outline> tag accounting for nesting
            // IMPORTANT: Only count non-self-closing <outline tags as nesting levels
            while (searchPos < xml.length) {
              const nextOpen = xml.indexOf('<outline', searchPos);
              const nextClose = xml.indexOf('</outline>', searchPos);

              if (nextClose === -1) break;

              if (nextOpen !== -1 && nextOpen < nextClose) {
                // Another opening tag before closing - check if it's self-closing
                const openTagEndMatch = xml.substring(nextOpen).match(/^\<outline[^>]*>/);
                if (openTagEndMatch && !openTagEndMatch[0].endsWith('/>')) {
                  // Non-self-closing, so it increases nesting
                  nestLevel++;
                }
                searchPos = nextOpen + 8;
              } else {
                // Found a closing tag
                if (nestLevel === 0) {
                  closeTagIndex = nextClose;
                  break;
                } else {
                  nestLevel--;
                  searchPos = nextClose + 10;
                }
              }
            }

            if (closeTagIndex !== -1) {
              const content = xml.substring(openTagEnd, closeTagIndex);
              
              // Determine if this is a feed or folder by checking:
              // 1. If it has type="rss" -> it's a feed
              // 2. If it has nested <outline> tags -> it's a folder
              const hasNestedOutline = /<outline\s/.test(content);
              const isFeedTag = /type\s*=\s*["']rss["']/i.test(openTag);

              if (isFeedTag) {
                // This is a feed (possibly with nested content, which we'll ignore)
                const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
                const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
                
                if (urlMatch && urlMatch[1]) {
                  const url = urlMatch[1];
                  const title = textMatch ? textMatch[1] : 'Untitled Feed';
                  
                  const feed = {
                    id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    url: url,
                    title: title || 'Untitled Feed',
                    description: '',
                    color: this.getRandomColor(),
                    category: parentFolder,
                    addedDate: new Date().toISOString(),
                    items: []
                  };

                  feeds.push(feed);
                  if (parentFolder) {
                    console.log(`[ImportExportController] Added feed: "${feed.title}" in category: "${parentFolder}"`);
                  } else {
                    console.log(`[ImportExportController] Added standalone feed: "${feed.title}"`);
                  }
                }
              } else if (hasNestedOutline) {
                // This is a folder - extract folder name and recurse
                // Treat ANY outline with nested content as a folder, regardless of type attribute
                const folderNameMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
                const folderName = folderNameMatch ? folderNameMatch[1] : 'Uncategorized';

                // Recursively process nested outlines
                processOutlines(content, folderName);
              } else if (!isFeedTag) {
                // No type attribute and no nested outlines, but it's not marked as RSS
                // Some exporters don't include type="folder" attribute
                // If there's nested content, treat as folder; otherwise check if it looks like a feed
                const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
                if (urlMatch && urlMatch[1]) {
                  // Has URL - it's a feed
                  const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
                  const url = urlMatch[1];
                  const title = textMatch ? textMatch[1] : 'Untitled Feed';
                  
                  const feed = {
                    id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    url: url,
                    title: title || 'Untitled Feed',
                    description: '',
                    color: this.getRandomColor(),
                    category: parentFolder,
                    addedDate: new Date().toISOString(),
                    items: []
                  };

                  feeds.push(feed);
                  if (parentFolder) {
                    console.log(`[ImportExportController] Added feed: "${feed.title}" in category: "${parentFolder}"`);
                  } else {
                    console.log(`[ImportExportController] Added standalone feed: "${feed.title}"`);
                  }
                }
              }

              i = closeTagIndex + 10; // Move past </outline>
            } else {
              i = openTagEnd;
            }
          }
        }

        return feeds;
      };

      // Process all outlines in body
      processOutlines(bodyContent);

      if (feeds.length === 0) {
        throw new Error('No feeds found in OPML format. Expected <outline> tags with type="rss" and xmlUrl attributes.');
      }

      console.log(`\n[ImportExportController] Imported ${feeds.length} feeds from OPML with categories preserved`);
      console.log('[ImportExportController] Feeds with categories:');
      feeds.forEach(f => {
        console.log(`  - "${f.title}" | Category: "${f.category || '(empty)'}"`);
      });
      return { feeds };
    } catch (error) {
      console.error('[ImportExportController] OPML parse error:', error.message);
      throw error;
    }
  }

  /**
   * Parse custom RSS Reader XML format
   */
  parseCustomXML(xmlData) {
    console.log('[ImportExportController] Parsing custom XML format');
    const feeds = [];

    // Extract each feed block
    const feedRegex = /<feed>([\s\S]*?)<\/feed>/g;
    let feedMatch;

    while ((feedMatch = feedRegex.exec(xmlData)) !== null) {
      const feedBlock = feedMatch[1];

      const feed = {
        id: this.extractXMLValue(feedBlock, 'id'),
        url: this.extractXMLValue(feedBlock, 'url'),
        title: this.extractXMLValue(feedBlock, 'title'),
        description: this.extractXMLValue(feedBlock, 'description'),
        color: this.extractXMLValue(feedBlock, 'color'),
        category: this.extractXMLValue(feedBlock, 'category'),
        addedDate: this.extractXMLValue(feedBlock, 'addedDate'),
        items: []
      };

      // Extract items for this feed
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(feedBlock)) !== null) {
        const itemBlock = itemMatch[1];
        const item = {
          title: this.extractXMLValue(itemBlock, 'title'),
          description: this.extractXMLValue(itemBlock, 'description'),
          link: this.extractXMLValue(itemBlock, 'link'),
          pubDate: this.extractXMLValue(itemBlock, 'pubDate'),
          isRead: this.extractXMLValue(itemBlock, 'isRead') === '1',
          categories: this.extractXMLValue(itemBlock, 'categories')
        };
        feed.items.push(item);
      }

      feeds.push(feed);
    }

    if (feeds.length === 0) {
      throw new Error('No feeds found in custom XML format');
    }

    console.log(`[ImportExportController] Imported ${feeds.length} feeds from custom XML`);
    return { feeds };
  }

  /**
   * Extract value from XML tag using regex
   */
  extractXMLValue(xml, tagName) {
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    if (match && match[1]) {
      return this.unescapeXML(match[1].trim());
    }
    return '';
  }

  /**
   * Escape XML special characters
   */
  escapeXML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Unescape XML special characters
   */
  unescapeXML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  }

  /**
   * Generate a random color for the feed
   */
  getRandomColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C29E',
      '#FF6B9D', '#C44569', '#A8E6CF', '#FFD3B6', '#FFAAA5'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

module.exports = ImportExportController;
