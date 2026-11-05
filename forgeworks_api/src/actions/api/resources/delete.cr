# endpoint para desactivar un recurso (baja logica)
class Api::Resources::Delete < ApiAction
  before require_workshop

  delete "/api/resources/:resource_id" do
    resource = ResourceQuery.new.id(resource_id).workshop_id(current_workshop.id).first?
    if resource
      # hacemos baja logica para no romper historico
      SaveResource.update!(resource, is_active: false)
      json({ message: "recurso desactivado correctamente" })
    else
      json({ message: "recurso no encontrado o no pertenece a tu taller" }, status: 404)
    end
  end
end
