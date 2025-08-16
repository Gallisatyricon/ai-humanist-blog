#!/usr/bin/env tsx
/**
 * ENHANCEMENT GROUND TRUTH - Architecture Triple Optimisée
 *
 * 1. Connected_articles (hard) - auto_detected = false, strength = 0.9
 * 2. Suggested_connections (manual) - auto_detected = false, strength préservée
 * 3. Connexions sémantiques (auto) - auto_detected = true, pour équilibrage
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { ValidatedArticle } from './zodSchemas.js'
import { writeFileAtomic } from './writeFileAtomic.js'
import { calibrateSemanticThresholds, type SemanticCalibration } from './calibrateSemanticThresholds.js'

type ConnectionType = 'builds_on' | 'contradicts' | 'implements' | 'questions' | 'similar_to'

interface ConnectionEnriched {
  source_id: string
  target_id: string
  type: ConnectionType
  strength: number
  auto_detected: boolean
  reasoning: string
  source: 'hard_connection' | 'manual_validation' | 'semantic_auto'
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

interface EmbeddingData {
  embeddings: Array<{
    article_id: string
    embedding: number[]
    metadata: {
      title: string
      concepts: string[]
      domains: string[]
    }
  }>
}

/**
 * Architecture triple avec exploitation intelligente ground truth
 */
async function enrichConnectionsTriple(): Promise<ConnectionEnriched[]> {
  console.log('🏗️ Architecture triple: Hard + Manual + Semantic...')

  // 1. Charger données
  const articlesPath = join(process.cwd(), 'public', 'data', 'articles.json')
  const inputData1Path = join(process.cwd(), 'input_data', '20250815_bibliographie_corrigee_full.json')
  const inputData2Path = join(process.cwd(), 'input_data', '20250815_new_articles_corrected_FINAL.json')
  const embeddingsPath = join(process.cwd(), 'public', 'data', 'embeddings.json')

  const existingArticlesRaw = JSON.parse(readFileSync(articlesPath, 'utf8'))
  const articles: ValidatedArticle[] = existingArticlesRaw.articles || []
  
  const inputData1Raw = JSON.parse(readFileSync(inputData1Path, 'utf8'))
  const inputData2Raw = JSON.parse(readFileSync(inputData2Path, 'utf8'))
  const allInputData = [...inputData1Raw, ...inputData2Raw] as ArticleWithSuggestions[]

  let embeddingData: EmbeddingData
  try {
    embeddingData = JSON.parse(readFileSync(embeddingsPath, 'utf8'))
  } catch {
    console.log('⚠️ Embeddings non trouvés, connexions sémantiques limitées')
    embeddingData = { embeddings: [] }
  }

  // 2. Charger calibrage sémantique
  let calibration: SemanticCalibration
  try {
    const calibrationPath = join(process.cwd(), 'scripts', 'semantic_calibration.json')
    calibration = JSON.parse(readFileSync(calibrationPath, 'utf8'))
  } catch {
    console.log('🎯 Calibration non trouvée, génération...')
    calibration = await calibrateSemanticThresholds()
  }

  // 3. HARD CONNECTIONS (priorité absolue)
  console.log('📌 Extraction hard connections...')
  const hardConnections = extractHardConnections(articles)

  // 4. MANUAL VALIDATIONS (suggested_connections)
  console.log('📌 Extraction manual validations...')
  const manualConnections = extractManualValidations(allInputData, articles, calibration)

  // 5. TRACK EXISTING pour éviter doublons
  const existingPairs = new Set([...hardConnections, ...manualConnections]
    .map(c => `${c.source_id}-${c.target_id}`))
  
  console.log(`🔗 ${existingPairs.size} paires existantes (hard + manual)`)

  // 6. SEMANTIC FILL (auto_detected = true)
  console.log('📌 Génération connexions sémantiques...')
  const semanticConnections = await generateSemanticConnections(
    articles,
    existingPairs,
    embeddingData,
    calibration
  )

  const allConnections = [...hardConnections, ...manualConnections, ...semanticConnections]
  
  console.log('✅ Architecture triple complète:')
  console.log(`   - Hard: ${hardConnections.length}`)
  console.log(`   - Manual: ${manualConnections.length}`)
  console.log(`   - Semantic: ${semanticConnections.length}`)
  console.log(`   - Total: ${allConnections.length}`)

  return allConnections
}

/**
 * Extraire connected_articles comme hard connections
 */
function extractHardConnections(articles: ValidatedArticle[]): ConnectionEnriched[] {
  const connections: ConnectionEnriched[] = []

  articles.forEach(article => {
    if (article.connected_articles && article.connected_articles.length > 0) {
      article.connected_articles.forEach(targetId => {
        // Vérifier que l'article target existe
        const targetExists = articles.some(a => a.id === targetId)
        if (targetExists) {
          connections.push({
            source_id: article.id,
            target_id: targetId,
            type: 'builds_on',  // Type par défaut pour hard connections
            strength: 0.9,      // Force élevée pour connections pré-validées
            auto_detected: false,
            reasoning: 'Connexion directe pré-validée lors de création article',
            source: 'hard_connection'
          })
        }
      })
    }
  })

  return connections
}

/**
 * Extraire et mapper suggested_connections intelligemment
 */
function extractManualValidations(
  inputData: ArticleWithSuggestions[],
  articles: ValidatedArticle[],
  calibration: SemanticCalibration
): ConnectionEnriched[] {
  const connections: ConnectionEnriched[] = []

  inputData.forEach(item => {
    if (item.suggested_connections && item.suggested_connections.length > 0) {
      item.suggested_connections.forEach(suggestion => {
        // Vérifier que target existe
        const targetExists = articles.some(a => a.id === suggestion.target_id) ||
                            inputData.some(d => d.article.id === suggestion.target_id)
        
        if (targetExists) {
          // Mapping intelligent relates_to
          const mappedType = mapSuggestedConnectionType(
            item.article,
            findArticleById(suggestion.target_id, articles, inputData),
            suggestion,
            calibration
          )

          connections.push({
            source_id: item.article.id,
            target_id: suggestion.target_id,
            type: mappedType,
            strength: suggestion.strength,  // Préserver force originale
            auto_detected: false,           // Manual validation
            reasoning: suggestion.reasoning,
            source: 'manual_validation'
          })
        }
      })
    }
  })

  return connections
}

/**
 * Mapping intelligent relates_to basé sur patterns ground truth
 */
function mapSuggestedConnectionType(
  sourceArticle: ValidatedArticle,
  targetArticle: ValidatedArticle | null,
  suggested: SuggestedConnection,
  calibration: SemanticCalibration
): ConnectionType {
  if (suggested.type !== 'relates_to') {
    return suggested.type as ConnectionType  // Préserver types explicites
  }

  if (!targetArticle) return 'similar_to'  // Fallback sécurisé

  const reasoning = suggested.reasoning.toLowerCase()
  const detectors = calibration.pattern_detectors

  // Détection par patterns linguistiques
  
  // 1. BUILDS_ON - Citations/références
  if (detectors.citation_indicators.some(keyword => reasoning.includes(keyword))) {
    return 'builds_on'
  }

  // 2. CONTRADICTS - Conflictualité
  if (detectors.conflictuality_indicators.some(keyword => reasoning.includes(keyword))) {
    return 'contradicts'
  }

  // 3. IMPLEMENTS - Ponts technique↔théorique
  if (detectors.bridge_indicators.some(keyword => reasoning.includes(keyword)) ||
      isDomainBridge(sourceArticle, targetArticle)) {
    return 'implements'
  }

  // 4. QUESTIONS - Approfondissement
  if (detectors.questioning_indicators.some(keyword => reasoning.includes(keyword))) {
    return 'questions'
  }

  // 5. SIMILAR_TO - Fallback
  return 'similar_to'
}

/**
 * Détecter pont entre domaines
 */
function isDomainBridge(source: ValidatedArticle, target: ValidatedArticle): boolean {
  const technicalDomains = ['technique', 'recherche']
  const conceptualDomains = ['ethique', 'philosophie', 'usage_professionnel']
  
  const sourceTech = technicalDomains.includes(source.primary_domain)
  const targetTech = technicalDomains.includes(target.primary_domain)
  const sourceConcept = conceptualDomains.includes(source.primary_domain)
  const targetConcept = conceptualDomains.includes(target.primary_domain)

  // Pont si technique↔conceptuel
  return (sourceTech && targetConcept) || (sourceConcept && targetTech)
}

/**
 * Trouver article par ID dans collections
 */
function findArticleById(
  id: string, 
  articles: ValidatedArticle[], 
  inputData: ArticleWithSuggestions[]
): ValidatedArticle | null {
  return articles.find(a => a.id === id) || 
         inputData.find(d => d.article.id === id)?.article || 
         null
}

/**
 * Générer connexions sémantiques auto_detected = true
 */
async function generateSemanticConnections(
  articles: ValidatedArticle[],
  existingPairs: Set<string>,
  embeddingData: EmbeddingData,
  calibration: SemanticCalibration
): Promise<ConnectionEnriched[]> {
  const connections: ConnectionEnriched[] = []

  if (!embeddingData.embeddings || embeddingData.embeddings.length === 0) {
    console.log('⚠️ Pas d\'embeddings disponibles pour connexions sémantiques')
    return connections
  }

  // Map embeddings par article_id
  const embeddingsMap = new Map<string, number[]>()
  embeddingData.embeddings.forEach(emb => {
    embeddingsMap.set(emb.article_id, emb.embedding)
  })

  // Générer connexions pour articles avec embeddings
  for (let i = 0; i < articles.length; i++) {
    const sourceArticle = articles[i]
    const sourceEmbedding = embeddingsMap.get(sourceArticle.id)
    
    if (!sourceEmbedding) continue

    // Compter connexions existantes pour cet article
    const existingConnectionsCount = Array.from(existingPairs)
      .filter(pair => pair.startsWith(sourceArticle.id + '-') || pair.endsWith('-' + sourceArticle.id))
      .length

    // Limiter nouvelles connexions selon configuration
    const maxNewConnections = Math.max(
      0, 
      calibration.calibration_config.max_connections_per_article - existingConnectionsCount
    )

    if (maxNewConnections === 0) continue

    // Calculer similarités avec autres articles
    const similarities: Array<{ targetArticle: ValidatedArticle, similarity: number }> = []

    for (let j = 0; j < articles.length; j++) {
      if (i === j) continue

      const targetArticle = articles[j]
      const targetEmbedding = embeddingsMap.get(targetArticle.id)
      
      if (!targetEmbedding) continue

      // Vérifier si connexion existe déjà
      const pairKey1 = `${sourceArticle.id}-${targetArticle.id}`
      const pairKey2 = `${targetArticle.id}-${sourceArticle.id}`
      
      if (existingPairs.has(pairKey1) || existingPairs.has(pairKey2)) continue

      // Calculer similarité cosinus
      const similarity = cosineSimilarity(sourceEmbedding, targetEmbedding)
      
      // Appliquer seuil domaine-spécifique
      const domainPair = [sourceArticle.primary_domain, targetArticle.primary_domain].sort().join('-')
      const threshold = calibration.domain_thresholds[domainPair] || 0.35

      if (similarity >= threshold) {
        similarities.push({ targetArticle, similarity })
      }
    }

    // Trier par similarité et prendre les meilleurs
    similarities.sort((a, b) => b.similarity - a.similarity)
    const topSimilarities = similarities.slice(0, maxNewConnections)

    // Créer connexions sémantiques
    topSimilarities.forEach(({ targetArticle, similarity }) => {
      const connectionResult = classifySemanticConnection(
        sourceArticle,
        targetArticle,
        similarity,
        calibration
      )

      connections.push({
        source_id: sourceArticle.id,
        target_id: targetArticle.id,
        type: connectionResult.type,
        strength: connectionResult.strength,
        auto_detected: true,  // Connexion automatique
        reasoning: `Similarité sémantique ${similarity.toFixed(3)} (${connectionResult.type})`,
        source: 'semantic_auto'
      })
    })
  }

  return connections
}

/**
 * Classification sémantique auto_detected = true
 */
function classifySemanticConnection(
  sourceArticle: ValidatedArticle,
  targetArticle: ValidatedArticle,
  similarity: number,
  calibration: SemanticCalibration
): { type: ConnectionType, strength: number } {
  
  // 1. CONTRADICTS - Détection conflictualité
  if (detectConflictuality(sourceArticle, targetArticle, calibration)) {
    const adjustment = calibration.strength_adjustments.contradicts
    return { 
      type: 'contradicts', 
      strength: Math.min(similarity * adjustment.base_multiplier + (adjustment.special_boost || 0), 0.8) 
    }
  }

  // 2. IMPLEMENTS - Ponts technique↔théorique
  if (isDomainBridge(sourceArticle, targetArticle)) {
    const adjustment = calibration.strength_adjustments.implements
    return { 
      type: 'implements', 
      strength: similarity * adjustment.base_multiplier 
    }
  }

  // 3. QUESTIONS - Approfondissement (gap complexité)
  if (detectComplexityGap(sourceArticle, targetArticle)) {
    const adjustment = calibration.strength_adjustments.questions
    return { 
      type: 'questions', 
      strength: similarity * adjustment.base_multiplier 
    }
  }

  // 4. BUILDS_ON - Citations/auteurs similaires
  if (detectCitationPattern(sourceArticle, targetArticle)) {
    const adjustment = calibration.strength_adjustments.builds_on
    return { 
      type: 'builds_on', 
      strength: similarity * adjustment.base_multiplier 
    }
  }

  // 5. SIMILAR_TO par défaut
  const adjustment = calibration.strength_adjustments.similar_to
  const strength = similarity * adjustment.base_multiplier + (adjustment.special_boost || 0)
  
  return { type: 'similar_to', strength: Math.max(0.1, strength) }
}

/**
 * Utilitaires détection patterns
 */
function detectConflictuality(source: ValidatedArticle, target: ValidatedArticle, _calibration: SemanticCalibration): boolean {
  // Détection basée sur controversy_level gaps
  const sourceControversy = Math.max(...source.concepts.map(c => c.controversy_level || 0))
  const targetControversy = Math.max(...target.concepts.map(c => c.controversy_level || 0))
  
  return Math.abs(sourceControversy - targetControversy) >= 2
}

function detectComplexityGap(source: ValidatedArticle, target: ValidatedArticle): boolean {
  const complexityOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
  const gap = Math.abs(complexityOrder[source.complexity_level] - complexityOrder[target.complexity_level])
  return gap === 1  // Écart d'un niveau = questionnement/approfondissement
}

function detectCitationPattern(source: ValidatedArticle, target: ValidatedArticle): boolean {
  // Même auteur ou outils mentionnés similaires
  if (source.author && target.author && source.author === target.author) return true
  
  const sharedTools = source.tools_mentioned?.filter(tool => 
    target.tools_mentioned?.some(t => t.name === tool.name)
  ) || []
  
  return sharedTools.length > 0
}

/**
 * Utilitaire cosinus
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dot = 0, normA = 0, normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  const norm = Math.sqrt(normA) * Math.sqrt(normB)
  return norm > 0 ? dot / norm : 0
}

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    console.log('🚀 Démarrage enhancement ground truth - Architecture triple')
    
    const connections = await enrichConnectionsTriple()
    
    // Sauvegarder connexions enrichies
    const outputPath = join(process.cwd(), 'public', 'data', 'connections.json')
    
    const connectionsData = {
      connections: connections,
      generated_at: new Date().toISOString(),
      total_connections: connections.length,
      connection_index: generateConnectionIndex(connections),
      metadata: {
        architecture: 'triple',
        sources: {
          hard_connections: connections.filter(c => c.source === 'hard_connection').length,
          manual_validations: connections.filter(c => c.source === 'manual_validation').length,
          semantic_auto: connections.filter(c => c.source === 'semantic_auto').length
        },
        type_distribution: generateTypeDistribution(connections)
      }
    }
    
    await writeFileAtomic(outputPath, JSON.stringify(connectionsData, null, 2))
    
    console.log('✅ Enhancement terminé')
    console.log(`📄 Connexions sauvegardées: ${outputPath}`)
    
    // Afficher statistiques finales
    console.log('\n📊 STATISTIQUES FINALES:')
    console.log(`📌 Total connexions: ${connections.length}`)
    console.log(`📌 Par source:`)
    Object.entries(connectionsData.metadata.sources).forEach(([source, count]) => {
      console.log(`   - ${source}: ${count}`)
    })
    console.log(`📌 Par type:`)
    Object.entries(connectionsData.metadata.type_distribution).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`)
    })
    
  } catch (error) {
    console.error('❌ Erreur enhancement ground truth:', error)
    process.exit(1)
  }
}

/**
 * Utilitaires génération métadonnées
 */
function generateConnectionIndex(connections: ConnectionEnriched[]): Record<string, string[]> {
  const index: Record<string, string[]> = {}
  
  connections.forEach(conn => {
    if (!index[conn.source_id]) index[conn.source_id] = []
    if (!index[conn.target_id]) index[conn.target_id] = []
    
    index[conn.source_id].push(conn.target_id)
    index[conn.target_id].push(conn.source_id)
  })
  
  return index
}

function generateTypeDistribution(connections: ConnectionEnriched[]): Record<ConnectionType, number> {
  const distribution: Record<ConnectionType, number> = {
    builds_on: 0,
    contradicts: 0,
    implements: 0,
    questions: 0,
    similar_to: 0
  }
  
  connections.forEach(conn => {
    distribution[conn.type]++
  })
  
  return distribution
}

// Exécuter directement
main()

export { enrichConnectionsTriple, type ConnectionEnriched }