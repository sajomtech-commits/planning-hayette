# Planning Hayette

Application web de gestion de planning pour **Hayette**, aide-soignante.

Simple, rapide, consultable sur téléphone et ordinateur.

## Objectif

Visualiser et gérer le planning de travail au quotidien :
- consulter rapidement les horaires du jour
- voir la semaine, le mois ou l'année en un coup d'œil
- modifier une journée si nécessaire
- code couleur par type de journée (travail, repos, congé, formation, autre)

## Fonctionnalités

| Vue        | Description |
|------------|-------------|
| **Aujourd'hui** | Carte récapitulative du jour actuel, prochain jour travaillé, aperçu des prochains jours |
| **Semaine** | Vue semaine avec les horaires, navigation entre les semaines |
| **Mois** | Calendrier mensuel avec code couleur, récapitulatif et liste détaillée |
| **Année** | Vue annuelle avec statistiques par mois, barres de répartition |
| **Modifier** | Interface d'édition d'une journée, raccourcis rapides, import/export JSON |

### Code couleur

| Statut     | Couleur |
|------------|---------|
| Travaillé  | 🟢 Vert |
| Repos      | ⚪ Gris |
| Congé      | 🟣 Violet |
| Formation  | 🟠 Orange |
| Autre      | 🩷 Rose |

## Comment modifier le planning

### Méthode 1 — Interface dans le navigateur

1. Cliquer sur **Modifier** dans la barre de navigation
2. Choisir une date
3. Sélectionner le statut, renseigner les horaires et une note
4. Cliquer sur **Enregistrer**

Les **raccourcis rapides** permettent de changer le statut en un clic.

### Méthode 2 — Fichier JSON

Éditer le fichier `data/planning.json` avec la structure suivante :

```json
[
  {
    "date": "2026-06-01",
    "status": "travaille",
    "start": "07:20",
    "end": "20:00",
    "note": "Journée longue"
  },
  {
    "date": "2026-06-02",
    "status": "repos",
    "start": "",
    "end": "",
    "note": ""
  }
]
```

Les statuts possibles : `travaille`, `repos`, `congé`, `formation`, `autre`.

## Comment consulter la page

### En local

Ouvrir simplement `index.html` dans un navigateur.

### En ligne (GitHub Pages)

1. Aller dans **Settings > Pages** du repository GitHub
2. Sous **Branch**, sélectionner `main` et `/` (dossier racine)
3. Cliquer sur **Save**
4. Le site est publié en quelques minutes à l'adresse :
   `https://<votre-compte>.github.io/planning-hayette/`

## Importer / Exporter les données

Depuis l'onglet **Modifier** :
- **Exporter** → télécharge un fichier JSON contenant toutes les données
- **Importer** → charge un fichier JSON dans le navigateur
- **Réinitialiser** → recharge les données depuis le fichier `data/planning.json`

Les données sont sauvegardées automatiquement dans le **localStorage** du navigateur.
Elles persistent même après la fermeture de la page.
L'export permet de les sauvegarder sur l'ordinateur ou de les transférer sur un autre appareil.

## Structure des fichiers

```
planning-hayette/
├── index.html          # Page principale
├── styles.css          # Styles de l'application
├── app.js              # Logique complète (vues, données, édition)
├── README.md           # Ce fichier
├── data/
│   └── planning.json   # Données d'exemple du planning
└── assets/
    └── (fichiers additionnels si besoin)
```

## Technologies

- HTML5
- CSS3 (vanilla, pas de framework)
- JavaScript (vanilla, pas de dépendance)
- localStorage pour la persistance côté navigateur

## Compatibilité

- iPhone / Android (interface tactile)
- Tablette
- Ordinateur (Windows, Mac, Linux)

## Auteur

Projet créé pour Hayette.
