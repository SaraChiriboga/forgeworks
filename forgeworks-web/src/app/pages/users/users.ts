import { Component, inject } from '@angular/core';
import {AuthService} from "../../core/services/auth.service";

@Component({
  imports: [],
  selector: 'app-users',
  styleUrl: './users.css',
  templateUrl: './users.html',
})
export class Users {
  private authService = inject(AuthService);

  logout(){
    this.authService.logout();
  }
}
