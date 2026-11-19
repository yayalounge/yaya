import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { projet, SERVEUR, GERANT, AU_SALON } from './soiree.mjs';

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
  assert.match(c.corps.carte[0].articles[0].photo, /^photos\/yaya-smash\.webp$/);

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
  assert.equal(y.post('suivi', [cmd.id], 7, y.k(7)).corps.commandes[0].statut, 'validee');

  // Renvoi après coupure réseau : jamais validée deux fois.
  assert.equal(y.api('webOk', { id: st.web[0].id, _op: 'op-1' }).dup, true);
  assert.throws(() => y.api('webOk', { id: st.web[0].id, _op: 'op-2' }), /déjà validée/);

  // Servie, puis encaissée : tout part dans Ventes et Lignes vendues, comme une commande au comptoir.
  y.api('done', { id: apres.tickets[0].id, _op: 'op-3' });
  assert.equal(y.post('suivi', [cmd.id], 7, y.k(7)).corps.commandes[0].statut, 'servie');
  y.api('pay', { t: 7, kind: 'all', method: 'CB', _op: 'op-4' });
  assert.equal(y.post('suivi', [cmd.id], 7, y.k(7)).corps.commandes[0].statut, 'reglee');
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
  assert.equal(y.post('suivi', [cmd.id], 3, y.k(3)).corps.commandes[0].statut, 'refusee');
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
  assert.deepEqual(y.post('suivi', ['*'], 1, y.k(1)).corps.commandes, []);
  // Le suivi et l'envoi demandent un QR valable ; sans lui, rien n'est lu.
  assert.equal(y.post('suivi', ['*']).statut, 403);
  assert.equal(y.post('suivi', ['*'], 1, 'AAAAAAAAAAAA').statut, 403);
  assert.equal(y.post('commander', { t: 1, k: 'AAAAAAAAAAAA', lines: [{ n: 'Frites', q: 1 }] }, appareil(3)).statut, 403);
  // Fonctions de l'éditeur : appelables par google.script.run depuis n'importe quelle page, elles refusent un visiteur.
  for (const f of ['supprimerSoireeEnCours', 'fusionPainBurger', 'mesurerVitesse', 'installer', 'afficherLiens', 'nouveauxLiens'])
    assert.throws(() => y.ctx[f](), /Réservé à l’éditeur/, f);
  y.cache.set('data', 'x');
  y.ctx.onEdit();
  assert.equal(y.cache.get('data'), 'x', 'onEdit sans vrai événement ne vide rien');
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
  // Le panneau doit au moins se compiler (une erreur de syntaxe le ferait disparaître sans bruit).
  const ui = readFileSync(new URL('../../apps-script/CommandeTableUi.html', import.meta.url), 'utf8');
  for (const [, js] of ui.matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => new vm.Script(js), 'script du panneau');
  assert.match(y.ctx.doGet({ parameter: { k: SERVEUR, app: 'qr' } }).getContent(), /Réservé au gérant/);
  assert.match(y.ctx.doGet({ parameter: { k: 'nimporte', app: 'qr' } }).getContent(), /Lien invalide/);
  const qr = y.ctx.doGet({ parameter: { k: GERANT, app: 'qr' } }).getContent();
  const donnees = JSON.parse(qr.match(/var qr = (\[.*?\]), logo/s)[1].replace(/\\u003c/g, '<'));
  assert.equal(donnees.length, 20);
  assert.equal(donnees[6].lien, `https://commande.yaya-lounge.fr/?t=7&k=${y.k(7)}`);
  assert.match(donnees[0].svg, /^<svg/);
});

test('farceurs : loin du salon refusé, « fausse commande » bloque le téléphone, 2 fausses verrouillent la table', () => {
  const y = projet();
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  const cmd = (table, tel, pos = AU_SALON) => { y.cache.clear(); return y.post('commander', { t: table, k: y.k(table), pos, lines: [{ n: 'Frites', q: 1 }] }, tel); };

  // QR photographié puis utilisé depuis Paris (12 km) : refusé, rien n'arrive à l'équipe.
  const loin = cmd(4, appareil(50), { lat: 48.8566, lng: 2.3522, acc: 30 });
  assert.equal(loin.statut, 403);
  assert.equal(loin.corps.erreur, 'loin');
  // Position refusée, ou trop imprécise : refusée aussi (obligatoire), avec un code que la page explique.
  assert.equal(cmd(4, appareil(51), null).corps.erreur, 'position');
  // iPhone sans « Position exacte » (précision de quelques km) : on demande la position exacte, pas « loin ».
  assert.equal(cmd(4, appareil(51), { lat: 48.9275, lng: 2.2229, acc: 5000 }).corps.erreur, 'imprecis');
  assert.equal(cmd(4, appareil(51), { lat: 48.95, lng: 2.25, acc: 3500 }).corps.erreur, 'imprecis');
  assert.equal(cmd(4, appareil(51), { lat: 48.8566, lng: 2.3522, acc: 3500 }).corps.erreur, 'loin', 'Paris : loin même dans le pire cas');
  // Sur place : passe. Rien d'autre que « sur place » n'est gardé.
  assert.equal(cmd(4, appareil(51), { lat: 48.9275, lng: 2.2229, acc: 25 }).statut, 201);
  assert.equal(cmd(4, appareil(52), { lat: 48.9273, lng: 2.2227, acc: 60 }).statut, 201);
  const st = y.etat();
  assert.deepEqual(st.web.map((o) => o.lieu), ['ok', 'ok']);
  assert.ok(!JSON.stringify(st).includes('48.9275'), 'aucune coordonnée gardée');

  // L'équipe : « Fausse commande · bloquer » (un farceur assis dehors, sur la terrasse d'en face).
  const faux1 = st.web[1];
  assert.match(y.api('webNo', { id: faux1.id, faux: true }).msg, /ne peut plus commander/);
  const bloque = cmd(4, appareil(52));
  assert.equal(bloque.statut, 403);
  assert.equal(bloque.corps.erreur, 'bloque');
  // Un autre téléphone sur la même table, 2e fausse commande : la table est verrouillée.
  assert.equal(cmd(4, appareil(53)).statut, 201);
  const faux2 = y.etat().web.find((o) => o.app === appareil(53));
  assert.match(y.api('webNo', { id: faux2.id, faux: true }).msg, /Table 4 verrouillée/);
  assert.equal(cmd(4, appareil(54)).corps.erreur, 'table_bloquee');
  assert.equal(cmd(5, appareil(54)).statut, 201, 'les autres tables commandent normalement');
  // Débloquer depuis le panneau : les fausses commandes d'avant ne comptent plus, une seule nouvelle ne reverrouille pas.
  y.api('webDebloque', { t: 4 });
  y.avancer(1000);
  assert.equal(cmd(4, appareil(54)).statut, 201);
  const faux3 = y.etat().web.find((o) => o.app === appareil(54) && o.t === 4);
  assert.match(y.api('webNo', { id: faux3.id, faux: true }).msg, /ne peut plus commander/);
  assert.equal(cmd(4, appareil(55)).statut, 201, 'table 4 toujours ouverte');
  // Un simple « Refuser » (rupture, erreur) ne bloque personne.
  const normal = y.etat().web.find((o) => o.t === 5);
  y.api('webNo', { id: normal.id });
  assert.equal(cmd(5, appareil(56)).statut, 201);
});

test('QR en PDF : gérant seulement, 20 tables sur 5 pages A4, envoyés par mail à l’adresse du récap', async () => {
  const y = projet();
  y.onglet('params').push(['Email du récap', 'gerant@example.com', '']);
  assert.throws(() => y.api('webQrPdf', {}), /Réservé au gérant/);
  const { pdf } = y.api('webQrPdf', {}, GERANT);
  const octets = Buffer.from(pdf, 'base64'), texte = octets.toString('latin1');
  assert.ok(texte.startsWith('%PDF-1.4') && texte.trimEnd().endsWith('%%EOF'));
  assert.match(texte, /\/Count 5 /);
  // La table des renvois pointe sur chaque objet (sinon certains lecteurs refusent le fichier).
  const xref = texte.slice(texte.lastIndexOf('xref')).split('\n').slice(3).filter((l) => / n $/.test(l)).map((l) => +l.slice(0, 10));
  xref.forEach((o, i) => assert.ok(texte.startsWith(`${i + 1} 0 obj`, o), `objet ${i + 1}`));
  if (process.env.PDF_SORTIE) (await import('node:fs')).writeFileSync(process.env.PDF_SORTIE, octets);

  assert.match(y.api('webQrMail', {}, GERANT).msg, /gerant@example\.com/);
  const [, mail] = y.journal.find(([k]) => k === 'mail');
  assert.equal(mail.to, 'gerant@example.com');
  assert.equal(mail.attachments[0].getContentType(), 'application/pdf');
});

test('soirée fermée avec une commande en attente : elle ne revient pas le lendemain', () => {
  const y = projet();
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  const cmd = y.post('commander', { t: 7, k: y.k(7), lines: [{ n: 'Frites', q: 1 }] }, appareil(1)).corps.commande;
  assert.equal(cmd.numero, 1);
  const id = y.etat().web[0].id;
  // Lendemain : nouvelle soirée (même effet qu'une fermeture puis une ouverture).
  const st = y.etat(); st.soiree.id = 'soiree-du-lendemain'; st.rev++; y.ctx.writeState_(st);
  assert.equal(y.post('suivi', [cmd.id], 7, y.k(7)).corps.commandes[0].statut, 'refusee', 'le téléphone arrête d’attendre');
  assert.match(y.api('webOk', { id }).msg, /soirée précédente : retirée/);
  assert.equal(y.etat().tickets.length, 0);
  assert.equal(Object.keys(y.etat().tables).length, 0, 'aucune table ouverte avec la commande d’hier');
  // Les numéros repartent de 1.
  y.cache.clear();
  assert.equal(y.post('commander', { t: 7, k: y.k(7), lines: [{ n: 'Frites', q: 1 }] }, appareil(2)).corps.commande.numero, 1);
});

test('réponse perdue : le renvoi avec le même numéro d’envoi rend la même commande, sans doublon', () => {
  const y = projet();
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  const corps = { t: 9, k: y.k(9), envoi: 'envoi-de-test-0000000001', lines: [{ n: 'Frites', q: 1 }] };
  const a = y.post('commander', corps, appareil(1)), b = y.post('commander', corps, appareil(1));
  assert.equal(a.statut, 201);
  assert.equal(b.statut, 201, JSON.stringify(b));
  assert.equal(a.corps.commande.id, b.corps.commande.id);
  assert.equal(y.etat().web.length, 1);
  // Un autre panier (autre numéro d'envoi) du même téléphone attend 30 s, comme avant.
  assert.equal(y.post('commander', { ...corps, envoi: 'envoi-de-test-0000000002' }, appareil(1)).corps.erreur, 'trop_rapide');
});

test('faux QR en masse : ne coupe pas les commandes des vraies tables', () => {
  const y = projet();
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  for (let i = 0; i < 200; i++) assert.equal(y.post('commander', { t: 7, k: 'AAAAAAAAAAA' + (i % 10), lines: [{ n: 'Frites', q: 1 }] }, appareil(300 + i)).statut, 403);
  // Un vrai QR photographié et rejoué en boucle n'épuise que sa propre table.
  let occupe = 0;
  for (let i = 0; i < 30; i++) if (y.post('commander', { t: 3, k: y.k(3), lines: [{ n: 'Caviar', q: 1 }] }, appareil(600 + i)).corps.erreur === 'occupe') occupe++;
  assert.ok(occupe > 0, 'la table 3 est freinée');
  assert.equal(y.post('commander', { t: 7, k: y.k(7), lines: [{ n: 'Frites', q: 1 }] }, appareil(1)).statut, 201, 'la table 7 commande');
  // La carte seule reste visible sans QR (lecture seule).
  assert.equal(y.post('carte', 0, '').statut, 200);
});

test('commande traitée : l’état ne garde que ce que le téléphone affiche', () => {
  const y = projet();
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  y.post('commander', { t: 7, k: y.k(7), lines: [{ n: 'Soft', sel: { soft: 'Red Bull' }, q: 2 }] }, appareil(1));
  const o0 = y.etat().web[0];
  assert.ok(o0.src && o0.app);
  y.api('webOk', { id: o0.id });
  const o = y.etat().web[0];
  assert.equal(o.statut, 'validee');
  assert.equal(o.src, undefined);
  assert.equal(o.app, undefined);
  assert.deepEqual(o.lines, [{ n: 'Soft', d: ['Red Bull'], q: 2 }]);
});
