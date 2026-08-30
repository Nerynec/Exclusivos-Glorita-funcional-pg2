// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('Error no controlado:', err);
  res.status(err.status || 500).json({
    mensaje: err.mensaje || 'Ocurrió un error inesperado en el servidor.',
  });
}

module.exports = errorHandler;
