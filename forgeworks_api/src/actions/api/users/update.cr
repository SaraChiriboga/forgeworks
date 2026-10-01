class Api::Users::Update < ApiAction
  put "/api/users/:user_id" do
    user =UserQuery.find(user_id) # busca el usuario por id

    # ejecutar actualizacion del usuario con los parametros recibidos
    UpdateUser.update(user, params) do |operation, updated_user|
        if updated_user
            json UserSerializer.new(updated_user), status: 200 # actualizacion con exito
        else
            json ErrorSerializer.new(operation), status: 422 # error de validacion
        end
    end
  end
end