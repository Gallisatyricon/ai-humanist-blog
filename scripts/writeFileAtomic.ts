import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import * as lockfile from 'proper-lockfile'
import { PATHS, getPipelineBackupPath } from './config/paths.js'

/**
 * Écriture atomique de fichiers avec système de lock
 * Évite la corruption lors d'écritures parallèles (n8n)
 */

export interface WriteOptions {
  lockTimeout?: number // ms, défaut: 10000
  retryInterval?: number // ms, défaut: 100
  encoding?: 'utf8' | 'ascii' | 'utf16le' | 'base64' | 'latin1' | 'binary' | 'hex' // défaut: 'utf8'
  createBackup?: boolean // défaut: true pour fichiers critiques
}

/**
 * Écrit un fichier de manière atomique avec lock
 * @param filePath Chemin vers le fichier
 * @param data Données à écrire (string ou Buffer)
 * @param options Options d'écriture
 */
export async function writeFileAtomic(
  filePath: string, 
  data: string | Buffer, 
  options: WriteOptions = {}
): Promise<void> {
  const {
    lockTimeout = 10000,
    retryInterval = 100,
    encoding = 'utf8',
    createBackup = true
  } = options

  const absolutePath = join(process.cwd(), filePath)
  const tempPath = `${absolutePath}.tmp`
  const lockPath = `${absolutePath}.lock`

  let release: (() => Promise<void>) | null = null

  try {
    // 1. Créer le répertoire parent si nécessaire
    await fs.mkdir(dirname(absolutePath), { recursive: true })
    
    // 2. Backup automatique si fichier existe et createBackup activé
    if (createBackup && await fileExists(absolutePath)) {
      await createSafetyBackup(absolutePath)
    }
    
    // 3. Acquérir le lock (skip si fichier n'existe pas)
    const lockOptions = {
      lockfilePath: lockPath,
      retries: Math.floor(lockTimeout / retryInterval),
      retryDelay: retryInterval,
      onCompromised: () => { /* ignore */ }
    }
    
    try {
      release = await lockfile.lock(absolutePath, lockOptions)
    } catch (error) {
      // Si le fichier n'existe pas, continuer sans lock
      if (error instanceof Error && error.message.includes('ENOENT')) {
        console.log(`📝 Création nouveau fichier: ${absolutePath.split(/[/\\]/).pop()}`)
      } else {
        throw error
      }
    }

    // 4. Écrire vers fichier temporaire
    if (typeof data === 'string') {
      await fs.writeFile(tempPath, data, { encoding })
    } else {
      await fs.writeFile(tempPath, data)
    }

    // 4. Renommage atomique (crucial)
    await fs.rename(tempPath, absolutePath)

    console.log(`✅ Fichier écrit atomiquement: ${absolutePath.split(/[/\\]/).pop()}`)

  } catch (error) {
    // Nettoyage en cas d'erreur
    try {
      await fs.unlink(tempPath)
    } catch {
      // Ignore si le fichier temp n'existe pas
    }

    if (error instanceof Error) {
      throw new Error(`Échec écriture atomique ${absolutePath}: ${error.message}`)
    }
    throw error

  } finally {
    // 5. Libérer le lock
    if (release) {
      try {
        await release()
      } catch (releaseError) {
        console.warn('⚠️ Échec libération lock:', releaseError)
      }
    }
  }
}

/**
 * Écriture JSON atomique avec validation de format
 */
export async function writeJSONAtomic(
  filePath: string,
  data: any,
  options: WriteOptions = {}
): Promise<void> {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    
    // Validation basique: parsing pour vérifier la structure
    JSON.parse(jsonString)
    
    await writeFileAtomic(filePath, jsonString, options)
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Échec écriture JSON atomique: ${error.message}`)
    }
    throw error
  }
}

/**
 * Lecture sécurisée avec lock optionnel
 */
export async function readFileWithLock(
  filePath: string,
  options: { 
    encoding?: 'utf8' | 'ascii' | 'utf16le' | 'base64' | 'latin1' | 'binary' | 'hex'
    timeout?: number
  } = {}
): Promise<string> {
  const { encoding = 'utf8', timeout = 5000 } = options
  const absolutePath = join(process.cwd(), filePath)

  let release: (() => Promise<void>) | null = null

  try {
    // Lock en lecture (partagé)
    release = await lockfile.lock(absolutePath, {
      lockfilePath: `${absolutePath}.lock`,
      retries: Math.floor(timeout / 100),
      retryDelay: 100,
      readOnly: true
    })

    return await fs.readFile(absolutePath, { encoding })

  } finally {
    if (release) {
      try {
        await release()
      } catch (releaseError) {
        console.warn('⚠️ Échec libération lock lecture:', releaseError)
      }
    }
  }
}

/**
 * Lecture JSON sécurisée avec validation
 */
export async function readJSONWithLock<T = any>(
  filePath: string,
  options: { timeout?: number } = {}
): Promise<T> {
  try {
    const content = await readFileWithLock(filePath, { 
      encoding: 'utf8',
      timeout: options.timeout 
    })
    
    return JSON.parse(content) as T
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Échec lecture JSON avec lock: ${error.message}`)
    }
    throw error
  }
}

/**
 * Utilitaire pour vérifier si un fichier est verrouillé
 */
export async function isFileLocked(filePath: string): Promise<boolean> {
  const lockPath = `${join(process.cwd(), filePath)}.lock`
  
  try {
    await fs.access(lockPath)
    return true
  } catch {
    return false
  }
}

/**
 * Vérifier si fichier existe
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Créer backup de sécurité dans structure organisée
 */
async function createSafetyBackup(filePath: string): Promise<string> {
  const fileName = filePath.split(/[/\\]/).pop()
  if (!fileName) throw new Error('Nom de fichier invalide')
  
  const backupPath = join(process.cwd(), getPipelineBackupPath(fileName))
  
  try {
    // Créer dossier backup sécurité
    await fs.mkdir(dirname(backupPath), { recursive: true })
    
    // Copier fichier existant
    await fs.copyFile(filePath, backupPath)
    
    console.log(`🔒 Backup pipeline: ${fileName} → ${PATHS.BACKUP_SECURITY}`)
    return backupPath
    
  } catch (error) {
    console.warn(`⚠️ Impossible de créer backup pour ${fileName}:`, error)
    throw error
  }
}