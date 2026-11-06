import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Productos } from './productos';

describe('Productos', () => {
  let component: Productos;
  let fixture: ComponentFixture<Productos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Productos],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Productos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe seleccionar producto y actualizar ficha', () => {
    const list = component.products();
    if (list.length > 1) {
      component.selectProduct(list[1]);
      expect(component.selectedProduct().id).toBe(list[1].id);
    }
  });

  it('debe filtrar productos por tab', () => {
    component.setTab('mobiliario');
    const filtered = component.filteredProducts();
    expect(filtered.every(p => p.category.toLowerCase() === 'mobiliario')).toBe(true);
  });
});

