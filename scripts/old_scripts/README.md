# Scripts Obsolètes - Archive Phase 11

Ce dossier contient les scripts rendus caduques après la consolidation Phase 11 P0+P1.

## 📁 Scripts Archivés

### Connexions (remplacés par enrichConnections.ts + fixRelationSubtlety.ts)
- `analyzeConnections.ts` - Remplacé par `analyzeConnectionBias.ts`
- `enhanceConnectionsWithEmbeddings.ts` - Intégré dans `enrichConnections.ts`
- `generateHybridConnections.ts` - Logique consolidée dans `enrichConnections.ts`
- `intelligentConnectionPipeline.ts` - Remplacé par approche simplifiée
- `intelligentConnectionRescorer.ts` - Intégré dans `fixRelationSubtlety.ts`

### Import/Ajout (remplacés par workflow Phase 11)
- `addArticleComplete.ts` - Remplacé par édition manuelle + enrichissement automatique
- `batchImportArticles.ts` - Remplacé par édition directe articles.json

### Utilitaires (intégrés ou remplacés)  
- `cleanArticles.ts` - Fonctionnalité intégrée dans scripts principaux
- `exportGraph.ts` - Non utilisé en production
- `migrateToNewFormat.ts` - Migration terminée
- `syncConnectedArticles.ts` - Remplacé par enrichissement automatique
- `smartDeduplication.ts` - Workflow Phase 11 différent
- `smartIdMapper.ts` - Workflow Phase 11 différent

### Scripts expérimentaux
- `precompute-graph-layout.ts` - Non implémenté (P2)
- `smokeTests.ts` - Tests basiques remplacés par validation Zod
- `validateData.ts` - Remplacé par `zodSchemas.ts`

### Tests
- `tests/` - Anciens tests basiques, remplacés par validation runtime

## 🎯 Justification
Ces scripts ont été consolidés pour simplifier la maintenance et réduire la complexité. Les fonctionnalités essentielles ont été intégrées dans les scripts principaux :
- `enrichConnections.ts` - Enrichissement consolidé
- `fixRelationSubtlety.ts` - Affinement des relations
- `analyzeConnectionBias.ts` - Analyse méthodologique
- `writeFileAtomic.ts` + `zodSchemas.ts` - Fiabilisation

**Conservés pour référence historique et sécurité.**