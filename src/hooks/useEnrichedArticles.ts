import { useMemo, useState, useEffect } from 'react'
import { Article, Connection } from '@/data/schema'
import { enrichArticlesWithConnections } from '@/utils/connectionUtils'

export function useEnrichedArticles(articles: Article[]) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Charger les connexions depuis le fichier JSON
  useEffect(() => {
    if (articles.length > 0) {
      setIsLoading(true)
      fetch('/data/connections.json')
        .then(response => response.json())
        .then(data => {
          setConnections(data.connections || [])
          setIsLoading(false)
        })
        .catch(error => {
          console.error('❌ Erreur lors du chargement des connexions:', error)
          setConnections([])
          setIsLoading(false)
        })
    }
  }, [articles.length])

  // Articles enrichis avec leurs connexions calculées
  const enrichedArticles = useMemo(() => {
    if (connections.length === 0) return articles
    return enrichArticlesWithConnections(articles, connections)
  }, [articles, connections])

  return {
    articles: enrichedArticles,
    connections,
    isLoading
  }
}