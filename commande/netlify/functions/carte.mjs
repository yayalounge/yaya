import { dependances } from '../../src/adaptateurs/entrants/dependances.js';
import { json, erreur } from '../../src/adaptateurs/entrants/http.js';
import { carteClient, verifierTable } from '../../src/application/cas-d-usage.js';

// GET /api/carte?t=12&k=… : la carte, l'état du service et la validité du QR de la table.
export default async (req) => {
  try {
    const deps = dependances();
    const u = new URL(req.url);
    const table = Number(u.searchParams.get('t'));
    let tableOk = true;
    try { verifierTable(deps, table, u.searchParams.get('k') ?? ''); } catch { tableOk = false; }
    const { carte, etat } = await carteClient(deps);
    const { config } = deps;
    return json({
      table: tableOk ? table : null,
      carte,
      etat,
      majeurs: config.rubriquesMajeurs,
      fidelite: config.fidelite,
      relecture: config.relectureSecondes.client,
      limites: { remarque: config.limites.remarque, quantite: config.limites.quantiteParArticle, articles: config.limites.articlesParCommande },
    });
  } catch (e) {
    return erreur(e);
  }
};

export const config = { path: '/api/carte', method: 'GET' };
