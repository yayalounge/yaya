# Commande à table · Yäya Lounge

Le client scanne le QR de sa table, choisit sur la carte, envoie ; l'écran de la cuisine sonne, la cuisine **valide**
la commande, la sert, puis le comptoir encaisse la table. Paiement au comptoir.

- Client : `https://commande.yaya-lounge.fr/t/<table>?k=<signature>` (QR imprimés depuis l'écran de la cuisine)
- Cuisine : `https://commande.yaya-lounge.fr/cuisine/` (code)
- Hébergé sur le Netlify du gérant. La carte vient de l'espace fidélité Kerro Labs (onglet Menu), en lecture seule.
- Mise en ligne et sécurité : [docs/mise-en-ligne.md](docs/mise-en-ligne.md)

## Essayer en local

```bash
cd commande
npm install
npm test                      # 29 tests : domaine, cas d'usage, fonctions HTTP
HEURE=21:30 npm run dev       # http://localhost:8888, code cuisine 246810, carte d'exemple
```

## Architecture (hexagonale, légère)

```
src/domaine/        règles pures : carte, panier et prix, statuts, horaires, QR signés, garde-fous
src/ports/          contrats : SourceCarte, Stockage, Horloge, Fidelite (v2)
src/application/    cas d'usage : passer, suivre, valider, servir, encaisser, pause, QR, purge
src/adaptateurs/
  entrants/         HTTP (outils des fonctions Netlify, assemblage des dépendances)
  sortants/         carte Kerro, Netlify Blobs, stockage mémoire (tests), horloge
netlify/functions/  /api/carte, /api/commande, /api/suivi, /api/cuisine/*
public/             page du client (table.html), écran de la cuisine (cuisine/), QR (cuisine/qr.html)
config.json         tables, horaires, limites, conservation
```

Le domaine n'appelle ni le réseau, ni l'horloge, ni le stockage : tout lui est passé. Changer la source de la carte
ou le stockage = écrire un autre adaptateur, rien d'autre ne bouge.

Statuts : `nouvelle` → `validee` (la cuisine accepte) → `servie` → réglée ; `refusee` possible tant qu'elle n'est pas servie.
