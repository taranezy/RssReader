import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: 'img[appImageCache]',
  standalone: true
})
export class ImageCacheDirective implements OnInit {
  @Input() appImageCache: string = '';

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if (!this.appImageCache) {
      return;
    }

    /**
     * SIMPLIFIED: Just use the imageUrl from cached RssItem
     * 
     * No separate URL caching needed because:
     * - imageUrl is already in cached RssItem data (localStorage)
     * - Browser HTTP cache handles image binary data efficiently
     * - No duplication of cache storage
     * 
     * Flow:
     * 1. Feed items cached in localStorage with imageUrl field
     * 2. This directive receives imageUrl from cached item
     * 3. Set it directly on img element
     * 4. Browser HTTP cache loads efficiently
     * 5. Done!
     */
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.appImageCache);
  }
}
