import { useState, useMemo, useCallback } from 'react'
import { Article } from '@/data/schema'

export interface SearchResults {
  exact: Article[]
  related: Article[]
  domain: Article[]
  totalCount: number
}

export interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  searchResults: SearchResults
  isLoading: boolean
  hasResults: boolean
  clearSearch: () => void
}

export function useSearch(articles: Article[]): UseSearchReturn {
  const [query, setQuery] = useState('')
  const isLoading = false // Pour l'instant, recherche instantanée

  // Recherche avec debouncing intégré
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        exact: [],
        related: [],
        domain: [],
        totalCount: 0
      }
    }

    const normalizedQuery = query.toLowerCase().trim()
    
    // 1. Correspondances exactes - titre et concepts
    const exact = articles.filter(article =>
      article.title.toLowerCase().includes(normalizedQuery) ||
      article.concepts.some(c => c.name.toLowerCase().includes(normalizedQuery)) ||
      article.tools_mentioned.some(t => t.name.toLowerCase().includes(normalizedQuery))
    )

    // 2. Recherche sémantique - résumé, perspective et outils
    const related = articles.filter(article =>
      !exact.includes(article) && (
        article.summary.toLowerCase().includes(normalizedQuery) ||
        article.perspective?.toLowerCase().includes(normalizedQuery) ||
        article.secondary_domains.some(d => d.toLowerCase().includes(normalizedQuery))
      )
    )

    // 3. Recherche par domaine et contexte
    const domain = articles.filter(article =>
      !exact.includes(article) && 
      !related.includes(article) && (
        article.primary_domain.toLowerCase().includes(normalizedQuery) ||
        article.author?.toLowerCase().includes(normalizedQuery) ||
        // Recherche floue dans les concepts
        article.concepts.some(c => 
          c.name.toLowerCase().split(' ').some(word => 
            word.includes(normalizedQuery) || normalizedQuery.includes(word)
          )
        )
      )
    )

    return {
      exact,
      related,
      domain,
      totalCount: exact.length + related.length + domain.length
    }
  }, [query, articles])

  const clearSearch = useCallback(() => {
    setQuery('')
  }, [])

  const hasResults = searchResults.totalCount > 0

  return {
    query,
    setQuery,
    searchResults,
    isLoading,
    hasResults,
    clearSearch
  }
}

// Fonction utilitaire pour surligner les termes de recherche
export function highlightSearchTerm(text: string, query: string): string {
  if (!query.trim()) return text
  
  const regex = new RegExp(`(${query.trim()})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
}

// Fonction pour extraire les mots-clés pertinents d'une requête
export function extractSearchKeywords(query: string): string[] {
  const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 'dans', 'sur', 'avec', 'pour', 'par']
  
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.includes(word))
    .slice(0, 5) // Limiter à 5 mots-clés max
}

// Fonction pour calculer la pertinence d'un article
export function calculateRelevanceScore(article: Article, query: string): number {
  const normalizedQuery = query.toLowerCase()
  let score = 0

  // Score titre (poids: 5)
  if (article.title.toLowerCase().includes(normalizedQuery)) {
    score += 5
  }

  // Score concepts (poids: 4)
  article.concepts.forEach(concept => {
    if (concept.name.toLowerCase().includes(normalizedQuery)) {
      score += 4
    }
  })

  // Score outils (poids: 3)
  article.tools_mentioned.forEach(tool => {
    if (tool.name.toLowerCase().includes(normalizedQuery)) {
      score += 3
    }
  })

  // Score résumé (poids: 2)
  if (article.summary.toLowerCase().includes(normalizedQuery)) {
    score += 2
  }

  // Score domaines secondaires (poids: 1)
  article.secondary_domains.forEach(domain => {
    if (domain.toLowerCase().includes(normalizedQuery)) {
      score += 1
    }
  })

  // Bonus pour les articles centraux
  score += article.centrality_score * 2

  return score
}