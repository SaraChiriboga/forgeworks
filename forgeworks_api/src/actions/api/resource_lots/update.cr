# endpoint para actualizar un lote
class Api::ResourceLots::Update < ApiAction
  before require_workshop

  put "/api/resource_lots/:lot_id" do
    lot = ResourceLotQuery.new.id(lot_id).first?
    if lot && ResourceQuery.new.id(lot.resource_id).workshop_id(current_workshop.id).first?
      SaveResourceLot.update(lot, params) do |operation, updated_lot|
        if updated_lot
          json ResourceLotSerializer.new(updated_lot)
        else
          json({ message: "error de validacion al actualizar lote", errors: operation.errors }, status: 422)
        end
      end
    else
      json({ message: "lote no encontrado en tu taller" }, status: 404)
    end
  end
end

