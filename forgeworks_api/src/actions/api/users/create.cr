class Api::Users::Create < ApiAction
  post "/api/users" do
    SignUpUser.create(params) do |operation, user|
      if user
        json UserSerializer.new(user), status: 201
      else
        raise Avram::InvalidOperationError.new(operation)
      end
    end
  end
end