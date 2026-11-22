# KAME GROUP — site et plateforme

Prototype fonctionnel de la plateforme KAME GROUP (Libreville, Gabon) : site public, espace membre
(investisseurs, entreprises, commerçants, partenaires) et pages légales.

En ligne : https://kamegroupe.com

## Structure
- `build.py` — génère toutes les pages (FR/EN) dans `dist/`.
- `dist/` — le site publié par Netlify (HTML, `assets/css`, `assets/js`, `assets/img`, `assets/fonts`).
- `dist/en/` — la version anglaise des pages publiques, générée par `build.py` (ne pas modifier à la main).
- `netlify.toml` — publication et en-têtes de sécurité.
- `SECURITY.md` — politique de sécurité.

## Espace investisseur (démonstration)
- `dist/assets/js/investor.js` — tableau de bord investisseur : accueil, annuaire des entreprises, fiche entreprise
  (KAME Score, KAME Data, KAME Registre, documents), opportunités, portefeuille, profil.
- Les entreprises, montants et scores sont **fictifs** et écrits dans ce fichier ; rien n'est envoyé à un serveur.
- `dist/assets/js/kame-icons.js` — icônes, généré par `build.py` (ne pas modifier à la main).
- `dist/assets/demo/attestation-kame-demo.txt` — document de démonstration reconnu par « Vérifier un document ».

## Espace entreprise et espace commerçant (démonstration)
- `dist/assets/js/business.js` — un outil = une page : accueil, Mon entreprise, KAME ID, KAME Data, KAME Score, KAME Check,
  KAME Registre, KAME Garde, KAME Agro (si activité agricole), Mes investisseurs, Demandes reçues, Levées de fonds, Documents.
  KAME ID, KAME Check et KAME Registre ont deux onglets : « Pour mon entreprise » et « Pour mes clients ».
  Le commerçant a un menu simplifié (ventes, reçus clients, vérifier un client, financement).
- Chiffres, clients et investisseurs **fictifs**, calculés dans le navigateur ; un fichier choisi reste sur l'appareil
  (seule son empreinte SHA-256 est calculée, pour le registre et les reçus certifiés).
- `dist/assets/js/kame-ui.js` — outils communs aux espaces investisseur et entreprise (textes, graphiques, fenêtre,
  messages, menu du compte et notifications).

## Plusieurs espaces avec un seul compte
- Menu du compte → « Ajouter un espace » : la demande est enregistrée dans le compte (`user_metadata.espaces_demandes`)
  et envoie une alerte e-mail via le formulaire Netlify `nouvel-espace`. Elle ne donne **aucun** accès toute seule.
- L'équipe KAME ouvre l'espace en ajoutant le rôle dans Netlify : Identity → la personne → Edit settings → Roles
  (`investisseur`, `entreprise`, `commercant`, `partenaire`). Au rechargement, l'espace apparaît dans « Mes espaces ».
- Le dernier espace utilisé est rouvert à la connexion suivante.

## Référencement (Google)
- Titres et descriptions des pages, en français et en anglais : dictionnaire `SEO` dans `build.py`.
- Pages publiques : français à la racine (kamegroupe.com/investisseur), anglais dans /en/ (kamegroupe.com/en/investisseur),
  reliées entre elles pour Google (hreflang). Connexion et espace membre gardent le bouton FR/EN sur place.
- Carte d'identité de KAME GROUP pour Google (données structurées) sur la page d'accueil.
  Ajouter les réseaux sociaux officiels dans `SAME_AS` dès qu'ils existent.
- `sitemap.xml` et `robots.txt` sont regénérés à chaque `python3 build.py`.

## Modifier le site
1. Modifier `build.py` (textes, pages) ou les fichiers de `dist/assets/`.
2. Lancer `python3 build.py`.
3. Commiter et pousser : Netlify republie automatiquement.

## Prochaines étapes
Base de données et comptes (Supabase), panneau d'administration, KAME Data v1, KAME Score v1.
