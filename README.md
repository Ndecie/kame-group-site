# KAME GROUP — site et plateforme

Prototype fonctionnel de la plateforme KAME GROUP (Libreville, Gabon) : site public, espace membre
(investisseurs, entreprises, commerçants, partenaires) et pages légales.

En ligne : https://kamegroupe.com

## Structure
- `build.py` — génère toutes les pages (FR/EN) dans `dist/`.
- `dist/` — le site publié par Netlify (HTML, `assets/css`, `assets/js`, `assets/img`, `assets/fonts`).
- `netlify.toml` — publication et en-têtes de sécurité.
- `SECURITY.md` — politique de sécurité.

## Espace investisseur (démonstration)
- `dist/assets/js/investor.js` — tableau de bord investisseur : accueil, annuaire des entreprises, fiche entreprise
  (KAME Score, KAME Data, KAME Registre, documents), opportunités, portefeuille, profil.
- Les entreprises, montants et scores sont **fictifs** et écrits dans ce fichier ; rien n'est envoyé à un serveur.
- `dist/assets/js/kame-icons.js` — icônes, généré par `build.py` (ne pas modifier à la main).
- `dist/assets/demo/attestation-kame-demo.txt` — document de démonstration reconnu par « Vérifier un document ».

## Modifier le site
1. Modifier `build.py` (textes, pages) ou les fichiers de `dist/assets/`.
2. Lancer `python3 build.py`.
3. Commiter et pousser : Netlify republie automatiquement.

## Prochaines étapes
Base de données et comptes (Supabase), panneau d'administration, KAME Data v1, KAME Score v1.
