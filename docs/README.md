# AI Humanist Blog - Documentation

## 🎯 Vision du Projet

Blog de veille IA révélant les interconnexions entre technique et éthique via une interface graphique interactive. Navigation exploratoire permettant de découvrir les ponts interdisciplinaires.

## 🏗️ Stack Technique

- **Frontend :** React 18 + TypeScript + Tailwind CSS
- **Visualisation :** D3.js force simulation
- **Build :** Vite + PostCSS  
- **Data :** JSON statique avec Smart ID Mapping
- **Scripts :** Node.js + tsx

## 📊 État Actuel

✅ **Production Ready** - 40 articles, 450 connexions intelligentes  
✅ **Smart Mapping** - Résolution automatique des IDs invalides  
✅ **Smart Deduplication** - Gestion des doublons avec fusion de métadonnées  
✅ **Navigation hybride** - Tags + Graphique interactif  

## 🚀 Commandes Essentielles

```bash
# Développement
npm run dev                    # http://localhost:5173

# Scripts d'ajout d'articles
npm run add-complete -- --input article.json    # Ajout avec Smart Mapping + Deduplication
npm run batch-import -- --input articles.md     # Import en lot depuis markdown

# Production
npm run build                  # Build optimisé
npm run lint                   # Vérification code
```

## 📁 Structure Projet

```
ai-humanist-blog/
├── src/
│   ├── components/           # Composants React
│   │   ├── navigation/       # TagCloud, GraphView, SearchBar
│   │   ├── articles/         # ArticleCard, ArticleDetail
│   │   └── layout/          # MainLayout
│   ├── hooks/               # Logique métier (useTagNavigation, useGraphData)
│   ├── utils/               # Algorithmes (graphAlgorithms, Smart Mapping)
│   └── config/              # Constantes et configuration
├── scripts/                 # Scripts d'import et maintenance
│   ├── addArticleComplete.ts      # Ajout intelligent complet
│   ├── smartIdMapper.ts           # Résolution IDs invalides
│   ├── smartDeduplication.ts     # Gestion doublons
│   └── batchImportArticles.ts    # Import batch production
├── public/data/             # Données JSON
│   ├── articles.json        # 40 articles validés
│   └── connections.json     # 450 connexions
└── docs/                    # Documentation
    ├── TECHNICAL.md         # Architecture détaillée
    ├── TEMPLATES.md         # Formats JSON pour n8n
    ├── DEPLOYMENT.md        # Guide déploiement
    └── PROGRESS.md          # Historique évolutions
```

## 🔗 Système de Connexions Intelligent

### Smart ID Mapping
Résout automatiquement les `target_id` invalides des connexions LLM n8n :
- **URL/titre exact** (confiance 100%)
- **Analyse sémantique** par concepts/outils (confiance 60-80%)
- **Domaine + temporalité** (confiance 40-70%)

### Smart Deduplication  
Détecte et gère les articles en doublon :
- **Évite la duplication** des articles identiques
- **Fusionne les métadonnées** enrichies
- **Met à jour les connexions** uniques seulement

### Types de Connexions
- `builds_on` (42.9%) - Ponts interdisciplinaires
- `questions` (39.3%) - Questionnements critiques
- `similar_to` (15.1%) - Approches similaires
- `implements` (2.2%) - Implémentations
- `contradicts` (0.4%) - Oppositions

## 🔄 Workflow n8n

### Format d'entrée attendu
```json
{
  "article": { 
    "id": "art_001", 
    "title": "...", 
    /* structure Article complète */ 
  },
  "suggested_connections": [
    {
      "target_id": "art_003",
      "type": "builds_on", 
      "strength": 0.75,
      "reasoning": "Both discuss...",
      "confidence": 0.85
    }
  ]
}
```

### Traitement automatique
1. **Smart ID Mapping** résout les `target_id` invalides
2. **Smart Deduplication** détecte les doublons
3. **Fusion intelligente** des métadonnées si nécessaire
4. **Ajout/mise à jour** avec connexions uniques

## 🎨 Interface Utilisateur

### Navigation Progressive
- **Vue d'ensemble** : 35 connexions les plus importantes
- **Mode focus** : 8 connexions prioritaires par article sélectionné
- **Navigation par tags** : 6 domaines + 17 spécialités
- **Recherche intelligente** : Multi-critères avec scores de pertinence

### Visualisation D3.js
- **Graphique interactif** avec force simulation
- **5 types de connexions** colorées et typées
- **Navigation exploratoire** révélant les ponts technique ↔ éthique
- **Espacement optimisé** pour lisibilité maximale

## 📈 Performance

- **Chargement initial :** <300ms
- **Génération connexions :** ~100ms (40 articles)  
- **Navigation temps réel** : Instantanée
- **Smart Mapping :** 100% réussite, confiance 76%
- **Import batch :** ~2s pour 25 articles

## 🧪 Tests de Validation

```bash
# Test Smart Mapping
npx tsx scripts/testSmartMapper.ts

# Test Smart Deduplication  
npx tsx scripts/testDeduplication.ts

# Validation données
npx tsx scripts/validateData.ts
```

## 📖 Documentation Complète

- **[TECHNICAL.md](TECHNICAL.md)** - Architecture système détaillée
- **[TEMPLATES.md](TEMPLATES.md)** - Formats JSON pour intégrations
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guide déploiement production
- **[PROGRESS.md](PROGRESS.md)** - Journal complet des évolutions

## 🎯 Prochaines Étapes

1. **Intégration nouveaux articles** depuis fichier n8n
2. **Nettoyage scripts de test** obsolètes
3. **Optimisations finales** et tests utilisateur
4. **Déploiement production** avec workflow automatisé

---

**🚀 Le système est production-ready avec Smart Mapping et Smart Deduplication opérationnels pour l'intégration n8n !**