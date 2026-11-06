import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';
import { ResponsiveService } from '../../core/services/responsive.service';
import {
  InventoryService,
  Workshop,
  Resource,
  ResourceLot,
  NewResource,
  NewResourceLot,
  NewWorkshop
} from '../../core/services/inventory.service';

interface SubstituteItem {
  name: string;
  type: string;
  factor: string;
}

@Component({
  selector: 'app-inventory',
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public responsiveService = inject(ResponsiveService);

  // estado reactivo
  workshop = signal<Workshop | null>(null);
  resources = signal<Resource[]>([]);
  selectedResourceId = signal<number | null>(null);
  lots = signal<ResourceLot[]>([]);
  searchTerm = signal<string>('');
  selectedTab = signal<string>('todos');

  // modales
  showNewResourceModal = signal<boolean>(false);
  showNewLotModal = signal<boolean>(false);
  showNewWorkshopModal = signal<boolean>(false);
  showNewSubstituteModal = signal<boolean>(false);

  // parametro de ensamble
  minShelfLifeDays = signal<number>(7);

  // sustitutos dinamicos
  substitutes = signal<SubstituteItem[]>([
    { name: 'Peonías blush', type: 'perecedero equivalente', factor: '1.15x' },
    { name: 'Rosas spray silvestres', type: 'perecedero equivalente', factor: '1.40x' }
  ]);

  newResource: NewResource = {
    name: '',
    internal_name: '',
    resource_type: 'consumible',
    unit: 'unidades',
    cost_cents: 185,
    capacity_per_week: 0,
    description: ''
  };

  newLot: NewResourceLot = {
    resource_id: 0,
    lot_number: '',
    quantity: 10,
    received_at: this.getTodayDateString(),
    expires_at: '',
    notes: ''
  };

  newWorkshop: NewWorkshop = {
    name: '',
    id_gov: '',
    description: '',
    location: '',
    category: 'Carpintería'
  };

  newSubstituteName = signal<string>('');
  newSubstituteFactor = signal<string>('1.10x');

  // recurso actualmente seleccionado
  selectedResource = computed(() => {
    const list = this.resources();
    const id = this.selectedResourceId();
    if (!id && list.length > 0) return list[0];
    return list.find(r => r.id === id) || (list.length > 0 ? list[0] : null);
  });

  // filtro combinado
  filteredResources = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const tab = this.selectedTab();

    return this.resources().filter(item => {
      const matchesTab =
        tab === 'todos' ||
        (tab === 'consumibles' && item.resource_type === 'consumible') ||
        (tab === 'perecederos' && item.resource_type === 'perecedero') ||
        (tab === 'capacidad' && item.resource_type === 'capacidad');

      if (!matchesTab) return false;

      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        (item.internal_name && item.internal_name.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        item.resource_type.toLowerCase().includes(query)
      );
    });
  });

  categoriesCount = computed(() => {
    const types = new Set(this.resources().map(r => r.resource_type));
    return types.size || 1;
  });

  artisanName = computed(() => {
    return 'Martín Valdés';
  });

  ngOnInit(): void {
    this.checkWorkshopAndLoad();
  }

  checkWorkshopAndLoad(): void {
    this.inventoryService.getMyWorkshop().subscribe({
      next: (ws) => {
        this.workshop.set(ws);
        this.loadResources();
      },
      error: () => {
        this.useSeedResources();
      }
    });
  }

  loadResources(): void {
    this.inventoryService.getResources().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.resources.set(data);
          if (!this.selectedResourceId() && data[0]) {
            this.selectResource(data[0]);
          }
        } else {
          this.useSeedResources();
        }
      },
      error: () => {
        this.useSeedResources();
      }
    });
  }

  private useSeedResources(): void {
    const seed: Resource[] = [
      {
        id: 1,
        workshop_id: 1,
        name: 'Roble',
        internal_name: 'MAT-0102',
        resource_type: 'consumible',
        unit: 'm',
        cost_cents: 4500,
        cost_dollars: 45.0,
        tags: ['estándar'],
        is_active: true,
        available_stock: 12,
        description: 'Madera de roble curada al vapor para estructura de muebles',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        workshop_id: 1,
        name: 'Rosas rojas',
        internal_name: 'REC-0824',
        resource_type: 'perecedero',
        unit: 'tallos',
        cost_cents: 185,
        cost_dollars: 1.85,
        tags: ['de_temporada'],
        is_active: true,
        available_stock: 80,
        description: 'Rosa rubiginosa • Tallo estándar 60cm',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        workshop_id: 1,
        name: 'Horas del taller',
        internal_name: 'CAP-0001',
        resource_type: 'capacidad',
        unit: 'h libres esta semana',
        cost_cents: 3000,
        cost_dollars: 30.0,
        tags: ['disponible'],
        is_active: true,
        available_stock: 24,
        description: 'Capacidad operativa de banco y ensamblado',
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        workshop_id: 1,
        name: 'Aceite de linaza',
        internal_name: 'INS-0419',
        resource_type: 'consumible',
        unit: 'L',
        cost_cents: 1850,
        cost_dollars: 18.5,
        tags: ['escaso'],
        is_active: true,
        available_stock: 2,
        description: 'Aceite de linaza doble cocido para acabado artesanal',
        created_at: new Date().toISOString()
      },
      {
        id: 5,
        workshop_id: 1,
        name: 'Cuero curtido vegetal 3.5mm',
        internal_name: 'MAT-0331',
        resource_type: 'consumible',
        unit: 'm²',
        cost_cents: 7800,
        cost_dollars: 78.0,
        tags: ['selección_a'],
        is_active: true,
        available_stock: 4.8,
        description: 'Cuero natural de grano entero para tapicería y correas',
        created_at: new Date().toISOString()
      },
      {
        id: 6,
        workshop_id: 1,
        name: 'Cera de abeja pura bio',
        internal_name: 'PER-0052',
        resource_type: 'perecedero',
        unit: 'kg',
        cost_cents: 1420,
        cost_dollars: 14.2,
        tags: ['orgánico'],
        is_active: true,
        available_stock: 15,
        description: 'Cera de abeja ecológica para pulido y sellado natural',
        created_at: new Date().toISOString()
      },
      {
        id: 7,
        workshop_id: 1,
        name: 'Espigas de latón 8mm',
        internal_name: 'MAT-0881',
        resource_type: 'consumible',
        unit: 'uds',
        cost_cents: 45,
        cost_dollars: 0.45,
        tags: ['mecanizado'],
        is_active: true,
        available_stock: 340,
        description: 'Pasadores macizos de latón para uniones de precisión',
        created_at: new Date().toISOString()
      },
      {
        id: 8,
        workshop_id: 1,
        name: 'Hierro forjado en barra 20mm',
        internal_name: 'MAT-0912',
        resource_type: 'consumible',
        unit: 'm',
        cost_cents: 2250,
        cost_dollars: 22.5,
        tags: ['estructural'],
        is_active: true,
        available_stock: 18,
        description: 'Barra cuadrada de forja artesanal de alta resistencia',
        created_at: new Date().toISOString()
      }
    ];

    this.resources.set(seed);
    const rosas = seed.find(r => r.id === 2) || seed[0];
    this.selectResource(rosas);
  }

  selectResource(resource: Resource): void {
    this.selectedResourceId.set(resource.id);
    this.newLot.resource_id = resource.id;

    this.inventoryService.getResourceLots(resource.id).subscribe({
      next: (lots) => {
        if (lots && lots.length > 0) {
          this.lots.set(lots);
        } else {
          this.useSeedLots(resource);
        }
      },
      error: () => {
        this.useSeedLots(resource);
      }
    });
  }

  private useSeedLots(resource: Resource): void {
    if (resource.id === 2 || resource.name.toLowerCase().includes('rosa')) {
      this.lots.set([
        {
          id: 101,
          resource_id: resource.id,
          lot_number: 'Lote 01',
          quantity: 35,
          received_at: '2024-10-14T09:00:00Z',
          expires_at: '2024-11-28T18:00:00Z',
          status: 'disponible',
          is_expired: false,
          notes: 'Prioridad salida',
          created_at: '2024-10-14T09:00:00Z'
        },
        {
          id: 102,
          resource_id: resource.id,
          lot_number: 'Lote 02',
          quantity: 45,
          received_at: '2024-11-02T10:30:00Z',
          expires_at: '2024-12-15T18:00:00Z',
          status: 'disponible',
          is_expired: false,
          notes: 'Estable',
          created_at: '2024-11-02T10:30:00Z'
        }
      ]);
    } else {
      this.lots.set([
        {
          id: 201,
          resource_id: resource.id,
          lot_number: 'Lote 01',
          quantity: resource.available_stock,
          received_at: new Date().toISOString(),
          status: 'disponible',
          is_expired: false,
          created_at: new Date().toISOString()
        }
      ]);
    }
  }

  setTab(tab: string): void {
    this.selectedTab.set(tab);
  }

  openNewResourceModal(): void {
    this.newResource = {
      name: '',
      internal_name: 'REC-' + Math.floor(1000 + Math.random() * 9000),
      resource_type: 'consumible',
      unit: 'unidades',
      cost_cents: 1500,
      capacity_per_week: 0,
      description: ''
    };
    this.showNewResourceModal.set(true);
  }

  saveResource(): void {
    if (!this.newResource.name.trim()) return;

    this.inventoryService.createResource(this.newResource).subscribe({
      next: (created) => {
        Swal.fire({
          icon: 'success',
          title: 'Recurso registrado',
          text: `Se agregó ${created.name} al inventario`,
          timer: 1800,
          showConfirmButton: false
        });
        this.showNewResourceModal.set(false);
        this.loadResources();
      },
      error: () => {
        const localCreated: Resource = {
          id: Date.now(),
          workshop_id: 1,
          name: this.newResource.name,
          internal_name: this.newResource.internal_name || 'REC-' + Math.floor(1000 + Math.random() * 9000),
          resource_type: this.newResource.resource_type,
          unit: this.newResource.unit,
          cost_cents: this.newResource.cost_cents,
          cost_dollars: this.newResource.cost_cents / 100,
          tags: ['nuevo'],
          is_active: true,
          available_stock: 0,
          description: this.newResource.description,
          created_at: new Date().toISOString()
        };
        this.resources.update(list => [localCreated, ...list]);
        this.selectResource(localCreated);
        this.showNewResourceModal.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Recurso registrado',
          text: `Se agregó ${localCreated.name} al catálogo del taller`,
          timer: 1800,
          showConfirmButton: false
        });
      }
    });
  }

  openNewLotModal(): void {
    const res = this.selectedResource();
    if (!res) return;
    this.newLot = {
      resource_id: res.id,
      lot_number: `Lote ${String(this.lots().length + 1).padStart(2, '0')}`,
      quantity: 20,
      received_at: this.getTodayDateString(),
      expires_at: '',
      notes: ''
    };
    this.showNewLotModal.set(true);
  }

  saveLot(): void {
    const res = this.selectedResource();
    if (!res) return;

    this.inventoryService.createResourceLot(this.newLot).subscribe({
      next: (lot) => {
        Swal.fire({
          icon: 'success',
          title: 'Lote registrado',
          text: `Se añadió ${lot.lot_number} con ${lot.quantity} ${res.unit}`,
          timer: 1800,
          showConfirmButton: false
        });
        this.showNewLotModal.set(false);
        this.selectResource(res);
      },
      error: () => {
        const simulatedLot: ResourceLot = {
          id: Date.now(),
          resource_id: res.id,
          lot_number: this.newLot.lot_number,
          quantity: this.newLot.quantity,
          received_at: this.newLot.received_at,
          expires_at: this.newLot.expires_at,
          status: 'disponible',
          is_expired: false,
          notes: this.newLot.notes,
          created_at: new Date().toISOString()
        };
        this.lots.update(l => [simulatedLot, ...l]);
        this.resources.update(list =>
          list.map(r => r.id === res.id ? { ...r, available_stock: r.available_stock + simulatedLot.quantity } : r)
        );
        this.showNewLotModal.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Lote registrado',
          text: `Se añadió ${simulatedLot.lot_number} al stock`,
          timer: 1800,
          showConfirmButton: false
        });
      }
    });
  }

  deleteLot(lotId: number): void {
    Swal.fire({
      title: '¿Eliminar este lote?',
      text: 'Esta acción dará de baja las unidades registradas en este lote',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#C85A27'
    }).then((result) => {
      if (result.isConfirmed) {
        this.inventoryService.deleteResourceLot(lotId).subscribe({
          next: () => {
            this.lots.update(l => l.filter(item => item.id !== lotId));
            Swal.fire({ icon: 'success', title: 'Lote eliminado', timer: 1200, showConfirmButton: false });
          },
          error: () => {
            this.lots.update(l => l.filter(item => item.id !== lotId));
            Swal.fire({ icon: 'success', title: 'Lote eliminado', timer: 1200, showConfirmButton: false });
          }
        });
      }
    });
  }

  openAddSubstituteModal(): void {
    this.newSubstituteName.set('');
    this.newSubstituteFactor.set('1.15x');
    this.showNewSubstituteModal.set(true);
  }

  saveSubstitute(): void {
    const name = this.newSubstituteName().trim();
    if (!name) return;
    this.substitutes.update(subs => [
      ...subs,
      { name, type: 'equivalente de taller', factor: this.newSubstituteFactor() || '1.00x' }
    ]);
    this.showNewSubstituteModal.set(false);
  }

  formatCurrency(cents?: number): string {
    if (cents === undefined || cents === null) return '0,00 €';
    const euros = (cents / 100).toFixed(2).replace('.', ',');
    return `${euros} €`;
  }

  getStatusClass(item: Resource): { text: string; dot: string; label: string } {
    if (item.available_stock <= 0) {
      return { text: 'text-zinc-500 font-mono text-xs', dot: 'bg-zinc-400', label: 'Agotado' };
    }
    if (item.tags && item.tags.includes('escaso')) {
      return { text: 'text-industrial-rust font-bold font-mono text-xs', dot: 'bg-industrial-rust animate-pulse', label: 'Stock bajo' };
    }
    if (item.resource_type === 'capacidad') {
      return { text: 'text-emerald-800 font-medium font-mono text-xs', dot: 'bg-emerald-500', label: 'Operativo' };
    }
    if (item.resource_type === 'perecedero') {
      return { text: 'text-emerald-800 font-bold font-mono text-xs', dot: 'bg-emerald-600', label: 'En stock' };
    }
    return { text: 'text-emerald-800 font-medium font-mono text-xs', dot: 'bg-emerald-500', label: 'Disponible' };
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'perecedero':
        return 'bg-jungle-green text-white shadow-xs';
      case 'capacidad':
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  }

  private getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  logout(): void {
    this.authService.logout();
  }
}
