import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

// estructura de la respuesta que se espera del backend al hacer login o registro
interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
    name?: string;
    last_name?: string;
    phone?: string;
    workshop_id?: number | null;
  };
}

export interface SignUpPayload {
  email: string;
  password: string;
  password_confirmation: string;
  name?: string;
  last_name?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  // injectar las herramientas necesarias para hacer peticiones HTTP y navegar entre rutas
  private http = inject(HttpClient);
  private router = inject(Router);

  // url del baclkend y la clave bajo la cual se guardará el token en el navegador
  private apiUrl = 'http://localhost:3000/api';
  private tokenKey = 'jwt_token';

  authErrorMessage = signal('');

  // metodo para login
  login(email: string, password: string) {
    // el backend de lucky  espera los datos agrupados bajo la clave "user"
    const body = {
      user: {
        email: email,
        password: password
      }
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/sign_ins`, body).pipe(
      // 'tap' nos permite hacer una acción secundaria cuando la respuesta llega con éxito
      tap(response => {
        this.saveToken(response.token);
        localStorage.setItem('user_role', response.user.role); // guardar el usuario en localStorage
      })
    );
  }

  // registrarse como nuevo usuario cliente
  signUp(userData: SignUpPayload) {
    const body = {
      user: userData
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/sign_ups`, body).pipe(
      tap(response => {
        if (response.token) {
          this.saveToken(response.token);
          if (response.user?.role) {
            localStorage.setItem('user_role', response.user.role);
          }
        }
      })
    );
  }

  isAdmin(): boolean {
    return localStorage.getItem('user_role') === 'Admin';
  }

  isVendor(): boolean {
    return localStorage.getItem('user_role') === 'Vendor';
  }

  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }

  // guardar el token en el localStorage del navegador
  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // obtener token del localStorage del navegador
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // saber si el usuario está logueado, es decir, si hay un token guardado en el localStorage
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  // logout
  logout(): void {
    localStorage.removeItem(this.tokenKey); // eliminar el token del localStorage
    localStorage.removeItem('user_role'); // eliminar el rol del usuario al hacer logout
    this.router.navigate(['/login']);
  }
}