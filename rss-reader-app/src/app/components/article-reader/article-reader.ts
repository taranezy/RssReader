import { Component, Input, Output, EventEmitter, OnInit, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RssItem } from '../../models/rss-feed.model';
import { RssFeedService } from '../../services/rss-feed.service';

@Component({
  selector: 'app-article-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-reader.html',
  styleUrl: './article-reader.scss'
})
export class ArticleReaderComponent implements OnInit {
  @Input() article: RssItem | null = null;
  @Output() closeReader = new EventEmitter<void>();
  
  sanitizedContent: SafeHtml = '';

  constructor(
    private sanitizer: DomSanitizer,
    private feedService: RssFeedService
  ) {}

  ngOnInit(): void {
    if (this.article) {
      this.sanitizeContent();
      // Mark as read when opened
      if (!this.article.isRead) {
        this.markAsRead();
      }
    }
  }

  sanitizeContent(): void {
    if (this.article && this.article.content) {
      this.sanitizedContent = this.sanitizer.sanitize(SecurityContext.HTML, this.article.content) || '';
    }
  }

  markAsRead(): void {
    if (this.article) {
      this.feedService.markAsRead(this.article.id);
    }
  }

  openOriginal(): void {
    if (this.article) {
      window.open(this.article.link, '_blank', 'noopener,noreferrer');
    }
  }

  close(): void {
    this.closeReader.emit();
  }

  getFormattedDate(): string {
    if (!this.article) return '';
    const date = new Date(this.article.pubDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
