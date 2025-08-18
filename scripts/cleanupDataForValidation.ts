#!/usr/bin/env tsx
/**
 * Script pour nettoyer les données existantes et les rendre conformes aux validations Zod
 */

import { writeJSONAtomic, readJSONWithLock } from './writeFileAtomic.js'

async function cleanupData() {
  try {
    console.log('🧹 Nettoyage des données existantes...')
    
    // Lire les articles existants
    const articleData = await readJSONWithLock('public/data/articles.json', { timeout: 5000 })
    const articles = articleData.articles || []
    
    console.log(`📄 Trouvé ${articles.length} articles à nettoyer`)
    
    // Mapper les domaines invalides vers les valides (schéma utilise les termes français)
    const primaryDomainMapping = {
      'society': 'ethique',
      'education': 'recherche',
      'deep_learning': 'technique',
      'industry_4_0': 'usage_professionnel',
      'green_ai': 'frugalite',
      'regulation': 'ethique'  // regulation maps to ethique 
    }
    
    const secondaryDomainMapping = {
      'ethique': 'society',
      'regulation': 'regulation', 
      'frugalite': 'green_ai',
      'recherche': 'education',
      'philosophie': 'society',
      'technique': 'deep_learning',
      'usage_professionnel': 'industry_4_0'
    }
    
    // Mapper les types d'outils invalides
    const toolTypeMapping = {
      'infrastructure': 'platform',
      'algorithm': 'model',
      'service': 'platform'
    }
    
    // Mapper les types de sources invalides
    const sourceTypeMapping = {
      'report': 'academic',
      'article': 'blog', 
      'paper': 'academic',
      'website': 'blog',
      'youtube': 'blog',
      'pdf': 'academic'
    }
    
    // Mapper les types de concepts invalides
    const conceptTypeMapping = {
      'social': 'philosophical',
      'economic': 'philosophical',
      'policy': 'methodological',
      'research': 'methodological'
    }
    
    let cleanedCount = 0
    
    for (const article of articles) {
      let needsCleaning = false
      
      // 1. Corriger la date si elle n'est pas au format ISO
      if (article.date && !article.date.includes('T')) {
        article.date = article.date + 'T00:00:00Z'
        needsCleaning = true
      }
      
      // 2. Corriger les domaines invalides
      if (article.primary_domain && primaryDomainMapping[article.primary_domain]) {
        article.primary_domain = primaryDomainMapping[article.primary_domain]
        needsCleaning = true
      }
      
      if (article.secondary_domains) {
        article.secondary_domains = article.secondary_domains.map(d => secondaryDomainMapping[d] || d)
        needsCleaning = true
      }
      
      // 3. Corriger les types d'outils
      if (article.tools_mentioned) {
        article.tools_mentioned.forEach(tool => {
          if (toolTypeMapping[tool.type]) {
            tool.type = toolTypeMapping[tool.type]
            needsCleaning = true
          }
        })
      }
      
      // 4. Corriger le type de source
      if (article.source_type && sourceTypeMapping[article.source_type]) {
        article.source_type = sourceTypeMapping[article.source_type]
        needsCleaning = true
      }
      
      // 5. Corriger les types de concepts
      if (article.concepts) {
        article.concepts.forEach(concept => {
          if (conceptTypeMapping[concept.type]) {
            concept.type = conceptTypeMapping[concept.type]
            needsCleaning = true
          }
        })
      }
      
      // 6. Ajouter les champs manquants
      if (!article.connected_articles) {
        article.connected_articles = []
        needsCleaning = true
      }
      
      if (article.centrality_score === undefined) {
        article.centrality_score = 0
        needsCleaning = true
      }
      
      // 7. S'assurer que centrality_score est un nombre
      article.centrality_score = Number(article.centrality_score) || 0
      
      if (needsCleaning) {
        cleanedCount++
      }
    }
    
    // Mettre à jour les métadonnées
    const cleanedData = {
      articles,
      last_updated: new Date().toISOString(),
      total_articles: articles.length
    }
    
    // Sauvegarder
    await writeJSONAtomic('public/data/articles.json', cleanedData)
    
    console.log(`✅ ${cleanedCount} articles nettoyés et sauvegardés`)
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message)
  }
}

cleanupData()