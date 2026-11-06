import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Instancias } from './instancias';

describe('Instancias', () => {
  let component: Instancias;
  let fixture: ComponentFixture<Instancias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Instancias],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Instancias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe filtrar instancias por tab de produccion', () => {
    component.setTab('producción');
    const filtered = component.filteredInstances();
    expect(filtered.every(i => i.status === 'Producción')).toBe(true);
  });
});

