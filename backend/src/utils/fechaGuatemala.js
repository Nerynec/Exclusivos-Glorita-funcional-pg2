// Guatemala usa horario UTC-6 todo el año (no observa horario de verano),
// así que el cálculo es un simple corrimiento fijo. Esto es intencionalmente
// independiente de la zona horaria configurada en Windows/SQL Server o en
// donde sea que corra este backend (útil si algún día se despliega en la
// nube, donde normalmente el servidor está en UTC).
const OFFSET_HORAS_GUATEMALA = 6;

function ahoraGuatemala() {
  return new Date(Date.now() - OFFSET_HORAS_GUATEMALA * 60 * 60 * 1000);
}

module.exports = { ahoraGuatemala };
