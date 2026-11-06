
export interface AppToast {
  id: number;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

export interface AppConfirmModal {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDestructive: boolean;
  action?: () => void;
}
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ResponsiveService } from '../../core/services/responsive.service';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import {
  InventoryService,
  Workshop,
  Resource,
  ResourceLot,
  NewResource,
  NewResourceLot
} from '../../core/services/inventory.service';

@Component({
  selector: 'app-recursos',
  imports: [FormsModule, DatePipe, TitleCasePipe, RouterLink, DropdownComponent],
  templateUrl: './recursos.html',
  styleUrl: './recursos.scss'
})
export class Recursos implements OnInit {
  protected readonly String = String;
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);
  public responsiveService = inject(ResponsiveService);

  // estado reactivo
    // Sistema propio de notificaciones toast y confirmaciones (sustituye SweetAlert2)
  toasts = signal<AppToast[]>([]);
  private toastCounter = 0;

  confirmModal = signal<AppConfirmModal>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    isDestructive: false
  });

  // Filtros adicionales útiles para la tabla
  selectedStockFilter = signal<string>("todos");
  selectedTagFilter = signal<string>("todos");
  selectedSortOption = signal<string>("nombre_asc");

  readonly stockFilterOptions: DropdownOption[] = [
    { value: "todos", label: "Stock: Todos" },
    { value: "disponible", label: "Solo con existencias (> 0)" },
    { value: "agotado", label: "Agotados / Sin stock" }
  ];

  readonly sortOptions: DropdownOption[] = [
    { value: "nombre_asc", label: "Nombre: A - Z" },
    { value: "nombre_desc", label: "Nombre: Z - A" },
    { value: "stock_desc", label: "Mayor stock disponible" },
    { value: "stock_asc", label: "Menor stock disponible" },
    { value: "costo_desc", label: "Mayor costo unitario" },
    { value: "costo_asc", label: "Menor costo unitario" }
  ];

  // Todas las etiquetas registradas en los recursos del taller (independiente de modales)
  allWorkshopTags = computed<string[]>(() => {
    const set = new Set<string>();
    for (const r of this.resources()) {
      if (r.tags && Array.isArray(r.tags)) {
        for (const t of r.tags) {
          const clean = t.trim().toLowerCase();
          if (clean) set.add(clean);
        }
      }
    }
    return Array.from(set).sort();
  });

  tagFilterOptions = computed<DropdownOption[]>(() => {
    const list: DropdownOption[] = [{ value: "todos", label: "Etiquetas: Todas" }];
    const tags = this.allWorkshopTags().map(tag => ({
      value: tag,
      label: `#${tag}`
    }));
    return [...list, ...tags];
  });

  workshop = signal<Workshop | null>(null);
  resources = signal<Resource[]>([]);
  selectedResourceId = signal<number | null>(null);
  lots = signal<ResourceLot[]>([]);
  searchTerm = signal<string>('');
  selectedTab = signal<string>('todos');

  // modales
  showNewResourceModal = signal<boolean>(false);
  showEditResourceModal = signal<boolean>(false);
  showNewLotModal = signal<boolean>(false);
  showEditLotModal = signal<boolean>(false);
  showInspectorDrawer = signal<boolean>(false);
  isClosingDrawer = signal<boolean>(false);
  editingLotId = signal<number | null>(null);

  // dropdown en cascada para registrar lote fisico (plan de implementacion seccion 1.3 y 4.2)
  lotResourceType = signal<string>('todos');

  readonly resourceTypeOptions: DropdownOption[] = [
    { value: 'consumible', label: 'Consumible' },
    { value: 'perecedero', label: 'Perecedero con Lote' },
    { value: 'capacidad', label: 'Capacidad / Mano de obra' }
  ];

  readonly lotTypeFilterOptions: DropdownOption[] = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'consumible', label: 'Consumibles' },
    { value: 'perecedero', label: 'Perecederos' },
    { value: 'capacidad', label: 'Capacidad' }
  ];

  // Catálogos de unidades de medida organizados por tipo de recurso
  readonly consumibleUnitOptions: DropdownOption[] = [
    // Conteo y piezas
    { value: 'unidades', label: 'Unidades (uds)', subtitle: 'Piezas o elementos individuales' },
    { value: 'pares', label: 'Pares', subtitle: 'Calzado, bisagras o guantes' },
    { value: 'docenas', label: 'Docenas', subtitle: '12 unidades' },
    { value: 'cientos', label: 'Cientos', subtitle: '100 unidades (clavos, herrajes)' },
    { value: 'millares', label: 'Millares', subtitle: '1.000 unidades (tornillos, tachuelas)' },
    { value: 'juegos', label: 'Juegos / Kits', subtitle: 'Conjuntos completos' },
    { value: 'pliegos', label: 'Pliegos', subtitle: 'Papel, cartón o lija' },
    { value: 'hojas', label: 'Hojas', subtitle: 'Láminas finas o papel' },
    { value: 'placas', label: 'Placas', subtitle: 'Metal, cerámica o madera' },
    { value: 'rollos', label: 'Rollos', subtitle: 'Cintas, cuero, hilos o tela' },
    { value: 'bobinas', label: 'Bobinas', subtitle: 'Alambre o hilo industrial' },
    { value: 'ovillos', label: 'Ovillos', subtitle: 'Lana o hilo para crochet/tejido' },
    { value: 'madejas', label: 'Madejas', subtitle: 'Hilo de bordar o macramé' },

    // Longitud
    { value: 'm', label: 'Metros (m)', subtitle: 'Longitud estándar' },
    { value: 'cm', label: 'Centímetros (cm)', subtitle: 'Cintas, molduras o perfiles' },
    { value: 'mm', label: 'Milímetros (mm)', subtitle: 'Piezas de precisión' },
    { value: 'pulgadas', label: 'Pulgadas (in)', subtitle: 'Madera, cañerías o pernos' },
    { value: 'pies', label: 'Pies (ft)', subtitle: 'Listones o perfiles' },
    { value: 'yardas', label: 'Yardas (yd)', subtitle: 'Telas y confección' },

    // Superficie
    { value: 'm²', label: 'Metros cuadrados (m²)', subtitle: 'Tableros, pisos o cuero' },
    { value: 'cm²', label: 'Centímetros cuadrados (cm²)', subtitle: 'Vidrio o piezas pequeñas' },
    { value: 'pies²', label: 'Pies cuadrados (sq ft)', subtitle: 'Pieles de cuero curtido' },

    // Volumen
    { value: 'm³', label: 'Metros cúbicos (m³)', subtitle: 'Madera en bruto o áridos' },
    { value: 'pie_tablar', label: 'Pies tablares (pt)', subtitle: 'Volumen comercial de madera' },
    { value: 'L', label: 'Litros (L)', subtitle: 'Aceites, resinas, solventes, agua' },
    { value: 'mL', label: 'Mililitros (mL)', subtitle: 'Esencias, tintes o catalizadores' },
    { value: 'galones', label: 'Galones (gal)', subtitle: 'Pinturas, barnices o resinas' },

    // Masa / Peso
    { value: 'kg', label: 'Kilogramos (kg)', subtitle: 'Peso estándar (arcilla, hierro, cera)' },
    { value: 'g', label: 'Gramos (g)', subtitle: 'Pigmentos, especias o soldadura' },
    { value: 'libras', label: 'Libras (lb)', subtitle: 'Peso comercial' },
    { value: 'onzas', label: 'Onzas (oz)', subtitle: 'Joyería, metales preciosos o esencias' },
    { value: 'quintales', label: 'Quintales (qq)', subtitle: 'Materiales a granel' }
  ];

  readonly perecederoUnitOptions: DropdownOption[] = [
    // Conteo y flores/vegetales
    { value: 'unidades', label: 'Unidades (uds)', subtitle: 'Frutos, tallos o piezas individuales' },
    { value: 'docenas', label: 'Docenas', subtitle: '12 unidades (flores, huevos)' },
    { value: 'cientos', label: 'Cientos', subtitle: '100 unidades' },
    { value: 'tallos', label: 'Tallos', subtitle: 'Flores cortadas o follaje fresco' },
    { value: 'ramos', label: 'Ramos', subtitle: 'Atados de flores o hierbas aromáticas' },
    { value: 'bonches', label: 'Bonches / Atados', subtitle: 'Manojos de follaje o ramas' },

    // Volumen de líquidos perecederos / resinas orgánicas
    { value: 'L', label: 'Litros (L)', subtitle: 'Leches, emulsiones o esencias líquidas' },
    { value: 'mL', label: 'Mililitros (mL)', subtitle: 'Aceites esenciales, colorantes orgánicos' },
    { value: 'galones', label: 'Galones (gal)', subtitle: 'Líquidos a granel' },

    // Masa / Peso perecedero
    { value: 'kg', label: 'Kilogramos (kg)', subtitle: 'Alimentos, cera virgen, masas' },
    { value: 'g', label: 'Gramos (g)', subtitle: 'Especias, hojas secas, polvos finos' },
    { value: 'libras', label: 'Libras (lb)', subtitle: 'Peso comercial perecedero' },
    { value: 'onzas', label: 'Onzas (oz)', subtitle: 'Medida culinaria / botánica' }
  ];

  readonly capacidadUnitOptions: DropdownOption[] = [
    { value: 'horas', label: 'Horas (h)', subtitle: 'Mano de obra, banco de trabajo o fragua' },
    { value: 'minutos', label: 'Minutos (min)', subtitle: 'Cortes láser, impresión 3D o CNC' },
    { value: 'jornadas', label: 'Jornadas (8h)', subtitle: 'Días de artesano u operario' }
  ];

  // Señal del tipo de recurso en edición/creación para filtrar reactivamente las unidades
  currentResourceType = signal<string>('consumible');

  // Unidades disponibles calculadas de forma reactiva según el tipo seleccionado
  currentUnitOptions = computed<DropdownOption[]>(() => {
    const type = this.currentResourceType();
    switch (type) {
      case 'perecedero':
        return this.perecederoUnitOptions;
      case 'capacidad':
        return this.capacidadUnitOptions;
      case 'consumible':
      default:
        return this.consumibleUnitOptions;
    }
  });

  filteredResourcesForLot = computed(() => {
    const type = this.lotResourceType();
    const all = this.resources();
    if (type === 'todos' || !type) return all;
    return all.filter(r => r.resource_type === type);
  });

  lotResourceOptions = computed<DropdownOption[]>(() => {
    return this.filteredResourcesForLot().map(r => ({
      value: String(r.id),
      label: `${r.name} (${r.internal_name || 'S/C'})`,
      subtitle: `${r.unit} · Stock: ${r.available_stock}`
    }));
  });

  // Lista reactiva de tags asignados al recurso en creación/edición
  selectedTags = signal<string[]>([]);
  newCustomTagInput = signal<string>('');

  // Opciones de dropdown de tags existentes en el taller para el modal de recursos
  existingWorkshopTags = computed<DropdownOption[]>(() => {
    const current = this.selectedTags();
    return this.allWorkshopTags()
      .filter(tag => !current.includes(tag))
      .map(tag => ({
        value: tag,
        label: tag
      }));
  });

  addExistingTag(tag: string): void {
    if (!tag) return;
    const clean = tag.trim().toLowerCase();
    if (clean && !this.selectedTags().includes(clean)) {
      this.selectedTags.update(tags => [...tags, clean]);
    }
  }

  addNewCustomTag(): void {
    const raw = this.newCustomTagInput().trim().toLowerCase();
    if (!raw) return;
    // Permite agregar una o varias separadas por coma
    const parts = raw.split(',').map(p => p.trim()).filter(p => p.length > 0);
    for (const p of parts) {
      if (!this.selectedTags().includes(p)) {
        this.selectedTags.update(tags => [...tags, p]);
      }
    }
    this.newCustomTagInput.set('');
  }

  removeTag(tagToRemove: string): void {
    this.selectedTags.update(tags => tags.filter(t => t !== tagToRemove));
  }

  // Datos de lote obligatorio para recursos perecederos en el modal de nuevo recurso
  initialPerishableLot: NewResourceLot = {
    resource_id: 0,
    lot_number: 'Lote 01',
    quantity: 1,
    received_at: this.getTodayDateString(),
    expires_at: '',
    notes: 'Lote inicial de ingreso obligatorio'
  };

  newResource: NewResource = {
    name: '',
    internal_name: '',
    resource_type: 'consumible',
    unit: 'unidades',
    cost_cents: 0,
    capacity_per_week: 0,
    description: '',
    tags: []
  };

  newLot: NewResourceLot = {
    resource_id: 0,
    lot_number: '',
    quantity: 1,
    received_at: this.getTodayDateString(),
    expires_at: '',
    notes: ''
  };

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
    const stockFilter = this.selectedStockFilter();
    const tagFilter = this.selectedTagFilter();
    const sort = this.selectedSortOption();

    let list = this.resources().filter(item => {
      // 1. Filtro por tipo / pestaña
      const matchesTab =
        tab === "todos" ||
        (tab === "consumibles" && item.resource_type === "consumible") ||
        (tab === "perecederos" && item.resource_type === "perecedero") ||
        (tab === "capacidad" && item.resource_type === "capacidad");
      if (!matchesTab) return false;

      // 2. Filtro por stock
      if (stockFilter === "disponible" && item.available_stock <= 0) return false;
      if (stockFilter === "agotado" && item.available_stock > 0) return false;

      // 3. Filtro por etiqueta
      if (tagFilter !== "todos") {
        if (!item.tags || !item.tags.some(t => t.toLowerCase() === tagFilter.toLowerCase())) {
          return false;
        }
      }

      // 4. Búsqueda por texto (nombre, código, descripción, tags, tipo)
      if (!query) return true;
      const matchName = item.name.toLowerCase().includes(query);
      const matchCode = item.internal_name ? item.internal_name.toLowerCase().includes(query) : false;
      const matchDesc = item.description ? item.description.toLowerCase().includes(query) : false;
      const matchType = item.resource_type.toLowerCase().includes(query);
      const matchTag = item.tags ? item.tags.some(t => t.toLowerCase().includes(query)) : false;

      return matchName || matchCode || matchDesc || matchType || matchTag;
    });

    // 5. Ordenamiento dinámico
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "nombre_desc":
          return b.name.localeCompare(a.name);
        case "stock_desc":
          return b.available_stock - a.available_stock;
        case "stock_asc":
          return a.available_stock - b.available_stock;
        case "costo_desc":
          return b.cost_cents - a.cost_cents;
        case "costo_asc":
          return a.cost_cents - b.cost_cents;
        case "nombre_asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  });

  categoriesCount = computed(() => {
    const types = new Set(this.resources().map(r => r.resource_type));
    return types.size || 0;
  });

  artisanName = computed(() => {
    const profile = this.authService.getUserProfile();
    if (profile) {
      const full = `${profile.name || ''} ${profile.last_name || ''}`.trim();
      if (full) return full;
      if (profile.email) return profile.email.split('@')[0];
    }
    return 'Artesano';
  });

  workshopName = computed(() => {
    const ws = this.workshop();
    if (ws && ws.name) return ws.name;
    const profile = this.authService.getUserProfile();
    if (profile?.name) return `Taller de ${profile.name}`;
    return 'Mi Taller';
  });

  avatarInitials = computed(() => {
    const name = this.artisanName();
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return 'FW';
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
        this.resources.set([]);
        this.selectedResourceId.set(null);
        this.lots.set([]);
      }
    });
  }

  loadResources(): void {
    this.inventoryService.getResources().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.resources.set(data);
          const currentId = this.selectedResourceId();
          if (!currentId || !data.some(r => r.id === currentId)) {
            this.selectResource(data[0]);
          } else {
            const current = data.find(r => r.id === currentId);
            if (current) this.selectResource(current);
          }
        } else {
          this.resources.set([]);
          this.selectedResourceId.set(null);
          this.lots.set([]);
        }
      },
      error: () => {
        this.resources.set([]);
        this.selectedResourceId.set(null);
        this.lots.set([]);
      }
    });
  }

  selectResource(resource: Resource, openDrawer = false): void {
    this.selectedResourceId.set(resource.id);
    this.newLot.resource_id = resource.id;
    if (openDrawer) {
      this.isClosingDrawer.set(false);
      this.showInspectorDrawer.set(true);
    }

    this.inventoryService.getResourceLots(resource.id).subscribe({
      next: (lots) => {
        this.lots.set(lots || []);
      },
      error: () => {
        this.lots.set([]);
      }
    });
  }

  closeInspector(): void {
    if (!this.showInspectorDrawer() || this.isClosingDrawer()) return;
    this.isClosingDrawer.set(true);
    setTimeout(() => {
      this.showInspectorDrawer.set(false);
      this.isClosingDrawer.set(false);
    }, 240);
  }

  setTab(tab: string): void {
    this.selectedTab.set(tab);
  }

  resetFilters(): void {
    this.selectedTab.set('todos');
    this.selectedStockFilter.set('todos');
    this.selectedTagFilter.set('todos');
    this.searchTerm.set('');
  }

  openNewResourceModal(): void {
    this.selectedTags.set([]);
    this.newCustomTagInput.set('');
    this.currentResourceType.set('consumible');
    this.initialPerishableLot = {
      resource_id: 0,
      lot_number: 'Lote 01',
      quantity: 1,
      received_at: this.getTodayDateString(),
      expires_at: '',
      notes: 'Lote inicial de ingreso obligatorio'
    };
    this.newResource = {
      name: '',
      internal_name: '' ,
      resource_type: 'consumible',
      unit: 'unidades',
      cost_cents: 100, // $1.00 por defecto para evitar 0 centavos
      capacity_per_week: 0,
      description: '',
      tags: []
    };
    this.showNewResourceModal.set(true);
  }

  onResourceTypeSelect(type: string): void {
    this.newResource.resource_type = type;
    this.currentResourceType.set(type);

    // Ajustar la unidad por defecto si la actual no pertenece a las opciones disponibles
    const validUnits = this.currentUnitOptions().map(o => o.value);
    if (!validUnits.includes(this.newResource.unit)) {
      this.newResource.unit = validUnits[0] || 'unidades';
    }
  }

  onUnitSelect(unit: string): void {
    this.newResource.unit = unit;
  }

  openEditResourceModal(resource?: Resource): void {
    const target = resource || this.selectedResource();
    if (!target) return;

    this.selectedTags.set(target.tags ? [...target.tags] : []);
    this.newCustomTagInput.set('');
    this.currentResourceType.set(target.resource_type);
    this.newResource = {
      name: target.name,
      internal_name: target.internal_name,
      resource_type: target.resource_type,
      unit: target.unit,
      cost_cents: target.cost_cents,
      capacity_per_week: target.capacity_per_week || 0,
      description: target.description || '',
      tags: target.tags || []
    };
    this.showEditResourceModal.set(true);
  }

  updateResource(): void {
    const current = this.selectedResource();
    if (!current || !this.newResource.name.trim()) return;

    this.newResource.tags = [...this.selectedTags()];

    this.inventoryService.updateResource(current.id, this.newResource).subscribe({
      next: (updated) => {
        this.showToast("success", "Recurso actualizado", `Se guardaron los cambios de ${updated.name}`);
        this.showEditResourceModal.set(false);
        this.loadResources();
      },
      error: (err) => {
        this.showToast("error", "Error al actualizar", err?.error?.message || "No se pudo actualizar el recurso");
      }
    });
  }

  deleteResource(resource?: Resource): void {
    const target = resource || this.selectedResource();
    if (!target) return;

    this.askConfirm({
      title: `¿Eliminar "${target.name}"?`,
      message: "El recurso será desactivado del taller y ya no estará disponible para nuevos encargos.",
      confirmText: "Sí, dar de baja",
      cancelText: "Cancelar",
      isDestructive: true,
      onConfirm: () => {
        this.inventoryService.deleteResource(target.id).subscribe({
          next: () => {
            this.showToast("success", "Recurso eliminado", `"${target.name}" fue dado de baja correctamente.`);
            // Si el recurso eliminado estaba seleccionado o abierto en el drawer, cerrar el panel con animación
            if (this.selectedResourceId() === target.id) {
              this.selectedResourceId.set(null);
              this.closeInspector();
            }
            this.loadResources();
          },
          error: (err) => {
            this.showToast("error", "Error al eliminar", err?.error?.message || "No se pudo eliminar el recurso");
          }
        });
      }
    });
  }

  private extractErrorMessage(err: any, defaultMsg: string): string {
    if (!err) return defaultMsg;
    if (err.error?.errors) {
      const errObj = err.error.errors;
      if (typeof errObj === 'object') {
        const details = Object.entries(errObj)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        if (details) return `${err.error.message || defaultMsg} (${details})`;
      }
    }
    return err.error?.message || err.message || defaultMsg;
  }

  saveResource(): void {
    if (!this.newResource.name.trim()) {
      this.showToast("warning", "Nombre requerido", "Por favor ingresa un nombre para el recurso.");
      return;
    }

    // Asegurar que internal_name no esté vacío y tenga formato correcto
    let internalName = (this.newResource.internal_name || '').trim().toLowerCase();
    if (!internalName) {
      internalName = this.newResource.name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
      if (!internalName) {
        internalName = `rec_${Date.now()}`;
      }
      this.newResource.internal_name = internalName;
    } else {
      internalName = internalName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_]/g, "_");
      this.newResource.internal_name = internalName;
    }

    // Validar costo unitario mínimo
    if (!this.newResource.cost_cents || this.newResource.cost_cents <= 0) {
      this.newResource.cost_cents = 100; // Por defecto $1.00 (100 centavos) para cumplir la regla de costo > 0
    }

    // Si es perecedero, obligatoriamente se debe definir lote con fecha de caducidad
    if (this.newResource.resource_type === 'perecedero') {
      if (!this.initialPerishableLot.lot_number?.trim()) {
        this.showToast("warning", "Lote requerido", "Debes ingresar un código de lote para el recurso perecedero.");
        return;
      }
      if (!this.initialPerishableLot.quantity || this.initialPerishableLot.quantity <= 0) {
        this.showToast("warning", "Cantidad requerida", "La cantidad del lote inicial debe ser mayor a 0.");
        return;
      }
      if (!this.initialPerishableLot.expires_at || !this.initialPerishableLot.expires_at.trim()) {
        this.showToast("warning", "Fecha requerida", "La fecha de caducidad es obligatoria para recursos perecederos.");
        return;
      }
      if (this.initialPerishableLot.received_at && this.initialPerishableLot.expires_at <= this.initialPerishableLot.received_at) {
        this.showToast("warning", "Fecha inválida", "La fecha de caducidad debe ser posterior a la fecha de ingreso del lote.");
        return;
      }
    }

    this.newResource.tags = [...this.selectedTags()];

    this.inventoryService.createResource(this.newResource).subscribe({
      next: (created) => {
        // Si es perecedero, registrar automáticamente el lote inicial obligatorio
        if (created.resource_type === 'perecedero') {
          const lotPayload: NewResourceLot = {
            resource_id: created.id,
            lot_number: (this.initialPerishableLot.lot_number || 'Lote 01').trim(),
            quantity: Number(this.initialPerishableLot.quantity) || 1,
            received_at: this.initialPerishableLot.received_at || this.getTodayDateString(),
            expires_at: (this.initialPerishableLot.expires_at || '').trim(),
            notes: this.initialPerishableLot.notes?.trim() || 'Lote inicial registrado al crear perecedero'
          };

          this.inventoryService.createResourceLot(lotPayload).subscribe({
            next: (lot) => {
              this.showToast(
                "success",
                "Perecedero y lote registrados",
                `Se creó "${created.name}" con su lote inicial "${lot.lot_number}" (${lot.quantity} ${created.unit}).`
              );
              this.showNewResourceModal.set(false);
              this.loadResources();
            },
            error: (lotErr) => {
              this.showToast(
                "warning",
                "Recurso creado, error en lote",
                `El recurso se creó, pero falló el lote: ${this.extractErrorMessage(lotErr, "Revisa el lote en el inventario")}`
              );
              this.showNewResourceModal.set(false);
              this.loadResources();
            }
          });
        } else {
          this.showToast("success", "Recurso registrado", `Se agregó "${created.name}" al inventario`);
          this.showNewResourceModal.set(false);
          this.loadResources();
        }
      },
      error: (err) => {
        this.showToast("error", "Error al registrar", this.extractErrorMessage(err, "No se pudo guardar el recurso en el servidor"));
      }
    });
  }

  openNewLotModal(): void {
    const res = this.selectedResource();
    const currentType = res ? res.resource_type : 'todos';
    this.lotResourceType.set(currentType);
    this.editingLotId.set(null);
    this.newLot = {
      resource_id: res ? res.id : (this.resources()[0]?.id || 0),
      lot_number: `Lote ${String(this.lots().length + 1).padStart(2, '0')}`,
      quantity: 1,
      received_at: this.getTodayDateString(),
      expires_at: '',
      notes: ''
    };
    this.showNewLotModal.set(true);
  }

  openEditLotModal(lot: ResourceLot): void {
    this.editingLotId.set(lot.id);
    this.newLot = {
      resource_id: lot.resource_id,
      lot_number: lot.lot_number,
      quantity: lot.quantity,
      received_at: lot.received_at ? lot.received_at.slice(0, 10) : this.getTodayDateString(),
      expires_at: lot.expires_at ? lot.expires_at.slice(0, 10) : '',
      notes: lot.notes || ''
    };
    this.showEditLotModal.set(true);
  }

  isResourcePerishable(resourceId?: number): boolean {
    const targetId = resourceId || this.newLot.resource_id;
    const res = this.resources().find(r => r.id === targetId) || this.selectedResource();
    return res?.resource_type === 'perecedero';
  }

  updateLot(): void {
    const lotId = this.editingLotId();
    if (!lotId) return;

    if (this.isResourcePerishable(this.newLot.resource_id)) {
      if (!this.newLot.expires_at || !this.newLot.expires_at.trim()) {
        this.showToast("warning", "Fecha requerida", "La fecha de caducidad es obligatoria para recursos perecederos.");
        return;
      }

      if (this.newLot.received_at && this.newLot.expires_at <= this.newLot.received_at) {
        this.showToast("warning", "Fecha inválida", "La fecha de caducidad debe ser posterior a la fecha de ingreso.");
        return;
      }
    }

    this.inventoryService.updateResourceLot(lotId, {
      lot_number: this.newLot.lot_number,
      quantity: this.newLot.quantity,
      received_at: this.newLot.received_at,
      expires_at: this.newLot.expires_at || undefined,
      notes: this.newLot.notes
    }).subscribe({
      next: (lot) => {
        this.showToast("success", "Lote actualizado", `Se guardaron los cambios del lote ${lot.lot_number}`);
        this.showEditLotModal.set(false);
        const currentRes = this.selectedResource();
        if (currentRes) {
          this.selectResource(currentRes);
          this.loadResources();
        }
      },
      error: (err) => {
        this.showToast("error", "Error al actualizar lote", err?.error?.message || "No se pudo actualizar el lote");
      }
    });
  }

  onLotResourceTypeChange(type: string): void {
    this.lotResourceType.set(type);
    const available = this.filteredResourcesForLot();
    if (available.length > 0) {
      this.newLot.resource_id = available[0].id;
    }
  }

  onLotResourceSelect(resourceIdStr: string): void {
    this.newLot.resource_id = Number(resourceIdStr) || 0;
  }

  saveLot(): void {
    const targetResourceId = this.newLot.resource_id;
    const res = this.resources().find(r => r.id === targetResourceId) || this.selectedResource();
    if (!res) return;

    if (res.resource_type === 'perecedero') {
      if (!this.newLot.expires_at || !this.newLot.expires_at.trim()) {
        this.showToast("warning", "Fecha requerida", "La fecha de caducidad es obligatoria para recursos perecederos.");
        return;
      }

      if (this.newLot.received_at && this.newLot.expires_at <= this.newLot.received_at) {
        this.showToast("warning", "Fecha inválida", "La fecha de caducidad debe ser posterior a la fecha de ingreso.");
        return;
      }
    }

    this.inventoryService.createResourceLot(this.newLot).subscribe({
      next: (lot) => {
        this.showToast("success", "Lote registrado", `Se añadió ${lot.lot_number} con ${lot.quantity} ${res.unit}`);
        this.showNewLotModal.set(false);
        this.selectResource(res);
        this.loadResources();
      },
      error: (err) => {
        this.showToast("error", "Error al registrar lote", err?.error?.message || "No se pudo registrar el lote");
      }
    });
  }

  deleteLot(lotId: number): void {
    this.askConfirm({
      title: "¿Eliminar este lote?",
      message: "Esta acción dará de baja las unidades registradas en este lote de producción.",
      confirmText: "Sí, dar de baja",
      cancelText: "Cancelar",
      isDestructive: true,
      onConfirm: () => {
        this.inventoryService.deleteResourceLot(lotId).subscribe({
          next: () => {
            this.lots.update(l => l.filter(item => item.id !== lotId));
            const currentRes = this.selectedResource();
            if (currentRes) {
              this.loadResources();
            }
            this.showToast("success", "Lote eliminado", "El lote fue retirado del inventario.");
          },
          error: (err) => {
            this.showToast("error", "Error al eliminar lote", err?.error?.message || "No se pudo eliminar el lote");
          }
        });
      }
    });
  }

  formatCurrency(cents?: number): string {
    if (cents === undefined || cents === null) return '0,00 $';
    const amount = (cents / 100).toFixed(2).replace('.', ',');
    return `${amount} $`;
  }

  getStatusClass(item: Resource): { text: string; dot: string; label: string } {
    if (item.available_stock <= 0) {
      return { text: 'rc__status--empty', dot: 'rc__status-dot--empty', label: 'Agotado' };
    }
    return { text: 'rc__status--active', dot: 'rc__status-dot--active', label: 'Disponible' };
  }

  private getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  
  showToast(type: "success" | "error" | "warning" | "info", title: string, message?: string, durationMs = 3500): void {
    const id = ++this.toastCounter;
    this.toasts.update(current => [...current, { id, type, title, message }]);
    if (durationMs > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, durationMs);
    }
  }

  removeToast(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  askConfirm(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }): void {
    this.confirmModal.set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || "Confirmar",
      cancelText: options.cancelText || "Cancelar",
      isDestructive: options.isDestructive ?? true,
      action: options.onConfirm
    });
  }

  closeConfirm(): void {
    this.confirmModal.update(modal => ({ ...modal, isOpen: false, action: undefined }));
  }

  executeConfirm(): void {
    const action = this.confirmModal().action;
    this.closeConfirm();
    if (action) {
      action();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
