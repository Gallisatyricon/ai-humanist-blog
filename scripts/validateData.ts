#!/usr/bin/env tsx
/**
 * SCRIPT DE VALIDATION DES DONNÉES INCRÉMENTALES
 * 
 * Valide la cohérence des données après ajouts incrémentaux :
 * - Structure des articles conforme au schéma (nouveau format)
 * - Cohérence des connexions et index
 * - IDs uniques et références valides
 * - Scores de centralité corrects
 * - Synchronisation des connexions suggérées
 */

import fs from 'fs/promises'
import path from 'path'
import { Article, Connection, ArticleData, ConnectionData, PrimaryDomain } from '../src/data/schema.js'
import { calculateCentrality } from '../src/utils/graphAlgorithms.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    totalArticles: number
    totalConnections: number
    validArticles: number
    validConnections: number
    indexIntegrity: boolean
    centralityAccuracy: number
  }
}

async function loadData(): Promise<{ 
  articleData: ArticleData | null, 
  connectionData: ConnectionData | null 
}> {
  let articleData: ArticleData | null = null
  let connectionData: ConnectionData | null = null
  
  try {
    const articlesFile = await fs.readFile(ARTICLES_PATH, 'utf-8')
    const articlesJson = JSON.parse(articlesFile)
    
    // Support des deux formats
    if (articlesJson.articles && articlesJson.total_articles !== undefined) {
      articleData = articlesJson as ArticleData
    } else if (Array.isArray(articlesJson.articles)) {
      // Ancien format, conversion temporaire
      articleData = {
        articles: articlesJson.articles,
        last_updated: new Date().toISOString(),
        total_articles: articlesJson.articles.length
      }
    }
  } catch (error) {
    console.warn('⚠️  Impossible de charger articles.json')
  }
  
  try {
    const connectionsFile = await fs.readFile(CONNECTIONS_PATH, 'utf-8')
    const connectionsJson = JSON.parse(connectionsFile)
    
    // Support des deux formats
    if (connectionsJson.connection_index && connectionsJson.last_processed) {
      connectionData = connectionsJson as ConnectionData
    } else if (Array.isArray(connectionsJson.connections)) {
      // Ancien format, conversion temporaire
      connectionData = {
        connections: connectionsJson.connections,
        generated_at: connectionsJson.generated_at || new Date().toISOString(),
        total_connections: connectionsJson.connections.length,
        connection_index: {},
        last_processed: {}
      }
    }
  } catch (error) {
    console.warn('⚠️  Impossible de charger connections.json')
  }
  
  return { articleData, connectionData }
}

function validateArticle(article: any, index: number): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validation des champs obligatoires
  const requiredFields = ['id', 'title', 'url', 'source_type', 'date', 'summary', 'perspective', 'interest_level', 'primary_domain']
  
  for (const field of requiredFields) {
    if (!article[field as keyof typeof article]) {
      errors.push(`Article ${index}: Champ obligatoire manquant: ${field}`)
    }
  }
  
  // Validation des types
  if (article.interest_level && (article.interest_level < 1 || article.interest_level > 5)) {
    errors.push(`Article ${index}: interest_level doit être entre 1 et 5`)
  }
  
  if (article.reading_time && typeof article.reading_time !== 'number') {
    errors.push(`Article ${index}: reading_time doit être un nombre`)
  }
  
  if (article.centrality_score && (article.centrality_score < 0 || article.centrality_score > 1)) {
    errors.push(`Article ${index}: centrality_score doit être entre 0 et 1`)
  }
  
  // Validation des domaines
  const validPrimaryDomains: PrimaryDomain[] = ['technique', 'ethique', 'usage_professionnel', 'recherche', 'philosophie', 'frugalite']
  if (article.primary_domain && !validPrimaryDomains.includes(article.primary_domain as PrimaryDomain)) {
    errors.push(`Article ${index}: primary_domain invalide: ${article.primary_domain}`)
  }
  
  // Validation URL
  if (article.url && !article.url.startsWith('http')) {
    warnings.push(`Article ${index}: URL suspecte: ${article.url}`)
  }
  
  // Validation de la qualité du contenu
  if (article.summary && article.summary.length < 50) {
    warnings.push(`Article ${index}: Résumé très court (${article.summary.length} caractères)`)
  }
  
  if (article.perspective && article.perspective.length < 20) {
    warnings.push(`Article ${index}: Perspective très courte`)
  }
  
  return { errors, warnings }
}

function validateConnection(connection: any, articles: Article[], index: number): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validation des champs obligatoires
  if (!connection.source_id) {
    errors.push(`Connexion ${index}: source_id manquant`)
  }
  
  if (!connection.target_id) {
    errors.push(`Connexion ${index}: target_id manquant`)
  }
  
  if (!connection.type) {
    errors.push(`Connexion ${index}: type manquant`)
  }
  
  if (typeof connection.strength !== 'number') {
    errors.push(`Connexion ${index}: strength doit être un nombre`)
  }
  
  // Validation des références
  const articleIds = new Set(articles.map(a => a.id))
  
  if (connection.source_id && !articleIds.has(connection.source_id)) {
    errors.push(`Connexion ${index}: source_id référence un article inexistant: ${connection.source_id}`)
  }
  
  if (connection.target_id && !articleIds.has(connection.target_id)) {
    errors.push(`Connexion ${index}: target_id référence un article inexistant: ${connection.target_id}`)
  }
  
  // Validation des valeurs
  const validTypes = ['builds_on', 'contradicts', 'implements', 'questions', 'similar_to']
  if (connection.type && !validTypes.includes(connection.type)) {
    errors.push(`Connexion ${index}: type invalide: ${connection.type}`)
  }
  
  if (connection.strength && (connection.strength < 0 || connection.strength > 1)) {
    errors.push(`Connexion ${index}: strength doit être entre 0 et 1`)
  }
  
  // Warnings
  if (connection.strength && connection.strength < 0.3) {
    warnings.push(`Connexion ${index}: Force de connexion faible (${connection.strength})`)
  }
  
  return { errors, warnings }
}

function validateConnectionIndex(
  connections: Connection[], 
  connectionIndex: Record<string, string[]>
): { errors: string[], warnings: string[], isValid: boolean } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Reconstruction de l'index pour comparaison
  const expectedIndex: Record<string, string[]> = {}
  
  connections.forEach(conn => {
    if (!expectedIndex[conn.source_id]) expectedIndex[conn.source_id] = []
    if (!expectedIndex[conn.target_id]) expectedIndex[conn.target_id] = []
    
    if (!expectedIndex[conn.source_id].includes(conn.target_id)) {
      expectedIndex[conn.source_id].push(conn.target_id)
    }
    if (!expectedIndex[conn.target_id].includes(conn.source_id)) {
      expectedIndex[conn.target_id].push(conn.source_id)
    }
  })
  
  // Comparaison des clés
  const expectedKeys = new Set(Object.keys(expectedIndex))
  const actualKeys = new Set(Object.keys(connectionIndex))
  
  for (const key of expectedKeys) {
    if (!actualKeys.has(key)) {
      errors.push(`Index manquant pour l'article ${key}`)
    } else {
      const expectedConnections = new Set(expectedIndex[key])
      const actualConnections = new Set(connectionIndex[key])
      
      for (const expectedConn of expectedConnections) {
        if (!actualConnections.has(expectedConn)) {
          errors.push(`Connexion manquante dans l'index: ${key} -> ${expectedConn}`)
        }
      }
      
      for (const actualConn of actualConnections) {
        if (!expectedConnections.has(actualConn)) {
          warnings.push(`Connexion supplémentaire dans l'index: ${key} -> ${actualConn}`)
        }
      }
    }
  }
  
  // Clés supplémentaires dans l'index
  for (const key of actualKeys) {
    if (!expectedKeys.has(key)) {
      warnings.push(`Article ${key} dans l'index mais pas dans les connexions`)
    }
  }
  
  return { errors, warnings, isValid: errors.length === 0 }
}

function validateCentralityScores(
  articles: Article[], 
  connections: Connection[]
): { errors: string[], warnings: string[], accuracy: number } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Recalcul des scores de centralité
  const calculatedCentrality = calculateCentrality(articles, connections)
  
  let accurateCount = 0
  const tolerance = 0.05 // 5% de tolérance
  
  articles.forEach(article => {
    const expected = calculatedCentrality[article.id] || 0
    const actual = article.centrality_score || 0
    const difference = Math.abs(expected - actual)
    
    if (difference > tolerance) {
      warnings.push(
        `Article ${article.id}: Centralité incorrecte (attendu: ${expected.toFixed(3)}, actuel: ${actual.toFixed(3)})`
      )
    } else {
      accurateCount++
    }
  })
  
  const accuracy = articles.length > 0 ? accurateCount / articles.length : 1
  
  if (accuracy < 0.9) {
    errors.push(`Précision des scores de centralité trop faible: ${(accuracy * 100).toFixed(1)}%`)
  }
  
  return { errors, warnings, accuracy }
}

function validateDataIntegrity(articles: Article[], connections: Connection[]): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validation des IDs uniques
  const articleIds = articles.map(a => a.id)
  const uniqueIds = new Set(articleIds)
  
  if (articleIds.length !== uniqueIds.size) {
    errors.push('Des articles ont des IDs dupliqués')
  }
  
  // Validation des connexions bidirectionnelles
  const connectionPairs = new Set()
  for (const conn of connections) {
    const pair = [conn.source_id, conn.target_id].sort().join('-')
    if (connectionPairs.has(pair)) {
      warnings.push(`Connexion dupliquée entre ${conn.source_id} et ${conn.target_id}`)
    }
    connectionPairs.add(pair)
  }
  
  // Validation des connexions suggérées vs connexions réelles
  articles.forEach(article => {
    if (article.suggested_connections) {
      article.suggested_connections.forEach(suggested => {
        const realConnection = connections.find(conn => 
          conn.source_id === article.id && conn.target_id === suggested.target_id
        )
        
        if (!realConnection) {
          warnings.push(`Article ${article.id}: Connexion suggérée vers ${suggested.target_id} non réalisée`)
        } else if (Math.abs(realConnection.strength - suggested.strength) > 0.2) {
          warnings.push(
            `Article ${article.id}: Force de connexion différente vers ${suggested.target_id} ` +
            `(suggérée: ${suggested.strength}, réelle: ${realConnection.strength})`
          )
        }
      })
    }
  })
  
  // Statistiques de qualité
  const articlesWithHighCentrality = articles.filter(a => a.centrality_score && a.centrality_score > 0.7).length
  if (articlesWithHighCentrality === 0) {
    warnings.push('Aucun article avec une centralité élevée détectée')
  }
  
  const strongConnections = connections.filter(c => c.strength > 0.7).length
  if (strongConnections < connections.length * 0.2) {
    warnings.push('Peu de connexions fortes dans le graphique')
  }
  
  return { errors, warnings }
}

async function validateData(): Promise<ValidationResult> {
  console.log('🔍 VALIDATION DES DONNÉES INCRÉMENTALES')
  console.log('=====================================')
  
  const { articleData, connectionData } = await loadData()
  
  if (!articleData || !connectionData) {
    return {
      isValid: false,
      errors: ['Impossible de charger les données'],
      warnings: [],
      stats: {
        totalArticles: 0,
        totalConnections: 0,
        validArticles: 0,
        validConnections: 0,
        indexIntegrity: false,
        centralityAccuracy: 0
      }
    }
  }
  
  const articles = articleData.articles
  const connections = connectionData.connections
  
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalArticles: articles.length,
      totalConnections: connections.length,
      validArticles: 0,
      validConnections: 0,
      indexIntegrity: false,
      centralityAccuracy: 0
    }
  }
  
  // Validation du format des données
  if (articleData.total_articles !== articles.length) {
    result.errors.push(`Incohérence: total_articles (${articleData.total_articles}) ≠ articles.length (${articles.length})`)
    result.isValid = false
  }
  
  if (connectionData.total_connections !== connections.length) {
    result.errors.push(`Incohérence: total_connections (${connectionData.total_connections}) ≠ connections.length (${connections.length})`)
    result.isValid = false
  }
  
  // Validation des articles
  console.log(`📄 Validation de ${articles.length} articles...`)
  
  for (let i = 0; i < articles.length; i++) {
    const { errors, warnings } = validateArticle(articles[i], i + 1)
    
    if (errors.length === 0) {
      result.stats.validArticles++
    } else {
      result.isValid = false
    }
    
    result.errors.push(...errors)
    result.warnings.push(...warnings)
  }
  
  // Validation des connexions
  console.log(`🔗 Validation de ${connections.length} connexions...`)
  
  for (let i = 0; i < connections.length; i++) {
    const { errors, warnings } = validateConnection(connections[i], articles, i + 1)
    
    if (errors.length === 0) {
      result.stats.validConnections++
    } else {
      result.isValid = false
    }
    
    result.errors.push(...errors)
    result.warnings.push(...warnings)
  }
  
  // Validation de l'index de connexions
  console.log('📇 Validation de l\'index de connexions...')
  
  const { errors: indexErrors, warnings: indexWarnings, isValid: indexValid } = 
    validateConnectionIndex(connections, connectionData.connection_index)
  
  result.errors.push(...indexErrors)
  result.warnings.push(...indexWarnings)
  result.stats.indexIntegrity = indexValid
  
  if (!indexValid) {
    result.isValid = false
  }
  
  // Validation des scores de centralité
  console.log('📊 Validation des scores de centralité...')
  
  const { errors: centralityErrors, warnings: centralityWarnings, accuracy } = 
    validateCentralityScores(articles, connections)
  
  result.errors.push(...centralityErrors)
  result.warnings.push(...centralityWarnings)
  result.stats.centralityAccuracy = accuracy
  
  if (centralityErrors.length > 0) {
    result.isValid = false
  }
  
  // Validation de l'intégrité globale
  console.log('🔒 Validation de l\'intégrité des données...')
  
  const { errors: integrityErrors, warnings: integrityWarnings } = validateDataIntegrity(articles, connections)
  result.errors.push(...integrityErrors)
  result.warnings.push(...integrityWarnings)
  
  if (integrityErrors.length > 0) {
    result.isValid = false
  }
  
  return result
}

function printResults(result: ValidationResult): void {
  console.log('\n📊 RÉSULTATS DE VALIDATION INCRÉMENTALE')
  console.log('=======================================')
  
  console.log(`📈 Articles: ${result.stats.validArticles}/${result.stats.totalArticles} valides`)
  console.log(`🔗 Connexions: ${result.stats.validConnections}/${result.stats.totalConnections} valides`)
  console.log(`📇 Index de connexions: ${result.stats.indexIntegrity ? '✅ Synchronisé' : '❌ Désynchronisé'}`)
  console.log(`📊 Précision centralité: ${(result.stats.centralityAccuracy * 100).toFixed(1)}%`)
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERREURS CRITIQUES:')
    result.errors.forEach(error => console.log(`   • ${error}`))
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  AVERTISSEMENTS:')
    result.warnings.slice(0, 10).forEach(warning => console.log(`   • ${warning}`))
    if (result.warnings.length > 10) {
      console.log(`   ... et ${result.warnings.length - 10} autres avertissements`)
    }
  }
  
  if (result.isValid) {
    console.log('\n✅ Toutes les données sont valides et cohérentes!')
    console.log('💡 Le système est prêt pour les ajouts incrémentaux via n8n')
  } else {
    console.log('\n❌ Des erreurs critiques ont été détectées')
    console.log('🔧 Exécutez npm run migrate-data pour corriger les problèmes de format')
  }
}

async function main() {
  try {
    const result = await validateData()
    printResults(result)
    
    // Code de sortie selon le résultat
    process.exit(result.isValid ? 0 : 1)
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error)
    process.exit(1)
  }
}

// Exécution
main()