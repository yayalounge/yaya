import { ErreurMetier } from '../domaine/erreurs.js';
import { chiffrerPanier } from '../domaine/panier.js';
import { creerCommande, changerStatut, reglerTable, vueClient, enAttente } from '../domaine/commande.js';
import { estOuvert, jourDeService, libelleHoraires } from '../domaine/service.js';
import { tableValide, signerTable } from '../domaine/table.js';
import { verifierGardeFous, noterPassage, verifierEssais } from '../domaine/garde-fous.js';
import { modifier } from './modifier.js';

// Cas d'usage : ils ne parlent qu'aux ports (deps.carte, deps.stockage, deps.horloge) et au domaine.
// deps = { carte: SourceCarte, stockage: Stockage, horloge: Horloge, config, secret, versionTables, codeComptoir, aleatoire }

const cleJour = (jour) => `jour/${jour}`;
const jourVide = (jour) => () => ({ jour, sequence: 0, commandes: [], journal: [] });
const ETAT = 'etat';
const lireEtat = async (stockage) => (await stockage.lire(ETAT))?.valeur ?? { pause: false };

export async function etatService(deps) {
  const maintenant = deps.horloge.maintenant();
  const { pause } = await lireEtat(deps.stockage);
  return { ouvert: estOuvert(maintenant, deps.config.horaires), pause, horaires: libelleHoraires(deps.config.horaires) };
}

export async function carteClient(deps) {
  const [carte, etat] = await Promise.all([deps.carte.charger(), etatService(deps)]);
  return { carte, etat };
}

export function verifierTable(deps, table, k) {
  if (!tableValide(deps.secret, deps.versionTables, deps.config.tables, table, k)) {
    throw new ErreurMetier('table_inconnue', 'Ce QR code n’est pas reconnu. Demandez au comptoir.', 403);
  }
}

export async function passerCommande(deps, { table, k, lignes, appareil, reseau }) {
  const { config, stockage, horloge } = deps;
  verifierTable(deps, table, k);
  const maintenant = horloge.maintenant();
  const etat = await lireEtat(stockage);
  if (etat.pause) throw new ErreurMetier('pause', 'Les commandes par téléphone sont en pause. Commandez au comptoir.', 503);
  if (!estOuvert(maintenant, config.horaires)) throw new ErreurMetier('ferme', `Les commandes sont ouvertes ${libelleHoraires(config.horaires)}.`, 403);

  const carte = await deps.carte.charger();
  const panier = chiffrerPanier(lignes, carte, config.limites);
  const jour = jourDeService(maintenant, config.horaires);

  return modifier(stockage, cleJour(jour), (doc) => {
    verifierGardeFous({ commandes: doc.commandes, journal: doc.journal, table, appareil, reseau, maintenant, limites: config.limites });
    doc.sequence += 1;
    const commande = creerCommande({ id: `${jour}.${deps.aleatoire()}`, numero: doc.sequence, table, ...panier, maintenant });
    doc.commandes.push(commande);
    doc.journal = noterPassage(doc.journal, { appareil, reseau, maintenant });
    return { valeur: doc, resultat: vueClient(commande) };
  }, jourVide(jour));
}

const ID = /^(\d{4}-\d{2}-\d{2})\.[A-Za-z0-9_-]{16,40}$/;

// Suivi sur le téléphone : seulement les commandes dont l'appareil connaît l'identifiant (tiré au hasard, 128 bits).
export async function suivreCommandes(deps, ids) {
  const voulus = [...new Set((Array.isArray(ids) ? ids : []).filter((i) => typeof i === 'string' && ID.test(i)))].slice(0, 12);
  const parJour = new Map();
  for (const id of voulus) {
    const jour = id.match(ID)[1];
    if (!parJour.has(jour)) parJour.set(jour, (await deps.stockage.lire(cleJour(jour)))?.valeur);
  }
  return voulus.map((id) => parJour.get(id.match(ID)[1])?.commandes.find((c) => c.id === id)).filter(Boolean).map(vueClient);
}

// ── Cuisine et comptoir ─────────────────────────────────────────────

export async function connexionComptoir(deps, { code, reseau }) {
  const maintenant = deps.horloge.maintenant();
  return modifier(deps.stockage, 'essais', (essais) => {
    const recents = verifierEssais(essais, reseau, maintenant, deps.config.limites.essaisCodeParQuartDHeure);
    const bon = deps.codeValide(code);
    for (const r of Object.keys(essais)) if (!(essais[r] ?? []).some((t) => maintenant - t < 15 * 60_000)) delete essais[r];
    if (bon) delete essais[reseau];
    else essais[reseau] = [...recents, maintenant.getTime()];
    return { valeur: essais, resultat: bon };
  }, () => ({}));
}

export async function ecranCuisine(deps) {
  const maintenant = deps.horloge.maintenant();
  const jour = jourDeService(maintenant, deps.config.horaires);
  const veille = new Date(`${jour}T12:00:00Z`);
  veille.setUTCDate(veille.getUTCDate() - 1);
  const jourVeille = veille.toISOString().slice(0, 10);
  const [auj, hier, etat] = await Promise.all([deps.stockage.lire(cleJour(jour)), deps.stockage.lire(cleJour(jourVeille)), etatService(deps)]);
  // La veille : seulement ce qui n'est pas terminé (un service qui déborde après 6 h ne perd rien).
  const anciennes = (hier?.valeur?.commandes ?? []).filter((c) => enAttente(c) || (c.statut === 'servie' && !c.reglee));
  const commandes = [...anciennes, ...(auj?.valeur?.commandes ?? [])];
  const totaux = {
    commandes: (auj?.valeur?.commandes ?? []).filter((c) => c.statut !== 'refusee').length,
    centimes: (auj?.valeur?.commandes ?? []).filter((c) => c.statut !== 'refusee').reduce((n, c) => n + c.totalCentimes, 0),
  };
  return { jour, etat, maintenant: maintenant.toISOString(), totaux, commandes: commandes.filter((c) => !c.reglee || maintenant - new Date(c.regleeLe) < 10 * 60_000) };
}

export async function changerStatutCommande(deps, { id, statut }) {
  const m = typeof id === 'string' && id.match(ID);
  if (!m) throw new ErreurMetier('commande_inconnue', 'Commande introuvable.', 404);
  const maintenant = deps.horloge.maintenant();
  return modifier(deps.stockage, cleJour(m[1]), (doc) => {
    const i = doc.commandes.findIndex((c) => c.id === id);
    if (i < 0) throw new ErreurMetier('commande_inconnue', 'Commande introuvable.', 404);
    doc.commandes[i] = changerStatut(doc.commandes[i], statut, maintenant);
    return { valeur: doc, resultat: doc.commandes[i] };
  }, jourVide(m[1]));
}

export async function encaisserTable(deps, { table, jour }) {
  if (!Number.isInteger(table) || table < 1 || table > deps.config.tables) throw new ErreurMetier('table_inconnue', 'Table inconnue.');
  if (typeof jour !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(jour)) throw new ErreurMetier('jour_inconnu', 'Jour inconnu.');
  const maintenant = deps.horloge.maintenant();
  return modifier(deps.stockage, cleJour(jour), (doc) => {
    doc.commandes = reglerTable(doc.commandes, table, maintenant);
    return { valeur: doc, resultat: true };
  }, jourVide(jour));
}

export async function mettreEnPause(deps, pause) {
  return modifier(deps.stockage, ETAT, (etat) => ({ valeur: { ...etat, pause: Boolean(pause) }, resultat: Boolean(pause) }), () => ({ pause: false }));
}

// QR des tables, pour l'impression depuis l'écran de la cuisine (la clé ne quitte jamais Netlify).
export const liensTables = (deps, origine) =>
  Array.from({ length: deps.config.tables }, (_, i) => ({ table: i + 1, lien: `${origine}/t/${i + 1}?k=${signerTable(deps.secret, deps.versionTables, i + 1)}` }));

// Effacer les journées plus vieilles que la durée de conservation (90 jours).
export async function purger(deps) {
  const limite = new Date(deps.horloge.maintenant().getTime() - deps.config.conservationJours * 86400_000).toISOString().slice(0, 10);
  const vieilles = (await deps.stockage.lister('jour/')).filter((k) => k.slice(5) < limite);
  for (const k of vieilles) await deps.stockage.supprimer(k);
  return vieilles.length;
}
