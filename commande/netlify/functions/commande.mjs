import { dependances } from '../../src/adaptateurs/entrants/dependances.js';
import { json, erreur, lireCorps, empreinteReseau, ipDe } from '../../src/adaptateurs/entrants/http.js';
import { passerCommande, suivreCommandes } from '../../src/application/cas-d-usage.js';
import { ErreurMetier } from '../../src/domaine/erreurs.js';

// POST /api/commande { table, k, lignes } (en-tête X-Appareil) : envoie la commande en cuisine.
// POST /api/suivi { ids } : où en sont les commandes de ce téléphone.
const APPAREIL = /^[A-Za-z0-9_-]{16,40}$/;

export default async (req, context) => {
  try {
    const deps = dependances();
    const corps = await lireCorps(req);
    if (new URL(req.url).pathname === '/api/suivi') return json({ commandes: await suivreCommandes(deps, corps?.ids) });
    const appareil = req.headers.get('x-appareil') ?? '';
    if (!APPAREIL.test(appareil)) throw new ErreurMetier('appareil', 'Rechargez la page puis réessayez.');
    const commande = await passerCommande(deps, {
      table: corps?.table,
      k: corps?.k,
      lignes: corps?.lignes,
      appareil,
      reseau: empreinteReseau(deps.secret, ipDe(req, context)),
    });
    return json({ commande }, 201);
  } catch (e) {
    return erreur(e);
  }
};

export const config = { path: ['/api/commande', '/api/suivi'], method: 'POST' };
