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

## Espace entreprise (démonstration)
- `dist/assets/js/business.js` — un outil = une page : accueil, Mon entreprise, KAME ID, KAME Data, KAME Score, KAME Check,
  KAME Registre, KAME Garde, KAME Agro (si activité agricole), Mes investisseurs, Demandes reçues, Levées de fonds, Documents.
  KAME ID, KAME Check et KAME Registre ont deux onglets : « Pour mon entreprise » et « Pour mes clients ».
- Chiffres, clients et investisseurs **fictifs**, calculés dans le navigateur ; un fichier choisi reste sur l'appareil
  (seule son empreinte SHA-256 est calculée, pour le registre et les reçus certifiés).
- `dist/assets/js/kame-ui.js` — outils communs aux espaces investisseur, entreprise et commerçant (textes, graphiques,
  fenêtre, messages, menu du compte et notifications).

## Espace commerçant (démonstration, pensé d'abord pour le téléphone)
- `dist/assets/js/merchant.js`, adresses `#c-…`. Le commerçant est souvent lui-même son commerce : tout tourne autour
  de la journée (ouvrir, vendre, fermer en comptant la caisse) et de l'argent de la maison noté à part.
- Pages : Ma journée (KAME Data), Vendre (vente, dépense, « pour moi » ; montant au clavier, produits, espèces /
  Airtel Money / Moov Money / à crédit), Crédits (clients et fournisseurs, confirmation de dette par lien = KAME Registre,
  vérification KAME ID), Stock (acheté en gros, revendu au détail, bénéfice par carton), Reçus (KAME Registre),
  Mon KAME Score, Financement (dossier envoyé seulement avec accord, question du partenaire, échéances du prêt),
  Épargne et tontine, Ma vitrine (page vérifiée pour vendre sur WhatsApp), Mes papiers (KAME Check : ANPI, NIF,
  patente, mairie, facultatifs), Sécurité et aides (code, mode discret, appareils, aides avec droits limités),
  KAME Agro (si activité agricole), Plus (tous les outils, sur téléphone).
- KAME Score commerçant, même calcul pour tous : ventes notées chaque jour 20, crédits récupérés 15, fournisseurs et prêt
  payés à temps 15, épargne et tontine 10, ancienneté 10, identité et papiers 15, chiffres confirmés par d'autres 15.
- Sur téléphone (900 px et moins) : barre en bas (Ma journée · Crédits · Vendre · Score · Plus) ; le bouton
  « Enregistrer » de la page Vendre reste visible en bas de l'écran. Mode discret : les montants sont floutés.
- KAME ne touche jamais l'argent : les espèces sorties ne peuvent pas dépasser ce qu'il y a dans la caisse ;
  WhatsApp, Airtel Money et Moov Money sont simulés (rien n'est envoyé).

## Plusieurs espaces avec un seul compte
- Menu du compte → « Ajouter un espace » : la demande est enregistrée dans le compte (`user_metadata.espaces_demandes`)
  et envoie une alerte e-mail via le formulaire Netlify `nouvel-espace`. Elle ne donne **aucun** accès toute seule.
- L'équipe KAME ouvre l'espace en ajoutant le rôle dans Netlify : Identity → la personne → Edit settings → Roles
  (`investisseur`, `entreprise`, `commercant`, `partenaire`). Au rechargement, l'espace apparaît dans « Mes espaces ».
- Un lien direct ouvre le bon espace : `espace-membre.html#e-…` (entreprise), `#c-…` (commerçant).
- Le dernier espace utilisé est rouvert à la connexion suivante.

## Fin de page : la jointure de miel (toutes les pages, ordinateur et téléphone)
- Le bandeau et le pied de page ont les mêmes petites dents en nid d'abeille, décalées d'une demi-dent pour s'emboîter
  (`edge_svg(12, 'down')` en haut, `edge_svg(12, 'up', phase=18)` en bas, dans `build.py`).
- En bas de page, le bandeau descend jusqu'au pied de page ; une fine ligne de miel brille environ une seconde, puis la
  jointure reste fermée jusqu'à ce qu'on remonte. Sur téléphone, le pied de page étant plus haut que l'écran, la
  fermeture se fait quand il arrive sous le bandeau. Code : `updateSeal()` dans `main.js`, section « Fin de page » de `style.css`.
- Le miel qui coule sur les bords passe derrière le pied de page.

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
