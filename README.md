# Blog IA Humaniste - Navigation Graphique Interactive

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb.svg)](https://reactjs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.0+-ff6b35.svg)](https://d3js.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2+-646cff.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Interface graphique interactive révélant les interconnexions entre technique et éthique en IA

## 🎯 Objectif

Créer un blog de veille IA avec navigation exploratoire révélant les ponts interdisciplinaires entre dimension technique et réflexion humaniste.

**Demo :** [blog-ia.lecaveaudelopus.com](https://blog-ia.lecaveaudelopus.com/)

## ✨ Fonctionnalités

- 🏷️ **Navigation par tags** avec filtrage intelligent
- 🕸️ **Visualisation graphique D3.js** des connexions entre articles  
- 🔍 **Recherche multi-critères** temps réel
- 📄 **Pagination dynamique** optimisée pour grandes collections
- 🎨 **Interface responsive** avec animations fluides
- 🤖 **Connexions intelligentes** détection automatique des relations sémantiques
- 📊 **Légende interactive** des types de relations
- ⚡ **Performance optimisée** avec virtualisation automatique
- 🧠 **Architecture triple** - Exploitation maximale des validations humaines
- 🔄 **Filtrage bi-directionnel** - Synchronisation parfaite filtres ↔ graphique
- 🎯 **Anti-flicker tooltips** - Interactions fluides avec debouncing optimisé
- 📐 **Espacement adaptatif** - Lisibilité automatique selon nombre d'articles

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
├── 📁 scripts/                    # Scripts intelligents connexions + maintenance (voir scripts/README.md)
│   ├── 📄 analyzeGroundTruth.ts        # Analyse patterns validations manuelles
│   ├── 📄 calibrateSemanticThresholds.ts # Calibrage seuils adaptatifs par domaine
│   ├── 📄 enhanceGroundTruth.ts        # Architecture triple connexions (Principal)
│   ├── 📄 validateTripleArchitecture.ts # Validation empirique qualité
│   ├── 📄 generateEmbeddings.ts        # Embeddings Transformers.js (384-D)
│   ├── 📄 batchImportArticles.ts       # Import batch + workflow automatique
│   ├── 📄 addArticleComplete.ts        # Import article individuel enrichi
│   ├── 📄 formatInputFile.ts           # Utilitaire formatage input batch
│   ├── 📄 writeFileAtomic.ts           # Infrastructure écriture atomique
│   ├── 📄 zodSchemas.ts                # Validation runtime stricte avec Zod
│   └── 📄 config/paths.ts              # Configuration centralisée chemins
├── 📁 public/                     # Assets statiques
├── 📁 docs/                       # Documentation projet
└── 📁 input_data/                 # Données validation manuelle
```

## 🎨 Technologies

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Visualisation**: D3.js force simulation
- **Build**: Vite + PostCSS  
- **Données**: JSON statique avec validation Zod + écriture atomique
- **IA**: Embeddings Transformers.js (all-MiniLM-L6-v2) + connexions sémantiques
- **Import**: Scripts intelligents pour intégration n8n et ajout batch

## 📊 Types de Connexions

- 🟢 **S'appuie sur** - Construction/amélioration
- 🔴 **Contredit** - Opposition/controverse  
- 🔵 **Implémente** - Implémentation technique
- 🟠 **Questionne** - Questionnement/critique
- ⚫ **Similaire** - Concepts/outils partagés

## 🔧 Scripts Disponibles

### 🚀 Développement
| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur développement Vite |
| `npm run build` | Build production optimisé |
| `npm run preview` | Aperçu build production |
| `npm run lint` | Vérification qualité code |

### 🧠 Pipeline Architecture Triple
| Script | Description |
|--------|-------------|
| `npm run generate-embeddings` | Génération embeddings Transformers.js (384-D) |
| `npm run analyze-ground-truth` | Analyse patterns validations manuelles |
| `npm run calibrate-thresholds` | Calibrage seuils adaptatifs par domaine |
| `npm run enhance-ground-truth` | 🎯 **Architecture triple principale** |
| `npm run enrich-connections` | Alias vers enhance-ground-truth |
| `npm run validate-triple` | Validation empirique qualité |

### 📥 Gestion Articles
| Script | Description |
|--------|-------------|
| `npm run batch-import` | Import batch avec workflow automatique |
| `npm run add-complete` | Import article individuel enrichi |

### 🧪 Tests Sécurisés
| Script | Description |
|--------|-------------|
| `npm run test:safe` | **Test pipeline complet dans environnement isolé** |
| `npm run test:regression` | Tests non-régression vs baseline |
| `npm run test:setup` | Préparer environnement test (debug) |
| `npm run test:cleanup` | Nettoyer environnement test |

## 📖 Documentation

- [📋 Vue d'Ensemble](./docs/README.md) - Documentation développeur complète
- [🔧 Scripts Architecture Triple](./scripts/README.md) - **Documentation complète pipeline**
- [🛡️ Contrôle Qualité (CQ)](./docs/CONTROLE_QUALITE.md) - **Guide workflow sécurisé pour modifications**
- [🚀 Spécifications Techniques](./docs/technical.md) - Architecture système détaillée
- [📊 Guide de Déploiement](./docs/DEPLOYMENT.md) - Configuration production  
- [🎨 Templates JSON](./docs/TEMPLATES.md) - Formats pour intégration n8n
- [📈 Historique Évolutions](./docs/progress.md) - Journal complet des phases

## 🚀 Status Projet

✅ **PRODUCTION-READY** avec **Phase 1 - Architecture Triple Ground Truth**

### 📊 Accomplissements Phase 1
- **65 articles** avec données fiabilisées et validées (art_001 → art_112)
- **244 connexions intelligentes** générées via architecture triple (Hard + Manual + Semantic)
- **Score qualité 83/100** - Production Ready validé empiriquement
- **100% exploitation** des 99 validations manuelles disponibles
- **Validation runtime stricte** - Schémas Zod pour toutes les données
- **Écriture atomique sécurisée** - Protection contre corruption avec locks
- **Embeddings locaux** - Similarité sémantique 384-D (all-MiniLM-L6-v2)
- **Interface graphique optimisée** - Navigation progressive D3.js préservée
- **Scripts consolidés** - 11 scripts fonctionnels + documentation complète
- **Calibrage adaptatif** - Seuils par paires de domaines (technique↔éthique: 0.32)

### 🎯 Prochaine étape : Phase 2
Interface utilisateur recherche vectorielle exploitant les 244 connexions avec dashboard qualité et API complète.

---

*Développé avec ❤️ pour révéler les interconnexions en IA*