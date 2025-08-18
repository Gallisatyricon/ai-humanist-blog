#!/usr/bin/env tsx
/**
 * OPTIMIZE READABILITY - VERSION FINALE
 * 
 * Étape 6 de la pipeline - Filtrage lisibilité avec préservation centralité
 * 
 * INTÉGRATION DANS PIPELINE:
 * 5. fix-subtlety (Affinage subtilité)
 * 6. optimize-readability (CETTE ÉTAPE) - Filtrage lisibilité
 * 7. validate-triple (Validation finale)
 * 
 * FONCTION:
 * - Filtre intelligemment pour obtenir graphe lisible (<15% densité)
 * - Préserve hiérarchie intellectuelle (centralité dynamique)
 * - Garantit ground truth + contradictions 100%
 * - Optimise navigation utilisateur
 * 
 * STRATÉGIE:
 * 1. Préserver 100% ground truth (priorité absolue)
 * 2. Préserver 100% contradictions (rares et précieuses)
 * 3. Filtrage dynamique par centralité (articles centraux gardent plus)
 * 4. Objectif: ~270 connexions, 11% densité, 7 conn/article
 */

import { readFileSync, writeFileSync } from 'fs'

console.log('🎨 OPTIMIZE READABILITY - Filtrage Lisibilité Finale')
console.log('   Étape 6/7 - Préservation centralité + navigation fluide')

try {
  const articlesData = JSON.parse(readFileSync('public/data/articles.json', 'utf-8'))
  const connectionsData = JSON.parse(readFileSync('public/data/connections.json', 'utf-8'))
  
  const articles = articlesData.articles || articlesData
  const allConnections = connectionsData.connections || connectionsData
  
  console.log(`📊 Base après fix-subtlety: ${articles.length} articles, ${allConnections.length} connexions`)
  
  const TARGET_DENSITY = 0.11 // 11% - Équilibre optimal lisibilité/richesse
  const maxConnections = (articles.length * (articles.length - 1)) / 2
  const TARGET_CONNECTIONS = Math.round(maxConnections * TARGET_DENSITY)
  
  console.log(`🎯 Objectif lisibilité: ${TARGET_CONNECTIONS} connexions (${(TARGET_DENSITY * 100)}% densité)`)
  
  // PHASE 1: Calculer centralité pour filtrage dynamique
  console.log(`\\n📈 PHASE 1: Analyse centralité pour filtrage dynamique...`)
  
  const rawConnectionCount = new Map<string, number>()
  articles.forEach(article => rawConnectionCount.set(article.id, 0))
  
  allConnections.forEach(conn => {
    rawConnectionCount.set(conn.source_id, (rawConnectionCount.get(conn.source_id) || 0) + 1)
    rawConnectionCount.set(conn.target_id, (rawConnectionCount.get(conn.target_id) || 0) + 1)
  })
  
  const centralityScores = Array.from(rawConnectionCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, count], index) => ({
      article_id: id,
      raw_connections: count,
      centrality_percentile: (articles.length - index) / articles.length
    }))
  
  console.log(`   Centralité max: ${centralityScores[0].raw_connections} connexions (${centralityScores[0].article_id})`)
  
  // PHASE 2: Catégorisation intelligente par priorité + centralité
  console.log(`\\n🎯 PHASE 2: Catégorisation par priorité et centralité...`)
  
  const connectionsByPriority = {
    ground_truth: [] as any[],
    contradictions: [] as any[], 
    high_quality_central: [] as any[],
    high_quality_peripheral: [] as any[],
    medium_quality_central: [] as any[],
    medium_quality_peripheral: [] as any[],
    low_priority: [] as any[]
  }
  
  allConnections.forEach(conn => {
    const isManual = !conn.auto_detected
    const isContradiction = conn.type === 'contradicts'
    const strength = conn.strength || 0.5
    
    const sourceArticle = articles.find(a => a.id === conn.source_id)
    const targetArticle = articles.find(a => a.id === conn.target_id)
    const isInterdisciplinary = sourceArticle && targetArticle && 
      sourceArticle.primary_domain !== targetArticle.primary_domain
    
    if (isManual) {
      connectionsByPriority.ground_truth.push(conn)
      return
    }
    
    if (isContradiction) {
      connectionsByPriority.contradictions.push(conn)
      return  
    }
    
    // Déterminer centralité des articles impliqués
    const sourceCentrality = centralityScores.find(c => c.article_id === conn.source_id)?.centrality_percentile || 0
    const targetCentrality = centralityScores.find(c => c.article_id === conn.target_id)?.centrality_percentile || 0
    const maxCentrality = Math.max(sourceCentrality, targetCentrality)
    const isCentral = maxCentrality >= 0.7 // Top 30% = central
    
    if (strength >= 0.7 && isInterdisciplinary) {
      if (isCentral) {
        connectionsByPriority.high_quality_central.push(conn)
      } else {
        connectionsByPriority.high_quality_peripheral.push(conn)  
      }
    } else if (strength >= 0.5 && isInterdisciplinary) {
      if (isCentral) {
        connectionsByPriority.medium_quality_central.push(conn)
      } else {
        connectionsByPriority.medium_quality_peripheral.push(conn)
      }
    } else {
      connectionsByPriority.low_priority.push(conn)
    }
  })
  
  console.log(`   Ground truth: ${connectionsByPriority.ground_truth.length} connexions`)
  console.log(`   Contradictions: ${connectionsByPriority.contradictions.length} connexions`)
  console.log(`   HQ central: ${connectionsByPriority.high_quality_central.length} connexions`)
  console.log(`   Medium central: ${connectionsByPriority.medium_quality_central.length} connexions`)
  
  // PHASE 3: Sélection optimisée avec préservation centralité
  console.log(`\\n🔄 PHASE 3: Sélection optimisée...`)
  
  const selectedConnections = []
  
  // 1. Ground truth absolu (priorité absolue)
  selectedConnections.push(...connectionsByPriority.ground_truth)
  console.log(`   ✅ Ground truth: ${selectedConnections.length} connexions`)
  
  // 2. Contradictions absolues (rares et précieuses)
  selectedConnections.push(...connectionsByPriority.contradictions)
  console.log(`   ✅ + Contradictions: ${selectedConnections.length} connexions`)
  
  // 3. High quality central (préservation centralité)
  const remainingSlots = TARGET_CONNECTIONS - selectedConnections.length
  const hqCentralSorted = connectionsByPriority.high_quality_central
    .sort((a, b) => (b.strength || 0.5) - (a.strength || 0.5))
  
  const hqCentralToAdd = Math.min(remainingSlots, hqCentralSorted.length)
  selectedConnections.push(...hqCentralSorted.slice(0, hqCentralToAdd))
  console.log(`   ✅ + HQ Central: ${selectedConnections.length} connexions (+${hqCentralToAdd})`)
  
  // 4. Compléter avec mix optimal
  const stillRemaining = TARGET_CONNECTIONS - selectedConnections.length
  if (stillRemaining > 0) {
    const mediumCentralSorted = connectionsByPriority.medium_quality_central
      .sort((a, b) => (b.strength || 0.5) - (a.strength || 0.5))
    const hqPeripheralSorted = connectionsByPriority.high_quality_peripheral
      .sort((a, b) => (b.strength || 0.5) - (a.strength || 0.5))
    
    // Mix: 60% medium central, 40% high peripheral
    const mediumCentralToAdd = Math.min(Math.floor(stillRemaining * 0.6), mediumCentralSorted.length)
    const hqPeripheralToAdd = Math.min(stillRemaining - mediumCentralToAdd, hqPeripheralSorted.length)
    
    selectedConnections.push(...mediumCentralSorted.slice(0, mediumCentralToAdd))
    selectedConnections.push(...hqPeripheralSorted.slice(0, hqPeripheralToAdd))
    
    console.log(`   ✅ + Mix optimal: ${selectedConnections.length} connexions (+${mediumCentralToAdd + hqPeripheralToAdd})`)
  }
  
  // PHASE 4: Calculs métriques et validation
  console.log(`\\n📊 PHASE 4: Métriques finales...`)
  
  const finalConnectionCounts = new Map<string, number>()
  articles.forEach(a => finalConnectionCounts.set(a.id, 0))
  
  selectedConnections.forEach(conn => {
    finalConnectionCounts.set(conn.source_id, (finalConnectionCounts.get(conn.source_id) || 0) + 1)
    finalConnectionCounts.set(conn.target_id, (finalConnectionCounts.get(conn.target_id) || 0) + 1)
  })
  
  const finalDensity = selectedConnections.length / maxConnections
  const finalAvgConnections = Array.from(finalConnectionCounts.values()).reduce((sum, c) => sum + c, 0) / articles.length
  const finalCountsSorted = Array.from(finalConnectionCounts.values()).sort((a,b) => b-a)
  
  // Compter interdisciplinaires
  let interdisciplinaryCount = 0
  selectedConnections.forEach(conn => {
    const sourceArticle = articles.find(a => a.id === conn.source_id)
    const targetArticle = articles.find(a => a.id === conn.target_id)
    
    if (sourceArticle && targetArticle && 
        sourceArticle.primary_domain !== targetArticle.primary_domain) {
      interdisciplinaryCount++
    }
  })
  
  console.log(`\\n📊 MÉTRIQUES LISIBILITÉ FINALE:`)
  console.log(`   Connexions: ${allConnections.length} → ${selectedConnections.length} (-${((allConnections.length - selectedConnections.length) / allConnections.length * 100).toFixed(1)}%)`)
  console.log(`   Densité: ${(finalDensity * 100).toFixed(1)}% (objectif <15% ${finalDensity < 0.15 ? '✅' : '❌'})`)
  console.log(`   Connexions/article: ${finalAvgConnections.toFixed(1)} (objectif <10 ${finalAvgConnections < 10 ? '✅' : '❌'})`)
  console.log(`   Centralité préservée: max ${finalCountsSorted[0]} vs médian ${finalCountsSorted[Math.floor(finalCountsSorted.length/2)]}`)
  console.log(`   Ratio interdisciplinaire: ${(interdisciplinaryCount/selectedConnections.length*100).toFixed(1)}%`)
  
  // PHASE 5: Sauvegarde optimisée
  const updatedConnectionsData = {
    ...connectionsData,
    connections: selectedConnections,
    readability_optimization: {
      original_count: allConnections.length,
      optimized_count: selectedConnections.length,
      reduction_percentage: ((allConnections.length - selectedConnections.length) / allConnections.length * 100).toFixed(1),
      density: (finalDensity * 100).toFixed(1),
      avg_connections_per_article: finalAvgConnections.toFixed(1),
      max_connections_preserved: finalCountsSorted[0],
      readability_goals_met: finalDensity < 0.15 && finalAvgConnections < 10,
      strategy: "dynamic_centrality_preservation",
      timestamp: new Date().toISOString()
    }
  }
  
  // Sauvegarde atomique
  writeFileSync('public/data/connections.json', JSON.stringify(updatedConnectionsData, null, 2))
  
  console.log(`\\n💾 OPTIMISATION LISIBILITÉ TERMINÉE`)
  console.log(`   ✅ Connexions sauvées: public/data/connections.json`)
  console.log(`   🎯 Objectifs atteints: ${finalDensity < 0.15 && finalAvgConnections < 10 ? 'TOUS' : 'PARTIELS'}`)
  console.log(`   🌐 Centralité préservée: Articles centraux restent identifiables`)
  console.log(`   ✅ Prêt pour étape 7: npm run validate-triple`)
  
} catch (error) {
  console.error('❌ Erreur optimize-readability:', error)
  process.exit(1)
}