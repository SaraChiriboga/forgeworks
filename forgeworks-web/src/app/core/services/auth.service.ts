import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export interface WorkshopPayload {
  name: string;
  id_gov: string;
  category: string;
  location: string;
  description?: string;
}

export interface WorkshopResponse {
  id: number;
  name: string;
  id_gov: string;
  category: string;
  location: string;
  description?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  // injectar las herramientas necesarias para hacer peticiones HTTP y navegar entre rutas
  private http = inject(HttpClient);
  private router = inject(Router);

  // url del backend y la clave bajo la cual se guardará el token en el navegador
  private apiUrl = environment.apiUrl;
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
        localStorage.setItem('user_profile', JSON.stringify(response.user));
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
          if (response.user) {
            localStorage.setItem('user_profile', JSON.stringify(response.user));
          }
        }
      })
    );
  }

  // crear un taller para el usuario autenticado
  createWorkshop(workshopData: WorkshopPayload) {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = {
      workshop: workshopData
    };

    return this.http.post<WorkshopResponse>(`${this.apiUrl}/workshops`, body, { headers }).pipe(
      tap(workshop => {
        const profile = this.getUserProfile();
        if (profile) {
          profile.workshop_id = workshop.id;
          profile.role = 'Admin';
          localStorage.setItem('user_profile', JSON.stringify(profile));
        }
        localStorage.setItem('user_role', 'Admin');
      })
    );
  }

  // registrar artesano y dar de alta su taller en flujo continuo
  registerWorkshop(userData: SignUpPayload, workshopData: WorkshopPayload) {
    return this.signUp(userData).pipe(
      switchMap(() => this.createWorkshop(workshopData))
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

  getUserProfile(): { id?: number; email?: string; role?: string; name?: string; last_name?: string; phone?: string; workshop_id?: number | null } | null {
    const raw = localStorage.getItem('user_profile');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
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
    localStorage.removeItem('user_profile');
    this.router.navigate(['/login']);
  }
}