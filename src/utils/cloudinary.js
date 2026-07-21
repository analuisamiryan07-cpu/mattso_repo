const CLOUD    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const BASE_IMG = `https://res.cloudinary.com/${CLOUD}/image/upload`;
const BASE_VID = `https://res.cloudinary.com/${CLOUD}/video/upload`;

function encodeId(publicId) {
  return publicId.split('/').map(s => encodeURIComponent(s)).join('/');
}

export function cloudinaryUrl(publicId, opts = {}) {
  if (!publicId) return '';
  const { width, height, crop = 'fill', gravity = 'auto' } = opts;
  const parts = [
    'f_auto', 'q_auto',
    width  && `w_${width}`,
    height && `h_${height}`,
    `c_${crop}`,
    `g_${gravity}`,
  ].filter(Boolean);
  return `${BASE_IMG}/${parts.join(',')}/${encodeId(publicId)}`;
}

export function cloudinaryVideoUrl(publicId) {
  if (!publicId) return '';
  return `${BASE_VID}/f_auto,q_auto/${encodeId(publicId)}`;
}

export function cloudinarySrcSet(publicId, opts = {}) {
  const src  = cloudinaryUrl(publicId, opts);
  const src2 = cloudinaryUrl(publicId, {
    ...opts,
    width:  opts.width  ? opts.width  * 2 : undefined,
    height: opts.height ? opts.height * 2 : undefined,
  });
  return { src, srcSet: `${src} 1x, ${src2} 2x` };
}
