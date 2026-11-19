// Clé d'un nom : sans accents, casse, espaces ni signes (« Cœur coulant » → « coeur-coulant »).
export const cle = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Texte saisi par un client : une ligne, sans caractères de contrôle, coupé à la longueur permise.
export const propre = (s, max) =>
  String(s ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
