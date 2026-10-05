class Api::SignIns::Create < ApiAction
  include Api::Auth::SkipRequireAuthToken

  post "/api/sign_ins" do
    SignInUser.run(params) do |operation, user|
      if user
        # devolver el token y el usuario serializado en la respuesta (para el RBAC)
        json({token: UserToken.generate(user), user: UserSerializer.new(user)})
      else
        raise Avram::InvalidOperationError.new(operation)
      end
    end
  end
end
