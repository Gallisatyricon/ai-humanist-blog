import fs from 'fs'
import path from 'path'

interface Connection {
  source_id: string
  target_id: string
  type: string
  strength: number
  auto_detected: boolean
  reasoning: string
}

interface Article {
  id: string
  title: string
  connected_articles: string[]
  centrality_score: number
}

async function analyzeConnections() {
  console.log('🔍 ANALYSE DES CONNEXIONS')
  console.log('==========================')

  // Charger les données
  const connectionsPath = path.join(process.cwd(), 'public/data/connections.json')
  const articlesPath = path.join(process.cwd(), 'public/data/articles.json')
  
  const connectionsData = JSON.parse(fs.readFileSync(connectionsPath, 'utf-8'))
  const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'))
  
  const connections: Connection[] = connectionsData.connections
  const articles: Article[] = articlesData.articles

  console.log(`📊 STATISTIQUES GLOBALES`)
  console.log(`- Articles: ${articles.length}`)
  console.log(`- Connexions totales: ${connections.length}`)
  
  // Analyser les types de connexions
  const connectionTypes = connections.reduce((acc, conn) => {
    acc[conn.type] = (acc[conn.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log(`\\n🔗 TYPES DE CONNEXIONS:`)
  Object.entries(connectionTypes)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      const percentage = ((count / connections.length) * 100).toFixed(1)
      console.log(`- ${type}: ${count} (${percentage}%)`)
    })

  // Analyser les forces de connexions
  const strengthDistribution = connections.reduce((acc, conn) => {
    const bucket = Math.floor(conn.strength * 10) / 10
    acc[bucket] = (acc[bucket] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  console.log(`\\n💪 DISTRIBUTION FORCES:`)
  Object.entries(strengthDistribution)
    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
    .forEach(([strength, count]) => {
      const percentage = ((count / connections.length) * 100).toFixed(1)
      console.log(`- ${strength}: ${count} (${percentage}%)`)
    })

  // Analyser les connexions par article
  const articleConnections = new Map<string, {direct: number, total: number}>()
  
  // Compter les connexions directes
  connections.forEach(conn => {
    const source = articleConnections.get(conn.source_id) || {direct: 0, total: 0}
    const target = articleConnections.get(conn.target_id) || {direct: 0, total: 0}
    
    source.direct++
    target.direct++
    
    articleConnections.set(conn.source_id, source)
    articleConnections.set(conn.target_id, target)
  })

  // Compter les connexions avec profondeur
  function getConnectionsAtDepth(articleId: string, depth: number, visited = new Set<string>()): Set<string> {
    if (depth === 0 || visited.has(articleId)) return new Set()
    
    visited.add(articleId)
    const directConnections = new Set<string>()
    
    connections.forEach(conn => {
      if (conn.source_id === articleId && !visited.has(conn.target_id)) {
        directConnections.add(conn.target_id)
      } else if (conn.target_id === articleId && !visited.has(conn.source_id)) {
        directConnections.add(conn.source_id)
      }
    })

    if (depth > 1) {
      const indirectConnections = new Set<string>()
      directConnections.forEach(connectedId => {
        const deeper = getConnectionsAtDepth(connectedId, depth - 1, new Set(visited))
        deeper.forEach(id => indirectConnections.add(id))
      })
      directConnections.forEach(id => indirectConnections.add(id))
      return indirectConnections
    }
    
    return directConnections
  }

  console.log(`\\n📈 TOP 5 ARTICLES PAR CONNEXIONS:`)
  const sortedArticles = Array.from(articleConnections.entries())
    .sort(([,a], [,b]) => b.direct - a.direct)
    .slice(0, 5)

  sortedArticles.forEach(([articleId, stats], index) => {
    const article = articles.find(a => a.id === articleId)
    const depth2Connections = getConnectionsAtDepth(articleId, 2)
    console.log(`${index + 1}. ${article?.title?.substring(0, 50) || articleId}...`)
    console.log(`   - Connexions directes: ${stats.direct}`)
    console.log(`   - Connexions profondeur 2: ${depth2Connections.size}`)
    console.log(`   - connected_articles dans data: ${article?.connected_articles?.length || 0}`)
    console.log('')
  })

  // Analyser un cas spécifique problématique
  console.log(`\\n🔍 ANALYSE DÉTAILLÉE - Premier article:`)
  const firstArticle = sortedArticles[0]
  if (firstArticle) {
    const [articleId] = firstArticle
    const article = articles.find(a => a.id === articleId)
    
    console.log(`Article: ${article?.title}`)
    console.log(`ID: ${articleId}`)
    
    const directConnections = connections.filter(conn => 
      conn.source_id === articleId || conn.target_id === articleId
    )
    
    console.log(`\\nConnexions directes (${directConnections.length}):`)
    directConnections.slice(0, 10).forEach(conn => {
      const otherId = conn.source_id === articleId ? conn.target_id : conn.source_id
      const otherArticle = articles.find(a => a.id === otherId)
      console.log(`- ${conn.type} (${conn.strength}) → ${otherArticle?.title?.substring(0, 40) || otherId}...`)
    })
    
    const depth2Connections = getConnectionsAtDepth(articleId, 2)
    console.log(`\\nConnexions profondeur 2: ${depth2Connections.size} articles`)
  }
}

// Exécuter l'analyse
analyzeConnections().catch(console.error)