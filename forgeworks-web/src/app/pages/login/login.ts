import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service'
import { ResponsiveService } from '../../core/services/responsive.service';

@Component({
  imports: [FormsModule], // permite usar [(ngModel)] en el formulario
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})

export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  public responsiveService = inject(ResponsiveService);

  email = '';
  password = '';
  errorMessage = signal('');

  ngOnInit() {

    // si ya tiene sesion activa Y es admin, puede ingresar al CRUD
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      this.router.navigate(['/users']);
    }
  }

  onSubmit() {
    this.errorMessage.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        if(this.authService.isAdmin()){
          // login exitoso: el servicio ya guardó el token en localStorage
          this.router.navigate(['/users']);
        } else{
          this.errorMessage.set('Acceso denegado: Permisos insuficientes :(')
        }
      },
      error: (err) => {
        this.errorMessage.set('Credenciales incorrectas o servidor no disponible');
        console.error(err);
      }
    });
  }
}