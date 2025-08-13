# Architecture Technique - Blog IA Navigation Graphique

## Spécifications pour Claude Code

### Vue d'ensemble du système
Blog de veille IA avec navigation graphique simple, basé sur une architecture de tags intelligents et limitation de profondeur. Extension du pattern AI Tools Explorer.

## Structure des Fichiers
```
ai-humanist-blog/
├── src/
│   ├── components/
│   │   ├── navigation/
│   │   │   ├── GraphView.tsx          # Visualisation principale
│   │   │   ├── TagCloud.tsx           # Navigation par tags
│   │   │   ├── SearchBar.tsx          # Recherche intelligente
│   │   │   └── FilterPanel.tsx        # Filtres contextuels
│   │   ├── articles/
│   │   │   ├── ArticleCard.tsx        # Carte article
│   │   │   ├── ArticleDetail.tsx      # Vue détaillée
│   │   │   └── ConnectionIndicator.tsx # Indicateur de liens
│   │   └── layout/
│   │       ├── MainLayout.tsx
│   │       └── GraphLayout.tsx
│   ├── data/
│   │   ├── articles.json              # Base d'articles
│   │   ├── tags.json                  # Système de tags
│   │   ├── connections.json           # Relations entre articles
│   │   └── schema.ts                  # Types TypeScript
│   ├── hooks/
│   │   ├── useGraphNavigation.ts      # Logic navigation
│   │   ├── useSearch.ts               # Recherche
│   │   └── useConnections.ts          # Gestion des liens
│   ├── utils/
│   │   ├── graphAlgorithms.ts         # Algos de connexion
│   │   ├── tagMatcher.ts              # Logique de tags
│   │   └── depthLimiter.ts            # Limitation profondeur
│   └── styles/
│       └── graph.css                  # Styles spécifiques
├── public/
│   └── data/                          # Articles JSON statiques
└── docs/
    └── editorial-guidelines.md        # Guide curation
```

## Modèle de Données

### Schema Principal
```typescript
// src/data/schema.ts
export interface Article {
  id: string
  title: string
  url: string
  source_type: 'github' | 'arxiv' | 'blog' | 'academic' | 'news'
  date: string
  
  // Contenu éditorial
  summary: string                    // 2-3 phrases
  perspective: string                // Angle d'analyse (1 phrase)
  interest_level: 1 | 2 | 3 | 4 | 5 // Importance subjective
  
  // Système de tags hiérarchiques
  primary_domain: PrimaryDomain
  secondary_domains: SecondaryDomain[]
  concepts: Concept[]
  tools_mentioned: Tool[]
  
  // Métadonnées automatiques
  author?: string
  reading_time: number               // minutes estimées
  complexity_level: 'beginner' | 'intermediate' | 'advanced'
  
  // Relations calculées (générées automatiquement)
  connected_articles: string[]       // IDs des articles liés
  centrality_score: number           // 0-1, importance dans le réseau
}

export type PrimaryDomain = 
  | 'technique' 
  | 'ethique' 
  | 'usage_professionnel' 
  | 'recherche' 
  | 'philosophie' 
  | 'frugalite'

export type SecondaryDomain = 
  | 'deep_learning'
  | 'nlp' 
  | 'computer_vision'
  | 'robotics'
  | 'bias_fairness'
  | 'privacy'
  | 'transparency'
  | 'accountability'
  | 'healthcare'
  | 'education'
  | 'finance'
  | 'industry_4_0'
  | 'green_ai'
  | 'edge_computing'
  | 'regulation'
  | 'society'

export interface Concept {
  id: string
  name: string
  type: 'technical' | 'philosophical' | 'methodological'
  controversy_level: 0 | 1 | 2 | 3  // 0=neutre, 3=très controversé
}

export interface Tool {
  id: string
  name: string
  type: 'framework' | 'library' | 'platform' | 'model'
  maturity: 'experimental' | 'beta' | 'stable' | 'deprecated'
}

export interface Connection {
  source_id: string
  target_id: string
  type: 'builds_on' | 'contradicts' | 'implements' | 'questions' | 'similar_to'
  strength: number                   // 0-1
  auto_detected: boolean            // true=algo, false=éditorial
  reasoning?: string                // Explication de la connexion
}
```

### Exemple de Données
```json
// public/data/articles.json
{
  "articles": [
    {
      "id": "art_001",
      "title": "Efficient Attention Mechanisms in Transformers",
      "url": "https://arxiv.org/abs/2024...",
      "source_type": "arxiv",
      "date": "2024-01-15",
      "summary": "Nouvelle architecture d'attention réduisant la complexité de O(n²) à O(n log n). Tests sur BERT et GPT montrent 40% de réduction en consommation énergétique. Implications pour l'IA frugale.",
      "perspective": "Avancée technique majeure qui ouvre la voie vers des modèles plus démocratiques.",
      "interest_level": 4,
      "primary_domain": "technique",
      "secondary_domains": ["nlp", "green_ai"],
      "concepts": [
        {"id": "attention", "name": "Mécanismes d'attention", "type": "technical", "controversy_level": 0},
        {"id": "efficiency", "name": "Efficacité computationnelle", "type": "methodological", "controversy_level": 1}
      ],
      "tools_mentioned": [
        {"id": "transformers", "name": "Transformers", "type": "framework", "maturity": "stable"}
      ],
      "complexity_level": "advanced",
      "reading_time": 8,
      "connected_articles": ["art_002", "art_015"],
      "centrality_score": 0.75
    }
  ]
}
```

## Composants Principaux

### 1. Navigation d'Entrée de Qualité
```typescript
// src/components/navigation/TagCloud.tsx
export const TagCloud: React.FC = () => {
  const { articles, selectedTags, onTagSelect } = useTagNavigation()
  
  // Logique de pondération des tags
  const tagWeights = calculateTagImportance(articles)
  
  return (
    <div className="tag-cloud">
      {/* Tags primaires - navigation principale */}
      <div className="primary-tags">
        {PRIMARY_DOMAINS.map(domain => (
          <TagBubble 
            key={domain}
            tag={domain}
            weight={tagWeights[domain]}
            selected={selectedTags.includes(domain)}
            onClick={() => onTagSelect(domain)}
            color={DOMAIN_COLORS[domain]}
          />
        ))}
      </div>
      
      {/* Tags secondaires - affinement */}
      <div className="secondary-tags">
        {getRelevantSecondaryTags(selectedTags, articles).map(tag => (
          <TagChip key={tag} tag={tag} />
        ))}
      </div>
    </div>
  )
}

// src/utils/tagMatcher.ts
export function calculateTagImportance(articles: Article[]): Record<string, number> {
  const tagCounts = {}
  const tagConnections = {}
  
  articles.forEach(article => {
    // Compter fréquence
    article.secondary_domains.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
    
    // Compter interconnexions
    article.connected_articles.forEach(connectedId => {
      const connected = articles.find(a => a.id === connectedId)
      if (connected) {
        article.secondary_domains.forEach(tag1 => {
          connected.secondary_domains.forEach(tag2 => {
            if (tag1 !== tag2) {
              const key = [tag1, tag2].sort().join('-')
              tagConnections[key] = (tagConnections[key] || 0) + 1
            }
          })
        })
      }
    })
  })
  
  // Calcul score final : fréquence * interconnexions
  return Object.keys(tagCounts).reduce((acc, tag) => {
    const frequency = tagCounts[tag] / articles.length
    const connectivity = getTagConnectivity(tag, tagConnections)
    acc[tag] = frequency * connectivity
    return acc
  }, {})
}
```

### 2. Visualisation Graphique Simple
```typescript
// src/components/navigation/GraphView.tsx
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force'

export const GraphView: React.FC<{
  selectedArticle: Article | null
  maxDepth: number // Limitation profondeur
}> = ({ selectedArticle, maxDepth = 2 }) => {
  
  const { nodes, links } = useGraphData(selectedArticle, maxDepth)
  
  const simulation = useMemo(() => {
    return forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id).strength(d => d.strength))
      .force("charge", forceManyBody().strength(-300))
      .force("center", forceCenter(width / 2, height / 2))
  }, [nodes, links])
  
  return (
    <svg width={width} height={height}>
      {/* Liens */}
      {links.map(link => (
        <line
          key={`${link.source.id}-${link.target.id}`}
          x1={link.source.x}
          y1={link.source.y}
          x2={link.target.x}
          y2={link.target.y}
          stroke={getLinkColor(link.type)}
          strokeWidth={link.strength * 3}
          strokeDasharray={link.auto_detected ? "5,5" : "none"}
        />
      ))}
      
      {/* Nœuds */}
      {nodes.map(node => (
        <circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r={getNodeRadius(node)}
          fill={DOMAIN_COLORS[node.primary_domain]}
          stroke={node.id === selectedArticle?.id ? "#000" : "none"}
          strokeWidth={3}
          onClick={() => onNodeClick(node)}
          className="cursor-pointer hover:opacity-80"
        />
      ))}
    </svg>
  )
}

// src/hooks/useGraphData.ts
export function useGraphData(centerArticle: Article | null, maxDepth: number) {
  return useMemo(() => {
    if (!centerArticle) return { nodes: [], links: [] }
    
    const visitedNodes = new Set<string>()
    const nodes: GraphNode[] = []
    const links: GraphLink[] = []
    
    function addNodesRecursively(article: Article, depth: number) {
      if (depth > maxDepth || visitedNodes.has(article.id)) return
      
      visitedNodes.add(article.id)
      nodes.push({
        id: article.id,
        article,
        depth,
        radius: calculateNodeSize(article, depth)
      })
      
      if (depth < maxDepth) {
        article.connected_articles.forEach(connectedId => {
          const connection = getConnection(article.id, connectedId)
          if (connection && connection.strength > 0.3) { // Seuil qualité
            const connectedArticle = getArticleById(connectedId)
            if (connectedArticle) {
              links.push({
                source: article.id,
                target: connectedId,
                ...connection
              })
              addNodesRecursively(connectedArticle, depth + 1)
            }
          }
        })
      }
    }
    
    addNodesRecursively(centerArticle, 0)
    return { nodes, links }
  }, [centerArticle, maxDepth])
}
```

### 3. Algorithme de Connexion Intelligent
```typescript
// src/utils/graphAlgorithms.ts
export function detectConnections(articleA: Article, articleB: Article): Connection | null {
  let strength = 0
  let type: Connection['type'] = 'similar_to'
  let reasoning = ''
  
  // 1. Similarité par tags
  const sharedConcepts = intersection(
    articleA.concepts.map(c => c.id),
    articleB.concepts.map(c => c.id)
  )
  const conceptSimilarity = sharedConcepts.length / 
    Math.max(articleA.concepts.length, articleB.concepts.length)
  
  // 2. Outils communs
  const sharedTools = intersection(
    articleA.tools_mentioned.map(t => t.id),
    articleB.tools_mentioned.map(t => t.id)
  )
  const toolSimilarity = sharedTools.length / 
    Math.max(articleA.tools_mentioned.length, articleB.tools_mentioned.length)
  
  // 3. Domaines partagés
  const domainOverlap = intersection(
    [articleA.primary_domain, ...articleA.secondary_domains],
    [articleB.primary_domain, ...articleB.secondary_domains]
  ).length
  
  // 4. Détection de contradiction (controverses opposées)
  const controversyOpposition = detectControversyOpposition(articleA, articleB)
  
  // 5. Référence directe (dans summary/perspective)
  const directReference = detectDirectReference(articleA, articleB)
  
  // Calcul score final
  if (directReference.found) {
    strength = 0.9
    type = directReference.type
    reasoning = directReference.context
  } else if (controversyOpposition.detected) {
    strength = 0.7
    type = 'contradicts'
    reasoning = controversyOpposition.explanation
  } else if (conceptSimilarity > 0.4 || toolSimilarity > 0.3) {
    strength = Math.max(conceptSimilarity, toolSimilarity) * 0.8
    type = 'similar_to'
    reasoning = `Concepts partagés: ${sharedConcepts.join(', ')}`
  }
  
  // Seuil de pertinence
  if (strength < 0.3) return null
  
  return {
    source_id: articleA.id,
    target_id: articleB.id,
    type,
    strength,
    auto_detected: true,
    reasoning
  }
}

function detectDirectReference(articleA: Article, articleB: Article): {
  found: boolean
  type: Connection['type']
  context: string
} {
  const textA = `${articleA.summary} ${articleA.perspective}`.toLowerCase()
  const textB = `${articleB.summary} ${articleB.perspective}`.toLowerCase()
  
  // Recherche de mots-clés d'implémentation
  const implementKeywords = ['implémente', 'utilise', 'applique', 'se base sur']
  const questionKeywords = ['questionne', 'remet en cause', 'critique']
  const buildKeywords = ['étend', 'améliore', 'optimise']
  
  for (const keyword of implementKeywords) {
    if (textA.includes(keyword) && articleA.tools_mentioned.some(tool => 
        textB.includes(tool.name.toLowerCase()))) {
      return {
        found: true,
        type: 'implements',
        context: `Article A ${keyword} des outils mentionnés dans B`
      }
    }
  }
  
  // ... autres détections
  
  return { found: false, type: 'similar_to', context: '' }
}
```

### 4. Interface de Recherche Intelligente
```typescript
// src/components/navigation/SearchBar.tsx
export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('')
  const { searchResults, isLoading } = useSearch(query)
  
  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par concept, outil, ou question..."
        className="search-input"
      />
      
      {query && (
        <div className="search-results">
          {/* Résultats groupés par pertinence */}
          <SearchSection 
            title="Correspondances exactes"
            results={searchResults.exact}
          />
          <SearchSection 
            title="Concepts liés"
            results={searchResults.related}
          />
          <SearchSection 
            title="Dans le même domaine"
            results={searchResults.domain}
          />
        </div>
      )}
    </div>
  )
}

// src/hooks/useSearch.ts
export function useSearch(query: string) {
  const { articles } = useArticles()
  
  return useMemo(() => {
    if (!query.trim()) return { exact: [], related: [], domain: [] }
    
    const normalizedQuery = query.toLowerCase()
    
    // Recherche exacte dans titre/concepts
    const exact = articles.filter(article =>
      article.title.toLowerCase().includes(normalizedQuery) ||
      article.concepts.some(c => c.name.toLowerCase().includes(normalizedQuery))
    )
    
    // Recherche par similarité sémantique
    const related = articles.filter(article =>
      !exact.includes(article) &&
      (article.summary.toLowerCase().includes(normalizedQuery) ||
       article.tools_mentioned.some(t => t.name.toLowerCase().includes(normalizedQuery)))
    )
    
    // Recherche par domaine
    const domain = articles.filter(article =>
      !exact.includes(article) && !related.includes(article) &&
      article.secondary_domains.some(d => d.includes(normalizedQuery))
    )
    
    return { exact, related, domain }
  }, [query, articles])
}
```

## Configuration et Paramètres

### Paramètres de Navigation
```typescript
// src/config/navigation.ts
export const NAVIGATION_CONFIG = {
  // Limitation profondeur
  MAX_GRAPH_DEPTH: 2,
  MAX_NODES_DISPLAYED: 50,
  
  // Seuils de qualité
  MIN_CONNECTION_STRENGTH: 0.3,
  MIN_CENTRALITY_FOR_HUB: 0.6,
  
  // Interface
  ANIMATION_DURATION: 300,
  NODE_SIZES: {
    central: 20,
    primary: 15,
    secondary: 10
  },
  
  // Couleurs par domaine
  DOMAIN_COLORS: {
    technique: '#3B82F6',      // Bleu
    ethique: '#EF4444',        // Rouge
    usage_professionnel: '#10B981', // Vert
    recherche: '#8B5CF6',      // Violet
    philosophie: '#F59E0B',    // Orange
    frugalite: '#6B7280'       // Gris
  }
}
```

### Scripts de Build
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "generate-connections": "tsx scripts/generateConnections.ts",
    "validate-data": "tsx scripts/validateData.ts",
    "export-graph": "tsx scripts/exportGraph.ts"
  }
}
```

## Directives pour Claude Code

### Priorités d'Implémentation
1. **Phase 1** : Modèle de données + Interface de tags simple
2. **Phase 2** : Visualisation graphique basique avec limitation profondeur
3. **Phase 3** : Algorithmes de connexion automatique
4. **Phase 4** : Recherche intelligente et optimisations

### Points d'Attention
- **Simplicité avant performance** : Interface claire plutôt qu'optimisations prématurées
- **Données statiques** : Pas de base de données, tout en JSON
- **Responsive** : Mobile-first, graphique adaptatif
- **Accessibilité** : Navigation clavier, contrastes, ARIA

### Tests Requis
- **Validation de données** : Schema des articles respecté
- **Performance** : <2s pour charger graphique avec 50 nœuds
- **Qualité connexions** : >80% des connexions auto-détectées pertinentes
- **Navigation** : Tous les articles accessibles en <3 clics

Cette architecture privilégie la simplicité d'usage et la qualité éditoriale, tout en offrant une expérience de navigation innovante par le graphique.