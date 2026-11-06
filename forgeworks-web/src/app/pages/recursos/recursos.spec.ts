import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Recursos } from './recursos';
import { Resource } from '../../core/services/inventory.service';

describe('Recursos', () => {
  let component: Recursos;
  let fixture: ComponentFixture<Recursos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recursos],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Recursos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente con estado inicial vacio cuando no hay datos', () => {
    expect(component).toBeTruthy();
    expect(component.resources()).toEqual([]);
    expect(component.lots()).toEqual([]);
  });

  it('debe filtrar recursos por tab de categoría cuando existen recursos', () => {
    const mockResources: Resource[] = [
      {
        id: 1,
        workshop_id: 1,
        name: 'Madera de pino',
        internal_name: 'MAT-01',
        resource_type: 'consumible',
        unit: 'm',
        cost_cents: 1000,
        cost_dollars: 10,
        tags: [],
        is_active: true,
        available_stock: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        workshop_id: 1,
        name: 'Rosas blancas',
        internal_name: 'FLO-01',
        resource_type: 'perecedero',
        unit: 'tallos',
        cost_cents: 150,
        cost_dollars: 1.5,
        tags: [],
        is_active: true,
        available_stock: 30,
        created_at: new Date().toISOString()
      }
    ];

    component.resources.set(mockResources);
    component.setTab('perecederos');
    expect(component.selectedTab()).toBe('perecederos');
    const filtered = component.filteredResources();
    expect(filtered.length).toBe(1);
    expect(filtered[0].resource_type).toBe('perecedero');
    expect(filtered[0].name).toBe('Rosas blancas');
  });

  it('debe filtrar recursos por termino de busqueda dinamicamente', () => {
    const mockResources: Resource[] = [
      {
        id: 1,
        workshop_id: 1,
        name: 'Cedro aromático',
        internal_name: 'MAD-01',
        resource_type: 'consumible',
        unit: 'm',
        cost_cents: 2500,
        cost_dollars: 25,
        tags: [],
        is_active: true,
        available_stock: 8,
        created_at: new Date().toISOString()
      }
    ];

    component.resources.set(mockResources);
    component.searchTerm.set('cedro');
    const filtered = component.filteredResources();
    expect(filtered.some(r => r.name.toLowerCase().includes('cedro'))).toBe(true);

    component.searchTerm.set('inexistente');
    expect(component.filteredResources().length).toBe(0);
  });
});
