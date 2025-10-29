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
   * Initiate Google OAuth login (redirects to backend)
   */
  loginWithGoogle(): void {
    // Redirect to backend OAuth endpoint (use absolute URL for redirect)
    window.location.href = `http://localhost:3000${this.apiUrl}/auth/google`;
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
