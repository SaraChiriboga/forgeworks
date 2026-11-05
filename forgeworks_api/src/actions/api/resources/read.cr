# endpoint para consultar un recurso
class Api::Resources::Read < ApiAction
  before require_workshop

  get "/api/resources/:resource_id" do
    resource = ResourceQuery.new.id(resource_id).workshop_id(current_workshop.id).first?
    if resource
      json ResourceSerializer.new(resource)
    else
      json({ message: "recurso no encontrado o no pertenece a tu taller" }, status: 404)
    end
  end
end

