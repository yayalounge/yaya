/**
 * YÄYA · commande à table par QR code (ajout du 19/11/2026).
 *
 * Le client scanne le QR de sa table → page commande.yaya-lounge.fr (GitHub Pages, dossier site/) → doPost ici.
 * Sa commande attend dans l'appli YÄYA Service (« À valider », avec un son). Quand l'équipe la valide, c'est
 * exactement l'action « send » du serveur : ticket en préparation, addition de la table, puis ventes et analyses
 * comme une commande saisie à la main. Rien n'est enregistré dans les ventes sans validation de l'équipe.
 *
 * Branchements dans Code.gs (trois lignes, marquées « commande à table ») :
 *   - api_ : var fn = ACTIONS_[action] || WEB_ACTIONS_[action];
 *   - doGet_ : la page des QR (?app=qr, lien gérant) → webQrPage_(k)
 *   - INDEX_HTML : <?!= webUi_() ?> avant </body> (panneau « À valider » de CommandeTableUi.html)
 *
 * Sécurité :
 *   - doPost n'accepte que trois actions (carte, commander, suivi) et ne touche à rien d'autre de l'appli ;
 *   - chaque QR est signé (HMAC, propriété WEB_SECRET créée au premier usage) : impossible d'inventer une table ;
 *   - prix recalculés ici avec priceLine (la carte du Google Sheets fait foi), options obligatoires vérifiées ;
 *   - plafonds avant toute lecture du Sheets (CacheService) : par téléphone, par table, et global par minute ;
 *   - commandes refusées tant qu'aucune soirée n'est ouverte, ou quand l'équipe a mis les QR en pause ;
 *   - aucune donnée personnelle, aucun texte libre du client (rien ne peut devenir une formule dans le Sheets).
 * Toutes les fonctions finissent par « _ » (google.script.run ne peut pas les appeler), sauf doPost.
 */

var WEB_ = {
  parTable: 3,          // commandes en attente de validation par table
  delaiAppareil: 30,    // secondes entre deux commandes d'un même téléphone
  parMinute: 30,        // commandes par minute, tout le salon (au-delà : « demandez au comptoir »)
  appelsParMinute: 600, // tous les appels de la page client (carte, suivi…) par minute
  lignes: 20, articles: 30, quantite: 10, totalMax: 300,
  garder: 8 * 3600000,  // une commande validée reste suivie 8 h sur le téléphone
  photos: 'photos/', // servies par la page client elle-même (yaya-lounge.fr refuse l'affichage depuis un autre site)
  photosConnues: ['coeur-coulant', 'crepe-crunchy', 'crepe-nutella', 'crepe-oreo', 'crepe-sugar', 'frites', 'grandes-frites', 'mango-juice', 'milkshake-caramel', 'milkshake-fraise', 'milkshake-oreo', 'mojito-yaya', 'pasta-carbo', 'pasta-salmon', 'yaya-smash-xl', 'yaya-smash'],
  site: 'https://commande.yaya-lounge.fr/'
};

// ---------- Point d'entrée public ----------

function doPost(e) {
  var out;
  memoOn_();
  try {
    out = webApi_(e);
  } catch (x) {
    console.error('[commande à table] ' + ((x && x.stack) || x));
    out = { statut: 500, corps: { erreur: 'interne', message: 'Un souci technique. Réessayez, ou commandez au comptoir.' } };
  } finally {
    memoOff_();
    try { rcFlush_(); } catch (x) {}
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function webApi_(e) {
  var texte = e && e.postData && typeof e.postData.contents === 'string' ? e.postData.contents : '';
  if (!texte || texte.length > 8000) return webErr_(400, 'requete', 'Requête refusée.');
  var d;
  try { d = JSON.parse(texte); } catch (x) { return webErr_(400, 'requete', 'Requête refusée.'); }
  var api = { carte: webCarte_, commander: webCommander_, suivi: webSuivi_ }, nom = d && d.yayaCmd;
  var f = typeof nom === 'string' && Object.prototype.hasOwnProperty.call(api, nom) ? api[nom] : null;
  if (!f) return webErr_(404, 'action', 'Action inconnue.');
  if (!webQuota_('appels', WEB_.appelsParMinute, 60)) return webErr_(429, 'occupe', 'Trop de monde en même temps. Réessayez dans une minute.');
  try {
    return { statut: d.yayaCmd === 'commander' ? 201 : 200, corps: f.apply(null, Array.isArray(d.args) ? d.args.slice(0, 3) : []) };
  } catch (x) {
    if (x && x.web) return webErr_(x.web, x.code, x.message);
    var m = String((x && x.message) || x);
    // Erreurs de l'appli (priceLine, cleanLines_…) : le message est déjà lisible (article introuvable, option manquante).
    if (/^(Article introuvable|Choisis|Quantité invalide|Aucun article)/.test(m)) return webErr_(400, 'panier', m.replace('Article introuvable sur la carte', 'Cet article n’est plus à la carte'));
    if (/^BUSY\|/.test(m)) return webErr_(503, 'occupe', 'Beaucoup de commandes en même temps. Réessayez dans un instant.');
    throw x;
  }
}

function webErr_(statut, code, message) { return { statut: statut, corps: { erreur: code, message: message } }; }
function webFail_(statut, code, message) { var e = new Error(message); e.web = statut; e.code = code; return e; }

// Compteur par fenêtre de temps dans le cache (aucune lecture du Sheets, aucun verrou).
function webQuota_(nom, max, secondes) {
  var c = CacheService.getScriptCache(), k = 'web-' + nom + '-' + Math.floor(Date.now() / (secondes * 1000)), n = +(c.get(k) || 0);
  if (n >= max) return false;
  try { c.put(k, String(n + 1), secondes + 5); } catch (x) {}
  return true;
}

// ---------- QR des tables ----------

function webSecret_() {
  var p = PropertiesService.getScriptProperties(), s = p.getProperty('WEB_SECRET');
  if (!s || s.length < 32) { s = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); p.setProperty('WEB_SECRET', s); }
  return s;
}
// Changer WEB_QR_VERSION (propriété du script) rend tous les QR imprimés invalides : il faut alors les réimprimer.
function webSigne_(t) {
  var v = PropertiesService.getScriptProperties().getProperty('WEB_QR_VERSION') || '1';
  var o = Utilities.computeHmacSha256Signature('yaya-table:' + v + ':' + t, webSecret_(), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(o).replace(/=+$/, '').slice(0, 12);
}
function webTable_(data, t, k) {
  t = typeof t === 'number' ? t : /^\d{1,3}$/.test(String(t)) ? +t : NaN;
  if (!(t >= 1) || typeof k !== 'string' || k.length !== 12) return null;
  if (!data.plan.some(function (x) { return x.t === t; })) return null;
  var a = webSigne_(t), d = 0;
  for (var i = 0; i < 12; i++) d |= a.charCodeAt(i) ^ k.charCodeAt(i);
  return d === 0 ? t : null;
}
function webLiens_(data) {
  return data.plan.filter(function (x) { return typeof x.t === 'number'; }).map(function (x) { return x.t; }).sort(function (a, b) { return a - b; })
    .map(function (t) { return { t: t, lien: WEB_.site + '?t=' + t + '&k=' + webSigne_(t) }; });
}

// ---------- Ce que voit le client ----------

function webCle_(s) {
  return String(s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function webEtat_(st) {
  return { ouvert: !!st.soiree && !st.webPause, soiree: !!st.soiree, pause: !!st.webPause };
}

function webCarte_(t, k) {
  var data = loadData_(), st = readState_(), table = webTable_(data, t, k);
  var groupes = {}, cats = [];
  data.carte.filter(function (x) { return x.actif && x.p > 0 || x.actif && x.o.length; }).forEach(function (x) {
    var c = cats.filter(function (y) { return y.nom === x.cat; })[0];
    if (!c) { c = { nom: x.cat, articles: [] }; cats.push(c); }
    var cle = webCle_(x.n);
    c.articles.push({ n: x.n, p: x.p, sub: x.sub, o: x.o, photo: WEB_.photosConnues.indexOf(cle) >= 0 ? WEB_.photos + cle + '.webp' : null });
    x.o.forEach(function (g) { if (data.options[g]) groupes[g] = data.options[g]; });
  });
  return {
    table: table, etat: webEtat_(st), carte: cats, options: groupes, relecture: 10,
    limites: { lignes: WEB_.lignes, articles: WEB_.articles, quantite: WEB_.quantite }
  };
}

// Ce que le téléphone voit d'une commande : statut lisible, jamais l'addition des autres.
function webVue_(st, o) {
  var statut = o.statut;
  if (statut === 'validee') {
    var tb = st.tables[o.t], enCours = (st.tickets || []).some(function (x) { return x.id === o.tk; });
    if (!enCours) statut = 'servie';
    if (!tb || tb.id !== o.tb) statut = 'reglee';
  }
  return { id: o.id, numero: o.num, table: o.t, statut: statut, creeLe: new Date(o.ts).toISOString(), total: o.total,
    lignes: o.lines.map(function (l) { return { n: l.n, d: l.d, q: l.q }; }) };
}

function webSuivi_(ids) {
  var voulus = (Array.isArray(ids) ? ids : []).filter(function (i) { return typeof i === 'string' && /^[A-Za-z0-9]{20}$/.test(i); }).slice(0, 12);
  if (!voulus.length) return { commandes: [], etat: null };
  var st = readState_();
  return { etat: webEtat_(st), commandes: (st.web || []).filter(function (o) { return voulus.indexOf(o.id) >= 0; }).map(function (o) { return webVue_(st, o); }) };
}

function webCommander_(corps, appareil) {
  corps = corps && typeof corps === 'object' ? corps : {};
  appareil = typeof appareil === 'string' && /^[A-Za-z0-9_-]{16,40}$/.test(appareil) ? appareil : '';
  if (!appareil) throw webFail_(400, 'appareil', 'Rechargez la page puis réessayez.');
  // Plafonds sans toucher au Google Sheets : un spam ne peut pas bloquer l'appli de l'équipe.
  var c = CacheService.getScriptCache(), ka = 'web-app-' + appareil;
  if (c.get(ka)) throw webFail_(429, 'trop_rapide', 'Votre commande vient de partir. Patientez 30 secondes avant d’en envoyer une autre.');
  if (!webQuota_('cmd', WEB_.parMinute, 60)) throw webFail_(429, 'occupe', 'Beaucoup de commandes en ce moment. Réessayez dans une minute, ou commandez au comptoir.');
  var brut = Array.isArray(corps.lines) ? corps.lines : [];
  if (!brut.length) throw webFail_(400, 'panier_vide', 'Votre panier est vide.');
  if (brut.length > WEB_.lignes) throw webFail_(400, 'panier', 'Trop de lignes dans une seule commande. Envoyez-en deux.');
  var src = brut.map(function (x) {
    var q = Math.floor(+(x && x.q));
    if (!(q >= 1 && q <= WEB_.quantite)) throw webFail_(400, 'quantite', 'Au plus ' + WEB_.quantite + ' fois le même article par commande.');
    var sel = {};
    if (x.sel && typeof x.sel === 'object') Object.keys(x.sel).slice(0, 6).forEach(function (g) { sel[String(g).slice(0, 60)] = String(x.sel[g]).slice(0, 80); });
    return { n: String((x && x.n) || '').slice(0, 120), sel: sel, q: q };
  });

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw webFail_(503, 'occupe', 'Beaucoup de commandes en même temps. Réessayez dans un instant.');
  try {
    var data = loadData_(), st = readState_(), now = Date.now();
    var t = webTable_(data, corps.t, corps.k);
    if (!t) throw webFail_(403, 'table', 'Ce QR code n’est pas reconnu. Demandez au comptoir.');
    if (!st.soiree) throw webFail_(403, 'ferme', 'Les commandes à table ouvrent quand le service commence. Demandez au comptoir.');
    if (st.webPause) throw webFail_(503, 'pause', 'Les commandes par téléphone sont en pause. Commandez au comptoir.');
    var lines = cleanLines_(data, src);
    var n = lines.reduce(function (a, l) { return a + l.q; }, 0), total = r2(lines.reduce(function (a, l) { return a + l.p * l.q; }, 0));
    if (n > WEB_.articles) throw webFail_(400, 'panier', 'Au plus ' + WEB_.articles + ' articles par commande.');
    if (total > WEB_.totalMax) throw webFail_(400, 'panier', 'Commande trop importante pour le téléphone : voyez le comptoir.');
    st.web = webGarder_(st, now);
    var attente = st.web.filter(function (o) { return o.t === t && o.statut === 'nouvelle'; }).length;
    if (attente >= WEB_.parTable) throw webFail_(429, 'table_pleine', 'Déjà ' + attente + ' commandes en attente pour cette table. Patientez, l’équipe arrive.');
    st.webNum = (st.webNum || 0) + 1;
    var o = { id: Utilities.getUuid().replace(/-/g, '').slice(0, 20), num: st.webNum, t: t, ts: now, src: src,
      lines: lines.map(function (l) { return { n: l.n, d: l.d, p: l.p, k: l.k, q: l.q }; }), total: total, statut: 'nouvelle', so: st.soiree.id };
    st.web.push(o);
    st.rev++;
    writeState_(st);
    try { c.put(ka, '1', WEB_.delaiAppareil); } catch (x) {}
    return { commande: webVue_(st, o) };
  } finally {
    lock.releaseLock();
  }
}

// Commandes encore utiles : en attente, ou validées/refusées depuis moins de 8 h (suivi sur le téléphone).
function webGarder_(st, now) {
  return (st.web || []).filter(function (o) { return o.statut === 'nouvelle' ? (st.soiree && o.so === st.soiree.id) : now - (o.fin || o.ts) < WEB_.garder; }).slice(-120);
}

// ---------- Actions de l'équipe (appelées par api_ avec la clé et le code, comme les autres) ----------

var WEB_ACTIONS_ = {
  // Valider : exactement comme si le serveur avait saisi la commande (ticket, addition, ventes).
  webOk: function (st, data, p, now, who) {
    needSoiree_(st);
    var o = (st.web || []).filter(function (x) { return x.id === p.id; })[0];
    if (!o) throw new Error('Commande introuvable : l’écran se met à jour.');
    if (o.statut !== 'nouvelle') throw new Error('Commande déjà ' + (o.statut === 'validee' ? 'validée' : 'refusée') + '.');
    var avant = st.tickets.length;
    var msg = ACTIONS_.send(st, data, { t: o.t, lines: o.src }, now, who);
    var tk = st.tickets[st.tickets.length - 1];
    if (st.tickets.length > avant && tk) { tk.qr = o.num; o.tk = tk.id; }
    o.tb = st.tables[o.t] && st.tables[o.t].id;
    o.statut = 'validee'; o.fin = now; o.par = who.nom || (who.gerant ? 'Gérant' : '');
    return String(msg || '').replace(/^Table (\d+) envoyée/, 'Commande QR de la table $1 validée, envoyée');
  },
  webNo: function (st, data, p, now, who) {
    var o = (st.web || []).filter(function (x) { return x.id === p.id; })[0];
    if (!o) throw new Error('Commande introuvable : l’écran se met à jour.');
    if (o.statut !== 'nouvelle') throw new Error('Commande déjà traitée.');
    o.statut = 'refusee'; o.fin = now; o.par = who.nom || (who.gerant ? 'Gérant' : '');
    return 'Commande QR de la table ' + o.t + ' refusée. Passez voir le client.';
  },
  webPause: function (st, data, p) {
    st.webPause = !!p.on;
    return st.webPause ? 'Commandes par QR en pause : les clients sont renvoyés au comptoir.' : 'Commandes par QR ouvertes.';
  }
};

// ---------- Écrans de l'équipe ----------

// Panneau « À valider » dans YÄYA Service et YÄYA Gérant (inséré dans INDEX_HTML).
function webUi_() {
  try { return HtmlService.createHtmlOutputFromFile('CommandeTableUi').getContent(); } catch (e) { return ''; }
}

// Page des QR à imprimer : lien gérant + « &app=qr ». Les QR sont dessinés ici (la clé ne quitte jamais Google).
function webQrPage_(k) {
  var data = loadData_(), liens = webLiens_(data);
  var t = HtmlService.createTemplateFromFile('CommandeTableQr');
  t.qrJson = JSON.stringify(liens.map(function (x) { return { t: x.t, lien: x.lien, svg: WEB_QR_.svg(x.lien) }; })).replace(/</g, '\\u003c');
  return t.evaluate().setTitle('YÄYA · QR des tables').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
