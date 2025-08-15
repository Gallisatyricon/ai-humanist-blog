# Blog IA Humaniste - Navigation Graphique

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb.svg)](https://reactjs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.0+-ff6b35.svg)](https://d3js.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2+-646cff.svg)](https://vitejs.dev/)

> Interface graphique interactive révélant les interconnexions entre technique et éthique en IA

## 🎯 Objectif

Créer un blog de veille IA avec navigation exploratoire révélant les ponts interdisciplinaires entre dimension technique et réflexion humaniste.
exemple : https://blog-ia.lecaveaudelopus.com/

## ✨ Fonctionnalités

- 🏷️ **Navigation par tags** avec filtrage intelligent
- 🕸️ **Visualisation graphique D3.js** des connexions entre articles  
- 🔍 **Recherche multi-critères** temps réel
- 📄 **Pagination dynamique** optimisée pour grandes collections
- 🎨 **Interface responsive** avec animations fluides
- 🤖 **Détection automatique** des connexions sémantiques
- 📊 **Légende interactive** des types de relations
- ⚡ **Performance optimisée** avec virtualisation automatique
- 🧠 **Smart ID Mapping** - Résolution automatique des IDs invalides
- 🔄 **Smart Deduplication** - Gestion intelligente des doublons
- 📊 **450+ connexions intelligentes** avec 5 types de relations diversifiés
- ↔️ **Filtrage bi-directionnel** - Synchronisation parfaite filtres ↔ graphique
- 🎯 **Anti-flicker tooltips** - Interactions fluides avec debouncing optimisé
- 📐 **Espacement adaptatif** - Lisibilité automatique selon nombre d'articles (5-40)

## 🚀 Démarrage Rapide

```bash
# Installation
npm install

# Développement
npm run dev
# ➜ http://localhost:5173

# Build production
npm run build

# Preview production
npm run preview
```

## 📁 Structure du Projet

```
ai-humanist-blog/
├── 📄 README.md                    # Documentation principale
├── 📁 src/                         # Code source
│   ├── 📁 components/              # Composants React
│   │   ├── 📁 articles/           # Composants articles
│   │   ├── 📁 layout/             # Layouts principaux
│   │   └── 📁 navigation/         # Navigation et graphique
│   ├── 📁 hooks/                  # Hooks React personnalisés
│   ├── 📁 utils/                  # Utilitaires et algorithmes
│   ├── 📁 types/                  # Types TypeScript
│   ├── 📁 styles/                 # Styles globaux et animations
│   └── 📁 config/                 # Configuration
├── 📁 scripts/                    # Scripts Smart Processing + maintenance
│   ├── 📄 addArticleComplete.ts       # Ajout intelligent avec Smart Processing
│   ├── 📄 smartIdMapper.ts            # Résolution IDs invalides  
│   ├── 📄 smartDeduplication.ts       # Gestion doublons
│   └── 📄 batchImportArticles.ts      # Import batch production
├── 📁 public/                     # Assets statiques
├── 📁 docs/                       # Documentation projet
└── 📁 tests/                      # Tests (à implémenter)
```

## 🎨 Technologies

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Visualisation**: D3.js force simulation
- **Build**: Vite + PostCSS  
- **Données**: JSON statique avec Smart Processing (ID Mapping + Deduplication)
- **Import**: Scripts intelligents pour intégration n8n et ajout batch

## 📊 Types de Connexions

- 🟢 **S'appuie sur** - Construction/amélioration
- 🔴 **Contredit** - Opposition/controverse  
- 🔵 **Implémente** - Implémentation technique
- 🟠 **Questionne** - Questionnement/critique
- ⚫ **Similaire** - Concepts/outils partagés

## 🔧 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur développement |
| `npm run build` | Build production |
| `npm run preview` | Aperçu build |
| `npm run lint` | Vérification code |
| `npm run add-complete -- --input article.json` | Ajout intelligent avec Smart Processing |
| `npm run batch-import -- --input articles.md` | Import batch depuis fichier n8n |
| `npx tsx scripts/testSmartMapper.ts` | Test Smart ID Mapping |
| `npx tsx scripts/testDeduplication.ts` | Test Smart Deduplication |

## 📖 Documentation

- [📋 Vue d'Ensemble](./docs/README.md) - Documentation développeur complète
- [🔧 Spécifications Techniques](./docs/TECHNICAL.md) - Architecture système détaillée
- [🚀 Guide de Déploiement](./docs/DEPLOYMENT.md) - Configuration production  
- [🎨 Templates JSON](./docs/TEMPLATES.md) - Formats pour intégration n8n
- [📈 Historique Évolutions](./docs/PROGRESS.md) - Journal complet des phases

## 🚀 Status Projet

✅ **PRODUCTION-READY** avec **Phase 10 - Filtrage Bi-directionnel Optimisé**

- **40 articles** avec données validées
- **450+ connexions intelligentes** générées automatiquement
- **Smart ID Mapping** - Résolution automatique des IDs invalides (100% réussite)
- **Smart Deduplication** - Gestion des doublons avec fusion de métadonnées
- **Interface graphique optimisée** - Navigation progressive D3.js
- **Intégration n8n ready** - Workflow automatisé opérationnel
- **Filtrage bi-directionnel parfait** - Synchronisation filtres ↔ graphique jusqu'à 40 articles
- **Expérience utilisateur professionnelle** - Anti-flicker tooltips, espacement adaptatif

---

*Développé avec ❤️ pour révéler les interconnexions en IA*
