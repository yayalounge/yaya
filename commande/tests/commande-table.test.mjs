import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projet, SERVEUR, GERANT } from './soiree.mjs';

// Essais sur le vrai code de l'appli du gérant (apps-script/Code.gs branché + CommandeTable.gs), dans une copie
// fidèle de Google en mémoire. Ils jouent une soirée : le client commande au QR, l'équipe valide, sert, encaisse.

const appareil = (n = 1) => `telephone-de-test-${String(n).padStart(4, '0')}`;
const panier = [{ n: 'Yaya Smash', q: 2 }, { n: 'Chicha tête plate', sel: { gout: 'Menthe' }, q: 1 }, { n: 'Soft', sel: { soft: 'Red Bull' }, q: 1 }];

test('soirée complète : QR → « À valider » → validée = saisie normale → servie → encaissée dans les ventes', () => {
  const y = projet();
  // Service : Sam prend son service (code 1234, au lounge).
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  assert.ok(y.etat().soiree);

  // Le client scanne la table 7 : sa carte à lui, ses prix, ses options.
  const c = y.post('carte', 7, y.k(7));
  assert.equal(c.statut, 200);
  assert.equal(c.corps.table, 7);
  assert.equal(c.corps.etat.ouvert, true);
  assert.deepEqual(c.corps.carte.map((r) => r.nom), ['Plats', 'Chichas', 'Boissons', 'Desserts']);
  assert.ok(!c.corps.carte.flatMap((r) => r.articles).some((a) => a.n === 'Ancien dessert'), 'article inactif caché');
  assert.equal(c.corps.options.soft.choices[1].add, 1);
  assert.match(c.corps.carte[0].articles[0].photo, /yaya-smash\.webp$/);

  // Il commande : prix recalculés par l'appli (2 × 12 + 15 + 4 + 1 de supplément).
  const r = y.post('commander', { t: 7, k: y.k(7), lines: panier.map((l) => ({ ...l, p: 0.01 })) }, appareil(1));
  assert.equal(r.statut, 201, JSON.stringify(r));
  const cmd = r.corps.commande;
  assert.equal(cmd.total, 44);
  assert.equal(cmd.statut, 'nouvelle');
  assert.equal(y.onglet('ventes').length, 1, 'rien dans les ventes avant validation');
  assert.deepEqual(y.etat().tickets, [], 'rien en préparation avant validation');

  // L'iPad la reçoit dans l'état habituel (relu toutes les 8 s).
  const st = y.api('state', { rev: 0 }).state;
  assert.equal(st.web.length, 1);
  assert.equal(st.web[0].t, 7);

  // Sam valide : c'est l'action « send » de l'appli, comme s'il l'avait saisie.
  const ok = y.api('webOk', { id: st.web[0].id, _op: 'op-1' });
  assert.match(ok.msg, /Commande QR de la table 7 validée/);
  const apres = y.etat();
  assert.equal(apres.tickets.length, 1);
  assert.equal(apres.tickets[0].t, 7);
  assert.equal(apres.tickets[0].qr, 1);
  assert.equal(apres.tables[7].lines.reduce((a, l) => a + l.p * l.q, 0), 44);
  assert.equal(y.post('suivi', [cmd.id]).corps.commandes[0].statut, 'validee');

  // Renvoi après coupure réseau : jamais validée deux fois.
  assert.equal(y.api('webOk', { id: st.web[0].id, _op: 'op-1' }).dup, true);
  assert.throws(() => y.api('webOk', { id: st.web[0].id, _op: 'op-2' }), /déjà validée/);

  // Servie, puis encaissée : tout part dans Ventes et Lignes vendues, comme une commande au comptoir.
  y.api('done', { id: apres.tickets[0].id, _op: 'op-3' });
  assert.equal(y.post('suivi', [cmd.id]).corps.commandes[0].statut, 'servie');
  y.api('pay', { t: 7, kind: 'all', method: 'CB', _op: 'op-4' });
  assert.equal(y.post('suivi', [cmd.id]).corps.commandes[0].statut, 'reglee');
  const ventes = y.onglet('ventes');
  assert.equal(ventes.length, 2);
  assert.equal(ventes[1][3], 7);
  assert.equal(ventes[1][8], 44);
  const lignes = y.onglet('lignes').slice(1);
  assert.deepEqual(lignes.map((l) => [l[6], l[7], l[8], l[9]]), [['Yaya Smash', '', 2, 12], ['Chicha tête plate', 'Menthe', 1, 15], ['Soft', 'Red Bull', 1, 5]]);
});

test('refus : rien n’est vendu, le client voit « refusée »', () => {
  const y = projet();
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  const cmd = y.post('commander', { t: 3, k: y.k(3), lines: [{ n: 'Frites', q: 1 }] }, appareil(2)).corps.commande;
  y.api('webNo', { id: y.etat().web[0].id, _op: 'n1' });
  assert.equal(y.post('suivi', [cmd.id]).corps.commandes[0].statut, 'refusee');
  assert.equal(Object.keys(y.etat().tables).length, 0);
  assert.equal(y.etat().tickets.length, 0);
});

test('garde-fous : QR faux, soirée fermée, pause, prix et options, plafonds', () => {
  const y = projet();
  const cmd = (t, lines, a = appareil(9), k = y.k(t)) => y.post('commander', { t, k, lines }, a);
  // Pas de soirée ouverte : refus clair, rien d'écrit.
  assert.equal(cmd(5, [{ n: 'Frites', q: 1 }]).corps.erreur, 'ferme');
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  // QR d'une autre table, table absente du plan, signature inventée.
  assert.equal(cmd(5, [{ n: 'Frites', q: 1 }], appareil(10), y.k(6)).statut, 403);
  assert.equal(cmd(99, [{ n: 'Frites', q: 1 }], appareil(11), y.k(99)).statut, 403);
  assert.equal(y.post('carte', 5, 'AAAAAAAAAAAA').corps.table, null, 'la carte s’affiche quand même, sans table');
  // Article inconnu ou inactif, option manquante ou inventée, quantité folle.
  assert.equal(cmd(5, [{ n: 'Caviar', q: 1 }], appareil(12)).statut, 400);
  assert.equal(cmd(5, [{ n: 'Ancien dessert', q: 1 }], appareil(13)).statut, 400);
  assert.match(cmd(5, [{ n: 'Soft', q: 1 }], appareil(14)).corps.message, /Choisis : Boisson/);
  assert.equal(cmd(5, [{ n: 'Soft', sel: { soft: 'Champagne' }, q: 1 }], appareil(15)).statut, 400);
  assert.equal(cmd(5, [{ n: 'Frites', q: 500 }], appareil(16)).statut, 400);
  assert.equal(cmd(5, [], appareil(17)).corps.erreur, 'panier_vide');
  // Téléphone sans identifiant, puis deux commandes en moins de 30 s depuis le même téléphone.
  assert.equal(cmd(5, [{ n: 'Frites', q: 1 }], 'x').corps.erreur, 'appareil');
  assert.equal(cmd(5, [{ n: 'Frites', q: 1 }], appareil(20)).statut, 201);
  assert.equal(cmd(5, [{ n: 'Frites', q: 1 }], appareil(20)).corps.erreur, 'trop_rapide');
  // 3 commandes en attente au plus par table.
  assert.equal(cmd(5, [{ n: 'Frites', q: 1 }], appareil(21)).statut, 201);
  assert.equal(cmd(5, [{ n: 'Frites', q: 1 }], appareil(22)).statut, 201);
  assert.equal(cmd(5, [{ n: 'Frites', q: 1 }], appareil(23)).corps.erreur, 'table_pleine');
  // Pause par l'équipe.
  y.api('webPause', { on: true, _op: 'p1' });
  assert.equal(y.post('carte', 8, y.k(8)).corps.etat.ouvert, false);
  assert.equal(cmd(8, [{ n: 'Frites', q: 1 }], appareil(24)).corps.erreur, 'pause');
  y.api('webPause', { on: false, _op: 'p2' });
  assert.equal(cmd(8, [{ n: 'Frites', q: 1 }], appareil(24)).statut, 201);
});

test('point d’entrée public : seulement carte, commander, suivi ; rien de l’appli de l’équipe', () => {
  const y = projet();
  const brut = (contents) => JSON.parse(y.ctx.doPost({ postData: { contents } }).getContent());
  assert.equal(brut('pas du json').statut, 400);
  assert.equal(brut(JSON.stringify({ yayaCmd: 'state' })).statut, 404);
  assert.equal(brut(JSON.stringify({ yayaCmd: 'webOk', args: [{ id: 'x' }] })).statut, 404);
  assert.equal(brut(JSON.stringify({ yayaCmd: 'constructor' })).statut, 404);
  assert.equal(brut('x'.repeat(9000)).statut, 400);
  assert.equal(y.ctx.doPost({}).getContent().includes('requete'), true);
  // Le suivi ne montre que les commandes dont le téléphone connaît l'identifiant (20 caractères au hasard).
  assert.deepEqual(y.post('suivi', ['*']).corps.commandes, []);
  // Les actions de l'équipe restent fermées sans la clé de l'appli.
  assert.throws(() => y.ctx.api('mauvaise-cle', 'webOk', { id: 'x' }), /Lien invalide/);
  // Le code de l'équipe est demandé comme pour toute action.
  assert.throws(() => y.ctx.api(SERVEUR, 'webPause', { on: true }), /CODE\|/);
});

test('plafond global : un script qui inonde la page est arrêté avant le Google Sheets', () => {
  const y = projet();
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  let refus = 0;
  for (let i = 0; i < 40; i++) {
    const r = y.post('commander', { t: (i % 20) + 1, k: y.k((i % 20) + 1), lines: [{ n: 'Frites', q: 1 }] }, appareil(100 + i));
    if (r.corps.erreur === 'occupe') refus++;
  }
  assert.equal(refus, 10, '30 commandes par minute au plus pour tout le salon');
});

test('pages : panneau « À valider » dans YÄYA Service, QR à imprimer réservés au gérant', () => {
  const y = projet();
  const service = y.ctx.doGet({ parameter: { k: SERVEUR } }).getContent();
  assert.match(service, /id = 'webq'|box\.id = 'webq'/);
  assert.match(service, /act\('webOk'/);
  assert.ok(service.indexOf('webq') < service.lastIndexOf('</body>'));
  assert.match(y.ctx.doGet({ parameter: { k: SERVEUR, app: 'qr' } }).getContent(), /Réservé au gérant/);
  assert.match(y.ctx.doGet({ parameter: { k: 'nimporte', app: 'qr' } }).getContent(), /Lien invalide/);
  const qr = y.ctx.doGet({ parameter: { k: GERANT, app: 'qr' } }).getContent();
  const donnees = JSON.parse(qr.match(/var qr = (\[.*?\]), logo/s)[1].replace(/\\u003c/g, '<'));
  assert.equal(donnees.length, 20);
  assert.equal(donnees[6].lien, `https://commande.yaya-lounge.fr/?t=7&k=${y.k(7)}`);
  assert.match(donnees[0].svg, /^<svg/);
});
