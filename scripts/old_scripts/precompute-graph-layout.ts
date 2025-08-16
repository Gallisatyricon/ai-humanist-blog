#!/usr/bin/env tsx
/**
 * PRÉ-CALCUL DU LAYOUT GRAPHIQUE - P0.4
 * 
 * Calcule les positions x,y via simulation D3 en mode headless
 * Stocke coordonnées dans connections.json 
 * UI charge positions pré-calculées (pas de simulation client)
 * 
 * Impact: CPU << côté client, graphique instantané
 */

import fs from 'fs/promises'
import path from 'path'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import { readJSONWithLock, writeJSONAtomic } from './writeFileAtomic.js'
import { validateArticleData, validateConnectionData } from './zodSchemas.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

// ==================== TYPES ====================

interface GraphNode {
  id: string
  title: string
  centrality_score: number
  primary_domain: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  strength: number
  type: string
}

interface LayoutConfig {
  width: number
  height: number
  iterations: number
  linkStrength: number
  chargeStrength: number
  centerStrength: number
  collideRadius: number
  alphaDecay: number
}

interface PrecomputedLayout {
  nodes: Array<{
    id: string
    x: number
    y: number
    centrality_score: number
  }>
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    width: number
    height: number
  }
  computed_at: string
  iterations: number
  config: LayoutConfig
}

// ==================== CONFIGURATION ====================

const DEFAULT_CONFIG: LayoutConfig = {
  width: 800,
  height: 600,
  iterations: 1000,
  linkStrength: 0.1,
  chargeStrength: -30,
  centerStrength: 0.1,
  collideRadius: 15,
  alphaDecay: 0.02
}

// ==================== CHARGEMENT DONNÉES ====================

async function loadGraphData(): Promise<{ nodes: GraphNode[], links: GraphLink[] }> {
  console.log('📊 Chargement données...')
  
  const [articleData, connectionData] = await Promise.all([
    readJSONWithLock(ARTICLES_PATH, { timeout: 5000 }),
    readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 })
  ])
  
  // Structure flexible pour compatibilité articles
  let articles: any[] = []
  if (articleData.articles && Array.isArray(articleData.articles)) {
    articles = articleData.articles
  } else if (Array.isArray(articleData)) {
    articles = articleData
  } else {
    throw new Error('Format articles.json invalide')
  }
  
  // Structure flexible pour compatibilité connexions
  let connections: any[] = []
  if (connectionData.connections && Array.isArray(connectionData.connections)) {
    connections = connectionData.connections
  } else if (Array.isArray(connectionData)) {
    connections = connectionData
  } else {
    throw new Error('Format connections.json invalide')
  }
  
  console.log(`✅ ${articles.length} articles, ${connections.length} connexions`)
  
  // Construire nodes
  const nodes: GraphNode[] = articles.map(article => ({
    id: article.id,
    title: article.title,
    centrality_score: article.centrality_score,
    primary_domain: article.primary_domain
  }))
  
  // Construire links
  const nodeIds = new Set(nodes.map(n => n.id))
  const links: GraphLink[] = connections
    .filter(conn => nodeIds.has(conn.source_id) && nodeIds.has(conn.target_id))
    .map(conn => ({
      source: conn.source_id,
      target: conn.target_id,
      strength: conn.strength,
      type: conn.type
    }))
  
  console.log(`🔗 ${links.length} liens valides`)
  
  return { nodes, links }
}

// ==================== SIMULATION D3 ====================

function runSimulation(
  nodes: GraphNode[], 
  links: GraphLink[], 
  config: LayoutConfig
): Promise<GraphNode[]> {
  
  return new Promise((resolve) => {
    console.log('🧮 Démarrage simulation D3...')
    console.log(`⚙️ ${config.iterations} iterations, ${config.width}x${config.height}`)
    
    let iterationCount = 0
    
    const simulation = forceSimulation(nodes as any)
      .force('link', forceLink(links as any)
        .id((d: any) => d.id)
        .strength(config.linkStrength)
      )
      .force('charge', forceManyBody()
        .strength(config.chargeStrength)
      )
      .force('center', forceCenter(config.width / 2, config.height / 2)
        .strength(config.centerStrength)
      )
      .force('collide', forceCollide()
        .radius(config.collideRadius)
      )
      .alphaDecay(config.alphaDecay)
      .on('tick', () => {
        iterationCount++
        if (iterationCount % 100 === 0) {
          const alpha = simulation.alpha().toFixed(4)
          console.log(`🔄 Iteration ${iterationCount}/~${config.iterations}, alpha: ${alpha}`)
        }
      })
      .on('end', () => {
        console.log(`✅ Simulation terminée après ${iterationCount} iterations`)
        resolve(nodes)
      })
    
    // Arrêt forcé après iterations max
    setTimeout(() => {
      if (simulation.alpha() > 0.001) {
        console.log('⏱️ Arrêt forcé simulation (timeout)')
        simulation.stop()
        resolve(nodes)
      }
    }, config.iterations * 10) // 10ms par iteration max
  })
}

// ==================== POST-TRAITEMENT ====================

function calculateBounds(nodes: GraphNode[]): PrecomputedLayout['bounds'] {
  const xs = nodes.map(n => n.x!).filter(x => typeof x === 'number')
  const ys = nodes.map(n => n.y!).filter(y => typeof y === 'number')
  
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

function normalizePositions(nodes: GraphNode[], targetWidth: number, targetHeight: number): GraphNode[] {
  const bounds = calculateBounds(nodes)
  const padding = 20
  
  const scaleX = (targetWidth - 2 * padding) / bounds.width
  const scaleY = (targetHeight - 2 * padding) / bounds.height
  const scale = Math.min(scaleX, scaleY, 1) // Ne pas agrandir
  
  console.log(`📐 Normalisation: échelle ${scale.toFixed(3)}, bounds ${bounds.width.toFixed(0)}x${bounds.height.toFixed(0)}`)
  
  return nodes.map(node => ({
    ...node,
    x: padding + (node.x! - bounds.minX) * scale,
    y: padding + (node.y! - bounds.minY) * scale
  }))
}

// ==================== SAUVEGARDE ====================

async function savePrecomputedLayout(
  nodes: GraphNode[], 
  config: LayoutConfig,
  iterations: number
): Promise<void> {
  
  console.log('💾 Sauvegarde layout pré-calculé...')
  
  // Charger connections existantes
  const connectionData = await readJSONWithLock(CONNECTIONS_PATH, { timeout: 5000 })
  const validConnections = validateConnectionData(connectionData)
  
  // Créer le layout
  const layout: PrecomputedLayout = {
    nodes: nodes.map(node => ({
      id: node.id,
      x: Math.round(node.x! * 100) / 100, // 2 décimales
      y: Math.round(node.y! * 100) / 100,
      centrality_score: node.centrality_score
    })),
    bounds: calculateBounds(nodes),
    computed_at: new Date().toISOString(),
    iterations,
    config
  }
  
  // Fusionner avec données connexions
  const updatedConnectionData = {
    ...validConnections,
    precomputed_layout: layout,
    last_layout_update: new Date().toISOString()
  }
  
  await writeJSONAtomic(CONNECTIONS_PATH, updatedConnectionData, { lockTimeout: 15000 })
  
  console.log(`✅ Layout sauvé: ${layout.nodes.length} positions, bounds ${Math.round(layout.bounds.width)}x${Math.round(layout.bounds.height)}`)
}

// ==================== FONCTION PRINCIPALE ====================

export async function precomputeGraphLayout(config?: Partial<LayoutConfig>): Promise<{
  success: boolean
  message: string
  nodes: number
  iterations: number
  bounds: PrecomputedLayout['bounds']
}> {
  
  const startTime = Date.now()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  try {
    console.log('\n🚀 PRÉ-CALCUL LAYOUT GRAPHIQUE')
    console.log('='.repeat(50))
    
    // 1. Charger données
    const { nodes, links } = await loadGraphData()
    
    if (nodes.length === 0) {
      return {
        success: false,
        message: 'Aucun nœud à traiter',
        nodes: 0,
        iterations: 0,
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
      }
    }
    
    // 2. Simulation D3
    const simulatedNodes = await runSimulation(nodes, links, finalConfig)
    
    // 3. Normalisation
    const normalizedNodes = normalizePositions(simulatedNodes, finalConfig.width, finalConfig.height)
    const bounds = calculateBounds(normalizedNodes)
    
    // 4. Sauvegarde
    await savePrecomputedLayout(normalizedNodes, finalConfig, finalConfig.iterations)
    
    const duration = Date.now() - startTime
    const message = `Layout calculé en ${duration}ms: ${nodes.length} nœuds, ${links.length} liens`
    
    console.log(`\n✅ SUCCÈS: ${message}`)
    
    return {
      success: true,
      message,
      nodes: nodes.length,
      iterations: finalConfig.iterations,
      bounds
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    const message = `Échec après ${duration}ms: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    
    console.error(`\n❌ ÉCHEC: ${message}`)
    
    return {
      success: false,
      message,
      nodes: 0,
      iterations: 0,
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
    }
  }
}

// ==================== CLI ====================

async function main() {
  const args = process.argv.slice(2)
  
  // Paramètres optionnels
  const config: Partial<LayoutConfig> = {}
  
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]
    
    switch (flag) {
      case '--width':
        config.width = parseInt(value)
        break
      case '--height':
        config.height = parseInt(value)
        break
      case '--iterations':
        config.iterations = parseInt(value)
        break
      case '--charge':
        config.chargeStrength = parseFloat(value)
        break
      default:
        // Ignorer flags inconnus
        break
    }
  }
  
  console.log('📋 Configuration:')
  Object.entries({ ...DEFAULT_CONFIG, ...config }).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`)
  })
  
  const result = await precomputeGraphLayout(config)
  
  if (result.success) {
    console.log('\n🎉 PRÉ-CALCUL RÉUSSI')
    console.log(`📊 ${result.nodes} nœuds positionnés`)
    console.log(`📐 Bounds: ${Math.round(result.bounds.width)}x${Math.round(result.bounds.height)}`)
    console.log(`⚡ Chargement graphique sera instantané`)
    process.exit(0)
  } else {
    console.log('\n💥 PRÉ-CALCUL ÉCHOUÉ')
    console.log(`❌ ${result.message}`)
    process.exit(1)
  }
}

// ES Module check - Fixed for Windows
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].includes('precompute-graph-layout')) {
  main()
}