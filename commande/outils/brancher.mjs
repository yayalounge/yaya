// Fabrique apps-script/Code.gs (l'appli du gérant, branchée sur la commande à table) à partir de la copie
// apps-script/Code.origine.gs, prise dans son projet Apps Script le 19/11/2026 (v33).
// Trois ajouts, chacun marqué « commande à table » ; tout le reste de son code est identique, octet pour octet.
//   node outils/brancher.mjs   (s'arrête si un repère a changé : on ne branche jamais à l'aveugle)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ici = (p) => fileURLToPath(new URL(`../../${p}`, import.meta.url));

export function brancher(code) {
  const remplacer = (avant, apres, nom) => {
    const n = code.split(avant).length - 1;
    if (n !== 1) throw new Error(`repère « ${nom} » trouvé ${n} fois au lieu d'une : le code du gérant a changé, relire avant de brancher`);
    code = code.replace(avant, apres);
  };
  remplacer('  var fn = ACTIONS_[action];\n',
    '  var fn = ACTIONS_[action] || WEB_ACTIONS_[action]; // commande à table (CommandeTable.gs)\n', 'actions');
  remplacer("  // v23 · Appli d'analyses : même lien gérant",
    "  // Commande à table (CommandeTable.gs) : QR des tables à imprimer, même lien gérant avec « &app=qr ».\n" +
    "  if (prm.app === 'qr') {\n" +
    "    if (role !== 'gerant') return HtmlService.createHtmlOutput('<p style=\"font-family:sans-serif;padding:24px;font-size:16px\">Réservé au gérant.</p>').addMetaTag('viewport', 'width=device-width, initial-scale=1');\n" +
    "    return webQrPage_(k);\n" +
    "  }\n" +
    "  // v23 · Appli d'analyses : même lien gérant", 'doGet');
  // INDEX_HTML est une chaîne JSON sur une ligne : on insère le panneau juste avant son </body>.
  const lignes = code.split('\n');
  const i = lignes.findIndex((l) => l.startsWith('var INDEX_HTML = "'));
  if (i < 0) throw new Error('INDEX_HTML introuvable');
  const html = JSON.parse(lignes[i].slice('var INDEX_HTML = '.length).replace(/;\s*$/, ''));
  if (html.split('</body>').length !== 2 || html.includes('webUi_')) throw new Error('INDEX_HTML inattendu');
  lignes[i] = `var INDEX_HTML = ${JSON.stringify(html.replace('</body>', '<?!= webUi_() ?>\n</body>'))};`;
  code = lignes.join('\n');
  remplacer('var CODE_V_ = 33;', 'var CODE_V_ = 34; // v34 · commande à table', 'version');
  return code;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const code = brancher(await readFile(ici('apps-script/Code.origine.gs'), 'utf8'));
  await writeFile(ici('apps-script/Code.gs'), code);
  console.log('apps-script/Code.gs écrit');
}
