#!/usr/bin/env tsx
/**
 * SMART DEDUPLICATION SYSTEM
 * 
 * Détecte si un nouvel article existe déjà dans la base et :
 * 1. Évite la duplication
 * 2. Met à jour les connexions si nécessaire
 * 3. Fusionne les métadonnées améliorées
 * 4. Gère les changements d'URL ou de titre mineur
 */

import { Article, SuggestedConnection } from '../src/data/schema.js'

// ==================== INTERFACES ====================

interface DuplicationResult {
  isDuplicate: boolean
  existingArticle?: Article
  confidence: number
  method: 'exact_url' | 'exact_title' | 'semantic_similarity' | 'author_date' | 'no_duplicate'
  reasoning: string
}


// ==================== UTILITAIRES ====================

function normalizeUrl(url: string): string {
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .replace(/\?.*$/, '') // Supprimer query params
    .replace(/#.*$/, '')  // Supprimer anchors
}

function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMainDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeTitle(text1).split(' ').filter(w => w.length > 2))
  const words2 = new Set(normalizeTitle(text2).split(' ').filter(w => w.length > 2))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

function calculateDateSimilarity(date1: string, date2: string): number {
  try {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
    
    // Même jour = 1.0, même mois = 0.8, même année = 0.6, différent = 0.0
    if (diffDays === 0) return 1.0
    if (diffDays <= 30) return 0.8
    if (diffDays <= 365) return 0.6
    return 0.0
  } catch {
    return 0.0
  }
}

// ==================== DÉTECTION DE DUPLICATION ====================

export function detectDuplication(
  newArticle: Article,
  existingArticles: Article[]
): DuplicationResult {
  
  console.log(`🔍 Vérification duplication pour: "${newArticle.title}"`)
  
  for (const existing of existingArticles) {
    
    // Méthode 1: URL exactement identique
    const normalizedNewUrl = normalizeUrl(newArticle.url)
    const normalizedExistingUrl = normalizeUrl(existing.url)
    
    if (normalizedNewUrl === normalizedExistingUrl && normalizedNewUrl.length > 10) {
      return {
        isDuplicate: true,
        existingArticle: existing,
        confidence: 1.0,
        method: 'exact_url',
        reasoning: `URL identique: ${newArticle.url}`
      }
    }
    
    // Méthode 2: Titre exactement identique
    const normalizedNewTitle = normalizeTitle(newArticle.title)
    const normalizedExistingTitle = normalizeTitle(existing.title)
    
    if (normalizedNewTitle === normalizedExistingTitle && normalizedNewTitle.length > 20) {
      return {
        isDuplicate: true,
        existingArticle: existing,
        confidence: 0.95,
        method: 'exact_title',
        reasoning: `Titre identique: "${existing.title}"`
      }
    }
    
    // Méthode 3: Même auteur + même date + titre similaire
    if (newArticle.author && existing.author && 
        newArticle.author.toLowerCase() === existing.author.toLowerCase()) {
      
      const dateSimilarity = calculateDateSimilarity(newArticle.date, existing.date)
      const titleSimilarity = calculateTextSimilarity(newArticle.title, existing.title)
      
      if (dateSimilarity >= 0.8 && titleSimilarity >= 0.7) {
        return {
          isDuplicate: true,
          existingArticle: existing,
          confidence: (dateSimilarity + titleSimilarity) / 2,
          method: 'author_date',
          reasoning: `Même auteur (${existing.author}), dates proches, titre similaire (${(titleSimilarity * 100).toFixed(0)}%)`
        }
      }
    }
    
    // Méthode 4: Même domaine + titre très similaire + résumé similaire
    const newDomain = extractMainDomain(newArticle.url)
    const existingDomain = extractMainDomain(existing.url)
    
    if (newDomain === existingDomain && newDomain !== 'arxiv.org' && newDomain !== 'github.com') {
      const titleSimilarity = calculateTextSimilarity(newArticle.title, existing.title)
      const summarySimilarity = calculateTextSimilarity(newArticle.summary, existing.summary)
      
      if (titleSimilarity >= 0.8 && summarySimilarity >= 0.6) {
        return {
          isDuplicate: true,
          existingArticle: existing,
          confidence: (titleSimilarity + summarySimilarity) / 2,
          method: 'semantic_similarity',
          reasoning: `Même domaine (${newDomain}), titre similaire (${(titleSimilarity * 100).toFixed(0)}%), résumé similaire (${(summarySimilarity * 100).toFixed(0)}%)`
        }
      }
    }
  }
  
  return {
    isDuplicate: false,
    confidence: 0.0,
    method: 'no_duplicate',
    reasoning: 'Aucune duplication détectée'
  }
}

// ==================== FUSION INTELLIGENTE ====================

export function mergeArticleMetadata(
  existingArticle: Article,
  newArticle: Article
): { mergedArticle: Article; changes: string[] } {
  
  const changes: string[] = []
  const merged = { ...existingArticle }
  
  // 1. URL mise à jour si plus récente ou différente
  if (newArticle.url !== existingArticle.url) {
    // Préférer URL HTTPS, plus courte ou de source plus fiable
    const newIsHttps = newArticle.url.startsWith('https://')
    const existingIsHttps = existingArticle.url.startsWith('https://')
    
    if (newIsHttps && !existingIsHttps) {
      merged.url = newArticle.url
      changes.push(`URL mise à jour (HTTPS): ${newArticle.url}`)
    } else if (newArticle.url.length < existingArticle.url.length && newIsHttps === existingIsHttps) {
      merged.url = newArticle.url
      changes.push(`URL simplifiée: ${newArticle.url}`)
    }
  }
  
  // 2. Titre amélioré si plus complet
  if (newArticle.title.length > existingArticle.title.length + 10) {
    merged.title = newArticle.title
    changes.push(`Titre étendu: "${newArticle.title}"`)
  }
  
  // 3. Résumé plus détaillé
  if (newArticle.summary.length > existingArticle.summary.length + 20) {
    merged.summary = newArticle.summary
    changes.push('Résumé enrichi')
  }
  
  // 4. Perspective ajoutée si manquante
  if (!existingArticle.perspective && newArticle.perspective) {
    merged.perspective = newArticle.perspective
    changes.push('Perspective ajoutée')
  }
  
  // 5. Fusion des concepts (éviter doublons)
  const existingConceptIds = new Set(existingArticle.concepts.map(c => c.id))
  const newConcepts = newArticle.concepts.filter(c => !existingConceptIds.has(c.id))
  
  if (newConcepts.length > 0) {
    merged.concepts = [...existingArticle.concepts, ...newConcepts]
    changes.push(`${newConcepts.length} nouveaux concepts ajoutés`)
  }
  
  // 6. Fusion des outils
  const existingToolIds = new Set(existingArticle.tools_mentioned.map(t => t.id))
  const newTools = newArticle.tools_mentioned.filter(t => !existingToolIds.has(t.id))
  
  if (newTools.length > 0) {
    merged.tools_mentioned = [...existingArticle.tools_mentioned, ...newTools]
    changes.push(`${newTools.length} nouveaux outils ajoutés`)
  }
  
  // 7. Mise à jour des domaines secondaires
  const existingSecondaryDomains = new Set(existingArticle.secondary_domains)
  const newSecondaryDomains = newArticle.secondary_domains.filter(d => !existingSecondaryDomains.has(d))
  
  if (newSecondaryDomains.length > 0) {
    merged.secondary_domains = [...existingArticle.secondary_domains, ...newSecondaryDomains]
    changes.push(`${newSecondaryDomains.length} nouveaux domaines secondaires`)
  }
  
  // 8. Mettre à jour l'auteur si manquant
  if (!existingArticle.author && newArticle.author) {
    merged.author = newArticle.author
    changes.push(`Auteur ajouté: ${newArticle.author}`)
  }
  
  // 9. Temps de lecture si plus précis
  if (Math.abs(newArticle.reading_time - existingArticle.reading_time) > 2) {
    merged.reading_time = Math.round((existingArticle.reading_time + newArticle.reading_time) / 2)
    changes.push('Temps de lecture recalculé')
  }
  
  // 10. Interest level : prendre le plus élevé
  if (newArticle.interest_level > existingArticle.interest_level) {
    merged.interest_level = newArticle.interest_level
    changes.push(`Niveau d'intérêt relevé à ${newArticle.interest_level}`)
  }
  
  return { mergedArticle: merged, changes }
}

// ==================== MISE À JOUR DES CONNEXIONS ====================

export function updateConnections(
  existingArticleId: string,
  suggestedConnections: SuggestedConnection[],
  existingConnections: any[]
): { newConnections: SuggestedConnection[], addedCount: number } {
  
  // Récupérer les connexions existantes pour cet article
  const existingTargets = new Set(
    existingConnections
      .filter(conn => conn.source_id === existingArticleId)
      .map(conn => conn.target_id)
  )
  
  // Filtrer les nouvelles connexions uniques
  const newConnections = suggestedConnections.filter(suggested => 
    !existingTargets.has(suggested.target_id)
  )
  
  console.log(`🔗 ${existingTargets.size} connexions existantes, ${newConnections.length} nouvelles à ajouter`)
  
  return {
    newConnections,
    addedCount: newConnections.length
  }
}

// ==================== PROCESSUS COMPLET ====================

export async function processArticleWithDeduplication(
  newArticle: Article,
  suggestedConnections: SuggestedConnection[],
  existingArticles: Article[],
  existingConnections: any[]
): Promise<{
  action: 'created' | 'updated' | 'skipped'
  article: Article
  articleId: string
  connectionsToAdd: SuggestedConnection[]
  changes: string[]
  reasoning: string
}> {
  
  console.log(`\n🔄 Traitement de: "${newArticle.title}"`)
  
  // 1. Vérifier duplication
  const duplicationResult = detectDuplication(newArticle, existingArticles)
  
  if (!duplicationResult.isDuplicate) {
    // Article nouveau - création normale
    console.log(`✅ Article nouveau détecté`)
    return {
      action: 'created',
      article: newArticle,
      articleId: newArticle.id, // Sera régénéré par le script d'ajout
      connectionsToAdd: suggestedConnections,
      changes: [],
      reasoning: 'Nouvel article, aucune duplication détectée'
    }
  }
  
  console.log(`⚠️ Duplication détectée avec ${duplicationResult.existingArticle!.id}`)
  console.log(`   Méthode: ${duplicationResult.method} (conf: ${duplicationResult.confidence.toFixed(2)})`)
  console.log(`   Raison: ${duplicationResult.reasoning}`)
  
  const existingArticle = duplicationResult.existingArticle!
  
  // 2. Fusionner les métadonnées
  const { mergedArticle, changes } = mergeArticleMetadata(existingArticle, newArticle)
  
  // 3. Gérer les nouvelles connexions
  const { newConnections, addedCount } = updateConnections(
    existingArticle.id,
    suggestedConnections,
    existingConnections
  )
  
  // 4. Décider de l'action
  if (changes.length === 0 && addedCount === 0) {
    console.log(`⭕ Aucune mise à jour nécessaire`)
    return {
      action: 'skipped',
      article: existingArticle,
      articleId: existingArticle.id,
      connectionsToAdd: [],
      changes: [],
      reasoning: `Article identique déjà présent (${duplicationResult.method})`
    }
  }
  
  console.log(`🔄 Mise à jour: ${changes.length} métadonnées + ${addedCount} connexions`)
  
  return {
    action: 'updated',
    article: mergedArticle,
    articleId: existingArticle.id,
    connectionsToAdd: newConnections,
    changes: changes.concat([`${addedCount} nouvelles connexions`]),
    reasoning: `Article mis à jour (${duplicationResult.method}, conf: ${duplicationResult.confidence.toFixed(2)})`
  }
}