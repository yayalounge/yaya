// Page du client : carte, panier, envoi en cuisine, suivi. Rien d'écrit en HTML depuis les données (textContent seulement).
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
const lire = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Table et appareil ───────────────────────────────────────────────
const table = Number(location.pathname.match(/^\/t\/(\d{1,3})\/?$/)?.[1] ?? NaN);
const k = new URLSearchParams(location.search).get('k') ?? '';
let appareil = lire('yaya-appareil', '');
if (!/^[A-Za-z0-9_-]{16,40}$/.test(appareil)) {
  appareil = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'[b & 63]).join('');
  ecrire('yaya-appareil', appareil);
}

// ── État ────────────────────────────────────────────────────────────
let donnees = null; // { carte, etat, table, ... }
let articles = new Map();
const CLE_PANIER = `yaya-panier-${table}`;
let panier = (() => { const p = lire(CLE_PANIER, null); return p && Date.now() - p.le < 3 * 3600_000 ? p.lignes : []; })();
let mesCommandes = lire('yaya-commandes', []).filter((c) => Date.now() - c.le < 24 * 3600_000);
const sauverPanier = () => ecrire(CLE_PANIER, { le: Date.now(), lignes: panier });
const peutCommander = () => donnees?.table && donnees.etat.ouvert && !donnees.etat.pause;

function toast(texte) {
  const t = $('#toast');
  t.textContent = texte;
  t.classList.add('visible');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('visible'), 1800);
}

async function api(chemin, corps) {
  const r = await fetch(chemin, corps ? { method: 'POST', headers: { 'content-type': 'application/json', 'x-appareil': appareil }, body: JSON.stringify(corps) } : {});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.message || 'Connexion impossible. Réessayez.'), { code: j.erreur, statut: r.status });
  return j;
}

// ── Carte ───────────────────────────────────────────────────────────
async function chargerCarte() {
  try {
    donnees = await api(`/api/carte?t=${encodeURIComponent(table)}&k=${encodeURIComponent(k)}`);
  } catch (e) {
    $('#carte').replaceChildren(h('p', { class: 'chargement' }, e.message));
    setTimeout(chargerCarte, 8000);
    return;
  }
  articles = new Map(donnees.carte.rubriques.flatMap((r) => r.articles.map((a) => [a.id, { ...a, rubrique: r.id }])));
  panier = panier.filter((l) => articles.has(l.article) && (!articles.get(l.article).choix || articles.get(l.article).choix.options.includes(l.choix)));
  sauverPanier();
  $('#lien-fidelite').href = donnees.fidelite;
  if (donnees.table) { $('#table-n').textContent = donnees.table; $('#table-num').hidden = false; }
  afficherBandeau();
  afficherCarte();
  afficherBarre();
  $('#pied').hidden = false;
}

function afficherBandeau() {
  const b = $('#bandeau');
  const msg = !donnees.table
    ? [h('b', {}, 'QR code non reconnu. '), 'Vous pouvez regarder la carte ; pour commander, scannez le QR de votre table ou demandez au comptoir.']
    : donnees.etat.pause
      ? [h('b', {}, 'Commandes par téléphone en pause. '), 'Commandez au comptoir, on revient vite.']
      : !donnees.etat.ouvert
        ? [h('b', {}, 'Le salon est fermé. '), `Commandes ouvertes ${donnees.etat.horaires}.`]
        : null;
  b.hidden = !msg;
  if (msg) b.replaceChildren(...msg);
  document.body.classList.toggle('lecture', !peutCommander());
}

function afficherCarte() {
  const nav = $('#rubriques');
  nav.replaceChildren(...donnees.carte.rubriques.map((r) => h('a', { href: `#${r.id}` }, r.titre)));
  nav.hidden = false;
  $('#carte').replaceChildren(...donnees.carte.rubriques.map((r) =>
    h('section', { class: 'rubrique', id: r.id, 'aria-labelledby': `t-${r.id}` },
      h('h2', { id: `t-${r.id}` }, r.titre),
      donnees.majeurs.includes(r.id) ? h('p', { class: 'note' }, 'Réservée aux personnes majeures.') : null,
      r.articles.map(produit))));
  observerRubriques();
  majBadges();
}

function produit(a) {
  const el = h('div', { class: `produit${a.photo ? '' : ' sans-photo'}`, 'data-id': a.id, onclick: () => ouvrirArticle(a.id) },
    h('div', { class: 'vignette' }, a.photo ? h('img', { src: a.photo, alt: '', loading: 'lazy', width: 72, height: 72, onerror: (e) => e.target.closest('.produit').classList.add('sans-photo') }) : null),
    h('div', {}, h('h3', {}, a.nom), a.description ? h('p', {}, a.description) : a.choix ? h('p', {}, a.choix.options.slice(0, 6).join(' · ') + (a.choix.options.length > 6 ? '…' : '')) : null, h('div', { class: 'prix' }, euros(a.prix))),
    h('button', { class: 'ajouter', type: 'button', 'aria-label': `Ajouter ${a.nom}`, onclick: (e) => { e.stopPropagation(); ajoutRapide(a.id); } }, '+'));
  return el;
}

function majBadges() {
  for (const b of document.querySelectorAll('.produit')) {
    const n = panier.filter((l) => l.article === b.dataset.id).reduce((s, l) => s + l.quantite, 0);
    const btn = b.querySelector('.ajouter');
    btn.classList.toggle('dedans', n > 0);
    btn.textContent = n > 0 ? String(n) : '+';
  }
}

function observerRubriques() {
  const nav = $('#rubriques');
  const liens = [...nav.querySelectorAll('a')];
  const obs = new IntersectionObserver((entrees) => {
    for (const e of entrees) if (e.isIntersecting) {
      for (const l of liens) l.classList.toggle('actif', l.getAttribute('href') === `#${e.target.id}`);
      const actif = liens.find((l) => l.classList.contains('actif'));
      if (actif) nav.scrollTo({ left: actif.offsetLeft - (nav.clientWidth - actif.offsetWidth) / 2, behavior: 'smooth' });
    }
  }, { rootMargin: '-35% 0px -60% 0px' });
  document.querySelectorAll('.rubrique').forEach((s) => obs.observe(s));
  document.documentElement.style.setProperty('--haut-entete', `${$('#entete').offsetHeight}px`);
}

// ── Panier ──────────────────────────────────────────────────────────
const nbArticles = () => panier.reduce((s, l) => s + l.quantite, 0);
const totalPanier = () => panier.reduce((s, l) => s + (articles.get(l.article)?.prix ?? 0) * l.quantite, 0);

function ajouter(id, quantite, choix = null, remarque = null) {
  if (nbArticles() + quantite > donnees.limites.articles) { toast(`${donnees.limites.articles} articles au plus par commande`); return false; }
  const meme = panier.find((l) => l.article === id && l.choix === choix && l.remarque === remarque);
  if (meme && meme.quantite + quantite > donnees.limites.quantite) { toast(`${donnees.limites.quantite} au plus`); return false; }
  if (meme) meme.quantite += quantite;
  else panier.push({ article: id, quantite, choix, remarque });
  sauverPanier();
  majBadges();
  afficherBarre(true);
  navigator.vibrate?.(12);
  return true;
}

function ajoutRapide(id) {
  if (!peutCommander()) return;
  const a = articles.get(id);
  if (a.choix) return ouvrirArticle(id);
  if (ajouter(id, 1)) toast(`${a.nom} ajouté`);
}

function afficherBarre(secoue = false) {
  const n = nbArticles();
  const barre = $('#barre');
  barre.classList.toggle('visible', n > 0 && peutCommander());
  $('#compte').textContent = n;
  $('#total-barre').textContent = euros(totalPanier());
  if (secoue) { barre.classList.remove('secoue'); void barre.offsetWidth; barre.classList.add('secoue'); }
}

// Feuille d'un article : choix (goût, boisson), quantité, remarque
let articleOuvert = null;
function ouvrirArticle(id) {
  const a = articles.get(id);
  articleOuvert = { a, quantite: 1 };
  const img = $('#art-photo');
  img.hidden = !a.photo;
  if (a.photo) img.src = a.photo;
  $('#art-nom').textContent = `${a.nom} · ${euros(a.prix)}`;
  $('#art-desc').textContent = a.description ?? '';
  $('#art-choix').hidden = !a.choix;
  if (a.choix) {
    $('#art-choix-libelle').textContent = a.choix.libelle;
    $('#art-options').replaceChildren(...a.choix.options.map((o) => h('label', {}, h('input', { type: 'radio', name: 'choix', value: o }), h('span', {}, o))));
  }
  $('#art-qte').textContent = '1';
  $('#art-remarque').value = '';
  $('#art-erreur').textContent = '';
  const peut = peutCommander();
  $('#art-ajouter').hidden = !peut;
  $('#form-article').querySelectorAll('.ligne-quantite, .champ').forEach((e) => (e.hidden = !peut));
  $('#feuille-article').showModal();
}
$('#art-moins').onclick = () => { articleOuvert.quantite = Math.max(1, articleOuvert.quantite - 1); $('#art-qte').textContent = articleOuvert.quantite; };
$('#art-plus').onclick = () => { articleOuvert.quantite = Math.min(donnees.limites.quantite, articleOuvert.quantite + 1); $('#art-qte').textContent = articleOuvert.quantite; };
$('#art-fermer').onclick = () => $('#feuille-article').close();
$('#art-ajouter').onclick = () => {
  const { a, quantite } = articleOuvert;
  const choix = a.choix ? document.querySelector('#art-options input:checked')?.value ?? null : null;
  if (a.choix && !choix) { $('#art-erreur').textContent = `Choisissez : ${a.choix.libelle.toLowerCase()}.`; return; }
  const remarque = $('#art-remarque').value.replace(/\s+/g, ' ').trim().slice(0, donnees.limites.remarque) || null;
  if (ajouter(a.id, quantite, choix, remarque)) { $('#feuille-article').close(); toast(`${quantite} × ${a.nom} ajouté${quantite > 1 ? 's' : ''}`); }
};

function afficherPanier() {
  $('#panier-erreur').textContent = '';
  $('#panier-lignes').replaceChildren(...panier.map((l, i) => {
    const a = articles.get(l.article);
    return h('div', { class: 'ligne-panier' },
      h('div', {}, h('h3', {}, a.nom), (l.choix || l.remarque) ? h('div', { class: 'details' }, [l.choix, l.remarque && `« ${l.remarque} »`].filter(Boolean).join(' · ')) : null, h('div', { class: 'montant' }, euros(a.prix * l.quantite))),
      h('div', { class: 'quantite' },
        h('button', { type: 'button', 'aria-label': `Retirer un ${a.nom}`, onclick: () => changerQte(i, -1) }, l.quantite === 1 ? '×' : '−'),
        h('output', {}, l.quantite),
        h('button', { type: 'button', 'aria-label': `Ajouter un ${a.nom}`, onclick: () => changerQte(i, 1) }, '+')));
  }));
  $('#panier-total').textContent = euros(totalPanier());
  $('#envoyer').disabled = !panier.length || !peutCommander();
}
function changerQte(i, d) {
  const l = panier[i];
  if (d > 0 && (l.quantite >= donnees.limites.quantite || nbArticles() >= donnees.limites.articles)) return;
  l.quantite += d;
  if (l.quantite <= 0) panier.splice(i, 1);
  sauverPanier(); majBadges(); afficherBarre();
  if (!panier.length) return $('#feuille-panier').close();
  afficherPanier();
}
$('#ouvrir-panier').onclick = () => { afficherPanier(); $('#feuille-panier').showModal(); };
$('#panier-fermer').onclick = () => $('#feuille-panier').close();
for (const d of document.querySelectorAll('dialog.feuille')) d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

$('#envoyer').onclick = async () => {
  const bouton = $('#envoyer');
  bouton.disabled = true;
  bouton.textContent = 'Envoi…';
  $('#panier-erreur').textContent = '';
  try {
    const { commande } = await api('/api/commande', { table: donnees.table, k, lignes: panier });
    panier = [];
    sauverPanier(); majBadges(); afficherBarre();
    mesCommandes = [{ id: commande.id, le: Date.now() }, ...mesCommandes].slice(0, 12);
    ecrire('yaya-commandes', mesCommandes);
    $('#panier-lignes').replaceChildren(h('div', { class: 'envoyee' }, h('div', { class: 'coche', 'aria-hidden': 'true' }, '✓'), h('h2', {}, `Commande n° ${commande.numero} envoyée`), h('p', {}, 'La cuisine va la valider. Vous suivez tout en haut de la page.')));
    $('#panier-total').parentElement.hidden = true;
    bouton.hidden = true;
    navigator.vibrate?.([20, 40, 20]);
    afficherSuivi([commande], commande.id);
    suivre();
  } catch (e) {
    $('#panier-erreur').textContent = e.message;
    if (['article_indisponible', 'choix_invalide'].includes(e.code)) chargerCarte().then(afficherPanier);
    if (['pause', 'ferme'].includes(e.code)) chargerCarte();
  } finally {
    bouton.textContent = 'Envoyer en cuisine';
    bouton.disabled = !panier.length || !peutCommander();
  }
};
$('#feuille-panier').addEventListener('close', () => { $('#envoyer').hidden = false; $('#panier-total').parentElement.hidden = false; });

// ── Suivi des commandes de ce téléphone ─────────────────────────────
const TEXTES = {
  nouvelle: ['En attente', 'Envoyée. La cuisine va la valider.'],
  validee: ['Acceptée', 'Validée par la cuisine, en préparation.'],
  servie: ['Servie', 'Bonne dégustation. Vous réglez au comptoir.'],
  refusee: ['Refusée', 'La cuisine n’a pas pu la prendre : voyez le comptoir.'],
};
let suivies = [];
function afficherSuivi(commandes, neuve) {
  if (commandes) suivies = [...commandes, ...suivies.filter((s) => !commandes.some((c) => c.id === s.id))].sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  const visibles = suivies.filter((c) => !(c.reglee && c.statut === 'servie')).slice(0, 4);
  const s = $('#suivi');
  s.hidden = !visibles.length;
  s.replaceChildren(...visibles.map((c) => h('article', { class: `suivi-carte${c.id === neuve ? ' neuve' : ''}` },
    h('header', {}, h('h3', {}, `Commande n° ${c.numero} · ${heure(c.creeLe)}`), h('span', { class: `pastille pastille--${c.statut}` }, TEXTES[c.statut][0])),
    h('p', {}, TEXTES[c.statut][1]),
    h('p', {}, c.lignes.map((l) => `${l.quantite} × ${l.nom}`).join(', ') + ` · ${euros(c.totalCentimes)}`))));
}
async function suivre() {
  clearTimeout(suivre.t);
  if (!mesCommandes.length) return;
  try {
    const { commandes } = await api('/api/suivi', { ids: mesCommandes.map((c) => c.id) });
    const avant = new Map(suivies.map((c) => [c.id, c.statut]));
    afficherSuivi(commandes);
    for (const c of commandes) if (avant.has(c.id) && avant.get(c.id) !== c.statut) { toast(`Commande n° ${c.numero} : ${TEXTES[c.statut][0].toLowerCase()}`); navigator.vibrate?.(30); }
    if (!commandes.some((c) => c.statut === 'nouvelle' || c.statut === 'validee')) return;
  } catch {}
  if (!document.hidden) suivre.t = setTimeout(suivre, (donnees?.relecture ?? 10) * 1000);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) suivre(); });

chargerCarte();
suivre();
