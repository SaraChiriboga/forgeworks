import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// el molde de datos que envia el backend para cada usuario
export interface User {
  id: number;
  email: string;
  role: string;
  name: string;
  last_name: string;
  phone: string;
}

export interface NewUser {
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
  last_name: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  // llamar a GET /api/users (el interceptor le inyecta el JWT automáticamente)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  createUser(userData: NewUser): Observable<User> {
    return this.http.post<User>(this.apiUrl, {user: userData});
  }

  readUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }
  
  updateUser(userId: number, userData: Partial<NewUser>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, {user: userData});
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }
}