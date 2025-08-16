#!/usr/bin/env tsx
/**
 * CALIBRAGE SEUILS SÉMANTIQUES
 *
 * Utilise validations manuelles pour calibrer détection automatique
 * Focus auto_detected = true avec qualité proche validation humaine
 */

import { readFileSync } from 'fs'
import { join } from 'path'
// import { ValidatedArticle } from './zodSchemas.js'
import { writeFileAtomic } from './writeFileAtomic.js'
import { analyzeGroundTruth, type GroundTruthPatterns } from './analyzeGroundTruth.js'

type ConnectionType = 'builds_on' | 'contradicts' | 'implements' | 'questions' | 'similar_to'

interface SemanticCalibration {
  // Seuils par combinaison domaines (pour similarité cosinus)
  domain_thresholds: {
    [key: string]: number  // 'technique-technique': 0.45, 'technique-ethique': 0.32, etc.
  }

  // Ajustements force par type (calibrés sur ground truth)
  strength_adjustments: {
    [K in ConnectionType]: {
      base_multiplier: number
      min_threshold: number
      special_boost?: number
      boost_condition?: string
    }
  }

  // Détecteurs de patterns (appris du ground truth)
  pattern_detectors: {
    conflictuality_indicators: string[]
    citation_indicators: string[]
    bridge_indicators: string[]
    questioning_indicators: string[]
    similarity_indicators: string[]
  }

  // Configuration de calibrage
  calibration_config: {
    target_precision: number
    target_recall: number
    max_connections_per_article: number
    diversity_balance_weights: Record<ConnectionType, number>
  }

  // Métriques de validation
  validation_metrics: {
    tested_pairs: number
    precision_by_type: Record<ConnectionType, number>
    optimal_threshold_found: boolean
    ground_truth_coverage: number
  }
}

/**
 * Calibrer les seuils sémantiques basés sur ground truth
 */
async function calibrateSemanticThresholds(): Promise<SemanticCalibration> {
  console.log('🎯 Calibrage des seuils sémantiques...')

  // 1. Charger patterns ground truth
  let patterns: GroundTruthPatterns
  try {
    const patternsPath = join(process.cwd(), 'scripts', 'ground_truth_patterns.json')
    patterns = JSON.parse(readFileSync(patternsPath, 'utf8'))
    console.log('📊 Patterns ground truth chargés')
  } catch {
    console.log('📊 Patterns non trouvés, génération...')
    patterns = await analyzeGroundTruth()
  }

  // 2. Calibrer seuils par domaine
  const domainThresholds = calibrateDomainThresholds(patterns)
  
  // 3. Ajuster multiplicateurs par type
  const strengthAdjustments = calibrateStrengthAdjustments(patterns)
  
  // 4. Extraire détecteurs de patterns
  const patternDetectors = extractPatternDetectors(patterns)
  
  // 5. Configuration optimale
  const calibrationConfig = generateOptimalConfig(patterns)
  
  // 6. Validation empirique
  const validationMetrics = validateCalibration(patterns, domainThresholds, strengthAdjustments)

  const calibration: SemanticCalibration = {
    domain_thresholds: domainThresholds,
    strength_adjustments: strengthAdjustments,
    pattern_detectors: patternDetectors,
    calibration_config: calibrationConfig,
    validation_metrics: validationMetrics
  }

  return calibration
}

/**
 * Calibrer seuils par paire de domaines
 */
function calibrateDomainThresholds(patterns: GroundTruthPatterns): Record<string, number> {
  console.log('🔧 Calibrage seuils domaines...')
  
  const baseThresholds = patterns.semantic_calibration.domain_pair_thresholds
  const calibratedThresholds: Record<string, number> = {}

  // Ajuster seuils basés sur distribution manual validations
  const avgStrength = Object.values(patterns.manual_validations.strength_by_type)
    .reduce((acc, stats) => acc + stats.avg, 0) / 5

  console.log(`📊 Force moyenne validations manuelles: ${avgStrength.toFixed(3)}`)

  // Seuils spécialisés par type de paire
  const domainPairStrategies: Record<string, number> = {
    // Intra-domaine: plus strict (redondance limitée)
    'technique-technique': 0.45,
    'ethique-ethique': 0.42,
    'recherche-recherche': 0.48,
    'philosophie-philosophie': 0.40,
    'usage_professionnel-usage_professionnel': 0.45,
    'frugalite-frugalite': 0.40,
    
    // Inter-domaine: plus généreux (ponts essentiels)
    'technique-ethique': 0.32,
    'ethique-technique': 0.32,
    'technique-usage_professionnel': 0.35,
    'usage_professionnel-technique': 0.35,
    'recherche-technique': 0.35,
    'technique-recherche': 0.35,
    'ethique-philosophie': 0.30,
    'philosophie-ethique': 0.30,
    'ethique-usage_professionnel': 0.28,
    'usage_professionnel-ethique': 0.28,
    'frugalite-technique': 0.33,
    'technique-frugalite': 0.33,
    'frugalite-ethique': 0.30,
    'ethique-frugalite': 0.30
  }

  // Appliquer stratégies + calibrage ground truth
  Object.entries(domainPairStrategies).forEach(([pair, baseThreshold]) => {
    const groundTruthAdjustment = baseThresholds[pair] || baseThreshold
    
    // Moyenne pondérée: 70% stratégie, 30% ground truth
    calibratedThresholds[pair] = (baseThreshold * 0.7) + (groundTruthAdjustment * 0.3)
    
    // Borner entre 0.25 et 0.55 pour robustesse
    calibratedThresholds[pair] = Math.max(0.25, Math.min(0.55, calibratedThresholds[pair]))
  })

  console.log(`✅ ${Object.keys(calibratedThresholds).length} paires de domaines calibrées`)
  return calibratedThresholds
}

/**
 * Calibrer ajustements de force par type connexion
 */
function calibrateStrengthAdjustments(patterns: GroundTruthPatterns): SemanticCalibration['strength_adjustments'] {
  console.log('🔧 Calibrage ajustements force...')

  const manualStats = patterns.manual_validations

  return {
    builds_on: {
      base_multiplier: 1.0,
      min_threshold: Math.max(0.4, manualStats.strength_by_type.builds_on?.avg * 0.8 || 0.4),
      special_boost: 0.1,
      boost_condition: 'citation_detected'
    },
    
    contradicts: {
      base_multiplier: 0.9,
      min_threshold: Math.max(0.35, manualStats.strength_by_type.contradicts?.avg * 0.75 || 0.35),
      special_boost: 0.15,
      boost_condition: 'controversy_gap'
    },
    
    implements: {
      base_multiplier: 1.1,
      min_threshold: Math.max(0.38, manualStats.strength_by_type.implements?.avg * 0.8 || 0.38),
      special_boost: 0.1,
      boost_condition: 'domain_bridge'
    },
    
    questions: {
      base_multiplier: 0.8,
      min_threshold: Math.max(0.32, manualStats.strength_by_type.questions?.avg * 0.75 || 0.32),
      special_boost: 0.1,
      boost_condition: 'complexity_gap'
    },
    
    similar_to: {
      base_multiplier: 1.0,
      min_threshold: Math.max(0.35, manualStats.strength_by_type.similar_to?.avg * 0.8 || 0.35),
      special_boost: -0.05,
      boost_condition: 'same_domain_penalty'
    }
  }
}

/**
 * Extraire détecteurs de patterns du ground truth
 */
function extractPatternDetectors(patterns: GroundTruthPatterns): SemanticCalibration['pattern_detectors'] {
  console.log('🔧 Extraction détecteurs patterns...')

  const manual = patterns.manual_validations

  return {
    conflictuality_indicators: [
      'tension', 'fragilise', 'limite', 'conflictualité', 'contredit', 'opposition',
      'challenge', 'remets en question', 'problématise',
      ...(manual.contradicts_patterns?.common_reasoning_keywords || []).slice(0, 5)
    ],
    
    citation_indicators: [
      's\'appuie', 'base sur', 'référence', 'cite', 'fondamental', 'reprend',
      'utilise', 'applique', 'theoretical foundation',
      ...(manual.builds_on_patterns?.common_reasoning_keywords || []).slice(0, 5)
    ],
    
    bridge_indicators: [
      'applique', 'concrétise', 'opérationnalise', 'implémente', 'traduit',
      'technique', 'théorique', 'pratique', 'mise en œuvre',
      ...(manual.implements_patterns?.common_reasoning_keywords || []).slice(0, 5)
    ],
    
    questioning_indicators: [
      'questionne', 'interroge', 'approfondit', 'explore', 'examine',
      'soulève', 'discute', 'analyse', 'considère',
      ...(manual.questions_patterns?.common_reasoning_keywords || []).slice(0, 5)
    ],
    
    similarity_indicators: [
      'similaire', 'proche', 'même notion', 'comparable', 'analogue',
      'ressemble', 'équivalent', 'parallèle', 'connexe',
      ...(manual.similar_to_patterns?.common_reasoning_keywords || []).slice(0, 5)
    ]
  }
}

/**
 * Générer configuration optimale basée sur ground truth
 */
function generateOptimalConfig(patterns: GroundTruthPatterns): SemanticCalibration['calibration_config'] {
  const totalConnections = patterns.hard_connections.total_count + patterns.manual_validations.total_count
  const totalArticles = patterns.semantic_calibration.overall_stats.articles_analyzed

  // Distribution cible basée sur manual validations observées
  const manualDistrib = patterns.manual_validations.type_distribution
  const totalManual = patterns.manual_validations.total_count

  const targetWeights: Record<ConnectionType, number> = {
    builds_on: (manualDistrib.builds_on || 0) / totalManual || 0.25,
    similar_to: (manualDistrib.similar_to || 0) / totalManual || 0.30,
    implements: (manualDistrib.implements || 0) / totalManual || 0.20,
    questions: (manualDistrib.questions || 0) / totalManual || 0.15,
    contradicts: (manualDistrib.contradicts || 0) / totalManual || 0.10
  }

  return {
    target_precision: 0.72,  // Basé sur analyse: équilibre précision/couverture
    target_recall: 0.65,     // Acceptable pour exploration
    max_connections_per_article: Math.ceil(totalConnections / Math.max(totalArticles, 1)) + 2,
    diversity_balance_weights: targetWeights
  }
}

/**
 * Valider calibrage avec métriques empiriques
 */
function validateCalibration(
  patterns: GroundTruthPatterns,
  domainThresholds: Record<string, number>,
  strengthAdjustments: SemanticCalibration['strength_adjustments']
): SemanticCalibration['validation_metrics'] {
  console.log('🔬 Validation empirique calibrage...')

  // Métriques simplifiées (validation complète dans enhanceGroundTruth)
  const testedPairs = Object.keys(domainThresholds).length
  const groundTruthCoverage = Object.keys(patterns.semantic_calibration.domain_pair_thresholds).length / Math.max(testedPairs, 1)

  // Estimation précision par type (basé sur seuils vs manual stats)
  const precisionByType: Record<ConnectionType, number> = {} as Record<ConnectionType, number>
  
  Object.entries(patterns.manual_validations.strength_by_type).forEach(([type, stats]) => {
    const adjustment = strengthAdjustments[type as ConnectionType]
    if (adjustment && stats.avg > 0) {
      // Heuristique: précision estimée basée sur écart seuil vs moyenne manuelle
      const threshold = adjustment.min_threshold
      const avgManual = stats.avg
      const precision = Math.max(0.4, Math.min(0.9, 1 - Math.abs(threshold - avgManual)))
      precisionByType[type as ConnectionType] = precision
    } else {
      precisionByType[type as ConnectionType] = 0.6  // Fallback conservateur
    }
  })

  return {
    tested_pairs: testedPairs,
    precision_by_type: precisionByType,
    optimal_threshold_found: testedPairs >= 6 && groundTruthCoverage > 0.5,
    ground_truth_coverage: groundTruthCoverage
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    console.log('🚀 Démarrage calibrage seuils sémantiques')
    
    const calibration = await calibrateSemanticThresholds()
    
    // Sauvegarder configuration calibrée
    const outputPath = join(process.cwd(), 'scripts', 'semantic_calibration.json')
    await writeFileAtomic(outputPath, JSON.stringify(calibration, null, 2))
    
    console.log('✅ Calibrage terminé')
    console.log(`📄 Configuration sauvegardée: ${outputPath}`)
    
    // Afficher résumé
    console.log('\n📊 RÉSUMÉ CALIBRAGE:')
    console.log(`📌 Paires domaines calibrées: ${Object.keys(calibration.domain_thresholds).length}`)
    console.log(`📌 Seuils par type:`)
    
    Object.entries(calibration.strength_adjustments).forEach(([type, config]) => {
      console.log(`   - ${type}: seuil ${config.min_threshold.toFixed(3)}, mult ${config.base_multiplier}`)
    })
    
    console.log(`📌 Précision estimée:`)
    Object.entries(calibration.validation_metrics.precision_by_type).forEach(([type, precision]) => {
      console.log(`   - ${type}: ${Math.round(precision * 100)}%`)
    })
    
    const avgPrecision = Object.values(calibration.validation_metrics.precision_by_type)
      .reduce((acc, p) => acc + p, 0) / 5
    console.log(`📌 Précision moyenne: ${Math.round(avgPrecision * 100)}%`)
    
  } catch (error) {
    console.error('❌ Erreur calibrage sémantique:', error)
    process.exit(1)
  }
}

// Exécuter directement
main()

export { calibrateSemanticThresholds, type SemanticCalibration }