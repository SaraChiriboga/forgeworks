class UserSerializer < BaseSerializer
  def initialize(@user : User)
  end

  def render
    {
    id: @user.id,  
    email: @user.email,
    role: @user.role.to_s,
    name: @user.name,
    last_name: @user.last_name,
    phone: @user.phone
  }
  end
end
