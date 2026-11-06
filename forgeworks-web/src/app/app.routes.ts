import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Users } from './pages/users/users';

export const routes: Routes = [
  // ruta por defecto redirige directo al dashboard de recursos del taller
  { path: '', redirectTo: 'recursos', pathMatch: 'full' },

  // vista principal de recursos adaptada directamente del prototipo Stitch
  {
    path: 'recursos',
    loadComponent: () => import('./pages/recursos/recursos').then(m => m.Recursos),
    title: 'Recursos del taller - ForgeWorks'
  },
  {
    path: 'inventory',
    redirectTo: 'recursos',
    pathMatch: 'full'
  },

  // catalogo de productos del taller
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos').then(m => m.Productos),
    title: 'Productos del taller - ForgeWorks'
  },

  // seguimiento de instancias y encargos en tiempo real
  {
    path: 'instancias',
    loadComponent: () => import('./pages/instancias/instancias').then(m => m.Instancias),
    title: 'Instancias y Encargos - ForgeWorks'
  },

  // gestion de usuarios y acceso
  { path: 'login', component: Login, title: 'Login - ForgeWorks' },
  { path: 'users', component: Users, title: 'Gestión de Usuarios' },

  { path: '**', redirectTo: 'recursos' }
];
