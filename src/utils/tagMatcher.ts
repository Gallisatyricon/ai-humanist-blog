import { Article, SecondaryDomain, TagWeight } from '@/data/schema'

export function calculateTagImportance(articles: Article[]): TagWeight {
  const tagCounts: Record<string, number> = {}
  const tagConnections: Record<string, number> = {}
  
  articles.forEach(article => {
    // Compter fréquence des domaines primaires
    tagCounts[article.primary_domain] = (tagCounts[article.primary_domain] || 0) + 1
    
    // Compter fréquence des domaines secondaires
    article.secondary_domains.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
    
    // Compter interconnexions entre tags
    article.connected_articles.forEach(connectedId => {
      const connected = articles.find(a => a.id === connectedId)
      if (connected) {
        // Connexions primaire-primaire
        const primaryKey = [article.primary_domain, connected.primary_domain].sort().join('-')
        tagConnections[primaryKey] = (tagConnections[primaryKey] || 0) + 1
        
        // Connexions secondaires
        article.secondary_domains.forEach(tag1 => {
          connected.secondary_domains.forEach(tag2 => {
            if (tag1 !== tag2) {
              const key = [tag1, tag2].sort().join('-')
              tagConnections[key] = (tagConnections[key] || 0) + 1
            }
          })
        })
      }
    })
  })
  
  // Calcul score final : fréquence * interconnexions
  return Object.keys(tagCounts).reduce((acc, tag) => {
    const frequency = tagCounts[tag] / articles.length
    const connectivity = getTagConnectivity(tag, tagConnections)
    acc[tag] = frequency * (1 + connectivity) // +1 pour éviter score 0
    return acc
  }, {} as TagWeight)
}

function getTagConnectivity(tag: string, connections: Record<string, number>): number {
  let connectivity = 0
  Object.keys(connections).forEach(key => {
    if (key.includes(tag)) {
      connectivity += connections[key]
    }
  })
  return connectivity / 10 // Normalisation
}

export function getRelevantSecondaryTags(
  selectedPrimaryTags: string[],
  articles: Article[],
  maxTags: number = 12
): SecondaryDomain[] {
  if (selectedPrimaryTags.length === 0) {
    // Retourner les tags les plus fréquents globalement
    return getMostFrequentSecondaryTags(articles, maxTags)
  }
  
  // Filtrer les articles correspondant aux domaines primaires sélectionnés
  const filteredArticles = articles.filter(article =>
    selectedPrimaryTags.includes(article.primary_domain)
  )
  
  // Compter les domaines secondaires dans ces articles
  const secondaryCount: Record<string, number> = {}
  filteredArticles.forEach(article => {
    article.secondary_domains.forEach(domain => {
      secondaryCount[domain] = (secondaryCount[domain] || 0) + 1
    })
  })
  
  // Trier par fréquence et retourner les plus pertinents
  return Object.entries(secondaryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxTags)
    .map(([domain]) => domain as SecondaryDomain)
}

function getMostFrequentSecondaryTags(
  articles: Article[],
  maxTags: number
): SecondaryDomain[] {
  const frequency: Record<string, number> = {}
  
  articles.forEach(article => {
    article.secondary_domains.forEach(domain => {
      frequency[domain] = (frequency[domain] || 0) + 1
    })
  })
  
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxTags)
    .map(([domain]) => domain as SecondaryDomain)
}

export function filterArticlesByTags(
  articles: Article[],
  selectedPrimaryTags: string[],
  selectedSecondaryTags: string[]
): Article[] {
  return articles.filter(article => {
    // Filtrer par domaines primaires si sélectionnés
    const primaryMatch = selectedPrimaryTags.length === 0 || 
      selectedPrimaryTags.includes(article.primary_domain)
    
    // Filtrer par domaines secondaires si sélectionnés
    const secondaryMatch = selectedSecondaryTags.length === 0 ||
      selectedSecondaryTags.some(tag => article.secondary_domains.includes(tag as SecondaryDomain))
    
    return primaryMatch && secondaryMatch
  })
}

// Utilitaire pour calculer la taille d'un tag basé sur son importance
export function calculateTagSize(weight: number, minSize: number = 12, maxSize: number = 24): number {
  const normalizedWeight = Math.min(Math.max(weight, 0), 1)
  return minSize + (maxSize - minSize) * normalizedWeight
}

// Utilitaire pour calculer l'opacité d'un tag
export function calculateTagOpacity(weight: number, minOpacity: number = 0.6): number {
  return minOpacity + (1 - minOpacity) * Math.min(weight, 1)
}

// Fonction pour détecter les tags "pont" (connectant technique et éthique)
export function findBridgeTags(articles: Article[]): SecondaryDomain[] {
  const bridgeCount: Record<string, number> = {}
  
  articles.forEach(article => {
    if (article.primary_domain === 'technique' || article.primary_domain === 'ethique') {
      article.connected_articles.forEach(connectedId => {
        const connected = articles.find(a => a.id === connectedId)
        if (connected && 
           ((article.primary_domain === 'technique' && connected.primary_domain === 'ethique') ||
            (article.primary_domain === 'ethique' && connected.primary_domain === 'technique'))) {
          
          // Compter les tags secondaires communs
          article.secondary_domains.forEach(tag => {
            if (connected.secondary_domains.includes(tag)) {
              bridgeCount[tag] = (bridgeCount[tag] || 0) + 1
            }
          })
        }
      })
    }
  })
  
  return Object.entries(bridgeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag as SecondaryDomain)
}