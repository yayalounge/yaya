import { ErreurMetier } from './erreurs.js';
import { trouverArticle } from './carte.js';
import { propre } from './texte.js';

// Le prix vient TOUJOURS de la carte : le téléphone n'envoie que des articles, des quantités, un choix et une remarque.
// lignes demandées : [{ article: 'plats/yaya-smash', quantite: 2, choix?: 'Menthe', remarque?: 'sans oignons' }]
export function chiffrerPanier(demande, carte, limites) {
  if (!Array.isArray(demande) || demande.length === 0) throw new ErreurMetier('panier_vide', 'Le panier est vide.');
  if (demande.length > limites.lignesParCommande) throw new ErreurMetier('panier_trop_long', `Pas plus de ${limites.lignesParCommande} lignes par commande.`);

  const lignes = [];
  for (const d of demande) {
    const id = typeof d?.article === 'string' ? d.article.slice(0, 200) : '';
    const trouve = trouverArticle(carte, id);
    if (!trouve) throw new ErreurMetier('article_indisponible', 'Un article de votre panier n’est plus à la carte. Retirez-le puis réessayez.', 409);
    const { article } = trouve;

    const quantite = d.quantite;
    if (!Number.isInteger(quantite) || quantite < 1 || quantite > limites.quantiteParArticle) {
      throw new ErreurMetier('quantite_invalide', `Entre 1 et ${limites.quantiteParArticle} par article.`);
    }

    let choix = null;
    if (article.choix) {
      choix = typeof d.choix === 'string' ? d.choix.trim() : '';
      if (!choix) throw new ErreurMetier('choix_requis', `Choisissez : ${article.choix.libelle.toLowerCase()} pour « ${article.nom} ».`);
      if (!article.choix.options.includes(choix)) throw new ErreurMetier('choix_invalide', `Ce choix n’existe plus pour « ${article.nom} ».`, 409);
    }
    const remarque = propre(d.remarque, limites.remarque) || null;

    const meme = lignes.find((l) => l.article === article.id && l.choix === choix && l.remarque === remarque);
    if (meme) meme.quantite += quantite;
    else lignes.push({ article: article.id, nom: article.nom, prixUnitaire: article.prix, quantite, choix, remarque });
  }

  for (const l of lignes) {
    if (l.quantite > limites.quantiteParArticle) throw new ErreurMetier('quantite_invalide', `Pas plus de ${limites.quantiteParArticle} « ${l.nom} » par commande.`);
    l.total = l.prixUnitaire * l.quantite;
  }
  const articles = lignes.reduce((n, l) => n + l.quantite, 0);
  if (articles > limites.articlesParCommande) throw new ErreurMetier('panier_trop_gros', `Pas plus de ${limites.articlesParCommande} articles par commande.`);
  const totalCentimes = lignes.reduce((n, l) => n + l.total, 0);
  if (totalCentimes > limites.totalMaxCentimes) throw new ErreurMetier('total_trop_eleve', 'Commande trop importante pour le téléphone : passez au comptoir.');
  return { lignes, totalCentimes };
}
