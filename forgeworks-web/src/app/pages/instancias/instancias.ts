import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface InstanceItem {
  id: number;
  code: string;
  client: string;
  product: string;
  quote_cents: number;
  status: 'Cotización' | 'Producción' | 'Completado';
  resources_status: string;
  current_step: string;
  total_steps: number;
  completed_steps: number;
  sse_connected: boolean;
  reserved_resources: { name: string; quantity: string; lot: string }[];
  events: { time: string; text: string }[];
}

@Component({
  selector: 'app-instancias',
  imports: [FormsModule],
  templateUrl: './instancias.html',
  styleUrl: './instancias.css'
})
export class Instancias {
  searchTerm = signal<string>('');
  selectedTab = signal<string>('todos');

  instances = signal<InstanceItem[]>([
    {
      id: 1,
      code: 'ENC-2024-001',
      client: 'Sofía Mendoza',
      product: 'Mesa Comedor Ébano & Latón',
      quote_cents: 42000,
      status: 'Producción',
      resources_status: 'Reservados',
      current_step: 'Ensamblado de espigas de latón',
      total_steps: 12,
      completed_steps: 8,
      sse_connected: true,
      reserved_resources: [
        { name: 'Roble curado', quantity: '4 m', lot: 'Lote 01' },
        { name: 'Espigas de latón 8mm', quantity: '16 uds', lot: 'Lote 03' },
        { name: 'Aceite de linaza', quantity: '0.5 L', lot: 'Lote 01' }
      ],
      events: [
        { time: '14:32', text: 'Reserva firme de recursos confirmada (SELECT FOR UPDATE)' },
        { time: '12:15', text: 'Cliente completó selección de acabado rústico' },
        { time: '10:00', text: 'Instancia iniciada desde catálogo público' }
      ]
    },
    {
      id: 2,
      code: 'ENC-2024-002',
      client: 'Carlos Ruiz',
      product: 'Ramo Silvestre de Rosas Rojas',
      quote_cents: 5200,
      status: 'Cotización',
      resources_status: 'Verificando',
      current_step: 'Selección de flores de temporada',
      total_steps: 6,
      completed_steps: 3,
      sse_connected: true,
      reserved_resources: [
        { name: 'Rosas rojas', quantity: '12 tallos', lot: 'Lote 01 (FIFO)' }
      ],
      events: [
        { time: '15:10', text: 'Reencaminamiento en caliente: rosas rojas asignadas por prioridad FIFO' },
        { time: '14:50', text: 'Cliente inició personalización' }
      ]
    },
    {
      id: 3,
      code: 'ENC-2024-003',
      client: 'Valeria Gómez',
      product: 'Jarrón Esculpido Terracota',
      quote_cents: 7500,
      status: 'Producción',
      resources_status: 'Asignados',
      current_step: 'Secado y preparación para horneado',
      total_steps: 8,
      completed_steps: 6,
      sse_connected: true,
      reserved_resources: [
        { name: 'Cera de abeja pura bio', quantity: '0.4 kg', lot: 'Lote 02' }
      ],
      events: [
        { time: '11:20', text: 'Pieza torneada exitosamente' },
        { time: '09:00', text: 'Presupuesto congelado con hash SHA' }
      ]
    },
    {
      id: 4,
      code: 'ENC-2024-004',
      client: 'Esteban Paredes',
      product: 'Candelabro Forjado a Mano',
      quote_cents: 5800,
      status: 'Completado',
      resources_status: 'Despachado',
      current_step: 'Entrega finalizada',
      total_steps: 5,
      completed_steps: 5,
      sse_connected: false,
      reserved_resources: [
        { name: 'Hierro forjado en barra', quantity: '2 m', lot: 'Lote 01' }
      ],
      events: [
        { time: 'Ayer', text: 'Encargo marcado como finalizado y retirado por el cliente' }
      ]
    }
  ]);

  selectedInstanceId = signal<number>(1);
  showNewInstanceModal = signal<boolean>(false);

  newClientName = signal<string>('');
  newProductSelected = signal<string>('Mesa Comedor Ébano & Latón');

  selectedInstance = computed(() => {
    const list = this.instances();
    const id = this.selectedInstanceId();
    return list.find(i => i.id === id) || list[0];
  });

  filteredInstances = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const tab = this.selectedTab();

    return this.instances().filter(item => {
      const matchesTab =
        tab === 'todos' ||
        (tab === 'cotización' && item.status === 'Cotización') ||
        (tab === 'producción' && item.status === 'Producción') ||
        (tab === 'completados' && item.status === 'Completado');

      if (!matchesTab) return false;

      if (!query) return true;
      return (
        item.client.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.product.toLowerCase().includes(query)
      );
    });
  });

  selectInstance(inst: InstanceItem): void {
    this.selectedInstanceId.set(inst.id);
  }

  setTab(tab: string): void {
    this.selectedTab.set(tab);
  }

  openNewInstanceModal(): void {
    this.newClientName.set('');
    this.newProductSelected.set('Mesa Comedor Ébano & Latón');
    this.showNewInstanceModal.set(true);
  }

  saveInstance(): void {
    const client = this.newClientName().trim();
    if (!client) return;

    const newInst: InstanceItem = {
      id: Date.now(),
      code: 'ENC-2024-00' + (this.instances().length + 1),
      client,
      product: this.newProductSelected(),
      quote_cents: 35000,
      status: 'Cotización',
      resources_status: 'Verificando',
      current_step: 'Nodo Inicio: Selección de opciones',
      total_steps: 10,
      completed_steps: 1,
      sse_connected: true,
      reserved_resources: [],
      events: [
        { time: 'Recién', text: 'Encargo creado para ' + client }
      ]
    };

    this.instances.update(list => [newInst, ...list]);
    this.selectInstance(newInst);
    this.showNewInstanceModal.set(false);

    Swal.fire({
      icon: 'success',
      title: 'Encargo iniciado',
      text: `Se abrió el encargo ${newInst.code} en tiempo real`,
      timer: 1800,
      showConfirmButton: false
    });
  }

  formatCurrency(cents: number): string {
    const euros = (cents / 100).toFixed(2).replace('.', ',');
    return `${euros} €`;
  }
}
