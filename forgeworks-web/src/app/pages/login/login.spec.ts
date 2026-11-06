import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Login } from './login';
import { IdentificationValidator } from '../../core/utils/identification-validator';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have workshop and client account types with varied categories', () => {
    expect(component.accountType()).toBe('client');
    expect(component.categoryGroups.length).toBeGreaterThanOrEqual(7);

    // contar total de categorias disponibles en todos los grupos
    const totalCategories = component.categoryGroups.reduce((acc, g) => acc + g.items.length, 0);
    expect(totalCategories).toBeGreaterThanOrEqual(20);

    // cambiar a modo cliente
    component.setAccountType('client');
    expect(component.accountType()).toBe('client');
  });

  it('should update available categories dynamically when sector changes (cascading dropdown)', () => {
    component.onSectorChange('Metales, Forja y Joyería');
    expect(component.selectedSector()).toBe('Metales, Forja y Joyería');
    expect(component.availableCategories()).toContain('Herrería y Forja Artística');
    expect(component.workshopCategory).toBe('Herrería y Forja Artística');
  });

  it('should validate ecuadorian identification correctly', () => {
    // RUC valido registrado en el sistema
    expect(IdentificationValidator.isValid('1316109626001')).toBe(true);
    // Cedula valida de Pichincha
    expect(IdentificationValidator.isValid('1710034065')).toBe(true);
    // Cadena invalida o incompleta
    expect(IdentificationValidator.isValid('12345')).toBe(false);
    expect(IdentificationValidator.isValid('abcdefghij')).toBe(false);
  });
});
