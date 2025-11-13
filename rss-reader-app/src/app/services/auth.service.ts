import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check auth status immediately on service creation
    this.checkAuthStatus().subscribe();
  }

  /**
   * Check if user is authenticated by fetching user data from backend
   */
  checkAuthStatus(): Observable<User | null> {
    return this.http.get<any>(`${this.apiUrl}/auth/user`, { withCredentials: true })
      .pipe(
        tap(response => {
          // Extract user from wrapped response {success, data}
          const user = response?.data || response;
          this.currentUserSubject.next(user);
        }),
        catchError((error) => {
          // Silently handle not authenticated - don't log errors
          this.currentUserSubject.next(null);
          return of(null);
        })
      );
  }

  /**
   * Extract data from wrapped response (backwards compatible)
   * @private
   */
  private extractData<T>(response: any): T {
    return response?.data !== undefined ? response.data : response;
  }

  /**
   * Get current user
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user !== null)
    );
  }

  /**
   * Set authenticated user from native Android app
   * Called when user logs in via native Google Sign-In and token is injected
   * @param email User email address from native app
   * @param idToken Google ID token from native app
   * @returns Observable that completes when session is established
   */
  setNativeAppAuthenticated(email: string, idToken: string): Observable<any> {
    
    // Store credentials from native app (only in browser)
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('streamlet_email', email);
        localStorage.setItem('streamlet_id_token', idToken);
        localStorage.setItem('streamlet_authenticated', 'true');
      }
    } catch (e) {
      console.warn('[AuthService] Failed to set localStorage:', e);
    }

    // Send token to backend to establish session
    return this.http.post(`${this.apiUrl}/auth/native-app`, 
      { email, idToken }, 
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        
        // Extract user from wrapped response {success, data}
        const user = response?.data || response?.user || response;
        if (user) {
          this.currentUserSubject.next(user);
        }
      }),
      catchError((error) => {
        console.error('[AuthService] Failed to establish session:', error);
        
        // Fallback: set user locally even if backend call fails
        this.currentUserSubject.next({
          id: 0,
          email: email,
          username: email.split('@')[0]
        });
        
        return of(null);
      })
    );
  }

  /**
   * Initiate Google OAuth login (redirects to backend)
   */
  loginWithGoogle(): void {
    // Use relative URL - proxy will route /api to backend:3000
    // Backend will redirect back using relative path
    window.location.href = '/api/auth/google';
  }

  /**
   * Login as demo user (read-only mode with pre-populated feeds)
   */
  loginAsDemo(): void {
    // Use relative URL - proxy will route /api to backend:3000
    // Backend will redirect back using relative path
    window.location.href = '/api/auth/demo';
    window.location.href = '/api/auth/demo';
  }

  /**
   * Logout current user
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        map(response => this.extractData<any>(response)),
        tap(() => {
          this.currentUserSubject.next(null);
        })
      );
  }

  /**
   * Get user value synchronously
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
