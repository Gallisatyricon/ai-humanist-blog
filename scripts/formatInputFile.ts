#!/usr/bin/env tsx
/**
 * Script pour reformater le fichier 20250818_articles.md 
 * pour le rendre compatible avec batch-import
 */

import fs from 'fs/promises'

async function formatInputFile() {
  try {
    console.log('🔄 Reformatage du fichier d\'entrée...')
    
    // Lire le fichier source
    const inputData = await fs.readFile('input_data/20250818_articles.md', 'utf-8')
    
    // Séparer les blocs JSON par le pattern "}\n{"
    const blocks = []
    let currentBlock = ''
    let braceCount = 0
    let inBlock = false
    
    for (let i = 0; i < inputData.length; i++) {
      const char = inputData[i]
      
      if (char === '{') {
        if (!inBlock) {
          inBlock = true
          currentBlock = ''
        }
        braceCount++
      }
      
      if (inBlock) {
        currentBlock += char
      }
      
      if (char === '}') {
        braceCount--
        if (braceCount === 0 && inBlock) {
          blocks.push(currentBlock)
          inBlock = false
        }
      }
    }
    
    console.log(`📄 Trouvé ${blocks.length} blocs JSON`)
    
    // Créer le contenu markdown formaté
    let markdownContent = '# Nouveaux Articles AI Humanist Blog - 2025-08-18\n\n'
    
    for (let i = 0; i < blocks.length; i++) {
      try {
        // Parser pour vérifier la validité
        const parsed = JSON.parse(blocks[i])
        
        if (parsed.article) {
          // Corriger les données pour la validation
          const article = parsed.article
          
          // Corriger la date
          if (article.date && !article.date.includes('T')) {
            article.date = article.date + 'T00:00:00Z'
          }
          
          // Mapper les domaines vers les termes français requis par le schéma
          const primaryDomainMapping = {
            'usage_professionnel': 'usage_professionnel',
            'education': 'recherche', 
            'society': 'ethique',
            'industry_4_0': 'usage_professionnel',
            'green_ai': 'frugalite',
            'deep_learning': 'technique',
            'regulation': 'ethique'
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
          
          // Corriger le domaine primaire
          if (article.primary_domain && primaryDomainMapping[article.primary_domain]) {
            article.primary_domain = primaryDomainMapping[article.primary_domain]
          }
          
          if (article.secondary_domains) {
            article.secondary_domains = article.secondary_domains.map(d => secondaryDomainMapping[d] || d)
          }
          
          // Corriger les types d'outils
          if (article.tools_mentioned) {
            article.tools_mentioned.forEach(tool => {
              if (tool.type === 'infrastructure') {
                tool.type = 'platform'
              }
            })
          }
          
          // Corriger le type de source
          const sourceTypeMapping = {
            'report': 'academic',
            'youtube': 'blog',
            'pdf': 'academic'
          }
          if (article.source_type && sourceTypeMapping[article.source_type]) {
            article.source_type = sourceTypeMapping[article.source_type]
          }
          
          // Corriger les types de concepts
          const conceptTypeMapping = {
            'social': 'philosophical',
            'economic': 'philosophical',
            'policy': 'methodological'
          }
          if (article.concepts) {
            article.concepts.forEach(concept => {
              if (conceptTypeMapping[concept.type]) {
                concept.type = conceptTypeMapping[concept.type]
              }
            })
          }
          
          // Ajouter les champs manquants s'ils n'existent pas
          if (!article.connected_articles) {
            article.connected_articles = []
          }
          if (article.centrality_score === undefined) {
            article.centrality_score = 0
          }
          
          // S'assurer que centrality_score est bien un nombre
          article.centrality_score = Number(article.centrality_score) || 0
          
          // Reconstruire le bloc complet
          const correctedBlock = {
            article: article,
            suggested_connections: parsed.suggested_connections || []
          }
          
          // Ajouter au markdown avec délimiteurs
          markdownContent += `## Article ${i + 1}: ${article.title}\n\n`
          markdownContent += '```json\n'
          markdownContent += JSON.stringify(correctedBlock, null, 2)
          markdownContent += '\n```\n\n'
          
          console.log(`✅ Article ${i + 1}: ${article.title} (${article.id})`)
        }
      } catch (e) {
        console.log(`⚠️ Erreur parsing bloc ${i + 1}: ${e.message}`)
      }
    }
    
    // Sauvegarder le fichier reformaté
    await fs.writeFile('input_data/20250818_articles_formatted.md', markdownContent)
    
    console.log('🎉 Fichier reformaté sauvegardé : input_data/20250818_articles_formatted.md')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

formatInputFile()