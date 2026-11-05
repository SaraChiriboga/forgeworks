import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// interfaces para taller, recursos y lotes
export interface Workshop {
  id: number;
  name: string;
  id_gov: string;
  description?: string;
  location: string;
  category: string;
  created_at: string;
}

export interface Resource {
  id: number;
  workshop_id: number;
  name: string;
  internal_name: string;
  resource_type: string;
  unit: string;
  cost_cents: number;
  cost_dollars: number;
  capacity_per_week?: number;
  lead_time_days?: number;
  min_stock_alert?: number;
  description?: string;
  tags: string[];
  is_active: boolean;
  available_stock: number;
  created_at: string;
}

export interface ResourceLot {
  id: number;
  resource_id: number;
  lot_number: string;
  quantity: number;
  received_at: string;
  expires_at?: string;
  cost_cents?: number;
  status: string;
  notes?: string;
  is_expired: boolean;
  created_at: string;
}

export interface NewResource {
  name: string;
  internal_name: string;
  resource_type: string;
  unit: string;
  cost_cents: number;
  capacity_per_week?: number;
  description?: string;
}

export interface NewResourceLot {
  resource_id: number;
  lot_number: string;
  quantity: number;
  received_at: string;
  expires_at?: string;
  cost_cents?: number;
  notes?: string;
}

export interface NewWorkshop {
  name: string;
  id_gov: string;
  description?: string;
  location: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // consultar taller de la sesion actual
  getMyWorkshop(): Observable<Workshop> {
    return this.http.get<Workshop>(`${this.apiUrl}/my_workshop`);
  }

  // registrar taller si el usuario todavia no tenia uno
  createWorkshop(data: NewWorkshop): Observable<Workshop> {
    return this.http.post<Workshop>(`${this.apiUrl}/workshops`, { workshop: data });
  }

  // listar recursos del taller, con filtro opcional de tipo para la cascada
  getResources(resourceType?: string): Observable<Resource[]> {
    let url = `${this.apiUrl}/resources`;
    if (resourceType && resourceType.trim() !== '') {
      url += `?resource_type=${encodeURIComponent(resourceType)}`;
    }
    return this.http.get<Resource[]>(url);
  }

  // crear un nuevo recurso en el taller
  createResource(data: NewResource): Observable<Resource> {
    return this.http.post<Resource>(`${this.apiUrl}/resources`, { resource: data });
  }

  // listar lotes de inventario (opcionalmente filtrados por recurso)
  getResourceLots(resourceId?: number): Observable<ResourceLot[]> {
    let url = `${this.apiUrl}/resource_lots`;
    if (resourceId) {
      url += `?resource_id=${resourceId}`;
    }
    return this.http.get<ResourceLot[]>(url);
  }

  // crear un lote asociando la clave foranea del recurso
  createResourceLot(data: NewResourceLot): Observable<ResourceLot> {
    return this.http.post<ResourceLot>(`${this.apiUrl}/resource_lots`, { resource_lot: data, resource_id: data.resource_id });
  }

  // eliminar un lote de inventario
  deleteResourceLot(lotId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/resource_lots/${lotId}`);
  }
}
