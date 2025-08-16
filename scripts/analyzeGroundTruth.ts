#!/usr/bin/env tsx
/**
 * ANALYSE GROUND TRUTH - Patterns validation manuelle
 *
 * Analyse connected_articles + suggested_connections
 * Calibre système sémantique sur validation humaine
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { ValidatedArticle } from './zodSchemas.js'
import { writeFileAtomic } from './writeFileAtomic.js'

type ConnectionType = 'builds_on' | 'contradicts' | 'implements' | 'questions' | 'similar_to'

interface GroundTruthPatterns {
  // Patterns connected_articles (hard connections)
  hard_connections: {
    total_count: number
    average_per_article: number
    domain_distribution: Record<string, number>
    articles_with_hard_connections: number
  }

  // Patterns suggested_connections (validations manuelles)  
  manual_validations: {
    total_count: number
    type_distribution: Record<ConnectionType, number>
    strength_by_type: Record<ConnectionType, { min: number, max: number, avg: number }>
    confidence_by_type: Record<ConnectionType, { min: number, max: number, avg: number }>
    
    // Patterns sémantiques par type
    builds_on_patterns: {
      common_reasoning_keywords: string[]
      typical_domain_flows: string[]
      strength_range: [number, number]
    }
    
    contradicts_patterns: {
      common_reasoning_keywords: string[]
      controversy_correlation: number
      strength_range: [number, number]
    }
    
    implements_patterns: {
      common_reasoning_keywords: string[]
      domain_bridges: string[]
      strength_range: [number, number]
    }
    
    questions_patterns: {
      common_reasoning_keywords: string[]
      complexity_correlation: number
      strength_range: [number, number]
    }
    
    similar_to_patterns: {
      common_reasoning_keywords: string[]
      same_domain_ratio: number
      strength_range: [number, number]
    }
  }

  // Patterns croisés pour calibrage sémantique
  semantic_calibration: {
    domain_pair_thresholds: Record<string, number>
    type_prediction_rules: Array<{
      condition: string
      predicted_type: ConnectionType
      confidence: number
    }>
    overall_stats: {
      articles_analyzed: number
      hard_vs_manual_ratio: number
      average_connections_per_article: number
    }
  }
}

interface SuggestedConnection {
  target_id: string
  type: string
  strength: number
  reasoning: string
  confidence: number
}

interface ArticleWithSuggestions {
  article: ValidatedArticle
  suggested_connections: SuggestedConnection[]
}

/**
 * Analyser les fichiers input_data pour extraire patterns ground truth
 */
async function analyzeGroundTruth(): Promise<GroundTruthPatterns> {
  console.log('🔍 Analyse des patterns ground truth...')

  // 1. Charger données existantes
  const articlesPath = join(process.cwd(), 'public', 'data', 'articles.json')
  const inputData1Path = join(process.cwd(), 'input_data', '20250815_bibliographie_corrigee_full.json')
  const inputData2Path = join(process.cwd(), 'input_data', '20250815_new_articles_corrected_FINAL.json')

  const existingArticlesRaw = JSON.parse(readFileSync(articlesPath, 'utf8'))
  const existingArticles: ValidatedArticle[] = existingArticlesRaw.articles || []
  
  const inputData1Raw = JSON.parse(readFileSync(inputData1Path, 'utf8'))
  const inputData2Raw = JSON.parse(readFileSync(inputData2Path, 'utf8'))
  
  const allInputData = [...inputData1Raw, ...inputData2Raw] as ArticleWithSuggestions[]

  console.log(`📊 Articles existants: ${existingArticles.length}`)
  console.log(`📊 Articles avec suggestions: ${allInputData.length}`)

  // 2. Analyser hard connections (connected_articles)
  const hardConnectionsStats = analyzeHardConnections(existingArticles)
  
  // 3. Analyser manual validations (suggested_connections)
  const manualValidationsStats = analyzeManualValidations(allInputData, existingArticles)
  
  // 4. Calibrage sémantique croisé
  const semanticCalibration = generateSemanticCalibration(allInputData, existingArticles, manualValidationsStats)

  return {
    hard_connections: hardConnectionsStats,
    manual_validations: manualValidationsStats,
    semantic_calibration: semanticCalibration
  }
}

/**
 * Analyser les connected_articles (hard connections)
 */
function analyzeHardConnections(articles: ValidatedArticle[]) {
  console.log('📋 Analyse hard connections (connected_articles)...')
  
  const totalConnections = articles.reduce((sum, art) => sum + (art.connected_articles?.length || 0), 0)
  const articlesWithConnections = articles.filter(art => art.connected_articles && art.connected_articles.length > 0).length
  
  // Distribution par domaine primaire
  const domainDistribution: Record<string, number> = {}
  articles.forEach(article => {
    const domain = article.primary_domain
    if (!domainDistribution[domain]) domainDistribution[domain] = 0
    domainDistribution[domain] += article.connected_articles?.length || 0
  })

  return {
    total_count: totalConnections,
    average_per_article: totalConnections / Math.max(articles.length, 1),
    domain_distribution: domainDistribution,
    articles_with_hard_connections: articlesWithConnections
  }
}

/**
 * Analyser les suggested_connections (manual validations)  
 */
function analyzeManualValidations(inputData: ArticleWithSuggestions[], _existingArticles: ValidatedArticle[]) {
  console.log('📋 Analyse manual validations (suggested_connections)...')
  
  // Flatten toutes les suggested_connections
  const allSuggestions: Array<SuggestedConnection & { source_article: ValidatedArticle }> = []
  
  inputData.forEach(item => {
    if (item.suggested_connections) {
      item.suggested_connections.forEach(suggestion => {
        allSuggestions.push({
          ...suggestion,
          source_article: item.article
        })
      })
    }
  })

  console.log(`📊 Suggestions trouvées: ${allSuggestions.length}`)

  // Analyse par type (après mapping relates_to)
  const typeDistribution: Record<ConnectionType, number> = {
    builds_on: 0,
    contradicts: 0, 
    implements: 0,
    questions: 0,
    similar_to: 0
  }

  const strengthByType: Record<ConnectionType, number[]> = {
    builds_on: [],
    contradicts: [],
    implements: [],
    questions: [],
    similar_to: []
  }

  const confidenceByType: Record<ConnectionType, number[]> = {
    builds_on: [],
    contradicts: [],
    implements: [],
    questions: [],
    similar_to: []
  }

  // Collecte patterns linguistiques par type
  const reasoningByType: Record<ConnectionType, string[]> = {
    builds_on: [],
    contradicts: [],
    implements: [],
    questions: [],
    similar_to: []
  }

  allSuggestions.forEach(suggestion => {
    // Mapping intelligent relates_to -> type spécifique
    const mappedType = mapRelatesTo(suggestion.type, suggestion.reasoning, suggestion.source_article)
    
    typeDistribution[mappedType]++
    strengthByType[mappedType].push(suggestion.strength)
    confidenceByType[mappedType].push(suggestion.confidence)
    reasoningByType[mappedType].push(suggestion.reasoning.toLowerCase())
  })

  // Calculer statistiques par type
  const strengthStats = Object.entries(strengthByType).reduce((acc, [type, values]) => {
    if (values.length > 0) {
      acc[type as ConnectionType] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((s, v) => s + v, 0) / values.length
      }
    } else {
      acc[type as ConnectionType] = { min: 0, max: 0, avg: 0 }
    }
    return acc
  }, {} as Record<ConnectionType, { min: number, max: number, avg: number }>)

  const confidenceStats = Object.entries(confidenceByType).reduce((acc, [type, values]) => {
    if (values.length > 0) {
      acc[type as ConnectionType] = {
        min: Math.min(...values),
        max: Math.max(...values), 
        avg: values.reduce((s, v) => s + v, 0) / values.length
      }
    } else {
      acc[type as ConnectionType] = { min: 0, max: 0, avg: 0 }
    }
    return acc
  }, {} as Record<ConnectionType, { min: number, max: number, avg: number }>)

  // Extraire patterns par type
  const buildsOnPatterns = extractPatterns('builds_on', reasoningByType.builds_on, strengthByType.builds_on)
  const contradictsPatterns = extractPatterns('contradicts', reasoningByType.contradicts, strengthByType.contradicts)
  const implementsPatterns = extractPatterns('implements', reasoningByType.implements, strengthByType.implements)
  const questionsPatterns = extractPatterns('questions', reasoningByType.questions, strengthByType.questions)
  const similarToPatterns = extractPatterns('similar_to', reasoningByType.similar_to, strengthByType.similar_to)

  return {
    total_count: allSuggestions.length,
    type_distribution: typeDistribution,
    strength_by_type: strengthStats,
    confidence_by_type: confidenceStats,
    builds_on_patterns: buildsOnPatterns.builds_on_patterns || {
      common_reasoning_keywords: [],
      typical_domain_flows: [],
      strength_range: [0, 0] as [number, number]
    },
    contradicts_patterns: contradictsPatterns.contradicts_patterns || {
      common_reasoning_keywords: [],
      controversy_correlation: 0.6,
      strength_range: [0, 0] as [number, number]
    },
    implements_patterns: implementsPatterns.implements_patterns || {
      common_reasoning_keywords: [],
      domain_bridges: [],
      strength_range: [0, 0] as [number, number]
    },
    questions_patterns: questionsPatterns.questions_patterns || {
      common_reasoning_keywords: [],
      complexity_correlation: 0.4,
      strength_range: [0, 0] as [number, number]
    },
    similar_to_patterns: similarToPatterns.similar_to_patterns || {
      common_reasoning_keywords: [],
      same_domain_ratio: 0.7,
      strength_range: [0, 0] as [number, number]
    }
  }
}

/**
 * Mapper relates_to vers type spécifique basé sur reasoning
 */
function mapRelatesTo(originalType: string, reasoning: string, _sourceArticle: ValidatedArticle): ConnectionType {
  if (originalType !== 'relates_to') {
    // Si déjà typé spécifiquement, préserver
    return originalType as ConnectionType
  }

  const reasoningLower = reasoning.toLowerCase()

  // Patterns linguistiques pour classification
  if (reasoningLower.includes('s\'appuie') || reasoningLower.includes('base sur') || 
      reasoningLower.includes('référence') || reasoningLower.includes('cite') ||
      reasoningLower.includes('fondamental')) {
    return 'builds_on'
  }

  if (reasoningLower.includes('tension') || reasoningLower.includes('fragilise') ||
      reasoningLower.includes('limite') || reasoningLower.includes('conflictualité') ||
      reasoningLower.includes('contredit')) {
    return 'contradicts'
  }

  if (reasoningLower.includes('applique') || reasoningLower.includes('concrétise') ||
      reasoningLower.includes('opérationnalise') || reasoningLower.includes('implémente') ||
      reasoningLower.includes('technique') && reasoningLower.includes('théorique')) {
    return 'implements'
  }

  if (reasoningLower.includes('questionne') || reasoningLower.includes('interroge') ||
      reasoningLower.includes('approfondit') || reasoningLower.includes('explore')) {
    return 'questions'
  }

  // Fallback: similar_to
  return 'similar_to'
}

/**
 * Extraire patterns linguistiques et statistiques par type
 */
function extractPatterns(type: ConnectionType, reasonings: string[], strengths: number[]) {
  // Mots-clés communs
  const allWords = reasonings.join(' ').split(/\s+/).filter(w => w.length > 3)
  const wordFreq: Record<string, number> = {}
  allWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })
  
  const commonKeywords = Object.entries(wordFreq)
    .filter(([, freq]) => freq >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)

  const strengthRange: [number, number] = strengths.length > 0 
    ? [Math.min(...strengths), Math.max(...strengths)]
    : [0, 0]

  const patternData = {
    common_reasoning_keywords: commonKeywords,
    strength_range: strengthRange
  }

  switch (type) {
    case 'builds_on':
      return {
        builds_on_patterns: {
          ...patternData,
          typical_domain_flows: ['recherche→technique', 'technique→ethique']
        }
      }
    case 'contradicts':
      return {
        contradicts_patterns: {
          ...patternData,
          controversy_correlation: 0.6
        }
      }
    case 'implements':
      return {
        implements_patterns: {
          ...patternData,
          domain_bridges: ['technique→ethique', 'ethique→technique']
        }
      }
    case 'questions':
      return {
        questions_patterns: {
          ...patternData,
          complexity_correlation: 0.4
        }
      }
    case 'similar_to':
      return {
        similar_to_patterns: {
          ...patternData,
          same_domain_ratio: 0.7
        }
      }
    default:
      return {}
  }
}

/**
 * Générer calibrage sémantique pour connexions auto_detected  
 */
function generateSemanticCalibration(
  inputData: ArticleWithSuggestions[], 
  existingArticles: ValidatedArticle[],
  manualStats: any
) {
  console.log('🎯 Génération calibrage sémantique...')

  // Analyser seuils par paires de domaines
  const domainPairThresholds: Record<string, number> = {}
  
  // À partir des suggested_connections, calculer seuils optimaux
  const pairAnalysis: Record<string, { strengths: number[], count: number }> = {}
  
  inputData.forEach(item => {
    if (item.suggested_connections) {
      item.suggested_connections.forEach(suggestion => {
        // Trouver target article pour analyser domaine  
        const targetArticle = existingArticles.find(a => a.id === suggestion.target_id) ||
                             inputData.find(d => d.article.id === suggestion.target_id)?.article
        
        if (targetArticle) {
          const pairKey = [item.article.primary_domain, targetArticle.primary_domain].sort().join('-')
          
          if (!pairAnalysis[pairKey]) {
            pairAnalysis[pairKey] = { strengths: [], count: 0 }
          }
          
          pairAnalysis[pairKey].strengths.push(suggestion.strength)
          pairAnalysis[pairKey].count++
        }
      })
    }
  })

  // Calculer seuils recommandés (percentile 25 pour être sélectif)
  Object.entries(pairAnalysis).forEach(([pair, data]) => {
    if (data.strengths.length >= 2) {
      data.strengths.sort((a, b) => a - b)
      const p25Index = Math.floor(data.strengths.length * 0.25)
      domainPairThresholds[pair] = Math.max(0.3, data.strengths[p25Index]) // Minimum 0.3
    }
  })

  // Règles de prédiction de type basées sur patterns
  const typePredictionRules = [
    {
      condition: 'contains_citation_keywords',
      predicted_type: 'builds_on' as ConnectionType,
      confidence: 0.8
    },
    {
      condition: 'contains_conflict_keywords', 
      predicted_type: 'contradicts' as ConnectionType,
      confidence: 0.75
    },
    {
      condition: 'cross_domain_technical',
      predicted_type: 'implements' as ConnectionType,
      confidence: 0.7
    },
    {
      condition: 'contains_questioning_keywords',
      predicted_type: 'questions' as ConnectionType,
      confidence: 0.65
    }
  ]

  const overallStats = {
    articles_analyzed: existingArticles.length + inputData.length,
    hard_vs_manual_ratio: manualStats.total_count > 0 
      ? (existingArticles.reduce((sum, a) => sum + (a.connected_articles?.length || 0), 0) / manualStats.total_count)
      : 0,
    average_connections_per_article: (manualStats.total_count + 
      existingArticles.reduce((sum, a) => sum + (a.connected_articles?.length || 0), 0)) / 
      Math.max(existingArticles.length, 1)
  }

  return {
    domain_pair_thresholds: domainPairThresholds,
    type_prediction_rules: typePredictionRules,
    overall_stats: overallStats
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    console.log('🚀 Démarrage analyse ground truth patterns')
    
    const patterns = await analyzeGroundTruth()
    
    // Sauvegarder résultats  
    const outputPath = join(process.cwd(), 'scripts', 'ground_truth_patterns.json')
    await writeFileAtomic(outputPath, JSON.stringify(patterns, null, 2))
    
    console.log('✅ Analyse terminée')
    console.log(`📄 Résultats sauvegardés: ${outputPath}`)
    
    // Afficher résumé
    console.log('\n📊 RÉSUMÉ ANALYSE:')
    console.log(`📌 Hard connections: ${patterns.hard_connections.total_count} (${patterns.hard_connections.articles_with_hard_connections} articles)`)
    console.log(`📌 Manual validations: ${patterns.manual_validations.total_count}`)
    console.log(`📌 Domain pairs calibrés: ${Object.keys(patterns.semantic_calibration.domain_pair_thresholds).length}`)
    console.log(`📌 Type distribution:`)
    
    Object.entries(patterns.manual_validations.type_distribution).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} (${Math.round(count/patterns.manual_validations.total_count*100)}%)`)
    })
    
  } catch (error) {
    console.error('❌ Erreur analyse ground truth:', error)
    process.exit(1)
  }
}

// Exécuter directement
main()

export { analyzeGroundTruth, type GroundTruthPatterns }