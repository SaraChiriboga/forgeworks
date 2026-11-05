# endpoint para consultar un lote en especifico
class Api::ResourceLots::Read < ApiAction
  before require_workshop

  get "/api/resource_lots/:lot_id" do
    lot = ResourceLotQuery.new.id(lot_id).first?
    if lot && ResourceQuery.new.id(lot.resource_id).workshop_id(current_workshop.id).first?
      json ResourceLotSerializer.new(lot)
    else
      json({ message: "lote no encontrado en tu taller" }, status: 404)
    end
  end
end

