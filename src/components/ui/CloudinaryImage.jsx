import { cloudinarySrcSet } from '@utils/cloudinary';

/**
 * Muestra una imagen de Cloudinary con formato automático (WebP/AVIF),
 * compresión inteligente y soporte retina 2x.
 *
 * Props:
 *   publicId  {string}  ID de la imagen en Cloudinary, ej: "matsso/cert-soldadura"
 *   alt       {string}  Texto alternativo (requerido para accesibilidad)
 *   width     {number}  Ancho en px para las transformaciones (opcional)
 *   height    {number}  Alto en px para las transformaciones (opcional)
 *   crop      {string}  'fill' | 'fit' | 'scale' (default: 'fill')
 *   gravity   {string}  'auto' | 'face' | 'center' (default: 'auto')
 *   className {string}  Clase CSS adicional
 *   eager     {bool}    true = carga inmediata (hero), false = lazy (default)
 *   fallback  {string}  URL de imagen de respaldo si Cloudinary falla
 */
const CloudinaryImage = ({
  publicId,
  alt = '',
  width,
  height,
  crop,
  gravity,
  className,
  eager = false,
  fallback = 'https://placehold.co/600x400/002147/ffffff?text=Matsso',
  ...rest
}) => {
  const { src, srcSet } = cloudinarySrcSet(publicId, { width, height, crop, gravity });

  if (!publicId) {
    return <img src={fallback} alt={alt} className={className} {...rest} />;
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={(e) => { e.currentTarget.src = fallback; }}
      {...rest}
    />
  );
};

export default CloudinaryImage;
