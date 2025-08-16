#!/usr/bin/env tsx
/**
 * AMÉLIORATION DES CONNEXIONS EXISTANTES AVEC EMBEDDINGS
 * 
 * Améliore les connexions existantes en ajoutant:
 * - Scores de similarité sémantique
 * - Re-ranking basé sur embeddings
 * - Métadonnées de qualité de connexion
 * 
 * Compatible avec le système existant
 */

import { readJSONWithLock, writeJSONAtomic } from './writeFileAtomic.js'
import { validateConnectionData } from './zodSchemas.js'

const CONNECTIONS_PATH = 'public/data/connections.json'
const EMBEDDINGS_PATH = 'public/data/embeddings.json'

interface EnhancedConnection {
  source_id: string
  target_id: string
  type: string
  strength: number
  auto_detected: boolean
  reasoning?: string
  
  // Nouvelles métadonnées P1
  semantic_similarity?: number
  embedding_confidence?: number
  quality_score?: number
  enhanced_at?: string
}

function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }
  
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)
  
  if (normA === 0 || normB === 0) return 0
  
  return dotProduct / (normA * normB)
}

export async function enhanceConnectionsWithEmbeddings(): Promise<{
  success: boolean
  enhanced_count: number
  total_connections: number
  average_similarity: number
}> {
  
  try {
    console.log('🔗 Amélioration connexions existantes avec embeddings...')
    
    // Charger données
    const [connectionData, embeddingData] = await Promise.all([
      readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 }),
      readJSONWithLock(EMBEDDINGS_PATH, { timeout: 5000 })
    ])
    
    const validConnections = validateConnectionData(connectionData)
    const embeddings = new Map<string, number[]>()
    
    // Indexer embeddings
    if (embeddingData.embeddings) {
      for (const emb of embeddingData.embeddings) {
        embeddings.set(emb.article_id, emb.embedding)
      }
    }
    
    console.log(`📊 ${validConnections.connections.length} connexions, ${embeddings.size} embeddings`)
    
    // Améliorer connexions
    const enhancedConnections: EnhancedConnection[] = []
    let totalSimilarity = 0
    let validSimilarities = 0
    
    for (const conn of validConnections.connections) {
      const enhanced: EnhancedConnection = { ...conn }
      
      const sourceEmb = embeddings.get(conn.source_id)
      const targetEmb = embeddings.get(conn.target_id)
      
      if (sourceEmb && targetEmb) {
        const similarity = cosineSimilarity(sourceEmb, targetEmb)
        
        enhanced.semantic_similarity = similarity
        enhanced.embedding_confidence = 0.9 // Confiance élevée si embeddings disponibles
        
        // Score de qualité hybride
        const originalStrength = conn.strength || 0.5
        enhanced.quality_score = (originalStrength * 0.6) + (similarity * 0.4)
        
        enhanced.enhanced_at = new Date().toISOString()
        
        totalSimilarity += similarity
        validSimilarities++
      } else {
        // Pas d'embeddings disponibles
        enhanced.embedding_confidence = 0.3
        enhanced.quality_score = conn.strength || 0.5
      }
      
      enhancedConnections.push(enhanced)
    }
    
    // Sauvegarder
    const enhancedData = {
      ...validConnections,
      connections: enhancedConnections,
      enhancement_metadata: {
        enhanced_at: new Date().toISOString(),
        embeddings_available: embeddings.size,
        connections_enhanced: validSimilarities,
        average_semantic_similarity: validSimilarities > 0 ? totalSimilarity / validSimilarities : 0
      }
    }
    
    await writeJSONAtomic(CONNECTIONS_PATH, enhancedData)
    
    const avgSimilarity = validSimilarities > 0 ? totalSimilarity / validSimilarities : 0
    
    console.log('✅ Connexions améliorées:')
    console.log(`   Enhanced: ${validSimilarities}/${enhancedConnections.length}`)
    console.log(`   Similarité moyenne: ${(avgSimilarity * 100).toFixed(1)}%`)
    
    return {
      success: true,
      enhanced_count: validSimilarities,
      total_connections: enhancedConnections.length,
      average_similarity: avgSimilarity
    }
    
  } catch (error) {
    console.error('❌ Erreur amélioration connexions:', error)
    return {
      success: false,
      enhanced_count: 0,
      total_connections: 0,
      average_similarity: 0
    }
  }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  enhanceConnectionsWithEmbeddings()
    .then(result => {
      if (result.success) {
        console.log('🎉 Amélioration terminée!')
        process.exit(0)
      } else {
        process.exit(1)
      }
    })
}