// validador de cedula y ruc ecuatoriano en el frontend (modulo 10 y 11)
export class IdentificationValidator {
  static validate(raw: string | null | undefined): { valid: boolean; message?: string } {
    if (!raw) {
      return { valid: false, message: 'La cédula o RUC es obligatoria' };
    }

    const clean = raw.trim();
    if (!/^\d+$/.test(clean)) {
      return { valid: false, message: 'La identificación debe contener solo números' };
    }

    if (clean.length === 10) {
      return this.validateCedula(clean);
    } else if (clean.length === 13) {
      return this.validateRuc(clean);
    } else {
      return { valid: false, message: 'Debe tener 10 dígitos (cédula) o 13 dígitos (RUC)' };
    }
  }

  static isValid(raw: string | null | undefined): boolean {
    return this.validate(raw).valid;
  }

  private static validateCedula(cedula: string): { valid: boolean; message?: string } {
    if (!this.validProvincia(cedula)) {
      return { valid: false, message: 'El código de provincia de la cédula no es válido' };
    }

    const tercer = parseInt(cedula[2], 10);
    if (tercer >= 6) {
      return { valid: false, message: 'El tercer dígito de la cédula debe ser menor a 6' };
    }

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let val = parseInt(cedula[i], 10) * coeficientes[i];
      if (val >= 10) val -= 9;
      suma += val;
    }

    const residuo = suma % 10;
    const verificador = residuo === 0 ? 0 : 10 - residuo;

    if (verificador !== parseInt(cedula[9], 10)) {
      return { valid: false, message: 'Dígito verificador de la cédula no válido' };
    }

    return { valid: true };
  }

  private static validateRuc(ruc: string): { valid: boolean; message?: string } {
    if (!this.validProvincia(ruc)) {
      return { valid: false, message: 'El código de provincia del RUC no es válido' };
    }

    const tercer = parseInt(ruc[2], 10);

    if (tercer < 6) {
      // ruc persona natural: cedula + sucursal
      const cedulaParte = ruc.slice(0, 10);
      const establecimiento = ruc.slice(10, 13);
      const resCedula = this.validateCedula(cedulaParte);

      if (!resCedula.valid) {
        return { valid: false, message: 'Los 10 primeros dígitos no corresponden a una cédula válida' };
      }
      if (establecimiento === '000') {
        return { valid: false, message: 'El establecimiento del RUC no puede ser 000' };
      }
      return { valid: true };
    } else if (tercer === 9) {
      // ruc sociedad privada
      const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 9; i++) {
        suma += parseInt(ruc[i], 10) * coeficientes[i];
      }
      const residuo = suma % 11;
      let verificador = residuo === 0 ? 0 : 11 - residuo;
      if (verificador === 10) return { valid: false, message: 'Dígito verificador del RUC de sociedad inválido' };
      if (verificador === 11) verificador = 0;

      if (verificador !== parseInt(ruc[9], 10) || ruc.slice(10, 13) === '000') {
        return { valid: false, message: 'RUC de sociedad privada no válido o establecimiento 000' };
      }
      return { valid: true };
    } else if (tercer === 6) {
      // ruc institucion publica
      const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 8; i++) {
        suma += parseInt(ruc[i], 10) * coeficientes[i];
      }
      const residuo = suma % 11;
      let verificador = residuo === 0 ? 0 : 11 - residuo;
      if (verificador === 10) return { valid: false, message: 'Dígito verificador de entidad pública inválido' };
      if (verificador === 11) verificador = 0;

      if (verificador !== parseInt(ruc[8], 10) || ruc.slice(9, 13) === '0000') {
        return { valid: false, message: 'RUC de entidad pública no válido o establecimiento 0000' };
      }
      return { valid: true };
    }

    return { valid: false, message: 'Tercer dígito del RUC no corresponde a ningún tipo válido' };
  }

  private static validProvincia(numero: string): boolean {
    const prov = parseInt(numero.slice(0, 2), 10);
    return (prov >= 1 && prov <= 24) || prov === 30;
  }
}

