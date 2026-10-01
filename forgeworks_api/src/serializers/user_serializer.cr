class UserSerializer < BaseSerializer
  def initialize(@user : User)
  end

  def render
    {
    id: @user.id,  
    email: @user.email,
    role: @user.role.to_s}
  end
end
