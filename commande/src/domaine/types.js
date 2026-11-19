/**
 * @typedef {{ libelle: string, options: string[] }} Choix
 * @typedef {{ id: string, nom: string, description: string | null, prix: number, photo: string | null, choix: Choix | null }} Article  prix en centimes
 * @typedef {{ id: string, titre: string, articles: Article[] }} Rubrique
 * @typedef {{ majLe: string | null, rubriques: Rubrique[] }} Carte
 */
export {};
