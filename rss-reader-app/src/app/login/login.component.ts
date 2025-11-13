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
      <!-- Background decoration -->
      <div class="background-decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
        
        <!-- News/RSS themed decorative elements -->
        <div class="news-icon icon-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" stroke-width="2"/>
          </svg>
        </div>
        <div class="news-icon icon-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke-width="2"/>
          </svg>
        </div>
        <div class="news-icon icon-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-width="2"/>
          </svg>
        </div>
        <div class="news-icon icon-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke-width="2"/>
          </svg>
        </div>
        <div class="news-icon icon-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/>
          </svg>
        </div>
      </div>

      <div class="login-card">
        <!-- App Icon/Logo -->
        <div class="app-icon">
          <svg viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="16" fill="url(#gradient)"/>
            <path d="M20 24h24M20 32h24M20 40h16" stroke="white" stroke-width="3" stroke-linecap="round"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0%" stop-color="#667eea"/>
                <stop offset="100%" stop-color="#764ba2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div class="login-header">
          <h1>Welcome to Strimlet - RSS News Reader</h1>
          <p>Stay updated with your favorite content in one place</p>
        </div>

        <!-- Error message -->
        <div class="error-message" *ngIf="errorMessage">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div>
            <strong>Authentication Error</strong>
            <p>{{ errorMessage }}</p>
          </div>
        </div>

        <div class="login-body">
          <button class="google-login-btn" (click)="loginWithGoogle()" [disabled]="isGoogleDisabled">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{{ isGoogleDisabled ? 'Google Login Not Available' : 'Continue with Google' }}</span>
          </button>

          <div class="divider">
            <span>or</span>
          </div>

          <button class="demo-btn" (click)="loginAsDemo()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-width="2"/>
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-width="2"/>
            </svg>
            <span>Try Demo Mode</span>
          </button>

          <!-- Feature highlights -->
          <div class="features">
            <div class="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Ad-free reading</span>
            </div>
            <div class="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Private & secure</span>
            </div>
            <div class="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Beautiful interface</span>
            </div>
          </div>
        </div>

        <div class="login-footer">
          <p>Your data stays private. We never share your information.</p>
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
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .background-decoration {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 20s infinite ease-in-out;
    }

    .circle-1 {
      width: 300px;
      height: 300px;
      top: -150px;
      left: -150px;
      animation-delay: 0s;
    }

    .circle-2 {
      width: 200px;
      height: 200px;
      bottom: -100px;
      right: -100px;
      animation-delay: 7s;
    }

    .circle-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      right: 10%;
      animation-delay: 14s;
    }

    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(30px, -50px) scale(1.1);
      }
      66% {
        transform: translate(-20px, 20px) scale(0.9);
      }
    }

    /* News/RSS themed decorative icons */
    .news-icon {
      position: absolute;
      width: 80px;
      height: 80px;
      opacity: 0.08;
      color: white;
      animation: float 25s infinite ease-in-out;
    }

    .news-icon svg {
      width: 100%;
      height: 100%;
      stroke-width: 1.5;
    }

    .icon-1 {
      top: 15%;
      left: 8%;
      animation-delay: 2s;
    }

    .icon-2 {
      top: 70%;
      left: 12%;
      width: 100px;
      height: 100px;
      animation-delay: 8s;
    }

    .icon-3 {
      top: 25%;
      right: 15%;
      width: 90px;
      height: 90px;
      animation-delay: 5s;
    }

    .icon-4 {
      bottom: 20%;
      right: 8%;
      width: 70px;
      height: 70px;
      animation-delay: 12s;
    }

    .icon-5 {
      top: 45%;
      left: 5%;
      width: 60px;
      height: 60px;
      opacity: 0.06;
      animation-delay: 15s;
    }

    .login-card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 480px;
      width: 100%;
      padding: 48px 40px;
      text-align: center;
      position: relative;
      z-index: 1;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .app-icon {
      margin: 0 auto 24px;
      width: 80px;
      height: 80px;
      animation: iconBounce 0.8s ease-out;
    }

    @keyframes iconBounce {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }

    .app-icon svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3));
    }

    .login-header h1 {
      margin: 0 0 12px 0;
      font-size: 28px;
      color: #1a1a1a;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .login-header p {
      margin: 0 0 36px 0;
      color: #6b7280;
      font-size: 15px;
      line-height: 1.5;
    }

    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 16px;
      margin: 0 0 24px 0;
      text-align: left;
      animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-8px); }
      75% { transform: translateX(8px); }
    }

    .error-message svg {
      width: 24px;
      height: 24px;
      color: #dc2626;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .error-message strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
      font-weight: 600;
      color: #991b1b;
    }

    .error-message p {
      margin: 0;
      font-size: 13px;
      color: #dc2626;
      line-height: 1.4;
    }

    .login-body {
      margin: 36px 0;
    }

    .google-login-btn,
    .demo-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
    }

    .google-login-btn {
      background: white;
      border: 2px solid #e5e7eb;
      color: #374151;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .google-login-btn:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .google-login-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .google-login-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .google-icon {
      width: 20px;
      height: 20px;
    }

    .divider {
      margin: 24px 0;
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
      background: #e5e7eb;
    }

    .divider span {
      position: relative;
      background: white;
      padding: 0 16px;
      color: #9ca3af;
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .demo-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
    }

    .demo-btn svg {
      width: 20px;
      height: 20px;
      stroke-width: 2.5;
    }

    .demo-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .demo-btn:active {
      transform: translateY(0);
    }

    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #f3f4f6;
    }

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 8px;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .feature-item:hover {
      background: #f9fafb;
    }

    .feature-item svg {
      width: 24px;
      height: 24px;
      color: #667eea;
      stroke-width: 2;
    }

    .feature-item span {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
      text-align: center;
      line-height: 1.3;
    }

    .login-footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #f3f4f6;
    }

    .login-footer p {
      margin: 0;
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.5;
    }

    /* Responsive design */
    @media (max-width: 640px) {
      .login-card {
        padding: 32px 24px;
        border-radius: 20px;
      }

      .login-header h1 {
        font-size: 24px;
      }

      .app-icon {
        width: 64px;
        height: 64px;
      }

      .features {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .feature-item {
        flex-direction: row;
        justify-content: flex-start;
        text-align: left;
      }

      .feature-item span {
        text-align: left;
      }
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
      padding: 48px;
      border-radius: 24px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      animation: slideUp 0.6s ease-out;
    }

    .loader h2 {
      margin: 0 0 8px 0;
      font-size: 22px;
      color: #1a1a1a;
      font-weight: 600;
    }

    .loader p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }

    .spinner {
      width: 56px;
      height: 56px;
      margin: 0 auto 24px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message svg {
      width: 20px;
      height: 20px;
      color: #ef4444;
      flex-shrink: 0;
    }

    .error-message div {
      flex: 1;
    }

    .error-message strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
      color: #c33;
    }

    .error-message p {
      margin: 0;
      font-size: 14px;
      color: #666;
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

    .demo-btn svg {
      width: 20px;
      height: 20px;
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

    .features {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #666;
      font-size: 14px;
    }

    .feature-item svg {
      width: 18px;
      height: 18px;
      color: #667eea;
      flex-shrink: 0;
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

    // Check if user is already authenticated (e.g., after OAuth redirect)
    // This handles the case where user is redirected back after Google login
    this.authService.checkAuthStatus().subscribe(user => {
      if (user) {
        // User is authenticated, redirect to list view
        this.router.navigate(['/list']);
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
