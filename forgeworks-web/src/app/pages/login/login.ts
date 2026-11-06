import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, SignUpPayload, WorkshopPayload } from '../../core/services/auth.service';
import { CountryItem, LocationService, StateItem } from '../../core/services/location.service';
import { IdentificationValidator } from '../../core/utils/identification-validator';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';

export interface CategoryGroup {
  group: string;
  items: string[];
}

@Component({
  imports: [FormsModule, DropdownComponent],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private locationService = inject(LocationService);

  // pestaña activa: login o registro
  activeTab = signal<'login' | 'register'>('login');

  // tipo de registro: 'workshop' (crear negocio/taller) o 'client' (cliente particular)
  accountType = signal<'workshop' | 'client'>('client');

  // paso actual en el onboarding progresivo de taller: 1 (titular), 2 (taller), 3 (oficio)
  currentStep = signal<1 | 2 | 3>(1);

  // visibilidad de contraseñas
  showPassword = signal(false);
  showRegisterPassword = signal(false);

  // estados de carga y mensajes para el usuario
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // campos para iniciar sesion
  loginEmail = '';
  loginPassword = '';

  // campos personales para crear cuenta
  registerName = '';
  registerLastName = '';
  registerPhone = '';
  registerEmail = '';
  registerPassword = '';

  // campos para dar de alta el taller / negocio
  workshopName = '';
  workshopIdGov = '';

  // validacion en vivo de cedula o ruc
  idGovValidation = computed<{ valid: boolean; message?: string; touched: boolean }>(() => {
    const raw = this.workshopIdGov;
    if (!raw) {
      return { valid: false, touched: false };
    }
    const res = IdentificationValidator.validate(raw);
    return { valid: res.valid, message: res.message, touched: true };
  });

  // ubicacion en cascada con CountriesNow API (Pais -> Provincia -> Ciudad)
  countries = signal<CountryItem[]>([]);
  states = signal<StateItem[]>([]);
  cities = signal<string[]>([]);
  selectedCountry = signal<string>('Ecuador');
  selectedState = signal<string>('Azuay Province');
  selectedCity = signal<string>('Cuenca');

  // ubicacion consolidada reactiva
  workshopLocationComputed = computed(() => {
    const c = this.selectedCountry();
    const stObj = this.states().find(s => s.name === this.selectedState());
    const s = stObj ? stObj.displayName : this.selectedState().replace(/\s+(Province|Department)$/i, '');
    const ci = this.selectedCity();
    if (ci && s && c) return `${ci}, ${s}, ${c}`;
    if (s && c) return `${s}, ${c}`;
    return c || '';
  });

  // opciones adaptadas para el dropdown de paises y estados
  countryOptions = computed<DropdownOption[]>(() => {
    return this.countries().map(c => ({ value: c.name, label: c.name }));
  });

  stateOptions = computed<DropdownOption[]>(() => {
    return this.states().map(s => ({ value: s.name, label: s.displayName }));
  });

  sectorOptions = computed<string[]>(() => {
    return this.categoryGroups.map(g => g.group);
  });

  // catalogo exhaustivo y variado de categorias artesanales para el dropdown en cascada
  readonly categoryGroups: CategoryGroup[] = [
    {
      group: 'Maderas y Mobiliario',
      items: [
        'Carpintería y Ebanistería',
        'Talla en Madera y Tornería',
        'Juguetería y Modelismo en Madera',
        'Restauración de Muebles Antiguos'
      ]
    },
    {
      group: 'Cerámica, Barro y Vidrio',
      items: [
        'Cerámica, Alfarería y Gres',
        'Modelado y Escultura en Barro',
        'Vidriería, Vitrales y Mosaicos',
        'Porcelana y Azulejería Artesanal'
      ]
    },
    {
      group: 'Metales, Forja y Joyería',
      items: [
        'Herrería y Forja Artística',
        'Cuchillería y Afilado Artesanal',
        'Joyería, Orfebrería y Platería',
        'Fundición y Metalistería Artística'
      ]
    },
    {
      group: 'Flores, Botánica y Aromas',
      items: [
        'Floristería y Arte Botánico',
        'Flores Preservadas y Ramos Secos',
        'Celería y Velas Botánicas',
        'Jabonería y Cosmética Natural'
      ]
    },
    {
      group: 'Textiles, Cuero y Fibras',
      items: [
        'Crochet, Macramé y Amigurumis',
        'Telar Artesanal y Tejidos',
        'Bordado Tradicional y Costura Creativa',
        'Costura y Sastrería a Medida',
        'Marroquinería y Talabartería (Cuero)',
        'Cestería y Fibras Naturales (Toquilla, Mimbre)'
      ]
    },
    {
      group: 'Papel, Arte y Música',
      items: [
        'Encuadernación y Papelería Fina',
        'Luthier e Instrumentos Musicales',
        'Caligrafía, Grabado y Serigrafía',
        'Restauración y Conservación de Arte'
      ]
    },
    {
      group: 'Gastronomía y Sabores Artesanales',
      items: [
        'Repostería y Pastelería de Autor',
        'Chocolatería y Confitería Fina',
        'Panadería Artesanal y Masa Madre'
      ]
    },
    {
      group: 'Otros Oficios',
      items: [
        'Otro Oficio o Taller Artesanal'
      ]
    }
  ];

  // dropdown 1 en cascada: sector artesanal
  selectedSector = signal<string>('Maderas y Mobiliario');

  // dropdown 2 en cascada: especialidad dependiente del sector elegido
  availableCategories = computed(() => {
    const grp = this.categoryGroups.find(g => g.group === this.selectedSector());
    return grp ? grp.items : [];
  });

  // categoria final seleccionada
  workshopCategory = 'Carpintería y Ebanistería';

  ngOnInit() {
    this.loadCountries();
    this.loadStates('Ecuador');

    // si la ruta es /onboarding, activar directamente el modo registro de taller
    if (this.router.url.includes('onboarding')) {
      this.activeTab.set('register');
      this.accountType.set('workshop');
      this.currentStep.set(1);
    }

    // si ya hay sesion activa, mandamos a la pantalla correspondiente
    if (this.authService.isLoggedIn()) {
      this.redirectAfterAuth();
    }
  }

  private loadCountries(): void {
    this.locationService.getCountries().subscribe(list => {
      this.countries.set(list);
    });
  }

  private loadStates(country: string): void {
    this.locationService.getStates(country).subscribe(states => {
      this.states.set(states);
      if (states.length > 0) {
        const def = states.find(s => s.name.toLowerCase().includes('azuay')) || states[0];
        this.selectedState.set(def.name);
        this.loadCities(country, def.name);
      } else {
        this.selectedState.set('');
        this.cities.set([]);
        this.selectedCity.set('');
      }
    });
  }

  private loadCities(country: string, state: string): void {
    this.locationService.getCities(country, state).subscribe(cities => {
      this.cities.set(cities);
      if (cities.length > 0) {
        const def = cities.find(c => c.toLowerCase() === 'cuenca') || cities[0];
        this.selectedCity.set(def);
      } else {
        this.selectedCity.set('');
      }
    });
  }

  onCountryChange(country: string): void {
    this.selectedCountry.set(country);
    this.loadStates(country);
  }

  onStateChange(state: string): void {
    this.selectedState.set(state);
    this.loadCities(this.selectedCountry(), state);
  }

  onCityChange(city: string): void {
    this.selectedCity.set(city);
  }

  // cambiar entre login y registro
  switchTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.currentStep.set(1);
  }

  // seleccionar tipo de cuenta en registro de forma natural e in-place
  setAccountType(type: 'workshop' | 'client') {
    this.accountType.set(type);
    this.errorMessage.set('');
    this.currentStep.set(1);
  }

  // avanzar paso en el onboarding de taller
  nextWorkshopStep(): void {
    this.errorMessage.set('');

    if (this.currentStep() === 1) {
      if (!this.registerName.trim()) {
        this.errorMessage.set('Ingresa el nombre del titular');
        return;
      }
      if (!this.registerEmail.trim()) {
        this.errorMessage.set('Ingresa un correo electrónico');
        return;
      }
      if (!this.registerPassword || this.registerPassword.length < 6) {
        this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      this.currentStep.set(2);
      return;
    }

    if (this.currentStep() === 2) {
      if (!this.workshopName.trim()) {
        this.errorMessage.set('Ingresa el nombre del taller');
        return;
      }
      const validation = IdentificationValidator.validate(this.workshopIdGov);
      if (!validation.valid) {
        this.errorMessage.set(validation.message || 'Cédula o RUC ecuatoriano no válido');
        return;
      }
      if (!this.workshopLocationComputed().trim()) {
        this.errorMessage.set('Selecciona la ubicación del taller');
        return;
      }
      this.currentStep.set(3);
      return;
    }
  }

  // retroceder paso en el onboarding de taller
  prevWorkshopStep(): void {
    this.errorMessage.set('');
    if (this.currentStep() === 3) {
      this.currentStep.set(2);
    } else if (this.currentStep() === 2) {
      this.currentStep.set(1);
    }
  }

  // cambio en el dropdown 1 que actualiza el dropdown 2 en cascada
  onSectorChange(newSector: string) {
    this.selectedSector.set(newSector);
    const available = this.availableCategories();
    if (available.length > 0) {
      this.workshopCategory = available[0];
    }
  }

  // alternar ver u ocultar contraseña
  togglePasswordVisibility(field: 'login' | 'reg') {
    if (field === 'login') {
      this.showPassword.update(v => !v);
    } else {
      this.showRegisterPassword.update(v => !v);
    }
  }

  // enviar formulario de login
  onSubmitLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage.set('Por favor ingresa tu correo y contraseña');
      return;
    }

    this.errorMessage.set('');
    this.loading.set(true);

    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.redirectAfterAuth();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Credenciales incorrectas o servidor no disponible');
        console.error(err);
      }
    });
  }

  // enviar formulario de registro
  onSubmitRegister() {
    // validaciones generales de cuenta
    if (!this.registerEmail.trim() || !this.registerPassword) {
      this.errorMessage.set('El correo y la contraseña son obligatorios');
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // si es cuenta de taller, validamos datos del negocio
    if (this.accountType() === 'workshop') {
      if (!this.workshopName.trim()) {
        this.errorMessage.set('Ingresa el nombre de tu taller o negocio');
        return;
      }

      if (!this.workshopLocationComputed().trim()) {
        this.errorMessage.set('Selecciona la ubicación de tu taller');
        return;
      }

      const idValidation = IdentificationValidator.validate(this.workshopIdGov);
      if (!idValidation.valid) {
        this.errorMessage.set(idValidation.message || 'Cédula o RUC ecuatoriano no válido');
        return;
      }
    }

    this.errorMessage.set('');
    this.loading.set(true);

    // separar nombre y apellido inteligentemente si no se especifico por separado
    const fullName = this.registerName.trim();
    let firstName = fullName;
    let lastName = this.registerLastName.trim();
    if (!lastName) {
      const parts = fullName.split(' ');
      if (parts.length > 1) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else {
        lastName = 'Artesano';
      }
    }
    const phone = this.registerPhone.trim() || '0990000000';

    const userPayload: SignUpPayload = {
      email: this.registerEmail.trim(),
      password: this.registerPassword,
      password_confirmation: this.registerPassword,
      name: firstName || (this.accountType() === 'workshop' ? this.workshopName.trim() : 'Cliente'),
      last_name: lastName,
      phone: phone
    };

    if (this.accountType() === 'workshop') {
      const workshopPayload: WorkshopPayload = {
        name: this.workshopName.trim(),
        id_gov: this.workshopIdGov.trim(),
        category: this.workshopCategory,
        location: this.workshopLocationComputed(),
        description: undefined
      };

      this.authService.registerWorkshop(userPayload, workshopPayload).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Taller registrado con éxito. Ingresando...');
          setTimeout(() => {
            this.redirectAfterAuth();
          }, 1200);
        },
        error: (err) => {
          this.loading.set(false);
          const serverMsg = err.error?.message || err.error?.details || err.error?.errors?.id_gov?.[0];
          if (serverMsg) {
            this.errorMessage.set(serverMsg);
          } else {
            this.errorMessage.set('Error al registrar el taller');
          }
          console.error(err);
        }
      });
    } else {
      // registro normal de cliente
      this.authService.signUp(userPayload).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Cuenta creada con éxito. Redirigiendo...');
          setTimeout(() => {
            this.redirectAfterAuth();
          }, 1200);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 422) {
            this.errorMessage.set('El correo ya está registrado o los datos no son válidos');
          } else {
            this.errorMessage.set('Ocurrió un error al registrar la cuenta');
          }
          console.error(err);
        }
      });
    }
  }

  // redirigir segun el rol del usuario o si tiene taller activo
  private redirectAfterAuth() {
    const profile = this.authService.getUserProfile();
    const role = (this.authService.getUserRole() || profile?.role || '').toLowerCase();

    if (profile?.workshop_id) {
      this.router.navigate(['/recursos']);
    } else if (role === 'admin') {
      this.router.navigate(['/users']);
    } else if (role === 'client') {
      this.router.navigate(['/cliente']);
    } else {
      this.router.navigate(['/recursos']);
    }
  }
}
