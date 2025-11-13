import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, switchMap, filter } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check current user state, if null trigger auth check and wait
  return authService.getCurrentUser().pipe(
    take(1),
    switchMap(currentUser => {
      // If we already have user data, allow immediately
      if (currentUser !== null) {
        return of(true);
      }
      
      // No user yet, do auth check and wait for result
      return authService.checkAuthStatus().pipe(
        map(user => {
          if (user !== null) {
            return true;
          }
          // Not authenticated, show login (app template handles this)
          return false;
        })
      );
    })
  );
};
