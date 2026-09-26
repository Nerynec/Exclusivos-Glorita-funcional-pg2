// Envío de correo para el segundo factor de autenticación, usando la
// propia cuenta de Gmail del proyecto (100% gratis, sin límites de costo).
//
// Requiere estas variables de entorno:
//   GMAIL_USER          - la dirección de Gmail que envía el correo
//                          (ej. "exclusivosglorita@gmail.com")
//   GMAIL_APP_PASSWORD  - una "contraseña de aplicación" de 16 caracteres,
//                          NO la contraseña normal de la cuenta. Se genera
//                          gratis en https://myaccount.google.com/apppasswords
//                          (esa cuenta de Gmail necesita tener activada la
//                          verificación en dos pasos para poder generarla).
//
// Si esas variables no están configuradas (por ejemplo en desarrollo
// local, o si todavía no se configuró la cuenta de Gmail), el código NO
// se manda por correo de verdad: en vez de eso se imprime en la consola
// del servidor. Esto permite probar todo el flujo de inicio de sesión sin
// necesitar credenciales reales, y evita que el login se caiga por
// completo si falta esa configuración en producción.

let transportador = null;

function tieneCorreoConfigurado() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function obtenerTransportador() {
  if (!transportador) {
    // Se importa acá adentro (no arriba del archivo) para que el proyecto
    // pueda levantar aunque el paquete "nodemailer" no esté instalado
    // todavía en un entorno donde nunca se llega a usar.
    // eslint-disable-next-line global-require
    const nodemailer = require('nodemailer');
    transportador = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      // Sin esto, si Gmail no responde (credenciales inválidas, el puerto
      // SMTP bloqueado por el hosting, etc.) la conexión se queda colgada
      // indefinidamente y el login nunca termina de cargar. Con estos
      // límites, en 15 segundos falla con un error claro en vez de colgarse.
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });
  }
  return transportador;
}

async function enviarCorreo(destinatario, asunto, textoPlano) {
  if (!tieneCorreoConfigurado()) {
    console.warn(
      `⚠️  Gmail no está configurado (faltan GMAIL_USER / GMAIL_APP_PASSWORD).\n`
      + `   Correo simulado para ${destinatario} — "${asunto}":\n   ${textoPlano}`,
    );
    return;
  }

  const cliente = obtenerTransportador();
  await cliente.sendMail({
    from: `"Exclusivos Glorita" <${process.env.GMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    text: textoPlano,
  });
}

module.exports = { enviarCorreo, tieneCorreoConfigurado };
