# operacion interna para vincular taller y rol al usuario
class AssignUserWorkshop < User::SaveOperation
  permit_columns workshop_id, role
end

