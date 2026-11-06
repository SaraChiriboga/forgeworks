import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Recursos } from './recursos';

describe('Recursos', () => {
  let component: Recursos;
  let fixture: ComponentFixture<Recursos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recursos],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(Recursos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe filtrar recursos por tab de categoría', () => {
    component.setTab('perecederos');
    expect(component.selectedTab()).toBe('perecederos');
    const filtered = component.filteredResources();
    expect(filtered.every(r => r.resource_type === 'perecedero')).toBe(true);
  });

  it('debe filtrar recursos por termino de busqueda', () => {
    component.searchTerm.set('roble');
    const filtered = component.filteredResources();
    expect(filtered.some(r => r.name.toLowerCase().includes('roble'))).toBe(true);
  });
});
