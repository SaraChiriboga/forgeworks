import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [FormsModule], // permite usar [(ngModel)] en el formulario
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';

  ngOnInit() {
    // si ya tiene sesion activa, lo mandamos directo al CRUD
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/users']);
    }
  }

  onSubmit() {
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        // Login exitoso: el servicio ya guardó el token en localStorage
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.errorMessage = 'Credenciales incorrectas o servidor no disponible';
        console.error(err);
      }
    });
  }
}