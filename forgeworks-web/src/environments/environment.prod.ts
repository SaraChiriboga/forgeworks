export const environment = {
  production: true,
  // En producción en Render apunta al servicio backend enlazado
  apiUrl: (typeof window !== 'undefined' && (window as any).__FORGEWORKS_API_URL__)
    || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? 'https://forgeworks-api-eb3i.onrender.com/api'
        : 'http://localhost:3000/api')
};
