# mixin para validar cedula o ruc en operaciones de guardado
module IdentificationValidations
  # valida que el campo de identificacion sea una cedula o ruc valido
  private def validate_identification(attribute : Avram::Attribute)
    attribute.value.try do |value|
      # si no pasa el algoritmo de modulo 10 u 11, agregamos el error
      unless IdentificationValidator.valid?(value)
        attribute.add_error("la cedula o ruc ingresado no es valido")
      end
    end
  end
end

