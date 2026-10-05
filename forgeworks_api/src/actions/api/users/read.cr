class Api::Users::Show < ApiAction
    before require_admin
    get "/api/users/:user_id" do # busca por id, si no existe, 404
        user = UserQuery.find(user_id) # busca el usuario por id
        json UserSerializer.new(user) # serializa el usuario encontrado
    end
 end