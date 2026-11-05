class CreateResourcesAndResourceLots::V20261105204639 < Avram::Migrator::Migration::V1
  def migrate
    create table_for(Resource) do
      primary_key id : Int64
      add_timestamps

      # Aislamiento multi-taller estricto (RF-02)
      add_belongs_to workshop : Workshop, on_delete: :cascade

      # Identificación del recurso
      add name : String # Nombre visible: ej. "Madera Roble", "Rosas Rojas"
      add internal_name : String # Identificador slug para el evaluador: ej. "roble"

      # Tipificación y métricas del Core (RF-03, RF-04, RF-05)
      add resource_type : String # "consumible", "perecedero", "capacidad"
      add unit : String # "metros", "planchas", "tallos", "horas", "gramos"
      add cost_cents : Int64 # Dinero en centavos enteros (RNF-02)

      # Atributos extendidos para el motor de producción y reabastecimiento
      add capacity_per_week : Float64? # Capacidad semanal en horas para tipo 'capacidad'
      add lead_time_days : Int32? # Tiempo de reposición en días si se agota
      add min_stock_alert : Float64? # Nivel de inventario para alertar stock bajo
      add description : String? # Descripción opcional para el artesano
      add tags : Array(String), default: [] of String # Etiquetas para clasificación y sustitutos (RF-06)
      add is_active : Bool, default: true # Baja lógica sin romper histórico de encargos
    end

    # Índice único: un taller no puede duplicar nombres internos en su evaluador
    create_index table_for(Resource), [:workshop_id, :internal_name], unique: true

    create table_for(ResourceLot) do
      primary_key id : Int64
      add_timestamps

      # Relación con el recurso padre
      add_belongs_to resource : Resource, on_delete: :cascade

      # Seguimiento del lote físico y caducidad (RF-04, RF-31)
      add lot_number : String # Código de trazabilidad: ej. "LOT-2026-001"
      add quantity : Float64 # Existencias disponibles
      add received_at : Time # Fecha y hora de recepción en taller
      add expires_at : Time? # Fecha de caducidad (obligatoria para perecederos)
      add cost_cents : Int64? # Costo específico si difiere del costo base del recurso
      add status : String, default: "active" # "active", "exhausted", "expired"
      add notes : String? # Observaciones del lote
    end

    create_index table_for(ResourceLot), [:resource_id, :status]
  end

  def rollback
    drop table_for(ResourceLot)
    drop table_for(Resource)
  end
end
