# Commande à table · Yäya Lounge

Le client scanne le QR de sa table, choisit sur la carte, envoie. La commande arrive dans **YÄYA Service** (et Gérant),
en haut de l'écran, avec un son : « Commandes des tables · à valider ». Un serveur la **valide** : c'est exactement la
même action que s'il l'avait saisie lui-même (table ouverte, ticket « À préparer », puis encaissement et ventes comme
d'habitude). Il peut aussi la refuser, ou mettre les QR en pause. Paiement au comptoir.

But : plus de commande oubliée dans l'appli. Le client choisit, l'équipe valide, tout est tracé.

## Ce qui tourne où

| Quoi | Où | Chez qui |
| --- | --- | --- |
| Moteur : carte, prix, commandes, garde-fous | `apps-script/CommandeTable.gs` dans son projet Apps Script « YÄYA » | Google du gérant |
| Panneau « Commandes des tables » | `apps-script/CommandeTableUi.html`, ajouté à YÄYA Service et Gérant | Google du gérant |
| QR des tables à imprimer | `apps-script/CommandeTableQr.html` + `QrCode.gs`, bouton « QR des tables » dans Gérant | Google du gérant |
| Branchement dans son `Code.gs` (3 petites retouches) | `outils/brancher.mjs` produit `apps-script/Code.gs` depuis `Code.origine.gs` | |
| Page du client `commande.yaya-lounge.fr` | `site/` (statique, GitHub Pages) | GitHub du gérant |

Le client ne voit jamais d'adresse Google. Sa page appelle le `doPost` de l'appli, qui n'accepte que trois choses :
lire la carte, envoyer une commande, suivre ses commandes. Rien d'autre de l'appli n'est joignable sans la clé.

Données : la carte, les options et les tables viennent des onglets de son Google Sheets (rien à ressaisir). Les
commandes QR vivent dans l'état de l'appli (`st.web`), gardées 8 h.

## Garde-fous

- QR signés par table (HMAC, secret `WEB_SECRET` dans les propriétés du script, créé tout seul). Un QR recopié pour
  une autre table est refusé. `WEB_QR_VERSION` change toutes les signatures (il faut alors réimprimer).
- Commandes seulement pendant le service (un membre a pris son service) et hors pause.
- Prix recalculés par l'appli (`priceLine`), options obligatoires comme dans Service. Aucun texte libre du client.
- Plafonds avant toute lecture du Sheets : 30 s entre deux commandes d'un même téléphone, 30 commandes par minute
  pour tout le salon, 600 appels par minute ; au plus 3 commandes en attente par table, 20 lignes, 30 articles,
  10 du même, 300 € par commande.
- Valider est dédoublonné (`_op`) : une coupure réseau ne crée jamais deux tickets.

## Essayer sans toucher à son appli

```bash
cd commande
npm ci --ignore-scripts
npm test                     # la vraie appli du gérant dans une copie fidèle de Google : soirée complète, refus, garde-fous
node outils/essai-local.mjs  # page client + YÄYA Service dans un navigateur (code 1234), même copie
```

Mise à jour de son code : recopier son `Code.gs` dans `apps-script/Code.origine.gs`, puis `npm run brancher`.
Mise en ligne : [docs/mise-en-ligne.md](docs/mise-en-ligne.md).
