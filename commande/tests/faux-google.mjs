// Copie fidèle de Google Apps Script pour les essais : on charge les vrais fichiers du projet du gérant
// (apps-script/*.gs, *.html) dans une machine virtuelle Node, avec des services Google en mémoire
// (Google Sheets, cache, propriétés, verrou, HtmlService, ContentService). Rien ne part chez Google.
import vm from 'node:vm';
import { createHmac, createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DOSSIER = fileURLToPath(new URL('../../apps-script/', import.meta.url));
const lire = (f) => readFileSync(DOSSIER + f, 'utf8');
const octets = (buf) => [...buf].map((b) => (b > 127 ? b - 256 : b)); // Google rend des octets signés (Java)
const versBuffer = (o) => Buffer.from(o.map((b) => (b + 256) % 256));

// ── Dates : Utilities.formatDate / parseDate, motifs de type Java ─────────────────────
function parties(date, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', weekday: 'short' })
    .formatToParts(date).map((x) => [x.type, x.value]));
  return p;
}
function formatDate(date, tz, motif) {
  const p = parties(new Date(date), tz || 'Europe/Paris');
  return motif.replace(/yyyy|MM|dd|HH|mm|ss|EEE|u/g, (t) => ({ yyyy: p.year, MM: p.month, dd: p.day, HH: p.hour, mm: p.minute, ss: p.second, EEE: p.weekday, u: String(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) + 1) }[t]));
}
function decalage(date, tz) { // minutes d'avance du fuseau sur UTC à cette date
  const p = parties(date, tz);
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - date.getTime()) / 60000;
}
function parseDate(texte, tz, motif) {
  const m = String(texte).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) throw new Error(`parseDate : ${texte} (${motif})`);
  const utc = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)));
  return new Date(utc.getTime() - decalage(utc, tz) * 60000);
}

// ── Google Sheets en mémoire ───────────────────────────────────────────────────
class Feuille {
  constructor(nom, lignes = []) { this.nom = nom; this.v = lignes.map((l) => [...l]); }
  getName() { return this.nom; }
  getLastRow() { let n = this.v.length; while (n > 0 && this.v[n - 1].every((x) => x === '' || x == null)) n--; return n; }
  getLastColumn() { return Math.max(0, ...this.v.map((l) => l.length)); }
  getMaxRows() { return Math.max(1000, this.v.length); }
  getMaxColumns() { return Math.max(26, this.getLastColumn()); }
  getRange(r, c = 1, nr = 1, nc = 1) {
    if (typeof r === 'string') { const m = r.match(/^([A-Z]+)(\d+)?(?::([A-Z]+)(\d+)?)?$/); r = +(m[2] || 1); c = m[1].charCodeAt(0) - 64; nr = 1; nc = 1; }
    return new Zone(this, r, c, nr, nc);
  }
  getDataRange() { return new Zone(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  appendRow(l) { this.v.splice(this.getLastRow(), 0, [...l]); return this; }
  deleteRow(r) { this.v.splice(r - 1, 1); }
  deleteRows(r, n) { this.v.splice(r - 1, n); }
  insertRowsAfter() {} setFrozenRows() {} setFrozenColumns() {} hideSheet() {} showSheet() {} setColumnWidth() {} setColumnWidths() {} autoResizeColumns() {} setTabColor() {}
  clear() { this.v = []; return this; } clearContents() { this.v = []; return this; }
  getSheetId() { return 1; }
  isSheetHidden() { return false; }
  protect() { return { setWarningOnly() {}, setDescription() { return this; } }; }
  getFilter() { return null; } getBandings() { return []; } getConditionalFormatRules() { return []; } setConditionalFormatRules() {}
}
class Zone {
  constructor(f, r, c, nr, nc) { Object.assign(this, { f, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) { const l = this.f.v[this.r - 1 + i] || []; const x = []; for (let j = 0; j < this.nc; j++) x.push(l[this.c - 1 + j] ?? ''); out.push(x); }
    return out;
  }
  getDisplayValues() { return this.getValues().map((l) => l.map((x) => (x instanceof Date ? x.toISOString() : String(x)))); }
  getValue() { return this.getValues()[0][0]; }
  setValues(v) {
    if (v.length !== this.nr || v.some((l) => l.length !== this.nc)) throw new Error(`setValues : ${v.length}×${v[0]?.length} pour ${this.nr}×${this.nc}`);
    v.forEach((l, i) => { const k = this.r - 1 + i; while (this.f.v.length <= k) this.f.v.push([]); l.forEach((x, j) => { this.f.v[k][this.c - 1 + j] = x; }); });
    return this;
  }
  setValue(x) { return this.setValues([[x]]); }
  clearContent() { for (let i = 0; i < this.nr; i++) { const l = this.f.v[this.r - 1 + i]; if (l) for (let j = 0; j < this.nc; j++) l[this.c - 1 + j] = ''; } return this; }
  offset(dr, dc, nr = this.nr, nc = this.nc) { return new Zone(this.f, this.r + dr, this.c + dc, nr, nc); }
  getRow() { return this.r; } getNumRows() { return this.nr; } getColumn() { return this.c; }
}
for (const m of ['setNumberFormat', 'setNumberFormats', 'setFontWeight', 'setBackground', 'setFontColor', 'setWrap', 'setHorizontalAlignment', 'setDataValidation', 'setNote', 'setFontSize', 'setBorder', 'setVerticalAlignment', 'setWrapStrategy', 'setFontFamily', 'setFontStyle', 'setFormula', 'setFormulas', 'clearFormat', 'clearDataValidations', 'protect', 'merge', 'setBackgrounds', 'createFilter']) Zone.prototype[m] = function () { return this; };

class Classeur {
  constructor(onglets) { this.f = new Map(Object.entries(onglets).map(([n, l]) => [n, new Feuille(n, l)])); }
  getSheetByName(n) { return this.f.get(n) || null; }
  getSheets() { return [...this.f.values()]; }
  insertSheet(n) { const f = new Feuille(n); this.f.set(n, f); return f; }
  getSpreadsheetTimeZone() { return 'Europe/Paris'; }
  getId() { return 'classeur-de-test'; } getUrl() { return 'https://docs.google.com/spreadsheets/d/classeur-de-test'; } getName() { return 'YÄYA Commandes'; }
  setActiveSheet() {} toast() {} moveActiveSheet() {} getActiveSheet() { return this.getSheets()[0]; }
  onglet(n) { return this.f.get(n); }
}

// ── Pages HtmlService : <?!= expr ?> évalué dans le projet, avec les variables du modèle ───────
function sortie(contenu) {
  const o = { contenu, titre: '', getContent: () => contenu, setTitle(t) { o.titre = t; return o; }, addMetaTag() { return o; }, setXFrameOptionsMode() { return o; }, setSandboxMode() { return o; }, setFaviconUrl() { return o; }, setMimeType() { return o; } };
  return o;
}

export function chargerProjet({ onglets, proprietes = {}, maintenant = () => Date.now(), fichiers = ['Code.gs', 'CommandeTable.gs', 'QrCode.gs'] } = {}) {
  const classeur = new Classeur(onglets);
  const props = new Map(Object.entries(proprietes));
  const cache = new Map();
  const journal = [];
  const DateFausse = class extends Date {
    constructor(...a) { super(...(a.length ? a : [maintenant()])); }
    static now() { return maintenant(); }
  };
  let ctx;
  const html = (nom) => lire(`${nom}.html`);
  const modele = (texte) => {
    const t = {
      evaluate() {
        const contenu = texte.replace(/<\?!=\s*([\s\S]+?)\s*\?>/g, (_, expr) => {
          const f = vm.runInContext(`(function (t) { with (t) { return (${expr}); } })`, ctx);
          return String(f(t));
        });
        return sortie(contenu);
      },
    };
    return t;
  };
  const google = {
    SpreadsheetApp: { getActive: () => classeur, getActiveSpreadsheet: () => classeur, openById: () => classeur, flush() {}, getUi: () => ({ createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; }, addToUi() {} }), alert() {}, ButtonSet: {} }) },
    CacheService: { getScriptCache: () => ({
      get: (k) => (cache.has(k) ? cache.get(k) : null),
      put: (k, v) => { if (String(v).length > 100000) throw new Error('cache : valeur trop grande'); cache.set(k, String(v)); },
      remove: (k) => cache.delete(k),
      getAll: (ks) => Object.fromEntries(ks.filter((k) => cache.has(k)).map((k) => [k, cache.get(k)])),
      putAll: (o) => { for (const [k, v] of Object.entries(o)) cache.set(k, String(v)); },
      removeAll: (ks) => ks.forEach((k) => cache.delete(k)),
    }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (props.has(k) ? props.get(k) : null),
      setProperty(k, v) { props.set(k, String(v)); return this; },
      deleteProperty(k) { props.delete(k); return this; },
      getProperties: () => Object.fromEntries(props),
      setProperties(o) { for (const [k, v] of Object.entries(o)) props.set(k, String(v)); return this; },
    }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {}, hasLock: () => true }) },
    Utilities: {
      formatDate, parseDate,
      getUuid: () => randomUUID(),
      Charset: { UTF_8: 'utf8' },
      DigestAlgorithm: { SHA_256: 'sha256', MD5: 'md5' },
      computeHmacSha256Signature: (v, k) => octets(createHmac('sha256', k).update(v).digest()),
      computeDigest: (a, v) => octets(createHash(a).update(v).digest()),
      base64EncodeWebSafe: (o) => (Array.isArray(o) ? versBuffer(o) : Buffer.from(String(o))).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
      base64Encode: (o) => (Array.isArray(o) ? versBuffer(o) : Buffer.from(String(o))).toString('base64'),
      sleep() {},
      newBlob: (d) => ({ getDataAsString: () => String(d), getBytes: () => [...Buffer.from(String(d))] }),
    },
    HtmlService: {
      createTemplate: modele,
      createTemplateFromFile: (n) => modele(html(n)),
      createHtmlOutput: (s = '') => sortie(String(s)),
      createHtmlOutputFromFile: (n) => sortie(html(n)),
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL', DEFAULT: 'DEFAULT' },
      SandboxMode: { IFRAME: 'IFRAME' },
    },
    ContentService: { createTextOutput: (s) => { const o = { contenu: s, getContent: () => s, setMimeType: () => o }; return o; }, MimeType: { JSON: 'JSON', TEXT: 'TEXT' } },
    ScriptApp: { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' }), getProjectTriggers: () => [], newTrigger: () => ({ timeBased() { return this; }, everyDays() { return this; }, atHour() { return this; }, onWeekDay() { return this; }, everyHours() { return this; }, create() {} }), WeekDay: {} },
    MailApp: { sendEmail: (m) => journal.push(['mail', m]), getRemainingDailyQuota: () => 100 },
    DriveApp: { getFileById: () => ({ makeCopy: () => ({ getName: () => 'copie' }) }), getFoldersByName: () => ({ hasNext: () => false }), createFolder: () => ({ getId: () => 'x' }) },
    Session: { getScriptTimeZone: () => 'Europe/Paris', getActiveUser: () => ({ getEmail: () => '' }) },
    Logger: { log() {} },
    console: { log() {}, error: (...a) => journal.push(['erreur', a.join(' ')]), warn() {} },
    Date: DateFausse,
  };
  ctx = vm.createContext({ ...google, JSON, Math, Object, Array, String, Number, Boolean, RegExp, Error, TypeError, Map, Set, Intl, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent, Uint8Array, Promise });
  for (const f of fichiers) vm.runInContext(lire(f), ctx, { filename: f });
  return { ctx, classeur, props, cache, journal, appel: (code) => vm.runInContext(code, ctx) };
}
