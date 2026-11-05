# endpoint para listar recursos del taller logueado
class Api::Resources::Index < ApiAction
  before require_workshop

  get "/api/resources" do
    query = ResourceQuery.new.workshop_id(current_workshop.id).is_active(true)

    # si en la url pasan un tipo (ej. ?resource_type=perecedero) filtramos para la cascada
    params.get?(:resource_type).try do |tipo|
      query = query.resource_type(tipo.downcase)
    end

    json ResourceSerializer.for_collection(query)
  end
end

