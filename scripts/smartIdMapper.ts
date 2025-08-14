#!/usr/bin/env tsx
/**
 * SMART ID MAPPER
 * 
 * Résout intelligemment les target_id invalides des connexions n8n LLM
 * en faisant correspondre avec les articles existants par :
 * 1. Titre/URL exact
 * 2. Analyse sémantique des concepts/outils
 * 3. Domaine et similarité temporelle
 * 4. Analyse du reasoning fourni par le LLM
 */

import { Article, SuggestedConnection } from '../src/data/schema.js'

// ==================== INTERFACES ====================

interface MappingResult {
  originalTargetId: string
  newTargetId: string | null
  confidence: number
  method: 'exact_match' | 'semantic_match' | 'domain_match' | 'reasoning_match' | 'no_match'
  reasoning: string
}

interface MatchCandidate {
  article: Article
  score: number
  method: string
  details: string
}

// ==================== UTILITAIRES ====================

function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'both', 'this', 'that', 'these', 'those', 'paper', 'article', 'work'
  ])
  
  return normalizeText(text)
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10) // Top 10 keywords
}

function calculateJaccardSimilarity(arr1: string[], arr2: string[]): number {
  const set1 = new Set(arr1)
  const set2 = new Set(arr2)
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

function calculateTemporalSimilarity(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
  
  // Similarité décroissante : 1.0 pour même jour, 0.5 pour 1 an, 0.1 pour 5 ans
  return Math.max(0.1, 1 - (diffDays / 1825)) // 1825 = 5 ans
}

// ==================== MÉTHODES DE MATCHING ====================

/**
 * Méthode 1: Correspondance exacte par titre ou URL
 */
function findExactMatch(targetId: string, existingArticles: Article[], newArticles: any[]): MatchCandidate | null {
  // D'abord chercher dans les nouveaux articles pour récupérer le titre/URL
  const newArticle = newArticles.find(na => na.article.id === targetId)
  if (!newArticle) return null
  
  const targetTitle = normalizeText(newArticle.article.title)
  const targetUrl = newArticle.article.url
  
  for (const article of existingArticles) {
    // Match par URL exact
    if (article.url === targetUrl) {
      return {
        article,
        score: 1.0,
        method: 'exact_url_match',
        details: `URL identique: ${targetUrl}`
      }
    }
    
    // Match par titre exact (normalisé)
    const articleTitle = normalizeText(article.title)
    if (articleTitle === targetTitle) {
      return {
        article,
        score: 0.95,
        method: 'exact_title_match', 
        details: `Titre identique: "${article.title}"`
      }
    }
  }
  
  return null
}

/**
 * Méthode 2: Correspondance sémantique par concepts et outils
 */
function findSemanticMatch(targetId: string, existingArticles: Article[], newArticles: any[]): MatchCandidate | null {
  const newArticle = newArticles.find(na => na.article.id === targetId)
  if (!newArticle) return null
  
  const targetConcepts = newArticle.article.concepts.map((c: any) => c.name.toLowerCase())
  const targetTools = newArticle.article.tools_mentioned.map((t: any) => t.name.toLowerCase())
  const targetKeywords = extractKeywords(newArticle.article.summary)
  
  let bestMatch: MatchCandidate | null = null
  
  for (const article of existingArticles) {
    const articleConcepts = article.concepts.map(c => c.name.toLowerCase())
    const articleTools = article.tools_mentioned.map(t => t.name.toLowerCase())
    const articleKeywords = extractKeywords(article.summary)
    
    // Scores partiels
    const conceptSimilarity = calculateJaccardSimilarity(targetConcepts, articleConcepts)
    const toolSimilarity = calculateJaccardSimilarity(targetTools, articleTools)
    const keywordSimilarity = calculateJaccardSimilarity(targetKeywords, articleKeywords)
    
    // Score composite (pondéré : concepts > outils > mots-clés)
    const semanticScore = (conceptSimilarity * 0.5) + (toolSimilarity * 0.3) + (keywordSimilarity * 0.2)
    
    if (semanticScore > 0.4 && (!bestMatch || semanticScore > bestMatch.score)) {
      const details = []
      if (conceptSimilarity > 0) details.push(`concepts: ${conceptSimilarity.toFixed(2)}`)
      if (toolSimilarity > 0) details.push(`outils: ${toolSimilarity.toFixed(2)}`)
      if (keywordSimilarity > 0) details.push(`mots-clés: ${keywordSimilarity.toFixed(2)}`)
      
      bestMatch = {
        article,
        score: semanticScore,
        method: 'semantic_similarity',
        details: `Similarité sémantique (${details.join(', ')})`
      }
    }
  }
  
  return bestMatch
}

/**
 * Méthode 3: Correspondance par domaine et proximité temporelle  
 */
function findDomainMatch(targetId: string, existingArticles: Article[], newArticles: any[]): MatchCandidate | null {
  const newArticle = newArticles.find(na => na.article.id === targetId)
  if (!newArticle) return null
  
  const targetPrimaryDomain = newArticle.article.primary_domain
  const targetSecondaryDomains = newArticle.article.secondary_domains || []
  const targetDate = newArticle.article.date
  
  let bestMatch: MatchCandidate | null = null
  
  for (const article of existingArticles) {
    let domainScore = 0
    
    // Score domaine principal
    if (article.primary_domain === targetPrimaryDomain) {
      domainScore += 0.6
    }
    
    // Score domaines secondaires partagés
    const sharedSecondaryDomains = article.secondary_domains.filter(
      d => targetSecondaryDomains.includes(d)
    )
    domainScore += (sharedSecondaryDomains.length * 0.2)
    
    // Score temporel
    const temporalScore = calculateTemporalSimilarity(targetDate, article.date)
    
    // Score composite
    const totalScore = (domainScore * 0.7) + (temporalScore * 0.3)
    
    if (totalScore > 0.3 && (!bestMatch || totalScore > bestMatch.score)) {
      bestMatch = {
        article,
        score: totalScore,
        method: 'domain_temporal_match',
        details: `Domaine: ${article.primary_domain}, Temporel: ${temporalScore.toFixed(2)}`
      }
    }
  }
  
  return bestMatch
}

/**
 * Méthode 4: Correspondance par analyse du reasoning LLM
 */
function findReasoningMatch(connection: SuggestedConnection, existingArticles: Article[]): MatchCandidate | null {
  const reasoningKeywords = extractKeywords(connection.reasoning)
  
  let bestMatch: MatchCandidate | null = null
  
  for (const article of existingArticles) {
    const articleText = `${article.title} ${article.summary} ${article.perspective || ''}`
    const articleKeywords = extractKeywords(articleText)
    
    const keywordSimilarity = calculateJaccardSimilarity(reasoningKeywords, articleKeywords)
    
    if (keywordSimilarity > 0.2 && (!bestMatch || keywordSimilarity > bestMatch.score)) {
      bestMatch = {
        article,
        score: keywordSimilarity,
        method: 'reasoning_analysis',
        details: `Mots-clés du reasoning: ${reasoningKeywords.slice(0, 3).join(', ')}`
      }
    }
  }
  
  return bestMatch
}

// ==================== MAPPER PRINCIPAL ====================

export async function mapTargetIds(
  suggestedConnections: SuggestedConnection[], 
  existingArticles: Article[],
  newArticles: any[]
): Promise<MappingResult[]> {
  const results: MappingResult[] = []
  
  console.log(`🔍 Mapping ${suggestedConnections.length} connexions...`)
  
  for (const connection of suggestedConnections) {
    const targetId = connection.target_id
    
    console.log(`\n📍 Recherche correspondance pour ${targetId}...`)
    
    // Méthode 1: Match exact
    let match = findExactMatch(targetId, existingArticles, newArticles)
    if (match) {
      console.log(`✅ Match exact trouvé: ${match.article.id} (${match.details})`)
      results.push({
        originalTargetId: targetId,
        newTargetId: match.article.id,
        confidence: match.score,
        method: 'exact_match',
        reasoning: match.details
      })
      continue
    }
    
    // Méthode 2: Match sémantique
    match = findSemanticMatch(targetId, existingArticles, newArticles)
    if (match && match.score > 0.6) {
      console.log(`✅ Match sémantique trouvé: ${match.article.id} (score: ${match.score.toFixed(2)})`)
      results.push({
        originalTargetId: targetId,
        newTargetId: match.article.id, 
        confidence: match.score,
        method: 'semantic_match',
        reasoning: match.details
      })
      continue
    }
    
    // Méthode 3: Match par reasoning
    match = findReasoningMatch(connection, existingArticles)
    if (match && match.score > 0.3) {
      console.log(`✅ Match par reasoning trouvé: ${match.article.id} (score: ${match.score.toFixed(2)})`)
      results.push({
        originalTargetId: targetId,
        newTargetId: match.article.id,
        confidence: match.score,
        method: 'reasoning_match', 
        reasoning: match.details
      })
      continue
    }
    
    // Méthode 4: Match domaine (dernier recours)
    match = findDomainMatch(targetId, existingArticles, newArticles)
    if (match && match.score > 0.4) {
      console.log(`⚠️ Match domaine trouvé: ${match.article.id} (score: ${match.score.toFixed(2)})`)
      results.push({
        originalTargetId: targetId,
        newTargetId: match.article.id,
        confidence: match.score,
        method: 'domain_match',
        reasoning: match.details
      })
      continue
    }
    
    // Aucun match trouvé
    console.log(`❌ Aucun match trouvé pour ${targetId}`)
    results.push({
      originalTargetId: targetId,
      newTargetId: null,
      confidence: 0,
      method: 'no_match',
      reasoning: 'Aucune correspondance trouvée dans la base existante'
    })
  }
  
  return results
}

// ==================== UTILITAIRE D'APPLICATION ====================

export function applyIdMapping(
  connections: SuggestedConnection[],
  mappingResults: MappingResult[],
  minConfidence: number = 0.3
): SuggestedConnection[] {
  const mappingDict = new Map<string, string>()
  
  // Construire le dictionnaire de mapping
  mappingResults.forEach(result => {
    if (result.newTargetId && result.confidence >= minConfidence) {
      mappingDict.set(result.originalTargetId, result.newTargetId)
    }
  })
  
  // Appliquer le mapping
  return connections
    .map(conn => {
      const newTargetId = mappingDict.get(conn.target_id)
      if (newTargetId) {
        return {
          ...conn,
          target_id: newTargetId
        }
      }
      return null // Ignorer les connexions non mappables
    })
    .filter(Boolean) as SuggestedConnection[]
}

// ==================== RAPPORTS ====================

export function generateMappingReport(results: MappingResult[]): void {
  const stats = {
    total: results.length,
    exactMatch: results.filter(r => r.method === 'exact_match').length,
    semanticMatch: results.filter(r => r.method === 'semantic_match').length, 
    reasoningMatch: results.filter(r => r.method === 'reasoning_match').length,
    domainMatch: results.filter(r => r.method === 'domain_match').length,
    noMatch: results.filter(r => r.method === 'no_match').length,
    avgConfidence: results.filter(r => r.confidence > 0).reduce((sum, r) => sum + r.confidence, 0) / 
                   results.filter(r => r.confidence > 0).length
  }
  
  console.log('\n📊 RAPPORT DE MAPPING:')
  console.log('='.repeat(50))
  console.log(`Total connexions à mapper: ${stats.total}`)
  console.log(`✅ Correspondances exactes: ${stats.exactMatch}`)
  console.log(`🧠 Correspondances sémantiques: ${stats.semanticMatch}`)
  console.log(`💭 Correspondances par reasoning: ${stats.reasoningMatch}`)
  console.log(`🏷️ Correspondances par domaine: ${stats.domainMatch}`)
  console.log(`❌ Aucune correspondance: ${stats.noMatch}`)
  console.log(`📈 Taux de succès: ${Math.round((stats.total - stats.noMatch) / stats.total * 100)}%`)
  console.log(`🎯 Confiance moyenne: ${stats.avgConfidence.toFixed(2)}`)
  
  // Détails des échecs
  const failures = results.filter(r => r.method === 'no_match')
  if (failures.length > 0) {
    console.log('\n❌ CONNEXIONS NON MAPPÉES:')
    failures.forEach(f => console.log(`   - ${f.originalTargetId}: ${f.reasoning}`))
  }
}