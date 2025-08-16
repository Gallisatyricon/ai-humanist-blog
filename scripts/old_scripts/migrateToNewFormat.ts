#!/usr/bin/env tsx
/**
 * SCRIPT DE MIGRATION VERS LE NOUVEAU FORMAT
 * 
 * Convertit les fichiers articles.json et connections.json existants
 * vers le nouveau format optimisé pour l'Option 2
 */

import fs from 'fs/promises'
import path from 'path'
import { Article, Connection, ArticleData, ConnectionData } from '../src/data/schema.js'

const ARTICLES_PATH = path.join(process.cwd(), 'public/data/articles.json')
const CONNECTIONS_PATH = path.join(process.cwd(), 'public/data/connections.json')

function buildConnectionIndex(connections: Connection[]): Record<string, string[]> {
  const index: Record<string, string[]> = {}
  
  connections.forEach(conn => {
    if (!index[conn.source_id]) index[conn.source_id] = []
    if (!index[conn.target_id]) index[conn.target_id] = []
    
    if (!index[conn.source_id].includes(conn.target_id)) {
      index[conn.source_id].push(conn.target_id)
    }
    if (!index[conn.target_id].includes(conn.source_id)) {
      index[conn.target_id].push(conn.source_id)
    }
  })
  
  return index
}

async function migrateArticles(): Promise<void> {
  try {
    const data = await fs.readFile(ARTICLES_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    
    // Vérifier si déjà au nouveau format
    if (parsed.last_updated && parsed.total_articles !== undefined) {
      console.log('✅ Articles déjà au nouveau format')
      return
    }
    
    // Conversion vers nouveau format
    const articles: Article[] = parsed.articles || []
    
    const newFormat: ArticleData = {
      articles,
      last_updated: new Date().toISOString(),
      total_articles: articles.length
    }
    
    // Sauvegarde avec backup dans data_security_backup
    const backupDir = path.join(process.cwd(), 'public/data/data_security_backup')
    const backupPath = path.join(backupDir, `articles.backup-${new Date().toISOString().slice(0,10).replace(/-/g,'')}.json`)
    await fs.copyFile(ARTICLES_PATH, backupPath)
    
    await fs.writeFile(
      ARTICLES_PATH,
      JSON.stringify(newFormat, null, 2),
      'utf-8'
    )
    
    console.log(`✅ Articles migrés (${articles.length} articles)`)
    console.log(`💾 Sauvegarde: ${backupPath}`)
    
  } catch (error) {
    console.error('❌ Erreur migration articles:', error)
  }
}

async function migrateConnections(): Promise<void> {
  try {
    const data = await fs.readFile(CONNECTIONS_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    
    // Vérifier si déjà au nouveau format
    if (parsed.connection_index && parsed.last_processed) {
      console.log('✅ Connexions déjà au nouveau format')
      return
    }
    
    // Conversion vers nouveau format
    const connections: Connection[] = parsed.connections || []
    const connectionIndex = buildConnectionIndex(connections)
    
    const newFormat: ConnectionData = {
      connections,
      generated_at: parsed.generated_at || new Date().toISOString(),
      total_connections: connections.length,
      connection_index: connectionIndex,
      last_processed: {}  // Sera rempli au fur et à mesure
    }
    
    // Sauvegarde avec backup dans data_security_backup
    const backupDir = path.join(process.cwd(), 'public/data/data_security_backup')
    const backupPath = path.join(backupDir, `connections.backup-${new Date().toISOString().slice(0,10).replace(/-/g,'')}.json`)
    await fs.copyFile(CONNECTIONS_PATH, backupPath)
    
    await fs.writeFile(
      CONNECTIONS_PATH,
      JSON.stringify(newFormat, null, 2),
      'utf-8'
    )
    
    console.log(`✅ Connexions migrées (${connections.length} connexions)`)
    console.log(`🔍 Index créé pour ${Object.keys(connectionIndex).length} articles`)
    console.log(`💾 Sauvegarde: ${backupPath}`)
    
  } catch (error) {
    console.error('❌ Erreur migration connexions:', error)
  }
}

async function main() {
  console.log('🚀 MIGRATION VERS NOUVEAU FORMAT (Option 2)')
  console.log('===========================================')
  
  await migrateArticles()
  await migrateConnections()
  
  console.log('\n✨ Migration terminée!')
  console.log('🔄 Vous pouvez maintenant utiliser npm run add-article')
}

main().catch(console.error)