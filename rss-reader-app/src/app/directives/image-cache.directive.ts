import { Directive, ElementRef, Input, OnInit, Renderer2, HostListener } from '@angular/core';
import { ImageCacheService } from '../services/image-cache.service';

@Directive({
  selector: 'img[appImageCache]',
  standalone: true
})
export class ImageCacheDirective implements OnInit {
  @Input() appImageCache: string = '';

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private imageCacheService: ImageCacheService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if (!this.appImageCache) {
      return;
    }

    // Try to get cached blob URL first (instant if available)
    this.imageCacheService.getCachedImageUrl(this.appImageCache).then(cachedUrl => {
      if (cachedUrl) {
        // Use cached blob URL (instant)
        this.renderer.setAttribute(this.el.nativeElement, 'src', cachedUrl);
      } else {
        // Not in cache - use original URL
        // Browser HTTP cache will handle it efficiently
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.appImageCache);
      }
    }).catch(() => {
      // Fallback to original URL on error
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.appImageCache);
    });
  }

  @HostListener('load')
  onImageLoad(): void {
    // Image loaded successfully - convert to blob URL and cache the URL
    if (this.appImageCache && this.el.nativeElement.src && !this.el.nativeElement.src.startsWith('blob:')) {
      // Only cache if loaded from network (not from blob URL already)
      this.convertAndCacheImageUrl();
    }
  }

  /**
   * Convert loaded image to blob URL and cache the URL
   */
  private convertAndCacheImageUrl(): void {
    try {
      const imgElement = this.el.nativeElement;
      
      // Create canvas from the loaded image
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      ctx.drawImage(imgElement, 0, 0);
      
      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          // Cache only the blob URL (not the binary)
          this.imageCacheService.cacheImageUrl(this.appImageCache, blobUrl);
          // Update img src to use blob URL for next load
          this.renderer.setAttribute(imgElement, 'src', blobUrl);
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.warn('[ImageCacheDirective] Failed to cache image:', error);
    }
  }
}
