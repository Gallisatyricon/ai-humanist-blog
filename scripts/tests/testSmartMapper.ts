#!/usr/bin/env tsx
/**
 * TEST DU SMART ID MAPPER
 * 
 * Script de test pour vérifier le fonctionnement du Smart ID Mapper
 * avec le fichier d'exemple de n8n
 */

import fs from 'fs/promises'
import path from 'path'
import { mapTargetIds, applyIdMapping, generateMappingReport } from './smartIdMapper.js'
import { Article, ArticleData, SuggestedConnection } from '../src/data/schema.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const INPUT_DATA_PATH = path.join(process.cwd(), 'input_data/20250814_new_articles_oss120.md')

// ==================== PARSING DU FICHIER N8N ====================

async function parseNewArticlesFromN8n(filePath: string): Promise<any[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    let articles: any[] = []
    
    // Méthode 1: Chercher le bloc JSON principal entre ```json et ```
    const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g
    const match = jsonBlockRegex.exec(content)
    
    if (match) {
      try {
        const jsonText = match[1].trim()
        const parsed = JSON.parse(jsonText)
        
        if (Array.isArray(parsed)) {
          articles = parsed
          console.log(`✅ Trouvé ${parsed.length} articles dans le bloc JSON principal`)
        }
      } catch (error) {
        console.warn(`⚠️ Erreur parsing bloc JSON principal:`, (error as Error).message)
      }
    }
    
    // Méthode 2: Si pas de résultat, chercher les objets individuels
    if (articles.length === 0) {
      const individualJsonRegex = /\{[\s\S]*?"article"\s*:\s*\{[\s\S]*?\},\s*"suggested_connections"\s*:\s*\[[\s\S]*?\]\s*\}/g
      
      let individualMatch
      while ((individualMatch = individualJsonRegex.exec(content)) !== null) {
        try {
          const jsonText = individualMatch[0].trim()
          const parsed = JSON.parse(jsonText)
          
          if (parsed.article && parsed.suggested_connections) {
            articles.push(parsed)
          }
        } catch (error) {
          console.warn(`⚠️ Erreur parsing objet JSON individuel:`, (error as Error).message)
        }
      }
    }
    
    console.log(`📊 Total articles extraits: ${articles.length}`)
    return articles
    
  } catch (error) {
    console.error('❌ Erreur lecture fichier:', (error as Error).message)
    return []
  }
}

// ==================== CHARGEMENT DES DONNÉES ====================

async function loadExistingArticles(): Promise<Article[]> {
  try {
    const data = await fs.readFile(ARTICLES_PATH, 'utf-8')
    const parsed = JSON.parse(data) as ArticleData
    return parsed.articles || []
  } catch (error) {
    console.error('❌ Erreur chargement articles:', (error as Error).message)
    return []
  }
}

// ==================== ANALYSE DES CONNEXIONS ====================

function analyzeConnections(articles: any[]): SuggestedConnection[] {
  const allConnections: SuggestedConnection[] = []
  
  articles.forEach(articleData => {
    if (articleData.suggested_connections) {
      allConnections.push(...articleData.suggested_connections)
    }
  })
  
  return allConnections
}

function analyzeConnectionPatterns(connections: SuggestedConnection[]): void {
  const targetCounts = new Map<string, number>()
  const typeCounts = new Map<string, number>()
  const strengthStats: number[] = []
  
  connections.forEach(conn => {
    // Compter les target_id
    targetCounts.set(conn.target_id, (targetCounts.get(conn.target_id) || 0) + 1)
    
    // Compter les types
    typeCounts.set(conn.type, (typeCounts.get(conn.type) || 0) + 1)
    
    // Collecter les forces
    strengthStats.push(conn.strength)
  })
  
  console.log('📊 ANALYSE DES PATTERNS DE CONNEXIONS:')
  console.log('='.repeat(50))
  console.log(`Total connexions: ${connections.length}`)
  
  console.log('\n🎯 TOP 5 target_id les plus référencés:')
  Array.from(targetCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([id, count]) => console.log(`   ${id}: ${count} références`))
  
  console.log('\n🔗 Répartition par type:')
  Array.from(typeCounts.entries()).forEach(([type, count]) => {
    const percentage = (count / connections.length * 100).toFixed(1)
    console.log(`   ${type}: ${count} (${percentage}%)`)
  })
  
  const avgStrength = strengthStats.reduce((sum, s) => sum + s, 0) / strengthStats.length
  const minStrength = Math.min(...strengthStats)
  const maxStrength = Math.max(...strengthStats)
  
  console.log('\n💪 Statistiques de force:')
  console.log(`   Moyenne: ${avgStrength.toFixed(3)}`)
  console.log(`   Min: ${minStrength.toFixed(3)}`)
  console.log(`   Max: ${maxStrength.toFixed(3)}`)
}

// ==================== TEST PRINCIPAL ====================

async function main() {
  console.log('🧪 TEST DU SMART ID MAPPER')
  console.log('='.repeat(50))
  
  // 1. Charger les données
  console.log('📂 Chargement des données...')
  const [existingArticles, newArticles] = await Promise.all([
    loadExistingArticles(),
    parseNewArticlesFromN8n(INPUT_DATA_PATH)
  ])
  
  console.log(`✅ Articles existants: ${existingArticles.length}`)
  console.log(`✅ Nouveaux articles: ${newArticles.length}`)
  
  if (existingArticles.length === 0 || newArticles.length === 0) {
    console.error('❌ Données insuffisantes pour le test')
    return
  }
  
  // 2. Analyser les connexions
  const allConnections = analyzeConnections(newArticles)
  console.log(`✅ Connexions à traiter: ${allConnections.length}`)
  
  analyzeConnectionPatterns(allConnections)
  
  // 3. Tester le mapping
  console.log('\n🔄 DÉBUT DU MAPPING...')
  const mappingResults = await mapTargetIds(allConnections, existingArticles, newArticles)
  
  // 4. Générer le rapport
  generateMappingReport(mappingResults)
  
  // 5. Appliquer le mapping
  console.log('\n🔧 APPLICATION DU MAPPING...')
  const mappedConnections = applyIdMapping(allConnections, mappingResults, 0.3)
  
  console.log(`📊 Connexions avant mapping: ${allConnections.length}`)
  console.log(`📊 Connexions après mapping: ${mappedConnections.length}`)
  console.log(`📊 Connexions perdues: ${allConnections.length - mappedConnections.length}`)
  
  // 6. Sauvegarder les résultats de test
  const testResults = {
    input_summary: {
      existing_articles: existingArticles.length,
      new_articles: newArticles.length,
      total_connections: allConnections.length
    },
    mapping_results: mappingResults,
    final_connections: mappedConnections,
    test_date: new Date().toISOString()
  }
  
  const outputPath = path.join(process.cwd(), 'exports/smart-mapper-test-results.json')
  await fs.writeFile(outputPath, JSON.stringify(testResults, null, 2))
  console.log(`\n💾 Résultats sauvés: ${outputPath}`)
  
  // 7. Exemples de mappings réussis
  const successfulMappings = mappingResults.filter(r => r.newTargetId !== null)
  if (successfulMappings.length > 0) {
    console.log('\n✨ EXEMPLES DE MAPPINGS RÉUSSIS:')
    successfulMappings.slice(0, 5).forEach(result => {
      console.log(`   ${result.originalTargetId} → ${result.newTargetId}`)
      console.log(`      Méthode: ${result.method} (conf: ${result.confidence.toFixed(2)})`)
      console.log(`      Détail: ${result.reasoning}`)
      console.log('')
    })
  }
  
  console.log('\n🎉 Test terminé!')
}

// Exécution
main().catch(console.error)