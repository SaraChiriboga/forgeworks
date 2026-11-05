# endpoint para crear un nuevo recurso
class Api::Resources::Create < ApiAction
  before require_workshop

  post "/api/resources" do
    # asociamos el recurso directamente al taller de la sesion activa
    SaveResource.create(params, workshop_id: current_workshop.id) do |operation, resource|
      if resource
        json ResourceSerializer.new(resource), status: 201
      else
        json({ message: "error de validacion al crear recurso", errors: operation.errors }, status: 422)
      end
    end
  end
end

