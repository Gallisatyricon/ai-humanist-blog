import { PrimaryDomain } from '@/data/schema'

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
  }
}

// Export séparé des couleurs
export const DOMAIN_COLORS: Record<PrimaryDomain, string> = {
  technique: '#3B82F6',      // Bleu
  ethique: '#EF4444',        // Rouge
  usage_professionnel: '#10B981', // Vert
  recherche: '#8B5CF6',      // Violet
  philosophie: '#F59E0B',    // Orange
  frugalite: '#6B7280'       // Gris
}

// Couleurs pour les types de connexions
export const CONNECTION_COLORS = {
  builds_on: '#10B981',     // Vert - construction
  contradicts: '#EF4444',   // Rouge - opposition
  implements: '#3B82F6',    // Bleu - implémentation
  questions: '#FB923C',     // Orange clair - questionnement
  similar_to: '#6B7280'     // Gris - similarité
}

// Labels français pour l'interface
export const DOMAIN_LABELS: Record<PrimaryDomain, string> = {
  technique: 'Technique',
  ethique: 'Éthique',
  usage_professionnel: 'Usage Pro',
  recherche: 'Recherche',
  philosophie: 'Philosophie',
  frugalite: 'Frugalité'
}

export const CONNECTION_LABELS = {
  builds_on: 'S\'appuie sur',
  contradicts: 'Contredit',
  implements: 'Implémente',
  questions: 'Questionne',
  similar_to: 'Similaire à'
}

export const COMPLEXITY_LABELS = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire', 
  advanced: 'Avancé'
}

export const SOURCE_LABELS = {
  github: 'GitHub',
  arxiv: 'ArXiv',
  blog: 'Blog',
  academic: 'Académique',
  news: 'Actualités'
}