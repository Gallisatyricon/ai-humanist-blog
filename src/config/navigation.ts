import { PrimaryDomain } from '@/data/schema'

export const NAVIGATION_CONFIG = {
  // Limitation profondeur - Navigation progressive
  MAX_GRAPH_DEPTH: 2,
  MAX_NODES_DISPLAYED: 20, // Réduit pour meilleure lisibilité
  
  // Seuils de qualité relevés pour éviter surcharge
  MIN_CONNECTION_STRENGTH: 0.6, // Augmenté de 0.3 à 0.6
  MIN_CENTRALITY_FOR_HUB: 0.7,
  
  // Limites pour navigation progressive
  MAX_FOCUS_CONNECTIONS: 8,     // Maximum connexions directes en mode focus
  MAX_OVERVIEW_CONNECTIONS: 35, // Maximum connexions en vue d'ensemble
  
  // Interface
  ANIMATION_DURATION: 300,
  NODE_SIZES: {
    central: 24,    // Augmenté pour plus de visibilité
    primary: 18,    // Augmenté
    secondary: 12   // Augmenté
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