class User < BaseModel
  include Carbon::Emailable
  include Authentic::PasswordAuthenticatable

  avram_enum Role do: # enum de tipos de roles de usuario
    Regular = 0
    Admin = 1
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
