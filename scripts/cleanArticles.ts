#!/usr/bin/env tsx
/**
 * Script pour nettoyer les articles et ne garder que les nouveaux
 */

import fs from 'fs/promises'
import path from 'path'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

async function cleanArticles() {
  console.log('🧹 Nettoyage des articles...')
  
  try {
    // Charger les articles
    const articlesData = await fs.readFile(ARTICLES_PATH, 'utf-8')
    const data = JSON.parse(articlesData)
    const allArticles = Array.isArray(data) ? data : data.articles || []
    
    console.log(`📊 Total articles avant nettoyage: ${allArticles.length}`)
    
    // Ne garder que les articles récents (art_007 et plus)
    const cleanArticles = allArticles.filter(article => {
      const articleNumber = parseInt(article.id.replace('art_', ''))
      return articleNumber >= 7
    })
    
    console.log(`✅ Articles après nettoyage: ${cleanArticles.length}`)
    
    // Corriger les données manquantes dans chaque article
    const fixedArticles = cleanArticles.map(article => ({
      ...article,
      // S'assurer que tous les champs requis existent
      secondary_domains: article.secondary_domains || [],
      concepts: article.concepts || [],
      tools_mentioned: article.tools_mentioned || [],
      connected_articles: article.connected_articles || [],
      centrality_score: article.centrality_score || 0
    }))
    
    // Sauvegarder
    const newData = {
      articles: fixedArticles,
      last_updated: new Date().toISOString(),
      total_articles: fixedArticles.length
    }
    
    await fs.writeFile(ARTICLES_PATH, JSON.stringify(newData, null, 2))
    console.log('✅ Articles nettoyés et sauvegardés')
    
    // Nettoyer aussi les connexions pour ne garder que celles des nouveaux articles
    try {
      const connectionsData = await fs.readFile(CONNECTIONS_PATH, 'utf-8')
      const connData = JSON.parse(connectionsData)
      const allConnections = Array.isArray(connData) ? connData : connData.connections || []
      
      const articleIds = new Set(fixedArticles.map(a => a.id))
      const cleanConnections = allConnections.filter(conn => 
        articleIds.has(conn.source_id) && articleIds.has(conn.target_id)
      )
      
      const newConnData = {
        connections: cleanConnections,
        generated_at: new Date().toISOString(),
        total_connections: cleanConnections.length,
        connection_index: {},
        last_processed: {}
      }
      
      // Reconstruire l'index
      cleanConnections.forEach(conn => {
        if (!newConnData.connection_index[conn.source_id]) {
          newConnData.connection_index[conn.source_id] = []
        }
        if (!newConnData.connection_index[conn.target_id]) {
          newConnData.connection_index[conn.target_id] = []
        }
        newConnData.connection_index[conn.source_id].push(conn.target_id)
        newConnData.connection_index[conn.target_id].push(conn.source_id)
      })
      
      await fs.writeFile(CONNECTIONS_PATH, JSON.stringify(newConnData, null, 2))
      console.log(`✅ Connexions nettoyées: ${cleanConnections.length} connexions gardées`)
      
    } catch (error) {
      console.log('⚠️ Pas de fichier connexions à nettoyer')
    }
    
    console.log('🎉 Nettoyage terminé!')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

cleanArticles()