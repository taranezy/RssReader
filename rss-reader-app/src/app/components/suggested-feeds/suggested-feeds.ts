import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RssFeedService } from '../../services/rss-feed.service';
import { RssFeed } from '../../models/rss-feed.model';

interface SuggestedFeed {
  url: string;
  title: string;
  description: string;
  category: string;
  language: string;
  subscribers?: number;
  relevanceScore?: number;
}

@Component({
  selector: 'app-suggested-feeds',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suggested-feeds.html',
  styleUrl: './suggested-feeds.scss'
})
export class SuggestedFeedsComponent implements OnInit {
  suggestedFeeds: SuggestedFeed[] = [];
  filteredFeeds: SuggestedFeed[] = [];
  selectedCategory = 'all';
  categories: string[] = [];
  isLoading = true;
  searchQuery = '';
  userFeeds: RssFeed[] = [];

  constructor(private feedService: RssFeedService) {}

  ngOnInit(): void {
    this.feedService.feeds$.subscribe(feeds => {
      this.userFeeds = feeds;
      this.loadSuggestedFeeds();
    });
  }

  loadSuggestedFeeds(): void {
    this.isLoading = true;
    
    // Get categories from user's existing feeds to suggest similar ones
    const userCategories = this.getUserCategories();
    
    // Generate suggested feeds based on popular RSS feeds and user interests
    this.suggestedFeeds = this.generateSuggestedFeeds(userCategories);
    
    // Extract unique categories
    this.categories = ['all', ...new Set(this.suggestedFeeds.map(f => f.category))];
    
    this.filteredFeeds = this.suggestedFeeds;
    this.isLoading = false;
  }

  getUserCategories(): string[] {
    const categories = new Set<string>();
    this.userFeeds.forEach(feed => {
      if (feed.category) {
        categories.add(feed.category.toLowerCase());
      }
      // Extract keywords from feed titles
      const keywords = feed.title.toLowerCase().split(' ');
      keywords.forEach(keyword => {
        if (keyword.length > 4) {
          categories.add(keyword);
        }
      });
    });
    return Array.from(categories);
  }

  generateSuggestedFeeds(userInterests: string[]): SuggestedFeed[] {
    // Curated list of popular RSS feeds across different categories
    const popularFeeds: SuggestedFeed[] = [
      // Technology
      { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', description: 'Latest technology news and information on startups', category: 'Technology', language: 'en', subscribers: 1500000 },
      { url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', description: 'Technology, science, art, and culture', category: 'Technology', language: 'en', subscribers: 1200000 },
      { url: 'https://www.wired.com/feed/rss', title: 'WIRED', description: 'Technology news, reviews and opinion', category: 'Technology', language: 'en', subscribers: 1000000 },
      { url: 'https://arstechnica.com/feed/', title: 'Ars Technica', description: 'Technology news and analysis', category: 'Technology', language: 'en', subscribers: 800000 },
      { url: 'https://www.engadget.com/rss.xml', title: 'Engadget', description: 'Tech and gadget news', category: 'Technology', language: 'en', subscribers: 900000 },
      { url: 'https://www.cnet.com/rss/news/', title: 'CNET News', description: 'Tech news and reviews', category: 'Technology', language: 'en', subscribers: 850000 },
      { url: 'https://www.theguardian.com/technology/rss', title: 'The Guardian - Technology', description: 'Technology news from The Guardian', category: 'Technology', language: 'en', subscribers: 700000 },
      { url: 'https://www.zdnet.com/news/rss.xml', title: 'ZDNet', description: 'Business technology news', category: 'Technology', language: 'en', subscribers: 600000 },
      
      // Programming & Development
      { url: 'https://dev.to/feed', title: 'DEV Community', description: 'Community of software developers', category: 'Programming', language: 'en', subscribers: 500000 },
      { url: 'https://www.reddit.com/r/programming/.rss', title: 'Reddit - Programming', description: 'Programming discussions and news', category: 'Programming', language: 'en', subscribers: 2000000 },
      { url: 'https://news.ycombinator.com/rss', title: 'Hacker News', description: 'Tech and startup news', category: 'Programming', language: 'en', subscribers: 1500000 },
      { url: 'https://stackoverflow.blog/feed/', title: 'Stack Overflow Blog', description: 'Programming insights and tips', category: 'Programming', language: 'en', subscribers: 400000 },
      { url: 'https://github.blog/feed/', title: 'GitHub Blog', description: 'GitHub news and updates', category: 'Programming', language: 'en', subscribers: 600000 },
      { url: 'https://www.smashingmagazine.com/feed/', title: 'Smashing Magazine', description: 'Web design and development', category: 'Programming', language: 'en', subscribers: 350000 },
      { url: 'https://css-tricks.com/feed/', title: 'CSS-Tricks', description: 'Web development tips and tricks', category: 'Programming', language: 'en', subscribers: 300000 },
      { url: 'https://www.freecodecamp.org/news/rss/', title: 'freeCodeCamp', description: 'Programming tutorials and news', category: 'Programming', language: 'en', subscribers: 450000 },
      
      // News & Politics
      { url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/world/rss.xml', title: 'New York Times - World', description: 'World news from NYT', category: 'News', language: 'en', subscribers: 2000000 },
      { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', title: 'BBC News - World', description: 'International news from BBC', category: 'News', language: 'en', subscribers: 1800000 },
      { url: 'https://www.theguardian.com/world/rss', title: 'The Guardian - World', description: 'Global news and analysis', category: 'News', language: 'en', subscribers: 1500000 },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', title: 'Al Jazeera', description: 'International news', category: 'News', language: 'en', subscribers: 1200000 },
      { url: 'https://rss.cnn.com/rss/edition.rss', title: 'CNN International', description: 'World news', category: 'News', language: 'en', subscribers: 1600000 },
      { url: 'https://www.reuters.com/rssFeed/worldNews', title: 'Reuters - World News', description: 'Global news coverage', category: 'News', language: 'en', subscribers: 1400000 },
      
      // Science
      { url: 'https://www.scientificamerican.com/feed/', title: 'Scientific American', description: 'Science news and discoveries', category: 'Science', language: 'en', subscribers: 600000 },
      { url: 'https://www.newscientist.com/feed/home', title: 'New Scientist', description: 'Science and technology news', category: 'Science', language: 'en', subscribers: 550000 },
      { url: 'https://www.nature.com/nature.rss', title: 'Nature', description: 'Research and science news', category: 'Science', language: 'en', subscribers: 700000 },
      { url: 'https://www.sciencedaily.com/rss/all.xml', title: 'ScienceDaily', description: 'Latest science news', category: 'Science', language: 'en', subscribers: 500000 },
      { url: 'https://phys.org/rss-feed/', title: 'Phys.org', description: 'Science and technology news', category: 'Science', language: 'en', subscribers: 400000 },
      
      // Business & Finance
      { url: 'https://www.bloomberg.com/feed/podcast/Bloomberg-Business-Week.xml', title: 'Bloomberg', description: 'Business and financial news', category: 'Business', language: 'en', subscribers: 1000000 },
      { url: 'https://www.wsj.com/xml/rss/3_7085.xml', title: 'Wall Street Journal', description: 'Business news and analysis', category: 'Business', language: 'en', subscribers: 1200000 },
      { url: 'https://www.ft.com/?format=rss', title: 'Financial Times', description: 'Global business news', category: 'Business', language: 'en', subscribers: 900000 },
      { url: 'https://www.economist.com/rss', title: 'The Economist', description: 'International business and politics', category: 'Business', language: 'en', subscribers: 1100000 },
      { url: 'https://fortune.com/feed/', title: 'Fortune', description: 'Business news and analysis', category: 'Business', language: 'en', subscribers: 700000 },
      
      // Design
      { url: 'https://www.designboom.com/feed/', title: 'Designboom', description: 'Design, architecture, and art', category: 'Design', language: 'en', subscribers: 300000 },
      { url: 'https://www.behance.net/feeds/projects', title: 'Behance', description: 'Creative work showcase', category: 'Design', language: 'en', subscribers: 500000 },
      { url: 'https://www.creativebloq.com/feed', title: 'Creative Bloq', description: 'Art and design inspiration', category: 'Design', language: 'en', subscribers: 250000 },
      { url: 'https://www.awwwards.com/blog/feed/', title: 'Awwwards', description: 'Web design inspiration', category: 'Design', language: 'en', subscribers: 200000 },
      
      // Entertainment
      { url: 'https://variety.com/feed/', title: 'Variety', description: 'Entertainment news', category: 'Entertainment', language: 'en', subscribers: 800000 },
      { url: 'https://www.hollywoodreporter.com/feed/', title: 'Hollywood Reporter', description: 'Film and TV news', category: 'Entertainment', language: 'en', subscribers: 700000 },
      { url: 'https://deadline.com/feed/', title: 'Deadline', description: 'Entertainment industry news', category: 'Entertainment', language: 'en', subscribers: 650000 },
      { url: 'https://www.ign.com/feed.rss', title: 'IGN', description: 'Gaming and entertainment', category: 'Entertainment', language: 'en', subscribers: 900000 },
      
      // Sports
      { url: 'https://www.espn.com/espn/rss/news', title: 'ESPN', description: 'Sports news and scores', category: 'Sports', language: 'en', subscribers: 1500000 },
      { url: 'https://www.si.com/rss/si_topstories.rss', title: 'Sports Illustrated', description: 'Sports news and analysis', category: 'Sports', language: 'en', subscribers: 800000 },
      { url: 'https://www.bbc.co.uk/sport/rss.xml', title: 'BBC Sport', description: 'International sports coverage', category: 'Sports', language: 'en', subscribers: 1200000 },
      
      // Health & Lifestyle
      { url: 'https://www.health.com/rss', title: 'Health.com', description: 'Health and wellness news', category: 'Health', language: 'en', subscribers: 500000 },
      { url: 'https://www.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', title: 'WebMD', description: 'Medical news and information', category: 'Health', language: 'en', subscribers: 600000 },
      { url: 'https://www.medicaldaily.com/rss', title: 'Medical Daily', description: 'Health news and research', category: 'Health', language: 'en', subscribers: 400000 },
      { url: 'https://www.bonappetit.com/feed/rss', title: 'Bon Appétit', description: 'Food and cooking', category: 'Lifestyle', language: 'en', subscribers: 450000 },
      { url: 'https://www.foodnetwork.com/feeds/all-recipes-news-and-trending.rss', title: 'Food Network', description: 'Recipes and cooking tips', category: 'Lifestyle', language: 'en', subscribers: 700000 },
      
      // Travel
      { url: 'https://www.lonelyplanet.com/feeds/all/all', title: 'Lonely Planet', description: 'Travel guides and tips', category: 'Travel', language: 'en', subscribers: 500000 },
      { url: 'https://www.nationalgeographic.com/feeds/destinations/all', title: 'National Geographic Travel', description: 'Travel stories and photography', category: 'Travel', language: 'en', subscribers: 600000 },
      { url: 'https://www.travelandleisure.com/rss', title: 'Travel + Leisure', description: 'Travel inspiration', category: 'Travel', language: 'en', subscribers: 400000 },
      
      // Education
      { url: 'https://www.edutopia.org/rss.xml', title: 'Edutopia', description: 'Education news and resources', category: 'Education', language: 'en', subscribers: 200000 },
      { url: 'https://www.chronicle.com/section/news/6/rss', title: 'Chronicle of Higher Education', description: 'Higher education news', category: 'Education', language: 'en', subscribers: 250000 },
      { url: 'https://www.insidehighered.com/rss/feed', title: 'Inside Higher Ed', description: 'Higher education news', category: 'Education', language: 'en', subscribers: 180000 },
      
      // Environment
      { url: 'https://www.treehugger.com/feeds/rss', title: 'TreeHugger', description: 'Sustainability and environment', category: 'Environment', language: 'en', subscribers: 300000 },
      { url: 'https://www.ecowatch.com/feed', title: 'EcoWatch', description: 'Environmental news', category: 'Environment', language: 'en', subscribers: 250000 },
      { url: 'https://grist.org/feed/', title: 'Grist', description: 'Environmental journalism', category: 'Environment', language: 'en', subscribers: 200000 },
      
      // Gaming
      { url: 'https://www.polygon.com/rss/index.xml', title: 'Polygon', description: 'Gaming news and culture', category: 'Gaming', language: 'en', subscribers: 700000 },
      { url: 'https://www.gamespot.com/feeds/mashup/', title: 'GameSpot', description: 'Video game news and reviews', category: 'Gaming', language: 'en', subscribers: 800000 },
      { url: 'https://www.pcgamer.com/rss/', title: 'PC Gamer', description: 'PC gaming news', category: 'Gaming', language: 'en', subscribers: 600000 },
      { url: 'https://www.eurogamer.net/?format=rss', title: 'Eurogamer', description: 'Gaming news and reviews', category: 'Gaming', language: 'en', subscribers: 500000 },
      
      // Photography
      { url: 'https://petapixel.com/feed/', title: 'PetaPixel', description: 'Photography news and tutorials', category: 'Photography', language: 'en', subscribers: 300000 },
      { url: 'https://digital-photography-school.com/feed/', title: 'Digital Photography School', description: 'Photography tips and tutorials', category: 'Photography', language: 'en', subscribers: 400000 },
      { url: 'https://www.dpreview.com/feeds/news.xml', title: 'DPReview', description: 'Camera and photography news', category: 'Photography', language: 'en', subscribers: 350000 },
      
      // Music
      { url: 'https://pitchfork.com/rss/news/', title: 'Pitchfork', description: 'Music news and reviews', category: 'Music', language: 'en', subscribers: 600000 },
      { url: 'https://www.rollingstone.com/feed/', title: 'Rolling Stone', description: 'Music and culture', category: 'Music', language: 'en', subscribers: 800000 },
      { url: 'https://consequenceofsound.net/feed/', title: 'Consequence', description: 'Music news and reviews', category: 'Music', language: 'en', subscribers: 400000 },
      
      // Space & Astronomy
      { url: 'https://www.space.com/feeds/all', title: 'Space.com', description: 'Space and astronomy news', category: 'Space', language: 'en', subscribers: 500000 },
      { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', title: 'NASA Breaking News', description: 'Latest news from NASA', category: 'Space', language: 'en', subscribers: 700000 },
      { url: 'https://www.universetoday.com/feed/', title: 'Universe Today', description: 'Space and astronomy news', category: 'Space', language: 'en', subscribers: 300000 },
      
      // Cryptocurrency
      { url: 'https://cointelegraph.com/rss', title: 'Cointelegraph', description: 'Cryptocurrency news', category: 'Cryptocurrency', language: 'en', subscribers: 400000 },
      { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', title: 'CoinDesk', description: 'Bitcoin and blockchain news', category: 'Cryptocurrency', language: 'en', subscribers: 500000 },
      { url: 'https://cryptonews.com/news/feed/', title: 'Cryptonews', description: 'Crypto news and analysis', category: 'Cryptocurrency', language: 'en', subscribers: 300000 },
      
      // AI & Machine Learning
      { url: 'https://www.artificialintelligence-news.com/feed/', title: 'AI News', description: 'Artificial intelligence news', category: 'AI', language: 'en', subscribers: 250000 },
      { url: 'https://machinelearningmastery.com/feed/', title: 'Machine Learning Mastery', description: 'ML tutorials and guides', category: 'AI', language: 'en', subscribers: 200000 },
      { url: 'https://www.reddit.com/r/MachineLearning/.rss', title: 'Reddit - Machine Learning', description: 'ML discussions and research', category: 'AI', language: 'en', subscribers: 800000 },
    ];

    // Calculate relevance scores based on user interests
    const feedsWithScores = popularFeeds.map(feed => {
      let score = 0;
      const feedKeywords = [...feed.title.toLowerCase().split(' '), ...feed.category.toLowerCase().split(' ')];
      
      userInterests.forEach(interest => {
        feedKeywords.forEach(keyword => {
          if (keyword.includes(interest) || interest.includes(keyword)) {
            score += 10;
          }
        });
      });
      
      // Add randomness to discover new topics
      score += Math.random() * 5;
      
      return { ...feed, relevanceScore: score };
    });

    // Sort by relevance score (descending) and return top 100
    return feedsWithScores
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 100);
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredFeeds = this.suggestedFeeds;
    } else {
      this.filteredFeeds = this.suggestedFeeds.filter(f => f.category === category);
    }
  }

  searchFeeds(query: string): void {
    this.searchQuery = query.toLowerCase();
    if (!query) {
      this.filterByCategory(this.selectedCategory);
      return;
    }
    
    this.filteredFeeds = this.suggestedFeeds.filter(feed =>
      feed.title.toLowerCase().includes(this.searchQuery) ||
      feed.description.toLowerCase().includes(this.searchQuery) ||
      feed.category.toLowerCase().includes(this.searchQuery)
    );
  }

  addFeed(feed: SuggestedFeed): void {
    this.feedService.addFeed(feed.url, feed.title, feed.category).subscribe({
      next: (success) => {
        if (success) {
          alert(`Added "${feed.title}" successfully!`);
          // Remove from suggested list
          this.suggestedFeeds = this.suggestedFeeds.filter(f => f.url !== feed.url);
          this.filterByCategory(this.selectedCategory);
        } else {
          alert('Failed to add feed. It might already exist or the URL is invalid.');
        }
      },
      error: () => {
        alert('Error adding feed.');
      }
    });
  }

  formatSubscribers(count?: number): string {
    if (!count) return '';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M subscribers`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K subscribers`;
    }
    return `${count} subscribers`;
  }
}
