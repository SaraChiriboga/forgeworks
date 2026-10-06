class SignUpUser < User::SaveOperation
  param_key :user
  # Change password validations in src/operations/mixins/password_validations.cr
  include PasswordValidations

  permit_columns email, name, last_name, phone
  attribute password : String
  attribute password_confirmation : String  # al no incluir el role, se evita que un hacker envie 1 y se haga admin

  before_save do
    validate_uniqueness_of email
    Authentic.copy_and_encrypt(password, to: encrypted_password) if password.valid?
    role.value = User::Role::Regular # Set default role to Regular
  end
end
