import { Article, Connection } from '@/data/schema'

// Fonction utilitaire pour intersection d'arrays
function intersection<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter(value => arr2.includes(value))
}

/**
 * ALGORITHME INTELLIGENT MULTI-CRITÈRES DE DÉTECTION DE CONNEXIONS
 * Basé sur les meilleures pratiques 2024-2025 et la richesse des métadonnées
 */
export function detectConnections(articleA: Article, articleB: Article): Connection | null {
  // === 1. ANALYSE DES CONCEPTS ET OUTILS ===
  const sharedConcepts = intersection(
    articleA.concepts.map(c => c.id),
    articleB.concepts.map(c => c.id)
  )
  const sharedTools = intersection(
    articleA.tools_mentioned.map(t => t.id),
    articleB.tools_mentioned.map(t => t.id)
  )
  
  // === 2. ANALYSE DES DOMAINES ===
  const allDomainsA = [articleA.primary_domain, ...articleA.secondary_domains]
  const allDomainsB = [articleB.primary_domain, ...articleB.secondary_domains]
  const sharedDomains = intersection(allDomainsA, allDomainsB)
  const isDifferentPrimaryDomains = articleA.primary_domain !== articleB.primary_domain
  
  // === 3. ANALYSE TEXTUELLE SÉMANTIQUE ===
  const textualAnalysis = analyzeTextualRelationship(articleA, articleB)
  
  // === 4. ANALYSE DE CONTROVERSE ===
  const controversyAnalysis = analyzeControversyRelationship(articleA, articleB)
  
  // === 5. CALCUL MULTI-CRITÈRES DE LA FORCE ===
  let baseStrength = 0
  let relationshipType: Connection['type'] = 'similar_to'
  let reasoning = ''
  
  // PRIORITÉ 1 : Références directes détectées dans le texte
  if (textualAnalysis.hasDirectReference) {
    baseStrength = 0.85
    relationshipType = textualAnalysis.type
    reasoning = textualAnalysis.reasoning
  }
  // PRIORITÉ 2 : Opposition de controverse 
  else if (controversyAnalysis.isControversial) {
    baseStrength = 0.75
    relationshipType = 'contradicts'
    reasoning = controversyAnalysis.reasoning
  }
  // PRIORITÉ 3 : Pont interdisciplinaire (cœur du projet)
  else if (isDifferentPrimaryDomains && (sharedConcepts.length > 0 || sharedTools.length > 0)) {
    baseStrength = calculateBridgeStrength(articleA, articleB, sharedConcepts, sharedTools, sharedDomains)
    relationshipType = determineBridgeType(articleA, articleB, textualAnalysis)
    reasoning = `Pont ${articleA.primary_domain} ↔ ${articleB.primary_domain}: ${sharedConcepts.concat(sharedTools).join(', ')}`
  }
  // PRIORITÉ 4 : Similarité dans même domaine ou domaines secondaires partagés
  else if (sharedConcepts.length > 0 || sharedTools.length > 0 || sharedDomains.length >= 2) {
    baseStrength = calculateSimilarityStrength(articleA, articleB, sharedConcepts, sharedTools, sharedDomains)
    relationshipType = 'similar_to'
    
    if (sharedDomains.length >= 2 && sharedConcepts.length === 0 && sharedTools.length === 0) {
      reasoning = `Domaines partagés: ${sharedDomains.join(', ')}`
    } else {
      reasoning = `Similarité: ${sharedConcepts.concat(sharedTools).slice(0, 3).join(', ')}`
    }
  }
  
  // === 6. PONDÉRATION ADAPTATIVE ===
  const finalStrength = applyAdaptiveWeighting(baseStrength, articleA, articleB, {
    sharedConcepts,
    sharedTools,
    sharedDomains,
    complexity: Math.abs(getComplexityScore(articleA.complexity_level) - getComplexityScore(articleB.complexity_level)),
    temporalDistance: calculateTemporalDistance(articleA.date, articleB.date),
    interestAlignment: Math.abs(articleA.interest_level - articleB.interest_level)
  })
  
  // === 7. SEUIL DE PERTINENCE ADAPTATIF ===
  // Plus tolérant pour capturer plus de connexions pertinentes
  const threshold = isDifferentPrimaryDomains ? 0.35 : 0.42 // Abaissé pour plus de connexions
  
  if (finalStrength < threshold) return null
  
  return {
    source_id: articleA.id,
    target_id: articleB.id,
    type: relationshipType,
    strength: Math.min(finalStrength, 0.95),
    auto_detected: true,
    reasoning
  }
}

// ========================================================================
// FONCTIONS D'ANALYSE SPÉCIALISÉES
// ========================================================================

/**
 * Analyse textuelle sémantique avancée utilisant les summary et perspective
 */
function analyzeTextualRelationship(articleA: Article, articleB: Article): {
  hasDirectReference: boolean
  type: Connection['type']
  reasoning: string
} {
  const textA = `${articleA.summary} ${articleA.perspective}`.toLowerCase()
  const textB = `${articleB.summary} ${articleB.perspective}`.toLowerCase()
  
  // Mots-clés contextuels sophistiqués
  const implementsPatterns = [
    /implémente?\s+.*(?:concept|approche|méthode)/,
    /utilise?\s+.*(?:algorithme|technique|outil)/,
    /applique?\s+.*(?:principe|méthode)/,
    /se\s+base\s+sur.*(?:travaux|recherche|approche)/
  ]
  
  const questionsPatterns = [
    /(?:questionne|remet\s+en\s+cause|critique).*(?:approche|méthode|principe)/,
    /(?:soulève|interroge).*(?:questions?|problème)/,
    /(?:défie|conteste).*(?:paradigme|vision)/
  ]
  
  const buildsPatterns = [
    /(?:étend|développe|améliore).*(?:approche|méthode)/,
    /(?:s'appuie\s+sur|enrichit).*(?:travaux|recherche)/,
    /(?:complète|renforce).*(?:analyse|perspective)/
  ]
  
  // Détection contextuelle avec outils/concepts partagés
  const hasSharedElements = articleA.concepts.some(c => 
    textB.includes(c.name.toLowerCase()) || textB.includes(c.id)
  ) || articleA.tools_mentioned.some(t => 
    textB.includes(t.name.toLowerCase())
  )
  
  if (hasSharedElements) {
    for (const pattern of implementsPatterns) {
      if (pattern.test(textA) || pattern.test(textB)) {
        return {
          hasDirectReference: true,
          type: 'implements',
          reasoning: 'Implémentation détectée avec éléments partagés'
        }
      }
    }
    
    for (const pattern of questionsPatterns) {
      if (pattern.test(textA) || pattern.test(textB)) {
        return {
          hasDirectReference: true,
          type: 'questions',
          reasoning: 'Questionnement critique détecté'
        }
      }
    }
    
    for (const pattern of buildsPatterns) {
      if (pattern.test(textA) || pattern.test(textB)) {
        return {
          hasDirectReference: true,
          type: 'builds_on',
          reasoning: 'Extension/amélioration détectée'
        }
      }
    }
  }
  
  return { hasDirectReference: false, type: 'similar_to', reasoning: '' }
}

/**
 * Analyse des oppositions de controverse
 */
function analyzeControversyRelationship(articleA: Article, articleB: Article): {
  isControversial: boolean
  reasoning: string
} {
  // Chercher des concepts controversés opposés
  const controversialA = articleA.concepts.filter(c => c.controversy_level >= 2)
  const controversialB = articleB.concepts.filter(c => c.controversy_level >= 2)
  
  if (controversialA.length > 0 && controversialB.length > 0) {
    const perspectiveA = articleA.perspective.toLowerCase()
    const perspectiveB = articleB.perspective.toLowerCase()
    
    // Indicateurs de positions opposées
    const positiveIndicators = ['opportunité', 'prometteur', 'bénéfique', 'avancée', 'potentiel']
    const negativeIndicators = ['risque', 'danger', 'problème', 'inquiétude', 'limite', 'défi']
    
    const aPositive = positiveIndicators.some(word => perspectiveA.includes(word))
    const aNegative = negativeIndicators.some(word => perspectiveA.includes(word))
    const bPositive = positiveIndicators.some(word => perspectiveB.includes(word))
    const bNegative = negativeIndicators.some(word => perspectiveB.includes(word))
    
    if ((aPositive && bNegative) || (aNegative && bPositive)) {
      return {
        isControversial: true,
        reasoning: `Opposition sur concepts controversés: ${controversialA.concat(controversialB).map(c => c.name).join(', ')}`
      }
    }
  }
  
  return { isControversial: false, reasoning: '' }
}

/**
 * Calcul de la force des ponts interdisciplinaires (cœur du projet)
 */
function calculateBridgeStrength(
  articleA: Article, 
  articleB: Article, 
  sharedConcepts: string[], 
  sharedTools: string[], 
  sharedDomains: string[]
): number {
  let strength = 0.5 // Base pour ponts interdisciplinaires
  
  // Bonus pour éléments partagés (plus important pour ponts)
  strength += sharedConcepts.length * 0.15
  strength += sharedTools.length * 0.1
  strength += sharedDomains.length * 0.1
  
  // Bonus spécial pour ponts technique ↔ éthique (cœur du projet)
  if ((articleA.primary_domain === 'technique' && articleB.primary_domain === 'ethique') ||
      (articleA.primary_domain === 'ethique' && articleB.primary_domain === 'technique')) {
    strength += 0.15
  }
  
  // Bonus pour articles à fort intérêt éditorial
  const avgInterest = (articleA.interest_level + articleB.interest_level) / 2
  if (avgInterest >= 4) strength += 0.1
  
  return Math.min(strength, 0.9)
}

/**
 * Détermination du type de pont interdisciplinaire
 */
function determineBridgeType(articleA: Article, articleB: Article, textualAnalysis: any): Connection['type'] {
  // Si analyse textuelle a trouvé quelque chose, utiliser cela
  if (textualAnalysis.hasDirectReference) {
    return textualAnalysis.type
  }
  
  // Sinon, logique basée sur domaines
  const techToEthic = articleA.primary_domain === 'technique' && articleB.primary_domain === 'ethique'
  const ethicToTech = articleA.primary_domain === 'ethique' && articleB.primary_domain === 'technique'
  
  if (techToEthic || ethicToTech) {
    return 'builds_on' // Les ponts technique-éthique construisent généralement l'un sur l'autre
  }
  
  return 'similar_to'
}

/**
 * Calcul de similarité dans le même domaine
 */
function calculateSimilarityStrength(
  articleA: Article, 
  articleB: Article, 
  sharedConcepts: string[], 
  sharedTools: string[], 
  sharedDomains: string[]
): number {
  let strength = 0.35 // Base réduite pour plus de flexibilité
  
  // Calcul basé sur ratios de Jaccard pondérés
  const conceptJaccard = sharedConcepts.length > 0 ? 
    sharedConcepts.length / (articleA.concepts.length + articleB.concepts.length - sharedConcepts.length) : 0
  const toolJaccard = sharedTools.length > 0 ? 
    sharedTools.length / (articleA.tools_mentioned.length + articleB.tools_mentioned.length - sharedTools.length) : 0
  
  strength += conceptJaccard * 0.35
  strength += toolJaccard * 0.25
  
  // Plus généreux avec les domaines partagés
  if (sharedDomains.length >= 2) {
    strength += 0.2 // Bonus significatif pour 2+ domaines partagés
  } else if (sharedDomains.length === 1) {
    strength += 0.1 // Bonus modéré pour 1 domaine partagé
  }
  
  return Math.min(strength, 0.8)
}

/**
 * Pondération adaptative basée sur métadonnées
 */
function applyAdaptiveWeighting(
  baseStrength: number, 
  articleA: Article, 
  articleB: Article, 
  factors: {
    sharedConcepts: string[]
    sharedTools: string[]
    sharedDomains: string[]
    complexity: number
    temporalDistance: number
    interestAlignment: number
  }
): number {
  let adjustedStrength = baseStrength
  
  // Bonus pour articles récents ensemble (synergie temporelle)
  if (factors.temporalDistance < 6) { // moins de 6 mois
    adjustedStrength += 0.05
  }
  
  // Léger malus pour articles trop différents en complexité
  if (factors.complexity > 1) { // différence > 1 niveau
    adjustedStrength *= 0.95
  }
  
  // Bonus pour alignement d'intérêt éditorial
  if (factors.interestAlignment <= 1 && (articleA.interest_level >= 4 || articleB.interest_level >= 4)) {
    adjustedStrength += 0.05
  }
  
  // Malus pour articles avec peu de métadonnées (qualité moindre)
  const avgMetadataRichness = (
    (articleA.concepts.length + articleB.concepts.length) +
    (articleA.tools_mentioned.length + articleB.tools_mentioned.length) +
    (articleA.secondary_domains.length + articleB.secondary_domains.length)
  ) / 6
  
  if (avgMetadataRichness < 2) {
    adjustedStrength *= 0.9
  }
  
  return Math.max(0, Math.min(adjustedStrength, 0.95))
}

// ========================================================================
// FONCTIONS UTILITAIRES
// ========================================================================

function getComplexityScore(level: string): number {
  switch (level) {
    case 'beginner': return 1
    case 'intermediate': return 2
    case 'advanced': return 3
    default: return 2
  }
}

function calculateTemporalDistance(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  const diffInMonths = Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 30))
  return Math.round(diffInMonths)
}

// Génération automatique de toutes les connexions
export function generateAllConnections(articles: Article[]): Connection[] {
  const connections: Connection[] = []
  
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const connection = detectConnections(articles[i], articles[j])
      if (connection) {
        connections.push(connection)
        // Ne plus ajouter automatiquement les connexions bidirectionnelles
        // pour éviter l'explosion du nombre de connexions
      }
    }
  }
  
  return connections
}

// Calcul de la centralité des articles
export function calculateCentrality(articles: Article[], connections: Connection[]): Record<string, number> {
  const centrality: Record<string, number> = {}
  
  // Initialiser
  articles.forEach(article => {
    centrality[article.id] = 0
  })
  
  // Compter les connexions
  connections.forEach(connection => {
    centrality[connection.source_id] = (centrality[connection.source_id] || 0) + connection.strength
    centrality[connection.target_id] = (centrality[connection.target_id] || 0) + connection.strength
  })
  
  // Normaliser (0-1)
  const maxCentrality = Math.max(...Object.values(centrality))
  if (maxCentrality > 0) {
    Object.keys(centrality).forEach(id => {
      centrality[id] = centrality[id] / maxCentrality
    })
  }
  
  return centrality
}

// Détection des articles hub (très connectés)
export function findHubArticles(articles: Article[], connections: Connection[], threshold: number = 0.6): Article[] {
  const centrality = calculateCentrality(articles, connections)
  
  return articles.filter(article => centrality[article.id] >= threshold)
}

// Filtre les connexions par force minimale
export function filterConnectionsByStrength(connections: Connection[], minStrength: number = 0.3): Connection[] {
  return connections.filter(connection => connection.strength >= minStrength)
}