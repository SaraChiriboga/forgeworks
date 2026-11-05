require "../spec_helper"

describe IdentificationValidator do
  it "valida cedulas correctas" do
    # cedula real de prueba
    IdentificationValidator.valid?("1710034065").should be_true
    IdentificationValidator.valid_cedula?("1710034065").should be_true
  end

  it "rechaza cedulas invalidas o inventadas" do
    # digito verificador incorrecto
    IdentificationValidator.valid?("1710034060").should be_false
    # provincia que no existe en ecuador
    IdentificationValidator.valid?("9910034065").should be_false
    # longitud que no corresponde
    IdentificationValidator.valid?("12345").should be_false
    # caracteres que no son numeros
    IdentificationValidator.valid?("abcdefghij").should be_false
  end

  it "valida ruc de persona natural" do
    # cedula valida terminada en 001
    IdentificationValidator.valid?("1710034065001").should be_true
    IdentificationValidator.valid_ruc?("1710034065001").should be_true
  end

  it "rechaza ruc natural que termine en 000" do
    # el local no puede ser 000
    IdentificationValidator.valid?("1710034065000").should be_false
  end

  it "valida ruc de sociedad privada con modulo 11" do
    # ruc privado (tercer digito es 9)
    IdentificationValidator.valid?("1790016919001").should be_true
  end

  it "valida ruc de entidad publica con modulo 11" do
    # ruc publico (tercer digito es 6)
    IdentificationValidator.valid?("1760001550001").should be_true
  end
end

