#!/usr/bin/env tsx
/**
 * SCRIPT DE GÉNÉRATION HYBRIDE DES CONNEXIONS
 * 
 * PRIORITÉ 1 : Utilise les connexions manuelles LLM existantes (connected_articles)
 * PRIORITÉ 2 : Complète avec auto-détection pour ponts manquants
 * PRIORITÉ 3 : Ajoute des types de connexions intelligents
 */

import fs from 'fs/promises'
import path from 'path'
import { Article, Connection } from '../src/data/schema.js'
import { detectConnections } from '../src/utils/graphAlgorithms.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

async function loadArticles(): Promise<Article[]> {
  try {
    const data = await fs.readFile(ARTICLES_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    return parsed.articles || []
  } catch (error) {
    console.error('❌ Erreur lors du chargement des articles:', error)
    return []
  }
}

/**
 * Génère les connexions à partir des connected_articles (LLM) avec types intelligents
 */
function generateManualConnections(articles: Article[]): Connection[] {
  const connections: Connection[] = []
  const articlesMap = new Map(articles.map(a => [a.id, a]))
  
  articles.forEach(article => {
    const connectedIds = article.connected_articles || []
    
    connectedIds.forEach(targetId => {
      const target = articlesMap.get(targetId)
      if (!target) return
      
      // Éviter les doublons (A->B et B->A)
      const existingConnection = connections.find(conn => 
        (conn.source_id === article.id && conn.target_id === targetId) ||
        (conn.source_id === targetId && conn.target_id === article.id)
      )
      
      if (existingConnection) return
      
      // Déterminer le type de connexion intelligemment
      const connectionType = determineConnectionType(article, target)
      const strength = calculateConnectionStrength(article, target)
      
      connections.push({
        source_id: article.id,
        target_id: targetId,
        type: connectionType.type,
        strength: strength,
        auto_detected: false, // Connexion manuelle LLM
        reasoning: connectionType.reasoning
      })
    })
  })
  
  return connections
}

/**
 * Détermine intelligemment le type de connexion entre deux articles
 */
function determineConnectionType(articleA: Article, articleB: Article): {
  type: Connection['type']
  reasoning: string
} {
  const textA = `${articleA.summary} ${articleA.perspective}`.toLowerCase()
  const textB = `${articleB.summary} ${articleB.perspective}`.toLowerCase()
  
  // 1. DÉTECTION CONTRADICTIONS (controverses opposées)
  if (hasOpposingPerspectives(articleA, articleB)) {
    return {
      type: 'contradicts',
      reasoning: `Opposition détectée entre ${articleA.primary_domain} et ${articleB.primary_domain}`
    }
  }
  
  // 2. DÉTECTION QUESTIONNEMENTS
  if (hasQuestioningLanguage(textA, textB)) {
    return {
      type: 'questions',
      reasoning: 'Questionnement critique détecté dans le contenu'
    }
  }
  
  // 3. DÉTECTION IMPLÉMENTATIONS
  if (hasImplementationLanguage(textA, textB) || hasSharedTools(articleA, articleB)) {
    return {
      type: 'implements',
      reasoning: 'Implémentation ou application pratique détectée'
    }
  }
  
  // 4. DÉTECTION BUILDS_ON (ponts interdisciplinaires)
  if (articleA.primary_domain !== articleB.primary_domain) {
    return {
      type: 'builds_on',
      reasoning: `Pont interdisciplinaire: ${articleA.primary_domain} ↔ ${articleB.primary_domain}`
    }
  }
  
  // 5. SIMILARITÉ par défaut
  return {
    type: 'similar_to',
    reasoning: `Articles du même domaine: ${articleA.primary_domain}`
  }
}

function hasOpposingPerspectives(articleA: Article, articleB: Article): boolean {
  const perspectiveA = articleA.perspective.toLowerCase()
  const perspectiveB = articleB.perspective.toLowerCase()
  
  const positiveWords = ['opportunité', 'prometteur', 'bénéfique', 'avancée', 'potentiel', 'révélant']
  const negativeWords = ['risque', 'danger', 'problème', 'inquiétude', 'limite', 'défi', 'urgent']
  
  const aIsPositive = positiveWords.some(word => perspectiveA.includes(word))
  const aNegative = negativeWords.some(word => perspectiveA.includes(word))
  const bIsPositive = positiveWords.some(word => perspectiveB.includes(word))
  const bNegative = negativeWords.some(word => perspectiveB.includes(word))
  
  return (aIsPositive && bNegative) || (aNegative && bIsPositive)
}

function hasQuestioningLanguage(textA: string, textB: string): boolean {
  const questioningWords = ['questionne', 'remet en cause', 'critique', 'soulève', 'interroge', 'défie', 'conteste']
  return questioningWords.some(word => textA.includes(word) || textB.includes(word))
}

function hasImplementationLanguage(textA: string, textB: string): boolean {
  const implementWords = ['implémente', 'utilise', 'applique', 'se base sur', 'emploie', 'met en pratique', 'déploie']
  return implementWords.some(word => textA.includes(word) || textB.includes(word))
}

function hasSharedTools(articleA: Article, articleB: Article): boolean {
  return articleA.tools_mentioned.some(toolA => 
    articleB.tools_mentioned.some(toolB => toolA.id === toolB.id)
  )
}

function calculateConnectionStrength(articleA: Article, articleB: Article): number {
  let strength = 0.6 // Base pour connexions manuelles LLM
  
  // Bonus pour articles à fort intérêt
  const avgInterest = (articleA.interest_level + articleB.interest_level) / 2
  if (avgInterest >= 4) strength += 0.1
  
  // Bonus pour ponts interdisciplinaires (cœur du projet)
  if (articleA.primary_domain !== articleB.primary_domain) {
    strength += 0.15
  }
  
  // Bonus pour concepts/outils partagés
  const sharedConcepts = articleA.concepts.filter(cA => 
    articleB.concepts.some(cB => cA.id === cB.id)
  ).length
  
  const sharedTools = articleA.tools_mentioned.filter(tA => 
    articleB.tools_mentioned.some(tB => tA.id === tB.id)
  ).length
  
  strength += (sharedConcepts * 0.05) + (sharedTools * 0.05)
  
  return Math.min(strength, 0.95)
}

async function saveConnections(connections: Connection[]): Promise<void> {
  try {
    const typeStats = connections.reduce((acc, conn) => {
      acc[conn.type] = (acc[conn.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const data = {
      connections,
      generated_at: new Date().toISOString(),
      total_connections: connections.length,
      generation_method: "hybrid_llm_plus_autodetect",
      type_distribution: typeStats
    }
    
    await fs.writeFile(
      CONNECTIONS_PATH, 
      JSON.stringify(data, null, 2), 
      'utf-8'
    )
    
    console.log(`✅ ${connections.length} connexions sauvées dans ${CONNECTIONS_PATH}`)
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error)
  }
}

// SCRIPT PRINCIPAL
async function main() {
  console.log('🚀 GÉNÉRATION HYBRIDE DES CONNEXIONS')
  console.log('=========================================')
  
  const articles = await loadArticles()
  console.log(`🔍 Analyse de ${articles.length} articles...`)
  
  if (articles.length === 0) {
    console.log('⚠️  Aucun article trouvé.')
    return
  }
  
  // ÉTAPE 1 : Génération à partir des connexions manuelles LLM
  console.log('\n📖 ÉTAPE 1 : Utilisation des connexions manuelles LLM...')
  const manualConnections = generateManualConnections(articles)
  console.log(`   ${manualConnections.length} connexions manuelles traitées`)
  
  // ÉTAPE 2 : Complétion avec auto-détection (optionnel, limité)
  console.log('\n🤖 ÉTAPE 2 : Complétion avec auto-détection...')
  const existingPairs = new Set(
    manualConnections.map(conn => `${conn.source_id}-${conn.target_id}`)
  )
  
  const autoConnections: Connection[] = []
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const pairKey = `${articles[i].id}-${articles[j].id}`
      const reversePairKey = `${articles[j].id}-${articles[i].id}`
      
      // Éviter les doublons avec connexions manuelles
      if (existingPairs.has(pairKey) || existingPairs.has(reversePairKey)) {
        continue
      }
      
      const connection = detectConnections(articles[i], articles[j])
      if (connection && connection.strength >= 0.7) { // Seuil élevé pour auto-détection
        autoConnections.push(connection)
        
        // Limiter l'auto-détection pour ne pas surcharger
        if (autoConnections.length >= 20) break
      }
    }
    if (autoConnections.length >= 20) break
  }
  
  console.log(`   ${autoConnections.length} connexions auto-détectées ajoutées`)
  
  // COMBINAISON FINALE
  const allConnections = [...manualConnections, ...autoConnections]
  
  await saveConnections(allConnections)
  
  // STATISTIQUES FINALES
  const typeStats = allConnections.reduce((acc, conn) => {
    acc[conn.type] = (acc[conn.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\\n📊 STATISTIQUES DE GÉNÉRATION:')
  console.log(`   Total articles: ${articles.length}`)
  console.log(`   Total connexions: ${allConnections.length}`)
  console.log(`   Connexions par article (moyenne): ${(allConnections.length / articles.length * 2).toFixed(1)}`)
  
  console.log('\\n📈 RÉPARTITION PAR TYPE:')
  Object.entries(typeStats).forEach(([type, count]) => {
    const percentage = ((count / allConnections.length) * 100).toFixed(1)
    console.log(`   ${type}: ${count} (${percentage}%)`)
  })
  
  console.log('\\n✨ Génération terminée!')
}

main().catch(console.error)