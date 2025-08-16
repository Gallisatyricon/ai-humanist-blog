#!/usr/bin/env tsx
/**
 * SCRIPT D'EXPORT DU GRAPHIQUE
 * 
 * Ce script génère des exports du graphique de connexions :
 * - Export JSON pour analyse externe
 * - Export CSV pour tableurs
 * - Métriques et statistiques
 * - Génération de rapports
 */

import fs from 'fs/promises'
import path from 'path'
import { Article, Connection } from '../src/data/schema'

interface GraphExport {
  nodes: ExportNode[]
  links: ExportLink[]
  metadata: ExportMetadata
}

interface ExportNode {
  id: string
  label: string
  domain: string
  centrality: number
  connections: number
  importance: number
}

interface ExportLink {
  source: string
  target: string
  type: string
  strength: number
  auto_detected: boolean
}

interface ExportMetadata {
  export_date: string
  total_nodes: number
  total_links: number
  density: number
  avg_clustering: number
  most_connected: string
  domains_distribution: Record<string, number>
  connection_types_distribution: Record<string, number>
}

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')
const EXPORT_DIR = path.join(process.cwd(), 'exports')

async function loadData(): Promise<{ articles: Article[], connections: Connection[] }> {
  let articles: Article[] = []
  let connections: Connection[] = []
  
  try {
    const articlesData = await fs.readFile(ARTICLES_PATH, 'utf-8')
    articles = JSON.parse(articlesData).articles || []
  } catch (error) {
    console.error('❌ Erreur chargement articles:', error)
  }
  
  try {
    const connectionsData = await fs.readFile(CONNECTIONS_PATH, 'utf-8')
    connections = JSON.parse(connectionsData).connections || []
  } catch (error) {
    console.warn('⚠️  Pas de fichier connections.json trouvé')
  }
  
  return { articles, connections }
}

function calculateCentrality(articleId: string, connections: Connection[]): number {
  const connectedTo = connections.filter(c => 
    c.source_id === articleId || c.target_id === articleId
  )
  return connectedTo.length
}

function calculateGraphDensity(nodeCount: number, linkCount: number): number {
  const maxLinks = nodeCount * (nodeCount - 1) / 2
  return maxLinks > 0 ? linkCount / maxLinks : 0
}

function generateExportData(articles: Article[], connections: Connection[]): GraphExport {
  // Calcul des métriques pour chaque nœud
  const nodes: ExportNode[] = articles.map(article => {
    const connectionCount = calculateCentrality(article.id, connections)
    
    return {
      id: article.id,
      label: article.title,
      domain: article.primary_domain,
      centrality: article.centrality_score || 0,
      connections: connectionCount,
      importance: article.interest_level || 1
    }
  })
  
  // Transformation des liens
  const links: ExportLink[] = connections.map(conn => ({
    source: conn.source_id,
    target: conn.target_id,
    type: conn.type,
    strength: conn.strength,
    auto_detected: conn.auto_detected || false
  }))
  
  // Calcul des statistiques globales
  const domainsDistribution = articles.reduce((acc, article) => {
    acc[article.primary_domain] = (acc[article.primary_domain] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const connectionTypesDistribution = connections.reduce((acc, conn) => {
    acc[conn.type] = (acc[conn.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const density = calculateGraphDensity(articles.length, connections.length)
  
  const nodeConnections = nodes.map(n => n.connections)
  const avgClustering = nodeConnections.reduce((a, b) => a + b, 0) / nodeConnections.length || 0
  
  const mostConnectedNode = nodes.reduce((max, node) => 
    node.connections > max.connections ? node : max, 
    nodes[0]
  )
  
  const metadata: ExportMetadata = {
    export_date: new Date().toISOString(),
    total_nodes: articles.length,
    total_links: connections.length,
    density: Math.round(density * 1000) / 1000,
    avg_clustering: Math.round(avgClustering * 100) / 100,
    most_connected: mostConnectedNode?.label || 'N/A',
    domains_distribution: domainsDistribution,
    connection_types_distribution: connectionTypesDistribution
  }
  
  return { nodes, links, metadata }
}

async function ensureExportDirectory(): Promise<void> {
  try {
    await fs.access(EXPORT_DIR)
  } catch {
    await fs.mkdir(EXPORT_DIR, { recursive: true })
    console.log(`📁 Dossier d'export créé: ${EXPORT_DIR}`)
  }
}

async function exportJSON(data: GraphExport): Promise<void> {
  const filepath = path.join(EXPORT_DIR, `graph-export-${Date.now()}.json`)
  await fs.writeFile(filepath, JSON.stringify(data, null, 2))
  console.log(`✅ Export JSON sauvé: ${filepath}`)
}

async function exportCSV(data: GraphExport): Promise<void> {
  // Export des nœuds
  const nodesCSV = [
    'id,label,domain,centrality,connections,importance',
    ...data.nodes.map(node => 
      `"${node.id}","${node.label.replace(/"/g, '""')}","${node.domain}",${node.centrality},${node.connections},${node.importance}`
    )
  ].join('\n')
  
  const nodesPath = path.join(EXPORT_DIR, `nodes-${Date.now()}.csv`)
  await fs.writeFile(nodesPath, nodesCSV)
  
  // Export des liens
  const linksCSV = [
    'source,target,type,strength,auto_detected',
    ...data.links.map(link => 
      `"${link.source}","${link.target}","${link.type}",${link.strength},${link.auto_detected}`
    )
  ].join('\n')
  
  const linksPath = path.join(EXPORT_DIR, `links-${Date.now()}.csv`)
  await fs.writeFile(linksPath, linksCSV)
  
  console.log(`✅ Export CSV sauvé: ${nodesPath} & ${linksPath}`)
}

async function generateReport(data: GraphExport): Promise<void> {
  const report = `# RAPPORT D'ANALYSE DU GRAPHIQUE IA HUMANISTE

## Métadonnées
- **Date d'export**: ${new Date(data.metadata.export_date).toLocaleString()}
- **Nœuds totaux**: ${data.metadata.total_nodes}
- **Liens totaux**: ${data.metadata.total_links}
- **Densité du graphique**: ${data.metadata.density} (${(data.metadata.density * 100).toFixed(1)}%)
- **Clustering moyen**: ${data.metadata.avg_clustering}
- **Article le plus connecté**: ${data.metadata.most_connected}

## Répartition par Domaines
${Object.entries(data.metadata.domains_distribution)
  .map(([domain, count]) => `- **${domain}**: ${count} articles (${((count / data.metadata.total_nodes) * 100).toFixed(1)}%)`)
  .join('\n')}

## Types de Connexions
${Object.entries(data.metadata.connection_types_distribution)
  .map(([type, count]) => `- **${type}**: ${count} connexions (${((count / data.metadata.total_links) * 100).toFixed(1)}%)`)
  .join('\n')}

## Articles les Plus Connectés
${data.nodes
  .sort((a, b) => b.connections - a.connections)
  .slice(0, 5)
  .map((node, i) => `${i + 1}. **${node.label}** (${node.connections} connexions, domaine: ${node.domain})`)
  .join('\n')}

## Analyse de Qualité
- **Taux de connexion**: ${((data.metadata.total_links / data.metadata.total_nodes) * 100).toFixed(1)}% des articles sont connectés
- **Diversité des domaines**: ${Object.keys(data.metadata.domains_distribution).length} domaines représentés
- **Types de relations**: ${Object.keys(data.metadata.connection_types_distribution).length} types différents

---

*Rapport généré automatiquement par l'outil d'export du Blog IA Humaniste*
`

  const reportPath = path.join(EXPORT_DIR, `rapport-${Date.now()}.md`)
  await fs.writeFile(reportPath, report)
  console.log(`✅ Rapport généré: ${reportPath}`)
}

async function main() {
  console.log('📊 EXPORT DU GRAPHIQUE IA HUMANISTE')
  console.log('===================================')
  
  const { articles, connections } = await loadData()
  
  if (articles.length === 0) {
    console.error('❌ Aucun article trouvé')
    process.exit(1)
  }
  
  console.log(`📄 ${articles.length} articles chargés`)
  console.log(`🔗 ${connections.length} connexions chargées`)
  
  await ensureExportDirectory()
  
  const exportData = generateExportData(articles, connections)
  
  await Promise.all([
    exportJSON(exportData),
    exportCSV(exportData),
    generateReport(exportData)
  ])
  
  console.log('\n✨ Export terminé avec succès!')
  console.log(`📁 Fichiers générés dans: ${EXPORT_DIR}`)
}

// Exécution
main().catch(console.error)