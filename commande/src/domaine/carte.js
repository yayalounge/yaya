import { ErreurMetier } from './erreurs.js';
import { cle } from './texte.js';

// La carte vient de l'onglet Menu de l'espace fidélité du gérant (GET /api/menu/<slug>, voir docs/MENU-SITE.md
// du dépôt carte-fidelite) : { updatedAt, sections: [{ id, title, items: [{ name, description, price, photo, hidePhoto }] }] }.
//
// Ce qui se commande : un produit qui a un prix. Ce que le client doit choisir :
// - une liste « A · B · C » dans la description du produit (Softs : la boisson) ;
// - sinon la liste d'une ligne sans prix de la même rubrique (Chichas › « Goûts | | Hawaii · Love 66 · … »).
// Une ligne sans prix ne se commande pas ; elle ne sert qu'à donner ces choix.

const LISTE = /\s*·\s*/;
const liste = (description) => {
  const parts = String(description ?? '').split(LISTE).map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 ? parts.slice(0, 40).map((p) => p.slice(0, 60)) : null;
};
const centimes = (prix) => (typeof prix === 'number' && Number.isFinite(prix) && prix > 0 && prix < 1000 ? Math.round(prix * 100) : null);

export function lireCarteKerro(json, { photosSite } = {}) {
  if (!json || !Array.isArray(json.sections)) throw new ErreurMetier('carte_illisible', 'La carte reçue est illisible.', 502);
  const photosLocales = new Set(photosSite?.fichiers ?? []);
  const rubriques = [];
  const vues = new Set();
  for (const s of json.sections.slice(0, 60)) {
    if (!s || !Array.isArray(s.items)) continue;
    const id = cle(s.id || s.title) || `rubrique-${rubriques.length + 1}`;
    const titre = String(s.title ?? '').slice(0, 80) || 'Carte';
    const sansPrix = s.items.filter((i) => i && centimes(i.price) === null && liste(i.description));
    const choixRubrique = sansPrix[0] ? { libelle: String(sansPrix[0].name ?? 'Choix').slice(0, 40), options: liste(sansPrix[0].description) } : null;
    const articles = [];
    for (const i of s.items.slice(0, 200)) {
      const prix = centimes(i?.price);
      if (!i || prix === null || !String(i.name ?? '').trim()) continue;
      const nom = String(i.name).trim().slice(0, 80);
      const id_ = `${id}/${cle(nom)}`;
      if (vues.has(id_)) continue;
      vues.add(id_);
      const propres = liste(i.description);
      const k = cle(nom);
      const photo = i.hidePhoto ? null : typeof i.photo === 'string' && /^https:\/\//.test(i.photo) ? i.photo : photosLocales.has(k) ? `${photosSite.base}${k}.webp` : null;
      articles.push({
        id: id_,
        nom,
        description: propres ? null : String(i.description ?? '').slice(0, 240) || null,
        prix,
        photo,
        choix: propres ? { libelle: 'Au choix', options: propres } : choixRubrique,
      });
    }
    if (articles.length) rubriques.push({ id, titre, articles });
  }
  if (!rubriques.length) throw new ErreurMetier('carte_vide', 'La carte est vide pour le moment.', 503);
  return { majLe: typeof json.updatedAt === 'string' ? json.updatedAt : null, rubriques };
}

export function trouverArticle(carte, id) {
  for (const r of carte.rubriques) for (const a of r.articles) if (a.id === id) return { article: a, rubrique: r };
  return null;
}
