#!/usr/bin/env tsx
/**
 * RE-SCORING INTELLIGENT DES CONNEXIONS - P1.2
 * 
 * Algorithme de re-ranking:
 * - Top-k candidats (k=20) par similarité cosinus
 * - Re-scoring par règles: tags partagés, proximité temporelle, outils communs
 * - Classification automatique type relation (builds_on, questions, contradicts)
 * - Journal des décisions pour traçabilité
 * 
 * Impact: Qualité connexions ++, moins de bruit
 */

import fs from 'fs/promises'
import path from 'path'
import { readJSONWithLock, writeJSONAtomic } from './writeFileAtomic.js'
import { validateArticleData, validateConnectionData } from './zodSchemas.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')
const EMBEDDINGS_PATH = path.join(process.cwd(), 'public/data/embeddings.json')

// ==================== TYPES ====================

interface ArticleEmbedding {
  article_id: string
  embedding: number[]
  text_content: string
  computed_at: string
  model_name: string
  vector_dimension: number
}

interface ConnectionCandidate {
  source_id: string
  target_id: string
  cosine_similarity: number
  semantic_score: number
  rule_based_score: number
  final_score: number
  connection_type: 'builds_on' | 'contradicts' | 'implements' | 'questions' | 'similar_to'
  reasoning: string
  confidence: number
  decision_factors: {
    shared_concepts: number
    temporal_proximity: number
    shared_tools: number
    domain_alignment: number
    complexity_gap: number
    semantic_similarity: number
  }
}

interface RescordingResult {
  source_article_id: string
  total_candidates: number
  top_k_candidates: number
  selected_connections: ConnectionCandidate[]
  processing_time_ms: number
  decision_log: string[]
}

interface IntelligentConnectionData {
  connections: ConnectionCandidate[]
  rescoring_metadata: {
    algorithm_version: string
    processed_at: string
    total_articles_processed: number
    average_candidates_per_article: number
    selection_criteria: any
  }
  decision_logs: Record<string, string[]>
}

// ==================== CONFIGURATION ====================

const RESCORING_CONFIG = {
  topK: 20, // Top-K candidats par similarité cosinus
  minSemanticSimilarity: 0.3, // Seuil minimum similarité cosinus
  selectionLimit: 8, // Maximum connexions par article
  
  // Poids pour scoring hybride
  weights: {
    semantic: 0.4,
    shared_concepts: 0.2,
    temporal_proximity: 0.15,
    shared_tools: 0.1,
    domain_alignment: 0.1,
    complexity_match: 0.05
  },
  
  // Seuils de classification des types
  thresholds: {
    implements: 0.7, // Forte similarité + outils partagés
    builds_on: 0.6,  // Bonne similarité + concepts partagés
    contradicts: 0.4, // Similarité moyenne + opposition détectée
    questions: 0.5,   // Similarité + patterns interrogatifs
    similar_to: 0.3   // Fallback
  }
}

// ==================== CHARGEMENT DONNÉES ====================

async function loadEmbeddings(): Promise<Map<string, number[]>> {
  try {
    const data = await readJSONWithLock(EMBEDDINGS_PATH, { timeout: 5000 })
    
    if (!data.embeddings || !Array.isArray(data.embeddings)) {
      throw new Error('Format embeddings invalide')
    }
    
    const embeddingMap = new Map<string, number[]>()
    
    for (const embedding of data.embeddings) {
      if (embedding.article_id && embedding.embedding && Array.isArray(embedding.embedding)) {
        embeddingMap.set(embedding.article_id, embedding.embedding)
      }
    }
    
    console.log(`📊 ${embeddingMap.size} embeddings chargés`)
    return embeddingMap
    
  } catch (error) {
    throw new Error(`Impossible de charger les embeddings: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

// ==================== SIMILARITÉ SÉMANTIQUE ====================

function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vecteurs de dimensions différentes')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }
  
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)
  
  if (normA === 0 || normB === 0) {
    return 0
  }
  
  return dotProduct / (normA * normB)
}

function findTopKSimilar(
  sourceId: string,
  sourceEmbedding: number[],
  embeddings: Map<string, number[]>,
  k: number = RESCORING_CONFIG.topK
): Array<{ targetId: string, similarity: number }> {
  
  const candidates: Array<{ targetId: string, similarity: number }> = []
  
  for (const [targetId, targetEmbedding] of embeddings.entries()) {
    if (targetId === sourceId) continue // Éviter self-loops
    
    try {
      const similarity = cosineSimilarity(sourceEmbedding, targetEmbedding)
      
      if (similarity >= RESCORING_CONFIG.minSemanticSimilarity) {
        candidates.push({ targetId, similarity })
      }
    } catch (error) {
      console.warn(`⚠️ Erreur similarité ${sourceId}-${targetId}:`, error)
    }
  }
  
  // Trier par similarité décroissante et prendre top-K
  return candidates
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k)
}

// ==================== SCORING BASÉ SUR RÈGLES ====================

function calculateSharedConcepts(articleA: any, articleB: any): number {
  const conceptsA = new Set((articleA.concepts || []).map((c: any) => c.name || c))
  const conceptsB = new Set((articleB.concepts || []).map((c: any) => c.name || c))
  
  const intersection = new Set([...conceptsA].filter(x => conceptsB.has(x)))
  const union = new Set([...conceptsA, ...conceptsB])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

function calculateTemporalProximity(articleA: any, articleB: any): number {
  try {
    const dateA = new Date(articleA.date)
    const dateB = new Date(articleB.date)
    
    const diffDays = Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24)
    
    // Score inversement proportionnel à la différence
    // Score max (1.0) si même jour, décroissance exponentielle
    return Math.exp(-diffDays / 365) // Demi-vie de 1 an
    
  } catch (error) {
    return 0
  }
}

function calculateSharedTools(articleA: any, articleB: any): number {
  const toolsA = new Set((articleA.tools_mentioned || []).map((t: any) => t.name || t))
  const toolsB = new Set((articleB.tools_mentioned || []).map((t: any) => t.name || t))
  
  const intersection = new Set([...toolsA].filter(x => toolsB.has(x)))
  const union = new Set([...toolsA, ...toolsB])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

function calculateDomainAlignment(articleA: any, articleB: any): number {
  let score = 0
  
  // Domaine primaire identique = +0.5
  if (articleA.primary_domain === articleB.primary_domain) {
    score += 0.5
  }
  
  // Domaines secondaires partagés
  const domainsA = new Set(articleA.secondary_domains || [])
  const domainsB = new Set(articleB.secondary_domains || [])
  const sharedSecondary = new Set([...domainsA].filter(x => domainsB.has(x)))
  
  if (domainsA.size > 0 || domainsB.size > 0) {
    score += 0.5 * (sharedSecondary.size / Math.max(domainsA.size, domainsB.size))
  }
  
  return Math.min(score, 1.0)
}

function calculateComplexityMatch(articleA: any, articleB: any): number {
  const complexityOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
  
  const levelA = complexityOrder[articleA.complexity_level] || 2
  const levelB = complexityOrder[articleB.complexity_level] || 2
  
  const diff = Math.abs(levelA - levelB)
  
  // Score max si même niveau, décroissance linéaire
  return Math.max(0, 1 - diff / 2)
}

function calculateRuleBasedScore(
  articleA: any,
  articleB: any
): {
  score: number
  factors: ConnectionCandidate['decision_factors']
} {
  
  const factors = {
    shared_concepts: calculateSharedConcepts(articleA, articleB),
    temporal_proximity: calculateTemporalProximity(articleA, articleB),
    shared_tools: calculateSharedTools(articleA, articleB),
    domain_alignment: calculateDomainAlignment(articleA, articleB),
    complexity_gap: calculateComplexityMatch(articleA, articleB),
    semantic_similarity: 0 // Sera rempli plus tard
  }
  
  // Score pondéré
  const score = (
    factors.shared_concepts * RESCORING_CONFIG.weights.shared_concepts +
    factors.temporal_proximity * RESCORING_CONFIG.weights.temporal_proximity +
    factors.shared_tools * RESCORING_CONFIG.weights.shared_tools +
    factors.domain_alignment * RESCORING_CONFIG.weights.domain_alignment +
    factors.complexity_gap * RESCORING_CONFIG.weights.complexity_match
  ) / (
    RESCORING_CONFIG.weights.shared_concepts +
    RESCORING_CONFIG.weights.temporal_proximity +
    RESCORING_CONFIG.weights.shared_tools +
    RESCORING_CONFIG.weights.domain_alignment +
    RESCORING_CONFIG.weights.complexity_match
  )
  
  return { score, factors }
}

// ==================== CLASSIFICATION TYPE CONNEXION ====================

function classifyConnectionType(
  articleA: any,
  articleB: any,
  semanticSimilarity: number,
  ruleFactors: ConnectionCandidate['decision_factors']
): { type: ConnectionCandidate['connection_type'], reasoning: string, confidence: number } {
  
  const reasons: string[] = []
  
  // Détection "implements" - forte similarité + outils partagés
  if (ruleFactors.shared_tools > 0.3 && semanticSimilarity > 0.6) {
    reasons.push(`Outils partagés (${(ruleFactors.shared_tools * 100).toFixed(0)}%)`)
    reasons.push(`Similarité sémantique élevée (${(semanticSimilarity * 100).toFixed(0)}%)`)
    
    return {
      type: 'implements',
      reasoning: `Implémentation détectée: ${reasons.join(', ')}`,
      confidence: Math.min(semanticSimilarity + ruleFactors.shared_tools, 1.0)
    }
  }
  
  // Détection "builds_on" - bonne similarité + concepts partagés
  if (ruleFactors.shared_concepts > 0.2 && semanticSimilarity > 0.5) {
    reasons.push(`Concepts partagés (${(ruleFactors.shared_concepts * 100).toFixed(0)}%)`)
    
    return {
      type: 'builds_on',
      reasoning: `Développement conceptuel: ${reasons.join(', ')}`,
      confidence: (semanticSimilarity + ruleFactors.shared_concepts) / 2
    }
  }
  
  // Détection "contradicts" - patterns négatifs dans le texte
  const textA = articleA.summary || ''
  const textB = articleB.summary || ''
  const contradictKeywords = ['mais', 'cependant', 'néanmoins', 'contraire', 'opposite', 'however', 'but', 'against']
  const hasContradictPattern = contradictKeywords.some(keyword => 
    textA.toLowerCase().includes(keyword) || textB.toLowerCase().includes(keyword)
  )
  
  if (hasContradictPattern && semanticSimilarity > 0.4) {
    return {
      type: 'contradicts',
      reasoning: 'Patterns de contradiction détectés dans le texte',
      confidence: semanticSimilarity * 0.7
    }
  }
  
  // Détection "questions" - patterns interrogatifs
  const questionKeywords = ['pourquoi', 'comment', 'que', 'quoi', 'why', 'how', 'what', '?']
  const hasQuestionPattern = questionKeywords.some(keyword => 
    textA.toLowerCase().includes(keyword) || textB.toLowerCase().includes(keyword)
  )
  
  if (hasQuestionPattern && semanticSimilarity > 0.4) {
    return {
      type: 'questions',
      reasoning: 'Patterns interrogatifs détectés',
      confidence: semanticSimilarity * 0.8
    }
  }
  
  // Fallback: "similar_to"
  const similarityReason = `Similarité sémantique ${(semanticSimilarity * 100).toFixed(0)}%`
  if (ruleFactors.domain_alignment > 0.5) {
    reasons.push(`Alignement domaines (${(ruleFactors.domain_alignment * 100).toFixed(0)}%)`)
  }
  
  return {
    type: 'similar_to',
    reasoning: `Similarité générale: ${similarityReason}${reasons.length > 0 ? ', ' + reasons.join(', ') : ''}`,
    confidence: semanticSimilarity
  }
}

// ==================== RESCORING PRINCIPAL ====================

async function rescoreArticleConnections(
  sourceArticle: any,
  articles: any[],
  embeddings: Map<string, number[]>
): Promise<RescordingResult> {
  
  const startTime = Date.now()
  const sourceEmbedding = embeddings.get(sourceArticle.id)
  
  if (!sourceEmbedding) {
    throw new Error(`Embedding manquant pour article ${sourceArticle.id}`)
  }
  
  const decisionLog: string[] = []
  decisionLog.push(`🔍 Analyse connexions pour "${sourceArticle.title.substring(0, 40)}..."`)
  
  // 1. Top-K candidats par similarité sémantique
  const topCandidates = findTopKSimilar(sourceArticle.id, sourceEmbedding, embeddings)
  decisionLog.push(`📊 ${topCandidates.length} candidats trouvés (seuil: ${RESCORING_CONFIG.minSemanticSimilarity})`)
  
  if (topCandidates.length === 0) {
    return {
      source_article_id: sourceArticle.id,
      total_candidates: 0,
      top_k_candidates: 0,
      selected_connections: [],
      processing_time_ms: Date.now() - startTime,
      decision_log: decisionLog
    }
  }
  
  // 2. Re-scoring hybride
  const connectionCandidates: ConnectionCandidate[] = []
  
  for (const candidate of topCandidates) {
    const targetArticle = articles.find(a => a.id === candidate.targetId)
    if (!targetArticle) continue
    
    // Calcul scoring basé sur règles
    const { score: ruleScore, factors } = calculateRuleBasedScore(sourceArticle, targetArticle)
    factors.semantic_similarity = candidate.similarity
    
    // Score final hybride
    const finalScore = (
      candidate.similarity * RESCORING_CONFIG.weights.semantic +
      ruleScore * (1 - RESCORING_CONFIG.weights.semantic)
    )
    
    // Classification type connexion
    const { type, reasoning, confidence } = classifyConnectionType(
      sourceArticle,
      targetArticle,
      candidate.similarity,
      factors
    )
    
    connectionCandidates.push({
      source_id: sourceArticle.id,
      target_id: targetArticle.id,
      cosine_similarity: candidate.similarity,
      semantic_score: candidate.similarity,
      rule_based_score: ruleScore,
      final_score: finalScore,
      connection_type: type,
      reasoning,
      confidence,
      decision_factors: factors
    })
  }
  
  // 3. Sélection finale
  const selectedConnections = connectionCandidates
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, RESCORING_CONFIG.selectionLimit)
  
  decisionLog.push(`🎯 ${selectedConnections.length} connexions sélectionnées sur ${connectionCandidates.length}`)
  
  // Logs détaillés pour top connections
  selectedConnections.slice(0, 3).forEach((conn, i) => {
    const targetTitle = articles.find(a => a.id === conn.target_id)?.title.substring(0, 30) || conn.target_id
    decisionLog.push(`  ${i + 1}. ${targetTitle}... (${conn.connection_type}, score: ${conn.final_score.toFixed(3)})`)
  })
  
  return {
    source_article_id: sourceArticle.id,
    total_candidates: embeddings.size - 1,
    top_k_candidates: topCandidates.length,
    selected_connections: selectedConnections,
    processing_time_ms: Date.now() - startTime,
    decision_log: decisionLog
  }
}

// ==================== FONCTION PRINCIPALE ====================

export async function rescoreIntelligentConnections(options: {
  articlesToProcess?: string[]
  outputPath?: string
} = {}): Promise<{
  success: boolean
  message: string
  total_articles_processed: number
  total_connections_generated: number
  processing_time_ms: number
  average_connections_per_article: number
}> {
  
  const startTime = Date.now()
  
  try {
    console.log('\n🚀 RE-SCORING INTELLIGENT DES CONNEXIONS')
    console.log('='.repeat(50))
    
    // 1. Charger données
    console.log('📊 Chargement données...')
    const [articleData, embeddings] = await Promise.all([
      readJSONWithLock(ARTICLES_PATH, { timeout: 5000 }),
      loadEmbeddings()
    ])
    
    // Structure flexible pour compatibilité
    let articles: any[] = []
    if (articleData.articles && Array.isArray(articleData.articles)) {
      articles = articleData.articles
    } else if (Array.isArray(articleData)) {
      articles = articleData
    } else {
      throw new Error('Format articles.json invalide: ni .articles ni array direct')
    }
    
    console.log(`✅ ${articles.length} articles, ${embeddings.size} embeddings`)
    
    if (embeddings.size === 0) {
      throw new Error('Aucun embedding disponible. Exécutez d\'abord: npm run generate-embeddings')
    }
    
    // 2. Articles à traiter
    let articlesToProcess = articles
    
    if (options.articlesToProcess) {
      articlesToProcess = articles.filter(a => options.articlesToProcess!.includes(a.id))
      console.log(`🎯 Traitement sélectif: ${articlesToProcess.length} articles`)
    }
    
    // 3. Re-scoring pour chaque article
    const allConnections: ConnectionCandidate[] = []
    const allDecisionLogs: Record<string, string[]> = {}
    let totalProcessingTime = 0
    
    console.log(`🔄 Re-scoring pour ${articlesToProcess.length} articles...`)
    
    for (let i = 0; i < articlesToProcess.length; i++) {
      const article = articlesToProcess[i]
      
      if (!embeddings.has(article.id)) {
        console.warn(`⚠️ Embedding manquant pour ${article.id}, ignoré`)
        continue
      }
      
      try {
        const result = await rescoreArticleConnections(article, articles, embeddings)
        
        allConnections.push(...result.selected_connections)
        allDecisionLogs[article.id] = result.decision_log
        totalProcessingTime += result.processing_time_ms
        
        // Progress
        if (i % 5 === 0 || i === articlesToProcess.length - 1) {
          const progress = ((i + 1) / articlesToProcess.length * 100).toFixed(1)
          console.log(`📈 Progression: ${i + 1}/${articlesToProcess.length} (${progress}%)`)
        }
        
      } catch (error) {
        console.error(`❌ Erreur re-scoring ${article.id}:`, error)
      }
    }
    
    // 4. Sauvegarde
    const outputPath = options.outputPath || CONNECTIONS_PATH
    const intelligentData: IntelligentConnectionData = {
      connections: allConnections,
      rescoring_metadata: {
        algorithm_version: '1.0',
        processed_at: new Date().toISOString(),
        total_articles_processed: articlesToProcess.length,
        average_candidates_per_article: allConnections.length / Math.max(articlesToProcess.length, 1),
        selection_criteria: RESCORING_CONFIG
      },
      decision_logs: allDecisionLogs
    }
    
    // Format compatible avec structure existante
    const existingConnections = await readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 }).catch(() => ({ connections: [] }))
    
    const finalConnectionData = {
      ...existingConnections,
      connections: allConnections.map(conn => ({
        source_id: conn.source_id,
        target_id: conn.target_id,
        type: conn.connection_type,
        strength: conn.final_score,
        auto_detected: true,
        reasoning: `AI Re-scoring (conf: ${conn.confidence.toFixed(2)}): ${conn.reasoning}`
      })),
      intelligent_rescoring: intelligentData,
      generated_at: new Date().toISOString(),
      total_connections: allConnections.length
    }
    
    await writeJSONAtomic(outputPath, finalConnectionData, { lockTimeout: 20000 })
    
    const duration = Date.now() - startTime
    const avgConnections = allConnections.length / Math.max(articlesToProcess.length, 1)
    
    console.log('\n✅ RE-SCORING TERMINÉ')
    console.log(`📊 Articles traités: ${articlesToProcess.length}`)
    console.log(`🔗 Connexions générées: ${allConnections.length}`)
    console.log(`📈 Moyenne/article: ${avgConnections.toFixed(1)}`)
    console.log(`⏱️ Temps total: ${duration}ms`)
    console.log(`🧠 Algorithme: Hybride sémantique + règles`)
    
    return {
      success: true,
      message: `Re-scoring terminé: ${allConnections.length} connexions intelligentes`,
      total_articles_processed: articlesToProcess.length,
      total_connections_generated: allConnections.length,
      processing_time_ms: duration,
      average_connections_per_article: avgConnections
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    const message = `Erreur re-scoring: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    
    console.error(`\n❌ ÉCHEC après ${duration}ms`)
    console.error(message)
    
    return {
      success: false,
      message,
      total_articles_processed: 0,
      total_connections_generated: 0,
      processing_time_ms: duration,
      average_connections_per_article: 0
    }
  }
}

// ==================== CLI ====================

async function main() {
  const args = process.argv.slice(2)
  
  const options: { articlesToProcess?: string[], outputPath?: string } = {}
  
  // Paramètre --articles pour traitement sélectif
  const articlesFlag = args.findIndex(arg => arg === '--articles')
  if (articlesFlag !== -1 && args[articlesFlag + 1]) {
    options.articlesToProcess = args[articlesFlag + 1].split(',')
  }
  
  // Paramètre --output pour fichier de sortie
  const outputFlag = args.findIndex(arg => arg === '--output')
  if (outputFlag !== -1 && args[outputFlag + 1]) {
    options.outputPath = args[outputFlag + 1]
  }
  
  console.log('📋 Configuration:')
  console.log(`   Top-K candidats: ${RESCORING_CONFIG.topK}`)
  console.log(`   Sélection max: ${RESCORING_CONFIG.selectionLimit}`)
  console.log(`   Seuil similarité: ${RESCORING_CONFIG.minSemanticSimilarity}`)
  console.log(`   Poids sémantique: ${RESCORING_CONFIG.weights.semantic}`)
  
  const result = await rescoreIntelligentConnections(options)
  
  if (result.success) {
    console.log('\n🎉 RE-SCORING INTELLIGENT RÉUSSI')
    process.exit(0)
  } else {
    console.log('\n💥 ÉCHEC RE-SCORING')
    process.exit(1)
  }
}

// ES Module check - Fixed for Windows
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].includes('intelligentConnectionRescorer')) {
  main()
}