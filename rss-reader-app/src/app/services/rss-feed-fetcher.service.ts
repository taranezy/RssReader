import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { IRssFeedFetcher } from '../interfaces/rss-parser.interface';

// Single Responsibility Principle - only handles HTTP fetching
@Injectable({
  providedIn: 'root'
})
export class RssFeedFetcherService implements IRssFeedFetcher {
  
  // Using a CORS proxy to fetch RSS feeds (you can change this to your own proxy)
  private corsProxyUrl = 'https://api.allorigins.win/raw?url=';
  
  constructor(private http: HttpClient) {}

  fetchFeed(url: string): Observable<string> {
    const encodedUrl = encodeURIComponent(url);
    const proxyUrl = `${this.corsProxyUrl}${encodedUrl}`;
    
    return this.http.get(proxyUrl, {
      responseType: 'text',
      headers: new HttpHeaders({
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
      })
    }).pipe(
      catchError(error => {
        console.error('Error fetching RSS feed:', error);
        return of(''); // Return empty string on error
      })
    );
  }

  // Alternative method without CORS proxy (will fail for most external URLs due to CORS)
  fetchFeedDirect(url: string): Observable<string> {
    return this.http.get(url, {
      responseType: 'text'
    }).pipe(
      catchError(error => {
        console.error('Error fetching RSS feed:', error);
        return of('');
      })
    );
  }
}
