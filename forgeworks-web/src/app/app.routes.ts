import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Users } from './pages/users/users';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ruta publica de autenticacion sin marco lateral
  { path: 'login', component: Login, title: 'Login - ForgeWorks' },

  // rutas autenticadas dentro del marco SPA del taller
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'recursos', pathMatch: 'full' },
      {
        path: 'recursos',
        loadComponent: () => import('./pages/recursos/recursos').then(m => m.Recursos),
        title: 'Recursos del taller - ForgeWorks'
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/productos/productos').then(m => m.Productos),
        title: 'Productos del taller - ForgeWorks'
      },
      {
        path: 'instancias',
        loadComponent: () => import('./pages/instancias/instancias').then(m => m.Instancias),
        title: 'Instancias y Encargos - ForgeWorks'
      },
      // compatibilidad con rutas previas
      { path: 'inventory', redirectTo: 'recursos', pathMatch: 'full' },
      { path: 'users', component: Users, canActivate: [adminGuard], title: 'Gestión de Usuarios' }
    ]
  },

  { path: '**', redirectTo: '' }
];
