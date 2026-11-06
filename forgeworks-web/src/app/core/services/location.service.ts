import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';

export interface CountryItem {
  name: string;
  iso2: string;
  iso3: string;
}

export interface StateItem {
  name: string;        // nombre exacto para enviar al API (ej: "Azuay Province")
  displayName: string; // nombre limpio para la UI (ej: "Azuay")
  code?: string;
}

interface CountriesResponse {
  error: boolean;
  msg: string;
  data: Array<{ name: string; Iso2: string; Iso3: string }>;
}

interface StatesResponse {
  error: boolean;
  msg: string;
  data: {
    name: string;
    iso3: string;
    states: Array<{ name: string; state_code: string }>;
  };
}

interface CitiesResponse {
  error: boolean;
  msg: string;
  data: string[];
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private baseUrl = 'https://countriesnow.space/api/v0.1/countries';

  // cache en memoria para evitar llamadas redundantes
  private countriesCache$?: Observable<CountryItem[]>;
  private statesCache = new Map<string, Observable<StateItem[]>>();
  private citiesCache = new Map<string, Observable<string[]>>();

  // fallback local para Ecuador en caso de fallo de red o modo offline
  private readonly ecuadorProvinces: StateItem[] = [
    { name: 'Azuay Province', displayName: 'Azuay' },
    { name: 'Bolívar Province', displayName: 'Bolívar' },
    { name: 'Cañar Province', displayName: 'Cañar' },
    { name: 'Carchi Province', displayName: 'Carchi' },
    { name: 'Chimborazo Province', displayName: 'Chimborazo' },
    { name: 'Cotopaxi Province', displayName: 'Cotopaxi' },
    { name: 'El Oro Province', displayName: 'El Oro' },
    { name: 'Esmeraldas Province', displayName: 'Esmeraldas' },
    { name: 'Galápagos Province', displayName: 'Galápagos' },
    { name: 'Guayas Province', displayName: 'Guayas' },
    { name: 'Imbabura Province', displayName: 'Imbabura' },
    { name: 'Loja Province', displayName: 'Loja' },
    { name: 'Los Ríos Province', displayName: 'Los Ríos' },
    { name: 'Manabí Province', displayName: 'Manabí' },
    { name: 'Morona-Santiago Province', displayName: 'Morona Santiago' },
    { name: 'Napo Province', displayName: 'Napo' },
    { name: 'Orellana Province', displayName: 'Orellana' },
    { name: 'Pastaza Province', displayName: 'Pastaza' },
    { name: 'Pichincha Province', displayName: 'Pichincha' },
    { name: 'Santa Elena Province', displayName: 'Santa Elena' },
    { name: 'Santo Domingo de los Tsáchilas Province', displayName: 'Santo Domingo' },
    { name: 'Sucumbíos Province', displayName: 'Sucumbíos' },
    { name: 'Tungurahua Province', displayName: 'Tungurahua' },
    { name: 'Zamora-Chinchipe Province', displayName: 'Zamora Chinchipe' }
  ];

  /**
   * Obtiene la lista de paises desde CountriesNow API con fallback local
   */
  getCountries(): Observable<CountryItem[]> {
    if (!this.countriesCache$) {
      this.countriesCache$ = this.http.get<CountriesResponse>(`${this.baseUrl}/iso`).pipe(
        map(res => {
          if (!res || !res.data) return this.defaultCountries();
          const list = res.data.map(c => ({
            name: c.name,
            iso2: c.Iso2,
            iso3: c.Iso3
          }));

          // colocar a Ecuador al inicio seguido del resto alfabeticamente
          return list.sort((a, b) => {
            if (a.name === 'Ecuador') return -1;
            if (b.name === 'Ecuador') return 1;
            return a.name.localeCompare(b.name);
          });
        }),
        catchError(() => of(this.defaultCountries())),
        shareReplay(1)
      );
    }
    return this.countriesCache$;
  }

  /**
   * Obtiene las provincias / estados de un pais determinado
   */
  getStates(country: string): Observable<StateItem[]> {
    const key = country.toLowerCase().trim();
    if (!this.statesCache.has(key)) {
      const obs$ = this.http.get<StatesResponse>(`${this.baseUrl}/states/q?country=${encodeURIComponent(country)}`).pipe(
        map(res => {
          if (!res || !res.data || !res.data.states || res.data.states.length === 0) {
            return key === 'ecuador' ? this.ecuadorProvinces : [];
          }
          return res.data.states.map(s => ({
            name: s.name,
            displayName: this.cleanStateName(s.name),
            code: s.state_code
          })).sort((a, b) => a.displayName.localeCompare(b.displayName));
        }),
        catchError(() => {
          return of(key === 'ecuador' ? this.ecuadorProvinces : []);
        }),
        shareReplay(1)
      );
      this.statesCache.set(key, obs$);
    }
    return this.statesCache.get(key)!;
  }

  /**
   * Obtiene las ciudades correspondientes a una provincia / estado
   */
  getCities(country: string, state: string): Observable<string[]> {
    const key = `${country.toLowerCase()}_${state.toLowerCase()}`.trim();
    if (!this.citiesCache.has(key)) {
      const obs$ = this.http.get<CitiesResponse>(
        `${this.baseUrl}/state/cities/q?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`
      ).pipe(
        map(res => {
          if (!res || !res.data || res.data.length === 0) {
            return this.defaultCitiesFor(state);
          }
          return res.data.sort((a, b) => a.localeCompare(b));
        }),
        catchError(() => of(this.defaultCitiesFor(state))),
        shareReplay(1)
      );
      this.citiesCache.set(key, obs$);
    }
    return this.citiesCache.get(key)!;
  }

  // limpia sufijos como " Province" o " Department" para que la UI se vea sobria
  private cleanStateName(raw: string): string {
    return raw
      .replace(/\s+(Province|Department|State|Region|Governorate|Prefecture)$/i, '')
      .trim();
  }

  // catalogo de respaldo inmediato para paises principales
  private defaultCountries(): CountryItem[] {
    return [
      { name: 'Ecuador', iso2: 'EC', iso3: 'ECU' },
      { name: 'Colombia', iso2: 'CO', iso3: 'COL' },
      { name: 'Peru', iso2: 'PE', iso3: 'PER' },
      { name: 'Mexico', iso2: 'MX', iso3: 'MEX' },
      { name: 'Spain', iso2: 'ES', iso3: 'ESP' },
      { name: 'Chile', iso2: 'CL', iso3: 'CHL' },
      { name: 'Argentina', iso2: 'AR', iso3: 'ARG' },
      { name: 'United States', iso2: 'US', iso3: 'USA' }
    ];
  }

  // ciudades de respaldo para las provincias clave de Ecuador
  private defaultCitiesFor(state: string): string[] {
    const s = state.toLowerCase();
    if (s.includes('azuay')) return ['Cuenca', 'Gualaceo', 'Chordeleg', 'Paute', 'Santa Isabel'];
    if (s.includes('pichincha')) return ['Quito', 'Cayambe', 'Rumiñahui', 'Mejía', 'San Miguel de los Bancos'];
    if (s.includes('guayas')) return ['Guayaquil', 'Samborondón', 'Durán', 'Daule', 'Milagro'];
    if (s.includes('tungurahua')) return ['Ambato', 'Baños de Agua Santa', 'Pelileo', 'Cevallos'];
    if (s.includes('imbabura')) return ['Ibarra', 'Otavalo', 'Cotacachi', 'Atuntaqui'];
    if (s.includes('loja')) return ['Loja', 'Catamayo', 'Vilcabamba', 'Cariamanga'];
    if (s.includes('manabí') || s.includes('manabi')) return ['Portoviejo', 'Manta', 'Montecristi', 'Chone', 'Bahía de Caráquez'];
    if (s.includes('chimborazo')) return ['Riobamba', 'Guano', 'Alausi', 'Colta'];
    return ['Centro', 'Cabecera Cantonal', 'Otra ciudad'];
  }
}

