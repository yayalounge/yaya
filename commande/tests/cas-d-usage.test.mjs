import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deps, fauxKerro, k, MENU } from './aides.mjs';
import { passerCommande, suivreCommandes, ecranCuisine, changerStatutCommande, encaisserTable, mettreEnPause, connexionComptoir, carteClient, purger, liensTables } from '../src/application/cas-d-usage.js';
import { stockageMemoire } from '../src/adaptateurs/sortants/stockage-memoire.js';

const smash = { article: 'plats/yaya-smash', quantite: 1 };
const cmd = (d, table = 4, extra = {}) => passerCommande(d, { table, k: k(table), lignes: [smash], appareil: `appareil-${Math.random()}`, reseau: 'R', ...extra });

test('parcours complet : commande, validation par la cuisine, service, encaissement', async () => {
  const d = deps();
  const c = await cmd(d, 4, { lignes: [{ article: 'plats/yaya-smash', quantite: 2 }, { article: 'chichas/chicha-tete-plate', quantite: 1, choix: 'Mi Amor' }] });
  assert.equal(c.numero, 1);
  assert.equal(c.table, 4);
  assert.equal(c.totalCentimes, 2600);
  assert.equal(c.statut, 'nouvelle');

  let ecran = await ecranCuisine(d);
  assert.equal(ecran.commandes.length, 1);
  assert.equal(ecran.totaux.centimes, 2600);

  await changerStatutCommande(d, { id: c.id, statut: 'validee' });
  assert.equal((await suivreCommandes(d, [c.id]))[0].statut, 'validee', 'le client voit que la cuisine a accepté');
  await changerStatutCommande(d, { id: c.id, statut: 'servie' });
  await encaisserTable(d, { table: 4, jour: ecran.jour });
  ecran = await ecranCuisine(d);
  assert.equal(ecran.commandes[0].reglee, true, 'reste visible 10 minutes');
  d.horloge.t = new Date(d.horloge.t.getTime() + 11 * 60_000);
  assert.equal((await ecranCuisine(d)).commandes.length, 0);
});

test('QR faux, pause, horaires : refus', async () => {
  const d = deps();
  await assert.rejects(passerCommande(d, { table: 4, k: k(5), lignes: [smash], appareil: 'x', reseau: 'R' }), { code: 'table_inconnue' });
  await mettreEnPause(d, true);
  await assert.rejects(cmd(d), { code: 'pause' });
  await mettreEnPause(d, false);
  d.horloge.t = new Date('2026-11-19T12:00:00Z');
  await assert.rejects(cmd(d), { code: 'ferme' });
});

test('après minuit : la commande va dans la soirée de la veille, la cuisine la voit', async () => {
  const d = deps({ maintenant: new Date('2026-11-19T22:50:00Z') }); // 23 h 50
  await cmd(d, 1);
  d.horloge.t = new Date('2026-11-19T23:30:00Z'); // 0 h 30
  await cmd(d, 2);
  const e = await ecranCuisine(d);
  assert.equal(e.jour, '2026-11-19');
  assert.deepEqual(e.commandes.map((c) => c.numero), [1, 2]);
  d.horloge.t = new Date('2026-11-20T06:30:00Z'); // lendemain 7 h 30 : les commandes non terminées restent
  assert.equal((await ecranCuisine(d)).commandes.length, 2);
});

test('20 tables qui commandent en même temps : aucune commande perdue, numéros uniques', async () => {
  const d = deps();
  const toutes = await Promise.all(Array.from({ length: 20 }, (_, i) => cmd(d, i + 1)));
  assert.deepEqual(toutes.map((c) => c.numero).sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i + 1));
  assert.equal((await ecranCuisine(d)).commandes.length, 20);
});

test('garde-fous de bout en bout : 3 commandes en attente par table, 30 s par téléphone', async () => {
  const d = deps();
  await cmd(d, 7); await cmd(d, 7); await cmd(d, 7);
  await assert.rejects(cmd(d, 7), { code: 'table_pleine' });
  await cmd(d, 8, { appareil: 'meme-telephone-0001' });
  await assert.rejects(cmd(d, 9, { appareil: 'meme-telephone-0001' }), { code: 'trop_rapide' });
});

test('suivi : seulement les identifiants connus, format vérifié', async () => {
  const d = deps();
  const c = await cmd(d);
  assert.equal((await suivreCommandes(d, [c.id, 'bidon', '2026-11-19.inexistant-0000000000'])).length, 1);
  assert.deepEqual(await suivreCommandes(d, 'x'), []);
  const vue = (await suivreCommandes(d, [c.id]))[0];
  assert.equal(vue.historique, undefined, 'pas de détails internes côté client');
});

test('statut : transitions vérifiées, commande inconnue', async () => {
  const d = deps();
  const c = await cmd(d);
  await assert.rejects(changerStatutCommande(d, { id: c.id, statut: 'servie' }), { code: 'transition_impossible' });
  await assert.rejects(changerStatutCommande(d, { id: '2026-11-19.zzzzzzzzzzzzzzzzzz', statut: 'validee' }), { code: 'commande_inconnue' });
  await assert.rejects(changerStatutCommande(d, { id: '../etat', statut: 'validee' }), { code: 'commande_inconnue' });
});

test('carte : Kerro injoignable → dernière carte gardée ; jamais vue → refus clair', async () => {
  const stockage = stockageMemoire();
  let enPanne = false;
  const kerro = fauxKerro(() => (enPanne ? new Error('panne') : MENU));
  const d = deps({ kerro, stockage });
  await carteClient(d);
  enPanne = true;
  d.horloge.t = new Date(d.horloge.t.getTime() + 60_000);
  const { carte } = await carteClient(deps({ kerro, stockage }));
  assert.ok(carte.rubriques.length > 3);
  await assert.rejects(carteClient(deps({ kerro, stockage: stockageMemoire() })), { code: 'carte_indisponible' });
});

test('carte gardée 30 s en mémoire : Kerro n’est pas appelé à chaque client', async () => {
  const kerro = fauxKerro();
  const d = deps({ kerro });
  for (let i = 0; i < 10; i++) await carteClient(d);
  assert.equal(kerro.appels(), 1);
});

test('code de la cuisine : 8 essais par quart d’heure, puis blocage', async () => {
  const d = deps();
  assert.equal(await connexionComptoir(d, { code: '246810', reseau: 'R' }), true);
  for (let i = 0; i < 8; i++) assert.equal(await connexionComptoir(d, { code: '000000', reseau: 'R' }), false);
  await assert.rejects(connexionComptoir(d, { code: '246810', reseau: 'R' }), { code: 'trop_d_essais' });
  assert.equal(await connexionComptoir(d, { code: '246810', reseau: 'autre' }), true);
  d.horloge.t = new Date(d.horloge.t.getTime() + 16 * 60_000);
  assert.equal(await connexionComptoir(d, { code: '246810', reseau: 'R' }), true);
});

test('purge après 90 jours, liens des 20 tables', async () => {
  const d = deps();
  await d.stockage.ecrire('jour/2026-01-01', {}, null);
  await d.stockage.ecrire('jour/2026-11-01', {}, null);
  assert.equal(await purger(d), 1);
  assert.deepEqual(await d.stockage.lister('jour/'), ['jour/2026-11-01']);
  const liens = liensTables(d, 'https://commande.yaya-lounge.fr');
  assert.equal(liens.length, 20);
  assert.equal(liens[11].lien, `https://commande.yaya-lounge.fr/t/12?k=${k(12)}`);
});
