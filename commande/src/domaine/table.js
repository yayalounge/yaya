import { createHmac, timingSafeEqual } from 'node:crypto';

// Chaque QR porte le numéro de la table et une signature courte : /t/12?k=Xy3…
// Sans la clé du salon (YAYA_SECRET, chez Netlify), impossible d'inventer la table 99 ni de deviner la signature d'une autre.
// « version » change toutes les signatures d'un coup (QR recopiés, abus) : il suffit alors de réimprimer.
export const signerTable = (secret, version, n) => createHmac('sha256', secret).update(`yaya-table:${version}:${n}`).digest('base64url').slice(0, 12);

export function tableValide(secret, version, nbTables, table, k) {
  if (!Number.isInteger(table) || table < 1 || table > nbTables || typeof k !== 'string' || k.length !== 12) return false;
  const attendu = Buffer.from(signerTable(secret, version, table));
  const recu = Buffer.from(k);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}
