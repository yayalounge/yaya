// Écran de la cuisine : la cuisine valide chaque commande à la main, puis la sert ; le comptoir encaisse la table.
const $ = (s) => document.querySelector(s);
const h = (tag, attrs = {}, ...enfants) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of enfants.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : String(c));
  return e;
};
const euros = (c) => (c % 100 ? (c / 100).toFixed(2).replace('.', ',') : String(c / 100)) + ' €';
const heure = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
const depuis = (iso) => { const m = Math.floor((Date.now() - new Date(iso)) / 60_000); return m < 1 ? 'à l’instant' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; };

async function api(chemin, corps) {
  const r = await fetch(`/api/cuisine/${chemin}`, corps ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corps), credentials: 'same-origin' } : { credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && chemin !== 'connexion') { montrer('porte'); throw Object.assign(new Error(j.message), { session: true }); }
  if (!r.ok) throw Object.assign(new Error(j.message || 'Erreur réseau'), { code: j.erreur, statut: r.status });
  return j;
}

function montrer(quoi) {
  $('#porte').hidden = quoi !== 'porte';
  $('#demarrer').hidden = quoi !== 'demarrer';
  $('#app').hidden = quoi !== 'app';
  if (quoi === 'porte') { clearTimeout(relire.t); setTimeout(() => $('#code').focus(), 50); }
}

// ── Son : deux notes, sans fichier. Safari ne joue un son qu'après un geste : « Démarrer le service ». ──
let audio = null;
function sonner() {
  if (!audio) return;
  const t = audio.currentTime;
  for (const [i, f] of [[0, 880], [1, 1318.5], [2, 880], [3, 1318.5]]) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + i * 0.2);
    g.gain.exponentialRampToValueAtTime(0.6, t + i * 0.2 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.2 + 0.19);
    o.connect(g).connect(audio.destination);
    o.start(t + i * 0.2); o.stop(t + i * 0.2 + 0.2);
  }
  navigator.vibrate?.([200, 100, 200]);
}
let veille = null;
async function garderAllume() { try { veille = await navigator.wakeLock?.request('screen'); } catch {} }
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (audio) garderAllume(); audio?.resume(); relire(); } });

$('#btn-demarrer').onclick = async () => {
  audio = new (window.AudioContext || window.webkitAudioContext)();
  await audio.resume();
  sonner();
  garderAllume();
  montrer('app');
  relire();
};

// ── Connexion ──────────────────────────────────────────────────────
$('#form-code').onsubmit = async (e) => {
  e.preventDefault();
  $('#erreur-code').textContent = '';
  try {
    await api('connexion', { code: $('#code').value });
    $('#code').value = '';
    montrer('demarrer');
  } catch (err) {
    $('#erreur-code').textContent = err.message;
    $('#code').select();
  }
};

// ── Données ────────────────────────────────────────────────────────
let ecran = null;
const vues = new Set(JSON.parse(sessionStorage.getItem('yaya-vues') || '[]'));
let premier = true;
let dernierRappel = 0;

async function relire() {
  clearTimeout(relire.t);
  try {
    ecran = await api('ecran');
    $('#hors-ligne').hidden = true;
    const nouvelles = ecran.commandes.filter((c) => c.statut === 'nouvelle');
    const inedites = nouvelles.filter((c) => !vues.has(c.id));
    if (inedites.length && !premier) { sonner(); dernierRappel = Date.now(); }
    // Rappel toutes les 30 s tant qu'une commande attend d'être validée (salle bruyante)
    else if (nouvelles.length && Date.now() - dernierRappel > 30_000 && nouvelles.some((c) => Date.now() - new Date(c.creeLe) > 30_000)) { sonner(); dernierRappel = Date.now(); }
    afficher(new Set(premier ? [] : inedites.map((c) => c.id)));
    for (const c of ecran.commandes) vues.add(c.id);
    sessionStorage.setItem('yaya-vues', JSON.stringify([...vues].slice(-400)));
    premier = false;
    document.title = nouvelles.length ? `(${nouvelles.length}) Cuisine · Yäya` : 'Cuisine · Yäya';
  } catch (e) {
    if (e.session) return;
    $('#hors-ligne').hidden = false;
  }
  relire.t = setTimeout(relire, (ecran?.relecture ?? 8) * 1000);
}

async function agir(chemin, corps, bouton) {
  if (bouton) bouton.disabled = true;
  try {
    await api(chemin, corps);
  } catch (e) {
    if (!e.session) alerteDouce(e.message);
  }
  relire();
}
function alerteDouce(texte) {
  const t = h('div', { class: 'toast visible', role: 'alert' }, texte);
  document.body.append(t);
  setTimeout(() => t.remove(), 3000);
}

// Bouton à double appui pour les gestes qui ont des conséquences (refuser, encaisser)
function boutonConfirme(libelle, confirmer, action, classe = 'btn--danger') {
  const b = h('button', { class: `btn ${classe}`, type: 'button' }, libelle);
  b.onclick = () => {
    if (b.dataset.arme) return action(b);
    b.dataset.arme = '1'; b.textContent = confirmer; b.classList.add('btn--confirmer');
    setTimeout(() => { delete b.dataset.arme; b.textContent = libelle; b.classList.remove('btn--confirmer'); }, 3500);
  };
  return b;
}

function ticket(c, neuf) {
  const attente = (Date.now() - new Date(c.creeLe)) / 60_000;
  const actions = c.statut === 'nouvelle'
    ? [boutonConfirme('Refuser', 'Confirmer', (b) => agir('statut', { id: c.id, statut: 'refusee' }, b)), h('button', { class: 'btn btn--plein', type: 'button', onclick: (e) => agir('statut', { id: c.id, statut: 'validee' }, e.currentTarget) }, 'Valider')]
    : [h('button', { class: 'lien-retour', type: 'button', onclick: (e) => agir('statut', { id: c.id, statut: 'nouvelle' }, e.currentTarget) }, 'Remettre à valider'), h('button', { class: 'btn btn--plein', type: 'button', onclick: (e) => agir('statut', { id: c.id, statut: 'servie' }, e.currentTarget) }, 'Servie')];
  return h('article', { class: `ticket${neuf ? ' neuf' : ''}${c.statut === 'nouvelle' && attente > 3 ? ' attend' : ''}` },
    h('header', {}, h('div', { class: 'tab' }, h('small', {}, 'Table'), c.table), h('div', { class: `meta${attente > 3 && c.statut === 'nouvelle' ? ' tard' : ''}` }, `n° ${c.numero} · ${heure(c.creeLe)}`, h('br'), depuis(c.creeLe))),
    h('ul', {}, c.lignes.map((l) => h('li', {}, h('b', {}, `${l.quantite}×`), h('span', {}, l.nom), l.choix ? h('span', { class: 'plus' }, l.choix) : null, l.remarque ? h('span', { class: 'plus' }, `« ${l.remarque} »`) : null))),
    h('div', { class: 'pied-ticket' }, h('span', { class: 'total' }, euros(c.totalCentimes)), h('div', { class: 'actions' }, actions)));
}

function groupeTable(table, commandes) {
  const total = commandes.reduce((s, c) => s + c.totalCentimes, 0);
  const reglee = commandes.every((c) => c.reglee);
  const jour = commandes[0].id.slice(0, 10);
  return h('article', { class: `groupe-table${reglee ? ' reglee' : ''}` },
    h('header', {}, h('div', { class: 'tab' }, h('small', {}, 'Table'), table)),
    h('div', { class: 'lignes' }, commandes.map((c) => h('div', {}, h('span', {}, `n° ${c.numero} · ${c.lignes.map((l) => `${l.quantite}× ${l.nom}`).join(', ')}`), h('span', {}, euros(c.totalCentimes))))),
    reglee ? h('p', { class: 'vide' }, 'Réglée') : boutonConfirme(`Encaisser · ${euros(total)}`, `Confirmer l’encaissement · ${euros(total)}`, (b) => agir('encaisser', { table, jour }, b), 'btn--plein'),
    !reglee ? h('button', { class: 'lien-retour', type: 'button', onclick: (e) => agir('statut', { id: commandes.at(-1).id, statut: 'validee' }, e.currentTarget) }, 'Pas encore servie') : null);
}

function afficher(neufs) {
  const cs = ecran.commandes;
  const nouvelles = cs.filter((c) => c.statut === 'nouvelle');
  const validees = cs.filter((c) => c.statut === 'validee');
  const servies = cs.filter((c) => c.statut === 'servie');
  const parTable = new Map();
  for (const c of servies) parTable.set(`${c.id.slice(0, 10)}|${c.table}|${c.reglee ? 'r' : ''}`, [...(parTable.get(`${c.id.slice(0, 10)}|${c.table}|${c.reglee ? 'r' : ''}`) ?? []), c]);
  $('#col-nouvelles').replaceChildren(...(nouvelles.length ? nouvelles.map((c) => ticket(c, neufs.has(c.id))) : [h('p', { class: 'vide' }, 'Aucune commande en attente.')]));
  $('#col-validees').replaceChildren(...(validees.length ? validees.map((c) => ticket(c, false)) : [h('p', { class: 'vide' }, 'Rien en préparation.')]));
  $('#col-servies').replaceChildren(...(parTable.size ? [...parTable.values()].sort((a, b) => a[0].reglee - b[0].reglee).map((g) => groupeTable(g[0].table, g)) : [h('p', { class: 'vide' }, 'Rien à encaisser.')]));
  $('#n-nouvelles').textContent = nouvelles.length || '';
  $('#n-validees').textContent = validees.length || '';
  $('#n-servies').textContent = parTable.size || '';
  $('#chiffres').textContent = `${ecran.totaux.commandes} commande${ecran.totaux.commandes > 1 ? 's' : ''} · ${euros(ecran.totaux.centimes)}`;
  const e = ecran.etat;
  $('#etat').replaceChildren(h('span', { class: `pastille ${e.pause ? 'pastille--nouvelle' : e.ouvert ? 'pastille--servie' : 'pastille--refusee'}` }, e.pause ? 'Commandes en pause' : e.ouvert ? 'Commandes ouvertes' : `Fermé · ouvert ${e.horaires}`));
  const p = $('#btn-pause');
  p.textContent = e.pause ? 'Reprendre' : 'Pause';
  p.classList.toggle('btn--pause-active', e.pause);
}

$('#btn-pause').onclick = (ev) => agir('pause', { pause: !ecran?.etat.pause }, ev.currentTarget).then(() => (ev.currentTarget.disabled = false));
const menu = $('#menu');
$('#btn-menu').onclick = () => { menu.hidden = !menu.hidden; $('#btn-menu').setAttribute('aria-expanded', String(!menu.hidden)); };
document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('.outils')) { menu.hidden = true; $('#btn-menu').setAttribute('aria-expanded', 'false'); } });
$('#btn-son').onclick = () => { sonner(); menu.hidden = true; };
$('#btn-quitter').onclick = async () => { await fetch('/api/cuisine/deconnexion', { method: 'POST', credentials: 'same-origin' }); veille?.release?.(); location.reload(); };
setInterval(() => { if (ecran && !$('#app').hidden) afficher(new Set()); }, 30_000); // « il y a 3 min » à jour

// Au chargement : session encore valide ? (cookie de 16 h, une soirée)
fetch('/api/cuisine/ecran', { credentials: 'same-origin' }).then((r) => montrer(r.ok ? 'demarrer' : 'porte'), () => montrer('porte'));
