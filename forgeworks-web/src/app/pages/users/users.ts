import { Component, inject, OnInit} from '@angular/core';
import {AuthService} from "../../core/services/auth.service";
import { User, UserService } from '../../core/services/user.service';

@Component({
  imports: [],
  selector: 'app-users',
  styleUrl: './users.css',
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  users: User[] = [];
  errorMessage = '';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void{
    this.userService.getUsers().subscribe({ // los observables son asincrónicos, por eso usamos subscribe para recibir la respuesta cuando llegue
      next: (data) => {
        this.users = data; //se guarda la lista de usuarios obtenida del backend
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los usuarios';
        console.error(err);
      }
    });
  }

  logout(){
    this.authService.logout();
  }
}
