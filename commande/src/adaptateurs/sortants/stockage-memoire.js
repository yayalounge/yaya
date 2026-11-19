// Port Stockage en mémoire : tests et essai en local. Même contrat que Netlify Blobs (versions, conflits).
export function stockageMemoire() {
  const m = new Map();
  let n = 0;
  return {
    async lire(cle) {
      const e = m.get(cle);
      return e ? { valeur: structuredClone(e.valeur), version: e.version } : null;
    },
    async ecrire(cle, valeur, version) {
      const e = m.get(cle);
      if (version === null ? e : !e || e.version !== version) return false;
      m.set(cle, { valeur: structuredClone(valeur), version: String(++n) });
      return true;
    },
    async supprimer(cle) { m.delete(cle); },
    async lister(prefixe) { return [...m.keys()].filter((k) => k.startsWith(prefixe)); },
  };
}
