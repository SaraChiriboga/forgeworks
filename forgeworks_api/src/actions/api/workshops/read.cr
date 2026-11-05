# endpoint para ver detalle de un taller
class Api::Workshops::Read < ApiAction
  get "/api/workshops/:workshop_id" do
    workshop = WorkshopQuery.new.id(workshop_id).first?
    if workshop
      json WorkshopSerializer.new(workshop)
    else
      json({ message: "taller no encontrado" }, status: 404)
    end
  end
end

