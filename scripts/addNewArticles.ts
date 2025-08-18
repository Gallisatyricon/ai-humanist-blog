#!/usr/bin/env tsx
/**
 * Script simple pour ajouter les nouveaux articles
 */

import fs from 'fs/promises'

async function addNewArticles() {
  try {
    console.log('🚀 Ajout des nouveaux articles...')
    
    // Lire les fichiers
    const articlesData = await fs.readFile('public/data/articles.json', 'utf-8')
    const articlesJson = JSON.parse(articlesData)
    
    const inputData = await fs.readFile('input_data/20250818_articles.md', 'utf-8')
    
    // Parser les blocs JSON depuis le fichier MD  
    const blocks = inputData.split('}\n{').map((block, index, arr) => {
      if (index === 0 && arr.length > 1) return block + '}'
      if (index === arr.length - 1 && arr.length > 1) return '{' + block
      if (arr.length === 1) return block
      return '{' + block + '}'
    })
    
    console.log(`📄 Trouvé ${blocks.length} blocs à traiter`)
    
    let addedCount = 0
    
    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block)
        
        if (parsed.article) {
          // Corriger les domaines pour la validation
          const article = parsed.article
          
          // Mapper vers les domaines valides
          const domainMapping = {
            'ethique': 'society',
            'regulation': 'regulation', 
            'frugalite': 'green_ai',
            'recherche': 'education',
            'philosophie': 'society',
            'technique': 'deep_learning',
            'usage_professionnel': 'industry_4_0'
          }
          
          article.secondary_domains = article.secondary_domains?.map(d => domainMapping[d] || d) || []
          
          // Corriger la date
          if (article.date && !article.date.includes('T')) {
            article.date = article.date + 'T00:00:00Z'
          }
          
          // Corriger les types d'outils
          article.tools_mentioned?.forEach(tool => {
            if (tool.type === 'infrastructure') {
              tool.type = 'platform'
            }
          })
          
          articlesJson.articles.push(article)
          addedCount++
          console.log(`✅ Ajouté: ${article.title} (${article.id})`)
        }
      } catch (e) {
        console.log(`⚠️ Erreur parsing bloc: ${e.message}`)
      }
    }
    
    // Sauvegarder
    await fs.writeFile('public/data/articles.json', JSON.stringify(articlesJson, null, 2))
    
    console.log(`🎉 ${addedCount} articles ajoutés avec succès !`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

addNewArticles()