import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';
import { ResponsiveService } from '../../core/services/responsive.service';
import {
  InventoryService,
  Workshop,
  Resource,
  ResourceLot,
  NewResourceLot,
  NewResource,
  NewWorkshop
} from '../../core/services/inventory.service';

@Component({
  imports: [FormsModule],
  selector: 'app-inventory',
  styleUrl: './inventory.css',
  templateUrl: './inventory.html'
})
export class Inventory implements OnInit {
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public responsiveService = inject(ResponsiveService);

  // senales para el estado del taller
  workshop = signal<Workshop | null>(null);
  hasWorkshop = signal<boolean>(true);

  // cascada: nivel 1 (tipo de recurso)
  selectedType = signal<string>('');

  // cascada: nivel 2 (recursos disponibles de ese tipo)
  resources = signal<Resource[]>([]);
  selectedResourceId = signal<number | null>(null);

  // recurso actualmente seleccionado en el dropdown
  selectedResource = computed(() => {
    const id = this.selectedResourceId();
    if (!id) return null;
    return this.resources().find(r => r.id === id) || null;
  });

  // lista reactiva de lotes
  lots = signal<ResourceLot[]>([]);

  // manejo de errores del backend
  errorMessage = signal<string>('');
  fieldErrors = signal<Record<string, string[]>>({});

  // control de modales
  showNewResourceModal = signal<boolean>(false);
  showNewWorkshopModal = signal<boolean>(false);

  // modelos para formularios
  newLot: NewResourceLot = {
    resource_id: 0,
    lot_number: '',
    quantity: 1,
    received_at: this.getTodayDateString(),
    expires_at: '',
    cost_cents: 0,
    notes: ''
  };

  newResource: NewResource = {
    name: '',
    internal_name: '',
    resource_type: 'consumible',
    unit: 'unidades',
    cost_cents: 100,
    capacity_per_week: 0,
    description: ''
  };

  newWorkshop: NewWorkshop = {
    name: '',
    id_gov: '',
    description: '',
    location: '',
    category: 'Carpintería'
  };

  ngOnInit(): void {
    this.checkWorkshopAndLoad();
  }

  // revisa si el usuario ya tiene taller asignado
  checkWorkshopAndLoad(): void {
    this.inventoryService.getMyWorkshop().subscribe({
      next: (ws) => {
        this.workshop.set(ws);
        this.hasWorkshop.set(true);
        // cargamos todos los recursos inicialmente
        this.loadResources();
        this.loadLots();
      },
      error: (err) => {
        // si no tiene taller asignado mostramos formulario de creacion
        if (err.status === 403 || err.status === 404) {
          this.hasWorkshop.set(false);
          this.showNewWorkshopModal.set(true);
        } else {
          console.error(err);
          this.errorMessage.set('error al conectar con el servidor');
        }
      }
    });
  }

  // cascada nivel 1: al cambiar el tipo, consultamos los recursos correspondientes
  onTypeChange(type: string): void {
    this.selectedType.set(type);
    this.selectedResourceId.set(null); // resetea el segundo dropdown
    this.loadResources(type);
  }

  // cascada nivel 2: al elegir un recurso, cargamos sus lotes
  onResourceChange(resourceIdString: string): void {
    const id = Number(resourceIdString);
    if (id) {
      this.selectedResourceId.set(id);
      this.newLot.resource_id = id;
      this.loadLots(id);
    } else {
      this.selectedResourceId.set(null);
      this.newLot.resource_id = 0;
      this.loadLots();
    }
  }

  // carga recursos desde el backend (opcionalmente filtrados por tipo para la cascada)
  loadResources(typeFilter?: string): void {
    this.inventoryService.getResources(typeFilter).subscribe({
      next: (data) => {
        this.resources.set(data);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('no se pudieron cargar los recursos');
      }
    });
  }

  // carga lotes de inventario
  loadLots(resourceId?: number): void {
    this.inventoryService.getResourceLots(resourceId).subscribe({
      next: (data) => {
        this.lots.set(data);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  // guardar lote nuevo con validaciones del backend
  saveLot(): void {
    this.errorMessage.set('');
    this.fieldErrors.set({});

    const resource = this.selectedResource();
    if (!resource) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un recurso',
        text: 'debes escoger un recurso en el dropdown antes de registrar un lote'
      });
      return;
    }

    this.newLot.resource_id = resource.id;

    this.inventoryService.createResourceLot(this.newLot).subscribe({
      next: (createdLot) => {
        Swal.fire({
          icon: 'success',
          title: 'Lote registrado',
          text: `se registro el lote ${createdLot.lot_number} con exito`,
          timer: 2000,
          showConfirmButton: false
        });

        // limpiar formulario y refrescar datos
        this.newLot.lot_number = '';
        this.newLot.quantity = 1;
        this.newLot.expires_at = '';
        this.newLot.notes = '';

        this.loadLots(resource.id);
        this.loadResources(this.selectedType());
      },
      error: (err) => {
        // capturar errores de validacion del backend (422)
        console.error('error recibido del backend:', err);
        const serverMsg = err.error?.message || 'error al validar el lote en el servidor';
        const errors = err.error?.errors || {};

        this.errorMessage.set(serverMsg);
        this.fieldErrors.set(errors);

        Swal.fire({
          icon: 'error',
          title: 'Validación en Back-End fallida',
          html: `<div style="text-align: left;">
                  <p><strong>El servidor rechazó el lote (HTTP ${err.status}):</strong></p>
                  <p style="color: #c2334d;">${serverMsg}</p>
                  ${this.formatErrorsHtml(errors)}
                </div>`
        });
      }
    });
  }

  // guardar nuevo recurso
  saveResource(): void {
    this.errorMessage.set('');
    this.inventoryService.createResource(this.newResource).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Recurso creado',
          text: `el insumo ${res.name} fue anadido a tu taller`,
          timer: 2000,
          showConfirmButton: false
        });
        this.showNewResourceModal.set(false);
        this.loadResources(this.selectedType());
        // autoseleccionar el nuevo recurso
        this.selectedResourceId.set(res.id);
        this.newLot.resource_id = res.id;
      },
      error: (err) => {
        console.error(err);
        const msg = err.error?.message || 'no se pudo crear el recurso';
        Swal.fire({ icon: 'error', title: 'Error', text: msg });
      }
    });
  }

  // registrar taller (con validacion de cedula / ruc modulo 10 en backend)
  saveWorkshop(): void {
    this.errorMessage.set('');
    this.inventoryService.createWorkshop(this.newWorkshop).subscribe({
      next: (ws) => {
        this.workshop.set(ws);
        this.hasWorkshop.set(true);
        this.showNewWorkshopModal.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Taller registrado',
          text: `bienvenido al taller ${ws.name}`,
          timer: 2000,
          showConfirmButton: false
        });
        this.loadResources();
      },
      error: (err) => {
        console.error(err);
        const msg = err.error?.message || 'error al crear taller';
        const errors = err.error?.errors || {};
        Swal.fire({
          icon: 'error',
          title: 'Cédula o RUC inválido (Back-End)',
          html: `<p>El servidor validó la identificación con Módulo 10:</p>
                 <p style="color: #c2334d;">${msg}</p>
                 ${this.formatErrorsHtml(errors)}`
        });
      }
    });
  }

  // eliminar lote
  deleteLot(lotId: number): void {
    Swal.fire({
      title: '¿Eliminar este lote?',
      text: 'esta accion quitara las existencias de este lote del inventario',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c2334d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.inventoryService.deleteResourceLot(lotId).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
            this.loadLots(this.selectedResourceId() || undefined);
            this.loadResources(this.selectedType());
          },
          error: (err) => {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Error al eliminar lote' });
          }
        });
      }
    });
  }

  // helpers de formato
  private formatErrorsHtml(errors: Record<string, string[]>): string {
    let html = '<ul>';
    for (const key of Object.keys(errors)) {
      html += `<li><strong>${key}:</strong> ${errors[key].join(', ')}</li>`;
    }
    html += '</ul>';
    return html;
  }

  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  }

  // navegacion
  goToUsers(): void {
    this.router.navigate(['/users']);
  }

  logout(): void {
    this.authService.logout();
  }
}
