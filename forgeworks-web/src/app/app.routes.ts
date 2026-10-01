import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Users } from './pages/users/users';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'users', component: Users, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];