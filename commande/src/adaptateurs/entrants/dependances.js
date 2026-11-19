import config from '../../../config.json' with { type: 'json' };
import { sourceCarteKerro } from '../sortants/carte-kerro.js';
import { stockageBlobs } from '../sortants/stockage-blobs.js';
import { horlogeSysteme } from '../sortants/horloge.js';
import { aleatoire, codeEgal } from './http.js';
import { ErreurMetier } from '../../domaine/erreurs.js';

// Assemblage : relie les ports aux adaptateurs à partir des variables Netlify du projet du gérant.
//   YAYA_SECRET     au moins 32 caractères au hasard : signe les QR et la session de la cuisine
//   COMPTOIR_CODE   code de l'écran de la cuisine (6 chiffres ou plus)
//   TABLES_VERSION  facultatif, « 1 » par défaut : le changer rend tous les QR imprimés invalides
// En local (scripts/serve.mjs), globalThis.__yayaDeps remplace tout (stockage en mémoire, faux Kerro).
let deps = null;

export function dependances() {
  if (globalThis.__yayaDeps) return globalThis.__yayaDeps;
  if (deps) return deps;
  const secret = process.env.YAYA_SECRET ?? '';
  const code = process.env.COMPTOIR_CODE ?? '';
  if (secret.length < 32) throw new ErreurMetier('config', 'Installation incomplète : YAYA_SECRET manquant (voir docs/mise-en-ligne.md).', 500);
  if (!/^\d{6,12}$/.test(code)) throw new ErreurMetier('config', 'Installation incomplète : COMPTOIR_CODE doit faire 6 à 12 chiffres.', 500);
  const stockage = stockageBlobs();
  deps = {
    config,
    secret,
    versionTables: process.env.TABLES_VERSION || '1',
    codeValide: (recu) => codeEgal(code, recu),
    stockage,
    horloge: horlogeSysteme,
    aleatoire,
    carte: sourceCarteKerro({ ...config.carte, photosSite: config.photosSite, stockage }),
  };
  return deps;
}
