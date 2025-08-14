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
  [key: string]: any
}

async function syncConnectedArticles() {
  console.log('🔄 SYNCHRONISATION DES ARTICLES CONNECTÉS')
  console.log('==========================================')

  // Charger les données
  const connectionsPath = path.join(process.cwd(), 'public/data/connections.json')
  const articlesPath = path.join(process.cwd(), 'public/data/articles.json')
  
  const connectionsData = JSON.parse(fs.readFileSync(connectionsPath, 'utf-8'))
  const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'))
  
  const connections: Connection[] = connectionsData.connections
  const articles: Article[] = articlesData.articles

  console.log(`📊 Données chargées:`)
  console.log(`- Articles: ${articles.length}`)
  console.log(`- Connexions: ${connections.length}`)

  // Construire la map des connexions par article
  const articleConnections = new Map<string, string[]>()
  
  // Initialiser toutes les listes à vide
  articles.forEach(article => {
    articleConnections.set(article.id, [])
  })

  // Remplir avec les connexions directes
  connections.forEach(conn => {
    // Ajouter target à la liste de source
    const sourceConnections = articleConnections.get(conn.source_id) || []
    if (!sourceConnections.includes(conn.target_id)) {
      sourceConnections.push(conn.target_id)
    }
    articleConnections.set(conn.source_id, sourceConnections)

    // Ajouter source à la liste de target (connexion bidirectionnelle)
    const targetConnections = articleConnections.get(conn.target_id) || []
    if (!targetConnections.includes(conn.source_id)) {
      targetConnections.push(conn.source_id)
    }
    articleConnections.set(conn.target_id, targetConnections)
  })

  // Calculer la centralité mise à jour
  const centrality: Record<string, number> = {}
  
  articles.forEach(article => {
    const directConnections = articleConnections.get(article.id) || []
    // Score basé sur le nombre et la force des connexions
    const connectionStrength = connections
      .filter(conn => conn.source_id === article.id || conn.target_id === article.id)
      .reduce((sum, conn) => sum + conn.strength, 0)
    
    centrality[article.id] = connectionStrength / Math.max(connections.length, 1)
  })

  // Normaliser la centralité (0-1)
  const maxCentrality = Math.max(...Object.values(centrality))
  if (maxCentrality > 0) {
    Object.keys(centrality).forEach(id => {
      centrality[id] = centrality[id] / maxCentrality
    })
  }

  // Mettre à jour les articles
  let updatedCount = 0
  const updatedArticles = articles.map(article => {
    const directConnections = articleConnections.get(article.id) || []
    const newCentrality = centrality[article.id] || 0
    
    // Vérifier si mise à jour nécessaire
    const needsUpdate = 
      JSON.stringify(article.connected_articles.sort()) !== JSON.stringify(directConnections.sort()) ||
      Math.abs(article.centrality_score - newCentrality) > 0.001

    if (needsUpdate) {
      updatedCount++
      console.log(`📝 Mise à jour: ${article.title.substring(0, 40)}...`)
      console.log(`  - Connexions: ${article.connected_articles.length} → ${directConnections.length}`)
      console.log(`  - Centralité: ${article.centrality_score.toFixed(3)} → ${newCentrality.toFixed(3)}`)
    }

    return {
      ...article,
      connected_articles: directConnections,
      centrality_score: newCentrality
    }
  })

  // Sauvegarder si des changements
  if (updatedCount > 0) {
    const updatedData = {
      ...articlesData,
      articles: updatedArticles
    }

    fs.writeFileSync(articlesPath, JSON.stringify(updatedData, null, 2))
    console.log(`\n✅ Synchronisation terminée: ${updatedCount} articles mis à jour`)
    
    // Afficher quelques statistiques
    const avgConnections = updatedArticles.reduce((sum, a) => sum + a.connected_articles.length, 0) / updatedArticles.length
    console.log(`📊 Statistiques finales:`)
    console.log(`- Connexions moyennes par article: ${avgConnections.toFixed(1)}`)
    console.log(`- Article le plus connecté: ${Math.max(...updatedArticles.map(a => a.connected_articles.length))} connexions`)
  } else {
    console.log(`✅ Aucune mise à jour nécessaire`)
  }
}

// Exécuter la synchronisation
syncConnectedArticles().catch(console.error)