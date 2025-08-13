/* ========================================
   TYPES CENTRALISÉS
   Réexportation de tous les types du projet
   ======================================== */

// Types principaux du domaine
export * from '../data/schema'
import type { 
  Article, 
  PrimaryDomain, 
  SecondaryDomain, 
  GraphNode, 
  GraphLink 
} from '../data/schema'

// Types spécifiques aux composants
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

// Types pour l'état de l'application
export interface AppState {
  selectedArticle: Article | null
  filteredArticles: Article[]
  searchQuery: string
  selectedDomains: PrimaryDomain[]
  selectedSpecialties: SecondaryDomain[]
}

// Types pour les hooks
export interface UseGraphDataReturn {
  nodes: GraphNode[]
  links: GraphLink[]
  stats: GraphStats
  isGenerating: boolean
}

export interface UseSearchReturn {
  searchResults: {
    exact: Article[]
    related: Article[]
    domain: Article[]
  }
  isLoading: boolean
}

export interface UseTagNavigationReturn {
  selectedDomains: PrimaryDomain[]
  selectedSpecialties: SecondaryDomain[]
  availableSpecialties: SecondaryDomain[]
  filteredArticles: Article[]
  stats: {
    total: number
    filtered: number
    bridgeArticles: number
  }
  toggleDomain: (domain: PrimaryDomain) => void
  toggleSpecialty: (specialty: SecondaryDomain) => void
  clearFilters: () => void
}

// Types pour les utilitaires
export interface GraphStats {
  totalNodes: number
  totalLinks: number
  averageConnections: number
  mostConnectedArticle?: Article
}

export interface TagWeight {
  tag: string
  weight: number
  frequency: number
  connectivity: number
}

// Types pour la configuration
export interface NavigationConfig {
  MAX_GRAPH_DEPTH: number
  MAX_NODES_DISPLAYED: number
  MIN_CONNECTION_STRENGTH: number
  MIN_CENTRALITY_FOR_HUB: number
  ANIMATION_DURATION: number
  NODE_SIZES: {
    central: number
    primary: number
    secondary: number
  }
}

// Réexportation des types du schema pour compatibilité
export type {
  Article,
  Connection,
  Concept,
  Tool,
  GraphNode,
  GraphLink,
  PrimaryDomain,
  SecondaryDomain,
  SuggestedConnection,
  TagWeight as SchemaTagWeight,
  SearchResults,
  ArticleData,
  ConnectionData,
  NewArticleInput
} from '../data/schema'