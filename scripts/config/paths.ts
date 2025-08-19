#!/usr/bin/env tsx
/**
 * CONFIGURATION CENTRALISÉE DES CHEMINS - Phase 11
 * 
 * Tous les chemins utilisés par les scripts en un seul endroit
 * Évite la duplication de process.cwd() dans writeFileAtomic
 */

export const PATHS = {
  // Données principales
  ARTICLES: 'public/data/articles.json',
  CONNECTIONS: 'public/data/connections.json',
  EMBEDDINGS: 'public/data/embeddings.json',
  
  // Données d'entrée
  INPUT_DATA: 'input_data/',
  INPUT_BIBLIO_1: 'input_data/20250815_bibliographie_corrigee_full.json',
  INPUT_BIBLIO_2: 'input_data/20250815_new_articles_corrected_FINAL.json',
  
  // Configuration et calibrage
  GROUND_TRUTH_PATTERNS: 'scripts/ground_truth_patterns.json',
  SEMANTIC_CALIBRATION: 'scripts/semantic_calibration.json',
  
  // Backups organisés (structure projet existante)
  BACKUP_DIR: '.backups/',
  BACKUP_CURRENT: '.backups/current/',
  BACKUP_DAILY: '.backups/daily/',
  BACKUP_MILESTONES: '.backups/milestones/',
  BACKUP_TESTS: '.backups/tests/',
  BACKUP_SECURITY: '.backups/current/data_security_backup/'
} as const

/**
 * Utilitaire pour construire chemins dynamiques
 */
export function buildPath(base: keyof typeof PATHS, ...parts: string[]): string {
  return [PATHS[base], ...parts].join('/')
}

/**
 * Chemins avec timestamp pour backup
 */
export function getBackupPath(filename: string, type: 'current' | 'daily' | 'milestone' = 'current'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseName = filename.replace('.json', '')
  
  switch (type) {
    case 'current':
      return `${PATHS.BACKUP_CURRENT}${filename}`
    case 'daily': {
      const date = new Date().toISOString().split('T')[0]
      return `${PATHS.BACKUP_DAILY}${date}/${baseName}-${timestamp}.json`
    }
    case 'milestone':
      return `${PATHS.BACKUP_MILESTONES}${baseName}-${timestamp}.json`
    default:
      return `${PATHS.BACKUP_DIR}${baseName}-${timestamp}.json`
  }
}

/**
 * Backup sécurité pipeline (horodaté)
 */
export function getPipelineBackupPath(filename: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${PATHS.BACKUP_SECURITY}${filename}.${timestamp}.pipeline-backup`
}