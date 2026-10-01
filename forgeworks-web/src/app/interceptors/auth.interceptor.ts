import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken(); // usar el metodo de getToken() del AuthService para obtener el token

  if (token) {
    // clonar para no alterar la petición original y añadir el header de Authorization con el token
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // que la peticion continúe su camino hacia el backend
  return next(req);
};