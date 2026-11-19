import { readFileSync } from 'node:fs';
import config from '../config.json' with { type: 'json' };
import { stockageMemoire } from '../src/adaptateurs/sortants/stockage-memoire.js';
import { sourceCarteKerro } from '../src/adaptateurs/sortants/carte-kerro.js';
import { signerTable } from '../src/domaine/table.js';

export const MENU = JSON.parse(readFileSync(new URL('./fixtures/menu-kerro.json', import.meta.url)));
export const SECRET = 'secret-de-test-assez-long-pour-hmac-0123456789';
// 21 h à Paris le 19/11/2026 (UTC+1)
export const SOIR = new Date('2026-11-19T20:00:00Z');

export function fauxKerro(reponse = () => MENU) {
  let appels = 0;
  const f = async () => {
    appels++;
    const r = reponse();
    if (r instanceof Error) throw r;
    return { ok: true, status: 200, json: async () => structuredClone(r) };
  };
  f.appels = () => appels;
  return f;
}

export function deps({ maintenant = SOIR, kerro = fauxKerro(), stockage = stockageMemoire() } = {}) {
  const horloge = { t: maintenant, maintenant() { return this.t; } };
  let n = 0;
  return {
    config,
    secret: SECRET,
    versionTables: '1',
    codeValide: (c) => c === '246810',
    stockage,
    horloge,
    aleatoire: () => `aleatoire-${String(++n).padStart(12, '0')}`,
    carte: sourceCarteKerro({ ...config.carte, photosSite: config.photosSite, stockage, fetch: kerro, horloge }),
  };
}

export const k = (n) => signerTable(SECRET, '1', n);
