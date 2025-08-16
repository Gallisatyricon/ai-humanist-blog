#!/usr/bin/env tsx
/**
 * TESTS SMOKE ESSENTIELS - P0.3
 * 
 * Tests de non-régression minimaux pour détecter les corruptions critiques:
 * - Import article → aucune corruption articles.json
 * - ID mapping → pas de self-loop, pas d'ID orphelin
 * - Déduplication → invariants types relations valides
 */

import fs from 'fs/promises'
import path from 'path'
import { addArticleComplete } from './addArticleComplete.js'
import { readJSONWithLock } from './writeFileAtomic.js'
import { validateArticleData, validateConnectionData, ValidatedArticle, ValidatedConnection } from './zodSchemas.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

// ==================== TYPES ====================

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration: number
}

interface SmokeTestSuite {
  passed: boolean
  totalTests: number
  passedTests: number
  results: TestResult[]
  duration: number
}

// ==================== DONNÉES TEST ====================

const MOCK_ARTICLE = {
  article: {
    id: 'test_article_smoke',
    title: 'Test Article Smoke',
    url: 'https://example.com/test-smoke',
    source_type: 'blog' as const,
    date: new Date().toISOString(),
    summary: 'Article de test pour les smoke tests de non-régression',
    perspective: 'Test de validation automatique des données',
    interest_level: 3 as const,
    primary_domain: 'technique' as const,
    secondary_domains: ['nlp' as const],
    concepts: [{
      id: 'test_concept',
      name: 'Test Concept',
      type: 'technical' as const,
      controversy_level: 0 as const
    }],
    tools_mentioned: [{
      id: 'test_tool',
      name: 'Test Tool',
      type: 'library' as const,
      maturity: 'stable' as const
    }],
    author: 'Smoke Test Bot',
    reading_time: 5,
    complexity_level: 'intermediate' as const,
    connected_articles: []
  },
  suggested_connections: [{
    target_id: 'art_001',
    type: 'similar_to' as const,
    strength: 0.7,
    reasoning: 'Test connection for smoke tests',
    confidence: 0.8
  }]
}

// ==================== UTILITAIRES TEST ====================

async function runTest(testName: string, testFn: () => Promise<void>): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    await testFn()
    const duration = Date.now() - startTime
    
    return {
      name: testName,
      passed: true,
      message: '✅ Test passé',
      duration
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return {
      name: testName,
      passed: false,
      message: `❌ ${message}`,
      duration
    }
  }
}

async function createBackup(): Promise<void> {
  const timestamp = Date.now()
  
  try {
    const articles = await fs.readFile(ARTICLES_PATH, 'utf-8')
    await fs.writeFile(`${ARTICLES_PATH}.backup.${timestamp}`, articles)
  } catch {
    // Fichier n'existe pas, OK
  }
  
  try {
    const connections = await fs.readFile(CONNECTIONS_PATH, 'utf-8')
    await fs.writeFile(`${CONNECTIONS_PATH}.backup.${timestamp}`, connections)
  } catch {
    // Fichier n'existe pas, OK
  }
}

async function restoreBackup(): Promise<void> {
  const backupFiles = await fs.readdir(path.dirname(ARTICLES_PATH))
  const articleBackups = backupFiles
    .filter(f => f.includes('articles.json.backup'))
    .sort((a, b) => b.localeCompare(a)) // Plus récent d'abord
  
  const connectionBackups = backupFiles
    .filter(f => f.includes('connections.json.backup'))
    .sort((a, b) => b.localeCompare(a))
  
  if (articleBackups.length > 0) {
    const latestArticleBackup = path.join(path.dirname(ARTICLES_PATH), articleBackups[0])
    await fs.copyFile(latestArticleBackup, ARTICLES_PATH)
    await fs.unlink(latestArticleBackup)
  }
  
  if (connectionBackups.length > 0) {
    const latestConnectionBackup = path.join(path.dirname(CONNECTIONS_PATH), connectionBackups[0])
    await fs.copyFile(latestConnectionBackup, CONNECTIONS_PATH)
    await fs.unlink(latestConnectionBackup)
  }
}

// ==================== TESTS INDIVIDUELS ====================

async function testDataIntegrity(): Promise<void> {
  console.log('🔍 Test intégrité des données...')
  
  // Charger et valider avec Zod
  const articleData = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
  const connectionData = await readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 })
  
  const validArticles = validateArticleData(articleData)
  const validConnections = validateConnectionData(connectionData)
  
  // Vérifications basiques
  if (validArticles.articles.length !== validArticles.total_articles) {
    throw new Error(`Incohérence count articles: ${validArticles.articles.length} ≠ ${validArticles.total_articles}`)
  }
  
  if (validConnections.connections.length !== validConnections.total_connections) {
    throw new Error(`Incohérence count connexions: ${validConnections.connections.length} ≠ ${validConnections.total_connections}`)
  }
  
  console.log(`✅ Données valides: ${validArticles.articles.length} articles, ${validConnections.connections.length} connexions`)
}

async function testArticleImport(): Promise<void> {
  console.log('🔍 Test import article sans corruption...')
  
  // État initial
  const initialArticles = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
  const initialConnections = await readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 })
  
  const initialArticleCount = validateArticleData(initialArticles).articles.length
  const initialConnectionCount = validateConnectionData(initialConnections).connections.length
  
  // Import test
  const result = await addArticleComplete(MOCK_ARTICLE)
  
  if (!result.success) {
    throw new Error(`Import échoué: ${result.message}`)
  }
  
  // Vérification post-import
  const finalArticles = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
  const finalConnections = await readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 })
  
  // Validation Zod post-import (détecte corruption)
  const validFinalArticles = validateArticleData(finalArticles)
  const validFinalConnections = validateConnectionData(finalConnections)
  
  // Vérifications logiques
  const expectedArticleCount = result.action === 'created' ? initialArticleCount + 1 : initialArticleCount
  if (validFinalArticles.articles.length !== expectedArticleCount) {
    throw new Error(`Count articles incorrect après import: attendu ${expectedArticleCount}, obtenu ${validFinalArticles.articles.length}`)
  }
  
  const expectedConnectionCount = initialConnectionCount + result.connections_added
  if (validFinalConnections.connections.length !== expectedConnectionCount) {
    throw new Error(`Count connexions incorrect après import: attendu ${expectedConnectionCount}, obtenu ${validFinalConnections.connections.length}`)
  }
  
  console.log(`✅ Import réussi: ${result.action}, +${result.connections_added} connexions`)
}

async function testConnectionIntegrity(): Promise<void> {
  console.log('🔍 Test intégrité des connexions...')
  
  const articleData = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
  const connectionData = await readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 })
  
  const validArticles = validateArticleData(articleData)
  const validConnections = validateConnectionData(connectionData)
  
  const articleIds = new Set(validArticles.articles.map(a => a.id))
  
  // Vérifications connexions
  const issues: string[] = []
  
  for (const conn of validConnections.connections) {
    // Pas de self-loop
    if (conn.source_id === conn.target_id) {
      issues.push(`Self-loop détecté: ${conn.source_id}`)
    }
    
    // Pas d'ID orphelin
    if (!articleIds.has(conn.source_id)) {
      issues.push(`ID source orphelin: ${conn.source_id}`)
    }
    
    if (!articleIds.has(conn.target_id)) {
      issues.push(`ID target orphelin: ${conn.target_id}`)
    }
    
    // Force valide
    if (conn.strength < 0 || conn.strength > 1) {
      issues.push(`Force invalide pour ${conn.source_id}->${conn.target_id}: ${conn.strength}`)
    }
  }
  
  if (issues.length > 0) {
    throw new Error(`Problèmes connexions détectés: ${issues.slice(0, 5).join('; ')}${issues.length > 5 ? '...' : ''}`)
  }
  
  console.log(`✅ ${validConnections.connections.length} connexions valides, aucun self-loop ni ID orphelin`)
}

async function testIdMappingInvariants(): Promise<void> {
  console.log('🔍 Test invariants ID mapping...')
  
  const articleData = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
  const validArticles = validateArticleData(articleData)
  
  const idPattern = /^art_\d{3}$/
  const ids: number[] = []
  
  for (const article of validArticles.articles) {
    // Format ID valide
    if (!idPattern.test(article.id)) {
      throw new Error(`Format ID invalide: ${article.id}`)
    }
    
    const numId = parseInt(article.id.replace('art_', ''))
    if (isNaN(numId)) {
      throw new Error(`ID numérique invalide: ${article.id}`)
    }
    
    ids.push(numId)
  }
  
  // Pas de doublons
  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== ids.length) {
    throw new Error(`IDs dupliqués détectés: ${ids.length} total, ${uniqueIds.size} uniques`)
  }
  
  // Séquence logique (pas forcément continue)
  ids.sort((a, b) => a - b)
  const minId = Math.min(...ids)
  const maxId = Math.max(...ids)
  
  if (minId < 1) {
    throw new Error(`ID minimum invalide: ${minId}`)
  }
  
  console.log(`✅ ${ids.length} IDs valides, séquence ${minId}-${maxId}`)
}

// ==================== SUITE PRINCIPALE ====================

export async function runSmokeTests(): Promise<SmokeTestSuite> {
  console.log('\n🧪 DÉMARRAGE TESTS SMOKE')
  console.log('='.repeat(50))
  
  const startTime = Date.now()
  
  // Backup avant tests
  await createBackup()
  
  const tests = [
    () => testDataIntegrity(),
    () => testArticleImport(),
    () => testConnectionIntegrity(),
    () => testIdMappingInvariants()
  ]
  
  const testNames = [
    'Intégrité données',
    'Import article',
    'Intégrité connexions',
    'Invariants ID mapping'
  ]
  
  const results: TestResult[] = []
  
  try {
    for (let i = 0; i < tests.length; i++) {
      const result = await runTest(testNames[i], tests[i])
      results.push(result)
      
      console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.message} (${result.duration}ms)`)
      
      // Arrêt au premier échec critique
      if (!result.passed && (i === 0 || i === 1)) {
        console.log('⚠️ Échec critique, arrêt des tests')
        break
      }
    }
  } finally {
    // Restauration backup
    await restoreBackup()
  }
  
  const duration = Date.now() - startTime
  const passedTests = results.filter(r => r.passed).length
  const suite: SmokeTestSuite = {
    passed: passedTests === results.length && results.length === tests.length,
    totalTests: tests.length,
    passedTests,
    results,
    duration
  }
  
  console.log('\n📊 RÉSULTATS SMOKE TESTS')
  console.log(`${suite.passed ? '✅' : '❌'} ${passedTests}/${suite.totalTests} tests passés (${duration}ms total)`)
  
  return suite
}

// ==================== CLI ====================

async function main() {
  try {
    const results = await runSmokeTests()
    
    if (results.passed) {
      console.log('\n🎉 TOUS LES TESTS SMOKE RÉUSSIS')
      console.log('✅ Système stable pour import articles')
      process.exit(0)
    } else {
      console.log('\n💥 ÉCHECS DÉTECTÉS')
      console.log('❌ Système instable, vérification manuelle requise')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Erreur critique tests smoke:', error)
    process.exit(1)
  }
}

// ES Module check
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}