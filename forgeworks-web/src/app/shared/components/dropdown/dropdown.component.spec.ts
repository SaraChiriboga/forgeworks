import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownComponent } from './dropdown.component';

describe('DropdownComponent', () => {
  let component: DropdownComponent;
  let fixture: ComponentFixture<DropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle open/close state', () => {
    expect(component.isOpen()).toBe(false);
    component.toggle();
    expect(component.isOpen()).toBe(true);
    component.close();
    expect(component.isOpen()).toBe(false);
  });

  it('should select an option and emit selectionChange', () => {
    let emitted = '';
    component.selectionChange.subscribe((val) => (emitted = val));
    component.selectOption({ value: 'pichincha', label: 'Pichincha' });

    expect(component.value()).toBe('pichincha');
    expect(emitted).toBe('pichincha');
    expect(component.isOpen()).toBe(false);
  });

  it('should normalize string options properly', () => {
    fixture.componentRef.setInput('options', ['Opción 1', 'Opción 2']);
    fixture.detectChanges();

    const normalized = component.normalizedOptions();
    expect(normalized.length).toBe(2);
    expect(normalized[0].value).toBe('Opción 1');
    expect(normalized[0].label).toBe('Opción 1');
  });
});

