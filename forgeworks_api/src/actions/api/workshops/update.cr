# endpoint para actualizar datos de un taller
class Api::Workshops::Update < ApiAction
  before require_workshop

  put "/api/workshops/:workshop_id" do
    # verificar que solo el admin de su propio taller pueda editarlo
    if current_user.workshop_id != workshop_id || !current_user.admin?
      json({ message: "no tienes permiso para editar este taller" }, status: 403)
    else
      workshop = WorkshopQuery.new.id(workshop_id).first
      SaveWorkshop.update(workshop, params) do |operation, updated_workshop|
        if updated_workshop
          json WorkshopSerializer.new(updated_workshop)
        else
          json({ message: "error de validacion al actualizar taller", errors: operation.errors }, status: 422)
        end
      end
    end
  end
end

