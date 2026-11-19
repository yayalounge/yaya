// Page du client : sa carte (celle de l'appli YÄYA du gérant), panier, envoi à l'équipe, suivi.
// Rien d'écrit en HTML depuis les données : textContent seulement.
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
const r2 = (v) => Math.round(v * 100) / 100;
const euros = (v) => (Number.isInteger(r2(v)) ? String(r2(v)) : r2(v).toFixed(2).replace('.', ',')) + ' €';
const heure = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
const lire = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Table et appareil ───────────────────────────────────────────────
// Le QR mène à commande.yaya-lounge.fr/?t=12&k=… (k : signature de la table, vérifiée par l'appli du gérant).
const params = new URLSearchParams(location.search);
const table = /^\d{1,3}$/.test(params.get('t') ?? '') ? Number(params.get('t')) : 0;
const k = /^[A-Za-z0-9_-]{12}$/.test(params.get('k') ?? '') ? params.get('k') : '';
let appareil = lire('yaya-appareil', '');
if (!/^[A-Za-z0-9_-]{16,40}$/.test(appareil)) {
  appareil = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'[b & 63]).join('');
  ecrire('yaya-appareil', appareil);
}

// ── État ────────────────────────────────────────────────────────────
// donnees = { table, etat: {ouvert, soiree, pause}, carte: [{nom, articles: [{n, p, sub, o, photo}]}], options, relecture, limites }
let donnees = null;
let articles = new Map(); // nom → article
const CLE_PANIER = `yaya-panier-${table}`;
// Une ligne : { n, sel: { groupe: choix }, q }. Le prix est recalculé par l'appli du gérant à l'envoi.
let panier = (() => { const p = lire(CLE_PANIER, null); return p && Date.now() - p.le < 3 * 3600_000 && Array.isArray(p.lignes) ? p.lignes : []; })();
let mesCommandes = lire('yaya-commandes', []).filter((c) => c && Date.now() - c.le < 12 * 3600_000);
const sauverPanier = () => ecrire(CLE_PANIER, { le: Date.now(), lignes: panier });
const peutCommander = () => !!(donnees?.table && donnees.etat.ouvert);
const cleLigne = (l) => l.n + '|' + Object.keys(l.sel).sort().map((g) => g + '=' + l.sel[g]).join('|');

function toast(texte) {
  const t = $('#toast');
  t.textContent = texte;
  t.classList.add('visible');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('visible'), 2000);
}

// Prix d'un article avec ses choix (même calcul que priceLine de l'appli : prix + suppléments).
function prixLigne(l) {
  const a = articles.get(l.n);
  if (!a) return 0;
  return r2(a.o.reduce((s, g) => s + (donnees.options[g]?.choices.find((c) => c.n === l.sel[g])?.add ?? 0), a.p));
}
const adds = (g) => { const l = (donnees.options[g]?.choices ?? []).map((c) => +c.add || 0); return l.length ? l : [0]; };
const prixMini = (a) => r2(a.o.reduce((s, g) => s + Math.min(...adds(g)), a.p));
const prixMaxi = (a) => r2(a.o.reduce((s, g) => s + Math.max(...adds(g)), a.p));
const prixAffiche = (a) => (prixMini(a) !== prixMaxi(a) ? `dès ${euros(prixMini(a))}` : euros(prixMini(a)));
const ligneValide = (l) => {
  const a = articles.get(l.n);
  return a && l.q >= 1 && a.o.every((g) => donnees.options[g]?.choices.some((c) => c.n === l.sel?.[g])) && Object.keys(l.sel || {}).every((g) => a.o.includes(g));
};

// ── Carte ───────────────────────────────────────────────────────────
async function chargerCarte() {
  clearTimeout(chargerCarte.t);
  try {
    donnees = await api('carte', table, k);
  } catch (e) {
    if (!donnees) $('#carte').replaceChildren(h('p', { class: 'chargement' }, e.message));
    chargerCarte.t = setTimeout(chargerCarte, 8000);
    return;
  }
  articles = new Map(donnees.carte.flatMap((c) => c.articles.map((a) => [a.n, { ...a, cat: c.nom }])));
  const avant = panier.length;
  panier = panier.filter(ligneValide);
  if (panier.length < avant) toast('Un article de votre panier n’est plus à la carte');
  sauverPanier();
  if (donnees.table) { $('#table-n').textContent = donnees.table; $('#table-num').hidden = false; }
  afficherBandeau();
  afficherCarte();
  afficherBarre();
  $('#pied').hidden = false;
  // Avant l'ouverture du service ou pendant une pause : on relit la carte de temps en temps pour se débloquer seul.
  if (donnees.table && !donnees.etat.ouvert) chargerCarte.t = setTimeout(chargerCarte, 30000);
}

function afficherBandeau() {
  const b = $('#bandeau'), e = donnees.etat;
  const msg = !donnees.table
    ? [h('b', {}, 'QR code non reconnu. '), 'Vous pouvez regarder la carte. Pour commander, scannez le QR de votre table ou demandez au comptoir.']
    : e.pause
      ? [h('b', {}, 'Commandes par téléphone en pause. '), 'Commandez au comptoir, on revient vite.']
      : !e.soiree
        ? [h('b', {}, 'Pas encore ouvert. '), 'Les commandes à table ouvrent quand le service commence. Vous pouvez déjà regarder la carte.']
        : null;
  b.hidden = !msg;
  if (msg) b.replaceChildren(...msg);
  document.body.classList.toggle('lecture', !peutCommander());
}

function afficherCarte() {
  const nav = $('#rubriques');
  nav.replaceChildren(...donnees.carte.map((c, i) => h('a', { href: `#r${i}` }, c.nom)));
  nav.hidden = donnees.carte.length < 2;
  $('#carte').replaceChildren(...donnees.carte.map((c, i) =>
    h('section', { class: 'rubrique', id: `r${i}`, 'aria-labelledby': `t${i}` },
      h('h2', { id: `t${i}` }, c.nom),
      /chicha/i.test(c.nom) ? h('p', { class: 'note' }, 'Réservée aux personnes majeures.') : null,
      c.articles.map((a) => produit(articles.get(a.n))))));
  observerRubriques();
  majBadges();
}

function produit(a) {
  const detail = a.sub || (a.o.length === 1 ? (donnees.options[a.o[0]]?.choices ?? []).slice(0, 5).map((c) => c.n).join(' · ') : '');
  const el = h('div', { class: `produit${a.photo ? '' : ' sans-photo'}`, onclick: () => ouvrirArticle(a.n) },
    h('div', { class: 'vignette' }, a.photo ? h('img', { src: a.photo, alt: '', loading: 'lazy', width: 72, height: 72, onerror: (e) => e.target.closest('.produit').classList.add('sans-photo') }) : null),
    h('div', {}, h('h3', {}, a.n), detail ? h('p', {}, detail) : null, h('div', { class: 'prix' }, prixAffiche(a))),
    h('button', { class: 'ajouter', type: 'button', 'aria-label': `Ajouter ${a.n}`, onclick: (e) => { e.stopPropagation(); ajoutRapide(a.n); } }, '+'));
  el.dataset.n = a.n;
  return el;
}

function majBadges() {
  for (const b of document.querySelectorAll('.produit')) {
    const n = panier.filter((l) => l.n === b.dataset.n).reduce((s, l) => s + l.q, 0);
    const btn = b.querySelector('.ajouter');
    btn.classList.toggle('dedans', n > 0);
    btn.textContent = n > 0 ? String(n) : '+';
  }
}

function observerRubriques() {
  const nav = $('#rubriques');
  const liens = [...nav.querySelectorAll('a')];
  observerRubriques.obs?.disconnect();
  observerRubriques.obs = new IntersectionObserver((entrees) => {
    for (const e of entrees) if (e.isIntersecting) {
      for (const l of liens) l.classList.toggle('actif', l.getAttribute('href') === `#${e.target.id}`);
      const actif = liens.find((l) => l.classList.contains('actif'));
      if (actif) nav.scrollTo({ left: actif.offsetLeft - (nav.clientWidth - actif.offsetWidth) / 2, behavior: 'smooth' });
    }
  }, { rootMargin: '-35% 0px -60% 0px' });
  document.querySelectorAll('.rubrique').forEach((s) => observerRubriques.obs.observe(s));
  document.documentElement.style.setProperty('--haut-entete', `${$('#entete').offsetHeight}px`);
}

// ── Panier ──────────────────────────────────────────────────────────
const nbArticles = () => panier.reduce((s, l) => s + l.q, 0);
const totalPanier = () => r2(panier.reduce((s, l) => s + prixLigne(l) * l.q, 0));

function ajouter(n, q, sel = {}) {
  const lim = donnees.limites;
  if (nbArticles() + q > lim.articles) { toast(`${lim.articles} articles au plus par commande`); return false; }
  const ligne = { n, sel, q };
  const meme = panier.find((l) => cleLigne(l) === cleLigne(ligne));
  if (!meme && panier.length >= lim.lignes) { toast('Panier plein : envoyez d’abord cette commande'); return false; }
  if (meme && meme.q + q > lim.quantite) { toast(`${lim.quantite} au plus du même article`); return false; }
  if (meme) meme.q += q;
  else panier.push(ligne);
  sauverPanier();
  majBadges();
  afficherBarre(true);
  navigator.vibrate?.(12);
  return true;
}

function ajoutRapide(n) {
  const a = articles.get(n);
  if (!peutCommander() || a.o.length) return ouvrirArticle(n);
  if (ajouter(n, 1)) toast(`${a.n} ajouté`);
}

function afficherBarre(secoue = false) {
  const n = nbArticles();
  const barre = $('#barre');
  barre.classList.toggle('visible', n > 0 && peutCommander());
  $('#compte').textContent = n;
  $('#total-barre').textContent = euros(totalPanier());
  if (secoue) { barre.classList.remove('secoue'); void barre.offsetWidth; barre.classList.add('secoue'); }
}

// Feuille d'un article : un choix par groupe d'options (tous obligatoires, comme dans l'appli), quantité.
let articleOuvert = null;
function ouvrirArticle(n) {
  const a = articles.get(n);
  articleOuvert = { a, q: 1 };
  const img = $('#art-photo');
  img.hidden = !a.photo;
  if (a.photo) img.src = a.photo;
  $('#art-nom').textContent = `${a.n} · ${prixAffiche(a)}`;
  $('#art-desc').textContent = a.sub ?? '';
  const peut = peutCommander();
  $('#art-groupes').replaceChildren(...a.o.filter((g) => donnees.options[g]).map((g, i) => {
    const grp = donnees.options[g];
    const seul = grp.choices.length === 1;
    return h('fieldset', {},
      h('legend', { class: 'surtitre' }, grp.label),
      h('div', { class: 'puces' }, grp.choices.map((c) => h('label', {},
        h('input', { type: 'radio', name: `g${i}`, value: c.n, 'data-g': g, checked: seul, disabled: !peut }),
        h('span', {}, c.add ? `${c.n} +${euros(c.add)}` : c.n)))));
  }));
  $('#art-qte').textContent = '1';
  $('#art-erreur').textContent = '';
  $('#art-ajouter').hidden = !peut;
  $('#form-article').querySelector('.ligne-quantite').hidden = !peut;
  majPrixFeuille();
  $('#feuille-article').showModal();
}
function choixFeuille() {
  const sel = {};
  for (const i of $('#art-groupes').querySelectorAll('input:checked')) sel[i.dataset.g] = i.value;
  return sel;
}
function majPrixFeuille() {
  const { a, q } = articleOuvert;
  const sel = choixFeuille(), complet = a.o.every((g) => sel[g]);
  $('#art-ajouter').textContent = complet ? `Ajouter · ${euros(prixLigne({ n: a.n, sel, q }) * q)}` : 'Ajouter';
}
$('#art-groupes').addEventListener('change', () => { $('#art-erreur').textContent = ''; majPrixFeuille(); });
$('#art-moins').onclick = () => { articleOuvert.q = Math.max(1, articleOuvert.q - 1); $('#art-qte').textContent = articleOuvert.q; majPrixFeuille(); };
$('#art-plus').onclick = () => { articleOuvert.q = Math.min(donnees.limites.quantite, articleOuvert.q + 1); $('#art-qte').textContent = articleOuvert.q; majPrixFeuille(); };
$('#art-fermer').onclick = () => $('#feuille-article').close();
$('#art-ajouter').onclick = () => {
  const { a, q } = articleOuvert;
  const sel = choixFeuille();
  const manque = a.o.find((g) => !sel[g]);
  if (manque) { $('#art-erreur').textContent = `Choisissez : ${donnees.options[manque].label.toLowerCase()}.`; return; }
  if (ajouter(a.n, q, sel)) { $('#feuille-article').close(); toast(`${q} × ${a.n} ajouté${q > 1 ? 's' : ''}`); }
};

function afficherPanier() {
  $('#panier-erreur').textContent = '';
  $('#panier-lignes').replaceChildren(...panier.map((l, i) => {
    const choix = Object.values(l.sel);
    return h('div', { class: 'ligne-panier' },
      h('div', {}, h('h3', {}, l.n), choix.length ? h('div', { class: 'details' }, choix.join(' · ')) : null, h('div', { class: 'montant' }, euros(prixLigne(l) * l.q))),
      h('div', { class: 'quantite' },
        h('button', { type: 'button', 'aria-label': `Retirer un ${l.n}`, onclick: () => changerQte(i, -1) }, l.q === 1 ? '×' : '−'),
        h('output', {}, l.q),
        h('button', { type: 'button', 'aria-label': `Ajouter un ${l.n}`, onclick: () => changerQte(i, 1) }, '+')));
  }));
  $('#panier-total').textContent = euros(totalPanier());
  $('#envoyer').disabled = !panier.length || !peutCommander();
}
function changerQte(i, d) {
  const l = panier[i];
  if (d > 0 && (l.q >= donnees.limites.quantite || nbArticles() >= donnees.limites.articles)) return;
  l.q += d;
  if (l.q <= 0) panier.splice(i, 1);
  sauverPanier(); majBadges(); afficherBarre();
  if (!panier.length) return $('#feuille-panier').close();
  afficherPanier();
}
$('#ouvrir-panier').onclick = () => { afficherPanier(); $('#feuille-panier').showModal(); };
$('#panier-fermer').onclick = () => $('#feuille-panier').close();
for (const d of document.querySelectorAll('dialog.feuille')) d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

// ── Présence au salon ───────────────────────────────────────────────
// Obligatoire pour envoyer : un QR photographié ne sert à rien loin du Yäya. La position part avec la commande,
// l'appli du gérant ne garde que « sur place ». Le VPN ne change rien (c'est le GPS du téléphone, pas l'adresse IP).
const position = () => new Promise((ok) => {
  if (!navigator.geolocation) return ok({ erreur: 'absent' });
  navigator.geolocation.getCurrentPosition(
    (p) => ok({ pos: { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) } }),
    (e) => ok({ erreur: e.code === 1 ? 'refus' : 'introuvable' }),
    { enableHighAccuracy: true, maximumAge: 120000, timeout: 12000 });
});
const dejaAutorise = async () => { try { return (await navigator.permissions.query({ name: 'geolocation' })).state === 'granted'; } catch { return false; } };
const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const VERIF = {
  intro: ['Confirmez que vous êtes au Yäya', 'Pour éviter les fausses commandes, seules les personnes présentes au salon peuvent commander depuis leur table. Votre téléphone va vous demander l’accès à votre position.', 'Autoriser et envoyer'],
  refus: ['Position refusée', 'Sans elle, la commande ne peut pas partir de votre téléphone. Autorisez-la en quelques secondes :', 'Réessayer'],
  introuvable: ['Position introuvable', 'Votre téléphone n’a pas donné de position. Vérifiez que la localisation est activée, puis réessayez.', 'Réessayer'],
  loin: ['Vous semblez loin du Yäya', 'Les commandes à table se font sur place. Si vous êtes bien au salon, réessayez près d’une fenêtre, ou commandez au comptoir.', 'Réessayer'],
};
function aideReglages() {
  return iphone
    ? [h('b', {}, 'Sur iPhone'), h('ol', {}, h('li', {}, 'Réglages › Confidentialité et sécurité › Service de localisation : activé.'), h('li', {}, 'Plus bas, « Sites Safari » (ou votre navigateur) › « Lorsque l’app est active ».'), h('li', {}, 'Revenez ici, rechargez la page et touchez Réessayer.'))]
    : [h('b', {}, 'Sur Android'), h('ol', {}, h('li', {}, 'Touchez l’icône à gauche de l’adresse, en haut de l’écran.'), h('li', {}, 'Autorisations › Position › Autoriser.'), h('li', {}, 'Vérifiez aussi que la localisation du téléphone est activée, puis touchez Réessayer.'))];
}
function vue(verif) {
  $('#panier-corps').hidden = verif; $('#panier-actions').hidden = verif; $('#verif').hidden = !verif;
}
function afficherVerif(cas, message) {
  const [titre, texte, bouton] = VERIF[cas];
  $('#verif-titre').textContent = titre;
  $('#verif-texte').textContent = message || texte;
  $('#verif-aide').hidden = cas !== 'refus';
  if (cas === 'refus') $('#verif-aide').replaceChildren(...aideReglages());
  $('#verif-ok').textContent = bouton;
  $('#verif-ok').disabled = false;
  $('#verif-erreur').textContent = '';
  $('#verif').classList.remove('attente');
  vue(true);
}
$('#verif-retour').onclick = () => vue(false);

let envoiEnCours = false;
async function envoyer() {
  if (envoiEnCours || !panier.length || !peutCommander()) return;
  envoiEnCours = true;
  const bouton = $('#envoyer'), ok = $('#verif-ok');
  bouton.disabled = ok.disabled = true;
  $('#verif').classList.add('attente');
  ok.textContent = 'Vérification…';
  bouton.textContent = 'Vérification…';
  $('#panier-erreur').textContent = $('#verif-erreur').textContent = '';
  let envoye = false;
  try {
    const { pos, erreur } = await position();
    if (!pos) return afficherVerif(erreur === 'refus' ? 'refus' : 'introuvable');
    ok.textContent = bouton.textContent = 'Envoi…';
    const { commande } = await api('commander', { t: donnees.table, k, pos, lines: panier.map((l) => ({ n: l.n, sel: l.sel, q: l.q })) }, appareil);
    envoye = true;
    vue(false);
    panier = [];
    sauverPanier(); majBadges(); afficherBarre();
    mesCommandes = [{ id: commande.id, le: Date.now() }, ...mesCommandes.filter((c) => c.id !== commande.id)].slice(0, 12);
    ecrire('yaya-commandes', mesCommandes);
    $('#panier-lignes').replaceChildren(h('div', { class: 'envoyee' },
      h('div', { class: 'coche', 'aria-hidden': 'true' }, '✓'),
      h('h2', {}, `Commande n° ${commande.numero} envoyée`),
      h('p', {}, 'L’équipe la valide dans un instant. Vous suivez tout en haut de la page.')));
    $('#panier-total').parentElement.hidden = true;
    bouton.hidden = true;
    navigator.vibrate?.([20, 40, 20]);
    afficherSuivi([commande], commande.id);
    suivre();
  } catch (e) {
    if (e.code === 'loin') return afficherVerif('loin');
    if (e.code === 'position') return afficherVerif('introuvable');
    vue(false);
    $('#panier-erreur').textContent = e.message;
    if (['bloque', 'table_bloquee'].includes(e.code)) { panier = []; sauverPanier(); majBadges(); afficherBarre(); }
    if (['panier', 'ferme', 'pause', 'table'].includes(e.code)) chargerCarte().then(() => { if ($('#feuille-panier').open && panier.length) { afficherPanier(); $('#panier-erreur').textContent = e.message; } });
  } finally {
    envoiEnCours = false;
    $('#verif').classList.remove('attente');
    bouton.textContent = 'Envoyer la commande';
    if (!envoye) bouton.disabled = !panier.length || !peutCommander();
    ok.disabled = false;
    if (ok.textContent === 'Vérification…' || ok.textContent === 'Envoi…') ok.textContent = VERIF.intro[2];
  }
}
// Premier envoi : on explique pourquoi avant que le téléphone ne demande. Déjà autorisé : on envoie directement.
$('#envoyer').onclick = async () => { if (await dejaAutorise()) envoyer(); else afficherVerif('intro'); };
$('#verif-ok').onclick = envoyer;
$('#feuille-panier').addEventListener('close', () => { vue(false); $('#envoyer').hidden = false; $('#panier-total').parentElement.hidden = false; });

// ── Suivi des commandes de ce téléphone ─────────────────────────────
const TEXTES = {
  nouvelle: ['En attente', 'Envoyée. L’équipe va la valider.'],
  validee: ['Acceptée', 'Validée par l’équipe, en préparation.'],
  servie: ['Servie', 'Bonne dégustation. Vous réglez au comptoir.'],
  reglee: ['Réglée', 'Merci et à bientôt.'],
  refusee: ['Refusée', 'L’équipe n’a pas pu la prendre : voyez le comptoir.'],
};
let suivies = [];
function afficherSuivi(commandes, neuve) {
  if (commandes) suivies = [...commandes, ...suivies.filter((s) => !commandes.some((c) => c.id === s.id))].sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  const visibles = suivies.filter((c) => TEXTES[c.statut] && c.statut !== 'reglee').slice(0, 4);
  const s = $('#suivi');
  s.hidden = !visibles.length;
  s.replaceChildren(...visibles.map((c) => h('article', { class: `suivi-carte${c.id === neuve ? ' neuve' : ''}` },
    h('header', {}, h('h3', {}, `Commande n° ${c.numero} · ${heure(c.creeLe)}`), h('span', { class: `pastille pastille--${c.statut}` }, TEXTES[c.statut][0])),
    h('p', {}, TEXTES[c.statut][1]),
    h('p', {}, c.lignes.map((l) => `${l.q} × ${l.n}${l.d?.length ? ` (${l.d.join(', ')})` : ''}`).join(', ') + ` · ${euros(c.total)}`))));
}
async function suivre() {
  clearTimeout(suivre.t);
  if (!mesCommandes.length) return;
  try {
    const { commandes, etat } = await api('suivi', mesCommandes.map((c) => c.id));
    const avant = new Map(suivies.map((c) => [c.id, c.statut]));
    afficherSuivi(commandes);
    for (const c of commandes) if (avant.has(c.id) && avant.get(c.id) !== c.statut && c.statut !== 'reglee') { toast(`Commande n° ${c.numero} : ${TEXTES[c.statut][0].toLowerCase()}`); navigator.vibrate?.(30); }
    // L'équipe a mis les QR en pause, ou le service a fini : la page se remet en lecture seule.
    if (etat && donnees && (etat.ouvert !== donnees.etat.ouvert)) { donnees.etat = etat; afficherBandeau(); afficherBarre(); if (!etat.ouvert) chargerCarte.t = setTimeout(chargerCarte, 30000); }
    if (!commandes.some((c) => c.statut === 'nouvelle' || c.statut === 'validee')) return;
  } catch {}
  if (!document.hidden) suivre.t = setTimeout(suivre, (donnees?.relecture ?? 10) * 1000);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { suivre(); if (donnees && !peutCommander() && donnees.table) chargerCarte(); } });

chargerCarte();
suivre();
