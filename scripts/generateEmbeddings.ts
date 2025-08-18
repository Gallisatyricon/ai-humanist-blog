#!/usr/bin/env tsx
/**
 * GÉNÉRATION D'EMBEDDINGS LOCAUX - P1.1
 * 
 * Utilise Transformers.js avec modèle all-MiniLM-L6-v2 (384-D, multilingue)
 * Calcul embeddings pour title + summary + concepts
 * Stockage vecteurs dans fichier séparé embeddings.json
 * 
 * Impact: Connexions plus pertinentes basées sur similarité sémantique
 */

import path from 'path'
import { pipeline } from '@xenova/transformers'
import { readJSONWithLock, writeJSONAtomic } from './writeFileAtomic.js'
import { PATHS } from './config/paths.js'

// Chemins centralisés depuis config/paths.ts

// ==================== TYPES ====================

interface ArticleEmbedding {
  article_id: string
  embedding: number[]
  text_content: string
  computed_at: string
  model_name: string
  vector_dimension: number
}

interface EmbeddingData {
  embeddings: ArticleEmbedding[]
  model_info: {
    name: string
    dimension: number
    language: string
    description: string
  }
  computed_at: string
  total_embeddings: number
  processing_time_ms: number
}

// ==================== CONFIGURATION ====================

const EMBEDDING_CONFIG = {
  model: 'Xenova/all-MiniLM-L6-v2',
  dimension: 384,
  batchSize: 5, // Traiter par petits lots pour éviter surcharge mémoire
  maxTextLength: 512 // Limite tokens pour le modèle
}

// ==================== CHARGEMENT MODÈLE ====================

let embeddingPipeline: any = null

async function loadEmbeddingModel(): Promise<any> {
  if (embeddingPipeline) {
    return embeddingPipeline
  }
  
  console.log(`🤖 Chargement du modèle ${EMBEDDING_CONFIG.model}...`)
  console.log('⚠️ Premier chargement peut prendre plusieurs minutes (téléchargement)')
  
  const startTime = Date.now()
  
  try {
    // Configurer le pipeline avec options optimisées
    embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_CONFIG.model, {
      quantized: true, // Version quantifiée pour réduire taille
      local_files_only: false, // Permettre téléchargement
      cache_dir: path.join(process.cwd(), 'node_modules/.cache/transformers')
    })
    
    const loadTime = Date.now() - startTime
    console.log(`✅ Modèle chargé en ${loadTime}ms`)
    console.log(`📐 Dimension: ${EMBEDDING_CONFIG.dimension}D`)
    
    return embeddingPipeline
    
  } catch (error) {
    console.error('❌ Erreur chargement modèle:', error)
    throw new Error(`Impossible de charger le modèle: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

// ==================== PRÉPARATION TEXTE ====================

function prepareTextForEmbedding(article: any): string {
  // Combiner titre, résumé et concepts pour représentation sémantique riche
  const parts: string[] = []
  
  // Titre (poids important)
  if (article.title) {
    parts.push(article.title)
  }
  
  // Résumé (contexte principal)
  if (article.summary) {
    parts.push(article.summary)
  }
  
  // Perspective (angle d'analyse)
  if (article.perspective) {
    parts.push(article.perspective)
  }
  
  // Concepts (mots-clés sémantiques)
  if (article.concepts && Array.isArray(article.concepts)) {
    const conceptNames = article.concepts.map(c => c.name || c).join(' ')
    if (conceptNames) {
      parts.push(conceptNames)
    }
  }
  
  // Outils mentionnés (contexte technique)
  if (article.tools_mentioned && Array.isArray(article.tools_mentioned)) {
    const toolNames = article.tools_mentioned.map(t => t.name || t).join(' ')
    if (toolNames) {
      parts.push(toolNames)
    }
  }
  
  // Domaines (contexte catégoriel)
  if (article.primary_domain) {
    parts.push(article.primary_domain)
  }
  
  if (article.secondary_domains && Array.isArray(article.secondary_domains)) {
    parts.push(...article.secondary_domains)
  }
  
  const fullText = parts.join('. ')
  
  // Truncation si trop long
  if (fullText.length > EMBEDDING_CONFIG.maxTextLength * 4) { // Approximation caractères -> tokens
    return fullText.substring(0, EMBEDDING_CONFIG.maxTextLength * 4) + '...'
  }
  
  return fullText
}

// ==================== CALCUL EMBEDDINGS ====================

async function computeEmbedding(text: string, pipeline: any): Promise<number[]> {
  try {
    // Générer l'embedding
    const output = await pipeline(text, { pooling: 'mean', normalize: true })
    
    // Extraire le vecteur (format peut varier selon version)
    let embedding: number[]
    
    if (output.data) {
      embedding = Array.from(output.data)
    } else if (Array.isArray(output)) {
      embedding = output
    } else {
      throw new Error('Format de sortie non reconnu')
    }
    
    // Validation dimension
    if (embedding.length !== EMBEDDING_CONFIG.dimension) {
      throw new Error(`Dimension incorrecte: attendu ${EMBEDDING_CONFIG.dimension}, obtenu ${embedding.length}`)
    }
    
    return embedding
    
  } catch (error) {
    console.error('❌ Erreur calcul embedding:', error)
    throw error
  }
}

async function computeEmbeddingsBatch(
  articles: any[], 
  pipeline: any,
  progressCallback?: (current: number, total: number) => void
): Promise<ArticleEmbedding[]> {
  
  const results: ArticleEmbedding[] = []
  const total = articles.length
  
  console.log(`🧮 Calcul embeddings pour ${total} articles...`)
  
  // Traitement par batch pour gérer la mémoire
  for (let i = 0; i < total; i += EMBEDDING_CONFIG.batchSize) {
    const batch = articles.slice(i, i + EMBEDDING_CONFIG.batchSize)
    
    for (const article of batch) {
      try {
        const textContent = prepareTextForEmbedding(article)
        
        if (!textContent.trim()) {
          console.warn(`⚠️ Article ${article.id} sans contenu textuel, ignoré`)
          continue
        }
        
        const embedding = await computeEmbedding(textContent, pipeline)
        
        results.push({
          article_id: article.id,
          embedding,
          text_content: textContent,
          computed_at: new Date().toISOString(),
          model_name: EMBEDDING_CONFIG.model,
          vector_dimension: EMBEDDING_CONFIG.dimension
        })
        
        if (progressCallback) {
          progressCallback(results.length, total)
        }
        
        // Petite pause pour éviter surcharge CPU
        await new Promise(resolve => setTimeout(resolve, 10))
        
      } catch (error) {
        console.error(`❌ Erreur embedding article ${article.id}:`, error)
        // Continuer avec les autres articles
      }
    }
    
    // Pause entre batches
    if (i + EMBEDDING_CONFIG.batchSize < total) {
      console.log(`🔄 Batch ${Math.floor(i / EMBEDDING_CONFIG.batchSize) + 1}/${Math.ceil(total / EMBEDDING_CONFIG.batchSize)} terminé`)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

// ==================== CHARGEMENT DONNÉES ====================

async function loadExistingEmbeddings(): Promise<EmbeddingData | null> {
  try {
    const data = await readJSONWithLock(PATHS.EMBEDDINGS, { timeout: 5000 })
    
    if (data.embeddings && Array.isArray(data.embeddings)) {
      console.log(`📂 Embeddings existants chargés: ${data.embeddings.length}`)
      return data as EmbeddingData
    }
    
  } catch (error) {
    console.log('📂 Aucun fichier embedding existant')
  }
  
  return null
}

async function saveEmbeddings(embeddingData: EmbeddingData): Promise<void> {
  await writeJSONAtomic(PATHS.EMBEDDINGS, embeddingData, { lockTimeout: 20000 })
  console.log(`✅ Embeddings sauvés: ${embeddingData.embeddings.length} vecteurs`)
}

// ==================== FONCTION PRINCIPALE ====================

export async function generateEmbeddings(options: {
  forceRecompute?: boolean
  articlesToProcess?: string[]
} = {}): Promise<{
  success: boolean
  message: string
  embeddings_computed: number
  embeddings_total: number
  processing_time_ms: number
  skipped_count: number
}> {
  
  const startTime = Date.now()
  
  try {
    console.log('\n🚀 GÉNÉRATION EMBEDDINGS LOCAUX')
    console.log('='.repeat(50))
    
    // 1. Charger articles
    console.log('📊 Chargement articles...')
    const articleData = await readJSONWithLock(PATHS.ARTICLES, { timeout: 5000 })
    
    // Structure flexible pour compatibilité
    let articles: any[] = []
    if (articleData.articles && Array.isArray(articleData.articles)) {
      articles = articleData.articles
    } else if (Array.isArray(articleData)) {
      articles = articleData
    } else {
      throw new Error('Format articles.json invalide: ni .articles ni array direct')
    }
    
    console.log(`✅ ${articles.length} articles chargés`)
    
    if (articles.length === 0) {
      return {
        success: false,
        message: 'Aucun article à traiter',
        embeddings_computed: 0,
        embeddings_total: 0,
        processing_time_ms: 0,
        skipped_count: 0
      }
    }
    
    // 2. Charger embeddings existants
    const existingEmbeddings = await loadExistingEmbeddings()
    const existingIds = new Set(existingEmbeddings?.embeddings.map(e => e.article_id) || [])
    
    // 3. Déterminer articles à traiter
    let articlesToProcess = articles
    
    if (options.articlesToProcess) {
      articlesToProcess = articles.filter(a => options.articlesToProcess!.includes(a.id))
      console.log(`🎯 Traitement sélectif: ${articlesToProcess.length} articles`)
    }
    
    if (!options.forceRecompute) {
      articlesToProcess = articlesToProcess.filter(a => !existingIds.has(a.id))
      console.log(`⏭️ ${existingIds.size} embeddings existants ignorés`)
    }
    
    console.log(`🔄 ${articlesToProcess.length} articles à traiter`)
    
    if (articlesToProcess.length === 0) {
      const duration = Date.now() - startTime
      return {
        success: true,
        message: 'Tous les embeddings sont déjà à jour',
        embeddings_computed: 0,
        embeddings_total: existingEmbeddings?.embeddings.length || 0,
        processing_time_ms: duration,
        skipped_count: articles.length
      }
    }
    
    // 4. Charger modèle
    const pipeline = await loadEmbeddingModel()
    
    // 5. Calcul embeddings
    const newEmbeddings = await computeEmbeddingsBatch(
      articlesToProcess,
      pipeline,
      (current, total) => {
        const percent = Math.round((current / total) * 100)
        console.log(`📈 Progression: ${current}/${total} (${percent}%)`)
      }
    )
    
    console.log(`✅ ${newEmbeddings.length} embeddings calculés`)
    
    // 6. Fusionner avec existants
    const allEmbeddings = [
      ...(existingEmbeddings?.embeddings || []),
      ...newEmbeddings
    ]
    
    // Dédupliquer par ID (les nouveaux remplacent les anciens)
    const embeddingMap = new Map<string, ArticleEmbedding>()
    allEmbeddings.forEach(e => embeddingMap.set(e.article_id, e))
    const finalEmbeddings = Array.from(embeddingMap.values())
    
    // 7. Sauvegarder
    const duration = Date.now() - startTime
    const embeddingData: EmbeddingData = {
      embeddings: finalEmbeddings,
      model_info: {
        name: EMBEDDING_CONFIG.model,
        dimension: EMBEDDING_CONFIG.dimension,
        language: 'multilingual',
        description: 'Sentence embeddings for semantic similarity'
      },
      computed_at: new Date().toISOString(),
      total_embeddings: finalEmbeddings.length,
      processing_time_ms: duration
    }
    
    await saveEmbeddings(embeddingData)
    
    console.log(`\n✅ SUCCÈS`)
    console.log(`📊 Total: ${finalEmbeddings.length} embeddings`)
    console.log(`🆕 Nouveaux: ${newEmbeddings.length}`)
    console.log(`⏱️ Temps: ${duration}ms`)
    console.log(`🧠 Modèle: ${EMBEDDING_CONFIG.model}`)
    
    return {
      success: true,
      message: `${newEmbeddings.length} embeddings générés avec succès`,
      embeddings_computed: newEmbeddings.length,
      embeddings_total: finalEmbeddings.length,
      processing_time_ms: duration,
      skipped_count: articles.length - articlesToProcess.length
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    const message = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    
    console.error(`\n❌ ÉCHEC après ${duration}ms`)
    console.error(message)
    
    return {
      success: false,
      message,
      embeddings_computed: 0,
      embeddings_total: 0,
      processing_time_ms: duration,
      skipped_count: 0
    }
  }
}

// ==================== CLI ====================

async function main() {
  const args = process.argv.slice(2)
  
  const options = {
    forceRecompute: args.includes('--force'),
    articlesToProcess: undefined as string[] | undefined
  }
  
  // Paramètre --articles pour traitement sélectif
  const articlesFlag = args.findIndex(arg => arg === '--articles')
  if (articlesFlag !== -1 && args[articlesFlag + 1]) {
    options.articlesToProcess = args[articlesFlag + 1].split(',')
    console.log(`🎯 Articles sélectionnés: ${options.articlesToProcess.join(', ')}`)
  }
  
  console.log('📋 Options:')
  console.log(`   Force recompute: ${options.forceRecompute}`)
  console.log(`   Modèle: ${EMBEDDING_CONFIG.model}`)
  console.log(`   Dimension: ${EMBEDDING_CONFIG.dimension}D`)
  console.log(`   Batch size: ${EMBEDDING_CONFIG.batchSize}`)
  
  const result = await generateEmbeddings(options)
  
  if (result.success) {
    console.log('\n🎉 EMBEDDINGS GÉNÉRÉS')
    process.exit(0)
  } else {
    console.log('\n💥 ÉCHEC GÉNÉRATION')
    process.exit(1)
  }
}

// ES Module check - Fixed for Windows
const currentFile = process.argv[1]
if (currentFile && (currentFile.includes('generateEmbeddings') || currentFile.endsWith('generateEmbeddings.ts'))) {
  main()
}