# Guide de Contribution - Blog IA Humaniste

Ce guide vous aide à contribuer efficacement au projet Blog IA Humaniste.

## 📁 Structure du Projet

```
ai-humanist-blog/
├── 📄 README.md                    # Documentation principale
├── 📄 CONTRIBUTING.md              # Guide de contribution (ce fichier)
├── 📁 src/                         # Code source React/TypeScript
│   ├── 📁 components/              # Composants React
│   │   ├── 📁 articles/           # Composants liés aux articles
│   │   │   └── ArticleCard.tsx    # Carte d'affichage article
│   │   ├── 📁 layout/             # Layouts de page
│   │   │   └── MainLayout.tsx     # Layout principal
│   │   └── 📁 navigation/         # Navigation et graphique
│   │       ├── GraphView.tsx      # Visualisation D3.js
│   │       ├── SearchBar.tsx      # Barre de recherche
│   │       ├── TagCloud.tsx       # Nuage de tags
│   │       └── TagBubble.tsx      # Composant tag individuel
│   ├── 📁 hooks/                  # Hooks React personnalisés
│   │   ├── useGraphData.ts        # Logique données graphique
│   │   ├── useSearch.ts           # Logique recherche
│   │   └── useTagNavigation.ts    # Logique navigation tags
│   ├── 📁 utils/                  # Fonctions utilitaires
│   │   ├── graphAlgorithms.ts     # Algorithmes de connexion
│   │   └── tagMatcher.ts          # Correspondance tags
│   ├── 📁 types/                  # Types TypeScript centralisés
│   │   └── index.ts               # Réexportation types
│   ├── 📁 styles/                 # Styles CSS
│   │   ├── animations.css         # Animations CSS
│   │   └── graph.css              # Styles graphique D3.js
│   ├── 📁 data/                   # Modèles de données
│   │   └── schema.ts              # Types et interfaces
│   └── 📁 config/                 # Configuration
│       └── navigation.ts          # Constantes navigation
├── 📁 scripts/                    # Scripts de développement
│   ├── generateConnections.ts     # Génération auto connexions
│   ├── validateData.ts            # Validation données
│   └── exportGraph.ts             # Export graphique
├── 📁 public/                     # Fichiers statiques
│   └── 📁 data/                   # Données JSON
│       └── articles.json          # Base d'articles
├── 📁 docs/                       # Documentation
│   ├── project-brief.md           # Brief projet
│   ├── technical-specs.md         # Spécifications techniques
│   ├── progress.md                # État d'avancement
│   └── content-examples.md        # Exemples de contenu
└── 📁 tests/                      # Tests (à implémenter)
```

## 🛠️ Développement

### Configuration de l'environnement

```bash
# Cloner le projet
git clone [url-du-repo]
cd ai-humanist-blog

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

### Scripts disponibles

| Script | Description | Usage |
|--------|-------------|--------|
| `npm run dev` | Serveur développement | Développement quotidien |
| `npm run build` | Build production | Déploiement |
| `npm run preview` | Aperçu build | Test pré-déploiement |
| `npm run lint` | Vérification code | Contrôle qualité |
| `npm run generate-connections` | Génère les connexions automatiquement | Maintenance données |
| `npm run validate-data` | Valide la cohérence des données | Contrôle qualité |
| `npm run export-graph` | Exporte le graphique | Analyse/reporting |

## 📝 Convention de Code

### TypeScript
- Utiliser des types stricts
- Préférer les interfaces aux types pour les objets
- Documenter les fonctions complexes
- Importer les types depuis `src/types/`

### React
- Composants fonctionnels avec hooks
- Props typées avec TypeScript
- Nommage en PascalCase pour composants
- Un composant par fichier

### CSS/Styles
- Utiliser Tailwind CSS en priorité
- Styles personnalisés dans `src/styles/`
- Classes utilitaires pour animations
- CSS modules pour styles spécifiques

### Nommage
- **Fichiers**: kebab-case (`article-card.tsx`)
- **Composants**: PascalCase (`ArticleCard`)
- **Variables**: camelCase (`selectedArticle`)
- **Constantes**: SNAKE_CASE (`MAX_CONNECTIONS`)
- **Types**: PascalCase (`Article`, `GraphNode`)

## 🎨 Ajout de Contenu

### Ajouter un article

1. **Éditer `public/data/articles.json`**:

```json
{
  "id": "art_XXX",
  "title": "Titre de l'article",
  "url": "https://...",
  "source_type": "arxiv|blog|github|academic|news",
  "date": "2025-01-15",
  "summary": "Résumé de 2-3 phrases...",
  "perspective": "Angle d'analyse en 1 phrase",
  "interest_level": 3,
  "primary_domain": "technique",
  "secondary_domains": ["nlp", "bias_fairness"],
  "concepts": [
    {"id": "transformer", "name": "Transformers", "type": "technical", "controversy_level": 0}
  ],
  "tools_mentioned": [
    {"id": "pytorch", "name": "PyTorch", "type": "framework", "maturity": "stable"}
  ],
  "reading_time": 8,
  "complexity_level": "intermediate",
  "centrality_score": 0.6
}
```

2. **Générer les connexions**:
```bash
npm run generate-connections
```

3. **Valider les données**:
```bash
npm run validate-data
```

### Ajouter un domaine/spécialité

1. Éditer `src/data/schema.ts`
2. Ajouter les couleurs dans `src/config/navigation.ts`
3. Mettre à jour la documentation

## 🎨 Personnalisation Visuelle

### Modifier les couleurs des domaines

Éditer `src/config/navigation.ts`:

```typescript
export const DOMAIN_COLORS: Record<PrimaryDomain, string> = {
  technique: '#3B82F6',      // Bleu
  ethique: '#EF4444',        // Rouge
  // ... autres domaines
}
```

### Ajouter des animations

1. Définir l'animation dans `src/styles/animations.css`
2. Ajouter la classe utilitaire
3. Utiliser dans les composants

### Modifier le graphique

- **Forces D3**: Éditer `src/components/navigation/GraphView.tsx`
- **Algorithmes connexion**: Modifier `src/utils/graphAlgorithms.ts`
- **Styles visuels**: Ajuster `src/styles/graph.css`

## 🧪 Tests et Validation

### Avant de committer

```bash
# Validation des données
npm run validate-data

# Vérification du code
npm run lint

# Build pour tester
npm run build
```

### Structure des tests (à implémenter)

```
tests/
├── components/          # Tests composants
├── hooks/              # Tests hooks
├── utils/              # Tests utilitaires
└── integration/        # Tests d'intégration
```

## 🚀 Déploiement

### Build de production

```bash
npm run build
npm run preview  # Test local du build
```

### Variables d'environnement

Créer `.env.local` si nécessaire:

```
VITE_API_BASE_URL=https://...
VITE_ANALYTICS_ID=...
```

## 🐛 Debugging

### Problèmes fréquents

1. **Graphique ne s'affiche pas**:
   - Vérifier les données dans `public/data/articles.json`
   - Contrôler la console pour erreurs D3.js

2. **Connexions manquantes**:
   - Régénérer: `npm run generate-connections`
   - Valider: `npm run validate-data`

3. **Problèmes de performance**:
   - Limiter le nombre de nœuds affichés
   - Optimiser les algorithmes dans `utils/`

### Outils de debug

- React DevTools
- D3.js console debugging
- Network tab pour données JSON
- Performance tab pour animations

## 📋 Checklist Contribution

- [ ] Code testé localement
- [ ] Données validées (`npm run validate-data`)
- [ ] Lint passant (`npm run lint`)
- [ ] Build réussie (`npm run build`)
- [ ] Documentation mise à jour si nécessaire
- [ ] Types TypeScript à jour

## 🤝 Processus de Review

1. **Fork** le repo
2. **Créer** une branche feature
3. **Implémenter** les changements
4. **Tester** localement
5. **Commit** avec messages clairs
6. **Push** et créer une Pull Request

---

Pour toute question, consulter la [documentation complète](./docs/) ou ouvrir une issue.

*Merci de contribuer au Blog IA Humaniste ! 🤖❤️*