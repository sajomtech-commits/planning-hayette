# Planning Hayette

Application web de gestion de planning pour **Hayette**, aide-soignante.

Simple, rapide, consultable sur téléphone et ordinateur.  
Les données sont partagées entre plusieurs appareils via **Supabase**.

## Objectif

Visualiser et gérer le planning de travail au quotidien :
- consulter rapidement les horaires du jour
- voir la semaine, le mois ou l'année en un coup d'œil
- modifier une journée si nécessaire
- code couleur par type de journée (travail, repos, congé, formation, autre)
- modifications visibles sur tous les appareils connectés

## Fonctionnalités

| Vue        | Description |
|------------|-------------|
| **Aujourd'hui** | Carte récapitulative du jour actuel, prochain jour travaillé, aperçu des prochains jours |
| **Semaine** | Vue semaine avec les horaires, navigation entre les semaines |
| **Mois** | Calendrier mensuel avec code couleur, récapitulatif et liste détaillée |
| **Année** | Vue annuelle avec statistiques par mois, barres de répartition |
| **Modifier** | Interface d'édition (protégée par mot de passe), raccourcis rapides, import/export JSON |

### Code couleur

| Statut     | Couleur |
|------------|---------|
| Travaillé  | 🟢 Vert |
| Repos      | ⚪ Gris |
| Congé      | 🟣 Violet |
| Formation  | 🟠 Orange |
| Autre      | 🩷 Rose |

## Configuration Supabase

### 1. Créer un compte Supabase

Aller sur [supabase.com](https://supabase.com) et créer un compte (gratuit).

### 2. Créer un projet

Cliquer sur **New project**, choisir un nom (ex: `planning-hayette`), choisir une région proche, noter le **Database Password** (optionnel pour ce projet).

### 3. Créer la table

Dans le **SQL Editor** de Supabase, exécuter le contenu de `sql/supabase_schema.sql`.

Ce script crée :
- la table `planning_hayette` avec les colonnes `id`, `date`, `status`, `start_time`, `end_time`, `note`, `created_at`, `updated_at`
- une contrainte pour limiter les statuts aux valeurs autorisées
- un index sur la colonne `date`
- un trigger pour mettre à jour `updated_at` automatiquement

### 4. Récupérer les clés

Dans les paramètres du projet Supabase :
- **Project Settings > API**
- Copier l'**URL** (Project URL)
- Copier la **anon public key** (Anon / Public Key)

### 5. Créer config.js

Dans le dossier du projet, créer un fichier `config.js` (ne pas le committer) :

```js
window.APP_CONFIG = {
  supabaseUrl: "https://votre-projet.supabase.co",
  supabaseAnonKey: "votre-cle-anon-publique",
  editPassword: "votre-mot-de-passe"
};
```

Un modèle est disponible dans `config.example.js`.

> **Important :** `config.js` est ignoré par Git (via `.gitignore`).  
> Utiliser uniquement la **clé anon (publique)** de Supabase, jamais la `service_role_key`.

## Mot de passe de l'onglet Modifier

La consultation du planning est publique (aucun mot de passe nécessaire).

L'onglet **Modifier** est protégé par un mot de passe défini dans `config.js` :
- Si le mot de passe est correct → le formulaire d'édition s'affiche
- Sinon → accès bloqué

> ⚠️ Ce mot de passe est côté navigateur (vérification en JavaScript).  
> Ce n'est pas une sécurité forte. Il empêche juste une modification accidentelle.  
> Une V3 pourra utiliser **Supabase Auth** (email/mot de passe) pour une vraie sécurisation.

## Comment modifier le planning

### Méthode 1 — Interface dans le navigateur (recommandée)

1. Cliquer sur **Modifier** dans la barre de navigation
2. Saisir le mot de passe si demandé
3. Choisir une date
4. Sélectionner le statut, renseigner les horaires et une note
5. Cliquer sur **Enregistrer**

Les **raccourcis rapides** permettent de changer le statut en un clic.

### Méthode 2 — Fichier JSON

Éditer le fichier `data/planning.json` avec la structure suivante :

```json
[
  {
    "date": "2026-06-01",
    "status": "travaille",
    "start_time": "07:20",
    "end_time": "20:00",
    "note": "Journée longue"
  },
  {
    "date": "2026-06-02",
    "status": "repos",
    "start_time": null,
    "end_time": null,
    "note": null
  }
]
```

Les statuts possibles : `travaille`, `repos`, `conge`, `formation`, `autre`.
Statuts en anglais pour la base : `conge` (sans accent).

Puis utiliser l'import dans l'onglet **Modifier** pour synchroniser avec Supabase.

## Synchronisation multi-appareils

Les modifications faites sur un téléphone sont visibles sur les autres appareils :

1. Ouvrir l'application sur le premier téléphone
2. Modifier un jour dans l'onglet **Modifier**
3. Ouvrir l'application sur le deuxième téléphone
4. Rafraîchir la page (F5 ou pull-to-refresh)
5. Les modifications apparaissent

> La page charge les données depuis Supabase à chaque ouverture.  
> Pas de synchronisation en temps réel pour la V2 (possible en V3).

## Comment consulter la page

### En local

Ouvrir simplement `index.html` dans un navigateur.

### En ligne (GitHub Pages)

Le site est publié automatiquement à l'adresse :
`https://sajomtech-commits.github.io/planning-hayette/`

## Importer / Exporter les données

Depuis l'onglet **Modifier** :
- **Exporter** → télécharge un fichier JSON contenant toutes les données
- **Importer** → charge un fichier JSON dans le navigateur et synchronise avec Supabase
- **Réinitialiser** → vide la base Supabase et recharge depuis le cache

Les données sont également sauvegardées dans le **localStorage** du navigateur (cache local).
En mode déconnecté (Supabase inaccessible), le cache local est utilisé.

## Structure des fichiers

```
planning-hayette/
├── index.html              # Page principale
├── styles.css              # Styles de l'application
├── app.js                  # Logique complète (vues, Supabase, édition)
├── config.example.js       # Modèle de configuration (à copier)
├── config.js               # Configuration locale (ignoré par Git)
├── README.md               # Ce fichier
├── .gitignore
├── data/
│   └── planning.json       # Données d'exemple du planning
├── sql/
│   └── supabase_schema.sql # Script SQL pour créer la table Supabase
└── assets/
    └── (fichiers additionnels si besoin)
```

## Technologies

- HTML5
- CSS3 (vanilla, pas de framework)
- JavaScript (vanilla, pas de dépendance)
- Supabase (PostgreSQL + API REST)
- localStorage (cache local de secours)

## Compatibilité

- iPhone / Android (interface tactile)
- Tablette
- Ordinateur (Windows, Mac, Linux)

## Améliorations futures (V3)

- Synchronisation en temps réel (Supabase Realtime)
- Authentification via Supabase Auth (email/mot de passe)
- Mode hors-ligne complet avec synchronisation différée

## Auteur

Projet créé pour Hayette.
