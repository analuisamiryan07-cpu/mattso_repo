const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const BASE  = `https://res.cloudinary.com/${CLOUD}/image/upload`;

/**
 * Genera una URL optimizada de Cloudinary.
 *
 * @param {string} publicId  - ID público de la imagen en Cloudinary (ej: "matsso/cert-soldadura")
 * @param {object} opts
 *   @param {number}  opts.width   - Ancho en px (opcional)
 *   @param {number}  opts.height  - Alto en px (opcional)
 *   @param {string}  opts.crop    - Tipo de recorte: 'fill' | 'fit' | 'scale' (default: 'fill')
 *   @param {string}  opts.gravity - Punto focal: 'auto' | 'face' | 'center' (default: 'auto')
 * @returns {string} URL completa con transformaciones
 */
export function cloudinaryUrl(publicId, opts = {}) {
  if (!publicId) return '';

  const {
    width,
    height,
    crop    = 'fill',
    gravity = 'auto',
  } = opts;

  const parts = [
    `f_auto`,          // formato automático (WebP en Chrome, AVIF donde se soporte)
    `q_auto`,          // calidad automática (Cloudinary elige el mejor balance)
    width   && `w_${width}`,
    height  && `h_${height}`,
    `c_${crop}`,
    `g_${gravity}`,
  ].filter(Boolean);

  return `${BASE}/${parts.join(',')}/${publicId}`;
}

/**
 * URL con srcSet para pantallas retina (1x y 2x).
 * Devuelve { src, srcSet } para usar en <img>.
 */
export function cloudinarySrcSet(publicId, opts = {}) {
  const src  = cloudinaryUrl(publicId, opts);
  const src2 = cloudinaryUrl(publicId, {
    ...opts,
    width:  opts.width  ? opts.width  * 2 : undefined,
    height: opts.height ? opts.height * 2 : undefined,
  });
  return { src, srcSet: `${src} 1x, ${src2} 2x` };
}
