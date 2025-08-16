#!/usr/bin/env tsx
/**
 * SCRIPT D'AJOUT D'ARTICLE PHASE 11 - SÉCURISÉ AVEC WORKFLOW COMPLET
 * 
 * Processus sécurisé d'ajout d'article individuel avec Phase 11 intégrée :
 * 1. Validation Zod stricte
 * 2. Smart deduplication par URL
 * 3. Import sécurisé avec writeFileAtomic
 * 4. Workflow Phase 11 automatique (embeddings + connexions)
 * 5. Tests de validation finale
 * 
 * Usage: npm run add-complete -- --input article.json
 */

import fs from 'fs/promises'
import path from 'path'
import { writeJSONAtomic, readJSONWithLock } from './writeFileAtomic.js'
import { validateArticleInput, validateArticleData, validateConnectionData } from './zodSchemas.js'

// ==================== INTERFACES ====================

interface NewArticleInput {
  article: {
    id?: string
    title: string
    url: string
    source_type: 'arxiv' | 'blog' | 'academic' | 'github' | 'news'
    date: string
    summary: string
    perspective: string
    primary_domain: string
    secondary_domains: string[]
    concepts: Array<{ id: string, name: string, type: string, controversy_level?: number }>
    tools_mentioned: Array<{ id: string, name: string, type: string }>
    author?: string
    reading_time?: number
    complexity_level: 'beginner' | 'intermediate' | 'advanced'
    interest_level?: number
    connected_articles?: string[]
  }
  suggested_connections: Array<{
    target_id: string
    type: 'builds_on' | 'contradicts' | 'implements' | 'questions' | 'similar_to'
    strength: number
    reasoning: string
    confidence: number
  }>
}

// ==================== CONFIGURATION ====================

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json') 
const EMBEDDINGS_PATH = path.join(process.cwd(), 'public/data/embeddings.json')
const BACKUP_DIR = path.join(process.cwd(), 'backup')

// ==================== BACKUP SÉCURISÉ ====================

async function createBackup(): Promise<void> {
  try {
    console.log('🔄 Création backup des données existantes...')
    
    // Créer dossier backup si inexistant
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    // Backup articles.json
    try {
      const articlesData = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
      await writeJSONAtomic(
        path.join(BACKUP_DIR, `articles-${timestamp}.json`),
        articlesData
      )
      console.log(`✅ Backup articles : articles-${timestamp}.json`)
    } catch (error) {
      console.warn('⚠️ Pas de fichier articles existant à sauvegarder')
    }
    
    // Backup connections.json
    try {
      const connectionsData = await readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 })
      await writeJSONAtomic(
        path.join(BACKUP_DIR, `connections-${timestamp}.json`),
        connectionsData
      )
      console.log(`✅ Backup connections : connections-${timestamp}.json`)
    } catch (error) {
      console.warn('⚠️ Pas de fichier connections existant à sauvegarder')
    }
    
  } catch (error) {
    throw new Error(`Erreur création backup: ${error instanceof Error ? error.message : error}`)
  }
}

// ==================== SMART DEDUPLICATION ====================

async function checkForDuplicates(newArticle: any): Promise<{
  isDuplicate: boolean
  existingArticle?: any
  action: 'create' | 'update' | 'skip'
  reasoning: string
}> {
  try {
    // Charger articles existants
    let existingArticles: any[] = []
    try {
      const articleData = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
      existingArticles = articleData.articles || articleData || []
    } catch (error) {
      // Pas de fichier existant - création
      return {
        isDuplicate: false,
        action: 'create',
        reasoning: 'Nouveau fichier articles.json'
      }
    }

    // Vérifier doublons par URL (priorité)
    const duplicateByUrl = existingArticles.find(art => art.url === newArticle.url)
    if (duplicateByUrl) {
      // Comparer titres pour déterminer si mise à jour nécessaire
      if (duplicateByUrl.title !== newArticle.title) {
        return {
          isDuplicate: true,
          existingArticle: duplicateByUrl,
          action: 'update',
          reasoning: `URL existante mais titre différent: "${duplicateByUrl.title}" vs "${newArticle.title}"`
        }
      } else {
        return {
          isDuplicate: true,
          existingArticle: duplicateByUrl,
          action: 'skip',
          reasoning: `Article identique déjà présent (même URL et titre)`
        }
      }
    }

    // Pas de doublon - création
    return {
      isDuplicate: false,
      action: 'create',
      reasoning: 'Nouvel article unique'
    }

  } catch (error) {
    throw new Error(`Erreur vérification doublons: ${error instanceof Error ? error.message : error}`)
  }
}

// ==================== IMPORT SÉCURISÉ ====================

async function importArticleSafely(input: NewArticleInput): Promise<{
  action: 'created' | 'updated' | 'skipped'
  articleId: string
  message: string
}> {
  try {
    console.log('📥 Import sécurisé de l\'article...')
    
    const newArticle = input.article

    // Vérifier doublons
    const duplicateCheck = await checkForDuplicates(newArticle)
    console.log(`🔍 Vérification doublons: ${duplicateCheck.reasoning}`)

    if (duplicateCheck.action === 'skip') {
      return {
        action: 'skipped',
        articleId: duplicateCheck.existingArticle!.id,
        message: 'Article déjà présent, aucune action nécessaire'
      }
    }

    // Charger articles existants
    let existingArticles: any[] = []
    try {
      const articleData = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
      existingArticles = articleData.articles || articleData || []
    } catch (error) {
      console.log('📝 Création nouveau fichier articles.json')
    }

    let finalArticles: any[]
    let finalAction: 'created' | 'updated'
    let finalArticleId: string

    if (duplicateCheck.action === 'update') {
      // Mise à jour article existant
      finalArticleId = duplicateCheck.existingArticle!.id
      const updatedArticle = { ...duplicateCheck.existingArticle, ...newArticle, id: finalArticleId }
      
      finalArticles = existingArticles.map(art => 
        art.id === finalArticleId ? updatedArticle : art
      )
      finalAction = 'updated'
      console.log(`🔄 Article mis à jour : ${newArticle.title} (${finalArticleId})`)
      
    } else {
      // Création nouvel article
      // Générer ID séquentiel
      const maxId = existingArticles.reduce((max, art) => {
        const idNum = parseInt(art.id.replace('art_', ''))
        return idNum > max ? idNum : max
      }, 0)
      finalArticleId = `art_${String(maxId + 1).padStart(3, '0')}`
      
      const newArticleWithId = { ...newArticle, id: finalArticleId }
      finalArticles = [...existingArticles, newArticleWithId]
      finalAction = 'created'
      console.log(`✅ Nouvel article créé : ${newArticle.title} (${finalArticleId})`)
    }
    
    // Sauvegarde atomique
    const articleData = {
      articles: finalArticles,
      last_updated: new Date().toISOString(),
      total_articles: finalArticles.length
    }
    
    // Validation finale avant écriture
    validateArticleData(articleData.articles)
    
    await writeJSONAtomic(ARTICLES_PATH, articleData)
    
    console.log(`📊 Import terminé : ${finalAction} article ${finalArticleId}`)
    
    return {
      action: finalAction,
      articleId: finalArticleId,
      message: `Article ${finalAction === 'created' ? 'créé' : 'mis à jour'} avec succès`
    }
    
  } catch (error) {
    throw new Error(`Erreur import article: ${error instanceof Error ? error.message : error}`)
  }
}

// ==================== WORKFLOW PHASE 11 ====================

async function runPhase11Workflow(): Promise<void> {
  console.log('\n🚀 DÉMARRAGE WORKFLOW PHASE 11')
  console.log('='.repeat(50))
  
  try {
    // 1. Génération embeddings (avec attente pour éviter surcharge)
    console.log('\n🧠 Étape 1/4 : Génération embeddings...')
    const embeddingsResult = await import('./generateEmbeddings.js')
    await embeddingsResult.generateEmbeddings()
    
    // Attente 2s pour éviter surcharge système
    console.log('⏱️ Attente 2s (éviter surcharge)...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 2. Enrichissement connexions intelligentes
    console.log('\n🔗 Étape 2/4 : Enrichissement connexions...')
    const enrichResult = await import('./enrichConnections.js')
    await enrichResult.enrichConnections()
    
    // Attente 1s
    console.log('⏱️ Attente 1s...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 3. Affinement subtilité relationnelle
    console.log('\n🎨 Étape 3/4 : Affinement subtilité...')
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    await execAsync('tsx scripts/fixRelationSubtlety.ts', { cwd: process.cwd() })
    console.log('✅ Affinement subtilité terminé')
    
    // Attente 1s
    console.log('⏱️ Attente 1s...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 4. Analyse finale (optionnelle, pour logs)
    console.log('\n📊 Étape 4/4 : Analyse finale...')
    try {
      await execAsync('tsx scripts/analyzeConnectionBias.ts', { cwd: process.cwd() })
      console.log('✅ Analyse terminée')
    } catch (error) {
      console.warn('⚠️ Analyse échouée (non bloquant):', error instanceof Error ? error.message : error)
    }
    
    console.log('\n🎉 WORKFLOW PHASE 11 TERMINÉ AVEC SUCCÈS !')
    
  } catch (error) {
    console.error('❌ Erreur workflow Phase 11:', error instanceof Error ? error.message : error)
    throw error
  }
}

// ==================== TESTS VALIDATION ====================

async function runValidationTests(): Promise<void> {
  console.log('\n🧪 Tests de validation finale...')
  
  try {
    // Test 1: Validation articles
    const articleData = await readJSONWithLock(ARTICLES_PATH, { timeout: 5000 })
    validateArticleData(articleData.articles || articleData)
    console.log('✅ Test articles : Validation OK')
    
    // Test 2: Validation connexions
    const connectionData = await readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 })
    validateConnectionData(connectionData.connections || [])
    console.log('✅ Test connexions : Validation OK')
    
    // Test 3: Vérification embeddings
    const embeddingsData = await readJSONWithLock(EMBEDDINGS_PATH, { timeout: 5000 })
    const embeddings = embeddingsData.embeddings || []
    console.log(`✅ Test embeddings : ${embeddings.length} vecteurs générés`)
    
    // Test 4: Cohérence données
    const articles = articleData.articles || articleData
    const connections = connectionData.connections || []
    
    const articleIds = new Set(articles.map((a: any) => a.id))
    const invalidConnections = connections.filter((c: any) => 
      !articleIds.has(c.source_id) || !articleIds.has(c.target_id)
    )
    
    if (invalidConnections.length > 0) {
      console.warn(`⚠️ ${invalidConnections.length} connexions avec IDs invalides`)
    } else {
      console.log('✅ Test cohérence : Tous les IDs sont valides')
    }
    
  } catch (error) {
    console.error('❌ Erreur tests validation:', error instanceof Error ? error.message : error)
    throw error
  }
}

// ==================== FONCTION PRINCIPALE ====================

async function addArticleComplete(input: NewArticleInput): Promise<{
  success: boolean
  action: 'created' | 'updated' | 'skipped'
  message: string
  article_id: string
}> {
  const startTime = Date.now()
  
  try {
    console.log('🚀 SCRIPT AJOUT ARTICLE PHASE 11 - WORKFLOW COMPLET')
    console.log('='.repeat(60))
    
    // PHASE 1: Validation entrée
    console.log('🔍 Validation données entrée...')
    const validatedInput = validateArticleInput(input)
    console.log('✅ Données entrée valides')
    
    // PHASE 2: Backup sécurisé
    await createBackup()
    
    // PHASE 3: Import sécurisé avec deduplication
    const importResult = await importArticleSafely(validatedInput)
    
    if (importResult.action === 'skipped') {
      console.log('⚠️ Article ignoré - aucune action nécessaire')
      return {
        success: true,
        action: 'skipped',
        message: importResult.message,
        article_id: importResult.articleId
      }
    }
    
    // PHASE 4: Workflow Phase 11 complet (seulement si article ajouté/modifié)
    await runPhase11Workflow()
    
    // PHASE 5: Tests de validation
    await runValidationTests()
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(`\n🎉 AJOUT ARTICLE TERMINÉ AVEC SUCCÈS en ${duration}s`)
    console.log(`🆔 Article ${importResult.action}: ${importResult.articleId}`)
    console.log('💡 Les connexions intelligentes ont été générées automatiquement')
    
    return {
      success: true,
      action: importResult.action,
      message: importResult.message,
      article_id: importResult.articleId
    }
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error instanceof Error ? error.message : error)
    console.error('🔄 Restaurez depuis les backups si nécessaire')
    return {
      success: false,
      action: 'skipped',
      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      article_id: ''
    }
  }
}

// ==================== CLI ====================

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const inputIndex = args.findIndex(arg => arg === '--input')
  
  if (inputIndex === -1 || !args[inputIndex + 1]) {
    console.error('❌ Usage: npm run add-complete -- --input <fichier>')
    console.error('Exemple: npm run add-complete -- --input article.json')
    process.exit(1)
  }
  
  const inputFile = args[inputIndex + 1]
  console.log(`📄 Fichier d'entrée : ${inputFile}`)
  
  // Vérification existence fichier
  try {
    await fs.access(inputFile)
  } catch {
    console.error(`❌ Fichier introuvable : ${inputFile}`)
    process.exit(1)
  }
  
  try {
    const inputData = JSON.parse(await fs.readFile(inputFile, 'utf-8')) as NewArticleInput
    const result = await addArticleComplete(inputData)
    
    if (result.success) {
      console.log(`\n🎉 ${result.message}`)
      console.log(`🆔 ID: ${result.article_id}`)
      console.log(`📊 Action: ${result.action}`)
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

// ES Module check - Fixed for Windows
const currentFile = process.argv[1]
if (currentFile && (currentFile.includes('addArticleComplete') || currentFile.endsWith('addArticleComplete.ts'))) {
  main()
}