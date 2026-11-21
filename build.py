# -*- coding: utf-8 -*-
"""Génère le site statique KAME GROUP (FR/EN) dans dist/.
Toutes les pages partagent le même en-tête, le même pied de page et le même style."""
import json
import math
import os
import re
import html as H

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

# Coordonnées : à compléter dès qu'elles sont connues (laisser vide pour masquer la ligne)
CONTACT_EMAIL = ''
CONTACT_PHONE = ''
CITY = 'Libreville, Gabon'

# Adresse définitive du site (Google, aperçus de partage, plan du site)
SITE_URL = 'https://kamegroupe.com'
UPDATED = '2026-11-21'
UPDATED_FR, UPDATED_EN = '21 novembre 2026', 'November 21, 2026'
OG_SIZE = (1200, 630)
# Pages à proposer à Google (merci.html et 404.html restent hors de l'index)
SITEMAP_PAGES = ['index.html', 'partenaire.html', 'commercant.html', 'entreprise.html', 'investisseur.html',
                 'formations.html', 'connexion.html', 'confidentialite.html', 'conditions-utilisation.html', 'cookies.html',
                 'mentions-legales.html', 'tarifs-remboursements.html', 'accessibilite.html', 'suppression-donnees.html',
                 'plan-du-site.html']
LEGAL_ENTITY = ''      # forme juridique, ex. « SARL au capital de … »
LEGAL_RCCM = ''        # numéro RCCM
LEGAL_NIF = ''         # numéro d'identification fiscale
LEGAL_ADDRESS = ''     # adresse postale complète
PUBLISHER = 'Ndecie Boulandi, fondatrice et présidente'
# Réseaux sociaux officiels (LinkedIn, Facebook, Instagram…) : ajouter les adresses dès qu'ils existent,
# Google les relie alors à KAME GROUP
SAME_AS = []

# Langue de la page en cours de génération :
# 'fr' et 'en' : pages publiques écrites dans une seule langue (la version anglaise est dans /en/), pour Google ;
# 'bi' : pages de l'application (connexion, espace membre, merci, 404) avec le bouton FR/EN qui bascule sur place.
MODE = 'bi'
CURRENT = 'index.html'
PUBLIC_PAGES = ['index.html', 'investisseur.html', 'entreprise.html', 'commercant.html', 'partenaire.html', 'formations.html',
                'confidentialite.html', 'conditions-utilisation.html', 'cookies.html', 'mentions-legales.html',
                'tarifs-remboursements.html', 'accessibilite.html', 'suppression-donnees.html', 'plan-du-site.html']

# Titres et descriptions affichés par Google, en français et en anglais (une seule source à modifier)
SEO = {
    'index.html': (
        'KAME GROUP | Fintech au Gabon : identité numérique, score et données',
        'KAME GROUP | Fintech in Gabon: digital identity, credit scoring and data',
        "KAME GROUP, fintech gabonaise basée à Libreville : identité numérique (KYC), KAME Score et données fiables pour investir au Gabon et financer les PME.",
        'KAME GROUP is a Gabonese fintech based in Libreville: digital identity (KYC), the KAME Score and reliable data to invest in Gabon and finance SMEs.'),
    'investisseur.html': (
        "Investir au Gabon : PME vérifiées, KAME Score et opportunités | KAME GROUP",
        'Invest in Gabon: verified SMEs, KAME Score and opportunities | KAME GROUP',
        "Investissez au Gabon en confiance : entreprises vérifiées, KAME Score de solvabilité, données KAME Data et opportunités d'investissement dans les PME gabonaises.",
        'Invest in Gabon with confidence: verified businesses, the KAME Score for creditworthiness, KAME Data insights and investment opportunities in Gabonese SMEs.'),
    'entreprise.html': (
        'PME au Gabon : identité, conformité, données et financement | KAME GROUP',
        'SMEs in Gabon: identity, compliance, data and funding | KAME GROUP',
        "Entreprises du Gabon : identifiez vos clients avec KAME ID, restez conformes, protégez vos données et prouvez votre fiabilité aux investisseurs avec le KAME Score.",
        'Businesses in Gabon: identify your customers with KAME ID, stay compliant, protect your data and prove your reliability to investors with the KAME Score.'),
    'commercant.html': (
        'Commerçants au Gabon : identité vérifiée, crédit et suivi des ventes | KAME GROUP',
        'Merchants in Gabon: verified identity, credit access and sales tracking | KAME GROUP',
        "Boutique, marché, artisanat ou commerce agricole au Gabon : une identité vérifiée, un dossier fiable pour accéder au financement et des outils simples pour suivre vos ventes.",
        'Shop, market stall, crafts or farm trade in Gabon: a verified identity, a reliable file to access financing and simple tools to track your sales.'),
    'partenaire.html': (
        "Devenir partenaire d'une fintech au Gabon | KAME GROUP",
        'Partner with a fintech in Gabon | KAME GROUP',
        "PayTech, entreprises technologiques, institutions et écoles : devenez partenaire de KAME GROUP pour bâtir des solutions numériques et financières au Gabon et en Afrique centrale.",
        'PayTechs, technology companies, institutions and schools: partner with KAME GROUP to build digital and financial solutions for Gabon and Central Africa.'),
    'formations.html': (
        'Formations numériques pour les entreprises au Gabon | KAME GROUP',
        'Digital skills training for businesses in Gabon | KAME GROUP',
        "Formations KAME GROUP pour les équipes des entreprises membres au Gabon : outils KAME, digitalisation des documents, paiements numériques et bonnes pratiques (bientôt).",
        "KAME GROUP training for member businesses' teams in Gabon: KAME tools, digitising documents, digital payments and good practices (coming soon)."),
    'confidentialite.html': (
        'Politique de confidentialité | KAME GROUP', 'Privacy policy | KAME GROUP',
        'Comment KAME GROUP collecte, utilise et protège vos informations : données collectées, utilisation, durée de conservation et vos droits.',
        'How KAME GROUP collects, uses and protects your information: data collected, use, retention period and your rights.'),
    'conditions-utilisation.html': (
        "Conditions d'utilisation | KAME GROUP", 'Terms of use | KAME GROUP',
        "Conditions d'utilisation du site et de l'espace membre KAME GROUP : accès, engagements, absence de conseil en investissement, données et droit applicable.",
        'Terms of use of the KAME GROUP website and member area: access, commitments, no investment advice, data and governing law.'),
    'cookies.html': (
        'Politique cookies | KAME GROUP', 'Cookie policy | KAME GROUP',
        'Politique cookies de KAME GROUP : aucun cookie publicitaire ni de pistage, seulement le strict nécessaire. Gérez vos préférences.',
        'KAME GROUP cookie policy: no advertising or tracking cookies, only what is strictly necessary. Manage your preferences.'),
    'mentions-legales.html': (
        'Mentions légales | KAME GROUP', 'Legal notice | KAME GROUP',
        'Mentions légales de KAME GROUP : éditeur, responsable de la publication, hébergeur et crédits.',
        'KAME GROUP legal notice: publisher, publication director, host and credits.'),
    'tarifs-remboursements.html': (
        'Tarifs et remboursements | KAME GROUP', 'Pricing and refunds | KAME GROUP',
        'Tarifs et remboursements KAME GROUP : accès gratuit au prototype, aucun frais caché, conditions publiées avant toute offre payante.',
        'KAME GROUP pricing and refunds: free access to the prototype, no hidden fees, terms published before any paid offer.'),
    'accessibilite.html': (
        'Accessibilité | KAME GROUP', 'Accessibility | KAME GROUP',
        "Déclaration d'accessibilité de KAME GROUP : navigation au clavier, textes alternatifs, contrastes et formulaires accessibles.",
        'KAME GROUP accessibility statement: keyboard navigation, text alternatives, contrast and accessible forms.'),
    'suppression-donnees.html': (
        'Supprimer mes données | KAME GROUP', 'Delete my data | KAME GROUP',
        "Demandez l'accès, la correction ou la suppression de vos données personnelles chez KAME GROUP, et la fermeture de votre compte.",
        'Ask KAME GROUP to access, correct or delete your personal data, or to close your account.'),
    'plan-du-site.html': (
        'Plan du site | KAME GROUP', 'Site map | KAME GROUP',
        'Plan du site KAME GROUP : toutes les pages.', 'KAME GROUP site map: all pages.'),
}


def page_url(fname, lang='fr'):
    # Adresse retenue par Google : sans « .html », comme Netlify affiche les pages (Pretty URLs) ;
    # la version anglaise est dans /en/
    slug = '' if fname == 'index.html' else fname[:-5]
    return '%s%s/%s' % (SITE_URL, '/en' if lang == 'en' else '', slug)


def local_href(fname, lang):
    # Lien vers une page publique dans une langue donnée (Netlify retire « .html » à la publication)
    prefix = '/en/' if lang == 'en' else '/'
    return prefix if fname == 'index.html' else prefix + fname

GOLD, NAVY = '#F2B33D', '#12304A'


# ---------------------------------------------------------------- textes FR/EN
def fr_typo(s):
    for p in (' :', ' ?', ' !', ' ;'):
        s = s.replace(p, '&#8239;' + p[1])
    return s


def T(fr, en):
    # Page publique : une seule langue écrite dans la page ; application : les deux, la feuille de style affiche la bonne
    if MODE == 'fr':
        return fr_typo(fr)
    if MODE == 'en':
        return en
    return '<span class="t-fr">%s</span><span class="t-en" lang="en">%s</span>' % (fr_typo(fr), en)


def attr(s):
    return H.escape(s, quote=True)


def bi_attr(name, fr, en):
    if MODE in ('fr', 'en'):
        return '%s="%s"' % (name, attr(fr if MODE == 'fr' else en))
    return '%s="%s" data-%s-fr="%s" data-%s-en="%s"' % (name, attr(fr), name, attr(fr), name, attr(en))


def opt(value, fr, en):
    # Option de liste déroulante dans la langue de la page
    if MODE in ('fr', 'en'):
        return '<option value="%s">%s</option>' % (attr(value), fr if MODE == 'fr' else en)
    return '<option value="%s" data-text-fr="%s" data-text-en="%s">%s</option>' % (attr(value), attr(fr), attr(en), fr)


# ---------------------------------------------------------------- icônes (24 x 24, trait)
ICONS = {
    'home': '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'bell': '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/>',
    'help': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5"/><path d="M12 17h.01"/>',
    'logout': '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="m10 17-5-5 5-5"/><path d="M5 12h11"/>',
    'chevron': '<path d="m6 9 6 6 6-6"/>',
    'briefcase': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
    'building': '<rect x="4" y="3" width="10" height="18" rx="1"/><path d="M14 9h5a1 1 0 0 1 1 1v11h-6"/><path d="M7.5 7h3M7.5 11h3M7.5 15h3"/>',
    'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    'trend': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    'trenddown': '<path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    'lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'file': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    'upload': '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
    'star': '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    'shield': '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'heart': '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    'truck': '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    'pie': '<path d="M12 3v9h9"/><path d="M20.5 15A9 9 0 1 1 9 3.5"/>',
    'bookmark': '<path d="M6 3h12v18l-6-4-6 4z"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    'ok': '<path d="m5 12.5 4.5 4.5L19 7"/>',
    'id': '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.2c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4"/><path d="M14.5 10h4"/><path d="M14.5 13.5h3"/>',
    'check': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 14.5 2 2 4-4"/>',
    'garde': '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9.5a2 2 0 0 1 4 0V11"/>',
    'registre': '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h3.5a2 2 0 0 1 2 2V14"/><path d="M14 17.5h-3.5a2 2 0 0 1-2-2V10"/>',
    'data': '<path d="M4 20h16"/><rect x="6" y="11" width="3" height="7" rx=".5"/><rect x="11" y="7" width="3" height="11" rx=".5"/><rect x="16" y="13" width="3" height="5" rx=".5"/>',
    'score': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/><path d="M8 13v-2.5"/><path d="M10.5 13V8"/><path d="M13 13v-3.5"/>',
    'agro': '<path d="M12 21v-9"/><path d="M12 12C12 7 8.5 4 4 4c0 5 3.5 8 8 8z"/><path d="M12 14c0-4 3-7 8-7 0 4-3 7-8 7z"/>',
    'design': '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><rect x="7" y="8.5" width="7" height="4.5" rx=".8"/><path d="M7 10.5h7"/>',
    'partner': '<circle cx="8" cy="9" r="3"/><circle cx="16.5" cy="9" r="3"/><path d="M2.5 19c.8-2.6 2.9-4 5.5-4s4.7 1.4 5.5 4"/><path d="M13.5 15.3c.9-.2 1.9-.3 3-.3 2.6 0 4.7 1.4 5.5 4"/>',
    'merchant': '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12v8h13v-8"/><path d="M10 20v-4.5h4V20"/>',
    'business': '<rect x="4" y="3" width="11" height="18" rx="1"/><path d="M15 9h4a1 1 0 0 1 1 1v11h-5"/><path d="M8 7h3"/><path d="M8 11h3"/><path d="M8 15h3"/><path d="M3 21h18"/>',
    'investor': '<path d="M4 20h16"/><path d="m5 15 4.5-4.5 3.5 3.5L19 8"/><path d="M15 8h4v4"/>',
    'pay': '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><path d="M6.5 15h4"/>',
    'book': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    'grid': '<rect x="3" y="3" width="7.5" height="7.5" rx="1.2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2"/>',
    'single': '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M2 9v6"/><path d="M22 9v6"/>',
    'pin': '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    'phone': '<path d="M5 3h3.5l1.7 4.5-2.2 1.4a11 11 0 0 0 7.1 7.1l1.4-2.2L21 15.5V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    'arrow': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    'left': '<path d="m15 5-7 7 7 7"/>',
    'right': '<path d="m9 5 7 7-7 7"/>',
    'menu': '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    'close': '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    'chat': '<path d="M4 5h16v11H9l-5 4z"/>',
}


def icon(key, size=24, sw=1.75):
    return ('<svg aria-hidden="true" focusable="false" width="%d" height="%d" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</svg>'
            % (size, size, sw, ICONS[key]))


# ---------------------------------------------------------------- bords en nid d'abeille
def edge_svg(s, direction='down', W=4200, o=1.0):
    a = math.sqrt(3) / 2 * s
    P = 3 * s
    Hh = o + a + 1
    pts = []
    if direction == 'down':
        pts += [(0, 0), (0, o)]
        k = 0
        while s / 2 + k * P <= W:
            x0 = s / 2 + k * P
            pts += [(x0, o), (x0 + s / 2, o + a), (x0 + 1.5 * s, o + a), (x0 + 2 * s, o)]
            k += 1
        pts += [(W, o), (W, 0)]
        cls = 'edge edge-down'
    else:
        base = Hh - o
        pts += [(0, Hh), (0, base)]
        k = 0
        while s / 2 + k * P <= W:
            x0 = s / 2 + k * P
            pts += [(x0, base), (x0 + s / 2, base - a), (x0 + 1.5 * s, base - a), (x0 + 2 * s, base)]
            k += 1
        pts += [(W, base), (W, Hh)]
        cls = 'edge edge-up'
    d = 'M' + 'L'.join('%.2f %.2f' % p for p in pts) + 'Z'
    return '<svg class="%s" height="%.2f" aria-hidden="true" focusable="false"><path d="%s"/></svg>' % (cls, Hh, d)


def hc_shape():
    return '<svg class="hc-shape" aria-hidden="true" focusable="false" preserveAspectRatio="none"><path d=""/></svg>'


# ---------------------------------------------------------------- abeilles
def bee_body(eyes='open', antennae=True, extra=''):
    wings = ('<g transform="translate(17 25) rotate(-28)"><ellipse class="wing" cx="0" cy="-9" rx="8.5" ry="13"/></g>'
             '<g transform="translate(43 25) rotate(28)"><ellipse class="wing" cx="0" cy="-9" rx="8.5" ry="13"/></g>')
    if eyes == 'open':
        e = ('<circle cx="26" cy="17" r="2.1" fill="%s"/><circle cx="34" cy="17" r="2.1" fill="%s"/>'
             '<circle cx="26.7" cy="16.3" r=".75" fill="#fff"/><circle cx="34.7" cy="16.3" r=".75" fill="#fff"/>' % (NAVY, NAVY))
    else:
        e = ('<path d="M24 17.5 Q26 19.2 28 17.5" stroke="%s" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
             '<path d="M32 17.5 Q34 19.2 36 17.5" stroke="%s" stroke-width="1.5" fill="none" stroke-linecap="round"/>' % (NAVY, NAVY))
    ant = ''
    if antennae:
        ant = ('<path d="M26 8.5 Q23 2 18.5 2.5" stroke="{n}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="18.5" cy="2.5" r="2" fill="{n}"/>'
               '<path d="M34 8.5 Q37 2 41.5 2.5" stroke="{n}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="41.5" cy="2.5" r="2" fill="{n}"/>').format(n=NAVY)
    return (wings +
            '<ellipse cx="30" cy="40" rx="12.5" ry="14.5" fill="{g}" stroke="{n}" stroke-width="2"/>'
            '<path d="M20 36 Q30 41 40 36" stroke="{n}" stroke-width="4.5" fill="none"/>'
            '<path d="M20.5 45 Q30 50 39.5 45" stroke="{n}" stroke-width="4.5" fill="none"/>'
            '<path d="M27.5 54 L30 59 L32.5 54 Z" fill="{n}"/>'
            '<path d="M19.5 35 L13 41" stroke="{n}" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
            '<circle cx="30" cy="18" r="10.5" fill="{g}" stroke="{n}" stroke-width="2"/>'.format(g=GOLD, n=NAVY)
            + e +
            '<path d="M26.5 22 Q30 25 33.5 22" stroke="%s" stroke-width="1.6" fill="none" stroke-linecap="round"/>' % NAVY
            + ant + extra)


ARM = '<path d="M40.5 35 L%s" stroke="%s" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
HAT = ('<ellipse cx="30" cy="10" rx="15.5" ry="3.8" fill="#D9A15B" stroke="#9A5B3C" stroke-width="1"/>'
       '<path d="M21.5 10 Q22.5 1.8 30 1.8 Q37.5 1.8 38.5 10 Z" fill="#E7B66D" stroke="#9A5B3C" stroke-width="1"/>'
       '<path d="M22.2 8.3 Q30 6.6 37.8 8.3" stroke="#B8734F" stroke-width="2" fill="none"/>')
GLASSES = '<g fill="none" stroke="%s" stroke-width="1.3"><circle cx="26" cy="17" r="3.4"/><circle cx="34" cy="17" r="3.4"/><path d="M29.4 17 H30.6"/></g>' % NAVY

HIVE_ROLES = {
    'garde': dict(
        prop='<rect x="44" y="47" width="25" height="3.6" rx="1.2" fill="#DCE8E8"/>'
             '<rect x="47" y="31" width="19" height="16.5" rx="1.6" fill="#0B2A31" stroke="#9FE1DA" stroke-width="1"/>'
             '<path class="screen-glow" d="M56.5 34 l4 1.5 v3 c0 2.4 -1.7 4.1 -4 4.7 c-2.3 -.6 -4 -2.3 -4 -4.7 v-3 z" fill="#159E96"/>',
        arm='<path class="arm-type" d="M40.5 35 L47 45" stroke="%s" stroke-width="2.6" stroke-linecap="round" fill="none"/>' % NAVY,
        extra='', antennae=True),
    'agro': dict(
        prop='<path d="M50 49 L63 49 L61 58 L52 58 Z" fill="#B8734F"/><rect x="49" y="47.5" width="15" height="3" rx="1" fill="#9A5B3C"/>'
             '<g class="sway"><path d="M56.5 48 V40" stroke="#159E96" stroke-width="2" fill="none"/>'
             '<path d="M56.5 42 Q50.5 38.5 49.5 33.5 Q55.5 34.5 56.5 40 Z" fill="#159E96"/>'
             '<path d="M56.5 40.5 Q61.5 35.5 66 35.5 Q64 41 56.5 42 Z" fill="#9FE1DA"/></g>',
        arm='<g class="pour"><path d="M40.5 35 L45.5 40" stroke="{n}" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
            '<rect x="44.5" y="37" width="8" height="6.5" rx="1.4" fill="#9FE1DA" stroke="{n}" stroke-width="1"/>'
            '<path d="M52.5 39 L56.5 36" stroke="{n}" stroke-width="1.6" stroke-linecap="round"/>'
            '<circle class="water" cx="57" cy="38.5" r=".9" fill="#9FE1DA"/><circle class="water w2" cx="58" cy="38" r=".9" fill="#9FE1DA"/></g>'.format(n=NAVY),
        extra=HAT, antennae=False),
    'score': dict(
        prop='<rect x="45" y="29" width="21" height="23" rx="2" fill="#FFFFFF" stroke="#D6E5E5"/>'
             '<rect x="48.5" y="43" width="3.2" height="6" fill="#159E96"/><rect x="53.6" y="39" width="3.2" height="10" fill="#159E96"/>'
             '<rect x="58.7" y="35" width="3.2" height="14" fill="#B8734F"/><path d="M48 49.8 H63" stroke="#B5CBCB" stroke-width="1"/>',
        arm='<g class="scan"><path d="M40.5 35 L45 44" stroke="{n}" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
            '<path d="M45 44 L47.8 41.2" stroke="{n}" stroke-width="2.2" stroke-linecap="round"/>'
            '<circle cx="51" cy="38" r="4.6" fill="#9FE1DA" fill-opacity=".4" stroke="{n}" stroke-width="1.8"/></g>'.format(n=NAVY),
        extra=GLASSES, antennae=True),
    'id': dict(
        prop='',
        arm=(ARM % ('45 41', NAVY)) +
            '<g class="flip"><rect x="43" y="33" width="20" height="14" rx="2" fill="#FFFFFF" stroke="#D6E5E5"/>'
            '<circle cx="48" cy="39" r="2.6" fill="#159E96"/><rect x="52" y="36.5" width="8" height="1.7" rx=".8" fill="#B5CBCB"/>'
            '<rect x="52" y="40" width="6" height="1.7" rx=".8" fill="#B5CBCB"/><rect x="45.5" y="43.3" width="14" height="1.5" rx=".7" fill="#DCE8E8"/></g>'
            '<g class="check-pop"><circle cx="62" cy="33" r="3.4" fill="#0E7C75"/>'
            '<path d="M60.4 33 l1.2 1.2 l2.2 -2.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>',
        extra='', antennae=True),
    'data': dict(
        prop='<rect x="44.5" y="30" width="22" height="17.5" rx="2.6" fill="#0B2A31" stroke="#9FE1DA" stroke-width="1"/>'
             '<rect class="grow" x="48.5" y="35.5" width="3.2" height="9" fill="#159E96"/>'
             '<rect class="grow g2" x="53.7" y="33" width="3.2" height="11.5" fill="#9FE1DA"/>'
             '<rect class="grow g3" x="58.9" y="37.5" width="3.2" height="7" fill="#E8A93A"/>',
        arm=ARM % ('45.5 37.5', NAVY), extra='', antennae=True),
    'design': dict(
        prop='<rect x="45" y="27" width="21" height="22" rx="2" fill="#FFFFFF" stroke="#D6E5E5"/>'
             '<polygon class="draw" points="61.5,38 58.5,43.2 52.5,43.2 49.5,38 52.5,32.8 58.5,32.8" fill="none" stroke="#159E96" stroke-width="1.6" stroke-linejoin="round"/>',
        arm='<g class="pencil"><path d="M40.5 35 L47 42" stroke="{n}" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
            '<path d="M47 42 l6 -6 l2.2 2.2 l-6 6 z" fill="#E8A93A" stroke="{n}" stroke-width=".8"/>'
            '<path d="M47 42 l-1.2 3.4 l3.4 -1.2 z" fill="{n}"/></g>'.format(n=NAVY),
        extra='', antennae=True),
}


def hive_bee(role, x, y, start, dx, dy, rot, scale=0.92):
    r = HIVE_ROLES[role]
    return ('<g class="hive-bee" data-start="%s" data-dx="%s" data-dy="%s" data-rot="%s" transform="translate(%s %s) scale(%s)">'
            '<g class="work">%s</g><g class="bee-fly"><g class="bob">%s%s</g></g></g>'
            % (start, dx, dy, rot, x, y, scale, r['prop'], bee_body('open', r['antennae'], r['extra']), r['arm']))


def leaf(x, y, ang, L, color, vein='#0B4F4A'):
    return ('<g transform="translate(%s %s) rotate(%s)"><path d="M0 0 C%.1f %.1f %.1f %.1f %.1f 0 C%.1f %.1f %.1f %.1f 0 0 Z" fill="%s"/>'
            '<path d="M2 0 L%.1f 0" stroke="%s" stroke-width="1.4" stroke-opacity=".55"/></g>'
            % (x, y, ang, L * .25, -L * .3, L * .75, -L * .3, L, L * .75, L * .3, L * .25, L * .3, color, L * .9, vein))


def hex_points(cx, cy, s):
    h = math.sqrt(3) / 2 * s
    return ' '.join('%.1f,%.1f' % p for p in [(cx + s, cy), (cx + s / 2, cy + h), (cx - s / 2, cy + h), (cx - s, cy), (cx - s / 2, cy - h), (cx + s / 2, cy - h)])


def hive_scene():
    hive = 'M260 88 C300 88 330 100 352 122 C395 165 410 225 405 285 C399 355 350 425 260 430 C170 425 121 355 115 285 C110 225 125 165 168 122 C190 100 220 88 260 88 Z'
    parts = []
    # feuillages de la forêt gabonaise
    for (x, y, a, L, c) in [(18, 500, -68, 165, '#0E7C75'), (500, 505, -112, 160, '#159E96'), (60, 505, -95, 120, '#159E96'),
                            (462, 500, -80, 120, '#0E7C75')]:
        parts.append(leaf(x, y, a, L, c))
    parts.append('<path d="M-30 74 C110 52 220 82 300 68 C380 54 460 42 560 50" stroke="#0B3A40" stroke-width="15" fill="none" stroke-linecap="round"/>')
    parts.append('<path d="M-30 69 C110 47 220 77 300 63 C380 49 460 37 560 45" stroke="#1E6E77" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>')
    for (x, y, a, L, c) in [(36, 68, 104, 92, '#159E96'), (88, 62, 70, 78, '#0E7C75'), (150, 68, 118, 66, '#9FE1DA'),
                            (372, 58, 62, 84, '#0E7C75'), (430, 52, 108, 96, '#159E96'), (488, 49, 74, 70, '#0E7C75')]:
        parts.append(leaf(x, y, a, L, c))
    parts.append('<path d="M244 64 Q260 58 276 64 L272 92 Q260 97 248 92 Z" fill="#9A5B3C"/>')
    parts.append('<defs><clipPath id="hiveClip"><path d="%s"/></clipPath></defs>' % hive)
    parts.append('<path d="%s" fill="#C98157" stroke="#9A5B3C" stroke-width="3"/>' % hive)
    bands = ''.join('<path d="M100 %d Q260 %d 420 %d" stroke="#9A5B3C" stroke-width="3.2" fill="none" opacity=".6"/>' % (y, y + 16, y) for y in (142, 204, 266, 330, 394))
    parts.append('<g clip-path="url(#hiveClip)">%s<path d="M150 130 Q130 250 168 400" stroke="#E2A07A" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/></g>' % bands)
    doors = [(195, 185), (325, 185), (260, 250), (175, 318), (345, 318), (260, 382)]
    for (cx, cy) in doors:
        parts.append('<polygon points="%s" fill="#9A5B3C"/>' % hex_points(cx, cy, 33))
        parts.append('<polygon points="%s" fill="#0C333A"/>' % hex_points(cx, cy, 28.5))
        parts.append('<polygon points="%s" fill="#E8A93A" opacity=".18"/>' % hex_points(cx, cy + 9, 14))
    roles = [('garde', 0.0, -270, -380, -25), ('agro', 0.08, 250, -400, 22), ('score', 0.16, -70, -470, -10),
             ('id', 0.24, -340, -300, -30), ('data', 0.32, 330, -320, 28), ('design', 0.40, 130, -480, 14)]
    for (cx, cy), (role, st, dx, dy, rot) in zip(doors, roles):
        parts.append(hive_bee(role, cx - 33, cy - 24, st, dx, dy, rot))
    # abeille qui se repose sur la branche
    parts.append('<g class="hive-bee" data-start="0.48" data-dx="-210" data-dy="-210" data-rot="-18" transform="translate(70 4) scale(.86)">'
                 '<g class="work"><text class="zz" x="48" y="10" font-size="11" font-weight="700" fill="#9FE1DA" font-family="Lato, sans-serif">z</text>'
                 '<text class="zz z2" x="54" y="3" font-size="8" font-weight="700" fill="#9FE1DA" font-family="Lato, sans-serif">z</text></g>'
                 '<g class="bee-fly"><g>%s<path d="M25 53 L23 61 M35 53 L37 61" stroke="%s" stroke-width="2" stroke-linecap="round"/></g></g></g>'
                 % (bee_body('closed'), NAVY))
    # deux abeilles qui butinent autour de la ruche
    parts.append('<g class="ambient-bee"><g class="orbit-a"><g transform="translate(86 196) scale(.5)"><g class="bob">%s</g></g></g></g>' % bee_body())
    parts.append('<g class="ambient-bee"><g class="orbit-b"><g transform="translate(408 150) scale(.46)"><g class="bob">%s</g></g></g></g>' % bee_body())
    return ('<svg class="hive-scene" viewBox="0 0 520 500" role="img" %s>%s</svg>'
            % (bi_attr('aria-label', "La ruche KAME : des abeilles au travail devant chaque porte, une pour chaque outil",
                       'The KAME hive: bees at work in front of each door, one for each tool'), ''.join(parts)))


def presenter_bee(icon_key, extra='', antennae=True, cls='bee-presenter'):
    ant = ''
    if antennae:
        ant = ('<path d="M52 18 Q46 6 37 7" stroke="{n}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="37" cy="7" r="3.6" fill="{n}"/>'
               '<path d="M68 18 Q74 6 83 7" stroke="{n}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="83" cy="7" r="3.6" fill="{n}"/>').format(n=NAVY)
    return ('<svg class="%s" viewBox="0 0 120 150" aria-hidden="true" focusable="false"><g class="bob">'
            '<g transform="translate(36 56) rotate(-30)"><ellipse class="wing" cx="0" cy="-20" rx="17" ry="27"/></g>'
            '<g transform="translate(84 56) rotate(30)"><ellipse class="wing" cx="0" cy="-20" rx="17" ry="27"/></g>'
            '<ellipse cx="60" cy="92" rx="26" ry="31" fill="{g}" stroke="{n}" stroke-width="3"/>'
            '<path d="M38 84 Q60 94 82 84" stroke="{n}" stroke-width="9" fill="none"/>'
            '<path d="M40 104 Q60 114 80 104" stroke="{n}" stroke-width="9" fill="none"/>'
            '<path d="M55 121 L60 132 L65 121 Z" fill="{n}"/>'
            '<g class="arm arm-l"><path d="M38 80 L22 94" stroke="{n}" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="94" r="3.6" fill="{n}"/></g>'
            '<g class="arm arm-r"><path d="M82 80 L101 66" stroke="{n}" stroke-width="5" stroke-linecap="round"/><circle cx="101" cy="66" r="3.6" fill="{n}"/></g>'
            '<polygon points="69,70 64.5,77.8 55.5,77.8 51,70 55.5,62.2 64.5,62.2" fill="#FFFFFF" stroke="{n}" stroke-width="1.5"/>'
            '<g transform="translate(54 64) scale(.5)" fill="none" stroke="#0E7C75" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">{icon}</g>'
            '<circle cx="60" cy="38" r="21" fill="{g}" stroke="{n}" stroke-width="3"/>'
            '<circle cx="52" cy="36" r="4" fill="{n}"/><circle cx="53.4" cy="34.6" r="1.3" fill="#fff"/>'
            '<circle cx="68" cy="36" r="4" fill="{n}"/><circle cx="69.4" cy="34.6" r="1.3" fill="#fff"/>'
            '<path d="M52 46 Q60 52 68 46" stroke="{n}" stroke-width="3" fill="none" stroke-linecap="round"/>'
            '{ant}{extra}</g></svg>').format(g=GOLD, n=NAVY, icon=ICONS[icon_key], ant=ant, extra=extra).replace('<svg class="%s"', '<svg class="%s"') % cls


P_HAT = ('<ellipse cx="60" cy="20" rx="31" ry="7.5" fill="#D9A15B" stroke="#9A5B3C" stroke-width="2"/>'
         '<path d="M43 20 Q45 3 60 3 Q75 3 77 20 Z" fill="#E7B66D" stroke="#9A5B3C" stroke-width="2"/>'
         '<path d="M44.5 16.5 Q60 13 75.5 16.5" stroke="#B8734F" stroke-width="4" fill="none"/>')
P_GLASSES = '<g fill="none" stroke="%s" stroke-width="2.4"><circle cx="52" cy="36" r="7"/><circle cx="68" cy="36" r="7"/><path d="M59 36 H61"/></g>' % NAVY
P_HEADSET = ('<path d="M40 38 Q40 15 60 15 Q80 15 80 38" stroke="{n}" stroke-width="3.5" fill="none"/>'
             '<rect x="35" y="33" width="8" height="12" rx="3" fill="#159E96" stroke="{n}" stroke-width="2"/>'
             '<rect x="77" y="33" width="8" height="12" rx="3" fill="#159E96" stroke="{n}" stroke-width="2"/>'
             '<path d="M39 45 Q42 54 52 53" stroke="{n}" stroke-width="2" fill="none"/>').format(n=NAVY)
P_BERET = ('<path d="M41 23 Q44 7 61 8 Q81 9 81 20 Q70 26 41 23 Z" fill="#B8734F" stroke="#9A5B3C" stroke-width="2"/>'
           '<circle cx="64" cy="7" r="2.6" fill="#9A5B3C"/>')
P_CAP = ('<path d="M38 18 L60 8 L82 18 L60 28 Z" fill="%s"/><path d="M47 22 V30 Q60 37 73 30 V22" fill="%s"/>'
         '<path d="M82 18 V31" stroke="#E8A93A" stroke-width="2"/><circle cx="82" cy="32" r="2.6" fill="#E8A93A"/>' % (NAVY, NAVY))
P_BOOK = ('<g transform="translate(103 58) rotate(-14)"><rect x="-11" y="-8" width="22" height="16" rx="2" fill="#FFFFFF" stroke="%s" stroke-width="2"/>'
          '<path d="M0 -8 V8" stroke="%s" stroke-width="1.6"/></g>' % (NAVY, NAVY))


# ---------------------------------------------------------------- données
TOOLS = [
    dict(key='id', name='KAME ID', kind=('Outil · ID numérique', 'Tool · Digital ID'),
         desc=("Notre outil d'<strong>ID numérique</strong> vérifie l'identité de vos clients en ligne, avec leur pièce d'identité et un selfie, sans qu'ils aient à se déplacer. Il est proposé aux entreprises membres pour identifier leurs propres clients.",
               "Our <strong>digital ID</strong> tool verifies your customers' identity online, using their ID document and a selfie, without them having to travel. Member businesses can use it to identify their own customers."),
         extra='', antennae=True),
    dict(key='check', name='KAME Check', kind=('Outil · RegTech', 'Tool · RegTech'),
         desc=("Notre outil <strong>RegTech</strong> contrôle la conformité de vos clients et de vos opérations : vérification d'identité (KYC) et lutte contre le blanchiment.",
               "Our <strong>RegTech</strong> tool checks the compliance of your customers and operations: identity verification (KYC) and anti-money laundering."),
         extra='', antennae=True),
    dict(key='garde', name='KAME Garde', kind=('Outil · Cybersécurité', 'Tool · Cybersecurity'),
         desc=("Notre outil de <strong>cybersécurité</strong> protège vos systèmes, vos données et vos transactions contre la fraude et le piratage.",
               "Our <strong>cybersecurity</strong> tool protects your systems, data and transactions against fraud and hacking."),
         extra=P_HEADSET, antennae=True),
    dict(key='registre', name='KAME Registre', kind=('Outil · Blockchain', 'Tool · Blockchain'),
         desc=("Grâce à la <strong>blockchain</strong>, vos dossiers et vos échanges restent traçables et vérifiables par chaque partie.",
               "Thanks to <strong>blockchain</strong>, your records and exchanges remain traceable and verifiable by every party."),
         extra='', antennae=True),
    dict(key='data', name='KAME Data', kind=('Outil · Data & Analytics', 'Tool · Data & Analytics'),
         desc=("Notre outil de <strong>Data &amp; Analytics</strong> vous donne des tableaux de bord clairs pour suivre votre activité et mieux décider.",
               "Our <strong>Data &amp; Analytics</strong> tool gives you clear dashboards to track your activity and make better decisions."),
         extra='', antennae=True),
    dict(key='score', name='KAME Score', kind=('Outil · Analyse de solvabilité', 'Tool · Creditworthiness analysis'),
         desc=("Notre outil d'<strong>analyse de solvabilité</strong> évalue la fiabilité d'une entreprise ou d'un commerçant à partir de ses documents et de son activité. Il est utile à une banque avant un prêt, ou à un investisseur avant d'investir.",
               "Our <strong>creditworthiness analysis</strong> tool assesses how reliable a business or merchant is, based on its documents and activity. It helps a bank before granting a loan, or an investor before investing."),
         extra=P_GLASSES, antennae=True),
    dict(key='agro', name='KAME Agro', kind=('Outil · AgriTech', 'Tool · AgriTech'),
         desc=("Notre outil <strong>AgriTech</strong> accompagne les entreprises et les commerçants du secteur agricole avec des outils numériques adaptés à leur activité.",
               "Our <strong>AgriTech</strong> tool supports businesses and merchants in the agricultural sector with digital tools suited to their activity."),
         extra=P_HAT, antennae=False),
    dict(key='design', name='KAME Design', kind=('Service · UX/UI', 'Service · UX/UI'),
         desc=("Notre service <strong>UX/UI</strong> aide les PayTech à rendre leurs plateformes plus simples, plus claires et plus agréables à utiliser.",
               "Our <strong>UX/UI</strong> service helps PayTechs make their platforms simpler, clearer and more pleasant to use."),
         extra=P_BERET, antennae=False),
]

PROFILES = [
    dict(key='partner', page='partenaire.html', name=('Partenaire', 'Partner'),
         short=('Vous travaillez avec nous pour créer, distribuer ou déployer des solutions.', 'You work with us to build, distribute or deploy solutions.')),
    dict(key='merchant', page='commercant.html', name=('Commerçant', 'Merchant'),
         short=('Vous vendez des produits ou des services : boutique, marché, artisanat.', 'You sell products or services: shop, market stall, crafts.')),
    dict(key='business', page='entreprise.html', name=('Entreprise', 'Business'),
         short=('Votre organisation utilise ou souhaite utiliser nos outils.', 'Your organisation uses or wants to use our tools.')),
    dict(key='investor', page='investisseur.html', name=('Investisseur', 'Investor'),
         short=('Vous souhaitez financer KAME GROUP ou l\'un de ses projets.', 'You want to fund KAME GROUP or one of its projects.')),
]

VALUES = [
    (('Confiance', 'Trust'), ('Construire des relations fiables et durables.', 'Building reliable, lasting relationships.')),
    (('Innovation', 'Innovation'), ('Créer des réponses utiles aux besoins réels.', 'Creating useful answers to real needs.')),
    (('Intelligence', 'Intelligence'), ('Comprendre, analyser et décider avec méthode.', 'Understanding, analysing and deciding with method.')),
    (('Intégrité', 'Integrity'), ('Agir avec honnêteté et responsabilité.', 'Acting with honesty and responsibility.')),
    (('Collaboration', 'Collaboration'), ('Faire progresser les idées et les équipes ensemble.', 'Moving ideas and teams forward together.')),
    (('Excellence', 'Excellence'), ("Rechercher la qualité et l'amélioration continue.", 'Pursuing quality and continuous improvement.')),
]


# ---------------------------------------------------------------- morceaux communs
def structured_data(lang):
    # « Carte d'identité » lue par Google : qui est KAME GROUP, où, son logo et son site
    en = lang == 'en'
    org = {
        '@type': 'Organization', '@id': SITE_URL + '/#organization', 'name': 'KAME GROUP',
        'alternateName': ['KAME', 'KAME GROUP Gabon', 'KAME GROUP Libreville'],
        'url': SITE_URL + '/',
        'logo': {'@type': 'ImageObject', 'url': SITE_URL + '/assets/img/apple-touch-icon.png', 'width': 180, 'height': 180},
        'image': SITE_URL + '/assets/img/og-image.jpg',
        'description': SEO['index.html'][3 if en else 2],
        'slogan': 'A secure and bright future.' if en else 'Un avenir sûr et éclairé.',
        'foundingLocation': {'@type': 'Place', 'name': 'Libreville, Gabon'},
        'address': {'@type': 'PostalAddress', 'addressLocality': 'Libreville', 'addressCountry': 'GA'},
        'areaServed': [{'@type': 'Country', 'name': 'Gabon'},
                       {'@type': 'Place', 'name': 'Central Africa (CEMAC)' if en else 'Afrique centrale (CEMAC)'}],
        'founder': {'@type': 'Person', 'name': 'Ndecie Boulandi', 'jobTitle': 'Founder and President' if en else 'Fondatrice et présidente'},
        'knowsAbout': (['Fintech', 'Digital identity (KYC)', 'Credit scoring', 'Business data', 'Blockchain', 'Cybersecurity', 'Investing in Gabon']
                       if en else ['Fintech', "Identité numérique (KYC)", 'Score de crédit', "Données d'entreprises", 'Blockchain',
                                   'Cybersécurité', 'Investir au Gabon']),
    }
    if SAME_AS:
        org['sameAs'] = SAME_AS
    if CONTACT_EMAIL:
        org['email'] = CONTACT_EMAIL
    graph = [org]
    if not en:
        # Nom du site affiché dans les résultats : à placer sur la page d'accueil principale
        graph.append({'@type': 'WebSite', '@id': SITE_URL + '/#website', 'name': 'KAME GROUP', 'alternateName': ['KAME', 'kamegroupe.com'],
                      'url': SITE_URL + '/', 'inLanguage': ['fr', 'en'], 'publisher': {'@id': SITE_URL + '/#organization'}})
    data = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=1).replace('</', '<\\/')
    return '<script type="application/ld+json">\n%s\n</script>\n' % data


def head(title_fr, title_en, desc_fr, fname='index.html', noindex=False, base=None):
    desc_en = desc_fr
    if fname in SEO:
        title_fr, title_en, desc_fr, desc_en = SEO[fname]
    lang = 'en' if MODE == 'en' else 'fr'
    title, desc = (title_en, desc_en) if lang == 'en' else (title_fr, desc_fr)
    url = page_url(fname, lang)
    extra = ''
    if base:
        extra += '<base href="%s">\n' % base
    if noindex:
        extra += '<meta name="robots" content="noindex">\n'
    else:
        extra += '<link rel="canonical" href="%s">\n' % url
        if MODE != 'bi':
            # La même page dans l'autre langue (hreflang)
            extra += ''.join('<link rel="alternate" hreflang="%s" href="%s">\n' % (hl, page_url(fname, l))
                             for hl, l in (('fr', 'fr'), ('en', 'en'), ('x-default', 'fr')))
    if MODE == 'bi':
        extra += '<meta name="title-fr" content="%s">\n<meta name="title-en" content="%s">\n' % (attr(title_fr), attr(title_en))
    if fname == 'index.html' and MODE != 'bi':
        extra += structured_data(lang)
    tpl = ('<!DOCTYPE html>\n<html lang="{lang}"{fixed}>\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1">\n{extra}'
           '<title>{title}</title>\n'
           '<meta name="description" content="{desc}">\n<meta name="theme-color" content="#145B63">\n'
           '<meta property="og:type" content="website">\n<meta property="og:site_name" content="KAME GROUP">\n'
           '<meta property="og:locale" content="{loc}">\n<meta property="og:locale:alternate" content="{loc2}">\n'
           '<meta property="og:url" content="{url}">\n<meta property="og:title" content="{title}">\n'
           '<meta property="og:description" content="{desc}">\n'
           '<meta property="og:image" content="{site}/assets/img/og-image.jpg">\n'
           '<meta property="og:image:width" content="{ogw}">\n<meta property="og:image:height" content="{ogh}">\n'
           '<meta name="twitter:card" content="summary_large_image">\n'
           '<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">\n'
           '<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">\n'
           '<link rel="preload" href="assets/fonts/lato-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>\n'
           '<link rel="stylesheet" href="assets/css/style.css">\n'
           '<script src="assets/js/lang.js"></script>\n'
           '</head>\n')
    return tpl.format(lang=lang, fixed=' data-lang-fixed' if MODE != 'bi' else '', extra=extra, title=attr(title), desc=attr(desc),
                      url=url, site=SITE_URL, ogw=OG_SIZE[0], ogh=OG_SIZE[1],
                      loc='en_US' if lang == 'en' else 'fr_FR', loc2='fr_FR' if lang == 'en' else 'en_US')


def brand(href):
    space = href.startswith('espace-membre')
    label = (bi_attr('aria-label', 'KAME GROUP, mon espace', 'KAME GROUP, my space') if space
             else bi_attr('aria-label', 'KAME GROUP, accueil', 'KAME GROUP, home'))
    return ('<a class="brand" href="%s" %s><span class="hex-badge"><img src="assets/img/kame-symbole.png" alt="" width="28" height="36"></span>'
            '<span class="brand-name">KAME GROUP</span></a>' % (href, label))


def lang_switch():
    if MODE in ('fr', 'en'):
        # Page publique : FR et EN mènent à la même page dans l'autre langue
        return ('<div class="lang-switch" role="group" aria-label="Langue / Language">'
                '<a href="%s" hreflang="fr" lang="fr"%s>FR</a><a href="%s" hreflang="en" lang="en"%s>EN</a></div>'
                % (local_href(CURRENT, 'fr'), ' aria-current="true"' if MODE == 'fr' else '',
                   local_href(CURRENT, 'en'), ' aria-current="true"' if MODE == 'en' else ''))
    return ('<div class="lang-switch" role="group" aria-label="Langue / Language">'
            '<button type="button" data-set-lang="fr" aria-pressed="true" lang="fr">FR</button>'
            '<button type="button" data-set-lang="en" aria-pressed="false" lang="en">EN</button></div>')


def header(home, brand_href=None):
    h = home
    return ('<header class="site-header"><div class="container header-inner">%s<div class="header-spacer"></div>%s'
            '<nav class="main-nav" %s>'
            '<a href="%s#apropos">%s</a><a href="%s#outils">%s</a><a href="%s#talent">Talent</a><a href="%s#contact">Contact</a></nav>'
            '<div class="header-actions"><a class="link-login" href="connexion.html" data-guest>%s</a>'
            '<a class="link-login" href="espace-membre.html" data-member>%s</a>'
            '<a class="btn btn-outline-light btn-sm" href="%s#rejoindre" data-guest>%s</a>'
            '<button class="menu-toggle" type="button" aria-controls="drawer" aria-expanded="false" %s>%s</button></div></div>%s</header>'
            % (brand(brand_href or h or '#accueil'), lang_switch(), bi_attr('aria-label', 'Navigation principale', 'Main navigation'),
               h, T('À propos', 'About'), h, T('Nos outils et services', 'Tools &amp; services'), h, h,
               T('Se connecter', 'Log in'), T('Mon espace', 'My space'), h, T('Devenir membre', 'Become a member'),
               bi_attr('aria-label', 'Ouvrir le menu', 'Open the menu'), icon('menu', 24, 2), edge_svg(12, 'down')))


def member_header():
    # Banderole de l'espace membre : logo, recherche, notifications, langue et compte
    links = [
        ('#profil', 'user', 'Mon profil', 'My profile', ' data-inv-only'),
        ('#portefeuille', 'briefcase', 'Mon portefeuille', 'My portfolio', ' data-inv-only'),
        ('index.html#contact', 'help', 'Aide et support', 'Help &amp; support', ''),
        ('index.html', 'home', 'Voir le site KAME GROUP', 'Visit the KAME GROUP site', ''),
    ]
    menu = ('<div class="mh-menu-head"><span class="mh-avatar" data-initial>K</span><div><strong data-first-name></strong>'
            '<small data-email></small></div></div>'
            + ''.join('<a href="%s"%s>%s<span>%s</span></a>' % (u, extra, icon(ic, 19, 1.9), T(fr, en)) for u, ic, fr, en, extra in links)
            + '<div class="mh-spaces" data-other-spaces hidden></div>'
            + '<div class="mh-lang">%s</div>' % lang_switch()
            + '<button type="button" class="mh-logout" data-logout>%s<span>%s</span></button>' % (icon('logout', 19, 1.9), T('Se déconnecter', 'Log out')))
    return ('<header class="site-header member-header"><div class="container container-wide header-inner">%s'
            '<form class="mh-search" role="search" data-inv-only><label class="sr-only" for="mh-q">%s</label>%s'
            '<input id="mh-q" type="search" autocomplete="off" %s></form>'
            '<div class="mh-actions"><div class="mh-lang-top">%s</div>'
            '<div class="mh-pop" data-inv-only><button type="button" class="mh-icon-btn mh-bell" aria-expanded="false" aria-controls="mh-notifs" %s>'
            '%s<span class="mh-count" data-notif-count hidden></span></button><div class="mh-panel mh-notifs" id="mh-notifs" hidden></div></div>'
            '<div class="mh-pop"><button type="button" class="mh-me" aria-expanded="false" aria-controls="mh-menu">'
            '<span class="mh-avatar" data-initial>K</span><span class="mh-who"><strong data-first-name></strong><small data-role-label></small></span>%s</button>'
            '<div class="mh-panel mh-menu" id="mh-menu" hidden>%s</div></div></div></div>%s</header>'
            % (brand('espace-membre.html'), T('Rechercher', 'Search'), icon('search', 20, 2),
               bi_attr('placeholder', 'Rechercher une entreprise, un secteur, une ville…', 'Search a company, a sector, a city…'),
               lang_switch(), bi_attr('aria-label', 'Notifications', 'Notifications'), icon('bell', 22, 1.9),
               icon('chevron', 18, 2), menu, edge_svg(12, 'down')))


def drawer(home, brand_href=None):
    h = home
    links = [
        ('%s#accueil' % h, 'Accueil', 'Home', ''), ('%s#apropos' % h, 'À propos', 'About', ''),
        ('%s#outils' % h, 'Nos outils et services', 'Tools &amp; services', ''), ('%s#paiements' % h, 'Paiements', 'Payments', ''),
        ('%s#valeurs' % h, 'Nos valeurs', 'Our values', ''), ('%s#talent' % h, 'Talent', 'Talent', ''),
        ('formations.html', 'Formations', 'Training', 'sub'), ('%s#rejoindre' % h, 'Devenir membre', 'Become a member', ''),
        ('partenaire.html', 'Partenaire', 'Partner', 'sub'), ('commercant.html', 'Commerçant', 'Merchant', 'sub'),
        ('entreprise.html', 'Entreprise', 'Business', 'sub'), ('investisseur.html', 'Investisseur', 'Investor', 'sub'),
        ('%s#contact' % h, 'Contact', 'Contact', ''),
    ]
    guest_only = {'%s#rejoindre' % h, 'partenaire.html', 'commercant.html', 'entreprise.html', 'investisseur.html'}
    nav = ''.join('<a href="%s"%s%s>%s</a>' % (u, (' class="%s"' % c) if c else '', ' data-guest' if u in guest_only else '', T(fr, en))
                  for u, fr, en, c in links)
    return ('<div class="drawer-backdrop"></div><aside id="drawer" class="drawer" aria-hidden="true" %s>'
            '<div class="drawer-head">%s<button class="drawer-close" type="button" %s>%s</button></div>'
            '<nav %s>%s</nav><div class="drawer-foot">%s<a class="btn btn-light" href="connexion.html" data-guest>%s</a>'
            '<a class="btn btn-light" href="espace-membre.html" data-member>%s</a>'
            '<a class="btn btn-outline-light" href="%s#rejoindre" data-guest>%s</a></div></aside>'
            % (bi_attr('aria-label', 'Menu', 'Menu'), brand(brand_href or h or '#accueil'), bi_attr('aria-label', 'Fermer le menu', 'Close the menu'),
               icon('close', 24, 2), bi_attr('aria-label', 'Menu du site', 'Site menu'), nav, lang_switch(),
               T('Se connecter', 'Log in'), T('Mon espace', 'My space'), h, T('Devenir membre', 'Become a member')))


def honey():
    left = [(4, 5, .92), (13, 3.5, .58), (21, 3, .32)]
    right = [(5, 4.5, .78), (14, 3, .45), (22, 3.5, .64)]
    def side(cls, drips):
        return '<div class="honey %s" aria-hidden="true">%s</div>' % (cls, ''.join(
            '<span class="drip" style="--x:%spx;--w:%spx;--len:%s"></span>' % d for d in drips))
    return side('honey-left', left) + side('honey-right', right)


def contact_lines(cls='info-line'):
    out = ['<p class="%s">%s<span>%s</span></p>' % (cls, icon('pin', 22), CITY)]
    if CONTACT_EMAIL:
        out.append('<p class="%s">%s<a href="mailto:%s">%s</a></p>' % (cls, icon('mail', 22), CONTACT_EMAIL, CONTACT_EMAIL))
    if CONTACT_PHONE:
        out.append('<p class="%s">%s<a href="tel:%s">%s</a></p>' % (cls, icon('phone', 22), CONTACT_PHONE.replace(' ', ''), CONTACT_PHONE))
    return ''.join(out)


def footer(home, brand_href=None):
    h = home
    nav = ''.join('<a href="%s">%s</a>' % (u, T(fr, en)) for u, fr, en in [
        ('%s#apropos' % h, 'À propos', 'About'), ('%s#outils' % h, 'Nos outils et services', 'Tools &amp; services'),
        ('%s#paiements' % h, 'Paiements', 'Payments'), ('%s#talent' % h, 'Talent', 'Talent'), ('formations.html', 'Formations', 'Training')])
    members = ''.join('<a href="%s">%s</a>' % (p['page'], T(*p['name'])) for p in PROFILES) + '<a href="connexion.html" data-guest>%s</a><a href="espace-membre.html" data-member>%s</a>' % (T('Se connecter', 'Log in'), T('Mon espace', 'My space'))
    contact = ''.join('<span>%s</span>' % CITY if True else '' for _ in [0])
    if CONTACT_EMAIL:
        contact += '<a href="mailto:%s">%s</a>' % (CONTACT_EMAIL, CONTACT_EMAIL)
    if CONTACT_PHONE:
        contact += '<a href="tel:%s">%s</a>' % (CONTACT_PHONE.replace(' ', ''), CONTACT_PHONE)
    contact += '<a href="%s#contact">%s</a>' % (h, T('Nous écrire', 'Write to us'))
    return ('<footer class="site-footer">%s<div class="container footer-inner"><div class="footer-grid">'
            '<div class="footer-brand">%s<p class="slogan">%s</p><p class="small">%s</p></div>'
            '<nav class="footer-links" %s><p class="footer-title">Navigation</p>%s</nav>'
            '<div class="footer-links"><p class="footer-title">%s</p>%s</div>'
            '<div class="footer-links"><p class="footer-title">Contact</p>%s</div></div>'
            '<div class="footer-bottom"><span>%s</span>%s</div></div></footer>'
            % (edge_svg(26, 'up'), brand(brand_href or h or '#accueil'), T('Un avenir sûr et éclairé.', 'A secure and bright future.'),
               T('Groupe technologique et financier né au Gabon.', 'Technology and financial group born in Gabon.'),
               bi_attr('aria-label', 'Liens du pied de page', 'Footer links'), nav, T('Espace membre', 'Member area'), members, contact,
               T('© 2026 KAME GROUP. Tous droits réservés.', '© 2026 KAME GROUP. All rights reserved.'),
               legal_links()))


def localize_en(html):
    # Version anglaise (dossier /en/) : les fichiers communs et les pages de l'application restent à la racine du site
    html = re.sub(r'(\s(?:href|src|action|srcset)=")(?=assets/|connexion\.html|espace-membre\.html|merci\.html)', r'\1/', html)
    return html.replace('url(assets/', 'url(/assets/')


def page(fname, title_fr, title_en, desc_fr, main, home='index.html', noindex=False, base=None, brand_href=None, member=False, scripts=''):
    global CURRENT
    CURRENT = fname
    body = ('<body>\n<a class="skip-link" href="#contenu">%s</a>\n%s\n%s\n%s\n<main id="contenu">\n%s\n</main>\n%s\n'
            '%s<script src="assets/js/auth.js" defer></script>\n<script src="assets/js/main.js" defer></script>\n<script src="assets/js/consent.js" defer></script>\n</body>\n</html>\n'
            % (T('Aller au contenu', 'Skip to content'), member_header() if member else header(home, brand_href),
               '' if member else drawer(home, brand_href), honey(), main, footer(home, brand_href), scripts))
    html = head(title_fr, title_en, desc_fr, fname, noindex, base) + body
    out = DIST
    if MODE == 'en':
        html = localize_en(html)
        out = os.path.join(DIST, 'en')
        os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, fname), 'w', encoding='utf-8') as f:
        f.write(html)


def section_head(title, lead=None, eyebrow=None, h='h2'):
    out = '<div class="section-head" data-reveal>'
    if eyebrow:
        out += '<p class="eyebrow">%s</p>' % T(*eyebrow)
    out += '<%s class="title h2">%s</%s><span class="bar" aria-hidden="true"></span>' % (h, T(*title), h)
    if lead:
        out += '<p class="lead">%s</p>' % T(*lead)
    return out + '</div>'


def profile_card(p, delay=0):
    return ('<a class="profile-card hc" data-hc="8" href="%s" data-reveal data-delay="%d">%s<div class="hc-content">'
            '<span class="hex-icon">%s</span><h3>%s</h3><p>%s</p><span class="card-link">%s %s</span></div></a>'
            % (p['page'], delay, hc_shape(), icon(p['key'], 26), T(*p['name']), T(*p['short']), T('Découvrir', 'Learn more'), icon('arrow', 18, 2)))


# ---------------------------------------------------------------- formulaires (Netlify Forms)
class Form:
    def __init__(self, name):
        self.name = name

    def fid(self, n):
        return 'f-%s-%s' % (self.name, n)

    def inp(self, n, fr, en, typ='text', req=False, ac=None, ph=None):
        a = ' autocomplete="%s"' % ac if ac else ''
        p = ' ' + bi_attr('placeholder', ph[0], ph[1]) if ph else ''
        return ('<div class="field"><label for="%s">%s%s</label><input id="%s" type="%s" name="%s"%s%s%s></div>'
                % (self.fid(n), T(fr, en), ' <span class="req" aria-hidden="true">*</span>' if req else '', self.fid(n), typ, n,
                   ' required' if req else '', a, p))

    def area(self, n, fr, en, req=False, ph=None):
        p = ' ' + bi_attr('placeholder', ph[0], ph[1]) if ph else ''
        return ('<div class="field"><label for="%s">%s%s</label><textarea id="%s" name="%s"%s%s></textarea></div>'
                % (self.fid(n), T(fr, en), ' <span class="req" aria-hidden="true">*</span>' if req else '', self.fid(n), n, ' required' if req else '', p))

    def sel(self, n, fr, en, options, req=False, show_when=None):
        opts = opt('', 'Choisir…', 'Choose…') + ''.join(opt(v, ofr, oen) for v, ofr, oen in options)
        sw = ' data-show-when="%s"' % show_when if show_when else ''
        return ('<div class="field"%s><label for="%s">%s%s</label><select id="%s" name="%s"%s>%s</select></div>'
                % (sw, self.fid(n), T(fr, en), ' <span class="req" aria-hidden="true">*</span>' if req else '', self.fid(n), n, ' required' if req else '', opts))

    def group(self, n, fr, en, options, typ='radio', req=False):
        items = ''
        for i, (v, ofr, oen) in enumerate(options):
            r = ' required' if (req and typ == 'radio' and i == 0) else ''
            items += '<label class="check"><input type="%s" name="%s" value="%s"%s> <span>%s</span></label>' % (typ, n, attr(v), r, T(ofr, oen))
        return ('<fieldset class="field"><legend>%s%s</legend><div class="choices">%s</div></fieldset>'
                % (T(fr, en), ' <span class="req" aria-hidden="true">*</span>' if req else '', items))

    def check(self, n, fr, en):
        return '<label class="check"><input type="checkbox" name="%s" value="oui"> <span>%s</span></label>' % (n, T(fr, en))

    def row(self, *fields):
        return '<div class="form-row">%s</div>' % ''.join(fields)

    def wrap(self, inner, submit=('Envoyer ma demande', 'Send my request'), note=None):
        n = '<p class="form-note">%s</p>' % T(*note) if note else ''
        return ('<form class="form" name="{name}" method="POST" action="merci.html" data-netlify="true" netlify-honeypot="bot-field" data-form>'
                '<input type="hidden" name="form-name" value="{name}"><input type="hidden" name="langue" value="{lang}">'
                '<p class="hp" aria-hidden="true"><label>Ne pas remplir <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>'
                '{inner}{note}<label class="check"><input type="checkbox" name="consentement" value="oui" required> <span>{consent}</span></label>'
                '<div><button class="btn btn-primary" type="submit">{submit}</button></div>'
                '<p class="form-status" role="status" tabindex="-1">{status}</p></form>').format(
            name=self.name, inner=inner, note=n, lang='en' if MODE == 'en' else 'fr',
            consent=T("J'accepte que KAME GROUP utilise ces informations pour répondre à ma demande, comme l'explique sa "
                      '<a href="confidentialite.html" target="_blank" rel="noopener">politique de confidentialité</a>.',
                      'I agree that KAME GROUP may use this information to respond to my request, as explained in its '
                      '<a href="confidentialite.html" target="_blank" rel="noopener">privacy policy</a>.'),
            submit=T(*submit),
            status=T("Aperçu : l'envoi fonctionnera une fois le site en ligne sur Netlify.", 'Preview: sending will work once the site is live on Netlify.'))


DOCS_NOTE = ("Les justificatifs (pièce d'identité, documents de l'entreprise) vous seront demandés plus tard, de façon sécurisée. N'envoyez aucun document par ce formulaire.",
             'Supporting documents (ID, company documents) will be requested later, securely. Please do not send any document through this form.')

AGRI_CHOICES = [('oui', 'Oui', 'Yes'), ('non', 'Non', 'No')]
AGRI_TYPES = [('culture', 'Culture', 'Crop farming'), ('elevage', 'Élevage', 'Livestock'), ('transformation', 'Transformation', 'Processing'),
              ('vente', 'Vente de produits agricoles', 'Selling farm products'), ('autre', 'Autre', 'Other')]


# ---------------------------------------------------------------- page d'accueil
def index_page():
    tools_slides = ''
    for i, t in enumerate(TOOLS):
        cta_href = 'entreprise.html#demande' if t['key'] != 'design' else '#contact'
        cta = T('Demander une démonstration', 'Request a demo') if t['key'] != 'design' else T('Parlons de votre plateforme', "Let's talk about your platform")
        tools_slides += (
            '<div class="tool-slide" role="group" aria-roledescription="diapositive" %s>'
            '<div class="slide-bee"><div class="bee-actor">%s</div></div>'
            '<article class="tool-panel hc" data-hc="20">%s<div class="hc-content">'
            '<span class="tool-icon">%s</span><p class="tool-kind">%s</p><h3 class="tool-name">%s</h3>'
            '<p class="tool-desc">%s</p><p class="tool-cta"><a class="btn btn-outline btn-sm" href="%s">%s</a></p></div></article></div>'
            % (bi_attr('aria-label', '%d sur %d : %s' % (i + 1, len(TOOLS), t['name']), '%d of %d: %s' % (i + 1, len(TOOLS), t['name'])),
               presenter_bee(t['key'], t['extra'], t['antennae']), hc_shape(), icon(t['key'], 30), T(*t['kind']), t['name'], T(*t['desc']),
               cta_href, cta))
    minis = ''.join(
        '<button class="tool-mini hc" data-hc="12" type="button">%s<div class="hc-content"><span class="tool-icon">%s</span>'
        '<p class="tool-kind">%s</p><h3 class="tool-name">%s</h3><p class="tool-desc">%s</p></div></button>'
        % (hc_shape(), icon(t['key'], 24), T(*t['kind']), t['name'], T(*t['desc'])) for t in TOOLS)

    values = ''.join('<div class="value"><span class="value-hex" style="--i:%d" aria-hidden="true"></span><div><h3>%s</h3><p>%s</p></div></div>'
                     % (i, T(*n), T(*d)) for i, (n, d) in enumerate(VALUES))
    slot_svg = '<svg viewBox="0 0 122 106" aria-hidden="true"><polygon points="%s" fill="rgba(255,255,255,.06)" stroke="#9FE1DA" stroke-width="1.6" stroke-dasharray="5 4"/></svg>' % hex_points(61, 53, 58)
    slots = ''.join('<div class="pay-slot">%s<span>%s</span></div>' % (slot_svg, T('Partenaire PayTech à venir', 'PayTech partner coming soon')) for _ in range(3))

    f = Form('contact')
    contact_form = f.wrap(
        f.row(f.inp('nom', 'Nom et prénom', 'Full name', req=True, ac='name'), f.inp('email', 'E-mail', 'Email', 'email', req=True, ac='email')) +
        f.row(f.inp('telephone', 'Téléphone', 'Phone', 'tel', ac='tel'),
              f.sel('sujet', 'Sujet', 'Subject', [('question', 'Une question', 'A question'), ('partenariat', 'Un partenariat', 'A partnership'),
                                                   ('investissement', 'Un investissement', 'An investment'), ('formation', 'Les formations', 'Training'),
                                                   ('autre', 'Autre', 'Other')])) +
        f.area('message', 'Votre message', 'Your message', req=True),
        submit=('Envoyer', 'Send'))

    main = '''
<section class="hero" id="accueil">
  <div class="hex-pattern" aria-hidden="true"></div>
  <div class="container hero-inner">
    <div class="hero-text" data-reveal>
      <h1 class="hero-title"><span class="hero-kicker">%(kicker)s</span><span class="hero-slogan">%(h1)s</span></h1>
      <p class="lead">%(lead)s</p>
      <div class="hero-actions"><a class="btn btn-light" href="#rejoindre" data-guest>%(cta1)s</a><a class="btn btn-outline-light" href="#outils">%(cta2)s</a></div>
    </div>
    <div class="hero-visual" data-reveal data-delay="1">%(hive)s</div>
  </div>
  %(edge)s
</section>

<section class="about" id="apropos">
  <div class="container">
    <div class="about-card hc" data-hc="22" data-reveal>%(hc)s<div class="hc-content">
      <div class="about-head"><h2 class="title h2">%(about_t)s</h2><span class="bar" aria-hidden="true"></span></div>
      <div class="about-body">
        <p>%(about_1)s</p>
        <p class="mission">%(about_2)s</p>
        <p>%(about_3)s</p>
        <p class="small">%(about_4)s</p>
      </div>
    </div></div>
  </div>
</section>

<section class="section tools" id="outils" data-tools>
  <div class="container">
    %(tools_head)s
    <div class="tools-toolbar">
      <p class="tools-counter" aria-live="polite">1 / %(n)d</p>
      <button class="mode-toggle" type="button" aria-pressed="false">
        <span class="when-single">%(ic_grid)s %(view_all)s</span><span class="when-grid" hidden>%(ic_single)s %(one_by_one)s</span>
      </button>
    </div>
    <div class="tools-carousel" role="region" aria-roledescription="carrousel" %(car_label)s>
      <button class="nav-arrow prev" type="button" %(prev_label)s>%(ic_left)s</button>
      <div class="tools-window"><div class="tools-track">%(slides)s</div></div>
      <button class="nav-arrow next" type="button" %(next_label)s>%(ic_right)s</button>
    </div>
    <div class="tools-grid-wrap" hidden>
      <div class="grid-bee">%(grid_bee)s</div>
      <div class="tools-grid">%(minis)s</div>
    </div>
  </div>
</section>

<section class="payments" id="paiements">
  <div class="container">
    <div class="pay-panel hc hc-dark" data-hc="16" data-reveal>%(hc)s<div class="hc-content">
      <div class="pay-text">
        <p class="eyebrow">%(pay_eyebrow)s</p>
        <h2 class="title h2">%(pay_title)s</h2>
        <p>%(pay_text)s</p>
        <p>%(pay_text2)s</p>
        <div><a class="btn btn-light" href="partenaire.html#paytech">%(pay_cta)s</a></div>
      </div>
      <div class="pay-slots">%(slots)s</div>
    </div></div>
  </div>
</section>

<section class="section bg-tint" id="valeurs">
  <div class="container">
    %(values_head)s
    <div class="values-grid" data-reveal>%(values)s</div>
  </div>
</section>

<section class="section" id="talent">
  <div class="container talent-grid">
    <div class="talent-text" data-reveal>
      <p class="eyebrow">Talent</p>
      <h2 class="title h2">%(talent_t)s</h2>
      <span class="bar" aria-hidden="true"></span>
      <span class="badge-soon">%(soon)s</span>
      <p>%(talent_p)s</p>
      <div><a class="btn btn-primary" href="formations.html">%(learn)s</a></div>
    </div>
    <div class="talent-visual hc hc-dark" data-hc="18" data-reveal data-delay="1">%(hc)s<div class="hc-content">
      <div class="talent-bee">%(talent_bee)s</div>
      <p class="soon">%(soon_big)s</p>
      <p>%(talent_v)s</p>
    </div></div>
  </div>
</section>

<section class="section bg-tint join" id="rejoindre" data-guest>
  <div class="return-bee" aria-hidden="true">%(return_bee)s</div>
  <div class="container">
    %(join_head)s
    <div class="profiles-grid">%(profiles)s</div>
    <div class="agri-note" data-reveal><span class="hex-icon">%(ic_agro)s</span><p>%(agri)s</p></div>
    <p class="login-line">%(already)s <a href="connexion.html">%(login)s</a></p>
  </div>
</section>

<section class="section" id="contact">
  <div class="container contact-grid">
    <div class="contact-info" data-reveal>
      <p class="eyebrow">Contact</p>
      <h2 class="title h2">%(contact_t)s</h2>
      <span class="bar" aria-hidden="true"></span>
      <p class="lead">%(contact_p)s</p>
      %(contact_lines)s
    </div>
    <div class="contact-form-wrap" data-reveal data-delay="1"><div class="form-card">%(contact_form)s</div></div>
  </div>
</section>
''' % dict(
        kicker=T('KAME GROUP, la fintech gabonaise qui rend les entreprises fiables et finançables',
                 'KAME GROUP, the Gabonese fintech making businesses trustworthy and fundable'),
        h1=T('Un avenir sûr et éclairé.', 'A secure and bright future.'),
        lead=T('Basée à Libreville, KAME GROUP conçoit ses propres solutions et accompagne les entreprises, les institutions, les commerçants et les investisseurs dans leur transformation, leur sécurisation et leur développement au Gabon.',
               'Based in Libreville, KAME GROUP designs its own solutions and supports businesses, institutions, merchants and investors in their transformation, security and growth in Gabon.'),
        cta1=T('Devenir membre', 'Become a member'), cta2=T('Découvrir nos outils', 'Explore our tools'),
        hive=hive_scene(), edge=edge_svg(26, 'down'), hc=hc_shape(),
        about_t=T('Qui sommes-nous', 'About us'),
        about_1=T('KAME GROUP est un groupe technologique et financier né au Gabon et basé à Libreville. Nous concevons nos propres produits et développons des solutions adaptées aux besoins des entreprises, des institutions et des populations.',
                  'KAME GROUP is a technology and financial group born in Gabon and based in Libreville. We design our own products and develop solutions tailored to the needs of businesses, institutions and communities.'),
        about_2=T('Notre mission : concevoir et déployer des solutions technologiques et financières adaptées aux réalités du Gabon, pour développer, sécuriser et créer de nouvelles opportunités.',
                  "Our mission: to design and deploy technology and financial solutions suited to Gabon's realities, to grow, secure and create new opportunities."),
        about_3=T("Notre ambition : devenir une référence au Gabon, puis dans toute l'Afrique centrale.",
                  'Our ambition: to become a benchmark in Gabon, then across Central Africa.'),
        about_4=T('Nous sommes ravis de travailler avec des partenaires qui partagent cette ambition.', 'We are glad to work with partners who share this ambition.'),
        tools_head=section_head(('Nos outils et services', 'Our tools &amp; services'),
                                ('Des outils pour identifier, vérifier, sécuriser et faire grandir les activités de nos membres.',
                                 "Tools to identify, verify, secure and grow our members' activities.")),
        n=len(TOOLS), ic_grid=icon('grid', 18, 2), ic_single=icon('single', 18, 2),
        view_all=T('Tout voir', 'View all'), one_by_one=T('Un par un', 'One by one'),
        car_label=bi_attr('aria-label', 'Nos outils et services', 'Our tools and services'),
        prev_label=bi_attr('aria-label', 'Outil précédent', 'Previous tool'), next_label=bi_attr('aria-label', 'Outil suivant', 'Next tool'),
        ic_left=icon('left', 26, 2.4), ic_right=icon('right', 26, 2.4), slides=tools_slides,
        grid_bee=presenter_bee('grid', cls='bee-mini'), minis=minis,
        pay_eyebrow=T('Paiements', 'Payments'), pay_title=T('Payez avec la PayTech de votre choix', 'Pay with the PayTech of your choice'),
        pay_text=T("KAME GROUP n'a pas sa propre solution de paiement. Pour vos transactions, vous choisirez parmi les PayTech gabonaises partenaires. Nos partenaires de paiement seront bientôt annoncés.",
                   'KAME GROUP does not run its own payment solution. For your transactions, you will choose among partner Gabonese PayTechs. Our payment partners will be announced soon.'),
        pay_text2=T("Vous êtes une PayTech ? Devenez notre partenaire pour les paiements et l'envoi d'argent sur notre plateforme.",
                    'Are you a PayTech? Become our partner for payments and money transfers on our platform.'),
        pay_cta=T('Devenir partenaire', 'Become a partner'), slots=slots,
        values_head=section_head(('Nos valeurs', 'Our values')), values=values,
        talent_t=T('Former les talents de demain', "Training tomorrow's talent"), soon=T('Projet à venir', 'Coming soon'),
        talent_p=T('Nous accompagnons les entreprises membres dans la formation de leurs équipes : prise en main de nos outils, digitalisation des documents, utilisation des plateformes de paiement et bonnes pratiques au travail.',
                   'We help member businesses train their teams: getting started with our tools, digitising documents, using payment platforms and good workplace practices.'),
        learn=T('En savoir plus', 'Learn more'), talent_bee=presenter_bee('book', P_CAP + P_BOOK, antennae=False, cls='bee-mini'),
        soon_big=T('Bientôt', 'Coming soon'),
        talent_v=T('Des formations pour les équipes des entreprises membres.', "Training for member businesses' teams."),
        return_bee=presenter_bee('partner', cls='bee-mini'),
        join_head=section_head(('Rejoignez KAME GROUP', 'Join KAME GROUP'),
                               ("Choisissez votre profil. Notre équipe vérifie chaque inscription avant d'ouvrir votre espace.",
                                'Choose your profile. Our team reviews every registration before opening your space.')),
        profiles=''.join(profile_card(p, i % 4) for i, p in enumerate(PROFILES)), ic_agro=icon('agro', 24),
        agri=T("<strong>Vous êtes dans l'agriculture ?</strong> Indiquez-le à l'inscription : nous vous proposerons KAME Agro.",
               '<strong>Working in agriculture?</strong> Tell us when you register: we will offer you KAME Agro.'),
        already=T('Déjà membre ?', 'Already a member?'), login=T('Se connecter', 'Log in'),
        contact_t=T('Parlons de votre projet', "Let's talk about your project"),
        contact_p=T('Une question, un projet ou une idée de partenariat ? Écrivez-nous, notre équipe vous répondra.',
                    'A question, a project or a partnership idea? Write to us and our team will get back to you.'),
        contact_lines=contact_lines(), contact_form=contact_form,
    )
    page('index.html', 'KAME GROUP | Un avenir sûr et éclairé', 'KAME GROUP | A secure and bright future',
         'KAME GROUP, groupe technologique et financier né au Gabon : outils d\'identité numérique, de conformité, de cybersécurité, de blockchain, de données et d\'analyse de solvabilité.',
         main, home='')


# ---------------------------------------------------------------- pages intérieures
def profile_visual(icon_key, bee_icon, extra='', antennae=True):
    big = hex_points(176, 130, 92)
    return ('<svg viewBox="0 0 300 260" aria-hidden="true" focusable="false">'
            '<polygon points="%s" fill="#159E96"/><polygon points="%s" fill="none" stroke="#B8734F" stroke-width="2.5"/>'
            '<polygon points="%s" fill="rgba(255,255,255,.12)"/><polygon points="%s" fill="#FFFFFF"/>'
            '<g transform="translate(140 94) scale(3)" fill="none" stroke="#0E7C75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">%s</g>'
            '<svg x="-6" y="110" width="118" height="148" viewBox="0 0 120 150" overflow="visible">%s</svg></svg>'
            % (hex_points(52, 52, 24), hex_points(282, 226, 16), hex_points(286, 40, 14), big, ICONS[icon_key],
               presenter_bee(bee_icon, extra, antennae).replace('<svg class="bee-presenter" viewBox="0 0 120 150" aria-hidden="true" focusable="false">', '').replace('</svg>', '', 1).rsplit('</svg>', 1)[0] if False else presenter_inner(bee_icon, extra, antennae)))


def presenter_inner(icon_key, extra='', antennae=True):
    s = presenter_bee(icon_key, extra, antennae)
    start = s.index('>') + 1
    return s[start:-len('</svg>')]


def page_hero(crumb, eyebrow, h1, lead, cta, visual):
    return ('<section class="page-hero" id="accueil"><div class="hex-pattern" aria-hidden="true"></div>'
            '<div class="container page-hero-inner"><div class="page-hero-text" data-reveal>'
            '<p class="breadcrumb"><a href="index.html">%s</a> › %s</p><p class="eyebrow">%s</p><h1>%s</h1><p class="lead">%s</p>'
            '<div class="hero-actions">%s</div></div><div class="page-hero-visual" data-reveal data-delay="1">%s</div></div>%s</section>'
            % (T('Accueil', 'Home'), crumb, eyebrow, h1, lead, cta, visual, edge_svg(20, 'down')))


def compact_hero(eyebrow, h1):
    # Bandeau fin (espace membre) : le tableau de bord apparaît tout de suite
    return ('<section class="page-hero page-hero-compact" id="accueil"><div class="hex-pattern" aria-hidden="true"></div>'
            '<div class="container page-hero-inner"><div class="page-hero-text"><p class="eyebrow">%s</p><h1>%s</h1></div></div>%s</section>'
            % (eyebrow, h1, edge_svg(20, 'down')))


def features(items, s=10):
    return '<div class="features">%s</div>' % ''.join(
        '<div class="feature hc" data-hc="%d" data-reveal data-delay="%d">%s<div class="hc-content"><span class="hex-icon">%s</span><h3>%s</h3><p>%s</p></div></div>'
        % (s, i % 4, hc_shape(), icon(k, 26), T(*t), T(*d)) for i, (k, t, d) in enumerate(items))


def steps(items):
    return '<div class="steps">%s</div>' % ''.join(
        '<div class="step" data-reveal data-delay="%d"><span class="step-num">%d</span><h3>%s</h3><p>%s</p></div>'
        % (i % 4, i + 1, T(*t), T(*d)) for i, (t, d) in enumerate(items))


def other_profiles(current):
    return ('<div class="other-profiles">%s</div>' % ''.join(
        '<a class="btn btn-outline btn-sm" href="%s">%s</a>' % (p['page'], T(*p['name'])) for p in PROFILES if p['page'] != current))


def form_section(form_html, title=('Faire ma demande', 'Send my request'), lead=None):
    return ('<section class="section bg-tint" id="demande"><div class="container"><div class="two-col">'
            '<div data-reveal><p class="eyebrow">%s</p><h2 class="title h2">%s</h2><span class="bar" aria-hidden="true" style="margin:18px 0"></span><p class="lead">%s</p></div>'
            '<div class="form-card" data-reveal data-delay="1">%s</div></div></div></section>'
            % (T('Devenir membre', 'Become a member'), T(*title), T(*(lead or ("Remplissez ce formulaire : notre équipe vérifie chaque demande et vous recontacte rapidement.",
                                                                                   'Fill in this form: our team reviews every request and will get back to you soon.'))), form_html))


ROLE_OF = {'partner': 'partenaire', 'merchant': 'commercant', 'business': 'entreprise', 'investor': 'investisseur'}
ACCOUNT_STEP = (('Votre compte', 'Your account'),
                ('Vous créez votre compte, avec votre e-mail ou votre compte Google.', 'You create your account, by email or with your Google account.'))


def profile_by_key(key):
    return next(p for p in PROFILES if p['key'] == key)


def account_section(key):
    p = profile_by_key(key)
    points = [
        ('check', ('Avec votre e-mail ou votre compte Google', 'With your email or your Google account')),
        ('garde', ("Chaque compte est vérifié par l'équipe KAME", 'Every account is checked by the KAME team')),
        ('id', ('Votre identifiant KAME et vos outils, dans votre espace', 'Your KAME member ID and your tools, in your space')),
    ]
    li = ''.join('<li><span class="hex-icon">%s</span><span>%s</span></li>' % (icon(k, 22), T(*t)) for k, t in points)
    return ('<section class="section bg-tint" id="demande" data-guest><div class="container"><div class="account-cta" data-reveal>'
            '<div class="account-cta-text"><p class="eyebrow">%s</p><h2 class="title h2">%s</h2><span class="bar" aria-hidden="true"></span>'
            '<p class="lead">%s</p><div class="hero-actions"><a class="btn btn-primary" href="connexion.html?profil=%s#inscription">%s</a>'
            '<a class="btn btn-outline" href="connexion.html">%s</a></div></div><ul class="account-points">%s</ul></div></div></section>'
            % (T('Devenir membre', 'Become a member'),
               T('Créer mon compte %s' % p['name'][0], 'Create my %s account' % p['name'][1].lower()),
               T("Créez votre compte en une minute. Notre équipe vérifie chaque nouveau membre avant d'ouvrir son accès à la plateforme.",
                 'Create your account in a minute. Our team checks every new member before opening their access to the platform.'),
               ROLE_OF[key], T('Créer mon compte', 'Create my account'), T("J'ai déjà un compte", 'I already have an account'), li))


def profile_page(fname, key, title, lead, eyebrow_sec, feat, extra_sections, step_items, form_html, title_meta, desc_meta, bee_icon, bee_extra='', bee_ant=True, h1=None):
    # form_html : ancien formulaire de demande, remplacé par la création de compte (gardé pour mémoire)
    hero = page_hero(T(*title), T('Devenir membre', 'Become a member'), T(*(h1 or title)), T(*lead),
                     '<a class="btn btn-light" href="connexion.html?profil=%s#inscription" data-guest>%s</a>'
                     '<a class="btn btn-outline-light" href="index.html#rejoindre" data-guest>%s</a>'
                     % (ROLE_OF[key], T('Créer mon compte', 'Create my account'), T('Tous les profils', 'All profiles')),
                     profile_visual(key, bee_icon, bee_extra, bee_ant))
    step_items = [ACCOUNT_STEP] + list(step_items[1:])
    main = (hero +
            '<section class="section"><div class="container">%s%s</div></section>' % (section_head(eyebrow_sec), feat) +
            extra_sections +
            '<section class="section"><div class="container">%s%s</div></section>' % (section_head(('Comment ça se passe', 'How it works')), steps(step_items)) +
            account_section(key) +
            '<section class="section"><div class="container center-block" data-reveal><h2 class="title h2">%s</h2>%s</div></section>'
            % (T('Les autres profils', 'Other profiles'), other_profiles(fname)))
    page(fname, title_meta[0], title_meta[1], desc_meta, main)


def callout(eyebrow, title, text, cta_html='', anchor=''):
    a = ' id="%s"' % anchor if anchor else ''
    return ('<section class="section callout-sec"%s><div class="container"><div class="callout hc hc-dark" data-hc="16" data-reveal>%s<div class="hc-content">'
            '<p class="eyebrow" style="color:#9FE1DA">%s</p><h2 class="title h2">%s</h2><p class="lead" style="color:rgba(255,255,255,.9)">%s</p>%s</div></div></div></section>'
            % (a, hc_shape(), T(*eyebrow), T(*title), T(*text), cta_html))


def faq_section(title, items):
    qa = ''.join('<details class="faq-item"><summary>%s</summary><div class="faq-a"><p>%s</p></div></details>' % (T(*q), T(*a))
                 for q, a in items)
    return ('<section class="section faq-sec"><div class="container">%s<div class="faq" data-reveal>%s</div></div></section>'
            % (section_head(title), qa))


INVESTOR_FAQ = [
    (("Comment investir dans une PME au Gabon avec KAME GROUP ?", 'How do I invest in a Gabonese SME with KAME GROUP?'),
     ("Créez votre compte investisseur. Notre équipe vérifie votre profil, puis vous accédez à votre espace : entreprises vérifiées, KAME Score, données et opportunités. Quand un projet vous intéresse, vous manifestez votre intérêt et KAME GROUP vous met en relation avec l'entreprise.",
      'Create your investor account. Our team checks your profile, then you access your space: verified businesses, KAME Score, data and opportunities. When a project interests you, you express your interest and KAME GROUP puts you in touch with the business.')),
    (("Qu'est-ce que le KAME Score ?", 'What is the KAME Score?'),
     ("Une note de fiabilité sur 100, classée de A à E. Elle combine la régularité des revenus, l'historique de paiement, le niveau d'endettement, l'ancienneté et la conformité de l'entreprise, à partir des données qu'elle partage avec son accord.",
      'A reliability rating out of 100, graded from A to E. It combines revenue regularity, payment history, debt level, track record and compliance, based on data the business shares with its consent.')),
    (("Comment KAME GROUP vérifie-t-il les entreprises ?", 'How does KAME GROUP check businesses?'),
     ("Avec KAME ID : nous vérifions l'identité des dirigeants et les documents officiels de l'entreprise (RCCM, NIF) avant qu'elle n'apparaisse dans l'annuaire.",
      "With KAME ID: we check the directors' identity and the company's official documents (RCCM, NIF) before it appears in the directory.")),
    (("L'argent passe-t-il par KAME GROUP ?", 'Does the money go through KAME GROUP?'),
     ("Non. KAME GROUP met en relation les investisseurs et les entreprises. Les paiements passent par la PayTech ou la banque que vous choisissez.",
      'No. KAME GROUP connects investors and businesses. Payments go through the PayTech or bank you choose.')),
    (("Puis-je investir directement dans KAME GROUP ?", 'Can I invest in KAME GROUP itself?'),
     ("Oui. Après la vérification de votre profil et la signature d'un accord de confidentialité, vous recevez notre présentation investisseurs et rencontrez la direction.",
      'Yes. Once your profile has been checked and a confidentiality agreement signed, you receive our investor presentation and meet management.')),
    (("Les informations de KAME GROUP sont-elles un conseil en investissement ?", "Is KAME GROUP's information investment advice?"),
     ("Non. Les indicateurs sont fournis à titre d'information. Investir comporte des risques et KAME GROUP ne promet aucun rendement.",
      'No. Indicators are provided for information only. Investing involves risk and KAME GROUP does not promise any return.')),
]


def note_section(html_note):
    return '<section class="section note-sec"><div class="container" data-reveal>%s</div></section>' % html_note


def build_profiles():
    # Partenaire
    f = Form('inscription-partenaire')
    form = f.wrap(
        f.row(f.inp('structure', 'Nom de la structure', 'Organisation name', req=True, ac='organization'),
              f.sel('type_partenariat', 'Type de partenariat', 'Type of partnership',
                    [('paytech', 'PayTech et paiements', 'PayTech & payments'), ('technologie', 'Technologie', 'Technology'),
                     ('commercial', 'Commercial', 'Commercial'), ('institution-formation', 'Institution ou formation', 'Institution or training'),
                     ('autre', 'Autre', 'Other')], req=True)) +
        f.row(f.inp('pays', 'Pays', 'Country', req=True, ac='country-name'), f.inp('site_web', 'Site web', 'Website', 'url', ac='url')) +
        f.row(f.inp('contact_nom', 'Nom et prénom du contact', 'Contact full name', req=True, ac='name'), f.inp('fonction', 'Fonction', 'Job title', ac='organization-title')) +
        f.row(f.inp('email', 'E-mail professionnel', 'Business email', 'email', req=True, ac='email'), f.inp('telephone', 'Téléphone', 'Phone', 'tel', req=True, ac='tel')) +
        f.check('aussi_client', 'Nous souhaitons aussi utiliser les outils KAME (double profil Entreprise et Partenaire).',
                'We also want to use KAME tools (double profile: Business and Partner).') +
        f.area('message', 'Présentez votre structure et votre projet', 'Tell us about your organisation and your project', req=True))
    profile_page(
        'partenaire.html', 'partner', ('Partenaire', 'Partner'),
        ('PayTech, entreprise technologique, institution, école ou organisation : construisons ensemble des solutions utiles au Gabon et en Afrique centrale.',
         "PayTech, technology company, institution, school or organisation: let's build useful solutions together for Gabon and Central Africa."),
        ('Les partenariats possibles', 'Partnership options'),
        features([
            ('pay', ('PayTech et paiements', 'PayTech &amp; payments'),
             ("Intégrez votre solution de paiement à notre plateforme : nos membres pourront vous choisir pour payer et envoyer de l'argent.",
              'Connect your payment solution to our platform: our members will be able to choose you to pay and send money.')),
            ('registre', ('Technologie', 'Technology'),
             ('Intégrez nos outils (KAME ID, KAME Check, KAME Garde…) à vos services, ou développons-en de nouveaux ensemble.',
              "Integrate our tools (KAME ID, KAME Check, KAME Garde…) into your services, or let's build new ones together.")),
            ('partner', ('Commercial', 'Commercial'),
             ('Faites découvrir nos outils à vos clients et construisons ensemble de nouvelles offres.',
              "Introduce our tools to your customers and let's build new offers together.")),
            ('book', ('Institutions et formation', 'Institutions &amp; training'),
             ('Programmes publics, écoles, centres de formation : accompagnons ensemble la transition numérique.',
              "Public programmes, schools, training centres: let's support the digital transition together.")),
        ]),
        callout(('Partenaires PayTech recherchés', 'PayTech partners wanted'), ('Vous êtes une PayTech au Gabon ?', 'Are you a PayTech in Gabon?'),
                ("KAME GROUP n'aura pas sa propre PayTech. Nous voulons travailler avec plusieurs PayTech gabonaises, pour que chaque membre choisisse la sienne au moment de payer ou d'envoyer de l'argent.",
                 'KAME GROUP will not run its own PayTech. We want to work with several Gabonese PayTechs, so that each member can choose theirs when paying or sending money.'),
                '<div><a class="btn btn-light" href="#demande">%s</a></div>' % T('Devenir partenaire PayTech', 'Become a PayTech partner'), anchor='paytech') +
        note_section('<p class="notice">%s</p>' % T('<strong>Bon à savoir :</strong> une entreprise peut être à la fois cliente et partenaire. Indiquez-le dans votre demande.',
                                                   '<strong>Good to know:</strong> a business can be both a client and a partner. Just say so in your request.')),
        [(('Votre demande', 'Your request'), ('Vous remplissez le formulaire ci-dessous.', 'You fill in the form below.')),
         (('Un premier échange', 'A first meeting'), ('Notre équipe vous contacte pour comprendre votre projet.', 'Our team contacts you to understand your project.')),
         (("L'accord", 'The agreement'), ('Nous définissons ensemble le cadre du partenariat.', 'Together we define the partnership framework.')),
         (('Le lancement', 'The launch'), ('Vous recevez votre identifiant membre (KG-PAR-…) et votre espace partenaire.', 'You receive your member ID (KG-PAR-…) and your partner space.'))],
        form, ('Partenaire | KAME GROUP', 'Partner | KAME GROUP'),
        'Devenez partenaire de KAME GROUP : PayTech, technologie, commercial, institutions et formation.', 'partner')

    # Commerçant
    f = Form('inscription-commercant')
    form = f.wrap(
        f.row(f.inp('nom', 'Nom et prénom', 'Full name', req=True, ac='name'), f.inp('commerce', 'Nom du commerce', 'Business name', req=True, ac='organization')) +
        f.row(f.inp('activite', 'Activité', 'Activity', req=True, ph=('Ex. : boutique de vêtements', 'E.g. clothing shop')), f.inp('ville', 'Ville', 'City', req=True, ac='address-level2')) +
        f.row(f.inp('telephone', 'Téléphone', 'Phone', 'tel', req=True, ac='tel'), f.inp('email', 'E-mail', 'Email', 'email', ac='email')) +
        f.inp('rccm', 'Numéro RCCM (si vous en avez un)', 'RCCM number (if you have one)') +
        f.group('agriculture', "Votre activité est-elle dans l'agriculture ?", 'Is your business in agriculture?', AGRI_CHOICES, req=True) +
        f.sel('type_agricole', "Type d'activité agricole", 'Type of farming activity', AGRI_TYPES, show_when='agriculture=oui') +
        f.area('message', 'Un message (facultatif)', 'A message (optional)'), note=DOCS_NOTE)
    profile_page(
        'commercant.html', 'merchant', ('Commerçant', 'Merchant'),
        ('Boutique, marché, artisanat ou commerce agricole : KAME GROUP vous aide à sécuriser et à développer votre activité avec des outils simples.',
         'Shop, market stall, crafts or farm trade: KAME GROUP helps you secure and grow your business with simple tools.'),
        ('Ce que nous faisons ensemble', 'What we do together'),
        features([
            ('id', ('Une identité vérifiée avec KAME ID', 'A verified identity with KAME ID'),
             ('Prouvez qui vous êtes en ligne et rassurez vos clients et vos partenaires.', 'Prove who you are online and reassure your customers and partners.')),
            ('score', ('Un dossier fiable avec KAME Score', 'A reliable file with KAME Score'),
             ('Préparez un dossier solide pour accéder plus facilement au financement auprès de nos partenaires.', 'Build a solid file to access financing more easily through our partners.')),
            ('data', ('Suivre vos ventes avec KAME Data', 'Track your sales with KAME Data'),
             ("Des tableaux simples pour voir l'évolution de votre activité.", 'Simple dashboards to see how your business is doing.')),
            ('agro', ("Dans l'agriculture ? KAME Agro", 'In agriculture? KAME Agro'),
             ('Des outils adaptés aux commerçants du secteur agricole.', 'Tools suited to merchants in the agricultural sector.')),
        ]),
        note_section('<p class="notice">%s</p>' % T('<strong>Paiements :</strong> pour vos transactions, vous choisirez la PayTech gabonaise partenaire qui vous convient (partenaires à venir).',
                                                   '<strong>Payments:</strong> for your transactions, you will choose the partner Gabonese PayTech that suits you (partners coming soon).')),
        [(('Votre demande', 'Your request'), ('Vous remplissez le formulaire ci-dessous.', 'You fill in the form below.')),
         (('La vérification', 'Verification'), ('Notre équipe vérifie votre identité et votre activité.', 'Our team checks your identity and your business.')),
         (('Votre identifiant', 'Your member ID'), ('Vous recevez votre identifiant KAME (KG-COM-…) et l\'accès à votre espace.', 'You receive your KAME ID (KG-COM-…) and access to your space.')),
         (('Vos outils', 'Your tools'), ('Vous utilisez les outils adaptés à votre commerce.', 'You use the tools that suit your business.'))],
        form, ('Commerçant | KAME GROUP', 'Merchant | KAME GROUP'),
        'Commerçants : sécurisez et développez votre activité avec les outils KAME GROUP.', 'merchant')

    # Entreprise
    f = Form('inscription-entreprise')
    tool_opts = [(t['name'], t['name'], t['name']) for t in TOOLS]
    form = f.wrap(
        f.row(f.inp('raison_sociale', 'Raison sociale', 'Company name', req=True, ac='organization'), f.inp('secteur', "Secteur d'activité", 'Industry', req=True)) +
        f.row(f.inp('rccm', 'Numéro RCCM', 'RCCM number'), f.inp('nif', 'NIF', 'Tax ID (NIF)')) +
        f.row(f.sel('taille', "Taille de l'entreprise", 'Company size', [('1-10', '1 à 10 personnes', '1 to 10 people'), ('11-50', '11 à 50 personnes', '11 to 50 people'),
                                                                        ('51-250', '51 à 250 personnes', '51 to 250 people'), ('250+', 'Plus de 250 personnes', 'More than 250 people')]),
              f.inp('ville', 'Ville et pays', 'City and country', req=True)) +
        f.group('outils', 'Les outils qui vous intéressent', 'Tools you are interested in', tool_opts, typ='checkbox') +
        f.group('agriculture', "Votre activité est-elle dans l'agriculture ?", 'Is your business in agriculture?', AGRI_CHOICES, req=True) +
        f.sel('type_agricole', "Type d'activité agricole", 'Type of farming activity', AGRI_TYPES, show_when='agriculture=oui') +
        f.check('aussi_partenaire', 'Nous souhaitons aussi devenir partenaire (double profil).', 'We also want to become a partner (double profile).') +
        f.row(f.inp('contact_nom', 'Nom et prénom du contact', 'Contact full name', req=True, ac='name'), f.inp('fonction', 'Fonction', 'Job title', ac='organization-title')) +
        f.row(f.inp('email', 'E-mail professionnel', 'Business email', 'email', req=True, ac='email'), f.inp('telephone', 'Téléphone', 'Phone', 'tel', req=True, ac='tel')) +
        f.area('message', 'Votre besoin', 'Your needs'), note=DOCS_NOTE)
    profile_page(
        'entreprise.html', 'business', ('Entreprise', 'Business'),
        ('PME, grande entreprise ou administration : utilisez les outils KAME pour identifier vos clients, vérifier la conformité, protéger vos données et suivre votre activité.',
         'SME, large company or public body: use KAME tools to identify your customers, check compliance, protect your data and track your activity.'),
        ('Ce que nous faisons ensemble', 'What we do together'),
        features([
            ('id', ('Identifiez vos clients avec KAME ID', 'Identify your customers with KAME ID'),
             ("Nous mettons notre outil d'ID numérique à votre disposition pour identifier vos propres clients, gérés ensuite avec nos outils.",
              'We provide our digital ID tool so you can identify your own customers, then manage them with our tools.')),
            ('check', ('Restez conforme avec KAME Check', 'Stay compliant with KAME Check'),
             ('Contrôle KYC et lutte contre le blanchiment pour vos clients et vos opérations.', 'KYC checks and anti-money laundering for your customers and operations.')),
            ('garde', ('Protégez-vous avec KAME Garde', 'Stay protected with KAME Garde'),
             ('La protection de vos systèmes, de vos données et de vos transactions.', 'Protection for your systems, data and transactions.')),
            ('registre', ('Tracez vos échanges avec KAME Registre', 'Trace your exchanges with KAME Registre'),
             ('Des dossiers et des échanges vérifiables par chaque partie, grâce à la blockchain.', 'Records and exchanges every party can verify, thanks to blockchain.')),
            ('data', ('Pilotez avec KAME Data', 'Steer with KAME Data'),
             ('Des tableaux de bord clairs, adaptés aux données de votre entreprise.', "Clear dashboards suited to your company's data.")),
            ('score', ('Évaluez avec KAME Score', 'Assess with KAME Score'),
             ('La fiabilité de vos partenaires et de vos clients, à partir de leurs documents et de leur activité.', 'How reliable your partners and customers are, based on their documents and activity.')),
        ]),
        callout(('Talent', 'Talent'), ('Former vos équipes', 'Train your teams'),
                ('Bientôt : des formations pour aider vos employés à utiliser nos outils, à digitaliser vos documents et à travailler avec les plateformes de paiement.',
                 'Coming soon: training to help your employees use our tools, digitise your documents and work with payment platforms.'),
                '<div><a class="btn btn-light" href="formations.html">%s</a></div>' % T('Voir les formations', 'See the training')) +
        note_section('<p class="notice">%s</p>' % T('<strong>Bon à savoir :</strong> votre entreprise peut aussi devenir partenaire. Cochez la case dans le formulaire.',
                                                   '<strong>Good to know:</strong> your company can also become a partner. Just tick the box in the form.')),
        [(('Votre demande', 'Your request'), ('Vous remplissez le formulaire ci-dessous.', 'You fill in the form below.')),
         (('La vérification', 'Verification'), ('Nous vérifions les informations de votre entreprise (RCCM, NIF).', "We check your company's details (RCCM, NIF).")),
         (('Votre identifiant', 'Your member ID'), ('Vous recevez votre identifiant KAME (KG-ENT-…) et l\'accès à votre espace.', 'You receive your KAME ID (KG-ENT-…) and access to your space.')),
         (('La mise en place', 'Set-up'), ('Nous mettons en place les outils choisis avec vos équipes.', 'We set up the chosen tools with your teams.'))],
        form, ('Entreprise | KAME GROUP', 'Business | KAME GROUP'),
        "Entreprises : identité numérique, conformité, cybersécurité, blockchain, données et analyse de solvabilité avec KAME GROUP.", 'business',
        h1=('Faites grandir votre entreprise au Gabon', 'Grow your business in Gabon'))

    # Investisseur
    f = Form('inscription-investisseur')
    form = f.wrap(
        f.group('type_investisseur', 'Vous êtes', 'You are', [('personne-physique', 'Une personne', 'An individual'), ('personne-morale', 'Une structure (société, fonds…)', 'An organisation (company, fund…)')], req=True) +
        f.row(f.inp('nom', 'Nom ou structure', 'Name or organisation', req=True, ac='name'), f.inp('pays', 'Pays', 'Country', req=True, ac='country-name')) +
        f.sel('montant', 'Montant envisagé', 'Intended amount', [('moins-5M', 'Moins de 5 millions FCFA', 'Less than 5 million FCFA'), ('5-25M', '5 à 25 millions FCFA', '5 to 25 million FCFA'),
                                                                 ('25-100M', '25 à 100 millions FCFA', '25 to 100 million FCFA'), ('plus-100M', 'Plus de 100 millions FCFA', 'More than 100 million FCFA'),
                                                                 ('a-discuter', 'Je préfère en parler', "I'd rather discuss it")]) +
        f.group('interets', 'Ce qui vous intéresse', 'What interests you', [('groupe', 'Le groupe KAME GROUP', 'KAME GROUP as a whole')] + [(t['name'], t['name'], t['name']) for t in TOOLS[:7]], typ='checkbox') +
        f.row(f.inp('contact_nom', 'Nom et prénom du contact', 'Contact full name', req=True, ac='name'), f.inp('email', 'E-mail', 'Email', 'email', req=True, ac='email')) +
        f.inp('telephone', 'Téléphone', 'Phone', 'tel', req=True, ac='tel') +
        f.area('message', 'Un message (facultatif)', 'A message (optional)'), note=DOCS_NOTE)
    profile_page(
        'investisseur.html', 'investor', ('Investisseur', 'Investor'),
        ("Découvrez des entreprises gabonaises vérifiées et notées par KAME, ou financez directement KAME GROUP et ses projets. Voici comment nous travaillons avec les investisseurs.",
         'Discover Gabonese businesses verified and rated by KAME, or fund KAME GROUP and its projects directly. Here is how we work with investors.'),
        ('Ce que nous vous proposons', 'What we offer you'),
        features([
            ('investor', ('La présentation investisseurs', 'The investor presentation'),
             ('Notre vision, nos outils et nos projets, présentés en détail.', 'Our vision, our tools and our projects, presented in detail.')),
            ('check', ('Les documents financiers', 'Financial documents'),
             ("Accessibles après la signature d'un accord de confidentialité.", 'Available once a confidentiality agreement has been signed.')),
            ('chat', ('Un contact direct', 'Direct contact'),
             ('Des rendez-vous avec la direction pour répondre à vos questions.', 'Meetings with management to answer your questions.')),
            ('score', ('Des outils utiles', 'Useful tools'),
             ("KAME Score pour évaluer la fiabilité d'une entreprise, KAME Registre pour suivre les échanges de façon traçable.",
              'KAME Score to assess how reliable a business is, KAME Registre to follow exchanges in a traceable way.')),
        ]),
        '<section class="section invest-sec"><div class="container">%s%s</div></section>' % (
            section_head(('Investir dans les PME du Gabon', 'Investing in Gabonese SMEs'),
                         ("Votre espace investisseur, en cours de lancement, réunit ce qu'il faut pour choisir en confiance.",
                          'Your investor space, now launching, brings together what you need to choose with confidence.')),
            features([
                ('id', ('Des entreprises vérifiées', 'Verified businesses'),
                 ("Chaque entreprise est vérifiée avec KAME ID : identité des dirigeants et documents officiels (RCCM, NIF).",
                  "Every business is checked with KAME ID: directors' identity and official documents (RCCM, NIF).")),
                ('score', ('Le KAME Score', 'The KAME Score'),
                 ("Une note de fiabilité sur 100, de A à E, calculée à partir des données que l'entreprise partage avec son accord.",
                  'A reliability rating out of 100, from A to E, based on data the business shares with its consent.')),
                ('data', ('KAME Data', 'KAME Data'),
                 ("L'évolution de l'activité de chaque entreprise, comparée à son secteur.", "Each business's activity over time, compared with its sector.")),
                ('registre', ('KAME Registre', 'KAME Registre'),
                 ('Les opérations clés enregistrées de façon infalsifiable, et la vérification des documents.',
                  'Key operations recorded in a tamper-proof way, and document verification.')),
                ('investor', ("Des opportunités d'investissement", 'Investment opportunities'),
                 ('Les projets des entreprises qui cherchent un financement : prêt ou prise de participation.',
                  'Projects from businesses seeking funding: loans or equity stakes.')),
            ])) +
        callout(('Paiements', 'Payments'), ('Payez avec la PayTech de votre choix', 'Pay with the PayTech of your choice'),
                ("Pour vos opérations avec les entreprises du réseau, vous choisirez parmi nos PayTech gabonaises partenaires (partenaires à venir). Les paiements passent par la PayTech que vous choisissez.",
                 'For your transactions with businesses in the network, you will choose among our partner Gabonese PayTechs (partners coming soon). Payments go through the PayTech you choose.')) +
        note_section('<p class="notice">%s</p>' % T("<strong>Important :</strong> investir comporte des risques. KAME GROUP ne promet aucun rendement. L'accès aux opportunités se fait après vérification de votre profil, dans le respect de la réglementation en vigueur.",
                                                   '<strong>Important:</strong> investing involves risk. KAME GROUP does not promise any return. Access to opportunities is granted after your profile has been checked, in line with applicable regulations.')) +
        faq_section(('Questions fréquentes', 'Frequently asked questions'), INVESTOR_FAQ),
        [(('Votre demande', 'Your request'), ('Vous remplissez le formulaire ci-dessous.', 'You fill in the form below.')),
         (('La vérification', 'Verification'), ('Notre équipe vérifie votre profil.', 'Our team checks your profile.')),
         (('La confidentialité', 'Confidentiality'), ('Nous signons ensemble un accord de confidentialité.', 'We sign a confidentiality agreement together.')),
         (('Les échanges', 'Next steps'), ('Vous accédez aux documents et rencontrez la direction. Identifiant : KG-INV-…', 'You access the documents and meet management. Member ID: KG-INV-…'))],
        form, ('Investisseur | KAME GROUP', 'Investor | KAME GROUP'),
        "Investisseurs : découvrez comment KAME GROUP travaille avec ses investisseurs.", 'investor', P_GLASSES,
        h1=('Investir au Gabon en toute confiance', 'Invest in Gabon with confidence'))


def build_other_pages():
    # Formations
    f = Form('interet-formations')
    form = f.wrap(
        f.row(f.inp('entreprise', 'Entreprise', 'Company', req=True, ac='organization'), f.inp('nom', 'Nom et prénom', 'Full name', req=True, ac='name')) +
        f.row(f.inp('email', 'E-mail', 'Email', 'email', req=True, ac='email'), f.inp('telephone', 'Téléphone', 'Phone', 'tel', ac='tel')) +
        f.sel('effectif', "Nombre d'employés à former", 'Number of employees to train',
              [('1-5', '1 à 5', '1 to 5'), ('6-20', '6 à 20', '6 to 20'), ('21-50', '21 à 50', '21 to 50'), ('50+', 'Plus de 50', 'More than 50')]) +
        f.group('themes', 'Les thèmes qui vous intéressent', 'Topics you are interested in',
                [('outils-kame', 'Prise en main des outils KAME', 'Getting started with KAME tools'), ('digitalisation', 'Digitalisation des documents', 'Digitising documents'),
                 ('paiements', 'Plateformes de paiement et outils numériques', 'Payment platforms and digital tools'), ('ethique', 'Éthique et bonnes pratiques au travail', 'Ethics and good workplace practices')],
                typ='checkbox') +
        f.area('message', 'Un message (facultatif)', 'A message (optional)'),
        submit=('Être informé(e) du lancement', 'Keep me informed'))
    hero = page_hero(T('Formations', 'Training'), T('Talent', 'Talent'), T('Former les talents de demain', "Training tomorrow's talent"),
                     T('Des formations pour aider les entreprises membres à former leurs employés aux outils et aux pratiques dont elles ont besoin au quotidien.',
                       'Training to help member businesses prepare their employees for the tools and practices they need every day.'),
                     '<span class="badge-soon">%s</span>' % T('Projet à venir', 'Coming soon'),
                     profile_visual('book', 'book', P_CAP, False))
    main = (hero +
            '<section class="section"><div class="container">%s%s</div></section>' % (
                section_head(('Ce que nous préparons', 'What we are preparing')),
                features([
                    ('grid', ('Prise en main des outils KAME', 'Getting started with KAME tools'),
                     ("Apprendre à utiliser, au quotidien, les outils KAME choisis par l'entreprise.", 'Learning to use the KAME tools chosen by the company, day to day.')),
                    ('check', ('Digitalisation des documents', 'Digitising documents'),
                     ('Passer du papier au numérique : classer, partager et protéger les documents.', 'Moving from paper to digital: filing, sharing and protecting documents.')),
                    ('pay', ('Paiements et outils numériques', 'Payments and digital tools'),
                     ("Utiliser les plateformes de paiement et les outils numériques de l'entreprise.", "Using payment platforms and the company's digital tools.")),
                    ('partner', ('Éthique et bonnes pratiques', 'Ethics and good practices'),
                     ('Travailler avec le numérique en toute confiance et en toute responsabilité.', 'Working with digital tools with confidence and responsibility.')),
                ])) +
            note_section('<p class="notice">%s</p>' % T("<strong>Pour qui ?</strong> Les équipes des entreprises membres. Nos formations ne remplacent pas un cursus spécialisé (cybersécurité, analyse de données…) : elles apprennent à vos équipes à utiliser nos outils dans leur travail.",
                                                       '<strong>Who is it for?</strong> The teams of member businesses. Our training does not replace a specialist course (cybersecurity, data analysis…): it teaches your teams to use our tools in their work.')) +
            form_section(form, ('Être informé(e) du lancement', 'Be told when we launch'),
                         ('Laissez-nous vos coordonnées : nous vous préviendrons dès l\'ouverture des premières formations.', 'Leave us your details: we will let you know as soon as the first sessions open.')))
    page('formations.html', 'Formations | KAME GROUP', 'Training | KAME GROUP', 'Formations KAME GROUP pour les équipes des entreprises membres (projet à venir).', main)


def build_app_pages():
    # Merci
    main = ('<section class="page-hero" id="accueil"><div class="hex-pattern" aria-hidden="true"></div><div class="container page-hero-inner">'
            '<div class="page-hero-text" data-reveal><p class="eyebrow">KAME GROUP</p><h1>%s</h1><p class="lead">%s</p>'
            '<div class="hero-actions"><a class="btn btn-light" href="index.html">%s</a></div></div>'
            '<div class="page-hero-visual" data-reveal data-delay="1">%s</div></div>%s</section>'
            '<section class="section"><div class="container center-block"><p class="lead">%s</p></div></section>'
            % (T('Merci !', 'Thank you!'), T('Votre demande a bien été envoyée. Notre équipe vous répondra rapidement.', 'Your request has been sent. Our team will get back to you soon.'),
               T("Retour à l'accueil", 'Back to home'), profile_visual('check', 'check'), edge_svg(20, 'down'),
               T('Un avenir sûr et éclairé.', 'A secure and bright future.')))
    page('merci.html', 'Merci | KAME GROUP', 'Thank you | KAME GROUP', 'Merci pour votre demande.', main, noindex=True)

    # 404
    main = ('<section class="page-hero" id="accueil"><div class="hex-pattern" aria-hidden="true"></div><div class="container page-hero-inner">'
            '<div class="page-hero-text"><p class="eyebrow">404</p><h1>%s</h1><p class="lead">%s</p>'
            '<div class="hero-actions"><a class="btn btn-light" href="index.html">%s</a></div></div></div>%s</section>'
            % (T('Page introuvable', 'Page not found'), T("Cette page n'existe pas ou a été déplacée.", 'This page does not exist or has been moved.'),
               T("Retour à l'accueil", 'Back to home'), edge_svg(20, 'down')))
    # base "/" : la page 404 garde son style même à une adresse du type /dossier/page
    page('404.html', 'Page introuvable | KAME GROUP', 'Page not found | KAME GROUP', 'Page introuvable.', main, noindex=True, base='/')


# ---------------------------------------------------------------- espace membre (Netlify Identity)
REQ = ' <span class="req" aria-hidden="true">*</span>'


def afield(prefix, n, fr, en, typ='text', req=False, ac=None, extra='', hint=None):
    a = ' autocomplete="%s"' % ac if ac else ''
    h = '<p class="field-hint">%s</p>' % T(*hint) if hint else ''
    return ('<div class="field"><label for="%s-%s">%s%s</label><input id="%s-%s" name="%s" type="%s"%s%s%s>%s</div>'
            % (prefix, n, T(fr, en), REQ if req else '', prefix, n, n, typ, ' required' if req else '', a, extra, h))


def google_button(fr, en):
    return ('<button type="button" class="btn btn-google" data-oauth="google"><span class="g-ico" aria-hidden="true">%s</span>%s</button>'
            '<p class="or"><span>%s</span></p>' % (icon('arrow', 18, 2), T(fr, en), T('ou avec votre e-mail', 'or with your email')))


def pick_profiles(prefix):
    items = ''.join(
        '<label class="pick"><input type="radio" name="profil" value="%s" required>'
        '<span class="pick-box"><span class="hex-icon">%s</span><span class="pick-name">%s</span></span></label>'
        % (ROLE_OF[p['key']], icon(p['key'], 22), T(*p['name'])) for p in PROFILES)
    opts = opt('', 'Aucun', 'None') + ''.join(opt(ROLE_OF[p['key']], p['name'][0], p['name'][1]) for p in PROFILES)
    return ('<fieldset class="field"><legend>%s%s</legend><div class="profile-pick">%s</div></fieldset>'
            '<div class="field"><label for="%s-profil2">%s</label><select id="%s-profil2" name="profil2">%s</select>'
            '<p class="field-hint">%s</p></div>'
            % (T('Votre profil', 'Your profile'), REQ, items, prefix, T('Deuxième profil (facultatif)', 'Second profile (optional)'),
               prefix, opts, T('Par exemple, une entreprise qui veut aussi devenir partenaire.', 'For example, a business that also wants to become a partner.')))


def account_details(prefix):
    agri = ''.join('<label class="check"><input type="radio" name="agriculture" value="%s" required> <span>%s</span></label>' % (v, T(fr, en))
                   for v, fr, en in AGRI_CHOICES)
    types = opt('', 'Choisir…', 'Choose…') + ''.join(opt(v, fr, en) for v, fr, en in AGRI_TYPES)
    return (afield(prefix, 'structure', 'Nom de votre entreprise ou structure', 'Name of your company or organisation', ac='organization',
                   hint=('Facultatif si vous êtes commerçant(e) indépendant(e).', 'Optional if you are an independent merchant.')) +
            '<div class="form-row">%s%s</div>' % (
                afield(prefix, 'telephone', 'Téléphone ou WhatsApp', 'Phone or WhatsApp', 'tel', True, 'tel'),
                afield(prefix, 'ville', 'Ville et pays', 'City and country', req=True, ac='address-level2')) +
            '<fieldset class="field"><legend>%s%s</legend><div class="choices">%s</div></fieldset>'
            % (T("Votre activité est-elle dans l'agriculture ?", 'Is your activity in farming?'), REQ, agri) +
            '<div class="field" data-agri-type hidden><label for="%s-agri_type">%s</label><select id="%s-agri_type" name="agri_type">%s</select></div>'
            % (prefix, T('Dans quel domaine ?', 'In which area?'), prefix, types) +
            '<div class="field"><label for="%s-activite">%s</label><textarea id="%s-activite" name="activite" rows="3"></textarea></div>'
            % (prefix, T('Présentez votre activité en quelques mots (facultatif)', 'Describe your activity in a few words (optional)'), prefix) +
            '<label class="check"><input type="checkbox" name="consentement" value="oui" required> <span>%s</span></label>'
            % T("J'ai 18 ans ou plus. J'accepte les "
                '<a href="conditions-utilisation.html" target="_blank" rel="noopener">conditions d\'utilisation</a> '
                "et que KAME GROUP utilise ces informations pour créer et vérifier mon compte, comme l'explique sa "
                '<a href="confidentialite.html" target="_blank" rel="noopener">politique de confidentialité</a>.',
                'I am 18 or older. I accept the <a href="conditions-utilisation.html" target="_blank" rel="noopener">terms of use</a> '
                'and agree that KAME GROUP may use this information to create and check my account, as explained in its '
                '<a href="confidentialite.html" target="_blank" rel="noopener">privacy policy</a>.'))


NOTIFY_FIELDS = ['nom', 'email', 'profil', 'profil2', 'structure', 'telephone', 'ville', 'agriculture', 'agri_type', 'activite', 'methode', 'langue']


def auth_page():
    tabs = ('<div class="auth-tabs" role="tablist">'
            '<button type="button" role="tab" data-show="login" aria-selected="true">%s</button>'
            '<button type="button" role="tab" data-show="signup" aria-selected="false">%s</button></div>'
            % (T('Se connecter', 'Log in'), T('Créer un compte', 'Create an account')))
    login = ('<div class="auth-panel" id="auth-login" hidden><h2>%s</h2>%s'
             '<form class="form" id="form-login">%s%s<button class="btn btn-primary btn-block" type="submit">%s</button></form>'
             '<p class="auth-links"><button type="button" class="link-btn" data-show="forgot">%s</button></p>'
             '<p class="auth-switch">%s <button type="button" class="link-btn" data-show="signup">%s</button></p></div>'
             % (T('Se connecter', 'Log in'), google_button('Continuer avec Google', 'Continue with Google'),
                afield('l', 'email', 'E-mail', 'Email', 'email', True, 'email'),
                afield('l', 'password', 'Mot de passe', 'Password', 'password', True, 'current-password'),
                T('Se connecter', 'Log in'), T('Mot de passe oublié ?', 'Forgot your password?'),
                T('Pas encore membre ?', 'Not a member yet?'), T('Créer un compte', 'Create an account')))
    signup = ('<div class="auth-panel" id="auth-signup" hidden><h2>%s</h2>%s'
              '<form class="form" id="form-signup">%s%s%s%s%s<button class="btn btn-primary btn-block" type="submit">%s</button></form>'
              '<p class="auth-switch">%s <button type="button" class="link-btn" data-show="login">%s</button></p></div>'
              % (T('Créer mon compte', 'Create my account'), google_button("S'inscrire avec Google", 'Sign up with Google'),
                 afield('s', 'nom', 'Nom et prénom', 'Full name', req=True, ac='name'),
                 afield('s', 'email', 'E-mail', 'Email', 'email', True, 'email'),
                 afield('s', 'password', 'Mot de passe', 'Password', 'password', True, 'new-password', ' minlength="8"',
                        ('Au moins 8 caractères.', 'At least 8 characters.')),
                 pick_profiles('s'), account_details('s'), T('Créer mon compte', 'Create my account'),
                 T('Déjà membre ?', 'Already a member?'), T('Se connecter', 'Log in')))
    complete = ('<div class="auth-panel" id="auth-complete" hidden><h2>%s</h2><p class="auth-intro">%s</p>'
                '<form class="form" id="form-complete">%s%s%s<button class="btn btn-primary btn-block" type="submit">%s</button></form>'
                '<p class="auth-switch"><button type="button" class="link-btn" data-logout>%s</button></p></div>'
                % (T('Finaliser mon inscription', 'Finish signing up'),
                   T('Bienvenue ! Il nous manque quelques informations pour créer votre profil.', 'Welcome! We need a few more details to set up your profile.'),
                   afield('c', 'nom', 'Nom et prénom', 'Full name', req=True, ac='name'), pick_profiles('c'), account_details('c'),
                   T('Finaliser mon inscription', 'Finish signing up'), T("Ce n'est pas mon compte ? Se déconnecter", 'Not your account? Log out')))
    check = ('<div class="auth-panel center" id="auth-check" hidden><span class="hex-icon big">%s</span><h2>%s</h2><p>%s <strong data-check-email></strong>. %s</p>'
             '<p class="small">%s</p><button type="button" class="btn btn-outline" data-show="login">%s</button></div>'
             % (icon('mail', 28), T('Vérifiez votre boîte e-mail', 'Check your inbox'),
                T('Nous avons envoyé un lien de confirmation à', 'We have sent a confirmation link to'),
                T('Cliquez dessus pour activer votre compte. Pensez à regarder dans les spams.', 'Click it to activate your account. Remember to check your spam folder.'),
                T("Cet e-mail est envoyé par Netlify, notre hébergeur, et il est rédigé en anglais.", 'This email is sent by Netlify, our hosting provider.'),
                T('Retour à la connexion', 'Back to log in')))
    forgot = ('<div class="auth-panel" id="auth-forgot" hidden><h2>%s</h2><p class="auth-intro">%s</p>'
              '<form class="form" id="form-forgot">%s<button class="btn btn-primary btn-block" type="submit">%s</button></form>'
              '<p class="auth-switch"><button type="button" class="link-btn" data-show="login">%s</button></p></div>'
              % (T('Mot de passe oublié', 'Forgot your password'),
                 T('Indiquez votre e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe.', 'Enter your email: we will send you a link to choose a new password.'),
                 afield('f', 'email', 'E-mail', 'Email', 'email', True, 'email'), T('Envoyer le lien', 'Send the link'), T('Retour à la connexion', 'Back to log in')))
    reset = ('<div class="auth-panel" id="auth-reset" hidden><h2>%s</h2>'
             '<form class="form" id="form-reset">%s<button class="btn btn-primary btn-block" type="submit">%s</button></form></div>'
             % (T('Nouveau mot de passe', 'New password'),
                afield('r', 'password', 'Nouveau mot de passe', 'New password', 'password', True, 'new-password', ' minlength="8"', ('Au moins 8 caractères.', 'At least 8 characters.')),
                T('Enregistrer', 'Save')))
    invite = ('<div class="auth-panel" id="auth-invite" hidden><h2>%s</h2><p class="auth-intro">%s</p>'
              '<form class="form" id="form-invite">%s<button class="btn btn-primary btn-block" type="submit">%s</button></form></div>'
              % (T('Bienvenue chez KAME GROUP', 'Welcome to KAME GROUP'), T('Choisissez votre mot de passe pour activer votre compte.', 'Choose your password to activate your account.'),
                 afield('i', 'password', 'Mot de passe', 'Password', 'password', True, 'new-password', ' minlength="8"', ('Au moins 8 caractères.', 'At least 8 characters.')),
                 T('Activer mon compte', 'Activate my account')))
    closed = ('<div class="auth-panel center" id="auth-closed" hidden><span class="hex-icon big">%s</span><h2>%s</h2><p>%s</p>'
              '<a class="btn btn-outline" href="index.html#contact">%s</a></div>'
              % (icon('garde', 28), T("L'espace membre ouvre bientôt", 'The member area opens soon'),
                 T('La connexion n\'est pas encore activée. Revenez dans quelques jours, ou écrivez-nous.', 'Sign-in is not switched on yet. Please come back in a few days, or write to us.'),
                 T('Nous écrire', 'Write to us')))
    loading = '<div class="auth-panel center" id="auth-loading"><p class="loading">%s</p></div>' % T('Chargement…', 'Loading…')
    notify = ('<form name="nouveau-compte" method="POST" data-netlify="true" netlify-honeypot="bot-field" hidden>'
              '<input type="hidden" name="form-name" value="nouveau-compte"><input name="bot-field">%s</form>'
              % ''.join('<input name="%s">' % n for n in NOTIFY_FIELDS))
    hero = page_hero(T('Espace membre', 'Member area'), T('Connexion', 'Log in'), T('Espace membre', 'Member area'),
                     T('Connectez-vous ou créez votre compte : investisseur, commerçant, entreprise ou partenaire.',
                       'Log in or create your account: investor, merchant, business or partner.'), '', profile_visual('partner', 'partner'))
    main = (hero + '<section class="section bg-tint"><div class="container"><div class="auth-card" id="auth">%s'
            '<div class="auth-msg" role="alert" hidden></div>%s%s%s%s%s%s%s%s%s</div>%s</div></section>'
            % (tabs, loading, login, signup, complete, check, forgot, reset, invite, closed, notify))
    page('connexion.html', 'Espace membre | KAME GROUP', 'Member area | KAME GROUP',
         'Connectez-vous ou créez votre compte KAME GROUP : investisseur, commerçant, entreprise ou partenaire.', main)


DASHBOARDS = {
    'investisseur': (('Repérez les entreprises gabonaises fiables et suivez leur progression.', 'Find reliable Gabonese businesses and follow their progress.'), [
        ('score', 'KAME Score', ('Consultez la solvabilité des entreprises membres avant d\'investir.', 'Check the solvency of member businesses before you invest.')),
        ('data', 'KAME Data', ('Suivez la progression des entreprises et des secteurs.', 'Follow how businesses and sectors are doing.')),
        ('registre', 'KAME Registre', ("Vérifiez l'historique des opérations, enregistré de façon infalsifiable.", 'Check the history of transactions, recorded in a tamper-proof way.')),
        ('investor', ("Opportunités d'investissement", 'Investment opportunities'), ('Découvrez les entreprises vérifiées qui recherchent un financement.', 'Discover verified businesses looking for funding.')),
    ]),
    'entreprise': (('Pilotez votre activité et renforcez la confiance de vos partenaires.', 'Run your business and build trust with your partners.'), [
        ('data', 'KAME Data', ('Vos tableaux de bord : ventes, paiements, tendances.', 'Your dashboards: sales, payments, trends.')),
        ('score', 'KAME Score', ('Votre score de solvabilité, à présenter aux banques et aux investisseurs.', 'Your solvency score, to show banks and investors.')),
        ('id', 'KAME ID', ('Identifiez vos clients de façon sûre.', 'Identify your customers securely.')),
        ('check', 'KAME Check', ('Vérifiez votre conformité.', 'Check your compliance.')),
        ('garde', 'KAME Garde', ('Protégez vos données et vos comptes.', 'Protect your data and your accounts.')),
    ]),
    'commercant': (('Suivez vos ventes et montrez votre sérieux aux financeurs.', 'Track your sales and show lenders you are reliable.'), [
        ('data', 'KAME Data', ('Vos ventes en un coup d\'œil.', 'Your sales at a glance.')),
        ('score', 'KAME Score', ('Votre fiabilité, pour obtenir plus facilement un financement.', 'Your reliability, to get funding more easily.')),
        ('id', 'KAME ID', ('Identifiez vos clients de façon sûre.', 'Identify your customers securely.')),
    ]),
    'partenaire': (('Construisons ensemble des services financiers plus simples et plus sûrs.', "Let's build simpler, safer financial services together."), [
        ('design', 'KAME Design', ('Rendez votre plateforme de paiement plus simple pour vos utilisateurs.', 'Make your payment platform simpler for your users.')),
        ('check', 'KAME Check', ('Intégrez nos vérifications de conformité à vos services.', 'Add our compliance checks to your services.')),
        ('id', 'KAME ID', ("Proposez l'identité numérique à vos clients.", 'Offer digital identity to your customers.')),
        ('partner', ('Proposer un projet', 'Suggest a project'), ('Parlez-nous de votre idée de partenariat.', 'Tell us about your partnership idea.')),
    ]),
}
AGRO_TILE = ('agro', 'KAME Agro', ('Des outils pour les activités agricoles : production, stocks, ventes.', 'Tools for farming activities: production, stock, sales.'))


def tool_tile(ic, name, desc, cls=''):
    nm = name if isinstance(name, str) else T(*name)
    return ('<div class="tool-tile%s"><span class="hex-icon">%s</span><div><h3>%s</h3><p>%s</p><span class="badge-soon">%s</span></div></div>'
            % (cls, icon(ic, 22), nm, T(*desc), T('Bientôt disponible', 'Coming soon')))


def space_page():
    summary = ''.join('<div><dt>%s</dt><dd data-field="%s">—</dd></div>' % (T(fr, en), k) for k, fr, en in [
        ('profil', 'Profil', 'Profile'), ('profil2', 'Deuxième profil', 'Second profile'), ('structure', 'Structure', 'Organisation'),
        ('email', 'E-mail', 'Email'), ('telephone', 'Téléphone', 'Phone'), ('ville', 'Ville', 'City')])
    pending = ('<div class="space-panel" id="space-pending" hidden><span class="status-badge pending">%s</span>'
               '<h2>%s <span data-first-name></span> !</h2><p class="lead">%s</p><dl class="summary">%s</dl>'
               '<div class="hero-actions"><button type="button" class="btn btn-primary" data-refresh>%s</button>'
               '<a class="btn btn-outline" href="index.html#contact">%s</a><button type="button" class="btn btn-outline" data-logout>%s</button></div></div>'
               % (T('En attente de validation', 'Awaiting approval'), T('Merci,', 'Thank you,'),
                  T("Votre compte a bien été créé. Notre équipe vérifie votre profil avant d'ouvrir votre accès à la plateforme. Nous vous préviendrons dès que ce sera fait.",
                    'Your account has been created. Our team is checking your profile before opening your access to the platform. We will let you know as soon as it is done.'),
                  summary, T('Vérifier à nouveau', 'Check again'), T('Nous écrire', 'Write to us'), T('Se déconnecter', 'Log out')))
    dashes = ''
    for role, (intro, tiles) in DASHBOARDS.items():
        dashes += ('<div class="role-dash" data-role="%s" hidden><p class="lead">%s</p><h3 class="dash-title">%s</h3><div class="tool-tiles">%s%s</div></div>'
                   % (role, T(*intro), T('Vos outils', 'Your tools'), ''.join(tool_tile(*t) for t in tiles), tool_tile(*AGRO_TILE, cls=' agro-only')))
    nxt = ''.join('<li><span class="hex-icon">%s</span><div><strong>%s</strong><span>%s</span></div><span class="badge-soon">%s</span></li>'
                  % (icon(k, 20), T(*t), T(*d), T('Bientôt', 'Soon')) for k, t, d in [
                      ('id', ('Compléter mon profil', 'Complete my profile'), ('Ajoutez les détails de votre activité.', 'Add details about your activity.')),
                      ('check', ('Déposer mes justificatifs', 'Upload my documents'), ("Pièce d'identité et documents de l'entreprise, en toute sécurité.", 'ID and company documents, securely.'))])
    dash = ('<div class="space-panel" id="space-dash" hidden><div class="space-head"><div><span class="status-badge ok">%s</span>'
            '<h2>%s <span data-first-name></span></h2><p class="ids" data-ids></p></div>'
            '<button type="button" class="btn btn-outline btn-sm" data-logout>%s</button></div>'
            '<div class="role-tabs" role="tablist" hidden></div>%s'
            '<div class="space-next"><h3 class="dash-title">%s</h3><ul>%s</ul><p class="small">%s <a href="index.html#contact">%s</a></p></div></div>'
            % (T('Membre validé', 'Approved member'), T('Bonjour', 'Hello'), T('Se déconnecter', 'Log out'), dashes,
               T('Prochaines étapes', 'Next steps'), nxt, T('Une question ?', 'A question?'), T('Écrivez-nous', 'Write to us')))
    loading = '<div class="space-panel center" id="space-loading"><p class="loading">%s</p></div>' % T('Chargement de votre espace…', 'Loading your space…')
    closed = ('<div class="space-panel center" id="space-closed" hidden><h2>%s</h2><p>%s</p><a class="btn btn-outline" href="index.html#contact">%s</a></div>'
              % (T("L'espace membre ouvre bientôt", 'The member area opens soon'),
                 T("La connexion n'est pas encore activée. Revenez dans quelques jours.", 'Sign-in is not switched on yet. Please come back in a few days.'),
                 T('Nous écrire', 'Write to us')))
    main = ('<section class="section section-tight inv-section"><div class="container container-wide"><div class="space" id="space">%s%s%s%s%s</div></div></section>'
            % (loading, pending, dash, investor_shell(), closed))
    page('espace-membre.html', 'Mon espace | KAME GROUP', 'My space | KAME GROUP', 'Espace membre KAME GROUP.', main, noindex=True,
         brand_href='espace-membre.html', member=True,
         scripts='<script src="assets/js/kame-icons.js" defer></script>\n<script src="assets/js/investor.js" defer></script>\n')


INV_VIEWS = ['accueil', 'annuaire', 'opportunites', 'portefeuille', 'score', 'data', 'registre', 'profil', 'entreprise']


def investor_shell():
    # Espace investisseur : colonne d'outils + zone centrale (contenu rempli par investor.js)
    def item(v, ic, fr, en, sub=False):
        return '<a class="inv-nav-item%s" href="#%s" data-nav="%s">%s<span>%s</span></a>' % (' sub' if sub else '', v, v, icon(ic, 20, 1.9), T(fr, en))
    nav = (item('accueil', 'home', 'Accueil', 'Home') + item('annuaire', 'building', 'Entreprises', 'Companies')
           + item('opportunites', 'target', 'Opportunités', 'Opportunities')
           + item('portefeuille', 'briefcase', 'Mon portefeuille', 'My portfolio')
           + '<p class="inv-nav-label">%s</p>' % T('Outils KAME', 'KAME tools')
           + item('score', 'score', 'KAME Score', 'KAME Score', True) + item('data', 'data', 'KAME Data', 'KAME Data', True)
           + item('registre', 'registre', 'KAME Registre', 'KAME Registre', True))
    side_card = ('<div class="inv-side-card">%s<p>%s</p><a class="btn btn-light btn-sm" href="#opportunites">%s</a></div>'
                 % (presenter_bee('investor', cls='bee-mini'), T("Investir au Gabon, c'est bâtir demain.", 'Investing in Gabon is building tomorrow.'),
                    T('Voir les opportunités', 'See opportunities')))
    views = ''.join('<section class="inv-view" data-view="%s" hidden tabindex="-1"></section>' % v for v in INV_VIEWS)
    return ('<div class="space-panel inv-shell" id="space-investor" hidden>'
            '<aside class="inv-side"><nav class="inv-nav" %s>%s</nav>%s</aside>'
            '<div class="inv-main"><div class="inv-mobile-search"><label class="sr-only" for="inv-q2">%s</label>%s'
            '<input id="inv-q2" type="search" autocomplete="off" %s></div>'
            '<p class="inv-ribbon">%s<span>%s</span></p>%s</div></div>'
            % (bi_attr('aria-label', 'Espace investisseur', 'Investor space'), nav, side_card, T('Rechercher', 'Search'), icon('search', 18, 2),
               bi_attr('placeholder', 'Rechercher une entreprise…', 'Search a company…'), icon('info', 18, 2),
               T('Version de démonstration : les entreprises, les montants et les scores affichés sont fictifs.',
                 'Demo version: the companies, amounts and scores shown are fictitious.'), views))


def build_auth_pages():
    auth_page()
    space_page()


# ---------------------------------------------------------------- politique de confidentialité
PRIVACY = [
    (('Qui est responsable de vos informations ?', 'Who is responsible for your information?'),
     [('p', "KAME GROUP, groupe technologique et financier basé à Libreville (Gabon), est responsable des informations collectées sur ce site.",
       'KAME GROUP, a technology and financial group based in Libreville (Gabon), is responsible for the information collected on this website.')]),
    (('Quelles informations collectons-nous ?', 'What information do we collect?'),
     [('p', "Uniquement celles que vous saisissez dans nos formulaires : vos nom et prénom, votre e-mail et votre téléphone, le nom et le secteur de votre entreprise, votre ville, vos réponses à nos questions (par exemple sur l'agriculture) et votre message.",
       'Only what you type into our forms: your name, email and phone number, your company name and sector, your city, your answers to our questions (for example about farming) and your message.'),
      ('p', "Si vous créez un compte : votre nom, votre e-mail, votre mot de passe (enregistré de façon sécurisée : personne chez KAME ne peut le lire) et les informations de votre profil. Si vous vous inscrivez avec Google, Google nous transmet votre nom et votre adresse e-mail.",
       'If you create an account: your name, your email, your password (stored securely: no one at KAME can read it) and your profile information. If you sign up with Google, Google shares your name and email address with us.'),
      ('p', "Nous ne demandons aucun document pour l'instant. Les justificatifs seront demandés plus tard, dans l'espace membre sécurisé.",
       'We do not ask for any document for now. Supporting documents will be requested later, in the secure member area.'),
      ('p', "Le site n'utilise aucun outil de publicité ni de mesure d'audience. Il retient seulement, dans votre navigateur, la langue que vous avez choisie (FR ou EN) et, si vous vous connectez, votre session de connexion, effacée quand vous vous déconnectez.",
       'The website uses no advertising or audience-tracking tools. It only remembers, in your browser, the language you chose (FR or EN) and, if you log in, your session, which is cleared when you log out.'),
      ('p', 'Comme pour tout site, notre hébergeur peut enregistrer des données techniques (adresse IP, type de navigateur) pour assurer la sécurité et le bon fonctionnement du site.',
       'As with any website, our host may record technical data (IP address, browser type) to keep the website secure and working properly.')]),
    (('Pourquoi les utilisons-nous ?', 'Why do we use it?'),
     [('ul', [('répondre à vos messages ;', 'to answer your messages;'),
              ("créer et vérifier votre compte membre (partenaire, commerçant, entreprise ou investisseur), puis vous donner votre identifiant KAME et l'accès aux outils de votre profil ;",
               'to create and check your member account (partner, merchant, business or investor), then give you your KAME member ID and access to the tools for your profile;'),
              ("vous prévenir du lancement de nos formations, si vous nous l'avez demandé.", 'to let you know when our training opens, if you asked us to.')]),
      ('p', 'Nous utilisons ces informations avec votre accord, que vous donnez en cochant la case prévue dans chaque formulaire.',
       'We use this information with your consent, which you give by ticking the box in each form.')]),
    (('Qui peut y accéder ?', 'Who can access it?'),
     [('p', "Seule l'équipe de KAME GROUP. Nous ne vendons ni ne louons vos informations.",
       'Only the KAME GROUP team. We never sell or rent your information.'),
      ('p', 'Le site, ses formulaires et les comptes membres (service Netlify Identity) sont hébergés par notre prestataire Netlify, Inc., sur des serveurs situés hors du Gabon.',
       'The website, its forms and member accounts (Netlify Identity service) are hosted by our provider Netlify, Inc., on servers located outside Gabon.')]),
    (('Combien de temps les gardons-nous ?', 'How long do we keep it?'),
     [('p', 'Le temps de traiter votre demande, puis au plus 3 ans après notre dernier échange. Si vous devenez membre, nous les gardons pendant toute la durée de votre adhésion.',
       'For as long as it takes to handle your request, then for no more than 3 years after our last exchange. If you become a member, we keep it for as long as your membership lasts.')]),
    (('Quels sont vos droits ?', 'What are your rights?'),
     [('p', 'Selon la loi gabonaise n°001/2011 relative à la protection des données à caractère personnel, modifiée en 2023, vous pouvez à tout moment consulter vos informations, les faire corriger ou supprimer, retirer votre accord et vous opposer à leur utilisation.',
       'Under Gabonese Law No. 001/2011 on the protection of personal data, as amended in 2023, you can at any time see your information, have it corrected or deleted, withdraw your consent and object to its use.'),
      ('p', "Pour cela, utilisez la page <a href=\"suppression-donnees.html\">Supprimer mes données</a> ou écrivez-nous depuis le <a href=\"index.html#contact\">formulaire de contact</a>. Nous répondons sous 30 jours au plus. Vous pouvez aussi vous adresser à l'Autorité pour la protection des données à caractère personnel et de la vie privée (APDPVP).",
       'To do so, use the <a href="suppression-donnees.html">Delete my data</a> page or write to us using the <a href="index.html#contact">contact form</a>. We reply within 30 days at most. You can also contact the Gabonese data protection authority (APDPVP).')]),
    (('Comment les protégeons-nous ?', 'How do we protect it?'),
     [('p', "Le site est entièrement chiffré (HTTPS, le cadenas dans votre navigateur), protégé par des règles de sécurité strictes, et l'accès à vos informations est réservé aux personnes qui en ont besoin pour traiter votre demande.",
       'The whole website is encrypted (HTTPS, the padlock in your browser), and access to your information is limited to the people who need it to handle your request.')]),
    (('Votre compte membre', 'Your member account'),
     [('p', "Notre équipe vérifie chaque nouveau compte avant d'ouvrir l'accès à la plateforme. Vous pouvez demander à tout moment la suppression de votre compte depuis la page <a href=\"suppression-donnees.html\">Supprimer mes données</a>.",
       'Our team checks every new account before opening access to the platform. You can ask for your account to be deleted at any time from the <a href="suppression-donnees.html">Delete my data</a> page.'),
      ('p', "Les justificatifs (pièce d'identité, documents de l'entreprise) seront demandés plus tard dans l'espace membre. Nous mettrons alors cette page à jour.",
       'Supporting documents (ID, company documents) will be requested later in the member area. We will then update this page.')]),
    (('E-mails et cookies', 'Emails and cookies'),
     [('p', "Nous n'envoyons pas d'e-mails publicitaires. Si nous lançons un jour une lettre d'information, elle ne vous sera envoyée qu'avec votre accord, et chaque envoi contiendra un lien de désinscription en un clic. Pour les cookies, voir notre <a href=\"cookies.html\">politique cookies</a>.",
       'We do not send marketing emails. If we ever start a newsletter, you will only receive it with your consent, and every email will include a one-click unsubscribe link. For cookies, see our <a href="cookies.html">cookie policy</a>.')]),
    (('Modifications de cette politique', 'Changes to this policy'),
     [('p', 'Nous pouvons modifier cette politique. La date de la dernière mise à jour figure en haut de cette page.',
       'We may change this policy. The date of the latest update is shown at the top of this page.')]),
]


def build_privacy():
    body = ''
    for (title, blocks) in PRIVACY:
        body += '<h2>%s</h2>' % T(*title)
        for kind, *content in blocks:
            if kind == 'p':
                body += '<p>%s</p>' % T(content[0], content[1])
            else:
                body += '<ul>%s</ul>' % ''.join('<li>%s</li>' % T(fr, en) for fr, en in content[0])
    hero = page_hero(T('Politique de confidentialité', 'Privacy policy'), T('Vos données', 'Your data'),
                     T('Politique de confidentialité', 'Privacy policy'),
                     T('Comment KAME GROUP collecte, utilise et protège les informations que vous lui confiez sur ce site.',
                       'How KAME GROUP collects, uses and protects the information you share on this website.'),
                     '<p class="updated">%s</p>' % T('Dernière mise à jour : %s' % UPDATED_FR, 'Last updated: %s' % UPDATED_EN),
                     profile_visual('garde', 'garde'))
    main = hero + '<section class="section"><div class="container"><article class="legal" data-reveal>%s</article></div></section>' % body
    page('confidentialite.html', 'Politique de confidentialité | KAME GROUP', 'Privacy policy | KAME GROUP',
         'Comment KAME GROUP collecte, utilise et protège vos informations : données collectées, utilisation, durée de conservation et vos droits.', main)


def build_icons_js():
    # Une seule source pour les icônes : build.py les écrit aussi pour investor.js
    with open(os.path.join(DIST, 'assets', 'js', 'kame-icons.js'), 'w', encoding='utf-8') as f:
        f.write('/* Généré par build.py : ne pas modifier à la main */\nwindow.KAME_ICONS = %s;\n' % json.dumps(ICONS, ensure_ascii=False))


def build_seo_files():
    alts = (('fr', 'fr'), ('en', 'en'), ('x-default', 'fr'))

    def entry(fname, lang):
        links = ''.join('    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>\n' % (hl, page_url(fname, l)) for hl, l in alts) \
            if fname in PUBLIC_PAGES else ''
        return '  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n%s  </url>\n' % (page_url(fname, lang), UPDATED, links)
    urls = ''.join(entry(f, 'fr') + (entry(f, 'en') if f in PUBLIC_PAGES else '') for f in SITEMAP_PAGES)
    with open(os.path.join(DIST, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n%s</urlset>\n' % urls)
    with open(os.path.join(DIST, 'robots.txt'), 'w', encoding='utf-8') as f:
        f.write('User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' % SITE_URL)


# ---------------------------------------------------------------- pages légales et pied de page

LEGAL_NAV = [
    ('conditions-utilisation.html', "Conditions d'utilisation", 'Terms of use'),
    ('confidentialite.html', 'Confidentialité', 'Privacy'),
    ('cookies.html', 'Cookies', 'Cookies'),
    ('mentions-legales.html', 'Mentions légales', 'Legal notice'),
    ('tarifs-remboursements.html', 'Tarifs et remboursements', 'Pricing and refunds'),
    ('accessibilite.html', 'Accessibilité', 'Accessibility'),
    ('suppression-donnees.html', 'Supprimer mes données', 'Delete my data'),
    ('plan-du-site.html', 'Plan du site', 'Site map'),
]


def legal_links():
    links = ''.join('<a href="%s">%s</a>' % (u, T(fr, en)) for u, fr, en in LEGAL_NAV)
    links += ('<button type="button" class="link-btn footer-prefs" data-cookie-prefs>%s</button>'
              % T('Gérer mes préférences', 'Manage preferences'))
    return '<nav class="footer-legal" %s>%s</nav>' % (bi_attr('aria-label', 'Informations légales', 'Legal information'), links)


def legal_body(sections):
    body = ''
    for title, blocks in sections:
        body += '<h2>%s</h2>' % T(*title)
        for kind, *content in blocks:
            if kind == 'p':
                body += '<p>%s</p>' % T(content[0], content[1])
            else:
                body += '<ul>%s</ul>' % ''.join('<li>%s</li>' % T(fr, en) for fr, en in content[0])
    return body


def legal_page(fname, crumb, h1, lead, sections, meta_title, meta_desc, extra='', visual='garde'):
    hero = page_hero(T(*crumb), T('Informations légales', 'Legal information'), T(*h1), T(*lead),
                     '<p class="updated">%s</p>' % T('Dernière mise à jour : %s' % UPDATED_FR, 'Last updated: %s' % UPDATED_EN),
                     profile_visual(visual, visual))
    main = hero + ('<section class="section"><div class="container"><article class="legal" data-reveal>%s%s</article></div></section>'
                   % (legal_body(sections), extra))
    page(fname, meta_title[0] + ' | KAME GROUP', meta_title[1] + ' | KAME GROUP', meta_desc, main)


CONTACT_FR = 'notre <a href="index.html#contact">formulaire de contact</a>'
CONTACT_EN = 'our <a href="index.html#contact">contact form</a>'

TERMS = [
    (('Objet', 'Purpose'),
     [('p', "Ces conditions encadrent l'utilisation du site kamegroupe.com et de l'espace membre KAME GROUP. En créant un compte ou en utilisant le site, vous les acceptez.",
       'These terms govern the use of kamegroupe.com and the KAME GROUP member area. By creating an account or using the website, you accept them.')]),
    (('Prototype en cours de développement', 'Prototype under development'),
     [('p', "La plateforme est un prototype fonctionnel. Les outils (KAME Data, KAME Score et les autres) sont ouverts progressivement. Certaines fonctions peuvent changer, être interrompues ou contenir des erreurs.",
       'The platform is a working prototype. Tools (KAME Data, KAME Score and others) are opened step by step. Some features may change, be interrupted or contain errors.')]),
    (('Qui peut créer un compte ?', 'Who can create an account?'),
     [('p', "L'espace membre est réservé aux personnes de 18 ans ou plus, agissant pour elles-mêmes ou pour une organisation qu'elles ont le droit de représenter. Chaque compte est vérifié et validé par KAME GROUP avant d'ouvrir l'accès aux outils. KAME GROUP peut refuser ou suspendre un compte, notamment en cas d'informations fausses.",
       'The member area is for people aged 18 or older, acting for themselves or for an organisation they are entitled to represent. Each account is checked and approved by KAME GROUP before tools are unlocked. KAME GROUP may refuse or suspend an account, in particular if information is false.')]),
    (('Vos engagements', 'Your commitments'),
     [('l', [("Donner des informations exactes et les tenir à jour.", 'Provide accurate information and keep it up to date.'),
             ("Garder votre mot de passe secret. Vous êtes responsable de ce qui est fait avec votre compte.", 'Keep your password secret. You are responsible for what is done with your account.'),
             ("Ne pas tenter d'accéder aux données d'autres membres, de contourner la sécurité ou de perturber le service.", "Do not try to access other members' data, bypass security or disrupt the service."),
             ("Ne publier que des données que vous avez le droit de partager.", 'Only upload data you are entitled to share.')])]),
    (('Pas de conseil en investissement', 'No investment advice'),
     [('p', "Les informations, analyses et indicateurs affichés (dont KAME Score) sont fournis à titre d'information. Ils ne constituent ni un conseil en investissement, ni une offre, ni une garantie de résultat. Chaque investisseur reste seul responsable de ses décisions. KAME GROUP ne détient pas et ne fait pas transiter de fonds d'investisseurs à ce stade.",
       'Information, analyses and indicators shown (including KAME Score) are for information only. They are not investment advice, an offer or a guarantee of results. Each investor alone is responsible for their decisions. At this stage KAME GROUP does not hold or transfer investor funds.')]),
    (('Propriété intellectuelle', 'Intellectual property'),
     [('p', "Les textes, illustrations, logos et le code du site appartiennent à KAME GROUP, sauf mention contraire. Les polices Cinzel et Lato sont utilisées sous licence SIL Open Font License. Vous gardez la propriété des données que vous déposez.",
       'Texts, illustrations, logos and the website code belong to KAME GROUP unless stated otherwise. The Cinzel and Lato fonts are used under the SIL Open Font License. You keep ownership of the data you upload.')]),
    (('Responsabilité', 'Liability'),
     [('p', "KAME GROUP met tout en œuvre pour assurer la sécurité et la disponibilité du service, sans pouvoir garantir une absence totale d'interruption ou d'erreur.",
       'KAME GROUP does its best to keep the service secure and available, but cannot guarantee it will be free of interruptions or errors.')]),
    (('Fermeture du compte', 'Closing your account'),
     [('p', 'Vous pouvez fermer votre compte et demander la suppression de vos données à tout moment, depuis la page <a href="suppression-donnees.html">Supprimer mes données</a>.',
       'You can close your account and ask for your data to be deleted at any time, from the <a href="suppression-donnees.html">Delete my data</a> page.')]),
    (('Droit applicable et modifications', 'Governing law and changes'),
     [('p', "Ces conditions sont régies par le droit gabonais. Nous pouvons les modifier : la date de mise à jour figure en haut de la page, et les membres seront prévenus de tout changement important.",
       'These terms are governed by Gabonese law. We may update them: the date of the last update is shown at the top, and members will be told about any important change.'),
      ('p', 'Une question ? Écrivez-nous via %s.' % CONTACT_FR, 'Any question? Write to us via %s.' % CONTACT_EN)]),
]

COOKIES = [
    (('En bref', 'In short'),
     [('p', "Le site n'utilise aucun cookie de publicité, de pistage ou de mesure d'audience. Il n'enregistre dans votre navigateur que ce qui est strictement nécessaire à son fonctionnement. C'est pourquoi aucun consentement n'est exigé, et nous ne vous imposons pas de bannière à cliquer.",
       'The website uses no advertising, tracking or analytics cookies. It only stores in your browser what is strictly needed for it to work. That is why no consent is required, and we do not force you to click through a banner.')]),
    (('Ce qui est enregistré', 'What is stored'),
     [('l', [("<strong>kame-lang</strong> : la langue choisie (FR ou EN). Conservée jusqu'à ce que vous la changiez.", '<strong>kame-lang</strong>: your chosen language (FR or EN). Kept until you change it.'),
             ("<strong>kame-auth</strong> : votre session de connexion à l'espace membre. Effacée à la déconnexion.", '<strong>kame-auth</strong>: your member-area login session. Cleared when you log out.'),
             ("<strong>kame-notice</strong> : retient que vous avez lu le bandeau d'information. Conservé 12 mois.", '<strong>kame-notice</strong>: remembers that you read the information banner. Kept 12 months.')])]),
    (('Services tiers', 'Third-party services'),
     [('p', "Les polices de caractères sont hébergées sur nos propres serveurs : aucune requête n'est envoyée à Google ou à un autre service externe en visitant le site. La connexion avec Google n'a lieu que si vous cliquez vous-même sur ce bouton.",
       'Fonts are hosted on our own servers: visiting the site sends no request to Google or any other external service. Google sign-in only happens if you click that button yourself.')]),
    (('Gérer vos préférences', 'Manage your preferences'),
     [('p', "Vous pouvez effacer à tout moment ce que le site a enregistré dans votre navigateur avec le bouton ci-dessous, ou depuis les réglages de votre navigateur. Si nous ajoutons un jour un outil non essentiel (par exemple de mesure d'audience), il restera désactivé tant que vous ne l'aurez pas accepté.",
       'You can erase what the website has stored in your browser at any time with the button below, or from your browser settings. If we ever add a non-essential tool (such as analytics), it will stay off until you accept it.')]),
]

NOTICE = [
    (('Éditeur du site', 'Website publisher'),
     [('p', 'KAME GROUP — groupe technologique et financier, Libreville, Gabon.', 'KAME GROUP — technology and financial group, Libreville, Gabon.')]),
    (('Hébergement', 'Hosting'),
     [('p', 'Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, États-Unis — netlify.com.',
       'Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, United States — netlify.com.')]),
    (('Contact', 'Contact'),
     [('p', 'Écrivez-nous via %s.' % CONTACT_FR, 'Write to us via %s.' % CONTACT_EN)]),
    (('Crédits', 'Credits'),
     [('p', "Illustrations et logo : KAME GROUP. Polices : Cinzel (Natanael Gama) et Lato (Łukasz Dziedzic), licence SIL Open Font License 1.1.",
       'Illustrations and logo: KAME GROUP. Fonts: Cinzel (Natanael Gama) and Lato (Łukasz Dziedzic), SIL Open Font License 1.1.')]),
]

PRICING = [
    (('Aujourd\'hui : gratuit', 'Today: free'),
     [('p', "La création d'un compte et l'accès au prototype sont gratuits. Aucun moyen de paiement ne vous est demandé et aucun frais n'est prélevé.",
       'Creating an account and using the prototype are free. No payment method is requested and no fee is charged.')]),
    (('Nos engagements pour les futurs services payants', 'Our commitments for future paid services'),
     [('l', [("Le prix total, taxes comprises, sera affiché avant tout paiement. Aucun frais caché.", 'The full price, taxes included, will be shown before any payment. No hidden fees.'),
             ("Aucun abonnement ne sera activé sans votre accord explicite, et il pourra être résilié aussi simplement qu'il a été souscrit.", 'No subscription will start without your explicit consent, and it can be cancelled as easily as it was started.'),
             ("Les conditions de remboursement seront publiées sur cette page avant le lancement de toute offre payante.", 'Refund terms will be published on this page before any paid offer is launched.')])]),
]

ACCESS = [
    (('Notre engagement', 'Our commitment'),
     [('p', "Nous voulons que le site soit utilisable par tous, y compris avec un lecteur d'écran, au clavier seul ou avec un zoom important. Nous suivons les règles internationales WCAG 2.1 (niveau AA).",
       'We want the website to work for everyone, including with a screen reader, a keyboard only or high zoom. We follow the international WCAG 2.1 guidelines (level AA).')]),
    (('Ce qui est en place', 'What is in place'),
     [('l', [("Navigation complète au clavier, avec un lien « Aller au contenu » et un contour visible sur l'élément actif.", 'Full keyboard navigation, with a "Skip to content" link and a visible outline on the focused element.'),
             ('Textes alternatifs sur les images utiles ; les décorations sont ignorées par les lecteurs d\'écran.', 'Alternative text on meaningful images; decorations are hidden from screen readers.'),
             ('Contrastes de couleurs vérifiés, textes agrandissables et animations réduites si votre appareil le demande.', 'Checked colour contrast, resizable text and reduced motion when your device asks for it.'),
             ('Formulaires avec étiquettes, champs obligatoires signalés et messages lus par les lecteurs d\'écran.', 'Forms with labels, marked required fields and messages announced to screen readers.')])]),
    (('Un problème ?', 'A problem?'),
     [('p', "Si une page vous pose problème, dites-le-nous via %s : nous vous répondrons et corrigerons dès que possible." % CONTACT_FR,
       'If a page is hard to use, tell us via %s: we will reply and fix it as soon as possible.' % CONTACT_EN)]),
]

DELETION = [
    (('Vos droits', 'Your rights'),
     [('p', "Vous pouvez à tout moment demander l'accès à vos données, leur correction ou leur suppression, ainsi que la fermeture de votre compte. Nous répondons dans un délai maximum de 30 jours.",
       'You can ask at any time to access, correct or delete your data, and to close your account. We reply within 30 days at most.'),
      ('p', "Pour protéger votre compte, nous vérifions que la demande vient bien de vous, en vous écrivant à l'adresse e-mail de votre compte. Certaines informations peuvent être conservées si la loi l'exige.",
       'To protect your account, we check that the request really comes from you by writing to your account email. Some information may be kept where the law requires it.')]),
]


def deletion_form():
    reasons = [('suppression', 'Supprimer mes données et fermer mon compte', 'Delete my data and close my account'),
               ('acces', 'Recevoir une copie de mes données', 'Receive a copy of my data'),
               ('correction', 'Corriger mes données', 'Correct my data')]
    opts = ''.join('<label class="check"><input type="radio" name="demande" value="%s" required%s> <span>%s</span></label>'
                   % (v, ' checked' if i == 0 else '', T(fr, en)) for i, (v, fr, en) in enumerate(reasons))
    return ('<h2>%s</h2><form class="form" name="donnees-personnelles" method="POST" action="merci.html" data-netlify="true" '
            'netlify-honeypot="bot-field" data-form><input type="hidden" name="form-name" value="donnees-personnelles">'
            '<p class="hp" aria-hidden="true"><label>Ne pas remplir <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>'
            '<div class="form-row">%s%s</div><fieldset class="field"><legend>%s</legend>%s</fieldset>'
            '<div class="field"><label for="dd-precisions">%s</label><textarea id="dd-precisions" name="precisions" rows="3" maxlength="1000"></textarea></div>'
            '<label class="check"><input type="checkbox" name="confirmation" value="oui" required> <span>%s</span></label>'
            '<div><button class="btn btn-primary" type="submit">%s</button></div><p class="form-status" role="status" tabindex="-1"></p></form>'
            % (T('Faire une demande', 'Make a request'),
               afield('dd', 'nom', 'Nom et prénom', 'Full name', req=True, ac='name', extra=' maxlength="120"'),
               afield('dd', 'email', "E-mail de votre compte", 'Your account email', typ='email', req=True, ac='email', extra=' maxlength="200"'),
               T('Votre demande', 'Your request') + REQ, opts,
               T('Précisions (facultatif)', 'Details (optional)'),
               T("Je confirme être la personne concernée par ces données.", 'I confirm I am the person these data relate to.'),
               T('Envoyer ma demande', 'Send my request')))


def build_legal_pages():
    legal_page('conditions-utilisation.html', ("Conditions d'utilisation", 'Terms of use'), ("Conditions d'utilisation", 'Terms of use'),
               ("Les règles d'utilisation du site et de l'espace membre KAME GROUP.", 'The rules for using the KAME GROUP website and member area.'),
               TERMS, ("Conditions d'utilisation", 'Terms of use'),
               "Conditions d'utilisation du site et de l'espace membre KAME GROUP : accès, engagements, absence de conseil en investissement, données et droit applicable.")
    legal_page('cookies.html', ('Cookies', 'Cookies'), ('Politique cookies', 'Cookie policy'),
               ('Ce que le site enregistre dans votre navigateur, et comment le gérer.', 'What the website stores in your browser, and how to manage it.'),
               COOKIES, ('Politique cookies', 'Cookie policy'),
               "Politique cookies de KAME GROUP : aucun cookie publicitaire ni de pistage, seulement le strict nécessaire. Gérez vos préférences.",
               extra='<p><button type="button" class="btn btn-outline" data-cookie-clear>%s</button></p><p class="form-status" role="status" data-cookie-status></p>'
                     % T('Effacer les données enregistrées', 'Erase stored data'))
    rows = [(T('Responsable de la publication', 'Publication director'), PUBLISHER)]
    for label, val in [(T('Forme juridique', 'Legal form'), LEGAL_ENTITY), ('RCCM', LEGAL_RCCM), ('NIF', LEGAL_NIF),
                       (T('Adresse', 'Address'), LEGAL_ADDRESS)]:
        if val:
            rows.append((label, val))
    sep = ': ' if MODE == 'en' else '&#8239;: '
    ident = '<ul>%s</ul>' % ''.join('<li><strong>%s</strong>%s%s</li>' % (r[0], sep, r[1]) for r in rows)
    legal_page('mentions-legales.html', ('Mentions légales', 'Legal notice'), ('Mentions légales', 'Legal notice'),
               ('Qui édite et héberge ce site.', 'Who publishes and hosts this website.'),
               NOTICE, ('Mentions légales', 'Legal notice'), 'Mentions légales de KAME GROUP : éditeur, responsable de la publication, hébergeur et crédits.',
               extra=ident)
    legal_page('tarifs-remboursements.html', ('Tarifs et remboursements', 'Pricing and refunds'), ('Tarifs et remboursements', 'Pricing and refunds'),
               ('Ce que coûte KAME GROUP aujourd\'hui, et nos règles pour la suite.', 'What KAME GROUP costs today, and our rules for later.'),
               PRICING, ('Tarifs et remboursements', 'Pricing and refunds'),
               'Tarifs et remboursements KAME GROUP : accès gratuit au prototype, aucun frais caché, conditions publiées avant toute offre payante.',
               visual='pay')
    legal_page('accessibilite.html', ('Accessibilité', 'Accessibility'), ('Accessibilité', 'Accessibility'),
               ('Un site utilisable par tous.', 'A website for everyone.'), ACCESS, ('Accessibilité', 'Accessibility'),
               "Déclaration d'accessibilité de KAME GROUP : navigation au clavier, textes alternatifs, contrastes et formulaires accessibles.")
    legal_page('suppression-donnees.html', ('Supprimer mes données', 'Delete my data'), ('Vos données, vos droits', 'Your data, your rights'),
               ('Accéder à vos données, les corriger, les supprimer ou fermer votre compte.', 'Access, correct or delete your data, or close your account.'),
               DELETION, ('Supprimer mes données', 'Delete my data'),
               'Demandez l\'accès, la correction ou la suppression de vos données personnelles chez KAME GROUP, et la fermeture de votre compte.',
               extra=deletion_form())
    groups = [(('Découvrir', 'Discover'), [('index.html', 'Accueil', 'Home'), ('formations.html', 'Formations', 'Training')]),
              (('Espace membre', 'Member area'), [(p['page'], p['name'][0], p['name'][1]) for p in PROFILES] + [('connexion.html', 'Se connecter', 'Log in')]),
              (('Informations légales', 'Legal information'), [(u, fr, en) for u, fr, en in LEGAL_NAV if u != 'plan-du-site.html'])]
    body = ''.join('<h2>%s</h2><ul>%s</ul>' % (T(*g), ''.join('<li><a href="%s">%s</a></li>' % (u, T(fr, en)) for u, fr, en in items))
                   for g, items in groups)
    hero = page_hero(T('Plan du site', 'Site map'), T('Navigation', 'Navigation'), T('Plan du site', 'Site map'),
                     T('Toutes les pages du site KAME GROUP.', 'All pages of the KAME GROUP website.'), '', profile_visual('garde', 'garde'))
    page('plan-du-site.html', 'Plan du site | KAME GROUP', 'Site map | KAME GROUP', 'Plan du site KAME GROUP : toutes les pages.',
         hero + '<section class="section"><div class="container"><article class="legal" data-reveal>%s</article></div></section>' % body)


def build_public_pages():
    index_page()
    build_profiles()
    build_other_pages()
    build_privacy()
    build_legal_pages()


if __name__ == '__main__':
    os.makedirs(DIST, exist_ok=True)
    for MODE in ('fr', 'en'):
        build_public_pages()
    MODE = 'bi'
    build_app_pages()
    build_auth_pages()
    build_seo_files()
    build_icons_js()
    print('OK', sorted(f for f in os.listdir(DIST) if f.endswith(('.html', '.xml', '.txt'))))
