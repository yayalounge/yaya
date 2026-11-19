import { getStore } from '@netlify/blobs';

// Port Stockage → Netlify Blobs du projet du gérant, en Europe (Francfort), lecture toujours à jour (strong).
export function stockageBlobs(nom = 'yaya-commande') {
  const store = getStore({ name: nom, region: 'eu-central-1', consistency: 'strong' });
  return {
    async lire(cle) {
      const r = await store.getWithMetadata(cle, { type: 'json' });
      return r ? { valeur: r.data, version: r.etag } : null;
    },
    async ecrire(cle, valeur, version) {
      const r = await store.setJSON(cle, valeur, version ? { onlyIfMatch: version } : { onlyIfNew: true });
      return r.modified;
    },
    supprimer: (cle) => store.delete(cle),
    async lister(prefixe) {
      const { blobs } = await store.list({ prefix: prefixe });
      return blobs.map((b) => b.key);
    },
  };
}
