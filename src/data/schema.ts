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
  connected_articles: string[]       // IDs des articles liés (rétrocompatibilité)
  centrality_score: number           // 0-1, importance dans le réseau
  
  // NOUVEAU : Connexions suggérées par l'agent LLM (pour Option 2)
  suggested_connections?: SuggestedConnection[]
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

// Interface pour les connexions suggérées par l'agent LLM
export interface SuggestedConnection {
  target_id: string
  type: Connection['type']
  strength: number
  reasoning: string
  confidence: number                // 0-1, confiance de l'agent LLM
}

// Types pour la visualisation graphique
export interface GraphNode {
  id: string
  article: Article
  depth: number
  radius: number
  x?: number
  y?: number
}

export interface GraphLink {
  source: string
  target: string
  type: Connection['type']
  strength: number
  auto_detected: boolean
  reasoning?: string
}

// Types pour la navigation
export interface TagWeight {
  [tag: string]: number
}

export interface SearchResults {
  exact: Article[]
  related: Article[]
  domain: Article[]
}

// Structure optimisée pour les données
export interface ArticleData {
  articles: Article[]
  last_updated: string
  total_articles: number
}

export interface ConnectionData {
  connections: Connection[]
  generated_at: string
  total_connections: number
  // Index pour accès rapide
  connection_index: Record<string, string[]>  // article_id -> [connected_article_ids]
  // Cache des derniers articles traités
  last_processed: Record<string, string>      // article_id -> date_iso
}

// Input pour l'agent LLM - ce que n8n enverra
export interface NewArticleInput {
  article: Omit<Article, 'centrality_score'>  // Centralité calculée après ajout
  suggested_connections: SuggestedConnection[]
}

// Constantes
export const PRIMARY_DOMAINS: PrimaryDomain[] = [
  'technique',
  'ethique', 
  'usage_professionnel',
  'recherche',
  'philosophie',
  'frugalite'
]

export const SECONDARY_DOMAINS: SecondaryDomain[] = [
  'deep_learning',
  'nlp',
  'computer_vision', 
  'robotics',
  'bias_fairness',
  'privacy',
  'transparency',
  'accountability',
  'healthcare',
  'education',
  'finance',
  'industry_4_0',
  'green_ai',
  'edge_computing',
  'regulation',
  'society'
]