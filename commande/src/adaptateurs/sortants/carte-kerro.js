import { ErreurMetier } from '../../domaine/erreurs.js';
import { lireCarteKerro } from '../../domaine/carte.js';

// Port SourceCarte → l'onglet Menu de l'espace fidélité Kerro Labs (GET /api/menu/yaya-lounge, public).
// - gardée 30 s en mémoire (une instance de fonction sert plusieurs clients) ;
// - la dernière carte valide est rangée dans le stockage : si Kerro ne répond pas, on commande sur celle-là ;
// - sans aucune carte connue : refus clair (« commandez au comptoir »).
const CLE = 'carte/derniere';

export function sourceCarteKerro({ url, delaiMs = 5000, cacheSecondes = 30, photosSite, stockage, fetch = globalThis.fetch, horloge = { maintenant: () => new Date() } }) {
  let memoire = null; // { carte, le }
  return {
    async charger() {
      const t = horloge.maintenant().getTime();
      if (memoire && t - memoire.le < cacheSecondes * 1000) return memoire.carte;
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(delaiMs), headers: { accept: 'application/json' } });
        if (!r.ok) throw new Error(`menu Kerro : HTTP ${r.status}`);
        const brut = await r.json();
        const carte = lireCarteKerro(brut, { photosSite });
        memoire = { carte, le: t };
        const garde = await stockage.lire(CLE).catch(() => null);
        if (garde?.valeur?.majLe !== brut.updatedAt || !garde) await stockage.ecrire(CLE, { majLe: brut.updatedAt ?? null, brut }, garde?.version ?? null).catch(() => {});
        return carte;
      } catch (e) {
        console.error('[carte]', e.message);
        const garde = await stockage.lire(CLE).catch(() => null);
        if (garde?.valeur?.brut) {
          const carte = lireCarteKerro(garde.valeur.brut, { photosSite });
          memoire = { carte, le: t - (cacheSecondes - 10) * 1000 }; // on réessaie Kerro dans 10 s
          return carte;
        }
        throw new ErreurMetier('carte_indisponible', 'La carte ne répond pas pour le moment. Commandez au comptoir.', 503);
      }
    },
  };
}
