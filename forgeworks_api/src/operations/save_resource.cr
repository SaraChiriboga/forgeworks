# operacion para crear y actualizar recursos del taller
class SaveResource < Resource::SaveOperation
  param_key :resource

  permit_columns name, internal_name, resource_type, unit, cost_cents,
                 capacity_per_week, lead_time_days, min_stock_alert,
                 description, tags, is_active

  before_save do
    validate_required name, internal_name, resource_type, unit, cost_cents

    # el costo debe ser mayor a cero centavos
    cost_cents.value.try do |cost|
      if cost <= 0
        cost_cents.add_error("el costo debe ser mayor a cero centavos")
      end
    end

    # validar formato del internal name (letras, numeros y guion bajo)
    internal_name.value.try do |slug|
      clean_slug = slug.strip.downcase
      internal_name.value = clean_slug
      unless clean_slug =~ /^[a-z0-9_]+$/
        internal_name.add_error("el identificador interno solo puede contener letras minusculas, numeros y guiones bajos")
      end
    end

    # validar que sea uno de los tipos soportados por el core
    resource_type.value.try do |tipo|
      unless ["consumible", "perecedero", "capacidad"].includes?(tipo.downcase)
        resource_type.add_error("el tipo de recurso debe ser consumible, perecedero o capacidad")
      end
    end

    # si es capacidad las horas semanales son requeridas
    resource_type.value.try do |tipo|
      if tipo.downcase == "capacidad" && capacity_per_week.value.nil?
        capacity_per_week.add_error("para recursos de capacidad debes indicar las horas semanales")
      end
    end
  end
end

