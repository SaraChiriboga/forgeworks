import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        LocationService
      ]
    });
    service = TestBed.inject(LocationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return countries list with Ecuador prioritized', async () => {
    const promise = firstValueFrom(service.getCountries());

    const req = httpTesting.expectOne('https://countriesnow.space/api/v0.1/countries/iso');
    expect(req.request.method).toBe('GET');
    req.flush({
      error: false,
      msg: 'countries retrieved',
      data: [
        { name: 'Colombia', Iso2: 'CO', Iso3: 'COL' },
        { name: 'Ecuador', Iso2: 'EC', Iso3: 'ECU' },
        { name: 'Peru', Iso2: 'PE', Iso3: 'PER' }
      ]
    });

    const countries = await promise;
    expect(countries.length).toBeGreaterThan(0);
    expect(countries[0].name).toBe('Ecuador');
  });

  it('should return clean state names for Ecuador', async () => {
    const promise = firstValueFrom(service.getStates('Ecuador'));

    const req = httpTesting.expectOne('https://countriesnow.space/api/v0.1/countries/states/q?country=Ecuador');
    expect(req.request.method).toBe('GET');
    req.flush({
      error: false,
      msg: 'states retrieved',
      data: {
        name: 'Ecuador',
        iso3: 'ECU',
        states: [
          { name: 'Azuay Province', state_code: 'A' },
          { name: 'Pichincha Province', state_code: 'P' }
        ]
      }
    });

    const states = await promise;
    expect(states.length).toBe(2);
    expect(states[0].displayName).toBe('Azuay');
    expect(states[0].name).toBe('Azuay Province');
  });

  it('should return cities for state', async () => {
    const promise = firstValueFrom(service.getCities('Ecuador', 'Azuay Province'));

    const req = httpTesting.expectOne(
      'https://countriesnow.space/api/v0.1/countries/state/cities/q?country=Ecuador&state=Azuay%20Province'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      error: false,
      msg: 'cities retrieved',
      data: ['Cuenca', 'Gualaceo']
    });

    const cities = await promise;
    expect(cities).toContain('Cuenca');
  });

  it('should fallback gracefully to local catalogue on HTTP error', async () => {
    const promise = firstValueFrom(service.getStates('Ecuador'));

    const req = httpTesting.expectOne('https://countriesnow.space/api/v0.1/countries/states/q?country=Ecuador');
    req.error(new ProgressEvent('Network error'));

    const states = await promise;
    expect(states.length).toBeGreaterThan(20);
    expect(states.some(s => s.displayName === 'Azuay')).toBe(true);
  });
});
