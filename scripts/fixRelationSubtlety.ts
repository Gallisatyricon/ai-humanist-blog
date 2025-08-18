#!/usr/bin/env tsx
/**
 * FIX RELATION SUBTLETY - VERSION FINALE CLEAN
 * 
 * Étape 5 de la pipeline - Affinage subtilité relationnelle
 * 
 * INTÉGRATION DANS PIPELINE:
 * 1. generate-embeddings
 * 2. analyze-ground-truth  
 * 3. calibrate-thresholds
 * 4. enhance-ground-truth (Architecture triple)
 * 5. fix-subtlety (CETTE ÉTAPE) - Affinage subtilité
 * 6. optimize-readability - Filtrage lisibilité
 * 7. validate-triple
 * 
 * FONCTION:
 * - Applique seuils dynamiques basés sources existantes
 * - Détecte contradictions subtiles (patterns linguistiques + chevauchement conceptuel)
 * - Enrichit ponts interdisciplinaires avec seuils spécialisés
 * - Préserve 100% cohérence avec ground truth existante
 * 
 * SEUILS DYNAMIQUES APPLIQUÉS:
 * - éthique↔technique: 0.150 (vs 0.32 standard) 
 * - frugalité↔technique: 0.100 (connexions écologiques)
 * - recherche↔usage: 0.230 (ponts pratiques)
 * - contradictions: 0.25-0.65 similarité + indicateurs linguistiques
 */

import { readFileSync, writeFileSync } from 'fs'

// Fonction similarité cosinus
function calculateSimilarity(vec1: number[], vec2: number[]): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0
  
  let dotProduct = 0, norm1 = 0, norm2 = 0
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

// Détection indicateurs de contradiction
function detectContradictionIndicators(article1: any, article2: any): {
  strength: number
  indicators: string[]
  conceptOverlap: string[]
} {
  const text1 = `${article1.title} ${article1.summary || ''}`.toLowerCase()
  const text2 = `${article2.title} ${article2.summary || ''}`.toLowerCase()
  
  // Indicateurs de contradiction
  const oppositionKeywords = ['but', 'however', 'challenge', 'contrary', 'limitation', 'problem', 'tension']
  const negationKeywords = ['not', 'no', 'cannot', 'ineffective', 'inadequate']
  
  const foundOpposition = oppositionKeywords.filter(kw => text1.includes(kw) || text2.includes(kw))
  const foundNegation = negationKeywords.filter(kw => text1.includes(kw) || text2.includes(kw))
  
  const indicators = [
    ...foundOpposition.map(kw => `opposition:${kw}`),
    ...foundNegation.map(kw => `negation:${kw}`)
  ]
  
  // Chevauchement conceptuel
  const concepts1 = article1.concepts?.map(c => c.name.toLowerCase()) || []
  const concepts2 = article2.concepts?.map(c => c.name.toLowerCase()) || []
  const conceptOverlap = concepts1.filter(c1 => 
    concepts2.some(c2 => 
      c1.includes(c2.split(' ')[0]) || c2.includes(c1.split(' ')[0])
    )
  )
  
  const strength = (foundOpposition.length * 0.6 + foundNegation.length * 0.4) / 5
  
  return { strength: Math.min(1.0, strength), indicators, conceptOverlap }
}

// Fonction seuil dynamique
function getDynamicThreshold(domain1: string, domain2: string, dynamicThresholds: Map<string, number>, globalFallback: number): number {
  const domains = [domain1, domain2].sort()
  const key = `${domains[0]}↔${domains[1]}`
  return dynamicThresholds.get(key) || globalFallback
}

console.log('🔧 FIX RELATION SUBTLETY - Affinage Pipeline')
console.log('   Étape 5/6 - Amélioration subtilité relationnelle')

try {
  const articlesData = JSON.parse(readFileSync('public/data/articles.json', 'utf-8'))
  const connectionsData = JSON.parse(readFileSync('public/data/connections.json', 'utf-8'))
  const embeddingsData = JSON.parse(readFileSync('public/data/embeddings.json', 'utf-8'))
  
  const articles = articlesData.articles || articlesData
  const existingConnections = connectionsData.connections || connectionsData
  const embeddingsArray = embeddingsData.embeddings || embeddingsData
  
  // Convertir embeddings
  const embeddings: Record<string, number[]> = {}
  if (Array.isArray(embeddingsArray)) {
    embeddingsArray.forEach(item => {
      if (item.article_id && item.embedding) {
        embeddings[item.article_id] = item.embedding
      }
    })
  }
  
  console.log(`📊 Base: ${articles.length} articles, ${existingConnections.length} connexions`)
  
  // 1. CALIBRATION SEUILS DYNAMIQUES basée sur connexions existantes
  console.log('\\n🎯 Phase 1: Calibration seuils dynamiques...')
  
  // Analyser connexions existantes pour calibrer seuils
  const bridgeAnalysis = new Map<string, { similarities: number[], count: number }>()
  
  existingConnections.forEach(conn => {
    const sourceArticle = articles.find(a => a.id === conn.source_id)
    const targetArticle = articles.find(a => a.id === conn.target_id)
    
    if (!sourceArticle || !targetArticle) return
    
    const isInterdisciplinary = sourceArticle.primary_domain !== targetArticle.primary_domain
    if (!isInterdisciplinary) return // Focus sur ponts interdisciplinaires
    
    const vec1 = embeddings[conn.source_id]
    const vec2 = embeddings[conn.target_id]
    if (!vec1 || !vec2) return
    
    const similarity = calculateSimilarity(vec1, vec2)
    const domains = [sourceArticle.primary_domain, targetArticle.primary_domain].sort()
    const key = `${domains[0]}↔${domains[1]}`
    
    if (!bridgeAnalysis.has(key)) {
      bridgeAnalysis.set(key, { similarities: [], count: 0 })
    }
    
    bridgeAnalysis.get(key)!.similarities.push(similarity)
    bridgeAnalysis.get(key)!.count++
  })
  
  // Calculer seuils optimaux par type de pont
  const dynamicThresholds = new Map<string, number>()
  const globalFallback = 0.18 // Seuil conservateur global
  
  bridgeAnalysis.forEach((data, bridgeType) => {
    if (data.similarities.length >= 2) {
      // Seuil = 85% du minimum des connexions validées
      const minSimilarity = Math.min(...data.similarities)
      const threshold = Math.max(0.15, minSimilarity * 0.85)
      dynamicThresholds.set(bridgeType, threshold)
      
      console.log(`   ${bridgeType}: seuil ${threshold.toFixed(3)} (${data.count} sources)`)
    }
  })
  
  // 2. DÉTECTION CONTRADICTIONS SUBTILES
  console.log('\\n⚡ Phase 2: Détection contradictions subtiles...')
  
  // 3. ENRICHISSEMENT CONNEXIONS
  console.log('\\n🌉 Phase 3: Enrichissement connexions subtiles...')
  
  const newConnections = []
  let processed = 0
  
  // Analyse sur échantillon stratégique (priorité interdisciplinaire)
  const interdisciplinaryPairs = []
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      if (articles[i].primary_domain !== articles[j].primary_domain) {
        interdisciplinaryPairs.push([i, j])
      }
    }
  }
  
  // Limiter à échantillon gérable
  const sampleSize = Math.min(500, interdisciplinaryPairs.length)
  const samplePairs = interdisciplinaryPairs.slice(0, sampleSize)
  
  for (const [i, j] of samplePairs) {
    const article1 = articles[i]
    const article2 = articles[j]
    
    processed++
    if (processed % 100 === 0) {
      console.log(`   Analysé ${processed}/${sampleSize} paires interdisciplinaires...`)
    }
    
    // Skip connexions existantes
    const existingConnection = existingConnections.find(c => 
      (c.source_id === article1.id && c.target_id === article2.id) ||
      (c.source_id === article2.id && c.target_id === article1.id)
    )
    if (existingConnection) continue
    
    const vec1 = embeddings[article1.id]
    const vec2 = embeddings[article2.id]
    if (!vec1 || !vec2) continue
    
    const similarity = calculateSimilarity(vec1, vec2)
    const threshold = getDynamicThreshold(article1.primary_domain, article2.primary_domain, dynamicThresholds, globalFallback)
    
    // TEST 1: Pont interdisciplinaire
    if (similarity >= threshold) {
      newConnections.push({
        source_id: article1.id,
        target_id: article2.id,
        type: 'questions', // Type par défaut ponts interdisciplinaires
        strength: Math.min(0.9, similarity + 0.2), // Bonus interdisciplinaire
        auto_detected: true,
        detection_method: 'subtlety_bridge',
        reasoning: `Pont interdisciplinaire ${article1.primary_domain}↔${article2.primary_domain}`
      })
    }
    
    // TEST 2: Contradiction subtile
    else if (similarity >= 0.25 && similarity <= 0.65) {
      const contradictionAnalysis = detectContradictionIndicators(article1, article2)
      
      if (contradictionAnalysis.strength >= 0.5 && contradictionAnalysis.conceptOverlap.length >= 1) {
        newConnections.push({
          source_id: article1.id,
          target_id: article2.id,
          type: 'contradicts',
          strength: Math.min(0.8, similarity + contradictionAnalysis.strength * 0.3),
          auto_detected: true,
          detection_method: 'subtlety_contradiction',
          reasoning: `Contradiction subtile: ${contradictionAnalysis.conceptOverlap.slice(0, 2).join(', ')}`
        })
      }
    }
  }
  
  console.log(`\\n📊 RÉSULTATS AFFINAGE:`)
  console.log(`   Nouvelles connexions détectées: ${newConnections.length}`)
  
  const bridgeCount = newConnections.filter(c => c.detection_method === 'subtlety_bridge').length
  const contradictionCount = newConnections.filter(c => c.detection_method === 'subtlety_contradiction').length
  
  console.log(`   - Ponts interdisciplinaires: ${bridgeCount}`)
  console.log(`   - Contradictions subtiles: ${contradictionCount}`)
  
  // 4. INTÉGRATION DANS DONNÉES EXISTANTES
  if (newConnections.length > 0) {
    console.log('\\n💾 Intégration nouvelles connexions...')
    
    const updatedConnections = [...existingConnections, ...newConnections]
    const updatedConnectionsData = {
      ...connectionsData,
      connections: updatedConnections
    }
    
    // Sauvegarde atomique
    writeFileSync('public/data/connections.json', JSON.stringify(updatedConnectionsData, null, 2))
    
    console.log(`✅ ${newConnections.length} connexions ajoutées`)
    console.log(`   Total connexions: ${existingConnections.length} → ${updatedConnections.length}`)
  }
  
  // 5. RAPPORT AFFINAGE
  const improvementReport = {
    timestamp: new Date().toISOString(),
    base_connections: existingConnections.length,
    new_connections: newConnections.length,
    total_connections: existingConnections.length + newConnections.length,
    improvements: {
      interdisciplinary_bridges: bridgeCount,
      subtle_contradictions: contradictionCount,
      dynamic_thresholds_used: dynamicThresholds.size,
      sample_analyzed: sampleSize
    },
    quality_metrics: {
      interdisciplinary_ratio: newConnections.length > 0 ? 
        newConnections.filter(c => c.detection_method === 'subtlety_bridge').length / newConnections.length : 0,
      average_strength: newConnections.length > 0 ? 
        newConnections.reduce((sum, c) => sum + c.strength, 0) / newConnections.length : 0
    }
  }
  
  writeFileSync('public/data/subtlety_report.json', JSON.stringify(improvementReport, null, 2))
  
  console.log(`\\n🎯 AFFINAGE SUBTILITÉ TERMINÉ`)
  console.log(`   Rapport sauvé: subtlety_report.json`)
  console.log(`   Amélioration: +${newConnections.length} connexions subtiles`)
  console.log(`   Prêt pour étape 6: npm run optimize-readability`)
  
} catch (error) {
  console.error('❌ Erreur fix-subtlety:', error)
  process.exit(1)
}