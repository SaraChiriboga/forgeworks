class User < BaseModel
  include Carbon::Emailable
  include Authentic::PasswordAuthenticatable

  enum Role
    Client = 0
    Admin  = 1
    Staff  = 2
    Vendor = 3

    def vendor?
      admin? || vendor? || staff?
    end
  end

  table do
    column email : String
    column encrypted_password : String
    column role : User::Role

    column name : String
    column last_name : String
    column phone : String

    # Relación con Workshop: opcional para clientes, obligatoria para administradores/vendedores del taller
    belongs_to workshop : Workshop?
  end

  def emailable : Carbon::Address
    Carbon::Address.new(email)
  end

  def client? : Bool
    role.client?
  end

  def admin? : Bool
    role.admin?
  end

  def staff? : Bool
    role.staff? || role.vendor?
  end

  def vendor? : Bool
    role.admin? || role.vendor? || role.staff?
  end
end
