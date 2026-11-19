import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { deps, k } from './aides.mjs';
import carte from '../netlify/functions/carte.mjs';
import commande from '../netlify/functions/commande.mjs';
import cuisine from '../netlify/functions/cuisine.mjs';

const O = 'https://commande.yaya-lounge.fr';
const post = (chemin, corps, entetes = {}) => new Request(O + chemin, { method: 'POST', headers: { 'content-type': 'application/json', origin: O, ...entetes }, body: JSON.stringify(corps) });
const APP = { 'x-appareil': 'telephone-de-test-0001' };
const lignes = [{ article: 'plats/yaya-smash', quantite: 1 }];
let cookie = '';
async function connecter() {
  const r = await cuisine(post('/api/cuisine/connexion', { code: '246810' }), { ip: '1.2.3.4' });
  assert.equal(r.status, 200);
  const c = r.headers.get('set-cookie');
  assert.match(c, /HttpOnly; Secure; SameSite=Strict/);
  cookie = c.split(';')[0];
}

beforeEach(() => { globalThis.__yayaDeps = deps(); });

test('carte : QR valide ou non, la carte s’affiche toujours', async () => {
  let j = await (await carte(new Request(`${O}/api/carte?t=3&k=${k(3)}`))).json();
  assert.equal(j.table, 3);
  assert.ok(j.carte.rubriques.length);
  j = await (await carte(new Request(`${O}/api/carte?t=3&k=${k(4)}`))).json();
  assert.equal(j.table, null);
});

test('commande : 201, puis suivi', async () => {
  const r = await commande(post('/api/commande', { table: 3, k: k(3), lignes }, APP), { ip: '1.1.1.1' });
  assert.equal(r.status, 201);
  const { commande: c } = await r.json();
  const s = await (await commande(post('/api/suivi', { ids: [c.id] }), {})).json();
  assert.equal(s.commandes[0].statut, 'nouvelle');
});

test('commande : refus (QR faux, appareil absent, mauvais type, autre site, corps énorme)', async () => {
  assert.equal((await commande(post('/api/commande', { table: 3, k: k(4), lignes }, APP), {})).status, 403);
  assert.equal((await commande(post('/api/commande', { table: 3, k: k(3), lignes }), {})).status, 400);
  assert.equal((await commande(new Request(O + '/api/commande', { method: 'POST', headers: { 'content-type': 'text/plain', origin: O, ...APP }, body: '{}' }), {})).status, 415);
  assert.equal((await commande(post('/api/commande', { table: 3, k: k(3), lignes }, { ...APP, origin: 'https://pirate.example' }), {})).status, 403);
  assert.equal((await commande(post('/api/commande', { table: 3, k: k(3), lignes, x: 'a'.repeat(20000) }, APP), {})).status, 413);
});

test('cuisine : tout est fermé sans le code', async () => {
  for (const a of ['ecran', 'qr']) assert.equal((await cuisine(new Request(`${O}/api/cuisine/${a}`), {})).status, 401);
  for (const a of ['statut', 'encaisser', 'pause']) assert.equal((await cuisine(post(`/api/cuisine/${a}`, {}), {})).status, 401);
  assert.equal((await cuisine(post('/api/cuisine/connexion', { code: '000000' }), { ip: '9.9.9.9' })).status, 401);
  assert.equal((await cuisine(new Request(`${O}/api/cuisine/ecran`, { headers: { cookie: '__Host-yaya-cuisine=eyJlIjo5OTk5OTk5OTk5OTk5fQ.faux' } }), {})).status, 401, 'cookie forgé refusé');
});

test('cuisine : valider, servir, encaisser, pause, QR', async () => {
  await connecter();
  const { commande: c } = await (await commande(post('/api/commande', { table: 5, k: k(5), lignes }, APP), {})).json();
  const avec = (r) => { r.headers.set('cookie', cookie); return r; };
  let e = await (await cuisine(avec(new Request(`${O}/api/cuisine/ecran`)), {})).json();
  assert.equal(e.commandes[0].id, c.id);
  assert.equal((await cuisine(avec(post('/api/cuisine/statut', { id: c.id, statut: 'validee' })), {})).status, 200);
  assert.equal((await cuisine(avec(post('/api/cuisine/statut', { id: c.id, statut: 'servie' })), {})).status, 200);
  assert.equal((await cuisine(avec(post('/api/cuisine/encaisser', { table: 5, jour: e.jour })), {})).status, 200);
  assert.equal((await (await cuisine(avec(post('/api/cuisine/pause', { pause: true })), {})).json()).pause, true);
  assert.equal((await commande(post('/api/commande', { table: 6, k: k(6), lignes }, { 'x-appareil': 'autre-telephone-00001' }), {})).status, 503);
  const qr = await (await cuisine(avec(new Request(`${O}/api/cuisine/qr`)), {})).json();
  assert.equal(qr.tables.length, 20);
  assert.match(qr.tables[0].svg, /^<svg/);
  assert.equal(qr.tables[0].lien, `${O}/t/1?k=${k(1)}`);
});

test('installation incomplète : message clair, pas de plantage', async () => {
  delete globalThis.__yayaDeps;
  const r = await carte(new Request(`${O}/api/carte`));
  assert.equal(r.status, 500);
  assert.match((await r.json()).message, /YAYA_SECRET/);
});
