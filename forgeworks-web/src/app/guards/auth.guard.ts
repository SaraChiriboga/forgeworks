import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // preguntar al servicio authService si el usuario está logueado
  if (authService.isLoggedIn()) {
    return true; // seguir al crud
  }

  // si no esta logueado, redirigir al login
  return router.parseUrl('/login');
};