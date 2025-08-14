#!/usr/bin/env tsx
/**
 * SCRIPT D'IMPORT EN BATCH DE MULTIPLES ARTICLES
 * 
 * Ce script traite un fichier mixte contenant des titres markdown
 * et des blocs JSON d'articles avec connexions suggérées.
 * 
 * Usage:
 * npm run batch-import -- --input articles-with-titles.md
 */

import fs from 'fs/promises'
import path from 'path'

// Imports locaux sans .js pour TypeScript
interface NewArticleInput {
  article: any
  suggested_connections: any[]
}

// ==================== PARSING DU FICHIER MIXTE ====================

async function parseArticlesFromMixedFile(filePath: string): Promise<NewArticleInput[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const articles: NewArticleInput[] = []
    
    // Regex pour capturer les blocs JSON (entre ```json et ```)
    const jsonBlockRegex = /```?json\s*\n([\s\S]*?)\n```?/g
    
    // Alternative: regex pour capturer les objets JSON directement
    const directJsonRegex = /\{[\s\S]*?"suggested_connections"\s*:\s*\[[\s\S]*?\]\s*\}/g
    
    let match
    let blockCount = 0
    
    console.log('🔍 Recherche des blocs JSON...')
    
    // Essayer d'abord avec les blocs ```json
    while ((match = jsonBlockRegex.exec(content)) !== null) {
      try {
        blockCount++
        const jsonText = match[1].trim()
        const parsed = JSON.parse(jsonText)
        
        // Validation basique
        if (parsed.article && parsed.article.id && parsed.suggested_connections) {
          articles.push(parsed)
          console.log(`✅ Article ${parsed.article.id} extrait`)
        } else {
          console.warn(`⚠️  Bloc JSON ${blockCount} invalide (manque article ou suggested_connections)`)
        }
      } catch (error) {
        console.warn(`⚠️  Erreur parsing bloc JSON ${blockCount}:`, error.message)
      }
    }
    
    // Si aucun bloc ```json trouvé, essayer la regex directe
    if (articles.length === 0) {
      console.log('🔍 Recherche des objets JSON directement...')
      while ((match = directJsonRegex.exec(content)) !== null) {
        try {
          blockCount++
          const jsonText = match[0].trim()
          const parsed = JSON.parse(jsonText)
          
          if (parsed.article && parsed.article.id && parsed.suggested_connections) {
            articles.push(parsed)
            console.log(`✅ Article ${parsed.article.id} extrait`)
          }
        } catch (error) {
          console.warn(`⚠️  Erreur parsing objet JSON ${blockCount}:`, error.message)
        }
      }
    }
    
    console.log(`📊 ${articles.length} articles extraits du fichier`)
    return articles
    
  } catch (error) {
    console.error('❌ Erreur lecture fichier:', error.message)
    return []
  }
}

// ==================== AJOUT SIMPLIFIÉ DIRECT ====================

async function addArticleToDatabase(articleData: NewArticleInput) {
  const articlesPath = path.join(process.cwd(), 'public/data/articles.json')
  // const connectionsPath = path.join(process.cwd(), 'public/data/connections.json')
  
  try {
    // Charger les articles existants
    let articlesFile
    try {
      articlesFile = await fs.readFile(articlesPath, 'utf-8')
    } catch {
      articlesFile = JSON.stringify({ articles: [] })
    }
    
    const data = JSON.parse(articlesFile)
    const articles = Array.isArray(data) ? data : data.articles || []
    
    // Vérifier si l'article existe déjà
    if (articles.find((a: any) => a.id === articleData.article.id)) {
      return { success: false, message: `Article ${articleData.article.id} existe déjà` }
    }
    
    // Ajouter le nouvel article
    articles.push(articleData.article)
    
    // Sauvegarder
    const newData = {
      articles,
      last_updated: new Date().toISOString(),
      total_articles: articles.length
    }
    
    await fs.writeFile(articlesPath, JSON.stringify(newData, null, 2))
    
    return { success: true, message: `Article ${articleData.article.id} ajouté` }
    
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// ==================== IMPORT EN BATCH ====================

async function batchImportArticles(inputFile: string) {
  console.log('🚀 Début de l\'import en batch')
  console.log(`📁 Fichier source: ${inputFile}`)
  console.log('=' .repeat(50))
  
  try {
    // 1. Parser le fichier
    const articles = await parseArticlesFromMixedFile(inputFile)
    
    console.log(`📊 ${articles.length} articles trouvés`)
    
    if (articles.length === 0) {
      console.error('❌ Aucun article trouvé dans le fichier')
      return
    }
    
    // 2. Traiter chaque article
    const results = {
      success: 0,
      errors: 0,
      details: [] as any[]
    }
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      const progress = `[${i + 1}/${articles.length}]`
      
      console.log(`${progress} Traitement de ${article.article.id}...`)
      
      try {
        const result = await addArticleToDatabase(article)
        
        if (result.success) {
          results.success++
          console.log(`✅ ${progress} ${article.article.id} ajouté avec succès`)
        } else {
          results.errors++
          console.error(`❌ ${progress} Erreur: ${result.message}`)
          results.details.push({
            article_id: article.article.id,
            error: result.message
          })
        }
        
      } catch (error) {
        results.errors++
        console.error(`❌ ${progress} Exception:`, error.message)
        results.details.push({
          article_id: article.article.id,
          error: error.message
        })
      }
    }
    
    // 3. Rapport final
    console.log('\n' + '='.repeat(50))
    console.log('📊 RAPPORT FINAL')
    console.log('='.repeat(50))
    console.log(`✅ Succès: ${results.success}`)
    console.log(`❌ Erreurs: ${results.errors}`)
    console.log(`📈 Taux de succès: ${Math.round((results.success / articles.length) * 100)}%`)
    
    if (results.errors > 0) {
      console.log('\n🔍 Détails des erreurs:')
      results.details.forEach(detail => {
        console.log(`   - ${detail.article_id}: ${detail.error}`)
      })
    }
    
    console.log('\n🎉 Import terminé!')
    console.log('\n💡 Recommandation: Générez ensuite les connexions avec npm run generate-connections')
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message)
  }
}

// ==================== CLI ====================

async function main() {
  const args = process.argv.slice(2)
  const inputIndex = args.indexOf('--input')
  
  if (inputIndex === -1 || !args[inputIndex + 1]) {
    console.error(`
❌ Usage: npm run batch-import -- --input <fichier>

Exemples:
  npm run batch-import -- --input articles.md
  npm run batch-import -- --input articles-with-titles.txt
    `)
    process.exit(1)
  }
  
  const inputFile = args[inputIndex + 1]
  const fullPath = path.resolve(inputFile)
  
  try {
    await fs.access(fullPath)
  } catch {
    console.error(`❌ Fichier non trouvé: ${fullPath}`)
    process.exit(1)
  }
  
  await batchImportArticles(fullPath)
}

// Exécution CLI directe
if (process.argv[1]?.includes('batchImportArticles')) {
  main().catch(console.error)
}