class Api::Users::Create < ApiAction
  before require_admin
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