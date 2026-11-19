import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ErreurMetier } from '../../domaine/erreurs.js';

// Outils communs des fonctions Netlify (adaptateurs entrants HTTP).

const ENTETES = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
};

export const json = (corps, statut = 200, plus = {}) => new Response(JSON.stringify(corps), { status: statut, headers: { ...ENTETES, ...plus } });

export function erreur(e) {
  if (e instanceof ErreurMetier) return json({ erreur: e.code, message: e.message }, e.statut);
  console.error('[erreur]', e);
  return json({ erreur: 'interne', message: 'Un souci technique. Réessayez, ou commandez au comptoir.' }, e?.statut === 503 ? 503 : 500);
}

// Corps JSON d'au plus 16 Ko, envoyé depuis notre propre page (anti-CSRF : origine vérifiée + type JSON).
export async function lireCorps(req, max = 16_384) {
  if (!/^application\/json\b/i.test(req.headers.get('content-type') ?? '')) throw new ErreurMetier('type_refuse', 'Requête refusée.', 415);
  verifierOrigine(req);
  const texte = await req.text();
  if (texte.length > max) throw new ErreurMetier('trop_gros', 'Requête trop grosse.', 413);
  try { return JSON.parse(texte); } catch { throw new ErreurMetier('json_illisible', 'Requête illisible.'); }
}

export function verifierOrigine(req) {
  const origine = req.headers.get('origin');
  if (origine && origine !== new URL(req.url).origin) throw new ErreurMetier('origine_refusee', 'Requête refusée.', 403);
}

// Empreinte du réseau (adresse IP) : sert aux limites, jamais rangée en clair.
export const empreinteReseau = (secret, ip) => createHmac('sha256', secret).update(`reseau:${ip || 'inconnu'}`).digest('base64url').slice(0, 16);
export const ipDe = (req, context) => context?.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';

export const aleatoire = () => randomBytes(16).toString('base64url');

// ── Session de la cuisine : jeton signé dans un cookie HttpOnly, SameSite=Strict ─────────
const COOKIE = '__Host-yaya-cuisine';
const signer = (secret, data) => createHmac('sha256', secret).update(`cuisine:${data}`).digest('base64url');

export function cookieSession(secret, heures, maintenant = Date.now()) {
  const data = Buffer.from(JSON.stringify({ e: maintenant + heures * 3600_000, n: aleatoire() })).toString('base64url');
  return `${COOKIE}=${data}.${signer(secret, data)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${heures * 3600}`;
}
export const cookieEfface = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function sessionValide(req, secret, maintenant = Date.now()) {
  const brut = (req.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!brut) return false;
  const [data, sig] = brut.split('.');
  if (!data || !sig) return false;
  const a = Buffer.from(signer(secret, data)), b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(data, 'base64url').toString()).e > maintenant; } catch { return false; }
}

export function codeEgal(attendu, recu) {
  if (typeof recu !== 'string' || !attendu) return false;
  const a = createHmac('sha256', 'code').update(attendu).digest(), b = createHmac('sha256', 'code').update(recu.trim()).digest();
  return timingSafeEqual(a, b);
}
