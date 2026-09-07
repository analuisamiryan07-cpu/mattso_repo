import Sqids from 'sqids';

/**
 * Baraja el alfabeto por defecto de forma determinística a partir de ID_HASH_SECRET.
 * El objetivo es que el alfabeto real usado en producción NO viva en el código fuente
 * (que es público en el repositorio) — solo en la variable de entorno, igual que
 * JWT_SECRET o ADMIN_API_KEY. Sin esto, cualquiera que vea el repositorio podría
 * calcular el hash de cualquier ID por su cuenta sin necesidad de fuerza bruta.
 */
function seededShuffle(input: string, seed: string): string {
  // xmur3 (hash del seed) + sfc32 (PRNG determinístico) — sin dependencias externas.
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const rand = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const chars = input.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const DEFAULT_ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MIN_LENGTH = 8;

const secret = process.env.ID_HASH_SECRET;
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error(
    'ID_HASH_SECRET no configurado. Es obligatorio en producción: sin esto, el alfabeto ' +
      'de ofuscación de IDs quedaría dependiendo únicamente del código fuente, que es público.',
  );
}

const ALPHABET = seededShuffle(DEFAULT_ALPHABET, secret ?? 'dev-secret-cambiar-en-produccion');
const sqids = new Sqids({ alphabet: ALPHABET, minLength: MIN_LENGTH });

/** Convierte un ID real (bigint/number) de PostgreSQL en el identificador ofuscado que ve el cliente. */
export function encodeId(id: number | bigint): string {
  return sqids.encode([Number(id)]);
}

/**
 * Decodifica un identificador ofuscado de vuelta al ID real.
 *
 * Devuelve `null` (nunca lanza) si el valor no tiene el formato esperado — longitud
 * mínima, alfabeto correcto, o si no decodifica a un único entero positivo — o si el
 * string no es exactamente la codificación canónica de ese entero. Esta última
 * comprobación (round-trip) es la que realmente rechaza intentos de fuerza bruta con
 * strings inventados: no basta con que el string "decodifique a algo", tiene que ser
 * el hash exacto que este mismo servicio habría generado para ese ID.
 */
export function decodeId(hash: unknown): number | null {
  if (typeof hash !== 'string' || hash.length < MIN_LENGTH) return null;
  if (!/^[A-Za-z0-9]+$/.test(hash)) return null;

  const decoded = sqids.decode(hash);
  if (decoded.length !== 1) return null;

  const [id] = decoded;
  if (!Number.isInteger(id) || id <= 0) return null;
  if (sqids.encode([id]) !== hash) return null;

  return id;
}
