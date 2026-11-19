import { chargerProjet } from './faux-google.mjs';
import { CARTE, OPTIONS, PLAN } from './carte-reelle.mjs';

// Une soirée au Yäya dans la copie fidèle de Google : la vraie appli du gérant, une carte, un plan de 20 tables,
// Sam dans l'équipe (code 1234). Sert aux essais (commande-table.test.mjs) et à l'essai dans un navigateur
// (outils/essai-local.mjs).

export const SERVEUR = 'cle-serveur-de-test', GERANT = 'cle-gerant-de-test';
export const AU_SALON = { lat: 48.92751, lng: 2.22291, acc: 35 };
export const SOIR = Date.parse('2026-11-19T20:30:00Z'); // 21 h 30 à Paris

export function projet({ heure = SOIR, horloge = null, reelle = false } = {}) {
  let t = heure;
  const p = chargerProjet({ onglets: {}, proprietes: { KEY_SERVEUR: SERVEUR, KEY_GERANT: GERANT, ADMIN_PIN: '9999' }, maintenant: horloge || (() => t) });
  const SH = p.appel('SH'), HEAD = p.appel('HEAD');
  for (const k of Object.keys(SH)) p.classeur.insertSheet(SH[k]).v.push(k === 'etat' ? [] : [...HEAD[k]]);
  const remplir = (k, lignes) => p.classeur.onglet(SH[k]).v.push(...lignes);
  if (reelle) { remplir('carte', CARTE); remplir('options', OPTIONS); remplir('plan', PLAN); } else {
    remplir('carte', [
    ['Plats', 'Yaya Smash', 12, '', 'Burger maison, frites', true],
    ['Plats', 'Frites', 4, '', '', true],
    ['Chichas', 'Chicha tête plate', 15, 'gout', '', true],
    ['Boissons', 'Soft', 4, 'soft', '', true],
    ['Desserts', 'Cœur coulant', 7, '', '', true],
    ['Desserts', 'Ancien dessert', 6, '', '', false],
    ]);
    remplir('options', [['gout', 'Goût', 'Menthe', 0], ['gout', 'Goût', 'Love 66', 0], ['soft', 'Boisson', 'Coca', 0], ['soft', 'Boisson', 'Red Bull', 1]]);
    remplir('plan', Array.from({ length: 20 }, (_, i) => [i + 1, (i % 5) + 1, Math.floor(i / 5) + 1, 1]));
  }
  remplir('equipe', [['Sam', '1234', true, '', '']]);
  const api = (action, q = {}, cle = SERVEUR) => p.ctx.api(cle, action, { _pin: '1234', ...q });
  // Un téléphone au salon donne sa position (obligatoire) ; les essais qui veulent l'oublier passent pos: null.
  const post = (yayaCmd, ...args) => {
    if (yayaCmd === 'commander' && args[0] && typeof args[0] === 'object' && !('pos' in args[0])) args[0] = { ...args[0], pos: AU_SALON };
    return JSON.parse(p.ctx.doPost({ postData: { contents: JSON.stringify({ yayaCmd, args }) } }).getContent());
  };
  const k = (n) => p.ctx.webSigne_(n);
  const etat = () => p.ctx.readState_();
  const avancer = (ms) => { t += ms; };
  return { ...p, SH, api, post, k, etat, avancer, onglet: (key) => p.classeur.onglet(SH[key]).v };
}

