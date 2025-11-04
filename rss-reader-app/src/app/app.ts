import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { FeedManagerComponent } from './components/feed-manager/feed-manager';
import { LoginComponent } from './login/login.component';
import { AuthService } from './services/auth.service';
import { UserSettingsService } from './services/user-settings.service';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FeedManagerComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'RSS Reader';
  isAuthenticated$: Observable<boolean>;
  isSidebarCollapsed = false;
  showLeftMenu = true;

  constructor(
    private authService: AuthService,
    private userSettingsService: UserSettingsService,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    this.loadUserSettings();
    
    // Check auth status and navigate accordingly
    this.authService.checkAuthStatus().subscribe(user => {
      if (user && this.router.url === '/') {
        this.router.navigate(['/list']);
      }
    });

    // Re-check auth status on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.authService.checkAuthStatus().subscribe();
    });
  }
  
  onSidebarToggled(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadUserSettings(): void {
    this.userSettingsService.getSettings().subscribe(
      settings => {
        this.showLeftMenu = settings.showLeftMenu;
      },
      error => {
        console.error('Error loading user settings:', error);
        // Fall back to localStorage if API fails
        if (typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem('userSettings');
          if (saved) {
            const settings = JSON.parse(saved);
            this.showLeftMenu = settings.showLeftMenu !== false;
          }
        }
      }
    );
  }
}
