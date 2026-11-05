# endpoint para crear un nuevo taller
class Api::Workshops::Create < ApiAction
  post "/api/workshops" do
    SaveWorkshop.create(params) do |operation, workshop|
      if workshop
        # si el usuario actual todavia no tenia taller lo vinculamos como administrador
        if current_user.workshop_id.nil?
          AssignUserWorkshop.update!(current_user, workshop_id: workshop.id, role: User::Role::Admin)
        end

        json WorkshopSerializer.new(workshop), status: 201
      else
        json({ message: "error de validacion al crear taller", errors: operation.errors }, status: 422)
      end
    end
  end
end
