class User < BaseModel
  include Carbon::Emailable
  include Authentic::PasswordAuthenticatable

  enum Role  # enum de tipos de roles de usuario
    Regular
    Admin
  end

  table do
    column email : String
    column encrypted_password : String
    column role : User::Role
  end

  def emailable : Carbon::Address
    Carbon::Address.new(email)
  end
end
