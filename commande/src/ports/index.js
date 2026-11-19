// Ports de l'application (architecture hexagonale) : ce dont le cœur a besoin, sans dire comment c'est fait.
// Les adaptateurs (src/adaptateurs/sortants) les remplissent : Kerro pour la carte, Netlify Blobs pour le stockage.

/**
 * Carte du salon, lue chez Kerro Labs (onglet Menu de l'espace fidélité).
 * @typedef {Object} SourceCarte
 * @property {() => Promise<import('../domaine/types.js').Carte>} charger  Lève ErreurMetier « carte_indisponible » si rien n'est lisible.
 */

/**
 * Stockage clé → valeur JSON avec version (écriture refusée si quelqu'un a écrit entre-temps).
 * @typedef {Object} Stockage
 * @property {(cle: string) => Promise<{ valeur: any, version: string } | null>} lire
 * @property {(cle: string, valeur: any, version: string | null) => Promise<boolean>} ecrire  version null = création seulement. false = conflit.
 * @property {(cle: string) => Promise<void>} supprimer
 * @property {(prefixe: string) => Promise<string[]>} lister
 */

/**
 * @typedef {Object} Horloge
 * @property {() => Date} maintenant
 */

/**
 * Fidélité (v2, pas encore branché) : tamponner la carte du client depuis l'écran de la cuisine.
 * @typedef {Object} Fidelite
 * @property {(qrCarte: string) => Promise<{ tampons: number, total: number }>} tamponner
 */

export {};
