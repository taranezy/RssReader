import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { IRssFeedFetcher } from '../interfaces/rss-parser.interface';
import { environment } from '../../environments/environment';

// Single Responsibility Principle - only handles HTTP fetching
@Injectable({
  providedIn: 'root'
})
export class RssFeedFetcherService implements IRssFeedFetcher {
  
  // Using our backend CORS proxy instead of external service
  private corsProxyUrl = `${environment.apiUrl}/proxy/fetch-feed?url=`;
  private webToFeedProxyUrl = `${environment.apiUrl}/proxy/feed?url=`;
  private testFeedUrl = `${environment.apiUrl}/proxy/test?url=`;
  
  constructor(private http: HttpClient) {}

  fetchFeed(url: string): Observable<string> {
    // First, test if URL is a standard feed or needs conversion
    return this.testFeedUrl$(url).pipe(
      switchMap(testResult => {
        if (testResult.isStandardFeed) {
          // Use original proxy for standard RSS/Atom feeds
          return this.fetchStandardFeed(url);
        } else {
          // Use web-to-feed proxy for HTML pages
          console.log(`Converting non-RSS URL to feed: ${url}`);
          return this.fetchConvertedFeed(url);
        }
      }),
      catchError(error => {
        console.error('Error in feed detection, trying standard fetch:', error);
        // Fallback to standard fetch if test fails
        return this.fetchStandardFeed(url);
      })
    );
  }

  /**
   * Test if URL is a standard feed or needs HTML conversion
   */
  private testFeedUrl$(url: string): Observable<any> {
    const encodedUrl = encodeURIComponent(url);
    const testUrl = `${this.testFeedUrl}${encodedUrl}`;
    
    return this.http.get<any>(testUrl, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error testing feed URL:', error);
        // Default to standard feed on error
        return of({ isStandardFeed: true });
      })
    );
  }

  /**
   * Fetch standard RSS/Atom feed
   */
  private fetchStandardFeed(url: string): Observable<string> {
    const encodedUrl = encodeURIComponent(url);
    const proxyUrl = `${this.corsProxyUrl}${encodedUrl}`;
    
    return this.http.get(proxyUrl, {
      responseType: 'text',
      withCredentials: true,
      headers: new HttpHeaders({
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
      })
    }).pipe(
      catchError(error => {
        console.error('Error fetching standard RSS feed:', error);
        return of('');
      })
    );
  }

  /**
   * Fetch converted feed (HTML to RSS conversion)
   */
  private fetchConvertedFeed(url: string): Observable<string> {
    const encodedUrl = encodeURIComponent(url);
    const proxyUrl = `${this.webToFeedProxyUrl}${encodedUrl}&format=rss`;
    
    return this.http.get(proxyUrl, {
      responseType: 'text',
      withCredentials: true,
      headers: new HttpHeaders({
        'Accept': 'application/rss+xml'
      })
    }).pipe(
      catchError(error => {
        console.error('Error fetching converted feed:', error);
        return of('');
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
