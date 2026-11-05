# endpoint para crear un lote de inventario (asociando clave foranea de recurso)
class Api::ResourceLots::Create < ApiAction
  before require_workshop

  post "/api/resource_lots" do
    # verificar que el recurso indicado pertenezca al taller logueado
    res_id = params.get?(:resource_id).try(&.to_i64)

    unless res_id
      json({ message: "debes indicar el resource_id del insumo" }, status: 422)
    else
      recurso = ResourceQuery.new.id(res_id).workshop_id(current_workshop.id).first?
      unless recurso
        json({ message: "el recurso no existe o no pertenece a tu taller" }, status: 404)
      else
        # guardamos el lote con las validaciones de negocio de fecha de caducidad
        SaveResourceLot.create(params, resource_id: res_id) do |operation, lot|
          if lot
            json ResourceLotSerializer.new(lot), status: 201
          else
            json({ message: "error de validacion al crear lote", errors: operation.errors }, status: 422)
          end
        end
      end
    end
  end
end

