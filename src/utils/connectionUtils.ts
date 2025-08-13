import { Article, Connection } from '@/data/schema'

// Calculer les connexions d'un article à partir des données de connexion
export function calculateArticleConnections(
  articleId: string, 
  connections: Connection[]
): string[] {
  const connectedIds = new Set<string>()
  
  connections.forEach(conn => {
    if (conn.source_id === articleId) {
      connectedIds.add(conn.target_id)
    } else if (conn.target_id === articleId) {
      connectedIds.add(conn.source_id)
    }
  })
  
  return Array.from(connectedIds)
}

// Calculer le score de centralité d'un article
export function calculateCentralityScore(
  articleId: string, 
  connections: Connection[],
  totalArticles: number
): number {
  const articleConnections = calculateArticleConnections(articleId, connections)
  const connectionCount = articleConnections.length
  
  if (totalArticles <= 1) return 0
  
  // Score de centralité normalisé (0-1)
  // Un article connecté à tous les autres aurait un score de 1
  const maxPossibleConnections = totalArticles - 1
  return connectionCount / maxPossibleConnections
}

// Enrichir un article avec ses données de connexion calculées
export function enrichArticleWithConnections(
  article: Article, 
  connections: Connection[],
  totalArticles: number
): Article {
  const connectedArticles = calculateArticleConnections(article.id, connections)
  const centralityScore = calculateCentralityScore(article.id, connections, totalArticles)
  
  return {
    ...article,
    connected_articles: connectedArticles,
    centrality_score: centralityScore
  }
}

// Enrichir tous les articles avec leurs données de connexion
export function enrichArticlesWithConnections(
  articles: Article[], 
  connections: Connection[]
): Article[] {
  return articles.map(article => 
    enrichArticleWithConnections(article, connections, articles.length)
  )
}

// Obtenir les connexions directes d'un article avec leurs détails
export function getArticleConnectionDetails(
  articleId: string,
  connections: Connection[]
): Connection[] {
  return connections.filter(conn => 
    conn.source_id === articleId || conn.target_id === articleId
  )
}