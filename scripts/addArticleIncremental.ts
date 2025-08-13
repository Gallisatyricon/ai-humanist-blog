#!/usr/bin/env tsx
/**
 * SCRIPT D'AJOUT INCRÉMENTAL D'ARTICLES (Option 2)
 * 
 * Ce script ajoute un nouvel article avec ses connexions pré-calculées
 * par l'agent LLM, sans reconstruire toute la base de données.
 * 
 * Usage:
 * - Via n8n: POST à un endpoint qui appelle ce script
 * - Via CLI: npm run add-article -- --input article.json
 * - Via import: import { addArticleIncremental } from './addArticleIncremental'
 */

import fs from 'fs/promises'
import path from 'path'
import { 
  Article, 
  Connection, 
  ArticleData, 
  ConnectionData, 
  NewArticleInput, 
  SuggestedConnection 
} from '../src/data/schema.js'
import { calculateCentrality } from '../src/utils/graphAlgorithms.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

// ==================== FONCTIONS UTILITAIRES ====================

async function loadArticles(): Promise<ArticleData> {
  try {
    const data = await fs.readFile(ARTICLES_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    
    // Rétrocompatibilité avec l'ancien format
    if (Array.isArray(parsed.articles)) {
      return {
        articles: parsed.articles,
        last_updated: new Date().toISOString(),
        total_articles: parsed.articles.length
      }
    }
    
    return parsed as ArticleData
  } catch (error) {
    console.log('📄 Création du fichier articles.json')
    return {
      articles: [],
      last_updated: new Date().toISOString(),
      total_articles: 0
    }
  }
}

async function loadConnections(): Promise<ConnectionData> {
  try {
    const data = await fs.readFile(CONNECTIONS_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    
    // Rétrocompatibilité avec l'ancien format
    if (Array.isArray(parsed.connections)) {
      const connectionIndex = buildConnectionIndex(parsed.connections)
      return {
        connections: parsed.connections,
        generated_at: parsed.generated_at || new Date().toISOString(),
        total_connections: parsed.connections.length,
        connection_index: connectionIndex,
        last_processed: {}
      }
    }
    
    return parsed as ConnectionData
  } catch (error) {
    console.log('📄 Création du fichier connections.json')
    return {
      connections: [],
      generated_at: new Date().toISOString(),
      total_connections: 0,
      connection_index: {},
      last_processed: {}
    }
  }
}

function buildConnectionIndex(connections: Connection[]): Record<string, string[]> {
  const index: Record<string, string[]> = {}
  
  connections.forEach(conn => {
    // Index bidirectionnel pour navigation
    if (!index[conn.source_id]) index[conn.source_id] = []
    if (!index[conn.target_id]) index[conn.target_id] = []
    
    if (!index[conn.source_id].includes(conn.target_id)) {
      index[conn.source_id].push(conn.target_id)
    }
    if (!index[conn.target_id].includes(conn.source_id)) {
      index[conn.target_id].push(conn.source_id)
    }
  })
  
  return index
}

async function saveArticles(articleData: ArticleData): Promise<void> {
  await fs.writeFile(
    ARTICLES_PATH,
    JSON.stringify(articleData, null, 2),
    'utf-8'
  )
}

async function saveConnections(connectionData: ConnectionData): Promise<void> {
  await fs.writeFile(
    CONNECTIONS_PATH,
    JSON.stringify(connectionData, null, 2),
    'utf-8'
  )
}

// ==================== LOGIQUE PRINCIPALE ====================

function validateArticle(article: Article): string[] {
  const errors: string[] = []
  
  if (!article.id || typeof article.id !== 'string') {
    errors.push('ID manquant ou invalide')
  }
  
  if (!article.title || article.title.length < 10) {
    errors.push('Titre manquant ou trop court')
  }
  
  if (!article.summary || article.summary.length < 50) {
    errors.push('Résumé manquant ou trop court')
  }
  
  if (!article.primary_domain) {
    errors.push('Domaine principal manquant')
  }
  
  if (!Array.isArray(article.concepts) || article.concepts.length === 0) {
    errors.push('Au moins un concept requis')
  }
  
  return errors
}

function validateSuggestedConnections(
  connections: SuggestedConnection[], 
  existingArticleIds: string[]
): string[] {
  const errors: string[] = []
  
  connections.forEach((conn, index) => {
    if (!conn.target_id || !existingArticleIds.includes(conn.target_id)) {
      errors.push(`Connexion ${index}: target_id invalide ou article inexistant`)
    }
    
    if (conn.strength < 0 || conn.strength > 1) {
      errors.push(`Connexion ${index}: strength doit être entre 0 et 1`)
    }
    
    if (conn.confidence < 0 || conn.confidence > 1) {
      errors.push(`Connexion ${index}: confidence doit être entre 0 et 1`)
    }
    
    if (!conn.reasoning || conn.reasoning.length < 10) {
      errors.push(`Connexion ${index}: reasoning manquant ou trop court`)
    }
  })
  
  return errors
}

function convertSuggestedToConnections(
  articleId: string, 
  suggestedConnections: SuggestedConnection[]
): Connection[] {
  return suggestedConnections.map(suggested => ({
    source_id: articleId,
    target_id: suggested.target_id,
    type: suggested.type,
    strength: suggested.strength,
    auto_detected: false,  // Généré par LLM, pas par algorithme
    reasoning: `LLM (conf: ${suggested.confidence.toFixed(2)}): ${suggested.reasoning}`
  }))
}

function updateCentralityScores(articles: Article[], connections: Connection[]): Article[] {
  const centralityScores = calculateCentrality(articles, connections)
  
  return articles.map(article => ({
    ...article,
    centrality_score: centralityScores[article.id] || 0
  }))
}

export async function addArticleIncremental(input: NewArticleInput): Promise<{
  success: boolean
  message: string
  article_id?: string
  connections_added?: number
}> {
  try {
    console.log(`🚀 Ajout incrémental de l'article: ${input.article.title}`)
    
    // 1. Charger les données existantes
    const [articleData, connectionData] = await Promise.all([
      loadArticles(),
      loadConnections()
    ])
    
    // 2. Vérifier si l'article existe déjà
    const existingArticle = articleData.articles.find(a => a.id === input.article.id)
    if (existingArticle) {
      return {
        success: false,
        message: `Article avec l'ID ${input.article.id} existe déjà`
      }
    }
    
    // 3. Validation
    const articleErrors = validateArticle({...input.article, centrality_score: 0})
    if (articleErrors.length > 0) {
      return {
        success: false,
        message: `Erreurs dans l'article: ${articleErrors.join(', ')}`
      }
    }
    
    const existingIds = articleData.articles.map(a => a.id)
    const connectionErrors = validateSuggestedConnections(input.suggested_connections, existingIds)
    if (connectionErrors.length > 0) {
      return {
        success: false,
        message: `Erreurs dans les connexions: ${connectionErrors.join(', ')}`
      }
    }
    
    // 4. Conversion des connexions suggérées
    const newConnections = convertSuggestedToConnections(
      input.article.id, 
      input.suggested_connections
    )
    
    // 5. Ajout de l'article
    const updatedArticles = [
      ...articleData.articles,
      { ...input.article, centrality_score: 0 }  // Sera recalculé
    ]
    
    // 6. Ajout des connexions
    const updatedConnections = [...connectionData.connections, ...newConnections]
    
    // 7. Recalcul des scores de centralité
    const articlesWithCentrality = updateCentralityScores(updatedArticles, updatedConnections)
    
    // 8. Reconstruction de l'index de connexions
    const updatedConnectionIndex = buildConnectionIndex(updatedConnections)
    
    // 9. Sauvegarde
    const newArticleData: ArticleData = {
      articles: articlesWithCentrality,
      last_updated: new Date().toISOString(),
      total_articles: articlesWithCentrality.length
    }
    
    const newConnectionData: ConnectionData = {
      connections: updatedConnections,
      generated_at: new Date().toISOString(),
      total_connections: updatedConnections.length,
      connection_index: updatedConnectionIndex,
      last_processed: {
        ...connectionData.last_processed,
        [input.article.id]: new Date().toISOString()
      }
    }
    
    await Promise.all([
      saveArticles(newArticleData),
      saveConnections(newConnectionData)
    ])
    
    console.log(`✅ Article ajouté: ${input.article.id}`)
    console.log(`🔗 Connexions ajoutées: ${newConnections.length}`)
    console.log(`📊 Total articles: ${newArticleData.total_articles}`)
    console.log(`📊 Total connexions: ${newConnectionData.total_connections}`)
    
    return {
      success: true,
      message: 'Article ajouté avec succès',
      article_id: input.article.id,
      connections_added: newConnections.length
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout:', error)
    return {
      success: false,
      message: `Erreur interne: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}

// ==================== CLI INTERFACE ====================

async function main() {
  const args = process.argv.slice(2)
  const inputFlag = args.findIndex(arg => arg === '--input')
  
  if (inputFlag === -1 || !args[inputFlag + 1]) {
    console.error('❌ Usage: npm run add-article -- --input path/to/article.json')
    console.error('')
    console.error('Format du fichier JSON:')
    console.error(JSON.stringify({
      article: {
        id: "art_007",
        title: "Titre de l'article",
        url: "https://...",
        // ... autres champs
      },
      suggested_connections: [{
        target_id: "art_001",
        type: "similar_to",
        strength: 0.8,
        reasoning: "Partage les concepts de...",
        confidence: 0.9
      }]
    }, null, 2))
    process.exit(1)
  }
  
  const inputPath = args[inputFlag + 1]
  
  try {
    const inputData = JSON.parse(await fs.readFile(inputPath, 'utf-8')) as NewArticleInput
    const result = await addArticleIncremental(inputData)
    
    if (result.success) {
      console.log(`✨ ${result.message}`)
      process.exit(0)
    } else {
      console.error(`❌ ${result.message}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier d\'entrée:', error)
    process.exit(1)
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}