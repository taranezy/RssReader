import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SafeResourceUrl } from '@angular/platform-browser';
import { RssItem } from '../models/rss-feed.model';

export interface PipState {
  isActive: boolean;
  article: RssItem | null;
  url: SafeResourceUrl | null;
  container: 'A' | 'B' | null;
}

@Injectable({
  providedIn: 'root'
})
export class PipStateService {
  private pipStateSubject = new BehaviorSubject<PipState>({
    isActive: false,
    article: null,
    url: null,
    container: null
  });

  pipState$: Observable<PipState> = this.pipStateSubject.asObservable();

  constructor() {}

  getPipState(): PipState {
    return this.pipStateSubject.value;
  }

  setPipState(state: PipState): void {
    this.pipStateSubject.next(state);
  }

  openPip(article: RssItem | null, url: SafeResourceUrl | null, container: 'A' | 'B'): void {
    this.pipStateSubject.next({
      isActive: true,
      article,
      url,
      container
    });
  }

  closePip(): void {
    this.pipStateSubject.next({
      isActive: false,
      article: null,
      url: null,
      container: null
    });
  }
}
