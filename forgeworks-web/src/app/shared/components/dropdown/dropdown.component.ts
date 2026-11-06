import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface DropdownOption {
  value: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true
    }
  ]
})
export class DropdownComponent implements ControlValueAccessor {
  // Inputs requeridos u opcionales
  id = input<string>('');
  placeholder = input<string>('Seleccione una opción...');
  disabled = input<boolean>(false);
  name = input<string>('');
  searchable = input<boolean>(false);
  searchPlaceholder = input<string>('Buscar...');
  
  // Opciones: acepta array de strings o array de objetos DropdownOption
  options = input<Array<string | DropdownOption>>([]);

  // Valor bidireccional con signal model
  value = model<string>('');

  // Evento al cambiar
  selectionChange = output<string>();

  // Estado interno de apertura, busqueda y direccion
  isOpen = signal<boolean>(false);
  openUpward = signal<boolean>(false);
  searchTerm = signal<string>('');

  // Normalizacion de opciones a objetos DropdownOption
  normalizedOptions = computed<DropdownOption[]>(() => {
    return this.options().map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  });

  // Opciones filtradas por el termino de busqueda
  filteredOptions = computed<DropdownOption[]>(() => {
    const list = this.normalizedOptions();
    const query = this.searchTerm().trim().toLowerCase();
    if (!this.searchable() || !query) {
      return list;
    }
    return list.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchSub = opt.subtitle ? opt.subtitle.toLowerCase().includes(query) : false;
      const matchVal = opt.value.toLowerCase().includes(query);
      return matchLabel || matchSub || matchVal;
    });
  });

  // Etiqueta de la opcion actualmente seleccionada
  selectedLabel = computed<string>(() => {
    const val = this.value();
    if (!val) return '';
    const match = this.normalizedOptions().find((opt) => opt.value === val);
    return match ? match.label : val;
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  toggle(): void {
    if (this.disabled()) return;
    const willOpen = !this.isOpen();
    if (willOpen) {
      this.searchTerm.set('');
      // calcular si hay espacio inferior suficiente dentro de la ventana/contenedor
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // si abajo queda menos de 200px y arriba hay mas espacio, desplegar hacia arriba
      this.openUpward.set(spaceBelow < 200 && rect.top > 200);
    }
    this.isOpen.set(willOpen);
    if (!willOpen) {
      this.onTouched();
    }
  }

  close(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.searchTerm.set('');
      this.onTouched();
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value || '');
  }

  selectOption(opt: DropdownOption, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (opt.disabled || this.disabled()) return;

    this.value.set(opt.value);
    this.onChange(opt.value);
    this.selectionChange.emit(opt.value);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close();
  }

  // Metodos de ControlValueAccessor
  writeValue(val: string): void {
    this.value.set(val || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Si viene de angular forms
  }
}

