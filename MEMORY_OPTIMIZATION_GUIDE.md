# Memory Optimization Guide - RSS Reader

## Problem: Browser Memory Usage > 5GB

### Root Causes Identified

1. **Unsubscribed Observables** - Memory leaks from subscriptions never cleaned up
2. **Nested Subscriptions** - Multiple overlapping subscriptions in components
3. **Unreleased Blob URLs** - Image cache service creates blob URLs but never revokes them
4. **Retained DOM Elements** - Articles kept in memory after viewing
5. **Large Data Sets** - All items (potentially thousands) kept in memory

### Solution Implementation

#### Phase 1: Fix Component Subscriptions ✅ (In Progress)

**Pattern to apply to all components:**

```typescript
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export class YourComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.service.data$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.data = data;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Components affected:**
- [x] grid-view.ts - Fixed with combineLatest + takeUntil
- [ ] list-view.ts - Needs fixing (502 lines, complex)
- [ ] header.ts - Multiple subscriptions (6+ places)
- [ ] feed-manager.ts - Complex subscription patterns
- [ ] news-look.ts - Multiple subscriptions
- [ ] suggested-feeds.ts - Multiple subscriptions
- [ ] login.component.ts - Auth subscriptions
- [ ] app.ts - Bootstrap subscriptions

#### Phase 2: Fix Image Cache Blob URLs

**Issue:** `getCachedImageUrl()` creates blob URLs via `URL.createObjectURL()` but never revokes them

**Fix:** Add cleanup and limit blob URLs in memory

```typescript
private blobUrlCache = new Map<string, string>();

getCachedImageUrl(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    // Check if already have blob URL
    if (this.blobUrlCache.has(imageUrl)) {
      resolve(this.blobUrlCache.get(imageUrl) || null);
      return;
    }

    this.getFromCache(imageUrl).then(blob => {
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        this.blobUrlCache.set(imageUrl, blobUrl);
        
        // Limit cache size - revoke oldest if too many
        if (this.blobUrlCache.size > 100) {
          const firstKey = this.blobUrlCache.keys().next().value;
          const oldUrl = this.blobUrlCache.get(firstKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          this.blobUrlCache.delete(firstKey);
        }
        
        resolve(blobUrl);
      } else {
        resolve(null);
      }
    });
  });
}

// Add cleanup on destroy/logout
clearBlobUrlCache(): void {
  this.blobUrlCache.forEach(url => URL.revokeObjectURL(url));
  this.blobUrlCache.clear();
}
```

#### Phase 3: Limit Items in Memory

**Current:** All items loaded and kept in memory
**Fix:** Virtual scrolling + pagination

```typescript
// Virtual scroll only renders visible items (50-100 at a time)
// Limit to last 1000 items per feed instead of all
```

#### Phase 4: Clean Up After Navigation

**Add to app.ts:**
```typescript
ngOnDestroy(): void {
  this.imageCacheService.clearBlobUrlCache();
  // Other cleanup
}
```

#### Phase 5: Service Cleanup

**RssFeedService improvements:**
- Limit stored items to last 1000
- Auto-cleanup old cached items
- Use shareReplay(1) for hot observables (prevent duplicate subscriptions)

**ImageCacheService improvements:**
- Limit IndexedDB size to 50MB (enforced)
- Auto-cleanup expired images (>7 days)
- Limit concurrent blob URLs to 100

### Implementation Priority

**Critical (Do First):**
1. Fix all component subscriptions with takeUntil
2. Add blob URL revocation in ImageCacheService
3. Test memory usage

**Important (Do Next):**
4. Add virtual scrolling to list-view
5. Implement item pagination
6. Add periodic cache cleanup

**Nice to Have:**
7. Add memory monitoring UI
8. Implement offline service worker cleanup
9. Add memory usage warnings

### Testing Strategy

1. **Before & After:**
   - Open Chrome DevTools → Memory tab
   - Take heap snapshot
   - Navigate around app for 5 minutes
   - Take another snapshot
   - Compare sizes

2. **Watch for:**
   - Blob URL count (should stay <100)
   - Component subscriptions (should be 0 after navigation)
   - DOM nodes (should stay reasonable)

3. **Commands:**
   ```
   // In Chrome DevTools Console:
   // Check blob URLs
   window.URL.revokeObjectURL.toString().match(/\d+/)[0]
   
   // Monitor memory
   performance.memory.usedJSHeapSize / 1048576 // in MB
   ```

### Affected Files Summary

**Phase 1 Components (Subscriptions):**
- grid-view.ts ✅
- list-view.ts (502 lines)
- header.ts (400+ lines)
- feed-manager.ts (300+ lines)
- news-look.ts (100+ lines)
- suggested-feeds.ts (250+ lines)
- login.component.ts (900+ lines)
- app.ts (200+ lines)

**Phase 2 Services (Memory Management):**
- image-cache.service.ts (blob URLs)
- rss-feed.service.ts (data retention)
- local-cache.service.ts (verify cleanup)

### Expected Improvements

- **Before:** 5+ GB after 5 minutes of use
- **After:** 500-800 MB after 5 minutes of use
- **Improvement:** ~85% memory reduction
