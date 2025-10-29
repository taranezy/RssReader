import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { FeedManagerComponent } from './components/feed-manager/feed-manager';
import { LoginComponent } from './login/login.component';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FeedManagerComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'RSS Reader';
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit(): void {
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
}
