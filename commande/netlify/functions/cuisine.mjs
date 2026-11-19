import QRCode from 'qrcode';
import { dependances } from '../../src/adaptateurs/entrants/dependances.js';
import { json, erreur, lireCorps, empreinteReseau, ipDe, cookieSession, cookieEfface, sessionValide, verifierOrigine } from '../../src/adaptateurs/entrants/http.js';
import { connexionComptoir, ecranCuisine, changerStatutCommande, encaisserTable, mettreEnPause, liensTables, purger } from '../../src/application/cas-d-usage.js';
import { ErreurMetier } from '../../src/domaine/erreurs.js';

// Écran de la cuisine : /api/cuisine/<action>. Tout est fermé sans le code (cookie de session signé).
export default async (req, context) => {
  try {
    const deps = dependances();
    const action = new URL(req.url).pathname.split('/').pop();

    if (action === 'connexion' && req.method === 'POST') {
      const { code } = (await lireCorps(req)) ?? {};
      const bon = await connexionComptoir(deps, { code, reseau: empreinteReseau(deps.secret, ipDe(req, context)) });
      if (!bon) throw new ErreurMetier('code_faux', 'Code incorrect.', 401);
      purger(deps).catch((e) => console.error('[purge]', e.message));
      return json({ ok: true }, 200, { 'Set-Cookie': cookieSession(deps.secret, deps.config.sessionComptoirHeures) });
    }
    if (action === 'deconnexion' && req.method === 'POST') {
      verifierOrigine(req);
      return json({ ok: true }, 200, { 'Set-Cookie': cookieEfface });
    }

    if (!sessionValide(req, deps.secret)) return json({ erreur: 'session', message: 'Entrez le code de la cuisine.' }, 401);

    if (req.method === 'GET' && action === 'ecran') return json({ ...(await ecranCuisine(deps)), relecture: deps.config.relectureSecondes.comptoir });
    if (req.method === 'GET' && action === 'qr') {
      verifierOrigine(req);
      const tables = liensTables(deps, new URL(req.url).origin);
      for (const t of tables) t.svg = await QRCode.toString(t.lien, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
      return json({ tables });
    }
    if (req.method !== 'POST') throw new ErreurMetier('methode', 'Action inconnue.', 404);
    const corps = (await lireCorps(req)) ?? {};
    if (action === 'statut') return json({ commande: await changerStatutCommande(deps, { id: corps.id, statut: corps.statut }) });
    if (action === 'encaisser') return json({ ok: await encaisserTable(deps, { table: corps.table, jour: corps.jour }) });
    if (action === 'pause') return json({ pause: await mettreEnPause(deps, corps.pause) });
    throw new ErreurMetier('action', 'Action inconnue.', 404);
  } catch (e) {
    return erreur(e);
  }
};

export const config = { path: '/api/cuisine/:action' };
