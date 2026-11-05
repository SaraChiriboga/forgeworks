# validador de cedula y ruc ecuatoriano
class IdentificationValidator
  # revisa si el texto es una cedula o ruc valido
  def self.valid?(raw : String?) : Bool
    return false if raw.nil?

    # quita espacios en blanco por si acaso
    clean = raw.strip
    return false unless clean =~ /^\d+$/

    case clean.size
    when 10
      valid_cedula?(clean)
    when 13
      valid_ruc?(clean)
    else
      false
    end
  end

  # valida cedula con el algoritmo de modulo 10
  def self.valid_cedula?(cedula : String) : Bool
    return false unless cedula.size == 10
    return false unless valid_provincia?(cedula)

    # el tercer digito para personas naturales va del 0 al 5
    tercer_digito = cedula[2].to_i
    return false if tercer_digito >= 6

    # coeficientes oficiales para modulo 10
    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    suma = 0

    9.times do |i|
      val = cedula[i].to_i * coeficientes[i]
      # si pasa de 9 se le resta 9
      val -= 9 if val >= 10
      suma += val
    end

    # calcular digito verificador
    residuo = suma % 10
    verificador = (residuo == 0) ? 0 : (10 - residuo)

    # comparar con el ultimo digito
    verificador == cedula[9].to_i
  end

  # valida ruc (natural, privado o publico)
  def self.valid_ruc?(ruc : String) : Bool
    return false unless ruc.size == 13
    return false unless valid_provincia?(ruc)

    tercer_digito = ruc[2].to_i

    if tercer_digito < 6
      # ruc de persona natural: son los 10 de la cedula mas el local
      cedula_parte = ruc[0..9]
      establecimiento = ruc[10..12]

      valid_cedula?(cedula_parte) && establecimiento != "000"
    elsif tercer_digito == 9
      # ruc de sociedad privada o extranjeros sin cedula
      valid_ruc_privado?(ruc)
    elsif tercer_digito == 6
      # ruc de instituciones publicas del estado
      valid_ruc_publico?(ruc)
    else
      false
    end
  end

  # modulo 11 para empresas privadas
  private def self.valid_ruc_privado?(ruc : String) : Bool
    coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2]
    suma = 0

    9.times do |i|
      suma += ruc[i].to_i * coeficientes[i]
    end

    residuo = suma % 11
    verificador = (residuo == 0) ? 0 : (11 - residuo)
    return false if verificador == 10
    verificador = 0 if verificador == 11

    # el decimo digito es el verificador y el local no puede ser 000
    verificador == ruc[9].to_i && ruc[10..12] != "000"
  end

  # modulo 11 para entidades publicas
  private def self.valid_ruc_publico?(ruc : String) : Bool
    coeficientes = [3, 2, 7, 6, 5, 4, 3, 2]
    suma = 0

    8.times do |i|
      suma += ruc[i].to_i * coeficientes[i]
    end

    residuo = suma % 11
    verificador = (residuo == 0) ? 0 : (11 - residuo)
    return false if verificador == 10
    verificador = 0 if verificador == 11

    # aqui el noveno digito es el verificador y los 4 finales son el local
    verificador == ruc[8].to_i && ruc[9..12] != "0000"
  end

  # revisa que el codigo de provincia este entre 01 y 24, o 30
  private def self.valid_provincia?(numero : String) : Bool
    prov = numero[0..1].to_i?
    return false unless prov

    (prov >= 1 && prov <= 24) || prov == 30
  end
end

