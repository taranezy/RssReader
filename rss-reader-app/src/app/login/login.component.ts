import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Loading state for native app auth -->
    <div class="native-auth-loading" *ngIf="isNativeAppAuth">
      <div class="loader">
        <div class="spinner"></div>
        <h2>Authenticating with native app...</h2>
        <p>Please wait while we verify your credentials</p>
      </div>
    </div>

    <!-- Normal login form -->
    <div class="login-container" *ngIf="!isNativeAppAuth">
      <div class="login-card">
        <div class="login-header">
          <h1>RSS Reader</h1>
          <p>Sign in to access your personalized RSS feeds</p>
        </div>

        <!-- Error message -->
        <div class="error-message" *ngIf="errorMessage">
          <strong>⚠️ Authentication Error</strong>
          <p>{{ errorMessage }}</p>
        </div>

        <div class="login-body">
          <button class="google-login-btn" (click)="loginWithGoogle()" [disabled]="isGoogleDisabled">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{{ isGoogleDisabled ? 'Google Login Not Available' : 'Sign in with Google' }}</span>
          </button>

          <div class="divider">
            <span>or</span>
          </div>

          <button class="demo-btn" (click)="loginAsDemo()">
            <span></span>
            <span>Try Demo (100 feeds, read-only)</span>
          </button>
        </div>

        <div class="login-footer">
          <p>Your feeds are private and only accessible to you</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 450px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }

    .login-header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      color: #333;
      font-weight: 600;
    }

    .login-header p {
      margin: 0 0 30px 0;
      color: #666;
      font-size: 16px;
    }

    .error-message {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 6px;
      padding: 12px 16px;
      margin: 0 0 20px 0;
      text-align: left;
      font-size: 14px;
      color: #c33;
    }

    .error-message strong {
      display: block;
      margin-bottom: 4px;
    }

    .error-message p {
      margin: 0;
    }

    .login-body {
      margin: 30px 0;
    }

    .google-login-btn:disabled,
    .google-login-btn[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f5f5f5;
    }

    .google-login-btn:disabled:hover,
    .google-login-btn[disabled]:hover {
      background: #f5f5f5;
      box-shadow: none;
    }

    .google-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 14px 24px;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      color: #3c4043;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .google-login-btn:hover {
      background: #f8f9fa;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .google-login-btn:active {
      background: #f1f3f4;
    }

    .google-icon {
      width: 24px;
      height: 24px;
    }

    .divider {
      margin: 20px 0;
      position: relative;
      text-align: center;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e0e0e0;
    }

    .divider span {
      position: relative;
      background: white;
      padding: 0 15px;
      color: #999;
      font-size: 14px;
    }

    .demo-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 14px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .demo-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .demo-btn:active {
      transform: translateY(0);
    }

    .login-footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .login-footer p {
      margin: 0;
      font-size: 14px;
      color: #999;
    }

    /* Native App Auth Loading Styles */
    .native-auth-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .loader {
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 400px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 20px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loader h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 24px;
    }

    .loader p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
  `]
})
export class LoginComponent implements OnInit {
  isNativeAppAuth = false;
  isGoogleDisabled = false;
  errorMessage = '';
  private authCheckInProgress = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for error messages from query parameters
    this.route.queryParams.subscribe(params => {
      const error = params['error'];
      if (error) {
        this.handleAuthError(error);
      }
    });

    // Check if user is coming from Android native app with token
    // Only run in browser, not during SSR
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Immediate check
      this.checkNativeAppAuth();
      
      // Delayed check for Android WebView which might inject values after page load
      setTimeout(() => {
        this.checkNativeAppAuth();
      }, 100);
      
      // Another check after a bit more delay
      setTimeout(() => {
        this.checkNativeAppAuth();
      }, 500);
      
      // Listen for storage events from Android WebView
      window.addEventListener('storage', () => {
        this.checkNativeAppAuth();
      });
      
      // Listen for custom event from Android app
      window.addEventListener('androidAuthReady', () => {
        this.checkNativeAppAuth();
      });
      
      // Listen for the actual event name that Android app sends
      window.addEventListener('streamletNativeLogin', (event: any) => {
        this.checkNativeAppAuth();
      });
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(errorCode: string): void {
    const errorMessages: Record<string, string> = {
      'auth_failed': 'Google authentication was cancelled or failed. Please try again.',
      'auth_error': 'An error occurred during authentication. Please try again.',
      'google_auth_failed': 'Google authentication failed. Please try again or use the demo login.',
      'oauth_not_configured': 'Google OAuth is not configured on this server. Please use the demo login or contact the administrator.',
      'OAUTH_NOT_CONFIGURED': 'Google OAuth is not configured. Please use the demo login.'
    };

    this.errorMessage = errorMessages[errorCode] || 'An authentication error occurred. Please try again.';

    // Disable Google login if OAuth is not configured
    if (errorCode === 'oauth_not_configured' || errorCode === 'OAUTH_NOT_CONFIGURED') {
      this.isGoogleDisabled = true;
    }

    // Clear error message after 10 seconds
    setTimeout(() => {
      this.errorMessage = '';
    }, 10000);
  }

  /**
   * Check if authenticated via native Android app
   * Android app injects token into localStorage if user logged in via native Google Sign-In
   */
  private checkNativeAppAuth(): void {
    // Prevent duplicate processing
    if (this.authCheckInProgress || this.isNativeAppAuth) {
      return;
    }
    
    // Check all signals that indicate native app authentication
    const skipLogin = localStorage.getItem('streamlet_skip_login') === 'true';
    const idToken = localStorage.getItem('streamlet_id_token');
    const email = localStorage.getItem('streamlet_email');
    const isNativeApp = localStorage.getItem('streamlet_native_app') === 'true';

    // If all required data is present, user is authenticated via native app
    if (skipLogin && idToken && email && isNativeApp) {
      this.authCheckInProgress = true;
      this.isNativeAppAuth = true;

      // Set auth state in service and wait for session to be established
      this.authService.setNativeAppAuthenticated(email, idToken).subscribe({
        next: (response) => {
          // Navigate after session is confirmed
          setTimeout(() => {
            this.router.navigate(['/list']);
          }, 500);
        },
        error: (error) => {
          console.error('[LoginComponent] Session establishment failed:', error);
          // Still navigate even if it fails (fallback behavior)
          setTimeout(() => {
            this.router.navigate(['/list']);
          }, 500);
        }
      });
    }
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  loginAsDemo(): void {
    this.authService.loginAsDemo();
  }
}
