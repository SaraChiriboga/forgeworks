# endpoint para actualizar un recurso
class Api::Resources::Update < ApiAction
  before require_workshop

  put "/api/resources/:resource_id" do
    resource = ResourceQuery.new.id(resource_id).workshop_id(current_workshop.id).first?
    if resource
      SaveResource.update(resource, params) do |operation, updated_resource|
        if updated_resource
          json ResourceSerializer.new(updated_resource)
        else
          json({ message: "error de validacion al actualizar recurso", errors: operation.errors }, status: 422)
        end
      end
    else
      json({ message: "recurso no encontrado o no pertenece a tu taller" }, status: 404)
    end
  end
end

