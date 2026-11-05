class Api::Users::Update < ApiAction
  before require_admin
  put "/api/users/:user_id" do
    user =UserQuery.find(user_id) # busca el usuario por id

    # ejecutar actualizacion del usuario con los parametros recibidos
    UpdateUser.update(user, params) do |operation, updated_user|
        if updated_user
            json UserSerializer.new(updated_user), status: 200 # actualizacion con exito
        else
            raise Avram::InvalidOperationError.new(operation) # error de validacion
        end
    end
  end
end