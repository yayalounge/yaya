# Mise en ligne

Tout se fait sur le compte Google et le GitHub du gérant. Rien chez Kerro Labs.

## 1. Son appli YÄYA (Apps Script)

1. Ouvrir le projet Apps Script « YÄYA » (Google Sheets « YÄYA Commandes » › Extensions › Apps Script).
2. **Sauvegarde** : Fichier › Créer une copie du projet, ou copier `Code.gs` quelque part. Vérifier que son `Code.gs`
   en ligne est bien celui de `apps-script/Code.origine.gs` (sinon : le recopier, `npm run brancher`, relancer les tests).
3. Remplacer le contenu de `Code.gs` par `apps-script/Code.gs`.
4. Ajouter quatre fichiers (bouton +) avec exactement ces noms :
   - Script `CommandeTable` ← `apps-script/CommandeTable.gs`
   - Script `QrCode` ← `apps-script/QrCode.gs`
   - HTML `CommandeTableUi` ← `apps-script/CommandeTableUi.html`
   - HTML `CommandeTableQr` ← `apps-script/CommandeTableQr.html`
5. Déployer › **Gérer les déploiements** › crayon sur le déploiement **existant** › Version : Nouvelle version ›
   Déployer. Ne pas créer un nouveau déploiement : l'adresse `/exec` (et donc les liens Service et Gérant) ne change pas.
6. Dans ce même écran, vérifier « Qui peut accéder : **Tout le monde** ». Sinon le téléphone des clients ne peut pas
   envoyer de commande. Sans la clé `k`, cette adresse ne donne toujours accès qu'à la carte, la commande et le suivi.

Retour arrière : Gérer les déploiements › remettre la version précédente. Les commandes QR en attente disparaissent
de l'écran, le reste de l'appli est intact.

## 2. La page client (GitHub Pages)

1. Sur le GitHub `yayalounge`, créer un dépôt public vide `commande`.
2. Y pousser le contenu de `commande/site/` (avec `CNAME` et `.nojekyll`).
3. Dépôt › Settings › Pages : Source « Deploy from a branch », `main`, `/ (root)`.
4. Chez OVH (zone DNS de `yaya-lounge.fr`) : `CNAME` `commande` → `yayalounge.github.io.`
5. Une fois le certificat prêt (quelques minutes) : Settings › Pages › cocher **Enforce HTTPS**.

Si l'adresse `/exec` changeait un jour, mettre la nouvelle dans `site/index.html` (balise `yaya-api`).

## 3. Les QR

Gérant › bouton **QR des tables** (en haut) › « Télécharger le PDF », « Recevoir par mail » (adresse « Email du récap »
des Paramètres) ou « Imprimer ». 4 chevalets A6 par page A4, à découper sur les pointillés. Chaque QR mène à
`https://commande.yaya-lounge.fr/?t=<table>&k=<signature>`. Les tables viennent de l'onglet du plan.

## 4. Essai le premier soir

1. Un serveur prend son service dans YÄYA Service.
2. Scanner le QR d'une table, commander un soft : la commande sonne en haut de Service.
3. Valider : la table s'ouvre, le ticket part dans « À préparer ». Le téléphone affiche « Acceptée ».
4. Encaisser comme d'habitude : la vente apparaît dans l'onglet Ventes.
5. « Mettre les QR en pause » : le téléphone passe en lecture seule. Reprendre.
