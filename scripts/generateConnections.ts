#!/usr/bin/env tsx
/**
 * SCRIPT DE GÉNÉRATION AUTOMATIQUE DES CONNEXIONS
 * 
 * Ce script analyse les articles existants et génère automatiquement
 * les connexions entre eux basées sur :
 * - Similarité des concepts
 * - Outils partagés  
 * - Domaines communs
 * - Analyse sémantique des résumés
 */

import fs from 'fs/promises'
import path from 'path'
import { Article, Connection } from '../src/data/schema.js'
import { detectConnections } from '../src/utils/graphAlgorithms.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

async function loadArticles(): Promise<Article[]> {
  try {
    const data = await fs.readFile(ARTICLES_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    return parsed.articles || []
  } catch (error) {
    console.error('❌ Erreur lors du chargement des articles:', error)
    return []
  }
}

async function saveConnections(connections: Connection[]): Promise<void> {
  try {
    const data = {
      connections,
      generated_at: new Date().toISOString(),
      total_connections: connections.length
    }
    
    await fs.writeFile(
      CONNECTIONS_PATH, 
      JSON.stringify(data, null, 2), 
      'utf-8'
    )
    
    console.log(`✅ ${connections.length} connexions sauvées dans ${CONNECTIONS_PATH}`)
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error)
  }
}

function generateConnections(articles: Article[]): Connection[] {
  const connections: Connection[] = []
  
  console.log(`🔍 Analyse de ${articles.length} articles...`)
  
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const articleA = articles[i]
      const articleB = articles[j]
      
      const connection = detectConnections(articleA, articleB)
      
      if (connection && connection.strength >= 0.3) {
        connections.push(connection)
        console.log(`🔗 Connexion détectée: ${articleA.title} -> ${articleB.title} (${connection.type}, force: ${connection.strength.toFixed(2)})`)
      }
    }
  }
  
  return connections
}

function generateStats(articles: Article[], connections: Connection[]): void {
  const connectionsByType = connections.reduce((acc, conn) => {
    acc[conn.type] = (acc[conn.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const avgConnectionsPerArticle = connections.length * 2 / articles.length
  
  console.log('\n📊 STATISTIQUES DE GÉNÉRATION:')
  console.log(`   Total articles: ${articles.length}`)
  console.log(`   Total connexions: ${connections.length}`)
  console.log(`   Connexions par article (moyenne): ${avgConnectionsPerArticle.toFixed(1)}`)
  console.log('\n📈 RÉPARTITION PAR TYPE:')
  
  Object.entries(connectionsByType).forEach(([type, count]) => {
    const percentage = ((count / connections.length) * 100).toFixed(1)
    console.log(`   ${type}: ${count} (${percentage}%)`)
  })
}

async function main() {
  console.log('🚀 GÉNÉRATION AUTOMATIQUE DES CONNEXIONS')
  console.log('=========================================')
  
  const articles = await loadArticles()
  
  if (articles.length === 0) {
    console.log('❌ Aucun article trouvé. Vérifiez le fichier articles.json')
    process.exit(1)
  }
  
  const connections = generateConnections(articles)
  
  if (connections.length === 0) {
    console.log('⚠️  Aucune connexion détectée. Vérifiez les seuils de similarité.')
  } else {
    await saveConnections(connections)
    generateStats(articles, connections)
  }
  
  console.log('\n✨ Génération terminée!')
}

// Exécution
main().catch(console.error)