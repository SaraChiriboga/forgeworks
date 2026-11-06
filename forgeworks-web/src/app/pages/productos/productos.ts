import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';

interface ProductItem {
  id: number;
  code: string;
  name: string;
  category: string;
  versions_count: number;
  base_price_cents: number;
  steps_count: number;
  status: string;
  description: string;
  versions: { version: string; sha: string; published_at: string; is_active: boolean }[];
}

@Component({
  selector: 'app-productos',
  imports: [FormsModule, RouterLink],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos {
  private authService = inject(AuthService);

  // estado de productos
  searchTerm = signal<string>('');
  selectedTab = signal<string>('todos');

  products = signal<ProductItem[]>([
    {
      id: 1,
      code: 'PRD-0101',
      name: 'Mesa Comedor Ébano & Latón',
      category: 'Mobiliario',
      versions_count: 4,
      base_price_cents: 34000,
      steps_count: 12,
      status: 'Publicado',
      description: 'Mesa configurable con tablero de madera curada y ensambles de latón macizo',
      versions: [
        { version: 'v2.1', sha: 'a89f3e1b', published_at: '01/11/2024', is_active: true },
        { version: 'v2.0', sha: 'e45c719d', published_at: '15/10/2024', is_active: false },
        { version: 'v1.0', sha: 'f120aa44', published_at: '01/09/2024', is_active: false }
      ]
    },
    {
      id: 2,
      code: 'PRD-0202',
      name: 'Ramo Silvestre de Rosas Rojas',
      category: 'Floristería',
      versions_count: 2,
      base_price_cents: 4500,
      steps_count: 6,
      status: 'Publicado',
      description: 'Arreglo floral botánico con rosas de temporada y follaje seco',
      versions: [
        { version: 'v1.2', sha: 'c771aa90', published_at: '28/10/2024', is_active: true },
        { version: 'v1.0', sha: 'd998bb12', published_at: '10/10/2024', is_active: false }
      ]
    },
    {
      id: 3,
      code: 'PRD-0303',
      name: 'Jarrón Esculpido Terracota',
      category: 'Cerámica',
      versions_count: 3,
      base_price_cents: 6500,
      steps_count: 8,
      status: 'Publicado',
      description: 'Pieza de torno con esmaltado mineral de doble quema',
      versions: [
        { version: 'v3.0', sha: '88bc34fa', published_at: '03/11/2024', is_active: true }
      ]
    },
    {
      id: 4,
      code: 'PRD-0104',
      name: 'Silla de Cuero y Roble Macizo',
      category: 'Mobiliario',
      versions_count: 1,
      base_price_cents: 18000,
      steps_count: 10,
      status: 'Borrador',
      description: 'Asiento ergonómico con cuero vegetal y ensambles a cola de milano',
      versions: [
        { version: 'v0.9', sha: '99e4cc11', published_at: 'En edición', is_active: false }
      ]
    },
    {
      id: 5,
      code: 'PRD-0401',
      name: 'Candelabro Forjado a Mano',
      category: 'Forja',
      versions_count: 2,
      base_price_cents: 5500,
      steps_count: 5,
      status: 'Publicado',
      description: 'Hierro forjado en yunque con pátina de cera de abeja natural',
      versions: [
        { version: 'v1.1', sha: '33e1ff28', published_at: '20/10/2024', is_active: true }
      ]
    }
  ]);

  selectedProductId = signal<number>(1);
  showNewProductModal = signal<boolean>(false);

  newProductName = signal<string>('');
  newProductCategory = signal<string>('Mobiliario');
  newProductBasePrice = signal<number>(120);

  selectedProduct = computed(() => {
    const list = this.products();
    const id = this.selectedProductId();
    return list.find(p => p.id === id) || list[0];
  });

  filteredProducts = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const tab = this.selectedTab();

    return this.products().filter(p => {
      const matchesTab =
        tab === 'todos' ||
        (tab === 'mobiliario' && p.category.toLowerCase() === 'mobiliario') ||
        (tab === 'floristería' && p.category.toLowerCase() === 'floristería') ||
        (tab === 'cerámica' && p.category.toLowerCase() === 'cerámica');

      if (!matchesTab) return false;

      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    });
  });

  selectProduct(prod: ProductItem): void {
    this.selectedProductId.set(prod.id);
  }

  setTab(tab: string): void {
    this.selectedTab.set(tab);
  }

  openNewProductModal(): void {
    this.newProductName.set('');
    this.newProductCategory.set('Mobiliario');
    this.newProductBasePrice.set(150);
    this.showNewProductModal.set(true);
  }

  saveProduct(): void {
    const name = this.newProductName().trim();
    if (!name) return;

    const newProd: ProductItem = {
      id: Date.now(),
      code: 'PRD-0' + Math.floor(100 + Math.random() * 900),
      name,
      category: this.newProductCategory(),
      versions_count: 1,
      base_price_cents: Math.round(this.newProductBasePrice() * 100),
      steps_count: 6,
      status: 'Borrador',
      description: 'Nuevo producto artesanal configurable',
      versions: [
        { version: 'v0.1', sha: 'b' + Math.random().toString(16).slice(2, 8), published_at: 'Borrador', is_active: true }
      ]
    };

    this.products.update(list => [newProd, ...list]);
    this.selectProduct(newProd);
    this.showNewProductModal.set(false);

    Swal.fire({
      icon: 'success',
      title: 'Producto creado',
      text: `Se inició el modelado de ${newProd.name}`,
      timer: 1800,
      showConfirmButton: false
    });
  }

  formatCurrency(cents: number): string {
    const euros = (cents / 100).toFixed(2).replace('.', ',');
    return `${euros} €`;
  }

  logout(): void {
    this.authService.logout();
  }
}

