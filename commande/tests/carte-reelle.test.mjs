import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projet } from './soiree.mjs';
import { CARTE, OPTIONS } from './carte-reelle.mjs';

// La vraie carte du Yäya (relue le 19/11) : chaque article actif, avec chacun de ses choix, se commande au QR,
// se valide et arrive sur la table au prix que l'appli calcule elle-même.

const groupes = {};
for (const [g, , n, add] of OPTIONS) (groupes[g] ??= []).push({ n, add });
const actifs = CARTE.filter((r) => r[5]);
const opts = (r) => r[3].split(',').map((s) => s.trim()).filter(Boolean);

// Toutes les lignes possibles : pour chaque article, chaque choix de chaque groupe au moins une fois.
function toutesLesLignes() {
  const lignes = [];
  for (const r of actifs) {
    const gs = opts(r);
    const tours = Math.max(1, ...gs.map((g) => groupes[g].length));
    for (let i = 0; i < tours; i++) {
      const sel = Object.fromEntries(gs.map((g) => [g, groupes[g][i % groupes[g].length].n]));
      lignes.push({ n: r[1], sel, q: 1, attendu: r[2] + gs.reduce((s, g) => s + groupes[g][i % groupes[g].length].add, 0) });
    }
  }
  return lignes;
}

test('vraie carte : ce que voit le client', () => {
  const y = projet({ reelle: true });
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  const c = y.post('carte', 7, y.k(7)).corps;
  assert.equal(c.table, 7);
  assert.deepEqual(c.carte.map((r) => r.nom), ['Chichas', 'Formules', 'Plats', 'Desserts', 'Mocktails', 'Boissons chaudes', 'Boissons fraîches', 'Smoothie']);
  const arts = c.carte.flatMap((r) => r.articles);
  assert.equal(arts.length, actifs.length, 'tous les articles actifs, aucun inactif');
  assert.ok(!arts.some((a) => a.n === 'Smoothie oreo' || a.n === 'Smoothie'));
  for (const a of arts) for (const g of a.o) assert.ok(c.options[g]?.choices.length, `${a.n} : groupe ${g} présent`);
  const photos = arts.filter((a) => a.photo).map((a) => a.n).sort();
  assert.deepEqual(photos, ['Crêpe Crunchy', 'Crêpe Nutella', 'Crêpe Oreo', 'Crêpe Sugar', 'Cœur coulant', 'Frites', 'Grandes frites', 'Mango juice', 'Mojito Yäya', 'Pasta Carbo', 'Pasta Salmon', 'Yäya Smash', 'Yäya Smash XL']);
  // Les QR : seulement les vraies tables du plan (les cases sans numéro sont du décor).
  const qr = y.ctx.webLiens_(y.ctx.loadData_());
  assert.deepEqual(qr.map((x) => x.t), Array.from({ length: 20 }, (_, i) => i + 1));
});

test('vraie carte : chaque article et chaque choix se commande, se valide et tombe sur la table au bon prix', () => {
  let t = Date.parse('2026-11-19T20:30:00Z');
  const y = projet({ reelle: true, horloge: () => t });
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  const lignes = toutesLesLignes();
  assert.ok(lignes.length > 80, `${lignes.length} lignes`);

  // Des commandes de 10 lignes, une par table, comme 20 tables qui commandent dans la soirée.
  const parTable = {};
  let op = 0, n = 0;
  for (let i = 0; i < lignes.length; i += 10) {
    const lot = lignes.slice(i, i + 10), table = (n % 20) + 1;
    t += 61_000; // une minute entre deux envois : ni le délai par téléphone ni le plafond global ne bloquent
    const r = y.post('commander', { t: table, k: y.k(table), lines: lot.map(({ n: nom, sel, q }) => ({ n: nom, sel, q })) }, `telephone-reel-${String(n).padStart(6, '0')}`);
    assert.equal(r.statut, 201, `${JSON.stringify(lot.map((l) => l.n))} → ${JSON.stringify(r.corps)}`);
    const attendu = Math.round(lot.reduce((s, l) => s + l.attendu, 0) * 100) / 100;
    assert.equal(r.corps.commande.total, attendu, 'prix recalculé par l’appli = prix de la carte + suppléments');
    const id = y.etat().web.find((o) => o.num === r.corps.commande.numero).id;
    y.api('webOk', { id, _op: `op-${++op}` });
    parTable[table] = Math.round(((parTable[table] || 0) + attendu) * 100) / 100;
    n++;
  }
  const st = y.etat();
  for (const [table, total] of Object.entries(parTable)) {
    const tb = st.tables[table];
    assert.equal(Math.round(tb.lines.reduce((s, l) => s + l.p * l.q, 0) * 100) / 100, total, `table ${table}`);
  }
  assert.equal(st.tickets.length, n, 'un ticket « À préparer » par commande validée');
});

test('vraie carte : un choix inventé ou un groupe oublié est refusé avec un message clair', () => {
  const y = projet({ reelle: true });
  y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 });
  const oubli = y.post('commander', { t: 3, k: y.k(3), lines: [{ n: 'Chicha tête plate', sel: { gout: 'Menthe' }, q: 1 }] }, 'telephone-reel-oubli-01');
  assert.equal(oubli.statut, 400);
  assert.match(oubli.corps.message, /Choisis : Boisson comprise/);
  const faux = y.post('commander', { t: 3, k: y.k(3), lines: [{ n: 'Softs', sel: { soft: 'Red Bull' }, q: 1 }] }, 'telephone-reel-faux-001');
  assert.equal(faux.statut, 400);
  assert.equal(y.etat().web?.length ?? 0, 0);
});
