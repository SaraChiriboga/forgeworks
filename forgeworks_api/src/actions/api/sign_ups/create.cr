class Api::SignUps::Create < ApiAction
  include Api::Auth::SkipRequireAuthToken

  post "/api/sign_ups" do
    # creamos el usuario y devolvemos token y datos serializados
    user = SignUpUser.create!(params)
    json({token: UserToken.generate(user), user: UserSerializer.new(user)}, status: 201)
  end
end
