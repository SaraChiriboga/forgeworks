# operacion para crear y actualizar lotes de inventario
class SaveResourceLot < ResourceLot::SaveOperation
  param_key :resource_lot

  permit_columns lot_number, quantity, received_at, expires_at, cost_cents, status, notes

  before_save do
    validate_required lot_number, quantity, received_at

    # la cantidad debe ser positiva
    quantity.value.try do |cant|
      if cant <= 0.0
        quantity.add_error("la cantidad debe ser mayor a cero")
      end
    end

    # costo si se envia no puede ser negativo
    cost_cents.value.try do |cost|
      if cost <= 0
        cost_cents.add_error("el costo en centavos debe ser mayor a cero")
      end
    end

    # si el recurso es perecedero validamos la caducidad obligatoriamente
    res_id = resource_id.value
    if res_id
      recurso = ResourceQuery.new.id(res_id).first?
      if recurso && recurso.perecedero?
        validate_required expires_at

        expires_at.value.try do |exp|
          received_at.value.try do |rec|
            if exp <= rec
              expires_at.add_error("la fecha de caducidad debe ser posterior a la fecha de ingreso")
            end
          end

          # no permitir registrar cosas ya caducadas
          if exp < Time.utc
            expires_at.add_error("la fecha de caducidad no puede estar en el pasado")
          end
        end
      end
    end
  end
end

