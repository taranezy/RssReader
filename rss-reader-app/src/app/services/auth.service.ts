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
    this.checkAuthStatus().subscribe();
  }

  /**
   * Check if user is authenticated by fetching user data from backend
   */
  checkAuthStatus(): Observable<User | null> {
    console.log('Checking auth status...');
    return this.http.get<User>(`${this.apiUrl}/auth/user`, { withCredentials: true })
      .pipe(
        tap(user => {
          console.log('User authenticated:', user);
          this.currentUserSubject.next(user);
        }),
        catchError((error) => {
          console.log('Not authenticated:', error.status);
          this.currentUserSubject.next(null);
          return of(null);
        })
      );
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
   */
  setNativeAppAuthenticated(email: string, idToken: string): void {
    console.log('[AuthService] Setting native app authentication:', email);
    
    // Store credentials from native app
    localStorage.setItem('streamlet_email', email);
    localStorage.setItem('streamlet_id_token', idToken);
    localStorage.setItem('streamlet_authenticated', 'true');

    // Update current user (will be verified with backend on next checkAuthStatus)
    this.currentUserSubject.next({
      id: 0,
      email: email,
      username: email.split('@')[0]
    });

    // Verify auth status with backend
    this.checkAuthStatus().subscribe();
  }

  /**
   * Initiate Google OAuth login (redirects to backend)
   */
  loginWithGoogle(): void {
    // Use current origin to support both development and production
    const origin = window.location.origin;
    window.location.href = `${origin}${this.apiUrl}/auth/google`;
  }

  /**
   * Login as demo user (read-only mode with pre-populated feeds)
   */
  loginAsDemo(): void {
    const origin = window.location.origin;
    window.location.href = `${origin}${this.apiUrl}/auth/demo`;
  }

  /**
   * Logout current user
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
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
