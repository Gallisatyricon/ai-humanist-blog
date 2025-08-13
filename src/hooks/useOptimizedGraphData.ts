import { useMemo, useState, useEffect } from 'react'
import { Article, GraphNode, GraphLink, Connection, ArticleData, ConnectionData } from '@/data/schema'
import { NAVIGATION_CONFIG } from '@/config/navigation'

interface OptimizedGraphDataOptions {
  maxDepth: number
  minConnectionStrength: number
  maxNodes: number
}

// Hook optimisé qui utilise le nouveau format avec index
export function useOptimizedGraphData(
  centerArticle: Article | null,
  filteredArticles: Article[] = [],
  options: Partial<OptimizedGraphDataOptions> = {}
) {
  const [articleData, setArticleData] = useState<ArticleData | null>(null)
  const [connectionData, setConnectionData] = useState<ConnectionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = {
    maxDepth: options.maxDepth ?? NAVIGATION_CONFIG.MAX_GRAPH_DEPTH,
    minConnectionStrength: options.minConnectionStrength ?? NAVIGATION_CONFIG.MIN_CONNECTION_STRENGTH,
    maxNodes: options.maxNodes ?? NAVIGATION_CONFIG.MAX_NODES_DISPLAYED
  }

  // Chargement optimisé des données
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)
      
      try {
        const [articlesResponse, connectionsResponse] = await Promise.all([
          fetch('/data/articles.json'),
          fetch('/data/connections.json')
        ])

        if (!articlesResponse.ok || !connectionsResponse.ok) {
          throw new Error('Erreur lors du chargement des données')
        }

        const [articlesData, connectionsData] = await Promise.all([
          articlesResponse.json() as Promise<ArticleData>,
          connectionsResponse.json() as Promise<ConnectionData>
        ])

        setArticleData(articlesData)
        setConnectionData(connectionsData)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        console.error('Erreur chargement données:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Génération du graphique optimisée avec index
  const graphData = useMemo(() => {
    if (!articleData || !connectionData) {
      return { nodes: [], links: [] }
    }

    const articles = articleData.articles
    const connections = connectionData.connections
    const connectionIndex = connectionData.connection_index

    if (!centerArticle) {
      // Mode overview : utiliser les articles filtrés
      return generateOptimizedOverviewGraph(
        filteredArticles.length > 0 ? filteredArticles : articles, 
        connections,
        connectionIndex,
        config
      )
    } else {
      // Mode focus : graphique centré avec index
      return generateOptimizedFocusGraph(
        centerArticle, 
        articles, 
        connections,
        connectionIndex,
        config
      )
    }
  }, [centerArticle, articleData, connectionData, filteredArticles, config])

  // Statistiques optimisées
  const stats = useMemo(() => {
    if (!articleData || !connectionData) {
      return {
        totalNodes: 0,
        totalLinks: 0,
        totalConnections: 0,
        averageCentrality: 0,
        hubNodes: 0,
        isLoading: true
      }
    }

    const articles = articleData.articles
    const avgCentrality = articles.reduce((sum, a) => sum + a.centrality_score, 0) / articles.length
    const hubCount = articles.filter(a => a.centrality_score >= NAVIGATION_CONFIG.MIN_CENTRALITY_FOR_HUB).length

    return {
      totalNodes: graphData.nodes.length,
      totalLinks: graphData.links.length,
      totalConnections: connectionData.total_connections,
      averageCentrality: avgCentrality,
      hubNodes: hubCount,
      isLoading: false
    }
  }, [graphData, articleData, connectionData])

  return {
    nodes: graphData.nodes,
    links: graphData.links,
    articles: articleData?.articles || [],
    connections: connectionData?.connections || [],
    stats,
    isLoading,
    error
  }
}

// Génération optimisée du graphique overview
function generateOptimizedOverviewGraph(
  articles: Article[], 
  connections: Connection[], 
  connectionIndex: Record<string, string[]>,
  config: OptimizedGraphDataOptions
): { nodes: GraphNode[], links: GraphLink[] } {
  // Tri par centralité pour afficher les plus importants
  const sortedArticles = [...articles].sort((a, b) => b.centrality_score - a.centrality_score)
  const displayedArticles = sortedArticles.slice(0, config.maxNodes)
  const displayedIds = new Set(displayedArticles.map(a => a.id))
  
  const nodes: GraphNode[] = displayedArticles.map(article => ({
    id: article.id,
    article,
    depth: 0,
    radius: calculateNodeRadius(article, 0)
  }))

  // Utilisation de l'index pour un accès rapide aux connexions
  const links: GraphLink[] = []
  const processedPairs = new Set<string>()

  displayedArticles.forEach(article => {
    const connectedIds = connectionIndex[article.id] || []
    
    connectedIds.forEach(connectedId => {
      if (displayedIds.has(connectedId)) {
        // Éviter les doublons avec une clé ordonnée
        const pairKey = [article.id, connectedId].sort().join('-')
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey)
          
          // Trouver la connexion correspondante
          const connection = connections.find(conn => 
            (conn.source_id === article.id && conn.target_id === connectedId) ||
            (conn.source_id === connectedId && conn.target_id === article.id)
          )
          
          if (connection && connection.strength >= config.minConnectionStrength) {
            links.push({
              source: connection.source_id,
              target: connection.target_id,
              type: connection.type,
              strength: connection.strength,
              auto_detected: connection.auto_detected,
              reasoning: connection.reasoning
            })
          }
        }
      }
    })
  })

  return { nodes, links }
}

// Génération optimisée du graphique focus
function generateOptimizedFocusGraph(
  centerArticle: Article,
  allArticles: Article[],
  connections: Connection[],
  connectionIndex: Record<string, string[]>,
  config: OptimizedGraphDataOptions
): { nodes: GraphNode[], links: GraphLink[] } {
  const visitedNodes = new Set<string>()
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const processedLinks = new Set<string>()

  // Création d'un map pour accès rapide aux articles
  const articleMap = new Map(allArticles.map(a => [a.id, a]))
  const connectionMap = new Map(connections.map(c => [`${c.source_id}-${c.target_id}`, c]))

  function addNodesRecursively(article: Article, depth: number) {
    if (depth > config.maxDepth || visitedNodes.has(article.id) || nodes.length >= config.maxNodes) {
      return
    }
    
    visitedNodes.add(article.id)
    nodes.push({
      id: article.id,
      article,
      depth,
      radius: calculateNodeRadius(article, depth)
    })
    
    if (depth < config.maxDepth) {
      // Utiliser l'index pour accès rapide aux connexions
      const connectedIds = connectionIndex[article.id] || []
      
      connectedIds.forEach(connectedId => {
        const connectedArticle = articleMap.get(connectedId)
        if (!connectedArticle) return

        // Trouver la connexion correspondante avec force suffisante
        const connection = connectionMap.get(`${article.id}-${connectedId}`) ||
                          connectionMap.get(`${connectedId}-${article.id}`)
        
        if (!connection || connection.strength < config.minConnectionStrength) return

        // Ajouter le lien si pas déjà traité
        const linkKey = [connection.source_id, connection.target_id].sort().join('-')
        if (!processedLinks.has(linkKey)) {
          processedLinks.add(linkKey)
          links.push({
            source: connection.source_id,
            target: connection.target_id,
            type: connection.type,
            strength: connection.strength,
            auto_detected: connection.auto_detected,
            reasoning: connection.reasoning
          })
        }
        
        // Continuer récursivement si pas encore visité
        if (!visitedNodes.has(connectedId)) {
          addNodesRecursively(connectedArticle, depth + 1)
        }
      })
    }
  }
  
  addNodesRecursively(centerArticle, 0)
  return { nodes, links }
}

// Calcul optimisé du rayon des nœuds
function calculateNodeRadius(article: Article, depth: number): number {
  const baseRadius = NAVIGATION_CONFIG.NODE_SIZES.central - (depth * 3)
  const importanceBonus = article.centrality_score * 5
  const interestBonus = article.interest_level * 1
  
  return Math.max(
    Math.min(baseRadius + importanceBonus + interestBonus, 25),
    8
  )
}

// Hook pour la recherche optimisée avec index
export function useOptimizedSearch(query: string, articles: Article[]) {
  return useMemo(() => {
    if (!query.trim()) return { exact: [], related: [], domain: [] }
    
    const normalizedQuery = query.toLowerCase()
    const exactMatches: Article[] = []
    const relatedMatches: Article[] = []
    const domainMatches: Article[] = []
    
    articles.forEach(article => {
      const titleMatch = article.title.toLowerCase().includes(normalizedQuery)
      const conceptMatch = article.concepts.some(c => c.name.toLowerCase().includes(normalizedQuery))
      
      if (titleMatch || conceptMatch) {
        exactMatches.push(article)
      } else {
        const summaryMatch = article.summary.toLowerCase().includes(normalizedQuery)
        const toolMatch = article.tools_mentioned.some(t => t.name.toLowerCase().includes(normalizedQuery))
        
        if (summaryMatch || toolMatch) {
          relatedMatches.push(article)
        } else {
          const domainMatch = [article.primary_domain, ...article.secondary_domains]
            .some(d => d.includes(normalizedQuery))
          
          if (domainMatch) {
            domainMatches.push(article)
          }
        }
      }
    })
    
    return {
      exact: exactMatches.sort((a, b) => b.centrality_score - a.centrality_score),
      related: relatedMatches.sort((a, b) => b.centrality_score - a.centrality_score),
      domain: domainMatches.sort((a, b) => b.centrality_score - a.centrality_score)
    }
  }, [query, articles])
}