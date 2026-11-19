import { ErreurMetier } from './erreurs.js';
import { enAttente } from './commande.js';

// Limites contre les fausses commandes et les scripts. journal : [{ a: appareil, r: réseau (empreinte d'IP), t: ms }]
const HEURE = 3600_000;

export function verifierGardeFous({ commandes, journal, table, appareil, reseau, maintenant, limites }) {
  const t = maintenant.getTime();
  const ouvertes = commandes.filter((c) => c.table === table && enAttente(c)).length;
  if (ouvertes >= limites.commandesEnAttenteParTable) {
    throw new ErreurMetier('table_pleine', `Déjà ${ouvertes} commandes en attente pour cette table : patientez, ou demandez au comptoir.`, 429);
  }
  const dernier = journal.filter((j) => j.a === appareil).reduce((m, j) => Math.max(m, j.t), 0);
  const attente = limites.secondesEntreDeuxCommandesParAppareil * 1000 - (t - dernier);
  if (appareil && attente > 0) throw new ErreurMetier('trop_rapide', `Votre commande vient de partir. Réessayez dans ${Math.ceil(attente / 1000)} s.`, 429);
  const recentes = journal.filter((j) => j.r === reseau && t - j.t < HEURE).length;
  if (recentes >= limites.commandesParHeureParReseau) throw new ErreurMetier('trop_de_commandes', 'Trop de commandes depuis ce réseau. Demandez au comptoir.', 429);
}

export const noterPassage = (journal, { appareil, reseau, maintenant }) =>
  [...journal.filter((j) => maintenant.getTime() - j.t < HEURE), { a: appareil, r: reseau, t: maintenant.getTime() }].slice(-500);

// Essais du code du comptoir : 8 par quart d'heure et par réseau.
export function verifierEssais(essais, reseau, maintenant, max) {
  const t = maintenant.getTime();
  const recents = (essais[reseau] ?? []).filter((x) => t - x < 15 * 60_000);
  if (recents.length >= max) throw new ErreurMetier('trop_d_essais', 'Trop d’essais. Réessayez dans un quart d’heure.', 429);
  return recents;
}
