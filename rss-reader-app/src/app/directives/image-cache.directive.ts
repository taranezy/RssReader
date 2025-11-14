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

    // Set original URL immediately - don't wait for cache
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.appImageCache);
  }

  @HostListener('load')
  onImageLoad(): void {
    // Image loaded successfully - try to cache it in background (non-blocking)
    if (this.appImageCache) {
      this.imageCacheService.cacheImageInBackground(this.appImageCache);
    }
  }
}
