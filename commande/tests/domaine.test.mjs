import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../config.json' with { type: 'json' };
import { lireCarteKerro, trouverArticle } from '../src/domaine/carte.js';
import { chiffrerPanier } from '../src/domaine/panier.js';
import { creerCommande, changerStatut, reglerTable } from '../src/domaine/commande.js';
import { estOuvert, jourDeService } from '../src/domaine/service.js';
import { tableValide, signerTable } from '../src/domaine/table.js';
import { verifierGardeFous, noterPassage } from '../src/domaine/garde-fous.js';
import { cle, propre } from '../src/domaine/texte.js';
import { MENU, SECRET } from './aides.mjs';

const carte = lireCarteKerro(MENU, { photosSite: config.photosSite });
const L = config.limites;

test('clé des noms', () => {
  assert.equal(cle('Cœur coulant'), 'coeur-coulant');
  assert.equal(cle('Yäya Smash XL'), 'yaya-smash-xl');
  assert.equal(propre('  a\u0000b‮  c ', 80), 'a b c');
});

test('carte : seuls les produits à prix se commandent, les choix viennent des listes « · »', () => {
  const chichas = carte.rubriques.find((r) => r.id === 'chichas');
  assert.deepEqual(chichas.articles.map((a) => a.nom), ['Chicha tête plate', 'Chicha Quasar']);
  assert.equal(chichas.articles[0].choix.libelle, 'Goûts');
  assert.ok(chichas.articles[0].choix.options.includes('Menthe sucrée'));
  const softs = trouverArticle(carte, 'boissons-fraiches/softs').article;
  assert.equal(softs.choix.libelle, 'Au choix');
  assert.ok(softs.choix.options.includes('Red Bull'));
  assert.equal(softs.description, null);
  assert.equal(trouverArticle(carte, 'plats/yaya-smash').article.prix, 700);
  assert.equal(trouverArticle(carte, 'boissons-chaudes/cafe').article.prix, 250);
  assert.equal(trouverArticle(carte, 'plats/yaya-smash').article.photo, 'https://yaya-lounge.fr/photos/yaya-smash.webp');
  assert.equal(trouverArticle(carte, 'plats/frites').article.photo, null, 'photo supprimée par le gérant');
  assert.equal(trouverArticle(carte, 'plats/pasta-carbo').article.choix, null);
});

test('carte illisible ou vide : refus', () => {
  assert.throws(() => lireCarteKerro({}), { code: 'carte_illisible' });
  assert.throws(() => lireCarteKerro({ sections: [{ id: 'x', title: 'X', items: [{ name: 'Rien', price: null }] }] }), { code: 'carte_vide' });
});

test('panier : prix de la carte, jamais celui du téléphone', () => {
  const p = chiffrerPanier([{ article: 'plats/yaya-smash', quantite: 2, prix: 1 }, { article: 'chichas/chicha-tete-plate', quantite: 1, choix: 'Menthe' }], carte, L);
  assert.equal(p.totalCentimes, 2 * 700 + 1200);
  assert.equal(p.lignes[0].prixUnitaire, 700);
});

test('panier : lignes identiques fusionnées, remarques gardées à part', () => {
  const p = chiffrerPanier([
    { article: 'plats/frites', quantite: 1 },
    { article: 'plats/frites', quantite: 2 },
    { article: 'plats/frites', quantite: 1, remarque: 'bien cuites' },
  ], carte, L);
  assert.equal(p.lignes.length, 2);
  assert.equal(p.lignes[0].quantite, 3);
  assert.equal(p.lignes[1].remarque, 'bien cuites');
});

test('panier : refus clairs', () => {
  const c = (d) => () => chiffrerPanier(d, carte, L);
  assert.throws(c([]), { code: 'panier_vide' });
  assert.throws(c('x'), { code: 'panier_vide' });
  assert.throws(c([{ article: 'plats/caviar', quantite: 1 }]), { code: 'article_indisponible' });
  assert.throws(c([{ article: 'plats/frites', quantite: 0 }]), { code: 'quantite_invalide' });
  assert.throws(c([{ article: 'plats/frites', quantite: 1.5 }]), { code: 'quantite_invalide' });
  assert.throws(c([{ article: 'plats/frites', quantite: 11 }]), { code: 'quantite_invalide' });
  assert.throws(c([{ article: 'plats/frites', quantite: 6 }, { article: 'plats/frites', quantite: 6 }]), { code: 'quantite_invalide' });
  assert.throws(c([{ article: 'chichas/chicha-quasar', quantite: 1 }]), { code: 'choix_requis' });
  assert.throws(c([{ article: 'chichas/chicha-quasar', quantite: 1, choix: 'Vanille' }]), { code: 'choix_invalide' });
  const gros = ['plats/yaya-smash', 'plats/yaya-smash-xl', 'plats/pasta-carbo', 'plats/pasta-salmon'].map((article) => ({ article, quantite: 10 }));
  assert.throws(c(gros), { code: 'panier_trop_gros' });
  assert.throws(c([{ article: 'chichas/chicha-quasar', quantite: 10, choix: 'Menthe' }, { article: 'chichas/chicha-tete-plate', quantite: 10, choix: 'Menthe' }]), { code: 'total_trop_eleve' });
  assert.throws(c(Array.from({ length: 21 }, () => ({ article: 'plats/frites', quantite: 1 }))), { code: 'panier_trop_long' });
});

test('remarque coupée à 80 caractères', () => {
  const p = chiffrerPanier([{ article: 'plats/frites', quantite: 1, remarque: 'x'.repeat(500) }], carte, L);
  assert.equal(p.lignes[0].remarque.length, 80);
});

test('statuts : la cuisine valide, sert, ou refuse ; retours possibles', () => {
  const t = new Date('2026-11-19T20:00:00Z');
  let c = creerCommande({ id: 'a', numero: 1, table: 3, lignes: [], totalCentimes: 700, maintenant: t });
  assert.equal(c.statut, 'nouvelle');
  assert.throws(() => changerStatut(c, 'servie', t), { code: 'transition_impossible' });
  c = changerStatut(c, 'validee', t);
  c = changerStatut(c, 'servie', t);
  c = changerStatut(c, 'validee', t);
  c = changerStatut(c, 'refusee', t);
  c = changerStatut(c, 'nouvelle', t);
  assert.equal(c.historique.length, 6);
  assert.throws(() => changerStatut(c, 'mangee', t), { code: 'statut_inconnu' });
});

test('encaisser une table : seulement ses commandes servies', () => {
  const t = new Date();
  const a = changerStatut(changerStatut(creerCommande({ id: 'a', numero: 1, table: 3, lignes: [], totalCentimes: 700, maintenant: t }), 'validee', t), 'servie', t);
  const b = creerCommande({ id: 'b', numero: 2, table: 3, lignes: [], totalCentimes: 500, maintenant: t });
  const c = changerStatut(changerStatut(creerCommande({ id: 'c', numero: 3, table: 4, lignes: [], totalCentimes: 500, maintenant: t }), 'validee', t), 'servie', t);
  const r = reglerTable([a, b, c], 3, t);
  assert.deepEqual(r.map((x) => x.reglee), [true, false, false]);
  assert.throws(() => reglerTable(r, 3, t), { code: 'rien_a_regler' });
  assert.throws(() => changerStatut(r[0], 'validee', t), { code: 'deja_reglee' });
});

test('horaires 17 h - 2 h, heure de Paris, été comme hiver', () => {
  const h = config.horaires;
  assert.equal(estOuvert(new Date('2026-11-19T15:59:00Z'), h), false); // 16 h 59
  assert.equal(estOuvert(new Date('2026-11-19T16:00:00Z'), h), true); // 17 h
  assert.equal(estOuvert(new Date('2026-11-20T00:59:00Z'), h), true); // 1 h 59
  assert.equal(estOuvert(new Date('2026-11-20T01:00:00Z'), h), false); // 2 h
  assert.equal(estOuvert(new Date('2026-07-01T15:00:00Z'), h), true); // 17 h l'été (UTC+2)
  assert.equal(jourDeService(new Date('2026-11-20T00:30:00Z'), h), '2026-11-19'); // 1 h 30 → soirée de la veille
  assert.equal(jourDeService(new Date('2026-11-20T06:00:00Z'), h), '2026-11-20');
  assert.equal(jourDeService(new Date('2027-01-01T01:00:00Z'), h), '2026-12-31');
});

test('QR des tables : signature exigée, table hors plage refusée', () => {
  const k = signerTable(SECRET, '1', 12);
  assert.equal(tableValide(SECRET, '1', 20, 12, k), true);
  assert.equal(tableValide(SECRET, '1', 20, 13, k), false);
  assert.equal(tableValide(SECRET, '2', 20, 12, k), false, 'nouvelle version = anciens QR refusés');
  assert.equal(tableValide(SECRET, '1', 20, 21, signerTable(SECRET, '1', 21)), false);
  assert.equal(tableValide(SECRET, '1', 20, 12, 'x'), false);
  assert.equal(tableValide('autre-secret', '1', 20, 12, k), false);
});

test('garde-fous : table saturée, appareil trop rapide, réseau trop bavard', () => {
  const t = new Date('2026-11-19T20:00:00Z');
  const base = { commandes: [], journal: [], table: 5, appareil: 'A', reseau: 'R', maintenant: t, limites: L };
  const ouverte = { table: 5, statut: 'nouvelle' };
  assert.throws(() => verifierGardeFous({ ...base, commandes: [ouverte, ouverte, ouverte] }), { code: 'table_pleine' });
  assert.doesNotThrow(() => verifierGardeFous({ ...base, commandes: [ouverte, ouverte, { table: 5, statut: 'servie' }] }));
  const journal = noterPassage([], { appareil: 'A', reseau: 'R', maintenant: new Date(t - 10_000) });
  assert.throws(() => verifierGardeFous({ ...base, journal }), { code: 'trop_rapide' });
  assert.doesNotThrow(() => verifierGardeFous({ ...base, journal, appareil: 'B' }));
  const plein = Array.from({ length: L.commandesParHeureParReseau }, (_, i) => ({ a: `x${i}`, r: 'R', t: t - 60_000 }));
  assert.throws(() => verifierGardeFous({ ...base, journal: plein, appareil: 'C' }), { code: 'trop_de_commandes' });
});
