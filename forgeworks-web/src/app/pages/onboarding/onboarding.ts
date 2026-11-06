import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, SignUpPayload, WorkshopPayload } from '../../core/services/auth.service';
import { CountryItem, LocationService, StateItem } from '../../core/services/location.service';
import { IdentificationValidator } from '../../core/utils/identification-validator';

export interface CategoryGroup {
  group: string;
  items: string[];
}

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule, RouterLink],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // paso actual: 1 (titular), 2 (taller), 3 (oficio)
  currentStep = signal<1 | 2 | 3>(1);

  // estados de carga y error
  loading = signal(false);
  errorMessage = signal('');

  // paso 1: datos del artesano titular
  name = signal('');
  email = signal('');
  password = signal('');
  showPassword = signal(false);

  // paso 2: datos del taller y ubicacion en cascada con CountriesNow API
  private locationService = inject(LocationService);
  workshopName = signal('');
  idGov = signal('');

  countries = signal<CountryItem[]>([]);
  states = signal<StateItem[]>([]);
  cities = signal<string[]>([]);

  selectedCountry = signal<string>('Ecuador');
  selectedState = signal<string>('Azuay Province');
  selectedCity = signal<string>('Cuenca');

  // ubicacion consolidada reactiva (Ciudad, Provincia, Pais)
  location = computed(() => {
    const c = this.selectedCountry();
    const stObj = this.states().find(s => s.name === this.selectedState());
    const s = stObj ? stObj.displayName : this.selectedState().replace(/\s+(Province|Department)$/i, '');
    const ci = this.selectedCity();
    if (ci && s && c) return `${ci}, ${s}, ${c}`;
    if (s && c) return `${s}, ${c}`;
    return c || '';
  });

  // paso 3: categorias artesanales con dropdown en cascada
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

  selectedSector = signal<string>('Maderas y Mobiliario');

  availableCategories = computed(() => {
    const grp = this.categoryGroups.find(g => g.group === this.selectedSector());
    return grp ? grp.items : [];
  });

  selectedCategory = signal<string>('Carpintería y Ebanistería');

  ngOnInit(): void {
    this.loadCountries();
    this.loadStates('Ecuador');

    // si el usuario ya esta autenticado, cargamos su perfil y avanzamos al paso 2
    const profile = this.authService.getUserProfile();
    if (profile && profile.email) {
      this.name.set(profile.name || '');
      this.email.set(profile.email || '');
      if (profile.workshop_id) {
        this.router.navigate(['/recursos']);
      } else {
        this.currentStep.set(2);
      }
    }
  }

  // cargar paises desde CountriesNow API
  private loadCountries(): void {
    this.locationService.getCountries().subscribe(list => {
      this.countries.set(list);
    });
  }

  // cargar provincias segun el pais seleccionado
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

  // cargar ciudades segun la provincia seleccionada
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

  // manejadores de cambio en cascada para ubicacion
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

  // cambio en el dropdown 1 (sector) actualiza en cascada el dropdown 2 (oficio)
  onSectorChange(newSector: string): void {
    this.selectedSector.set(newSector);
    const available = this.availableCategories();
    if (available.length > 0) {
      this.selectedCategory.set(available[0]);
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  // avanzar al siguiente paso con validaciones sobrias
  nextStep(): void {
    this.errorMessage.set('');

    if (this.currentStep() === 1) {
      if (!this.name().trim()) {
        this.errorMessage.set('Ingresa el nombre del titular');
        return;
      }
      if (!this.email().trim()) {
        this.errorMessage.set('Ingresa un correo electrónico');
        return;
      }
      if (!this.password() || this.password().length < 6) {
        this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      this.currentStep.set(2);
      return;
    }

    if (this.currentStep() === 2) {
      if (!this.workshopName().trim()) {
        this.errorMessage.set('Ingresa el nombre del taller');
        return;
      }
      const validation = IdentificationValidator.validate(this.idGov());
      if (!validation.valid) {
        this.errorMessage.set(validation.message || 'Cédula o RUC no válido');
        return;
      }
      if (!this.location().trim()) {
        this.errorMessage.set('Ingresa la ciudad o ubicación');
        return;
      }
      this.currentStep.set(3);
      return;
    }
  }

  // retroceder al paso anterior
  prevStep(): void {
    this.errorMessage.set('');
    if (this.currentStep() === 3) {
      this.currentStep.set(2);
    } else if (this.currentStep() === 2) {
      // si ya estaba logueado antes de entrar, no puede volver al paso 1
      if (!this.authService.isLoggedIn()) {
        this.currentStep.set(1);
      }
    }
  }

  // finalizar creacion del taller
  submit(): void {
    this.errorMessage.set('');
    this.loading.set(true);

    const workshopData: WorkshopPayload = {
      name: this.workshopName().trim(),
      id_gov: this.idGov().trim(),
      category: this.selectedCategory(),
      location: this.location().trim()
    };

    if (this.authService.isLoggedIn()) {
      // usuario ya autenticado: crear taller directamente
      this.authService.createWorkshop(workshopData).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/recursos']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.error?.message || err.error?.errors?.id_gov?.[0] || 'Error al crear el taller';
          this.errorMessage.set(msg);
        }
      });
    } else {
      // nuevo usuario: registrar cuenta y taller en flujo continuo
      const userData: SignUpPayload = {
        email: this.email().trim(),
        password: this.password(),
        password_confirmation: this.password(),
        name: this.name().trim()
      };

      this.authService.registerWorkshop(userData, workshopData).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/recursos']);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 422) {
            const msg = err.error?.message || err.error?.errors?.id_gov?.[0] || err.error?.errors?.email?.[0] || 'Datos no válidos';
            this.errorMessage.set(msg);
          } else {
            this.errorMessage.set('Error al registrar el taller');
          }
        }
      });
    }
  }
}

