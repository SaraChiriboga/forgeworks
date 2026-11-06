import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { InventoryService, Workshop } from '../../core/services/inventory.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit {
  private authService = inject(AuthService);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  // estado reactivo del taller y artesano
  workshop = signal<Workshop | null>(null);
  currentUrl = signal<string>(this.router.url);

  // seccion activa calculada desde la url
  currentSection = computed(() => {
    const url = this.currentUrl();
    if (url.includes('producto')) return 'productos';
    if (url.includes('instancia')) return 'instancias';
    return 'recursos';
  });

  // migas de pan dinamicas para el encabezado
  breadcrumbSection = computed(() => {
    switch (this.currentSection()) {
      case 'productos':
        return 'Productos';
      case 'instancias':
        return 'Instancias';
      default:
        return 'Recursos';
    }
  });

  breadcrumbDetail = computed(() => {
    switch (this.currentSection()) {
      case 'productos':
        return 'Catálogo de productos';
      case 'instancias':
        return 'Seguimiento de encargos';
      default:
        return 'Recursos del taller';
    }
  });

  // nombre del taller y del artesano
  workshopName = computed(() => {
    return this.workshop()?.name || 'Taller Ébano & Forja';
  });

  artisanName = computed(() => {
    const role = this.authService.getUserRole();
    if (role === 'Vendor') return 'Martín Valdés (Maestro)';
    if (role === 'Admin') return 'Administrador';
    return 'Martín Valdés';
  });

  avatarInitials = computed(() => {
    const ws = this.workshop();
    if (ws && ws.name) {
      const parts = ws.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return ws.name.slice(0, 2).toUpperCase();
    }
    return 'EF';
  });

  ngOnInit(): void {
    // sincronizar seccion activa al cambiar de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });

    // cargar datos del taller
    this.inventoryService.getMyWorkshop().subscribe({
      next: (ws) => this.workshop.set(ws),
      error: () => {
        // si no hay taller aun o estamos en modo offline, se mantiene el valor por defecto
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

