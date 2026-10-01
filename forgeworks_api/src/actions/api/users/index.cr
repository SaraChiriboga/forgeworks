class Api::Users::Index < ApiAction
   get "/api/users" do
     users = UserQuery.new # consulta todos los usuarios de la tabla
     json UserSerializer.for_collection(users) # serializa la colección de usuarios
   end
end