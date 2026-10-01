class Api::Users::Delete < ApiAction
  delete "/api/users/:user_id" do
    UserQuery.find(user_id).delete
    json({ message: "Usuario eliminado correctamente" })
  end
end