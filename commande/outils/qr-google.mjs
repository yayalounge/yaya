// Fabrique apps-script/QrCode.gs : la bibliothèque qrcode (MIT) en un seul fichier pour Apps Script.
// WEB_QR_.svg(texte) rend le dessin SVG d'un QR (page des QR à imprimer) ; WEB_QR_.matrice(texte) ses modules (PDF).
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ici = (p) => fileURLToPath(new URL(p, import.meta.url));
const ENCODEUR = `var __yayaTextEncoder = typeof TextEncoder !== 'undefined' ? TextEncoder : function () {
  this.encode = function (s) {
    var o = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.codePointAt(i);
      if (c > 0xffff) i++;
      if (c < 0x80) o.push(c);
      else if (c < 0x800) o.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) o.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else o.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return new Uint8Array(o);
  };
};`;
export async function qrGoogle() {
  const r = await build({
    stdin: { contents: "import QR from 'qrcode/lib/core/qrcode.js'; import Svg from 'qrcode/lib/renderer/svg-tag.js';\nexport function svg(t) { return Svg.render(QR.create(t, { errorCorrectionLevel: 'M' }), { margin: 0 }); }\nexport function matrice(t) { var m = QR.create(t, { errorCorrectionLevel: 'M' }).modules; return { n: m.size, d: Array.prototype.join.call(m.data, '') }; }", resolveDir: ici('.'), loader: 'js' },
    bundle: true, format: 'iife', globalName: 'WEB_QR_', target: 'es2019', platform: 'neutral', mainFields: ['main'], legalComments: 'none', write: false, minify: true,
    // Apps Script n'a pas TextEncoder : la bibliothèque reçoit un encodeur UTF-8 écrit à la main.
    define: { TextEncoder: '__yayaTextEncoder' },
    banner: { js: ENCODEUR },
  });
  return `// QR codes pour la commande à table (bibliothèque « qrcode » de Ryan Day, licence MIT), fabriqué par\n// commande/outils/qr-google.mjs du dépôt yayalounge/yaya. Ne pas modifier à la main.\n${r.outputFiles[0].text}`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(ici('../../apps-script/QrCode.gs'), await qrGoogle());
  console.log('apps-script/QrCode.gs écrit');
}
