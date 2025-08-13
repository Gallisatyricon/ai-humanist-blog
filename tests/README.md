# Tests - Blog IA Humaniste

## Structure des Tests

```
tests/
├── README.md                    # Ce fichier
├── components/                  # Tests des composants React
│   ├── articles/
│   │   └── ArticleCard.test.tsx
│   ├── navigation/
│   │   ├── GraphView.test.tsx
│   │   ├── SearchBar.test.tsx
│   │   └── TagCloud.test.tsx
│   └── layout/
│       └── MainLayout.test.tsx
├── hooks/                       # Tests des hooks personnalisés
│   ├── useGraphData.test.ts
│   ├── useSearch.test.ts
│   └── useTagNavigation.test.ts
├── utils/                       # Tests des utilitaires
│   ├── graphAlgorithms.test.ts
│   └── tagMatcher.test.ts
├── integration/                 # Tests d'intégration
│   ├── navigation-flow.test.tsx
│   └── search-integration.test.tsx
├── data/                       # Données de test
│   ├── articles.mock.json
│   └── connections.mock.json
└── setup.ts                    # Configuration des tests
```

## À Implémenter

### Tests Prioritaires
1. **Composants critiques** : GraphView, SearchBar
2. **Hooks complexes** : useGraphData, useTagNavigation  
3. **Algorithmes** : graphAlgorithms, tagMatcher
4. **Flux utilisateur** : Navigation tags → graphique → recherche

### Framework Suggéré
- **Testing Library** : @testing-library/react
- **Jest** : Framework de test
- **MSW** : Mock des données
- **Cypress** : Tests E2E (optionnel)

### Commandes Futures
```bash
npm run test           # Tests unitaires
npm run test:watch     # Mode watch
npm run test:coverage  # Couverture de code
npm run test:e2e      # Tests E2E
```

---

*Tests à implémenter dans la Phase 5 - Finitions*