# endpoint para eliminar un lote
class Api::ResourceLots::Delete < ApiAction
  before require_workshop

  delete "/api/resource_lots/:lot_id" do
    lot = ResourceLotQuery.new.id(lot_id).first?
    if lot && ResourceQuery.new.id(lot.resource_id).workshop_id(current_workshop.id).first?
      lot.delete
      json({ message: "lote eliminado correctamente" })
    else
      json({ message: "lote no encontrado en tu taller" }, status: 404)
    end
  end
end

