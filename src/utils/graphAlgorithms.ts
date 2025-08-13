import { Article, Connection } from '@/data/schema'

// Fonction utilitaire pour intersection d'arrays
function intersection<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter(value => arr2.includes(value))
}

export function detectConnections(articleA: Article, articleB: Article): Connection | null {
  let strength = 0
  let type: Connection['type'] = 'similar_to'
  let reasoning = ''
  
  // 1. Similarité par concepts
  const sharedConcepts = intersection(
    articleA.concepts.map(c => c.id),
    articleB.concepts.map(c => c.id)
  )
  const conceptSimilarity = sharedConcepts.length / 
    Math.max(articleA.concepts.length, articleB.concepts.length, 1)
  
  // 2. Outils communs
  const sharedTools = intersection(
    articleA.tools_mentioned.map(t => t.id),
    articleB.tools_mentioned.map(t => t.id)
  )
  const toolSimilarity = sharedTools.length / 
    Math.max(articleA.tools_mentioned.length, articleB.tools_mentioned.length, 1)
  
  // 3. Domaines partagés
  const allDomainsA = [articleA.primary_domain, ...articleA.secondary_domains]
  const allDomainsB = [articleB.primary_domain, ...articleB.secondary_domains]
  const sharedDomains = intersection(allDomainsA, allDomainsB)
  const domainSimilarity = sharedDomains.length / Math.max(allDomainsA.length, allDomainsB.length)
  
  // 4. Détection de contradiction (controverses opposées)
  const controversyOpposition = detectControversyOpposition(articleA, articleB)
  
  // 5. Référence directe (dans summary/perspective)
  const directReference = detectDirectReference(articleA, articleB)
  
  // 6. Détection pont technique-éthique
  const bridgeConnection = detectTechEthicsBridge(articleA, articleB)
  
  // Calcul score final
  if (directReference.found) {
    strength = 0.9
    type = directReference.type
    reasoning = directReference.context
  } else if (bridgeConnection.isBridge) {
    strength = 0.8
    type = 'questions'
    reasoning = bridgeConnection.reasoning
  } else if (controversyOpposition.detected) {
    strength = 0.7
    type = 'contradicts'
    reasoning = controversyOpposition.explanation
  } else if (conceptSimilarity > 0.4 || toolSimilarity > 0.3) {
    strength = Math.max(conceptSimilarity, toolSimilarity) * 0.8
    type = 'similar_to'
    reasoning = `Concepts partagés: ${sharedConcepts.length > 0 ? sharedConcepts.join(', ') : 'outils similaires'}`
  } else if (domainSimilarity > 0.3) {
    strength = domainSimilarity * 0.6
    type = 'similar_to'
    reasoning = `Domaines liés: ${sharedDomains.join(', ')}`
  }
  
  // Seuil de pertinence
  if (strength < 0.3) return null
  
  return {
    source_id: articleA.id,
    target_id: articleB.id,
    type,
    strength,
    auto_detected: true,
    reasoning
  }
}

function detectDirectReference(articleA: Article, articleB: Article): {
  found: boolean
  type: Connection['type']
  context: string
} {
  const textA = `${articleA.summary} ${articleA.perspective}`.toLowerCase()
  const textB = `${articleB.summary} ${articleB.perspective}`.toLowerCase()
  
  // Recherche de mots-clés d'implémentation
  const implementKeywords = ['implémente', 'utilise', 'applique', 'se base sur', 'emploie']
  const questionKeywords = ['questionne', 'remet en cause', 'critique', 'conteste']
  const buildKeywords = ['étend', 'améliore', 'optimise', 'développe']
  
  for (const keyword of implementKeywords) {
    if (textA.includes(keyword) && articleA.tools_mentioned.some(tool => 
        textB.includes(tool.name.toLowerCase()))) {
      return {
        found: true,
        type: 'implements',
        context: `Article A ${keyword} des outils mentionnés dans B`
      }
    }
  }
  
  for (const keyword of questionKeywords) {
    if (textA.includes(keyword) || textB.includes(keyword)) {
      return {
        found: true,
        type: 'questions',
        context: `Un article ${keyword} l'approche de l'autre`
      }
    }
  }
  
  for (const keyword of buildKeywords) {
    if (textA.includes(keyword) || textB.includes(keyword)) {
      return {
        found: true,
        type: 'builds_on',
        context: `Un article ${keyword} l'approche de l'autre`
      }
    }
  }
  
  return { found: false, type: 'similar_to', context: '' }
}

function detectControversyOpposition(articleA: Article, articleB: Article): {
  detected: boolean
  explanation: string
} {
  // Chercher des concepts avec niveaux de controverse opposés
  const highControversyA = articleA.concepts.filter(c => c.controversy_level >= 2)
  const highControversyB = articleB.concepts.filter(c => c.controversy_level >= 2)
  
  if (highControversyA.length > 0 && highControversyB.length > 0) {
    // Vérifier si les perspectives sont opposées
    const textA = articleA.perspective.toLowerCase()
    const textB = articleB.perspective.toLowerCase()
    
    const positiveWords = ['avancée', 'opportunité', 'prometteur', 'bénéfique']
    const negativeWords = ['risque', 'danger', 'problème', 'inquiétude', 'urgent']
    
    const aIsPositive = positiveWords.some(word => textA.includes(word))
    const aIsNegative = negativeWords.some(word => textA.includes(word))
    const bIsPositive = positiveWords.some(word => textB.includes(word))
    const bIsNegative = negativeWords.some(word => textB.includes(word))
    
    if ((aIsPositive && bIsNegative) || (aIsNegative && bIsPositive)) {
      return {
        detected: true,
        explanation: 'Perspectives opposées sur des concepts controversés'
      }
    }
  }
  
  return { detected: false, explanation: '' }
}

function detectTechEthicsBridge(articleA: Article, articleB: Article): {
  isBridge: boolean
  reasoning: string
} {
  // Vérifier si un article est technique et l'autre éthique
  const isBridge = (articleA.primary_domain === 'technique' && articleB.primary_domain === 'ethique') ||
                   (articleA.primary_domain === 'ethique' && articleB.primary_domain === 'technique')
  
  if (isBridge) {
    // Chercher des domaines secondaires communs
    const sharedSecondary = intersection(articleA.secondary_domains, articleB.secondary_domains)
    
    if (sharedSecondary.length > 0) {
      return {
        isBridge: true,
        reasoning: `Pont technique-éthique via: ${sharedSecondary.join(', ')}`
      }
    }
    
    return {
      isBridge: true,
      reasoning: 'Connexion directe entre innovation technique et réflexion éthique'
    }
  }
  
  return { isBridge: false, reasoning: '' }
}

// Génération automatique de toutes les connexions
export function generateAllConnections(articles: Article[]): Connection[] {
  const connections: Connection[] = []
  
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const connection = detectConnections(articles[i], articles[j])
      if (connection) {
        connections.push(connection)
        // Ajouter la connexion inverse si elle fait sens
        if (connection.type === 'similar_to') {
          connections.push({
            ...connection,
            source_id: connection.target_id,
            target_id: connection.source_id
          })
        }
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