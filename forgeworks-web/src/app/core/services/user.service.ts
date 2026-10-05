import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// el molde de datos que envia el backend para cada usuario
export interface User {
  id: number;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/users';

  // llamar a GET /api/users (el interceptor le inyecta el JWT automáticamente)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }
}