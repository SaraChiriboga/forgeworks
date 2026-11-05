# operacion para crear o actualizar un taller
class SaveWorkshop < Workshop::SaveOperation
  param_key :workshop
  include IdentificationValidations

  permit_columns name, id_gov, description, location, category

  before_save do
    validate_required name, id_gov, location, category

    # aqui validamos la cedula o ruc ecuatoriano
    validate_identification id_gov
  end
end
