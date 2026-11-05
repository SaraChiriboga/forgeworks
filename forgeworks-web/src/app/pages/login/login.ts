import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, SignUpPayload } from '../../core/services/auth.service';

@Component({
  imports: [FormsModule], // permite usar ngmodel en los formularios
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // pestaña activa: login o registro
  activeTab = signal<'login' | 'register'>('login');

  // visibilidad de contraseñas
  showPassword = signal(false);
  showRegisterPassword = signal(false);
  showRegisterPasswordConf = signal(false);

  // estados de carga y mensajes para el usuario
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // campos para iniciar sesion
  loginEmail = '';
  loginPassword = '';

  // campos para crear cuenta
  registerName = '';
  registerLastName = '';
  registerEmail = '';
  registerPhone = '';
  registerPassword = '';
  registerPasswordConf = '';

  ngOnInit() {
    // si ya hay sesion activa, mandamos a la pantalla correspondiente
    if (this.authService.isLoggedIn()) {
      this.redirectAfterAuth();
    }
  }

  // cambiar entre login y registro
  switchTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // alternar ver u ocultar contraseña
  togglePasswordVisibility(field: 'login' | 'reg' | 'regConf') {
    if (field === 'login') {
      this.showPassword.update(v => !v);
    } else if (field === 'reg') {
      this.showRegisterPassword.update(v => !v);
    } else {
      this.showRegisterPasswordConf.update(v => !v);
    }
  }

  // enviar formulario de login
  onSubmitLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage.set('Por favor ingresa tu correo y contraseña');
      return;
    }

    this.errorMessage.set('');
    this.loading.set(true);

    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.redirectAfterAuth();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Credenciales incorrectas o servidor no disponible');
        console.error(err);
      }
    });
  }

  // enviar formulario de registro
  onSubmitRegister() {
    if (!this.registerEmail || !this.registerPassword) {
      this.errorMessage.set('El correo y la contraseña son obligatorios');
      return;
    }

    if (this.registerPassword !== this.registerPasswordConf) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.errorMessage.set('');
    this.loading.set(true);

    const payload: SignUpPayload = {
      email: this.registerEmail,
      password: this.registerPassword,
      password_confirmation: this.registerPasswordConf,
      name: this.registerName.trim() || undefined,
      last_name: this.registerLastName.trim() || undefined,
      phone: this.registerPhone.trim() || undefined
    };

    this.authService.signUp(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('¡Cuenta creada con éxito! Redirigiendo...');
        setTimeout(() => {
          this.redirectAfterAuth();
        }, 1200);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 422) {
          this.errorMessage.set('El correo ya está registrado o los datos no son válidos');
        } else {
          this.errorMessage.set('Ocurrió un error al registrar la cuenta');
        }
        console.error(err);
      }
    });
  }

  // redirigir segun el rol del usuario
  private redirectAfterAuth() {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/users']);
    } else {
      this.router.navigate(['/inventory']);
    }
  }
}
