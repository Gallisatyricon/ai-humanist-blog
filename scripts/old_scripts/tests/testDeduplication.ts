#!/usr/bin/env tsx
/**
 * TEST DU SYSTÈME DE DÉDUPLICATION
 * 
 * Simule différents scénarios de doublons pour tester
 * la robustesse du Smart Deduplication System
 */

import fs from 'fs/promises'
import path from 'path'
import { detectDuplication, mergeArticleMetadata, processArticleWithDeduplication } from './smartDeduplication.js'
import { Article, SuggestedConnection } from '../src/data/schema.js'

// ==================== DONNÉES DE TEST ====================

// Simuler un article existant dans la base
const existingArticle: Article = {
  id: "art_042",
  title: "AI Ethics in Healthcare: A Systematic Review",
  url: "https://arxiv.org/abs/2024.12345",
  source_type: "academic",
  date: "2024-06-15",
  summary: "This paper examines ethical considerations in AI healthcare applications, focusing on privacy, bias, and transparency.",
  perspective: "Clinical perspective on AI ethics implementation.",
  interest_level: 4,
  primary_domain: "ethique",
  secondary_domains: ["healthcare", "privacy"],
  concepts: [
    { id: "healthcare_ai", name: "Healthcare AI", type: "technical", controversy_level: 1 },
    { id: "medical_ethics", name: "Medical Ethics", type: "philosophical", controversy_level: 2 }
  ],
  tools_mentioned: [
    { id: "tensorflow_medical", name: "TensorFlow Medical", type: "library", maturity: "stable" }
  ],
  author: "Dr. Sarah Johnson",
  reading_time: 15,
  complexity_level: "intermediate",
  connected_articles: ["art_030", "art_035"],
  centrality_score: 0.75
}

// ==================== SCÉNARIOS DE TEST ====================

const testScenarios = [
  {
    name: "URL Identique",
    description: "Même URL exacte - devrait détecter duplication parfaite",
    newArticle: {
      ...existingArticle,
      id: "art_001",
      title: "AI Ethics in Healthcare: Updated Review", // Titre légèrement différent
      summary: "Updated systematic review with more recent findings on ethical AI in healthcare"
    }
  },
  {
    name: "Titre Identique", 
    description: "Même titre exact mais URL différente",
    newArticle: {
      ...existingArticle,
      id: "art_002",
      url: "https://nature.com/articles/ai-ethics-healthcare-2024"
    }
  },
  {
    name: "Même Auteur + Date Proche",
    description: "Même auteur, date proche, titre similaire",
    newArticle: {
      ...existingArticle,
      id: "art_003",
      title: "Ethical AI in Healthcare: Latest Findings",
      url: "https://jmir.org/2024/ai-healthcare-ethics",
      date: "2024-06-18", // 3 jours après l'original
      summary: "Latest research on ethical implications of AI in medical practice"
    }
  },
  {
    name: "Similarité Sémantique",
    description: "Même domaine, titre et résumé très similaires",
    newArticle: {
      ...existingArticle,
      id: "art_004",
      title: "Healthcare AI Ethics: A Comprehensive Review",
      url: "https://pubmed.ncbi.nlm.nih.gov/ai-ethics-2024",
      author: "Prof. Michael Chen",
      date: "2024-05-20",
      summary: "Comprehensive examination of ethical issues in healthcare AI, including privacy concerns and bias mitigation."
    }
  },
  {
    name: "Article Complètement Nouveau",
    description: "Article totalement différent - pas de duplication",
    newArticle: {
      id: "art_005",
      title: "Quantum Computing Applications in Cryptography",
      url: "https://arxiv.org/abs/2024.54321",
      source_type: "academic" as const,
      date: "2024-07-01",
      summary: "Novel applications of quantum computing for next-generation cryptographic protocols.",
      perspective: "Technical analysis of quantum cryptography advances.",
      interest_level: 5 as const,
      primary_domain: "technique" as const,
      secondary_domains: ["cryptography", "quantum"],
      concepts: [
        { id: "quantum_crypto", name: "Quantum Cryptography", type: "technical", controversy_level: 0 }
      ],
      tools_mentioned: [
        { id: "qiskit", name: "Qiskit", type: "framework", maturity: "stable" }
      ],
      author: "Dr. Alice Quantum",
      reading_time: 20,
      complexity_level: "advanced" as const,
      connected_articles: [],
      centrality_score: 0
    }
  },
  {
    name: "Métadonnées Enrichies",
    description: "Même article avec métadonnées plus complètes",
    newArticle: {
      ...existingArticle,
      id: "art_006",
      title: "AI Ethics in Healthcare: A Systematic Review and Meta-Analysis", // Titre plus long
      summary: existingArticle.summary + " The study includes a comprehensive meta-analysis of 150 papers published between 2020-2024.", // Résumé enrichi
      concepts: [
        ...existingArticle.concepts,
        { id: "meta_analysis", name: "Meta-Analysis", type: "methodological", controversy_level: 0 },
        { id: "systematic_review", name: "Systematic Review", type: "methodological", controversy_level: 0 }
      ],
      tools_mentioned: [
        ...existingArticle.tools_mentioned,
        { id: "cochrane", name: "Cochrane Review Manager", type: "platform", maturity: "stable" }
      ],
      secondary_domains: [...existingArticle.secondary_domains, "research", "methodology"],
      reading_time: 25, // Temps augmenté
      interest_level: 5 as const // Niveau d'intérêt augmenté
    }
  }
]

// ==================== FONCTIONS DE TEST ====================

function runDeduplicationTest(scenario: any, existingArticles: Article[]) {
  console.log(`\n🧪 TEST: ${scenario.name}`)
  console.log(`📝 ${scenario.description}`)
  console.log('-'.repeat(50))
  
  const result = detectDuplication(scenario.newArticle, existingArticles)
  
  console.log(`🔍 Duplication détectée: ${result.isDuplicate ? '✅ OUI' : '❌ NON'}`)
  
  if (result.isDuplicate) {
    console.log(`📊 Confiance: ${result.confidence.toFixed(2)}`)
    console.log(`🔧 Méthode: ${result.method}`)
    console.log(`💡 Raison: ${result.reasoning}`)
    
    if (result.existingArticle) {
      console.log(`🎯 Article trouvé: ${result.existingArticle.id}`)
      
      // Test de fusion des métadonnées
      console.log(`\n🔀 Test de fusion des métadonnées...`)
      const { mergedArticle, changes } = mergeArticleMetadata(
        result.existingArticle,
        scenario.newArticle
      )
      
      if (changes.length > 0) {
        console.log(`📝 Changements détectés (${changes.length}):`)
        changes.forEach(change => console.log(`   - ${change}`))
        
        console.log(`\n📊 Comparaison:`)
        console.log(`   Titre: ${result.existingArticle.title.length} → ${mergedArticle.title.length} chars`)
        console.log(`   Résumé: ${result.existingArticle.summary.length} → ${mergedArticle.summary.length} chars`)
        console.log(`   Concepts: ${result.existingArticle.concepts.length} → ${mergedArticle.concepts.length}`)
        console.log(`   Outils: ${result.existingArticle.tools_mentioned.length} → ${mergedArticle.tools_mentioned.length}`)
      } else {
        console.log(`⭕ Aucune amélioration détectée`)
      }
    }
  } else {
    console.log(`✨ Article reconnu comme nouveau`)
  }
  
  return result
}

async function runProcessTest(scenario: any, existingArticles: Article[]) {
  console.log(`\n🔄 TEST PROCESSUS COMPLET: ${scenario.name}`)
  console.log('='.repeat(60))
  
  // Simuler quelques connexions suggérées
  const suggestedConnections: SuggestedConnection[] = [
    {
      target_id: "art_030",
      type: "similar_to",
      strength: 0.75,
      reasoning: "Both discuss healthcare AI ethics",
      confidence: 0.85
    },
    {
      target_id: "art_035", 
      type: "builds_on",
      strength: 0.68,
      reasoning: "Builds on previous privacy research",
      confidence: 0.78
    }
  ]
  
  // Simuler des connexions existantes
  const existingConnections = [
    { source_id: "art_042", target_id: "art_030", type: "similar_to" },
    { source_id: "art_042", target_id: "art_035", type: "builds_on" }
  ]
  
  const processResult = await processArticleWithDeduplication(
    scenario.newArticle,
    suggestedConnections,
    existingArticles,
    existingConnections
  )
  
  console.log(`📋 Action recommandée: ${processResult.action}`)
  console.log(`💡 Raisonnement: ${processResult.reasoning}`)
  console.log(`🆔 ID article: ${processResult.articleId}`)
  console.log(`🔗 Connexions à ajouter: ${processResult.connectionsToAdd.length}`)
  
  if (processResult.changes.length > 0) {
    console.log(`📝 Changements (${processResult.changes.length}):`)
    processResult.changes.forEach(change => console.log(`   - ${change}`))
  }
  
  return processResult
}

// ==================== TEST PRINCIPAL ====================

async function main() {
  console.log('🧪 TEST DU SYSTÈME DE DÉDUPLICATION')
  console.log('='.repeat(60))
  
  const existingArticles = [existingArticle]
  const results: any[] = []
  
  // Test 1: Tests de détection de duplication
  console.log('\n📋 PHASE 1: TESTS DE DÉTECTION')
  console.log('='.repeat(40))
  
  for (const scenario of testScenarios) {
    const result = runDeduplicationTest(scenario, existingArticles)
    results.push({ scenario: scenario.name, detection: result })
  }
  
  // Test 2: Tests de processus complet
  console.log('\n\n📋 PHASE 2: TESTS DE PROCESSUS COMPLET')
  console.log('='.repeat(40))
  
  for (const scenario of testScenarios.slice(0, 3)) { // Tester les 3 premiers
    const result = await runProcessTest(scenario, existingArticles)
    const existing = results.find(r => r.scenario === scenario.name)
    if (existing) {
      existing.process = result
    }
  }
  
  // Rapport final
  console.log('\n\n📊 RAPPORT FINAL')
  console.log('='.repeat(60))
  
  const detectionStats = {
    duplicates: results.filter(r => r.detection.isDuplicate).length,
    new_articles: results.filter(r => !r.detection.isDuplicate).length,
    high_confidence: results.filter(r => r.detection.confidence > 0.8).length,
    methods: {} as Record<string, number>
  }
  
  results.forEach(result => {
    const method = result.detection.method
    detectionStats.methods[method] = (detectionStats.methods[method] || 0) + 1
  })
  
  console.log(`✅ Doublons détectés: ${detectionStats.duplicates}/${results.length}`)
  console.log(`🆕 Nouveaux articles: ${detectionStats.new_articles}/${results.length}`)
  console.log(`🎯 Haute confiance (>0.8): ${detectionStats.high_confidence}/${results.length}`)
  console.log(`\n🔧 Répartition des méthodes:`)
  Object.entries(detectionStats.methods).forEach(([method, count]) => {
    console.log(`   ${method}: ${count}`)
  })
  
  // Sauvegarder les résultats
  const testResults = {
    test_date: new Date().toISOString(),
    scenarios_tested: results.length,
    detection_stats: detectionStats,
    detailed_results: results
  }
  
  const outputPath = path.join(process.cwd(), 'exports/deduplication-test-results.json')
  await fs.writeFile(outputPath, JSON.stringify(testResults, null, 2))
  console.log(`\n💾 Résultats détaillés sauvés: ${outputPath}`)
  
  console.log('\n🎉 Tests terminés!')
}

main().catch(console.error)