# KAME GROUP — site et plateforme

Prototype fonctionnel de la plateforme KAME GROUP (Libreville, Gabon) : site public, espace membre
(investisseurs, entreprises, commerçants, partenaires) et pages légales.

En ligne : https://kamegroupe.com

## Structure
- `build.py` — génère toutes les pages (FR/EN) dans `dist/`.
- `dist/` — le site publié par Netlify (HTML, `assets/css`, `assets/js`, `assets/img`, `assets/fonts`).
- `netlify.toml` — publication et en-têtes de sécurité.
- `SECURITY.md` — politique de sécurité.

## Modifier le site
1. Modifier `build.py` (textes, pages) ou les fichiers de `dist/assets/`.
2. Lancer `python3 build.py`.
3. Commiter et pousser : Netlify republie automatiquement.

## Prochaines étapes
Base de données et comptes (Supabase), panneau d'administration, KAME Data v1, KAME Score v1.
