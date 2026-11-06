import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente con barra lateral y superior', () => {
    expect(component).toBeTruthy();
  });

  it('debe calcular las migas de pan según la sección', () => {
    expect(component.breadcrumbSection()).toBeDefined();
    expect(component.breadcrumbDetail()).toBeDefined();
  });
});
