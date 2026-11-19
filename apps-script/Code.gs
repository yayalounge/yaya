/**
 * YÄYA Lounge · prise de commande (service) et récap gérant.
 * Script lié au Google Sheets « YÄYA Commandes ».
 * Menu YÄYA du Sheets : installer les onglets, afficher les liens.
 */

var TZ = 'Europe/Paris';
var SH = {
  carte: 'Carte', options: 'Options', fidelite: 'Fidélité', sugg: 'Suggestions', plan: 'Plan de salle', params: 'Paramètres',
  soirees: 'Soirées', ventes: 'Ventes', lignes: 'Lignes vendues', paiements: 'Paiements', cadeaux: 'Cadeaux fidélité',
  annul: 'Annulations', patron: 'Conso patron', pointages: 'Pointages', achats: 'Achats', courses: 'Courses', equipe: 'Équipe', stock: 'Stock', inventaires: 'Inventaires', promos: 'Promotions',
  demandes: 'Demandes', messages: 'Messages', caisse: 'Caisse', etat: '_etat'
};
var HEAD = {
  carte: ['Catégorie', 'Article', 'Prix (€)', 'Options', 'Description', 'Actif'],
  options: ['Groupe', 'Libellé affiché', 'Choix', 'Supplément (€)'],
  fidelite: ['Palier (tampons)', 'Cadeau', 'Articles de la carte concernés'],
  sugg: ['Article commandé', 'Formule proposée', 'Option reprise'],
  plan: ['Table', 'Colonne', 'Ligne', 'Largeur'],
  params: ['Paramètre', 'Valeur', 'Explication'],
  soirees: ['ID soirée', 'Date', 'Ouverture', 'Fermeture', 'Retard (min)', 'CA', 'CB', 'Espèces', 'Tables encaissées', 'Panier moyen',
    'Fond de caisse', 'Espèces attendues', 'Espèces comptées', 'Écart de caisse', 'Offert fidélité', 'Conso patron (valeur)', 'Annulations (valeur)', 'Commentaire du service', 'Équipe', 'Fermée par', 'Personnes', 'Match', 'Détail du comptage', 'Inventaire du lundi', 'Ménage', 'Total TPE'],
  ventes: ['ID vente', 'ID soirée', 'Date', 'Table', 'Ouverture table', 'Clôture', 'Montant articles', 'Remise fidélité', 'Encaissé', 'Modes de paiement', 'Personnes', 'Promotion', 'Offert ou annulé après service'],
  lignes: ['ID vente', 'ID soirée', 'Date', 'Horodatage', 'Table', 'Catégorie', 'Article', 'Détails', 'Quantité', 'Prix unitaire', 'Montant'],
  paiements: ['ID vente', 'ID soirée', 'Date', 'Horodatage', 'Table', 'Mode', 'Montant', 'Encaissé par'],
  cadeaux: ['ID vente', 'ID soirée', 'Date', 'Horodatage', 'Table', 'Palier', 'Cadeau', 'Article', 'Montant offert', 'Offert par'],
  annul: ['ID soirée', 'Date', 'Horodatage', 'Table', 'Catégorie', 'Article', 'Détails', 'Quantité', 'Prix unitaire', 'Montant', 'Raison', 'Par'],
  patron: ['ID soirée', 'Date', 'Horodatage', 'Catégorie', 'Article', 'Détails', 'Quantité', 'Valeur unitaire', 'Valeur', 'Pour', 'Pour qui et pourquoi', 'Saisi par'],
  pointages: ['ID soirée', 'Date', 'Type', 'Horodatage', 'Retard (min)', 'Distance du lounge (m)', 'Précision GPS (m)', 'Statut', 'Personne'],
  achats: ['Date', 'Produit', 'Catégorie', 'Quantité', 'Unité', 'Prix total (€)', 'Prix unitaire (€)', 'Fournisseur', 'Saisi le'],
  courses: ['Ajouté le', 'Article', 'Précision', 'Statut', 'Acheté le'],
  equipe: ['Nom', 'Code', 'Actif', 'Ajouté le', 'Retiré le'],
  stock: ['Produit', 'Type', 'Unité', 'Articles de la carte', 'Choix', 'Quantité par vente', 'Seuil bas', 'Actif', 'Coût unitaire (€)'],
  inventaires: ['Date', 'Produit', 'Compté', 'Théorique', 'Écart', 'Écart (%)', 'Saisi le', 'Compté par'],
  promos: ['ID vente', 'ID soirée', 'Date', 'Horodatage', 'Table', 'Taux (%)', 'Addition avant promo', 'Remise', 'Motif', 'Pour qui', 'Accordée par', 'Prise en compte le'],
  // Demandes à valider par le gérant : avance sur salaire, offert ou annulation après service, conso offerte.
  demandes: ['ID', 'Créée le', 'Type', 'Par', 'Montant (€)', 'Détail', 'Motif', 'Pour qui / explication', 'ID soirée', 'Table', 'Statut', 'Décidée le', 'Paiement', 'Consommé'],
  messages: ['Horodatage', 'De', 'Message'],
  // Mouvements du tiroir hors encaissements : retraits du gérant, ajouts de monnaie, avances, sorties.
  caisse: ['Horodatage', 'Type', 'Montant (€)', 'Motif', 'Par', 'Saisi le']
};
var P_POS = 'Position du lounge', P_RAYON = 'Rayon autorisé (m)';
var P_OBJ_MOIS = 'Objectif CA du mois (€)', P_OBJ_BEN = 'Objectif bénéfice du mois (€)', P_CHARGES = 'Charges fixes du mois (€)',
  P_OBJ_SOIR = 'Objectif CA par soirée (€)', P_OBJ_PAN = 'Objectif panier moyen (€)';
var P_OBJ_PPERS = 'Objectif panier par personne (€)', P_OBJ_TETES = 'Objectif têtes en plus pour 10 chichas', P_OBJ_DESS = 'Objectif desserts pour 10 tables';
var P_POIDS = 'Poids des jours (lun → dim)', P_TETES_KG = 'Têtes par kilo de goût', P_TOL = 'Tolérance d’écart (%)', P_PRIX_GOUT = 'Prix du goût (€/kg)';
var P_SAL = 'Salaires du mois (€)';
var OBJ_KEYS = { mois: P_OBJ_MOIS, ben: P_OBJ_BEN, sal: P_SAL, charges: P_CHARGES, soir: P_OBJ_SOIR, pan: P_OBJ_PAN, ppers: P_OBJ_PPERS, tetes: P_OBJ_TETES, dess: P_OBJ_DESS };
// Classement donné par Rayane : lundi le plus faible, puis mardi, mercredi, jeudi, dimanche, vendredi, samedi le meilleur.
var POIDS_DEFAUT = [0.6, 0.7, 0.8, 0.9, 1.4, 1.5, 1.1];
var P_FOND = 'Fond de caisse (€)', P_EMAIL = 'Email du récap', P_OUV = 'Heure d’ouverture', P_RELANCE = 'Relance dessert (min)', P_URL = 'Adresse de l’appli';
var P_RELANCE_TETE = 'Relance tête (min)';
var P_TAUX_DEF = 'Part des matières par défaut (%)';
var P_SEUIL_ESP = 'Alerte espèces dans le tiroir (€)', P_ALERTES = 'Alertes par mail (demandes, messages)';
var P_G_PLATE = 'Grammes de goût par tête plate', P_G_QUASAR = 'Grammes de goût par tête Quasar';
var PROMO_MOTIFS_ = ['Collaborateur', 'Ami', 'Famille', 'Geste commercial', 'Autre'];
var TYPES_ = ['Goût', 'Boisson', 'Frais', 'Surgelé', 'Épicerie', 'Consommable', 'Autre'];

// ---------- Web app ----------

// v26 · L'appli peut s'afficher dans l'app iPad (page d'accueil hébergée sur GitHub Pages, en plein écran).
function doGet(e) {
  memoOn_(); RO_ = true;
  try {
    var out = doGet_(e);
    try { out.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); } catch (x) {}
    return out;
  } finally { memoOff_(); rcFlush_(); }
}
function doGet_(e) {
  var prm = (e && e.parameter) || {};
  var k = prm.k || '', role = roleOf_(k);
  if (!role) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:24px;font-size:16px">Lien invalide. Demande le lien à jour au gérant.</p>')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }
  // Commande à table (CommandeTable.gs) : QR des tables à imprimer, même lien gérant avec « &app=qr ».
  if (prm.app === 'qr') {
    if (role !== 'gerant') return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:24px;font-size:16px">Réservé au gérant.</p>').addMetaTag('viewport', 'width=device-width, initial-scale=1');
    return webQrPage_(k);
  }
  // v23 · Appli d'analyses : même lien gérant, avec « &app=analyses ». Lecture seule.
  if (prm.app === 'analyses') {
    if (role !== 'gerant') return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:24px;font-size:16px">Réservé au gérant.</p>').addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    var ta = HtmlService.createTemplate(ANALYSES_HTML);
    ta.bootJson = JSON.stringify({ key: k, now: Date.now(), cv: CODE_V_ }).replace(/</g, '\\u003c');
    return ta.evaluate().setTitle('YÄYA Analyses').addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  }
  var t = HtmlService.createTemplate(INDEX_HTML);
  var codes = role === 'serveur';
  var boot = { role: role, key: k, data: loadData_(), state: codes ? null : readState_(), codes: codes, now: Date.now(), cv: CODE_V_ };
  if (role === 'gerant') { try { boot.ana = baseUrl_() + '?app=analyses&k=' + encodeURIComponent(k); } catch (e) {} }
  t.bootJson = JSON.stringify(boot).replace(/</g, '\\u003c');
  return t.evaluate()
    .setTitle(role === 'gerant' ? 'YÄYA Gérant' : 'YÄYA Service')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
}

// Point d'entrée unique de l'appli.
var RO_ = false, RO_ACTIONS_ = ['state', 'recap', 'recaps', 'stock', 'objectifs', 'analyses', 'achats', 'caisse', 'equipe', 'courses', 'carte', 'invList', 'data'];
function api(key, action, p) { memoOn_(); RO_ = RO_ACTIONS_.indexOf(action) >= 0; try { return api_(key, action, p); } finally { memoOff_(); rcFlush_(); } }
function api_(key, action, p) {
  var role = roleOf_(key);
  if (!role) throw new Error('Lien invalide. Demande le lien à jour au gérant.');
  p = p || {};
  // Service : chaque personne s'identifie avec son code à 4 chiffres (dès qu'un membre est enregistré dans l'onglet Équipe).
  p._action = action;
  var who = role === 'gerant' ? { nom: '', gerant: true } : who_(p);
  if (action === 'login') return login_(who);
  if (action === 'state') {
    var s = readState_(), dr = +(props_().getProperty('DATA_REV') || 0);
    return p.rev === s.rev ? { same: true, dr: dr, cv: CODE_V_ } : { state: s, dr: dr, cv: CODE_V_ };
  }
  if (action === 'recap') {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    return recap_(p.id, !!p.lite);
  }
  // Plusieurs soirées passées d'un coup (chaque onglet n'est lu qu'une fois) : le gérant passe ensuite d'une soirée à l'autre sans attente.
  if (action === 'recaps') {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    var outR = {}, curId = (readState_().soiree || {}).id;
    (p.ids || []).slice(0, 14).forEach(function (sid) { if (sid && sid !== curId) { try { outR[sid] = recap_(sid, true); } catch (e) {} } });
    return outR;
  }
  if (action === 'promoAck') {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    promoAck_(p);
    var ar = recap_(String(p.id || ''));
    ar.msg = p.all ? 'Toutes les promotions sont prises en compte.' : 'Promotion prise en compte.';
    return ar;
  }
  if (action === 'mailSoiree') {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    var mr = recap_(String(p.id || ''));
    if (!mr.soiree || !mr.soiree.closed) throw new Error('Le compte rendu part une fois la soirée fermée.');
    mr.msg = sendCompteRendu_(mr.id, null);
    return mr;
  }
  if (action === 'data') return loadData_();
  if (action === 'analyses') {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    return analyses_();
  }
  if (/^(caisse|caisseMove|caisseDel|caisseParams)$/.test(action)) {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    var cm = '';
    if (action === 'caisseMove') cm = caisseMove_(p);
    if (action === 'caisseDel') cm = caisseDel_(p);
    if (action === 'caisseMove' || action === 'caisseDel') { try { if (dropCount_()) cm += ' La caisse de ce soir sera à recompter.'; } catch (e) {} }
    if (action === 'caisseParams') cm = caisseParams_(p);
    var cinf = caisseInfo_();
    if (cm) cinf.msg = cm;
    return cinf;
  }
  if (action === 'invList') return invListe_();
  if (/^(stock|stockInv|stockProd|stockProdOff|stockCout|carte|carteSave|carteAdd|goutAdd|goutDel)$/.test(action)) {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    if (action === 'stockInv') { saveInventaire_(p); invDoneGerant_(); }
    if (action === 'stockProd') addStockProd_(p);
    if (action === 'stockProdOff') stockProdOff_(p);
    if (action === 'stockCout') stockCout_(p);
    if (/^(stock|stockInv|stockProd|stockProdOff|stockCout)$/.test(action)) { var si = stockInfo_(); try { si.intel = stockIntel_(si); } catch (e) { si.intel = null; } return si; }
    if (action === 'carteSave') carteSave_(p);
    if (action === 'carteAdd') carteAdd_(p);
    if (action === 'goutAdd') goutAdd_(p);
    if (action === 'goutDel') goutDel_(p);
    var ci = carteInfo_();
    try { ci.marges = margesInfo_(); } catch (e) { ci.marges = []; }
    return ci;
  }
  if (/^(objectifs|setObjectifs|equipe|teamAdd|teamOff|teamCode|adminCode|weeklyNow|monthlyNow|backupNow|setMatch)$/.test(action)) {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    if (action === 'setMatch') { setMatch_(p); return recap_(String(p.id || '')); }
    if (action === 'monthlyNow') { var mo2 = monthly_(String(p.m || '').match(/^\d{4}-\d{2}$/) ? p.m : ym_(new Date()), true); var inf2 = objectifsInfo_(); inf2.msg = mo2; return inf2; }
    if (action === 'weeklyNow') { var wk = weekly_(weekStart_(Date.now() - 7 * 86400000), true); var info = objectifsInfo_(); info.msg = wk; return info; }
    if (action === 'backupNow') { var bk = backup_(); var inf = objectifsInfo_(); inf.msg = 'Sauvegarde faite : ' + bk.name; return inf; }
    if (action === 'setObjectifs') setObjectifs_(p);
    if (action === 'objectifs' || action === 'setObjectifs') return objectifsInfo_();
    if (action === 'teamAdd') teamAdd_(p);
    if (action === 'teamOff') teamOff_(p);
    if (action === 'teamCode') teamCode_(p);
    if (action === 'adminCode') { var nc = newPin_(); props_().setProperty('ADMIN_PIN', nc); }
    return equipeInfo_();
  }
  if (action === 'openRemote' && role !== 'gerant') throw new Error('Réservé au gérant.');
  if (action === 'deleteSoiree') {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    deleteSoiree_(String(p.id || ''));
    return recap_('');
  }
  if (action === 'courses' || action === 'courseAdd' || action === 'courseDone') {
    if (action === 'courseAdd') addCourse_(p);
    if (action === 'courseDone') doneCourse_(p);
    return coursesInfo_();
  }
  if (action === 'achats' || action === 'achatAdd' || action === 'achatDel' || action === 'achatMerge') {
    if (role !== 'gerant') throw new Error('Réservé au gérant.');
    if (action === 'achatAdd') addAchat_(p);
    if (action === 'achatDel') delAchat_(p);
    if (action === 'achatMerge') mergeAchat_(p.from, p.to);
    return achatsInfo_();
  }
  if (action === 'batch') return batch_(p, who);
  var fn = ACTIONS_[action] || WEB_ACTIONS_[action]; // commande à table (CommandeTable.gs)
  if (!fn) throw new Error('Action inconnue.');
  var lock = LockService.getScriptLock(), out, t0 = Date.now();
  // Journal (Exécutions) : si un appel reste bloqué côté Google, on sait quelle action tenait l'appli.
  console.log('> ' + action + (who.nom ? ' · ' + who.nom : ''));
  if (!lock.tryLock(20000)) throw new Error('BUSY|Google est lent en ce moment. Rien n’est perdu : réessaie dans une minute.');
  try {
    var st = readState_(), data = loadData_(), now = Date.now();
    if (who.nom && !who.admin && st.soiree && !FREE_[action] && !onDuty_(st, who.nom)) throw new Error('JOIN|Commence ton service pour utiliser l’appli.');
    // Renvoi après une coupure réseau : une action déjà faite n'est jamais refaite.
    var op = String(p._op || '');
    if (op && (st.ops || []).indexOf(op) >= 0) return { state: st, dup: true };
    out = fn(st, data, p, now, who) || {};
    if (typeof out === 'string') out = { msg: out };
    if (op) { st.ops = (st.ops || []).concat([op]).slice(-60); }
    st.rev++;
    writeState_(st);
    out.state = st;
  } finally {
    lock.releaseLock();
    if (Date.now() - t0 > 4000) console.log('< ' + action + ' : ' + (Date.now() - t0) + ' ms');
  }
  // Fermeture : compte rendu de la soirée par mail, après avoir libéré l'appli.
  if (out._mail) {
    try { out.msg += ' ' + sendCompteRendu_(out._mail.id, out._mail.fb); } catch (e) {}
    delete out._mail;
  }
  // Demande ou message de l'équipe : mail au gérant (au plus un toutes les 10 min).
  if (out._notify) {
    try { notify_(out._notify); } catch (e) {}
    delete out._notify;
  }
  // Fermeture du dimanche : récap de la semaine et sauvegarde, après avoir libéré l'appli.
  if (out._week) {
    try { var w = weekly_(out._week, false); if (w) out.msg += ' ' + w; } catch (e) {}
    delete out._week;
  }
  if (out._month) {
    try { var mo = monthly_(out._month, false); if (mo) out.msg += ' ' + mo; } catch (e) {}
    delete out._month;
  }
  return out;
}

// v23 · Appli instantanée : la tablette met à jour l'écran tout de suite et envoie ses actions en arrière-plan,
// regroupées en un seul appel (une seule lecture et une seule écriture de l'état pour plusieurs actions).
// Chaque action garde son numéro (_op) : renvoyée après une coupure, elle n'est jamais refaite.
var BATCH_OK_ = { send: 1, done: 1, pay: 1, people: 1 };
function batch_(p, who) {
  var ops = (p.ops || []).slice(0, 25), res = [], posts = [];
  ops.forEach(function (o) { if (!o || !BATCH_OK_[o.a]) throw new Error('Action inconnue.'); });
  var lock = LockService.getScriptLock(), t0 = Date.now();
  console.log('> lot de ' + ops.length + ' (' + ops.map(function (o) { return o.a; }).join(', ') + ')' + (who.nom ? ' · ' + who.nom : ''));
  if (!lock.tryLock(20000)) throw new Error('BUSY|Google est lent en ce moment. Rien n’est perdu : réessaie dans une minute.');
  var st, changed = false;
  try {
    st = readState_();
    var data = loadData_();
    if (who.nom && !who.admin && st.soiree && !onDuty_(st, who.nom)) throw new Error('JOIN|Commence ton service pour utiliser l’appli.');
    ops.forEach(function (o) {
      var q = {}, op = String(o.op || '');
      Object.keys(o.p || {}).forEach(function (k) { q[k] = o.p[k]; });
      q._action = o.a;
      if (op && (st.ops || []).indexOf(op) >= 0) { res.push({ dup: true }); return; }
      var before = JSON.stringify(st), out;
      try {
        out = ACTIONS_[o.a](st, data, q, Date.now(), who) || {};
        if (typeof out === 'string') out = { msg: out };
      } catch (e) {
        st = JSON.parse(before);
        res.push({ err: String((e && e.message) || e) });
        return;
      }
      if (op) st.ops = (st.ops || []).concat([op]).slice(-60);
      changed = true;
      if (out._notify || out._mail || out._week) posts.push(out);
      res.push({ msg: out.msg || '', closed: !!out.closed });
    });
    if (changed) { st.rev++; writeState_(st); }
  } finally {
    lock.releaseLock();
    if (Date.now() - t0 > 4000) console.log('< lot : ' + (Date.now() - t0) + ' ms');
  }
  posts.forEach(function (out) {
    if (out._notify) { try { notify_(out._notify); } catch (e) {} }
  });
  return { state: st, results: res };
}

var ACTIONS_ = {
  // Prise de service : uniquement depuis le lounge (position du téléphone).
  // Une personne déjà en service peut aussi rejoindre la soirée ouverte.
  scanIn: function (st, data, p, now, who) {
    if (who.admin) {
      if (st.soiree) return 'Mode gérant · soirée ouverte depuis ' + hm_(st.soiree.opened) + '.';
      return openSoiree_(st, data, now, { dist: '', acc: '' }, 'Code gérant (sans contrôle de position)', 'Gérant');
    }
    if (st.soiree) {
      if (!who.nom) return 'Soirée déjà ouverte depuis ' + hm_(st.soiree.opened) + '.';
      if (onDuty_(st, who.nom)) return 'Tu es déjà en service.';
      var j = st.soiree.remote ? { dist: '', acc: '' } : checkPlace_(data, p), late = lateness_(now, data.params);
      st.soiree.team = (st.soiree.team || []).concat([{ nom: who.nom, in: now, out: null }]);
      append_('pointages', [[st.soiree.id, day_(st.soiree.opened), 'Arrivée', new Date(now), late, j.dist, j.acc, st.soiree.remote ? 'Soirée ouverte par le gérant' : 'Au lounge', who.nom]]);
      return 'Bonjour ' + who.nom + ' · service commencé à ' + hm_(now) + (late > 0 ? ' · ' + late + ' min de retard' : '');
    }
    return openSoiree_(st, data, now, checkPlace_(data, p), 'Au lounge', who.nom);
  },

  // Une personne termine son service avant la fermeture (la dernière ferme la soirée).
  leave: function (st, data, p, now, who) {
    needSoiree_(st);
    if (!who.nom) throw new Error('Action réservée aux membres de l’équipe.');
    var team = st.soiree.team || [], me = team.filter(function (x) { return x.nom === who.nom && !x.out; })[0];
    if (!me) throw new Error('Tu n’es pas en service.');
    if (team.filter(function (x) { return !x.out; }).length < 2) throw new Error('Tu es la dernière personne en service : ferme la soirée depuis l’onglet Encaissement.');
    me.out = now;
    var g = place_(data, p);
    append_('pointages', [[st.soiree.id, day_(st.soiree.opened), 'Départ', new Date(now), '', g.dist == null ? '' : g.dist, g.acc == null ? '' : g.acc,
      g.dist == null ? 'Position indisponible' : g.ok ? 'Au lounge' : 'Hors zone', who.nom]]);
    return 'Fin de service enregistrée à ' + hm_(now) + '. Bonne soirée ' + who.nom + ' !';
  },

  // Gérant : supprimer la soirée en cours ouverte par erreur ou pour un test (ventes, paiements, pointages… compris).
  soireeDel: function (st, data, p, now, who) {
    if (!who.gerant) throw new Error('Réservé au gérant.');
    needSoiree_(st);
    if (String(p.id || '') !== st.soiree.id) throw new Error('Cette soirée n’est plus en cours : recharge la page.');
    var n = purgeSoiree_(st.soiree.id), h = hm_(st.soiree.opened);
    st.soiree = null; st.tables = {}; st.tickets = [];
    return 'Soirée de ' + h + ' supprimée' + (n ? ' (' + n + ' ligne' + (n > 1 ? 's' : '') + ' effacée' + (n > 1 ? 's' : '') + ' dans le Google Sheets)' : '') + '.';
  },

  // Secours : le gérant ouvre la soirée depuis sa page, sans contrôle de position.
  openRemote: function (st, data, p, now) {
    if (st.soiree) return 'Soirée déjà ouverte depuis ' + hm_(st.soiree.opened) + '.';
    var msg = openSoiree_(st, data, now, { dist: '', acc: '' }, 'Ouverte par le gérant', 'Gérant (à distance)');
    st.soiree.remote = true; st.soiree.team = [];
    return msg;
  },


  send: function (st, data, p, now, who) {
    needSoiree_(st);
    var t = tableNum_(data, p.t), lines = cleanLines_(data, p.lines);
    var tb = st.tables[t];
    if (!tb) tb = st.tables[t] = { id: st.soiree.id + '-' + (st.seq++), opened: now, last: now, lines: [], gifts: [], payments: [], paidU: {}, split: null, pers: pers_(p.pers) };
    // Dernière chicha ou tête servie : sert à proposer une tête supplémentaire.
    (p.lines || []).forEach(function (x) {
      var a = findArt(data, x.n);
      if (a && a.cat === 'Chichas') tb.chicha = { ts: now, quasar: /quasar/i.test(a.n), gout: String((x.sel || {}).gout || '') };
    });
    lines.forEach(function (l) {
      var ex = tb.lines.filter(function (x) { return x.k === l.k; })[0];
      if (ex) ex.q += l.q; else tb.lines.push(l);
    });
    tb.last = now;
    // Nouvelle commande après le comptage : la caisse va bouger, il faudra recompter.
    var recount = !!st.soiree.count;
    if (recount) st.soiree.count = null;
    st.soiree.countTry = null;
    st.tickets.push({ id: st.seq++, t: t, ts: now, by: who.nom || '', lines: lines.map(function (l) { return { n: l.n, d: l.d, q: l.q, k: l.k }; }) });
    return 'Table ' + t + ' envoyée en préparation' + (recount ? ' · caisse à recompter avant le ménage' : '');
  },

  patron: function (st, data, p, now, who) {
    needSoiree_(st);
    var lines = cleanLines_(data, p.lines), so = st.soiree;
    var pour = p.pour === 'Rayane' ? 'Rayane' : p.pour === 'Autre' ? 'Autre' : '';
    var comment = String(p.comment || '').trim().slice(0, 300);
    if (!pour) throw new Error('Indique pour qui : Rayane ou Autre.');
    if (pour === 'Autre' && comment.length < 5) throw new Error('Pour « Autre », explique pour qui et pourquoi.');
    append_('patron', lines.map(function (l) {
      return [so.id, day_(so.opened), new Date(now), l.cat, l.n, l.d.join(' · '), l.q, l.p, r2(l.p * l.q), pour, comment, who.nom || ''];
    }));
    if (pour !== 'Autre') return 'Conso patron enregistrée · ' + pour;
    // Offert à quelqu'un d'autre : le gérant doit le valider (compté en stock dans tous les cas).
    var val = r2(lines.reduce(function (a, l) { return a + l.p * l.q; }, 0));
    var d = newDem_(st, now, { type: 'Conso offerte', by: who.nom || 'Gérant', amount: val, detail: lines.map(function (l) { return l.q + '× ' + l.n; }).join(', '), motif: 'Conso patron pour quelqu’un d’autre', pour: comment, cons: true });
    if (who.admin) { decide_(st, d, true, now); return 'Conso offerte enregistrée (code gérant).'; }
    addMsg_(st, { from: 'S', nom: who.nom || 'Service', txt: 'Conso offerte à valider : ' + d.detail + ' (' + eur_(val) + ') · ' + comment, dem: d.id, sys: true }, now);
    return { msg: 'Conso enregistrée · le gérant doit la valider.', _notify: { subj: (who.nom || 'L’équipe') + ' : conso offerte à valider (' + eur_(val) + ')', txt: comment } };
  },

  people: function (st, data, p) {
    var tb = table_(st, +p.t), n = pers_(p.n);
    if (!n) throw new Error('Nombre de personnes invalide.');
    tb.pers = n;
    return 'Table ' + p.t + ' : ' + n + ' personne' + (n > 1 ? 's' : '');
  },

  match: function (st, data, p) {
    needSoiree_(st);
    st.soiree.match = p.on ? (String(p.label || '').trim().slice(0, 60) || 'Match') : '';
    return p.on ? 'Soirée match : ' + st.soiree.match : 'Soirée normale';
  },

  done: function (st, data, p) {
    st.tickets = st.tickets.filter(function (x) { return x.id !== p.id; });
    return 'Commande servie';
  },

  // Annulation simple : article pas encore servi, envoyé il y a moins de 15 min (sinon « offrir ou annuler », validé par le gérant).
  cancel: function (st, data, p, now, who) {
    needSoiree_(st);
    var tb = table_(st, p.t);
    var l = tb.lines.filter(function (x) { return x.k === p.k; })[0];
    if (!l) throw new Error('Article introuvable sur cette table.');
    var reason = String(p.reason || '').trim();
    if (!reason) throw new Error('Choisis une raison.');
    var tk = pendingTicket_(st, p.t, p.k, p.ticketId);
    if (!(who.admin || who.gerant)) throw new Error('Pour annuler un article envoyé : bouton « Annulation » sur l’addition (à côté de Promotion), avec une explication. Le gérant valide.');
    var busyU = (tb.offs || []).filter(function (o) { return o.k === p.k; }).length;
    if (l.q - ((tb.paidU || {})[p.k] || 0) - busyU <= 0) throw new Error('Cet article est déjà payé, offert ou en attente du gérant.');
    var test = JSON.parse(JSON.stringify(tb));
    removeUnit_(test, p.k);
    if (tot(test) < paidTot(tb) - 0.001) throw new Error('Une partie est déjà payée : annulation impossible sur ce montant.');
    removeUnit_(tb, p.k);
    dropTicketUnit_(st, tk, p.k);
    var so = st.soiree;
    append_('annul', [[so.id, day_(so.opened), new Date(now), p.t, l.cat || '', l.n, l.d.join(' · '), 1, l.p, l.p, reason, who.nom || '']]);
    var closed = false;
    if (!tb.lines.length && !tb.payments.length) delete st.tables[p.t];
    else if (tb.payments.length && rest(tb) === 0) { closeTable_(st, data, p.t, now); closed = true; }
    return { msg: 'Annulé : 1× ' + l.n + ' · table ' + p.t, closed: closed };
  },

  gift: function (st, data, p, now, who) {
    needSoiree_(st);
    var tb = table_(st, p.t);
    if (tb.payments.length) throw new Error('Applique les cadeaux avant le premier paiement.');
    var g = data.fidelite.filter(function (x) { return x.palier === +p.palier; })[p.i];
    if (!g) throw new Error('Cadeau introuvable.');
    var l = giftLine(tb, g);
    if (!l) throw new Error(g.articles.length ? 'Ajoute d’abord « ' + g.n + ' » à la commande.' : 'Ce cadeau n’a pas d’article associé dans l’onglet Fidélité.');
    var name = g.articles.length > 1 ? l.n : g.n;
    tb.gifts.push({ n: name, palier: g.palier, amount: giftAmount(data, l), k: l.k, ts: now, by: who.nom || '' });
    return 'Cadeau offert : ' + name;
  },

  promo: function (st, data, p, now, who) {
    needSoiree_(st);
    var tb = table_(st, p.t), pct = Math.floor(+p.pct), motif = String(p.motif || '').trim(), pour = String(p.pour || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    if (tb.payments.length) throw new Error('Applique la promotion avant le premier paiement.');
    if ([10, 20, 30].indexOf(pct) < 0) throw new Error('Promotion de 10, 20 ou 30 % seulement.');
    if (PROMO_MOTIFS_.indexOf(motif) < 0) throw new Error('Choisis le motif de la promotion.');
    if (pour.length < 2) throw new Error('Indique pour qui (prénom, précision).');
    tb.promo = { pct: pct, motif: motif, pour: pour, by: who.nom || '', ts: now };
    return 'Promotion −' + pct + ' % · table ' + p.t + ' : −' + eur_(promoAmt(tb));
  },

  unpromo: function (st, data, p) {
    var tb = table_(st, p.t);
    if (tb.payments.length) throw new Error('Un paiement a déjà été fait sur cette table.');
    delete tb.promo;
    return 'Promotion retirée';
  },

  ungift: function (st, data, p) {
    var tb = table_(st, p.t);
    if (tb.payments.length) throw new Error('Un paiement a déjà été fait sur cette table.');
    tb.gifts.splice(+p.i, 1);
    return 'Cadeau annulé';
  },

  split: function (st, data, p) {
    var tb = table_(st, p.t), n = Math.floor(+p.n);
    if (!(n >= 2 && n <= 10)) throw new Error('Nombre de parts invalide.');
    tb.split = { n: n, done: 0 };
    return 'Addition partagée en ' + n;
  },

  pay: function (st, data, p, now, who) {
    needSoiree_(st);
    var t = +p.t, tb = table_(st, t), kind = p.kind, m = p.method, amt;
    if (kind === 'zero') {
      if (rest(tb) !== 0) throw new Error('Il reste ' + eur_(rest(tb)) + ' à payer.');
      amt = 0;
    } else if (kind === 'all') {
      amt = rest(tb);
    } else if (kind === 'items') {
      if (tb.payments.some(function (x) { return x.kind !== 'items'; })) throw new Error('Un paiement au montant a déjà été fait : utilise « Tout » ou « Parts égales ».');
      if (tb.promo || (tb.offs || []).length) throw new Error('Avec une promotion ou un article offert, encaisse en « Tout » ou en « Parts égales ».');
      var sel = p.sel || {}, us = units(tb), nb = 0;
      Object.keys(sel).forEach(function (k) {
        var u = us.filter(function (x) { return x.k === k; })[0], c = Math.floor(+sel[k]);
        if (!u || !(c >= 0) || c > u.left) throw new Error('Sélection invalide, recommence.');
        nb += c;
      });
      if (!nb) throw new Error('Sélectionne au moins un article.');
      amt = selAmount(tb, sel);
    } else if (kind === 'equal') {
      if (!tb.split) throw new Error('Choisis d’abord le nombre de parts.');
      amt = equalPart(tb);
    } else throw new Error('Mode d’addition inconnu.');

    if (amt > 0 && m !== 'CB' && m !== 'Espèces') throw new Error('Mode de paiement inconnu.');
    if (kind === 'items') Object.keys(p.sel).forEach(function (k) { tb.paidU[k] = (tb.paidU[k] || 0) + Math.floor(+p.sel[k]); });
    if (kind === 'equal') tb.split.done++;
    if (amt > 0) {
      tb.payments.push({ ts: now, method: m, amount: amt, kind: kind });
      var so = st.soiree;
      if (m === 'Espèces') so.cashN = (so.cashN || 0) + 1;
      append_('paiements', [[tb.id, so.id, day_(so.opened), new Date(now), t, m, amt, who.nom || '']]);
    }
    if (rest(tb) === 0) {
      var paid = paidTot(tb);
      closeTable_(st, data, t, now);
      return { closed: true, msg: paid ? 'Table ' + t + ' soldée · ' + eur_(paid) : 'Table ' + t + ' clôturée · 0 €, rien à encaisser' };
    }
    return 'Table ' + t + ' : ' + eur_(amt) + ' en ' + m + ' · reste ' + eur_(rest(tb));
  },

  // Après service (ou plus de 15 min après l'envoi) : offrir ou annuler un article. Il sort tout de suite de l'addition ;
  // le gérant valide ou refuse (refus : l'article revient sur l'addition si la table est encore ouverte).
  // Annulation à l'encaissement : un ou plusieurs articles, raison et explication obligatoires, toujours validée par le gérant.
  // Les articles sortent de l'addition en attendant sa réponse ; refusée, l'annulation remet les articles à payer.
  annul: function (st, data, p, now, who) {
    needSoiree_(st);
    var t = +p.t, tb = table_(st, t), sel = p.sel || {}, motif = String(p.motif || ''), expl = String(p.expl || '').trim().replace(/\s+/g, ' ').slice(0, 200);
    if (ANNUL_RAISONS_.indexOf(motif) < 0) throw new Error('Choisis la raison.');
    if (expl.length < 5) throw new Error('Explique en quelques mots ce qui s’est passé.');
    if (tb.payments.some(function (x) { return x.kind === 'items'; })) throw new Error('Des articles ont déjà été payés un par un sur cette table : appelle le gérant.');
    var picks = [], amount = 0, parts = [];
    Object.keys(sel).forEach(function (k) {
      var c = Math.floor(+sel[k]);
      if (!(c > 0)) return;
      var l = tb.lines.filter(function (x) { return x.k === k; })[0];
      if (!l) throw new Error('Article introuvable sur cette table, recharge l’écran.');
      var used = (tb.gifts || []).filter(function (g) { return g.k === k; }).length + (tb.offs || []).filter(function (o) { return o.k === k; }).length;
      if (c > l.q - used) throw new Error('Pas assez de « ' + l.n + ' » à annuler : déjà offert, en cadeau ou en attente du gérant.');
      for (var i = 0; i < c; i++) picks.push({ k: k, amount: l.p });
      amount += l.p * c;
      parts.push(c + '× ' + l.n + (l.d.length ? ' (' + l.d.join(', ') + ')' : ''));
    });
    if (!picks.length) throw new Error('Choisis l’article à annuler.');
    var test = JSON.parse(JSON.stringify(tb));
    test.offs = (test.offs || []).concat(picks);
    if (tot(test) < paidTot(tb) - 0.001) throw new Error('Une partie de l’addition est déjà payée : impossible de retirer ce montant.');
    var type = motif === ANNUL_OFFERT_ ? 'Offert' : 'Annulation', cons = OFF_NONCONSO_.indexOf(motif) < 0, boss = !!(who.admin || who.gerant);
    var d = newDem_(st, now, { type: type, by: who.nom || 'Gérant', amount: r2(amount), detail: parts.join(', ') + ' · table ' + t, motif: motif, pour: expl, t: t, cons: cons });
    tb.offs = (tb.offs || []).concat(picks.map(function (x) { return { id: d.id, k: x.k, amount: x.amount, type: type, cons: cons, ok: false }; }));
    if (type === 'Annulation') picks.forEach(function (x) { dropTicketUnit_(st, pendingTicket_(st, t, x.k), x.k); });
    if (boss) decide_(st, d, true, now);
    else addMsg_(st, { from: 'S', nom: who.nom || 'Service', txt: type + ' à valider : ' + d.detail + ' (' + eur_(d.amount) + ') · ' + motif + ' : ' + expl, dem: d.id, sys: true }, now);
    var closed = false;
    if (tb.payments.length && rest(tb) === 0) { closeTable_(st, data, t, now); closed = true; }
    return { msg: boss ? 'Fait (code gérant) : ' + d.detail : 'Envoyé au gérant · retiré de l’addition en attendant sa réponse.', closed: closed,
      _notify: boss ? null : { subj: (who.nom || 'L’équipe') + ' : ' + type.toLowerCase() + ' à valider (' + eur_(d.amount) + ')', txt: d.detail + ' · ' + motif + ' : ' + expl } };
  },

  demOff: function (st, data, p, now, who) {
    needSoiree_(st);
    var t = +p.t, tb = table_(st, t), k = String(p.k || ''), type = p.type === 'Annulation' ? 'Annulation' : 'Offert';
    var l = tb.lines.filter(function (x) { return x.k === k; })[0];
    if (!l) throw new Error('Article introuvable sur cette table.');
    var motif = String(p.motif || '').trim(), pour = String(p.pour || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    if (type === 'Offert') {
      if (PROMO_MOTIFS_.indexOf(motif) < 0) throw new Error('Choisis le motif.');
      if (pour.length < 2) throw new Error('Indique pour qui (prénom, précision).');
    } else if (OFF_RAISONS_.indexOf(motif) < 0) throw new Error('Choisis la raison.');
    if (tb.payments.some(function (x) { return x.kind === 'items'; })) throw new Error('Des articles ont déjà été payés un par un sur cette table : appelle le gérant.');
    var used = (tb.gifts || []).filter(function (g) { return g.k === k; }).length + (tb.offs || []).filter(function (o) { return o.k === k; }).length;
    if (l.q - used < 1) throw new Error('Cet article est déjà offert (cadeau fidélité ou demande en cours).');
    var test = JSON.parse(JSON.stringify(tb));
    test.offs = (test.offs || []).concat([{ k: k, amount: l.p }]);
    if (tot(test) < paidTot(tb) - 0.001) throw new Error('Une partie de l’addition est déjà payée : impossible de retirer ce montant.');
    var cons = !(type === 'Annulation' && OFF_NONCONSO_.indexOf(motif) >= 0), boss = !!(who.admin || who.gerant);
    var d = newDem_(st, now, { type: type, by: who.nom || 'Gérant', amount: l.p, detail: '1× ' + l.n + (l.d.length ? ' (' + l.d.join(', ') + ')' : '') + ' · table ' + t, motif: motif, pour: pour, t: t, cons: cons });
    tb.offs = (tb.offs || []).concat([{ id: d.id, k: k, amount: l.p, type: type, cons: cons, ok: false }]);
    if (type === 'Annulation') dropTicketUnit_(st, pendingTicket_(st, t, k, p.ticketId), k);
    if (boss) decide_(st, d, true, now);
    else addMsg_(st, { from: 'S', nom: who.nom || 'Service', txt: (type === 'Offert' ? 'Offert à valider' : 'Annulation à valider') + ' : ' + d.detail + ' (' + eur_(l.p) + ') · ' + motif + (pour ? ' : ' + pour : ''), dem: d.id, sys: true }, now);
    var closed = false;
    if (tb.payments.length && rest(tb) === 0) { closeTable_(st, data, t, now); closed = true; }
    return { msg: boss ? 'Fait (code gérant) : ' + d.detail : 'Envoyé au gérant · retiré de l’addition en attendant sa réponse.', closed: closed,
      _notify: boss ? null : { subj: (who.nom || 'L’équipe') + ' : ' + (type === 'Offert' ? 'offert' : 'annulation') + ' à valider (' + eur_(l.p) + ')', txt: d.detail + ' · ' + motif + (pour ? ' : ' + pour : '') } };
  },

  // Demande d'avance sur salaire (dans la caisse ou hors caisse) : le gérant l'accepte ou la refuse.
  avance: function (st, data, p, now, who) {
    if (!who.nom || who.admin) throw new Error('Demande réservée aux membres de l’équipe (avec leur code).');
    var amt = r2(num_(p.amount)), caisse = p.pay !== 'hors', motif = String(p.motif || '').trim().slice(0, 160);
    if (!(amt >= 1 && amt <= 2000)) throw new Error('Indique un montant entre 1 et 2 000 €.');
    var d = newDem_(st, now, { type: 'Avance', by: who.nom, amount: amt, detail: caisse ? 'À prendre dans la caisse' : 'Hors caisse (virement ou main propre)', motif: motif, pay: caisse ? 'Caisse' : 'Hors caisse' });
    addMsg_(st, { from: 'S', nom: who.nom, txt: 'Demande d’avance : ' + eur_(amt) + (caisse ? ', à prendre dans la caisse' : ', hors caisse') + (motif ? ' · ' + motif : ''), dem: d.id, sys: true }, now);
    return { msg: 'Demande d’avance envoyée au gérant.', _notify: { subj: who.nom + ' demande une avance de ' + eur_(amt), txt: motif } };
  },

  // Le gérant (ou le code gérant sur l'appli service) valide ou refuse une demande.
  demDecide: function (st, data, p, now, who) {
    if (!(who.gerant || who.admin)) throw new Error('Réservé au gérant.');
    var d = (st.dem || []).filter(function (x) { return x.id === p.id; })[0];
    if (!d) throw new Error('Demande introuvable, recharge la page.');
    if (d.status !== DEM_ATT_) return 'Demande déjà ' + d.status.toLowerCase() + '.';
    if (d.type === 'Avance' && p.ok && p.pay) d.pay = p.pay === 'hors' ? 'Hors caisse' : 'Caisse';
    decide_(st, d, !!p.ok, now);
    // Avance prise dans la caisse après le comptage : le tiroir a bougé, il faudra recompter.
    var recount = !!(p.ok && d.type === 'Avance' && d.pay === 'Caisse' && st.soiree && st.soiree.count);
    if (recount) { st.soiree.count = null; st.soiree.countTry = null; }
    return (p.ok ? 'Validé' : 'Refusé') + ' : ' + demLabel_(d) + (recount ? ' · caisse à recompter' : '');
  },

  // La personne qui a fait la demande peut la retirer tant que le gérant n'a pas répondu (et avant paiement de la table).
  demWithdraw: function (st, data, p, now, who) {
    var d = (st.dem || []).filter(function (x) { return x.id === p.id; })[0];
    if (!d || d.status !== DEM_ATT_) throw new Error('Demande introuvable ou déjà traitée.');
    if (!(who.admin || who.gerant) && d.by !== who.nom) throw new Error('Seule la personne qui a fait la demande peut la retirer.');
    if (d.type === 'Offert' || d.type === 'Annulation') {
      var tb = st.tables[d.t];
      if (!tb || !(tb.offs || []).some(function (o) { return o.id === d.id; })) throw new Error('La table est déjà encaissée : la demande reste à valider par le gérant.');
      if (tb.payments.length) throw new Error('Un paiement a déjà été fait sur cette table : la demande reste à valider par le gérant.');
      tb.offs = tb.offs.filter(function (o) { return o.id !== d.id; });
    } else if (d.type !== 'Avance') throw new Error('Cette demande reste à valider par le gérant.');
    d.status = 'Retirée'; d.dts = now;
    setDemRow_(d);
    addMsg_(st, { from: 'S', nom: who.nom || 'Service', txt: 'Demande retirée : ' + demLabel_(d), dem: d.id, sys: true }, now);
    return 'Demande retirée' + (d.type === 'Offert' || d.type === 'Annulation' ? ' : l’article est de nouveau à payer.' : '.');
  },

  // Messages entre le gérant et l'équipe (un seul fil).
  chatSend: function (st, data, p, now, who) {
    var txt = String(p.txt || '').trim().slice(0, 500), boss = !!(who.gerant || who.admin);
    if (!txt) throw new Error('Écris un message.');
    addMsg_(st, { from: boss ? 'G' : 'S', nom: boss ? 'Gérant' : who.nom || 'Service', txt: txt }, now);
    chatSeen_(st, boss, now);
    return boss ? {} : { _notify: { subj: 'Message de ' + (who.nom || 'l’équipe'), txt: txt } };
  },
  chatRead: function (st, data, p, now, who) {
    chatSeen_(st, !!(who.gerant || who.admin), now);
    return {};
  },

  menage: function (st, data, p, now, who) {
    needSoiree_(st);
    var so = st.soiree, op = String(p.op || ''), boss = !!(who.admin || who.gerant);
    var open = Object.keys(st.tables).length;
    if (op === 'start') {
      if (open) throw new Error('Encaisse d’abord toutes les tables (' + open + ' restante' + (open > 1 ? 's' : '') + ').');
      if (!so.count && !(so.cashN === 0) && !boss) throw new Error('Compte d’abord la caisse (avant le ménage).');
      if (!so.menage) so.menage = { s: [now], done: null, skip: false };
      return 'Ménage lancé : ' + MENAGE_[0] + ', 5 min.';
    }
    var m = so.menage;
    if (!m) throw new Error('Lance d’abord le ménage.');
    if (m.done) return 'Ménage déjà terminé.';
    // Un client arrive pendant le ménage : on revient au service ; le ménage devra être refait en entier.
    if (op === 'cancel') {
      so.menStops = (so.menStops || 0) + 1; so.menage = null; so.count = null; so.countTry = null;
      return 'Ménage arrêté : retour au service. Il faudra le relancer en entier avant de fermer.';
    }
    if (op === 'skip') {
      if (!boss) throw new Error('Seul le gérant peut passer le ménage.');
      m.done = now; m.skip = true;
      return 'Ménage passé (code gérant). Tu peux fermer la soirée.';
    }
    if (op === 'next') {
      var i = m.s.length - 1, left = MENAGE_MS_ - (now - m.s[i]);
      if (!boss && left > 10000) throw new Error('Encore ' + Math.ceil(left / 60000) + ' min pour : ' + MENAGE_[i] + '.');
      if (i < MENAGE_.length - 1) { m.s.push(now); return 'Étape suivante : ' + MENAGE_[i + 1] + ', 5 min.'; }
      m.done = now;
      return 'Ménage terminé. Tu peux fermer la soirée.';
    }
    throw new Error('Action inconnue.');
  },

  // Comptage de la caisse avant le ménage (Rayane, 9 nov.) : gardé jusqu'à la fermeture ; « recompter » l'efface.
  caisseCount: function (st, data, p, now, who) {
    needSoiree_(st);
    var so = st.soiree, open = Object.keys(st.tables).length;
    if (p.op === 'reset') { if (so.menage && !so.menage.done) throw new Error('Ménage en cours : termine-le ou arrête-le avant de recompter.'); so.count = null; so.countTry = null; return 'Comptage effacé : recompte la caisse.'; }
    if (open) throw new Error('Encaisse d’abord toutes les tables (' + open + ' restante' + (open > 1 ? 's' : '') + ').');
    var c = Number(String(p.counted == null ? '' : p.counted).replace(',', '.'));
    if (String(p.counted == null ? '' : p.counted).trim() === '' || !(c >= 0)) throw new Error('Compte le tiroir : billets et pièces.');
    c = r2(c);
    var tpeS = String(p.tpe == null ? '' : p.tpe).trim().replace(',', '.'), tpe = tpeS === '' ? null : Number(tpeS);
    if (tpe != null && !(tpe >= 0)) throw new Error('Total du TPE invalide.');
    // Le total ne correspond pas à la caisse attendue : on demande un second comptage, sans montrer l'attendu.
    // Le second comptage est accepté tel quel. Une erreur de comptage ne se reporte plus sur le lendemain.
    var att = null;
    try { var cs = caisseEtat_(st, now); att = cs && cs.open ? cs.open.att : null; } catch (e) { att = null; }
    var first = so.countTry;
    if (att != null && Math.abs(c - att) >= RECOUNT_SEUIL_ && !first) {
      so.countTry = { c: c, at: now };
      return { recount: true, msg: 'Recompte une fois pour confirmer : billets puis pièces.' };
    }
    var d = String(p.detail || '').slice(0, 240);
    if (first && first.c !== c) d += (d ? ' · ' : '') + '1er comptage ' + eur_(first.c);
    so.count = { c: c, d: d, by: who.nom || '', at: now, tpe: tpe == null ? null : r2(tpe), n: first ? 2 : 1 };
    so.countTry = null;
    return 'Caisse comptée : ' + eur_(so.count.c) + '. Tu peux lancer le ménage.';
  },

  invSave: function (st, data, p, now, who) {
    needSoiree_(st);
    var so = st.soiree;
    if (so.inv === 'done') return 'Inventaire déjà enregistré ce soir.';
    var list = invListe_(), items = p.items || [], got = {};
    items.forEach(function (x) { if (String(x.c == null ? '' : x.c).trim() !== '' && num_(x.c) >= 0) got[x.n] = 1; });
    var miss = list.filter(function (x) { return !got[x.n]; });
    if (miss.length) throw new Error('Il manque ' + miss.length + ' produit' + (miss.length > 1 ? 's' : '') + ' : ' + miss.slice(0, 3).map(function (x) { return x.n; }).join(', ') + (miss.length > 3 ? '…' : '') + '. Mets 0 s’il n’en reste plus.');
    var n = invRows_(items, who.nom || 'Service');
    so.inv = 'done'; so.invBy = who.nom || 'Service'; so.invAt = now;
    return 'Inventaire enregistré (' + n + ' produits). Merci' + (who.nom ? ' ' + who.nom : '') + ' !';
  },

  close: function (st, data, p, now, who) {
    needSoiree_(st);
    var open = Object.keys(st.tables).length;
    if (open) throw new Error('Encaisse d’abord toutes les tables (' + open + ' restante' + (open > 1 ? 's' : '') + ').');
    var so = st.soiree, a = aggregates_(so.id);
    if (!(who.admin || who.gerant) && !(so.menage && so.menage.done)) throw new Error('Fais d’abord le ménage de fermeture (bouton « Lancer le ménage »).');
    // Tiroir suivi d'une soirée à l'autre : ouverture = dernier comptage ± mouvements (retraits, avances…) depuis.
    var cs = null;
    try { cs = caisseEtat_(st, now); } catch (e) { cs = null; }
    var fond = cs && cs.open ? cs.open.fond : r2(so.fond || 0), mvt = cs && cs.open ? cs.open.mv : 0;
    var expected = r2(fond + a.esp + mvt);
    // Aucune espèce encaissée ce soir : le tiroir n'a pas bougé, rien à compter.
    var noCash = so.cashN === 0 && !(a.esp > 0);
    if (so.count && String(p.counted == null ? '' : p.counted).trim() === '') { p.counted = String(so.count.c); p.detail = so.count.d; }
    if (noCash && String(p.counted == null ? '' : p.counted).trim() === '') p.counted = String(expected);
    var counted = Number(String(p.counted == null ? '' : p.counted).replace(',', '.'));
    if (String(p.counted).trim() === '' || !(counted >= 0)) throw new Error('Saisis le montant compté dans le tiroir.');
    counted = r2(counted);
    var ecart = r2(counted - expected);
    var team = so.team || [], names = [];
    team.forEach(function (x) { if (names.indexOf(x.nom) < 0) names.push(x.nom); });
    append_('soirees', [[so.id, day_(so.opened), new Date(so.opened), new Date(now), so.late, a.ca, a.cb, a.esp, a.nb, a.nb ? r2(a.ca / a.nb) : 0,
      fond, expected, counted, ecart, a.gifts, a.patron, a.annul, String(p.comment || '').trim().slice(0, 1000), names.join(', '), who.nom || '', a.pers || '', so.match || '', noCash ? NOCASH_ : String(p.detail || '').slice(0, 300),
      so.inv === 'done' ? 'Fait par ' + (so.invBy || '?') + ' à ' + hm_(so.invAt) : so.inv === 'due' ? 'Non fait' : '',
      !so.menage ? 'Non fait' : so.menage.skip ? 'Passé avec le code gérant' + (so.menage.s.length ? ' (' + hm_(so.menage.s[0]) + ' → ' + hm_(so.menage.done) + ')' : '') : 'Fait · ' + hm_(so.menage.s[0]) + ' → ' + hm_(so.menage.done) + ' (' + Math.round((so.menage.done - so.menage.s[0]) / 60000) + ' min)' + (so.menStops ? ' · arrêté ' + so.menStops + ' fois pour un client' : ''),
      so.count && so.count.tpe != null ? so.count.tpe : '']]);
    var g = place_(data, p), statut = who.admin ? 'Code gérant' : g.dist == null ? 'Position indisponible' : g.ok ? 'Au lounge' : 'Hors zone';
    var dep = [[so.id, day_(so.opened), 'Départ', new Date(now), '', g.dist == null ? '' : g.dist, g.acc == null ? '' : g.acc, statut, who.nom || '']];
    team.forEach(function (x) {
      if (x.out || x.nom === who.nom) return;
      x.out = now;
      dep.push([so.id, day_(so.opened), 'Départ', new Date(now), '', '', '', 'Fermeture de la soirée', x.nom]);
    });
    append_('pointages', dep);
    var fb = [so, now, a, counted, expected, ecart, String(p.comment || '').trim(), names];
    st.soiree = null; st.tables = {}; st.tickets = [];
    var res = { msg: 'Soirée fermée à ' + hm_(now) + '.' };
    if (data.params.email) res._mail = { id: so.id, fb: fb };
    var wk = dueWeek_(so.opened);
    if (wk) res._week = wk;
    try { var mo = dueMonth_(so.opened); if (mo) res._month = mo; } catch (e) {}
    return res;
  }
};

// Retire une unité d'un article, et le cadeau associé s'il n'y a plus d'unité à offrir.
function removeUnit_(tb, k) {
  var l = tb.lines.filter(function (x) { return x.k === k; })[0];
  l.q--;
  if (!l.q) tb.lines = tb.lines.filter(function (x) { return x !== l; });
  while (tb.gifts.filter(function (g) { return g.k === k; }).length > l.q) {
    for (var i = tb.gifts.length - 1; i >= 0; i--) if (tb.gifts[i].k === k) { tb.gifts.splice(i, 1); break; }
  }
}

// Efface d'un coup toutes les lignes d'une soirée (onglet par onglet, du bas vers le haut).
var SOIREE_COL_ = { soirees: 0, ventes: 1, lignes: 1, paiements: 1, cadeaux: 1, annul: 0, patron: 0, pointages: 0, promos: 1, demandes: 8 };
function purgeSoiree_(id) {
  if (!id) return 0;
  var n = 0;
  Object.keys(SOIREE_COL_).forEach(function (key) {
    var col = SOIREE_COL_[key], rows;
    try { rows = rows_(key); } catch (e) { return; }
    var sh = sheet_(key);
    for (var i = rows.length - 1; i >= 0; i--) if (String(rows[i][col]) === id) { sh.deleteRow(i + 2); n++; }
  });
  return n;
}
// À lancer depuis l'éditeur Apps Script (ou le menu) : supprime la soirée en cours si elle a été ouverte pour un test.
function supprimerSoireeEnCours() {
  editeurSeul_(); // commande à table : appelable depuis le web, réservé à l'éditeur (CommandeTable.gs)
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var st = readState_();
    if (!st.soiree) { console.log('Aucune soirée en cours.'); return 'Aucune soirée en cours.'; }
    // Garde-fou : le service commence à 17 h ; une soirée ouverte après 16 h n'est pas supprimée d'ici.
    if (+Utilities.formatDate(new Date(st.soiree.opened), TZ, 'H') >= 16) { console.log('Soirée ouverte à ' + hm_(st.soiree.opened) + ' : non supprimée.'); return 'Non supprimée (ouverte après 16 h).'; }
    var id = st.soiree.id, n = purgeSoiree_(id);
    st.soiree = null; st.tables = {}; st.tickets = []; st.rev++;
    writeState_(st);
    var msg = 'Soirée ' + id + ' supprimée · ' + n + ' ligne(s) effacée(s).';
    console.log(msg); return msg;
  } finally { lock.releaseLock(); rcInvalidateAll_(); }
}

function openSoiree_(st, data, now, g, statut, nom) {
  var late = /^Gérant/.test(nom || '') ? 0 : lateness_(now, data.params), fond = data.params.fond;
  try { fond = caisseEtat_(null, now).solde; } catch (e) {}
  st.soiree = { id: 'S' + Utilities.formatDate(new Date(now), TZ, 'yyyyMMdd-HHmmss'), opened: now, fond: fond, late: late, cashN: 0,
    team: nom && !/^Gérant/.test(nom) ? [{ nom: nom, in: now, out: null }] : [] };
  st.tables = {}; st.tickets = [];
  if (invDue_(now)) st.soiree.inv = 'due';
  append_('pointages', [[st.soiree.id, day_(now), 'Arrivée', new Date(now), late, g.dist, g.acc, statut, nom || '']]);
  return (nom && !/^Gérant/.test(nom) ? 'Bonjour ' + nom + ' · prise' : 'Prise') + ' de service à ' + hm_(now) + (late > 0 ? ' · ' + late + ' min de retard' : '');
}

// Contrôle de position pour commencer un service.
function checkPlace_(data, p) {
  var g = place_(data, p);
  if (g.dist == null) throw new Error('Localisation indisponible. Autorise la position pour l’appli, puis réessaie.');
  if (g.acc > 1000) throw new Error('Position trop imprécise (' + g.acc + ' m). Active la position précise et réessaie près d’une fenêtre.');
  if (!g.ok) throw new Error('Tu es à ' + fmtDist_(g.dist) + ' du lounge. La prise de service se fait sur place.');
  return g;
}

// Distance entre le téléphone et le lounge. La précision GPS est retenue jusqu'à 100 m en faveur du service.
function place_(data, p) {
  var lat = +p.lat, lng = +p.lng, acc = Math.round(+p.acc || 0);
  if (!p || p.lat == null || isNaN(lat) || isNaN(lng)) return { dist: null, acc: null, ok: false };
  var pos = data.params.pos, R = 6371000, rad = Math.PI / 180;
  var dLat = (lat - pos.lat) * rad, dLng = (lng - pos.lng) * rad;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(pos.lat * rad) * Math.cos(lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var dist = Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  return { dist: dist, acc: acc, ok: dist - Math.min(acc, 100) <= data.params.rayon };
}
function fmtDist_(m) { return m >= 1000 ? (Math.round(m / 100) / 10).toString().replace('.', ',') + ' km' : m + ' m'; }

function closeTable_(st, data, t, now) {
  var tb = st.tables[t], so = st.soiree, d = day_(so.opened);
  var modes = [];
  tb.payments.forEach(function (x) { if (modes.indexOf(x.method) < 0) modes.push(x.method); });
  append_('ventes', [[tb.id, so.id, d, t, new Date(tb.opened), new Date(now), gross(tb), giftTot(tb), paidTot(tb), modes.join(' + ') || 'Offert', tb.pers || '', promoAmt(tb) || '', offTot(tb) || '']]);
  if (tb.promo) {
    var avant = r2(Math.max(0, gross(tb) - giftTot(tb) - offTot(tb)));
    append_('promos', [[tb.id, so.id, d, new Date(tb.promo.ts || now), t, tb.promo.pct, avant, promoAmt(tb), tb.promo.motif, tb.promo.pour, tb.promo.by || '', '']]);
  }
  // Un article annulé « pas préparé » ou « erreur de commande » ne sort pas du stock ; offert ou raté, si.
  append_('lignes', tb.lines.map(function (l) {
    var q = l.q - (tb.offs || []).filter(function (o) { return o.k === l.k && o.cons === false; }).length;
    return q > 0 ? [tb.id, so.id, d, new Date(now), t, l.cat || '', l.n, l.d.join(' · '), q, l.p, r2(l.p * q)] : null;
  }).filter(function (x) { return x; }));
  append_('cadeaux', tb.gifts.map(function (g) {
    var l = tb.lines.filter(function (x) { return x.k === g.k; })[0];
    return [tb.id, so.id, d, new Date(g.ts || now), t, g.palier, g.n, l ? l.n : g.n, g.amount, g.by || ''];
  }));
  st.tickets = st.tickets.filter(function (x) { return x.t !== t; });
  delete st.tables[t];
}

// Supprime une soirée (ex. une soirée de test) de tous les onglets de données.
// Si c'est la soirée en cours, elle est fermée sans récap.
var SOIREE_COL = { soirees: 0, ventes: 1, lignes: 1, paiements: 1, cadeaux: 1, annul: 0, patron: 0, pointages: 0, promos: 1, demandes: 8 };
function deleteSoiree_(id) {
  if (!/^S\d{8}-\d{4,6}$/.test(id)) throw new Error('Soirée introuvable.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    Object.keys(SOIREE_COL).forEach(function (key) {
      var sh = sheet_(key), rows = rows_(key), col = SOIREE_COL[key];
      var keep = rows.filter(function (r) { return r[col] !== id; });
      if (keep.length === rows.length) return;
      sh.getRange(2, 1, rows.length, HEAD[key].length).clearContent();
      if (keep.length) sh.getRange(2, 1, keep.length, HEAD[key].length).setValues(keep);
    });
    var st = readState_();
    if (st.soiree && st.soiree.id === id) {
      st.soiree = null; st.tables = {}; st.tickets = []; st.rev++;
      writeState_(st);
    }
    try { caisseRecalc_(); } catch (e) {}
  } finally { lock.releaseLock(); }
}


// ---------- v23 · Appli d'analyses (lecture seule) ----------
// Données brutes compactes des 400 derniers jours : l'appli calcule elle-même, d'où des filtres instantanés.
function analyses_() {
  var since = Date.now() - 400 * 86400000, num = function (v) { return Math.round((+v || 0) * 100) / 100; };
  var S = function (v) { return String(v == null ? '' : v); };
  var soirees = rows_('soirees').filter(function (r) { return r[0] && ms_(r[2]) > since; }).map(function (r) {
    return [S(r[0]), ms_(r[2]), ms_(r[3]), num(r[5]), num(r[6]), num(r[7]), +r[8] || 0, r[13] === '' ? null : num(r[13]), num(r[14]), num(r[15]), num(r[16]), +r[20] || 0, S(r[21]), +r[4] || 0, r[25] === '' ? null : num(r[25])];
  });
  var ids = {}; soirees.forEach(function (x) { ids[x[0]] = 1; });
  var lignes = rows_('lignes').filter(function (r) { return ids[S(r[1])]; }).map(function (r) {
    return [S(r[1]), ms_(r[3]), +r[4] || 0, S(r[5]), S(r[6]), S(r[7]), +r[8] || 0, num(r[10])];
  });
  var ventes = rows_('ventes').filter(function (r) { return ids[S(r[1])]; }).map(function (r) {
    return [S(r[1]), +r[3] || 0, ms_(r[4]), ms_(r[5]), num(r[6]), num(r[8]), +r[10] || 0, num(r[11]), num(r[12]), num(r[7])];
  });
  var annul = rows_('annul').filter(function (r) { return ids[S(r[0])]; }).map(function (r) {
    return [S(r[0]), ms_(r[2]), S(r[5]), +r[7] || 0, num(r[9]), S(r[10]), S(r[11])];
  });
  var pointages = rows_('pointages').filter(function (r) { return ids[S(r[0])]; }).map(function (r) {
    return [S(r[0]), S(r[2]), ms_(r[3]), +r[4] || 0, S(r[8])];
  });
  var couts = {};
  try { margesInfo_().forEach(function (m) { if (!m.inconnu.length && m.cout > 0) couts[m.n] = m.cout; }); } catch (e) {}
  var data = loadData_(), groupes = {};
  Object.keys(data.options || {}).forEach(function (g) { (data.options[g].choices || []).forEach(function (c) { if (!groupes[c.n]) groupes[c.n] = data.options[g].label || g; }); });
  var pm = paramsMap_();
  return {
    now: Date.now(), soirees: soirees, lignes: lignes, ventes: ventes, annul: annul, pointages: pointages, couts: couts, groupes: groupes,
    carte: data.carte.filter(function (x) { return x.actif; }).map(function (x) { return [x.cat, x.n, x.p]; }),
    obj: { mois: num(pm[P_OBJ_MOIS]), soir: num(pm[P_OBJ_SOIR]), panier: num(pm[P_OBJ_PAN]), charges: num(pm[P_CHARGES]) }
  };
}

// ---------- Promotions exceptionnelles ----------

function promoRows_() {
  var out = [];
  try { out = rows_('promos'); } catch (e) { out = []; }
  return out.map(function (r, i) {
    return { row: i + 2, v: String(r[0]), sid: String(r[1]), date: ms_(r[2]), ts: ms_(r[3]), t: r[4], pct: +r[5] || 0, avant: +r[6] || 0, a: +r[7] || 0,
      motif: String(r[8] || ''), pour: String(r[9] || ''), by: String(r[10] || ''), ack: ms_(r[11]) };
  }).filter(function (x) { return x.v; });
}
// Le gérant note chaque promotion « prise en compte » ; sinon le compte rendu suivant le rappelle.
function promoAck_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_('promos'), list = promoRows_().filter(function (x) { return !x.ack; }), now = new Date();
    if (!p.all) {
      list = list.filter(function (x) { return x.row === Math.floor(+p.row) && x.ts === +p.ts; });
      if (!list.length) throw new Error('Promotion introuvable ou déjà prise en compte, recharge la page.');
    }
    list.forEach(function (x) { sh.getRange(x.row, 12).setValue(now); });
  } finally { lock.releaseLock(); }
}

// ---------- Messages et demandes à valider (avances, offerts, annulations après service, conso offertes) ----------

var DEM_ATT_ = 'En attente';
var OFF_RAISONS_ = ['Produit raté', 'Client mécontent', 'Pas préparé (rupture, oubli)', 'Erreur de commande'];
var OFF_NONCONSO_ = ['Pas préparé (rupture, oubli)', 'Erreur de commande'];
var CANCEL_FREE_MS_ = 15 * 60000, MSG_MAX_ = 60;
// Annulation à l'encaissement (bouton à côté de Promotion) : une raison et une explication, toujours validées par le gérant.
var ANNUL_OFFERT_ = 'Offert (geste, ami…)', ANNUL_PARTI_ = 'Client parti sans payer', ANNUL_RAISONS_ = ['Erreur de commande', 'Pas préparé (rupture, oubli)', 'Produit raté', 'Client mécontent', ANNUL_PARTI_, ANNUL_OFFERT_];
var RECOUNT_SEUIL_ = 2;
var CODE_V_ = 35; // v35 · commande à table

function chat_(st) { return st.chat || (st.chat = { msgs: [], seenG: 0, seenS: 0 }); }
// Message du fil : gardé dans l'état (affichage en direct), archivé dans l'onglet Messages.
function addMsg_(st, m, now) {
  var c = chat_(st);
  m.id = 'M' + (st.seq++); m.ts = now;
  c.msgs.push(m);
  if (c.msgs.length > MSG_MAX_) c.msgs = c.msgs.slice(-MSG_MAX_);
  try { append_('messages', [[new Date(now), m.from === 'G' ? 'Gérant' : m.nom, m.txt]]); } catch (e) {}
  return m;
}
function chatSeen_(st, boss, now) { var c = chat_(st); if (boss) c.seenG = now; else c.seenS = now; }
function unread_(st, boss) {
  var c = st && st.chat;
  if (!c) return 0;
  var seen = (boss ? c.seenG : c.seenS) || 0, from = boss ? 'S' : 'G';
  return c.msgs.filter(function (m) { return m.from === from && m.ts > seen; }).length;
}
function demLabel_(d) {
  return d.type === 'Avance' ? 'avance de ' + eur_(d.amount) + ' pour ' + d.by : d.type.toLowerCase() + ' ' + d.detail + ' (' + eur_(d.amount) + ')';
}
function newDem_(st, now, o) {
  o.id = 'D' + now.toString(36).toUpperCase() + (st.seq++);
  o.ts = now; o.status = DEM_ATT_; o.sid = o.sid || (st.soiree ? st.soiree.id : '');
  st.dem = (st.dem || []).filter(function (x) { return x.status === DEM_ATT_ || now - (x.dts || x.ts) < 3 * 86400000; }).concat([o]);
  append_('demandes', [[o.id, new Date(now), o.type, o.by, o.amount, o.detail || '', o.motif || '', o.pour || '', o.sid, o.t == null ? '' : o.t, o.status, '', o.pay || '', o.cons == null ? '' : o.cons ? 'Oui' : 'Non']]);
  return o;
}
function demRows_() {
  var out = [];
  try { out = rows_('demandes'); } catch (e) { out = []; }
  return out.map(function (r, i) {
    return { row: i + 2, id: String(r[0] || ''), ts: ms_(r[1]), type: String(r[2] || ''), by: String(r[3] || ''), amount: r2(num_(r[4])), detail: String(r[5] || ''), motif: String(r[6] || ''),
      pour: String(r[7] || ''), sid: String(r[8] || ''), t: r[9], status: String(r[10] || ''), dts: ms_(r[11]), pay: String(r[12] || ''), cons: String(r[13] || '') !== 'Non' };
  }).filter(function (x) { return x.id; });
}
function setDemRow_(d) {
  var x = demRows_().filter(function (y) { return y.id === d.id; })[0];
  if (x) sheet_('demandes').getRange(x.row, 11, 1, 3).setValues([[d.status, d.dts ? new Date(d.dts) : '', d.pay || '']]);
}
// Décision du gérant. Avance acceptée « dans la caisse » : sortie du tiroir. Offert refusé : l'article revient sur l'addition si la table est ouverte.
function decide_(st, d, ok, now) {
  d.status = ok ? 'Validée' : 'Refusée'; d.dts = now;
  var tb = d.t === '' || d.t == null ? null : st.tables[d.t];
  var inT = !!(tb && (tb.offs || []).some(function (o) { return o.id === d.id; })), txt;
  if (!ok && d.type !== 'Avance' && d.type !== 'Conso offerte' && !inT && d.t !== '' && d.t != null) d.pay = 'Après encaissement';
  setDemRow_(d);
  if (d.type === 'Avance') {
    if (ok && d.pay === 'Caisse') append_('caisse', [[new Date(now), 'Avance', -d.amount, 'Avance ' + d.by, 'Gérant', new Date(now)]]);
    txt = ok ? 'Avance de ' + eur_(d.amount) + ' acceptée' + (d.pay === 'Caisse' ? ' : ' + d.by + ', prends ' + eur_(d.amount) + ' dans la caisse.' : ' (hors caisse).') : 'Avance de ' + eur_(d.amount) + ' refusée.';
  } else {
    if (inT) {
      if (ok) tb.offs.forEach(function (o) { if (o.id === d.id) o.ok = true; });
      else tb.offs = tb.offs.filter(function (o) { return o.id !== d.id; });
    }
    txt = (ok ? 'Validé : ' : 'Refusé : ') + demLabel_(d) + (ok ? '.' : inT ? ' : remis sur l’addition, à encaisser.' : d.t !== '' && d.t != null ? ' : la table est déjà encaissée, on en reparle.' : '.');
  }
  addMsg_(st, { from: 'G', nom: 'Gérant', txt: txt, dem: d.id, sys: true }, now);
}
// Ticket « À préparer » contenant l'article (celui indiqué, sinon le plus récent).
function pendingTicket_(st, t, k, id) {
  var list = st.tickets.filter(function (x) { return x.t === +t && x.lines.some(function (y) { return y.k === k && y.q > 0; }); });
  return list.filter(function (x) { return x.id === id; })[0] || list.sort(function (a, b) { return b.ts - a.ts; })[0] || null;
}
function dropTicketUnit_(st, tk, k) {
  if (!tk) return;
  var tl = tk.lines.filter(function (y) { return y.k === k; })[0];
  if (tl) tl.q--;
  tk.lines = tk.lines.filter(function (y) { return y.q > 0; });
  if (!tk.lines.length) st.tickets = st.tickets.filter(function (x) { return x !== tk; });
}
// Mail au gérant (demande ou message de l'équipe), au plus un toutes les 10 minutes. Aucun lien dans le mail.
function notify_(n) {
  var pm = paramsMap_(), to = String(pm[P_EMAIL] || '').trim();
  if (!to || /^(non|no|0|false|faux)$/i.test(String(pm[P_ALERTES] == null ? 'oui' : pm[P_ALERTES]).trim())) return;
  var pr = props_(), now = Date.now(), st = readState_();
  if (now - (+pr.getProperty('NOTIF_TS') || 0) < 10 * 60000) return;
  // Le gérant lit le fil en ce moment : pas besoin de mail.
  if (st.chat && now - (st.chat.seenG || 0) < 3 * 60000) return;
  pr.setProperty('NOTIF_TS', String(now));
  var pend = (st.dem || []).filter(function (x) { return x.status === DEM_ATT_; }), un = unread_(st, true);
  var body = [n.subj + (n.txt ? ' : « ' + n.txt + ' »' : ''), '',
    pend.length ? pend.length + ' demande' + (pend.length > 1 ? 's' : '') + ' à valider : ' + pend.map(function (d) { return d.type.toLowerCase() + ' ' + eur_(d.amount) + ' (' + d.by + ')'; }).join(', ') + '.' : '',
    un ? un + ' message' + (un > 1 ? 's' : '') + ' non lu' + (un > 1 ? 's' : '') + '.' : '', '',
    'Réponds depuis ta page gérant : bloc « À faire » de l’onglet Récap, ou Messages.'].filter(function (l, i, a) { return l !== '' || (i > 0 && a[i - 1] !== ''); }).join('\n');
  try { MailApp.sendEmail({ to: to, subject: 'YÄYA · ' + n.subj, body: body, name: 'YÄYA Lounge' }); } catch (e) {}
}

// Le tiroir a bougé après le comptage du soir (retrait, ajout, sortie) : le comptage est effacé.
function dropCount_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return false;
  try {
    var st = readState_();
    if (!st.soiree || !(st.soiree.count || st.soiree.countTry)) return false;
    st.soiree.count = null; st.soiree.countTry = null; st.rev++;
    writeState_(st);
    return true;
  } finally { lock.releaseLock(); }
}

// ---------- Caisse : le tiroir suivi d'une soirée à l'autre ----------
// Le tiroir n'est pas vidé chaque soir. Ouverture = dernier comptage ± mouvements depuis (retraits du gérant,
// ajouts de monnaie, avances prises dans la caisse, sorties). Attendu = ouverture + espèces encaissées ± mouvements
// pendant la soirée. Écart = compté − attendu. Tout se recalcule quand un mouvement est saisi ou supprimé.
var NOCASH_ = 'Aucune espèce encaissée';
function caisseMoves_() {
  var out = [];
  try { out = rows_('caisse'); } catch (e) { out = []; }
  return out.map(function (r, i) { return { row: i + 2, ts: ms_(r[0]), type: String(r[1] || ''), amt: r2(num_(r[2])), motif: String(r[3] || ''), by: String(r[4] || ''), saisi: ms_(r[5]) }; })
    .filter(function (x) { return x.ts && x.amt; }).sort(function (a, b) { return a.ts - b.ts; });
}
function caisseRecalc_() {
  var rows = rows_('soirees'), moves = caisseMoves_(), esp = {}, wrote = false;
  rows_('paiements').forEach(function (r) { if (r[5] === 'Espèces') esp[r[1]] = r2((esp[r[1]] || 0) + (+r[6] || 0)); });
  var sum = function (a, b) { return r2(moves.filter(function (m) { return m.ts > a && m.ts <= b; }).reduce(function (s, m) { return s + m.amt; }, 0)); };
  var list = rows.map(function (r, i) { return { i: i, r: r, op: ms_(r[2]), cl: ms_(r[3]) }; }).filter(function (x) { return x.r[0] && x.op && x.cl; }).sort(function (a, b) { return a.cl - b.cl; });
  var C = null, prev = 0;
  list.forEach(function (x) {
    var r = x.r, fond = C == null ? r2(num_(r[10])) : r2(C + sum(prev, x.op)), e = r2(esp[r[0]] || 0), att = r2(fond + e + sum(x.op, x.cl));
    var cpt = String(r[22] || '') === NOCASH_ ? att : r2(num_(r[12])), ec = r2(cpt - att);
    if (r2(num_(r[10])) !== fond || r2(num_(r[11])) !== att || r2(num_(r[12])) !== cpt || r2(num_(r[13])) !== ec) { rawSheet_('soirees').getRange(x.i + 2, 11, 1, 4).setValues([[fond, att, cpt, ec]]); rcDirty_('soirees'); wrote = true; }
    C = cpt; prev = x.cl;
  });
  if (wrote) delete ROWS_.soirees;
  return { C: C, prev: prev, moves: moves, sum: sum };
}
// Ce que contient le tiroir maintenant (et, soirée ouverte : ouverture, espèces et mouvements de la soirée).
function caisseEtat_(st, now, R) {
  now = now || Date.now(); R = R || caisseRecalc_();
  var base = R.C == null ? r2(num_(paramsMap_()[P_FOND])) : R.C, so = st && st.soiree, out = { last: R.C, lastTs: R.prev || null };
  if (so) {
    var fond = r2(base + R.sum(R.prev, so.opened)), e = aggregates_(so.id).esp, mv = R.sum(so.opened, now);
    out.open = { fond: fond, esp: e, mv: mv, att: r2(fond + e + mv) };
    out.solde = out.open.att;
  } else out.solde = r2(base + R.sum(R.prev, now));
  out.since = R.prev ? R.sum(R.prev, now) : 0;
  return out;
}
function caisseInfo_() {
  var st = readState_(), R = caisseRecalc_(), E = caisseEtat_(st, Date.now(), R), pm = paramsMap_();
  var soi = rows_('soirees').filter(function (r) { return r[0] && ms_(r[3]); }).sort(function (a, b) { return ms_(b[3]) - ms_(a[3]); }).slice(0, 12).map(function (r) {
    return { id: r[0], opened: ms_(r[2]), ts: ms_(r[3]), esp: r2(num_(r[7])), fond: r2(num_(r[10])), att: r2(num_(r[11])), cpt: r2(num_(r[12])), ec: r2(num_(r[13])), noCash: String(r[22] || '') === NOCASH_, by: String(r[19] || ''),
      cb: r2(num_(r[6])), tpe: r[25] === '' || r[25] == null ? null : r2(num_(r[25])), twice: /1er comptage/.test(String(r[22] || '')) };
  });
  var cur = ym_(new Date()), av = {};
  demRows_().forEach(function (d) { if (d.type === 'Avance' && d.status === 'Validée' && ym_(d.dts || d.ts) === cur) av[d.by] = r2((av[d.by] || 0) + d.amount); });
  // Fiabilité de la caisse sur les 30 dernières soirées comptées.
  var cnt = rows_('soirees').filter(function (r) { return r[0] && ms_(r[3]) && String(r[22] || '') !== NOCASH_; }).sort(function (a, b) { return ms_(b[3]) - ms_(a[3]); }).slice(0, 30);
  var ecs = cnt.map(function (r) { return r2(num_(r[13])); }), abs = ecs.map(Math.abs);
  var kpi = { n: cnt.length, cumul: r2(ecs.reduce(function (a, b) { return a + b; }, 0)), justes: abs.filter(function (v) { return v < 1; }).length,
    moy: cnt.length ? r2(abs.reduce(function (a, b) { return a + b; }, 0) / cnt.length) : 0, max: abs.length ? Math.max.apply(null, abs) : 0 };
  return { solde: E.solde, open: E.open || null, last: E.last, lastTs: E.lastTs, since: E.since, fond: r2(num_(pm[P_FOND])), seuil: num_(pm[P_SEUIL_ESP]) || 200,
    soirees: soi, moves: R.moves.slice(-40).reverse(), avances: av, month: cur, kpi: kpi };
}
var CAISSE_TYPES_ = { retrait: ['Retrait gérant', -1], ajout: ['Ajout de monnaie', 1], sortie: ['Sortie (payé avec la caisse)', -1] };
function caisseMove_(p) {
  var kind = String(p.kind || ''), amt = r2(num_(p.amount)), motif = String(p.motif || '').trim().slice(0, 160), T = CAISSE_TYPES_[kind];
  if (!T) throw new Error('Mouvement inconnu.');
  if (!(amt > 0 && amt <= 20000)) throw new Error('Indique le montant.');
  if (kind === 'sortie' && motif.length < 3) throw new Error('Indique ce qui a été payé avec la caisse.');
  var now = Date.now(), today = ymd_(now), day = String(p.date || today).slice(0, 10), ts = now;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Date invalide.');
  if (day > today) throw new Error('La date est dans le futur.');
  if (day < addDays_(today, -60)) throw new Error('Date trop ancienne (60 jours au plus).');
  // Un autre jour : midi, entre la fermeture de la nuit et l'ouverture du soir.
  if (day !== today) ts = Utilities.parseDate(day, TZ, 'yyyy-MM-dd').getTime() + 12 * 3600000;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { append_('caisse', [[new Date(ts), T[0], T[1] * amt, motif, 'Gérant', new Date(now)]]); caisseRecalc_(); } finally { lock.releaseLock(); }
  return T[0] + ' enregistré : ' + eur_(amt) + '.';
}
function caisseDel_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var x = caisseMoves_().filter(function (m) { return m.row === Math.floor(+p.row) && m.ts === +p.ts; })[0];
    if (!x) throw new Error('Mouvement introuvable, recharge la page.');
    sheet_('caisse').deleteRow(x.row);
    caisseRecalc_();
  } finally { lock.releaseLock(); }
  return 'Mouvement supprimé : les écarts sont recalculés.';
}
function setParam_(name, v, expl) {
  var sh = sheet_('params'), i = -1;
  rows_('params').forEach(function (r, j) { if (String(r[0]).trim() === name) i = j; });
  if (i >= 0) sh.getRange(i + 2, 2).setValue(v);
  else sh.getRange(sh.getLastRow() + 1, 1, 1, 3).setValues([[name, v, expl || '']]);
}
function caisseParams_(p) {
  var f = String(p.fond == null ? '' : p.fond).trim().replace(',', '.'), s2 = String(p.seuil == null ? '' : p.seuil).trim().replace(',', '.');
  if (f !== '' && !(+f >= 0 && +f <= 5000)) throw new Error('Fond de caisse invalide.');
  if (s2 !== '' && !(+s2 >= 0 && +s2 <= 100000)) throw new Error('Seuil d’alerte invalide.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (f !== '') setParam_(P_FOND, String(r2(+f)));
    if (s2 !== '') setParam_(P_SEUIL_ESP, String(r2(+s2)));
  } finally { lock.releaseLock(); LD_ = null; CacheService.getScriptCache().remove('data'); }
  return 'Réglages de la caisse enregistrés.';
}

// ---------- Récap gérant ----------

function aggregates_(id) {
  var pays = rowsWhere_('paiements', 1, id), ventes = rowsWhere_('ventes', 1, id);
  var ca = 0, cb = 0;
  pays.forEach(function (r) { ca += +r[6] || 0; if (r[5] === 'CB') cb += +r[6] || 0; });
  var sum = function (rows, col) { return r2(rows.reduce(function (a, r) { return a + (+r[col] || 0); }, 0)); };
  return {
    ca: r2(ca), cb: r2(cb), esp: r2(ca - cb),
    nb: ventes.filter(function (r) { return +r[8] > 0; }).length,
    pers: ventes.reduce(function (s, r) { return s + (+r[10] || 0); }, 0),
    gifts: sum(rowsWhere_('cadeaux', 1, id), 8),
    patron: sum(rowsWhere_('patron', 0, id), 8),
    annul: sum(rowsWhere_('annul', 0, id), 9),
    promo: r2(promoRows_().filter(function (x) { return x.sid === id; }).reduce(function (s, x) { return s + x.a; }, 0))
  };
}

function recap_(id, lite) {
  var st = readState_(), soirees = rows_('soirees');
  if (!id) id = st.soiree ? st.soiree.id : (soirees.length ? soirees[soirees.length - 1][0] : '');
  var cur = !!(st.soiree && st.soiree.id === id), info = null;
  // Soirée passée demandée « allégée » : l'état de la caisse, les courses et l'objectif du jour viennent du récap courant.
  if (cur) lite = false;
  var CR = null;
  if (!lite) { try { CR = caisseRecalc_(); } catch (e) { CR = null; } }
  if (cur) info = { id: id, opened: st.soiree.opened, closed: null, late: st.soiree.late, fond: st.soiree.fond || 0, counted: null, match: st.soiree.match || '' };
  else {
    var row = soirees.filter(function (r) { return r[0] === id; })[0];
    if (row) info = { id: id, opened: ms_(row[2]), closed: ms_(row[3]), late: +row[4] || 0, fond: +row[10] || 0, counted: +row[12], expected: +row[11], ecart: +row[13], comment: String(row[17] || ''), closer: String(row[19] || ''), match: String(row[21] || ''),
      noCash: String(row[22] || '') === NOCASH_, inv: String(row[23] || ''), menage: String(row[24] || ''), esp: +row[7] || 0, cb: +row[6] || 0,
      tpe: row[25] === '' || row[25] == null ? null : +row[25], detail: String(row[22] || '') };
  }
  // Caisse : état du tiroir maintenant (alerte au-dessus du seuil) et, soirée en cours, ouverture et mouvements.
  var cE = null, pm = paramsMap_();
  if (!lite) { try { if (CR) cE = caisseEtat_(st, Date.now(), CR); } catch (e) { cE = null; } }
  if (info && cur && cE && cE.open) { info.fond = cE.open.fond; info.mv = cE.open.mv; }
  if (info && !cur) info.mv = r2(info.expected - info.fond - info.esp);
  var mat = null;
  if (info && !cur) { try { mat = matCost_(matCtx_(), linesBetween_('', '', id)); } catch (e) { mat = null; } }
  var lignes = rowsWhere_('lignes', 1, id), cad = rowsWhere_('cadeaux', 1, id), pays = rowsWhere_('paiements', 1, id);
  var ventes = rowsWhere_('ventes', 1, id).map(function (r) {
    return {
      v: r[0], t: r[3], ts: ms_(r[5]), gross: +r[6], remise: +r[7], enc: +r[8], modes: r[9], pers: +r[10] || 0,
      lines: lignes.filter(function (l) { return l[0] === r[0]; }).map(function (l) { return { n: l[6], q: +l[8] }; }),
      gifts: cad.filter(function (c) { return c[0] === r[0]; }).map(function (c) { return c[6]; }),
      pays: pays.filter(function (x) { return x[0] === r[0]; }).map(function (x) { return { ts: ms_(x[3]), m: x[5], a: +x[6], by: x[7] || '' }; })
    };
  });
  var openTables = cur ? Object.keys(st.tables).map(function (k) { return st.tables[k]; }) : [];
  return {
    id: id, cur: cur, soiree: info,
    pays: pays.map(function (x) { return { ts: ms_(x[3]), t: x[4], m: x[5], a: +x[6], by: x[7] || '' }; }),
    ventes: ventes,
    best: lignes.map(function (l) { return { n: l[6], q: +l[8] }; }),
    gifts: cad.map(function (c) { return { n: c[6], palier: c[5], a: +c[8] }; }),
    patron: rowsWhere_('patron', 0, id).map(function (r) { return { ts: ms_(r[2]), n: r[4], q: +r[6], v: +r[8], pour: r[9] || '', c: r[10] || '', by: r[11] || '' }; }),
    cancels: rowsWhere_('annul', 0, id).map(function (r) { return { ts: ms_(r[2]), t: r[3], n: r[5], q: +r[7], a: +r[9], r: r[10], by: r[11] || '' }; }),
    open: { n: openTables.length, total: r2(openTables.reduce(function (a, t) { return a + rest(t); }, 0)),
      lines: openTables.reduce(function (o, t) { t.lines.forEach(function (l) { var nc = (t.offs || []).filter(function (x) { return x.k === l.k && x.cons === false; }).length; if (l.q - nc > 0) o.push({ n: l.n, q: l.q - nc }); }); return o; }, []) },
    history: soirees.slice(-20).reverse().map(function (r) { return { id: r[0], opened: ms_(r[2]), closed: ms_(r[3]), ca: +r[5], nb: +r[8], ecart: +r[13], match: String(r[21] || '') }; }),
    pointages: rowsWhere_('pointages', 0, id).map(function (r) { return { type: r[2], ts: ms_(r[3]), late: r[4] === '' ? null : +r[4], dist: r[5] === '' ? null : +r[5], statut: r[7], nom: String(r[8] || '') }; }),
    obj: soireeObj_(info ? info.opened : Date.now()),
    kpi: (function () { try { return id ? kpis_('', '', id) : null; } catch (e) { return null; } })(),
    promos: (function () { var pr = promoRows_(); return { soir: pr.filter(function (x) { return x.sid === id; }), pending: pr.filter(function (x) { return !x.ack; }).reverse() }; })(),
    dems: demRows_().filter(function (d) { return d.sid === id && d.type !== 'Avance'; }),
    solde: cE ? cE.solde : null, seuil: num_(pm[P_SEUIL_ESP]) || 200, fondParam: r2(num_(pm[P_FOND])),
    mat: mat, today: lite ? null : (function () { try { return soireeObj_(Date.now() - 6 * 3600000); } catch (e) { return null; } })(),
    rayon: loadData_().params.rayon,
    live: !!st.soiree, lite: !!lite,
    courses: lite ? null : (function () { try { return coursesInfo_().todo; } catch (e) { return []; } })()
  };
}

// Version texte du récap (secours si le compte rendu mis en page échoue).
function recapText_(so, now, a, counted, expected, ecart, comment, names) {
  var ob = soireeObj_(so.opened);
  var body = [
    'Soirée du ' + Utilities.formatDate(new Date(so.opened), TZ, 'dd/MM/yyyy') + ' · ' + hm_(so.opened) + ' → ' + hm_(now),
    so.late > 0 ? 'Prise de service avec ' + so.late + ' min de retard' : 'Prise de service à l’heure',
    '',
    'Encaissé : ' + eur_(a.ca) + ' (CB ' + eur_(a.cb) + ', espèces ' + eur_(a.esp) + ')',
    'Tables encaissées : ' + a.nb + ' · panier moyen ' + eur_(a.nb ? a.ca / a.nb : 0) + (a.pers ? ' · ' + a.pers + ' personnes, ' + eur_(a.ca / a.pers) + ' par personne' : ''),
    so.match ? 'Soirée match : ' + so.match : '',
    ob.soir ? 'Paliers du jour : minimum ' + eur_(ob.min) + ' · objectif ' + eur_(ob.soir) + ' · top ' + eur_(ob.top) + ' → ' + (a.ca >= ob.top ? 'top atteint' : a.ca >= ob.soir ? 'objectif atteint' : ob.min && a.ca >= ob.min ? 'minimum atteint' : 'sous le minimum') + ' (' + Math.round(a.ca / ob.soir * 100) + ' % de l’objectif)' : 'Objectif de la soirée : non défini',
    names && names.length ? 'Équipe : ' + names.join(', ') : '',
    '',
    'Caisse : attendu ' + eur_(expected) + ', compté ' + eur_(counted) + ', écart ' + (ecart > 0 ? '+' : '') + eur_(ecart),
    'Offert fidélité : ' + eur_(a.gifts) + ' · conso patron : ' + eur_(a.patron),
    'Annulations : ' + eur_(a.annul),
    '',
    comment ? 'Commentaire du service : ' + comment : 'Pas de commentaire du service.',
    '',
    'Détail complet dans le Google Sheets et sur ta page gérant.'
  ].filter(function (l, i, arr) { return l !== '' || (i > 0 && arr[i - 1] !== ''); }).join('\n');
  return { subject: 'YÄYA · récap du ' + Utilities.formatDate(new Date(so.opened), TZ, 'dd/MM') + ' · ' + eur_(a.ca), body: body };
}

// ---------- Compte rendu par mail (mis en page) ----------

var JOURS_ = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
var MOIS_ = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
var C_ = { bg: '#F3F0EA', card: '#FFFFFF', ink: '#24221E', mute: '#8C877D', line: '#ECE7DD', gold: '#A8834A', ok: '#2F7A52', warn: '#B7791F', bad: '#B3412F' };
var FONT_ = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

function h_(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function cap_(v) { v = String(v || ''); return v.charAt(0).toUpperCase() + v.slice(1); }
function dateFr_(ms, withDay) { var y = ymd_(ms), p = y.split('-'); return (withDay ? JOURS_[dow_(y)] + ' ' : '') + (+p[2]) + ' ' + MOIS_[+p[1] - 1]; }
function dec_(v) { return String(Math.round(v * 10) / 10).replace('.', ','); }
function dur_(ms) { var m = Math.max(0, Math.round(ms / 60000)); return Math.floor(m / 60) + ' h ' + ('0' + m % 60).slice(-2); }

function mailShell_(kicker, title, sub, body, foot) {
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"></head>' +
    '<body style="margin:0;padding:0;background:' + C_.bg + ';-webkit-text-size-adjust:100%;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C_.bg + ';"><tr><td align="center" style="padding:22px 10px 30px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;' + FONT_ + 'color:' + C_.ink + ';">' +
    '<tr><td style="padding:2px 6px 18px;">' +
    '<div style="font-size:12px;letter-spacing:5px;color:' + C_.gold + ';font-weight:700;">YÄYA&nbsp;LOUNGE</div>' +
    '<div style="height:1px;background:' + C_.gold + ';opacity:.35;margin:12px 0 14px;font-size:0;line-height:0;">&nbsp;</div>' +
    '<div style="font-size:12px;color:' + C_.mute + ';text-transform:uppercase;letter-spacing:1.5px;">' + h_(kicker) + '</div>' +
    '<div style="font-size:24px;font-weight:700;margin-top:4px;line-height:1.25;">' + h_(title) + '</div>' +
    (sub ? '<div style="font-size:14px;color:' + C_.mute + ';margin-top:4px;line-height:1.4;">' + sub + '</div>' : '') +
    '</td></tr>' + body +
    '<tr><td style="padding:14px 6px 0;font-size:12px;line-height:1.6;color:' + C_.mute + ';">' + foot + '</td></tr>' +
    '</table></td></tr></table></body></html>';
}
function card_(title, inner) {
  return '<tr><td style="padding:0 0 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C_.card + ';border:1px solid ' + C_.line + ';border-radius:14px;"><tr><td style="padding:18px 18px 16px;">' +
    (title ? '<div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:' + C_.gold + ';font-weight:700;margin-bottom:12px;">' + h_(title) + '</div>' : '') + inner + '</td></tr></table></td></tr>';
}
// Chiffres clés côte à côte : [libellé, valeur, précision, couleur].
function mkpis_(items) {
  var w = Math.floor(100 / items.length);
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + items.map(function (k) {
    return '<td width="' + w + '%" valign="top" style="padding:0 8px 0 0;"><div style="font-size:12px;color:' + C_.mute + ';">' + h_(k[0]) + '</div>' +
      '<div style="font-size:19px;font-weight:700;margin-top:2px;white-space:nowrap;color:' + (k[3] || C_.ink) + ';">' + k[1] + '</div>' +
      (k[2] ? '<div style="font-size:12px;color:' + C_.mute + ';margin-top:2px;line-height:1.35;">' + k[2] + '</div>' : '') + '</td>';
  }).join('') + '</tr></table>';
}
// Lignes libellé / montant : [libellé, valeur, précision, couleur, gras].
function lignesHtml_(rows) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + rows.map(function (r, i) {
    var bt = i ? 'border-top:1px solid ' + C_.line + ';' : '';
    return '<tr><td valign="top" style="padding:8px 0;' + bt + 'font-size:14px;line-height:1.35;' + (r[4] ? 'font-weight:700;' : '') + '">' + r[0] +
      (r[2] ? '<div style="font-size:12px;color:' + C_.mute + ';font-weight:400;margin-top:2px;">' + r[2] + '</div>' : '') + '</td>' +
      '<td align="right" valign="top" style="padding:8px 0 8px 12px;' + bt + 'font-size:14px;font-weight:' + (r[4] ? '700' : '600') + ';white-space:nowrap;color:' + (r[3] || C_.ink) + ';">' + r[1] + '</td></tr>';
  }).join('') + '</table>';
}
function bar_(val, max, color) {
  var p = max > 0 ? Math.max(0, Math.min(100, Math.round(val / max * 100))) : 0;
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C_.line + ';border-radius:6px;margin-top:12px;"><tr>' +
    (p > 0 ? '<td width="' + p + '%" style="background:' + color + ';height:10px;border-radius:6px;font-size:0;line-height:0;">&nbsp;</td>' : '') +
    (p < 100 ? '<td style="height:10px;font-size:0;line-height:0;">&nbsp;</td>' : '') + '</tr></table>';
}
// Paliers : [libellé, montant, atteint].
function paliersHtml_(items) {
  var w = Math.floor(100 / items.length);
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;"><tr>' + items.map(function (x, i) {
    return '<td width="' + w + '%" align="' + (i === 0 ? 'left' : i === items.length - 1 ? 'right' : 'center') + '" style="font-size:12px;color:' + (x[2] ? C_.ok : C_.mute) + ';">' + (x[2] ? '✓ ' : '') + h_(x[0]) +
      '<div style="font-size:14px;font-weight:700;color:' + (x[2] ? C_.ok : C_.ink) + ';">' + x[1] + '</div></td>';
  }).join('') + '</tr></table>';
}
function badge_(txt, color) { return '<span style="display:inline-block;padding:4px 11px;border-radius:20px;font-size:12px;font-weight:700;color:#FFFFFF;background:' + color + ';white-space:nowrap;">' + h_(txt) + '</span>'; }
function note_(txt, color) { return '<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#FBF8F2;border-left:3px solid ' + (color || C_.gold) + ';font-size:13px;line-height:1.45;">' + txt + '</div>'; }
function small_(txt) { return '<div style="font-size:12px;color:' + C_.mute + ';margin-top:10px;line-height:1.45;">' + txt + '</div>'; }

// Le mois en cours : CA, coûts (salaires + charges fixes + achats), bénéfice.
function moisBloc_(O) {
  var o = O.obj, c = O.cur, M = O.month, fixes = r2((o.sal || 0) + (o.charges || 0)), pace = O.days ? O.day / O.days : 0;
  var var_ = r2(c.mat.tot + c.autres), total = r2(fixes + var_), proj = function (v) { return O.day ? v / O.day * O.days : 0; };
  var benDate = r2(c.ca - var_ - fixes * pace), benProj = r2(proj(c.ca) - proj(var_) - fixes);
  var nom = MOIS_[+c.m.slice(5, 7) - 1], html = '';
  html += mkpis_([
    ['CA du mois', eur_(c.ca), M.obj ? 'sur ' + eur_(M.obj) + ' visés' : c.soirees + ' soirée' + (c.soirees > 1 ? 's' : ''), ''],
    ['Projection', eur_(proj(c.ca)), 'au rythme actuel', '']
  ]);
  if (M.obj) {
    var ahead = c.ca >= M.toDateObj;
    html += bar_(c.ca, M.obj, ahead ? C_.ok : C_.gold) +
      small_('À ce jour (jour ' + O.day + ' sur ' + O.days + '), l’objectif cumulé est de ' + eur_(M.toDateObj) + ' : ' + (ahead ? '<b style="color:' + C_.ok + '">en avance de ' + eur_(c.ca - M.toDateObj) + '</b>' : '<b style="color:' + C_.bad + '">en retard de ' + eur_(M.toDateObj - c.ca) + '</b>') + '.');
  }
  var mb = c.mat.by || {}, matTxt = Object.keys(mb).map(function (k) { return k.toLowerCase() + ' ' + eur_(mb[k]); }).join(' · ');
  html += '<div style="height:14px;font-size:0;line-height:0;">&nbsp;</div>' + lignesHtml_([
    ['Salaires', eur_(o.sal || 0), '', '', false],
    ['Charges fixes', eur_(o.charges || 0), 'loyer, électricité, assurances…', '', false],
    ['Matières consommées', eur_(c.mat.tot), (matTxt || 'goûts, charbon, boissons') + ' · selon les ventes', '', false],
    ['Autres achats', eur_(c.autres), 'cuisine, emballages… (produits non suivis en stock)', '', false],
    ['Coûts du mois', eur_(total), '', '', true]
  ]);
  // Même chiffre que l'onglet Objectifs : CA encore à faire pour finir le mois à 0 €, matières comprises.
  var left = M.min ? Math.max(0, r2(M.min - c.ca)) : O.reste ? O.reste.need : r2(total - c.ca), nd = O.reste ? O.reste.days : 0;
  html += note_(left > 0 ? 'Pour finir le mois à 0 € : encore <b>' + eur_(left) + '</b> de CA' + (nd ? ' en ' + nd + ' jour' + (nd > 1 ? 's' : '') + ', soit ' + eur_(left / nd) + ' par jour en moyenne' : '') + ', matières comprises.'
    : '<b style="color:' + C_.ok + '">Salaires et charges du mois couverts</b> : tout ce qui suit est du bénéfice.', left > 0 ? C_.gold : C_.ok);
  html += '<div style="height:14px;font-size:0;line-height:0;">&nbsp;</div>' + mkpis_([
    ['Bénéfice à ce jour', eur_(benDate), 'salaires et charges au prorata du mois', benDate < 0 ? C_.bad : C_.ok],
    ['Bénéfice projeté', eur_(benProj), o.ben ? 'objectif ' + eur_(o.ben) : 'fin de mois', benProj < 0 ? C_.bad : o.ben && benProj >= o.ben ? C_.ok : '']
  ]);
  return card_(cap_(nom) + ' à ce jour', html);
}

// Envoie le compte rendu d'une soirée fermée. fb = version texte de secours.
function sendCompteRendu_(id, fb) {
  var to = String(paramsMap_()[P_EMAIL] || '').trim();
  if (!to) return 'Compte rendu non envoyé : aucun email dans Paramètres.';
  try {
    var cr = compteRendu_(id);
    MailApp.sendEmail({ to: to, subject: cr.subject, body: cr.text, htmlBody: cr.html, name: 'YÄYA Lounge' });
    return 'Compte rendu envoyé à ' + to + '.';
  } catch (e) {
    if (fb) { try { var t = Array.isArray(fb) ? recapText_.apply(null, fb) : fb; MailApp.sendEmail({ to: to, subject: t.subject, body: t.body }); return 'Récap envoyé au gérant.'; } catch (e2) {} }
    return 'Compte rendu non envoyé (' + String(e && e.message || e) + ').';
  }
}

function compteRendu_(id) {
  var R = recap_(id), so = R.soiree;
  if (!so || !so.closed) throw new Error('Soirée introuvable ou pas encore fermée.');
  var row = rows_('soirees').filter(function (r) { return r[0] === id; })[0] || [];
  var data = loadData_(), art = {};
  data.carte.forEach(function (x) { art[x.n] = x; });
  var ca = 0, cb = 0;
  R.pays.forEach(function (p) { ca += p.a; if (p.m === 'CB') cb += p.a; });
  ca = r2(ca); cb = r2(cb);
  var esp = r2(ca - cb), tables = R.ventes.filter(function (v) { return v.enc > 0; }).length;
  var wp = R.ventes.filter(function (v) { return v.pers > 0; }), pers = wp.reduce(function (a, v) { return a + v.pers; }, 0), caP = r2(wp.reduce(function (a, v) { return a + v.enc; }, 0));
  var ob = R.obj || {}, d = ymd_(so.opened), jour = JOURS_[dow_(d)];
  // Leviers et meilleures ventes.
  var chichas = 0, tetes = 0, dess = 0, counts = {};
  R.best.forEach(function (l) {
    counts[l.n] = (counts[l.n] || 0) + l.q;
    var a = art[l.n];
    if (!a) return;
    if (a.cat === 'Chichas') { if (/^t[êe]te/i.test(a.n)) tetes += l.q; else chichas += l.q; }
    if (a.cat === 'Desserts' || String(a.o || '').indexOf('dessert') >= 0) dess += l.q;
  });
  var lev = { pan: tables ? r2(ca / tables) : 0, ppers: pers ? r2(caP / pers) : 0, tetes: chichas ? Math.round(tetes / chichas * 100) / 10 : 0, dess: tables ? Math.round(dess / tables * 100) / 10 : 0 };
  var status = ob.top && ca >= ob.top ? ['Top atteint', C_.ok] : ob.soir && ca >= ob.soir ? ['Objectif atteint', C_.ok] : ob.min && ca >= ob.min ? ['Minimum atteint', C_.gold]
    : ob.min ? ['Sous le minimum', C_.bad] : ob.soir ? ['Objectif non atteint', C_.warn] : null;
  // Matières consommées (goûts, charbon, boissons, ingrédients) des lignes vendues et de la conso patron.
  var lines = [];
  rowsWhere_('lignes', 1, id).forEach(function (r) { lines.push({ n: String(r[6]), d: String(r[7] || '').split(' · '), q: +r[8] || 0 }); });
  rowsWhere_('patron', 0, id).forEach(function (r) { lines.push({ n: String(r[4]), d: String(r[5] || '').split(' · '), q: +r[6] || 0 }); });
  var prods = stockProds_().filter(function (p) { return p.actif; }), gouts = [], charbon = [], nbTetes = 0;
  prods.forEach(function (p) {
    if (p.type === 'Goût') {
      var n = lines.reduce(function (a, l) { return a + (conso_(p, l.n, l.d, l.q, art, 1) ? l.q : 0); }, 0);
      if (n) { gouts.push([p.n.replace(/^Go[ûu]t\s+/i, ''), n]); nbTetes += n; }
    } else if (/charbon/i.test(p.n)) {
      var c = lines.reduce(function (a, l) { return a + conso_(p, l.n, l.d, l.q, art, 0); }, 0);
      if (c) charbon.push([p.n, c, p.unite]);
    }
  });
  gouts.sort(function (a, b) { return b[1] - a[1]; });
  var mctx = matCtx_(), mat = matCost_(mctx, lines), kgGout = lines.reduce(function (s, l) { return s + prods.filter(function (p) { return p.type === 'Goût'; }).reduce(function (a, p) { return a + conso_(p, l.n, l.d, l.q, art, mctx.per); }, 0); }, 0);
  var text = [], body = '', st = readState_();

  // 0. À faire : ce qui attend une décision ou une action du gérant.
  var todo = [], pend = (st.dem || []).filter(function (x) { return x.status === DEM_ATT_; }), oldP = R.promos ? R.promos.pending : [];
  var pl = function (n, w) { return n + ' ' + w + (n > 1 ? 's' : ''); };
  if (pend.length) {
    todo.push(['<b>' + pl(pend.length, 'demande') + ' à valider</b>', eur_(pend.reduce(function (s, x) { return s + x.amount; }, 0)),
      pend.slice(0, 8).map(function (x) { return h_(x.type) + ' · ' + h_(x.type === 'Avance' ? x.by : x.detail + ' (' + x.by + ')'); }).join('<br>'), C_.bad, false]);
    text.push('À valider : ' + pend.map(function (x) { return x.type.toLowerCase() + ' ' + eur_(x.amount) + ' (' + x.by + ')'; }).join(', '));
  }
  if (oldP.length) todo.push(['<b>' + pl(oldP.length, 'promotion') + ' à prendre en compte</b>', eur_(oldP.reduce(function (s, x) { return s + x.a; }, 0)), 'la plus ancienne du ' + dateFr_(oldP[oldP.length - 1].ts, false), C_.bad, false]);
  if (R.solde != null && R.solde > R.seuil) {
    var prends = R.fondParam > 0 ? r2(R.solde - R.fondParam) : R.solde;
    todo.push(['<b>Récupère les espèces du tiroir</b>', eur_(R.solde), 'Au-dessus de ' + eur_(R.seuil) + ' : prends ' + eur_(prends) + (R.fondParam > 0 ? ' et laisse le fond de ' + eur_(R.fondParam) : '') + ', puis note-le dans l’onglet Caisse de ta page gérant.', C_.warn, false]);
    text.push('Caisse : ' + eur_(R.solde) + ' dans le tiroir, pense à récupérer ' + eur_(prends) + '.');
  }
  var un = unread_(st, true);
  if (un) todo.push(['<b>' + pl(un, 'message') + ' non lu' + (un > 1 ? 's' : '') + '</b>', '', 'Dans ta page gérant, bouton Messages.', C_.gold, false]);
  if (String(row[23] || '') === 'Non fait') todo.push(['<b>Inventaire du lundi non fait</b>', '', '', C_.bad, false]);
  if (todo.length) body += card_('À faire', lignesHtml_(todo));

  // 1. La soirée en un coup d'œil (et le mot du service).
  var hero = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td valign="bottom"><div style="font-size:12px;color:' + C_.mute + ';">Encaissé</div>' +
    '<div style="font-size:40px;font-weight:800;letter-spacing:-1px;line-height:1.1;">' + eur_(ca) + '</div></td>' +
    '<td align="right" valign="bottom" style="padding-bottom:6px;">' + (status ? badge_(status[0], status[1]) : '') + '</td></tr></table>';
  if (ob.soir) {
    hero += '<div style="font-size:14px;color:' + C_.mute + ';margin-top:4px;">' + Math.round(ca / ob.soir * 100) + ' % de l’objectif du ' + jour + (ob.min && ca < ob.min ? ' · il manquait ' + eur_(ob.min - ca) + ' pour le minimum' : ca < ob.soir ? ' · il manquait ' + eur_(ob.soir - ca) : ob.top && ca < ob.top ? ' · à ' + eur_(ob.top - ca) + ' du top' : '') + '</div>';
    hero += bar_(ca, ob.top || ob.soir, status ? status[1] : C_.gold);
    hero += paliersHtml_([['Minimum', ob.min ? eur_(ob.min) : '—', ob.min && ca >= ob.min], ['Objectif', eur_(ob.soir), ca >= ob.soir], ['Top', ob.top ? eur_(ob.top) : '—', ob.top && ca >= ob.top]]);
  } else hero += small_('Fixe ton objectif de CA du mois dans l’onglet Objectifs pour voir les paliers du jour.');
  hero += '<div style="height:16px;font-size:0;line-height:0;">&nbsp;</div>' + mkpis_([
    ['Tables', String(tables), pers ? pers + ' personnes' : '', ''],
    ['Panier / table', eur_(lev.pan), pers ? eur_(lev.ppers) + ' / pers.' : '', ''],
    ['Matières', '≈ ' + eur_(mat.tot), 'marge ≈ ' + eur_(ca - mat.tot), '']
  ]);
  if (so.match) hero += note_('Soirée match · ' + h_(so.match), C_.gold);
  hero += so.comment ? note_('<i>« ' + h_(so.comment) + ' »</i>' + (so.closer ? '<br><span style="color:' + C_.mute + ';">' + h_(so.closer) + ', à la fermeture</span>' : ''), C_.gold) : small_('Pas de commentaire du service.');
  body += card_('La soirée', hero);
  text.push('Encaissé : ' + eur_(ca) + (status ? ' · ' + status[0] : '') + (ob.soir ? ' (minimum ' + eur_(ob.min) + ', objectif ' + eur_(ob.soir) + ', top ' + eur_(ob.top) + ')' : ''));
  text.push(tables + ' tables' + (pers ? ', ' + pers + ' personnes' : '') + ' · panier ' + eur_(lev.pan) + ' par table · matières ≈ ' + eur_(mat.tot));
  text.push(so.comment ? 'Commentaire : ' + so.comment : 'Pas de commentaire du service.');

  // 2. Caisse : le tiroir n'est pas vidé chaque soir.
  var detail = String(row[22] || ''), ec = +so.ecart || 0, mv = r2((+so.expected || 0) - (+so.fond || 0) - esp);
  var cai = [['Dans le tiroir à l’ouverture', eur_(so.fond), 'dernier comptage, moins ce que tu as récupéré', '', false], ['Espèces encaissées', eur_(esp), 'CB : ' + eur_(cb), '', false]];
  if (mv) cai.push(['Mouvements pendant la soirée', (mv > 0 ? '+' : '') + eur_(mv), 'avances, retraits, ajouts de monnaie', '', false]);
  cai.push(['Attendu dans le tiroir', eur_(so.expected), '', '', false]);
  cai.push(so.noCash ? ['Compté', '—', 'pas d’espèces ce soir : pas de comptage', '', false] : ['Compté', eur_(so.counted), detail && detail !== NOCASH_ ? h_(detail) : '', '', false]);
  cai.push(['Écart', so.noCash ? '—' : (ec > 0 ? '+' : '') + eur_(ec), so.noCash ? '' : ec === 0 ? 'caisse juste' : ec < 0 ? 'manque en caisse' : 'excédent', so.noCash ? '' : ec === 0 ? C_.ok : ec < 0 ? C_.bad : C_.warn, true]);
  body += card_('Caisse', lignesHtml_(cai));
  text.push('Caisse : attendu ' + eur_(so.expected) + ', compté ' + eur_(so.counted) + ', écart ' + (ec > 0 ? '+' : '') + eur_(ec));

  // 3. Offerts, promotions et annulations, avec la décision du gérant.
  var off = [], stTxt = function (s2) { return s2 === 'Validée' ? 'validé' : s2 === 'Refusée' ? 'refusé' : s2 === 'Retirée' ? 'retiré' : 'à valider'; }, consoSt = {};
  (R.dems || []).forEach(function (x) { if (x.type === 'Conso offerte') consoSt[x.ts] = x.status; });
  (R.dems || []).filter(function (x) { return x.type !== 'Conso offerte'; }).forEach(function (x) {
    off.push([h_(x.type) + ' · ' + h_(x.detail), '−' + eur_(x.amount), [x.motif, x.pour].filter(String).map(h_).join(' : ') + ' · par ' + h_(x.by) + ' · <b>' + stTxt(x.status) + '</b>' + (x.status === 'Refusée' ? (x.pay === 'Après encaissement' ? ' (table déjà encaissée : non récupéré)' : ' (remis sur l’addition)') : ''),
      x.status === 'Validée' ? C_.ok : x.status === 'Refusée' ? C_.bad : x.status === 'Retirée' ? C_.mute : C_.warn, false]);
  });
  (R.promos ? R.promos.soir : []).forEach(function (x) { off.push(['Promotion −' + x.pct + ' % · table ' + h_(x.t), '−' + eur_(x.a), h_(x.motif) + ' : ' + h_(x.pour) + (x.by ? ' · par ' + h_(x.by) : '') + ' · <b>' + (x.ack ? 'prise en compte' : 'à prendre en compte') + '</b>', C_.warn, false]); });
  R.gifts.forEach(function (g) { off.push(['Fidélité · ' + h_(g.n), eur_(g.a), g.palier + ' tampons', '', false]); });
  R.patron.forEach(function (x) {
    var s3 = consoSt[x.ts];
    off.push(['Conso patron · ' + x.q + '× ' + h_(x.n), eur_(x.v), [x.pour, x.c].filter(String).map(h_).join(' : ') + (x.by ? ' · saisi par ' + h_(x.by) : '') + (s3 ? ' · <b>' + stTxt(s3) + '</b>' : ''), s3 === 'Refusée' ? C_.bad : s3 === DEM_ATT_ ? C_.warn : '', false]);
  });
  R.cancels.forEach(function (x) { off.push(['Annulé directement · ' + x.q + '× ' + h_(x.n), '−' + eur_(x.a), 'table ' + h_(x.t) + ' · ' + h_(x.r) + (x.by ? ' · par ' + h_(x.by) : ''), C_.mute, false]); });
  if (off.length) body += card_('Offerts, promotions et annulations', lignesHtml_(off) + small_('Offerts et articles ratés sortent du stock sans passer en caisse. Les demandes « à valider » attendent ta réponse dans ta page gérant.'));

  // 4. Leviers du service.
  var L = [['pan', 'Panier par table', eur_], ['ppers', 'Panier par personne', eur_], ['tetes', 'Têtes en plus pour 10 chichas', dec_], ['dess', 'Desserts pour 10 tables', dec_]];
  var hab = ob.lev30 || {}, levRows = L.filter(function (l) { return ob[l[0]]; }).map(function (l) {
    var v = lev[l[0]] || 0, t = ob[l[0]], hb = hab[l[0]] || 0;
    var col = v >= t ? C_.ok : hb && v < hb ? C_.bad : C_.ink;
    return [h_(l[1]), l[2](v), 'objectif ' + l[2](t) + (hb ? ' · habituel ' + l[2](hb) : ''), col, false];
  });
  if (levRows.length) body += card_('Leviers du service', lignesHtml_(levRows) + small_('Vert : objectif atteint. Rouge : moins bien que d’habitude (moyenne des 30 derniers jours).'));
  else if (tables) body += card_('Leviers du service', lignesHtml_([['Panier par table', eur_(lev.pan), '', '', false], ['Têtes en plus pour 10 chichas', dec_(lev.tetes), '', '', false], ['Desserts pour 10 tables', dec_(lev.dess), '', '', false]]) + small_('Fixe tes objectifs de leviers dans l’onglet Objectifs pour les suivre ici.'));

  // 5. Le mois.
  try { body += moisBloc_(objectifsInfo_()); } catch (e) {}

  // 6. Ventes, goûts et charbon.
  var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 8);
  if (top.length) {
    var vh = lignesHtml_(top.map(function (n) { return [h_(n), String(counts[n]), '', '', false]; }));
    if (gouts.length || charbon.length) {
      vh += '<div style="height:12px;font-size:0;line-height:0;">&nbsp;</div>' + lignesHtml_([].concat(
        gouts.length ? [['Goûts servis', nbTetes + ' tête' + (nbTetes > 1 ? 's' : ''), gouts.map(function (g) { return h_(g[0]) + ' ' + g[1]; }).join(' · '), '', true]] : [],
        charbon.map(function (c) { return [h_(c[0]), dec_(c[1]) + ' ' + h_(c[2]) + (c[1] > 1 && /pi[èe]ce/.test(c[2]) ? 's' : ''), '4 par chicha', '', false]; })
      ));
      if (nbTetes) vh += small_('Goût utilisé : ' + Math.round(kgGout * 1000) + ' g (' + Math.round(mctx.per.plate * 1000) + ' g par tête plate, ' + Math.round(mctx.per.quasar * 1000) + ' g par Quasar).');
    }
    if (mat.tot || mat.unknown.length) {
      vh += note_('<b>Matières consommées ≈ ' + eur_(mat.tot) + '</b>' + (Object.keys(mat.by).length ? ' (' + Object.keys(mat.by).map(function (k) { return k.toLowerCase() + ' ' + eur_(mat.by[k]); }).join(', ') + ')' : '') +
        ' · marge sur matières ≈ ' + eur_(ca - mat.tot) + '.' + (mat.unknown.length ? '<br>Coût inconnu (aucun achat saisi) : ' + mat.unknown.map(h_).join(', ') + '.' : ''), C_.gold);
    }
    body += card_('Ventes', vh);
    text.push('Meilleures ventes : ' + top.slice(0, 5).map(function (n) { return n + ' (' + counts[n] + ')'; }).join(', '));
  }

  // 7. Équipe et ménage.
  var P = {};
  (R.pointages || []).filter(function (x) { return x.nom && !/^Gérant/.test(x.nom); }).forEach(function (x) {
    var q = P[x.nom] || (P[x.nom] = { inn: null, out: null, late: 0 });
    if (x.type === 'Arrivée') { if (!q.inn) { q.inn = x.ts; q.late = x.late || 0; } q.out = null; } else q.out = x.ts;
  });
  var team = Object.keys(P).filter(function (n) { return P[n].inn; }).map(function (n) {
    var q = P[n], end = q.out || so.closed;
    return [h_(n), dur_(end - q.inn), hm_(q.inn) + ' → ' + hm_(end) + ' · ' + (q.late > 0 ? '<span style="color:' + C_.bad + '">' + q.late + ' min de retard</span>' : 'à l’heure'), '', false];
  });
  body += card_('Équipe', (team.length ? lignesHtml_(team) : '<div style="font-size:14px;">Ouverture ' + hm_(so.opened) + ' · fermeture ' + hm_(so.closed) + (so.late > 0 ? ' · <span style="color:' + C_.bad + '">' + so.late + ' min de retard</span>' : ' · à l’heure') + '</div>') +
    (String(row[24] || '') ? note_('<b>Ménage</b> : ' + h_(String(row[24]).charAt(0).toLowerCase() + String(row[24]).slice(1)) + '.', /^Fait/.test(String(row[24])) ? C_.ok : C_.warn) : '') +
    (so.closer ? small_('Soirée fermée par ' + h_(so.closer) + '.') : ''));

  // 8. Stock à surveiller.
  try {
    var S = stockInfo_(), low = S.list.filter(function (x) { return x.low; }), red = S.list.filter(function (x) { return x.period && x.period.red; }), never = S.list.filter(function (x) { return !x.last; });
    var sh = '', invTxt = String(row[23] || '');
    if (invTxt) sh += note_(invTxt === 'Non fait' ? '<b>Inventaire du lundi non fait.</b>' : '<b>Inventaire du lundi</b> : ' + h_(invTxt.charAt(0).toLowerCase() + invTxt.slice(1)) + '.' + (red.length ? '' : ' Aucun écart au-delà de ' + S.tol + ' %.'), invTxt === 'Non fait' ? C_.bad : red.length ? C_.warn : C_.ok);
    if (low.length) sh += note_('<b>Sous le seuil</b> : ' + low.map(function (x) { return h_(x.n); }).join(', ') + '.', C_.warn);
    if (red.length) sh += note_('<b>Écart au-delà de ' + S.tol + ' %</b> : ' + red.map(function (x) { return h_(x.n) + (x.type === 'Goût' && x.period.rend != null ? ' (' + dec_(x.period.rend) + ' têtes/kg)' : x.period.pct != null ? ' (' + (x.period.pct > 0 ? '+' : '') + dec_(x.period.pct) + ' %)' : ''); }).join(', ') + '.', C_.bad);
    if (never.length) sh += note_(never.length === S.list.length ? 'Aucun inventaire fait pour l’instant : le stock théorique part de zéro. Fais un premier inventaire (onglet Stock) pour suivre les écarts.' : never.length + ' produit' + (never.length > 1 ? 's' : '') + ' jamais compté' + (never.length > 1 ? 's' : '') + ' : ' + never.slice(0, 6).map(function (x) { return h_(x.n); }).join(', ') + (never.length > 6 ? '…' : '.'), C_.gold);
    if (sh) body += card_('Stock à surveiller', sh.replace('margin-top:12px', 'margin-top:0'));
    var I = stockIntel_(S);
    if (invTxt && invTxt !== 'Non fait') body += stockCard_(I, { title: 'Stock · indicateurs clés de la semaine' });
    else if (I.unusual.length) body += card_('Stock · activité inhabituelle', I.unusual.slice(0, 6).map(function (u) { return '<div style="font-size:14px;line-height:1.45;margin-bottom:6px;"><b>' + h_(u.n) + '</b> : ' + h_(u.txt) + '</div>'; }).join('') + small_('Comparé à l’habitude apprise sur les achats et les inventaires précédents.'));
  } catch (e) {}

  var url = '';
  try { url = SpreadsheetApp.getActive().getUrl(); } catch (e) {}
  var foot = 'Compte rendu envoyé automatiquement à la fermeture. CA = encaissé CB + espèces, TTC, hors offerts. Bénéfice avant impôts et TVA.' +
    (url ? '<br><a href="' + h_(url) + '" style="color:' + C_.gold + ';">Ouvrir le Google Sheets</a> · le détail complet est aussi sur ta page gérant.' : '') +
    '<br>YÄYA Lounge · 46 rue Jean Jaurès, Bezons';
  var title = cap_(dateFr_(so.opened, true));
  var sub = hm_(so.opened) + ' → ' + hm_(so.closed) + ' · ' + dur_(so.closed - so.opened) + (so.match ? ' · match' : '');
  return {
    subject: 'YÄYA · ' + cap_(jour) + ' ' + dateFr_(so.opened, false) + ' · ' + eur_(ca) + (status ? ' · ' + status[0].toLowerCase() : '') + (pend.length ? ' · ' + pl(pend.length, 'demande') + ' à valider' : ''),
    html: mailShell_('Compte rendu de soirée', title, sub, body, foot),
    text: [title + ' · ' + sub, ''].concat(text, ['', 'Version complète dans l’email mis en page et sur ta page gérant.']).join('\n')
  };
}

// Récap de la semaine mis en page (valeurs calculées dans weekly_).
function weeklyHtml_(w) {
  var mon = w.mon, body = '', fmtS = function (ymd) { var p = ymd.split('-'); return +p[2] + ' ' + MOIS_[+p[1] - 1]; };
  var caDay = {};
  w.cur.forEach(function (r) { var k = ymd_(ms_(r[1])); caDay[k] = (caDay[k] || 0) + (+r[5] || 0); });
  var hero = '<div style="font-size:12px;color:' + C_.mute + ';">CA de la semaine</div><div style="font-size:40px;font-weight:800;letter-spacing:-1px;line-height:1.1;">' + eur_(w.ca) + '</div>';
  var subTxt = [];
  if (w.objW) subTxt.push(Math.round(w.ca / w.objW * 100) + ' % de l’objectif (' + eur_(w.objW) + ')');
  if (w.caPrev) subTxt.push((w.ca >= w.caPrev ? '+' : '') + Math.round((w.ca - w.caPrev) / w.caPrev * 100) + ' % vs semaine précédente');
  if (subTxt.length) hero += '<div style="font-size:14px;color:' + C_.mute + ';margin-top:4px;">' + subTxt.join(' · ') + '</div>';
  if (w.objW) hero += bar_(w.ca, w.objW, w.ca >= w.objW ? C_.ok : w.minW && w.ca < w.minW ? C_.bad : C_.gold) + paliersHtml_([['Minimum', w.minW ? eur_(w.minW) : '—', w.minW && w.ca >= w.minW], ['Objectif', eur_(w.objW), w.ca >= w.objW]]);
  hero += '<div style="height:16px;font-size:0;line-height:0;">&nbsp;</div>' + mkpis_([
    ['Soirées', String(w.cur.length), '', ''],
    ['Tables', String(w.tables), w.pers ? w.pers + ' personnes' : '', ''],
    ['Panier / table', eur_(w.tables ? w.ca / w.tables : 0), w.pers ? eur_(w.persCa / w.pers) + ' / pers.' : '', '']
  ]);
  body += card_('La semaine', hero);
  var days = [];
  for (var i = 0; i < 7; i++) {
    var dd = addDays_(mon, i), pw = paliers_(w.octx, dd), v = r2(caDay[dd] || 0), has = dd in caDay;
    var col = !has ? C_.mute : pw.obj && v >= pw.obj ? C_.ok : pw.min && v < pw.min ? C_.bad : C_.ink;
    days.push([cap_(JOURS_[i]) + ' ' + fmtS(dd), has ? eur_(v) : '—', pw.obj ? 'objectif ' + eur_(pw.obj) + (pw.min ? ' · minimum ' + eur_(pw.min) : '') : '', col, false]);
  }
  body += card_('Jour par jour', lignesHtml_(days) + small_('Vert : objectif atteint. Rouge : sous le minimum.'));
  var top = Object.keys(w.counts).sort(function (a, b) { return w.counts[b] - w.counts[a]; }).slice(0, 6);
  if (top.length) body += card_('Meilleures ventes', lignesHtml_(top.map(function (n) { return [h_(n), String(w.counts[n]), '', '', false]; })));
  var ctl = [
    ['Offert fidélité', eur_(w.sum(w.cur, 14)), '', '', false],
    ['Conso patron', eur_(w.sum(w.cur, 15)), '', '', false],
    ['Annulations', eur_(w.sum(w.cur, 16)), '', '', false],
    ['Promotions', eur_(promoRows_().filter(function (x) { return inWeek_(x.date, mon); }).reduce(function (s, x) { return s + x.a; }, 0)), '', '', false],
    ['Offerts et annulations après service', eur_(demRows_().filter(function (d) { return d.type !== 'Avance' && d.status !== 'Retirée' && inWeek_(d.ts, mon); }).reduce(function (s, d) { return s + d.amount; }, 0)), 'validés ou en attente', '', false],
    ['Écart de caisse cumulé', eur_(w.sum(w.cur, 13)), '', w.sum(w.cur, 13) < 0 ? C_.bad : '', false],
    ['Avances accordées', eur_(demRows_().filter(function (d) { return d.type === 'Avance' && d.status === 'Validée' && inWeek_(d.dts || d.ts, mon); }).reduce(function (s, d) { return s + d.amount; }, 0)), '', '', false],
    ['Espèces récupérées', eur_(-caisseMoves_().filter(function (m) { return m.type === CAISSE_TYPES_.retrait[0] && inWeek_(m.ts, mon); }).reduce(function (s, m) { return s + m.amt; }, 0)), '', '', false],
    ['Achats saisis', eur_(w.achats), '', '', false]
  ];
  if (w.mt.length) ctl.push(['Soirs de match', eur_(w.sum(w.mt, 5) / w.mt.length) + ' en moyenne', w.mt.length + ' soir' + (w.mt.length > 1 ? 's' : '') + (w.nm.length ? ' · soirs normaux ' + eur_(w.sum(w.nm, 5) / w.nm.length) : ''), '', false]);
  body += card_('Contrôle', lignesHtml_(ctl));
  var hk = Object.keys(w.hours);
  if (hk.length) body += card_('Heures de l’équipe', lignesHtml_(hk.map(function (n) { return [h_(n), dur_(w.hours[n]), '', '', false]; })));
  try { body += stockCard_(stockIntel_(), { title: 'Stock · indicateurs clés' }); } catch (e) {}
  try { body += moisBloc_(objectifsInfo_()); } catch (e) {}
  var foot = (w.bk ? 'Sauvegarde du Google Sheets faite : « ' + h_(w.bk.name) + ' » dans ton Drive.<br>' : w.bkErr ? 'Sauvegarde impossible : ' + h_(w.bkErr) + '<br>' : '') +
    'CA = encaissé CB + espèces, TTC, hors offerts. Bénéfice avant impôts et TVA.<br>YÄYA Lounge · 46 rue Jean Jaurès, Bezons';
  return mailShell_('Récap de la semaine', 'Semaine du ' + fmtS(mon) + ' au ' + fmtS(addDays_(mon, 6)), '', body, foot);
}

// Carte « Stock » des comptes rendus : indicateurs clés, activité inhabituelle, dosages appris.
function stockCard_(I, opts) {
  opts = opts || {};
  if (!I) return '';
  var html = '', K = I.keys.filter(function (k) { return opts.all || k.status !== 'compter' || k.week; });
  var col = { ok: C_.ok, surveiller: C_.warn, alerte: C_.bad, compter: C_.gold };
  if (K.length) {
    var nOk = K.filter(function (k) { return k.status === 'ok'; }).length, nBad = K.filter(function (k) { return k.status === 'alerte' || k.status === 'surveiller'; }).length;
    var nC = K.filter(function (k) { return k.status === 'compter'; }).length;
    html += mkpis_([
      ['Indicateurs', String(K.length), nC ? nC + ' à compter' : 'comptés lundi', ''],
      ['Conformes', String(nOk), '', nOk === K.length - nC && nOk ? C_.ok : ''],
      ['Perte estimée', eur_(I.lost), nBad ? nBad + ' à surveiller' : 'aucun écart', I.lost > 0 ? C_.bad : C_.ok]
    ]);
    html += '<div style="height:10px;font-size:0;line-height:0;">&nbsp;</div>' + lignesHtml_(K.map(function (k) {
      if (k.status === 'compter') return [h_(k.n), 'à compter', h_(k.why || '') , C_.gold, false];
      var u = k.unite, det = 'sorti ' + qtyTxt_(k.real, u) + ' · vendu ' + qtyTxt_(k.theo, u) + (k.tetes ? ' (' + k.tetes + ' têtes)' : '');
      var v = k.status === 'ok' ? '✓ conforme' : (k.ecart > 0 ? 'manque ' : 'surplus ') + qtyTxt_(k.ecart, u) + (k.val > 0 && k.ecart > 0 ? ' · ' + eur_(k.val) : '');
      return [h_(k.n), v, det + (k.pct != null && k.status !== 'ok' ? ' · ' + (k.pct > 0 ? '+' : '') + String(k.pct).replace('.', ',') + ' %' : ''), col[k.status], false];
    }));
    html += small_('Comptés le lundi avant le service. Manque = sorti plus que vendu (perte, vol, chicha ou boisson non saisie). Les indicateurs changent chaque semaine ; l’aluminium et le charbon sont toujours suivis.');
  } else html += '<div style="font-size:14px;">Les indicateurs de la semaine apparaîtront après le premier inventaire du lundi.</div>';
  if (I.unusual && I.unusual.length) html += note_('<b>Activité inhabituelle</b><br>' + I.unusual.slice(0, 6).map(function (u) { return h_(u.n) + ' : ' + h_(u.txt); }).join('<br>'), C_.warn);
  var g = I.gout || {}, ln = (I.learned || []).slice(0, opts.full ? 12 : 5);
  var cal = g.cal ? 'Goûts : <b>' + String(g.g).replace('.', ',') + ' g par tête plate</b> appris sur ' + g.cal.eq + ' têtes (réglage de départ ' + g.g0 + ' g).' : 'Goûts : ' + String(g.g).replace('.', ',') + ' g par tête plate (réglage) · le dosage réel s’apprend dès 40 têtes entre deux inventaires.';
  html += small_('<b>Dosages appris tout seuls</b> · ' + cal + (ln.length ? '<br>' + ln.map(function (x) { return h_(x.n) + ' ' + h_(x.txt); }).join(' · ') : ''));
  return card_(opts.title || 'Stock · indicateurs clés', html);
}

// ---------- Achats (gérant) ----------

var CAT_ACHATS = ['Chicha (tabac, charbon)', 'Boissons', 'Cuisine', 'Desserts', 'Emballages et consommables', 'Autre'];

function addAchat_(p) {
  var produit = String(p.produit || '').trim(), qty = num_(p.qty), total = num_(p.total);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || ''))) throw new Error('Date invalide.');
  if (!produit) throw new Error('Indique le produit acheté.');
  if (!(qty > 0)) throw new Error('Indique une quantité supérieure à 0.');
  if (!(total >= 0) || String(p.total).trim() === '') throw new Error('Indique le prix total payé.');
  var al = achAlias_()[produit.toLowerCase()];
  if (al) produit = al;
  var low = produit.toLowerCase(), prods = stockProds_();
  var sp = prods.filter(function (x) { return x.n.toLowerCase() === low; })[0] || prods.filter(function (x) { return x.type === 'Goût' && x.n.toLowerCase() === 'goût ' + low; })[0];
  if (sp) {
    produit = sp.n;
    var u = String(p.unite || '').trim();
    if (u && u !== sp.unite && !(COUNT_U_[u] && COUNT_U_[sp.unite])) throw new Error(sp.n + ' se compte en ' + sp.unite + ' : saisis la quantité dans cette unité (ex. un pack de 24 → 24, 500 g → 0,5 kg).');
    p.unite = sp.unite;
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    append_('achats', [[Utilities.parseDate(p.date, TZ, 'yyyy-MM-dd'), produit, String(p.cat || 'Autre'), qty, String(p.unite || 'unité'),
      r2(total), r2(total / qty), String(p.fournisseur || '').trim(), new Date()]]);
  } finally { lock.releaseLock(); }
}

// Unités de comptage équivalentes (une pièce = une unité).
var COUNT_U_ = { 'unité': 1, 'pièce': 1 };
// Noms rattachés : un achat saisi sous un autre nom (« Pain burger ») va au bon produit (« Pain brioché »).
function achAlias_() { try { return JSON.parse(props_().getProperty('ACH_ALIAS') || '{}'); } catch (e) { return {}; } }
function mergeAchat_(from, to) {
  from = String(from || '').trim(); to = String(to || '').trim();
  if (!from || !to || from.toLowerCase() === to.toLowerCase()) throw new Error('Choisis le produit à rattacher.');
  var prods = stockProds_(), sp = prods.filter(function (x) { return x.n.toLowerCase() === to.toLowerCase(); })[0];
  if (sp) to = sp.n;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var rows = rows_('achats'), sh = sheet_('achats'), n = 0;
    rows.forEach(function (r, i) {
      if (String(r[1]).trim().toLowerCase() !== from.toLowerCase()) return;
      var u = String(r[4] || '');
      if (sp && u && u !== sp.unite && !(COUNT_U_[u] && COUNT_U_[sp.unite])) throw new Error(from + ' a été acheté en ' + u + ', mais ' + sp.n + ' se compte en ' + sp.unite + ' : corrige d’abord la quantité dans le Google Sheets.');
      sh.getRange(i + 2, 2).setValue(to);
      if (sp && u !== sp.unite) sh.getRange(i + 2, 5).setValue(sp.unite);
      n++;
    });
    var al = achAlias_(); al[from.toLowerCase()] = to;
    Object.keys(al).forEach(function (k) { if (al[k].toLowerCase() === from.toLowerCase()) al[k] = to; });
    props_().setProperty('ACH_ALIAS', JSON.stringify(al));
    return n;
  } finally { lock.releaseLock(); }
}
// À lancer une fois depuis l'éditeur : « Pain burger » acheté le 14/11 = Pain brioché.
function fusionPainBurger() { editeurSeul_(); var n = mergeAchat_('Pain burger', 'Pain brioché'); rcInvalidateAll_(); console.log(n + ' achat(s) rattaché(s) à Pain brioché.'); return n; }

function delAchat_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var row = Math.floor(+p.row), rows = rows_('achats'), r = rows[row - 2];
    if (!r || ms_(r[8]) !== +p.saisi) throw new Error('Achat introuvable, recharge la page.');
    sheet_('achats').deleteRow(row);
  } finally { lock.releaseLock(); }
}

// Liste des achats, et achats et CA du mois en cours et du mois précédent.
function achatsInfo_() {
  var rows = rows_('achats'), pays = rows_('paiements');
  var ym = function (d) { return d instanceof Date ? ym_(d) : ''; };
  var now = new Date(), cur = Utilities.formatDate(now, TZ, 'yyyy-MM');
  var prevD = new Date(now.getTime()); prevD.setDate(1); prevD.setDate(0);
  var prev = Utilities.formatDate(prevD, TZ, 'yyyy-MM');
  var month = function (m) {
    return {
      m: m,
      achats: r2(rows.filter(function (r) { return ym(r[0]) === m; }).reduce(function (a, r) { return a + (+r[5] || 0); }, 0)),
      ca: r2(pays.filter(function (r) { return ym(r[2]) === m; }).reduce(function (a, r) { return a + (+r[6] || 0); }, 0))
    };
  };
  var list = rows.map(function (r, i) {
    return { row: i + 2, date: ms_(r[0]), produit: r[1], cat: r[2], qty: +r[3], unite: r[4], total: +r[5], pu: +r[6], fournisseur: r[7], saisi: ms_(r[8]) };
  });
  var prods = {}, fours = {};
  list.forEach(function (a) { if (a.produit) prods[a.produit] = { cat: a.cat, unite: a.unite }; if (a.fournisseur) fours[a.fournisseur] = 1; });
  return { list: list.slice(-60).reverse(), months: [month(cur), month(prev)], produits: prods, fournisseurs: Object.keys(fours), cats: CAT_ACHATS, alias: achAlias_() };
}

// ---------- Liste de courses (service et gérant) ----------

function addCourse_(p) {
  var article = String(p.article || '').trim().slice(0, 120);
  if (!article) throw new Error('Indique ce qu’il faut acheter.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { append_('courses', [[new Date(), article, String(p.detail || '').trim().slice(0, 200), 'À acheter', '']]); }
  finally { lock.releaseLock(); }
}
function doneCourse_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var row = Math.floor(+p.row), r = rows_('courses')[row - 2];
    if (!r || ms_(r[0]) !== +p.ts) throw new Error('Article introuvable, recharge la page.');
    sheet_('courses').getRange(row, 4, 1, 2).setValues([['Acheté', new Date()]]);
  } finally { lock.releaseLock(); }
}
function coursesInfo_() {
  var list = rows_('courses').map(function (r, i) { return { row: i + 2, ts: ms_(r[0]), article: r[1], detail: r[2], done: r[3] === 'Acheté', doneAt: ms_(r[4]) }; });
  return { todo: list.filter(function (x) { return !x.done; }), done: list.filter(function (x) { return x.done; }).slice(-10).reverse() };
}

// ---------- Équipe : un code à 4 chiffres par personne ----------

// Actions possibles sans être en service (les autres demandent d'avoir commencé son service).
var FREE_ = { scanIn: 1, state: 1, courses: 1, courseAdd: 1, courseDone: 1, chatSend: 1, chatRead: 1, avance: 1, demWithdraw: 1 };

function pin4_(v) {
  var s = String(v == null ? '' : v).trim();
  return /^\d{1,4}$/.test(s) ? ('0000' + s).slice(-4) : '';
}
function team_() {
  if (MEMO_ && TM_) return JSON.parse(TM_);
  var cache = CacheService.getScriptCache(), hit = cache.get('team');
  if (hit) { if (MEMO_) TM_ = hit; return JSON.parse(hit); }
  var list = [];
  try {
    list = rows_('equipe').map(function (r, i) {
      return { row: i + 2, nom: String(r[0] == null ? '' : r[0]).trim(), code: pin4_(r[1]), actif: !(r[2] === false || /^(false|faux|non|0)$/i.test(String(r[2]).trim())),
        added: ms_(r[3]), removed: ms_(r[4]) };
    }).filter(function (x) { return x.nom; });
  } catch (e) { list = []; }
  try { cache.put('team', JSON.stringify(list), 300); } catch (e) {}
  return list;
}
function activeTeam_() { return team_().filter(function (x) { return x.actif && x.code; }); }
function onDuty_(st, nom) { return !!(st.soiree && (st.soiree.team || []).some(function (x) { return x.nom === nom && !x.out; })); }

// Identifie la personne qui utilise l'appli service. Sans équipe enregistrée, l'appli reste ouverte (comme avant).
function who_(p) {
  var act = activeTeam_();
  var cache = CacheService.getScriptCache(), fails = +(cache.get('pinfail') || 0), locked = fails >= 8;
  var pin = pin4_(p._pin);
  // Après 8 codes faux en 5 min : seuls les codes déjà utilisés ces dernières heures passent encore (les appareils
  // en service continuent) ; tout autre code est refusé, juste ou faux, sur toutes les actions. Le gérant est prévenu par mail.
  var known = pin ? !!cache.get('pinok' + pin) : false;
  if (locked && !known) {
    if (p._pin) cache.put('pinfail', String(fails + 1), 300);
    throw new Error('CODE|Trop d’essais. Réessaie dans 5 minutes.');
  }
  var isAdmin = !!pin && pin === adminPin_();
  var me = pin && !isAdmin ? act.filter(function (x) { return x.code === pin; })[0] : null;
  if (!isAdmin && !me) {
    if (p._pin) {
      cache.put('pinfail', String(fails + 1), 300);
      if (fails + 1 === 8) { try { pinAlert_(); } catch (e) {} }
    }
    throw new Error(p._pin ? 'CODE|Code inconnu ou désactivé.' : 'CODE|Entre ton code à 4 chiffres.');
  }
  // Le code gérant n'est jamais mémorisé : pendant un blocage, il est refusé partout (la page gérant reste accessible).
  if (!locked && !known && !isAdmin) { try { cache.put('pinok' + pin, '1', 21600); } catch (e) {} }
  // Code gérant : pas de contrôle de position, peut passer le ménage.
  return isAdmin ? { nom: 'Gérant', admin: true } : { nom: me.nom };
}
// Mail au gérant quand les codes faux s'enchaînent (au plus un par heure).
function pinAlert_() {
  var cache = CacheService.getScriptCache();
  if (cache.get('pinmail')) return;
  cache.put('pinmail', '1', 3600);
  var to = String(paramsMap_()[P_EMAIL] || '').trim();
  if (!to) return;
  MailApp.sendEmail({ to: to, subject: 'YÄYA · 8 codes faux en 5 minutes sur l’appli service', name: 'YÄYA Lounge',
    body: 'Quelqu’un a tapé 8 codes faux en 5 minutes sur l’appli service.\n\nLes nouvelles connexions sont bloquées 5 minutes ; les appareils déjà en service continuent.\nSi ce n’est pas une erreur de l’équipe, change ton code gérant (onglet Équipe).' });
}
function login_(who) {
  var st = readState_();
  return { nom: who.nom, admin: !!who.admin, onDuty: who.admin ? true : who.nom ? onDuty_(st, who.nom) : true, state: st };
}
// Code gérant (4 chiffres), créé à la première utilisation, visible dans l'onglet Équipe.
function adminPin_() {
  var pr = props_(), c = pr.getProperty('ADMIN_PIN');
  if (!c) { c = newPin_(); pr.setProperty('ADMIN_PIN', c); }
  return c;
}

function teamCheckName_(nom, exceptRow) {
  if (!nom) throw new Error('Indique le prénom.');
  if (nom.length > 30) throw new Error('Prénom trop long (30 caractères maximum).');
  if (activeTeam_().some(function (x) { return x.row !== exceptRow && x.nom.toLowerCase() === nom.toLowerCase(); }))
    throw new Error('« ' + nom + ' » existe déjà. Ajoute l’initiale du nom pour les distinguer (ex. ' + nom + ' B.).');
}
// Code au hasard, différent des codes actifs, sans suite évidente (0000, 1234…).
function newPin_() {
  var used = activeTeam_().map(function (x) { return x.code; }).concat([props_().getProperty('ADMIN_PIN') || '']), bad = /^(\d)\1{3}$|^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)$/;
  for (var i = 0; i < 200; i++) {
    var c = ('0000' + Math.floor(Math.random() * 10000)).slice(-4);
    if (used.indexOf(c) < 0 && !bad.test(c)) return c;
  }
  throw new Error('Impossible de générer un code, réessaie.');
}
function teamWrite_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { TM_ = null; CacheService.getScriptCache().remove('team'); fn(sheet_('equipe')); }
  finally { TM_ = null; CacheService.getScriptCache().remove('team'); lock.releaseLock(); }
}
function teamAdd_(p) {
  var nom = String(p.nom || '').trim().replace(/\s+/g, ' ');
  teamWrite_(function (sh) {
    teamCheckName_(nom, 0);
    var r = sh.getLastRow() + 1;
    sh.getRange(r, 2).setNumberFormat('@');
    sh.getRange(r, 1, 1, 5).setValues([[nom, newPin_(), true, new Date(), '']]);
  });
}
function teamRow_(p) {
  var row = Math.floor(+p.row), x = team_().filter(function (y) { return y.row === row; })[0];
  if (!x || x.code !== pin4_(p.code)) throw new Error('Personne introuvable, recharge la page.');
  return x;
}
// Retirer une personne bloque son code tout de suite ; si elle est en service, son départ est enregistré.
function teamOff_(p) {
  teamWrite_(function (sh) {
    var x = teamRow_(p), now = Date.now();
    sh.getRange(x.row, 3, 1, 3).setValues([[false, x.added ? new Date(x.added) : '', new Date(now)]]);
    var st = readState_();
    if (onDuty_(st, x.nom)) {
      st.soiree.team.forEach(function (y) { if (y.nom === x.nom && !y.out) y.out = now; });
      append_('pointages', [[st.soiree.id, day_(st.soiree.opened), 'Départ', new Date(now), '', '', '', 'Retiré par le gérant', x.nom]]);
      st.rev++;
      writeState_(st);
    }
  });
}
function teamCode_(p) {
  teamWrite_(function (sh) { var x = teamRow_(p); sh.getRange(x.row, 2).setNumberFormat('@'); sh.getRange(x.row, 2).setValue(newPin_()); });
}

// Équipe et activité du mois : heures, soirées, retards, encaissé, annulations.
function equipeInfo_() {
  var cur = ym_(new Date()), st = readState_();
  var closeTs = {};
  rows_('soirees').forEach(function (r) { closeTs[r[0]] = ms_(r[3]); });
  var stats = {}, get = function (n) { return stats[n] || (stats[n] = { ms: 0, soirees: {}, retards: 0, retardMin: 0, enc: 0, annulN: 0, annulV: 0, open: false, av: 0, offN: 0, offV: 0, offRef: 0 }); };
  var arr = {};
  rows_('pointages').filter(function (r) { return r[8] && ym_(r[1]) === cur; })
    .sort(function (a, b) { return ms_(a[3]) - ms_(b[3]); })
    .forEach(function (r) {
      var n = String(r[8]), k = r[0] + '|' + n, s = get(n);
      if (r[2] === 'Arrivée') { arr[k] = ms_(r[3]); s.soirees[r[0]] = 1; if (+r[4] > 0) { s.retards++; s.retardMin += +r[4]; } }
      else if (r[2] === 'Départ' && arr[k]) { s.ms += ms_(r[3]) - arr[k]; delete arr[k]; }
    });
  Object.keys(arr).forEach(function (k) {
    var id = k.split('|')[0], n = k.slice(id.length + 1), s = get(n);
    var end = closeTs[id] || (st.soiree && st.soiree.id === id ? Date.now() : null);
    if (end) { s.ms += end - arr[k]; if (!closeTs[id]) s.open = true; }
  });
  rows_('paiements').forEach(function (r) { if (r[7] && ym_(r[2]) === cur) get(String(r[7])).enc += +r[6] || 0; });
  rows_('annul').forEach(function (r) { if (r[11] && ym_(r[1]) === cur) { var s = get(String(r[11])); s.annulN += +r[7] || 0; s.annulV += +r[9] || 0; } });
  demRows_().forEach(function (d) {
    if (!d.by || ym_(d.ts) !== cur) return;
    var s = get(d.by);
    if (d.type === 'Avance') { if (d.status === 'Validée') s.av = r2(s.av + d.amount); }
    else if (d.status !== 'Retirée') { s.offN++; s.offV = r2(s.offV + d.amount); if (d.status === 'Refusée') s.offRef++; }
  });
  var all = team_(), out = function (x) {
    var s = stats[x.nom] || get(x.nom);
    return { row: x.row, nom: x.nom, code: x.code, actif: x.actif, added: x.added, removed: x.removed, onDuty: onDuty_(st, x.nom),
      h: Math.round(s.ms / 360000) / 10, soirees: Object.keys(s.soirees).length, retards: s.retards, retardMin: s.retardMin,
      enc: r2(s.enc), annulN: s.annulN, annulV: r2(s.annulV), open: s.open, av: s.av, offN: s.offN, offV: s.offV, offRef: s.offRef };
  };
  var caMois = 0, hMois = 0, retM = 0;
  rows_('paiements').forEach(function (r) { if (ym_(r[2]) === cur) caMois += +r[6] || 0; });
  Object.keys(stats).forEach(function (n) { if (!/^Gérant/.test(n)) { hMois += stats[n].ms; retM += stats[n].retards; } });
  hMois = Math.round(hMois / 360000) / 10;
  var tot = { ca: r2(caMois), h: hMois, caH: hMois ? r2(caMois / hMois) : 0, retards: retM };
  return { tot: tot, admin: adminPin_(), month: cur, actifs: all.filter(function (x) { return x.actif; }).map(out), anciens: all.filter(function (x) { return !x.actif; }).slice(-10).reverse().map(out) };
}

// ---------- Objectifs (gérant) ----------
// CA = total encaissé (CB + espèces), TTC, hors offerts. Coûts du mois = salaires + charges fixes + achats saisis. Bénéfice = CA − coûts, avant impôts.

function ym_(d) { if (!(d instanceof Date) && !d) return ''; var x = paris_(d); return x ? x.getUTCFullYear() + '-' + p2_(x.getUTCMonth() + 1) : Utilities.formatDate(new Date(d), TZ, 'yyyy-MM'); }
function paramsMap_() { var pm = {}; rows_('params').forEach(function (r) { pm[String(r[0]).trim()] = r[1]; }); return pm; }
function daysIn_(d) { var x = new Date(d.getTime()); x.setDate(1); x.setMonth(x.getMonth() + 1); x.setDate(0); return x.getDate(); }
function readObj_() {
  var pm = paramsMap_(), o = {};
  Object.keys(OBJ_KEYS).forEach(function (k) { o[k] = r2(num_(pm[OBJ_KEYS[k]])); });
  return o;
}
// Objectifs d'une soirée : paliers du jour (minimum, objectif, top) et leviers.
function soireeObj_(ts) {
  var ctx = objCtx_(), p = paliers_(ctx, ymd_(ts || Date.now()));
  return { soir: p.obj, min: p.min, top: p.top, dow: p.dow, pan: ctx.o.pan, ppers: ctx.o.ppers, tetes: ctx.o.tetes, dess: ctx.o.dess, lev30: ctx.lev30 };
}
function objectifsInfo_() {
  var o = readObj_(), now = new Date(), cur = ym_(now);
  var prevD = new Date(now.getTime()); prevD.setDate(1); prevD.setDate(0);
  var prev = ym_(prevD), pays = rows_('paiements'), ach = rows_('achats'), soi = rows_('soirees');
  var mctx = matCtx_();
  var month = function (m) {
    var ca = r2(pays.filter(function (r) { return ym_(r[2]) === m; }).reduce(function (a, r) { return a + (+r[6] || 0); }, 0));
    var mFrom = m + '-01', mTo = m + '-31', mat = matCost_(mctx, linesBetween_(mFrom, mTo)), autres = achatsNonSuivis_(mctx, mFrom, mTo);
    var achats = r2(ach.filter(function (r) { return ym_(r[0]) === m; }).reduce(function (a, r) { return a + (+r[5] || 0); }, 0));
    var ss = soi.filter(function (r) { return ym_(r[1]) === m; }), tables = ss.reduce(function (a, r) { return a + (+r[8] || 0); }, 0);
    var caClos = ss.reduce(function (a, r) { return a + (+r[5] || 0); }, 0);
    var cats = {};
    ach.forEach(function (r) { if (ym_(r[0]) === m) { var k = String(r[2] || 'Autre'); cats[k] = r2((cats[k] || 0) + (+r[5] || 0)); } });
    return { m: m, ca: ca, achats: achats, cats: cats, mat: mat, autres: autres, benef: r2(ca - mat.tot - autres - (o.sal || 0) - (o.charges || 0)), soirees: ss.length, tables: tables,
      moySoiree: ss.length ? r2(caClos / ss.length) : 0, panier: tables ? r2(caClos / tables) : 0 };
  };
  var days = daysIn_(now), day = +Utilities.formatDate(now, TZ, 'dd');
  var ctx = objCtx_(), today = ctx.today, mon = weekStart_(Utilities.parseDate(today, TZ, 'yyyy-MM-dd').getTime() + 12 * 3600000);
  var caDay = {}, nDay = {};
  soi.forEach(function (r) { var k = r[1] ? ymd_(ms_(r[1])) : ''; if (k) { caDay[k] = (caDay[k] || 0) + (+r[5] || 0); nDay[k] = (nDay[k] || 0) + 1; } });
  var stNow = readState_();
  var liveDay = '';
  if (stNow.soiree) { var kk = ymd_(stNow.soiree.opened); liveDay = kk; caDay[kk] = (caDay[kk] || 0) + aggregates_(stNow.soiree.id).ca; }
  var week = [];
  for (var wi = 0; wi < 7; wi++) { var dd = addDays_(mon, wi), pp = paliers_(ctx, dd); pp.date = dd; pp.ca = r2(caDay[dd] || 0); pp.n = nDay[dd] || 0; pp.live = dd === liveDay; pp.past = dd < today; pp.today = dd === today; week.push(pp); }
  var mStart = cur + '-01', monthMin = 0, monthObj = 0, toDateMin = 0, toDateObj = 0;
  for (var mi = 0; mi < days; mi++) {
    var md = addDays_(mStart, mi), mp = paliers_(ctx, md);
    monthObj += mp.obj;
    if (md <= today) { toDateMin += mp.min; toDateObj += mp.obj; }
  }
  // Minimum du mois : CA déjà fait + ce qu'il reste à faire pour finir à 0 €.
  if ((o.charges || o.sal) && today.slice(0, 7) === cur) { var Rm = resteMois_(ctx, cur); monthMin = r2(Rm.ca + Rm.need); }
  // Soirs de match et soirs normaux sur 90 jours.
  var since = now.getTime() - 90 * 86400000, grp = function (isMatch) {
    var ss = soi.filter(function (r) { return ms_(r[1]) >= since && !!String(r[21] || '') === isMatch; });
    var ca = ss.reduce(function (a, r) { return a + (+r[5] || 0); }, 0), tb = ss.reduce(function (a, r) { return a + (+r[8] || 0); }, 0);
    var pe = ss.reduce(function (a, r) { return a + (+r[20] || 0); }, 0), withPers = ss.filter(function (r) { return +r[20] > 0; }).length;
    return { n: ss.length, ca: ss.length ? r2(ca / ss.length) : 0, panier: tb ? r2(ca / tb) : 0, pers: withPers ? Math.round(pe / withPers) : 0,
      parPers: pe ? r2(ss.filter(function (r) { return +r[20] > 0; }).reduce(function (a, r) { return a + (+r[5] || 0); }, 0) / pe) : 0 };
  };
  var pp = props_().getProperties();
  return { obj: o, soirAuto: soireeObj_(now.getTime()), cur: month(cur), prev: month(prev), day: day, days: days,
    today: paliers_(ctx, today), week: week, weights: ctx.w, learned: ctx.learned, taux: ctx.taux, tauxSource: ctx.tauxSource, tauxMat: ctx.tauxMat, tauxAutres: ctx.tauxAutres, n60: ctx.n60,
    gPlate: Math.round(mctx.per.plate * 1000), gQuasar: Math.round(mctx.per.quasar * 1000), prixGout: num_(paramsMap_()[P_PRIX_GOUT]) || 50, lev30: ctx.lev30, levMonth: levers_(cur + '-01', today),
    month: { min: r2(monthMin), obj: o.mois ? r2(o.mois) : r2(monthObj), toDateMin: r2(toDateMin), toDateObj: r2(toDateObj) },
    reste: o.charges || o.sal ? resteMois_(ctx, today.slice(0, 7)) : null,
    match: { oui: grp(true), non: grp(false) },
    jours: (function () {
      var s8 = now.getTime() - 56 * 86400000, J = [0, 1, 2, 3, 4, 5, 6].map(function (d) { return { dow: d, n: 0, ca: 0, pers: 0, caP: 0 }; });
      soi.forEach(function (r) {
        if (!r[1] || ms_(r[1]) < s8) return;
        var j = J[dow_(ymd_(ms_(r[1])))]; j.n++; j.ca += +r[5] || 0;
        if (+r[20] > 0) { j.pers += +r[20]; j.caP += +r[5] || 0; }
      });
      return J.map(function (j) { return { dow: j.dow, n: j.n, ca: j.n ? r2(j.ca / j.n) : 0, pers: j.n ? Math.round(j.pers / j.n * 10) / 10 : 0, ppers: j.pers ? r2(j.caP / j.pers) : 0 }; });
    })(),
    weekly: { sent: pp.WEEK_SENT || '', email: String(paramsMap_()[P_EMAIL] || ''), backup: +pp.LAST_BACKUP || null, backupUrl: pp.LAST_BACKUP_URL || '' } };
}
function setObjectifs_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_('params'), rows = rows_('params');
    Object.keys(OBJ_KEYS).forEach(function (k) {
      if (!(k in p)) return;
      var raw = String(p[k] == null ? '' : p[k]).trim().replace(/\s/g, '').replace(',', '.');
      if (raw !== '' && !(+raw >= 0)) throw new Error('Montant invalide : ' + OBJ_KEYS[k] + '.');
      var v = raw === '' ? '' : String(r2(+raw)), i = -1;
      rows.forEach(function (r, j) { if (String(r[0]).trim() === OBJ_KEYS[k]) i = j; });
      if (i >= 0) sh.getRange(i + 2, 2).setValue(v);
      else { var r = sh.getLastRow() + 1; sh.getRange(r, 1, 1, 2).setValues([[OBJ_KEYS[k], v]]); rows.push([OBJ_KEYS[k], v, '']); }
    });
  } finally { lock.releaseLock(); LD_ = null; CacheService.getScriptCache().remove('data'); }
}


// ---------- Soirée match (gérant, soirée fermée) ----------

function setMatch_(p) {
  var id = String(p.id || ''), label = p.on ? (String(p.label || '').trim().slice(0, 60) || 'Match') : '';
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var st = readState_();
    if (st.soiree && st.soiree.id === id) { st.soiree.match = label; st.rev++; writeState_(st); return; }
    var rows = rows_('soirees'), i = -1;
    rows.forEach(function (r, j) { if (r[0] === id) i = j; });
    if (i < 0) throw new Error('Soirée introuvable.');
    sheet_('soirees').getRange(i + 2, 22).setValue(label);
  } finally { lock.releaseLock(); }
}

// ---------- Récap de la semaine (lundi → dimanche) et sauvegarde ----------

// Dates à l'heure de Paris sans appeler Utilities à chaque ligne (v31 : comptes rendus 5 à 10× plus rapides sur un an de ventes).
// Le décalage avec UTC est lu une fois par heure (les changements d'heure tombent toujours sur une heure pile).
var OFF_ = {};
function off_(t) {
  var h = Math.floor(t / 3600000);
  if (OFF_[h] == null) { var s = Utilities.formatDate(new Date(h * 3600000), TZ, 'yyyy-MM-dd HH:mm').split(/[- :]/); OFF_[h] = Date.UTC(+s[0], +s[1] - 1, +s[2], +s[3], +s[4]) - h * 3600000; }
  return OFF_[h];
}
function p2_(n) { return n < 10 ? '0' + n : String(n); }
function paris_(v) { var t = v instanceof Date ? v.getTime() : +v; return isFinite(t) ? new Date(t + off_(t)) : null; }
function ymd_(ms) { var d = paris_(ms); return d ? d.getUTCFullYear() + '-' + p2_(d.getUTCMonth() + 1) + '-' + p2_(d.getUTCDate()) : Utilities.formatDate(new Date(ms), TZ, 'yyyy-MM-dd'); }
// Lundi de la semaine d'une date (format aaaa-mm-jj, heure de Paris).
function weekStart_(ms) {
  var s = ymd_(ms).split('-'), d = new Date(Date.UTC(+s[0], +s[1] - 1, +s[2])), dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}
function addDays_(ymd, n) { var s = ymd.split('-'), d = new Date(Date.UTC(+s[0], +s[1] - 1, +s[2] + n)); return d.toISOString().slice(0, 10); }
// À la fermeture : la soirée du dimanche boucle la semaine ; sinon on rattrape une semaine passée pas encore envoyée.
function dueWeek_(openedMs) {
  var mon = weekStart_(openedMs), sunday = addDays_(mon, 6) === ymd_(openedMs);
  var target = sunday ? mon : addDays_(mon, -7), sent = props_().getProperty('WEEK_SENT') || '';
  return target > sent ? target : '';
}
function inWeek_(v, mon) { if (!v) return false; var d = ymd_(ms_(v)); return d >= mon && d <= addDays_(mon, 6); }

function weekly_(mon, manual) {
  try { caisseRecalc_(); } catch (e) {}
  var to = String(paramsMap_()[P_EMAIL] || '').trim(), sun = addDays_(mon, 6), prevMon = addDays_(mon, -7);
  var soi = rows_('soirees'), cur = soi.filter(function (r) { return inWeek_(r[1], mon); }), prv = soi.filter(function (r) { return inWeek_(r[1], prevMon); });
  var pr0 = props_();
  // Semaine sans soirée (ex. avant la mise en service) : rien à envoyer en automatique.
  if (!manual && !cur.length) { if (mon > (pr0.getProperty('WEEK_SENT') || '')) pr0.setProperty('WEEK_SENT', mon); return ''; }
  var sum = function (rows, c) { return rows.reduce(function (a, r) { return a + (+r[c] || 0); }, 0); };
  var ca = r2(sum(cur, 5)), caPrev = r2(sum(prv, 5)), tables = sum(cur, 8), pers = sum(cur, 20);
  var persCa = r2(cur.filter(function (r) { return +r[20] > 0; }).reduce(function (a, r) { return a + (+r[5] || 0); }, 0));
  var octx = objCtx_(), objW = 0, minW = 0;
  for (var i = 0; i < 7; i++) { var pw = paliers_(octx, addDays_(mon, i)); objW += pw.obj; minW += pw.min; }
  objW = r2(objW); minW = r2(minW);
  var fmtD = function (v) { var d = ymd_(v).split('-'); return d[2] + '/' + d[1]; };
  var best = cur.slice().sort(function (a, b) { return (+b[5] || 0) - (+a[5] || 0); })[0];
  var mt = cur.filter(function (r) { return String(r[21] || ''); }), nm = cur.filter(function (r) { return !String(r[21] || ''); });
  var counts = {};
  rows_('lignes').filter(function (r) { return inWeek_(r[2], mon); }).forEach(function (r) { counts[r[6]] = (counts[r[6]] || 0) + (+r[8] || 0); });
  var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5).map(function (n, i) { return (i + 1) + '. ' + n + ' (' + counts[n] + ')'; });
  var achats = r2(rows_('achats').filter(function (r) { return inWeek_(r[0], mon); }).reduce(function (a, r) { return a + (+r[5] || 0); }, 0));
  // Heures par personne (arrivée → départ, ou fermeture de la soirée).
  var hours = hoursIn_(function (r) { return inWeek_(r[1], mon); }).hours;
  var h = Object.keys(hours).map(function (n) { return n + ' ' + (Math.round(hours[n] / 360000) / 10).toString().replace('.', ',') + ' h'; });
  var pct = function (a, b) { return b ? (a >= b ? '+' : '') + Math.round((a - b) / b * 100) + ' %' : ''; };
  var bk = null, bkErr = '';
  if (!manual) { try { bk = backup_(); } catch (e) { bkErr = String(e && e.message || e); } }
  var lines = [
    'Semaine du ' + fmtD(Utilities.parseDate(mon, TZ, 'yyyy-MM-dd')) + ' au ' + fmtD(Utilities.parseDate(sun, TZ, 'yyyy-MM-dd')),
    '',
    'CA : ' + eur_(ca) + (caPrev ? ' (semaine précédente : ' + eur_(caPrev) + ', ' + pct(ca, caPrev) + ')' : ''),
    objW ? 'Objectif de la semaine : ' + eur_(objW) + (minW ? ' (minimum ' + eur_(minW) + ')' : '') + ' · atteint à ' + Math.round(ca / objW * 100) + ' %' : 'Objectif de la semaine : non défini',
    cur.length + ' soirée' + (cur.length > 1 ? 's' : '') + ' · ' + tables + ' tables' + (pers ? ' · ' + pers + ' personnes' : ''),
    'Panier moyen : ' + eur_(tables ? ca / tables : 0) + ' par table' + (pers ? ' · ' + eur_(persCa / pers) + ' par personne' : ''),
    best ? 'Meilleure soirée : ' + fmtD(best[1]) + ' · ' + eur_(+best[5] || 0) + (String(best[21] || '') ? ' (' + best[21] + ')' : '') : '',
    mt.length ? 'Soirs de match : ' + mt.length + ' · CA moyen ' + eur_(sum(mt, 5) / mt.length) + (nm.length ? ' (soirs normaux : ' + eur_(sum(nm, 5) / nm.length) + ')' : '') : '',
    '',
    top.length ? 'Meilleures ventes : ' + top.join(', ') : '',
    'Offert fidélité : ' + eur_(sum(cur, 14)) + ' · conso patron : ' + eur_(sum(cur, 15)) + ' · annulations : ' + eur_(sum(cur, 16)),
    'Écart de caisse cumulé : ' + eur_(sum(cur, 13)),
    'Achats saisis : ' + eur_(achats),
    h.length ? 'Heures : ' + h.join(', ') : '',
    '',
    bk ? 'Sauvegarde du Google Sheets faite : « ' + bk.name + ' » dans ton Drive.' : bkErr ? 'Sauvegarde impossible : ' + bkErr : ''
  ].filter(function (l, i, a) { return l !== '' || (i > 0 && a[i - 1] !== ''); });
  var sent = false;
  if (to) {
    var subj = 'YÄYA · semaine du ' + fmtD(Utilities.parseDate(mon, TZ, 'yyyy-MM-dd')) + ' · ' + eur_(ca), html = '';
    try {
      html = weeklyHtml_({ mon: mon, cur: cur, ca: ca, caPrev: caPrev, tables: tables, pers: pers, persCa: persCa, objW: objW, minW: minW, octx: octx,
        mt: mt, nm: nm, counts: counts, achats: achats, hours: hours, bk: bk, bkErr: bkErr, sum: sum });
    } catch (e) { html = ''; }
    try {
      var opts = { to: to, subject: subj, body: lines.join('\n'), name: 'YÄYA Lounge' };
      if (html) opts.htmlBody = html;
      MailApp.sendEmail(opts); sent = true;
    } catch (e) {
      try { MailApp.sendEmail({ to: to, subject: subj, body: lines.join('\n') }); sent = true; } catch (e2) {}
    }
  }
  var pr = props_();
  if (mon > (pr.getProperty('WEEK_SENT') || '')) pr.setProperty('WEEK_SENT', mon);
  if (!to) return 'Récap de la semaine non envoyé : aucun email dans Paramètres.';
  return sent ? 'Récap de la semaine envoyé.' : 'Récap de la semaine non envoyé (erreur d’envoi).';
}

// ---------- Compte rendu du mois (envoyé à la fermeture de la dernière soirée du mois, ou rattrapé ensuite) ----------
function dueMonth_(openedMs) {
  var d = ymd_(openedMs), m = d.slice(0, 7), last = addDays_(d, 1).slice(0, 7) !== m;
  var prevD = new Date(Utilities.parseDate(m + '-01', TZ, 'yyyy-MM-dd').getTime() - 12 * 3600000), target = last ? m : ym_(prevD);
  var sent = props_().getProperty('MONTH_SENT') || '';
  // Première mise en service : on ne rattrape pas les mois d'avant.
  if (!sent) { props_().setProperty('MONTH_SENT', last ? ym_(prevD) : target); return last ? m : ''; }
  return target > sent ? target : '';
}
// Heures de l'équipe (arrivée → départ, ou fermeture de la soirée) pour les pointages retenus.
function hoursIn_(keep) {
  var closeTs = {}, arr = {}, hours = {}, late = {};
  rows_('soirees').forEach(function (r) { closeTs[r[0]] = ms_(r[3]); });
  rows_('pointages').filter(function (r) { return r[8] && !/^Gérant/.test(r[8]) && keep(r); }).sort(function (a, b) { return ms_(a[3]) - ms_(b[3]); }).forEach(function (r) {
    var k = r[0] + '|' + r[8];
    if (r[2] === 'Arrivée') { arr[k] = ms_(r[3]); if (+r[4] > 0) late[r[8]] = (late[r[8]] || 0) + 1; }
    else if (arr[k]) { hours[r[8]] = (hours[r[8]] || 0) + ms_(r[3]) - arr[k]; delete arr[k]; }
  });
  Object.keys(arr).forEach(function (k) { var id = k.split('|')[0], n = k.slice(id.length + 1); if (closeTs[id]) hours[n] = (hours[n] || 0) + closeTs[id] - arr[k]; });
  return { hours: hours, late: late };
}
function monthly_(m, manual) {
  var to = String(paramsMap_()[P_EMAIL] || '').trim(), pr = props_();
  var p0 = m.split('-'), prevM = ym_(new Date(+p0[0], +p0[1] - 1, 0, 12)), inM = function (v) { return v && ym_(v instanceof Date ? v : new Date(ms_(v))) === m; };
  var soi = rows_('soirees'), cur = soi.filter(function (r) { return inM(r[1]); }), prv = soi.filter(function (r) { return r[1] && ym_(r[1]) === prevM; });
  if (!manual && !cur.length) { if (m > (pr.getProperty('MONTH_SENT') || '')) pr.setProperty('MONTH_SENT', m); return ''; }
  var sum = function (rows, c) { return rows.reduce(function (a, r) { return a + (+r[c] || 0); }, 0); };
  var o = readObj_(), mctx = matCtx_(), from = m + '-01', toD = m + '-31';
  var ca = r2(rows_('paiements').filter(function (r) { return ym_(r[2]) === m; }).reduce(function (a, r) { return a + (+r[6] || 0); }, 0));
  var caPrev = r2(rows_('paiements').filter(function (r) { return ym_(r[2]) === prevM; }).reduce(function (a, r) { return a + (+r[6] || 0); }, 0));
  // CA des soirées du mois (fermées), à défaut celui des paiements.
  if (sum(cur, 5) > 0) ca = r2(sum(cur, 5));
  if (sum(prv, 5) > 0) caPrev = r2(sum(prv, 5));
  var mat = matCost_(mctx, linesBetween_(from, toD)), autres = achatsNonSuivis_(mctx, from, toD), fixes = r2((o.sal || 0) + (o.charges || 0));
  var cout = r2(mat.tot + autres + fixes), ben = r2(ca - cout), tables = sum(cur, 8), pers = sum(cur, 20);
  var persCa = r2(cur.filter(function (r) { return +r[20] > 0; }).reduce(function (a, r) { return a + (+r[5] || 0); }, 0));
  var octx = objCtx_(), nDays = daysIn_(Utilities.parseDate(from, TZ, 'yyyy-MM-dd')), objM = 0, minM = 0;
  for (var i = 0; i < nDays; i++) { var pw = paliers_(octx, addDays_(from, i)); objM += pw.obj; minM += pw.min; }
  objM = o.mois ? r2(o.mois) : r2(objM); minM = r2(minM);
  var mName = MOIS_[+p0[1] - 1] + ' ' + p0[0], fmtD = function (v) { return dateFr_(ms_(v), true); };
  var body = '', pct = function (a, b) { return b ? (a >= b ? '+' : '') + Math.round((a - b) / b * 100) + ' %' : ''; };
  // 1. Le mois
  var hero = '<div style="font-size:12px;color:' + C_.mute + ';">CA du mois</div><div style="font-size:40px;font-weight:800;letter-spacing:-1px;line-height:1.1;">' + eur_(ca) + '</div>';
  var sub = []; if (objM) sub.push(Math.round(ca / objM * 100) + ' % de l’objectif (' + eur_(objM) + ')'); if (caPrev) sub.push(pct(ca, caPrev) + ' vs ' + MOIS_[+prevM.slice(5, 7) - 1]);
  if (sub.length) hero += '<div style="font-size:14px;color:' + C_.mute + ';margin-top:4px;">' + sub.join(' · ') + '</div>';
  if (objM) hero += bar_(ca, objM, ca >= objM ? C_.ok : minM && ca < minM ? C_.bad : C_.gold) + paliersHtml_([['Minimum', minM ? eur_(minM) : '—', minM && ca >= minM], ['Objectif', eur_(objM), ca >= objM]]);
  hero += '<div style="height:16px;font-size:0;line-height:0;">&nbsp;</div>' + mkpis_([
    ['Soirées', String(cur.length), cur.length ? eur_(sum(cur, 5) / cur.length) + ' en moyenne' : '', ''],
    ['Tables', String(tables), pers ? pers + ' personnes' : '', ''],
    ['Panier / table', eur_(tables ? sum(cur, 5) / tables : 0), pers ? eur_(persCa / pers) + ' / pers.' : '', '']
  ]);
  body += card_('Le mois', hero);
  // 2. Résultat
  var mb = mat.by || {};
  body += card_('Résultat du mois', lignesHtml_([
    ['Chiffre d’affaires', eur_(ca), '', '', true],
    ['Matières consommées', '− ' + eur_(mat.tot), Object.keys(mb).map(function (k) { return k.toLowerCase() + ' ' + eur_(mb[k]); }).join(' · ') + (ca ? ' · ' + Math.round(mat.tot / ca * 100) + ' % du CA' : ''), '', false],
    ['Autres achats', '− ' + eur_(autres), 'produits non suivis en stock', '', false],
    ['Salaires', '− ' + eur_(o.sal || 0), '', '', false],
    ['Charges fixes', '− ' + eur_(o.charges || 0), '', '', false],
    ['Bénéfice du mois', eur_(ben), o.ben ? 'objectif ' + eur_(o.ben) : 'avant impôts et TVA', ben < 0 ? C_.bad : C_.ok, true]
  ]) + (mat.unknown.length ? small_('Prix d’achat inconnu (non compté) : ' + mat.unknown.slice(0, 6).map(h_).join(', ') + '.') : ''));
  // 3. Jours de la semaine
  var J = [0, 1, 2, 3, 4, 5, 6].map(function () { return { n: 0, ca: 0 }; }), best = null;
  cur.forEach(function (r) { var j = J[dow_(ymd_(ms_(r[1])))]; j.n++; j.ca += +r[5] || 0; if (!best || (+r[5] || 0) > (+best[5] || 0)) best = r; });
  var jmax = Math.max.apply(null, J.map(function (j) { return j.n ? j.ca / j.n : 0; }).concat([1]));
  body += card_('Jour par jour', lignesHtml_(J.map(function (j, d) { var v = j.n ? j.ca / j.n : 0; return [cap_(JOURS_[d]), j.n ? eur_(v) : '—', j.n ? j.n + ' soirée' + (j.n > 1 ? 's' : '') + ' · ' + eur_(j.ca) + ' au total' : '', v === jmax && j.n ? C_.ok : '', false]; }))
    + (best ? small_('Meilleure soirée : ' + fmtD(best[1]) + ' · ' + eur_(+best[5] || 0) + (String(best[21] || '') ? ' (match ' + h_(best[21]) + ')' : '') + '. CA moyen par soirée de chaque jour.') : ''));
  // 4. Ventes
  var counts = {}, tetes = 0, chichas = 0;
  rows_('lignes').filter(function (r) { return inM(r[2]); }).forEach(function (r) { var n = String(r[6]), q = +r[8] || 0; counts[n] = (counts[n] || 0) + q; if (/^Chicha/.test(n)) chichas += q; if (/^Tête/.test(n)) tetes += q; });
  var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 8);
  if (top.length) body += card_('Meilleures ventes', lignesHtml_(top.map(function (n) { return [h_(n), String(counts[n]), '', '', false]; })) + (chichas ? small_(chichas + ' chichas · ' + tetes + ' têtes en plus, soit ' + dec_(tetes / chichas * 10) + ' pour 10 chichas.') : ''));
  // 5. Contrôle
  var dem = demRows_(), cm = caisseMoves_();
  body += card_('Contrôle', lignesHtml_([
    ['Offert fidélité', eur_(sum(cur, 14)), '', '', false],
    ['Conso patron', eur_(sum(cur, 15)), '', '', false],
    ['Annulations', eur_(sum(cur, 16)), '', '', false],
    ['Promotions', eur_(promoRows_().filter(function (x) { return inM(x.date); }).reduce(function (a, x) { return a + x.a; }, 0)), '', '', false],
    ['Écart de caisse cumulé', eur_(sum(cur, 13)), cur.filter(function (r) { return Math.abs(+r[13] || 0) >= 5; }).length + ' soirée(s) à 5 € ou plus', sum(cur, 13) < 0 ? C_.bad : '', false],
    ['Avances accordées', eur_(dem.filter(function (d) { return d.type === 'Avance' && d.status === 'Validée' && inM(d.dts || d.ts); }).reduce(function (a, d) { return a + d.amount; }, 0)), '', '', false],
    ['Espèces récupérées', eur_(-cm.filter(function (x) { return x.type === CAISSE_TYPES_.retrait[0] && inM(x.ts); }).reduce(function (a, x) { return a + x.amt; }, 0)), '', '', false],
    ['Achats saisis', eur_(rows_('achats').filter(function (r) { return inM(r[0]); }).reduce(function (a, r) { return a + (+r[5] || 0); }, 0)), '', '', false]
  ]));
  // 6. Stock : indicateurs du mois (résultats des inventaires du lundi) et état actuel
  try {
    var store = keyStore_(), agg = {}, nInv = 0;
    Object.keys(store).forEach(function (mon) { var x = store[mon]; (x.res || []).forEach(function (r) { if (!r.to || ym_(new Date(r.to)) !== m) return; var a = agg[r.n] || (agg[r.n] = { n: r.n, u: r.u, e: 0, v: 0, bad: 0, k: 0 }); a.e += r.e > 0 ? r.e : 0; a.v += r.v > 0 && r.s !== 'ok' ? r.v : 0; a.k++; if (r.s !== 'ok') a.bad++; }); if ((x.res || []).length) nInv++; });
    var A = Object.keys(agg).map(function (k) { return agg[k]; }).sort(function (a, b) { return b.v - a.v; }), lostM = r2(A.reduce(function (a, x) { return a + x.v; }, 0));
    var sh2 = A.length ? mkpis_([['Contrôles', String(A.reduce(function (a, x) { return a + x.k; }, 0)), 'produits comptés dans le mois', ''], ['Écarts', String(A.reduce(function (a, x) { return a + x.bad; }, 0)), '', ''], ['Perte estimée', eur_(lostM), '', lostM > 0 ? C_.bad : C_.ok]])
      + '<div style="height:10px;font-size:0;line-height:0;">&nbsp;</div>' + lignesHtml_(A.slice(0, 10).map(function (x) { return [h_(x.n), x.bad ? (x.e > 0 ? 'manque ' + qtyTxt_(x.e, x.u) : 'écart') + (x.v ? ' · ' + eur_(x.v) : '') : '✓ conforme', x.k + ' contrôle' + (x.k > 1 ? 's' : ''), x.bad ? (x.v > 0 ? C_.bad : C_.warn) : C_.ok, false]; }))
      : '<div style="font-size:14px;">Aucun inventaire du lundi ce mois-ci : pas d’indicateur à comparer.</div>';
    body += card_('Stock · bilan du mois', sh2);
    body += stockCard_(stockIntel_(), { title: 'Stock · état actuel', full: true });
  } catch (e) {}
  // 7. Équipe
  var H = hoursIn_(function (r) { return inM(r[1]); }), hk = Object.keys(H.hours);
  if (hk.length) body += card_('Équipe', lignesHtml_(hk.map(function (n) { return [h_(n), dur_(H.hours[n]), H.late[n] ? H.late[n] + ' retard' + (H.late[n] > 1 ? 's' : '') : 'toujours à l’heure', '', false]; })) + (ca ? small_('CA par heure d’équipe : ' + eur_(ca / Math.max(1, hk.reduce(function (a, n) { return a + H.hours[n]; }, 0) / 3600000)) + '.') : ''));
  var foot = 'Compte rendu du mois envoyé automatiquement après la dernière soirée du mois. CA = encaissé CB + espèces, TTC, hors offerts. Bénéfice avant impôts et TVA.<br>YÄYA Lounge · 46 rue Jean Jaurès, Bezons';
  var html = mailShell_('Compte rendu du mois', cap_(mName), cur.length + ' soirée' + (cur.length > 1 ? 's' : '') + ' · ' + eur_(ca), body, foot);
  var text = ['YÄYA · ' + cap_(mName), 'CA : ' + eur_(ca) + (caPrev ? ' (' + pct(ca, caPrev) + ')' : ''), 'Bénéfice : ' + eur_(ben), cur.length + ' soirées · ' + tables + ' tables'].join('\n');
  var sent = false;
  if (to) { try { MailApp.sendEmail({ to: to, subject: 'YÄYA · ' + mName + ' · ' + eur_(ca) + ' · bénéfice ' + eur_(ben), body: text, htmlBody: html, name: 'YÄYA Lounge' }); sent = true; } catch (e) {} }
  if (m > (pr.getProperty('MONTH_SENT') || '')) pr.setProperty('MONTH_SENT', m);
  if (!to) return 'Compte rendu du mois non envoyé : aucun email dans Paramètres.';
  return sent ? 'Compte rendu du mois envoyé.' : 'Compte rendu du mois non envoyé (erreur d’envoi).';
}

// Sauvegarde : copie de tous les onglets dans un Google Sheets de ton Drive. Les 4 dernières sont gardées (la plus ancienne est réutilisée).
function backup_() {
  var ss = SpreadsheetApp.getActive(), pr = props_(), ids = String(pr.getProperty('BACKUPS') || '').split(',').filter(String);
  var name = ss.getName() + ' · sauvegarde du ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  var dest = null;
  if (ids.length >= 4) { var old = ids.shift(); try { dest = SpreadsheetApp.openById(old); } catch (e) { dest = null; } }
  if (dest) dest.rename(name); else dest = SpreadsheetApp.create(name);
  var prev = dest.getSheets();
  prev.forEach(function (sh, i) { sh.setName('_ancien_' + i); });
  ss.getSheets().forEach(function (sh) {
    if (sh.getName() === SH.etat) return;
    sh.copyTo(dest).setName(sh.getName());
  });
  prev.forEach(function (sh) { dest.deleteSheet(sh); });
  ids.push(dest.getId());
  pr.setProperty('BACKUPS', ids.join(','));
  pr.setProperty('LAST_BACKUP', String(Date.now()));
  pr.setProperty('LAST_BACKUP_URL', dest.getUrl());
  return { name: name, url: dest.getUrl() };
}


// ---------- Objectifs par jour : poids des jours, paliers, leviers ----------

function dow_(ymd) { var s = ymd.split('-'); return (new Date(Date.UTC(+s[0], +s[1] - 1, +s[2])).getUTCDay() + 6) % 7; } // 0 = lundi
function parsePoids_(v) {
  var w = String(v == null ? '' : v).split(/[;|]/).map(function (x) { return parseFloat(String(x).trim().replace(',', '.')); });
  return w.length === 7 && w.every(function (x) { return x > 0; }) ? w : POIDS_DEFAUT.slice();
}
// Contexte de calcul : objectifs, poids des jours (classement de départ corrigé par l'historique), coût des achats, leviers sur 30 jours.
function objCtx_() {
  var pm = paramsMap_(), o = readObj_(), base = parsePoids_(pm[P_POIDS]);
  var soi = rows_('soirees'), since = Date.now() - 56 * 86400000, by = [[], [], [], [], [], [], []], best = [0, 0, 0, 0, 0, 0, 0];
  soi.forEach(function (r) {
    if (!r[1] || ms_(r[1]) < since) return;
    var d = dow_(ymd_(ms_(r[1]))), ca = +r[5] || 0;
    by[d].push(ca); if (ca > best[d]) best[d] = ca;
  });
  var all = [].concat.apply([], by), avg = all.length ? all.reduce(function (a, b) { return a + b; }, 0) / all.length : 0;
  var w = base.map(function (b, d) {
    var n = Math.min(8, by[d].length);
    if (all.length < 7 || !avg || !n) return b;
    var learned = by[d].reduce(function (a, x) { return a + x; }, 0) / by[d].length / avg;
    return (n * learned + 3 * b) / (n + 3);
  });
  // Part des matières dans le CA sur 60 jours : sert au minimum (point mort).
  // Matières suivies (goûts, charbon, boissons) : mesurées sur les ventes dès 3 soirées.
  // Autres achats (cuisine, emballages…) : ajoutés dès 14 soirées, car ils se font par gros lots.
  var s60 = Date.now() - 60 * 86400000, f60 = ymd_(s60), t60 = ymd_(Date.now()), ca60 = 0;
  rows_('paiements').forEach(function (r) { if (ms_(r[2]) >= s60) ca60 += +r[6] || 0; });
  var n60 = soi.filter(function (r) { return r[1] && ms_(r[1]) >= s60; }).length, taux = 0, tauxMat = 0, tauxAutres = 0, mctx = null;
  if (ca60 > 0) {
    mctx = matCtx_();
    tauxMat = matCost_(mctx, linesBetween_(f60, t60)).tot / ca60;
    if (n60 >= 14) tauxAutres = achatsNonSuivis_(mctx, f60, t60) / ca60;
  }
  // Tant qu'il n'y a pas 14 soirées (prix d'achat incomplets, courses par gros lots), les matières comptent
  // au moins pour la part par défaut (25 % du CA, réglable dans Paramètres) ; ensuite, la part mesurée.
  var tauxDef = (num_(pm[P_TAUX_DEF]) || 25) / 100, mesure = tauxMat + tauxAutres;
  taux = Math.min(0.7, n60 >= 14 ? mesure : Math.max(mesure, tauxDef));
  var tauxSource = n60 >= 14 || mesure > tauxDef ? 'mesure' : 'defaut';
  var today = ymd_(Date.now());
  return { o: o, w: w, base: base, soi: soi, mctx: mctx || null, today: bizDay_(), reste: {}, learned: all.length >= 7, best: best, taux: taux, tauxSource: tauxSource, tauxDef: tauxDef, tauxMat: Math.round(tauxMat * 1000) / 1000, tauxAutres: Math.round(tauxAutres * 1000) / 1000, n60: n60, lev30: levers_(ymd_(Date.now() - 30 * 86400000), today), monthW: {} };
}
function monthW_(ctx, ymd) {
  var m = ymd.slice(0, 7);
  if (ctx.monthW[m] == null) {
    var s = 0, n = daysIn_(Utilities.parseDate(m + '-15', TZ, 'yyyy-MM-dd'));
    for (var i = 1; i <= n; i++) s += ctx.w[dow_(m + '-' + ('0' + i).slice(-2))];
    ctx.monthW[m] = s;
  }
  return ctx.monthW[m];
}
// Journée d'exploitation : une soirée qui finit à 4 h compte pour la veille (bascule à 6 h).
function bizDay_(ms) { return ymd_((ms || Date.now()) - 6 * 3600000); }
// Ce qu'il reste à faire sur le mois en cours pour finir à 0 € : salaires + charges fixes − marge déjà faite
// (CA des jours passés − matières consommées − autres achats), divisé par (1 − part des matières à venir).
function resteMois_(ctx, m) {
  if (ctx.reste[m]) return ctx.reste[m];
  var fixes = (ctx.o.charges || 0) + (ctx.o.sal || 0), from = m + '-01', y = addDays_(ctx.today, -1), ca = 0;
  ctx.soi.forEach(function (r) { var d = r[1] ? ymd_(ms_(r[1])) : ''; if (d >= from && d <= y) ca += +r[5] || 0; });
  if (!ctx.mctx) ctx.mctx = matCtx_();
  var mat = y >= from ? matCost_(ctx.mctx, linesBetween_(from, y)).tot : 0, autres = achatsNonSuivis_(ctx.mctx, from, ctx.today);
  var marge = r2(ca - mat - autres), need = Math.max(0, (fixes - marge) / (1 - ctx.taux)), sumW = 0, days = 0;
  for (var d = ctx.today; d.slice(0, 7) === m; d = addDays_(d, 1)) { sumW += ctx.w[dow_(d)]; days++; }
  ctx.reste[m] = { fixes: fixes, ca: r2(ca), mat: r2(mat), autres: autres, marge: marge, need: r2(need), sumW: sumW, days: days };
  return ctx.reste[m];
}
// Paliers d'un jour : minimum = part du point mort ((salaires + charges fixes) ÷ (1 − part des achats)), objectif = objectif du mois réparti selon le poids du jour, top = meilleur même jour des 8 dernières semaines.
function paliers_(ctx, ymd) {
  var d = dow_(ymd), share = ctx.w[d] / monthW_(ctx, ymd);
  // Objectif du mois réparti selon le poids du jour ; à défaut, objectif moyen par soirée modulé par le poids du jour.
  var obj = ctx.o.mois ? Math.round(ctx.o.mois * share) : ctx.o.soir ? Math.round(ctx.o.soir * ctx.w[d]) : 0;
  var fixes = (ctx.o.charges || 0) + (ctx.o.sal || 0);
  var min = fixes ? Math.round(fixes / (1 - ctx.taux) * share) : 0;
  // Aujourd'hui et les jours suivants du mois en cours : le minimum rattrape les jours faibles pour finir le mois à 0 €.
  if (fixes && ctx.today && ymd >= ctx.today && ymd.slice(0, 7) === ctx.today.slice(0, 7)) {
    var R = resteMois_(ctx, ymd.slice(0, 7));
    min = R.sumW ? Math.round(R.need * ctx.w[d] / R.sumW) : 0;
  }
  var top = obj ? Math.round(Math.max(obj * 1.25, ctx.best[d] || 0)) : Math.round(ctx.best[d] || 0);
  return { dow: d, w: Math.round(ctx.w[d] * 100) / 100, min: min, obj: obj, top: top };
}
// Leviers entre deux dates (incluses) : panier par personne, têtes en plus pour 10 chichas, desserts pour 10 tables.
// Indicateurs d'une période (du « from » au « to », jours inclus) ou d'une seule soirée (sid) :
// volume (clients), panier, ventes en plus des chichas, offerts et annulations, productivité de l'équipe.
function kpis_(from, to, sid) {
  var data = loadData_(), art = {};
  data.carte.forEach(function (x) { art[x.n] = x; });
  var inR = function (v) { var d = v ? ymd_(ms_(v)) : ''; return d >= from && d <= to; };
  var ok = function (rSid, rDate) { return sid ? rSid === sid : inR(rDate); };
  var ventes = rows_('ventes').filter(function (r) { return ok(r[1], r[2]); });
  var paid = ventes.filter(function (r) { return +r[8] > 0; }), tables = paid.length;
  var wp = ventes.filter(function (r) { return +r[10] > 0; }), pers = wp.reduce(function (a, r) { return a + (+r[10] || 0); }, 0), caP = wp.reduce(function (a, r) { return a + (+r[8] || 0); }, 0);
  var caT = ventes.reduce(function (a, r) { return a + (+r[8] || 0); }, 0);
  var durs = paid.map(function (r) { return (ms_(r[5]) - ms_(r[4])) / 60000; }).filter(function (m) { return m > 0 && m < 720; });
  var chichas = 0, tetes = 0, dess = 0, tot = 0, chi = 0;
  rows_('lignes').forEach(function (r) {
    if (!ok(r[1], r[2])) return;
    var a = art[r[6]], q = +r[8] || 0, m = +r[10] || 0, cat = a ? a.cat : String(r[5] || '');
    tot += m;
    if (cat === 'Chichas') { chi += m; if (/^t[êe]te/i.test(String(r[6]))) tetes += q; else chichas += q; }
    if (cat === 'Desserts' || (a && a.o.indexOf('dessert') >= 0)) dess += q;
  });
  // Offerts et annulations : même périmètre que le bloc du récap.
  var fu = 0, add = function (key, cs, cd, cv) { rows_(key).forEach(function (r) { if (ok(r[cs], r[cd])) fu += +r[cv] || 0; }); };
  try { add('annul', 0, 1, 9); add('cadeaux', 1, 2, 8); add('patron', 0, 1, 8); } catch (e) {}
  try { promoRows_().forEach(function (x) { if (sid ? x.sid === sid : inR(x.ts)) fu += x.a || 0; }); } catch (e) {}
  try { demRows_().forEach(function (d) {
    if (d.type === 'Avance' || d.type === 'Conso offerte' || d.status === 'Retirée' || (d.status === 'Refusée' && d.pay !== 'Après encaissement')) return;
    if (sid ? d.sid === sid : inR(d.ts)) fu += d.amount || 0;
  }); } catch (e) {}
  // Heures de l'équipe (pointages), pour le CA par heure de service.
  var closeTs = {}, nSoir = 0, st = null;
  rows_('soirees').forEach(function (r) { closeTs[r[0]] = ms_(r[3]); if (ok(r[0], r[1])) nSoir++; });
  var arr = {}, hms = 0;
  try {
    rows_('pointages').filter(function (r) { return r[8] && !/^Gérant/.test(String(r[8])) && ok(r[0], r[1]); })
      .sort(function (a, b) { return ms_(a[3]) - ms_(b[3]); })
      .forEach(function (r) {
        var k = r[0] + '|' + r[8];
        if (r[2] === 'Arrivée') { if (!arr[k]) arr[k] = ms_(r[3]); }
        else if (r[2] === 'Départ' && arr[k]) { hms += ms_(r[3]) - arr[k]; delete arr[k]; }
      });
    Object.keys(arr).forEach(function (k) {
      var id = k.split('|')[0], end = closeTs[id];
      if (!end) { st = st || readState_(); if (st.soiree && st.soiree.id === id) end = Date.now(); }
      if (end) hms += end - arr[k];
    });
  } catch (e) {}
  if (sid && !nSoir) nSoir = 1;
  var h = Math.round(hms / 360000) / 10, r1 = function (v) { return Math.round(v * 10) / 10; };
  return { pan: tables ? r2(caT / tables) : 0, ppers: pers ? r2(caP / pers) : 0, tetes: chichas ? r1(tetes / chichas * 10) : 0, dess: tables ? r1(dess / tables * 10) : 0, chichas: chichas, tables: tables,
    soirees: nSoir, ca: r2(caT), pers: pers, persSoir: nSoir ? r1(pers / nSoir) : 0, caSoir: nSoir ? r2(caT / nSoir) : 0,
    hors: tot ? Math.round((tot - chi) / tot * 100) : 0, horsV: r2(tot - chi), fuites: r2(fu), fuitesPct: caT ? r1(fu / caT * 100) : 0,
    heures: h, caH: h ? r2(caT / h) : 0, duree: durs.length ? Math.round(durs.reduce(function (a, b) { return a + b; }, 0) / durs.length) : 0 };
}
function levers_(from, to) { return kpis_(from, to); }

// ---------- Stock ----------

function stockProds_() {
  var str = function (v) { return String(v == null ? '' : v).trim(); };
  try {
    return rows_('stock').map(function (r, i) {
      var arts = str(r[3]).split(/[,;]/).map(function (x) {
        x = x.trim();
        var m = x.match(/^(.*?)\s*[×x*]\s*(\d+(?:[.,]\d+)?)$/);
        return m ? { n: m[1].trim(), f: num_(m[2]) } : { n: x, f: 1 };
      }).filter(function (e) { return e.n && e.f > 0; });
      var p = { row: i + 2, n: str(r[0]), type: str(r[1]) || 'Autre', unite: str(r[2]) || 'unité', arts: arts, articles: arts.map(function (e) { return e.n; }),
        choix: str(r[4]), qty: num_(r[5]), seuil: num_(r[6]), actif: !(r[7] === false || /^(false|faux|non|0)$/i.test(str(r[7]))), cout: num_(r[8]), rate: null };
      // Quantité par portion vide (hors goûts) : apprise entre deux inventaires, sinon d'achat en achat.
      p.learn = arts.length > 0 && !p.qty && p.type !== 'Goût';
      return p;
    }).filter(function (x) { return x.n; });
  } catch (e) { return []; }
}
// Goût par tête (en kg) : 15 g pour une tête plate, 20 g pour une Quasar (Rayane, 4 nov.).
function perTete_() {
  var pm = paramsMap_(), plate0 = (num_(pm[P_G_PLATE]) || 15) / 1000, quasar0 = (num_(pm[P_G_QUASAR]) || 20) / 1000, plate = plate0, quasar = quasar0, cal = null;
  // Dosage appris (v30) : réel des inventaires de goûts ÷ têtes vendues ; utilisé dès 40 têtes, s'il reste vraisemblable (½ à 2 fois le réglage).
  try { cal = JSON.parse(props_().getProperty('GOUT_CAL') || 'null'); } catch (e) { cal = null; }
  if (cal && cal.g > 0 && cal.eq >= 40 && cal.g / 1000 >= plate0 / 2 && cal.g / 1000 <= plate0 * 2) { plate = cal.g / 1000; quasar = plate * quasar0 / plate0; }
  else cal = null;
  var f = function (n) { return /quasar/i.test(String(n || '')) ? quasar : plate; };
  f.plate = plate; f.quasar = quasar; f.plate0 = plate0; f.quasar0 = quasar0; f.cal = cal;
  return f;
}
// Contexte de coût : produits suivis et coût unitaire (goût au prix du kilo ; sinon dernier prix d'achat, à défaut le coût noté dans l'onglet Stock).
function matCtx_() {
  var pm = paramsMap_(), prixGout = num_(pm[P_PRIX_GOUT]) || 50, art = {}, lastPu = {};
  loadData_().carte.forEach(function (x) { art[x.n] = x; });
  var mv = stockMoves_(false), achats = mv.achRows;
  achats.forEach(function (r) { var n = String(r[1]).trim(), pu = +r[6] || 0; if (pu > 0) lastPu[n] = pu; });
  var prods = stockProds_().filter(function (p) { return p.actif; });
  learnRates_(prods, mv, art);
  prods.forEach(function (p) { p.cost = lastPu[p.n] || p.cout || (p.type === 'Goût' ? prixGout : 0); });
  // Produits dont la consommation se calcule à la vente : leurs achats ne sont pas comptés une deuxième fois.
  var names = {}; prods.forEach(function (p) { if (consoOk_(p)) names[p.n] = 1; });
  return { prods: prods, art: art, per: perTete_(), names: names, achats: achats };
}
// Lignes consommées (vendues, offertes, conso patron) entre deux dates de soirée incluses (aaaa-mm-jj).
function linesBetween_(from, to, sid) {
  var out = [], inR = function (v) { var d = v ? ymd_(ms_(v)) : ''; return d >= from && d <= to; };
  rows_('lignes').forEach(function (r) { if (sid ? r[1] === sid : inR(r[2])) out.push({ n: String(r[6]), d: String(r[7] || '').split(' · '), q: +r[8] || 0 }); });
  rows_('patron').forEach(function (r) { if (sid ? r[0] === sid : inR(r[1])) out.push({ n: String(r[4]), d: String(r[5] || '').split(' · '), q: +r[6] || 0 }); });
  return out;
}
// Coût des matières suivies en stock pour des lignes consommées.
function matCat_(p) {
  return p.type === 'Goût' ? 'Goûts' : /charbon/i.test(p.n) ? 'Charbon' : p.type === 'Boisson' ? 'Boissons'
    : /^(Frais|Surgelé|Épicerie)$/.test(p.type) ? 'Cuisine' : p.type === 'Consommable' ? 'Consommables' : 'Autres';
}
function matCost_(ctx, lines) {
  var tot = 0, by = {}, unknown = {}, learning = {};
  lines.forEach(function (l) {
    ctx.prods.forEach(function (p) {
      if (p.learn && !p.rate) { if (consoF_(p, l.n, l.d, ctx.art)) learning[p.n] = 1; return; }
      var c = conso_(p, l.n, l.d, l.q, ctx.art, ctx.per);
      if (!c) return;
      if (!p.cost) { unknown[p.n] = 1; return; }
      var k = matCat_(p);
      by[k] = (by[k] || 0) + c * p.cost; tot += c * p.cost;
    });
  });
  Object.keys(by).forEach(function (k) { by[k] = r2(by[k]); });
  return { tot: r2(tot), by: by, unknown: Object.keys(unknown), learning: Object.keys(learning) };
}
// Marge par produit sur 60 jours : prix moyen vendu − coût moyen des matières (goût, charbon, boisson comprise, ingrédients).
function margesInfo_() {
  var ctx = matCtx_(), since = ymd_(Date.now() - 60 * 86400000), by = {}, order = [];
  rows_('lignes').forEach(function (r) {
    var d = r[2] ? ymd_(ms_(r[2])) : '', n = String(r[6]), q = +r[8] || 0;
    if (d < since || !q) return;
    var x = by[n];
    if (!x) { x = by[n] = { q: 0, ca: 0, cost: 0, cat: String(r[5] || ''), unknown: {}, learning: {} }; order.push(n); }
    var c = matCost_(ctx, [{ n: n, d: String(r[7] || '').split(' · '), q: q }]);
    x.q += q; x.ca += +r[10] || 0; x.cost += c.tot;
    c.unknown.forEach(function (u) { x.unknown[u] = 1; });
    c.learning.forEach(function (u) { x.learning[u] = 1; });
  });
  return order.map(function (n) {
    var x = by[n], prix = x.ca / x.q, cout = x.cost / x.q;
    return { n: n, cat: x.cat, q: x.q, prix: r2(prix), cout: r2(cout), marge: r2(prix - cout), pct: prix ? Math.round((prix - cout) / prix * 100) : 0,
      inconnu: Object.keys(x.unknown), apprendre: Object.keys(x.learning) };
  });
}
// Achats de produits non suivis en stock (cuisine, emballages…) : comptés à l'achat.
function achatsNonSuivis_(ctx, from, to) {
  return r2(ctx.achats.filter(function (r) { var d = r[0] ? ymd_(ms_(r[0])) : ''; return d >= from && d <= to && !ctx.names[String(r[1]).trim()]; })
    .reduce(function (a, r) { return a + (+r[5] || 0); }, 0));
}

// Une ligne vendue utilise-t-elle ce produit ? Renvoie le facteur (0 si non). Un article de la recette peut être
// l'article vendu, sa catégorie, ou un choix d'une formule (ex. « Carbonara » dans Duo Pasta, « Crêpe Oreo » en dessert).
function consoF_(p, n, det, art) {
  var a = art[n], arts = p.arts || [], f = 1;
  if (arts.length) {
    f = 0;
    for (var i = 0; i < arts.length; i++) { var e = arts[i]; if (e.n === n || (a && e.n === a.cat) || det.indexOf(e.n) >= 0) { f = e.f; break; } }
    if (!f) return 0;
  }
  if (p.choix && !(n === p.choix || det.indexOf(p.choix) >= 0)) return 0;
  if (!arts.length && !p.choix) return 0;
  return f;
}
// Quantité de stock consommée par une ligne vendue (article, détails, quantité).
function conso_(p, n, det, q, art, perTete) {
  var f = consoF_(p, n, det, art);
  if (!f) return 0;
  if (typeof perTete === 'function') perTete = perTete(n);
  var u = p.qty || (p.type === 'Goût' ? perTete : p.rate || 0);
  return u * q * f;
}
// Mouvements de stock : sorties (lignes, conso patron, tables ouvertes si demandé), achats, inventaires.
function stockMoves_(withOpen) {
  var outs = [];
  rows_('lignes').forEach(function (r) { outs.push({ ts: ms_(r[3]), n: String(r[6]), d: String(r[7] || '').split(' · '), q: +r[8] || 0 }); });
  rows_('patron').forEach(function (r) { outs.push({ ts: ms_(r[2]), n: String(r[4]), d: String(r[5] || '').split(' · '), q: +r[6] || 0 }); });
  if (withOpen) {
    var st = readState_();
    Object.keys(st.tables || {}).forEach(function (k) { (st.tables[k].lines || []).forEach(function (l) { outs.push({ ts: Date.now(), n: l.n, d: l.d || [], q: l.q }); }); });
  }
  var rows = rows_('achats');
  var achats = rows.map(function (r) { return { ts: ms_(r[8]) || ms_(r[0]), n: String(r[1]).trim(), q: +r[3] || 0, pu: +r[6] || 0 }; });
  var inv = rows_('inventaires').map(function (r) { return { ts: ms_(r[0]), n: String(r[1]).trim(), c: +r[2] || 0, by: String(r[7] || '') }; }).sort(function (a, b) { return a.ts - b.ts; });
  return { outs: outs, achats: achats, achRows: rows, inv: inv };
}
// Quantité par portion apprise, deux méthodes :
// 1. Entre deux inventaires (la plus juste) : (inventaire de départ + achats − inventaire d'arrivée) ÷ portions vendues entre les deux.
//    Départ = le plus ancien inventaire des 60 jours précédant le dernier (plus de ventes = valeur plus stable).
// 2. Sinon, d'achat en achat (Rayane, 4 nov.) : on rachète quand c'est vide, donc le stock d'avant un achat a servi à toutes
//    les portions vendues depuis l'achat précédent. Départ : le dernier inventaire avant le premier achat ; sans inventaire,
//    on suppose la même quantité que ce premier achat (« un sachet plein a fait toutes les frites vendues jusqu'ici »).
function learnRates_(prods, mv, art) {
  prods.forEach(function (p) {
    if (!p.learn) return;
    var portionsIn = function (t0, t1) { return mv.outs.reduce(function (s, o) { return o.ts > t0 && o.ts <= t1 ? s + o.q * consoF_(p, o.n, o.d, art) : s; }, 0); };
    var mine = mv.inv.filter(function (x) { return x.n === p.n; }), last = mine[mine.length - 1];
    if (mine.length >= 2) {
      var first = mine.filter(function (x) { return x.ts < last.ts && x.ts >= last.ts - 60 * 86400000; })[0] || mine[mine.length - 2];
      var real = first.c + mv.achats.reduce(function (s, a) { return a.n === p.n && a.ts > first.ts && a.ts <= last.ts ? s + a.q : s; }, 0) - last.c;
      var portions = portionsIn(first.ts, last.ts);
      p.rateInfo = { src: 'inv', from: first.ts, to: last.ts, portions: portions, real: Math.round(real * 1000) / 1000 };
      if (portions > 0 && real > 0) { p.rate = real / portions; return; }
    }
    var buys = mv.achats.filter(function (a) { return a.n === p.n && a.q > 0; }).sort(function (a, b) { return a.ts - b.ts; });
    if (!buys.length) return;
    var lastB = buys[buys.length - 1], i0 = 0;
    while (i0 < buys.length - 1 && buys[i0].ts < lastB.ts - 60 * 86400000) i0++;
    var b0 = buys[i0], prevB = i0 > 0 ? buys[i0 - 1] : null;
    var invB = mine.filter(function (x) { return x.ts < b0.ts && (!prevB || x.ts > prevB.ts); }).pop();
    var t = 0, carry = 0, hyp = false;
    if (invB) { t = invB.ts; carry = invB.c; }
    else if (prevB) { t = prevB.ts; carry = prevB.q; }
    else if (portionsIn(0, b0.ts) > 0) { carry = b0.q; hyp = true; }
    var s0T = t, s0C = carry, used = 0, por = 0, iv = [];
    for (var i = i0; i < buys.length; i++) {
      var pj = portionsIn(t, buys[i].ts);
      // Rien vendu depuis l'achat précédent : ce stock n'a pas servi, il s'ajoute au suivant.
      if (pj > 0) { iv.push({ to: buys[i].ts, used: carry, por: pj }); used += carry; por += pj; carry = 0; }
      carry += buys[i].q; t = buys[i].ts;
    }
    // Un inventaire compté après le départ : il remplace l'hypothèse « vide à chaque achat ».
    var endInv = mine.filter(function (x) { return x.ts > s0T && x.ts > b0.ts; }).pop();
    if (endInv) {
      var u2 = s0C + buys.reduce(function (s, a) { return a.ts > s0T && a.ts <= endInv.ts ? s + a.q : s; }, 0) - endInv.c, p2 = portionsIn(s0T, endInv.ts);
      if (p2 > 0 && u2 > 0) { used = u2; por = p2; }
    }
    // Départ supposé (sans inventaire) : il faut au moins 5 portions pour s'y fier ; avant, l'achat compte comme une dépense.
    if (por > 0 && used > 0 && (!hyp || por >= 5)) {
      p.rate = used / por;
      p.rateInfo = { src: endInv ? 'inv' : 'achats', to: endInv ? endInv.ts : lastB.ts, portions: por, real: Math.round(used * 1000) / 1000, hyp: hyp };
    }
    // Dernier achat épuisé comparé aux précédents : beaucoup plus (ou moins) de portions que d'habitude = activité inhabituelle.
    if (iv.length >= 3) {
      var lst = iv[iv.length - 1], prv = iv.slice(0, -1), uU = prv.reduce(function (a, x) { return a + x.used; }, 0), uP = prv.reduce(function (a, x) { return a + x.por; }, 0);
      if (lst.por >= 5 && uP > 0 && uU > 0) p.ivTrend = { to: lst.to, recent: lst.used / lst.por, usual: uU / uP, por: lst.por, used: lst.used, usualPor: Math.round(lst.used / (uU / uP)) };
    }
  });
}
// Le coût d'un produit est-il calculable à chaque vente ?
function consoOk_(p) { return (p.arts.length > 0 || !!p.choix) && (p.qty > 0 || p.type === 'Goût' || p.rate > 0); }
function stockInfo_() {
  var pm = paramsMap_(), tol = num_(pm[P_TOL]) || 10, prixGout = num_(pm[P_PRIX_GOUT]) || 50, perT = perTete_(), perKg = Math.round(1 / perT.plate);
  var data = loadData_(), art = {};
  data.carte.forEach(function (x) { art[x.n] = x; });
  var prods = stockProds_().filter(function (p) { return p.actif; });
  // Toutes les sorties : lignes encaissées, conso patron, tables encore ouvertes.
  var mv = stockMoves_(true), outs = mv.outs, achats = mv.achats, inv = mv.inv;
  learnRates_(prods, mv, art);
  var since30 = Date.now() - 30 * 86400000, since7 = Date.now() - 7 * 86400000, tetes30 = {}, totalTetes30 = 0;
  // Décompte (Rayane, 13 nov.) : sorties de chaque goût et de chaque boisson sur la dernière soirée, 7 jours et 30 jours.
  var S1 = null;
  try {
    var stN = readState_();
    if (stN.soiree) S1 = { from: stN.soiree.opened - 1, to: Date.now() + 1, cur: true, opened: stN.soiree.opened };
    else {
      var lastSo = rows_('soirees').filter(function (r) { return r[0] && ms_(r[2]); }).sort(function (x, y) { return ms_(y[2]) - ms_(x[2]); })[0];
      if (lastSo) S1 = { from: ms_(lastSo[2]) - 1, to: (ms_(lastSo[3]) || Date.now()) + 60000, cur: false, opened: ms_(lastSo[2]) };
    }
  } catch (e) { S1 = null; }
  outs.forEach(function (o) {
    var a = art[o.n];
    if (!a || a.cat !== 'Chichas' || o.ts < since30) return;
    totalTetes30 += o.q;
  });
  var list = prods.map(function (p) {
    var per = perT;
    var sumOut = function (t0, t1) { return outs.reduce(function (s, o) { return o.ts > t0 && o.ts <= t1 ? s + conso_(p, o.n, o.d, o.q, art, per) : s; }, 0); };
    var sumIn = function (t0, t1) { return achats.reduce(function (s, a) { return a.n === p.n && a.ts > t0 && a.ts <= t1 ? s + a.q : s; }, 0); };
    var tetesOf = function (t0, t1) { return p.type === 'Goût' ? outs.reduce(function (s, o) { return o.ts > t0 && o.ts <= t1 && conso_(p, o.n, o.d, o.q, art, 1) ? s + o.q : s; }, 0) : 0; };
    var mine = inv.filter(function (x) { return x.n === p.n; }), last = mine[mine.length - 1], prev = mine[mine.length - 2];
    var now = Date.now() + 1, t0 = last ? last.ts : 0;
    var theo = (last ? last.c : 0) + sumIn(t0, now) - sumOut(t0, now);
    var lastPrice = achats.filter(function (a) { return a.n === p.n && a.pu > 0; }).pop();
    var pu = lastPrice ? lastPrice.pu : p.cout || (p.type === 'Goût' ? prixGout : 0);
    var puSource = lastPrice ? 'achat' : p.cout ? 'manuel' : p.type === 'Goût' ? 'kilo' : '';
    var period = null;
    if (prev && last && (!p.learn || p.rate)) {
      var real = prev.c + sumIn(prev.ts, last.ts) - last.c, th = sumOut(prev.ts, last.ts), tt = tetesOf(prev.ts, last.ts);
      period = { from: prev.ts, to: last.ts, real: Math.round(real * 1000) / 1000, theo: Math.round(th * 1000) / 1000,
        pct: th ? Math.round((real - th) / th * 1000) / 10 : null, tetes: tt, rend: p.type === 'Goût' && real > 0 ? Math.round(tt / real * 10) / 10 : null };
      period.red = period.pct != null && Math.abs(period.pct) > tol;
    }
    var t30 = tetesOf(since30, now), r3 = function (v) { return Math.round(v * 1000) / 1000; };
    var isG = p.type === 'Goût', isB = p.type === 'Boisson';
    var dec = !(isG || isB) ? null : {
      s: S1 ? (isG ? tetesOf(S1.from, S1.to) : r3(sumOut(S1.from, S1.to))) : 0,
      j7: isG ? tetesOf(since7, now) : r3(sumOut(since7, now)),
      j30: isG ? t30 : r3(sumOut(since30, now)),
      // Boissons : part servie avec une chicha (comprise) sur 30 jours.
      inc: isB ? r3(outs.reduce(function (s, o) { var a = art[o.n]; return o.ts > since30 && o.ts <= now && a && a.cat === 'Chichas' ? s + conso_(p, o.n, o.d, o.q, art, per) : s; }, 0)) : null,
      // Goûts : têtes encore possibles avec le stock connu (dosage tête plate).
      left: isG && theo > 0 ? Math.floor(theo / perT.plate + 0.001) : null
    };
    return { row: p.row, n: p.n, type: p.type, unite: p.unite, seuil: p.seuil, theo: Math.round(theo * 1000) / 1000, value: r2(Math.max(0, theo) * pu), pu: pu,
      out30: Math.round(sumOut(since30, now) * 1000) / 1000, tetes30: t30, share30: totalTetes30 ? Math.round(t30 / totalTetes30 * 100) : 0,
      dec: dec, last: last ? { ts: last.ts, c: last.c, by: last.by } : null, period: period, low: p.seuil > 0 && theo <= p.seuil, auto: consoOk_(p),
      puSource: puSource, cout: p.cout || '', learn: p.learn, fixed: p.qty > 0, qty: p.qty || null, ivTrend: p.ivTrend || null,
      chicha: p.type === 'Goût' || /charbon|alu/i.test(p.n) || p.arts.some(function (e) { return e.n === 'Chichas' || (art[e.n] && art[e.n].cat === 'Chichas'); }), rate: p.rate ? Math.round(p.rate * 10000) / 10000 : null, rateInfo: p.rateInfo || null, recette: p.arts.map(function (e) { return e.n + (e.f !== 1 ? ' ×' + e.f : ''); }).join(', ') };
  });
  // Goûts et boissons servis mais pas suivis en stock : comptés quand même, pour que le décompte soit complet.
  var known = {}, grpOf = {}, grpHas = {}, ns = {};
  prods.forEach(function (p) { known[p.n] = 1; if (p.choix) known[p.choix] = 1; p.arts.forEach(function (e) { known[e.n] = 1; }); });
  Object.keys(data.options || {}).forEach(function (g) { (data.options[g].choices || []).forEach(function (c) { grpOf[c.n] = data.options[g].label || g; if (known[c.n]) grpHas[data.options[g].label || g] = 1; }); });
  outs.forEach(function (o) {
    if (o.ts < since30) return;
    o.d.forEach(function (tok) {
      tok = String(tok).trim();
      if (!tok || known[tok] || !grpOf[tok] || !grpHas[grpOf[tok]]) return;
      var x = ns[tok] || (ns[tok] = { n: tok, g: grpOf[tok], s: 0, j7: 0, j30: 0 });
      x.j30 += o.q; if (o.ts > since7) x.j7 += o.q; if (S1 && o.ts > S1.from && o.ts <= S1.to) x.s += o.q;
    });
  });
  var ach = achatsInfo_();
  return { soir: S1 ? { opened: S1.opened, cur: S1.cur } : null, nonSuivis: Object.keys(ns).map(function (k) { return ns[k]; }).sort(function (x, y) { return y.j30 - x.j30; }), list: list, perKg: perKg, gPlate: Math.round(perT.plate * 10000) / 10, gQuasar: Math.round(perT.quasar * 10000) / 10, gPlate0: Math.round(perT.plate0 * 1000), gCal: perT.cal, tol: tol, prixGout: prixGout, totalTetes30: totalTetes30, value: r2(list.reduce(function (a, x) { return a + x.value; }, 0)),
    achats: ach, types: TYPES_ };
}
// ---------- Stock intelligent (v30) : indicateurs clés de la semaine, dosages appris, activité inhabituelle ----------
// Indicateurs clés : produits dont chaque vente sort une quantité connue (ex. 1 aluminium par chicha tête plate ou tête).
// Comptés chaque lundi : vendu ↔ réellement sorti ; un manque = perte, vol ou vente non saisie.
var KEY_MAX_ = 7;
function keyStore_() { try { return JSON.parse(props_().getProperty('STOCK_KEYS') || '{}') || {}; } catch (e) { return {}; } }
// Une propriété Apps Script est limitée à 9 Ko : 10 semaines au plus, explications gardées pour les 2 dernières, puis on retire les plus anciennes tant que c'est trop gros.
function keySave_(o) {
  var ks = Object.keys(o).sort(); while (ks.length > 10) delete o[ks.shift()];
  ks.slice(0, -2).forEach(function (k) { if (o[k]) delete o[k].why; });
  var js = JSON.stringify(o);
  while (js.length > 8000 && ks.length > 2) { delete o[ks.shift()]; js = JSON.stringify(o); }
  try { props_().setProperty('STOCK_KEYS', js); } catch (e) {}
}
// Choix de la semaine : sentinelles (consommation fixe liée aux chichas) toujours ; 2 goûts les plus vendus ;
// puis les produits qui pèsent le plus (valeur sortie par semaine), en tournant pour tout contrôler au fil des semaines.
function keyPick_(info, mon) {
  var store = keyStore_(), recent = {};
  [addDays_(mon, -7), addDays_(mon, -14)].forEach(function (m) { ((store[m] || {}).list || []).forEach(function (n) { recent[n] = (recent[n] || 0) + 1; }); });
  var ok = info.list.filter(function (x) { return x.auto && x.out30 > 0; });
  // Poids d'un produit : valeur sortie par semaine (à défaut de prix, 0,50 € par unité sortie).
  var wv = function (x) { return x.out30 / 30 * 7 * (x.pu || (x.unite === 'kg' ? 10 : 0.5)); };
  var why = {}, out = [];
  var add = function (x, w) { if (out.length < KEY_MAX_ && out.indexOf(x.n) < 0) { out.push(x.n); why[x.n] = w; } };
  ok.filter(function (x) { return x.fixed && x.chicha && x.type !== 'Boisson'; }).sort(function (a, b) { return b.out30 - a.out30; })
    .forEach(function (x) { add(x, (x.qty === 1 ? '1' : String(x.qty).replace('.', ',')) + ' par ' + (x.recette || 'vente').split(',')[0].toLowerCase() + ' : chaque écart est une perte ou une vente non saisie'); });
  ok.filter(function (x) { return x.type === 'Goût'; }).sort(function (a, b) { return b.tetes30 - a.tetes30; }).slice(0, 2)
    .forEach(function (x) { add(x, 'goût parmi les plus servis · ' + x.share30 + ' % des têtes'); });
  // Puis 2 boissons (canettes et bouteilles : faciles à compter, faciles à faire disparaître), puis le reste ; au plus 3 goûts.
  var rest = ok.filter(function (x) { return out.indexOf(x.n) < 0; }).sort(function (a, b) { return (wv(b) / (1 + (recent[b.n] || 0))) - (wv(a) / (1 + (recent[a.n] || 0))); });
  var nG = function () { return out.filter(function (n) { return /^go[ûu]t/i.test(n); }).length; };
  var whyOf = function (x) { return x.type === 'Goût' ? 'goût · ' + x.share30 + ' % des têtes' : x.type === 'Boisson' ? Math.round(x.out30 / 30 * 7) + ' sorties par semaine' : x.fixed ? 'quantité fixe par vente · ' + Math.round(x.out30 / 30 * 7) + ' par semaine' : 'dosage appris · ' + eur_(wv(x)) + ' sortis par semaine'; };
  rest.filter(function (x) { return x.type === 'Boisson' && x.fixed; }).slice(0, 2).forEach(function (x) { add(x, whyOf(x)); });
  rest.forEach(function (x) { if (out.indexOf(x.n) >= 0 || (x.type === 'Goût' && nG() >= 3)) return; add(x, whyOf(x)); });
  return { list: out, why: why, at: Date.now() };
}
// Indicateurs de la semaine (calculés une fois le lundi, gardés toute la semaine).
function keyWeek_(mon, info) {
  var store = keyStore_();
  if (store[mon]) return store[mon];
  if (mon < weekStart_(Date.now())) return null;
  info = info || stockInfo_();
  store[mon] = keyPick_(info, mon);
  keySave_(store);
  return store[mon];
}
// Résultat d'un indicateur : entre les deux derniers comptages.
function keyEval_(x, tol) {
  var P = x.period, fresh = x.last && Date.now() - x.last.ts < 9 * 86400000;
  var r = { n: x.n, unite: x.unite, type: x.type, pu: x.pu };
  if (!P || !fresh) { r.status = 'compter'; r.label = x.last ? 'à recompter lundi' : 'jamais compté'; return r; }
  var real = P.real, theo = P.theo, ec = Math.round((real - theo) * 1000) / 1000, pct = theo ? ec / theo * 100 : null;
  r.real = real; r.theo = theo; r.ecart = ec; r.pct = pct == null ? null : Math.round(pct * 10) / 10; r.val = r2(ec * (x.pu || 0)); r.from = P.from; r.to = P.to;
  var small = Math.abs(ec) < (x.unite === 'kg' ? 0.02 : 1);
  if (small || (pct != null && Math.abs(pct) <= tol)) { r.status = 'ok'; r.label = 'conforme'; }
  else if (ec > 0) { r.status = pct != null && pct > 2 * tol ? 'alerte' : 'surveiller'; r.label = r.status === 'alerte' ? 'manque important' : 'manque'; }
  else { r.status = 'surveiller'; r.label = 'moins sorti que vendu'; }
  if (x.type === 'Goût' && P.tetes) r.tetes = P.tetes;
  return r;
}
function qtyTxt_(v, u) { v = Math.round(Math.abs(v) * 1000) / 1000; return u === 'kg' ? (v < 1 ? Math.round(v * 1000) + ' g' : String(Math.round(v * 100) / 100).replace('.', ',') + ' kg') : String(v).replace('.', ',') + ' ' + (u === 'unité' || u === 'pièce' ? (v > 1 ? u + 's' : u) : u); }
// Activité inhabituelle : dernier achat épuisé bien plus vite (ou lentement) que d'habitude, ou écart d'inventaire au-delà de 2× la tolérance.
function unusual_(info) {
  var out = [], tol = info.tol;
  info.list.forEach(function (x) {
    var t = x.ivTrend;
    if (t && Date.now() - t.to < 21 * 86400000) {
      var ratio = t.recent / t.usual;
      if (ratio > 1.3 || ratio < 0.7) out.push({ n: x.n, k: 'achat', sev: ratio > 1.5 ? 2 : 1, up: ratio > 1,
        txt: ratio > 1 ? 'le dernier achat n’a fait que ' + t.por + ' portion' + (t.por > 1 ? 's' : '') + ' au lieu d’environ ' + t.usualPor + ' : perte, portions trop grosses ou ventes non saisies'
          : 'le dernier achat a fait ' + t.por + ' portions au lieu d’environ ' + t.usualPor + ' : portions plus petites que d’habitude' });
    }
    var P = x.period;
    if (P && P.pct != null && Math.abs(P.pct) > 2 * tol && x.last && Date.now() - x.last.ts < 9 * 86400000)
      out.push({ n: x.n, k: 'inv', sev: 2, up: P.pct > 0, txt: (P.pct > 0 ? 'sorti ' : 'sorti ') + qtyTxt_(P.real, x.unite) + ' pour ' + qtyTxt_(P.theo, x.unite) + ' vendus (' + (P.pct > 0 ? '+' : '') + String(P.pct).replace('.', ',') + ' %)' });
  });
  return out.sort(function (a, b) { return b.sev - a.sev; });
}
// Quantités apprises (sans quantité fixe) : ce que l'appli a calibré toute seule.
function learnedList_(info) {
  return info.list.filter(function (x) { return x.learn && x.rate; }).map(function (x) {
    var ri = x.rateInfo || {};
    return { n: x.n, unite: x.unite, per: x.rate, txt: qtyTxt_(x.rate, x.unite) + ' par portion', basis: ri.portions ? ri.portions + ' portions ' + (ri.src === 'inv' ? 'entre deux inventaires' : 'd’achat en achat') + (ri.hyp ? ' (départ supposé)' : '') : '' };
  });
}
// Dosage des goûts appris des inventaires (grammes par tête plate ; Quasar au même rapport que le réglage).
function goutCal_() {
  var data = loadData_(), art = {}; data.carte.forEach(function (x) { art[x.n] = x; });
  var prods = stockProds_().filter(function (p) { return p.actif && p.type === 'Goût'; }), mv = stockMoves_(false);
  var pm = paramsMap_(), g0 = num_(pm[P_G_PLATE]) || 15, q0 = num_(pm[P_G_QUASAR]) || 20, since = Date.now() - 75 * 86400000, kg = 0, eq = 0, n = 0;
  prods.forEach(function (p) {
    var mine = mv.inv.filter(function (x) { return x.n === p.n && x.ts >= since; });
    for (var i = 1; i < mine.length; i++) {
      var a = mine[i - 1], b = mine[i];
      var real = a.c + mv.achats.reduce(function (s2, y) { return y.n === p.n && y.ts > a.ts && y.ts <= b.ts ? s2 + y.q : s2; }, 0) - b.c;
      var e = mv.outs.reduce(function (s2, o) { return o.ts > a.ts && o.ts <= b.ts && consoF_(p, o.n, o.d, art) ? s2 + o.q * (/quasar/i.test(o.n) ? q0 / g0 : 1) : s2; }, 0);
      if (real > 0 && e > 0) { kg += real; eq += e; n++; }
    }
  });
  var cal = eq > 0 ? { g: Math.round(kg / eq * 10000) / 10, eq: Math.round(eq), periods: n, at: Date.now() } : null;
  try { props_().setProperty('GOUT_CAL', JSON.stringify(cal)); } catch (e) {}
  return cal;
}
// Après un inventaire : résultat des indicateurs gardé (le compte rendu du mois en fait le total).
function keyKeep_() {
  var I = stockIntel_(), store = keyStore_(), mon = I.mon;
  if (!store[mon]) return;
  store[mon].res = I.keys.filter(function (k) { return k.status !== 'compter'; }).map(function (k) { return { n: k.n, s: k.status, e: k.ecart, v: k.val, p: k.pct, u: k.unite, to: k.to }; });
  keySave_(store);
}
// Tout le stock intelligent d'un coup (onglet Stock, comptes rendus).
function stockIntel_(info, mon) {
  info = info || stockInfo_();
  mon = mon || weekStart_(Date.now());
  var wk = keyWeek_(mon, info), prevMon = addDays_(mon, -7), prev = keyStore_()[prevMon] || null, by = {};
  info.list.forEach(function (x) { by[x.n] = x; });
  var names = (wk ? wk.list : []).concat(prev ? prev.list : []).filter(function (n, i, a) { return a.indexOf(n) === i && by[n]; });
  var keys = names.map(function (n) { var r = keyEval_(by[n], info.tol); r.why = (wk && wk.why[n]) || (prev && prev.why[n]) || ''; r.week = wk && wk.list.indexOf(n) >= 0; return r; });
  var lost = r2(keys.reduce(function (a, k) { return a + (k.status !== 'ok' && k.status !== 'compter' && k.val > 0 ? k.val : 0); }, 0));
  return { mon: mon, keys: keys, lost: lost, unusual: unusual_(info), learned: learnedList_(info),
    gout: { g: info.gPlate, g0: info.gPlate0, q: info.gQuasar, cal: info.gCal } };
}
function saveInventaire_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { invRows_(p.items, 'Gérant'); } finally { lock.releaseLock(); }
}
// Écrit un inventaire (sans verrou : l'appelant le tient). Renvoie le nombre de produits comptés.
function invRows_(items, by) {
  items = (items || []).filter(function (x) { return String(x.c == null ? '' : x.c).trim() !== '' && num_(x.c) >= 0; });
  if (!items.length) throw new Error('Saisis au moins une quantité comptée.');
  var info = stockInfo_(), byN = {}, now = new Date();
  info.list.forEach(function (x) { byN[x.n] = x; });
  var rows = items.filter(function (x) { return byN[x.n]; }).map(function (x) {
    var c = Math.round(num_(x.c) * 1000) / 1000, th = byN[x.n].theo, e = Math.round((c - th) * 1000) / 1000;
    return [now, x.n, c, th, e, th ? Math.round(e / th * 1000) / 10 : '', now, by || ''];
  });
  append_('inventaires', rows);
  try { goutCal_(); } catch (e) {}
  try { keyKeep_(); } catch (e) {}
  return rows.length;
}
// Inventaire du lundi : à faire au début du service, si des produits sont suivis.
function invDue_(ms) { return dow_(ymd_(ms)) === 0 && stockProds_().some(function (p) { return p.actif; }); }
// Produits à compter, sans stock théorique : goûts (kg), charbon, puis le reste.
function invListe_(all) {
  if (!all) {
    try {
      var mon = weekStart_(Date.now()), wk = keyWeek_(mon), prev = keyStore_()[addDays_(mon, -7)];
      var want = (wk ? wk.list : []).concat(prev ? prev.list : []);
      if (want.length) {
        var L = invListe_(true).filter(function (x) { return want.indexOf(x.n) >= 0; });
        if (L.length) return L;
      }
    } catch (e) {}
  }
  var rank = function (p) { return p.type === 'Goût' ? 0 : /charbon/i.test(p.n) ? 1 : 2 + Math.max(0, TYPES_.indexOf(p.type)); };
  return stockProds_().filter(function (p) { return p.actif; })
    .map(function (p, i) { return { n: p.n, unite: p.unite, type: p.type, g: rank(p), i: i }; })
    .sort(function (a, b) { return a.g - b.g || a.i - b.i; })
    .map(function (p) { return { n: p.n, unite: p.unite, type: p.type }; });
}
// Inventaire fait par le gérant pendant une soirée du lundi : plus rien à faire côté service.
function invDoneGerant_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var st = readState_();
    if (st.soiree && st.soiree.inv === 'due') { st.soiree.inv = 'done'; st.soiree.invBy = 'Gérant'; st.soiree.invAt = Date.now(); st.rev++; writeState_(st); }
  } finally { lock.releaseLock(); }
}
function addStockProd_(p) {
  var n = String(p.n || '').trim().slice(0, 60), type = TYPES_.indexOf(p.type) >= 0 ? p.type : 'Autre';
  if (!n) throw new Error('Indique le nom du produit.');
  if (stockProds_().some(function (x) { return x.n.toLowerCase() === n.toLowerCase(); })) throw new Error('« ' + n + ' » existe déjà.');
  var choix = type === 'Goût' ? n.replace(/^go[ûu]t\s+/i, '') : type === 'Boisson' ? n : '';
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { append_('stock', [[n, type, String(p.unite || (type === 'Goût' ? 'kg' : 'unité')), type === 'Goût' ? 'Chichas' : '', choix, type === 'Boisson' ? 1 : '', num_(p.seuil) || '', true]]); }
  finally { lock.releaseLock(); }
}
// Prix unitaire noté à la main (stock payé avant les achats saisis) ; le prix du dernier achat saisi passe devant.
function stockCout_(p) {
  var x = stockProds_().filter(function (y) { return y.row === Math.floor(+p.row) && y.n === p.n; })[0];
  if (!x) throw new Error('Produit introuvable, recharge la page.');
  var raw = String(p.cout == null ? '' : p.cout).trim().replace(',', '.'), v = raw === '' ? '' : +raw;
  if (v !== '' && !(v >= 0 && v <= 10000)) throw new Error('Prix invalide.');
  sheet_('stock').getRange(x.row, 9).setValue(v);
}
function stockProdOff_(p) {
  var x = stockProds_().filter(function (y) { return y.row === Math.floor(+p.row) && y.n === p.n; })[0];
  if (!x) throw new Error('Produit introuvable, recharge la page.');
  sheet_('stock').getRange(x.row, 8).setValue(false);
}

// ---------- Carte (gérant) ----------

function bumpData_() {
  LD_ = null; CacheService.getScriptCache().remove('data'); rcKeys_().forEach(rcDirty_); if (!MEMO_) rcFlush_();
  props_().setProperty('DATA_REV', String(Date.now()));
}
function carteInfo_() {
  var str = function (v) { return String(v == null ? '' : v).trim(); };
  var items = rows_('carte').map(function (r, i) { return { row: i + 2, cat: str(r[0]), n: str(r[1]), p: r2(num_(r[2])), sub: str(r[4]), actif: !(r[5] === false || /^(false|faux|non|0)$/i.test(str(r[5]))) }; }).filter(function (x) { return x.n; });
  var gouts = rows_('options').map(function (r, i) { return { row: i + 2, g: str(r[0]), n: str(r[2]) }; }).filter(function (x) { return x.g === 'gout' && x.n; });
  return { items: items, gouts: gouts, cats: items.reduce(function (a, x) { if (a.indexOf(x.cat) < 0) a.push(x.cat); return a; }, []) };
}
function carteSave_(p) {
  var x = carteInfo_().items.filter(function (y) { return y.row === Math.floor(+p.row) && y.n === p.n; })[0];
  if (!x) throw new Error('Article introuvable, recharge la page.');
  var price = num_(p.p);
  if (String(p.p).trim() === '' || !(price >= 0) || price > 1000) throw new Error('Prix invalide.');
  var sh = sheet_('carte');
  sh.getRange(x.row, 3).setValue(r2(price));
  sh.getRange(x.row, 6).setValue(!!p.actif);
  bumpData_();
}
function carteAdd_(p) {
  var n = String(p.n || '').trim().slice(0, 60), cat = String(p.cat || '').trim().slice(0, 40), price = num_(p.p);
  if (!n || !cat) throw new Error('Indique la catégorie et le nom.');
  if (String(p.p).trim() === '' || !(price >= 0)) throw new Error('Prix invalide.');
  if (carteInfo_().items.some(function (x) { return x.n.toLowerCase() === n.toLowerCase(); })) throw new Error('« ' + n + ' » est déjà à la carte.');
  append_('carte', [[cat, n, r2(price), '', String(p.sub || '').trim().slice(0, 80), true]]);
  bumpData_();
}
function goutAdd_(p) {
  var n = String(p.n || '').trim().slice(0, 40);
  if (!n) throw new Error('Indique le nom du goût.');
  var info = carteInfo_();
  if (info.gouts.some(function (x) { return x.n.toLowerCase() === n.toLowerCase(); })) throw new Error('Ce goût existe déjà.');
  var sh = sheet_('options'), rows = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 4).getValues(), last = -1;
  rows.forEach(function (r, i) { if (r[0] === 'gout') last = i; });
  var row = ['gout', 'Goût', n, 0];
  rows = last < 0 ? rows.concat([row]) : rows.slice(0, last + 1).concat([row], rows.slice(last + 1));
  sh.getRange(2, 1, rows.length, 4).setValues(rows);
  if (!stockProds_().some(function (x) { return x.type === 'Goût' && x.choix.toLowerCase() === n.toLowerCase(); })) addStockProd_({ n: 'Goût ' + n, type: 'Goût' });
  bumpData_();
}
function goutDel_(p) {
  var x = carteInfo_().gouts.filter(function (y) { return y.row === Math.floor(+p.row) && y.n === p.n; })[0];
  if (!x) throw new Error('Goût introuvable, recharge la page.');
  if (carteInfo_().gouts.length < 2) throw new Error('Garde au moins un goût.');
  sheet_('options').deleteRow(x.row);
  bumpData_();
}

// ---------- Migrations (lancées par « Installer les onglets ») ----------

var EXTRA_INCLUS_ = ['Bouteille d’eau', 'Sirop à l’eau', 'Diabolo'];
// Plan réel (photo de Rayane, 4 nov.) : salle en L à l'envers, pas de table 6.
var PLAN_V5_ = [
  ['TV', 2, 1, 2], ['Porte', 4, 2, 2],
  [12, 1, 3, ''], [11, 1, 4, ''], [10, 1, 5, ''], [15, 3, 5, ''], [16, 4, 5, ''], [9, 1, 6, ''],
  ['Toilettes', 3, 7, 2], [8, 1, 8, ''], ['Bar · caisse', 3, 8, 2], [7, 1, 9, ''], ['Cuisine', 3, 9, 2], [5, 1, 10, ''], [4, 1, 11, ''],
  [3, 1, 13, ''], [14, 3, 13, ''], [2, 1, 14, ''], [13, 3, 14, ''], [1, 1, 15, ''], ['Entrée', 1, 16, ''], ['TV', 3, 16, 2],
  [17, 7, 1, ''], [18, 7, 2, ''], [19, 7, 3, ''], [20, 7, 4, '']
];
var FID_SOFT_ = 'Softs, Sirop à l’eau, Diabolo';
// Recettes (Rayane, 4 nov.) : [produit, type, unité, articles de la carte, choix, quantité par portion (vide = apprise)].
// Nutella et sucre viennent des descriptions de la carte (Crêpe Nutella, Oreo, Crunchy ; Crêpe au sucre).
var R_SMASH_ = 'Yäya Smash, Yäya Smash XL, Menu Smash, Menu Smash XL', R_PATES_ = 'Pasta Carbo, Pasta Salmon, Carbonara, Saumon',
  R_CREPE_ = 'Crêpe Sugar, Crêpe Nutella, Crêpe Oreo, Crêpe Crunchy';
var RECETTES_ = [
  ['Pain brioché', 'Frais', 'unité', R_SMASH_, '', 1],
  ['Steak haché', 'Frais', 'unité', 'Yäya Smash, Yäya Smash XL×2, Menu Smash, Menu Smash XL×2', '', 1],
  ['Oignons', 'Frais', 'kg', R_SMASH_, '', ''],
  ['Cornichons', 'Épicerie', 'kg', R_SMASH_, '', ''],
  ['Sauce burger', 'Épicerie', 'kg', R_SMASH_, '', ''],
  ['Pâtes', 'Épicerie', 'kg', R_PATES_, '', ''],
  ['Crème fraîche', 'Frais', 'L', R_PATES_, '', ''],
  ['Échalotes', 'Frais', 'kg', R_PATES_, '', ''],
  ['Lardons', 'Frais', 'kg', 'Pasta Carbo, Carbonara', '', ''],
  ['Saumon', 'Frais', 'kg', 'Pasta Salmon, Saumon', '', ''],
  ['Œufs', 'Frais', 'unité', R_CREPE_, '', ''],
  ['Lait', 'Frais', 'L', R_CREPE_, '', ''],
  ['Farine', 'Épicerie', 'kg', R_CREPE_, '', ''],
  ['Nutella', 'Épicerie', 'kg', 'Crêpe Nutella, Crêpe Oreo, Crêpe Crunchy', '', ''],
  ['Sucre', 'Épicerie', 'kg', 'Crêpe Sugar', '', ''],
  ['Oreo', 'Épicerie', 'unité', 'Crêpe Oreo', '', 1],
  ['M&M’s', 'Épicerie', 'kg', 'Crêpe Crunchy', '', ''],
  ['Fondant au chocolat', 'Surgelé', 'unité', 'Cœur coulant', '', 1]
];
var NOUVEAUX_STOCK_ = [['Grande bouteille d’eau', 'Boisson', 'bouteille'], ['Bouteille d’eau pétillante', 'Boisson', 'bouteille'], ['Sirop', 'Boisson', 'bouteille'],
  ['Jus', 'Boisson', 'bouteille'], ['Sirop chocolat', 'Boisson', 'bouteille'], ['Sirop vanille', 'Boisson', 'bouteille'], ['Sirop caramel', 'Boisson', 'bouteille'],
  ['Huile d’olive', 'Épicerie', 'L'], ['Huile', 'Épicerie', 'L'], ['Sel', 'Épicerie', 'kg'], ['Poivre', 'Épicerie', 'kg'], ['Arôme Maggi', 'Épicerie', 'bouteille'],
  ['Sauce Youpi barbecue', 'Épicerie', 'bouteille'], ['Sauce Youpi poivre', 'Épicerie', 'bouteille']];
var SMASH_V30_ = 'Yäya Smash, Yäya Smash XL, Menu Smash, Menu Smash XL', PATES_V30_ = 'Pasta Carbo, Pasta Salmon, Carbonara, Saumon', MOJ_V30_ = 'Mojito Yäya, Mojito Yäya classique, Mojito Yäya passion, Mojito Yäya fraise';
var LIENS_V30_ = {
  'huile': 'Frites, Grandes frites, ' + SMASH_V30_, 'huile d’olive': PATES_V30_, 'sel': 'Frites, Grandes frites, ' + SMASH_V30_ + ', ' + PATES_V30_,
  'poivre': SMASH_V30_ + ', ' + PATES_V30_, 'arôme maggi': SMASH_V30_, 'sauce youpi barbecue': SMASH_V30_ + ', Frites, Grandes frites',
  'sauce youpi poivre': SMASH_V30_ + ', Frites, Grandes frites', 'sirop': 'Sirop à l’eau, Diabolo, ' + MOJ_V30_, 'jus': 'Mango juice',
  'bouteille d’eau pétillante': MOJ_V30_, 'grande bouteille d’eau': 'Thé à la menthe, Sirop à l’eau'
};
var ALU_V30_ = ['Aluminium', 'Consommable', 'unité', 'Chicha tête plate, Tête supplémentaire', '', 1, '', true, ''];
var FRITES_ = ['Frites surgelées', 'Surgelé', 'kg', 'Frites, Grandes frites×1.5, Menu Smash, Menu Smash XL', '', ''];
// Ménage de fermeture (Rayane, 4 nov.) : 3 étapes de 5 minutes.
var MENAGE_ = ['plumeau', 'aspirateur', 'serpillère + toilettes'], MENAGE_MS_ = 5 * 60000;
// 4 charbons par chicha (Rayane, 4 nov.) : classiques pour la tête plate, Quasar pour la Quasar. Pas de charbon compté pour une tête en plus.
var CHARBONS_ = [
  ['Charbon classique', 'Autre', 'pièce', 'Chicha tête plate', '', 4, '', true],
  ['Charbon Quasar', 'Autre', 'pièce', 'Chicha Quasar', '', 4, '', true]
];
function migrate_(ss) {
  var props = props_(), done = String(props.getProperty('MIGR') || '').split(',');
  var step = function (id, fn) { if (done.indexOf(id) >= 0) return; fn(); done.push(id); props.setProperty('MIGR', done.filter(String).join(',')); };
  // Eau, sirop à l'eau et diabolo dans les boissons comprises (chichas et formules) et dans le soft offert à 5 tampons.
  step('softs-inclus', function () {
    var sh = ss.getSheetByName(SH.options);
    if (sh && sh.getLastRow() > 1) {
      var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues(), out = [];
      ['boisson', 'softF'].forEach(function (g) {
        var have = rows.filter(function (r) { return r[0] === g; }).map(function (r) { return r[2]; });
        var miss = EXTRA_INCLUS_.filter(function (n) { return have.indexOf(n) < 0; });
        if (!miss.length) return;
        var label = (rows.filter(function (r) { return r[0] === g; })[0] || [g, g])[1], last = -1;
        rows.forEach(function (r, i) { if (r[0] === g && !(+r[3]) && !/^(Café|Thé)/.test(r[2])) last = i; });
        if (last < 0) rows.forEach(function (r, i) { if (r[0] === g) last = i; });
        var add = miss.map(function (n) { return [g, label, n, 0]; });
        if (last < 0) rows = rows.concat(add); else rows = rows.slice(0, last + 1).concat(add, rows.slice(last + 1));
      });
      sh.getRange(2, 1, rows.length, 4).setValues(rows);
    }
    var fid = ss.getSheetByName(SH.fidelite);
    if (fid && fid.getLastRow() > 1) {
      var fr = fid.getRange(2, 1, fid.getLastRow() - 1, 3).getValues();
      fr.forEach(function (r, i) { if (+r[0] === 5 && String(r[2]).trim() === 'Softs') fid.getRange(i + 2, 3).setValue(FID_SOFT_); });
    }
  });
  // Bouteille d'eau vendue seule (Softs, 5 €).
  step('eau-softs', function () {
    var sh = ss.getSheetByName(SH.options);
    if (!sh || sh.getLastRow() < 2) return;
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues(), last = -1, label = 'Soft';
    if (rows.some(function (r) { return r[0] === 'soft' && r[2] === 'Bouteille d’eau'; })) return;
    rows.forEach(function (r, i) { if (r[0] === 'soft') { last = i; label = r[1] || label; } });
    if (last < 0) return;
    rows = rows.slice(0, last + 1).concat([['soft', label, 'Bouteille d’eau', 0]], rows.slice(last + 1));
    sh.getRange(2, 1, rows.length, 4).setValues(rows);
  });
  // Plan de salle réel.
  step('plan-v5', function () {
    var sh = ss.getSheetByName(SH.plan);
    if (!sh) return;
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4).clearContent();
    sh.getRange(2, 1, PLAN_V5_.length, 4).setValues(PLAN_V5_);
  });
  // 13 nov. (Rayane) : nouvelle table à gauche de l'entrée = table 1 ; les anciennes 1 à 5 deviennent 2 à 6 ; 7 à 20 inchangées.
  step('plan-v21', function () {
    var sh = ss.getSheetByName(SH.plan);
    if (!sh || sh.getLastRow() < 2) return;
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().filter(function (r) { return String(r[0]).trim() !== ''; });
    var isNum = function (v) { return /^\d+$/.test(String(v).trim()); };
    if (rows.some(function (r) { return isNum(r[0]) && +r[0] === 6; })) return;
    rows.forEach(function (r) { if (isNum(r[0]) && +r[0] >= 1 && +r[0] <= 5) r[0] = +r[0] + 1; });
    var ent = rows.filter(function (r) { return /^entr/i.test(String(r[0])); })[0];
    if (ent) {
      var c = +ent[1], l = +ent[2], busy = rows.some(function (r) { return r !== ent && +r[2] === l && +r[1] <= c + 1 && +r[1] + (Math.max(1, +r[3] || 1)) - 1 >= c + 1; });
      rows.push([1, c, l, '']);
      if (!busy) ent[1] = c + 1; else { ent[2] = l + 1; }
    } else rows.push([1, 1, Math.max.apply(null, rows.map(function (r) { return +r[2] || 0; })) + 1, '']);
    sh.getRange(2, 1, sh.getLastRow() - 1, 4).clearContent();
    sh.getRange(2, 1, rows.length, 4).setValues(rows);
    bumpData_();
  });
  // Produits suivis en stock : un par goût, les boissons, le charbon.
  step('stock-v1', function () {
    var sh = ss.getSheetByName(SH.stock);
    if (!sh || sh.getLastRow() > 1) return;
    var opt = ss.getSheetByName(SH.options), orows = opt && opt.getLastRow() > 1 ? opt.getRange(2, 1, opt.getLastRow() - 1, 4).getValues() : [];
    var gouts = orows.filter(function (r) { return r[0] === 'gout' && r[2]; }).map(function (r) { return String(r[2]); });
    var drinks = [];
    orows.forEach(function (r) { if (r[0] === 'soft' && r[2] && drinks.indexOf(String(r[2])) < 0) drinks.push(String(r[2])); });
    if (drinks.indexOf('Bouteille d’eau') < 0) drinks.push('Bouteille d’eau');
    drinks.push('Red Bull');
    var rows = gouts.map(function (g) { return ['Goût ' + g, 'Goût', 'kg', 'Chichas', g, '', '', true]; })
      .concat(drinks.map(function (d) { return [d, 'Boisson', 'unité', '', d, 1, '', true]; }))
      .concat(CHARBONS_.map(function (r) { return r.slice(); }));
    sh.getRange(2, 1, rows.length, 8).setValues(rows);
  });
  // Charbon : remplace la ligne « Charbon » (kg, sans sortie) par le charbon classique et le charbon Quasar, 4 par chicha.
  step('charbon-v6', function () {
    var sh = ss.getSheetByName(SH.stock);
    if (!sh) return;
    var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues() : [], i = -1;
    rows.forEach(function (r, j) { if (String(r[0]).trim() === 'Charbon') i = j; });
    var have = function (n) { return rows.some(function (r) { return String(r[0]).trim() === n; }); };
    if (i >= 0 && !have(CHARBONS_[0][0])) { sh.getRange(i + 2, 1, 1, 8).setValues([CHARBONS_[0].slice()]); rows[i] = CHARBONS_[0].slice(); }
    var add = CHARBONS_.filter(function (r) { return !have(r[0]); }).map(function (r) { return r.slice(); });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 8).setValues(add);
  });
  // Coûts : les salaires ont leur propre ligne, les charges fixes ne les comprennent plus.
  step('admin-pin', function () { adminPin_(); });
  // Charbon : 235 € les 3 600 (Rayane, 4 nov.), en attendant le prochain achat saisi.
  step('cout-charbon-v12', function () {
    var sh = ss.getSheetByName(SH.stock);
    if (!sh || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, 9).getValues().forEach(function (r, i) {
      if (/charbon/i.test(String(r[0])) && String(r[8]).trim() === '') sh.getRange(i + 2, 9).setValue(235 / 3600);
    });
  });
  // Caisse suivie d'une soirée à l'autre (Rayane, 6 nov.) : explications et recalcul des écarts déjà enregistrés.
  // Produits demandés par Rayane le 9 nov. ; frites en kg, crème fraîche en litre.
  step('stock-v19', function () {
    var sh = ss.getSheetByName(SH.stock);
    if (!sh) return;
    var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 9).getValues() : [], norm = function (x) { return String(x).trim().toLowerCase(); };
    rows.forEach(function (r, i) {
      if (/^frites/i.test(String(r[0]).trim()) && r[2] !== 'kg') sh.getRange(i + 2, 3).setValue('kg');
      if (norm(r[0]) === 'crème fraîche' && r[2] !== 'L') sh.getRange(i + 2, 3).setValue('L');
    });
    var have = rows.map(function (r) { return norm(r[0]); }), add = [];
    NOUVEAUX_STOCK_.forEach(function (x) { if (have.indexOf(norm(x[0])) < 0) add.push([x[0], x[1], x[2], '', '', '', '', true, '']); });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 9).setValues(add);
  });
  step('caisse-v14', function () {
    var sh = ss.getSheetByName(SH.params);
    if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(function (r, i) {
      if (String(r[0]).trim() === P_FOND) sh.getRange(i + 2, 3).setValue('Espèces à laisser dans le tiroir quand tu récupères la caisse (monnaie de départ)');
    });
    try { caisseRecalc_(); } catch (e) {}
  });
  step('frites-v13', function () {
    var sh = ss.getSheetByName(SH.stock);
    if (!sh) return;
    var have = sh.getLastRow() > 1 && sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().some(function (r) { return /^frites/i.test(String(r[0]).trim()); });
    if (!have) sh.getRange(sh.getLastRow() + 1, 1, 1, 9).setValues([[FRITES_[0], FRITES_[1], FRITES_[2], FRITES_[3], FRITES_[4], FRITES_[5], '', true, '']]);
  });
  // Recettes (Rayane, 4 nov.) : quantité vide = apprise (inventaires ou d'achat en achat) ; ×2 = deux par portion.
  step('recettes-v10', function () {
    var sh = ss.getSheetByName(SH.stock);
    if (!sh) return;
    var have = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).trim().toLowerCase(); }) : [];
    var add = RECETTES_.filter(function (r) { return have.indexOf(r[0].toLowerCase()) < 0; })
      .map(function (r) { return [r[0], r[1], r[2], r[3], r[4], r[5], '', true, '']; });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 9).setValues(add);
  });
  // Bénéfice et minimum calculés avec les matières consommées (goûts au gramme) ; explications à jour.
  step('couts-v9', function () {
    var sh = ss.getSheetByName(SH.params);
    if (!sh || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(function (r, i) {
      var k = String(r[0]).trim();
      if (k === P_OBJ_BEN) sh.getRange(i + 2, 3).setValue('Bénéfice visé sur le mois : CA − salaires − charges fixes − matières consommées − autres achats, avant impôts');
      if (k === P_TETES_KG) sh.getRange(i + 2, 3).setValue('Plus utilisé : le stock se calcule avec les grammes par tête');
    });
  });
  step('couts-v6', function () {
    var sh = ss.getSheetByName(SH.params);
    if (!sh || sh.getLastRow() < 2) return;
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
    rows.forEach(function (r, i) {
      if (String(r[0]).trim() === P_CHARGES) sh.getRange(i + 2, 3).setValue('Loyer, électricité, assurances… par mois, hors salaires');
      if (String(r[0]).trim() === P_OBJ_BEN) sh.getRange(i + 2, 3).setValue('Bénéfice visé sur le mois : CA − salaires − charges fixes − achats du mois, avant impôts');
      if (String(r[0]).trim() === P_SAL && String(r[1]).trim() === '') sh.getRange(i + 2, 2).setValue('1400');
    });
  });
  // 16 nov. (Rayane) : chaque produit du stock rattaché aux ventes qui l'utilisent ; aluminium = 1 par chicha tête plate ou tête.
  // Quantité vide = apprise toute seule (inventaires ou d'achat en achat). Seules les cases vides sont remplies.
  // 16 nov. (Rayane) : une télé en face de la table 20, à sa gauche sur le plan.
  step('plan-tv20-v30', function () {
    var sh = ss.getSheetByName(SH.plan);
    if (!sh || sh.getLastRow() < 2) return;
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().filter(function (r) { return String(r[0]).trim() !== ''; });
    var t20 = rows.filter(function (r) { return String(r[0]).trim() === '20'; })[0];
    if (!t20) return;
    var c = +t20[1] - 1, l = +t20[2];
    var busy = function (cc) { return rows.some(function (r) { return +r[2] === l && +r[1] <= cc && +r[1] + Math.max(1, +r[3] || 1) - 1 >= cc; }); };
    if (c < 1 || busy(c)) return;
    rows.push(['TV', c, l, '']);
    sh.getRange(2, 1, rows.length, 4).setValues(rows);
    bumpData_();
  });
  step('stock-liens-v30', function () {
    var sh = ss.getSheetByName(SH.stock);
    if (!sh) return;
    var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 9).getValues() : [], norm = function (x) { return String(x).trim().toLowerCase(); };
    rows.forEach(function (r, i) {
      var L = LIENS_V30_[norm(r[0])];
      if (L && !String(r[3]).trim() && !String(r[4]).trim()) sh.getRange(i + 2, 4).setValue(L);
      if (norm(r[0]) === 'sucre' && !/thé/i.test(String(r[3]))) sh.getRange(i + 2, 4).setValue(String(r[3]).trim() ? String(r[3]).trim() + ', Thé à la menthe' : 'Crêpe Sugar, Thé à la menthe');
    });
    if (!rows.some(function (r) { return /alu/i.test(String(r[0])); })) sh.getRange(sh.getLastRow() + 1, 1, 1, 9).setValues([ALU_V30_]);
    bumpData_();
  });
}

// ---------- Données ----------

function loadData_() {
  if (MEMO_ && LD_) return JSON.parse(LD_);
  var cache = CacheService.getScriptCache(), hit = cache.get('data');
  if (hit) { if (MEMO_) LD_ = hit; return JSON.parse(hit); }
  var str = function (v) { return String(v == null ? '' : v).trim(); };
  var list = function (v) { return str(v).split(/[,;]/).map(function (x) { return x.trim(); }).filter(String); };
  var actif = function (v) { return !(v === false || /^(false|faux|non|0)$/i.test(str(v))); };
  var carte = rows_('carte').filter(function (r) { return str(r[1]); }).map(function (r) {
    return { cat: str(r[0]) || 'Divers', n: str(r[1]), p: r2(num_(r[2])), o: list(r[3]), sub: str(r[4]), actif: actif(r[5]) };
  });
  var options = {};
  rows_('options').filter(function (r) { return str(r[0]) && str(r[2]); }).forEach(function (r) {
    var g = str(r[0]);
    if (!options[g]) options[g] = { label: str(r[1]) || g, choices: [] };
    options[g].choices.push({ n: str(r[2]), add: r2(num_(r[3])) });
  });
  var fidelite = rows_('fidelite').filter(function (r) { return str(r[1]); }).map(function (r) {
    return { palier: Math.floor(num_(r[0])), n: str(r[1]), articles: list(r[2]) };
  });
  var sugg = rows_('sugg').filter(function (r) { return str(r[0]) && str(r[1]); }).map(function (r) {
    var preset = {};
    list(r[2]).forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) preset[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); });
    return { from: str(r[0]), to: str(r[1]), preset: preset };
  });
  var plan = rows_('plan').filter(function (r) { return str(r[0]) && num_(r[1]) > 0 && num_(r[2]) > 0; }).map(function (r) {
    var t = str(r[0]);
    return { t: /^\d+$/.test(t) ? +t : t, c: Math.floor(num_(r[1])), r: Math.floor(num_(r[2])), w: Math.max(1, Math.floor(num_(r[3])) || 1) };
  });
  var pm = {};
  rows_('params').forEach(function (r) { pm[str(r[0])] = r[1]; });
  var ouv = pm[P_OUV];
  if (ouv instanceof Date) ouv = Utilities.formatDate(ouv, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'HH:mm');
  var data = {
    carte: carte, options: options, fidelite: fidelite, sugg: sugg, plan: plan,
    params: { fond: r2(num_(pm[P_FOND])), email: str(pm[P_EMAIL]), ouverture: str(ouv) || '17:00', relance: num_(pm[P_RELANCE]) || 40, relanceTete: num_(pm[P_RELANCE_TETE]) || 45, dataRev: +(props_().getProperty('DATA_REV') || 0),
      pos: parsePos_(pm[P_POS]), rayon: num_(pm[P_RAYON]) || 150 }
  };
  var js = JSON.stringify(data); if (MEMO_) LD_ = js;
  try { cache.put('data', js, 300); } catch (e) {}
  return data;
}

// Position par défaut : 46 rue Jean Jaurès, Bezons (lien Waze du site yaya-lounge.fr).
function parsePos_(v) {
  var m = String(v == null ? '' : v).match(/(-?\d+(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d+(?:[.,]\d+)?)/);
  if (m) {
    var lat = parseFloat(m[1].replace(',', '.')), lng = parseFloat(m[2].replace(',', '.'));
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat: lat, lng: lng };
  }
  return { lat: 48.92746, lng: 2.222845 };
}

function readState_() {
  if (MEMO_ && RO_ && ST_) return JSON.parse(ST_);
  try { var hit = CacheService.getScriptCache().get('etat'); if (hit) { if (MEMO_ && RO_) ST_ = hit; return JSON.parse(hit); } } catch (e) {}
  var sh = sheet_('etat'), n = Math.max(1, sh.getLastRow());
  var v = sh.getRange(1, 1, n, 1).getValues().map(function (r) { var x = String(r[0] == null ? '' : r[0]); return x.charAt(0) === '~' ? x.slice(1) : x; }).join('');
  var st = v ? JSON.parse(v) : null;
  st = st && st.rev ? st : { rev: 1, seq: 1, soiree: null, tables: {}, tickets: [] };
  if (MEMO_ && RO_) ST_ = JSON.stringify(st);
  return st;
}
var STATE_CHUNK = 40000;
function writeState_(st) {
  var sh = sheet_('etat'), s = JSON.stringify(st), parts = [];
  if (MEMO_ && RO_) ST_ = s;
  // Le « ~ » en tête empêche Sheets de transformer un morceau en nombre ou en date.
  for (var i = 0; i < s.length; i += STATE_CHUNK) parts.push(['~' + s.slice(i, i + STATE_CHUNK)]);
  var old = sh.getLastRow();
  sh.getRange(1, 1, parts.length, 1).setValues(parts);
  if (old > parts.length) sh.getRange(parts.length + 1, 1, old - parts.length, 1).clearContent();
  // Copie en cache : les lectures suivantes évitent le Google Sheets (appli plus rapide).
  // Si la copie ne s'écrit pas, on l'efface : jamais d'ancienne copie relue à la place de l'état à jour.
  try { if (s.length < 90000) CacheService.getScriptCache().put('etat', s, 21600); else CacheService.getScriptCache().remove('etat'); }
  catch (e) { try { CacheService.getScriptCache().remove('etat'); } catch (e2) {} }
}

// ---------- Outils ----------

// Rapidité : pendant un appel de l'appli, chaque onglet n'est lu qu'une fois (en un seul accès), puis gardé en mémoire
// jusqu'à la fin de l'appel. Écrire dans un onglet (sheet_) le relit ensuite à chaque fois ; un ajout (append_) le fait relire.
var MEMO_ = false, ROWS_ = {}, NOMEMO_ = {}, SHO_ = {}, SS_ = null;
function memoOn_() { MEMO_ = true; ROWS_ = {}; NOMEMO_ = {}; SHO_ = {}; SS_ = null; RC_ = null; LD_ = null; PR_ = null; ST_ = null; TM_ = null; RO_ = false; }
function memoOff_() { MEMO_ = false; ROWS_ = {}; NOMEMO_ = {}; SHO_ = {}; SS_ = null; RC_ = null; LD_ = null; PR_ = null; ST_ = null; TM_ = null; RO_ = false; }
function rawSheet_(key) {
  if (MEMO_ && SHO_[key]) return SHO_[key];
  var ss = MEMO_ ? (SS_ || (SS_ = SpreadsheetApp.getActive())) : SpreadsheetApp.getActive(), sh = ss.getSheetByName(SH[key]);
  if (!sh) throw new Error('Onglet « ' + SH[key] + ' » manquant. Lance YÄYA > Installer les onglets.');
  if (MEMO_) SHO_[key] = sh;
  return sh;
}
function sheet_(key) { NOMEMO_[key] = true; delete ROWS_[key]; rcDirty_(key); return rawSheet_(key); }
// v33 · Rapidité : chaque lecture d'onglet coûte 0,3 à 0,5 s chez Google, quelle que soit sa taille.
// Les onglets lus sont gardés dans le cache Google (1 h) et tous relus d'un seul coup au début d'un appel.
// Chaque onglet a un jeton de version : toute écriture par l'appli le change (après enregistrement effectif),
// une modification à la main dans le Sheets aussi (onEdit). Une copie dont le jeton ne correspond plus est ignorée.
var RC_ = null, RC_DIRTY_ = {}, RC_TTL_ = 3600, RC_CHUNK_ = 90000;
function rcCache_() { try { var c = CacheService.getScriptCache(); return c && c.getAll && c.putAll ? c : null; } catch (e) { return null; } }
function rcKeys_() { return Object.keys(HEAD).filter(function (k) { return k !== 'etat' && SH[k]; }); }
function rcDirty_(key) { if (key === 'etat') return; RC_DIRTY_[key] = true; if (RC_) delete RC_.hit[key]; }
// Nouveaux jetons pour les onglets modifiés, une fois les écritures réellement enregistrées.
function rcFlush_() {
  var ks = Object.keys(RC_DIRTY_); RC_DIRTY_ = {};
  if (!ks.length) return;
  var c = rcCache_(); if (!c) return;
  try { SpreadsheetApp.flush(); } catch (e) {}
  var o = {}; ks.forEach(function (k) { o['RG:' + k] = String(Date.now()) + Math.random().toString(36).slice(2, 8); });
  try { c.putAll(o, 21600); } catch (e) { try { c.removeAll(ks.map(function (k) { return 'RG:' + k; })); } catch (e2) {} }
}
function rcInvalidateAll_() { rcKeys_().forEach(rcDirty_); rcFlush_(); }
// Un seul accès au cache pour tous les onglets (jetons + premier morceau de chaque copie).
function rcLoad_() {
  RC_ = { gen: {}, raw: {}, hit: {} };
  var c = rcCache_(); if (!c) return RC_;
  var keys = rcKeys_(), ask = [];
  keys.forEach(function (k) { ask.push('RG:' + k, 'R:' + k + ':0'); });
  var got = {}; try { got = c.getAll(ask) || {}; } catch (e) { got = {}; }
  keys.forEach(function (k) { RC_.gen[k] = got['RG:' + k] || ''; RC_.raw[k] = got['R:' + k + ':0'] || ''; });
  return RC_;
}
var RC_DATE_ = function (k, v) { var o = this[k]; return o instanceof Date ? { $d: o.getTime() } : v; };
var RC_REV_ = function (k, v) { return v && typeof v === 'object' && v.$d != null && Object.keys(v).length === 1 ? new Date(v.$d) : v; };
function rcGet_(key) {
  if (!MEMO_ || RC_DIRTY_[key] || NOMEMO_[key]) return null;
  if (!RC_) rcLoad_();
  var g = RC_.gen[key], raw = RC_.raw[key];
  if (!g || !raw) return null;
  try {
    var head = raw.indexOf('|'), meta = raw.slice(0, head).split(','), body = raw.slice(head + 1);
    if (meta[0] !== g) return null;
    var n = +meta[1] || 1;
    if (n > 1) {
      var c = rcCache_(), more = [], ok = true; for (var i = 1; i < n; i++) more.push('R:' + key + ':' + i);
      var got = c.getAll(more) || {};
      more.forEach(function (m) { if (got[m] == null) ok = false; else body += got[m]; });
      if (!ok) return null;
    }
    return JSON.parse(body, RC_REV_);
  } catch (e) { return null; }
}
function rcPut_(key, rows) {
  if (!MEMO_ || RC_DIRTY_[key] || NOMEMO_[key]) return;
  var c = rcCache_(); if (!c) return;
  if (!RC_) rcLoad_();
  var g = RC_.gen[key];
  try {
    if (!g) { g = String(Date.now()) + Math.random().toString(36).slice(2, 8); c.put('RG:' + key, g, 21600); RC_.gen[key] = g; }
    var js = JSON.stringify(rows, RC_DATE_), parts = [];
    for (var i = 0; i < js.length; i += RC_CHUNK_) parts.push(js.slice(i, i + RC_CHUNK_));
    if (!parts.length) parts.push('');
    if (parts.length > 40) return; // très gros onglet : lu directement
    var o = {}; parts.forEach(function (p, i) { o['R:' + key + ':' + i] = (i ? '' : g + ',' + parts.length + '|') + p; });
    c.putAll(o, RC_TTL_);
  } catch (e) {}
}
function rows_(key) {
  if (MEMO_ && ROWS_[key]) return ROWS_[key].slice();
  var v = rcGet_(key);
  if (!v) {
    var n = HEAD[key].length;
    v = rawSheet_(key).getDataRange().getValues();
    v.shift();
    v = v.map(function (r) { if (r.length > n) return r.slice(0, n); while (r.length < n) r.push(''); return r; });
    rcPut_(key, v);
  }
  if (MEMO_ && !NOMEMO_[key]) { ROWS_[key] = v; return v.slice(); }
  return v;
}
function rowsWhere_(key, col, val) { return rows_(key).filter(function (r) { return r[col] === val; }); }
function append_(key, rows) {
  if (!rows.length) return;
  var sh = rawSheet_(key);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  delete ROWS_[key]; rcDirty_(key);
  if (!MEMO_) rcFlush_();
}
function num_(v) { if (typeof v === 'number') return v; var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isNaN(n) ? 0 : n; }
function ms_(v) { return v instanceof Date ? v.getTime() : (v ? +new Date(v) : null); }
function hm_(ms) { var d = paris_(ms); return d ? p2_(d.getUTCHours()) + ':' + p2_(d.getUTCMinutes()) : Utilities.formatDate(new Date(ms), TZ, 'HH:mm'); }
function day_(ms) { return Utilities.parseDate(Utilities.formatDate(new Date(ms), TZ, 'yyyy-MM-dd'), TZ, 'yyyy-MM-dd'); }
function eur_(v) {
  var n = r2(v), p = Math.abs(n).toFixed(2).split('.');
  return (n < 0 ? '-' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (p[1] === '00' ? '' : ',' + p[1]) + ' €';
}
function pers_(v) { var n = Math.floor(+v); return n >= 1 && n <= 40 ? n : 0; }
function needSoiree_(st) { if (!st.soiree) throw new Error('Aucune soirée ouverte : commence ton service depuis le lounge.'); }
function table_(st, t) { var tb = st.tables[t]; if (!tb) throw new Error('Table ' + t + ' introuvable ou déjà encaissée.'); return tb; }
function tableNum_(data, t) {
  t = +t;
  if (!data.plan.some(function (x) { return x.t === t; })) throw new Error('Table ' + t + ' absente du plan de salle.');
  return t;
}
function cleanLines_(data, lines) {
  if (!lines || !lines.length) throw new Error('Aucun article à envoyer.');
  var out = [];
  lines.forEach(function (x) {
    var l = priceLine(data, x.n, x.sel), q = Math.floor(+x.q);
    if (!(q >= 1 && q <= 50)) throw new Error('Quantité invalide pour ' + x.n + '.');
    var ex = out.filter(function (y) { return y.k === l.k; })[0];
    if (ex) ex.q += q; else { l.q = q; out.push(l); }
  });
  return out;
}
function lateness_(now, params) {
  var hm = Utilities.formatDate(new Date(now), TZ, 'HH:mm').split(':'), ref = String(params.ouverture || '17:00').split(/[:h]/);
  var m = +hm[0] * 60 + +hm[1], r = (+ref[0] || 0) * 60 + (+ref[1] || 0);
  if (m < r - 12 * 60) m += 24 * 60;
  return Math.max(0, m - r);
}

// ---------- Accès ----------

// Pendant un appel : toutes les propriétés lues en une fois (chaque lecture séparée coûte un aller-retour Google).
var LD_ = null, PR_ = null, ST_ = null, TM_ = null;
function props_() {
  var real = PropertiesService.getScriptProperties();
  if (!MEMO_ || !RO_) return real;
  if (!PR_) {
    var all = real.getProperties() || {};
    PR_ = {
      getProperty: function (k) { return Object.prototype.hasOwnProperty.call(all, k) ? all[k] : null; },
      setProperty: function (k, v) { real.setProperty(k, v); all[k] = String(v); return PR_; },
      deleteProperty: function (k) { real.deleteProperty(k); delete all[k]; return PR_; },
      getProperties: function () { var o = {}; for (var k in all) o[k] = all[k]; return o; }
    };
  }
  return PR_;
}
function roleOf_(k) {
  if (!k) return null;
  var p = props_().getProperties();
  return k === p.KEY_SERVEUR ? 'serveur' : k === p.KEY_GERANT ? 'gerant' : null;
}
function baseUrl_() {
  var fixed = '';
  try { fixed = String(rows_('params').filter(function (r) { return r[0] === P_URL; }).map(function (r) { return r[1]; })[0] || '').trim(); } catch (e) {}
  if (fixed) return fixed.split('?')[0];
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}
function newKey_(n) { return Utilities.getUuid().replace(/-/g, '').slice(0, n); }

// ---------- Menu du Google Sheets ----------

function onOpen() {
  SpreadsheetApp.getUi().createMenu('YÄYA')
    .addItem('Installer les onglets', 'installer')
    .addItem('Afficher les liens', 'afficherLiens')
    .addSeparator()
    .addItem('Changer les liens service et gérant', 'nouveauxLiens')
    .addToUi();
}
function onEdit(e) {
  if (!e || !e.range || typeof e.range.getSheet !== 'function') return; // commande à table : pas d'appel depuis le web
  CacheService.getScriptCache().removeAll(['data', 'team']);
  try { var n = e && e.range && e.range.getSheet().getName(), ks = rcKeys_().filter(function (k) { return !n || SH[k] === n; }); ks.forEach(rcDirty_); rcFlush_(); } catch (x) { try { rcInvalidateAll_(); } catch (y) {} }
}

// Diagnostic (éditeur) : temps réel de chaque appel côté Google, sans rien modifier.
function mesurerVitesse() {
  editeurSeul_(); // commande à table : appelable depuis le web, réservé à l'éditeur (CommandeTable.gs)
  var K = props_().getProperty('KEY_GERANT'), out = [];
  var T = function (n, f) { var t = Date.now(); try { f(); out.push(n + ' ' + (Date.now() - t) + ' ms'); } catch (e) { out.push(n + ' ERREUR ' + e.message); } };
  T('ouverture classeur', function () { SpreadsheetApp.getActive().getSheets().length; });
  if (arguments[0] === 'feuilles') Object.keys(SH).forEach(function (k) { if (k === 'etat') return; T('lecture ' + SH[k], function () { var sh = SpreadsheetApp.getActive().getSheetByName(SH[k]); if (!sh) return; var v = sh.getDataRange().getValues(); out.push('   ' + SH[k] + ' : ' + v.length + ' lignes × ' + (v[0] || []).length + ' col. (max ' + sh.getMaxRows() + ')'); }); });
  T('readState', function () { readState_(); });
  T('loadData (cache vidé)', function () { CacheService.getScriptCache().remove('data'); loadData_(); });
  T('loadData (cache)', function () { loadData_(); });
  T('doGet gérant', function () { doGet({ parameter: { k: K } }).getContent(); });
  T('doGet service', function () { doGet({ parameter: { k: props_().getProperty('KEY_SERVEUR') } }).getContent(); });
  var ids = rows_('soirees').map(function (r) { return String(r[0]); }).filter(String).slice(-12).reverse();
  [1, 2].forEach(function (pass) {
    out.push('— passage ' + pass + (pass === 1 ? ' (cache à remplir)' : ' (cache prêt)'));
    ['state', 'recap', 'objectifs', 'stock', 'achats', 'caisse', 'equipe', 'courses', 'carte', 'analyses'].forEach(function (a) { T('api ' + a, function () { api(K, a, {}); }); });
    T('api recap lite (soirée passée)', function () { api(K, 'recap', { id: ids[1] || ids[0], lite: true }); });
    T('api recaps x12', function () { api(K, 'recaps', { ids: ids }); });
  });
  console.log(out.join('\n'));
  return out;
}
function installer() {
  editeurSeul_(); // commande à table : appelable depuis le web, réservé à l'éditeur (CommandeTable.gs)
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(TZ);
  try { ss.setSpreadsheetLocale('fr_FR'); } catch (e) {}
  var seeds = seeds_();
  Object.keys(HEAD).forEach(function (key) {
    var sh = ss.getSheetByName(SH[key]);
    if (sh) {
      // Mise à jour : complète les en-têtes et les paramètres ajoutés depuis la première installation.
      sh.getRange(1, 1, 1, HEAD[key].length).setValues([HEAD[key]]).setFontWeight('bold').setBackground('#F3ECDD');
      if (key === 'params') {
        var have = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
        var miss = seeds.params.filter(function (r) { return have.indexOf(r[0]) < 0; });
        if (miss.length) {
          sh.getRange(sh.getLastRow() + 1, 2, miss.length, 1).setNumberFormat('@');
          sh.getRange(sh.getLastRow() + 1, 1, miss.length, 3).setValues(miss);
        }
      }
      return;
    }
    sh = ss.insertSheet(SH[key]);
    sh.getRange(1, 1, 1, HEAD[key].length).setValues([HEAD[key]]).setFontWeight('bold').setBackground('#F3ECDD');
    sh.setFrozenRows(1);
    if (seeds[key]) {
      if (key === 'params') sh.getRange(2, 2, seeds[key].length, 1).setNumberFormat('@');
      sh.getRange(2, 1, seeds[key].length, seeds[key][0].length).setValues(seeds[key]);
      if (key === 'carte') sh.getRange(2, 6, seeds[key].length, 1).insertCheckboxes();
    }
    formats_(key, sh);
  });
  migrate_(ss);
  rcInvalidateAll_();
  var eq = ss.getSheetByName(SH.equipe);
  if (eq) eq.getRange(2, 2, eq.getMaxRows() - 1, 1).setNumberFormat('@');
  var et = ss.getSheetByName(SH.etat) || ss.insertSheet(SH.etat);
  if (!et.getRange(1, 1).getValue()) et.getRange(1, 1).setValue(JSON.stringify({ rev: 1, seq: 1, soiree: null, tables: {}, tickets: [] }));
  try { et.hideSheet(); } catch (e) {}
  var p = props_();
  if (!p.getProperty('KEY_SERVEUR')) p.setProperty('KEY_SERVEUR', newKey_(24));
  if (!p.getProperty('KEY_GERANT')) p.setProperty('KEY_GERANT', newKey_(24));
  ['Feuille 1', 'Sheet1', 'Feuille1'].forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
  CacheService.getScriptCache().removeAll(['data', 'team']);
  try { SpreadsheetApp.getUi().alert('Installation terminée. Complète l’onglet Paramètres, puis déploie l’appli (voir le guide).'); } catch (e) {}
}

function formats_(key, sh) {
  var money = '#,##0.00 €', ts = 'dd/MM/yyyy HH:mm', d = 'dd/MM/yyyy';
  var f = {
    carte: { 3: money }, options: { 4: money },
    soirees: { 2: d, 3: ts, 4: ts, 6: money, 7: money, 8: money, 10: money, 11: money, 12: money, 13: money, 14: money, 15: money, 16: money, 17: money },
    ventes: { 3: d, 5: ts, 6: ts, 7: money, 8: money, 9: money, 12: money, 13: money },
    lignes: { 3: d, 4: ts, 10: money, 11: money },
    paiements: { 3: d, 4: ts, 7: money },
    cadeaux: { 3: d, 4: ts, 9: money },
    annul: { 2: d, 3: ts, 9: money, 10: money },
    patron: { 2: d, 3: ts, 8: money, 9: money },
    pointages: { 2: d, 4: ts },
    achats: { 1: d, 6: money, 7: money, 9: ts },
    courses: { 1: ts, 5: ts },
    equipe: { 2: '@', 4: ts, 5: ts },
    inventaires: { 1: ts, 7: ts },
    promos: { 3: d, 4: ts, 7: money, 8: money, 12: ts },
    demandes: { 2: ts, 5: money, 12: ts },
    messages: { 1: ts },
    caisse: { 1: ts, 3: money, 6: ts }
  }[key] || {};
  Object.keys(f).forEach(function (c) { sh.getRange(2, +c, sh.getMaxRows() - 1, 1).setNumberFormat(f[c]); });
}

function afficherLiens() {
  editeurSeul_(); // commande à table : appelable depuis le web, réservé à l'éditeur (CommandeTable.gs)
  var url = baseUrl_(), p = props_().getProperties();
  if (!url) {
    SpreadsheetApp.getUi().alert('L’appli n’est pas encore déployée. Dans Apps Script : Déployer > Nouveau déploiement > Application Web, puis relance ce menu.');
    return;
  }
  var srv = url + '?k=' + p.KEY_SERVEUR, ger = url + '?k=' + p.KEY_GERANT;
  var h = '<div style="font-family:sans-serif;font-size:14px;line-height:1.5">' +
    '<p><b>Lien service</b> (à ouvrir sur l’iPhone ou l’iPad du service dans Safari, puis « Sur l’écran d’accueil ») :<br><input style="width:100%" readonly value="' + srv + '" onclick="this.select()"></p>' +
    '<p><b>Lien gérant</b> (pour toi seul) :<br><input style="width:100%" readonly value="' + ger + '" onclick="this.select()"></p>' +
    '<p>La prise de service n’est possible que depuis le lounge (position du téléphone, onglet Paramètres).</p></div>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(h).setWidth(460).setHeight(300), 'YÄYA · liens');
}
function nouveauxLiens() {
  editeurSeul_(); // commande à table : appelable depuis le web, réservé à l'éditeur (CommandeTable.gs)
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Changer les liens ?', 'Les anciens liens service et gérant ne marcheront plus.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  props_().setProperty('KEY_SERVEUR', newKey_(24));
  props_().setProperty('KEY_GERANT', newKey_(24));
  afficherLiens();
}

// ---------- Contenu de départ (base de travail, à ajuster dans les onglets) ----------

function seeds_() {
  // Carte de yaya-lounge.fr/carte (relevée le 3 novembre 2026).
  var desserts = ['Crêpe Sugar', 'Crêpe Nutella', 'Crêpe Oreo', 'Crêpe Crunchy', 'Cœur coulant'];
  var softs = ['Coca-Cola', 'Coca-Cola Cherry', 'Hawaï', 'Ice Tea pêche', 'Ice Tea pastèque menthe', 'Oasis Tropical', 'Oasis pomme cassis framboise', 'Perrier'];
  var mocks = ['Mojito Yäya classique', 'Mojito Yäya passion', 'Mojito Yäya fraise', 'Mango juice'];
  var inclus = softs.concat(EXTRA_INCLUS_);
  var grp = function (g, label, names, add) { return names.map(function (n) { return [g, label, n, add || 0]; }); };
  return {
    carte: [
      ['Chichas', 'Chicha tête plate', 10, 'gout, boisson', 'Boisson comprise', true],
      ['Chichas', 'Chicha Quasar', 20, 'gout, boisson', 'Boisson comprise', true],
      ['Chichas', 'Tête supplémentaire', 5, 'gout', 'Tête plate', true],
      ['Chichas', 'Tête Quasar supplémentaire', 10, 'gout', 'Tête Quasar', true],
      ['Formules', 'Menu Smash', 13, 'softF', 'Yäya Smash, frites, soft', true],
      ['Formules', 'Menu Smash XL', 15, 'softF', 'Double smash, frites, soft', true],
      ['Formules', 'Duo Pasta', 11, 'pates, softF', 'Pâtes + soft', true],
      ['Formules', 'Trio Pasta', 16, 'pates, softF, dessert', 'Pâtes, soft, dessert', true],
      ['Formules', 'Pause Gourmande', 11, 'dessert, mock', 'Dessert + mocktail', true],
      ['Plats', 'Yäya Smash', 7, '', 'Smash burger', true],
      ['Plats', 'Yäya Smash XL', 9, '', 'Double smash burger', true],
      ['Plats', 'Pasta Carbo', 8, '', 'Pâtes carbonara', true],
      ['Plats', 'Pasta Salmon', 9, '', 'Pâtes au saumon', true],
      ['Plats', 'Frites', 4, '', '', true], ['Plats', 'Grandes frites', 6, '', '', true],
      ['Desserts', 'Crêpe Sugar', 5, '', 'Crêpe au sucre', true],
      ['Desserts', 'Crêpe Nutella', 6, '', '', true],
      ['Desserts', 'Crêpe Oreo', 7, '', 'Nutella, Oreo', true],
      ['Desserts', 'Crêpe Crunchy', 7, '', 'Nutella, M&M’s', true],
      ['Desserts', 'Cœur coulant', 6, '', 'Fondant au chocolat', true],
      ['Mocktails', 'Mojito Yäya', 7, 'mojito', 'Classique, passion ou fraise', true],
      ['Mocktails', 'Mango juice', 7, '', '', true],
      ['Boissons chaudes', 'Café', 2.5, '', '', true],
      ['Boissons chaudes', 'Thé à la menthe', 5, '', '', true],
      ['Boissons fraîches', 'Softs', 5, 'soft', '', true],
      ['Boissons fraîches', 'Red Bull', 5, '', '', true],
      ['Boissons fraîches', 'Sirop à l’eau', 5, 'sirop', '', true],
      ['Boissons fraîches', 'Diabolo', 5, 'sirop', '', true]
    ],
    options: [].concat(
      grp('gout', 'Goût', ['Hawaii', 'Love 66', 'Mangana', 'Mi Amor', 'Menthe', 'Menthe sucrée']),
      grp('boisson', 'Boisson comprise', inclus.concat(['Café', 'Thé à la menthe'])),
      grp('soft', 'Soft', softs.concat(['Bouteille d’eau'])),
      grp('softF', 'Boisson (hors Red Bull)', inclus), grp('softF', 'Boisson (hors Red Bull)', mocks, 2),
      grp('mojito', 'Parfum', ['Classique', 'Passion', 'Fraise']),
      grp('mock', 'Mocktail', mocks),
      grp('sirop', 'Parfum', ['Fraise', 'Melon', 'Kiwi', 'Pêche', 'Passion', 'Citron', 'Menthe']),
      grp('dessert', 'Dessert', desserts),
      [['pates', 'Pâtes', 'Carbonara', 0], ['pates', 'Pâtes', 'Saumon', 1]]
    ),
    fidelite: [
      [5, 'Soft (hors Red Bull)', FID_SOFT_], [5, 'Tête offerte', 'Tête supplémentaire'],
      [10, 'Dessert', desserts.join(', ')], [10, 'Chicha tête plate', 'Chicha tête plate'], [10, 'Tête Quasar', 'Tête Quasar supplémentaire'],
      [15, 'Menu Smash', 'Menu Smash'], [15, 'Pause Gourmande', 'Pause Gourmande'],
      [20, 'Menu Smash XL', 'Menu Smash XL'], [20, 'Trio Pasta', 'Trio Pasta'], [20, 'Chicha Quasar', 'Chicha Quasar']
    ],
    sugg: [['Yäya Smash', 'Menu Smash', ''], ['Yäya Smash XL', 'Menu Smash XL', ''],
      ['Pasta Carbo', 'Duo Pasta', 'pates=Carbonara'], ['Pasta Salmon', 'Duo Pasta', 'pates=Saumon']]
      .concat(desserts.map(function (d) { return [d, 'Pause Gourmande', 'dessert=' + d]; })),
    plan: PLAN_V5_.map(function (r) { return r.slice(); }),
    params: [
      [P_EMAIL, Session.getEffectiveUser().getEmail() || '', 'Reçoit le récap à chaque fermeture'],
      [P_FOND, '0', 'Espèces à laisser dans le tiroir quand tu récupères la caisse (monnaie de départ)'],
      [P_OUV, '17:00', 'Sert à calculer le retard à la prise de service'],
      [P_RELANCE, '40', 'Minutes sans commande avant de suggérer un dessert'],
      [P_RELANCE_TETE, '45', 'Minutes après la dernière chicha ou tête servie avant de proposer une tête supplémentaire'],
      [P_URL, '', 'Laisser vide. À remplir seulement si les liens n’apparaissent pas'],
      [P_POS, '48.92746, 2.222845', 'Latitude, longitude du lounge (46 rue Jean Jaurès, Bezons)'],
      [P_RAYON, '150', 'Distance maximale du lounge pour la prise de service'],
      [P_OBJ_MOIS, '', 'CA visé sur le mois : total encaissé (CB + espèces), TTC, hors offerts'],
      [P_OBJ_BEN, '', 'Bénéfice visé sur le mois : CA − salaires − charges fixes − matières consommées − autres achats, avant impôts'],
      [P_SAL, '1400', 'Ce que te coûte l’équipe par mois'],
      [P_CHARGES, '1200', 'Loyer, électricité, assurances… par mois, hors salaires'],
      [P_OBJ_SOIR, '', 'Vide = objectif du mois ÷ nombre de jours du mois'],
      [P_OBJ_PAN, '', 'Panier moyen visé par table encaissée'],
      [P_OBJ_PPERS, '', 'Panier visé par personne'],
      [P_OBJ_TETES, '', 'Têtes supplémentaires vendues pour 10 chichas'],
      [P_OBJ_DESS, '', 'Desserts vendus pour 10 tables'],
      [P_POIDS, '0,6 ; 0,7 ; 0,8 ; 0,9 ; 1,4 ; 1,5 ; 1,1', 'Poids de départ de lundi à dimanche (1 = jour moyen) ; corrigés automatiquement par l’historique'],
      [P_TETES_KG, '45', 'Plus utilisé : le stock se calcule avec les grammes par tête'],
      [P_TOL, '10', 'Au-delà, l’écart de stock ou de rendement s’affiche en rouge'],
      [P_PRIX_GOUT, '50', 'Coût d’un kilo de goût'],
      [P_G_PLATE, '15', 'Goût mis dans une tête plate (chicha tête plate, tête supplémentaire)'],
      [P_G_QUASAR, '20', 'Goût mis dans une tête Quasar (chicha Quasar, tête Quasar supplémentaire)'],
      [P_TAUX_DEF, '25', 'Part du CA dépensée en matières, utilisée pour le minimum tant qu’il n’y a pas 14 soirées pour la mesurer'],
      [P_SEUIL_ESP, '200', 'Au-dessus, le compte rendu et ta page gérant t’invitent à récupérer les espèces du tiroir'],
      [P_ALERTES, 'oui', 'Mail au gérant quand une demande (avance, offert…) ou un message arrive, au plus un toutes les 10 min ; « non » pour couper']
    ]
  };
}


// ===== YÄYA · Logique commune (utilisée par le serveur et par l'appli) =====
// Aucune fonction Google ici : uniquement les règles de calcul.

function r2(v) { return Math.round((+v || 0) * 100) / 100; }
function lineKey(n, d, p) { return [n].concat(d, [r2(p)]).join('|'); }

function findArt(data, n) {
  for (var i = 0; i < data.carte.length; i++) {
    var x = data.carte[i];
    if (x.n === n && x.actif) return x;
  }
  return null;
}

// Prix d'un article avec ses options choisies (suppléments compris).
function priceLine(data, n, sel) {
  var it = findArt(data, n);
  if (!it) throw new Error('Article introuvable sur la carte : ' + n);
  sel = sel || {};
  var p = it.p, d = [];
  it.o.forEach(function (g) {
    var grp = data.options[g];
    if (!grp) throw new Error('Groupe d’options « ' + g + ' » inconnu pour ' + n + '. Vérifie l’onglet Options.');
    var ch = grp.choices.filter(function (c) { return c.n === sel[g]; })[0];
    if (!ch) throw new Error('Choisis : ' + grp.label);
    p += ch.add;
    d.push(ch.n);
  });
  p = r2(p);
  return { n: it.n, d: d, p: p, k: lineKey(it.n, d, p), cat: it.cat };
}

function gross(t) { return t ? r2(t.lines.reduce(function (a, l) { return a + l.p * l.q; }, 0)) : 0; }
function giftTot(t) { return t && t.gifts ? r2(t.gifts.reduce(function (a, g) { return a + g.amount; }, 0)) : 0; }
// Articles offerts ou annulés après service (validés ou en attente du gérant) : retirés de l'addition.
function offTot(t) { return t && t.offs ? r2(t.offs.reduce(function (a, o) { return a + o.amount; }, 0)) : 0; }
// Promotion exceptionnelle (10, 20 ou 30 %) sur l'addition, cadeaux fidélité déduits.
function promoAmt(t) { return t && t.promo ? r2(Math.max(0, gross(t) - giftTot(t) - offTot(t)) * t.promo.pct / 100) : 0; }
function tot(t) { return t ? Math.max(0, r2(gross(t) - giftTot(t) - offTot(t) - promoAmt(t))) : 0; }
function paidTot(t) { return t && t.payments ? r2(t.payments.reduce(function (a, p) { return a + p.amount; }, 0)) : 0; }
function rest(t) { return Math.max(0, r2(tot(t) - paidTot(t))); }
function cnt(t) { return t ? t.lines.reduce(function (a, l) { return a + l.q; }, 0) : 0; }

// Unités d'une table, avec le prix de chaque unité (cadeaux déduits) et les unités déjà payées.
function units(t) {
  return t.lines.map(function (u) {
    var gifts = (t.gifts || []).filter(function (x) { return x.k === u.k; }).map(function (x) { return x.amount; })
      .concat((t.offs || []).filter(function (x) { return x.k === u.k; }).map(function (x) { return x.amount; }));
    var prices = [];
    for (var i = 0; i < u.q; i++) prices.push(r2(u.p - (gifts[i] || 0)));
    var paid = Math.min(u.q, (t.paidU || {})[u.k] || 0);
    return { k: u.k, n: u.n, d: u.d, p: u.p, q: u.q, prices: prices, paid: paid, left: u.q - paid };
  });
}
function selAmount(t, sel) {
  return r2(units(t).reduce(function (a, u) {
    var c = sel[u.k] || 0;
    return a + u.prices.slice(u.paid, u.paid + c).reduce(function (x, y) { return x + y; }, 0);
  }, 0));
}
function equalPart(t) {
  var sp = t.split;
  if (!sp) return 0;
  var r = rest(t);
  return sp.done >= sp.n - 1 ? r : r2(r / (sp.n - sp.done));
}

// Fidélité : l'article de la commande que le cadeau rend gratuit (le plus cher parmi ceux autorisés).
function giftLine(t, g) {
  if (!g.articles.length) return null;
  var used = function (k) { return (t.gifts || []).concat(t.offs || []).filter(function (x) { return x.k === k; }).length; };
  return t.lines
    .filter(function (l) { return g.articles.indexOf(l.n) >= 0 && l.q - used(l.k) > 0; })
    .sort(function (a, b) { return b.p - a.p; })[0] || null;
}
// Le cadeau couvre le prix de carte de l'article ; les suppléments restent payants.
function giftAmount(data, l) {
  var a = findArt(data, l.n);
  return r2(Math.min(l.p, a ? a.p : l.p));
}


// ===== Écran de l'appli (ne pas modifier) =====
var INDEX_HTML = "<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Manrope:wght@400;600;700&family=Marcellus&display=swap\">\n<style>\nhtml,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}\n[hidden]{display:none!important}\nhtml,body{margin:0}\n\n/* Layout : appli une colonne pour iPhone, ticket en panneau latéral sur iPad (≥ 740px, donc aussi en portrait) */\n:root{\n  --bg:#F5F4F0; --surface:#FFFFFF; --line:#E2E1DC; --muted:#85837D; --fg:#1D1D1B;\n  --gold:#9C7B3F; --gold-soft:#F3ECDD; --warn:#B4532A; --ok:#3E7A57; --scrim:rgba(20,20,18,.38);\n  --ui:\"Manrope\",system-ui,-apple-system,\"Segoe UI\",sans-serif;\n  --display:\"Marcellus\",Georgia,\"Times New Roman\",serif;\n}\n@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){\n  --bg:#141412; --surface:#1E1D1A; --line:#33312C; --muted:#9B988F; --fg:#EDEBE5;\n  --gold:#CDAE72; --gold-soft:#2C271C; --warn:#E08A62; --ok:#7DBE97; --scrim:rgba(0,0,0,.55); color-scheme:dark}}\n:root[data-theme=\"dark\"]{\n  --bg:#141412; --surface:#1E1D1A; --line:#33312C; --muted:#9B988F; --fg:#EDEBE5;\n  --gold:#CDAE72; --gold-soft:#2C271C; --warn:#E08A62; --ok:#7DBE97; --scrim:rgba(0,0,0,.55); color-scheme:dark}\n\n*{box-sizing:border-box}\nhtml{height:100%;box-sizing:border-box}\nbody{height:100%;background:var(--bg);color:var(--fg);font-family:var(--ui);font-size:15px;line-height:1.4;-webkit-tap-highlight-color:transparent}\nbutton{font:inherit;color:inherit;cursor:pointer;border:0;background:none}\nbutton:focus-visible{outline:2px solid var(--gold);outline-offset:2px}\nbutton:disabled{opacity:.4;cursor:default}\nh1,h2,h3{margin:0;text-wrap:balance}\nh1{font-size:22px;font-weight:700}\nh2{font-size:18px;font-weight:700}\nh3{font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);font-weight:700}\nsmall{font-size:12px;color:var(--muted)}\n.muted{color:var(--muted)}\n.gut{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}\n\n.app{height:100%;display:flex;flex-direction:column}\n.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:12px;border-bottom:1px solid var(--line);background:var(--bg)}\n.brand{font-family:var(--display);font-size:20px;letter-spacing:.2em}\n.brand span{color:var(--gold)}\n.pill{font-size:11px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);border-radius:99px;padding:3px 10px;color:var(--muted)}\n#view{flex:1;min-height:0;overflow:auto}\n#view.lock{overflow:hidden}\n.pad{padding-block:18px 28px}\n.sechead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:14px}\n.note{font-size:13px;color:var(--muted);border:1px dashed var(--line);border-radius:12px;padding:10px 12px;margin-bottom:16px}\n\n/* Navigation basse */\n.tabs{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);background:var(--surface)}\n.tabs button{padding:10px 4px 12px;font-size:13px;font-weight:600;color:var(--muted);position:relative;display:flex;flex-direction:column;align-items:center;gap:4px}\n.tabs button.on{color:var(--fg)}\n.tabs button.on::before{content:\"\";position:absolute;top:-1px;left:30%;right:30%;height:2px;background:var(--gold);border-radius:2px}\n.tabs svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.7}\n.badge{position:absolute;top:6px;left:calc(50% + 8px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--gold);color:var(--surface);font-size:11px;line-height:18px;font-variant-numeric:tabular-nums}\n\n/* Tables */\n.tgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}\n@media (min-width:600px){.tgrid{grid-template-columns:repeat(5,minmax(0,1fr))}}\n.tbl{position:relative;aspect-ratio:1/.92;max-width:100%;border:1px solid var(--line);background:var(--surface);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}\n.tbl .tn{font-family:var(--display);font-size:26px}\n.tbl .ts{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}\n.tbl.open{border-color:var(--gold);background:var(--gold-soft)}\n.tbl.open .ts{color:var(--fg);font-weight:700}\n.floor{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;max-width:560px;margin:0 auto;position:relative}\n.zone{background:var(--surface);border-radius:16px;margin:-6px;z-index:0}\n.floor .tbl{z-index:1;aspect-ratio:1/1;border-radius:12px;gap:0}\n.floor .tbl .tn{font-size:20px;line-height:1.1}\n.floor .tbl .ts{font-size:11px}\n.floor .tbl:not(.open){background:var(--bg)}\n.entree{grid-column:1/4;text-align:center;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-top:10px}\n.entree::before{content:\"\";display:block;width:40%;height:3px;margin:0 auto 6px;border-radius:2px;background:var(--gold)}\n.dot{position:absolute;top:8px;right:8px;width:8px;height:8px;border-radius:50%;background:var(--warn)}\n.tete{position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);z-index:2;white-space:nowrap;font-style:normal;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--ok);color:#fff;border-radius:99px;padding:1px 7px}\n.legend .lt{width:auto;height:auto;border-radius:99px;padding:0 5px;background:var(--ok);color:#fff;font-style:normal;font-size:9px;font-weight:700;text-transform:uppercase}\n.persgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}\n.persgrid button{height:58px;border-radius:14px;border:1px solid var(--line);background:var(--surface);font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}\n.persgrid button.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}\n.persline{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:14px;padding:8px 0;border-top:1px solid var(--line)}\n.matchbar{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:8px 12px;margin-bottom:12px;font-size:14px}\n.matchbar.on{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 12%,var(--surface))}\n.matchbar b{font-weight:700}\n.mtag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ok);border:1px solid var(--ok);border-radius:99px;padding:0 6px;margin-left:6px;vertical-align:1px}\n.cmp{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:6px}\n.cmp th,.cmp td{padding:8px 6px;border-bottom:1px solid var(--line);text-align:right;font-variant-numeric:tabular-nums}\n.cmp th:first-child,.cmp td:first-child{text-align:left}\n.cmp th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700}\n.mgr a{color:var(--gold);font-weight:600}\n.seg.seg5{grid-template-columns:repeat(5,1fr)}\n.seg.seg5 button{padding:9px 1px;font-size:12px}\n.wk th,.wk td{white-space:nowrap;padding:8px 4px;font-size:13px}\n.floor .lbl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.tiers{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:14px;margin-bottom:12px}\n.tiers .thead{display:flex;justify-content:space-between;align-items:baseline;gap:10px}\n.tiers .thead b{font-size:22px;font-variant-numeric:tabular-nums}\n.tbar{position:relative;height:14px;border-radius:7px;background:var(--line);margin:12px 0 8px;overflow:visible}\n.tfill{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:var(--gold)}\n.tiers.ok .tfill{background:var(--ok)}\n.tiers.bad .tfill{background:var(--warn)}\n.tmark{position:absolute;top:-4px;bottom:-4px;width:3px;border-radius:2px;transform:translateX(-50%)}\n.tmark.min{background:var(--warn)}.tmark.obj{background:var(--fg)}.tmark.top{background:var(--ok)}\n.tleg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--muted)}\n.tleg i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;vertical-align:0}\n.tiers .gst{font-weight:700;font-size:13px;margin-top:6px;display:block}\n.tiers.ok .gst{color:var(--ok)}.tiers.bad .gst{color:var(--warn)}\n.levers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}\n@media (min-width:760px){.levers.k4{grid-template-columns:repeat(4,minmax(0,1fr))}.levers.k3{grid-template-columns:repeat(3,minmax(0,1fr))}}\n.lever h3{margin:0}.lever .kd{font-weight:600}.lever .kd.up{color:var(--ok)}.lever .kd.dn{color:var(--warn)}\n.lever{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:12px;min-width:0}\n.lever b{display:block;font-size:20px;font-variant-numeric:tabular-nums;margin-top:4px}\n.lever small{display:block}\n.lever .lb{height:6px;border-radius:3px;background:var(--line);margin-top:8px;overflow:hidden}\n.lever .lb span{display:block;height:100%;background:var(--gold)}\n.lever.ok .lb span{background:var(--ok)}.lever.bad .lb span{background:var(--warn)}\n.lever.ok b{color:var(--ok)}.lever.bad b{color:var(--warn)}\n.wk td.ok{color:var(--ok);font-weight:700}.wk td.bad{color:var(--warn);font-weight:700}\n.wk tr.today td{background:var(--gold-soft)}\n.stk td.red{color:var(--warn);font-weight:700}.stk td.okc{font-weight:700}\n.stk small{display:block;color:var(--muted);font-size:11px}\n.invlist{display:grid;gap:8px}\n.invlist label{display:grid;grid-template-columns:minmax(0,1fr) 110px;align-items:center;gap:10px;font-size:14px;font-weight:600;color:var(--fg)}\n.invlist input,.cline input[type=text],.cline input[inputmode]{font:inherit;font-size:16px;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 10px;width:100%;min-width:0;text-align:right}\n.cline{display:grid;grid-template-columns:minmax(0,1fr) 92px 64px;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:14px}\n.cline small{display:block;color:var(--muted);font-size:12px}\n.cline.off span:first-child{opacity:.5}\n.cline .sw{display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:12px;color:var(--muted)}\n.cline .sw input{width:20px;height:20px;accent-color:var(--ok)}\n.gchips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}\n.gchip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);border-radius:99px;padding:6px 6px 6px 12px;font-size:14px;font-weight:600}\n.gchip button{width:24px;height:24px;border-radius:50%;color:var(--muted)}\n.gchip button.armed{background:var(--warn);color:#fff}\n.inline2{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}\n.inline2 input{font:inherit;font-size:16px;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;min-width:0}\n.cgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px}\n.cgrid label{display:grid;grid-template-columns:62px minmax(0,1fr);align-items:center;gap:8px;font-size:14px;font-weight:700;color:var(--fg)}\n.cgrid input{font:inherit;font-size:18px;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px;width:100%;min-width:0;text-align:center}\n.ctotal{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--line);padding-top:10px;font-weight:700}\n.ctotal b{font-size:22px;font-variant-numeric:tabular-nums}\n.btnrow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 6px}\n.btnrow.b3{grid-template-columns:repeat(3,minmax(0,1fr))}\n.legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;font-size:12px;color:var(--muted)}\n.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}\n\n/* Prise de commande */\n.order{height:100%;display:grid;grid-template-columns:minmax(0,1fr)}\n.omain{min-height:0;display:flex;flex-direction:column}\n.ohead{display:flex;align-items:center;gap:12px;padding-block:12px 8px}\n.back{font-weight:600;color:var(--muted);padding:6px 0}\n.otitle{font-family:var(--display);font-size:22px;flex:1;text-align:center}\n.ototal{font-weight:700;font-variant-numeric:tabular-nums;min-width:64px;text-align:right}\n.cats{display:flex;gap:8px;overflow-x:auto;padding-block:6px 12px;scrollbar-width:none}\n.cats::-webkit-scrollbar{display:none}\n.chip{flex:0 0 auto;border:1px solid var(--line);background:var(--surface);border-radius:99px;padding:8px 14px;font-weight:600;font-size:14px}\n.chip.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}\n.chip small{color:inherit;opacity:.75}\n.scroll{flex:1;min-height:0;overflow:auto;padding-block:2px 16px}\n.igrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n@media (min-width:600px){.igrid{grid-template-columns:repeat(3,minmax(0,1fr))}}\n.item{min-height:84px;text-align:left;border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:2px}\n.item:active{background:var(--gold-soft)}\n.iname{font-weight:700;font-size:15px}\n.isub{font-size:12px;color:var(--muted)}\n.iprice{margin-top:auto;padding-top:6px;color:var(--gold);font-weight:700;font-variant-numeric:tabular-nums}\n.iprice small{color:var(--gold);font-weight:600}\n.bar{display:flex;gap:10px;padding-block:10px;border-top:1px solid var(--line);background:var(--bg)}\n.bar>*{flex:1}\n.side{display:none}\n@media (min-width:740px){\n  .order{grid-template-columns:minmax(0,1fr) clamp(290px,34vw,360px)}\n  .side{display:block;overflow:auto;border-left:1px solid var(--line);background:var(--surface);padding:18px 20px}\n  .bar{display:none}\n}\n\n.primary,.ghost{border-radius:12px;padding:13px 14px;font-weight:700;text-align:center}\n.primary{background:var(--fg);color:var(--bg)}\n.ghost{border:1px solid var(--line);background:var(--surface)}\n\n/* Ticket */\n.tk{display:flex;flex-direction:column;gap:12px}\n.lines{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}\n.lines li{display:grid;grid-template-columns:30px minmax(0,1fr) auto auto;gap:8px;align-items:start;padding:9px 0;border-bottom:1px solid var(--line)}\n.lines.new li .q{color:var(--gold)}\n.q{font-weight:700;font-variant-numeric:tabular-nums}\n.ln{display:flex;flex-direction:column;min-width:0}\n.lp{font-variant-numeric:tabular-nums;font-weight:600}\n.minus{width:28px;height:28px;border-radius:8px;border:1px solid var(--line);line-height:1;font-size:18px}\n.tktot{display:flex;justify-content:space-between;align-items:baseline;font-size:17px}\n.tktot strong{font-size:22px;font-variant-numeric:tabular-nums}\n.tkact{display:grid;gap:8px}\n\n/* Feuille d'options */\n.scrim{position:fixed;inset:0;background:var(--scrim);display:flex;align-items:flex-end;justify-content:center;z-index:20}\n.sheet{background:var(--surface);width:100%;max-width:560px;max-height:86%;overflow:auto;border-radius:20px 20px 0 0;padding:20px max(16px,env(safe-area-inset-right,0px)) calc(20px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));display:flex;flex-direction:column;gap:16px}\n.grp{display:flex;flex-direction:column;gap:8px}\n.chips{display:flex;flex-wrap:wrap;gap:8px}\n.sheetact{display:grid;grid-template-columns:1fr 2fr;gap:10px;position:sticky;bottom:0;background:var(--surface);padding-top:6px}\n\n/* À préparer */\n.plist{display:grid;gap:12px}\n@media (min-width:700px){.plist{grid-template-columns:repeat(2,minmax(0,1fr))}}\n.prep{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px}\n.prep header{display:flex;justify-content:space-between;align-items:baseline}\n.prep header strong{font-family:var(--display);font-size:20px;font-weight:400}\n.prep ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}\n.prep li{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline}\n.prep li small{flex-basis:100%;padding-left:28px}\n.age{font-size:12px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums}\n.age.late{color:var(--warn)}\n.empty{color:var(--muted);max-width:44ch}\n\n/* Addition */\n.bill{display:flex;flex-direction:column;gap:14px;max-width:560px}\n.due{border:1px solid var(--gold);background:var(--gold-soft);border-radius:16px;padding:16px;display:flex;justify-content:space-between;align-items:center;gap:12px}\n.due span{font-weight:600}\n.due strong{font-size:34px;font-variant-numeric:tabular-nums}\n.payrow{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.warnline{font-size:13px;color:var(--warn)}\n\n/* Récap */\n.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:18px}\n.stat{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:14px}\n.stat b{display:block;font-size:24px;font-variant-numeric:tabular-nums;margin-top:4px}\n.stat small{display:block;margin-top:2px}\n.bars{list-style:none;margin:10px 0 18px;padding:0;display:flex;flex-direction:column;gap:8px}\n.bars li{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,2fr) 28px;gap:10px;align-items:center;font-size:14px}\n.bars .track{height:10px;border-radius:5px;background:var(--line);overflow:hidden}\n.bars .fill{height:100%;background:var(--gold);border-radius:5px}\n.bars .n{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}\n\n.cash{display:grid;gap:12px}\n@media (min-width:700px){.cash{grid-template-columns:repeat(2,minmax(0,1fr))}}\n.ccard{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:12px}\n.ccard header{display:flex;justify-content:space-between;align-items:baseline;gap:10px}\n.ccard header strong{font-family:var(--display);font-size:20px;font-weight:400}\n.ccard .amt{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums}\n.ccard .link{font-weight:600;color:var(--muted);text-decoration:underline;text-underline-offset:3px;align-self:flex-start;padding:2px 0}\n.primary.armed{background:var(--gold);color:var(--surface)}\n.tbl.patron{aspect-ratio:auto;width:100%;flex-direction:row;justify-content:space-between;padding:14px 16px;margin:0 auto 18px;max-width:560px;border-style:dashed}\n.tbl.patron .tn{font-family:var(--ui);font-size:16px;font-weight:700}\n.links{display:flex;flex-wrap:wrap;gap:18px}\n.links .link{font-weight:600;color:var(--muted);text-decoration:underline;text-underline-offset:3px;padding:2px 0}\n.lines.gifts li{grid-template-columns:minmax(0,1fr) auto auto}\n.lines.gifts .lp{color:var(--ok)}\n.due span small{display:block;font-weight:400}\n.chip:disabled{opacity:.45}\n.giftnote{font-size:13px;color:var(--ok);margin:0}\nbutton.pill{cursor:pointer;font-weight:700}\nbutton.pill:hover{color:var(--fg);border-color:var(--gold)}\n.ghost.armed{background:var(--gold);color:var(--surface);border-color:var(--gold)}\n.gate{min-height:100%;display:flex;align-items:center;justify-content:center}\n.gatebox{max-width:420px;display:flex;flex-direction:column;gap:14px;text-align:center;align-items:stretch}\n.gatebox svg{width:72px;height:72px;margin:0 auto;stroke:var(--gold);fill:none;stroke-width:1.6}\n.gatebox h1{font-family:var(--display);font-weight:400;font-size:28px}\n.pin{font:inherit;font-size:28px;letter-spacing:.5em;text-align:center;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--fg);width:100%}\n.closebox{margin-top:22px;padding-top:18px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px}\n.closebox .ghost{width:100%}\n[hidden]{display:none!important}\n.mgr section{margin-bottom:24px}\n.mgr .stats{grid-template-columns:repeat(3,minmax(0,1fr))}\n.mgr .stat b{font-size:20px}\n.mgr .stat{padding:12px}\n.hist li{grid-template-columns:84px minmax(0,1fr) auto}\n.mgr h2{font-size:15px;margin-bottom:10px}\n.status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}\n.status .stat b{font-size:20px}\n.okc{color:var(--ok)!important}.latec{color:var(--warn)!important}\n.sales{list-style:none;margin:0;padding:0}\n.sales li{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:10px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}\n.sales.wd li{grid-template-columns:78px minmax(0,1fr) auto}\n.sales li small{display:block}\n.method{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);border-radius:99px;padding:2px 8px;margin-left:6px}\n.hours{display:flex;align-items:flex-end;gap:6px;height:120px;margin-top:8px;border-bottom:1px solid var(--line)}\n.hours div{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:4px}\n.hours .col{width:100%;max-width:34px;background:var(--gold);border-radius:6px 6px 0 0}\n.hours .v{font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}\n.hlabels{display:flex;gap:6px;margin-top:4px}\n.hlabels span{flex:1;min-width:0;text-align:center;font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}\n.seg{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:12px;padding:3px;background:var(--bg);gap:3px}\n.seg button{padding:9px 4px;border-radius:9px;font-weight:600;font-size:13px;color:var(--muted)}\n.seg button.on{background:var(--surface);color:var(--fg);box-shadow:0 1px 2px var(--line)}\n.ulist{list-style:none;margin:0;padding:0}\n.ulist li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}\n.step{display:flex;align-items:center;gap:10px}\n.step button{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:var(--surface);font-size:18px}\n.step b{min-width:16px;text-align:center;font-variant-numeric:tabular-nums}\n.sugg{display:flex;align-items:center;gap:10px;background:var(--gold-soft);border:1px solid var(--gold);border-radius:12px;padding:10px 12px;margin-bottom:6px;font-size:14px}\n.sugg span{flex:1;min-width:0}\n.sugg span b{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}\n.sugg .primary{padding:9px 12px;font-size:13px}\n.prep li{align-items:center}\n.prep li .pn{flex:1;min-width:0}\n.prep .pc{width:26px;height:26px;font-size:15px}\n.recap{border:1px solid var(--gold);background:var(--gold-soft);border-radius:14px;padding:14px;margin-bottom:22px}\n.recap p{margin:6px 0 0;font-size:14px}\n.fondrow{display:flex;align-items:center;gap:8px;margin:12px 0 6px;font-weight:600;font-size:14px;flex-wrap:wrap}\n.fondrow input{font:inherit;width:96px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--fg)}\n#toast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translate(-50%,10px);background:var(--fg);color:var(--bg);padding:10px 16px;border-radius:99px;font-weight:600;font-size:14px;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;z-index:30;max-width:calc(100% - 32px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n#toast.show{opacity:1;transform:translate(-50%,0)}\n@media (prefers-reduced-motion:reduce){#toast{transition:none}}\n\n/* ---- Vraie version ---- */\n.floor{max-width:560px}\n.dot.unsent{background:var(--gold)}\n#toast.err{background:var(--warn);color:#fff}\n#busy{position:fixed;top:0;left:0;right:0;height:3px;z-index:40;background:linear-gradient(90deg,transparent,var(--gold),transparent);background-size:50% 100%;background-repeat:no-repeat;animation:slide 1s linear infinite}\n@keyframes slide{from{background-position:-50% 0}to{background-position:150% 0}}\n@media (prefers-reduced-motion:reduce){#busy{animation:none;background:var(--gold)}}\n.qrwrap{background:#fff;padding:14px;border-radius:12px;display:inline-block;margin-bottom:8px}\n.qrwrap img,.qrwrap canvas{display:block}\n.hist li{display:block;padding:0}\n.hrow{width:100%;display:grid;grid-template-columns:84px minmax(0,1fr) auto;gap:10px;align-items:baseline;padding:10px 0;text-align:left;font-variant-numeric:tabular-nums}\n.hist li.sel .hrow{background:var(--gold-soft);border-radius:10px;padding-left:8px;padding-right:8px}\n.hrow small{display:block}\n.ghost.danger{color:var(--warn);border-color:var(--warn)}\n.ghost.danger.armed{background:var(--warn);color:#fff}\n.note-in{font:inherit;font-size:16px;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;width:100%;resize:vertical}\n.comment{margin:0;white-space:pre-wrap;border-left:3px solid var(--gold);padding-left:12px}\n.sales li.crs{grid-template-columns:84px minmax(0,1fr) auto;align-items:center}\n.ghost.small{padding:7px 12px;font-size:13px;border-radius:10px}\n.tabs button{font-size:12px}\n.mtabs{padding-block:14px 0}\n.seg2{grid-template-columns:repeat(2,1fr);max-width:320px}\n.seg4{grid-template-columns:repeat(4,1fr)}\n.seg4 button{padding:9px 2px;font-size:12.5px}\n/* Code personnel */\n.dots{display:flex;justify-content:center;gap:14px;margin:4px 0}\n.dots i{width:14px;height:14px;border-radius:50%;border:2px solid var(--gold)}\n.dots i.on{background:var(--gold)}\n.keypad{display:grid;grid-template-columns:repeat(3,72px);gap:12px;justify-content:center}\n.keypad button{height:64px;border-radius:50%;border:1px solid var(--line);background:var(--surface);font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}\n.keypad button:active{background:var(--gold-soft)}\n.keypad button.erase{border:0;background:none;font-size:15px;color:var(--muted)}\n.linkbtn{color:var(--muted);text-decoration:underline;font-size:14px;padding:6px}\n.menu{display:grid;gap:10px}\n.menu .ghost{width:100%}\n/* Jauges d'objectifs */\n.gauges{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}\n.gauge{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:12px;text-align:center;min-width:0}\n.gauge h3{text-align:left}\n.gauge svg{width:100%;max-width:170px;display:block;margin:4px auto 2px}\n.gbg,.gfill{fill:none;stroke-width:10;stroke-linecap:round}\n.gbg{stroke:var(--line)}\n.gfill{stroke:var(--gold)}\n.gauge.ok .gfill{stroke:var(--ok)}\n.gauge.bad .gfill{stroke:var(--warn)}\n.gtick{stroke:var(--fg);stroke-width:2.5;stroke-linecap:round}\n.gpct{font-family:var(--ui);font-size:17px;font-weight:700;fill:var(--fg)}\n.gauge b{display:block;font-size:18px;font-variant-numeric:tabular-nums;white-space:nowrap}\n.gauge small{display:block;margin-top:2px}\n.gauge .gst{font-weight:600}\n.gauge.ok .gst{color:var(--ok)}\n.gauge.bad .gst{color:var(--warn)}\n.gauge.empty b{color:var(--muted)}\n.defs{font-size:13px;color:var(--muted);border:1px dashed var(--line);border-radius:12px;padding:10px 12px;margin:0 0 18px;display:grid;gap:6px}\n.defs b{color:var(--fg)}\n/* Équipe */\n.people{display:grid;gap:10px}\n.person{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:14px;display:grid;gap:8px}\n.person header{display:flex;justify-content:space-between;align-items:baseline;gap:10px}\n.person .code{font-size:26px;font-weight:700;letter-spacing:.35em;font-variant-numeric:tabular-nums}\n.person p{margin:0;font-size:13px;color:var(--muted)}\n.person .links{display:flex;gap:16px;flex-wrap:wrap}\n.link.danger{color:var(--warn)}\n.link.armed{color:#fff;background:var(--warn);border-radius:8px;padding:2px 8px;text-decoration:none}\n.achform{display:grid;gap:12px;max-width:520px}\n.achform label{display:grid;gap:4px;font-size:13px;font-weight:600;color:var(--muted)}\n.achform input,.achform select{font:inherit;font-size:16px;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;width:100%;min-width:0}\n.achform .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}\n.sales li.ach{grid-template-columns:52px minmax(0,1fr) auto 30px}\n.minus.armed{background:var(--warn);color:#fff;border-color:var(--warn)}\n.floor .lbl{align-self:center;text-align:center;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border:1px dashed var(--line);border-radius:10px;padding:10px 4px}\n.mgr .stat b{font-size:18px;white-space:nowrap}\n.floor{background:var(--surface);border-radius:16px;padding:8px}\n.floor .tbl:not(.open){background:var(--bg)}\n\n.couts td:last-child{text-align:right;white-space:nowrap;font-weight:600}.couts small{display:block;color:var(--muted);font-size:12px;font-weight:400;margin-top:2px}.couts tr.tot td{font-weight:700;border-top:2px solid var(--line)}\n.menage .msteps{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:8px}\n.menage .msteps li{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);font-weight:600}\n.menage .msteps li span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--line);font-size:13px;flex:none}\n.menage .msteps li small{margin-left:auto;color:var(--muted);font-weight:400}\n.menage .msteps li.cur{border-color:var(--gold)}.menage .msteps li.cur span{background:var(--gold);border-color:var(--gold);color:#fff}\n.menage .msteps li.done{opacity:.6}.menage .msteps li.done span{background:var(--ok);border-color:var(--ok);color:#fff}\n.mtimer{text-align:center;padding:22px 16px;margin-bottom:16px;border:1px solid var(--line);border-radius:18px;background:var(--surface)}\n.mtimer h2{margin:0 0 6px;font-size:18px}.mtimer b{display:block;font-size:64px;line-height:1.05;font-variant-numeric:tabular-nums;letter-spacing:-1px}\n.mtimer b.over{font-size:34px;color:var(--ok)}\n.mbar{height:8px;border-radius:6px;background:var(--line);overflow:hidden;margin-top:14px}.mbar i{display:block;height:100%;background:var(--gold);transition:width 1s linear}\n.promoline{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:10px 12px;border:1px solid var(--warn);border-radius:12px;margin:10px 0;font-size:14px}\n.promoline span{flex:1 1 180px}.promoline strong{white-space:nowrap}\n.stk td:not(:first-child){white-space:nowrap}.stk td:last-child{white-space:normal;min-width:62px}\n.cout{display:inline-flex;align-items:center;gap:4px;font-weight:400}.cout input{width:74px;font:inherit;font-size:13px;padding:2px 6px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--fg);text-align:right}\n.promobox{border:1px solid var(--warn);border-radius:16px;padding:14px 14px 10px;margin-bottom:18px}.promobox h2{margin-top:0}\n/* v14 : messages, demandes à valider, caisse */\n.tabs{grid-template-columns:repeat(5,1fr)}\n.seg.seg6{grid-template-columns:repeat(6,1fr)}\n.seg.seg6 button{padding:9px 0;font-size:11.5px}\n.seg.seg3{grid-template-columns:repeat(3,1fr)}\n.tbadge{display:inline-block;min-width:16px;height:16px;line-height:16px;border-radius:8px;background:var(--warn);color:#fff;font-size:10px;font-weight:700;font-style:normal;padding:0 4px;margin-left:3px;vertical-align:1px}\n.topr{display:flex;align-items:center;gap:8px}\n.msgbtn{font-size:12px;font-weight:700;border:1px solid var(--line);border-radius:99px;padding:4px 12px;color:var(--fg);background:var(--surface)}\n.msgbtn{text-decoration:none}\n.msgbtn .badge{position:static;display:inline-block;margin-left:6px;vertical-align:1px}\n.msgs .thread{display:flex;flex-direction:column;gap:8px;margin:4px 0 12px}\n.bub{max-width:84%;align-self:flex-start;background:var(--surface);border:1px solid var(--line);border-radius:14px 14px 14px 4px;padding:8px 12px}\n.bub.me{align-self:flex-end;background:var(--gold-soft);border-color:var(--gold);border-radius:14px 14px 4px 14px}\n.bub.sys{border-style:dashed}\n.bub p{margin:2px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px}\n.bub small{display:block;font-size:11px}\n.dayhd{align-self:center;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:8px 0 0}\n.chatform{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;position:sticky;bottom:0;background:var(--bg);padding:10px 0 4px;border-top:1px solid var(--line)}\n.chatform textarea{font:inherit;font-size:16px;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px;resize:none;min-height:46px;max-height:140px}\n.dem{border:1px solid var(--warn);border-radius:14px;padding:12px 14px;margin-bottom:10px;background:var(--surface);display:grid;gap:6px}\n.dem header{display:flex;justify-content:space-between;align-items:baseline;gap:10px}\n.dem header b{font-size:18px;font-variant-numeric:tabular-nums}\n.dem p{margin:0;font-size:14px}\n.dem .btnrow{margin:4px 0 0}\n.dtype{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--warn)}\n.dchip{display:inline-block;font-size:11px;font-weight:700;border-radius:99px;padding:0 8px;border:1px solid var(--line);color:var(--muted);vertical-align:1px}\n.dchip.ok{color:var(--ok);border-color:var(--ok)}.dchip.bad{color:var(--warn);border-color:var(--warn)}.dchip.wait{color:var(--gold);border-color:var(--gold)}\n.todo{border:1px solid var(--warn);border-radius:16px;padding:14px 14px 6px;margin-bottom:18px;min-width:0}\n.todo.calm{border-color:var(--line)}\n.todo .empty{margin:0 0 10px;font-size:14px}\n.duo{display:grid;grid-template-columns:minmax(0,1fr);gap:0 14px;align-items:start}\n@media (min-width:760px){.duo{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}\n.alerts{margin-bottom:12px}\n.lever.live{border-color:var(--gold)}\n.tfill.pend{background:var(--gold);opacity:.35;border-radius:0 7px 7px 0}\n.tiers.ok .tfill.pend,.tiers.bad .tfill.pend{background:var(--gold)}\n.tleg i.pendi{background:var(--gold);opacity:.45}\n.todo h2{margin-bottom:6px}\n.todo .promobox{border:0;padding:0;margin:10px 0 0}\n.todoline{display:flex;justify-content:space-between;align-items:baseline;gap:10px;width:100%;text-align:left;padding:10px 0;border-bottom:1px solid var(--line)}\n.todoline span{color:var(--muted);font-size:13px;text-align:right}\n.tonight{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px 10px;font-size:13px;border:1px dashed var(--line);border-radius:12px;padding:9px 12px;margin-bottom:12px}\n.big{display:block;font-size:28px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.15;margin-top:4px;white-space:nowrap}\n.chero{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:16px;margin-bottom:18px}\n.chero.warn{border-color:var(--warn)}\n.chero small{display:block;margin-top:4px}\n.mhero{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:14px;margin-bottom:18px;display:grid;gap:12px}\n.mhero .mrow{display:grid;grid-template-columns:1fr 1fr;gap:12px}\n.mhero .mrow .big{font-size:23px}\n.mhero .tiers{border:0;padding:0;margin:0;background:none}\n.mhero small{display:block}\n.mkey{margin:0;font-size:14px;border-left:3px solid var(--gold);padding-left:10px}\n.quote{margin:0 0 14px;border-left:3px solid var(--gold);padding:2px 0 2px 12px;font-style:italic;white-space:pre-wrap}\n.quote small{display:block;font-style:normal}\n.sales.mvl li{grid-template-columns:52px minmax(0,1fr) auto 30px}\n.tapd{opacity:.55;transition:opacity .06s}\n.hmoney{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:10px 0 12px}\n.hmoney span{display:flex;flex-direction:column;gap:2px;padding:8px 12px;border:1px solid var(--line);border-radius:12px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}\n.hmoney b{font-size:20px;color:var(--fg);text-transform:none;letter-spacing:0;font-variant-numeric:tabular-nums}\n.cmd{list-style:none;margin:0 0 6px;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}\n.cmd li{display:flex;gap:8px;align-items:baseline;padding:9px 12px;border:1px solid var(--line);border-radius:12px;font-size:14px;min-width:0}\n.cmd li b{font-variant-numeric:tabular-nums;color:var(--gold)}\n.cmd li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n\n/* ============ v22 · habillage « lounge de nuit » : papier clair, encre, laiton ; les chiffres en Marcellus ============ */\n:root{\n  --bg:#F4F2EC; --surface:#FFFFFF; --raise:#FAF8F3; --line:#E4E0D6; --muted:#7C7970; --fg:#1B1A17;\n  --gold:#96742F; --gold-soft:#F3EBD9; --warn:#B4532A; --ok:#3B7556;\n  --night:#161513; --night-2:#211F1B; --night-line:#39352D; --night-fg:#F2EFE7; --night-muted:#ABA598; --brass:#D9BB7C;\n  --sh:0 1px 0 rgba(27,26,23,.03),0 12px 26px -22px rgba(27,26,23,.3);\n  --r-l:22px; --r-m:16px; --r-s:12px;\n  --title:\"Fraunces\",\"Marcellus\",Georgia,serif;\n}\n@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){\n  --bg:#100F0D; --surface:#1A1916; --raise:#211F1B; --line:#2F2C26; --muted:#A09B90; --fg:#F0EDE5;\n  --gold:#D9BB7C; --gold-soft:#2B2619; --warn:#E9916A; --ok:#86C7A0; --night:#1C1A17; --night-2:#262420;\n  --navon:#332D20; --sh:inset 0 1px 0 rgba(255,255,255,.035)}}\n:root[data-theme=\"dark\"]{\n  --bg:#100F0D; --surface:#1A1916; --raise:#211F1B; --line:#2F2C26; --muted:#A09B90; --fg:#F0EDE5;\n  --gold:#D9BB7C; --gold-soft:#2B2619; --warn:#E9916A; --ok:#86C7A0; --night:#1C1A17; --night-2:#262420;\n  --navon:#332D20; --sh:inset 0 1px 0 rgba(255,255,255,.035)}\n\nbody{font-size:15.5px;line-height:1.45;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}\nh1{font-family:var(--title);font-weight:500;font-size:30px;letter-spacing:-.01em;line-height:1.1}\n.otitle,.gatebox h1,.tbl .tn,.prep header strong,.ccard header strong,.quote{font-family:var(--title)}\n.tbl .tn{font-weight:500}.otitle,.gatebox h1{font-weight:500}\n.floor .dot{top:5px;right:5px;width:7px;height:7px}\nh2{font-size:16px;font-weight:700;letter-spacing:-.005em}\nh3{font-size:12.5px;text-transform:none;letter-spacing:0;font-weight:600}\nsmall{font-size:12.5px}\n.mgr h2{font-size:16px;margin-bottom:12px}\n.mgr section{margin-bottom:30px}\n.sechead{margin-bottom:18px;align-items:flex-end}\n.pad{padding-block:22px 36px}\n\n/* Barre du haut */\n.top{padding-block:14px;background:color-mix(in srgb,var(--bg) 88%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);position:relative;z-index:5}\n.brand{font-size:22px;letter-spacing:.24em}\n.pill{font-size:12px;letter-spacing:.02em;text-transform:none;font-weight:600;padding:5px 12px;background:var(--surface)}\n.msgbtn{font-size:13px;padding:6px 14px}\n\n/* Chiffres : la police du logo */\n.lever b,.stat b,.big,.tiers .thead b,.due strong,.tktot strong,.ctotal b,.ccard .amt,.mtimer b,.dem header b,.gauge b,.hmoney b,.cmd li b,.prep header strong,.ccard header strong{font-family:var(--title);font-weight:500;font-variant-numeric:lining-nums;letter-spacing:-.01em}\n.person .code{font-family:var(--ui)}\n.lever b{font-size:27px;line-height:1.15;margin-top:6px}\n.stat b,.mgr .stat b{font-size:25px}\n.big{font-size:38px}\n.mhero .mrow .big{font-size:30px}\n\n/* Surfaces */\n.lever,.stat,.tiers,.chero,.mhero,.gauge,.person,.prep,.ccard,.mtimer,.item,.recap{border-radius:var(--r-m);box-shadow:var(--sh)}\n.tiers,.chero,.mhero,.mtimer{border-radius:var(--r-l);padding:20px}\n.lever{padding:14px 14px 13px}\n.lever small{margin-top:1px}\n.lever .lb{height:4px;margin-top:10px}\n.levers{gap:12px;margin-bottom:22px}\n.note,.defs,.tonight{border-style:solid;background:var(--raise);border-radius:var(--r-s)}\n.todo{border-radius:var(--r-l);padding:18px 18px 8px;background:color-mix(in srgb,var(--warn) 5%,var(--surface));box-shadow:var(--sh)}\n.todo.calm{background:var(--surface)}\n.dem{border-radius:var(--r-m);padding:14px 16px}\n.dtype,.method,.dayhd,.mtag,.sugg span b{text-transform:none;letter-spacing:0;font-size:12px}\n.method{padding:2px 9px}\n.quote{font-family:var(--display);font-style:normal;font-size:18px;line-height:1.35}\n.quote small{font-family:var(--ui)}\n\n/* La soirée : carte de nuit, fumée et laiton (récap gérant) */\n.tiers.night{--fg:var(--night-fg);--muted:var(--night-muted);--line:var(--night-line);--surface:var(--night-2);--gold:var(--brass);--ok:#8CCBA5;--warn:#EE9A74;\n  position:relative;overflow:hidden;isolation:isolate;background:var(--night);color:var(--night-fg);border-color:var(--night-line);padding:24px 22px 20px;\n  box-shadow:0 24px 44px -30px rgba(22,21,19,.75)}\n.tiers.night::before{content:\"\";position:absolute;inset:-40% -20% -30% -20%;z-index:-1;pointer-events:none;\n  background:radial-gradient(38% 46% at 82% 18%,rgba(217,187,124,.26),transparent 70%),radial-gradient(34% 40% at 14% 92%,rgba(238,154,116,.16),transparent 72%),radial-gradient(46% 36% at 52% 46%,rgba(242,239,231,.07),transparent 70%);\n  filter:blur(18px);animation:fumee 26s ease-in-out infinite alternate}\n@keyframes fumee{from{transform:translate3d(-3%,2%,0) scale(1)}to{transform:translate3d(4%,-3%,0) scale(1.12)}}\n@media (prefers-reduced-motion:reduce){.tiers.night::before{animation:none}}\n.tiers.night .thead{flex-direction:column;align-items:flex-start;gap:2px}\n.tiers.night .thead h3{color:var(--night-muted);font-size:13.5px}\n.tiers.night .thead b{font-size:clamp(46px,9vw,64px);line-height:1.02;color:var(--brass);letter-spacing:.005em}\n.tiers.night .hmoney{gap:0;margin:18px 0 18px;border-block:1px solid var(--night-line);grid-template-columns:repeat(auto-fit,minmax(96px,1fr))}\n.tiers.night .hmoney span{border:0;border-radius:0;padding:12px 16px 12px 0;text-transform:none;letter-spacing:0;font-size:13px;color:var(--night-muted)}\n.tiers.night .hmoney span+span{border-left:1px solid var(--night-line);padding-left:16px}\n.tiers.night .hmoney b{font-size:26px;color:var(--night-fg)}\n.tiers.night .tbar{height:8px;border-radius:4px;margin:6px 0 10px}\n.tiers.night .tfill{border-radius:4px;background:var(--brass)}\n.tiers.night.ok .tfill{background:#8CCBA5}.tiers.night.bad .tfill{background:#EE9A74}\n.tiers.night .tfill.pend{border-radius:0 4px 4px 0}\n.tiers.night .tmark{top:-5px;bottom:-5px;width:2px}\n.tiers.night .gst{font-size:14px;margin-top:10px}\n.hmoney span{text-transform:none;letter-spacing:0;font-size:13px}\n\n/* Onglets du gérant et segments */\n.seg{border-radius:14px;padding:4px;gap:4px;background:var(--raise)}\n.seg button{border-radius:10px;padding:10px 4px;transition:background .12s,color .12s}\n.seg button.on{box-shadow:0 1px 2px rgba(27,26,23,.12)}\n.mtabs .seg{background:var(--surface);box-shadow:var(--sh)}\n.mtabs .seg button.on{background:var(--fg);color:var(--bg);box-shadow:none}\n.mtabs .seg button.on .tbadge{background:var(--brass);color:#1B1A17}\n\n/* Navigation du service : barre flottante */\n.tabs{margin:0 max(10px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(10px,env(safe-area-inset-left,0px));padding:6px!important;gap:4px;border:1px solid var(--line);border-radius:24px;box-shadow:0 18px 34px -22px rgba(22,21,19,.55)}\n.tabs button{padding:9px 2px 8px;border-radius:18px;font-size:12px;gap:3px;transition:background .12s,color .12s}\n.tabs button.on{background:var(--navon,var(--night));color:var(--night-fg)}\n.tabs button.on svg{stroke:var(--brass)}\n.tabs button.on::before{display:none}\n.badge{top:4px;background:var(--warn);color:#fff;font-weight:700}\n.msgbtn .badge{background:var(--gold);color:var(--surface)}\n\n@media (max-width:480px){.tabs button{font-size:10.5px;letter-spacing:-.01em;white-space:nowrap}.tabs svg{width:21px;height:21px}}\n/* Plan de salle : une table occupée est « allumée » */\n.floor{border:1px solid var(--line);border-radius:var(--r-l);padding:14px;gap:9px;box-shadow:var(--sh)}\n.floor .tbl{border-radius:14px;transition:transform .08s}\n.floor .tbl .tn{font-size:21px}\n.tbl.open,.floor .tbl.open{background:linear-gradient(155deg,var(--night-2),var(--night));border-color:var(--brass);color:var(--night-fg);box-shadow:0 0 0 3px color-mix(in srgb,var(--brass) 26%,transparent),0 12px 22px -14px rgba(150,116,47,.9)}\n.tbl.open .tn{color:var(--brass)}\n.tbl.open .ts{color:var(--night-fg)}\n.floor .lbl,.entree{text-transform:none;letter-spacing:.02em;font-size:12px;border-style:solid;background:transparent}\n.entree{border:0}\n.tete{text-transform:none;letter-spacing:0;font-size:10.5px;padding:1px 8px}\n.legend .lt{text-transform:none}\n.matchbar,.tbl.patron{border-radius:var(--r-m)}\n\n/* Boutons : réponse nette au doigt */\n.primary,.ghost{border-radius:14px;padding:15px 16px;font-size:15.5px;transition:transform .08s,background .12s}\n.primary{box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 12px 20px -16px rgba(22,21,19,.8)}\n.ghost.small{padding:8px 13px;border-radius:11px}\n.primary:active,.ghost:active,.item:active,.chip:active,.tbl:active,.keypad button:active,.persgrid button:active{transform:scale(.975)}\n.primary.armed,.ghost.armed{background:var(--gold);color:#fff;border-color:var(--gold)}\n.payrow .primary{padding:20px 12px;font-size:17px;border-radius:16px}\n.chip{padding:9px 16px;transition:transform .08s}\n.chip.on{background:var(--night);color:var(--night-fg);border-color:var(--night)}\n\n/* Prise de commande */\n.otitle{font-size:26px}\n.igrid{gap:12px}\n.item{min-height:94px;padding:14px;gap:3px;transition:transform .08s,border-color .12s}\n.item:active{border-color:var(--gold)}\n.iname{font-size:15.5px;line-height:1.25}\n.iprice{font-size:15px}\n.side{padding:22px}\n.lines li{padding:11px 0}\n.tktot strong{font-size:30px}\n\n/* Addition : le montant à taper, bien en vue */\n.due{background:var(--night);color:var(--night-fg);border-color:var(--night-line);border-radius:var(--r-l);padding:20px 22px;box-shadow:0 22px 36px -28px rgba(22,21,19,.8)}\n.due span small{color:var(--night-muted)}\n.due strong{font-size:46px;line-height:1;color:var(--brass)}\n.ccard{padding:16px;border-radius:var(--r-m)}\n.links{gap:8px}\n.links .link,.ccard .link{text-decoration:none;border:1px solid var(--line);border-radius:99px;padding:7px 13px;font-size:13.5px;color:var(--fg);background:var(--raise)}\n.links .link.danger{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 45%,var(--line))}\n.links .link.armed{background:var(--warn);color:#fff;border-color:var(--warn);border-radius:99px;padding:7px 13px}\n.ccard .amt{font-size:32px}\n.ccard header strong,.prep header strong{font-size:23px}\n.prep{padding:16px}\n.ctotal b{font-size:30px}\n.cgrid input{border-radius:12px;padding:10px 8px;background:var(--raise)}\n\n/* Feuilles */\n.scrim{-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}\n.sheet{border-radius:26px 26px 0 0;padding-top:12px;box-shadow:0 -24px 60px -30px rgba(0,0,0,.6);animation:monte .22s cubic-bezier(.2,.8,.2,1)}\n.sheet::before{content:\"\";flex:none;align-self:center;width:42px;height:4px;border-radius:2px;background:var(--line);margin-bottom:2px}\n@keyframes monte{from{transform:translateY(28px);opacity:.6}to{transform:none;opacity:1}}\n@media (prefers-reduced-motion:reduce){.sheet{animation:none}.primary,.ghost,.item,.chip,.tbl{transition:none}}\n\n/* Accueil du service et code */\n.gate{position:relative;overflow:hidden;isolation:isolate}\n.gate::before{content:\"\";position:absolute;inset:-20%;z-index:-1;pointer-events:none;background:radial-gradient(46% 40% at 50% 26%,color-mix(in srgb,var(--gold) 13%,transparent),transparent 72%),radial-gradient(40% 34% at 22% 80%,color-mix(in srgb,var(--warn) 6%,transparent),transparent 74%);filter:blur(40px)}\n.gatebox{gap:16px}\n.gatebox h1{font-size:38px}\n.gatebox svg{width:64px;height:64px;stroke-width:1.3}\n.keypad{grid-template-columns:repeat(3,78px);gap:14px}\n.keypad button{height:78px;font-family:var(--title);font-weight:500;font-size:30px;box-shadow:var(--sh);transition:transform .08s}\n.dots i{width:13px;height:13px;border-width:1.5px}\n.keypad button.erase{font-family:var(--ui);font-weight:600;font-size:14px;box-shadow:none}\n\n/* Tableaux et listes */\n.cmp th{text-transform:none;letter-spacing:0;font-size:12.5px;font-weight:600;padding:8px 6px 9px}\n.cmp td{padding:11px 6px}\n.cmp tr.tot td{font-weight:700;border-top:2px solid var(--line);border-bottom:0}\n.dec td:nth-child(n+2):nth-child(-n+4){font-weight:700;font-size:15.5px}\n.dec th:nth-child(n+2):nth-child(-n+4),.dec td:nth-child(n+2):nth-child(-n+4){width:54px;padding-left:2px;padding-right:2px}\n.dec td:first-child{white-space:normal}\n.sales li{padding:12px 0}\n.cmd li{border-radius:var(--r-s);background:var(--surface);padding:10px 13px}\n.cmd li b{font-size:19px;line-height:1}\n.hours .col{border-radius:5px 5px 0 0;background:linear-gradient(180deg,var(--gold),color-mix(in srgb,var(--gold) 55%,var(--surface)))}\n.hist li.sel .hrow{border-radius:var(--r-s)}\n.bub{border-radius:18px 18px 18px 6px;padding:10px 14px}.bub.me{border-radius:18px 18px 6px 18px}\n.achform input,.achform select,.note-in,.inline2 input,.invlist input{border-radius:12px;padding:12px 13px}\n.achform input:focus,.achform select:focus,.note-in:focus,.cgrid input:focus,.invlist input:focus,.inline2 input:focus,.chatform textarea:focus{outline:2px solid var(--gold);outline-offset:1px;border-color:var(--gold)}\n.mtimer b{font-size:76px;letter-spacing:0}\n.menage .msteps li{border-radius:var(--r-m)}\n#toast{border-radius:16px;padding:12px 18px;background:var(--night);color:var(--night-fg);box-shadow:0 18px 34px -18px rgba(0,0,0,.7);white-space:normal;text-align:center}\n#toast.err{background:var(--warn);color:#fff}\n#busy{background:linear-gradient(90deg,transparent,var(--brass),transparent);background-size:50% 100%;background-repeat:no-repeat}\n\n/* v23 · pastille d'envoi */\n#qpill{position:fixed;left:50%;transform:translateX(-50%);top:calc(12px + env(safe-area-inset-top,0px));z-index:70;background:var(--night);color:var(--night-fg);border-radius:99px;padding:6px 14px;font-size:12.5px;font-weight:600;box-shadow:0 10px 24px -14px rgba(0,0,0,.6);pointer-events:none;max-width:calc(100% - 32px);text-align:center}\n#qpill.warn{background:var(--warn);color:#fff}\n#qpill[hidden]{display:none}\n\n/* v28 · Service optimisé tablette (iPad mini 768×1024) : le plan entier tient dans l'écran en portrait */\n@media (min-width:700px) and (min-height:600px){\n  .tview{min-height:100%;display:flex;flex-direction:column;padding-bottom:10px}\n  .tview .tvhead{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:12px;max-width:680px;width:100%;margin-inline:auto}\n  .tview .tvhead>*{grid-column:1 / -1}\n  .tview .tvhead .matchbar{grid-column:1;margin:0;min-height:52px}\n  .tview .tvhead .tbl.patron{grid-column:2;margin:0;max-width:none;padding:8px 14px;min-height:52px}\n  .tview .tvhead .sechead{margin-bottom:0}\n  .tview .floor{flex:1;width:100%;max-width:680px;grid-template-rows:var(--fit)!important;gap:5px;padding:8px}\n  .tview .floor .tbl{aspect-ratio:auto;min-height:0;height:100%;flex-direction:row;gap:8px;padding:0 6px}\n  .tview .floor .tbl .tn{font-size:23px;line-height:1}\n  .tview .floor .tbl .ts{font-size:12.5px}\n  .tview .floor .lbl,.tview .floor .entree{padding:2px 4px;align-self:stretch;display:flex;align-items:center;justify-content:center}\n  .tview .legend{margin:10px auto 0;max-width:680px;width:100%}\n  .cats{flex-wrap:wrap;overflow:visible}\n}\n@media (min-width:900px) and (min-height:600px) and (orientation:landscape){\n  .tview{padding-block:12px 6px;display:grid;grid-template-columns:minmax(250px,300px) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);column-gap:22px;align-content:start}\n  .tview .tvhead{grid-column:1;grid-row:1;grid-template-columns:minmax(0,1fr);max-width:none}\n  .tview .tvhead .matchbar,.tview .tvhead .tbl.patron{grid-column:1}\n  .tview .matchbar{flex-wrap:wrap;gap:2px 10px}\n  .tview .legend{grid-column:1;grid-row:2;flex-direction:column;gap:8px;margin:0;align-self:start}\n  .tview .floor{grid-column:2;grid-row:1 / span 2;max-width:none;grid-template-rows:var(--fitl)!important;gap:4px}\n}\n/* v28 · Gérant optimisé iPhone */\n.achsugg{margin:-4px 0 4px}.achsugg:empty{display:none}.achsugg::before{content:'Produits suivis :';font-size:12px;color:var(--muted);align-self:center;margin-right:2px}\n.nw{white-space:nowrap}\n.mtabs{position:sticky;top:0;z-index:6;background:var(--bg);padding-bottom:10px;margin-bottom:-10px}\n@media (max-width:480px){\n  .dec th,.dec td{padding-left:3px;padding-right:3px}\n  .dec th:nth-child(n+2):nth-child(-n+4),.dec td:nth-child(n+2):nth-child(-n+4){width:40px}\n  .dec td:nth-child(n+2):nth-child(-n+4){font-size:15px}\n  .dec td:last-child{min-width:74px}\n  .stk small{font-size:10.5px}\n}\n\n/* ============ v29 · Service : plan de salle « lounge » ============ */\n.tstats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}\n.tstat{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;padding:9px 12px 10px;border-radius:14px;border:1px solid var(--line);background:var(--surface);text-align:left;font:inherit;color:inherit;box-shadow:var(--sh)}\n.tstat b{font-family:var(--title);font-weight:500;font-size:22px;line-height:1.05;font-variant-numeric:tabular-nums;white-space:nowrap}\n.tstat b i{font-style:normal;font-size:14px;color:var(--muted);margin-left:1px}\n.tstat span{font-size:12px;color:var(--muted);line-height:1.2;overflow:hidden;text-overflow:ellipsis;max-width:100%}\n.tstat.hot{border-color:color-mix(in srgb,var(--warn) 55%,var(--line))}\n.tstat.hot b{color:var(--warn)}\n.tstat.patron{border-style:dashed;background:transparent;box-shadow:none}\n.tstat.patron b{color:var(--gold)}\n.tstat.patron.on{border-style:solid;border-color:var(--gold);background:var(--gold-soft)}\nbutton.tstat:active{transform:scale(.98)}\n.tcount{display:none}\n\n.floor.fl29{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-l);padding:12px;gap:8px;box-shadow:var(--sh);\n  background-image:radial-gradient(color-mix(in srgb,var(--line) 70%,transparent) 1px,transparent 1.4px);background-size:18px 18px}\n.fl29 .tbl{position:relative;aspect-ratio:1/1;border-radius:13px;border:1px solid var(--line);background:var(--bg);color:var(--fg);box-shadow:none;gap:1px;transition:transform .08s}\n.fl29 .tbl:active{transform:scale(.96)}\n.fl29 .tbl .tn{font-family:var(--title);font-weight:500;font-size:20px;line-height:1;color:var(--muted)}\n.fl29 .tbl.open{background:linear-gradient(158deg,var(--night-2),var(--night));border-color:color-mix(in srgb,var(--brass) 75%,transparent);color:var(--night-fg);\n  box-shadow:0 0 0 3px color-mix(in srgb,var(--brass) 18%,transparent),0 12px 20px -14px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.07)}\n.fl29 .tbl.open .tn{color:var(--brass)}\n.fl29 .tinfo{display:flex;flex-direction:column;align-items:center;line-height:1.1;min-width:0}\n.fl29 .tinfo b{font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--night-fg);white-space:nowrap}\n.fl29 .tinfo small{display:none;font-size:10.5px;color:var(--night-muted);white-space:nowrap;font-variant-numeric:tabular-nums}\n/* En préparation : liseré braise à gauche · pas encore envoyé : contour laiton en pointillés */\n.fl29 .tbl.t-prep{box-shadow:inset 4px 0 0 var(--warn),0 0 0 3px color-mix(in srgb,var(--brass) 18%,transparent),0 12px 20px -14px rgba(0,0,0,.75)}\n.fl29 .tbl.t-unsent{border:1.5px dashed var(--gold)}\n.fl29 .tbl.t-unsent.open{border-color:var(--brass)}\n.fl29 .tete{bottom:-8px}\n/* Repères : hachures fines, ils se lisent comme des murs et non comme des tables */\n.fl29 .lm{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;padding:4px 6px;border-radius:10px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;\n  border:1px solid color-mix(in srgb,var(--line) 80%,transparent);background:repeating-linear-gradient(135deg,transparent 0 5px,color-mix(in srgb,var(--line) 60%,transparent) 5px 6px);align-self:center}\n.fl29 .lm span{overflow:hidden;text-overflow:ellipsis}\n.fl29 .lm svg{width:15px;height:15px;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}\n.fl29 .lm-entree{border:0;background:none;color:var(--gold);font-weight:600}\n.tfoot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-top:12px}\n.tfoot .matchbar{margin:0;border-radius:99px;padding:6px 6px 6px 14px;font-size:13px;gap:12px}\n.tfoot .matchbar .link{font-size:13px}\n.tfoot .legend{margin:0;gap:12px;font-size:11.5px}\n.legend .lg-open{background:var(--night);border:1px solid var(--brass);border-radius:4px}\n.legend .lg-prep{background:var(--warn);border-radius:2px;width:4px!important}\n.legend .lg-unsent{border:1.5px dashed var(--gold);border-radius:4px;background:transparent}\n@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]) .fl29 .tbl.open{background:linear-gradient(158deg,color-mix(in srgb,var(--brass) 20%,#24211C),#1A1814)}}\n:root[data-theme=\"dark\"] .fl29 .tbl.open{background:linear-gradient(158deg,color-mix(in srgb,var(--brass) 20%,#24211C),#1A1814)}\n\n/* Tablette : en-tête sur une ligne, tables en largeur avec montant, personnes et durée */\n@media (min-width:700px) and (min-height:600px){\n  .tview .tvhead{display:flex;align-items:center;gap:16px;margin:0 auto 12px;max-width:740px;width:100%}\n  .tview .tvhead .sechead{margin:0;flex:none}\n  .tview .tvhead .tstats{flex:1;margin:0}\n  .tview .tvhead .tstat{padding:7px 11px 8px}\n  .tview .tvhead .tstat b{font-size:20px}\n  .tview .tvhead .note{flex-basis:100%}\n  .tview .tvhead{flex-wrap:wrap}\n  .tview .fl29{padding:8px;gap:5px}\n  .tview .fl29 .tbl{flex-direction:row;justify-content:flex-start;gap:9px;padding:0 10px}\n  .tview .fl29 .tbl .tn{font-size:23px;min-width:26px;text-align:center}\n  .tview .fl29 .tbl.t-free{justify-content:center}\n  .tview .fl29 .tbl.t-free .tn{min-width:0}\n  .tview .fl29 .tinfo{align-items:flex-start}\n  .tview .fl29 .tinfo b{font-size:13.5px}\n  .tview .fl29 .tinfo small{display:block}\n  .tview .fl29 .lm{align-self:stretch}\n  .tview .tfoot{max-width:740px;width:100%;margin:10px auto 0}\n  .tview .floor.fl29{max-width:740px}\n}\n@media (min-width:900px) and (min-height:600px) and (orientation:landscape){\n  .tview .tvhead{flex-direction:column;align-items:stretch;max-width:none;margin:0}\n  .tview .tvhead .tstats{grid-template-columns:repeat(2,minmax(0,1fr))}\n  .tview .tfoot{grid-column:1;grid-row:2;flex-direction:column;align-items:stretch;margin:0;max-width:none;align-self:start}\n  .tview .tfoot .legend{flex-direction:column;gap:8px}\n}\n@media (prefers-reduced-motion:reduce){.fl29 .tbl,.tstat{transition:none}}\n\n/* v29 · commande */\n.otitle small{display:block;font-family:var(--ui);font-size:12px;font-weight:500;color:var(--muted);margin-top:3px;letter-spacing:0}\n.item{position:relative;border-radius:16px}\n.item .iname{font-size:15px;font-weight:700;line-height:1.25}\n.item .iprice{font-family:var(--title);font-weight:500;font-size:17px;color:var(--gold)}\n.item:active{transform:scale(.97);border-color:var(--gold)}\n\n/* v29 · navigation entre soirées (gérant) : grosses flèches faciles à toucher */\n.rnav{display:flex;align-items:center;gap:6px}\n.rnav .rlbl{font-size:15px;color:var(--muted);white-space:nowrap;min-width:0;overflow:hidden;text-overflow:ellipsis}\n.rnav .rlbl.wait{color:var(--gold)}\n.rarr{width:38px;height:38px;flex:none;border-radius:50%;border:1px solid var(--line);background:var(--surface);font-size:22px;line-height:1;color:var(--fg);display:grid;place-items:center;padding:0 0 3px}\n.rarr:disabled{opacity:.35}\n.rarr:active{transform:scale(.94)}\n.mgr .sechead:has(.rnav){align-items:center}\n\n/* v30 · stock intelligent */\n.intel{margin-bottom:22px}\n.kgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n@media (min-width:760px){.kgrid{grid-template-columns:repeat(3,minmax(0,1fr))}}\n.kcard{display:flex;flex-direction:column;gap:3px;padding:12px 13px;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:var(--sh);min-width:0}\n.kcard header{display:flex;justify-content:space-between;align-items:baseline;gap:6px}\n.kcard header b{font-size:14px;line-height:1.25;min-width:0}\n.kcard header i{font-style:normal;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap;background:var(--raise);color:var(--muted)}\n.kcard strong{font-family:var(--title);font-weight:500;font-size:24px;line-height:1.1;margin-top:2px}\n.kcard strong small{font-family:var(--ui);font-size:13px;color:var(--warn);font-weight:700}\n.kcard span{font-size:12.5px;color:var(--muted)}\n.kcard>small{font-size:11.5px;color:var(--muted);line-height:1.35;margin-top:2px}\n.kcard.ok header i{background:color-mix(in srgb,var(--ok) 16%,transparent);color:var(--ok)}.kcard.ok strong{color:var(--ok)}\n.kcard.warn header i{background:color-mix(in srgb,var(--gold) 18%,transparent);color:var(--gold)}.kcard.warn{border-color:color-mix(in srgb,var(--gold) 45%,var(--line))}\n.kcard.bad header i{background:var(--warn);color:#fff}.kcard.bad{border-color:color-mix(in srgb,var(--warn) 55%,var(--line))}.kcard.bad strong{color:var(--warn)}\n.kcard.wait strong{font-size:17px;color:var(--gold)}\n.subh{font-size:15px;margin:18px 0 8px}\n.unus,.learn{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}\n.unus li,.learn li{font-size:14px;line-height:1.4;padding:9px 12px;border-radius:12px;background:var(--surface);border:1px solid var(--line)}\n.unus li.bad{border-left:3px solid var(--warn)}.unus li.warn{border-left:3px solid var(--gold)}\n.learn li small{display:block;color:var(--muted);font-size:12px}\n\n/* ============ v30 · plan de salle dessiné ============ */\n:root{--wall:#3A352D;--seat:color-mix(in srgb,var(--muted) 45%,transparent);--wood:#C9A66B;--wood2:#A9824A;--screen:#1E1C19}\n@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){--wall:#5A5245;--wood:#8C6E3F;--wood2:#6E5430;--screen:#050505}}\n:root[data-theme=\"dark\"]{--wall:#5A5245;--wood:#8C6E3F;--wood2:#6E5430;--screen:#050505}\n.floor.fl29{border:3px solid var(--wall);outline:1px solid color-mix(in srgb,var(--wall) 35%,transparent);outline-offset:3px;border-radius:14px;\n  background-color:var(--surface);background-image:linear-gradient(color-mix(in srgb,var(--line) 55%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--line) 55%,transparent) 1px,transparent 1px);background-size:22px 22px;background-position:-1px -1px}\n/* Tables : plateau + banquettes */\n.fl29 .tbl{overflow:visible}\n.fl29 .tbl::before,.fl29 .tbl::after{content:'';position:absolute;left:20%;right:20%;height:3px;border-radius:3px;background:var(--seat);pointer-events:none}\n.fl29 .tbl::before{top:-5px}.fl29 .tbl::after{bottom:-5px}\n.fl29 .tbl.open::before,.fl29 .tbl.open::after{background:color-mix(in srgb,var(--brass) 70%,transparent)}\n.fl29 .tbl.t-free{background:var(--bg);border-color:color-mix(in srgb,var(--wall) 30%,var(--line))}\n/* Repères dessinés */\n.fl29 .lmx{position:relative;border:0;background:none;padding:0;overflow:visible;align-self:stretch;min-height:22px}\n.fl29 .lmx>span{position:relative;z-index:1;font-size:11.5px;font-weight:600;color:var(--muted);letter-spacing:.02em}.fl29 .lm-tv{display:flex;align-items:center;justify-content:center}.fl29 .lm-tv .scr{position:absolute;background:linear-gradient(135deg,var(--screen) 55%,#3b372f);border-radius:2px;box-shadow:0 0 0 1px color-mix(in srgb,var(--brass) 70%,transparent),0 3px 8px -3px rgba(0,0,0,.5)}.fl29 .lm-tv .cone{position:absolute;opacity:.9;pointer-events:none}.fl29 .lm-tv.o-t .scr{top:1px;left:12%;right:12%;height:6px}.fl29 .lm-tv.o-t .cone{top:7px;left:12%;right:12%;bottom:-2px;background:linear-gradient(180deg,color-mix(in srgb,var(--brass) 32%,transparent),transparent);clip-path:polygon(0 0,100% 0,82% 100%,18% 100%)}.fl29 .lm-tv.o-b .scr{bottom:1px;left:12%;right:12%;height:6px}.fl29 .lm-tv.o-b .cone{bottom:7px;left:12%;right:12%;top:-2px;background:linear-gradient(0deg,color-mix(in srgb,var(--brass) 32%,transparent),transparent);clip-path:polygon(18% 0,82% 0,100% 100%,0 100%)}.fl29 .lm-tv.o-r .scr{left:2px;top:10%;bottom:10%;width:6px}.fl29 .lm-tv.o-r .cone{left:8px;top:10%;bottom:10%;right:0;background:linear-gradient(90deg,color-mix(in srgb,var(--brass) 32%,transparent),transparent);clip-path:polygon(0 0,100% 22%,100% 78%,0 100%)}.fl29 .lm-tv.o-l .scr{right:2px;top:10%;bottom:10%;width:6px}.fl29 .lm-tv.o-l .cone{right:8px;top:10%;bottom:10%;left:0;background:linear-gradient(270deg,color-mix(in srgb,var(--brass) 32%,transparent),transparent);clip-path:polygon(0 22%,100% 0,100% 100%,0 78%)}.fl29 .lm-tv>span{color:var(--gold)!important;font-weight:800!important;letter-spacing:.14em!important;font-size:10.5px!important}.fl29 .lm-door,.fl29 .lm-wc{display:flex;align-items:center;justify-content:center;gap:6px}.fl29 .lm-door svg{height:30px;max-height:100%;width:auto;flex:none;fill:none;stroke:var(--wall);stroke-linecap:round}.fl29 .lm-door .w{stroke-width:4}.fl29 .lm-door .lf{stroke-width:2}.fl29 .lm-door .arc{stroke-width:1.2;stroke-dasharray:3 3;opacity:.8}.fl29 .lm-door svg.gold{stroke:var(--gold)}.fl29 .lm-entree>span{color:var(--gold)!important;font-weight:700!important}.fl29 .lm-wc svg{height:24px;max-height:100%;width:auto;flex:none;fill:var(--surface);stroke:var(--wall);stroke-width:1.6}.fl29 .lm-bar{display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:3px;padding:2px 4px!important}.fl29 .lm-bar .cpt{position:relative;flex:1;min-height:16px;max-height:30px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:linear-gradient(180deg,var(--wood),var(--wood2));box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 2px 6px -3px rgba(0,0,0,.5)}.fl29 .lm-bar .cpt span{font-size:11px;font-weight:700;color:#FFF8EA;letter-spacing:.03em;text-shadow:0 1px 1px rgba(0,0,0,.25)}.fl29 .lm-bar .cpt::after{content:'';position:absolute;right:6px;top:50%;width:9px;height:7px;margin-top:-4px;border-radius:2px;background:var(--screen);box-shadow:0 0 0 1px rgba(255,255,255,.35)}.fl29 .lm-bar .stools{height:7px;background:radial-gradient(circle,var(--wall) 0 2.6px,transparent 3px) 0 0/22px 7px repeat-x;opacity:.55;margin:0 10%}.fl29 .lm-cuis{display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px dashed color-mix(in srgb,var(--wall) 55%,transparent)!important;border-radius:8px!important}.fl29 .lm-cuis .feux{width:26px;height:18px;flex:none;background:radial-gradient(circle,transparent 0 2.4px,var(--wall) 2.6px 3.6px,transparent 3.8px) 0 0/13px 9px}\n@media (min-width:700px) and (min-height:600px){.tview .fl29 .lmx{min-height:0}}\n/* v33 · chargements en pourcentage */\n.ldbox{display:flex;flex-direction:column;align-items:center;gap:12px;padding:56px 16px 40px;color:var(--muted);text-align:center}\n.ldbox b{font-family:var(--display);font-size:46px;line-height:1;color:var(--fg);font-weight:400;font-variant-numeric:tabular-nums}\n.ldbox span{font-size:14px}\n.ldbar{width:min(240px,70%);height:4px;border-radius:4px;background:var(--line);overflow:hidden}\n.ldbar i{display:block;height:100%;width:0;background:var(--gold);transition:width .2s linear}\n.ldin{font-variant-numeric:tabular-nums}\n#busy{animation:none;background:transparent;height:3px}\n#busy i{display:block;height:100%;width:0;background:var(--gold);transition:width .2s linear}\n#busy b{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);background:var(--fg);color:var(--bg);font-size:12.5px;font-weight:700;padding:5px 11px;border-radius:99px;font-variant-numeric:tabular-nums;box-shadow:0 6px 18px -8px rgba(0,0,0,.35)}\n/* v33 · rien ne glisse sur le côté (iPhone et tablette) */\nhtml,body{overflow-x:hidden;overscroll-behavior-x:none;max-width:100%}\n#view{overflow-x:hidden;overscroll-behavior-x:none}\n@media (max-width:640px){\n  .cats{flex-wrap:wrap;gap:6px;overflow:visible;padding-block:4px 10px}\n  .cats .chip{padding:7px 12px;font-size:13.5px}\n}\n@media (max-width:400px){\n  .cmp.stk{font-size:13px}\n  .stk th,.stk td{padding-left:3px;padding-right:3px}\n  .stk td:last-child{min-width:52px}\n  .cmp th{font-size:11.5px}\n}\n</style>\n</head>\n<body>\n<div class=\"app\">\n  <header class=\"top gut\"><div class=\"brand\">Y<span>Ä</span>YA</div><div class=\"topr\"><a class=\"msgbtn\" id=\"anaBtn\" href=\"#\" target=\"_top\" hidden>Analyses</a><button class=\"msgbtn\" id=\"msgBtn\" data-a=\"msgs\" hidden>Messages<span class=\"badge\" id=\"badge-hm\" hidden>0</span></button><button class=\"pill\" id=\"rolePill\" data-a=\"me\"></button></div></header>\n  <main id=\"view\"></main>\n  <nav class=\"tabs gut\" id=\"tabs\" aria-label=\"Navigation\" hidden>\n    <button data-a=\"go\" data-v=\"tables\" id=\"nav-tables\"><svg viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"2\"/></svg>Tables</button>\n    <button data-a=\"go\" data-v=\"prep\" id=\"nav-prep\"><svg viewBox=\"0 0 24 24\"><path d=\"M8 4h8M9 4v3M15 4v3\"/><rect x=\"4\" y=\"7\" width=\"16\" height=\"13\" rx=\"2\"/><path d=\"M8 12h8M8 16h5\"/></svg>À préparer<span class=\"badge\" id=\"badge\" hidden>0</span></button>\n    <button data-a=\"go\" data-v=\"cash\" id=\"nav-cash\"><svg viewBox=\"0 0 24 24\"><rect x=\"2.5\" y=\"6\" width=\"19\" height=\"13\" rx=\"2\"/><path d=\"M2.5 10h19M6.5 15h4\"/></svg>Encaissement<span class=\"badge\" id=\"badge-cash\" hidden>0</span></button>\n    <button data-a=\"go\" data-v=\"courses\" id=\"nav-courses\"><svg viewBox=\"0 0 24 24\"><path d=\"M3 4h2l2.4 11h11.2L21 7H6.2\"/><circle cx=\"9\" cy=\"19.5\" r=\"1.5\"/><circle cx=\"17\" cy=\"19.5\" r=\"1.5\"/></svg>Courses</button>\n    <button data-a=\"go\" data-v=\"msgs\" id=\"nav-msgs\"><svg viewBox=\"0 0 24 24\"><path d=\"M4 5.5h16v10.5H10l-6 4z\"/></svg>Messages<span class=\"badge\" id=\"badge-msgs\" hidden>0</span></button>\n  </nav>\n</div>\n<div id=\"busy\" hidden><i></i><b>0 %</b></div>\n<div id=\"toast\" role=\"status\"></div>\n<script>const BOOT = <?!= bootJson ?>;</script>\n<script>\n// v32 · appli figée : pas de zoom (pincement, double-tap) sur iPhone et iPad.\n(function () { var no = function (e) { e.preventDefault(); };\n  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, no, { passive: false }); });\n  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });\n})();\n// v33 · Chargements affichés en pourcentage. Google ne donne pas l'avancement réel d'un appel :\n// le pourcentage suit la durée habituelle de ce chargement sur cet appareil (apprise à chaque fois), sans jamais\n// afficher 100 % avant que les données soient là.\nconst LDK = 'yaya-ld', LDT = {};\nlet LDAVG = {}; try { LDAVG = JSON.parse(localStorage.getItem(LDK) || '{}') || {}; } catch (e) { LDAVG = {}; }\nfunction ldPct(key) { const t0 = LDT[key] || (LDT[key] = Date.now()), avg = LDAVG[key] || (key === 'busy' ? 1500 : 2500); return Math.min(97, Math.round(100 * (1 - Math.exp(-(Date.now() - t0) / (avg / 2))))); }\nfunction ldBox(label, key) { const p = ldPct(key); return `<div class=\"ldbox\" data-ld=\"${key}\"><b>${p} %</b><div class=\"ldbar\"><i style=\"width:${p}%\"></i></div><span>${label}…</span></div>`; }\nfunction ldIn(key) { return `<span class=\"ldin\" data-ldi=\"${key}\">${ldPct(key)} %</span>`; }\nfunction ldDone(key) { const t0 = LDT[key]; if (!t0) return; delete LDT[key]; const d = Date.now() - t0; if (d > 80 && d < 60000) { LDAVG[key] = Math.round(LDAVG[key] ? LDAVG[key] * 0.6 + d * 0.4 : d); try { localStorage.setItem(LDK, JSON.stringify(LDAVG)); } catch (e) {} } }\nsetInterval(() => {\n  const seen = {};\n  document.querySelectorAll('[data-ld]').forEach(el => { const k = el.dataset.ld, p = ldPct(k); seen[k] = 1; el.querySelector('b').textContent = p + ' %'; el.querySelector('.ldbar i').style.width = p + '%'; });\n  document.querySelectorAll('[data-ldi]').forEach(el => { const k = el.dataset.ldi; seen[k] = 1; el.textContent = ldPct(k) + ' %'; });\n  const bz = document.getElementById('busy');\n  if (bz && !bz.hidden) { seen.busy = 1; const p = ldPct('busy'); bz.querySelector('i').style.width = p + '%'; bz.querySelector('b').textContent = p + ' %'; }\n  Object.keys(LDT).forEach(k => { if (!seen[k]) ldDone(k); });\n}, 150);\n// ===== YÄYA · Logique commune (utilisée par le serveur et par l'appli) =====\n// Aucune fonction Google ici : uniquement les règles de calcul.\n\nfunction r2(v) { return Math.round((+v || 0) * 100) / 100; }\nfunction lineKey(n, d, p) { return [n].concat(d, [r2(p)]).join('|'); }\n\nfunction findArt(data, n) {\n  for (var i = 0; i < data.carte.length; i++) {\n    var x = data.carte[i];\n    if (x.n === n && x.actif) return x;\n  }\n  return null;\n}\n\n// Prix d'un article avec ses options choisies (suppléments compris).\nfunction priceLine(data, n, sel) {\n  var it = findArt(data, n);\n  if (!it) throw new Error('Article introuvable sur la carte : ' + n);\n  sel = sel || {};\n  var p = it.p, d = [];\n  it.o.forEach(function (g) {\n    var grp = data.options[g];\n    if (!grp) throw new Error('Groupe d’options « ' + g + ' » inconnu pour ' + n + '. Vérifie l’onglet Options.');\n    var ch = grp.choices.filter(function (c) { return c.n === sel[g]; })[0];\n    if (!ch) throw new Error('Choisis : ' + grp.label);\n    p += ch.add;\n    d.push(ch.n);\n  });\n  p = r2(p);\n  return { n: it.n, d: d, p: p, k: lineKey(it.n, d, p), cat: it.cat };\n}\n\nfunction gross(t) { return t ? r2(t.lines.reduce(function (a, l) { return a + l.p * l.q; }, 0)) : 0; }\nfunction giftTot(t) { return t && t.gifts ? r2(t.gifts.reduce(function (a, g) { return a + g.amount; }, 0)) : 0; }\n// Articles offerts ou annulés après service (validés ou en attente du gérant) : retirés de l'addition.\nfunction offTot(t) { return t && t.offs ? r2(t.offs.reduce(function (a, o) { return a + o.amount; }, 0)) : 0; }\nfunction promoAmt(t) { return t && t.promo ? r2(Math.max(0, gross(t) - giftTot(t) - offTot(t)) * t.promo.pct / 100) : 0; }\nfunction tot(t) { return t ? Math.max(0, r2(gross(t) - giftTot(t) - offTot(t) - promoAmt(t))) : 0; }\nfunction paidTot(t) { return t && t.payments ? r2(t.payments.reduce(function (a, p) { return a + p.amount; }, 0)) : 0; }\nfunction rest(t) { return Math.max(0, r2(tot(t) - paidTot(t))); }\nfunction cnt(t) { return t ? t.lines.reduce(function (a, l) { return a + l.q; }, 0) : 0; }\n\n// Unités d'une table, avec le prix de chaque unité (cadeaux déduits) et les unités déjà payées.\nfunction units(t) {\n  return t.lines.map(function (u) {\n    var gifts = (t.gifts || []).filter(function (x) { return x.k === u.k; }).map(function (x) { return x.amount; })\n      .concat((t.offs || []).filter(function (x) { return x.k === u.k; }).map(function (x) { return x.amount; }));\n    var prices = [];\n    for (var i = 0; i < u.q; i++) prices.push(r2(u.p - (gifts[i] || 0)));\n    var paid = Math.min(u.q, (t.paidU || {})[u.k] || 0);\n    return { k: u.k, n: u.n, d: u.d, p: u.p, q: u.q, prices: prices, paid: paid, left: u.q - paid };\n  });\n}\nfunction selAmount(t, sel) {\n  return r2(units(t).reduce(function (a, u) {\n    var c = sel[u.k] || 0;\n    return a + u.prices.slice(u.paid, u.paid + c).reduce(function (x, y) { return x + y; }, 0);\n  }, 0));\n}\nfunction equalPart(t) {\n  var sp = t.split;\n  if (!sp) return 0;\n  var r = rest(t);\n  return sp.done >= sp.n - 1 ? r : r2(r / (sp.n - sp.done));\n}\n\n// Fidélité : l'article de la commande que le cadeau rend gratuit (le plus cher parmi ceux autorisés).\nfunction giftLine(t, g) {\n  if (!g.articles.length) return null;\n  var used = function (k) { return (t.gifts || []).concat(t.offs || []).filter(function (x) { return x.k === k; }).length; };\n  return t.lines\n    .filter(function (l) { return g.articles.indexOf(l.n) >= 0 && l.q - used(l.k) > 0; })\n    .sort(function (a, b) { return b.p - a.p; })[0] || null;\n}\n// Le cadeau couvre le prix de carte de l'article ; les suppléments restent payants.\nfunction giftAmount(data, l) {\n  var a = findArt(data, l.n);\n  return r2(Math.min(l.p, a ? a.p : l.p));\n}\n\n</script>\n<script>\n// ===== YÄYA · appli service et gérant =====\nconst ROLE = BOOT.role, KEY = BOOT.key;\nlet D = BOOT.data, ST = BOOT.state || { rev: 0, soiree: null, tables: {}, tickets: [] };\n// Code personnel (service) : demandé dès qu'au moins une personne est enregistrée dans l'onglet Équipe.\nlet CODES = !!BOOT.codes, PINBUF = '', logging = false, leaving = false;\nconst MK = 'yaya-moi-' + KEY.slice(0, 6);\nlet ME = null;\ntry { ME = JSON.parse(localStorage.getItem(MK) || 'null'); } catch (e) {}\nfunction saveMe() { try { if (ME) localStorage.setItem(MK, JSON.stringify({ pin: ME.pin, nom: ME.nom, admin: !!ME.admin, sid: ME.sid || null })); else localStorage.removeItem(MK); } catch (e) {} }\nconst onDuty = () => !CODES || !!(ME && ME.admin) || !!(ST.soiree && (ST.soiree.team || []).some(x => ME && x.nom === ME.nom && !x.out));\nconst PATRON = 0;\nconst UI = { view: 'tables', cur: null, cat: 0, billFrom: 'tables' };\nconst REASONS = ['Erreur de saisie', 'Client a changé d’avis', 'Rupture de stock'];\nlet pending = null, sheetMode = null, arm = null, giftSel = null, cancelSel = null, bm = { mode: 'all', sel: {} };\nlet countVal = '', busy = false, REC = null, recArm = false, locating = false;\nlet delSoArm = false;\nlet MTAB = 'recap', ACH = null, delArm = null, COURSES = null, commentVal = '', courseArm = null;\nlet OBJ = null, OFORM = null, EQ = null, TNOM = '', teamArm = null, promoArm = null;\nlet STK = null, INV = null, CAR = null, carArm = null;\n// Messages, demandes à valider (avance, offert ou annulation après service) et caisse.\nlet CHATV = '', demArm = null, AVF = null, OFFSEL = null, CAI = null, caiArm = null, CHATN = -1, readBusy = false, LASTIN = null;\nconst CAF = { kind: 'retrait', amount: '', motif: '', date: '' }, CAP = { fond: null, seuil: null };\nconst OFF_RAISONS = ['Produit raté', 'Client mécontent', 'Pas préparé (rupture, oubli)', 'Erreur de commande'];\nconst FREE_CANCEL_MS = 15 * 60000;\nconst isBoss = () => ROLE === 'gerant' || !!(ME && ME.admin);\nconst DEMS = () => ST.dem || [];\nconst pendDems = () => DEMS().filter(d => d.status === 'En attente');\nconst msgsOf = () => (ST.chat && ST.chat.msgs) || [];\nconst unread = () => { const c = ST.chat; if (!c) return 0; const b = isBoss(), seen = (b ? c.seenG : c.seenS) || 0; return c.msgs.filter(m => m.from === (b ? 'S' : 'G') && m.ts > seen).length; };\n// Inventaire du lundi côté service : liste à compter, valeurs saisies (gardées sur l'appareil), « plus tard ».\nlet SINV = null, SINVV = {}, INVLATER = false, sinvLoading = false;\ntry { SINVV = JSON.parse(localStorage.getItem('yaya-sinv') || '{}') || {}; } catch (e) { SINVV = {}; }\nconst invDueNow = () => !!(ST.soiree && ST.soiree.inv === 'due');\nconst PFORM = { n: '', type: 'Boisson', unite: 'unité', seuil: '' }, AFORM = { cat: '', n: '', p: '', sub: '' }, GFORM = { n: '' };\nconst CFORM = { article: '', detail: '' };\nconst FORM = { date: new Date().toLocaleDateString('sv-SE'), produit: '', cat: '', qty: '', unite: 'unité', total: '', fournisseur: '' };\n\n// ---- Outils ----\n// Montant en euros : 12 000 €, 2,50 €, −236 €.\nconst fmt = v => { const n = r2(v), [i, d] = Math.abs(n).toFixed(2).split('.'); return (n < 0 ? '−' : '') + i.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '\\u202f') + (d === '00' ? '' : ',' + d) + ' €'; };\nconst esc = s => String(s == null ? '' : s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));\nconst mins = ts => Math.max(0, Math.floor((Date.now() - ts) / 60000));\nconst dur = m => m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0');\nconst durS = m => m < 60 ? m + ' min' : Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0');\nconst ago = ts => mins(ts) < 1 ? 'à l’instant' : 'il y a ' + dur(mins(ts));\nconst fmtH = ts => ts ? new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';\nconst fmtD = ts => new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });\nconst tName = n => n === PATRON ? 'Conso patron' : 'Table ' + n;\nconst $ = id => document.getElementById(id);\nconst lineDetail = l => `${esc(l.n)}${l.d && l.d.length ? `<small>${l.d.map(esc).join(' · ')}</small>` : ''}`;\nlet CATS = [], TABLES = [];\nconst itemsOf = c => D.carte.filter(x => x.actif && x.cat === c);\nfunction derive() { CATS = [...new Set(D.carte.filter(x => x.actif).map(x => x.cat))]; TABLES = D.plan.filter(x => typeof x.t === 'number').map(x => x.t); }\nderive();\nasync function reloadData() { try { D = await call('data', {}); derive(); render(); } catch (e) {} }\n\n// ---- Paniers (articles pas encore envoyés, gardés sur l'appareil) ----\nconst CK = 'yaya-panier-' + KEY.slice(0, 6);\nlet CART = {}, DIS = {}, PERS = {};\ntry { const c = JSON.parse(localStorage.getItem(CK) || '{}'); CART = c.cart || {}; DIS = c.dis || {}; PERS = c.pers || {}; } catch (e) {}\nfunction saveCart() { try { localStorage.setItem(CK, JSON.stringify({ cart: CART, dis: DIS, pers: PERS })); } catch (e) {} }\n// Tampons possibles : 1 par personne dès 10 € d'achats (au plus 1 par tranche de 10 €).\nconst tampons = tb => tb && tb.pers ? Math.min(tb.pers, Math.floor(tot(tb) / 10)) : null;\nconst persTxt = n => n + ' pers.';\nconst cartOf = t => CART[t] || (CART[t] = []);\nconst cartTot = t => r2((CART[t] || []).reduce((a, l) => a + l.p * l.q, 0));\nconst cartCnt = t => (CART[t] || []).reduce((a, l) => a + l.q, 0);\nfunction addCart(t, n, sel) {\n  const l = priceLine(D, n, sel), c = cartOf(t), ex = c.find(x => x.k === l.k);\n  if (ex) ex.q++; else c.push({ n: l.n, d: l.d, p: l.p, k: l.k, sel: sel || {}, q: 1 });\n  saveCart();\n}\nconst tableOpen = t => !!ST.tables[t] || cartCnt(t) > 0;\nconst showTot = t => r2(rest(ST.tables[t]) + cartTot(t));\n\n// ---- Appels au serveur ----\nfunction call(action, p) {\n  const q = Object.assign({ _pin: ME ? ME.pin : '' }, p || {});\n  return new Promise((ok, ko) => google.script.run.withSuccessHandler(ok).withFailureHandler(ko).api(KEY, action, q));\n}\n// Message d'erreur lisible ; « CODE| » verrouille l'appli, « JOIN| » renvoie vers la prise de service.\nfunction errMsg(e) {\n  let m = String((e && e.message) || e || 'Erreur réseau, réessaie.').replace(/^(Error|Exception|ScriptError):\\s*/, '');\n  const i = m.indexOf('CODE|'), j = m.indexOf('JOIN|');\n  if (i >= 0) { m = m.slice(i + 5); CODES = true; ME = null; saveMe(); PINBUF = ''; closeSheet(); }\n  else if (j >= 0) { m = m.slice(j + 5); closeSheet(); refreshState(); }\n  return m;\n}\nasync function refreshState() { try { const r = await call('state', {}); if (r && r.state) { setST(r.state); render(); } } catch (e) {} }\n// Le code est demandé à chaque prise de service ; il reste valable sur l'appareil seulement pendant le service.\nasync function login(pin, auto) {\n  logging = true; render();\n  try {\n    const r = await call('login', { _pin: pin });\n    setST(r.state); CODES = true;\n    const prev = ME, sid = r.state && r.state.soiree ? r.state.soiree.id : null;\n    // Le code gérant ne reste valable que pour la soirée en cours sur cet appareil.\n    if (auto && (!r.onDuty || (r.admin && !(sid && prev && prev.sid === sid)))) { ME = null; saveMe(); }\n    else { ME = { pin, nom: r.nom, typed: !auto, admin: !!r.admin, sid }; saveMe(); if (r.nom && !auto) toast(r.admin ? 'Mode gérant : pas de contrôle de position' : 'Bonjour ' + r.nom + ' !'); }\n  } catch (e) { toast(errMsg(e), true); ME = null; saveMe(); }\n  PINBUF = ''; logging = false; render();\n  if (ME) flushQ();\n}\nconst NETERR = /network|connexion|connection|http 0|failed to fetch|timeout|timed out|unavailable|réseau|BUSY\\|/i;\n// Actions protégées contre les doublons côté serveur : on peut les relancer sans risque après un délai.\nconst SAFE = new Set(['scanIn', 'leave', 'openRemote', 'send', 'patron', 'people', 'match', 'done', 'cancel', 'gift', 'promo', 'unpromo', 'ungift', 'split', 'pay', 'annul', 'demOff', 'avance', 'demDecide', 'demWithdraw', 'chatSend', 'chatRead', 'menage', 'caisseCount', 'invSave', 'close']);\nconst withTimeout = (pr, ms) => new Promise((ok, ko) => { const t = setTimeout(() => ko(new Error('timeout')), ms); pr.then(v => { clearTimeout(t); ok(v); }, e => { clearTimeout(t); ko(e); }); });\nconst sleep = ms => new Promise(r => setTimeout(r, ms));\nasync function act(action, p) {\n  if (busy) return null;\n  if (ROLE !== 'gerant' && !(await drainQ())) return null;\n  busy = true; $('busy').hidden = false;\n  const q = Object.assign({}, p || {}, { _op: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) });\n  try {\n    for (let i = 0; ; i++) {\n      try {\n        const r = await (SAFE.has(action) && action !== 'close' ? withTimeout(call(action, q), 45000) : call(action, q));\n        if (r && r.state) setST(r.state);\n        if (r && r.msg) toast(r.msg); else if (r && r.dup) toast('C’est fait.');\n        return r;\n      } catch (e) {\n        const em = String((e && e.message) || e), slow = /BUSY\\||^timeout$/.test(em.replace(/^(Error|Exception|ScriptError):\\s*/, ''));\n        if (i < 3 && NETERR.test(em)) { toast(slow ? 'Google est lent, nouvel essai…' : 'Réseau lent, nouvel essai…'); await sleep([1500, 3000, 6000][i]); continue; }\n        if (slow) toast('Google est lent en ce moment (ça peut durer quelques minutes). Rien n’est perdu : note la commande sur papier et réessaie.', true);\n        else if (NETERR.test(em)) toast('Pas de réseau : rien n’est perdu, réessaie dans un instant.', true);\n        else toast(errMsg(e), true);\n        render();\n        return null;\n      }\n    }\n  } finally {\n    busy = false; $('busy').hidden = true;\n  }\n}\n// ---- v23 · Appli instantanée : l'écran change tout de suite, l'envoi se fait en arrière-plan ----\n// Envoyer, servir, encaisser et changer le nombre de personnes passent par une file gardée sur l'appareil :\n// rien n'est perdu si le réseau coupe, et chaque action garde son numéro (jamais faite deux fois).\nconst QK = 'yaya-file-' + KEY.slice(0, 6);\nlet Q = [], BASE = ST, flushing = false, qFail = 0, qTimer = null;\ntry { Q = JSON.parse(localStorage.getItem(QK) || '[]') || []; } catch (e) { Q = []; }\nconst saveQ = () => { try { localStorage.setItem(QK, JSON.stringify(Q)); } catch (e) {} };\nconst clone = o => JSON.parse(JSON.stringify(o));\nconst PREV = {\n  send(s, p, it) {\n    if (!s.soiree) throw new Error('Aucune soirée ouverte.');\n    const t = +p.t;\n    if (!TABLES.includes(t)) throw new Error('Table inconnue.');\n    if (!p.lines || !p.lines.length) throw new Error('Aucun article à envoyer.');\n    const out = [];\n    p.lines.forEach(x => { const l = priceLine(D, x.n, x.sel), ex = out.find(y => y.k === l.k); if (ex) ex.q += x.q; else { l.q = x.q; out.push(l); } });\n    let tb = s.tables[t];\n    if (!tb) tb = s.tables[t] = { id: 'q' + it.op, opened: it.ts, last: it.ts, lines: [], gifts: [], payments: [], paidU: {}, split: null, pers: p.pers || null };\n    p.lines.forEach(x => { const a = findArt(D, x.n); if (a && a.cat === 'Chichas') tb.chicha = { ts: it.ts, quasar: /quasar/i.test(a.n), gout: String((x.sel || {}).gout || '') }; });\n    out.forEach(l => { const ex = tb.lines.find(y => y.k === l.k); if (ex) ex.q += l.q; else tb.lines.push(clone(l)); });\n    tb.last = it.ts;\n    s.soiree.count = null; s.soiree.countTry = null;\n    s.tickets.push({ id: 'q' + it.op, t, ts: it.ts, by: (ME && ME.nom) || '', lines: out.map(l => ({ n: l.n, d: l.d, q: l.q, k: l.k })) });\n  },\n  done(s, p) { s.tickets = s.tickets.filter(x => x.id !== p.id); },\n  people(s, p) { const tb = s.tables[+p.t]; if (!tb) throw new Error('Table fermée.'); tb.pers = +p.n; },\n  pay(s, p, it) {\n    const t = +p.t, tb = s.tables[t];\n    if (!tb) throw new Error('Table déjà encaissée.');\n    const amt = payAmt(tb, p);\n    if (p.kind === 'zero' && rest(tb) !== 0) throw new Error('Il reste ' + fmt(rest(tb)) + ' à payer.');\n    if (p.kind === 'items') Object.keys(p.sel || {}).forEach(k => { tb.paidU[k] = (tb.paidU[k] || 0) + Math.floor(+p.sel[k]); });\n    if (p.kind === 'equal' && tb.split) tb.split.done++;\n    if (amt > 0) { tb.payments.push({ ts: it.ts, method: p.method, amount: amt, kind: p.kind }); if (p.method === 'Espèces') s.soiree.cashN = (s.soiree.cashN || 0) + 1; }\n    if (rest(tb) === 0) { s.tickets = s.tickets.filter(x => x.t !== t); delete s.tables[t]; }\n  }\n};\nconst payAmt = (tb, p) => p.kind === 'all' ? rest(tb) : p.kind === 'items' ? selAmount(tb, p.sel || {}) : p.kind === 'equal' ? equalPart(tb) : 0;\nfunction applyQ(s) { const x = clone(s); Q.forEach(it => { try { PREV[it.a](x, it.p, it); } catch (e) {} }); return x; }\n// Tout état reçu du serveur passe par ici : les actions encore en route sont réappliquées par-dessus.\nfunction setST(s) { BASE = s; ST = Q.length ? applyQ(s) : s; }\nfunction qAct(a, p, msg) {\n  const it = { a, p, op: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), ts: Date.now() };\n  try { PREV[a](clone(ST), p, it); } catch (e) { toast(errMsg(e), true); return null; }\n  Q.push(it); saveQ(); ST = applyQ(BASE);\n  if (msg) toast(msg);\n  updQ(); setTimeout(flushQ, 0);\n  return it;\n}\nasync function flushQ() {\n  if (flushing || !Q.length || (CODES && !ME) || logging) return;\n  clearTimeout(qTimer); flushing = true; updQ();\n  const lot = Q.slice(0, 25);\n  try {\n    const r = await withTimeout(call('batch', { ops: lot.map(x => ({ a: x.a, p: x.p, op: x.op })) }), 45000);\n    qFail = 0; flushing = false;\n    Q = Q.filter(x => !lot.includes(x)); saveQ();\n    (r.results || []).forEach((x, i) => {\n      if (x.err) toast('Pas enregistré (' + (lot[i].p.t ? 'table ' + lot[i].p.t : 'commande') + ') : ' + errMsg(x.err), true);\n      else if (x.msg && /recompter/.test(x.msg)) toast(x.msg);\n    });\n    if (r.state) setST(r.state);\n    updQ();\n    if (!$('scrim') && !arm) render(); else updBadges();\n    if (Q.length) flushQ();\n  } catch (e) {\n    flushing = false;\n    const em = String((e && e.message) || e);\n    if (/CODE\\||JOIN\\|/.test(em)) { toast(errMsg(e), true); updQ(); render(); return; }\n    qFail++; updQ();\n    if (!NETERR.test(em) && qFail >= 3) toast(errMsg(e), true);\n    qTimer = setTimeout(flushQ, Math.min(30000, 1500 * Math.pow(2, Math.min(5, qFail - 1))));\n  }\n}\n// Pastille discrète : « Envoi… » pendant l'envoi, en orange si le réseau manque (rien n'est perdu).\nfunction updQ() {\n  let e = $('qpill');\n  if (!e) { e = document.createElement('div'); e.id = 'qpill'; e.setAttribute('role', 'status'); document.body.appendChild(e); }\n  const n = Q.length;\n  e.hidden = !n;\n  e.classList.toggle('warn', qFail > 0);\n  e.textContent = !n ? '' : qFail > 0 ? (n > 1 ? n + ' actions' : '1 action') + ' en attente de réseau · elles partiront seules' : 'Envoi…';\n}\nwindow.addEventListener('online', () => { qFail = 0; flushQ(); });\ndocument.addEventListener('visibilitychange', () => { if (!document.hidden) flushQ(); });\n// Avant une autre action (cadeau, annulation, ménage…), on laisse partir la file pour rester dans l'ordre.\nasync function drainQ() {\n  if (!Q.length) return true;\n  flushQ();\n  for (let i = 0; i < 50 && Q.length; i++) { await sleep(400); if (!flushing) flushQ(); }\n  if (Q.length) { toast('Des actions attendent encore le réseau. Réessaie dans un instant.', true); return false; }\n  return true;\n}\n\nlet tt;\nfunction toast(m, err) {\n  const e = $('toast');\n  e.textContent = m; e.classList.toggle('err', !!err); e.classList.add('show');\n  clearTimeout(tt); tt = setTimeout(() => e.classList.remove('show'), err ? Math.min(9000, 4000 + String(m).length * 25) : 2200);\n}\n\n// ---- Position du téléphone (prise de service et fermeture) ----\n// v27 · Dans l'app iPad (page YÄYA sur GitHub), la position est demandée à l'app elle-même, plus fiable\n// qu'à l'intérieur de la page Google. Sans réponse de l'app sous 0,9 s, on demande la position comme avant.\n// App YÄYA : dire à l'app la hauteur réellement reçue et la couleur de fond (elle ajuste son cadre et sa barre d'état).\nfunction tellShell() {\n  if (window.top === window) return;\n  try { const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(); window.top.postMessage({ yaya: 'vp', h: window.innerHeight, bg }, '*'); } catch (e) {}\n}\nwindow.addEventListener('resize', () => { clearTimeout(tellShell.t); tellShell.t = setTimeout(tellShell, 120); });\ntry { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', tellShell); } catch (e) {}\nsetTimeout(tellShell, 50); setTimeout(tellShell, 1200);\n// App YÄYA (écran d'accueil) : la page qui l'entoure répond « hello ».\nfunction shellHello(cb) {\n  if (window.top === window) return;\n  const id = Math.random().toString(36).slice(2);\n  const on = e => { const m = e.data || {}; if (e.source !== window.top || m.yaya !== 'hello' || m.id !== id) return; window.removeEventListener('message', on); cb(); };\n  window.addEventListener('message', on);\n  try { window.top.postMessage({ yaya: 'hello?', id }, '*'); } catch (e) {}\n}\nfunction shellPos() {\n  return new Promise(res => {\n    if (window.top === window) return res(null);\n    const id = Math.random().toString(36).slice(2);\n    let acked = false, done = false;\n    const fin = v => { if (done) return; done = true; window.removeEventListener('message', on); res(v); };\n    const on = e => {\n      const m = e.data || {};\n      if (e.source !== window.top || m.yaya !== 'pos' || m.id !== id) return;\n      if (m.ack) { acked = true; return; }\n      fin(m.err ? { err: m.code === 1\n        ? 'Accès à la position refusé pour l’app YÄYA. Sur iPad : Réglages > Confidentialité et sécurité > Service de localisation > Sites web Safari > « Lorsque l’app est active », puis réessaie.'\n        : 'Position introuvable. Vérifie que la localisation est activée, puis réessaie.' } : { lat: m.lat, lng: m.lng, acc: Math.round(m.acc) });\n    };\n    window.addEventListener('message', on);\n    try { window.top.postMessage({ yaya: 'pos?', id }, '*'); } catch (e) { return fin(null); }\n    setTimeout(() => { if (!acked) fin(null); }, 900);\n    setTimeout(() => fin({ err: 'Position introuvable. Vérifie que la localisation est activée, puis réessaie.' }), 22000);\n  });\n}\nasync function getPos() {\n  const sp = await shellPos();\n  if (sp) return sp;\n  return nativePos();\n}\nfunction nativePos() {\n  return new Promise(ok => {\n    if (!navigator.geolocation) return ok({ err: 'Ce téléphone ne donne pas sa position.' });\n    navigator.geolocation.getCurrentPosition(\n      p => ok({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),\n      e => ok({ err: e.code === 1\n        ? 'Accès à la position refusé. Sur iPhone : Réglages > Confidentialité et sécurité > Service de localisation > Sites web Safari > « Lorsque l’app est active », puis réessaie.'\n        : 'Position introuvable. Vérifie que la localisation est activée, puis réessaie.' }),\n      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });\n  });\n}\n\n// ---- Suggestions ----\nfunction suggestion(t) {\n  if (t === PATRON) return null;\n  const dis = DIS[t] || [], c = CART[t] || [], tb = ST.tables[t];\n  for (const l of c) {\n    const s = D.sugg.find(x => x.from === l.n);\n    if (!s) continue;\n    const key = 's|' + l.k;\n    if (dis.includes(key)) continue;\n    const f = findArt(D, s.to);\n    if (!f) continue;\n    const preset = {};\n    Object.entries(s.preset).forEach(([g, v]) => { preset[g] = v === '*' ? l.n : v; });\n    const add = Object.entries(preset).reduce((a, [g, v]) => {\n      const ch = D.options[g] && D.options[g].choices.find(x => x.n === v);\n      return a + (ch ? ch.add : 0);\n    }, 0);\n    const delta = r2(f.p + add - l.p);\n    if (delta <= 0) continue;\n    return { key, txt: `Proposer ${f.n} (${f.sub || 'formule'}) pour ${fmt(delta)} de plus.`, item: f.n, from: l.k, preset };\n  }\n  const tt = teteDue(t);\n  if (tt) return tt;\n  if (tb && tb.last && mins(tb.last) >= D.params.relance) {\n    const hasDessert = tb.lines.some(l => { const a = findArt(D, l.n); return (a && a.cat === 'Desserts') || (a && a.o.includes('dessert')); });\n    const key = 'r|' + tb.last;\n    if (!hasDessert && !dis.includes(key)) return { key, txt: `Dernière commande ${ago(tb.last)} : propose un dessert ou un thé.` };\n  }\n  return null;\n}\n\n// Tête supplémentaire : proposée quand la dernière chicha ou tête de la table a été servie depuis le délai réglé (Paramètres).\nfunction teteDue(t) {\n  const tb = ST.tables[t];\n  if (!tb || !tb.chicha || (tb.payments && tb.payments.length)) return null;\n  const c = tb.chicha, m = mins(c.ts), key = 't|' + c.ts;\n  if (m < (D.params.relanceTete || 45) || (DIS[t] || []).includes(key)) return null;\n  const item = c.quasar ? 'Tête Quasar supplémentaire' : 'Tête supplémentaire', it = findArt(D, item);\n  if (!it) return null;\n  const preset = c.gout && it.o.includes('gout') ? { gout: c.gout } : {};\n  return { key, item, preset, txt: `Chicha servie il y a ${m} min : propose une tête${c.quasar ? ' Quasar' : ''} (${fmt(it.p)})${c.gout ? ', même goût ' + c.gout + ' ?' : '.'}` };\n}\n\n// ---- Vues service ----\n// Inventaire du lundi, fait par le service au début de la soirée. Comptage à l'aveugle : aucun stock attendu n'est affiché.\nasync function loadInvList() {\n  if (sinvLoading) return; sinvLoading = true;\n  try { SINV = await call('invList', {}); } catch (e) { toast(errMsg(e), true); }\n  sinvLoading = false; render();\n}\nconst STYPES = ['Boisson', 'Frais', 'Surgelé', 'Épicerie', 'Consommable', 'Autre'];\nconst STYPE_LABEL = { Boisson: 'Boissons', Frais: 'Frais', Surgelé: 'Surgelés', Épicerie: 'Épicerie', Consommable: 'Consommables', Autre: 'Autres' };\nconst STYPE_NOTE = { Boisson: 'Frigo et réserve.', Frais: 'kg : pèse · L : estime · unité : compte.', Surgelé: 'Compte les unités au congélateur.', Épicerie: 'kg : pèse · unité : compte.' };\nconst stypeRank = x => x.type === 'Goût' ? 0 : /charbon/i.test(x.n) ? 1 : 2 + Math.max(0, STYPES.indexOf(x.type));\n// Quantité par portion lisible : grammes, millilitres ou unités.\nconst perPortion = (v, u) => u === 'kg' ? Math.round(v * 1000) + ' g' : u === 'L' ? Math.round(v * 1000) + ' ml' : (Math.round(v * 100) / 100).toString().replace('.', ',') + ' ' + u;\nfunction vInvService() {\n  if (!SINV) { loadInvList(); return ldBox('Chargement de l’inventaire', 'inv'); }\n  const done = SINV.filter(x => String(SINVV[x.n] == null ? '' : SINVV[x.n]).trim() !== '').length;\n  const grp = (title, list, note) => list.length ? `<section><h2>${title}</h2>${note ? `<small style=\"display:block;margin:-4px 0 10px\">${note}</small>` : ''}<div class=\"invlist\">${list.map(x => `<label><span>${esc(x.n.replace(/^Go[ûu]t\\s+/i, ''))} <span class=\"muted\" style=\"font-weight:400\">(${esc(x.unite === 'pièce' ? 'pièces' : x.unite === 'unité' ? 'unités' : x.unite)})</span></span><input data-sinv=\"${esc(x.n)}\" type=\"number\" inputmode=\"decimal\" min=\"0\" step=\"${x.unite === 'kg' ? '0.01' : '1'}\" placeholder=\"—\" value=\"${esc(SINVV[x.n] == null ? '' : SINVV[x.n])}\"></label>`).join('')}</div></section>` : '';\n  return `<div class=\"pad gut\"><div class=\"sechead\"><h1>Inventaire du lundi</h1><span class=\"muted\" id=\"sinv-n\">${done} / ${SINV.length}</span></div>\n  <p class=\"note\">À faire avant la première table. ${SINV.length <= 12 ? 'Les <b>indicateurs clés de la semaine</b> seulement : quelques produits choisis pour repérer les pertes.' : ''} Compte ce qu’il reste vraiment, produit par produit. Mets 0 s’il n’en reste plus.</p>\n  ${grp('Goûts', SINV.filter(x => x.type === 'Goût'), 'Pèse chaque pot sur la balance et écris le poids en kilos : 0,35 pour 350 g.')}\n  ${grp('Charbon', SINV.filter(x => x.type !== 'Goût' && /charbon/i.test(x.n)), 'Compte les pièces (boîtes entamées comprises).')}\n  ${STYPES.map(t => grp(STYPE_LABEL[t], SINV.filter(x => x.type === t && !/charbon/i.test(x.n)), STYPE_NOTE[t] || '')).join('')}\n  <div class=\"btnrow\"><button class=\"ghost\" data-a=\"sinvlater\">Plus tard</button><button class=\"primary\" data-a=\"sinvsave\">Valider l’inventaire</button></div></div>`;\n}\n\n// Ménage de fermeture : plumeau, aspirateur, serpillère + toilettes, 5 min chacun. Seul le code gérant peut le passer.\nconst MEN = ['Plumeau', 'Aspirateur', 'Serpillère + toilettes'], MEN_MS = 5 * 60000;\nlet AC = null, WL = null, menRang = {}, menArm = false;\nfunction menState() {\n  const m = ST.soiree && ST.soiree.menage; if (!m) return null;\n  const i = m.s.length - 1; return { m, i, left: Math.max(0, MEN_MS - (Date.now() - m.s[i])), done: !!m.done };\n}\nconst mmss = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };\nfunction vMenage() {\n  const M = menState(), adm = !!(ME && ME.admin), last = M.i === MEN.length - 1, locked = M.left > 0 && !adm;\n  return `<div class=\"pad gut menage\"><div class=\"sechead\"><h1>Ménage de fermeture</h1><span class=\"muted\">Étape ${M.i + 1} / ${MEN.length}</span></div>\n  <ol class=\"msteps\">${MEN.map((s, k) => `<li class=\"${k < M.i ? 'done' : k === M.i ? 'cur' : ''}\"><span>${k < M.i ? '✓' : k + 1}</span>${s}<small>${k < M.i ? 'fait' : '5 min'}</small></li>`).join('')}</ol>\n  <div class=\"mtimer\"><h2>${MEN[M.i]}</h2><b id=\"mtimer\" class=\"${M.left ? '' : 'over'}\">${M.left ? mmss(M.left) : 'Terminé'}</b>\n  <div class=\"mbar\"><i id=\"mbar\" style=\"width:${Math.round((1 - M.left / MEN_MS) * 100)}%\"></i></div></div>\n  <button class=\"primary\" data-a=\"mnext\" ${locked ? 'disabled' : ''} style=\"width:100%\">${last ? 'Ménage terminé' : 'Étape suivante : ' + MEN[M.i + 1]}</button>\n  ${locked ? '<small style=\"display:block;text-align:center;margin-top:8px\">Le bouton se débloque à la fin du minuteur.</small>' : ''}\n  ${adm ? '<button class=\"ghost\" data-a=\"mskip\" style=\"width:100%;margin-top:12px\">Passer le ménage (gérant)</button>' : ''}\n  <button class=\"linkbtn ${menArm ? 'armed' : ''}\" data-a=\"mcancel\" style=\"display:block;margin:16px auto 0\">${menArm ? 'Confirmer : arrêter le ménage (à refaire en entier)' : 'Un client arrive ? Reprendre le service'}</button></div>`;\n}\nfunction beep() {\n  try { if (navigator.vibrate) navigator.vibrate([400, 200, 400]); } catch (e) {}\n  try {\n    if (!AC) return; const t = AC.currentTime;\n    [0, 0.35].forEach(d => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 880; o.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(0.25, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.3); o.start(t + d); o.stop(t + d + 0.3); });\n  } catch (e) {}\n}\nfunction wakeLock(on) {\n  try {\n    if (on && !WL && navigator.wakeLock) navigator.wakeLock.request('screen').then(w => { WL = w; w.addEventListener('release', () => { WL = null; }); }).catch(() => {});\n    if (!on && WL) { WL.release(); WL = null; }\n  } catch (e) {}\n}\nsetInterval(() => {\n  const el = document.getElementById('mtimer'); if (!el) return;\n  const M = menState(); if (!M || M.done) return;\n  const key = M.m.s[M.i];\n  if (M.left > 0) { el.textContent = mmss(M.left); const bar = document.getElementById('mbar'); if (bar) bar.style.width = Math.round((1 - M.left / MEN_MS) * 100) + '%'; }\n  else if (!menRang[key]) { menRang[key] = true; beep(); render(); }\n}, 1000);\n\n// Repères du plan (pas des tables) : une petite icône pour les reconnaître d'un coup d'œil.\nconst LM_ICON = {\n  tv: '<rect x=\"3\" y=\"5\" width=\"18\" height=\"12\" rx=\"1.5\"/><path d=\"M9 20h6\"/>',\n  porte: '<path d=\"M6 21V4h10v17M4 21h16\"/><circle cx=\"13\" cy=\"12.5\" r=\".9\"/>',\n  bar: '<rect x=\"4\" y=\"10\" width=\"16\" height=\"10\" rx=\"1.5\"/><path d=\"M7 10V6h7v4M8 14h3\"/>',\n  cuisine: '<path d=\"M4 11h16v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z\"/><path d=\"M9 7.5c0-1.2 1.2-1.2 1.2-2.5M13.5 7.5c0-1.2 1.2-1.2 1.2-2.5\"/>',\n  toil: '<circle cx=\"8\" cy=\"5\" r=\"1.6\"/><circle cx=\"16\" cy=\"5\" r=\"1.6\"/><path d=\"M8 8.5v11M5.5 12h5M16 8.5l-2.6 7h5.2zM16 15.5v4\"/>',\n  entree: '<path d=\"M10 17l5-5-5-5M15 12H3M14 4h5v16h-5\"/>'\n};\nfunction lmIcon(t) { const k = /tv|télé/i.test(t) ? 'tv' : /porte/i.test(t) ? 'porte' : /bar|caisse/i.test(t) ? 'bar' : /cuisine/i.test(t) ? 'cuisine' : /toilette|wc/i.test(t) ? 'toil' : /entr/i.test(t) ? 'entree' : ''; return k ? `<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">${LM_ICON[k]}</svg>` : ''; }\n// Plan de salle (v30) : repères dessinés vus de dessus, comme un plan d'architecte.\n// TV : écran fixé au mur + cône de vision vers la salle ; porte : battant et arc d'ouverture ; bar : comptoir et tabourets ; cuisine : feux.\nconst DOOR_SVG = (dbl, cls) => `<svg class=\"door ${cls || ''}\" viewBox=\"0 0 64 40\" aria-hidden=\"true\"><path class=\"w\" d=\"M0 3H${dbl ? 6 : 10}M${dbl ? 58 : 50} 3H64\"/>${dbl\n  ? '<path class=\"lf\" d=\"M6 3V31M58 3V31\"/><path class=\"arc\" d=\"M6 31A28 28 0 0 0 32 3M58 31A28 28 0 0 1 32 3\"/>'\n  : '<path class=\"lf\" d=\"M10 3V39\"/><path class=\"arc\" d=\"M10 39A36 36 0 0 0 46 3\"/>'}</svg>`;\nfunction lmDraw(t, c, r, w, cols, rows) {\n  const pos = `grid-column:${c} / span ${w};grid-row:${r}`, lbl = esc(t);\n  const at = (cc, rr) => D.plan.some(x => typeof x.t === 'number' && x.r === rr && x.c <= cc && x.c + (x.w || 1) - 1 >= cc);\n  if (/tv|télé/i.test(t)) {\n    // Mur le plus proche : écran plaqué au mur, vision tournée vers la salle (ou vers la table voisine).\n    const o = w === 1 && at(c + 1, r) ? 'r' : w === 1 && at(c - 1, r) ? 'l' : r === rows ? 'b' : 't';\n    return `<div class=\"lm lmx lm-tv o-${o}\" style=\"${pos}\" aria-label=\"Télé\"><i class=\"scr\"></i><i class=\"cone\"></i><span>TV</span></div>`;\n  }\n  if (/^entr/i.test(t)) return `<div class=\"lm lmx lm-door lm-entree\" style=\"${pos}\">${DOOR_SVG(true, 'gold')}<span>${lbl}</span></div>`;\n  if (/porte/i.test(t)) return `<div class=\"lm lmx lm-door\" style=\"${pos}\">${DOOR_SVG(false)}<span>${lbl}</span></div>`;\n  if (/toilette|wc/i.test(t)) return `<div class=\"lm lmx lm-wc\" style=\"${pos}\"><svg viewBox=\"0 0 40 40\" aria-hidden=\"true\"><rect class=\"tank\" x=\"10\" y=\"4\" width=\"20\" height=\"7\" rx=\"2\"/><ellipse class=\"bowl\" cx=\"20\" cy=\"23\" rx=\"9\" ry=\"12\"/></svg><span>${lbl}</span></div>`;\n  if (/bar|caisse/i.test(t)) return `<div class=\"lm lmx lm-bar\" style=\"${pos}\"><i class=\"cpt\"><span>${lbl}</span></i><i class=\"stools\"></i></div>`;\n  if (/cuisine/i.test(t)) return `<div class=\"lm lmx lm-cuis\" style=\"${pos}\"><i class=\"feux\"></i><span>${lbl}</span></div>`;\n  return `<div class=\"lm\" style=\"${pos}\">${lmIcon(t)}<span>${lbl}</span></div>`;\n}\nfunction vTables() {\n  const openT = TABLES.filter(tableOpen), open = openT.length, pc = cartCnt(PATRON);\n  const enCours = r2(openT.reduce((a, t) => a + showTot(t), 0)), nPrep = ST.tickets.filter(x => x.t !== PATRON).length;\n  const cols = Math.max(1, ...D.plan.map(x => x.c + (x.w || 1) - 1)), rows = Math.max(1, ...D.plan.map(x => x.r));\n  // Sur tablette, le plan remplit l'écran : lignes avec tables pleines, lignes de repères plus basses, lignes vides fines.\n  const fitRows = mn => Array.from({ length: rows }, (_, i) => { const row = D.plan.filter(x => x.r === i + 1); return row.some(x => typeof x.t === 'number') ? `minmax(${mn}px,1fr)` : row.length ? 'minmax(24px,.62fr)' : 'minmax(4px,.3fr)'; }).join(' ');\n  const fit = fitRows(40), fitl = fitRows(33);\n  let h = `<div class=\"pad gut tview\"><div class=\"tvhead\">\n  <div class=\"sechead\"><h1>Tables</h1><span class=\"muted tcount\">${open} ouverte${open > 1 ? 's' : ''} sur ${TABLES.length}</span></div>\n  <div class=\"tstats\">\n    <div class=\"tstat\"><b>${open}<i>/${TABLES.length}</i></b><span>tables ouvertes</span></div>\n    <div class=\"tstat\"><b>${fmt(enCours)}</b><span>en cours</span></div>\n    <button class=\"tstat ${nPrep ? 'hot' : ''}\" data-a=\"go\" data-v=\"prep\"><b>${nPrep}</b><span>à préparer</span></button>\n    <button class=\"tstat patron ${pc ? 'on' : ''}\" data-a=\"open\" data-t=\"${PATRON}\" aria-label=\"Conso patron\"><b>${pc ? pc : '＋'}</b><span>${pc ? 'conso patron à enregistrer' : 'conso patron'}</span></button>\n  </div>\n  ${invDueNow() ? `<button class=\"note latec\" data-a=\"sinvopen\" style=\"display:block;width:100%;text-align:left;border-color:var(--warn);margin:0 0 12px;font:inherit;cursor:pointer\"><b>Inventaire du lundi à faire</b> · le faire maintenant</button>` : ''}</div>\n  <div class=\"floor fl29\" style=\"grid-template-columns:repeat(${cols},minmax(0,1fr));grid-template-rows:repeat(${rows},minmax(10px,auto));--fit:${fit};--fitl:${fitl}\">`;\n  D.plan.forEach(({ t, c, r, w }) => {\n    if (typeof t !== 'number') { h += lmDraw(t, c, r, w || 1, cols, rows); return; }\n    const tb = ST.tables[t], o = tableOpen(t), pend = ST.tickets.some(x => x.t === t), unsent = cartCnt(t) > 0, td = teteDue(t);\n    const meta = !o ? '' : tb ? durS(Math.max(1, mins(tb.opened))) : 'à envoyer';\n    const cls = ['tbl', o ? 'open' : 't-free', pend ? 't-prep' : '', unsent ? 't-unsent' : ''].filter(Boolean).join(' ');\n    h += `<button class=\"${cls}\" style=\"grid-column:${c};grid-row:${r}\" data-a=\"open\" data-t=\"${t}\" aria-label=\"Table ${t}${o ? ', ' + fmt(showTot(t)) + (tb && tb.pers ? ', ' + tb.pers + ' personnes' : '') + (meta ? ', ' + meta : '') : ', libre'}${pend ? ', en préparation' : ''}${unsent ? ', pas encore envoyé' : ''}${td ? ', tête à proposer' : ''}\"><span class=\"tn\">${t}</span>${o ? `<span class=\"tinfo\"><b>${fmt(showTot(t))}</b><small>${meta}</small></span>` : ''}${td ? '<i class=\"tete\">Tête ?</i>' : ''}</button>`;\n  });\n  return h + `</div><div class=\"tfoot\">${matchBar(ST.soiree && ST.soiree.match)}<div class=\"legend\"><span><i class=\"lg-open\"></i>Ouverte</span><span><i class=\"lg-prep\"></i>En préparation</span><span><i class=\"lg-unsent\"></i>Pas encore envoyé</span><span><i class=\"lt\">Tête ?</i>Proposer une tête</span></div></div></div>`;\n}\n// Le plan se met à jour toutes les minutes (durée d'occupation des tables).\nsetInterval(() => { if (ROLE !== 'gerant' && UI.view === 'tables' && !$('scrim')) bgRender(); }, 60000);\n\n// Soirée match : un bandeau qui s'active d'une touche (service ou gérant).\nfunction matchBar(m, id) {\n  return `<div class=\"matchbar ${m ? 'on' : ''}\"><span>${m ? `<b>Soirée match</b> · ${esc(m)}` : 'Soirée normale'}</span><button class=\"link\" data-a=\"matchsheet\"${id ? ` data-id=\"${esc(id)}\"` : ''}>${m ? 'Modifier' : 'C’est un soir de match'}</button></div>`;\n}\nlet MSEL = { id: null, label: '' };\nfunction drawMatch() {\n  sheetMode = 'match';\n  const on = MSEL.cur;\n  openSheet(`<div><h2>Soirée match</h2><small>Sert à comparer les soirs de match aux soirs normaux (CA, panier, personnes).</small></div>\n  <div class=\"grp\"><h3>Quel match ? · facultatif</h3><input id=\"mlabel\" class=\"note-in\" maxlength=\"60\" placeholder=\"Ex. PSG – OM\" value=\"${esc(MSEL.label)}\" style=\"font-size:16px;padding:10px 12px\"></div>\n  <div class=\"sheetact\">${on ? '<button class=\"ghost danger\" data-a=\"matchoff\">Pas un soir de match</button>' : '<button class=\"ghost\" data-a=\"close\">Annuler</button>'}<button class=\"primary\" data-a=\"matchon\">${on ? 'Enregistrer' : 'Marquer soirée match'}</button></div>`);\n}\n\n// Nombre de personnes : demandé à la première commande d'une table, modifiable ensuite.\nlet PSHEET = null;\nfunction drawPers() {\n  sheetMode = 'pers';\n  const cur = PSHEET.edit ? (ST.tables[PSHEET.t] || {}).pers : PERS[PSHEET.t];\n  openSheet(`<div><h2>Combien de personnes ?</h2><small>Table ${PSHEET.t} · sert au panier par personne et au rappel des tampons.</small></div>\n  <div class=\"persgrid\">${Array.from({ length: 12 }, (_, i) => i + 1).map(k => `<button class=\"${cur === k ? 'on' : ''}\" data-a=\"perspick\" data-n=\"${k}\">${k}</button>`).join('')}</div>\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Annuler</button>${PSHEET.edit ? '' : '<button class=\"ghost\" data-a=\"persskip\">Plus tard</button>'}</div>`);\n}\n\nfunction giftsHTML(tb, removable) {\n  if (!tb || !tb.gifts.length) return '';\n  return `<h3>Cadeaux fidélité</h3><ul class=\"lines gifts\">${tb.gifts.map((g, i) => `<li><span class=\"ln\">${esc(g.n)}<small>Palier ${g.palier} tampons</small></span><span class=\"lp\">−${fmt(g.amount)}</span>${removable && !tb.payments.length ? `<button class=\"minus\" data-a=\"ungift\" data-i=\"${i}\" aria-label=\"Annuler ce cadeau\">×</button>` : '<span></span>'}</li>`).join('')}</ul>`;\n}\n\nfunction ticketHTML(n) {\n  const tb = ST.tables[n], c = CART[n] || [], P = n === PATRON;\n  const crow = (l, i) => `<li><span class=\"q\">${l.q}×</span><span class=\"ln\">${lineDetail(l)}</span><span class=\"lp\">${fmt(l.p * l.q)}</span><button class=\"minus\" data-a=\"cminus\" data-i=\"${i}\" aria-label=\"Retirer un ${esc(l.n)}\">−</button></li>`;\n  if (P) return `<div class=\"tk\"><h2>Conso patron</h2><small>Offert. Ne part ni en préparation ni en encaissement, mais compte dans les sorties de stock.</small>\n    ${c.length ? `<h3>À enregistrer</h3><ul class=\"lines new\">${c.map(crow).join('')}</ul>` : '<p class=\"muted\" style=\"margin:0\">Touche un produit pour l’ajouter.</p>'}\n    <button class=\"primary\" data-a=\"send\" ${c.length ? '' : 'disabled'}>Enregistrer la conso</button></div>`;\n  if (!c.length && !tb) return `<div class=\"tk\"><h2>${tName(n)}</h2><p class=\"muted\">Aucun article pour l’instant. Touche un produit pour l’ajouter.</p></div>`;\n  const srow = l => `<li style=\"grid-template-columns:30px minmax(0,1fr) auto\"><span class=\"q\">${l.q}×</span><span class=\"ln\">${lineDetail(l)}</span><span class=\"lp\">${fmt(l.p * l.q)}</span></li>`;\n  return `<div class=\"tk\"><h2>${tName(n)}</h2>\n  ${c.length ? `<h3>À envoyer</h3><ul class=\"lines new\">${c.map(crow).join('')}</ul>` : ''}\n  ${tb && tb.lines.length ? `<h3>Déjà envoyé</h3><ul class=\"lines\">${tb.lines.map(srow).join('')}</ul><small class=\"muted\">Pour annuler ou offrir un article envoyé : Addition › Annulation (validée par le gérant).</small>` : ''}\n  ${giftsHTML(tb, false)}\n  ${offsHTML(tb, false)}\n  ${tb ? `<div class=\"persline\"><span>${tb.pers ? persTxt(tb.pers) + (tampons(tb) ? ' · jusqu’à ' + tampons(tb) + ' tampon' + (tampons(tb) > 1 ? 's' : '') : '') : 'Nombre de personnes non renseigné'}</span><button class=\"link\" data-a=\"persedit\">${tb.pers ? 'Modifier' : 'Renseigner'}</button></div>` : ''}\n  <div class=\"tktot\"><span>${paidTot(tb) ? 'Reste à payer' : 'Total'}</span><strong>${fmt(showTot(n))}</strong></div>\n  <div class=\"tkact\"><button class=\"primary\" data-a=\"send\" ${c.length ? '' : 'disabled'}>Envoyer en préparation</button><button class=\"ghost\" data-a=\"bill\" ${tb ? '' : 'disabled'}>Addition</button></div></div>`;\n}\n\nfunction vOrder() {\n  const n = UI.cur, P = n === PATRON, cat = CATS[UI.cat] || CATS[0], un = cartCnt(n), sg = suggestion(n);\n  return `<div class=\"order\"><section class=\"omain\">\n    <div class=\"ohead gut\"><button class=\"back\" data-a=\"go\" data-v=\"tables\">← Tables</button><div class=\"otitle\">${P ? 'Patron' : 'Table ' + n}${!P && ST.tables[n] ? `<small>${ST.tables[n].pers ? ST.tables[n].pers + ' pers. · ' : ''}ouverte depuis ${dur(Math.max(1, mins(ST.tables[n].opened)))}</small>` : ''}</div><div class=\"ototal\">${P ? 'Offert' : fmt(showTot(n))}</div></div>\n    ${sg ? `<div class=\"gut\"><div class=\"sugg\"><span><b>Suggestion</b>${esc(sg.txt)}</span>${sg.item ? '<button class=\"primary\" data-a=\"sugg\">Proposer</button>' : ''}<button class=\"minus\" data-a=\"sdis\" data-key=\"${esc(sg.key)}\" aria-label=\"Masquer la suggestion\">×</button></div></div>` : ''}\n    <div class=\"cats gut\">${CATS.map((m, i) => `<button class=\"chip ${m === cat ? 'on' : ''}\" data-a=\"cat\" data-i=\"${i}\">${esc(m)}</button>`).join('')}</div>\n    <div class=\"scroll gut\"><div class=\"igrid\">${itemsOf(cat).map(it => `<button class=\"item\" data-a=\"item\" data-n=\"${esc(it.n)}\"><span class=\"iname\">${esc(it.n)}</span>${it.sub ? `<span class=\"isub\">${esc(it.sub)}</span>` : ''}<span class=\"iprice\">${it.o.some(g => D.options[g] && D.options[g].choices.some(c => c.add)) ? '<small>dès</small> ' : ''}${fmt(it.p)}</span></button>`).join('')}</div></div>\n    <div class=\"bar gut\"><button class=\"ghost\" data-a=\"ticket\">${P ? 'Détail' : 'Ticket'} · ${un + cnt(ST.tables[n])} art.</button><button class=\"primary\" data-a=\"send\" ${un ? '' : 'disabled'}>${P ? 'Enregistrer' : 'Envoyer'}${un ? ' (' + un + ')' : ''}</button></div>\n  </section><aside class=\"side\">${ticketHTML(n)}</aside></div>`;\n}\n\nfunction vPrep() {\n  const list = ST.tickets.slice().sort((a, b) => a.ts - b.ts);\n  return `<div class=\"pad gut\"><div class=\"sechead\"><h1>À préparer</h1><span class=\"muted\">${list.length} en attente · ordre de commande</span></div>\n  ${list.length ? `<div class=\"plist\">${list.map(x => {\n    const m = mins(x.ts);\n    return `<article class=\"prep\"><header><strong>${tName(x.t)}</strong><span class=\"age ${m >= 10 ? 'late' : ''}\">${ago(x.ts)}${x.by ? ' · ' + esc(x.by) : ''}</span></header>\n    <ul>${x.lines.map(l => `<li><span class=\"q\">${l.q}×</span><span class=\"pn\">${esc(l.n)}</span>${l.d.length ? `<small>${l.d.map(esc).join(' · ')}</small>` : ''}</li>`).join('')}</ul>\n    ${String(x.id).charAt(0) === 'q' ? '<button class=\"primary\" disabled>Envoi…</button>' : `<button class=\"primary\" data-a=\"done\" data-id=\"${x.id}\">Servi</button>`}</article>`;\n  }).join('')}</div>` : '<p class=\"empty\">Rien en attente. Les commandes envoyées s’affichent ici, de la plus ancienne à la plus récente.</p>'}</div>`;\n}\n\nfunction payBtn(n, m, amt, kind, label, cls = 'primary') {\n  const key = [n, m, amt, kind].join('|'), on = arm === key;\n  return `<button class=\"${cls} ${on ? 'armed' : ''}\" data-a=\"pay\" data-t=\"${n}\" data-m=\"${m}\" data-amt=\"${amt}\" data-kind=\"${kind}\">${on ? 'Confirmer · ' + fmt(amt) : label}</button>`;\n}\nconst payRow = (n, amt, kind) => `<div class=\"payrow\">${payBtn(n, 'CB', amt, kind, 'CB · ' + fmt(amt))}${payBtn(n, 'Espèces', amt, kind, 'Espèces · ' + fmt(amt))}</div>`;\n\nfunction vBill() {\n  const n = UI.cur, tb = ST.tables[n];\n  if (!tb) { UI.view = UI.billFrom === 'cash' ? 'cash' : 'tables'; return UI.view === 'cash' ? vCash() : vTables(); }\n  const back = UI.billFrom === 'cash' ? `<button class=\"back\" data-a=\"go\" data-v=\"cash\">← Encaissement</button>` : `<button class=\"back\" data-a=\"go\" data-v=\"order\">← Table ${n}</button>`;\n  const r = rest(tb), p = paidTot(tb), un = cartCnt(n);\n  const amountOnly = tb.payments.some(x => x.kind !== 'items') || !!tb.promo || !!(tb.offs || []).length;\n  if (bm.mode === 'items' && amountOnly) bm.mode = 'all';\n  let pay;\n  if (un) {\n    pay = `<p class=\"warnline\" style=\"margin:0\">${un} article${un > 1 ? 's' : ''} pas encore envoyé${un > 1 ? 's' : ''}. Envoie-les avant d’encaisser.</p><button class=\"primary\" data-a=\"sendbill\">Envoyer en préparation</button>`;\n  } else if (r === 0) {\n    pay = `<p class=\"giftnote\">Rien à payer : ${p ? 'tout est réglé' : 'les cadeaux couvrent la commande'}. Pas de CB ni d’espèces.</p>${payBtn(n, 'Aucun', 0, 'zero', 'Clôturer la table · 0 €')}`;\n  } else {\n    const seg = `<div class=\"seg\">${[['all', 'Tout'], ['items', 'Par articles'], ['equal', 'Parts égales']].map(([k, l]) => `<button class=\"${bm.mode === k ? 'on' : ''}\" data-a=\"bm\" data-m=\"${k}\" ${k === 'items' && amountOnly ? 'disabled' : ''}>${l}</button>`).join('')}</div>`;\n    let body = '';\n    if (bm.mode === 'all') body = payRow(n, r, 'all');\n    if (bm.mode === 'items') {\n      const us = units(tb).filter(u => u.left > 0), amt = selAmount(tb, bm.sel), nsel = Object.values(bm.sel).reduce((a, b) => a + b, 0);\n      body = `<small>Sélectionne ce que paie cette personne. La table reste ouverte pour le reste.</small>\n      <ul class=\"ulist\">${us.map(u => {\n        const s = bm.sel[u.k] || 0, next = u.prices[u.paid + s];\n        return `<li><span class=\"ln\">${lineDetail(u)}<small>${u.left} restant${u.left > 1 ? 's' : ''} · ${next !== undefined ? (next === 0 ? 'prochain offert' : fmt(next) + ' l’unité') : 'tout sélectionné'}</small></span>\n        <span class=\"step\"><button data-a=\"u-\" data-k=\"${esc(u.k)}\" ${s ? '' : 'disabled'} aria-label=\"Moins\">−</button><b>${s}</b><button data-a=\"u+\" data-k=\"${esc(u.k)}\" ${s < u.left ? '' : 'disabled'} aria-label=\"Plus\">+</button></span></li>`;\n      }).join('')}</ul>\n      ${nsel ? (amt > 0 ? payRow(n, amt, 'items') : payBtn(n, 'Aucun', 0, 'items', 'Valider · articles offerts')) : '<p class=\"muted\" style=\"margin:0\">Aucun article sélectionné.</p>'}`;\n    }\n    if (bm.mode === 'equal') {\n      const sp = tb.split, part = equalPart(tb);\n      body = `<div class=\"chips\">${[...new Set([2, 3, 4, 5, 6].concat(tb.pers > 6 && tb.pers <= 10 ? [tb.pers] : []))].map(k => `<button class=\"chip ${sp && sp.n === k ? 'on' : ''}\" data-a=\"split\" data-n=\"${k}\">${k} parts</button>`).join('')}</div>\n      ${sp ? `<p style=\"margin:0\"><b>Part ${sp.done + 1} sur ${sp.n}</b> · ${fmt(part)}</p>${payRow(n, part, 'equal')}` : `<p class=\"muted\" style=\"margin:0\">Choisis le nombre de parts${tb.pers ? ' (' + persTxt(tb.pers) + ' à table)' : ''}.</p>`}`;\n    }\n    pay = seg + body;\n  }\n  return `<div class=\"pad gut\"><div class=\"bill\">${back}<h1>Addition · table ${n}</h1>\n  <ul class=\"lines\">${tb.lines.map(l => `<li style=\"grid-template-columns:30px minmax(0,1fr) auto\"><span class=\"q\">${l.q}×</span><span class=\"ln\">${lineDetail(l)}</span><span class=\"lp\">${fmt(l.p * l.q)}</span></li>`).join('')}</ul>\n  ${giftsHTML(tb, true)}\n  ${offsHTML(tb, true)}\n  ${tb.promo ? `<div class=\"promoline\"><span><b>Promotion −${tb.promo.pct} %</b> · ${esc(tb.promo.motif)} : ${esc(tb.promo.pour)}</span><strong>−${fmt(promoAmt(tb))}</strong>${tb.payments.length ? '' : `<button class=\"link\" data-a=\"unpromo\">Retirer</button>`}</div>` : ''}\n  ${(() => { const bts = (tb.payments.length ? [] : [`<button class=\"ghost\" data-a=\"gift\" data-t=\"${n}\">Cadeau fidélité</button>`].concat(tb.promo ? [] : [`<button class=\"ghost\" data-a=\"promo\" data-t=\"${n}\">Promotion</button>`])).concat(annulUnits(tb).length ? [`<button class=\"ghost\" data-a=\"annul\">Annulation</button>`] : []);\n    return bts.length ? `<div class=\"btnrow ${bts.length === 3 ? 'b3' : ''}\">${bts.join('')}</div>` : ''; })()}\n  ${tb.payments.length ? `<h3>Déjà payé</h3><ul class=\"lines\">${tb.payments.map(x => `<li style=\"grid-template-columns:52px minmax(0,1fr) auto\"><span class=\"muted\">${fmtH(x.ts)}</span><span>${x.method}</span><span class=\"lp\">${fmt(x.amount)}</span></li>`).join('')}</ul>` : ''}\n  <div class=\"due\"><span>${p ? 'Reste à payer' : 'À taper en caisse'}${giftTot(tb) ? `<small>Cadeaux déduits : −${fmt(giftTot(tb))}</small>` : ''}${offTot(tb) ? `<small>Annulé ou offert : −${fmt(offTot(tb))}</small>` : ''}${tb.promo ? `<small>Promotion −${tb.promo.pct} % : −${fmt(promoAmt(tb))}</small>` : ''}${p ? `<small>Déjà payé : ${fmt(p)}</small>` : ''}</span><strong>${fmt(r)}</strong></div>\n  ${pay}\n  <p class=\"muted\" style=\"font-size:13px;margin:0\">Tape le montant en caisse, encaisse, puis indique le moyen de paiement. Un second appui confirme.</p></div></div>`;\n}\n\nfunction vCash() {\n  const list = Object.keys(ST.tables).map(Number).sort((a, b) => ST.tables[a].opened - ST.tables[b].opened);\n  return `<div class=\"pad gut\"><div class=\"sechead\"><h1>Encaissement</h1><span class=\"muted\">${list.length} à encaisser · ordre de commande</span></div>\n  <p class=\"note\">Fidélité : 1 tampon par visite et par personne, dès 10 € d’achats. Pense à tamponner les cartes au moment du paiement.</p>\n  ${list.length ? `<div class=\"cash\">${list.map(n => {\n    const tb = ST.tables[n], r = rest(tb), p = paidTot(tb), un = cartCnt(n);\n    const tp = tampons(tb);\n    return `<article class=\"ccard\"><header><strong>${tName(n)}</strong><span class=\"muted\">${tb.pers ? persTxt(tb.pers) + ' · ' : ''}${cnt(tb)} article${cnt(tb) > 1 ? 's' : ''} · ${ago(tb.opened)}</span></header>\n    <div class=\"amt\">${fmt(r)}</div>\n    ${tp != null ? `<p class=\"giftnote\">${tp ? `Tampons : jusqu’à ${tp} (1 par personne dès 10 €)` : 'Tampons : aucun, moins de 10 € d’achats'}</p>` : ''}\n    ${p ? `<p class=\"giftnote\">Déjà payé : ${fmt(p)}${tb.split ? ' · partage en ' + tb.split.n : ''}</p>` : ''}\n    ${giftTot(tb) ? `<p class=\"giftnote\">Cadeau fidélité déduit : −${fmt(giftTot(tb))}</p>` : ''}\n    ${offTot(tb) ? `<p class=\"giftnote\">Annulé ou offert : −${fmt(offTot(tb))}${(tb.offs || []).some(o => !o.ok) ? ' · en attente du gérant' : ''}</p>` : ''}\n    ${tb.promo ? `<p class=\"giftnote\">Promotion −${tb.promo.pct} % déduite : −${fmt(promoAmt(tb))}</p>` : ''}\n    ${un ? `<p class=\"warnline\" style=\"margin:0\">${un} article${un > 1 ? 's' : ''} pas encore envoyé${un > 1 ? 's' : ''}.</p>` : ''}\n    <div class=\"links\"><button class=\"link\" data-a=\"detail\" data-t=\"${n}\">Voir le détail</button><button class=\"link\" data-a=\"splitbill\" data-t=\"${n}\">Diviser l’addition</button>${p ? '' : `<button class=\"link\" data-a=\"gift\" data-t=\"${n}\">Cadeau fidélité</button>`}${annulUnits(tb).length ? `<button class=\"link\" data-a=\"annul\" data-t=\"${n}\">Annulation</button>` : ''}</div>\n    ${un ? '' : r === 0 ? payBtn(n, 'Aucun', 0, 'zero', 'Clôturer la table · 0 €') : payRow(n, r, 'all')}</article>`;\n  }).join('')}</div>` : '<p class=\"empty\">Aucune table à encaisser.</p>'}\n  <div class=\"closebox\"><h3>Fin de service</h3>${closeBoxHTML(list)}</div></div>`;\n}\n\n// Fin de service (Rayane, 9 nov.) : 1. encaisser toutes les tables, 2. compter la caisse, 3. ménage, 4. fermer.\nfunction countGridHTML() {\n  return `<label style=\"font-weight:600\">Compte tout le tiroir, billets et pièces</label>\n  <div class=\"cgrid\">${DENOMS.map((d, i) => `<label for=\"cnt-${i}\">${d >= 5 ? d + ' €' : fmt(d)}<input id=\"cnt-${i}\" type=\"number\" inputmode=\"numeric\" min=\"0\" step=\"1\" placeholder=\"0\" value=\"${esc(COUNTS[i] || '')}\"></label>`).join('')}</div>\n  <div class=\"ctotal\"><span>Total compté</span><b id=\"cnt-total\">${fmt(countTotal())}</b></div>`;\n}\nfunction closeBoxHTML(list) {\n  const so = ST.soiree, men = so && so.menage, noCash = so && so.cashN === 0, cnt = so && so.count;\n  if (list.length) return `<p class=\"muted\" style=\"margin:0\">Encaisse toutes les tables (${list.length} restante${list.length > 1 ? 's' : ''}) avant de fermer la soirée.</p>`;\n  const cntLine = noCash ? `<p class=\"giftnote\" style=\"font-size:15px\">Aucun paiement en espèces ce soir : rien à compter.</p>`\n    : cnt ? `<p class=\"giftnote\" style=\"font-size:15px\">Caisse comptée : ${fmt(cnt.c)} ✓${cnt.by ? ' (' + esc(cnt.by) + ')' : ''}</p>${men && !men.done ? '' : '<button class=\"linkbtn\" data-a=\"recount\">Recompter</button>'}` : '';\n  if (!noCash && !cnt && !(men && men.done)) return `${so.countTry ? `<p class=\"note latec\" style=\"border-color:var(--warn);margin:0\"><b>Recompte une fois, tranquillement.</b> Billets d’abord, puis pièces. Ce second comptage sera gardé.</p>` : `<p class=\"muted\" style=\"margin:0\">Étape 1 : compte la caisse. Étape 2 : ménage de 15 minutes (plumeau, aspirateur, serpillère + toilettes). Étape 3 : fermer.</p>`}\n  ${countGridHTML()}\n  <label for=\"tpe-total\" style=\"font-weight:600\">Total CB du TPE <span class=\"muted\" style=\"font-weight:400\">(ticket de fin de journée, facultatif)</span></label>\n  <input id=\"tpe-total\" class=\"note-in\" inputmode=\"decimal\" placeholder=\"Ex. 245,50\" value=\"${esc(TPEV)}\">\n  <button class=\"primary\" data-a=\"countok\" ${countFilled() ? '' : 'disabled'}>${so.countTry ? 'Valider le second comptage' : 'Valider le comptage'}</button>`;\n  if (!(men && men.done)) return `${cntLine}<p class=\"muted\" style=\"margin:0\">Ensuite : ménage de 15 minutes, en 3 étapes de 5 min (plumeau, aspirateur, serpillère + toilettes).</p>\n  <button class=\"primary\" data-a=\"mstart\">Lancer le ménage</button>`;\n  return `${cntLine}<p class=\"giftnote\" style=\"font-size:15px\">${men.skip ? 'Ménage passé (code gérant).' : 'Ménage fait ✓'}</p>\n  ${!noCash && !cnt ? countGridHTML() : ''}\n  <label for=\"comment\" style=\"font-weight:600\">Commentaire de fin de service <span class=\"muted\" style=\"font-weight:400\">(facultatif)</span></label>\n  <textarea id=\"comment\" class=\"note-in\" rows=\"3\" maxlength=\"1000\" placeholder=\"Ex. rupture de Mango juice, table 12 a cassé un verre, soirée calme…\">${esc(commentVal)}</textarea>\n  <button class=\"primary\" data-a=\"closenight\">${locating ? 'Localisation…' : 'Fermer la soirée'}</button>`;\n}\n// Comptage guidé : nombre de billets et de pièces, total calculé.\nconst DENOMS = [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];\nlet COUNTS = {}, TPEV = '';\nconst countTotal = () => r2(DENOMS.reduce((a, d, i) => a + d * (Math.floor(+COUNTS[i]) || 0), 0) + (+String(COUNTS.x || '').replace(',', '.') || 0));\nconst countFilled = () => Object.values(COUNTS).some(v => String(v).trim() !== '');\nconst countDetail = () => DENOMS.map((d, i) => (Math.floor(+COUNTS[i]) || 0) ? (Math.floor(+COUNTS[i])) + '×' + String(d).replace('.', ',') + '€' : '').filter(String).concat(+COUNTS.x ? ['monnaie ' + String(COUNTS.x).replace('.', ',') + '€'] : []).join(' + ');\nconst PIN_ICON = '<svg viewBox=\"0 0 24 24\"><path d=\"M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/></svg>';\n\nfunction vGate() {\n  const so = ST.soiree, team = so ? (so.team || []).filter(x => !x.out).map(x => x.nom) : [];\n  const txt = !so ? 'Tu dois être au lounge : l’appli vérifie la position du téléphone, puis ouvre la soirée.'\n    : `Soirée ouverte depuis ${fmtH(so.opened)}${team.length ? ' · en service : ' + team.map(esc).join(', ') : ''}. ` + (so.remote ? 'Ouverte par le gérant : pas de contrôle de position.' : 'L’appli vérifie que tu es au lounge.');\n  return `<div class=\"pad gut gate\"><div class=\"gatebox\">${PIN_ICON}\n  <h1>${ME && ME.admin ? 'Mode gérant' : ME && ME.nom ? 'Bonjour ' + esc(ME.nom) : 'Prise de service'}</h1>\n  <p class=\"muted\" style=\"margin:0\">${ME && ME.admin ? 'Avec ton code, pas de contrôle de position. La soirée s’ouvre tout de suite.' : txt}</p>\n  <button class=\"primary\" data-a=\"scanin\">${locating ? 'Localisation…' : ME && ME.admin ? 'Ouvrir la soirée' : 'Commencer mon service'}</button>\n  <small>La première fois, le téléphone demande l’accès à ta position : réponds « Autoriser ».</small>\n  ${CODES && ME && !ME.admin ? `<button class=\"ghost\" data-a=\"go\" data-v=\"msgs\">Messages${unread() ? ' · ' + unread() + ' non lu' + (unread() > 1 ? 's' : '') : ''}</button>` : ''}\n  ${CODES ? '<button class=\"linkbtn\" data-a=\"logout\">Ce n’est pas moi</button>' : ''}</div></div>`;\n}\nconst LOCK_ICON = '<svg viewBox=\"0 0 24 24\"><rect x=\"4.5\" y=\"10.5\" width=\"15\" height=\"10\" rx=\"2.5\"/><path d=\"M8 10.5V7.5a4 4 0 0 1 8 0v3\"/><circle cx=\"12\" cy=\"15.5\" r=\"1.3\"/></svg>';\nfunction vLock() {\n  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];\n  return `<div class=\"pad gut gate\"><div class=\"gatebox\">${LOCK_ICON}\n  <h1>${logging ? 'Vérification…' : 'Ton code'}</h1>\n  <p class=\"muted\" style=\"margin:0\">Tape ton code personnel à 4 chiffres.</p>\n  <div class=\"dots\" aria-label=\"${PINBUF.length} chiffre(s) sur 4\">${[0, 1, 2, 3].map(i => `<i class=\"${PINBUF.length > i ? 'on' : ''}\"></i>`).join('')}</div>\n  <div class=\"keypad\">${keys.map(k => !k ? '<span></span>' : k === 'del' ? `<button class=\"erase\" data-a=\"key\" data-k=\"del\" ${logging ? 'disabled' : ''}>Effacer</button>` : `<button data-a=\"key\" data-k=\"${k}\" ${logging ? 'disabled' : ''}>${k}</button>`).join('')}</div>\n  <small>Pas de code ? Demande-le au gérant.</small></div></div>`;\n}\nfunction drawMe() {\n  sheetMode = 'me';\n  const so = ST.soiree, me = so && (so.team || []).find(x => x.nom === ME.nom && !x.out);\n  openSheet(`<div><h2>${esc(ME.nom)}</h2><small>${me ? 'En service depuis ' + fmtH(me.in) : 'Pas en service'}</small></div>\n  <div class=\"menu\">${me ? `<button class=\"ghost\" data-a=\"leave\">${leaving ? 'Localisation…' : 'Terminer mon service'}</button>` : ''}\n  <button class=\"ghost\" data-a=\"logout\">Changer de personne</button>\n  <button class=\"ghost\" data-a=\"close\">Fermer</button></div>\n  <small>La dernière personne en service ferme la soirée depuis l’onglet Encaissement.</small>`);\n}\n\n// ---- Messages et demandes à valider ----\nconst dchip = s => `<span class=\"dchip ${s === 'Validée' ? 'ok' : s === 'Refusée' ? 'bad' : s === 'En attente' ? 'wait' : ''}\">${s === 'En attente' ? 'en attente' : esc(String(s).toLowerCase())}</span>`;\nconst demTxt = d => esc(d.detail) + (d.motif ? ' · ' + esc(d.motif) : '') + (d.pour ? ' : ' + esc(d.pour) : '');\nfunction demCard(d) {\n  const boss = isBoss(), a = v => demArm === d.id + ':' + v, caisse = d.type === 'Avance' && d.pay === 'Caisse';\n  const when = new Date(d.ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }) + ' ' + fmtH(d.ts);\n  const mine = ME && d.by === ME.nom && (d.type === 'Avance' || (ST.tables[d.t] && !(ST.tables[d.t].payments || []).length));\n  return `<article class=\"dem\"><header><span class=\"dtype\">${esc(d.type)}</span><b>${fmt(d.amount)}</b></header>\n  <p>${demTxt(d)}</p><small>${esc(d.by)} · ${when}${d.type !== 'Avance' && d.cons === false ? ' · pas consommé' : ''}</small>\n  ${boss ? `<div class=\"btnrow\"><button class=\"primary ${a('ok') ? 'armed' : ''}\" data-a=\"ddec\" data-id=\"${esc(d.id)}\" data-v=\"ok\">${a('ok') ? 'Confirmer' : caisse ? 'Accepter · caisse' : d.type === 'Avance' ? 'Accepter' : 'Valider'}</button><button class=\"ghost danger ${a('no') ? 'armed' : ''}\" data-a=\"ddec\" data-id=\"${esc(d.id)}\" data-v=\"no\">${a('no') ? 'Confirmer le refus' : 'Refuser'}</button></div>\n  ${caisse ? `<button class=\"linkbtn ${a('hors') ? 'armed' : ''}\" data-a=\"ddec\" data-id=\"${esc(d.id)}\" data-v=\"hors\" style=\"justify-self:start;padding:2px 0\">${a('hors') ? 'Confirmer : accepter hors caisse' : 'Accepter, mais je la donne moi-même'}</button>` : ''}`\n  : mine ? `<button class=\"linkbtn ${a('w') ? 'armed' : ''}\" data-a=\"dwith\" data-id=\"${esc(d.id)}\" style=\"justify-self:start;padding:2px 0\">${a('w') ? 'Confirmer : retirer ma demande' : 'Retirer ma demande'}</button>` : '<small>En attente de la réponse du gérant.</small>'}</article>`;\n}\nfunction bubble(m, prev) {\n  const me = isBoss() ? m.from === 'G' : m.from === 'S', d = m.dem && m.from === 'S' && m.sys ? DEMS().find(x => x.id === m.dem) : null;\n  const day = new Date(m.ts).toDateString(), hd = !prev || new Date(prev.ts).toDateString() !== day ? `<div class=\"dayhd\">${new Date(m.ts).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>` : '';\n  return hd + `<div class=\"bub ${me ? 'me' : ''} ${m.sys ? 'sys' : ''}\"><small>${esc(m.from === 'G' ? 'Gérant' : m.nom)} · ${fmtH(m.ts)}${d ? ' · ' + dchip(d.status) : ''}</small><p>${esc(m.txt)}</p></div>`;\n}\nfunction vMsgs() {\n  const boss = isBoss(), M = msgsOf(), P = boss ? pendDems() : pendDems().filter(d => ME && d.by === ME.nom);\n  const c = ST.chat || {}, lastMine = M.filter(m => boss ? m.from === 'G' : m.from === 'S').pop(), seenOther = (boss ? c.seenS : c.seenG) || 0;\n  const gate = ROLE !== 'gerant' && !(ST.soiree && onDuty());\n  return `<div class=\"pad gut msgs\">${gate ? '<button class=\"back\" data-a=\"go\" data-v=\"tables\">← Retour</button>' : ''}\n  <div class=\"sechead\"><h1>Messages</h1><span class=\"muted\">${boss ? 'avec l’équipe' : 'avec le gérant'}</span></div>\n  ${!boss ? `<button class=\"ghost\" data-a=\"avopen\" style=\"width:100%;margin-bottom:14px\">Demander une avance</button>` : ''}\n  ${P.length ? `<section><h2>${boss ? 'À valider' : 'Mes demandes en attente'} · ${P.length}</h2>${P.map(demCard).join('')}</section>` : ''}\n  <div class=\"thread\" id=\"thread\">${M.length ? M.map((m, i) => bubble(m, M[i - 1])).join('') : `<p class=\"empty\">Aucun message pour l’instant. ${boss ? 'Écris à ton équipe ici.' : 'Écris au gérant ici.'}</p>`}\n  ${lastMine && seenOther >= lastMine.ts ? `<small style=\"align-self:flex-end\">Vu à ${fmtH(seenOther)}</small>` : ''}</div>\n  <form class=\"chatform\" id=\"chatform\" autocomplete=\"off\"><textarea id=\"chat-in\" rows=\"1\" maxlength=\"500\" placeholder=\"Écrire un message…\">${esc(CHATV)}</textarea><button class=\"primary\" type=\"submit\">Envoyer</button></form></div>`;\n}\nfunction markRead() { readBusy = true; call('chatRead', {}).then(r => { if (r && r.state) setST(r.state); readBusy = false; updBadges(); }).catch(() => { readBusy = false; }); }\nfunction updBadges() {\n  const set = (id, n) => { const e = $(id); if (e) { e.hidden = !n; e.textContent = n; } };\n  set(ROLE === 'gerant' ? 'badge-hm' : 'badge-msgs', unread());\n}\n// Nouveau message de l'autre côté : petit avertissement (sauf si le fil est déjà ouvert).\nfunction newMsgToast() {\n  if (!ST.chat) return;\n  const from = isBoss() ? 'S' : 'G', list = msgsOf().filter(m => m.from === from), mx = list.length ? list[list.length - 1].ts : 0;\n  if (LASTIN == null) { LASTIN = mx; return; }\n  if (mx <= LASTIN) return;\n  LASTIN = mx;\n  const m = list[list.length - 1], here = ROLE === 'gerant' ? MTAB === 'msg' : UI.view === 'msgs';\n  if (!here) { toast((m.from === 'G' ? 'Gérant' : m.nom) + ' : ' + m.txt.slice(0, 90)); beep(); }\n}\n// Articles offerts ou annulés après service, sur le ticket et l'addition.\nfunction offsHTML(tb, withdraw) {\n  if (!tb || !(tb.offs || []).length) return '';\n  // Une ligne par demande et par article (2 Red Bull annulés ensemble = une ligne « 2× »).\n  const G = [];\n  tb.offs.forEach(o => { const g = G.find(x => x.id === o.id && x.k === o.k); if (g) { g.q++; g.amount = r2(g.amount + o.amount); } else G.push({ id: o.id, k: o.k, type: o.type, ok: o.ok, q: 1, amount: o.amount }); });\n  return `<h3>Annulé ou offert</h3><ul class=\"lines gifts\">${G.map(o => {\n    const l = tb.lines.find(x => x.k === o.k), d = DEMS().find(x => x.id === o.id), mine = withdraw && !o.ok && !tb.payments.length && d && ME && d.by === ME.nom;\n    return `<li><span class=\"ln\">${o.q > 1 ? o.q + '× ' : ''}${esc(l ? l.n : 'Article')}<small>${o.type === 'Annulation' ? 'Annulé' : 'Offert'} · ${o.ok ? '<span class=\"okc\">validé par le gérant</span>' : '<span class=\"latec\">en attente du gérant</span>'}</small></span><span class=\"lp\">−${fmt(o.amount)}</span>${mine ? `<button class=\"minus ${demArm === o.id + ':w' ? 'armed' : ''}\" data-a=\"dwith\" data-id=\"${esc(o.id)}\" aria-label=\"Retirer la demande\">${demArm === o.id + ':w' ? '✓' : '×'}</button>` : '<span></span>'}</li>`;\n  }).join('')}</ul>`;\n}\n// Annulation simple seulement si l'article attend encore en préparation depuis moins de 15 min.\nfunction freeTicket(t, k) {\n  return ST.tickets.filter(x => x.t === t && x.lines.some(y => y.k === k && y.q > 0)).sort((a, b) => b.ts - a.ts).find(x => Date.now() - x.ts < FREE_CANCEL_MS) || null;\n}\nconst offOk = () => !!(OFFSEL && OFFSEL.motif && (OFFSEL.type !== 'Offert' || OFFSEL.pour.trim().length >= 2));\nfunction drawOff() {\n  const o = OFFSEL, boss = !!(ME && ME.admin); sheetMode = 'off';\n  openSheet(`<div><h2>1× ${esc(o.name)} · ${fmt(o.price)}</h2><small>${tName(o.t)} · servi, ou envoyé il y a plus de 15 min. ${boss ? 'Code gérant : validé tout de suite.' : 'Retiré de l’addition tout de suite ; le gérant doit valider.'}</small></div>\n  <div class=\"seg seg2\" style=\"max-width:none\">${['Offert', 'Annulation'].map(x => `<button class=\"${o.type === x ? 'on' : ''}\" data-a=\"offtype\" data-v=\"${x}\">${x === 'Offert' ? 'Offrir' : 'Annuler'}</button>`).join('')}</div>\n  <div class=\"grp\"><h3>${o.type === 'Offert' ? 'Motif' : 'Raison'}</h3><div class=\"chips\">${(o.type === 'Offert' ? PROMO_MOTIFS : OFF_RAISONS).map(m => `<button class=\"chip ${o.motif === m ? 'on' : ''}\" data-a=\"offmotif\" data-m=\"${esc(m)}\">${esc(m)}</button>`).join('')}</div>\n  ${o.type === 'Annulation' ? '<small>Produit raté ou client mécontent : compté comme consommé (stock). Pas préparé ou erreur de commande : pas consommé.</small>' : '<small>Compté comme consommé (stock), sans passer en caisse.</small>'}</div>\n  ${o.type === 'Offert' ? `<div class=\"grp\"><h3>Pour qui ? · obligatoire</h3><input id=\"offpour\" class=\"note-in\" maxlength=\"120\" placeholder=\"Ex. Sami, ami du gérant\" value=\"${esc(o.pour)}\" style=\"font-size:16px;padding:10px 12px\"></div>` : ''}\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Retour</button><button class=\"primary\" data-a=\"offok\" ${offOk() ? '' : 'disabled'}>${boss ? 'Valider' : 'Envoyer au gérant'}</button></div>`);\n}\n// Annulation à l'encaissement : articles encore annulables (ni payés à l'unité, ni en cadeau, ni déjà annulés ou offerts).\nfunction annulUnits(tb) {\n  if (!tb || tb.payments.some(x => x.kind === 'items')) return [];\n  return tb.lines.map(l => ({ l, left: l.q - (tb.gifts || []).filter(g => g.k === l.k).length - (tb.offs || []).filter(o => o.k === l.k).length })).filter(x => x.left > 0);\n}\nlet ANSEL = null;\nconst ANNUL_RAISONS = ['Erreur de commande', 'Pas préparé (rupture, oubli)', 'Produit raté', 'Client mécontent', 'Client parti sans payer', 'Offert (geste, ami…)'];\nconst anAmt = () => { const tb = ANSEL && ST.tables[ANSEL.t]; return tb ? r2(tb.lines.reduce((a, l) => a + l.p * (ANSEL.sel[l.k] || 0), 0)) : 0; };\nconst anOk = () => !!(ANSEL && Object.values(ANSEL.sel).some(v => v > 0) && ANSEL.motif && ANSEL.expl.trim().length >= 5);\nfunction drawAnnul() {\n  const tb = ANSEL && ST.tables[ANSEL.t];\n  if (!tb) { ANSEL = null; closeSheet(); return; }\n  const boss = !!(ME && ME.admin), U = annulUnits(tb), amt = anAmt();\n  sheetMode = 'annul';\n  openSheet(`<div><h2>Annulation · ${tName(ANSEL.t)}</h2><small>${boss ? 'Code gérant : validée tout de suite.' : 'Le gérant valide. Les articles sortent de l’addition en attendant sa réponse ; s’il refuse, ils reviennent à payer.'}</small></div>\n  <div class=\"grp\"><h3>Quels articles ?</h3><ul class=\"ulist\">${U.map(({ l, left }) => { const q = ANSEL.sel[l.k] || 0;\n    return `<li><span class=\"ln\">${lineDetail(l)}<small>${left} sur l’addition · ${fmt(l.p)} l’unité</small></span><span class=\"step\"><button data-a=\"an-\" data-k=\"${esc(l.k)}\" ${q ? '' : 'disabled'} aria-label=\"Moins\">−</button><b>${q}</b><button data-a=\"an+\" data-k=\"${esc(l.k)}\" ${q < left ? '' : 'disabled'} aria-label=\"Plus\">+</button></span></li>`; }).join('')}</ul></div>\n  <div class=\"grp\"><h3>Raison</h3><div class=\"chips\">${ANNUL_RAISONS.map(m => `<button class=\"chip ${ANSEL.motif === m ? 'on' : ''}\" data-a=\"anmotif\" data-m=\"${esc(m)}\">${esc(m)}</button>`).join('')}</div>\n  <small>Raté, client mécontent ou offert : compté comme consommé (stock). Pas préparé ou erreur de commande : pas consommé.</small></div>\n  <div class=\"grp\"><h3>Explication · obligatoire</h3><textarea id=\"anexpl\" class=\"note-in\" rows=\"2\" maxlength=\"200\" placeholder=\"Ex. burger trop cuit, le client n’en a pas voulu\">${esc(ANSEL.expl)}</textarea></div>\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Retour</button><button class=\"primary\" data-a=\"anok\" ${anOk() ? '' : 'disabled'}>${boss ? 'Annuler' : 'Envoyer au gérant'}${amt ? ' · −' + fmt(amt) : ''}</button></div>`);\n}\nconst avOk = () => !!(AVF && +String(AVF.amount).replace(',', '.') >= 1);\nfunction drawAvance() {\n  sheetMode = 'avance';\n  openSheet(`<div><h2>Demande d’avance</h2><small>Le gérant l’accepte ou la refuse ; tu vois sa réponse dans Messages. L’avance est déduite de ton salaire.</small></div>\n  <div class=\"grp\"><h3>Montant (€)</h3><input id=\"av-amount\" class=\"note-in\" inputmode=\"decimal\" placeholder=\"Ex. 50\" value=\"${esc(AVF.amount)}\" style=\"font-size:20px;padding:10px 12px\"></div>\n  <div class=\"grp\"><h3>Comment ?</h3><div class=\"chips\"><button class=\"chip ${AVF.pay === 'caisse' ? 'on' : ''}\" data-a=\"avpay\" data-p=\"caisse\">Dans la caisse</button><button class=\"chip ${AVF.pay === 'hors' ? 'on' : ''}\" data-a=\"avpay\" data-p=\"hors\">Virement ou plus tard</button></div></div>\n  <div class=\"grp\"><h3>Motif · facultatif</h3><input id=\"av-motif\" class=\"note-in\" maxlength=\"160\" value=\"${esc(AVF.motif)}\" style=\"font-size:16px;padding:10px 12px\"></div>\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Annuler</button><button class=\"primary\" data-a=\"avsend\" ${avOk() ? '' : 'disabled'}>Envoyer la demande</button></div>`);\n}\n\n// ---- Caisse (gérant) ----\nconst sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v));\nasync function loadCaisse() { try { CAI = await call('caisse', {}); CAP.fond = null; CAP.seuil = null; } catch (e) { toast(errMsg(e), true); } render(); }\nfunction vCaisse() {\n  if (!CAI) return ldBox('Chargement de la caisse', 'caisse');\n  const C = CAI, over = C.solde > C.seuil, sug = r2(Math.max(0, C.solde - C.fond)), today = new Date().toLocaleDateString('sv-SE');\n  const lastTxt = C.open ? `Soirée en cours : ouverture ${fmt(C.open.fond)} + espèces ${fmt(C.open.esp)}${C.open.mv ? ' ' + sgn(C.open.mv) + ' de mouvements' : ''}.`\n    : C.lastTs ? `Dernier comptage : ${fmt(C.last)} (soirée du ${fmtD(C.lastTs - 6 * 3600000)})${C.since ? ' · ' + sgn(C.since) + ' de mouvements depuis' : ''}` : 'Pas encore de comptage : le tiroir part du fond de caisse.';\n  const P = pendDems().filter(d => d.type === 'Avance'), av = Object.entries(C.avances || {}), mName = new Date(C.month + '-15').toLocaleDateString('fr-FR', { month: 'long' });\n  const kinds = [['retrait', 'Je récupère'], ['ajout', 'J’ajoute'], ['sortie', 'Sortie']];\n  return `<div class=\"pad gut mgr\">\n  <div class=\"sechead\"><h1>Caisse</h1><span class=\"muted\">espèces du tiroir</span></div>\n  <div class=\"chero ${over ? 'warn' : ''}\"><h3>Dans le tiroir maintenant</h3><b class=\"big ${over ? 'latec' : ''}\">${fmt(C.solde)}</b><small>${lastTxt}</small>\n  ${over ? `<p class=\"latec\" style=\"margin:8px 0 0;font-weight:700\">Au-dessus de ${fmt(C.seuil)} : pense à récupérer l’espèce.</p>` : ''}</div>\n  ${C.kpi && C.kpi.n ? `<section style=\"margin-bottom:0\"><h2>Fiabilité de la caisse · ${C.kpi.n} dernière${C.kpi.n > 1 ? 's' : ''} soirée${C.kpi.n > 1 ? 's' : ''}</h2><div class=\"levers k3\">\n    <div class=\"lever ${Math.abs(C.kpi.cumul) < 5 ? 'ok' : C.kpi.cumul < 0 ? 'bad' : ''}\"><h3>Écart cumulé</h3><b>${sgn(C.kpi.cumul)}</b><small>${Math.abs(C.kpi.cumul) < 5 ? 'la caisse est juste sur la durée' : C.kpi.cumul < 0 ? 'il manque de l’argent sur la durée' : 'plus d’argent que prévu : ventes saisies en CB ou non saisies ?'}</small></div>\n    <div class=\"lever ${C.kpi.justes === C.kpi.n ? 'ok' : C.kpi.justes < C.kpi.n / 2 ? 'bad' : ''}\"><h3>Soirées justes</h3><b>${C.kpi.justes} / ${C.kpi.n}</b><small>écart de moins de 1 €</small></div>\n    <div class=\"lever\"><h3>Écart moyen</h3><b>${fmt(C.kpi.moy)}</b><small>par soirée, en plus ou en moins · plus gros : ${fmt(C.kpi.max)}</small></div>\n  </div><small style=\"display:block;margin:-10px 0 16px\">L’ouverture reprend le dernier comptage : une erreur de comptage un soir donne l’écart inverse le lendemain. L’écart cumulé dit ce qui manque (ou dépasse) vraiment.</small></section>` : ''}\n  ${P.length ? `<section><h2>Avances à valider · ${P.length}</h2>${P.map(demCard).join('')}</section>` : ''}\n  <section><h2>Mouvement de caisse</h2><div class=\"seg seg3\" style=\"margin-bottom:12px\">${kinds.map(([k, l]) => `<button class=\"${CAF.kind === k ? 'on' : ''}\" data-a=\"caikind\" data-k=\"${k}\">${l}</button>`).join('')}</div>\n  <form class=\"achform\" id=\"caiform\" autocomplete=\"off\">\n    <label>Montant (€)<input id=\"cai-amount\" inputmode=\"decimal\" placeholder=\"Ex. 50\" value=\"${esc(CAF.amount)}\"></label>\n    ${CAF.kind === 'retrait' && sug > 0 ? `<button type=\"button\" class=\"ghost small\" data-a=\"caisug\" data-v=\"${sug}\" style=\"justify-self:start\">Tout sauf le fond${C.fond ? ' de ' + fmt(C.fond) : ''} : ${fmt(sug)}</button>` : ''}\n    <label>Date<input id=\"cai-date\" type=\"date\" max=\"${today}\" value=\"${esc(CAF.date || today)}\"></label>\n    <label>${CAF.kind === 'sortie' ? 'Payé quoi ? (obligatoire)' : 'Motif (facultatif)'}<input id=\"cai-motif\" maxlength=\"160\" placeholder=\"${CAF.kind === 'sortie' ? 'Ex. glaçons et citrons' : ''}\" value=\"${esc(CAF.motif)}\"></label>\n    <button class=\"primary ${caiArm === 'save' ? 'armed' : ''}\" type=\"submit\">${caiArm === 'save' ? 'Confirmer' : CAF.kind === 'retrait' ? 'J’ai récupéré cet argent' : CAF.kind === 'ajout' ? 'J’ai ajouté cette monnaie' : 'Enregistrer la sortie'}</button>\n  </form><small>Retrait : l’argent que tu prends dans le tiroir. Ajout : la monnaie que tu y mets. Sortie : un achat payé avec la caisse. Pour un autre jour, mets la bonne date : l’écart de la soirée concernée se recalcule.</small></section>\n  ${av.length ? `<section><h2>Avances en ${mName}</h2><ul class=\"sales\">${av.map(([n, v]) => `<li><span></span><span>${esc(n)}<small>à déduire du salaire</small></span><strong>${fmt(v)}</strong></li>`).join('')}</ul></section>` : ''}\n  <section><h2>Comptages des soirées</h2>${C.soirees.length ? `<ul class=\"sales wd\">${C.soirees.map(x => { const mv = r2(x.att - x.fond - x.esp);\n    return `<li><span class=\"muted\">${fmtD(x.opened)}</span><span>${x.noCash ? 'Pas d’espèces : pas de comptage' : 'Compté ' + fmt(x.cpt) + ' · attendu ' + fmt(x.att)}<small>Ouverture ${fmt(x.fond)} + espèces ${fmt(x.esp)}${mv ? ' ' + sgn(mv) + ' de mouvements' : ''}${x.by ? ' · fermé par ' + esc(x.by) : ''}${x.twice ? ' · recompté' : ''}${x.tpe != null ? '<br>TPE ' + fmt(x.tpe) + ' · CB appli ' + fmt(x.cb) + (Math.abs(x.tpe - x.cb) >= 1 ? ' <span class=\"latec\">écart ' + sgn(r2(x.tpe - x.cb)) + '</span>' : ' ✓') : ''}</small></span><strong class=\"${x.noCash ? 'muted' : x.ec === 0 ? 'okc' : x.ec < 0 ? 'latec' : ''}\">${x.noCash ? '—' : (x.ec > 0 ? '+' : '') + fmt(x.ec)}</strong></li>`; }).join('')}</ul>\n  <small>Écart = compté − attendu. Attendu = ce qu’il y avait à l’ouverture + espèces encaissées ± mouvements.</small>` : '<p class=\"empty\">Aucune soirée fermée.</p>'}</section>\n  <section><h2>Mouvements</h2>${C.moves.length ? `<ul class=\"sales mvl\">${C.moves.map(m => `<li><span class=\"muted\">${new Date(m.ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}<br>${fmtH(m.ts)}</span><span>${esc(m.type)}${m.motif ? `<small>${esc(m.motif)}</small>` : ''}</span><strong class=\"${m.amt > 0 ? 'okc' : ''}\">${sgn(m.amt)}</strong><button class=\"minus ${caiArm === 'del:' + m.row ? 'armed' : ''}\" data-a=\"caidel\" data-row=\"${m.row}\" data-ts=\"${m.ts}\" aria-label=\"Supprimer ce mouvement\">${caiArm === 'del:' + m.row ? '✓' : '×'}</button></li>`).join('')}</ul>\n  <small>× puis ✓ pour supprimer une erreur : les écarts se recalculent.</small>` : '<p class=\"empty\">Aucun mouvement pour l’instant.</p>'}</section>\n  <section><h2>Réglages</h2><form class=\"achform\" id=\"caipform\" autocomplete=\"off\"><div class=\"row2\">\n    <label>Fond à laisser (€)<input id=\"cap-fond\" inputmode=\"decimal\" value=\"${esc(CAP.fond != null ? CAP.fond : String(C.fond).replace('.', ','))}\"></label>\n    <label>Alerte au-dessus de (€)<input id=\"cap-seuil\" inputmode=\"decimal\" value=\"${esc(CAP.seuil != null ? CAP.seuil : String(C.seuil).replace('.', ','))}\"></label></div>\n    <button class=\"ghost\" type=\"submit\">Enregistrer les réglages</button></form>\n  <small>Fond : la monnaie que tu laisses dans le tiroir quand tu récupères l’argent. Alerte : au-dessus, le compte rendu et cette page t’invitent à récupérer l’espèce.</small></section></div>`;\n}\n\n// ---- Récap : à faire, ce soir, caisse, offerts ----\nfunction alertsHTML(R, withVal) {\n  const u = unread(), over = !!(R && R.solde != null && R.solde > R.seuil), nv = withVal ? pendDems().length + ((R && R.promos && R.promos.pending) || []).length : 0;\n  return u || over || nv ? `<div class=\"alerts\">${nv ? `<button class=\"todoline\" data-a=\"toval\"><b>${nv} à valider</b><span>Voir →</span></button>` : ''}${u ? `<button class=\"todoline\" data-a=\"msgs\"><b>${u} message${u > 1 ? 's' : ''} non lu${u > 1 ? 's' : ''}</b><span>Lire →</span></button>` : ''}${over ? `<button class=\"todoline\" data-a=\"mtab\" data-m=\"caisse\"><b>${fmt(R.solde)} dans le tiroir</b><span>au-dessus de ${fmt(R.seuil)} : récupère l’espèce →</span></button>` : ''}</div>` : '';\n}\nfunction todoHTML(R) { return alertsHTML(R) + `<div class=\"duo\">${valHTML(R)}${coursesRecapHTML(R)}</div>`; }\n// Ce qui a été commandé : tables encaissées, plus les tables ouvertes pendant la soirée.\nfunction cmdHTML(R) {\n  // Servi pendant la soirée, en temps réel : tables encaissées + articles des tables ouvertes déjà servis ; ce qui est en préparation à part.\n  const served = {}, prep = {}, add = (o, n, q) => { if (q > 0) o[n] = (o[n] || 0) + q; };\n  R.best.forEach(l => add(served, l.n, l.q));\n  const live = R.cur && ST.soiree && ST.soiree.id === R.id;\n  if (live) {\n    const pend = {};\n    (ST.tickets || []).forEach(x => x.lines.forEach(l => { const key = x.t + '|' + l.k; pend[key] = (pend[key] || 0) + l.q; add(prep, l.n, l.q); }));\n    Object.keys(ST.tables).forEach(t => { const tb = ST.tables[t]; tb.lines.forEach(l => {\n      const nc = (tb.offs || []).filter(o => o.k === l.k && o.cons === false).length;\n      add(served, l.n, l.q - nc - (pend[t + '|' + l.k] || 0));\n    }); });\n  } else if (R.cur) (R.open && R.open.lines || []).forEach(l => add(served, l.n, l.q));\n  const L = Object.entries(served).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])), tot = L.reduce((a, x) => a + x[1], 0);\n  const P = Object.entries(prep).sort((a, b) => b[1] - a[1]), ptot = P.reduce((a, x) => a + x[1], 0);\n  return `<section><h2>${R.cur ? 'Servi ce soir' : 'Servi'}${tot ? ' · ' + tot + ' article' + (tot > 1 ? 's' : '') : ''}${live ? ' <span class=\"dchip\">en direct</span>' : ''}</h2>${L.length ? `<ul class=\"cmd\">${L.map(([n, q]) => `<li><b>${q}×</b><span>${esc(n)}</span></li>`).join('')}</ul>` : '<p class=\"empty\">Rien de servi pour l’instant.</p>'}\n  ${ptot ? `<p class=\"note\" style=\"margin:6px 0 0\">En préparation (${ptot}) : ${P.map(([n, q]) => q + '× ' + esc(n)).join(', ')}</p>` : ''}</section>`;\n}\n// À valider : avances, annulations, offerts, conso offertes et promotions de l'équipe.\nfunction valHTML(R) {\n  const P = pendDems(), promos = (R && R.promos && R.promos.pending) || [], n = P.length + promos.length;\n  return `<section class=\"todo ${n ? '' : 'calm'}\" id=\"aval\"><h2>À valider${n ? ' · ' + n : ''}</h2>${n ? P.map(demCard).join('') + (promos.length ? promoPendingHTML(R) : '') : '<p class=\"empty\">Rien à valider pour l’instant.</p>'}</section>`;\n}\n// Liste de courses : ce que l'équipe a noté depuis l'appli service.\nfunction coursesRecapHTML(R) {\n  const L = (R && R.courses) || [];\n  return `<section class=\"todo calm\"><h2>Liste de courses${L.length ? ' · ' + L.length : ''}</h2>${L.length ? `<ul class=\"sales\">${L.map(c => `<li class=\"crs\"><span class=\"muted\">${fmtD(c.ts)}</span><span>${esc(c.article)}${c.detail ? `<small>${esc(c.detail)}</small>` : ''}</span><button class=\"ghost small ${courseArm === c.row ? 'armed' : ''}\" data-a=\"rcdone\" data-row=\"${c.row}\" data-ts=\"${c.ts}\">${courseArm === c.row ? 'Confirmer' : 'Acheté'}</button></li>`).join('')}</ul>` : '<p class=\"empty\">Rien à acheter. L’équipe ajoute ce qui manque depuis l’appli service (Courses).</p>'}</section>`;\n}\n// KPI « Soirée en cours » : déjà encaissé + addition des tables ouvertes.\nfunction liveTile(R, ca) {\n  const tot = r2(ca + R.open.total), soir = R.obj && R.obj.soir, pc = soir ? Math.round(tot / soir * 100) : 0;\n  return `<div class=\"lever live\"><h3>Soirée en cours</h3><b>${fmt(tot)}</b><small>encaissé ${fmt(ca)} · en cours ${fmt(R.open.total)}${R.open.n ? ' (' + R.open.n + ' table' + (R.open.n > 1 ? 's' : '') + ')' : ''}</small>${soir ? `<small>${pc} % de l’objectif du soir</small><div class=\"lb\"><span style=\"width:${Math.min(100, pc)}%\"></span></div>` : ''}</div>`;\n}\nfunction tonightHTML(R) {\n  const T = R.today, bd = ts => new Date(ts - 6 * 3600000).toDateString();\n  if (R.cur || !T || !(T.min || T.soir) || (R.soiree && bd(R.soiree.opened) === bd(Date.now()))) return '';\n  return `<div class=\"tonight\"><span><b>Ce soir</b> · ${DAYS[T.dow]}</span><span>minimum ${fmt(T.min)} · objectif ${fmt(T.soir)}${T.top ? ' · top ' + fmt(T.top) : ''}</span></div>`;\n}\nfunction caisseRecapHTML(R, so, cb, esp) {\n  const fond = r2(so.fond || 0), mv = r2(so.mv || 0), att = so.closed ? so.expected : r2(fond + esp + mv), gap = so.closed && !so.noCash ? so.ecart : null;\n  const gapTxt = gap == null ? '—' : (gap > 0 ? '+' : '') + fmt(gap), gapCls = gap == null ? '' : gap === 0 ? 'okc' : gap < 0 ? 'latec' : '';\n  return `<section><h2>Caisse</h2><div class=\"stats\">\n    <div class=\"stat\"><h3>Attendu</h3><b>${fmt(att)}</b><small>Ouverture ${fmt(fond)} + espèces ${fmt(esp)}${mv ? ' ' + sgn(mv) : ''}</small></div>\n    <div class=\"stat\"><h3>Compté</h3><b>${so.closed && !so.noCash ? fmt(so.counted) : '—'}</b><small>${so.closed && so.noCash ? 'Pas d’espèces ce soir' : 'À la fermeture'}</small></div>\n    <div class=\"stat\"><h3>Écart</h3><b class=\"${gapCls}\">${gapTxt}</b><small>${gap == null ? (so.closed ? 'Pas de comptage' : 'Après comptage') : gap === 0 ? 'Caisse juste' : gap < 0 ? 'Manque en caisse' : 'Excédent'}</small></div>\n  </div>${so.closed && so.tpe != null ? `<p class=\"note ${Math.abs(so.tpe - cb) >= 1 ? 'latec' : ''}\" style=\"margin:-8px 0 10px${Math.abs(so.tpe - cb) >= 1 ? ';border-color:var(--warn)' : ''}\">TPE ${fmt(so.tpe)} · CB saisie dans l’appli ${fmt(cb)} : ${Math.abs(so.tpe - cb) < 1 ? 'identique ✓' : 'écart de ' + sgn(r2(so.tpe - cb)) + '. Un paiement a peut-être été saisi dans le mauvais mode (CB au lieu d’espèces, ou l’inverse).'}</p>` : ''}\n  ${so.closed && /1er comptage/.test(so.detail || '') ? `<p class=\"note\" style=\"margin:-4px 0 10px\">Caisse recomptée : ${esc((so.detail.match(/1er comptage[^·]*/) || [''])[0])}, puis ${fmt(so.counted)} gardé.</p>` : ''}\n  <small>CB ${fmt(cb)} · espèces ${fmt(esp)}. Le tiroir n’est pas vidé chaque soir : l’ouverture reprend le dernier comptage, moins ce que tu as récupéré. <button class=\"link\" data-a=\"mtab\" data-m=\"caisse\" style=\"text-decoration:underline;font-weight:600\">Ouvrir la caisse</button></small></section>`;\n}\nfunction offertsHTML(R) {\n  const consoSt = {}; (R.dems || []).forEach(d => { if (d.type === 'Conso offerte') consoSt[d.ts] = d.status; });\n  const rows = [].concat(\n    (R.dems || []).filter(d => d.type !== 'Conso offerte').map(d => ({ ts: d.ts, l: `${esc(d.type)} · ${esc(d.detail)}`, s: [d.motif, d.pour].filter(Boolean).map(esc).join(' : ') + ' · par ' + esc(d.by) + ' ' + dchip(d.status) + (d.status === 'Refusée' ? (d.pay === 'Après encaissement' ? ' table déjà encaissée : non récupéré' : ' remis sur l’addition') : ''), a: d.amount, x: (d.status === 'Refusée' && d.pay !== 'Après encaissement') || d.status === 'Retirée' })),\n    ((R.promos && R.promos.soir) || []).map(x => ({ ts: x.ts, l: `Promotion −${x.pct} % · table ${esc(x.t)}`, s: esc(x.motif) + ' : ' + esc(x.pour) + (x.by ? ' · par ' + esc(x.by) : '') + ' ' + (x.ack ? '<span class=\"dchip ok\">prise en compte</span>' : dchip('En attente')), a: x.a })),\n    R.gifts.map(g => ({ ts: 0, l: 'Fidélité · ' + esc(g.n), s: g.palier + ' tampons', a: g.a })),\n    R.patron.map(x => ({ ts: x.ts, l: `Conso patron · ${x.q}× ${esc(x.n)}`, s: esc(x.pour) + (x.c ? ' : ' + esc(x.c) : '') + (x.by ? ' · saisi par ' + esc(x.by) : '') + (consoSt[x.ts] ? ' ' + dchip(consoSt[x.ts]) : ''), a: x.v })),\n    R.cancels.map(c => ({ ts: c.ts, l: `Annulé directement · ${c.q}× ${esc(c.n)}`, s: 'table ' + esc(c.t) + ' · ' + esc(c.r) + (c.by ? ' · par ' + esc(c.by) : ''), a: c.a }))\n  );\n  if (!rows.length) return `<section><h2>Offerts et annulations</h2><p class=\"empty\">Rien d’offert ni d’annulé.</p></section>`;\n  const totV = r2(rows.reduce((t, x) => t + (x.x ? 0 : x.a), 0));\n  return `<section><h2>Offerts et annulations · ${fmt(totV)}</h2><ul class=\"sales\">${rows.sort((a, b) => b.ts - a.ts).map(x => `<li><span class=\"muted\">${x.ts ? fmtH(x.ts) : ''}</span><span>${x.l}<small>${x.s}</small></span><strong class=\"${x.x ? 'muted' : ''}\" style=\"${x.x ? 'text-decoration:line-through' : ''}\">${fmt(x.a)}</strong></li>`).join('')}</ul>\n  <small>Ne passent pas en caisse. Offerts, conso et articles ratés sortent du stock ; erreurs de commande et articles pas préparés, non.</small></section>`;\n}\n\n// ---- Vue gérant ----\n// Navigation entre soirées (‹ plus ancienne · plus récente ›), en haut du récap.\nfunction recList(R) { return (ST.soiree ? [{ id: ST.soiree.id, opened: ST.soiree.opened, cur: true }] : []).concat((R.history || []).filter(h => !(ST.soiree && h.id === ST.soiree.id))); }\nfunction recNav(R, so) {\n  const L = recList(R), i = L.findIndex(h => h.id === R.id), older = i >= 0 ? L[i + 1] : null, newer = i > 0 ? L[i - 1] : null;\n  const lbl = R.cur ? 'Soirée en cours' : fmtD(so.opened);\n  return `<div class=\"rnav\">${R._old ? '<span class=\"dchip wait\">mise à jour…</span>' : ''}<button class=\"rarr\" data-a=\"hist\" data-id=\"${older ? esc(older.id) : ''}\" ${older ? '' : 'disabled'} aria-label=\"Soirée précédente\">‹</button><span class=\"rlbl${RECWANT ? ' wait' : ''}\">${RECWANT ? 'Chargement… ' + ldIn('soiree') : lbl}</span><button class=\"rarr\" data-a=\"hist\" data-id=\"${newer ? esc(newer.id) : ''}\" ${newer ? '' : 'disabled'} aria-label=\"Soirée suivante\">›</button></div>`;\n}\nfunction vManager() {\n  if (!REC) return ldBox('Chargement du récap', 'recap');\n  const R = REC, so = R.soiree;\n  if (!so) return `<div class=\"pad gut mgr\"><h1>Récap</h1>${todoHTML(R)}<p class=\"empty\">Aucune soirée pour l’instant. Le récap apparaît dès la première prise de service.</p>${qrBlock()}</div>`;\n  const ca = r2(R.pays.reduce((a, p) => a + p.a, 0)), cb = r2(R.pays.filter(p => p.m === 'CB').reduce((a, p) => a + p.a, 0)), esp = r2(ca - cb);\n  const nb = R.ventes.filter(v => v.enc > 0).length;\n  const withP = R.ventes.filter(v => v.pers > 0), persN = withP.reduce((a, v) => a + v.pers, 0), persCa = r2(withP.reduce((a, v) => a + v.enc, 0));\n  const end = so.closed || Date.now(), h0 = new Date(so.opened); h0.setMinutes(0, 0, 0);\n  const buckets = []; for (let t = +h0; t <= end && buckets.length < 14; t += 3600000) buckets.push({ t, v: 0 });\n  R.pays.forEach(p => { const b = buckets.find(b => p.ts >= b.t && p.ts < b.t + 3600000); if (b) b.v += p.a; });\n  const hmax = Math.max(1, ...buckets.map(b => b.v));\n  const sub = [nb + ' table' + (nb > 1 ? 's' : '') + (persN ? ' · ' + persN + ' pers.' : ''), nb ? 'panier ' + fmt(ca / nb) + (persN ? ' (' + fmt(persCa / persN) + ' / pers.)' : '') : '',\n    R.mat ? 'marge sur matières ≈ ' + fmt(ca - R.mat.tot) : ''].filter(Boolean).join(' · ');\n  const pend = R.cur ? R.open.total : 0, hasLev = !!(R.obj && (R.obj.pan || R.obj.ppers || R.obj.tetes || R.obj.dess));\n  const hsub = (R.cur ? 'encaissé ' + fmt(ca) + ' + en cours ' + fmt(pend) + (R.open.n ? ' (' + R.open.n + ' table' + (R.open.n > 1 ? 's' : '') + ' ouverte' + (R.open.n > 1 ? 's' : '') + ')' : '') + ' · ' : '') + sub;\n  // Argent de la soirée en chiffres : CB, espèces (déjà encaissés) et en cours.\n  const money = `<div class=\"hmoney\"><span>CB<b>${fmt(cb)}</b></span><span>Espèces<b>${fmt(esp)}</b></span>${R.cur ? `<span>En cours<b>${fmt(pend)}</b></span>` : ''}</div>`;\n  const hero = R.obj && (R.obj.soir || R.obj.min) ? tiers((R.cur ? 'Soirée en cours · ' : 'Encaissé · ') + DAYS[R.obj.dow], ca, { min: R.obj.min, obj: R.obj.soir, top: R.obj.top }, hsub, pend, money)\n    : `<div class=\"tiers night\"><div class=\"thead\"><h3>${R.cur ? 'Soirée en cours' : 'Encaissé'}</h3><b>${fmt(r2(ca + pend))}</b></div>${money}<small>${hsub}</small><small>Fixe tes objectifs dans l’onglet Objectifs pour voir les paliers.</small></div>`;\n  return `<div class=\"pad gut mgr\"><div class=\"sechead\"><h1>Récap</h1>${recNav(R, so)}</div>\n  ${R.cur && Date.now() - so.opened > 14 * 3600000 ? `<p class=\"note latec\">Soirée ouverte depuis plus de 14 h : elle n’a sans doute pas été fermée. Les ventes s’ajoutent toujours au ${fmtD(so.opened)}.</p>` : ''}\n  ${hero}\n  ${alertsHTML(R, true)}\n  ${cmdHTML(R)}\n  ${nb ? `<section style=\"margin-bottom:0\"><h2>Indicateurs ${R.cur ? 'de la soirée' : 'du ' + fmtD(so.opened)}</h2>${kpiHTML(R.kpi || levOf(R), R.obj && R.obj.lev30, R.obj, R.mat && ca > 0 ? { marge: (ca - R.mat.tot) / ca * 100, matV: R.mat.tot } : null)}\n  <small style=\"display:block;margin:-10px 0 16px\">${R.cur ? 'Sur les tables encaissées. ' : ''}« Habituel » = moyenne des 30 derniers jours. Vert : objectif atteint ou mieux que d’habitude. Rouge : moins bien que d’habitude.</small></section>` : ''}\n  <div class=\"duo\">${valHTML(R)}${coursesRecapHTML(R)}</div>\n  ${tonightHTML(R)}\n  ${so.comment ? `<p class=\"quote\">${esc(so.comment)}${so.closer ? `<small>${esc(so.closer)}, à la fermeture</small>` : ''}</p>` : ''}\n  ${matchBar(so.match, R.id)}\n  ${caisseRecapHTML(R, so, cb, esp)}\n  ${offertsHTML(R)}\n  ${teamHTML(R, so)}\n  ${so.menage ? `<p class=\"note\" style=\"margin-top:-10px\">Ménage : ${esc(so.menage.charAt(0).toLowerCase() + so.menage.slice(1))}${so.inv ? ' · inventaire du lundi : ' + esc(so.inv.charAt(0).toLowerCase() + so.inv.slice(1)) : ''}</p>` : ''}\n  ${so.closed ? `<button class=\"ghost\" data-a=\"mailcr\" data-id=\"${esc(R.id)}\" style=\"width:100%;margin:0 0 22px\">Renvoyer le compte rendu par mail</button>` : ''}\n  <section><h2>Tables soldées</h2>\n  ${R.ventes.length ? `<ul class=\"sales\">${R.ventes.slice().sort((a, b) => b.ts - a.ts).map(v => `<li><span class=\"muted\">${fmtH(v.ts)}</span><span>Table ${esc(v.t)}<span class=\"method\">${esc(v.modes)}</span><small>${v.lines.map(l => l.q + '× ' + esc(l.n)).join(', ')}${v.gifts.length ? ' · offert : ' + v.gifts.map(esc).join(', ') : ''}${v.pays.length > 1 ? '<br>Partagé : ' + v.pays.map(p => fmtH(p.ts) + ' ' + esc(p.m) + ' ' + fmt(p.a)).join(' · ') : ''}${v.pays.length && v.pays[0].by ? ' · par ' + esc(v.pays[0].by) : ''}</small></span><strong>${fmt(v.enc)}</strong></li>`).join('')}</ul>` : '<p class=\"empty\">Aucune table soldée.</p>'}</section>\n  <section><h2>Encaissé par heure</h2>\n  <div class=\"hours\">${buckets.map(b => `<div><span class=\"v\">${b.v ? fmt(b.v) : ''}</span><span class=\"col\" style=\"height:${b.v ? Math.max(4, Math.round(b.v / hmax * 80)) : 0}%\"></span></div>`).join('')}</div>\n  <div class=\"hlabels\">${buckets.map(b => `<span>${new Date(b.t).getHours()}h</span>`).join('')}</div></section>\n  <section><h2>Soirées</h2>\n  ${R.history.length || R.cur ? `<ul class=\"sales hist\">${recList(R).map(h => `<li class=\"${h.id === R.id ? 'sel' : ''}${h.id === RECWANT ? ' wait' : ''}\"><button class=\"hrow\" data-a=\"hist\" data-id=\"${esc(h.id)}\"><span class=\"muted\">${fmtD(h.opened)}</span><span>${fmtH(h.opened)} → ${h.cur ? 'en cours' : fmtH(h.closed)}<small>${h.id === RECWANT ? 'Chargement… ' + ldIn('soiree') : h.cur ? 'Soirée en cours' : h.nb + ' tables · écart ' + (h.ecart > 0 ? '+' : '') + fmt(h.ecart)}${h.match ? '<span class=\"mtag\">Match</span>' : ''}</small></span><strong>${h.cur ? '' : fmt(h.ca)}</strong></button></li>`).join('')}</ul>` : '<p class=\"empty\">Aucune soirée fermée.</p>'}</section>\n  <section><button class=\"ghost danger ${delSoArm ? 'armed' : ''}\" data-a=\"delsoiree\" data-id=\"${esc(R.id)}\" style=\"width:100%\">${delSoArm ? 'Confirmer : tout effacer pour cette soirée' : 'Supprimer cette soirée (test ou erreur)'}</button>\n  <small>Efface ventes, paiements, annulations, conso patron et pointages de cette soirée dans le Google Sheets. Irréversible.</small></section>\n  ${qrBlock()}</div>`;\n}\n// Promotions pas encore prises en compte par le gérant (toutes soirées).\nfunction promoPendingHTML(R) {\n  const P = (R.promos && R.promos.pending) || [];\n  if (!P.length) return '';\n  const tot = r2(P.reduce((a, x) => a + x.a, 0));\n  return `<section class=\"promobox\"><h2>Promotions à prendre en compte · ${P.length}</h2><small>${fmt(tot)} au total. Tant qu’elles ne sont pas notées « prises en compte », le compte rendu de la soirée suivante te le rappelle.</small>\n  <ul class=\"sales\">${P.map(x => `<li><span class=\"muted\">${new Date(x.ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}<br>${fmtH(x.ts)}</span><span>−${x.pct} % · table ${esc(x.t)}<small>${esc(x.motif)} : ${esc(x.pour)}${x.by ? ' · par ' + esc(x.by) : ''} · addition ${fmt(x.avant)}</small></span><strong>−${fmt(x.a)}<button class=\"ghost\" data-a=\"pack\" data-row=\"${x.row}\" data-ts=\"${x.ts}\" style=\"display:block;font-size:12px;padding:6px 10px;margin-top:6px;min-height:0\">Pris en compte</button></strong></li>`).join('')}</ul>\n  ${P.length > 1 ? `<button class=\"ghost ${promoArm === 'all' ? 'armed' : ''}\" data-a=\"packall\" style=\"width:100%\">${promoArm === 'all' ? 'Confirmer : tout prendre en compte' : 'Tout prendre en compte'}</button>` : ''}</section>`;\n}\n// Équipe de la soirée : arrivée, départ, durée, retard (pointages par personne).\nfunction teamHTML(R, so) {\n  const P = {};\n  (R.pointages || []).filter(x => x.nom && !/^Gérant/.test(x.nom)).forEach(x => {\n    const p = P[x.nom] || (P[x.nom] = { in: null, out: null, late: 0, st: '', dist: null });\n    if (x.type === 'Arrivée') { if (!p.in) Object.assign(p, { in: x.ts, late: x.late || 0, st: x.statut, dist: x.dist }); p.out = null; }\n    else p.out = x.ts;\n  });\n  const names = Object.keys(P);\n  if (!names.length) return '';\n  const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)); return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); };\n  return `<section><h2>Équipe</h2><ul class=\"sales\">${names.map(n => { const p = P[n], end = p.out || (R.cur ? Date.now() : so.closed);\n    return `<li><span class=\"muted\">${fmtH(p.in)}</span><span>${esc(n)}<small>${p.out ? 'parti à ' + fmtH(p.out) : R.cur ? 'en service' : 'jusqu’à ' + fmtH(so.closed)} · ${p.late > 0 ? '<span class=\"latec\">' + p.late + ' min de retard</span>' : 'à l’heure'} · ${esc(p.st)}${p.dist != null ? ' (' + p.dist + ' m)' : ''}</small></span><strong>${end ? dur(end - p.in) : ''}</strong></li>`; }).join('')}</ul></section>`;\n}\nfunction qrBlock() {\n  return `<section><h2>Prise de service</h2><small>La soirée ne peut s’ouvrir qu’à moins de ${(REC && REC.rayon) || 150} m du lounge. La position et le rayon se règlent dans l’onglet Paramètres.</small>\n  ${REC && REC.live ? '' : `<button class=\"ghost ${recArm ? 'armed' : ''}\" data-a=\"openremote\" style=\"width:100%;margin-top:10px\">${recArm ? 'Confirmer l’ouverture sans contrôle de position' : 'Ouvrir la soirée à distance (secours)'}</button>`}</section>`;\n}\n// ---- Jauges d'objectifs (gérant) ----\n// pace = part de l'objectif qu'il faudrait avoir atteinte aujourd'hui (repère sur la jauge).\nfunction gauge(label, val, target, opt = {}) {\n  if (!(target > 0)) return `<div class=\"gauge empty\"><h3>${label}</h3><svg viewBox=\"0 0 120 68\" aria-hidden=\"true\"><path d=\"M10 60 A50 50 0 0 1 110 60\" class=\"gbg\"/></svg><b>${fmt(val)}</b><small>Objectif à définir</small></div>`;\n  const ratio = val / target, f = Math.max(0, Math.min(1, ratio)), pct = Math.round(ratio * 100);\n  const pt = (x, r) => [60 - r * Math.cos(Math.PI * x), 60 - r * Math.sin(Math.PI * x)].map(v => v.toFixed(1));\n  const pace = opt.pace, behind = pace != null && ratio < pace;\n  const cls = ratio >= 1 ? 'ok' : pace == null ? '' : !behind ? 'ok' : ratio < pace * 0.9 ? 'bad' : '';\n  const st = ratio >= 1 ? 'Objectif atteint' : pace == null ? '' : behind ? 'En retard sur le rythme' : 'En avance sur le rythme';\n  const [x, y] = pt(f, 50), tick = pace == null ? '' : (() => { const a = pt(Math.min(1, pace), 41), c = pt(Math.min(1, pace), 59); return `<line x1=\"${a[0]}\" y1=\"${a[1]}\" x2=\"${c[0]}\" y2=\"${c[1]}\" class=\"gtick\"/>`; })();\n  return `<div class=\"gauge ${cls}\"><h3>${label}</h3><svg viewBox=\"0 0 120 68\" role=\"img\" aria-label=\"${label} : ${pct} % de l’objectif\"><path d=\"M10 60 A50 50 0 0 1 110 60\" class=\"gbg\"/>${f > 0.004 ? `<path d=\"M10 60 A50 50 0 0 1 ${x} ${y}\" class=\"gfill\"/>` : ''}${tick}<text x=\"60\" y=\"57\" text-anchor=\"middle\" class=\"gpct\">${pct} %</text></svg>\n  <b class=\"${val < 0 ? 'latec' : ''}\">${fmt(val)}</b><small>sur ${fmt(target)}</small>${st ? `<small class=\"gst\">${st}</small>` : ''}${opt.sub ? `<small>${opt.sub}</small>` : ''}</div>`;\n}\nconst DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];\n// Barre à paliers : minimum (point mort), objectif, top.\nfunction tiers(label, enc, P, sub, pend, extra) {\n  pend = pend > 0 ? pend : 0;\n  const val = r2((enc || 0) + pend), max = Math.max(P.top || 0, P.obj || 0, val, 1) * 1.04, pos = v => Math.max(0, Math.min(100, v / max * 100));\n  const st = P.top && val >= P.top ? ['Top atteint', 'ok'] : P.obj && val >= P.obj ? ['Objectif atteint', 'ok'] : P.min && val >= P.min ? ['Minimum atteint : il reste ' + fmt(P.obj - val) + ' pour l’objectif', ''] : P.min ? ['Sous le minimum : il manque ' + fmt(P.min - val), 'bad'] : P.obj ? ['Il reste ' + fmt(P.obj - val) + ' pour l’objectif', ''] : ['', ''];\n  return `<div class=\"tiers ${st[1]}${extra ? ' night' : ''}\"><div class=\"thead\"><h3>${label}</h3><b>${fmt(val)}</b></div>${extra || ''}\n  <div class=\"tbar\"><span class=\"tfill\" style=\"width:${pos(enc)}%\"></span>${pend ? `<span class=\"tfill pend\" style=\"left:${pos(enc)}%;width:${r2(pos(val) - pos(enc))}%\"></span>` : ''}${P.min ? `<i class=\"tmark min\" style=\"left:${pos(P.min)}%\"></i>` : ''}${P.obj ? `<i class=\"tmark obj\" style=\"left:${pos(P.obj)}%\"></i>` : ''}${P.top ? `<i class=\"tmark top\" style=\"left:${pos(P.top)}%\"></i>` : ''}</div>\n  <div class=\"tleg\">${pend ? `<span><i style=\"background:var(--gold)\"></i>Encaissé ${fmt(enc)}</span><span><i class=\"pendi\"></i>En cours ${fmt(pend)}</span>` : ''}${P.min ? `<span><i style=\"background:var(--warn)\"></i>Minimum ${fmt(P.min)}</span>` : ''}${P.obj ? `<span><i style=\"background:var(--fg)\"></i>Objectif ${fmt(P.obj)}</span>` : ''}${P.top ? `<span><i style=\"background:var(--ok)\"></i>Top ${fmt(P.top)}</span>` : ''}</div>\n  ${st[0] ? `<small class=\"gst\">${st[0]}</small>` : ''}${sub ? `<small>${sub}</small>` : ''}</div>`;\n}\n// Leviers d'une soirée calculés à partir des tables encaissées.\nfunction levOf(R) {\n  const withP = R.ventes.filter(v => v.pers > 0), pers = withP.reduce((a, v) => a + v.pers, 0), caP = withP.reduce((a, v) => a + v.enc, 0);\n  let chichas = 0, tetes = 0, dess = 0;\n  R.best.forEach(l => { const a = D.carte.find(x => x.n === l.n); if (!a) return; if (a.cat === 'Chichas') { if (/^t[êe]te/i.test(a.n)) tetes += l.q; else chichas += l.q; } if (a.cat === 'Desserts' || a.o.includes('dessert')) dess += l.q; });\n  const tables = R.ventes.filter(v => v.enc > 0).length;\n  return { ppers: pers ? r2(caP / pers) : 0, tetes: chichas ? Math.round(tetes / chichas * 100) / 10 : 0, dess: tables ? Math.round(dess / tables * 100) / 10 : 0, pan: tables ? r2(R.pays.reduce((a, p) => a + p.a, 0) / tables) : 0, chichas, tables };\n}\n// Leviers : panier par table et par personne, têtes en plus, desserts ; « habituel » = moyenne des 30 derniers jours.\nfunction leversHTML(v, o, hab, when, extra) {\n  const L = [['pan', 'Panier par table', fmt, o.pan], ['ppers', 'Panier par personne', fmt, o.ppers], ['tetes', 'Têtes en plus / 10 chichas', x => String(x).replace('.', ','), o.tetes], ['dess', 'Desserts / 10 tables', x => String(x).replace('.', ','), o.dess]];\n  if (!L.some(l => l[3]) && !extra) return `<p class=\"note\">Fixe les objectifs des leviers (panier, têtes, desserts) dans l’onglet Objectifs.</p>`;\n  const tiles = L.filter(l => l[3]).map(([k, label, f, target]) => {\n    const val = v[k] || 0, h = hab ? hab[k] : 0, cls = val >= target ? 'ok' : h && val < h ? 'bad' : '';\n    return `<div class=\"lever ${cls}\"><h3>${label}</h3><b>${f(val)}</b><small>Objectif ${f(target)}${h ? ' · habituel ' + f(h) : ''}</small><div class=\"lb\"><span style=\"width:${Math.min(100, Math.round(val / target * 100))}%\"></span></div></div>`;\n  });\n  if (extra) tiles.splice(o.pan ? 1 : 0, 0, extra);\n  return `<div class=\"levers\">${tiles.join('')}</div>${when && L.some(l => l[3]) ? `<small style=\"display:block;margin:-10px 0 16px\">Leviers ${when}, sur les tables encaissées. En rouge : moins bien que d’habitude.</small>` : ''}`;\n}\n// Indicateurs : valeur, objectif s'il y en a un, et comparaison à l'habituel (30 derniers jours).\n// Vert : objectif atteint (ou mieux que d'habitude sans objectif). Rouge : moins bien que d'habitude.\nconst dec1 = x => String(Math.round(x * 10) / 10).replace('.', ',');\nfunction ktile(label, txt, o) {\n  o = o || {};\n  const f = o.f || dec1, val = o.val, hab = o.hab, obj = o.obj, inv = !!o.inv;\n  let cls = '', d = '';\n  if (obj) cls = (inv ? val <= obj : val >= obj) ? 'ok' : '';\n  if (hab) {\n    const diff = val - hab, same = Math.abs(diff) < Math.abs(hab) * 0.05, better = inv ? diff < 0 : diff > 0;\n    if (!same && !better && cls !== 'ok') cls = 'bad';\n    if (!same && better && !obj) cls = 'ok';\n    d = `<small>${same ? 'comme d’habitude (' + f(hab) + ')' : `<span class=\"kd ${better ? 'up' : 'dn'}\">${diff > 0 ? '▲' : '▼'}</span> habituel ${f(hab)}`}</small>`;\n  }\n  return `<div class=\"lever ${cls}\"><h3>${label}</h3><b>${txt}</b>${o.subFirst && o.sub ? `<small>${o.sub}</small>` : ''}${obj ? `<small>Objectif ${f(obj)}</small>` : ''}${d}${!o.subFirst && o.sub ? `<small>${o.sub}</small>` : ''}${obj && !inv ? `<div class=\"lb\"><span style=\"width:${Math.max(0, Math.min(100, Math.round(val / obj * 100)))}%\"></span></div>` : ''}</div>`;\n}\n// K : la soirée (ou le mois) ; H : l'habituel ; o : les objectifs ; x : { month, marge, matV }.\nfunction kpiHTML(K, H, o, x) {\n  if (!K) return '';\n  o = o || {}; x = x || {};\n  const h = H && H.soirees >= 3 ? H : {}, has = v => v != null, T = [];\n  if (has(K.pers)) T.push(x.month\n    ? ktile('Clients par soirée', dec1(K.persSoir), { val: K.persSoir, hab: h.persSoir, sub: K.pers + ' clients en ' + K.soirees + ' soirée' + (K.soirees > 1 ? 's' : '') })\n    : ktile('Clients', String(K.pers || 0), { val: K.pers, hab: h.persSoir, sub: K.tables + ' table' + (K.tables > 1 ? 's' : '') + (K.duree ? ' · ' + K.duree + ' min par table' : '') }));\n  if (x.month && has(K.caSoir)) T.push(ktile('CA par soirée', fmt(K.caSoir), { val: K.caSoir, hab: h.caSoir, f: fmt }));\n  T.push(ktile('Panier par personne', fmt(K.ppers), { val: K.ppers, hab: h.ppers, obj: o.ppers, f: fmt }));\n  T.push(ktile('Panier par table', fmt(K.pan), { val: K.pan, hab: h.pan, obj: o.pan, f: fmt }));\n  T.push(ktile('Têtes en plus / 10 chichas', dec1(K.tetes), { val: K.tetes, hab: h.tetes, obj: o.tetes, sub: (K.chichas || 0) + ' chicha' + (K.chichas > 1 ? 's' : '') }));\n  if (has(K.hors)) T.push(ktile('En plus des chichas', K.hors + ' %', { val: K.hors, hab: h.hors, f: v => Math.round(v) + ' %', sub: fmt(K.horsV) + ' de plats, desserts et boissons en plus' }));\n  if (o.dess) T.push(ktile('Desserts / 10 tables', dec1(K.dess), { val: K.dess, hab: h.dess, obj: o.dess }));\n  if (has(K.fuites)) T.push(ktile('Offerts et annulations', fmt(K.fuites), { val: K.fuitesPct, hab: h.fuitesPct, inv: true, f: v => dec1(v) + ' %', sub: dec1(K.fuitesPct) + ' % du CA', subFirst: true }));\n  if (has(K.caH) && K.heures) T.push(ktile('CA par heure d’équipe', fmt(K.caH), { val: K.caH, hab: h.caH, f: fmt, sub: dec1(K.heures) + ' h de service' }));\n  if (has(x.marge)) T.push(ktile('Marge sur matières', Math.round(x.marge) + ' %', { val: x.marge, sub: 'matières ≈ ' + fmt(x.matV) }));\n  return `<div class=\"levers k4\">${T.join('')}</div>`;\n}\nconst objForm = O => { const o = O.obj, v = x => x ? String(x).replace('.', ',') : ''; return { mois: v(o.mois), ben: v(o.ben), sal: v(o.sal), charges: v(o.charges), pan: v(o.pan), ppers: v(o.ppers), tetes: v(o.tetes), dess: v(o.dess) }; };\nasync function loadObj() {\n  try { OBJ = await call('objectifs', {}); OFORM = objForm(OBJ); } catch (e) { toast(errMsg(e), true); }\n  render();\n}\nfunction vObj() {\n  if (!OBJ) return ldBox('Chargement des objectifs', 'obj');\n  const O = OBJ, o = O.obj, c = O.cur, p = O.prev, pace = O.day / O.days, M = O.month;\n  const mName = m => new Date(m.m + '-15').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });\n  const proj = v => O.day ? v / O.day * O.days : 0;\n  const fixes = r2((o.sal || 0) + (o.charges || 0)), varM = r2((c.mat ? c.mat.tot : 0) + (c.autres || 0)), coutsM = r2(fixes + varM);\n  const benDate = r2(c.ca - varM - fixes * pace), benProj = r2(proj(c.ca) - proj(varM) - fixes);\n  const f = OFORM, inp = (k, label, ph) => `<label>${label}<input id=\"o-${k}\" inputmode=\"decimal\" placeholder=\"${ph || 'Non défini'}\" value=\"${esc(f[k])}\"></label>`;\n  const T = O.week.find(d => d.today) || O.today, dshort = s2 => new Date(s2 + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric' });\n  const res = d => !(d.past || (d.today && d.n && !d.live)) || (!d.n && !d.ca) ? '' : d.obj && d.ca >= d.obj ? 'ok' : d.min && d.ca < d.min ? 'bad' : '';\n  const real = d => d.today ? (d.live ? fmt(d.ca) + '<small>en cours</small>' : d.n ? fmt(d.ca) : '<span class=\"muted\">—</span>') : d.past ? (d.n || d.ca ? fmt(d.ca) : '<span class=\"muted\">fermé</span>') : '';\n  const aheadV = M.obj ? r2(c.ca - M.toDateObj) : null, left = M.min ? Math.max(0, r2(M.min - c.ca)) : O.reste ? O.reste.need : 0;\n  return `<div class=\"pad gut mgr\">\n  <div class=\"sechead\"><h1>Objectifs</h1><span class=\"muted\">${mName(c)} · jour ${O.day}/${O.days}</span></div>\n  ${M.min && M.obj && M.min > M.obj ? `<p class=\"note latec\" style=\"border-color:var(--warn)\">Ton objectif du mois (${fmt(M.obj)}) est en dessous de ton point mort (${fmt(M.min)}) : à ce niveau, le mois ne couvre pas les charges.</p>` : ''}\n  ${o.mois || fixes ? `<section class=\"mhero\">\n    <div class=\"mrow\"><div><h3>Bénéfice à ce jour</h3><b class=\"big ${benDate < 0 ? 'latec' : 'okc'}\">${fmt(benDate)}</b><small>salaires et charges au prorata du mois</small></div>\n    <div><h3>Bénéfice projeté</h3><b class=\"big ${benProj < 0 ? 'latec' : o.ben && benProj >= o.ben ? 'okc' : ''}\">${fmt(benProj)}</b><small>fin de mois, au rythme actuel${o.ben ? ' · objectif ' + fmt(o.ben) : ''}</small></div></div>\n    ${O.reste ? `<p class=\"mkey\">${left > 0 ? `Pour finir ${mName(c)} à 0 € : encore <b>${fmt(left)}</b> de CA en ${O.reste.days} jour${O.reste.days > 1 ? 's' : ''} (aujourd’hui compris), soit <b>${fmt(left / Math.max(1, O.reste.days))}</b> par jour en moyenne, matières comprises.` : `<b>Salaires et charges de ${mName(c)} couverts</b> : tout ce qui suit est du bénéfice.`}</p>` : ''}\n    ${M.min || M.obj ? tiers('CA du mois', c.ca, { min: M.min, obj: M.obj }, (M.obj ? Math.round(c.ca / M.obj * 100) + ' % de l’objectif · ' + (aheadV >= 0 ? '<span class=\"okc\">en avance de ' + fmt(aheadV) + ' sur le rythme</span>' : '<span class=\"latec\">en retard de ' + fmt(-aheadV) + ' sur le rythme</span>') + ' · ' : '') + 'projection ' + fmt(proj(c.ca)) + '. Minimum = point mort du mois.') : ''}\n    ${p.ca || p.achats || p.soirees ? `<small>${mName(p)} : CA ${fmt(p.ca)} · bénéfice ${fmt(p.benef)}</small>` : ''}\n  </section>` : '<p class=\"note\">Indique ton objectif de CA du mois, tes salaires et tes charges fixes (en bas de la page) : l’appli calcule chaque jour un minimum, un objectif et un top adaptés au jour de la semaine.</p>'}\n  ${o.mois || fixes ? `<section><h2>Cette semaine</h2><table class=\"cmp wk\"><thead><tr><th>Jour</th><th>Minimum</th><th>Objectif</th><th>Top</th><th>Réalisé</th></tr></thead><tbody>\n    ${O.week.map(d => `<tr class=\"${d.today ? 'today' : ''}\"><td>${dshort(d.date)}</td><td>${d.min ? fmt(d.min) : '—'}</td><td>${d.obj ? fmt(d.obj) : '—'}</td><td>${d.top ? fmt(d.top) : '—'}</td><td class=\"${res(d)}\">${real(d)}</td></tr>`).join('')}\n  </tbody></table><small>Vert : objectif atteint. Rouge : sous le minimum. « Fermé » : aucune soirée ce jour-là. Le minimum d’aujourd’hui et des jours suivants se recalcule chaque jour : un jour faible fait monter les suivants. ${O.learned ? 'Les poids des jours sont corrigés par tes vraies soirées (8 dernières semaines).' : 'Poids de départ selon ton classement (lundi le plus faible, samedi le meilleur) ; ils se corrigent tout seuls avec les vraies soirées.'}</small></section>` : ''}\n  ${fixes || varM ? `<section><h2>Coûts du mois</h2><table class=\"cmp couts\"><tbody>\n    <tr><td>Salaires</td><td>${fmt(o.sal || 0)}</td></tr>\n    <tr><td>Charges fixes</td><td>${fmt(o.charges || 0)}</td></tr>\n    <tr><td>Matières consommées<small>${c.mat && Object.keys(c.mat.by).length ? Object.entries(c.mat.by).map(([k, v]) => k.toLowerCase() + ' ' + fmt(v)).join(' · ') : 'goûts, charbon, boissons'} · d’après les ventes</small></td><td>${fmt(c.mat ? c.mat.tot : 0)}</td></tr>\n    <tr><td>Autres achats<small>cuisine, emballages… (produits non suivis en stock)</small></td><td>${fmt(c.autres || 0)}</td></tr>\n    <tr class=\"tot\"><td>Total</td><td>${fmt(coutsM)}</td></tr>\n  </tbody></table><small>${c.ca >= coutsM ? 'Coûts du mois couverts : ' + fmt(c.ca - coutsM) + ' au-dessus. ' : ''}Goûts : ${OBJ.gPlate || 15} g par tête plate, ${OBJ.gQuasar || 20} g par Quasar, à ${fmt(OBJ.prixGout || 50)} le kilo. Charbon et boissons : au dernier prix d’achat saisi.${c.mat && c.mat.unknown.length ? ` <span class=\"latec\">Coût inconnu (aucun achat saisi) : ${c.mat.unknown.map(esc).join(', ')}.</span>` : ''} Achats saisis ce mois-ci (sorties de caisse) : ${fmt(c.achats)}.</small></section>` : ''}\n  <section><h2>Indicateurs du mois</h2>${kpiHTML(O.levMonth, O.lev30, o, { month: true })}<small style=\"display:block;margin-top:-10px\">CA = clients × panier par personne : ce sont les deux chiffres à faire monter. « Habituel » = moyenne des 30 derniers jours. Vert : objectif atteint ou mieux que d’habitude. Rouge : moins bien.</small></section>\n  ${O.jours && O.jours.some(j => j.n) ? `<section><h2>Par jour de la semaine · 8 dernières semaines</h2><table class=\"cmp\"><thead><tr><th>Jour</th><th>Soirées</th><th>CA moyen</th><th>Clients</th><th>Panier / pers.</th></tr></thead><tbody>\n    ${(() => { const best = Math.max(...O.jours.map(j => j.ca)), low = Math.min(...O.jours.filter(j => j.n).map(j => j.ca)); return O.jours.map(j => `<tr><td>${DAYS[j.dow]}</td><td>${j.n || '—'}</td><td class=\"${j.n && j.ca === best ? 'ok' : j.n && j.ca === low && best !== low ? 'bad' : ''}\">${j.n ? fmt(j.ca) : '—'}</td><td>${j.n && j.pers ? dec1(j.pers) : '—'}</td><td>${j.ppers ? fmt(j.ppers) : '—'}</td></tr>`).join(''); })()}\n  </tbody></table><small>Vert : ton meilleur jour. Rouge : le plus faible. Sert à décider des horaires, de l’équipe et des soirs où pousser une offre.</small></section>` : ''}\n  <div class=\"defs\">\n    <span><b>Minimum</b> : ce qu’il reste à faire pour finir le mois à 0 € (salaires, charges fixes, matières), réparti sur les jours restants selon leur poids (matières comptées à ${Math.round((O.taux || 0) * 100)} % du CA : ${O.tauxSource === 'defaut' ? 'estimation de départ, réglable dans l’onglet Paramètres du Google Sheets ; la part réelle mesurée sur tes ventes la remplace dès qu’elle est plus haute, puis à partir de 14 soirées' : 'part réelle mesurée sur tes ventes des 60 derniers jours'}). En dessous, la soirée coûte de l’argent.</span>\n    <span><b>Objectif</b> : ton objectif du mois réparti selon le poids de chaque jour. <b>Top</b> : le meilleur même jour des 8 dernières semaines (au moins objectif + 25 %).</span>\n    <span><b>CA</b> : encaissé CB + espèces, TTC, hors offerts. <b>Bénéfice</b> : CA − salaires − charges fixes − matières consommées − autres achats, avant impôts et TVA. Au jour le jour, salaires et charges sont comptés au prorata du mois.</span>\n  </div>\n  <section><h2>Soirs de match et soirs normaux</h2>${O.match.oui.n || O.match.non.n ? `<table class=\"cmp\"><thead><tr><th>90 derniers jours</th><th>Match</th><th>Normal</th></tr></thead><tbody>\n    <tr><td>Soirées</td><td>${O.match.oui.n}</td><td>${O.match.non.n}</td></tr>\n    <tr><td>CA moyen</td><td>${O.match.oui.n ? fmt(O.match.oui.ca) : '—'}</td><td>${O.match.non.n ? fmt(O.match.non.ca) : '—'}</td></tr>\n    <tr><td>Panier par table</td><td>${O.match.oui.n ? fmt(O.match.oui.panier) : '—'}</td><td>${O.match.non.n ? fmt(O.match.non.panier) : '—'}</td></tr>\n    <tr><td>Personnes par soirée</td><td>${O.match.oui.pers || '—'}</td><td>${O.match.non.pers || '—'}</td></tr>\n    <tr><td>Panier par personne</td><td>${O.match.oui.parPers ? fmt(O.match.oui.parPers) : '—'}</td><td>${O.match.non.parPers ? fmt(O.match.non.parPers) : '—'}</td></tr>\n  </tbody></table>` : '<p class=\"empty\">Pas encore de soirée fermée.</p>'}</section>\n  <section><h2>Récap de la semaine et sauvegarde</h2>\n  <p class=\"muted\" style=\"margin:0;font-size:14px\">Le compte rendu de chaque soirée part par mail à la fermeture ; le récap de la semaine et la sauvegarde, à la fermeture du dimanche${O.weekly.email ? ' à ' + esc(O.weekly.email) : ''}. Dernier récap : ${O.weekly.sent ? 'semaine du ' + new Date(O.weekly.sent + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'aucun'}. Dernière sauvegarde : ${O.weekly.backup ? new Date(O.weekly.backup).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'aucune'}${O.weekly.backupUrl ? ` · <a href=\"${esc(O.weekly.backupUrl)}\" target=\"_blank\" rel=\"noopener\">ouvrir</a>` : ''}.</p>\n  <div class=\"btnrow\"><button class=\"ghost\" data-a=\"weeknow\">Envoyer la semaine dernière</button><button class=\"ghost\" data-a=\"monthnow\">Envoyer le mois en cours</button><button class=\"ghost\" data-a=\"backupnow\">Sauvegarder maintenant</button></div></section>\n  <section><h2>Mes objectifs</h2><form class=\"achform\" id=\"oform\" autocomplete=\"off\">\n    ${inp('mois', 'Objectif de CA du mois (€)')}\n    ${inp('sal', 'Salaires du mois (€)', 'Ce que te coûte l’équipe')}\n    ${inp('charges', 'Charges fixes du mois (€)', 'Loyer, électricité, assurances…')}\n    ${inp('ben', 'Objectif de bénéfice du mois (€)')}\n    ${inp('pan', 'Objectif de panier par table (€)')}\n    ${inp('ppers', 'Objectif de panier par personne (€)')}\n    ${inp('tetes', 'Objectif de têtes en plus pour 10 chichas')}\n    ${inp('dess', 'Objectif de desserts pour 10 tables')}\n    <button class=\"primary\" type=\"submit\">Enregistrer les objectifs</button>\n  </form><small>Poids des jours utilisés : ${O.weights.map((w, i) => DAYS[i].slice(0, 3) + ' ' + (Math.round(w * 100) / 100).toString().replace('.', ',')).join(' · ')}. Laisse une case vide pour ne pas suivre un objectif.</small></section></div>`;\n}\n\n// ---- Stock (gérant) ----\nasync function loadStock() {\n  loadCourses();\n  try { STK = await call('stock', {}); ACH = STK.achats; } catch (e) { toast(errMsg(e), true); }\n  render();\n}\nconst qty = (v, u) => { const n = Math.round(v * (u === 'kg' ? 100 : 10)) / (u === 'kg' ? 100 : 10); return n.toString().replace('.', ',') + ' ' + (Math.abs(n) >= 2 && u.length > 2 && !/[sx]$/i.test(u) && !/^(kg|ml|cl)$/i.test(u) ? u + 's' : u); };\n// Jours de stock restants, au rythme des sorties des 30 derniers jours.\nconst covDays = x => x.out30 > 0 && x.theo > 0 ? Math.round(x.theo / (x.out30 / 30)) : x.out30 > 0 && x.theo === 0 ? 0 : null;\nconst covTxt = x => { const d = covDays(x); return d == null || x.theo <= 0 ? '' : `<small class=\"${d < 7 ? 'latec' : ''}\">≈ ${d > 90 ? 'plus de 90' : d} j de stock</small>`; };\nconst stockQ = x => x.theo < 0 ? `<span class=\"muted\">à compter</span><small>stock inconnu</small>` : qty(x.theo, x.unite) + `<small>${x.last ? 'compté le ' + new Date(x.last.ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + (x.last.by ? ' par ' + esc(x.last.by) : '') : 'pas encore compté'}</small>` + covTxt(x);\nfunction vStock() {\n  if (!STK) return ldBox('Chargement du stock', 'stock');\n  const S = STK, gouts = S.list.filter(x => x.type === 'Goût').sort((a, b) => b.tetes30 - a.tetes30), autres = S.list.filter(x => x.type !== 'Goût');\n  const compte = x => x.last ? 'compté le ' + new Date(x.last.ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + (x.last.by ? ' par ' + esc(x.last.by) : '') : 'pas encore compté';\n  const appris = x => x.rate ? `<td class=\"okc\">≈ ${perPortion(x.rate, x.unite)}<small>par portion · ${x.rateInfo ? Math.round(x.rateInfo.portions) + ' portions' + (x.rateInfo.src === 'achats' ? ' · d’achat en achat' : ' · inventaires') : ''}</small></td>` : `<td class=\"muted\">à apprendre<small>au prochain achat</small></td>`;\n  const pu3 = v => (Math.round(v * 1000) / 1000).toString().replace('.', ',') + ' €';\n  const prix = x => x.puSource === 'achat' ? `<span class=\"okc\">${pu3(x.pu)} / ${esc(x.unite)}</span> · dernier achat · `\n    : `<label class=\"cout\">Prix / ${esc(x.unite)} <input data-cout-row=\"${x.row}\" data-cout-n=\"${esc(x.n)}\" inputmode=\"decimal\" placeholder=\"à saisir\" value=\"${x.cout !== '' ? String(Math.round(x.cout * 10000) / 10000).replace('.', ',') : ''}\"></label>${x.puSource ? '' : ' <span class=\"latec\">prix inconnu</span>'} · `;\n  const sRow = x => `<tr><td>${esc(x.n)}<small>${prix(x)}${x.recette ? esc(x.recette) + ' · ' : ''}<button class=\"link ${carArm === 'p:' + x.row ? 'armed' : ''}\" data-a=\"prodoff\" data-row=\"${x.row}\" data-n=\"${esc(x.n)}\" style=\"font-size:11px\">${carArm === 'p:' + x.row ? 'Confirmer' : 'Ne plus suivre'}</button></small></td><td>${x.auto ? qty(x.out30, x.unite) : '<span class=\"muted\">—</span>'}</td><td class=\"${x.low && x.theo >= 0 ? 'red' : ''}\">${stockQ(x)}</td>${x.learn ? appris(x) : ecart(x)}</tr>`;\n  const sSection = (title, list, note) => list.length ? `<section><h2>${title}</h2><table class=\"cmp stk\"><thead><tr><th>Produit</th><th>Sorties 30 j</th><th>Stock</th><th>${list.some(x => x.learn) ? 'Écart / portion' : 'Écart'}</th></tr></thead><tbody>${list.map(sRow).join('')}</tbody></table>${note ? `<small>${note}</small>` : ''}</section>` : '';\n  const low = S.list.filter(x => x.low && x.theo >= 0), reds = S.list.filter(x => x.period && x.period.red), neg = S.list.filter(x => x.theo < 0).length;\n  if (INV) return `<div class=\"pad gut mgr\"><div class=\"sechead\"><h1>Inventaire</h1><span class=\"muted\">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>\n  <p class=\"note\">Pèse ou compte ce qu’il reste vraiment. Laisse vide ce que tu ne comptes pas aujourd’hui. Les goûts en kilos (ex. 0,35 pour 350 g).</p>\n  <div class=\"invlist\">${S.list.filter(x => !INV.keys || !S.intel || S.intel.keys.some(k => k.n === x.n)).sort((a, b) => stypeRank(a) - stypeRank(b)).map(x => `<label><span>${esc(x.n)} <span class=\"muted\" style=\"font-weight:400\">(${esc(x.unite)})</span></span><input data-inv=\"${esc(x.n)}\" type=\"number\" inputmode=\"decimal\" min=\"0\" step=\"0.01\" placeholder=\"—\" value=\"${esc(INV[x.n] || '')}\"></label>`).join('')}</div>\n  <div class=\"btnrow\"><button class=\"ghost\" data-a=\"invcancel\">Annuler</button><button class=\"primary\" data-a=\"invsave\">Enregistrer l’inventaire</button></div></div>`;\n  const ecart = x => !x.period ? '<td class=\"muted\">—</td>' : x.type === 'Goût'\n    ? `<td class=\"${x.period.red ? 'red' : 'okc'}\">${x.period.pct != null ? (x.period.pct > 0 ? '+' : '') + String(x.period.pct).replace('.', ',') + ' %' : '—'}<small>${x.period.rend != null ? String(x.period.rend).replace('.', ',') + ' têtes/kg' : ''}</small></td>`\n    : `<td class=\"${x.period.red ? 'red' : 'okc'}\">${x.period.pct != null ? (x.period.pct > 0 ? '+' : '') + String(x.period.pct).replace('.', ',') + ' %' : '—'}<small>${qty(x.period.real, x.unite)} partis</small></td>`;\n  return `<div class=\"pad gut mgr\">\n  <div class=\"sechead\"><h1>Stock</h1><span class=\"muted\">Valeur ≈ ${fmt(S.value)}</span></div>\n  ${vAchats()}\n  ${vIntel(S.intel)}\n  <h2 class=\"bigh\">État du stock</h2>\n  ${(() => { const soon = S.list.filter(x => { const d = covDays(x); return d != null && d < 7; }), noPrice = S.list.filter(x => !x.puSource), nc = S.list.filter(x => !x.last).length;\n    return `<div class=\"levers k4\">\n    <div class=\"lever\"><h3>Valeur du stock</h3><b>${fmt(S.value)}</b><small>${noPrice.length ? 'incomplète : ' + noPrice.length + ' produit' + (noPrice.length > 1 ? 's' : '') + ' sans prix' : 'au dernier prix d’achat'}</small></div>\n    <div class=\"lever ${soon.length ? 'bad' : 'ok'}\"><h3>À court sous 7 jours</h3><b>${soon.length}</b><small>${soon.length ? soon.slice(0, 4).map(x => esc(x.n.replace(/^Go[ûu]t\\s+/i, ''))).join(', ') + (soon.length > 4 ? '…' : '') : 'au rythme des 30 derniers jours'}</small></div>\n    <div class=\"lever ${low.length ? 'bad' : ''}\"><h3>Sous le seuil</h3><b>${low.length}</b><small>${low.length ? low.slice(0, 4).map(x => esc(x.n)).join(', ') : S.list.some(x => x.seuil > 0) ? 'aucun produit' : 'aucun seuil réglé'}</small></div>\n    <div class=\"lever ${nc ? 'bad' : 'ok'}\"><h3>Jamais comptés</h3><b>${nc}</b><small>${nc ? 'à compter au prochain inventaire' : 'tout a été compté'}</small></div></div>`; })()}\n  ${low.length || reds.length ? `<p class=\"note latec\" style=\"border-color:var(--warn)\">${low.length ? 'Sous le seuil : ' + low.map(x => esc(x.n)).join(', ') + '. ' : ''}${reds.length ? 'Écart au-delà de ' + S.tol + ' % : ' + reds.map(x => esc(x.n)).join(', ') + '.' : ''}</p>` : ''}\n  ${neg ? `<p class=\"note\">${neg} produit${neg > 1 ? 's' : ''} « à compter » : vendu${neg > 1 ? 's' : ''} sans stock de départ connu. Un inventaire (ou la saisie des achats) donne le vrai stock.</p>` : ''}\n  <button class=\"primary\" data-a=\"invopen\" style=\"width:100%;margin-bottom:18px\">Faire un inventaire</button>\n  ${(() => {\n    const sl = S.soir ? (S.soir.cur ? 'Ce soir' : new Date(S.soir.opened).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })) : 'Soirée';\n    const nb = v => v ? String(Math.round(v * 10) / 10).replace('.', ',') : '<span class=\"muted\">0</span>';\n    const ecS = x => x.period && x.period.pct != null ? `<small class=\"${x.period.red ? 'latec' : ''}\">écart ${x.period.pct > 0 ? '+' : ''}${String(x.period.pct).replace('.', ',')} %${x.period.rend != null ? ' · ' + String(x.period.rend).replace('.', ',') + ' têtes/kg' : ''}</small>` : '';\n    const head = l => `<thead><tr><th>${l}</th><th>${sl}</th><th>7 j</th><th>30 j</th><th>Reste</th></tr></thead>`;\n    const totRow = L => `<tr class=\"tot\"><td>Total</td><td>${nb(L.reduce((a, x) => a + x.s, 0))}</td><td>${nb(L.reduce((a, x) => a + x.j7, 0))}</td><td>${nb(L.reduce((a, x) => a + x.j30, 0))}</td><td></td></tr>`;\n    const NS = S.nonSuivis || [], nsG = NS.filter(x => /go[ûu]t|saveur|parfum/i.test(x.g)), nsB = NS.filter(x => !/go[ûu]t|saveur|parfum/i.test(x.g) && /boisson|soft/i.test(x.g));\n    const nsRow = x => `<tr><td>${esc(x.n)}<small>pas suivi en stock : ajoute-le plus bas pour connaître le reste</small></td><td>${nb(x.s)}</td><td>${nb(x.j7)}</td><td>${nb(x.j30)}</td><td class=\"muted\">—</td></tr>`;\n    const boissons = autres.filter(x => x.type === 'Boisson' && !/charbon/i.test(x.n)).sort((a, b) => (b.dec ? b.dec.j30 : 0) - (a.dec ? a.dec.j30 : 0));\n    const D0 = { s: 0, j7: 0, j30: 0 }, dG = gouts.map(x => x.dec || D0), dB = boissons.filter(x => x.auto).map(x => x.dec || D0);\n    return `<section><h2>Goûts · têtes servies</h2>\n    ${gouts.length || nsG.length ? `<table class=\"cmp stk dec\">${head('Goût')}<tbody>\n    ${gouts.map((x, i) => { const d = x.dec || D0; return `<tr><td>${i + 1}. ${esc(x.n.replace(/^Go[ûu]t\\s+/i, ''))}<small>${x.share30} % des têtes sur 30 j</small></td><td>${nb(d.s)}</td><td>${nb(d.j7)}</td><td>${nb(d.j30)}</td><td class=\"${x.low && x.theo >= 0 ? 'red' : ''}\">${stockQ(x)}${d.left != null ? `<small>≈ ${d.left} tête${d.left > 1 ? 's' : ''} possibles</small>` : ''}${ecS(x)}</td></tr>`; }).join('')}\n    ${nsG.map(nsRow).join('')}${totRow(dG.concat(nsG))}\n    </tbody></table>` : '<p class=\"empty\">Aucun goût suivi.</p>'}\n    <small>Dosage : ${S.gPlate} g par tête plate, ${S.gQuasar} g par Quasar, soit ${fmt(S.prixGout * S.gPlate / 1000)} et ${fmt(S.prixGout * S.gQuasar / 1000)} de goût par tête à ${fmt(S.prixGout)} le kilo (ou au prix du dernier achat de ce goût). L’écart se calcule entre deux inventaires ; en rouge au-delà de ± ${S.tol} %.</small></section>\n    <section><h2>Boissons · sorties</h2>\n    ${boissons.length || nsB.length ? `<table class=\"cmp stk dec\">${head('Boisson')}<tbody>\n    ${boissons.map(x => { const d = x.dec || D0; return `<tr><td>${esc(x.n)}<small>${x.auto && d.inc ? 'dont ' + nb(d.inc) + ' avec une chicha (30 j) · ' : ''}${prix(x)}<button class=\"link ${carArm === 'p:' + x.row ? 'armed' : ''}\" data-a=\"prodoff\" data-row=\"${x.row}\" data-n=\"${esc(x.n)}\" style=\"font-size:11px\">${carArm === 'p:' + x.row ? 'Confirmer' : 'Ne plus suivre'}</button></small></td>${x.auto ? `<td>${nb(d.s)}</td><td>${nb(d.j7)}</td><td>${nb(d.j30)}</td>` : '<td class=\"muted\">—</td><td class=\"muted\">—</td><td class=\"muted\">—</td>'}<td class=\"${x.low && x.theo >= 0 ? 'red' : ''}\">${stockQ(x)}${ecS(x)}</td></tr>`; }).join('')}\n    ${nsB.map(nsRow).join('')}${totRow(dB.concat(nsB))}\n    </tbody></table>` : '<p class=\"empty\">Aucune boisson suivie.</p>'}\n    <small>Chaque chicha sort une boisson du stock (celle choisie à la commande), en plus des boissons vendues seules, offertes ou en conso patron. « — » : produit sans lien avec la carte (sirops, jus…), suivi par les achats et les inventaires.</small></section>`; })()}\n  ${sSection('Charbon', autres.filter(x => /charbon/i.test(x.n)), '4 charbons par chicha (classiques pour la tête plate, Quasar pour la Quasar), à saisir en pièces dans les achats.')}\n  ${STYPES.filter(t => t !== 'Boisson').map(t => sSection(STYPE_LABEL[t], autres.filter(x => x.type === t && !/charbon/i.test(x.n)), t === 'Frais' || t === 'Épicerie' || t === 'Surgelé' ? 'Recettes : la quantité par portion s’apprend d’achat en achat (un achat = tu étais à court, donc le stock d’avant a servi à tout ce qui a été vendu depuis l’achat précédent), puis, dès qu’il y a un inventaire, avec le stock compté (plus juste). Saisis tes achats dans l’unité du produit (ex. 12 fondants, pas 1 pack).' : '')).join('')}\n  <small>Stock = dernier inventaire + achats − ventes (boissons comprises, offerts et conso patron compris). Recettes et types se modifient dans l’onglet Stock du Google Sheets (colonne « Articles de la carte », ×2 pour deux par portion).</small>\n  <section><h2>Suivre un nouveau produit</h2><form class=\"achform\" id=\"pform\" autocomplete=\"off\">\n    <label>Nom${'<small class=\"muted\" style=\"font-weight:400\">Pour une boisson, écris-la exactement comme sur la carte (ex. Coca-Cola).</small>'}<input id=\"pf-n\" maxlength=\"60\" value=\"${esc(PFORM.n)}\" placeholder=\"Ex. Fanta, Goût Blue Mist, Sirop de fraise\"></label>\n    <div class=\"row2\"><label>Type<select id=\"pf-type\">${S.types.map(t => `<option ${PFORM.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>\n    <label>Unité<select id=\"pf-unite\">${UNITES.map(u => `<option ${PFORM.unite === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label></div>\n    <label>Seuil bas (facultatif)<input id=\"pf-seuil\" type=\"number\" inputmode=\"decimal\" min=\"0\" step=\"0.01\" value=\"${esc(PFORM.seuil)}\"></label>\n    <button class=\"primary\" type=\"submit\">Suivre ce produit</button></form></section></div>`;\n}\n\n// ---- Carte (gérant) ----\nasync function loadCarte() {\n  try { CAR = await call('carte', {}); } catch (e) { toast(errMsg(e), true); }\n  render();\n}\n// Marge par produit (60 jours) : prix moyen vendu − coût des matières par portion.\nfunction margesHTML(C) {\n  const M = C.marges || [];\n  if (!M.length) return `<section><h2>Marge par produit</h2><p class=\"empty\">Pas encore de ventes sur 60 jours.</p></section>`;\n  const order = C.cats.concat(M.map(x => x.cat)).filter((c, i, a) => a.indexOf(c) === i);\n  const rows = order.map(cat => M.filter(x => x.cat === cat).sort((a, b) => b.q - a.q).map(x => {\n    const manque = x.apprendre.length || x.inconnu.length, nonSuivi = !manque && !(x.cout > 0), cls = manque || nonSuivi ? '' : x.pct >= 70 ? 'okc' : x.pct < 50 ? 'red' : '';\n    if (nonSuivi) return `<tr><td>${esc(x.n)}<small>${x.q} vendu${x.q > 1 ? 's' : ''} · aucun ingrédient suivi en stock</small></td><td>${fmt(x.prix)}</td><td class=\"muted\">—<small>non suivi</small></td><td class=\"muted\">—</td></tr>`;\n    const mg = manque ? (x.cout > 0 ? `<td class=\"muted\"><span class=\"nw\">≤ ${fmt(x.marge)}</span><small>≤ ${x.pct} %</small></td>` : `<td class=\"muted\">—<small>à compléter</small></td>`) : `<td class=\"${cls}\"><span class=\"nw\">${fmt(x.marge)}</span><small>${x.pct} %</small></td>`;\n    return `<tr><td>${esc(x.n)}<small>${x.q} vendu${x.q > 1 ? 's' : ''}${x.apprendre.length ? ' · <span class=\"latec\">à apprendre : ' + x.apprendre.map(esc).join(', ') + '</span>' : ''}${x.inconnu.length ? ' · <span class=\"latec\">prix d’achat inconnu : ' + x.inconnu.map(esc).join(', ') + '</span>' : ''}</small></td><td>${fmt(x.prix)}</td><td>${manque && !(x.cout > 0) ? '—' : fmt(x.cout)}${manque ? '<small>incomplet</small>' : ''}</td>${mg}</tr>`;\n  }).join('')).join('');\n  return `<section><h2>Marge par produit · 60 jours</h2><table class=\"cmp stk\"><thead><tr><th>Article</th><th>Prix</th><th>Coût</th><th>Marge</th></tr></thead><tbody>${rows}</tbody></table>\n  <small>Prix moyen TTC vendu, coût des matières par portion (goût, charbon, boisson comprise, ingrédients). Hors TVA, salaires et charges. « Incomplet » : un ingrédient n’a pas encore de quantité apprise ou de prix d’achat, donc la marge réelle est au plus celle affichée (≤). « Non suivi » : aucun ingrédient de cet article n’est suivi dans le stock.</small></section>`;\n}\nfunction vCarte() {\n  if (!CAR) return ldBox('Chargement de la carte', 'carte');\n  const C = CAR;\n  return `<div class=\"pad gut mgr\">\n  <div class=\"sechead\"><h1>Carte</h1><span class=\"muted\">${C.items.filter(x => x.actif).length} articles en vente</span></div>\n  <p class=\"note\">Change un prix ou décoche « En vente » : c’est enregistré tout de suite et visible sur l’appli service en moins d’une minute.</p>\n  ${(() => { const M = C.marges || []; if (!M.length) return '';\n    const top = M.slice().sort((a, b) => b.q - a.q)[0], full = M.filter(x => !x.apprendre.length && !x.inconnu.length && x.cout > 0), mg = full.slice().sort((a, b) => b.marge * b.q - a.marge * a.q)[0];\n    const sold = new Set(M.map(x => x.n)), dead = C.items.filter(x => x.actif && !sold.has(x.n));\n    return `<div class=\"levers k3\">\n    <div class=\"lever\"><h3>Meilleure vente · 60 j</h3><b>${esc(top.n)}</b><small>${top.q} vendu${top.q > 1 ? 's' : ''}</small></div>\n    <div class=\"lever\"><h3>Rapporte le plus · 60 j</h3><b>${mg ? esc(mg.n) : '—'}</b><small>${mg ? fmt(mg.marge * mg.q) + ' de marge sur matières' : 'saisis tes prix d’achat pour le savoir'}</small></div>\n    <div class=\"lever ${dead.length ? 'bad' : 'ok'}\"><h3>Jamais vendus · 60 j</h3><b>${dead.length}</b><small>${dead.length ? dead.slice(0, 4).map(x => esc(x.n)).join(', ') + (dead.length > 4 ? '…' : '') : 'tout se vend'}</small></div></div>`; })()}\n  ${margesHTML(C)}\n  ${C.cats.map(cat => `<section><h2>${esc(cat)}</h2>${C.items.filter(x => x.cat === cat).map(x => `<div class=\"cline ${x.actif ? '' : 'off'}\"><span>${esc(x.n)}${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</span>\n    <input data-k=\"p\" data-crow=\"${x.row}\" data-cn=\"${esc(x.n)}\" inputmode=\"decimal\" value=\"${String(x.p).replace('.', ',')}\" aria-label=\"Prix de ${esc(x.n)}\">\n    <label class=\"sw\">En vente<input data-k=\"a\" data-crow=\"${x.row}\" data-cn=\"${esc(x.n)}\" type=\"checkbox\" ${x.actif ? 'checked' : ''}></label></div>`).join('')}</section>`).join('')}\n  <section><h2>Goûts de chicha</h2><div class=\"gchips\">${C.gouts.map(g => `<span class=\"gchip\">${esc(g.n)}<button class=\"${carArm === 'g:' + g.row ? 'armed' : ''}\" data-a=\"goutdel\" data-row=\"${g.row}\" data-n=\"${esc(g.n)}\" aria-label=\"Retirer ${esc(g.n)}\">${carArm === 'g:' + g.row ? '✓' : '×'}</button></span>`).join('')}</div>\n  <form class=\"inline2\" id=\"gform\" autocomplete=\"off\"><input id=\"gf-n\" maxlength=\"40\" placeholder=\"Nouveau goût\" value=\"${esc(GFORM.n)}\"><button class=\"primary\" type=\"submit\">Ajouter</button></form>\n  <small>Un nouveau goût est aussi ajouté au suivi du stock. × puis ✓ pour retirer un goût.</small></section>\n  <section><h2>Ajouter un article</h2><form class=\"achform\" id=\"aform\" autocomplete=\"off\">\n    <div class=\"row2\"><label>Catégorie<input id=\"af-cat\" list=\"dl-cat\" value=\"${esc(AFORM.cat)}\" placeholder=\"Ex. Desserts\"></label><label>Prix (€)<input id=\"af-p\" inputmode=\"decimal\" value=\"${esc(AFORM.p)}\"></label></div>\n    <label>Nom<input id=\"af-n\" maxlength=\"60\" value=\"${esc(AFORM.n)}\" placeholder=\"Ex. Crêpe Speculoos\"></label>\n    <label>Description (facultatif)<input id=\"af-sub\" maxlength=\"80\" value=\"${esc(AFORM.sub)}\"></label>\n    <datalist id=\"dl-cat\">${C.cats.map(c => `<option value=\"${esc(c)}\">`).join('')}</datalist>\n    <button class=\"primary\" type=\"submit\">Ajouter à la carte</button></form>\n  <small>Les options (goût, boisson comprise, parfum…) d’un article se règlent dans le Google Sheets ; dis-moi si tu en as besoin.</small></section></div>`;\n}\n\n// ---- Équipe (gérant) ----\nasync function loadEquipe() {\n  try { EQ = await call('equipe', {}); } catch (e) { toast(errMsg(e), true); }\n  render();\n}\nfunction vEquipe() {\n  if (!EQ) return ldBox('Chargement de l’équipe', 'equipe');\n  const E = EQ, mName = new Date(E.month + '-15').toLocaleDateString('fr-FR', { month: 'long' });\n  const card = x => `<article class=\"person\"><header><strong>${esc(x.nom)}</strong>${x.onDuty ? '<small class=\"okc\">En service</small>' : ''}</header>\n    <div class=\"code\" aria-label=\"Code ${x.code.split('').join(' ')}\">${x.code}</div>\n    <p>En ${mName} : ${String(x.h).replace('.', ',')} h${x.open ? ' (soirée en cours)' : ''} · ${x.soirees} soirée${x.soirees > 1 ? 's' : ''} · ${x.retards ? x.retards + ' retard' + (x.retards > 1 ? 's' : '') + ' (' + x.retardMin + ' min)' : 'aucun retard'}<br>Encaissé : ${fmt(x.enc)}${x.h >= 1 ? ' (' + fmt(x.enc / x.h) + ' par heure)' : ''} · annulations et offerts : ${x.annulN + x.offN}${x.annulN + x.offN ? ' (' + fmt(r2(x.annulV + x.offV)) + ')' + (x.offRef ? ', ' + x.offRef + ' refusé' + (x.offRef > 1 ? 's' : '') : '') : ''}<br>Avances : ${fmt(x.av || 0)}</p>\n    <div class=\"links\"><button class=\"link ${teamArm === 'tcode:' + x.row ? 'armed' : ''}\" data-a=\"tcode\" data-row=\"${x.row}\" data-code=\"${x.code}\" data-nom=\"${esc(x.nom)}\">${teamArm === 'tcode:' + x.row ? 'Confirmer le nouveau code' : 'Nouveau code'}</button>\n    <button class=\"link danger ${teamArm === 'toff:' + x.row ? 'armed' : ''}\" data-a=\"toff\" data-row=\"${x.row}\" data-code=\"${x.code}\" data-nom=\"${esc(x.nom)}\">${teamArm === 'toff:' + x.row ? 'Confirmer : retirer ' + esc(x.nom) : 'Retirer'}</button></div></article>`;\n  return `<div class=\"pad gut mgr\">\n  <div class=\"sechead\"><h1>Équipe</h1><span class=\"muted\">${E.actifs.length} personne${E.actifs.length > 1 ? 's' : ''} active${E.actifs.length > 1 ? 's' : ''}</span></div>\n  ${E.tot && E.tot.h ? `<div class=\"levers k3\">\n    <div class=\"lever\"><h3>Heures de l’équipe</h3><b>${dec1(E.tot.h)} h</b><small>en ${mName}</small></div>\n    <div class=\"lever\"><h3>CA par heure d’équipe</h3><b>${fmt(E.tot.caH)}</b><small>${fmt(E.tot.ca)} encaissés en ${mName}</small></div>\n    <div class=\"lever ${E.tot.retards ? 'bad' : 'ok'}\"><h3>Retards</h3><b>${E.tot.retards}</b><small>${E.tot.retards ? 'en ' + mName : 'aucun en ' + mName}</small></div>\n  </div>` : ''}\n  <section><h2>Ton code gérant</h2><article class=\"person\"><header><strong>Gérant</strong><small>à garder pour toi</small></header>\n    <div class=\"code\" aria-label=\"Code ${String(E.admin).split('').join(' ')}\">${esc(E.admin)}</div>\n    <p>Sur l’appli service : ouvre la soirée sans contrôle de position, et permet de passer le ménage de fermeture.</p>\n    <div class=\"links\"><button class=\"link ${teamArm === 'acode' ? 'armed' : ''}\" data-a=\"acode\">${teamArm === 'acode' ? 'Confirmer le nouveau code' : 'Nouveau code'}</button></div></article></section>\n  <section><h2>Ajouter une personne</h2><form class=\"achform\" id=\"tform\" autocomplete=\"off\">\n    <label>Prénom<input id=\"t-nom\" maxlength=\"30\" placeholder=\"Ex. Karim\" value=\"${esc(TNOM)}\"></label>\n    <button class=\"primary\" type=\"submit\">Créer son code</button>\n  </form><small>Un code à 4 chiffres est créé au hasard. Donne-le à la personne : elle le tape sur l’appli service pour commencer son service.</small></section>\n  <section><h2>Codes actifs</h2>${E.actifs.length ? `<div class=\"people\">${E.actifs.map(card).join('')}</div>\n  <small>« Retirer » bloque le code tout de suite, même sur un téléphone déjà connecté. L’historique de la personne reste dans le Google Sheets.</small>`\n  : '<p class=\"empty\">Personne pour l’instant. L’appli service demande un code : seul ton code gérant fonctionne.</p>'}</section>\n  ${E.anciens.length ? `<section><h2>Anciens</h2><ul class=\"sales\">${E.anciens.map(x => `<li><span class=\"muted\">${x.removed ? new Date(x.removed).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}</span><span>${esc(x.nom)}<small>Code désactivé</small></span><strong></strong></li>`).join('')}</ul></section>` : ''}</div>`;\n}\n\n// ---- Achats (gérant) ----\nconst UNITES = ['unité', 'pièce', 'sachet', 'kg', 'g', 'L', 'carton', 'pack', 'boîte', 'bouteille'];\n// ---- Liste de courses ----\nfunction coursesList(manager) {\n  if (!COURSES) return ldBox('Chargement des courses', 'courses');\n  return COURSES.todo.length ? `<ul class=\"sales\">${COURSES.todo.map(c => `<li class=\"crs\"><span class=\"muted\">${fmtD(c.ts)}</span><span>${esc(c.article)}${c.detail ? `<small>${esc(c.detail)}</small>` : ''}</span><button class=\"ghost small ${courseArm === c.row ? 'armed' : ''}\" data-a=\"cdone\" data-row=\"${c.row}\" data-ts=\"${c.ts}\" data-art=\"${esc(c.article)}\">${courseArm === c.row ? 'Confirmer' : manager ? 'Acheté' : 'Fait'}</button></li>`).join('')}</ul>` : '<p class=\"empty\">Rien à acheter pour l’instant.</p>';\n}\nfunction vCourses() {\n  return `<div class=\"pad gut\"><div class=\"sechead\"><h1>Courses</h1><span class=\"muted\">${COURSES ? COURSES.todo.length + ' à acheter' : ''}</span></div>\n  <form class=\"achform\" id=\"cform\" autocomplete=\"off\">\n    <label>Ce qu’il faut acheter<input id=\"c-article\" placeholder=\"Ex. charbon, Coca-Cola, Nutella\" value=\"${esc(CFORM.article)}\"></label>\n    <label>Précision <span class=\"muted\" style=\"font-weight:400\">(facultatif)</span><input id=\"c-detail\" placeholder=\"Ex. 2 cartons, il en reste pour 1 soirée\" value=\"${esc(CFORM.detail)}\"></label>\n    <button class=\"primary\" type=\"submit\">Ajouter à la liste</button>\n  </form>\n  <section style=\"margin-top:22px\"><h3>À acheter</h3>${coursesList(false)}</section></div>`;\n}\nasync function loadCourses() {\n  try { COURSES = await call('courses', {}); } catch (e) { toast((e && e.message) || 'Erreur de chargement', true); }\n  render();\n}\n\nlet ACHALL = false;\nfunction vAchats() {\n  if (!ACH) return ldBox('Chargement des achats', 'achats');\n  const A = ACH, [m0, m1] = A.months;\n  const mName = m => new Date(m.m + '-15').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });\n  const opt = (arr, v) => arr.map(x => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');\n  const tracked = new Set(STK ? STK.list.map(x => x.n.toLowerCase()) : []), alias = A.alias || {};\n  const shown = ACHALL ? A.list : A.list.slice(0, 6);\n  return `<section class=\"achtop\"><h2>Ajouter un achat</h2><form class=\"achform\" id=\"achform\" autocomplete=\"off\">\n    <label>Date<input id=\"ach-date\" type=\"date\" value=\"${esc(FORM.date)}\"></label>\n    <label>Produit<input id=\"ach-produit\" list=\"dl-prod\" placeholder=\"Ex. charbon, Coca-Cola 33 cl\" value=\"${esc(FORM.produit)}\"></label>\n    <div class=\"chips achsugg\" id=\"ach-sugg\">${achSuggHTML()}</div>\n    <label>Catégorie<select id=\"ach-cat\"><option value=\"\">Choisir…</option>${opt(A.cats, FORM.cat)}</select></label>\n    <div class=\"row2\"><label>Quantité<input id=\"ach-qty\" type=\"number\" inputmode=\"decimal\" step=\"0.01\" min=\"0\" value=\"${esc(FORM.qty)}\"></label>\n    <label>Unité<select id=\"ach-unite\">${achUnites()}</select></label></div>\n    <small id=\"ach-hint\" class=\"muted\">${achHint()}</small>\n    <label>Prix total payé (€)<input id=\"ach-total\" type=\"number\" inputmode=\"decimal\" step=\"0.01\" min=\"0\" value=\"${esc(FORM.total)}\"></label>\n    <label>Fournisseur<input id=\"ach-fournisseur\" list=\"dl-four\" placeholder=\"Facultatif\" value=\"${esc(FORM.fournisseur)}\"></label>\n    <button class=\"primary\" type=\"submit\">Ajouter l’achat</button>\n    <datalist id=\"dl-prod\">${[...new Set((STK ? STK.list.map(x => x.n) : []).concat(Object.keys(A.produits).filter(p => !alias[p.toLowerCase()])))].map(p => `<option value=\"${esc(p)}\">`).join('')}</datalist>\n    <datalist id=\"dl-four\">${A.fournisseurs.map(p => `<option value=\"${esc(p)}\">`).join('')}</datalist>\n  </form></section>\n  <section><h2>Derniers achats</h2>\n  ${A.list.length ? `<ul class=\"sales\">${shown.map(a => `<li class=\"ach\"><span class=\"muted\">${new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span><span>${esc(a.produit)}<small>${String(a.qty).replace('.', ',')} ${esc(a.unite)} · ${fmt(a.pu)} / ${esc(a.unite)}${a.fournisseur ? ' · ' + esc(a.fournisseur) : ''}${STK && !tracked.has(String(a.produit).toLowerCase()) ? ` · <button class=\"link\" data-a=\"achlink\" data-n=\"${esc(a.produit)}\">Rattacher à un produit suivi</button>` : ''}</small></span><strong>${fmt(a.total)}</strong><button class=\"minus ${delArm === a.row ? 'armed' : ''}\" data-a=\"achdel\" data-row=\"${a.row}\" data-saisi=\"${a.saisi}\" aria-label=\"Supprimer cet achat\">${delArm === a.row ? '✓' : '×'}</button></li>`).join('')}</ul>${A.list.length > 6 ? `<button class=\"link\" data-a=\"achall\">${ACHALL ? 'Voir moins' : 'Voir les ' + A.list.length + ' derniers achats'}</button>` : ''}<small>× puis ✓ pour supprimer une erreur de saisie. Tout est aussi dans l’onglet Achats du Google Sheets.</small>` : '<p class=\"empty\">Aucun achat saisi pour l’instant.</p>'}\n  <p class=\"muted\" style=\"margin:10px 0 0;font-size:14px\">${mName(m0)} : <b style=\"color:var(--fg)\">${fmt(m0.achats)}</b> d’achats saisis${m1.achats ? ' · ' + mName(m1) + ' : ' + fmt(m1.achats) : ''}. Le bénéfice du mois est dans l’onglet Objectifs.</p></section>\n  <section><h2>Liste de courses du service</h2>${coursesList(true)}<small>Aussi dans le Récap. « Acheté » retire l’article de la liste et le met dans le formulaire d’achat.</small></section>`;\n}\n// ---- Stock intelligent (v30) : indicateurs clés de la semaine, activité inhabituelle, dosages appris ----\nconst qtyU = (v, u) => { v = Math.round(Math.abs(v) * 1000) / 1000; return u === 'kg' ? (v < 1 ? Math.round(v * 1000) + ' g' : String(Math.round(v * 100) / 100).replace('.', ',') + ' kg') : String(v).replace('.', ',') + ' ' + (u === 'unité' || u === 'pièce' ? u + (v > 1 ? 's' : '') : u); };\nfunction vIntel(I) {\n  if (!I) return '';\n  const st = { ok: ['ok', 'Conforme'], surveiller: ['warn', 'À surveiller'], alerte: ['bad', 'Manque'], compter: ['wait', 'À compter'] };\n  const card = k => {\n    const [c, l] = st[k.status] || st.compter;\n    const big = k.status === 'compter' ? (k.label || 'à compter') : k.status === 'ok' ? '✓' : (k.ecart > 0 ? '−' : '+') + qtyU(k.ecart, k.unite);\n    const sub = k.status === 'compter' ? '' : `sorti ${qtyU(k.real, k.unite)} · vendu ${qtyU(k.theo, k.unite)}${k.tetes ? ' (' + k.tetes + ' têtes)' : ''}`;\n    return `<article class=\"kcard ${c}\"><header><b>${esc(k.n.replace(/^Go[ûu]t\\s+/i, 'Goût '))}</b><i>${l}</i></header><strong>${big}${k.status !== 'ok' && k.status !== 'compter' && k.val > 0 && k.ecart > 0 ? ` <small>≈ ${fmt(k.val)}</small>` : ''}</strong>${sub ? `<span>${sub}</span>` : ''}${k.why ? `<small>${esc(k.why)}</small>` : ''}</article>`;\n  };\n  const g = I.gout || {}, L = I.learned || [], U = I.unusual || [];\n  return `<section class=\"intel\"><h2 class=\"bigh\">Indicateurs clés de la semaine</h2>\n  <p class=\"muted\" style=\"margin:-6px 0 12px;font-size:14px\">Choisis automatiquement chaque lundi parmi les produits qui sortent à chaque vente (aluminium, charbon, boissons…). Comptés à l’inventaire du lundi : sorti ↔ vendu.</p>\n  ${I.keys.length ? `<div class=\"kgrid\">${I.keys.map(card).join('')}</div>` : '<p class=\"empty\">Les indicateurs apparaissent dès que des produits liés aux ventes sont vendus.</p>'}\n  ${I.lost > 0 ? `<p class=\"note latec\" style=\"border-color:var(--warn)\">Perte estimée sur les derniers comptages : <b>${fmt(I.lost)}</b>.</p>` : ''}\n  ${I.keys.length ? `<button class=\"ghost\" data-a=\"invkeys\" style=\"width:100%;margin:6px 0 4px\">Compter les indicateurs maintenant</button>` : ''}\n  ${U.length ? `<h3 class=\"subh\">Activité inhabituelle</h3><ul class=\"unus\">${U.slice(0, 8).map(u => `<li class=\"${u.sev > 1 ? 'bad' : 'warn'}\"><b>${esc(u.n)}</b> · ${esc(u.txt)}</li>`).join('')}</ul>` : ''}\n  <h3 class=\"subh\">Dosages appris tout seuls</h3>\n  <ul class=\"learn\"><li><b>Goûts</b> · ${String(g.g).replace('.', ',')} g par tête plate${g.cal ? ` <small>appris sur ${g.cal.eq} têtes (réglage de départ ${g.g0} g)</small>` : ` <small>réglage de départ · le vrai dosage s’apprend dès 40 têtes entre deux inventaires</small>`}</li>\n  ${L.map(x => `<li><b>${esc(x.n)}</b> · ${esc(x.txt)}${x.basis ? ` <small>${esc(x.basis)}</small>` : ''}</li>`).join('')}</ul>\n  ${L.length ? '' : '<small class=\"muted\">Les quantités des produits sans dose fixe (pâtes, frites, sel, sucre…) s’apprennent à chaque achat épuisé ou entre deux inventaires.</small>'}</section>`;\n}\n// ---- Suggestions de produit (achats) : on retombe toujours sur le produit suivi, même avec un autre nom ----\nconst normP = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\\s+/g, ' ').trim();\n// Mots courants qui désignent un produit suivi sous un autre nom.\nconst SYN_P = { burger: 'brioche', hamburger: 'brioche', bun: 'brioche', buns: 'brioche', coca: 'coca cola', eau: 'eau', gazeuse: 'petillante', steak: 'steak hache', frite: 'frites', fromage: 'cheddar', creme: 'creme fraiche' };\nfunction bigr(v) { const a = []; for (let i = 0; i < v.length - 1; i++) a.push(v.slice(i, i + 2)); return a; }\nfunction simP(q, n) {\n  const a = normP(q), b = normP(n); if (!a || !b) return 0;\n  if (a === b) return 1;\n  const qa = a.split(' ').map(w => SYN_P[w] || w).join(' ');\n  let sc = 0; const A = bigr(qa), B = bigr(b), m = A.filter(x => { const k = B.indexOf(x); if (k >= 0) { B.splice(k, 1); return true; } return false; }).length;\n  sc = A.length + bigr(b).length ? 2 * m / (A.length + bigr(b).length) : 0;\n  const wq = qa.split(' ').filter(w => w.length > 2), wb = b.split(' ');\n  const hit = wq.filter(w => wb.some(x => x.startsWith(w) || w.startsWith(x))).length;\n  if (wq.length) sc = Math.max(sc, hit / Math.max(wq.length, 1) * .9);\n  if (b.startsWith(qa) || qa.startsWith(b)) sc = Math.max(sc, .85);\n  return sc;\n}\nfunction achSuggest(q, max) {\n  const t = String(q || '').trim(); if (t.length < 2 || !STK) return [];\n  const al = (ACH && ACH.alias) || {}, hitA = al[t.toLowerCase()];\n  const L = STK.list.map(x => ({ n: x.n, s: simP(t, x.n.replace(/^Go[ûu]t\\s+/i, '')) })).filter(x => x.s >= .4 && x.n.toLowerCase() !== t.toLowerCase()).sort((a, b) => b.s - a.s);\n  const out = hitA ? [{ n: hitA, s: 1 }].concat(L.filter(x => x.n !== hitA)) : L;\n  return out.slice(0, max || 4);\n}\nfunction achSuggHTML() { if (achSp()) return ''; return achSuggest(FORM.produit).map(x => `<button type=\"button\" class=\"chip\" data-a=\"achpick\" data-n=\"${esc(x.n)}\">${esc(x.n)}</button>`).join(''); }\nfunction achApply(n) {\n  FORM.produit = n; const sp = achSp(), i = $('ach-produit');\n  if (i) i.value = n;\n  if (sp) { FORM.cat = achCat(sp); FORM.unite = sp.unite; const c = $('ach-cat'); if (c) c.value = FORM.cat; }\n  const u = $('ach-unite'), h = $('ach-hint'), g = $('ach-sugg');\n  if (u) { u.innerHTML = achUnites(); if (sp) u.value = sp.unite; }\n  if (h) h.textContent = achHint(); if (g) g.innerHTML = achSuggHTML();\n}\n// Rattacher un nom d'achat à un produit suivi (les achats passés et futurs sous ce nom y vont).\nlet MERGE = null;\nfunction drawMerge() {\n  sheetMode = 'merge';\n  const sug = achSuggest(MERGE.from, 5), all = STK ? STK.list.map(x => x.n).sort((a, b) => a.localeCompare(b, 'fr')) : [];\n  openSheet(`<div><h2>Rattacher « ${esc(MERGE.from)} »</h2><small>Ses achats comptent alors pour ce produit (stock, prix, coût par portion). La prochaine fois, ce nom y sera rattaché tout seul.</small></div>\n  ${sug.length ? `<div class=\"grp\"><h3>Suggestions</h3><div class=\"chips\">${sug.map(x => `<button class=\"chip ${MERGE.to === x.n ? 'on' : ''}\" data-a=\"mergeto\" data-n=\"${esc(x.n)}\">${esc(x.n)}</button>`).join('')}</div></div>` : ''}\n  <div class=\"grp\"><h3>Ou dans la liste</h3><select id=\"mergesel\" class=\"note-in\" style=\"font-size:16px;padding:10px 12px\"><option value=\"\">Choisir un produit suivi…</option>${all.map(n => `<option ${MERGE.to === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Annuler</button><button class=\"primary\" data-a=\"mergeok\" ${MERGE.to ? '' : 'disabled'}>${MERGE.to ? 'Rattacher à ' + esc(MERGE.to) : 'Rattacher'}</button></div>`);\n}\nfunction drawAchConfirm() {\n  sheetMode = 'achconf';\n  const sug = achSuggest(FORM.produit, 3);\n  openSheet(`<div><h2>« ${esc(FORM.produit)} » n’est pas suivi</h2><small>Tu voulais dire :</small></div>\n  <div class=\"chips\">${sug.map(x => `<button class=\"chip\" data-a=\"achpickgo\" data-n=\"${esc(x.n)}\">${esc(x.n)}</button>`).join('')}</div>\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Annuler</button><button class=\"primary\" data-a=\"achkeep\">Garder « ${esc(FORM.produit)} »</button></div>`);\n}\n// Produit suivi en stock : la quantité se saisit dans son unité (sinon le coût par portion serait faux).\nconst achSp = () => { const n = String(FORM.produit || '').trim().toLowerCase(); return STK && n ? STK.list.find(x => x.n.toLowerCase() === n || (x.type === 'Goût' && x.n.toLowerCase() === 'goût ' + n)) : null; };\nconst achUnites = () => { const sp = achSp(); return sp ? `<option selected>${esc(sp.unite)}</option>` : UNITES.map(x => `<option ${x === FORM.unite ? 'selected' : ''}>${esc(x)}</option>`).join(''); };\nconst achHint = () => { const sp = achSp(); return sp ? `Produit suivi : quantité en ${esc(sp.unite)}${sp.unite === 'unité' || sp.unite === 'pièce' ? ' (un pack de 24 → 24)' : sp.unite === 'kg' ? ' (500 g → 0,5)' : ''}.` : ''; };\nconst achCat = sp => sp.type === 'Goût' || /charbon/i.test(sp.n) ? 'Chicha (tabac, charbon)' : sp.type === 'Boisson' ? 'Boissons' : /^(Frais|Surgelé|Épicerie)$/.test(sp.type) ? 'Cuisine' : sp.type === 'Consommable' ? 'Emballages et consommables' : 'Autre';\nasync function loadAchats() {\n  loadCourses();\n  try { ACH = await call('achats', {}); } catch (e) { toast((e && e.message) || 'Erreur de chargement', true); }\n  render();\n}\n\nlet recLoading = false, recLast = 0, RECTOK = 0, RECWANT = null;\n// Récaps des soirées passées gardés sur l'appareil : passer d'une soirée à l'autre est instantané.\nconst RECS = {}, RSK = 'yaya-recs';\nlet FULL = null;\ntry { const o = JSON.parse(localStorage.getItem(RSK) || '{}'); Object.keys(o).forEach(k => { RECS[k] = o[k]; }); } catch (e) {}\nfunction saveRecs() { try { const ids = Object.keys(RECS).sort((a, b) => ((RECS[b].soiree || {}).opened || 0) - ((RECS[a].soiree || {}).opened || 0)).slice(0, 16), o = {}; ids.forEach(k => { o[k] = RECS[k]; }); localStorage.setItem(RSK, JSON.stringify(o)); } catch (e) {} }\n// Un récap « allégé » (soirée passée) reprend la liste des soirées, la caisse et les courses du récap courant.\nfunction withGlobals(r) {\n  const F = FULL || REC || {};\n  return Object.assign({}, r, { history: F.history || r.history || [], solde: F.solde, seuil: F.seuil, fondParam: F.fondParam, courses: F.courses || [], today: F.today, live: F.live,\n    promos: { soir: (r.promos || {}).soir || [], pending: ((F.promos || {}).pending) || [] } });\n}\nasync function loadRecap(id) {\n  const tok = ++RECTOK; recLoading = true;\n  try { const r = await call('recap', { id: id || '' }); if (tok === RECTOK) { REC = r; if (!r.lite) FULL = r; saveRec(); } } catch (e) { if (tok === RECTOK) toast((e && e.message) || 'Erreur de chargement', true); }\n  if (tok !== RECTOK) return;\n  recLoading = false; recLast = Date.now(); RECWANT = null;\n  if (ROLE === 'gerant') { if (!$('scrim') && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) bgRender(); prefetch(); }\n}\n// Choix d'une soirée : affichage immédiat si elle est déjà sur l'appareil ; sinon la ligne indique le chargement\n// et un second appui ne relance rien. Une réponse arrivée trop tard (autre soirée choisie entre-temps) est ignorée.\nasync function pickRecap(id) {\n  if (!id) return;\n  const curId = ST.soiree && ST.soiree.id;\n  if (id === curId || (FULL && FULL.cur && FULL.id === id)) { if (FULL && FULL.id === id) { REC = FULL; render(); } RECWANT = id; return loadRecap(id); }\n  if (RECS[id]) { RECTOK++; recLoading = false; RECWANT = null; REC = withGlobals(RECS[id]); render(); scrollTop(); return; }\n  if (RECWANT === id) return;\n  RECWANT = id; const tok = ++RECTOK; render();\n  try {\n    const r = await call('recap', { id, lite: 1 });\n    RECS[r.id] = r; saveRecs();\n    if (tok === RECTOK) { REC = withGlobals(r); RECWANT = null; render(); scrollTop(); }\n  } catch (e) { if (tok === RECTOK) { RECWANT = null; toast((e && e.message) || 'Erreur de chargement', true); render(); } }\n}\nconst scrollTop = () => { const v = $('view'); if (v) v.scrollTo({ top: 0 }); };\n// En arrière-plan : les récaps des dernières soirées arrivent en un seul appel.\nlet RECSPRE = false;\nasync function prefetchRecaps() {\n  if (RECSPRE || !FULL || !FULL.history) return;\n  RECSPRE = true;\n  const ids = FULL.history.slice(0, 12).map(h => h.id).filter(id => !RECS[id] || !RECS[id].soiree || !RECS[id].soiree.closed);\n  if (!ids.length) return;\n  try { const o = await call('recaps', { ids }); Object.keys(o || {}).forEach(k => { RECS[k] = o[k]; }); saveRecs(); if (MTAB === 'recap') bgRender(); } catch (e) { RECSPRE = false; }\n}\n// Pendant la soirée : le récap se met à jour dès qu'une table commande ou paie (au plus toutes les 8 s), sinon toutes les 30 s.\nfunction refreshRecap() { if (MTAB === 'recap' && REC && REC.cur && !recLoading && Date.now() - recLast > 8000) loadRecap(REC.id); }\n// Rapidité (gérant) : le dernier récap s'affiche tout de suite à l'ouverture, puis se met à jour ;\n// les autres onglets se chargent en arrière-plan et s'ouvrent ensuite sans attente.\nconst RK = 'yaya-rec';\nfunction saveRec() { try { if (ROLE === 'gerant' && REC && REC.id) localStorage.setItem(RK, JSON.stringify(REC)); } catch (e) {} }\nfunction oldRec() { try { const r = JSON.parse(localStorage.getItem(RK) || 'null'); if (r && r.id && r.soiree) { r._old = true; return r; } } catch (e) {} return null; }\nlet PREF = false;\nasync function prefetch() {\n  if (PREF || ROLE !== 'gerant') return;\n  PREF = true;\n  await prefetchRecaps();\n  const jobs = [['caisse', r => { if (!CAI) CAI = r; }], ['objectifs', r => { if (!OBJ) { OBJ = r; OFORM = objForm(r); } }], ['stock', r => { if (!STK) { STK = r; ACH = r.achats; } }],\n    ['carte', r => { if (!CAR) CAR = r; }], ['equipe', r => { if (!EQ) EQ = r; }], ['courses', r => { if (!COURSES) COURSES = r; }]];\n  for (const [a, f] of jobs) { try { f(await call(a, {})); } catch (e) {} }\n}\n\n// Mises à jour en arrière-plan : jamais pendant qu'un doigt touche l'écran (sinon l'appui est perdu\n// quand l'écran se redessine), on attend que le geste soit fini.\nlet PDOWN = 0, BGT = 0;\ndocument.addEventListener('pointerdown', () => { PDOWN = Date.now(); }, true);\n['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { PDOWN = -Date.now(); }, true));\nfunction bgRender() {\n  const touching = PDOWN > 0 && Date.now() - PDOWN < 8000, justUp = PDOWN < 0 && Date.now() + PDOWN < 450;\n  clearTimeout(BGT);\n  if (touching || justUp) { BGT = setTimeout(bgRender, 300); return; }\n  render();\n}\n// ---- Rendu ----\nfunction render() {\n  const v = $('view'), mgr = ROLE === 'gerant';\n  // Garde le curseur dans le champ en cours de saisie quand l'écran se redessine (messages qui arrivent…).\n  const ae = document.activeElement, fid = ae && ae.id && v.contains(ae) ? ae.id : null;\n  let sel = null; try { sel = fid && ae.selectionStart != null ? [ae.selectionStart, ae.selectionEnd] : null; } catch (e) {}\n  if (!mgr && ME && ME.admin && ME.sid && !(ST.soiree && ST.soiree.id === ME.sid)) { ME = null; saveMe(); }\n  const mode = mgr ? 'mgr' : CODES && (!ME || (!onDuty() && !ME.typed)) ? 'lock' : !ST.soiree || !onDuty() ? 'gate' : 'app';\n  $('tabs').hidden = mode !== 'app';\n  $('rolePill').textContent = mgr ? 'Gérant' : ME && ME.nom ? ME.nom : 'Service';\n  v.classList.toggle('lock', mode === 'app' && UI.view === 'order');\n  const map = { tables: vTables, order: vOrder, prep: vPrep, bill: vBill, cash: vCash, courses: vCourses, msgs: vMsgs };\n  const nR = pendDems().length + (REC && REC.promos ? REC.promos.pending.length : 0);\n  const mtabs = `<div class=\"gut mtabs\"><div class=\"seg seg6\">${[['recap', 'Récap'], ['caisse', 'Caisse'], ['obj', 'Objectifs'], ['stock', 'Stock'], ['carte', 'Carte'], ['equipe', 'Équipe']].map(([k, l]) => `<button class=\"${MTAB === k ? 'on' : ''}\" data-a=\"mtab\" data-m=\"${k}\">${l}${k === 'recap' && nR ? `<i class=\"tbadge\">${nR}</i>` : ''}</button>`).join('')}</div></div>`;\n  const mview = { stock: vStock, carte: vCarte, obj: vObj, equipe: vEquipe, caisse: vCaisse, msg: vMsgs }[MTAB] || vManager;\n  const menScreen = mode === 'app' && !!(ST.soiree && ST.soiree.menage && !ST.soiree.menage.done);\n  const invScreen = !menScreen && mode === 'app' && invDueNow() && !INVLATER;\n  if (invScreen || menScreen) $('tabs').hidden = true;\n  wakeLock(menScreen);\n  v.innerHTML = mode === 'mgr' ? mtabs + mview() : mode === 'lock' ? vLock() : mode === 'gate' ? (UI.view === 'msgs' ? vMsgs() : vGate()) : menScreen ? vMenage() : invScreen ? vInvService() : (map[UI.view] || vTables)();\n  const nav = { tables: 'tables', order: 'tables', bill: UI.billFrom === 'cash' ? 'cash' : 'tables', prep: 'prep', cash: 'cash', courses: 'courses', msgs: 'msgs' }[UI.view] || 'tables';\n  ['tables', 'prep', 'cash', 'courses', 'msgs'].forEach(k => $('nav-' + k).classList.toggle('on', k === nav));\n  const p = ST.tickets.length; $('badge').hidden = !p; $('badge').textContent = p;\n  const c = Object.keys(ST.tables).length; $('badge-cash').hidden = !c; $('badge-cash').textContent = c;\n  $('msgBtn').hidden = !mgr;\n  updBadges();\n  if (fid) { const el = $(fid); if (el && el !== document.activeElement) { try { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) el.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }\n  // Fil de messages : en bas au premier affichage et à chaque nouveau message ; lu dès qu'il est affiché.\n  const inMsgs = mgr ? MTAB === 'msg' : (mode === 'app' || mode === 'gate') && UI.view === 'msgs' && !menScreen && !invScreen;\n  if (inMsgs) {\n    const n = msgsOf().length;\n    if (n !== CHATN) { CHATN = n; v.scrollTop = v.scrollHeight; }\n    if (unread() > 0 && !readBusy && !document.hidden) markRead();\n  } else CHATN = -1;\n}\n\n// ---- Feuilles (options, cadeaux, annulations) ----\nfunction openSheet(html) { closeSheet(true); const d = document.createElement('div'); d.className = 'scrim'; d.id = 'scrim'; d.innerHTML = `<div class=\"sheet\" role=\"dialog\" aria-modal=\"true\">${html}</div>`; document.body.appendChild(d); }\nfunction closeSheet(keep) { const d = $('scrim'); if (d) d.remove(); if (!keep) { sheetMode = null; pending = null; } }\nfunction drawOpts() {\n  const { it, sel } = pending;\n  const price = it.p + it.o.reduce((a, g) => a + ((sel[g] && D.options[g] && (D.options[g].choices.find(c => c.n === sel[g]) || {}).add) || 0), 0);\n  const ready = it.o.every(g => sel[g]);\n  sheetMode = 'opts';\n  openSheet(`<div><h2>${esc(it.n)}</h2>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</div>\n  ${it.o.map(g => { const G = D.options[g]; if (!G) return `<p class=\"warnline\">Groupe « ${esc(g)} » absent de l’onglet Options.</p>`;\n    return `<div class=\"grp\"><h3>${esc(G.label)}</h3><div class=\"chips\">${G.choices.map(c => `<button class=\"chip ${sel[g] === c.n ? 'on' : ''}\" data-a=\"pick\" data-g=\"${esc(g)}\" data-c=\"${esc(c.n)}\">${esc(c.n)}${c.add ? ` <small>+${fmt(c.add)}</small>` : ''}</button>`).join('')}</div></div>`; }).join('')}\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Annuler</button><button class=\"primary\" data-a=\"confirm\" ${ready ? '' : 'disabled'}>Ajouter · ${fmt(price)}</button></div>`);\n}\nfunction drawGift() {\n  const tb = ST.tables[giftSel.t], P = giftSel.palier, list = D.fidelite.filter(g => g.palier === P);\n  const g = P && giftSel.i != null ? list[giftSel.i] : null, l = g ? giftLine(tb, g) : null;\n  const paliers = [...new Set(D.fidelite.map(x => x.palier))].sort((a, b) => a - b);\n  sheetMode = 'gift';\n  openSheet(`<div><h2>Cadeau fidélité · table ${giftSel.t}</h2><small>Un seul cadeau par carte et par visite. Vérifie les tampons sur la carte du client.</small></div>\n  <div class=\"grp\"><h3>Palier atteint</h3><div class=\"chips\">${paliers.map(p => `<button class=\"chip ${P === p ? 'on' : ''}\" data-a=\"gpal\" data-p=\"${p}\">${p} tampons</button>`).join('')}</div></div>\n  ${P ? `<div class=\"grp\"><h3>Cadeau choisi</h3><div class=\"chips\">${list.map((x, i) => {\n    const ln = giftLine(tb, x), sub = !x.articles.length ? 'à définir' : ln ? '−' + fmt(giftAmount(D, ln)) : 'pas dans la commande';\n    return `<button class=\"chip ${giftSel.i === i ? 'on' : ''}\" data-a=\"gpick\" data-i=\"${i}\" ${ln ? '' : 'disabled'}>${esc(x.n)} <small>${sub}</small></button>`;\n  }).join('')}</div><small>L’article offert doit d’abord être dans la commande, pour être préparé et compté en stock.</small></div>` : ''}\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Annuler</button><button class=\"primary\" data-a=\"gconfirm\" ${l ? '' : 'disabled'}>${l ? 'Offrir · −' + fmt(giftAmount(D, l)) : 'Offrir'}</button></div>`);\n}\n// Promotion exceptionnelle : 10, 20 ou 30 %, motif et « pour qui » obligatoires. Le gérant la valide ensuite.\nlet PRSEL = null;\nconst PROMO_MOTIFS = ['Collaborateur', 'Ami', 'Famille', 'Geste commercial', 'Autre'];\nconst promoOk = () => PRSEL && PRSEL.pct && PRSEL.motif && PRSEL.pour.trim().length >= 2;\nfunction drawPromo() {\n  const tb = ST.tables[PRSEL.t]; if (!tb) { closeSheet(); return; }\n  const base = r2(Math.max(0, gross(tb) - giftTot(tb) - offTot(tb))), amt = PRSEL.pct ? r2(base * PRSEL.pct / 100) : 0;\n  sheetMode = 'promo';\n  openSheet(`<div><h2>Promotion · table ${PRSEL.t}</h2><small>Exceptionnelle. Le gérant voit chaque promotion et doit la valider.</small></div>\n  <div class=\"grp\"><h3>Remise</h3><div class=\"chips\">${[10, 20, 30].map(p => `<button class=\"chip ${PRSEL.pct === p ? 'on' : ''}\" data-a=\"prpct\" data-p=\"${p}\">−${p} % <small>−${fmt(r2(base * p / 100))}</small></button>`).join('')}</div></div>\n  <div class=\"grp\"><h3>Motif</h3><div class=\"chips\">${PROMO_MOTIFS.map(m => `<button class=\"chip ${PRSEL.motif === m ? 'on' : ''}\" data-a=\"prmotif\" data-m=\"${m}\">${m}</button>`).join('')}</div></div>\n  <div class=\"grp\"><h3>Pour qui ? · obligatoire</h3><input id=\"prpour\" class=\"note-in\" maxlength=\"120\" placeholder=\"Ex. Sami, ami du gérant\" value=\"${esc(PRSEL.pour)}\" style=\"font-size:16px;padding:10px 12px\"></div>\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Annuler</button><button class=\"primary\" data-a=\"prok\" ${promoOk() ? '' : 'disabled'}>${PRSEL.pct ? 'Appliquer · −' + fmt(amt) : 'Appliquer'}</button></div>`);\n}\nfunction drawCancel() {\n  const c = cancelSel; sheetMode = 'cancel';\n  openSheet(`<div><h2>Annuler 1× ${esc(c.name)}</h2><small>${tName(c.t)} · pas encore servi (envoyé il y a moins de 15 min) : annulation directe, visible par le gérant.</small></div>\n  <div class=\"grp\"><h3>Raison</h3><div class=\"chips\">${REASONS.map(r => `<button class=\"chip ${c.reason === r ? 'on' : ''}\" data-a=\"creason\" data-r=\"${esc(r)}\">${esc(r)}</button>`).join('')}</div></div>\n  <button class=\"linkbtn\" data-a=\"offgo\" style=\"text-align:left;padding:0\">Déjà servi, ou produit raté ? Offrir ou annuler (validé par le gérant)</button>\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Retour</button><button class=\"primary\" data-a=\"cconfirm\" ${c.reason ? '' : 'disabled'}>Annuler l’article</button></div>`);\n}\n\n// ---- Actions ----\nconst openBill = (n, from, mode) => { UI.cur = n; UI.billFrom = from; bm = { mode, sel: {} }; UI.view = 'bill'; render(); };\n\n// Conso patron : pour Rayane, ou pour quelqu'un d'autre avec un commentaire obligatoire.\nlet PSEL = { pour: null, comment: '' };\nconst patronOk = () => PSEL.pour === 'Rayane' || (PSEL.pour === 'Autre' && PSEL.comment.trim().length >= 5);\nfunction drawPatron() {\n  sheetMode = 'patron';\n  const n = cartCnt(PATRON), ok = patronOk();\n  openSheet(`<div><h2>Conso patron · ${n} article${n > 1 ? 's' : ''}</h2><small>Offert, compté dans le stock.${PSEL.pour === 'Autre' ? ' Pour quelqu’un d’autre : le gérant doit valider.' : ''}</small></div>\n  <div class=\"grp\"><h3>Pour qui ?</h3><div class=\"chips\">${['Rayane', 'Autre'].map(p => `<button class=\"chip ${PSEL.pour === p ? 'on' : ''}\" data-a=\"ppour\" data-p=\"${p}\">${p}</button>`).join('')}</div></div>\n  ${PSEL.pour === 'Autre' ? `<div class=\"grp\"><h3>Pour qui et pourquoi ? · obligatoire</h3><textarea id=\"pcomment\" class=\"note-in\" rows=\"2\" maxlength=\"300\" placeholder=\"Ex. Karim, livreur : café pendant la livraison\">${esc(PSEL.comment)}</textarea></div>` : ''}\n  <div class=\"sheetact\"><button class=\"ghost\" data-a=\"close\">Annuler</button><button class=\"primary\" data-a=\"psave\" ${ok ? '' : 'disabled'}>Enregistrer</button></div>`);\n  const ta = $('pcomment'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }\n}\n\nasync function send() {\n  const t = UI.cur, c = CART[t] || [];\n  if (!c.length) return;\n  const lines = c.map(l => ({ n: l.n, sel: l.sel, q: l.q }));\n  if (t === PATRON) { PSEL = { pour: null, comment: '' }; drawPatron(); return; }\n  if (!ST.tables[t] && !PERS[t] && !(PSHEET && PSHEET.skip === t)) { PSHEET = { t, then: 'send' }; drawPers(); return; }\n  const r = qAct('send', { t, lines, pers: PERS[t] || null }, 'Table ' + t + ' envoyée en préparation');\n  if (!r) return;\n  delete CART[t]; delete PERS[t]; saveCart(); PSHEET = null;\n  if (t === PATRON) UI.view = 'tables';\n  closeSheet(); render();\n}\n\ndocument.addEventListener('click', async e => {\n  if (e.target.id === 'scrim') { closeSheet(); return; }\n  const b = e.target.closest('[data-a]');\n  if (!b || b.disabled) return;\n  const a = b.dataset.a;\n  b.classList.add('tapd'); setTimeout(() => b.classList.remove('tapd'), 4000);\n  if (a !== 'pay') arm = null;\n  if (a !== 'openremote') recArm = false;\n  if (a !== 'delsoiree') delSoArm = false;\n  if (a !== 'packall') promoArm = null;\n  if (a !== 'mcancel') menArm = false;\n  if (a !== 'achdel') delArm = null;\n  if (a !== 'cdone' && a !== 'rcdone') courseArm = null;\n  if (a !== 'toff' && a !== 'tcode' && a !== 'acode') teamArm = null;\n  if (a !== 'prodoff' && a !== 'goutdel') carArm = null;\n  if (a !== 'ddec' && a !== 'dwith') demArm = null;\n  if (a !== 'caidel') caiArm = null;\n  // Son des messages et du ménage : autorisé après un premier appui sur l'écran.\n  if (!AC && ROLE !== 'gerant') { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) {} }\n  switch (a) {\n    case 'go': closeSheet(); UI.view = b.dataset.v; render(); if (UI.view === 'courses') loadCourses(); break;\n    case 'open': UI.cur = +b.dataset.t; UI.view = 'order'; render(); break;\n    case 'cat': UI.cat = +b.dataset.i; render(); break;\n    case 'item': {\n      const it = findArt(D, b.dataset.n);\n      if (!it) break;\n      if (!it.o.length) { addCart(UI.cur, it.n, {}); toast('Ajouté : ' + it.n); render(); }\n      else { pending = { it, sel: {} }; drawOpts(); }\n      break;\n    }\n    case 'pick': pending.sel[b.dataset.g] = b.dataset.c; drawOpts(); break;\n    case 'confirm': {\n      const { it, sel, replace } = pending;\n      if (replace) { const c = cartOf(UI.cur), l = c.find(x => x.k === replace); if (l) { l.q--; CART[UI.cur] = c.filter(x => x.q > 0); } }\n      addCart(UI.cur, it.n, sel); closeSheet(); toast((replace ? 'Passé en ' : 'Ajouté : ') + it.n); render(); break;\n    }\n    case 'close': closeSheet(); break;\n    case 'ticket': sheetMode = 'ticket'; openSheet(ticketHTML(UI.cur)); break;\n    case 'send': await send(); break;\n    case 'sendbill': {\n      const t = UI.cur;\n      if (!ST.tables[t] && !PERS[t]) { PSHEET = { t, then: 'sendbill' }; drawPers(); break; }\n      const r = qAct('send', { t, lines: (CART[t] || []).map(l => ({ n: l.n, sel: l.sel, q: l.q })), pers: PERS[t] || null }, 'Table ' + t + ' envoyée en préparation');\n      if (r) { delete CART[t]; delete PERS[t]; saveCart(); } render(); break;\n    }\n    case 'perspick': {\n      const k = +b.dataset.n, P = PSHEET;\n      if (!P) break;\n      if (P.edit) { qAct('people', { t: P.t, n: k }, 'Table ' + P.t + ' : ' + k + ' personne' + (k > 1 ? 's' : '')); PSHEET = null; closeSheet(); render(); if (P.from === 'ticket') { sheetMode = 'ticket'; openSheet(ticketHTML(UI.cur)); } break; }\n      PERS[P.t] = k; saveCart(); closeSheet();\n      if (P.then === 'sendbill') { const r = qAct('send', { t: P.t, lines: (CART[P.t] || []).map(l => ({ n: l.n, sel: l.sel, q: l.q })), pers: k }, 'Table ' + P.t + ' envoyée en préparation'); if (r) { delete CART[P.t]; delete PERS[P.t]; saveCart(); } PSHEET = null; render(); }\n      else await send();\n      break;\n    }\n    case 'persskip': { const P = PSHEET; closeSheet(); PSHEET = { t: P.t, skip: P.t }; if (P.then === 'sendbill') { const r = qAct('send', { t: P.t, lines: (CART[P.t] || []).map(l => ({ n: l.n, sel: l.sel, q: l.q })) }, 'Table ' + P.t + ' envoyée en préparation'); if (r) { delete CART[P.t]; saveCart(); } PSHEET = null; render(); } else await send(); break; }\n    case 'persedit': PSHEET = { t: UI.cur, edit: true, from: sheetMode }; drawPers(); break;\n    case 'matchsheet': {\n      const id = b.dataset.id || null, cur = id ? (REC && REC.soiree && REC.soiree.match) : (ST.soiree && ST.soiree.match);\n      MSEL = { id, label: cur && cur !== 'Match' ? cur : '', cur: !!cur }; drawMatch(); break;\n    }\n    case 'matchon': case 'matchoff': {\n      const on = a === 'matchon', label = on ? MSEL.label : '';\n      if (MSEL.id) { try { REC = await call('setMatch', { id: MSEL.id, on, label }); toast(on ? 'Soirée match enregistrée' : 'Soirée normale'); } catch (err) { toast(errMsg(err), true); } }\n      else await act('match', { on, label });\n      closeSheet(); render(); break;\n    }\n    case 'cminus': {\n      const c = cartOf(UI.cur), l = c[+b.dataset.i];\n      if (l) { l.q--; CART[UI.cur] = c.filter(x => x.q > 0); saveCart(); }\n      render(); if (sheetMode === 'ticket') openSheet(ticketHTML(UI.cur)); break;\n    }\n    case 'sminus': {\n      // Pas encore servi (moins de 15 min) : annulation simple. Sinon : offrir ou annuler, validé par le gérant.\n      const tb = ST.tables[UI.cur], l = tb && tb.lines.find(x => x.k === b.dataset.k);\n      if (!l) break;\n      const tk = freeTicket(UI.cur, l.k);\n      if (tk) { cancelSel = { t: UI.cur, k: l.k, name: l.n, reason: null, ticketId: tk.id }; drawCancel(); }\n      else { OFFSEL = { t: UI.cur, k: l.k, name: l.n, price: l.p, type: 'Offert', motif: null, pour: '', ticketId: null }; drawOff(); }\n      break;\n    }\n    case 'pcancel': {\n      const tk = ST.tickets.find(x => x.id === +b.dataset.id), tl = tk && tk.lines.find(x => x.k === b.dataset.k);\n      if (!tl) break;\n      if (Date.now() - tk.ts < FREE_CANCEL_MS) { cancelSel = { t: tk.t, k: tl.k, name: tl.n, reason: null, ticketId: tk.id }; drawCancel(); }\n      else { const l = ((ST.tables[tk.t] || {}).lines || []).find(x => x.k === tl.k); OFFSEL = { t: tk.t, k: tl.k, name: tl.n, price: l ? l.p : 0, type: 'Annulation', motif: 'Pas préparé (rupture, oubli)', pour: '', ticketId: tk.id }; drawOff(); }\n      break;\n    }\n    case 'offgo': {\n      const c = cancelSel, l = c && ((ST.tables[c.t] || {}).lines || []).find(x => x.k === c.k);\n      if (!c) break;\n      OFFSEL = { t: c.t, k: c.k, name: c.name, price: l ? l.p : 0, type: 'Annulation', motif: null, pour: '', ticketId: c.ticketId }; cancelSel = null; drawOff(); break;\n    }\n    case 'offtype': OFFSEL.type = b.dataset.v; OFFSEL.motif = null; drawOff(); break;\n    case 'offmotif': OFFSEL.motif = b.dataset.m; drawOff(); break;\n    case 'offok': {\n      if (!offOk()) break;\n      const o = OFFSEL, fromBill = UI.view === 'bill';\n      const r = await act('demOff', { t: o.t, k: o.k, type: o.type, motif: o.motif, pour: o.pour, ticketId: o.ticketId });\n      if (!r) break;\n      OFFSEL = null; closeSheet();\n      if (r.closed && fromBill) UI.view = UI.billFrom === 'cash' ? 'cash' : 'tables';\n      render(); break;\n    }\n    case 'avopen': AVF = { amount: '', pay: 'caisse', motif: '' }; drawAvance(); break;\n    case 'avpay': AVF.pay = b.dataset.p; drawAvance(); break;\n    case 'avsend': {\n      if (!avOk()) break;\n      const r = await act('avance', { amount: String(AVF.amount).replace(',', '.'), pay: AVF.pay, motif: AVF.motif });\n      if (r) { AVF = null; closeSheet(); UI.view = 'msgs'; }\n      render(); break;\n    }\n    case 'msgs': if (ROLE === 'gerant') MTAB = 'msg'; else UI.view = 'msgs'; closeSheet(); render(); break;\n    case 'ddec': {\n      const key = b.dataset.id + ':' + b.dataset.v;\n      if (demArm !== key) { demArm = key; render(); break; }\n      demArm = null;\n      const v = b.dataset.v;\n      await act('demDecide', { id: b.dataset.id, ok: v !== 'no', pay: v === 'hors' ? 'hors' : '' });\n      render();\n      if (ROLE === 'gerant' && MTAB === 'recap' && REC) loadRecap(REC.id);\n      if (ROLE === 'gerant' && MTAB === 'caisse') loadCaisse();\n      break;\n    }\n    case 'dwith': {\n      const key = b.dataset.id + ':w';\n      if (demArm !== key) { demArm = key; render(); break; }\n      demArm = null;\n      await act('demWithdraw', { id: b.dataset.id }); render(); break;\n    }\n    case 'caikind': CAF.kind = b.dataset.k; caiArm = null; render(); break;\n    case 'caisug': CAF.amount = String(b.dataset.v).replace('.', ','); render(); break;\n    case 'caidel': {\n      const key = 'del:' + b.dataset.row;\n      if (caiArm !== key) { caiArm = key; render(); break; }\n      caiArm = null;\n      try { CAI = await call('caisseDel', { row: +b.dataset.row, ts: +b.dataset.ts }); toast(CAI.msg || 'Supprimé'); } catch (err) { toast(errMsg(err), true); }\n      render(); break;\n    }\n    case 'ppour': PSEL.pour = b.dataset.p; drawPatron(); break;\n    case 'psave': {\n      const lines = (CART[PATRON] || []).map(l => ({ n: l.n, sel: l.sel, q: l.q }));\n      const r = await act('patron', { lines, pour: PSEL.pour, comment: PSEL.comment });\n      if (!r) break;\n      delete CART[PATRON]; saveCart(); UI.view = 'tables'; closeSheet(); render(); break;\n    }\n    case 'creason': cancelSel.reason = b.dataset.r; drawCancel(); break;\n    case 'cconfirm': {\n      const c = cancelSel;\n      const r = await act('cancel', { t: c.t, k: c.k, reason: c.reason, ticketId: c.ticketId });\n      if (!r) break;\n      cancelSel = null; closeSheet();\n      if (UI.view === 'order' && !ST.tables[UI.cur] && !cartCnt(UI.cur)) UI.view = 'tables';\n      render(); break;\n    }\n    case 'sugg': {\n      const sg = suggestion(UI.cur);\n      if (!sg || !sg.item) break;\n      pending = { it: findArt(D, sg.item), sel: { ...sg.preset }, replace: sg.from };\n      drawOpts(); break;\n    }\n    case 'sdis': (DIS[UI.cur] = DIS[UI.cur] || []).push(b.dataset.key); saveCart(); render(); break;\n    case 'done': qAct('done', { id: +b.dataset.id }, 'Commande servie'); render(); break;\n    case 'bill': closeSheet(); openBill(UI.cur, 'order', 'all'); break;\n    case 'detail': openBill(+b.dataset.t, 'cash', 'all'); break;\n    case 'splitbill': openBill(+b.dataset.t, 'cash', 'items'); break;\n    case 'bm': bm = { mode: b.dataset.m, sel: {} }; render(); break;\n    case 'u+': bm.sel[b.dataset.k] = (bm.sel[b.dataset.k] || 0) + 1; render(); break;\n    case 'u-': { const k = b.dataset.k; bm.sel[k] = Math.max(0, (bm.sel[k] || 0) - 1); if (!bm.sel[k]) delete bm.sel[k]; render(); break; }\n    case 'split': await act('split', { t: UI.cur, n: +b.dataset.n }); render(); break;\n    case 'pay': {\n      const n = +b.dataset.t, m = b.dataset.m, kind = b.dataset.kind, key = [n, m, b.dataset.amt, kind].join('|');\n      if (arm !== key) { arm = key; render(); break; }\n      arm = null;\n      const fromBill = UI.view === 'bill';\n      const tb0 = ST.tables[n], pp = { t: n, kind, method: m, sel: kind === 'items' ? Object.assign({}, bm.sel) : null }, amt = tb0 ? payAmt(tb0, pp) : 0, paid0 = tb0 ? paidTot(tb0) : 0;\n      const r = qAct('pay', pp);\n      if (r) {\n        const closed = !ST.tables[n];\n        toast(closed ? (paid0 + amt ? 'Table ' + n + ' soldée · ' + fmt(paid0 + amt) : 'Table ' + n + ' clôturée · 0 €, rien à encaisser') : 'Table ' + n + ' : ' + fmt(amt) + ' en ' + m + ' · reste ' + fmt(rest(ST.tables[n])));\n        if (kind === 'items') bm.sel = {};\n        if (closed) UI.view = fromBill && UI.billFrom !== 'cash' ? 'tables' : 'cash';\n      }\n      render(); break;\n    }\n    case 'gift': giftSel = { t: +b.dataset.t, palier: null, i: null }; drawGift(); break;\n    case 'gpal': giftSel.palier = +b.dataset.p; giftSel.i = null; drawGift(); break;\n    case 'gpick': giftSel.i = +b.dataset.i; drawGift(); break;\n    case 'gconfirm': { const r = await act('gift', { t: giftSel.t, palier: giftSel.palier, i: giftSel.i }); if (r) { giftSel = null; closeSheet(); } render(); break; }\n    case 'ungift': await act('ungift', { t: UI.cur, i: +b.dataset.i }); render(); break;\n    case 'promo': PRSEL = { t: +b.dataset.t, pct: null, motif: null, pour: '' }; drawPromo(); break;\n    case 'annul': ANSEL = { t: b.dataset.t ? +b.dataset.t : UI.cur, sel: {}, motif: null, expl: '' }; drawAnnul(); break;\n    case 'an+': case 'an-': {\n      if (!ANSEL) break;\n      const k = b.dataset.k, tb = ST.tables[ANSEL.t], u = annulUnits(tb).find(x => x.l.k === k), q = ANSEL.sel[k] || 0;\n      ANSEL.sel[k] = Math.max(0, Math.min(u ? u.left : 0, q + (a === 'an+' ? 1 : -1)));\n      drawAnnul(); break;\n    }\n    case 'anmotif': if (ANSEL) { ANSEL.motif = b.dataset.m; drawAnnul(); } break;\n    case 'anok': {\n      if (!anOk()) break;\n      const sel = {}; Object.keys(ANSEL.sel).forEach(k => { if (ANSEL.sel[k] > 0) sel[k] = ANSEL.sel[k]; });\n      const r = await act('annul', { t: ANSEL.t, sel, motif: ANSEL.motif, expl: ANSEL.expl });\n      if (r) { ANSEL = null; closeSheet(); }\n      render(); break;\n    }\n    case 'prpct': PRSEL.pct = +b.dataset.p; drawPromo(); break;\n    case 'prmotif': PRSEL.motif = b.dataset.m; drawPromo(); break;\n    case 'prok': { if (!promoOk()) break; const r = await act('promo', { t: PRSEL.t, pct: PRSEL.pct, motif: PRSEL.motif, pour: PRSEL.pour }); if (r) { PRSEL = null; closeSheet(); } render(); break; }\n    case 'unpromo': await act('unpromo', { t: UI.cur }); render(); break;\n    case 'pack': case 'packall': {\n      if (a === 'packall' && promoArm !== 'all') { promoArm = 'all'; render(); break; }\n      promoArm = null;\n      try { REC = await call('promoAck', a === 'packall' ? { all: true, id: REC && REC.id } : { row: +b.dataset.row, ts: +b.dataset.ts, id: REC && REC.id }); toast(REC.msg || 'Fait'); } catch (err) { toast(errMsg(err), true); }\n      render(); break;\n    }\n    case 'key': {\n      if (logging) break;\n      const k = b.dataset.k;\n      if (k === 'del') PINBUF = PINBUF.slice(0, -1); else if (PINBUF.length < 4) PINBUF += k;\n      render();\n      if (PINBUF.length === 4) await login(PINBUF);\n      break;\n    }\n    case 'logout': ME = null; saveMe(); PINBUF = ''; closeSheet(); render(); break;\n    case 'me': if (ROLE !== 'gerant' && CODES && ME) drawMe(); break;\n    case 'leave': {\n      if (leaving) break;\n      leaving = true; drawMe();\n      const g = await getPos();\n      leaving = false;\n      const r = await act('leave', g.err ? {} : g);\n      if (r) { ME = null; saveMe(); closeSheet(); } else if (sheetMode === 'me') drawMe();\n      render(); break;\n    }\n    case 'scanin': {\n      if (locating) break;\n      locating = true; render();\n      const g = (ST.soiree && ST.soiree.remote) || (ME && ME.admin) ? {} : await getPos();\n      locating = false;\n      if (g.err) { toast(g.err, true); render(); break; }\n      const r = await act('scanIn', g);\n      if (r) { UI.view = 'tables'; if (ME && ST.soiree) { ME.sid = ST.soiree.id; saveMe(); } }\n      render(); break;\n    }\n    case 'countok': {\n      if (!countFilled()) break;\n      const r = await act('caisseCount', { counted: String(countTotal()), detail: countDetail(), tpe: TPEV });\n      if (r) { COUNTS = {}; if (!r.recount) TPEV = ''; }\n      render(); break;\n    }\n    case 'recount': { const r = await act('caisseCount', { op: 'reset' }); render(); break; }\n    case 'closenight': {\n      if (locating) break;\n      locating = true; render();\n      const g = ME && ME.admin ? {} : await getPos();\n      locating = false;\n      const noCash = ST.soiree && ST.soiree.cashN === 0;\n      const r = await act('close', { counted: noCash || ST.soiree.count ? '' : countFilled() ? String(countTotal()) : '', detail: noCash || ST.soiree.count ? '' : countDetail(), comment: commentVal, lat: g.lat, lng: g.lng, acc: g.acc });\n      if (r) { countVal = ''; commentVal = ''; COUNTS = {}; CART = {}; DIS = {}; PERS = {}; saveCart(); UI.view = 'tables'; if (CODES) { ME = null; saveMe(); } }\n      render(); break;\n    }\n    case 'hist': await pickRecap(b.dataset.id); break;\n    case 'toval': { const el = $('aval'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }\n    case 'rcdone': {\n      const row = +b.dataset.row;\n      if (courseArm !== row) { courseArm = row; render(); break; }\n      courseArm = null;\n      try { COURSES = await call('courseDone', { row, ts: +b.dataset.ts }); if (REC) REC.courses = COURSES.todo; toast('Retiré de la liste. Pense à saisir l’achat (onglet Stock).'); }\n      catch (err) { toast(errMsg(err), true); }\n      render(); break;\n    }\n    case 'cdone': {\n      const row = +b.dataset.row;\n      if (courseArm !== row) { courseArm = row; render(); break; }\n      courseArm = null;\n      try {\n        COURSES = await call('courseDone', { row, ts: +b.dataset.ts });\n        if (ROLE === 'gerant') { FORM.produit = b.dataset.art; toast('Complète l’achat : ' + b.dataset.art); } else toast('Retiré de la liste');\n      } catch (err) { toast(err.message, true); }\n      render(); break;\n    }\n    case 'weeknow': case 'backupnow': case 'monthnow': {\n      if (busy) break;\n      busy = true; $('busy').hidden = false; toast(a === 'backupnow' ? 'Sauvegarde en cours…' : 'Envoi en cours…');\n      try { OBJ = await call(a === 'backupnow' ? 'backupNow' : a === 'monthnow' ? 'monthlyNow' : 'weeklyNow', {}); toast(OBJ.msg || 'Fait'); } catch (err) { toast(errMsg(err), true); }\n      busy = false; $('busy').hidden = true; render(); break;\n    }\n    case 'mtab': MTAB = b.dataset.m; INV = null; render(); if (MTAB === 'stock') loadStock(); else if (MTAB === 'carte') loadCarte(); else if (MTAB === 'obj') loadObj(); else if (MTAB === 'equipe') loadEquipe(); else if (MTAB === 'caisse') loadCaisse(); else loadRecap(REC && REC.id); break;\n    case 'invopen': INV = {}; render(); $('view').scrollTop = 0; break;\n    case 'invkeys': INV = { keys: 1 }; render(); $('view').scrollTop = 0; break;\n    case 'sinvlater': INVLATER = true; render(); break;\n    case 'mstart': {\n      try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (err) {}\n      const r = await act('menage', { op: 'start' }); if (r) $('view').scrollTop = 0; render(); break;\n    }\n    case 'mcancel': {\n      if (!menArm) { menArm = true; render(); break; }\n      menArm = false;\n      const r = await act('menage', { op: 'cancel' }); if (r) UI.view = 'tables'; render(); break;\n    }\n    case 'mnext': case 'mskip': {\n      try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (err) {}\n      const r = await act('menage', { op: a === 'mskip' ? 'skip' : 'next' });\n      if (r && ST.soiree && ST.soiree.menage && ST.soiree.menage.done) UI.view = 'cash';\n      render(); break;\n    }\n    case 'sinvopen': INVLATER = false; render(); $('view').scrollTop = 0; break;\n    case 'sinvsave': {\n      const items = (SINV || []).map(x => ({ n: x.n, c: String(SINVV[x.n] == null ? '' : SINVV[x.n]).replace(',', '.') }));\n      const miss = items.filter(x => x.c.trim() === '').length;\n      if (miss) { toast('Il manque ' + miss + ' produit' + (miss > 1 ? 's' : '') + '. Mets 0 s’il n’en reste plus.', true); break; }\n      const r = await act('invSave', { items });\n      if (r) { SINVV = {}; try { localStorage.removeItem('yaya-sinv'); } catch (e) {} SINV = null; INVLATER = false; }\n      render(); break;\n    }\n    case 'invcancel': INV = null; render(); break;\n    case 'invsave': {\n      if (busy) break;\n      const items = STK.list.map(x => ({ n: x.n, c: INV[x.n] })).filter(x => x.c != null && String(x.c).trim() !== '');\n      busy = true; $('busy').hidden = false;\n      try { STK = await call('stockInv', { items }); ACH = STK.achats; INV = null; toast('Inventaire enregistré (' + items.length + ' produit' + (items.length > 1 ? 's' : '') + ')'); } catch (err) { toast(errMsg(err), true); }\n      busy = false; $('busy').hidden = true; render(); break;\n    }\n    case 'prodoff': {\n      const key = 'p:' + b.dataset.row;\n      if (carArm !== key) { carArm = key; render(); break; }\n      carArm = null;\n      try { STK = await call('stockProdOff', { row: +b.dataset.row, n: b.dataset.n }); ACH = STK.achats; toast('Produit retiré du suivi'); } catch (err) { toast(errMsg(err), true); }\n      render(); break;\n    }\n    case 'goutdel': {\n      const key = 'g:' + b.dataset.row;\n      if (carArm !== key) { carArm = key; render(); break; }\n      carArm = null;\n      try { CAR = await call('goutDel', { row: +b.dataset.row, n: b.dataset.n }); toast('Goût retiré de la carte'); } catch (err) { toast(errMsg(err), true); }\n      render(); break;\n    }\n    case 'acode': {\n      if (teamArm !== 'acode') { teamArm = 'acode'; render(); break; }\n      teamArm = null;\n      try { EQ = await call('adminCode', {}); toast('Nouveau code gérant : ' + EQ.admin); } catch (err) { toast(errMsg(err), true); }\n      render(); break;\n    }\n    case 'toff': case 'tcode': {\n      const key = a + ':' + b.dataset.row;\n      if (teamArm !== key) { teamArm = key; render(); break; }\n      teamArm = null;\n      try { EQ = await call(a === 'toff' ? 'teamOff' : 'teamCode', { row: +b.dataset.row, code: b.dataset.code }); toast(a === 'toff' ? 'Code désactivé : ' + b.dataset.nom + ' ne peut plus se connecter' : 'Nouveau code créé pour ' + b.dataset.nom); }\n      catch (err) { toast(errMsg(err), true); }\n      render(); break;\n    }\n    case 'achpick': achApply(b.dataset.n); break;\n    case 'achpickgo': closeSheet(); achApply(b.dataset.n); { const f = $('achform'); if (f) f.requestSubmit(); } break;\n    case 'achkeep': FORM._keep = true; closeSheet(); { const f = $('achform'); if (f) f.requestSubmit(); } break;\n    case 'achall': ACHALL = !ACHALL; render(); break;\n    case 'achlink': { MERGE = { from: b.dataset.n, to: null }; const s1 = achSuggest(MERGE.from, 1)[0]; if (s1 && s1.s >= .5) MERGE.to = s1.n; drawMerge(); break; }\n    case 'mergeto': MERGE.to = b.dataset.n; drawMerge(); break;\n    case 'mergeok': {\n      if (!MERGE || !MERGE.to) break;\n      busy = true; $('busy').hidden = false;\n      try { ACH = await call('achatMerge', { from: MERGE.from, to: MERGE.to }); toast('« ' + MERGE.from + ' » rattaché à ' + MERGE.to); MERGE = null; closeSheet(); try { STK = await call('stock', {}); ACH = STK.achats; } catch (e2) {} }\n      catch (err) { toast(errMsg(err), true); }\n      busy = false; $('busy').hidden = true; render(); break;\n    }\n    case 'achdel': {\n      const row = +b.dataset.row;\n      if (delArm !== row) { delArm = row; render(); break; }\n      delArm = null;\n      try { ACH = await call('achatDel', { row, saisi: +b.dataset.saisi }); toast('Achat supprimé'); } catch (err) { toast(err.message, true); }\n      render(); break;\n    }\n    case 'mailcr': {\n      b.disabled = true; b.textContent = 'Envoi…';\n      try { const r = await call('mailSoiree', { id: b.dataset.id }); REC = r; toast(r.msg || 'Envoyé'); } catch (err) { toast(errMsg(err), true); }\n      render(); break;\n    }\n    case 'delsoiree': {\n      if (!delSoArm) { delSoArm = true; render(); break; }\n      delSoArm = false;\n      try { REC = await call('deleteSoiree', { id: b.dataset.id }); toast('Soirée supprimée'); } catch (err) { toast(err.message, true); }\n      render(); break;\n    }\n    case 'openremote': {\n      if (!recArm) { recArm = true; render(); break; }\n      recArm = false;\n      const r = await act('openRemote', {});\n      if (r) await loadRecap();\n      break;\n    }\n  }\n});\ndocument.addEventListener('input', e => {\n  if (e.target.id === 'count') countVal = e.target.value;\n  if (e.target.id === 'anexpl' && ANSEL) { ANSEL.expl = e.target.value; const bt = document.querySelector('[data-a=anok]'); if (bt) bt.disabled = !anOk(); }\n  if (e.target.dataset && e.target.dataset.sinv != null) {\n    SINVV[e.target.dataset.sinv] = e.target.value;\n    try { localStorage.setItem('yaya-sinv', JSON.stringify(SINVV)); } catch (err) {}\n    const c = $('sinv-n'); if (c && SINV) c.textContent = SINV.filter(x => String(SINVV[x.n] == null ? '' : SINVV[x.n]).trim() !== '').length + ' / ' + SINV.length;\n  }\n  const cm = e.target.id && e.target.id.match(/^cnt-(\\w+)$/);\n  if (cm && cm[1] !== 'total') { COUNTS[cm[1]] = e.target.value; const t = $('cnt-total'); if (t) t.textContent = fmt(countTotal()); const ok = document.querySelector('[data-a=countok]'); if (ok) ok.disabled = !countFilled(); }\n  if (e.target.id === 'comment') commentVal = e.target.value;\n  if (e.target.id === 'tpe-total') TPEV = e.target.value;\n  if (e.target.id === 'prpour' && PRSEL) {\n    PRSEL.pour = e.target.value;\n    const btn = document.querySelector('[data-a=prok]');\n    if (btn) btn.disabled = !promoOk();\n  }\n  if (e.target.id === 'pcomment') {\n    PSEL.comment = e.target.value;\n    const btn = document.querySelector('[data-a=psave]');\n    if (btn) btn.disabled = !patronOk();\n  }\n  if (e.target.id === 't-nom') TNOM = e.target.value;\n  if (e.target.id === 'chat-in') CHATV = e.target.value;\n  if (e.target.id === 'offpour' && OFFSEL) { OFFSEL.pour = e.target.value; const bt = document.querySelector('[data-a=offok]'); if (bt) bt.disabled = !offOk(); }\n  if ((e.target.id === 'av-amount' || e.target.id === 'av-motif') && AVF) { AVF[e.target.id === 'av-amount' ? 'amount' : 'motif'] = e.target.value; const bt = document.querySelector('[data-a=avsend]'); if (bt) bt.disabled = !avOk(); }\n  const cai = e.target.id && e.target.id.match(/^cai-(\\w+)$/); if (cai) { CAF[cai[1]] = e.target.value; if (caiArm === 'save') { caiArm = null; const bt = document.querySelector('#caiform [type=submit]'); if (bt) { bt.classList.remove('armed'); bt.textContent = CAF.kind === 'retrait' ? 'J’ai récupéré cet argent' : CAF.kind === 'ajout' ? 'J’ai ajouté cette monnaie' : 'Enregistrer la sortie'; } } }\n  const cap = e.target.id && e.target.id.match(/^cap-(\\w+)$/); if (cap) CAP[cap[1]] = e.target.value;\n  if (e.target.dataset && e.target.dataset.inv != null && INV) INV[e.target.dataset.inv] = e.target.value;\n  const pf = e.target.id && e.target.id.match(/^pf-(\\w+)$/); if (pf) PFORM[pf[1]] = e.target.value;\n  const af = e.target.id && e.target.id.match(/^af-(\\w+)$/); if (af) AFORM[af[1]] = e.target.value;\n  if (e.target.id === 'gf-n') GFORM.n = e.target.value;\n  if (e.target.id === 'mlabel') MSEL.label = e.target.value;\n  const om = e.target.id && e.target.id.match(/^o-(\\w+)$/);\n  if (om && OFORM) OFORM[om[1]] = e.target.value;\n  if (e.target.id === 'c-article') CFORM.article = e.target.value;\n  if (e.target.id === 'c-detail') CFORM.detail = e.target.value;\n  const m = e.target.id && e.target.id.match(/^ach-(\\w+)$/);\n  if (m) {\n    FORM[m[1]] = e.target.value;\n    const sp = achSp();\n    const known = sp ? { cat: achCat(sp), unite: sp.unite } : ACH && ACH.produits[FORM.produit];\n    if (m[1] === 'produit') {\n      const c = $('ach-cat'), u = $('ach-unite'), h = $('ach-hint');\n      if (known) { FORM.cat = known.cat; FORM.unite = known.unite; if (c) c.value = known.cat; }\n      if (u) { u.innerHTML = achUnites(); if (known) u.value = known.unite; }\n      if (h) h.textContent = achHint();\n      const g = $('ach-sugg'); if (g) g.innerHTML = achSuggHTML();\n    }\n  }\n  if (e.target.id === 'mergesel' && MERGE) { MERGE.to = e.target.value; drawMerge(); }\n});\ndocument.addEventListener('change', async e => {\n  const m = e.target.id && e.target.id.match(/^ach-(\\w+)$/); if (m) FORM[m[1]] = e.target.value;\n  const pf = e.target.id && e.target.id.match(/^pf-(\\w+)$/); if (pf) { PFORM[pf[1]] = e.target.value; if (pf[1] === 'type') { PFORM.unite = e.target.value === 'Goût' ? 'kg' : 'unité'; render(); } }\n  // Stock : prix unitaire noté à la main (en attendant un achat saisi).\n  const cr = e.target.dataset && e.target.dataset.coutRow;\n  if (cr) {\n    try { STK = await call('stockCout', { row: +cr, n: e.target.dataset.coutN, cout: e.target.value }); ACH = STK.achats; toast('Prix enregistré · coûts et marges recalculés'); } catch (err) { toast(errMsg(err), true); }\n    render(); return;\n  }\n  // Carte : prix ou « en vente » modifiés, enregistrés tout de suite.\n  const row = e.target.dataset && e.target.dataset.crow;\n  if (row) {\n    const line = e.target.closest('.cline'), price = line.querySelector('[data-k=p]').value, actif = line.querySelector('[data-k=a]').checked;\n    try { CAR = await call('carteSave', { row: +row, n: e.target.dataset.cn, p: price, actif }); toast('Enregistré · visible sur l’appli service d’ici une minute'); } catch (err) { toast(errMsg(err), true); }\n    render();\n  }\n});\ndocument.addEventListener('submit', async e => {\n  if (e.target.id === 'pform' || e.target.id === 'aform' || e.target.id === 'gform') {\n    e.preventDefault();\n    if (busy) return;\n    busy = true; $('busy').hidden = false;\n    try {\n      if (e.target.id === 'pform') { STK = await call('stockProd', { ...PFORM }); ACH = STK.achats; toast('Produit suivi : ' + PFORM.n); Object.assign(PFORM, { n: '', seuil: '' }); }\n      if (e.target.id === 'aform') { CAR = await call('carteAdd', { ...AFORM }); toast('Ajouté à la carte : ' + AFORM.n); Object.assign(AFORM, { n: '', p: '', sub: '' }); }\n      if (e.target.id === 'gform') { CAR = await call('goutAdd', { ...GFORM }); toast('Goût ajouté (et suivi en stock) : ' + GFORM.n); GFORM.n = ''; }\n    } catch (err) { toast(errMsg(err), true); }\n    busy = false; $('busy').hidden = true;\n    render(); return;\n  }\n  if (e.target.id === 'oform' || e.target.id === 'tform') {\n    e.preventDefault();\n    if (busy) return;\n    busy = true; $('busy').hidden = false;\n    try {\n      if (e.target.id === 'oform') { OBJ = await call('setObjectifs', { ...OFORM }); OFORM = objForm(OBJ); toast('Objectifs enregistrés'); }\n      else { const nom = TNOM.trim(); EQ = await call('teamAdd', { nom }); TNOM = ''; const p = EQ.actifs.find(x => x.nom.toLowerCase() === nom.toLowerCase()); toast(p ? 'Code de ' + p.nom + ' : ' + p.code : 'Personne ajoutée'); }\n    } catch (err) { toast(errMsg(err), true); }\n    busy = false; $('busy').hidden = true;\n    render(); return;\n  }\n  if (e.target.id === 'chatform') {\n    e.preventDefault();\n    const txt = CHATV.trim();\n    if (!txt) return;\n    const r = await act('chatSend', { txt });\n    if (r) { CHATV = ''; const ta = $('chat-in'); if (ta) ta.value = ''; }\n    render(); const v = $('view'); if (v) v.scrollTop = v.scrollHeight; return;\n  }\n  if (e.target.id === 'caiform' || e.target.id === 'caipform') {\n    e.preventDefault();\n    if (busy) return;\n    if (e.target.id === 'caiform') {\n      if (!(+String(CAF.amount).replace(',', '.') > 0)) { toast('Indique le montant.', true); return; }\n      if (caiArm !== 'save') { caiArm = 'save'; render(); return; }\n      caiArm = null;\n    }\n    busy = true; $('busy').hidden = false;\n    try {\n      if (e.target.id === 'caiform') { CAI = await call('caisseMove', { kind: CAF.kind, amount: String(CAF.amount).replace(',', '.'), motif: CAF.motif, date: CAF.date || new Date().toLocaleDateString('sv-SE') }); Object.assign(CAF, { amount: '', motif: '', date: '' }); }\n      else { CAI = await call('caisseParams', { fond: CAP.fond == null ? '' : CAP.fond, seuil: CAP.seuil == null ? '' : CAP.seuil }); CAP.fond = null; CAP.seuil = null; }\n      toast(CAI.msg || 'Enregistré');\n    } catch (err) { toast(errMsg(err), true); }\n    busy = false; $('busy').hidden = true;\n    render(); return;\n  }\n  if (e.target.id === 'cform') {\n    e.preventDefault();\n    if (busy) return;\n    busy = true; $('busy').hidden = false;\n    try { COURSES = await call('courseAdd', { ...CFORM }); toast('Ajouté à la liste : ' + CFORM.article); CFORM.article = ''; CFORM.detail = ''; }\n    catch (err) { toast(err.message, true); }\n    busy = false; $('busy').hidden = true;\n    render(); return;\n  }\n  if (e.target.id !== 'achform') return;\n  e.preventDefault();\n  if (busy) return;\n  if (!achSp() && !FORM._keep && achSuggest(FORM.produit, 1).some(x => x.s >= .5)) { drawAchConfirm(); return; }\n  delete FORM._keep;\n  busy = true; $('busy').hidden = false;\n  try {\n    ACH = await call('achatAdd', { ...FORM });\n    toast('Achat ajouté : ' + FORM.produit + (MTAB === 'stock' && STK && STK.list.some(x => x.n === FORM.produit) ? ' · stock mis à jour' : ''));\n    if (MTAB === 'stock') { try { STK = await call('stock', {}); ACH = STK.achats; } catch (e2) {} }\n    Object.assign(FORM, { produit: '', qty: '', total: '' });\n  } catch (err) { toast(err.message, true); }\n  busy = false; $('busy').hidden = true;\n  render();\n});\ndocument.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });\n\n// ---- Synchronisation (iPhone, iPad, gérant) ----\nfunction newVersion() {}\nsetInterval(async () => {\n  if (document.hidden || busy || flushing) return;\n  if (ROLE === 'gerant') { refreshRecap(); return; }\n  if ((CODES && !ME) || logging) return;\n  try {\n    const r = await call('state', { rev: ST.rev });\n    newVersion(r);\n    if (r && r.state && !busy && !flushing) { setST(r.state); newMsgToast(); if (!$('scrim') && !arm) bgRender(); else updBadges(); }\n    if (r && r.dr && r.dr !== D.params.dataRev) reloadData();\n  } catch (e) { if (/CODE\\|/.test(String(e && e.message))) { toast(errMsg(e), true); render(); } }\n}, ROLE === 'gerant' ? 30000 : 8000);\n\nsetInterval(() => { if (ROLE !== 'gerant' && !document.hidden && !$('scrim') && !busy && (UI.view === 'tables' || UI.view === 'order')) bgRender(); }, 60000);\n\n// Gérant : messages et demandes de l'équipe toutes les 15 s (sans recharger tout le récap).\nsetInterval(async () => {\n  if (ROLE !== 'gerant' || document.hidden || busy) return;\n  try {\n    const r = await call('state', { rev: ST.rev });\n    newVersion(r);\n    if (r && r.state && !busy) {\n      const p0 = pendDems().length; setST(r.state); newMsgToast();\n      if (pendDems().length > p0) toast('Nouvelle demande à valider');\n      if (!$('scrim') && (MTAB === 'msg' || MTAB === 'recap')) bgRender(); else updBadges();\n      refreshRecap();\n    }\n  } catch (e) {}\n}, 8000);\n\nif (Q.length) { setST(ST); updQ(); }\nif (ROLE === 'gerant' && BOOT.ana) {\n  const ab = $('anaBtn');\n  if (ab) {\n    ab.href = BOOT.ana; ab.hidden = false;\n    // Dans l'app Gérant, les analyses s'ouvrent par-dessus, sans quitter l'app.\n    let inShell = false; shellHello(() => { inShell = true; });\n    ab.addEventListener('click', e => { if (!inShell) return; e.preventDefault(); try { window.top.postMessage({ yaya: 'open', url: BOOT.ana }, '*'); } catch (x) {} });\n  }\n}\nnewMsgToast();\nif (ROLE === 'gerant') REC = oldRec();\nrender();\nif (ROLE === 'gerant') loadRecap();\nelse if (CODES && ME) login(ME.pin, true);\n\n</script>\n<?!= webUi_() ?>\n</body>\n</html>\n";
var ANALYSES_HTML = "<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<meta name=\"theme-color\" content=\"#161513\">\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Manrope:wght@400;600;700&family=Marcellus&display=swap\">\n<style>\nhtml,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}\n/* YÄYA Analyses · nuit par défaut (encre, laiton), jour en option. Même famille visuelle que l'appli v22. */\n:root{\n  --bg:#12110F; --panel:#1B1A17; --raise:#23211D; --line:#322F29; --fg:#F1EEE6; --muted:#A39E92; --faint:#6E695F;\n  --brass:#D9BB7C; --brass-2:#9C7B3F; --ember:#E9916A; --sage:#86C7A0; --mist:#8FA7C9; --ink:#0C0B0A;\n  --ui:\"Manrope\",system-ui,-apple-system,\"Segoe UI\",sans-serif; --title:\"Fraunces\",\"Marcellus\",Georgia,serif; --logo:\"Marcellus\",Georgia,serif;\n  --r:18px; color-scheme:dark;\n}\n:root[data-theme=\"light\"]{\n  --bg:#F4F2EC; --panel:#FFFFFF; --raise:#FAF8F3; --line:#E4E0D6; --fg:#1B1A17; --muted:#7C7970; --faint:#B4AFA4;\n  --brass:#96742F; --brass-2:#C9A964; --ember:#B4532A; --sage:#3B7556; --mist:#4F6F9A; --ink:#FFFFFF; color-scheme:light;\n}\n*{box-sizing:border-box}\nhtml,body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--ui);font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}\nbutton{font:inherit;color:inherit;background:none;border:0;cursor:pointer}\nbutton:focus-visible{outline:2px solid var(--brass);outline-offset:2px}\n.wrap{max-width:1180px;margin:0 auto;padding:0 max(16px,env(safe-area-inset-left,0px)) 48px}\nheader.top{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 90%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}\n.bar{max-width:1180px;margin:0 auto;padding:12px max(16px,env(safe-area-inset-left,0px));display:flex;align-items:center;gap:14px;flex-wrap:wrap}\n.brand{font-family:var(--logo);font-size:21px;letter-spacing:.24em;white-space:nowrap}\n.brand b{font-weight:400;color:var(--brass)}\n.brand small{font-family:var(--ui);letter-spacing:0;font-size:13px;color:var(--muted);margin-left:10px;font-weight:600}\n.grow{flex:1}\n.upd{font-size:12.5px;color:var(--muted)}\n.icon{border:1px solid var(--line);border-radius:99px;padding:6px 12px;font-size:12.5px;font-weight:600;background:var(--panel)}\n.tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;max-width:1180px;margin:0 auto;padding:0 max(16px,env(safe-area-inset-left,0px)) 10px}\n.tabs::-webkit-scrollbar{display:none}\n.tabs button{white-space:nowrap;padding:9px 16px;border-radius:12px;font-weight:600;color:var(--muted)}\n.tabs button.on{background:var(--fg);color:var(--bg)}\n.seg,.tabs{position:relative}\n.dates{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.dates label{display:flex;gap:6px;align-items:center;font-size:13px;font-weight:600;color:var(--muted)}\n.dates input{font:inherit;font-size:16px;color:var(--fg);background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:6px 8px}\n.filters{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:18px 0 6px}\n.seg{display:flex;gap:3px;background:var(--panel);border:1px solid var(--line);border-radius:13px;padding:3px;flex-wrap:wrap}\n.seg button{padding:7px 11px;border-radius:10px;font-size:13px;font-weight:600;color:var(--muted)}\n.seg button.on{background:var(--raise);color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}\n.flabel{font-size:12.5px;color:var(--muted);margin-right:-10px}\n.range{font-size:13px;color:var(--muted);margin:2px 0 16px}\n.range b{color:var(--fg);font-weight:600}\nh1{font-family:var(--title);font-weight:500;font-size:32px;letter-spacing:-.01em;margin:6px 0 4px}\nh2{font-size:15px;font-weight:700;margin:0}\n.sub{font-size:12.5px;color:var(--muted);margin-top:2px}\n.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:14px 0 18px}\n.kpi{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:14px 16px}\n.kpi span{display:block;font-size:12.5px;color:var(--muted);font-weight:600}\n.kpi b{display:block;font-family:var(--title);font-weight:500;font-size:28px;line-height:1.15;margin-top:6px;letter-spacing:-.01em;font-variant-numeric:lining-nums}\n.kpi i{font-style:normal;font-size:12.5px;font-weight:700}\n.kpi i.up{color:var(--sage)}.kpi i.down{color:var(--ember)}.kpi i.flat{color:var(--muted)}\n.kpi small{font-size:12px;color:var(--muted)}\n.kpi.hero{grid-column:span 2;position:relative;overflow:hidden;isolation:isolate;background:linear-gradient(160deg,#211F1B,#141311);border-color:#39352D;color:#F2EFE7}\n.kpi.hero::before{content:\"\";position:absolute;inset:-50% -20%;z-index:-1;background:radial-gradient(36% 50% at 85% 20%,rgba(217,187,124,.28),transparent 70%),radial-gradient(30% 40% at 10% 100%,rgba(233,145,106,.16),transparent 72%);filter:blur(16px)}\n.kpi.hero b{font-size:44px;color:#D9BB7C}\n.kpi.hero span,.kpi.hero small{color:#ABA598}\n@media (max-width:520px){.kpi.hero{grid-column:1 / -1}.kpi.hero b{font-size:40px}h1{font-size:27px}.kpis{grid-template-columns:1fr 1fr}.kpi b{font-size:24px}\n  .upd{display:none}.filters{flex-direction:column;align-items:stretch;gap:8px}.seg{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.seg::-webkit-scrollbar{display:none}.seg button{white-space:nowrap}\n  .heat{font-size:10px}.heat .c{height:28px}.hrow{grid-template-columns:minmax(80px,42%) 1fr auto}}\n.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}\n.card{grid-column:span 12;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:16px 16px 14px;min-width:0}\n.card.half{grid-column:span 6}.card.third{grid-column:span 4}.card.two{grid-column:span 8}\n@media (max-width:900px){.card.half,.card.third,.card.two{grid-column:span 12}}\n.chead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:12px;flex-wrap:wrap}\n.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted)}\n.legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:-1px}\nsvg{display:block;width:100%;height:auto;overflow:visible}\nsvg text{font-family:var(--ui);fill:var(--muted);font-size:11px}\n.gridl{stroke:var(--line);stroke-width:1}\n.hit{cursor:pointer}\n.hit:hover rect.b,.hit.sel rect.b{filter:brightness(1.15)}\n.hl{display:grid;gap:9px}\n.hrow{display:grid;grid-template-columns:minmax(90px,38%) 1fr auto;gap:10px;align-items:center;font-size:13.5px;cursor:pointer;border-radius:8px;padding:2px 4px;margin:0 -4px}\n.hrow:hover,.hrow.sel{background:var(--raise)}\n.hrow .n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.hrow .n small{color:var(--muted);margin-left:6px}\n.hrow .t{height:10px;border-radius:5px;background:var(--raise);overflow:hidden}\n.hrow .t i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,var(--brass-2),var(--brass))}\n.hrow .v{font-variant-numeric:tabular-nums;font-weight:700;font-size:13px;text-align:right;min-width:62px}\n.heat{display:grid;gap:3px;font-size:11px;color:var(--muted)}\n.heat .c{border-radius:6px;height:34px;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;color:transparent;cursor:default}\n.heat .c:hover{outline:1px solid var(--brass);color:var(--fg)}\n.heat .h,.heat .d{display:flex;align-items:center;justify-content:center;font-weight:600}\n.cmp{display:grid;grid-template-columns:1fr auto auto;gap:6px 16px;font-size:13.5px}\n.cmp .hd{font-size:12px;color:var(--muted);font-weight:600}\n.cmp .num{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}\ntable.t{width:100%;border-collapse:collapse;font-size:13.5px}\ntable.t th{text-align:left;font-size:12px;color:var(--muted);font-weight:600;padding:6px 6px 8px;border-bottom:1px solid var(--line)}\ntable.t td{padding:9px 6px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}\ntable.t td.r,table.t th.r{text-align:right}\n.chips{display:flex;flex-wrap:wrap;gap:6px}\n.chip{border:1px solid var(--line);border-radius:99px;padding:5px 11px;font-size:12.5px;color:var(--muted)}\n.empty{color:var(--muted);font-size:13.5px;padding:18px 0}\n.note{font-size:12.5px;color:var(--muted);margin-top:10px}\n.pos{color:var(--sage)}.neg{color:var(--ember)}\n#tip{position:fixed;z-index:50;pointer-events:none;background:var(--ink);color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:7px 10px;font-size:12.5px;line-height:1.35;box-shadow:0 14px 30px -16px rgba(0,0,0,.7);max-width:240px;opacity:0;transition:opacity .1s}\n:root[data-theme=\"light\"] #tip{background:#1B1A17;color:#F2EFE7;border-color:#1B1A17}\n#tip.on{opacity:1}\n#tip b{font-weight:700}\n.load{padding:80px 0;text-align:center;color:var(--muted)}\n.load b{display:block;font-family:var(--title);font-weight:500;font-size:26px;color:var(--fg);margin-bottom:6px}\n.sel-note{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;background:var(--raise);border:1px solid var(--line);border-radius:99px;padding:4px 6px 4px 12px}\n.sel-note button{border-radius:99px;padding:2px 8px;background:var(--panel);border:1px solid var(--line);font-size:12px}\n@media (prefers-reduced-motion:no-preference){.kpi.hero::before{animation:fumee 24s ease-in-out infinite alternate}@keyframes fumee{to{transform:translate3d(4%,-3%,0) scale(1.1)}}}\n/* v33 · rien ne glisse sur le côté */\nhtml,body{overflow-x:hidden;overscroll-behavior-x:none;max-width:100%}\n.ldbar{width:min(240px,70%);height:4px;border-radius:4px;background:var(--line);overflow:hidden;margin:14px auto 0}\n.ldbar i{display:block;height:100%;width:0;background:var(--brass,var(--gold,#9C7B3F));transition:width .2s linear}\n#ldp{font-variant-numeric:tabular-nums;font-size:44px}\n</style>\n</head>\n<body>\n<script>const BOOT = <?!= bootJson ?>;</script>\n<header class=\"top\">\n  <div class=\"bar\"><button class=\"icon\" id=\"back\" hidden>← Gérant</button><div class=\"brand\">YÄYA<small>Analyses</small></div><div class=\"grow\"></div><span class=\"upd\" id=\"upd\"></span>\n  <button class=\"icon\" id=\"theme\" aria-label=\"Changer de thème\">Jour</button><button class=\"icon\" id=\"refresh\">Actualiser</button></div>\n  <nav class=\"tabs\" id=\"tabs\"></nav>\n</header>\n<main class=\"wrap\" id=\"main\"><div class=\"load\" id=\"ld0\"><b id=\"ldp\">0 %</b>Chargement des analyses…<div class=\"ldbar\"><i id=\"ldi\"></i></div></div></main>\n<div id=\"tip\"></div>\n<script>\n// v33 · chargement en pourcentage (durée habituelle apprise sur cet appareil ; jamais 100 % avant les chiffres)\n(function () {\n  var K = 'yaya-ld-ana', avg = 3000, t0 = Date.now(); try { avg = +localStorage.getItem(K) || 3000; } catch (e) {}\n  var tick = setInterval(function () {\n    var box = document.getElementById('ld0');\n    if (!box) { clearInterval(tick); var d = Date.now() - t0; if (d > 80 && d < 60000) { try { localStorage.setItem(K, String(Math.round(avg * 0.6 + d * 0.4))); } catch (e) {} } return; }\n    var p = Math.min(97, Math.round(100 * (1 - Math.exp(-(Date.now() - t0) / (avg / 2)))));\n    document.getElementById('ldp').textContent = p + ' %'; document.getElementById('ldi').style.width = p + '%';\n  }, 150);\n})();\n// v32 · appli figée : pas de zoom (pincement, double-tap) sur iPhone et iPad.\n(function () { var no = function (e) { e.preventDefault(); };\n  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, no, { passive: false }); });\n  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });\n})();\n// App YÄYA : dire à l'app la hauteur réellement reçue et la couleur de fond (elle ajuste son cadre et sa barre d'état).\nfunction tellShell() {\n  if (window.top === window) return;\n  try { const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(); window.top.postMessage({ yaya: 'vp', h: window.innerHeight, bg }, '*'); } catch (e) {}\n}\nwindow.addEventListener('resize', () => { clearTimeout(tellShell.t); tellShell.t = setTimeout(tellShell, 120); });\ntry { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', tellShell); } catch (e) {}\nsetTimeout(tellShell, 50); setTimeout(tellShell, 1200);\n// App YÄYA (écran d'accueil) : la page qui l'entoure répond « hello ».\nfunction shellHello(cb) {\n  if (window.top === window) return;\n  const id = Math.random().toString(36).slice(2);\n  const on = e => { const m = e.data || {}; if (e.source !== window.top || m.yaya !== 'hello' || m.id !== id) return; window.removeEventListener('message', on); cb(); };\n  window.addEventListener('message', on);\n  try { window.top.postMessage({ yaya: 'hello?', id }, '*'); } catch (e) {}\n}\nshellHello(() => { const b = document.getElementById('back'); b.hidden = false; b.onclick = () => { try { window.top.postMessage({ yaya: 'close' }, '*'); } catch (e) {} }; });\n// ===== Données =====\nconst KEY = BOOT.key, CK = 'yaya-analyses-' + KEY.slice(0, 6);\nlet A = null, PAGE = 'ca', PER = '30', DOW = null, MATCH = 'all', PSEL = null, PMODE = 'ca', CFROM = '', CTO = '';\ntry { const c = JSON.parse(localStorage.getItem(CK) || 'null'); if (c && c.soirees) A = c; } catch (e) {}\ntry { const p = JSON.parse(localStorage.getItem(CK + '-ui') || '{}'); PAGE = p.page || PAGE; PER = p.per || PER; CFROM = p.cf || ''; CTO = p.ct || ''; } catch (e) {}\nconst saveUI = () => { try { localStorage.setItem(CK + '-ui', JSON.stringify({ page: PAGE, per: PER, cf: CFROM, ct: CTO })); } catch (e) {} };\nconst theme = (() => { try { return localStorage.getItem('yaya-analyses-theme') || 'dark'; } catch (e) { return 'dark'; } })();\nsetTheme(theme);\nfunction setTheme(t) { document.documentElement.dataset.theme = t; const b = document.getElementById('theme'); if (b) b.textContent = t === 'dark' ? 'Jour' : 'Nuit'; try { localStorage.setItem('yaya-analyses-theme', t); } catch (e) {} if (typeof tellShell === 'function') setTimeout(tellShell, 0); }\nfunction load() {\n  document.getElementById('upd').textContent = 'Mise à jour…';\n  google.script.run.withSuccessHandler(r => {\n    A = r; try { localStorage.setItem(CK, JSON.stringify(r)); } catch (e) {}\n    render();\n  }).withFailureHandler(e => {\n    document.getElementById('upd').textContent = 'Hors ligne · derniers chiffres gardés';\n    if (!A) document.getElementById('main').innerHTML = `<div class=\"load\"><b>Impossible de charger</b>${esc(String(e && e.message || e))}<br>Vérifie le réseau puis touche « Actualiser ».</div>`;\n  }).api(KEY, 'analyses', {});\n}\n\n// ===== Outils =====\nconst esc = s => String(s == null ? '' : s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));\nconst r2 = v => Math.round((+v || 0) * 100) / 100;\nconst eur = (v, dec) => { const n = r2(v), a = Math.abs(n), s = (dec === false || a >= 1000 ? Math.round(a).toString() : a.toFixed(2).replace(/\\.00$/, '')).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' '); return (n < 0 ? '−' : '') + s + ' €'; };\nconst num = v => String(Math.round(v * 10) / 10).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ');\nconst pct = v => (Math.round(v * 10) / 10).toString().replace('.', ',') + ' %';\nconst sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);\nconst DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'], DS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];\nconst ORDER = [1, 2, 3, 4, 5, 6, 0];\nconst dlab = ts => { const d = new Date(ts); return DS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); };\nconst dlong = ts => new Date(ts).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });\n// Heure de service : 17 h → 2 h (minuit et après comptent dans la même soirée).\nconst HOURS = [16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3];\nconst hslot = ts => new Date(ts).getHours();\nfunction delta(cur, prev, inv) {\n  if (prev == null || !isFinite(prev) || prev === 0) return '';\n  const d = (cur - prev) / Math.abs(prev) * 100, good = inv ? d < 0 : d > 0;\n  if (Math.abs(d) < 1) return '<i class=\"flat\">stable</i>';\n  return `<i class=\"${good ? 'up' : 'down'}\">${d > 0 ? '▲' : '▼'} ${pct(Math.abs(d))}</i>`;\n}\n\n// ===== Période =====\nfunction bounds() {\n  const now = new Date(A.now), d0 = new Date(now); d0.setHours(12, 0, 0, 0);\n  const day = 86400000; let from, to = A.now + day;\n  // Semaines du lundi au dimanche (une soirée compte pour le jour où elle a ouvert).\n  const midnight = t => { const x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); };\n  const monday = midnight(now.getTime() - ((now.getDay() + 6) % 7) * day), tomorrow = midnight(now.getTime() + day + 3600000);\n  const ymd = v => { const m = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : null; };\n  if (PER === 'sem') return { from: monday, to: tomorrow, pfrom: monday - 7 * day, pto: tomorrow - 7 * day };\n  if (PER === 'semp') return { from: midnight(monday - 6.5 * day), to: monday, pfrom: midnight(monday - 13.5 * day), pto: midnight(monday - 6.5 * day) };\n  if (PER === 'perso') {\n    let f = ymd(CFROM), t = ymd(CTO);\n    if (f == null) f = midnight(now.getTime() - 6 * day);\n    if (t == null) t = midnight(now.getTime());\n    if (t < f) { const x = f; f = t; t = x; }\n    const tt = midnight(t + day + 3600000), len = tt - f;\n    return { from: f, to: tt, pfrom: f - len, pto: f };\n  }\n  if (PER === 'mois') { from = new Date(now.getFullYear(), now.getMonth(), 1).getTime(); }\n  else if (PER === 'prec') { from = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(); to = new Date(now.getFullYear(), now.getMonth(), 1).getTime(); }\n  else if (PER === 'tout') { from = 0; }\n  else from = d0.getTime() - (+PER) * day;\n  if (PER === 'tout') return { from, to, pfrom: null, pto: null };\n  const len = to - from;\n  return PER === 'prec' || PER === 'mois'\n    ? { from, to, pfrom: new Date(new Date(from).getFullYear(), new Date(from).getMonth() - 1, 1).getTime(), pto: from }\n    : { from, to, pfrom: from - len, pto: from };\n}\n// Soirée → objet lisible.\nconst SO = r => ({ id: r[0], open: r[1], close: r[2], ca: r[3], cb: r[4], esp: r[5], tables: r[6], ecart: r[7], fid: r[8], patron: r[9], annul: r[10], pers: r[11], match: r[12], retard: r[13], tpe: r[14] });\nfunction pick(from, to) {\n  return A.soirees.map(SO).filter(s => s.open >= from && s.open < to && (DOW == null || new Date(s.open).getDay() === DOW) && (MATCH === 'all' || (MATCH === 'match' ? !!s.match : !s.match))).sort((a, b) => a.open - b.open);\n}\nfunction ctx() {\n  const b = bounds(), cur = pick(b.from, b.to), pv = b.pfrom == null ? null : pick(b.pfrom, b.pto), prev = pv && pv.length ? pv : null;\n  const ids = new Set(cur.map(s => s.id)), pids = new Set((prev || []).map(s => s.id));\n  return { b, cur, prev, ids, pids,\n    lignes: A.lignes.filter(l => ids.has(l[0])), plignes: A.lignes.filter(l => pids.has(l[0])),\n    ventes: A.ventes.filter(v => ids.has(v[0])), annul: A.annul.filter(a => ids.has(a[0])), pannul: A.annul.filter(a => pids.has(a[0])),\n    point: A.pointages.filter(p => ids.has(p[0])) };\n}\nconst tots = ss => { const ca = sum(ss, s => s.ca), pers = sum(ss, s => s.pers), tb = sum(ss, s => s.tables); return { n: ss.length, ca, cb: sum(ss, s => s.cb), esp: sum(ss, s => s.esp), pers, tb, moy: ss.length ? ca / ss.length : 0, pp: pers ? ca / pers : 0, pt: tb ? ca / tb : 0, pertes: sum(ss, s => s.annul + s.fid) }; };\n\n// ===== Graphiques (SVG faits main) =====\nfunction niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => m <= x) || 10) * p; }\n// Barres verticales : séries empilées, ligne d'objectif, survol et clic.\nfunction bars(items, o) {\n  o = o || {};\n  const W = o.w || 760, H = o.h || 240, pl = 44, pb = 28, pt = 12, n = items.length || 1;\n  const L = o.line || [];\n  const vmax = niceMax(Math.max(o.goal || 0, ...L, ...items.map(it => sum(it.parts.map(p => Math.max(0, p.v))))));\n  const vmin = o.signed ? -niceMax(Math.max(0, ...L.map(v => -v), ...items.map(it => -Math.min(0, sum(it.parts.map(p => p.v)))))) : 0;\n  const y = v => pt + (H - pt - pb) * (1 - (v - vmin) / (vmax - vmin || 1));\n  const bw = (W - pl) / n, gap = Math.min(bw * 0.28, 10);\n  let g = '';\n  for (let i = 0; i <= 4; i++) { const v = vmin + (vmax - vmin) * i / 4; g += `<line class=\"gridl\" x1=\"${pl}\" x2=\"${W}\" y1=\"${y(v)}\" y2=\"${y(v)}\"/><text x=\"${pl - 6}\" y=\"${y(v) + 4}\" text-anchor=\"end\">${o.fmt ? o.fmt(v) : Math.round(v)}</text>`; }\n  if (o.signed) g += `<line x1=\"${pl}\" x2=\"${W}\" y1=\"${y(0)}\" y2=\"${y(0)}\" stroke=\"var(--faint)\"/>`;\n  const every = Math.ceil(n / (o.maxLabels || 14));\n  items.forEach((it, i) => {\n    const x = pl + i * bw + gap / 2, w = Math.max(2, bw - gap);\n    let acc = 0, rects = '';\n    it.parts.forEach(p => {\n      if (o.signed) { const v = p.v; rects += `<rect class=\"b\" x=\"${x}\" y=\"${Math.min(y(v), y(0))}\" width=\"${w}\" height=\"${Math.max(1, Math.abs(y(v) - y(0)))}\" rx=\"${Math.min(4, w / 3)}\" fill=\"${v >= 0 ? (p.c || 'var(--sage)') : 'var(--ember)'}\"/>`; return; }\n      const y1 = y(acc + p.v), y0 = y(acc); acc += p.v;\n      rects += `<rect class=\"b\" x=\"${x}\" y=\"${y1}\" width=\"${w}\" height=\"${Math.max(0, y0 - y1)}\" rx=\"${Math.min(4, w / 3)}\" fill=\"${p.c}\"/>`;\n    });\n    if (it.mark) rects += `<rect x=\"${x - 1.5}\" y=\"${y(acc) - 1.5}\" width=\"${w + 3}\" height=\"${Math.max(0, y(0) - y(acc)) + 3}\" rx=\"5\" fill=\"none\" stroke=\"var(--brass)\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>`;\n    const lab = i % every === 0 ? `<text x=\"${x + w / 2}\" y=\"${H - 8}\" text-anchor=\"middle\">${esc(it.label)}</text>` : '';\n    g += `<g class=\"hit ${o.selKey != null && it.key === o.selKey ? 'sel' : ''}\" data-tip=\"${esc(it.tip)}\" ${o.click ? `data-click=\"${o.click}\" data-key=\"${esc(it.key)}\"` : ''}><rect x=\"${pl + i * bw}\" y=\"${pt}\" width=\"${bw}\" height=\"${H - pt - pb}\" fill=\"transparent\"/>${rects}${lab}</g>`;\n  });\n  if (o.goal) g += `<line x1=\"${pl}\" x2=\"${W}\" y1=\"${y(o.goal)}\" y2=\"${y(o.goal)}\" stroke=\"var(--brass)\" stroke-dasharray=\"5 4\" stroke-width=\"1.3\"/><text x=\"${W}\" y=\"${y(o.goal) - 5}\" text-anchor=\"end\" style=\"fill:var(--brass)\">${esc(o.goalLabel || 'objectif')}</text>`;\n  if (o.line) {\n    const pts = o.line.map((v, i) => [pl + i * bw + bw / 2, y(v)]);\n    g += `<polyline points=\"${pts.map(p => p.join(',')).join(' ')}\" fill=\"none\" stroke=\"var(--mist)\" stroke-width=\"2\" stroke-linejoin=\"round\"/>` + pts.map(p => `<circle cx=\"${p[0]}\" cy=\"${p[1]}\" r=\"2.6\" fill=\"var(--mist)\"/>`).join('');\n  }\n  return `<svg viewBox=\"0 0 ${W} ${H}\" role=\"img\" aria-label=\"${esc(o.aria || '')}\">${g}</svg>`;\n}\n// Courbe cumulée (mois en cours contre objectif).\nfunction curve(series, o) {\n  const W = 760, H = o.h || 220, pl = 44, pb = 26, pt = 12, n = o.n;\n  const vmax = niceMax(Math.max(o.goal || 0, ...series.flatMap(s => s.v)));\n  const x = i => pl + (W - pl) * (i / Math.max(1, n - 1)), y = v => pt + (H - pt - pb) * (1 - v / vmax);\n  let g = '';\n  for (let i = 0; i <= 4; i++) { const v = vmax * i / 4; g += `<line class=\"gridl\" x1=\"${pl}\" x2=\"${W}\" y1=\"${y(v)}\" y2=\"${y(v)}\"/><text x=\"${pl - 6}\" y=\"${y(v) + 4}\" text-anchor=\"end\">${eur(v, false)}</text>`; }\n  [1, 8, 15, 22, n].forEach(d => { g += `<text x=\"${x(d - 1)}\" y=\"${H - 6}\" text-anchor=\"middle\">${d}</text>`; });\n  if (o.goal) g += `<line x1=\"${x(0)}\" y1=\"${y(0)}\" x2=\"${x(n - 1)}\" y2=\"${y(o.goal)}\" stroke=\"var(--brass)\" stroke-dasharray=\"5 4\" stroke-width=\"1.3\"/><text x=\"${x(n - 1)}\" y=\"${y(o.goal) - 6}\" text-anchor=\"end\" style=\"fill:var(--brass)\">objectif ${eur(o.goal, false)}</text>`;\n  series.forEach(s => {\n    const pts = s.v.map((v, i) => [x(i), y(v)]);\n    if (s.area) g += `<path d=\"M${x(0)},${y(0)} L${pts.map(p => p.join(',')).join(' L')} L${pts[pts.length - 1][0]},${y(0)} Z\" fill=\"${s.c}\" opacity=\".12\"/>`;\n    g += `<polyline points=\"${pts.map(p => p.join(',')).join(' ')}\" fill=\"none\" stroke=\"${s.c}\" stroke-width=\"${s.w || 2.2}\" ${s.dash ? 'stroke-dasharray=\"4 4\"' : ''} stroke-linejoin=\"round\"/>`;\n    const last = pts[pts.length - 1]; if (last && s.dot) g += `<circle cx=\"${last[0]}\" cy=\"${last[1]}\" r=\"4\" fill=\"${s.c}\"/>`;\n  });\n  return `<svg viewBox=\"0 0 ${W} ${H}\">${g}</svg>`;\n}\n// Liste à barres horizontales (classements).\nfunction hlist(rows, o) {\n  o = o || {};\n  if (!rows.length) return '<p class=\"empty\">Rien sur cette période.</p>';\n  const max = Math.max(...rows.map(r => r.v)) || 1;\n  return `<div class=\"hl\">${rows.map(r => `<div class=\"hrow ${o.sel && o.sel === r.key ? 'sel' : ''}\" ${o.click ? `data-click=\"${o.click}\" data-key=\"${esc(r.key)}\"` : ''} data-tip=\"${esc(r.tip || '')}\"><span class=\"n\">${esc(r.n)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span><span class=\"t\"><i style=\"width:${Math.max(2, r.v / max * 100)}%\"></i></span><span class=\"v\">${r.f}</span></div>`).join('')}</div>`;\n}\nconst legend = items => `<div class=\"legend\">${items.map(([c, l]) => `<span><i style=\"background:${c}\"></i>${esc(l)}</span>`).join('')}</div>`;\nconst card = (cls, title, sub, body, side) => `<section class=\"card ${cls}\"><div class=\"chead\"><div><h2>${title}</h2>${sub ? `<div class=\"sub\">${sub}</div>` : ''}</div>${side || ''}</div>${body}</section>`;\nconst kpi = (label, val, sub, cls) => `<div class=\"kpi ${cls || ''}\"><span>${label}</span><b>${val}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;\n\n// ===== Pages =====\nconst PAGES = [['ca', 'Chiffre d’affaires'], ['prod', 'Produits'], ['heures', 'Heures et équipe'], ['caisse', 'Caisse et pertes']];\nfunction filtersHTML(C) {\n  const per = [['sem', 'Cette semaine'], ['semp', 'Semaine dernière'], ['7', '7 jours'], ['30', '30 jours'], ['mois', 'Ce mois'], ['prec', 'Mois dernier'], ['90', '3 mois'], ['tout', 'Tout'], ['perso', 'Dates…']];\n  const iso = t => { const x = new Date(t); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };\n  const days = ORDER.map(d => [d, DS[d].replace('.', '')]);\n  return `<div class=\"filters\">\n    <div class=\"seg\" role=\"group\" aria-label=\"Période\">${per.map(([k, l]) => `<button class=\"${PER === k ? 'on' : ''}\" data-per=\"${k}\">${l}</button>`).join('')}</div>\n    ${PER === 'perso' ? `<div class=\"dates\"><label>Du <input type=\"date\" id=\"cfrom\" value=\"${CFROM || iso(C.b.from)}\" max=\"${iso(A.now)}\"></label><label>au <input type=\"date\" id=\"cto\" value=\"${CTO || iso(C.b.to - 86400000)}\" max=\"${iso(A.now)}\"></label></div>` : ''}\n    <div class=\"seg\" role=\"group\" aria-label=\"Jour de la semaine\"><button class=\"${DOW == null ? 'on' : ''}\" data-dow=\"\">Tous les jours</button>${days.map(([d, l]) => `<button class=\"${DOW === d ? 'on' : ''}\" data-dow=\"${d}\">${l}</button>`).join('')}</div>\n    <div class=\"seg\" role=\"group\" aria-label=\"Type de soirée\">${[['all', 'Toutes'], ['match', 'Soirs de match'], ['normal', 'Sans match']].map(([k, l]) => `<button class=\"${MATCH === k ? 'on' : ''}\" data-match=\"${k}\">${l}</button>`).join('')}</div>\n  </div>\n  <div class=\"range\"><b>${C.cur.length} soirée${C.cur.length > 1 ? 's' : ''}</b>${C.cur.length ? ' · du ' + new Date(C.cur[0].open).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + ' au ' + new Date(C.cur[C.cur.length - 1].open).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''}${C.prev ? ` · comparé ${C.prev.length > 1 ? 'aux ' + C.prev.length + ' soirées' : 'à la soirée'} ${PER === 'semp' ? 'de la semaine d’avant' : PER === 'sem' ? 'des mêmes jours la semaine dernière' : 'de la période précédente'}` : ''}${DOW != null ? ' · ' + DAYS[DOW].toLowerCase() + 's seulement' : ''}</div>`;\n}\n\nfunction pageCA(C) {\n  const T = tots(C.cur), P = C.prev ? tots(C.prev) : null;\n  const ob = A.obj || {};\n  let h = `<h1>Chiffre d’affaires</h1><div class=\"kpis\">\n    ${kpi('Chiffre d’affaires', eur(T.ca, false), (P && delta(T.ca, P.ca) ? delta(T.ca, P.ca) + ' · ' : '') + 'CB ' + eur(T.cb, false) + ' · espèces ' + eur(T.esp, false), 'hero')}\n    ${kpi('CA moyen par soirée', eur(T.moy, false), P ? delta(T.moy, P.moy) : '')}\n    ${kpi('Clients', num(T.pers), (P && delta(T.pers, P.pers) ? delta(T.pers, P.pers) + ' · ' : '') + num(T.n ? T.pers / T.n : 0) + ' par soirée')}\n    ${kpi('Panier par personne', eur(T.pp), P ? delta(T.pp, P.pp) : '')}\n    ${kpi('Panier par table', eur(T.pt), [P ? delta(T.pt, P.pt) : '', ob.panier ? 'objectif ' + eur(ob.panier) : ''].filter(Boolean).join(' · '))}\n  </div><div class=\"grid\">`;\n  // CA par soirée, CB et espèces empilés, soirs de match entourés.\n  const items = C.cur.map(s => ({ label: dlab(s.open), key: s.id, mark: !!s.match, parts: [{ v: s.cb, c: 'var(--brass)' }, { v: s.esp, c: 'var(--brass-2)' }],\n    tip: `<b>${dlong(s.open)}</b>${s.match ? ' · match' : ''}<br>CA ${eur(s.ca)} · CB ${eur(s.cb)} · espèces ${eur(s.esp)}<br>${s.pers} clients · ${s.tables} tables` }));\n  h += card('', 'CA par soirée', 'Survole une barre pour le détail. En pointillés : soirs de match.', items.length ? bars(items, { goal: ob.soir || 0, goalLabel: 'objectif par soirée', fmt: v => eur(v, false), aria: 'CA par soirée' }) : '<p class=\"empty\">Aucune soirée sur cette période.</p>', legend([['var(--brass)', 'CB'], ['var(--brass-2)', 'Espèces']]));\n  // Moyenne par jour de la semaine (cliquable : filtre le jour).\n  const byD = ORDER.map(d => { const ss = C.cur.filter(s => new Date(s.open).getDay() === d); return { d, n: ss.length, moy: ss.length ? sum(ss, s => s.ca) / ss.length : 0, pers: ss.length ? sum(ss, s => s.pers) / ss.length : 0 }; });\n  const allD = DOW == null ? byD : ORDER.map(d => { const ss = pick(C.b.from, C.b.to).length, all = A.soirees.map(SO).filter(s => s.open >= C.b.from && s.open < C.b.to && new Date(s.open).getDay() === d); return { d, n: all.length, moy: all.length ? sum(all, s => s.ca) / all.length : 0, pers: all.length ? sum(all, s => s.pers) / all.length : 0 }; });\n  const best = allD.filter(x => x.n).sort((a, b) => b.moy - a.moy);\n  h += card('half', 'Moyenne par jour de la semaine', best.length ? `Meilleur soir : <b style=\"color:var(--fg)\">${DAYS[best[0].d].toLowerCase()}</b> (${eur(best[0].moy, false)}) · le plus calme : ${DAYS[best[best.length - 1].d].toLowerCase()} (${eur(best[best.length - 1].moy, false)}). Touche un jour pour filtrer.` : '',\n    bars(allD.map(x => ({ label: DS[x.d], key: String(x.d), parts: [{ v: x.moy, c: DOW === x.d ? 'var(--brass)' : 'var(--mist)' }], tip: `<b>${DAYS[x.d]}</b><br>${x.n} soirée${x.n > 1 ? 's' : ''} · moyenne ${eur(x.moy)}<br>${num(x.pers)} clients en moyenne` })), { w: 380, h: 190, maxLabels: 7, fmt: v => eur(v, false), click: 'dow', selKey: DOW == null ? null : String(DOW) }));\n  // Match ou pas.\n  const M = C.cur.filter(s => s.match), N = C.cur.filter(s => !s.match), tm = tots(M), tn = tots(N);\n  h += card('half', 'Soirs de match contre soirs normaux', M.length && N.length ? (tm.moy > tn.moy ? `Un soir de match rapporte ${eur(tm.moy - tn.moy, false)} de plus en moyenne.` : `Un soir de match rapporte ${eur(tn.moy - tm.moy, false)} de moins en moyenne.`) : 'Il faut des soirs des deux types sur la période pour comparer.',\n    `<div class=\"cmp\"><span class=\"hd\"></span><span class=\"hd num\">Match (${M.length})</span><span class=\"hd num\">Normal (${N.length})</span>\n    <span>CA moyen</span><span class=\"num\">${M.length ? eur(tm.moy, false) : '—'}</span><span class=\"num\">${N.length ? eur(tn.moy, false) : '—'}</span>\n    <span>Clients par soirée</span><span class=\"num\">${M.length ? num(tm.pers / tm.n) : '—'}</span><span class=\"num\">${N.length ? num(tn.pers / tn.n) : '—'}</span>\n    <span>Panier par personne</span><span class=\"num\">${M.length ? eur(tm.pp) : '—'}</span><span class=\"num\">${N.length ? eur(tn.pp) : '—'}</span>\n    <span>Panier par table</span><span class=\"num\">${M.length ? eur(tm.pt) : '—'}</span><span class=\"num\">${N.length ? eur(tn.pt) : '—'}</span></div>`);\n  // Mois en cours : cumul contre objectif et mois précédent.\n  const now = new Date(A.now), y = now.getFullYear(), mo = now.getMonth(), nd = new Date(y, mo + 1, 0).getDate(), pd = new Date(y, mo, 0).getDate();\n  const cum = (yy, mm, days, upto) => { const out = [], ss = A.soirees.map(SO); let c = 0; for (let d = 1; d <= days; d++) { if (upto && d > upto) break; c += sum(ss.filter(s => { const o = new Date(s.open); return o.getFullYear() === yy && o.getMonth() === mm && o.getDate() === d; }), s => s.ca); out.push(c); } return out; };\n  const curM = cum(y, mo, nd, now.getDate()), prevM = cum(mo ? y : y - 1, mo ? mo - 1 : 11, pd).slice(0, nd);\n  const proj = curM.length ? curM[curM.length - 1] / curM.length * nd : 0;\n  h += card('', 'Mois en cours', `${eur(curM[curM.length - 1] || 0, false)} au ${now.getDate()} · au rythme actuel ≈ ${eur(proj, false)} en fin de mois${ob.mois ? ' pour un objectif de ' + eur(ob.mois, false) : ''}. En pointillés : le mois dernier.`,\n    curve([{ v: prevM, c: 'var(--faint)', dash: true, w: 1.6 }, { v: curM, c: 'var(--brass)', area: true, dot: true }], { n: nd, goal: ob.mois || 0 }), legend([['var(--brass)', 'Ce mois'], ['var(--faint)', 'Mois dernier']]));\n  return h + '</div>';\n}\n\nfunction goutBoisson(lignes) {\n  const G = {}, B = {}, grp = A.groupes || {};\n  lignes.forEach(l => { if (!/chicha/i.test(l[3])) return; String(l[5] || '').split(' · ').forEach(tok => { tok = tok.trim(); if (!tok) return; const g = grp[tok] || ''; if (/go[ûu]t|saveur|parfum/i.test(g)) G[tok] = (G[tok] || 0) + l[6]; else if (/boisson/i.test(g)) B[tok] = (B[tok] || 0) + l[6]; }); });\n  return { G, B };\n}\nfunction pageProd(C) {\n  const L = C.lignes, by = {}, cats = {};\n  L.forEach(l => { const x = by[l[4]] || (by[l[4]] = { n: l[4], cat: l[3], q: 0, ca: 0, per: {} }); x.q += l[6]; x.ca += l[7]; x.per[l[0]] = (x.per[l[0]] || 0) + l[6]; cats[l[3]] = (cats[l[3]] || 0) + l[7]; });\n  const list = Object.values(by), caTot = sum(list, x => x.ca), qTot = sum(list, x => x.q);\n  const marged = list.filter(x => A.couts[x.n] != null), mg = sum(marged, x => x.ca - A.couts[x.n] * x.q), mgCov = caTot ? sum(marged, x => x.ca) / caTot * 100 : 0;\n  const chiCA = sum(list.filter(x => /chicha/i.test(x.cat)), x => x.ca), horsChi = caTot ? (caTot - chiCA) / caTot * 100 : 0;\n  const PL = {}; C.plignes.forEach(l => { if (!/chicha/i.test(l[3])) PL.h = (PL.h || 0) + l[7]; PL.t = (PL.t || 0) + l[7]; });\n  const pHors = PL.t ? (PL.h || 0) / PL.t * 100 : null;\n  let h = `<h1>Produits</h1><div class=\"kpis\">\n    ${kpi('Articles vendus', num(qTot), 'pour ' + eur(caTot, false) + ' de ventes', 'hero')}\n    ${kpi('Ventes en plus des chichas', pct(horsChi), (pHors != null ? delta(horsChi, pHors) + ' · ' : '') + 'plats, desserts, boissons')}\n    ${kpi('Marge sur matières', marged.length ? eur(mg, false) : '—', marged.length ? `estimée sur ${pct(mgCov)} des ventes (coûts connus)` : 'saisis les prix d’achat dans Stock')}\n    ${kpi('Références vendues', list.length, 'sur ' + A.carte.length + ' à la carte')}\n  </div><div class=\"grid\">`;\n  const top = list.slice().sort((a, b) => PMODE === 'q' ? b.q - a.q : b.ca - a.ca).slice(0, 15);\n  const toggle = `<div class=\"seg\"><button class=\"${PMODE === 'ca' ? 'on' : ''}\" data-pmode=\"ca\">En €</button><button class=\"${PMODE === 'q' ? 'on' : ''}\" data-pmode=\"q\">En quantité</button></div>`;\n  h += card('two', 'Meilleures ventes', 'Touche un article pour voir son évolution.', hlist(top.map(x => ({ key: x.n, n: x.n, sub: x.cat, v: PMODE === 'q' ? x.q : x.ca, f: PMODE === 'q' ? num(x.q) : eur(x.ca, false),\n    tip: `<b>${esc(x.n)}</b><br>${num(x.q)} vendus · ${eur(x.ca)}${A.couts[x.n] != null ? '<br>marge ≈ ' + eur(x.ca - A.couts[x.n] * x.q) : ''}` })), { click: 'prod', sel: PSEL }), toggle);\n  h += card('third', 'Par catégorie', 'Part du chiffre des articles.', hlist(Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ key: c, n: c, v, f: pct(caTot ? v / caTot * 100 : 0), tip: `<b>${esc(c)}</b><br>${eur(v)}` }))));\n  if (PSEL && by[PSEL]) {\n    const x = by[PSEL];\n    h += card('', 'Évolution · ' + esc(PSEL), `${num(x.q)} vendus sur la période · ${eur(x.ca)}`, bars(C.cur.map(s => ({ label: dlab(s.open), key: s.id, parts: [{ v: x.per[s.id] || 0, c: 'var(--brass)' }], tip: `<b>${dlong(s.open)}</b><br>${num(x.per[s.id] || 0)} × ${esc(PSEL)}` })), { h: 190, fmt: v => num(v) }), `<span class=\"sel-note\">Article choisi<button data-click=\"prod\" data-key=\"${esc(PSEL)}\">Retirer</button></span>`);\n  }\n  const gb = goutBoisson(L);\n  const GL = Object.entries(gb.G).sort((a, b) => b[1] - a[1]), BL = Object.entries(gb.B).sort((a, b) => b[1] - a[1]);\n  const gt = sum(GL.map(x => x[1])), bt = sum(BL.map(x => x[1]));\n  h += card('half', 'Goûts des chichas', gt ? `${num(gt)} têtes · ${esc(GL[0][0])} en tête (${pct(GL[0][1] / gt * 100)})` : '', hlist(GL.map(([n, v]) => ({ key: n, n, v, f: num(v) + ' · ' + pct(v / gt * 100), tip: `<b>${esc(n)}</b><br>${num(v)} têtes` }))));\n  h += card('half', 'Boissons servies avec les chichas', bt ? `${num(bt)} boissons comprises` : '', hlist(BL.map(([n, v]) => ({ key: n, n, v, f: num(v) + ' · ' + pct(v / bt * 100), tip: `<b>${esc(n)}</b><br>${num(v)} servies avec une chicha` }))));\n  const sold = new Set(list.map(x => x.n)), never = A.carte.filter(c => !sold.has(c[1]));\n  h += card('', 'Jamais vendus sur la période', never.length ? `${never.length} article${never.length > 1 ? 's' : ''} de la carte. À mettre en avant, à revoir ou à retirer.` : 'Tout ce qui est à la carte s’est vendu au moins une fois.', `<div class=\"chips\">${never.map(c => `<span class=\"chip\">${esc(c[1])} · ${eur(c[2])}</span>`).join('')}</div>`);\n  return h + '</div>';\n}\n\nfunction pageHeures(C) {\n  // Carte de chaleur jour × heure (CA des articles envoyés).\n  const hm = {}; let mx = 0;\n  C.lignes.forEach(l => { const d = new Date(l[1]), hh = d.getHours(), so = A.soirees.find(s => s[0] === l[0]), dd = so ? new Date(so[1]).getDay() : d.getDay(); const k = dd + '|' + hh; hm[k] = (hm[k] || 0) + l[7]; mx = Math.max(mx, hm[k]); });\n  const hrs = HOURS.filter(hh => ORDER.some(d => hm[d + '|' + hh]));\n  const nByD = {}; C.cur.forEach(s => { const d = new Date(s.open).getDay(); nByD[d] = (nByD[d] || 0) + 1; });\n  let peak = null; Object.entries(hm).forEach(([k, v]) => { if (!peak || v > peak.v) peak = { k, v }; });\n  // Durée des tables et arrivées par heure.\n  const V = C.ventes.filter(v => v[2] && v[3]), dur = V.length ? sum(V, v => (v[3] - v[2]) / 60000) / V.length : 0;\n  const arr = {}; V.forEach(v => { const hh = new Date(v[2]).getHours(); arr[hh] = (arr[hh] || 0) + 1; });\n  const ret = C.point.filter(p => p[1] === 'Arrivée'), late = ret.filter(p => p[3] > 0);\n  let h = `<h1>Heures et équipe</h1><div class=\"kpis\">\n    ${kpi('Heure la plus forte', peak ? DAYS[+peak.k.split('|')[0]].toLowerCase() + ' ' + peak.k.split('|')[1] + ' h' : '—', peak ? eur(peak.v, false) + ' envoyés sur ce créneau' : '', 'hero')}\n    ${kpi('Durée moyenne d’une table', dur ? Math.round(dur) + ' min' : '—', V.length + ' tables')}\n    ${kpi('Tables par soirée', num(C.cur.length ? V.length / C.cur.length : 0), '')}\n    ${kpi('Retards', late.length + ' / ' + ret.length, late.length ? Math.round(sum(late, p => p[3]) / late.length) + ' min en moyenne' : 'aucun retard')}\n  </div><div class=\"grid\">`;\n  const shade = v => { if (!v) return 'var(--raise)'; const a = 0.1 + 0.9 * Math.pow(v / mx, 1.4); return `color-mix(in srgb, var(--brass) ${Math.round(a * 100)}%, var(--raise))`; };\n  const heat = hrs.length ? `<div class=\"heat\" style=\"grid-template-columns:48px repeat(${hrs.length},1fr)\"><span></span>${hrs.map(hh => `<span class=\"h\">${hh} h</span>`).join('')}\n    ${ORDER.map(d => `<span class=\"d\">${DS[d]}</span>${hrs.map(hh => { const v = hm[d + '|' + hh] || 0, m = nByD[d] ? v / nByD[d] : 0; return `<span class=\"c\" style=\"background:${shade(v)}\" data-tip=\"${esc(`<b>${DAYS[d]} · ${hh} h</b><br>${eur(v)} au total${nByD[d] ? '<br>' + eur(m) + ' par soirée en moyenne' : ''}`)}\">${v ? Math.round(m) : ''}</span>`; }).join('')}`).join('')}</div>` : '<p class=\"empty\">Rien sur cette période.</p>';\n  h += card('', 'Quand la salle consomme', 'Chiffre des articles envoyés, par jour et par heure. Plus c’est doré, plus ça vend. Survole une case pour la moyenne par soirée.', heat);\n  const ah = HOURS.filter(hh => arr[hh]);\n  h += card('half', 'Arrivée des tables', 'Heure d’ouverture des tables encaissées.', ah.length ? bars(ah.map(hh => ({ label: hh + ' h', key: hh, parts: [{ v: arr[hh], c: 'var(--mist)' }], tip: `<b>${hh} h</b><br>${arr[hh]} tables ouvertes` })), { w: 380, h: 190, fmt: v => num(v) }) : '<p class=\"empty\">Rien sur cette période.</p>');\n  const team = {}; ret.forEach(p => { const x = team[p[4]] || (team[p[4]] = { n: p[4], s: 0, l: 0, m: 0 }); x.s++; if (p[3] > 0) { x.l++; x.m += p[3]; } });\n  const tl = Object.values(team).sort((a, b) => b.s - a.s);\n  h += card('half', 'Équipe', 'Prises de service sur la période.', tl.length ? `<table class=\"t\"><thead><tr><th>Personne</th><th class=\"r\">Soirées</th><th class=\"r\">Retards</th><th class=\"r\">Retard moyen</th></tr></thead><tbody>${tl.map(x => `<tr><td>${esc(x.n || '—')}</td><td class=\"r\">${x.s}</td><td class=\"r ${x.l ? 'neg' : ''}\">${x.l}</td><td class=\"r\">${x.l ? Math.round(x.m / x.l) + ' min' : '—'}</td></tr>`).join('')}</tbody></table>` : '<p class=\"empty\">Aucune prise de service enregistrée.</p>');\n  return h + '</div>';\n}\n\nfunction pageCaisse(C) {\n  const ss = C.cur, withE = ss.filter(s => s.ecart != null), cumE = []; let c = 0;\n  withE.forEach(s => { c += s.ecart; cumE.push(r2(c)); });\n  const justes = withE.filter(s => Math.abs(s.ecart) < 1).length;\n  const T = tots(ss), P = C.prev ? tots(C.prev) : null;\n  const annT = sum(ss, s => s.annul), fidT = sum(ss, s => s.fid), patT = sum(ss, s => s.patron), pertes = annT + fidT;\n  const pp = P ? sum(C.prev, s => s.annul + s.fid) / (P.ca || 1) * 100 : null, pc = T.ca ? pertes / T.ca * 100 : 0;\n  let h = `<h1>Caisse et pertes</h1><div class=\"kpis\">\n    ${kpi('Écart de caisse cumulé', (c > 0 ? '+' : '') + eur(c), withE.length ? `${justes} soirée${justes > 1 ? 's' : ''} juste${justes > 1 ? 's' : ''} sur ${withE.length} (moins de 1 € d’écart)` : 'aucun comptage', 'hero')}\n    ${kpi('Offerts et annulations', eur(pertes, false), (pp != null ? delta(pc, pp, true) + ' · ' : '') + pct(pc) + ' du CA')}\n    ${kpi('Cadeaux fidélité', eur(fidT, false), pct(T.ca ? fidT / T.ca * 100 : 0) + ' du CA')}\n    ${kpi('Conso patron', eur(patT, false), 'valeur carte, hors CA')}\n  </div><div class=\"grid\">`;\n  h += card('', 'Écart de caisse par soirée', 'Vert : plus d’argent que prévu · orange : il en manque. La courbe bleue montre le cumul. Une erreur de comptage un soir donne souvent l’écart inverse le lendemain.',\n    withE.length ? bars(withE.map(s => ({ label: dlab(s.open), key: s.id, parts: [{ v: s.ecart }], tip: `<b>${dlong(s.open)}</b><br>écart ${s.ecart > 0 ? '+' : ''}${eur(s.ecart)}${s.tpe != null ? '<br>TPE ' + eur(s.tpe) + ' · CB appli ' + eur(s.cb) : ''}` })), { signed: true, h: 240, fmt: v => eur(Math.round(v)), line: cumE }) : '<p class=\"empty\">Aucun comptage sur cette période.</p>',\n    legend([['var(--sage)', 'Excédent'], ['var(--ember)', 'Manque'], ['var(--mist)', 'Cumul']]));\n  const rais = {}, par = {}; C.annul.forEach(a => { rais[a[5] || 'Sans raison'] = (rais[a[5] || 'Sans raison'] || 0) + a[4]; par[a[6] || '—'] = (par[a[6] || '—'] || 0) + a[4]; });\n  h += card('half', 'Annulations et offerts par raison', '', hlist(Object.entries(rais).sort((a, b) => b[1] - a[1]).map(([n, v]) => ({ key: n, n, v, f: eur(v, false), tip: `<b>${esc(n)}</b><br>${eur(v)}` }))));\n  h += card('half', 'Par personne', 'Qui a saisi les annulations et offerts.', hlist(Object.entries(par).sort((a, b) => b[1] - a[1]).map(([n, v]) => ({ key: n, n, v, f: eur(v, false), tip: `<b>${esc(n)}</b><br>${eur(v)}` }))));\n  h += card('', 'Pertes par soirée', 'Offerts, annulations et cadeaux fidélité, en % du CA de la soirée.', ss.length ? bars(ss.map(s => ({ label: dlab(s.open), key: s.id, parts: [{ v: s.ca ? (s.annul + s.fid) / s.ca * 100 : 0, c: 'var(--ember)' }], tip: `<b>${dlong(s.open)}</b><br>${eur(s.annul + s.fid)} soit ${pct(s.ca ? (s.annul + s.fid) / s.ca * 100 : 0)} du CA` })), { h: 200, fmt: v => Math.round(v) + ' %' }) : '<p class=\"empty\">Rien sur cette période.</p>');\n  const tpe = ss.filter(s => s.tpe != null);\n  if (tpe.length) h += card('', 'TPE contre appli', 'Total du TPE saisi à la fermeture, comparé aux paiements CB de l’appli.', `<table class=\"t\"><thead><tr><th>Soirée</th><th class=\"r\">TPE</th><th class=\"r\">CB appli</th><th class=\"r\">Différence</th></tr></thead><tbody>${tpe.map(s => { const d = r2(s.tpe - s.cb); return `<tr><td>${dlong(s.open)}</td><td class=\"r\">${eur(s.tpe)}</td><td class=\"r\">${eur(s.cb)}</td><td class=\"r ${Math.abs(d) >= 1 ? 'neg' : 'pos'}\">${d > 0 ? '+' : ''}${eur(d)}</td></tr>`; }).join('')}</tbody></table>`);\n  return h + '</div>';\n}\n\n// ===== Rendu =====\nfunction render() {\n  if (!A) return;\n  document.getElementById('upd').textContent = 'À jour · ' + new Date(A.now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });\n  document.getElementById('tabs').innerHTML = PAGES.map(([k, l]) => `<button class=\"${PAGE === k ? 'on' : ''}\" data-page=\"${k}\">${l}</button>`).join('');\n  const C = ctx();\n  const body = PAGE === 'prod' ? pageProd(C) : PAGE === 'heures' ? pageHeures(C) : PAGE === 'caisse' ? pageCaisse(C) : pageCA(C);\n  document.getElementById('main').innerHTML = filtersHTML(C) + body + `<p class=\"note\">Lecture seule : rien ici ne modifie le service ni la caisse. Les chiffres viennent des soirées fermées du Google Sheets.</p>`;\n  // Sur téléphone, les choix défilent : le choix actif reste visible.\n  document.querySelectorAll('.seg, .tabs').forEach(g => { const on = g.querySelector('.on'); if (on && g.scrollWidth > g.clientWidth) g.scrollLeft = Math.max(0, on.offsetLeft - (g.clientWidth - on.offsetWidth) / 2); });\n}\ndocument.addEventListener('click', e => {\n  const b = e.target.closest('button, [data-click]');\n  if (!b) return;\n  if (b.id === 'refresh') return load();\n  if (b.id === 'theme') { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); return; }\n  if (b.dataset.page) { PAGE = b.dataset.page; saveUI(); render(); window.scrollTo({ top: 0 }); return; }\n  if (b.dataset.per) { PER = b.dataset.per; saveUI(); render(); return; }\n  if (b.dataset.dow != null && b.closest('.filters')) { DOW = b.dataset.dow === '' ? null : +b.dataset.dow; render(); return; }\n  if (b.dataset.match) { MATCH = b.dataset.match; render(); return; }\n  if (b.dataset.pmode) { PMODE = b.dataset.pmode; render(); return; }\n  if (b.dataset.click === 'dow') { const d = +b.dataset.key; DOW = DOW === d ? null : d; render(); return; }\n  if (b.dataset.click === 'prod') { PSEL = PSEL === b.dataset.key ? null : b.dataset.key; render(); return; }\n});\ndocument.addEventListener('change', e => {\n  if (e.target.id === 'cfrom' || e.target.id === 'cto') { if (e.target.id === 'cfrom') CFROM = e.target.value; else CTO = e.target.value; saveUI(); render(); }\n});\n// Infobulle : souris et doigt.\nconst tip = document.getElementById('tip');\nfunction showTip(e) {\n  const t = e.target.closest('[data-tip]');\n  if (!t || !t.dataset.tip) { tip.classList.remove('on'); return; }\n  tip.innerHTML = t.dataset.tip; tip.classList.add('on');\n  const x = e.clientX, y = e.clientY, w = tip.offsetWidth, h = tip.offsetHeight;\n  tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';\n  tip.style.top = (y - h - 14 < 8 ? y + 18 : y - h - 14) + 'px';\n}\ndocument.addEventListener('pointermove', showTip);\ndocument.addEventListener('pointerdown', showTip);\ndocument.addEventListener('scroll', () => tip.classList.remove('on'), { passive: true });\nrender();\nload();\n</script>\n</body>\n</html>\n";
