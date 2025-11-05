import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
export class App implements OnInit, OnDestroy {
  title = 'RSS Reader';
  isAuthenticated$: Observable<boolean>;
  isSidebarCollapsed = false;
  showLeftMenu = true;
  private autoHideTimeout: any;
  private isMobileScreen = false;
  private isHoveringMenu = false;
  private manuallyOpened = false;

  constructor(
    private authService: AuthService,
    private userSettingsService: UserSettingsService,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    this.loadUserSettings();
    this.checkScreenSize();
    
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
      // Auto-hide sidebar on mobile after navigation
      if (this.isMobileScreen && !this.isSidebarCollapsed) {
        this.startAutoHideTimer();
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    const wasMobile = this.isMobileScreen;
    this.isMobileScreen = window.innerWidth <= 768;
    
    // If just switched to mobile and sidebar is open, start auto-hide timer
    if (this.isMobileScreen && !wasMobile && !this.isSidebarCollapsed) {
      this.startAutoHideTimer();
    }
  }

  startAutoHideTimer(): void {
    // Don't auto-hide if manually opened
    if (this.manuallyOpened) {
      return;
    }
    
    // Clear existing timeout
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
    
    // Set new timeout to hide sidebar after 2 seconds
    if (this.isMobileScreen) {
      this.autoHideTimeout = setTimeout(() => {
        // Only hide if not hovering over the menu and not manually opened
        if (!this.isSidebarCollapsed && this.isMobileScreen && !this.isHoveringMenu && !this.manuallyOpened) {
          this.isSidebarCollapsed = true;
        }
      }, 2000);
    }
  }

  onMenuMouseEnter(): void {
    this.isHoveringMenu = true;
    // Cancel auto-hide timer when hovering
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
  }

  onMenuMouseLeave(): void {
    this.isHoveringMenu = false;
    // Start auto-hide timer when leaving menu on mobile (only if not manually opened)
    if (this.isMobileScreen && !this.isSidebarCollapsed && !this.manuallyOpened) {
      this.startAutoHideTimer();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('app-feed-manager');
    const header = document.querySelector('app-header');
    
    // On mobile screens
    if (this.isMobileScreen) {
      const clickX = event.clientX;
      
      // If clicked inside sidebar or header, cancel auto-hide timer
      if (sidebar && sidebar.contains(target)) {
        if (this.autoHideTimeout) {
          clearTimeout(this.autoHideTimeout);
        }
        return;
      }
      
      if (header && header.contains(target)) {
        return;
      }
      
      // If sidebar is closed and click is near left edge (within 20px), open it
      if (this.isSidebarCollapsed && clickX <= 20) {
        this.isSidebarCollapsed = false;
        this.manuallyOpened = false; // Auto-opened by edge click
        this.startAutoHideTimer();
        return;
      }
      
      // If sidebar is open and click is outside the sidebar, close it
      if (!this.isSidebarCollapsed && sidebar && !sidebar.contains(target)) {
        this.isSidebarCollapsed = true;
        this.manuallyOpened = false; // Reset when closed
      }
    }
  }
  
  onSidebarToggled(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
    
    // If opened on mobile, start auto-hide timer
    if (!collapsed && this.isMobileScreen) {
      this.startAutoHideTimer();
    } else if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    
    if (!this.isSidebarCollapsed) {
      // Opening sidebar
      this.manuallyOpened = true; // Mark as manually opened
      // Clear any existing auto-hide timer
      if (this.autoHideTimeout) {
        clearTimeout(this.autoHideTimeout);
      }
    } else {
      // Closing sidebar
      this.manuallyOpened = false; // Reset when manually closed
      if (this.autoHideTimeout) {
        clearTimeout(this.autoHideTimeout);
      }
    }
  }

  ngOnDestroy(): void {
    // Clean up timeout on component destroy
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
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
