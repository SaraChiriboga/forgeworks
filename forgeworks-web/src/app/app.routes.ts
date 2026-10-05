import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Users } from './pages/users/users';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Login - ForgeWorks' },
  { path: 'users', component: Users, canActivate: [authGuard, adminGuard], title: 'Gestión de Usuarios' },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];