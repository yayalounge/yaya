import { ErreurMetier } from './erreurs.js';

// Vie d'une commande. La cuisine valide à la main chaque commande reçue : rien ne se prépare sans elle.
//   nouvelle ──valider──▶ validee ──servir──▶ servie
//      │                    │
//      └──refuser──▶ refusee ◀──annuler──┘
// Retours permis pour corriger un geste de trop : validee → nouvelle, servie → validee, refusee → nouvelle.
export const STATUTS = ['nouvelle', 'validee', 'servie', 'refusee'];
const PERMIS = {
  nouvelle: ['validee', 'refusee'],
  validee: ['servie', 'refusee', 'nouvelle'],
  servie: ['validee'],
  refusee: ['nouvelle'],
};
export const enAttente = (c) => c.statut === 'nouvelle' || c.statut === 'validee';

export function creerCommande({ id, numero, table, lignes, totalCentimes, maintenant }) {
  const le = maintenant.toISOString();
  return { id, numero, table, lignes, totalCentimes, statut: 'nouvelle', creeLe: le, modifieLe: le, reglee: false, historique: [{ statut: 'nouvelle', le }] };
}

export function changerStatut(commande, statut, maintenant) {
  if (!STATUTS.includes(statut)) throw new ErreurMetier('statut_inconnu', 'Statut inconnu.');
  if (commande.reglee) throw new ErreurMetier('deja_reglee', 'Cette commande est déjà réglée.', 409);
  if (!PERMIS[commande.statut].includes(statut)) throw new ErreurMetier('transition_impossible', 'La commande a déjà changé : l’écran se met à jour.', 409);
  const le = maintenant.toISOString();
  return { ...commande, statut, modifieLe: le, historique: [...commande.historique, { statut, le }].slice(-20) };
}

// Le client a payé au comptoir : ses commandes servies de la table passent en « réglées » (elles quittent l'écran).
export function reglerTable(commandes, table, maintenant) {
  const le = maintenant.toISOString();
  let n = 0;
  const resultat = commandes.map((c) => {
    if (c.table !== table || c.statut !== 'servie' || c.reglee) return c;
    n++;
    return { ...c, reglee: true, regleeLe: le, modifieLe: le };
  });
  if (!n) throw new ErreurMetier('rien_a_regler', 'Rien à encaisser pour cette table.', 409);
  return resultat;
}

// Ce que voit le client sur son téléphone : pas l'historique interne.
export const vueClient = (c) => ({
  id: c.id,
  numero: c.numero,
  table: c.table,
  statut: c.statut,
  reglee: c.reglee,
  creeLe: c.creeLe,
  totalCentimes: c.totalCentimes,
  lignes: c.lignes.map(({ nom, quantite, choix, remarque, total }) => ({ nom, quantite, choix, remarque, total })),
});
