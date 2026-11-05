# endpoint para consultar el taller de la sesion activa
class Api::Workshops::Mine < ApiAction
  before require_workshop

  get "/api/my_workshop" do
    json WorkshopSerializer.new(current_workshop)
  end
end

