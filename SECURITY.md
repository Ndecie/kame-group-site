# Sécurité — KAME GROUP

## Signaler une faille
Si vous trouvez une faille de sécurité, merci de ne pas ouvrir de ticket public.
Utilisez le formulaire de contact de https://kamegroupe.com (sujet « Sécurité ») ou l'onglet
« Security → Report a vulnerability » de ce dépôt GitHub. Nous répondons sous 72 heures.

## Mesures en place
- HTTPS obligatoire (HSTS) et en-têtes de sécurité stricts (voir `netlify.toml`) :
  politique de sécurité du contenu (CSP) sans script en ligne ni script externe,
  protection contre l'intégration dans un cadre (clickjacking), `nosniff`, Referrer-Policy, Permissions-Policy.
- Aucun service tiers chargé par les pages (polices hébergées sur le site, pas de pistage).
- Comptes : mots de passe gérés par Netlify Identity (jamais visibles par KAME), rôles attribués uniquement par l'administratrice.
- Formulaires : champ anti-robot, longueurs limitées, aucun document sensible accepté.
- Aucune clé secrète dans le dépôt : elles vont dans les variables d'environnement Netlify.

## Règles pour les contributions
1. Ne jamais commiter de secret (`.env`, clés, jetons).
2. Toute vérification d'accès aux données se fait côté serveur, jamais seulement dans le navigateur.
3. Garder les dépendances à jour (alertes Dependabot activées).
