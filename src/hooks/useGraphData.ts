import { useMemo, useState, useEffect } from 'react'
import { Article, GraphNode, GraphLink, Connection } from '@/data/schema'
import { generateAllConnections, calculateCentrality, filterConnectionsByStrength } from '@/utils/graphAlgorithms'
import { NAVIGATION_CONFIG } from '@/config/navigation'

interface GraphDataOptions {
  maxDepth: number
  minConnectionStrength: number
  maxNodes: number
}

export function useGraphData(
  articles: Article[],
  centerArticle: Article | null,
  filteredArticles: Article[] = [],
  options: Partial<GraphDataOptions> = {}
) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const config = {
    maxDepth: options.maxDepth ?? NAVIGATION_CONFIG.MAX_GRAPH_DEPTH,
    minConnectionStrength: options.minConnectionStrength ?? NAVIGATION_CONFIG.MIN_CONNECTION_STRENGTH,
    maxNodes: options.maxNodes ?? NAVIGATION_CONFIG.MAX_NODES_DISPLAYED
  }

  // Charger les connexions depuis le fichier JSON
  useEffect(() => {
    if (articles.length > 0) {
      setIsGenerating(true)
      // Charger les connexions depuis le fichier JSON généré
      fetch('/data/connections.json')
        .then(response => response.json())
        .then(data => {
          const allConnections = data.connections || []
          const filteredConnections = filterConnectionsByStrength(
            allConnections, 
            config.minConnectionStrength
          )
          setConnections(filteredConnections)
          setIsGenerating(false)
        })
        .catch(error => {
          console.error('❌ Erreur lors du chargement des connexions:', error)
          // Fallback : générer les connexions dynamiquement
          const allConnections = generateAllConnections(articles)
          const filteredConnections = filterConnectionsByStrength(
            allConnections, 
            config.minConnectionStrength
          )
          setConnections(filteredConnections)
          setIsGenerating(false)
        })
    }
  }, [articles, config.minConnectionStrength])

  // Données du graphique principal
  const graphData = useMemo(() => {
    if (!centerArticle) {
      // Mode overview : afficher les articles filtrés
      return generateOverviewGraph(filteredArticles.length > 0 ? filteredArticles : articles, connections, config)
    } else {
      // Mode focus : graphique centré sur un article
      return generateFocusGraph(centerArticle, articles, connections, config)
    }
  }, [centerArticle, articles, filteredArticles, connections, config])

  // Statistiques du graphique
  const stats = useMemo(() => {
    const centrality = calculateCentrality(articles, connections)
    
    return {
      totalNodes: graphData.nodes.length,
      totalLinks: graphData.links.length,
      totalConnections: connections.length,
      averageCentrality: Object.values(centrality).reduce((a, b) => a + b, 0) / articles.length,
      hubNodes: graphData.nodes.filter(node => 
        centrality[node.id] >= NAVIGATION_CONFIG.MIN_CENTRALITY_FOR_HUB
      ).length,
      isGenerating
    }
  }, [graphData, articles, connections, isGenerating])

  return {
    nodes: graphData.nodes,
    links: graphData.links,
    connections,
    stats,
    isGenerating
  }
}

// Génération du graphique en mode overview - Vue d'ensemble intelligente
function generateOverviewGraph(
  articles: Article[], 
  connections: Connection[], 
  config: GraphDataOptions
): { nodes: GraphNode[], links: GraphLink[] } {
  // Vue d'ensemble intelligente : prioriser les articles centraux
  const sortedArticles = articles
    .sort((a, b) => (b.centrality_score || 0) - (a.centrality_score || 0))
  
  // Si beaucoup d'articles, ne garder que les plus centraux
  let displayedArticles: Article[]
  if (articles.length > 20) {
    // Mode "hubs" : seulement les articles très centraux
    displayedArticles = sortedArticles
      .filter(article => (article.centrality_score || 0) >= NAVIGATION_CONFIG.MIN_CENTRALITY_FOR_HUB)
      .slice(0, Math.min(15, config.maxNodes))
  } else if (articles.length > 10) {
    // Mode intermédiaire : prioriser les centraux mais inclure d'autres
    const centralArticles = sortedArticles.filter(article => (article.centrality_score || 0) >= 0.4)
    const otherArticles = sortedArticles.filter(article => (article.centrality_score || 0) < 0.4)
    displayedArticles = [
      ...centralArticles.slice(0, Math.floor(config.maxNodes * 0.7)),
      ...otherArticles.slice(0, Math.floor(config.maxNodes * 0.3))
    ].slice(0, config.maxNodes)
  } else {
    // Peu d'articles : afficher tous
    displayedArticles = sortedArticles.slice(0, config.maxNodes)
  }
  
  const displayedIds = new Set(displayedArticles.map(a => a.id))
  
  const nodes: GraphNode[] = displayedArticles.map(article => ({
    id: article.id,
    article,
    depth: 0,
    radius: calculateNodeRadius(article, 0)
  }))

  // Filtrer les connexions avec seuil plus élevé pour la vue d'ensemble
  const overviewMinStrength = Math.max(config.minConnectionStrength, 0.5)
  const links: GraphLink[] = connections
    .filter(conn => 
      displayedIds.has(conn.source_id) && 
      displayedIds.has(conn.target_id) &&
      conn.strength >= overviewMinStrength
    )
    .map(conn => ({
      source: conn.source_id,
      target: conn.target_id,
      type: conn.type,
      strength: conn.strength,
      auto_detected: conn.auto_detected,
      reasoning: conn.reasoning
    }))

  return { nodes, links }
}

// Génération du graphique en mode focus
function generateFocusGraph(
  centerArticle: Article,
  allArticles: Article[],
  connections: Connection[],
  config: GraphDataOptions
): { nodes: GraphNode[], links: GraphLink[] } {
  const visitedNodes = new Set<string>()
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []

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
      // Trouver les connexions de cet article
      const articleConnections = connections.filter(conn => 
        (conn.source_id === article.id || conn.target_id === article.id) &&
        conn.strength >= config.minConnectionStrength
      )
      
      articleConnections.forEach(connection => {
        const connectedId = connection.source_id === article.id ? 
          connection.target_id : connection.source_id
        
        const connectedArticle = allArticles.find(a => a.id === connectedId)
        if (connectedArticle && !visitedNodes.has(connectedId)) {
          // Ajouter le lien
          links.push({
            source: connection.source_id,
            target: connection.target_id,
            type: connection.type,
            strength: connection.strength,
            auto_detected: connection.auto_detected,
            reasoning: connection.reasoning
          })
          
          // Continuer récursivement
          addNodesRecursively(connectedArticle, depth + 1)
        } else if (connectedArticle && visitedNodes.has(connectedId)) {
          // Ajouter le lien même si le nœud existe déjà
          const existingLink = links.find(link => 
            (link.source === connection.source_id && link.target === connection.target_id) ||
            (link.source === connection.target_id && link.target === connection.source_id)
          )
          
          if (!existingLink) {
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
      })
    }
  }
  
  addNodesRecursively(centerArticle, 0)
  return { nodes, links }
}

// Calcul du rayon des nœuds basé sur la centralité et l'importance - Différences accentuées
function calculateNodeRadius(article: Article, depth: number): number {
  const safeDepth = isNaN(depth) ? 0 : depth
  
  const safeCentralityScore = isNaN(article.centrality_score) ? 0 : article.centrality_score
  const safeInterestLevel = isNaN(article.interest_level) ? 3 : article.interest_level
  
  // Calcul basé principalement sur la centralité avec plus de contraste
  let baseRadius
  if (depth === 0) {
    // Nœud central : différences plus marquées (8-32px)
    baseRadius = 8 + (safeCentralityScore * 24) // Plage élargie
  } else {
    // Nœuds secondaires : écart plus important selon profondeur
    const depthPenalty = safeDepth * 3
    baseRadius = Math.max(14 - depthPenalty, 5) + (safeCentralityScore * 12)
  }
  
  // Bonus plus marqué pour l'intérêt éditorial
  const interestBonus = (safeInterestLevel - 3) * 2.5 // -7.5 à +7.5px
  
  const calculatedRadius = baseRadius + interestBonus
  
  // Limites finales avec plus d'écart (20% supplémentaire)
  const minRadius = depth === 0 ? 6 : 4  // Réduction du minimum
  const maxRadius = depth === 0 ? 35 : 25 // Augmentation du maximum
  
  const finalRadius = Math.max(
    Math.min(calculatedRadius, maxRadius),
    minRadius
  )
  
  return isNaN(finalRadius) ? 12 : finalRadius
}

// Hook pour les données graphiques avec état global
export function useGraphNavigation() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [hoveredArticle, setHoveredArticle] = useState<Article | null>(null)
  const [graphMode, setGraphMode] = useState<'overview' | 'focus'>('overview')

  const selectArticle = (article: Article | null) => {
    setSelectedArticle(article)
    setGraphMode(article ? 'focus' : 'overview')
  }

  return {
    selectedArticle,
    hoveredArticle,
    graphMode,
    selectArticle,
    setHoveredArticle,
    setGraphMode
  }
}