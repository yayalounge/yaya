# Mise en ligne (une fois, environ 15 minutes)

Tout tourne sur le compte Netlify **du gérant**. Kerro Labs n'héberge rien : la plateforme fidélité ne fait que
fournir la carte (onglet Menu de l'espace fidélité).

## 1. Netlify (le gérant)

1. Créer un compte gratuit sur netlify.com avec l'adresse du salon, puis **Add new project › Import an existing project › GitHub**,
   autoriser Netlify sur le dépôt `yayalounge/yaya`.
2. Réglages de construction :
   - **Base directory** : `commande`
   - le reste est lu dans `commande/netlify.toml` (publication `public`, fonctions `netlify/functions`, tests lancés à chaque mise en ligne).
3. **Project configuration › Environment variables**, ajouter (portée : Builds et Functions) :

| Variable | Valeur | À quoi ça sert |
| --- | --- | --- |
| `YAYA_SECRET` | 48 caractères au hasard (générateur de mots de passe), **jamais partagé** | Signe les QR des tables et la session de la cuisine |
| `COMPTOIR_CODE` | 6 à 12 chiffres, connus de l'équipe seulement | Code de l'écran de la cuisine |
| `TABLES_VERSION` | facultatif, `1` par défaut | Le passer à `2` rend tous les QR imprimés invalides (QR recopiés, abus) : il faut alors réimprimer |

4. **Deploys › Trigger deploy**. Si un test échoue, la mise en ligne s'arrête et l'ancienne version reste en place.

## 2. Adresse commande.yaya-lounge.fr (Moussa, chez OVH)

1. Netlify › **Domain management › Add a domain** › `commande.yaya-lounge.fr`.
2. OVH › zone DNS de `yaya-lounge.fr` › ajouter un **CNAME** `commande` → `<nom-du-projet>.netlify.app.` (le nom exact est affiché par Netlify).
3. Netlify pose le certificat HTTPS tout seul (quelques minutes). Ne rien toucher aux autres lignes de la zone (site, e-mails).

## 3. iPad de la cuisine

1. Safari › `https://commande.yaya-lounge.fr/cuisine/` › entrer le code.
2. Partager › **Sur l'écran d'accueil** : l'icône « Cuisine » s'ouvre en plein écran.
3. Chaque soir : ouvrir l'icône, toucher **Démarrer le service** (active le son et garde l'écran allumé). Volume de l'iPad monté,
   mode silencieux coupé. **Tester le son** est dans le menu « ••• ».
4. Laisser l'iPad branché : l'écran reste allumé tant que la page est ouverte.

## 4. QR des tables

Écran de la cuisine › « ••• » › **QR codes des tables** › Imprimer (A4, 4 chevalets par page, format A6). Coller ou poser chaque
QR sur **sa** table : un QR ne marche que pour son numéro. Avant de tout poser, faire une soirée d'essai avec 2 ou 3 tables.

## 5. Au quotidien

- **La carte** se change dans l'espace fidélité (onglet Menu). « Masqué (rupture) » retire aussi le produit de la commande, en moins d'une minute.
- **Pause** (en haut de l'écran) : plus aucune commande par téléphone, le client voit « Commandez au comptoir ».
- **Hors horaires** (17 h à 2 h, `config.json › horaires`) : les commandes sont refusées.
- **Valider** une commande : la cuisine la prend, le client voit « Acceptée ». **Refuser** (deux appuis) : le client voit « voyez le comptoir ».
- **Servie** puis **Encaisser** (deux appuis) quand la table a payé au comptoir.

## Ce qui protège le système

- QR signé : impossible d'inventer une table ou de deviner le lien d'une autre sans `YAYA_SECRET`.
- Prix toujours recalculés par le serveur à partir de la carte : le téléphone ne peut pas changer un prix.
- Au plus 3 commandes en attente par table, 1 commande toutes les 30 s par téléphone, 60 par heure par réseau, 30 articles et 300 € par commande.
- Commandes refusées hors horaires et en pause ; toute commande passe par la validation de la cuisine.
- Écran de la cuisine : code obligatoire, 8 essais par quart d'heure, session de 16 h dans un cookie protégé (HttpOnly, Secure, SameSite=Strict).
- Requêtes acceptées seulement depuis le site lui-même (origine vérifiée, JSON obligatoire, 16 Ko au plus).
- Aucune donnée personnelle demandée au client. Les commandes sont gardées 90 jours (Netlify Blobs, Europe), puis effacées.
- Si la carte Kerro ne répond pas, la dernière carte connue sert ; sans carte connue, la page dit de commander au comptoir.
- Aucun secret dans le dépôt : tout est dans les variables Netlify.
