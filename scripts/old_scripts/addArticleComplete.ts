#!/usr/bin/env tsx
/**
 * SCRIPT COMPLET D'AJOUT D'ARTICLE
 * 
 * Combine Smart ID Mapping + Smart Deduplication pour :
 * 1. Détecter et éviter les doublons
 * 2. Mettre à jour les articles existants si nécessaire
 * 3. Résoudre intelligemment les connexions invalides
 * 4. Gérer proprement les IDs séquentiels
 * 
 * Usage: npm run add-complete -- --input article.json
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
import { mapTargetIds, applyIdMapping } from './smartIdMapper.js'
import { processArticleWithDeduplication } from './smartDeduplication.js'
import { writeJSONAtomic, readJSONWithLock } from './writeFileAtomic.js'
import { validateArticleInput, validateArticleData, validateConnectionData } from './zodSchemas.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

// ==================== CHARGEMENT DONNÉES ====================

async function loadArticles(): Promise<ArticleData> {
  try {
    const parsed = await readJSONWithLock<any>(ARTICLES_PATH, { timeout: 5000 })
    
    // Validation Zod avant utilisation
    const validatedData = validateArticleData(parsed)
    console.log(`✅ Articles chargés et validés: ${validatedData.articles.length}`)
    
    return validatedData
  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation')) {
      console.error('❌ Données articles corrompues:', error.message)
      throw error
    }
    
    console.warn('⚠️ Fichier articles.json non trouvé, création d\'un nouveau')
    return {
      articles: [],
      last_updated: new Date().toISOString(),
      total_articles: 0
    }
  }
}

async function loadConnections(): Promise<ConnectionData> {
  try {
    const parsed = await readJSONWithLock<any>(CONNECTIONS_PATH, { timeout: 5000 })
    
    // Validation Zod avant utilisation
    const validatedData = validateConnectionData(parsed)
    console.log(`✅ Connexions chargées et validées: ${validatedData.connections.length}`)
    
    return validatedData
  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation')) {
      console.error('❌ Données connexions corrompues:', error.message)
      throw error
    }
    
    console.warn('⚠️ Fichier connections.json non trouvé, création d\'un nouveau')
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

// ==================== SAUVEGARDE ====================

async function saveArticles(articleData: ArticleData): Promise<void> {
  await writeJSONAtomic(ARTICLES_PATH, articleData, { lockTimeout: 15000 })
}

async function saveConnections(connectionData: ConnectionData): Promise<void> {
  await writeJSONAtomic(CONNECTIONS_PATH, connectionData, { lockTimeout: 15000 })
}

// ==================== GESTION IDS ====================

function generateNextId(existingArticles: Article[]): string {
  const existingIds = existingArticles.map(a => 
    parseInt(a.id.replace('art_', ''))
  ).filter(id => !isNaN(id))
  
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0
  const nextId = maxId + 1
  
  return `art_${String(nextId).padStart(3, '0')}`
}

// ==================== SMART CONNEXIONS ====================

async function resolveSmartConnections(
  targetConnections: SuggestedConnection[],
  existingArticles: Article[],
  newArticles: any[]
): Promise<{
  resolvedConnections: SuggestedConnection[]
  mappingReport: any
}> {
  
  if (targetConnections.length === 0) {
    return { 
      resolvedConnections: [], 
      mappingReport: { total_attempted: 0, successfully_mapped: 0 } 
    }
  }
  
  console.log(`🧠 Résolution de ${targetConnections.length} connexions...`)
  
  const mappingResults = await mapTargetIds(targetConnections, existingArticles, newArticles)
  const resolvedConnections = applyIdMapping(targetConnections, mappingResults, 0.3)
  
  return {
    resolvedConnections,
    mappingReport: {
      total_attempted: targetConnections.length,
      successfully_mapped: resolvedConnections.length,
      mapping_details: mappingResults
    }
  }
}

// ==================== UTILITAIRES ====================

function convertToConnections(
  articleId: string, 
  suggestedConnections: SuggestedConnection[]
): Connection[] {
  return suggestedConnections.map(suggested => ({
    source_id: articleId,
    target_id: suggested.target_id,
    type: suggested.type,
    strength: suggested.strength,
    auto_detected: false,
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

function updateArticleInArray(articles: Article[], updatedArticle: Article): Article[] {
  return articles.map(article => 
    article.id === updatedArticle.id ? updatedArticle : article
  )
}

// ==================== FONCTION PRINCIPALE ====================

export async function addArticleComplete(input: NewArticleInput): Promise<{
  success: boolean
  action: 'created' | 'updated' | 'skipped'
  message: string
  article_id: string
  connections_added: number
  changes?: string[]
  mapping_report?: any
}> {
  
  try {
    console.log(`\n🚀 TRAITEMENT COMPLET: "${input.article.title}"`)
    console.log('='.repeat(60))
    
    // 0. Validation entrée avec Zod
    console.log('🔍 Validation données entrée...')
    const validatedInput = validateArticleInput(input)
    console.log('✅ Données entrée valides')
    
    // 1. Charger les données existantes
    const [articleData, connectionData] = await Promise.all([
      loadArticles(),
      loadConnections()
    ])
    
    console.log(`📊 Base actuelle: ${articleData.articles.length} articles, ${connectionData.connections.length} connexions`)
    
    // 2. Résoudre les connexions avec Smart Mapping
    const fakeNewArticles = [{ article: validatedInput.article, suggested_connections: validatedInput.suggested_connections }]
    const { resolvedConnections, mappingReport } = await resolveSmartConnections(
      validatedInput.suggested_connections,
      articleData.articles,
      fakeNewArticles
    )
    
    console.log(`🔗 Connexions résolues: ${resolvedConnections.length}/${validatedInput.suggested_connections.length}`)
    
    // 3. Processus de déduplication et fusion
    const deduplicationResult = await processArticleWithDeduplication(
      validatedInput.article,
      resolvedConnections,
      articleData.articles,
      connectionData.connections
    )
    
    console.log(`📋 Action recommandée: ${deduplicationResult.action}`)
    console.log(`📝 Raison: ${deduplicationResult.reasoning}`)
    
    // 4. Traitement selon le résultat
    let finalArticles = articleData.articles
    let finalConnections = connectionData.connections
    let finalArticleId = deduplicationResult.articleId
    
    if (deduplicationResult.action === 'skipped') {
      // Aucune action nécessaire
      console.log(`⭕ Article ignoré - aucune mise à jour nécessaire`)
      
      return {
        success: true,
        action: 'skipped',
        message: 'Article déjà présent et à jour',
        article_id: finalArticleId,
        connections_added: 0,
        mapping_report: mappingReport
      }
      
    } else if (deduplicationResult.action === 'updated') {
      // Mise à jour d'un article existant
      console.log(`🔄 Mise à jour de l'article ${finalArticleId}`)
      console.log(`📝 Changements: ${deduplicationResult.changes.join(', ')}`)
      
      // Mettre à jour l'article dans le tableau
      finalArticles = updateArticleInArray(finalArticles, deduplicationResult.article)
      
      // Ajouter les nouvelles connexions
      const newConnections = convertToConnections(finalArticleId, deduplicationResult.connectionsToAdd)
      finalConnections = [...connectionData.connections, ...newConnections]
      
    } else {
      // Création d'un nouvel article
      console.log(`✨ Création d'un nouvel article`)
      
      // Générer un nouvel ID
      const newId = generateNextId(articleData.articles)
      finalArticleId = newId
      
      const newArticleWithId = {
        ...deduplicationResult.article,
        id: newId,
        centrality_score: 0
      }
      
      console.log(`🆔 ID assigné: ${newId}`)
      
      // Ajouter l'article
      finalArticles = [...articleData.articles, newArticleWithId]
      
      // Ajouter les connexions
      const newConnections = convertToConnections(newId, deduplicationResult.connectionsToAdd)
      finalConnections = [...connectionData.connections, ...newConnections]
    }
    
    // 5. Recalculer la centralité
    console.log(`🧮 Recalcul des scores de centralité...`)
    const articlesWithCentrality = updateCentralityScores(finalArticles, finalConnections)
    
    // 6. Reconstruire l'index
    const updatedConnectionIndex = buildConnectionIndex(finalConnections)
    
    // 7. Sauvegarder
    const newArticleData: ArticleData = {
      articles: articlesWithCentrality,
      last_updated: new Date().toISOString(),
      total_articles: articlesWithCentrality.length
    }
    
    const newConnectionData: ConnectionData = {
      connections: finalConnections,
      generated_at: new Date().toISOString(),
      total_connections: finalConnections.length,
      connection_index: updatedConnectionIndex,
      last_processed: {
        ...connectionData.last_processed,
        [finalArticleId]: new Date().toISOString()
      }
    }
    
    await Promise.all([
      saveArticles(newArticleData),
      saveConnections(newConnectionData)
    ])
    
    const connectionsAdded = deduplicationResult.connectionsToAdd.length
    
    console.log(`\n✅ TRAITEMENT TERMINÉ`)
    console.log(`📊 Articles: ${articleData.articles.length} → ${newArticleData.total_articles}`)
    console.log(`📊 Connexions: ${connectionData.connections.length} → ${newConnectionData.total_connections}`)
    console.log(`🔗 Connexions ajoutées: ${connectionsAdded}`)
    
    return {
      success: true,
      action: deduplicationResult.action,
      message: `Article ${deduplicationResult.action === 'created' ? 'créé' : 'mis à jour'} avec succès`,
      article_id: finalArticleId,
      connections_added: connectionsAdded,
      changes: deduplicationResult.changes,
      mapping_report: mappingReport
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du traitement:', error)
    return {
      success: false,
      action: 'skipped',
      message: `Erreur interne: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      article_id: '',
      connections_added: 0
    }
  }
}

// ==================== CLI ====================

async function main() {
  const args = process.argv.slice(2)
  const inputFlag = args.findIndex(arg => arg === '--input')
  
  if (inputFlag === -1 || !args[inputFlag + 1]) {
    console.error(`
❌ Usage: npm run add-complete -- --input <fichier>

Ce script gère automatiquement :
✅ Détection et évitement des doublons
✅ Mise à jour des métadonnées si nécessaire  
✅ Résolution intelligente des connexions invalides
✅ Gestion propre des IDs séquentiels

Exemple: npm run add-complete -- --input article.json
`)
    process.exit(1)
  }
  
  const inputPath = args[inputFlag + 1]
  
  try {
    const inputData = JSON.parse(await fs.readFile(inputPath, 'utf-8')) as NewArticleInput
    const result = await addArticleComplete(inputData)
    
    if (result.success) {
      console.log(`\n🎉 ${result.message}`)
      console.log(`🆔 ID: ${result.article_id}`)
      console.log(`📊 Action: ${result.action}`)
      console.log(`🔗 Connexions: +${result.connections_added}`)
      
      if (result.changes && result.changes.length > 0) {
        console.log(`📝 Changements: ${result.changes.join(', ')}`)
      }
      
      if (result.mapping_report) {
        console.log(`🎯 Mapping: ${result.mapping_report.successfully_mapped}/${result.mapping_report.total_attempted}`)
      }
      
      process.exit(0)
    } else {
      console.error(`❌ ${result.message}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Erreur lecture fichier:', error)
    process.exit(1)
  }
}

// ES Module check
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}