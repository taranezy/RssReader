import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check auth status and wait for result
  return authService.checkAuthStatus().pipe(
    switchMap(user => {
      const isAuthenticated = user !== null;
      if (isAuthenticated) {
        return of(true);
      } else {
        // Don't navigate anywhere, just block the route
        // The main app template will show the login component
        return of(false);
      }
    })
  );
};
