#!/usr/bin/env tsx
/**
 * PIPELINE INTELLIGENT DE CONNEXIONS - P1 Complet
 * 
 * Orchestre le processus complet:
 * 1. Génération embeddings (si nécessaire)
 * 2. Re-scoring intelligent des connexions
 * 3. Mise à jour du graphique pré-calculé
 * 
 * Usage: npm run intelligent-pipeline
 */

import { generateEmbeddings } from './generateEmbeddings.js'
import { rescoreIntelligentConnections } from './intelligentConnectionRescorer.js'
import { precomputeGraphLayout } from './precompute-graph-layout.js'

interface PipelineOptions {
  skipEmbeddings?: boolean
  skipRescoring?: boolean
  skipLayout?: boolean
  articlesToProcess?: string[]
  forceRecompute?: boolean
}

interface PipelineResult {
  success: boolean
  message: string
  steps_completed: string[]
  total_time_ms: number
  embeddings_generated: number
  connections_generated: number
  layout_computed: boolean
}

export async function runIntelligentConnectionPipeline(
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  
  const startTime = Date.now()
  const stepsCompleted: string[] = []
  let embeddingsGenerated = 0
  let connectionsGenerated = 0
  let layoutComputed = false
  
  try {
    console.log('\n🚀 PIPELINE INTELLIGENT DE CONNEXIONS')
    console.log('='.repeat(50))
    
    // ÉTAPE 1: Génération embeddings
    if (!options.skipEmbeddings) {
      console.log('\n📊 ÉTAPE 1/3: Génération embeddings...')
      
      const embeddingResult = await generateEmbeddings({
        forceRecompute: options.forceRecompute,
        articlesToProcess: options.articlesToProcess
      })
      
      if (embeddingResult.success) {
        embeddingsGenerated = embeddingResult.embeddings_computed
        stepsCompleted.push(`Embeddings: ${embeddingResult.embeddings_computed} générés, ${embeddingResult.embeddings_total} total`)
        console.log('✅ Embeddings générés avec succès')
      } else {
        throw new Error(`Échec génération embeddings: ${embeddingResult.message}`)
      }
    } else {
      console.log('\n⏭️ ÉTAPE 1/3: Génération embeddings ignorée')
      stepsCompleted.push('Embeddings: ignorés')
    }
    
    // ÉTAPE 2: Re-scoring intelligent
    if (!options.skipRescoring) {
      console.log('\n🧠 ÉTAPE 2/3: Re-scoring intelligent des connexions...')
      
      const rescoreResult = await rescoreIntelligentConnections({
        articlesToProcess: options.articlesToProcess
      })
      
      if (rescoreResult.success) {
        connectionsGenerated = rescoreResult.total_connections_generated
        stepsCompleted.push(`Re-scoring: ${rescoreResult.total_connections_generated} connexions, ${rescoreResult.average_connections_per_article.toFixed(1)} moy/article`)
        console.log('✅ Re-scoring terminé avec succès')
      } else {
        throw new Error(`Échec re-scoring: ${rescoreResult.message}`)
      }
    } else {
      console.log('\n⏭️ ÉTAPE 2/3: Re-scoring ignoré')
      stepsCompleted.push('Re-scoring: ignoré')
    }
    
    // ÉTAPE 3: Pré-calcul layout graphique
    if (!options.skipLayout) {
      console.log('\n📐 ÉTAPE 3/3: Mise à jour layout graphique...')
      
      const layoutResult = await precomputeGraphLayout({
        iterations: 800, // Réduire pour pipeline plus rapide
        alphaDecay: 0.03
      })
      
      if (layoutResult.success) {
        layoutComputed = true
        stepsCompleted.push(`Layout: ${layoutResult.nodes} nœuds positionnés`)
        console.log('✅ Layout pré-calculé mis à jour')
      } else {
        // Layout pas critique, continuer
        console.warn(`⚠️ Échec layout (non-critique): ${layoutResult.message}`)
        stepsCompleted.push('Layout: échoué (non-critique)')
      }
    } else {
      console.log('\n⏭️ ÉTAPE 3/3: Layout ignoré')
      stepsCompleted.push('Layout: ignoré')
    }
    
    const totalTime = Date.now() - startTime
    
    console.log('\n✅ PIPELINE TERMINÉ AVEC SUCCÈS')
    console.log('='.repeat(50))
    console.log(`⏱️ Temps total: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`)
    console.log('📊 Résumé:')
    stepsCompleted.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`)
    })
    console.log('\n🎉 Le système de connexions intelligentes est opérationnel!')
    
    return {
      success: true,
      message: 'Pipeline intelligent terminé avec succès',
      steps_completed: stepsCompleted,
      total_time_ms: totalTime,
      embeddings_generated: embeddingsGenerated,
      connections_generated: connectionsGenerated,
      layout_computed: layoutComputed
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    const message = `Pipeline échoué après ${totalTime}ms: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    
    console.error('\n❌ PIPELINE ÉCHOUÉ')
    console.error('='.repeat(50))
    console.error(message)
    
    if (stepsCompleted.length > 0) {
      console.log('\n📊 Étapes complétées avant échec:')
      stepsCompleted.forEach((step, i) => {
        console.log(`   ✅ ${i + 1}. ${step}`)
      })
    }
    
    return {
      success: false,
      message,
      steps_completed: stepsCompleted,
      total_time_ms: totalTime,
      embeddings_generated: embeddingsGenerated,
      connections_generated: connectionsGenerated,
      layout_computed: layoutComputed
    }
  }
}

// ==================== CLI ====================

async function main() {
  const args = process.argv.slice(2)
  
  const options: PipelineOptions = {
    skipEmbeddings: args.includes('--skip-embeddings'),
    skipRescoring: args.includes('--skip-rescoring'),
    skipLayout: args.includes('--skip-layout'),
    forceRecompute: args.includes('--force')
  }
  
  // Paramètre --articles pour traitement sélectif
  const articlesFlag = args.findIndex(arg => arg === '--articles')
  if (articlesFlag !== -1 && args[articlesFlag + 1]) {
    options.articlesToProcess = args[articlesFlag + 1].split(',')
    console.log(`🎯 Articles sélectionnés: ${options.articlesToProcess.join(', ')}`)
  }
  
  // Afficher aide si demandé
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 PIPELINE INTELLIGENT DE CONNEXIONS

Usage: npm run intelligent-pipeline [options]

Options:
  --skip-embeddings     Ignorer génération embeddings
  --skip-rescoring      Ignorer re-scoring connexions
  --skip-layout         Ignorer pré-calcul layout
  --force              Force recalcul embeddings existants
  --articles ids       Traiter seulement articles spécifiés (ex: art_001,art_002)
  --help, -h           Afficher cette aide

Exemples:
  npm run intelligent-pipeline
  npm run intelligent-pipeline -- --articles art_001,art_002,art_003
  npm run intelligent-pipeline -- --skip-layout --force
  npm run intelligent-pipeline -- --skip-embeddings --skip-layout
`)
    process.exit(0)
  }
  
  console.log('📋 Configuration pipeline:')
  console.log(`   Skip embeddings: ${options.skipEmbeddings || false}`)
  console.log(`   Skip rescoring: ${options.skipRescoring || false}`)
  console.log(`   Skip layout: ${options.skipLayout || false}`)
  console.log(`   Force recompute: ${options.forceRecompute || false}`)
  console.log(`   Articles sélectionnés: ${options.articlesToProcess?.length || 'tous'}`)
  
  const result = await runIntelligentConnectionPipeline(options)
  
  if (result.success) {
    console.log('\n🎊 PIPELINE RÉUSSI - Système intelligent opérationnel!')
    process.exit(0)
  } else {
    console.log('\n💥 PIPELINE ÉCHOUÉ - Vérifiez les logs ci-dessus')
    process.exit(1)
  }
}

// ES Module check
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}