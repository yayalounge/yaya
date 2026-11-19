// Page client (commande.yaya-lounge.fr) → moteur dans l'appli Google du gérant (doPost de son Apps Script).
// POST en text/plain : pas de pré-vol CORS ; Google répond par une redirection lisible (Access-Control-Allow-Origin *).
// Chaque réponse est { statut, corps }, comme une réponse HTTP.
const API = document.querySelector('meta[name="yaya-api"]').content;
async function api(fonction, ...args) {
  let r;
  try {
    const rep = await fetch(API, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ yayaCmd: fonction, args }), redirect: 'follow', credentials: 'omit', referrerPolicy: 'no-referrer' });
    r = await rep.json();
  } catch {
    throw Object.assign(new Error('Connexion impossible. Réessayez.'), { code: 'reseau', statut: 0 });
  }
  const { statut = 0, corps = {} } = r || {};
  if (statut < 200 || statut > 299) throw Object.assign(new Error(corps.message || 'Connexion impossible. Réessayez.'), { code: corps.erreur, statut });
  return corps;
}
