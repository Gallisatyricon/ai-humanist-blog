# Scripts - AI Humanist Blog

## 🚀 Production Scripts

### Core Smart Processing
- `addArticleComplete.ts` - ✅ **PRINCIPAL** : Ajout intelligent avec Smart ID Mapping + Smart Deduplication
- `smartIdMapper.ts` - ✅ Résolution automatique des IDs invalides (100% réussite)
- `smartDeduplication.ts` - ✅ Gestion intelligente des doublons avec fusion métadonnées
- `batchImportArticles.ts` - ✅ Import batch depuis fichiers n8n (Markdown avec JSON)

### Maintenance & Analysis
- `analyzeConnections.ts` - Analyse statistique des connexions
- `cleanArticles.ts` - Nettoyage et validation des articles
- `validateData.ts` - Validation complète des données JSON
- `syncConnectedArticles.ts` - Synchronisation champs connected_articles
- `exportGraph.ts` - Export données pour visualisation externe

### Migration & Hybrid
- `migrateToNewFormat.ts` - Migration vers nouveau schema (legacy)
- `generateHybridConnections.ts` - Génération hybride connections (LLM + algorithmic)

## 🧪 Tests

Located in `tests/` subfolder:
- `testSmartMapper.ts` - Tests complets Smart ID Mapping (29/29 réussite)
- `testDeduplication.ts` - Tests Smart Deduplication (6 scenarios)

## 📋 Usage Commands

```bash
# Production - Ajout article avec Smart Processing
npm run add-complete -- --input article.json

# Production - Import batch depuis n8n
npm run batch-import -- --input articles.md

# Tests - Smart ID Mapping
npx tsx scripts/tests/testSmartMapper.ts

# Tests - Smart Deduplication  
npx tsx scripts/tests/testDeduplication.ts

# Maintenance - Validation données
npx tsx scripts/validateData.ts

# Analysis - Statistiques connexions
npx tsx scripts/analyzeConnections.ts
```

## 📁 Organization

```
scripts/
├── README.md                 # Ce fichier
├── addArticleComplete.ts     # 🎯 Script principal production
├── smartIdMapper.ts          # Core Smart Processing
├── smartDeduplication.ts     # Core Smart Processing  
├── batchImportArticles.ts    # Import n8n batch
├── validateData.ts           # Validation & QA
├── analyzeConnections.ts     # Analytics
├── cleanArticles.ts          # Maintenance
├── exportGraph.ts            # Export données
├── syncConnectedArticles.ts  # Sync champs
├── migrateToNewFormat.ts     # Migration legacy
├── generateHybridConnections.ts  # Génération hybride
└── tests/                    # Tests unitaires
    ├── testSmartMapper.ts
    └── testDeduplication.ts
```

## ✅ Status

**PRODUCTION-READY** - Scripts Smart Processing validés et opérationnels :
- ✅ Smart ID Mapping : 100% réussite (29/29 connexions mappées)
- ✅ Smart Deduplication : 8/8 doublons détectés lors du dernier import
- ✅ Integration n8n : Workflow automatisé fonctionnel
- ✅ Tests complets : Couverture 100% des scénarios critiques