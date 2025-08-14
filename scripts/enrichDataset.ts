import fs from 'fs'
import path from 'path'
import { generateAllConnections } from '../src/utils/graphAlgorithms'
import { Article } from '../src/data/schema'

// interface Connection {
//   source_id: string
//   target_id: string
//   type: string
//   strength: number
//   auto_detected: boolean
//   reasoning: string
// }

async function enrichDataset() {
  console.log('🚀 ENRICHISSEMENT COMPLET DU DATASET')
  console.log('====================================')

  const articlesPath = path.join(process.cwd(), 'public/data/articles.json')
  const connectionsPath = path.join(process.cwd(), 'public/data/connections.json')
  
  // Charger les articles
  const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'))
  const articles: Article[] = articlesData.articles

  console.log(`📚 Articles chargés: ${articles.length}`)

  // Étape 1: Régénérer toutes les connexions avec les nouveaux algorithmes
  console.log('\n🔄 ÉTAPE 1: Génération des connexions...')
  const newConnections = generateAllConnections(articles)
  
  console.log(`📊 Connexions générées: ${newConnections.length}`)
  
  // Analyser la distribution des types
  const typeDistribution = newConnections.reduce((acc, conn) => {
    acc[conn.type] = (acc[conn.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\n📈 Distribution des types de connexions:')
  Object.entries(typeDistribution)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      const percentage = ((count / newConnections.length) * 100).toFixed(1)
      console.log(`  - ${type}: ${count} (${percentage}%)`)
    })

  // Étape 2: Calculer les connexions directes par article
  console.log('\n🔄 ÉTAPE 2: Calcul des connexions directes...')
  const articleConnections = new Map<string, string[]>()
  
  // Initialiser
  articles.forEach(article => {
    articleConnections.set(article.id, [])
  })

  // Remplir avec les nouvelles connexions
  newConnections.forEach(conn => {
    const sourceList = articleConnections.get(conn.source_id) || []
    const targetList = articleConnections.get(conn.target_id) || []
    
    if (!sourceList.includes(conn.target_id)) {
      sourceList.push(conn.target_id)
    }
    if (!targetList.includes(conn.source_id)) {
      targetList.push(conn.source_id)
    }
    
    articleConnections.set(conn.source_id, sourceList)
    articleConnections.set(conn.target_id, targetList)
  })

  // Étape 3: Recalculer la centralité
  console.log('\n🔄 ÉTAPE 3: Calcul de la centralité...')
  const centrality: Record<string, number> = {}
  
  articles.forEach(article => {
    const connectionStrength = newConnections
      .filter(conn => conn.source_id === article.id || conn.target_id === article.id)
      .reduce((sum, conn) => sum + conn.strength, 0)
    
    centrality[article.id] = connectionStrength
  })

  // Normaliser (0-1)
  const maxCentrality = Math.max(...Object.values(centrality))
  if (maxCentrality > 0) {
    Object.keys(centrality).forEach(id => {
      centrality[id] = centrality[id] / maxCentrality
    })
  }

  // Étape 4: Mettre à jour les articles
  console.log('\n🔄 ÉTAPE 4: Mise à jour des articles...')
  const enrichedArticles = articles.map(article => ({
    ...article,
    connected_articles: articleConnections.get(article.id) || [],
    centrality_score: centrality[article.id] || 0
  }))

  // Étape 5: Sauvegarder les résultats
  console.log('\n💾 ÉTAPE 5: Sauvegarde...')
  
  // Sauvegarder les connexions
  const connectionsOutput = {
    connections: newConnections,
    generated_at: new Date().toISOString(),
    total_connections: newConnections.length,
    type_distribution: typeDistribution
  }
  
  fs.writeFileSync(connectionsPath, JSON.stringify(connectionsOutput, null, 2))
  console.log(`✅ Connexions sauvegardées: ${connectionsPath}`)

  // Sauvegarder les articles enrichis
  const articlesOutput = {
    ...articlesData,
    articles: enrichedArticles,
    enriched_at: new Date().toISOString()
  }
  
  fs.writeFileSync(articlesPath, JSON.stringify(articlesOutput, null, 2))
  console.log(`✅ Articles enrichis sauvegardés: ${articlesPath}`)

  // Étape 6: Rapport final
  console.log('\n📋 RAPPORT FINAL')
  console.log('===============')
  
  const avgConnections = enrichedArticles.reduce((sum, a) => sum + a.connected_articles.length, 0) / enrichedArticles.length
  const maxConnections = Math.max(...enrichedArticles.map(a => a.connected_articles.length))
  const minConnections = Math.min(...enrichedArticles.map(a => a.connected_articles.length))
  
  console.log(`📊 Statistiques:`)
  console.log(`  - Total articles: ${enrichedArticles.length}`)
  console.log(`  - Total connexions: ${newConnections.length}`)
  console.log(`  - Connexions moyennes/article: ${avgConnections.toFixed(1)}`)
  console.log(`  - Max connexions: ${maxConnections}`)
  console.log(`  - Min connexions: ${minConnections}`)
  
  const avgCentrality = Object.values(centrality).reduce((sum, c) => sum + c, 0) / Object.values(centrality).length
  console.log(`  - Centralité moyenne: ${avgCentrality.toFixed(3)}`)
  
  console.log(`\n🎯 Type de connexions le plus fréquent: ${Object.entries(typeDistribution)
    .sort(([,a], [,b]) => b - a)[0][0]} (${(Object.entries(typeDistribution)
    .sort(([,a], [,b]) => b - a)[0][1] / newConnections.length * 100).toFixed(1)}%)`)

  console.log('\n✨ Enrichissement terminé avec succès!')
}

// Exécuter l'enrichissement
enrichDataset().catch(console.error)