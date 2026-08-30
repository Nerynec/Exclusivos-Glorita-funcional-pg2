// Redimensiona una imagen (archivo elegido por el usuario) a un cuadro
// máximo de "maxSize" px y la devuelve como data URL en JPEG comprimido.
// Esto evita guardar fotos enormes en la base de datos.
export function redimensionarImagen(file, maxSize = 320, calidad = 0.85) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    lector.onerror = reject;
    lector.readAsDataURL(file);
  });
}
