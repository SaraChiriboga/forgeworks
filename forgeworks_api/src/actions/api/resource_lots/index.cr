# endpoint para listar lotes de inventario
class Api::ResourceLots::Index < ApiAction
  before require_workshop

  get "/api/resource_lots" do
    # si filtran por un recurso en especifico
    res_id = params.get?(:resource_id).try(&.to_i64)

    if res_id
      # verificar que el recurso pertenezca al taller
      recurso = ResourceQuery.new.id(res_id).workshop_id(current_workshop.id).first?
      if recurso
        lotes = ResourceLotQuery.new.resource_id(res_id).created_at.desc_order
        json ResourceLotSerializer.for_collection(lotes)
      else
        json({ message: "recurso no encontrado en tu taller" }, status: 404)
      end
    else
      # obtener los ids de todos los recursos de este taller
      resource_ids = ResourceQuery.new.workshop_id(current_workshop.id).map(&.id)
      lotes = ResourceLotQuery.new.resource_id.in(resource_ids).created_at.desc_order
      json ResourceLotSerializer.for_collection(lotes)
    end
  end
end
