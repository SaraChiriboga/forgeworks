import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Onboarding } from './onboarding';

describe('Onboarding', () => {
  let component: Onboarding;
  let fixture: ComponentFixture<Onboarding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Onboarding],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Onboarding);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create onboarding component', () => {
    expect(component).toBeTruthy();
    expect(component.currentStep()).toBe(1);
  });

  it('should advance to step 2 only when step 1 fields are valid', () => {
    // vacio da error
    component.nextStep();
    expect(component.errorMessage()).toContain('nombre');
    expect(component.currentStep()).toBe(1);

    component.name.set('Sara Chiriboga');
    component.nextStep();
    expect(component.errorMessage()).toContain('correo');

    component.email.set('sara@forgeworks.com');
    component.password.set('123');
    component.nextStep();
    expect(component.errorMessage()).toContain('6 caracteres');

    component.password.set('secret123');
    component.nextStep();
    expect(component.errorMessage()).toBe('');
    expect(component.currentStep()).toBe(2);
  });

  it('should validate ecuadorian identification in step 2', () => {
    component.currentStep.set(2);
    component.workshopName.set('Taller Ébano');
    component.selectedCity.set('Cuenca');

    // cedula invalida
    component.idGov.set('1234567890');
    component.nextStep();
    expect(component.errorMessage()).toContain('no válido');
    expect(component.currentStep()).toBe(2);

    // cedula valida (algoritmo modulo 10)
    component.idGov.set('1316109626');
    component.nextStep();
    expect(component.errorMessage()).toBe('');
    expect(component.currentStep()).toBe(3);
  });

  it('should update location reactively from cascading dropdowns', () => {
    component.selectedCountry.set('Ecuador');
    component.selectedState.set('Azuay Province');
    component.selectedCity.set('Cuenca');
    expect(component.location()).toContain('Cuenca');
    expect(component.location()).toContain('Ecuador');
  });

  it('should cascade categories dynamically when sector changes', () => {
    component.currentStep.set(3);
    expect(component.selectedSector()).toBe('Maderas y Mobiliario');
    expect(component.selectedCategory()).toBe('Carpintería y Ebanistería');

    // cambiar a Flores, Botanica y Aromas
    component.onSectorChange('Flores, Botánica y Aromas');
    expect(component.selectedSector()).toBe('Flores, Botánica y Aromas');
    expect(component.availableCategories()).toContain('Floristería y Arte Botánico');
    expect(component.selectedCategory()).toBe('Floristería y Arte Botánico');
  });

  it('should allow stepping back', () => {
    component.currentStep.set(3);
    component.prevStep();
    expect(component.currentStep()).toBe(2);
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });
});
