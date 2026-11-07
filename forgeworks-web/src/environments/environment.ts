export const environment = {
  production: false,
  // En local conecta a localhost:3000; en despliegue (Render) apunta al backend enlazado
  apiUrl: (typeof window !== 'undefined' && (window as any).__FORGEWORKS_API_URL__)
    || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? 'https://forgeworks-api-eb3i.onrender.com/api'
        : 'http://localhost:3000/api')
};
