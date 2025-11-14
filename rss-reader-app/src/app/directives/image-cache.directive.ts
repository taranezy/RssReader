import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
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

    // Try to get cached image
    this.imageCacheService.getCachedImageUrl(this.appImageCache).subscribe(
      (cachedUrl: string) => {
        if (cachedUrl) {
          this.renderer.setAttribute(this.el.nativeElement, 'src', cachedUrl);
        }
      },
      (error) => {
        console.warn('[ImageCacheDirective] Error loading cached image:', error);
        // Fallback to original URL
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.appImageCache);
      }
    );
  }
}
