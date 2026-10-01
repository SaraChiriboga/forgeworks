# src/operations/update_user.cr
class UpdateUser < User::SaveOperation
  permit_columns email
end