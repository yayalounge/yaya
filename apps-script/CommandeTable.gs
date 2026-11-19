/**
 * YÄYA · commande à table par QR code (ajout du 19/11/2026).
 *
 * Le client scanne le QR de sa table → page commande.yaya-lounge.fr (GitHub Pages, dossier site/) → doPost ici.
 * Sa commande attend dans l'appli YÄYA Service (« À valider », avec un son). Quand l'équipe la valide, c'est
 * exactement l'action « send » du serveur : ticket en préparation, addition de la table, puis ventes et analyses
 * comme une commande saisie à la main. Rien n'est enregistré dans les ventes sans validation de l'équipe.
 *
 * Branchements dans Code.gs (marqués « commande à table », posés par commande/outils/brancher.mjs) :
 *   - api_ : var fn = ACTIONS_[action] || WEB_ACTIONS_[action];
 *   - doGet_ : la page des QR (?app=qr, lien gérant) → webQrPage_(k)
 *   - INDEX_HTML : <?!= webUi_() ?> avant </body> (panneau « À valider » de CommandeTableUi.html)
 *   - editeurSeul_() en tête des fonctions de l'éditeur et du menu (voir plus bas), onEdit sans vrai événement ignoré
 *
 * Sécurité :
 *   - doPost n'accepte que trois actions (carte, commander, suivi) et ne touche à rien d'autre de l'appli ;
 *   - chaque QR est signé (HMAC, propriété WEB_SECRET créée au premier usage) : impossible d'inventer une table ;
 *   - prix recalculés ici avec priceLine (la carte du Google Sheets fait foi), options obligatoires vérifiées ;
 *   - signature du QR vérifiée avant tout compteur : un faux QR ne coûte rien ; plafonds (CacheService, sans lire le
 *     Sheets) par table, par téléphone, et global (seulement les commandes acceptées) ;
 *   - commande restée en attente à la fermeture : jamais validable le lendemain, le téléphone la voit « refusée » ;
 *   - renvoi après coupure réseau (même numéro d'envoi) : rend la commande déjà créée, jamais de doublon ;
 *   - commandes refusées tant qu'aucune soirée n'est ouverte, ou quand l'équipe a mis les QR en pause ;
 *   - contre les farceurs (QR photographié puis utilisé de loin) : position du téléphone vérifiée à l'envoi
 *     (obligatoire, refusée si loin du lounge ; aucune coordonnée gardée), « Fausse
 *     commande » bloque le téléphone pour la soirée, et 2 fausses commandes verrouillent la table jusqu'au déblocage ;
 *   - aucune donnée personnelle, aucun texte libre du client (rien ne peut devenir une formule dans le Sheets).
 * Toutes les fonctions de ce fichier finissent par « _ » (google.script.run ne peut pas les appeler), sauf doPost.
 * Celles de Code.gs qui ne finissent pas par « _ » (installer, supprimerSoireeEnCours…) s'arrêtent si l'appel vient
 * d'un visiteur du web : editeurSeul_().
 */

var WEB_ = {
  parTable: 3,          // commandes en attente de validation par table
  delaiAppareil: 30,    // secondes entre deux commandes d'un même téléphone
  parMinute: 30,        // commandes par minute, tout le salon (au-delà : « demandez au comptoir »)
  appelsParTable: 240,  // appels de la page client (carte, suivi, envoi) par table et par minute (un téléphone : ~8)
  essaisParTable: 12,   // envois par table et par minute, acceptés ou non
  appelsSansTable: 300, // carte seule (sans QR valable), tout le monde ensemble, par minute
  lignes: 20, articles: 30, quantite: 10, totalMax: 300,
  garder: 8 * 3600000,  // une commande validée reste suivie 8 h sur le téléphone
  loin: 300,            // mètres au-delà du rayon des Paramètres (au moins 300 m) : « vous semblez loin du Yäya »
  precisionMax: 1500,   // m : au-delà, position « approximative » (iPhone ~3 km et plus, Android ~2 km) : on demande la position exacte
  positionObligatoire: true, // sans position partagée, pas de commande (demande de Moussa du 19/11)
  fauxAvantVerrou: 2,   // fausses commandes sur une table, dans la soirée, avant de la verrouiller
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
  var args = Array.isArray(d.args) ? d.args.slice(0, 3) : [];
  // Chaque appel porte la table et sa signature (QR) : vérifiées AVANT tout compteur, sans lire le Sheets. Un faux QR
  // ne coûte rien et ne consomme le plafond de personne ; un vrai QR photographié n'épuise que celui de sa table.
  var tk = nom === 'commander' ? (args[0] && typeof args[0] === 'object' ? args[0] : {}) : { t: nom === 'carte' ? args[0] : args[1], k: nom === 'carte' ? args[1] : args[2] };
  var t = webSignee_(tk.t, tk.k);
  // Sans QR valable, seule la carte s'affiche (lecture seule), sous un plafond commun à part.
  if (!t && nom !== 'carte') return webErr_(403, 'table', 'Ce QR code n’est pas reconnu. Demandez au comptoir.');
  if (!webQuota_('appels-' + (t || 0), t ? WEB_.appelsParTable : WEB_.appelsSansTable, 60)) return webErr_(429, 'occupe', 'Trop d’appels depuis cette table. Réessayez dans une minute.');
  try {
    return { statut: nom === 'commander' ? 201 : 200, corps: f.apply(null, args) };
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
function webCle5_(nom) { return 'web-' + nom + '-' + Math.floor(Date.now() / 60000); }
function webQuota_(nom, max, secondes) {
  var c = CacheService.getScriptCache(), k = 'web-' + nom + '-' + Math.floor(Date.now() / (secondes * 1000)), n = +(c.get(k) || 0);
  if (n >= max) return false;
  try { c.put(k, String(n + 1), secondes + 5); } catch (x) {}
  return true;
}

// ---------- QR des tables ----------

function webSecret_() {
  if (webSecret_.s) return webSecret_.s;
  var p = PropertiesService.getScriptProperties(), s = p.getProperty('WEB_SECRET');
  if (!s || s.length < 32) { s = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); p.setProperty('WEB_SECRET', s); }
  return (webSecret_.s = s);
}
// Changer WEB_QR_VERSION (propriété du script) rend tous les QR imprimés invalides : il faut alors les réimprimer.
function webSigne_(t) {
  var v = webSigne_.v || (webSigne_.v = PropertiesService.getScriptProperties().getProperty('WEB_QR_VERSION') || '1');
  var o = Utilities.computeHmacSha256Signature('yaya-table:' + v + ':' + t, webSecret_(), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(o).replace(/=+$/, '').slice(0, 12);
}
function webSignee_(t, k) {
  t = typeof t === 'number' ? t : /^\d{1,3}$/.test(String(t)) ? +t : NaN;
  if (!(t >= 1 && t <= 999) || typeof k !== 'string' || k.length !== 12) return null;
  var a = webSigne_(t), d = 0;
  for (var i = 0; i < 12; i++) d |= a.charCodeAt(i) ^ k.charCodeAt(i);
  return d === 0 ? t : null;
}
function webTable_(data, t, k) {
  t = webSignee_(t, k);
  return t && data.plan.some(function (x) { return x.t === t; }) ? t : null;
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
  if (statut === 'nouvelle' && !(st.soiree && o.so === st.soiree.id)) statut = 'refusee'; // soirée fermée sans validation
  if (statut === 'validee') {
    var tb = st.tables[o.t], enCours = (st.tickets || []).some(function (x) { return x.id === o.tk; });
    if (!enCours) statut = 'servie';
    if (!tb || tb.id !== o.tb) statut = 'reglee';
  }
  return { id: o.id, numero: o.num, table: o.t, statut: statut, creeLe: new Date(o.ts).toISOString(), total: o.total,
    lignes: o.lines.map(function (l) { return { n: l.n, d: l.d, q: l.q }; }) };
}

function webSuivi_(ids) { // (ids, t, k) : t et k déjà vérifiés par webApi_
  var voulus = (Array.isArray(ids) ? ids : []).filter(function (i) { return typeof i === 'string' && /^[A-Za-z0-9]{20}$/.test(i); }).slice(0, 12);
  if (!voulus.length) return { commandes: [], etat: null };
  var st = readState_();
  return { etat: webEtat_(st), commandes: (st.web || []).filter(function (o) { return voulus.indexOf(o.id) >= 0; }).map(function (o) { return webVue_(st, o); }) };
}

// Sur place ? Distance au lounge (place_ de l'appli, comme la prise de service). On ne garde que la réponse.
function webLieu_(data, pos) {
  if (!pos || !data.params.pos) return 'inconnu';
  var g = place_(data, pos), marge = Math.max(data.params.rayon || 0, WEB_.loin);
  if (g.dist == null) return 'inconnu';
  // iPhone sans « Position exacte » : précision de 1 à 10 km. Loin seulement si c'est loin même dans le pire cas.
  if (g.acc > WEB_.precisionMax) return g.dist - g.acc > marge ? 'loin' : 'imprecis';
  return g.dist - Math.min(g.acc, 500) > marge ? 'loin' : 'ok';
}

function webCommander_(corps, appareil) {
  corps = corps && typeof corps === 'object' ? corps : {};
  appareil = typeof appareil === 'string' && /^[A-Za-z0-9_-]{16,40}$/.test(appareil) ? appareil : '';
  if (!appareil) throw webFail_(400, 'appareil', 'Rechargez la page puis réessayez.');
  var c = CacheService.getScriptCache(), ka = 'web-app-' + appareil;
  // Réseau coupé après l'envoi : le téléphone renvoie le même numéro d'envoi, on lui rend la commande déjà créée.
  var envoi = typeof corps.envoi === 'string' && /^[A-Za-z0-9_-]{16,40}$/.test(corps.envoi) ? 'web-env-' + appareil + '-' + corps.envoi : '';
  if (envoi && c.get(envoi)) {
    var st0 = readState_(), o0 = (st0.web || []).filter(function (x) { return x.id === c.get(envoi); })[0];
    if (o0) return { commande: webVue_(st0, o0) };
  }
  // Plafonds sans toucher au Google Sheets : un spam ne peut pas bloquer l'appli de l'équipe.
  if (c.get(ka)) throw webFail_(429, 'trop_rapide', 'Votre commande vient de partir. Patientez 30 secondes avant d’en envoyer une autre.');
  var tq = webSignee_(corps.t, corps.k);
  if (!webQuota_('essais-' + tq, WEB_.essaisParTable, 60)) throw webFail_(429, 'occupe', 'Trop d’envois depuis cette table. Réessayez dans une minute, ou commandez au comptoir.');
  // Plafond global : compte seulement les commandes acceptées (des envois refusés ne bloquent pas les autres tables).
  if (+(c.get(webCle5_('cmd')) || 0) >= WEB_.parMinute) throw webFail_(429, 'occupe', 'Beaucoup de commandes en ce moment. Réessayez dans une minute, ou commandez au comptoir.');
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

  var pos = corps.pos && typeof corps.pos === 'object' && isFinite(+corps.pos.lat) && isFinite(+corps.pos.lng)
    ? { lat: +corps.pos.lat, lng: +corps.pos.lng, acc: Math.max(0, Math.min(100000, +corps.pos.acc || 0)) } : null;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw webFail_(503, 'occupe', 'Beaucoup de commandes en même temps. Réessayez dans un instant.');
  try {
    var data = loadData_(), st = readState_(), now = Date.now();
    var t = webTable_(data, corps.t, corps.k);
    if (!t) throw webFail_(403, 'table', 'Ce QR code n’est pas reconnu. Demandez au comptoir.');
    if (!st.soiree) throw webFail_(403, 'ferme', 'Les commandes à table ouvrent quand le service commence. Demandez au comptoir.');
    if (st.webPause) throw webFail_(503, 'pause', 'Les commandes par téléphone sont en pause. Commandez au comptoir.');
    var so = st.soiree.id;
    if ((st.webBloques || {})[appareil] === so) throw webFail_(403, 'bloque', 'Les commandes par téléphone ne sont pas possibles. Commandez au comptoir.');
    if ((st.webVerrous || {})[t] === so) throw webFail_(403, 'table_bloquee', 'Les commandes par téléphone sont fermées pour cette table. Commandez au comptoir.');
    var lieu = webLieu_(data, pos);
    if (lieu === 'loin') throw webFail_(403, 'loin', 'Vous semblez loin du Yäya : les commandes à table se font sur place.');
    if (lieu === 'imprecis') throw webFail_(403, 'imprecis', 'Votre téléphone ne donne qu’une position approximative. Activez la position exacte, puis réessayez.');
    if (lieu !== 'ok' && WEB_.positionObligatoire) throw webFail_(403, 'position', 'Autorisez la position pour commander depuis la table, ou commandez au comptoir.');
    var lines = cleanLines_(data, src);
    var n = lines.reduce(function (a, l) { return a + l.q; }, 0), total = r2(lines.reduce(function (a, l) { return a + l.p * l.q; }, 0));
    if (n > WEB_.articles) throw webFail_(400, 'panier', 'Au plus ' + WEB_.articles + ' articles par commande.');
    if (total > WEB_.totalMax) throw webFail_(400, 'panier', 'Commande trop importante pour le téléphone : voyez le comptoir.');
    st.web = webGarder_(st, now);
    var attente = st.web.filter(function (o) { return o.t === t && o.statut === 'nouvelle'; }).length;
    if (attente >= WEB_.parTable) throw webFail_(429, 'table_pleine', 'Déjà ' + attente + ' commandes en attente pour cette table. Patientez, l’équipe arrive.');
    if (st.webNumSo !== so) { st.webNum = 0; st.webNumSo = so; } // numéros de 1 à n chaque soirée
    st.webNum = (st.webNum || 0) + 1;
    var o = { id: Utilities.getUuid().replace(/-/g, '').slice(0, 20), num: st.webNum, t: t, ts: now, src: src,
      lines: lines.map(function (l) { return { n: l.n, d: l.d, p: l.p, k: l.k, q: l.q }; }), total: total, statut: 'nouvelle', so: so,
      lieu: lieu, app: appareil };
    st.web.push(o);
    st.rev++;
    writeState_(st);
    try { c.put(ka, '1', WEB_.delaiAppareil); } catch (x) {}
    try { if (envoi) c.put(envoi, o.id, 600); } catch (x) {}
    try { var kc = webCle5_('cmd'); c.put(kc, String(+(c.get(kc) || 0) + 1), 65); } catch (x) {}
    return { commande: webVue_(st, o) };
  } finally {
    lock.releaseLock();
  }
}

// Commande traitée : on ne garde que ce que le téléphone affiche (l'état est relu toutes les 8 s par les iPads :
// au-delà de 90 000 caractères il n'est plus mis en cache et chaque relecture repasse par le Google Sheets).
function webFin_(o, statut, now, who) {
  o.statut = statut; o.fin = now; o.par = who.nom || (who.gerant ? 'Gérant' : '');
  delete o.src; delete o.app; delete o.lieu;
  o.lines = (o.lines || []).map(function (l) { return { n: l.n, d: l.d, q: l.q }; });
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
    if (o.so !== st.soiree.id) {
      webFin_(o, 'refusee', now, who);
      return 'Commande QR n° ' + o.num + ' d’une soirée précédente : retirée, rien n’est envoyé.';
    }
    var avant = st.tickets.length;
    var msg;
    try { msg = ACTIONS_.send(st, data, { t: o.t, lines: o.src }, now, who); }
    catch (x) { throw new Error((x && x.message || x) + ' · Commande QR n° ' + o.num + ' : refusez-la et voyez le client.'); }
    var tk = st.tickets[st.tickets.length - 1];
    if (st.tickets.length > avant && tk) { tk.qr = o.num; o.tk = tk.id; }
    o.tb = st.tables[o.t] && st.tables[o.t].id;
    webFin_(o, 'validee', now, who);
    return String(msg || '').replace(/^Table (\d+) envoyée/, 'Commande QR de la table $1 validée, envoyée');
  },
  webNo: function (st, data, p, now, who) {
    var o = (st.web || []).filter(function (x) { return x.id === p.id; })[0];
    if (!o) throw new Error('Commande introuvable : l’écran se met à jour.');
    if (o.statut !== 'nouvelle') throw new Error('Commande déjà traitée.');
    var app = o.app;
    webFin_(o, 'refusee', now, who);
    if (!p.faux) return 'Commande QR de la table ' + o.t + ' refusée. Passez voir le client.';
    // Fausse commande : ce téléphone ne commande plus de la soirée ; à la 2e sur la même table, la table est verrouillée.
    o.faux = true;
    var so = st.soiree && st.soiree.id;
    if (!so) return 'Fausse commande refusée.';
    var garde = function (m) { var r = {}; Object.keys(m || {}).forEach(function (x) { if (m[x] === so) r[x] = so; }); return r; };
    st.webBloques = garde(st.webBloques); st.webVerrous = garde(st.webVerrous);
    if (app) st.webBloques[app] = so;
    var depuis = (st.webDeverrou || {})[o.t] || 0;
    var faux = (st.web || []).filter(function (x) { return x.t === o.t && x.so === so && x.faux && (x.fin || 0) > depuis; }).length;
    if (faux >= WEB_.fauxAvantVerrou) {
      st.webVerrous[o.t] = so;
      return 'Fausse commande : téléphone bloqué. Table ' + o.t + ' verrouillée pour les QR (débloquer dans le panneau).';
    }
    return 'Fausse commande : ce téléphone ne peut plus commander ce soir.';
  },
  // QR des tables en PDF : téléchargement (page des QR) et envoi par mail. Gérant seulement.
  webQrPdf: function (st, data, p, now, who) {
    if (!who.gerant) throw new Error('Réservé au gérant.');
    return { pdf: Utilities.base64Encode(webQrPdf_().getBytes()) };
  },
  webQrMail: function (st, data, p, now, who) {
    if (!who.gerant) throw new Error('Réservé au gérant.');
    return 'QR des tables envoyés par mail à ' + webQrMail_() + '.';
  },
  webDebloque: function (st, data, p, now) {
    var t = +p.t;
    if (st.webVerrous) delete st.webVerrous[t];
    st.webDeverrou = st.webDeverrou || {}; st.webDeverrou[t] = now; // les fausses commandes d'avant ne comptent plus
    return 'Table ' + t + ' : commandes par QR rouvertes.';
  },
  webPause: function (st, data, p) {
    st.webPause = !!p.on;
    return st.webPause ? 'Commandes par QR en pause : les clients sont renvoyés au comptoir.' : 'Commandes par QR ouvertes.';
  }
};

// ---------- Fonctions de l'éditeur ----------

// google.script.run peut appeler, depuis n'importe quelle page de l'appli (même « Lien invalide »), toute fonction dont le
// nom ne finit pas par « _ ». Celles qui ne servent que depuis l'éditeur ou le menu du Sheets s'arrêtent si l'appel vient
// d'un visiteur du web (aucun compte Google connu : getActiveUser est vide pour une appli exécutée sous le compte du gérant).
function editeurSeul_() {
  var e = '';
  try { e = Session.getActiveUser().getEmail(); } catch (x) {}
  if (!e) throw new Error('Réservé à l’éditeur du projet.');
}

// ---------- Écrans de l'équipe ----------

// Panneau « À valider » dans YÄYA Service et YÄYA Gérant (inséré dans INDEX_HTML).
function webUi_() {
  // Fichier absent ou mal nommé : on le dit à l'écran, sinon les commandes QR s'entasseraient sans que personne ne les voie.
  try { return HtmlService.createHtmlOutputFromFile('CommandeTableUi').getContent(); }
  catch (e) { return '<div style="position:fixed;top:0;left:0;right:0;z-index:99;background:#b3261e;color:#fff;font:600 14px sans-serif;padding:10px 14px">Commande à table : fichier CommandeTableUi manquant dans le projet Apps Script. Les commandes des tables ne s’affichent pas : prévenez Kerro Labs.</div>'; }
}

// ---------- QR en PDF (téléchargé depuis la page des QR, ou envoyé par mail au gérant) ----------

// Un PDF A4 écrit à la main, 4 chevalets par page, QR en vecteurs (net à toutes les tailles, aucune image).
var WEB_PDF_LARG_ = {
  r: { ' ': 278, A: 667, B: 667, C: 722, D: 722, E: 667, G: 778, L: 556, N: 722, O: 778, T: 611, U: 722, a: 556, c: 500, d: 556, e: 556, m: 833, n: 556, o: 556, p: 556, r: 333, s: 500, u: 556, z: 500 },
  b: { ' ': 278, A: 722, Y: 667, 'Ä': 722 }
};
function webPdfLarg_(txt, gras, taille, esp) {
  var l = 0;
  for (var i = 0; i < txt.length; i++) l += (gras ? WEB_PDF_LARG_.b[txt[i]] : WEB_PDF_LARG_.r[txt[i]]) || 556;
  return l * taille / 1000 + (esp || 0) * (txt.length - 1);
}
function webPdfTexte_(txt, gras, taille, cx, y, esp) {
  var x = cx - webPdfLarg_(txt, gras, taille, esp) / 2, lit = '';
  for (var i = 0; i < txt.length; i++) {
    var c = txt.charCodeAt(i);
    lit += c === 40 || c === 41 || c === 92 ? '\\' + txt[i] : c > 126 ? '\\' + c.toString(8) : txt[i];
  }
  return 'BT /' + (gras ? 'F2' : 'F1') + ' ' + taille + ' Tf ' + (esp || 0) + ' Tc ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Td (' + lit + ') Tj ET\n';
}
function webQrPdf_() {
  var liens = webLiens_(loadData_());
  var W = 595.28, H = 841.89, cw = W / 2, ch = H / 2, pages = [];
  for (var i = 0; i < liens.length; i += 4) {
    var ops = '';
    liens.slice(i, i + 4).forEach(function (x, j) {
      var x0 = (j % 2) * cw, y0 = H - (Math.floor(j / 2) + 1) * ch, cx = x0 + cw / 2, top = y0 + ch;
      ops += '0.02 0.02 0.02 rg ' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' ' + cw.toFixed(2) + ' ' + ch.toFixed(2) + ' re f\n';
      ops += '0.6 G 0.5 w [3 3] 0 d ' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' ' + cw.toFixed(2) + ' ' + ch.toFixed(2) + ' re S [] 0 d\n';
      ops += '0.95 0.945 0.933 rg\n';
      ops += webPdfTexte_('YÄYA', true, 34, cx, top - 58, 1);
      ops += webPdfTexte_('LOUNGE', false, 8, cx, top - 74, 3);
      ops += webPdfTexte_('TABLE', false, 9, cx, top - 106, 3);
      ops += webPdfTexte_(String(x.t), true, 48, cx, top - 150, 0);
      var S = 176, qx = cx - S / 2, qy = y0 + 72, m = WEB_QR_.matrice(x.lien), pad = 12, u = (S - 2 * pad) / m.n;
      ops += '1 1 1 rg ' + qx.toFixed(2) + ' ' + qy.toFixed(2) + ' ' + S + ' ' + S + ' re f\n0 0 0 rg\n';
      for (var r = 0; r < m.n; r++) {
        for (var c = 0; c < m.n; c++) {
          if (m.d[r * m.n + c] !== '1') continue;
          var c2 = c; while (c2 + 1 < m.n && m.d[r * m.n + c2 + 1] === '1') c2++;
          ops += (qx + pad + c * u).toFixed(2) + ' ' + (qy + S - pad - (r + 1) * u).toFixed(2) + ' ' + ((c2 - c + 1) * u + 0.05).toFixed(2) + ' ' + (u + 0.05).toFixed(2) + ' re\n';
          c = c2;
        }
      }
      ops += 'f\n0.95 0.945 0.933 rg\n';
      ops += webPdfTexte_('Scannez pour commander', false, 11, cx, y0 + 38, 0.6);
    });
    pages.push(ops);
  }
  // Assemblage : 1 catalogue, 2 pages, 3-4 polices, puis (page, contenu) par page.
  var objs = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'], kids = [];
  pages.forEach(function (ops) {
    var n = objs.length + 1;
    kids.push(n + ' 0 R');
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (n + 1) + ' 0 R >>');
    objs.push('<< /Length ' + ops.length + ' >>\nstream\n' + ops + 'endstream');
  });
  objs[1] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + kids.length + ' >>';
  var out = '%PDF-1.4\n%âãÏÓ\n', xref = [];
  objs.forEach(function (o, i) { xref.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  var debut = out.length;
  out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + xref.map(function (o) { return ('000000000' + o).slice(-10) + ' 00000 n \n'; }).join('');
  out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + debut + '\n%%EOF\n';
  var octets = [];
  for (var k = 0; k < out.length; k++) { var b = out.charCodeAt(k) & 255; octets.push(b > 127 ? b - 256 : b); }
  return Utilities.newBlob(octets, 'application/pdf', 'QR-tables-Yaya-Lounge.pdf');
}

// Mail au gérant (adresse « Email du récap » des Paramètres), PDF en pièce jointe.
function webQrMail_() {
  var to = String(paramsMap_()[P_EMAIL] || '').trim();
  if (!to) throw new Error('Aucun email dans Paramètres (« Email du récap »).');
  MailApp.sendEmail({
    to: to, name: 'YÄYA Lounge', subject: 'YÄYA · QR des tables à imprimer',
    body: 'Bonjour,\n\nVoici les QR des tables, prêts à imprimer (4 par page A4, à découper sur les pointillés).\n' +
      'Chaque QR ne marche que pour sa table. Les commandes arrivent dans YÄYA Service, « Commandes des tables », et ne partent en préparation qu’une fois validées par l’équipe.\n\n' +
      'Vous pouvez les retélécharger à tout moment : YÄYA Gérant › « QR des tables ».\n\nYÄYA',
    attachments: [webQrPdf_()]
  });
  return to;
}

// Page des QR à imprimer : lien gérant + « &app=qr ». Les QR sont dessinés ici (la clé ne quitte jamais Google).
function webQrPage_(k) {
  var data = loadData_(), liens = webLiens_(data);
  var t = HtmlService.createTemplateFromFile('CommandeTableQr');
  t.qrJson = JSON.stringify(liens.map(function (x) { return { t: x.t, lien: x.lien, svg: WEB_QR_.svg(x.lien) }; })).replace(/</g, '\\u003c');
  t.cleJson = JSON.stringify(String(k)).replace(/</g, '\\u003c'); // pour « Télécharger le PDF » et « Recevoir par mail »
  return t.evaluate().setTitle('YÄYA · QR des tables').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
