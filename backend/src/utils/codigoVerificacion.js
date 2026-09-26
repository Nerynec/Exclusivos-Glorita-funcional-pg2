const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Código de verificación de 6 dígitos (ej. "004821"). crypto.randomInt es
// criptográficamente seguro (a diferencia de Math.random), igual que se
// usa para cualquier otro dato sensible del sistema.
function generarCodigo() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// El código se guarda hasheado en la base de datos, igual que la
// contraseña: si alguien llegara a leer la tabla, no puede ver los
// códigos en texto plano.
function hashCodigo(codigo) {
  return bcrypt.hash(codigo, 10);
}

function compararCodigo(codigo, hash) {
  return bcrypt.compare(codigo, hash);
}

module.exports = { generarCodigo, hashCodigo, compararCodigo };
