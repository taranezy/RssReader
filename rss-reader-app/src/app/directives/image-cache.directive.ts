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

    // Try to load from cache first
    this.imageCacheService.getCachedImageUrl(this.appImageCache).then(cachedUrl => {
      if (cachedUrl) {
        // Use cached blob URL
        this.renderer.setAttribute(this.el.nativeElement, 'src', cachedUrl);
      } else {
        // Use original URL - will be cached on load
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.appImageCache);
      }
    }).catch(() => {
      // Fallback to original URL on error
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.appImageCache);
    });
  }

  @HostListener('load')
  onImageLoad(): void {
    // Image loaded successfully - cache the loaded image (not re-fetch)
    if (this.appImageCache && this.el.nativeElement.src) {
      this.imageCacheService.cacheLoadedImage(this.appImageCache, this.el.nativeElement);
    }
  }
}
