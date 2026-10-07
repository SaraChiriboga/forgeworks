import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // se debe estar logueado y ser admin para acceder a /users
  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true; // acceso permitido
  }

  // redirigir a login si no es admin (en un futuro poner una ventana de error))
  return router.parseUrl('/login');
};