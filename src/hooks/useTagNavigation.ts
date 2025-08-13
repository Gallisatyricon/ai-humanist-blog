import { useState, useMemo, useEffect } from 'react'
import { Article, SecondaryDomain } from '@/data/schema'
import { 
  calculateTagImportance, 
  getRelevantSecondaryTags, 
  filterArticlesByTags 
} from '@/utils/tagMatcher'

export interface TagNavigationState {
  articles: Article[]
  filteredArticles: Article[]
  selectedPrimaryTags: string[]
  selectedSecondaryTags: string[]
  tagWeights: Record<string, number>
  relevantSecondaryTags: SecondaryDomain[]
  isLoading: boolean
  error: string | null
}

export function useTagNavigation() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedPrimaryTags, setSelectedPrimaryTags] = useState<string[]>([])
  const [selectedSecondaryTags, setSelectedSecondaryTags] = useState<string[]>([])
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les articles au montage
  useEffect(() => {
    loadArticles()
  }, [])

  async function loadArticles() {
    try {
      setIsLoading(true)
      const response = await fetch('/data/articles.json')
      if (!response.ok) {
        throw new Error('Impossible de charger les articles')
      }
      const data = await response.json()
      console.log('🔍 Données chargées:', data)
      
      // Gestion flexible du format (ancien vs nouveau)
      const articles = Array.isArray(data) ? data : (data.articles || [])
      console.log('📊 Articles extraits:', articles.length)
      
      setArticles(articles)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }

  // Calculer les poids des tags
  const tagWeights = useMemo(() => {
    if (articles.length === 0) return {}
    try {
      return calculateTagImportance(articles)
    } catch (error) {
      console.error('❌ Erreur calcul tagWeights:', error)
      return {}
    }
  }, [articles])

  // Calculer les tags secondaires pertinents
  const relevantSecondaryTags = useMemo(() => {
    try {
      return getRelevantSecondaryTags(selectedPrimaryTags, articles)
    } catch (error) {
      console.error('❌ Erreur calcul relevantSecondaryTags:', error)
      return []
    }
  }, [selectedPrimaryTags, articles])

  // Filtrer les articles selon les tags sélectionnés ou l'article spécifique
  const filteredArticles = useMemo(() => {
    try {
      if (selectedArticleId) {
        return articles.filter(article => article.id === selectedArticleId)
      }
      return filterArticlesByTags(articles, selectedPrimaryTags, selectedSecondaryTags)
    } catch (error) {
      console.error('❌ Erreur filtrage articles:', error)
      return articles
    }
  }, [articles, selectedPrimaryTags, selectedSecondaryTags, selectedArticleId])

  // Gestion de la sélection des tags primaires
  function onPrimaryTagSelect(tag: string) {
    setSelectedArticleId(null) // Désactiver le filtre par article
    setSelectedPrimaryTags(prev => {
      if (prev.includes(tag)) {
        // Désélectionner
        return prev.filter(t => t !== tag)
      } else {
        // Sélectionner (permettre multi-sélection)
        return [...prev, tag]
      }
    })
    // Réinitialiser les tags secondaires quand on change les primaires
    setSelectedSecondaryTags([])
  }

  // Gestion de la sélection des tags secondaires
  function onSecondaryTagSelect(tag: string) {
    setSelectedArticleId(null) // Désactiver le filtre par article
    setSelectedSecondaryTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  // Réinitialiser tous les filtres
  function resetFilters() {
    setSelectedPrimaryTags([])
    setSelectedSecondaryTags([])
    setSelectedArticleId(null)
  }

  // Sélectionner un article spécifique (pour le graphique)
  function selectArticleForFilter(articleId: string | null) {
    if (articleId) {
      // Désactiver les filtres par tags et activer le filtre par article
      setSelectedPrimaryTags([])
      setSelectedSecondaryTags([])
      setSelectedArticleId(articleId)
    } else {
      setSelectedArticleId(null)
    }
  }

  // Statistiques pour l'interface
  const stats = useMemo(() => {
    return {
      totalArticles: articles.length,
      filteredCount: filteredArticles.length,
      primaryTagsCount: selectedPrimaryTags.length,
      secondaryTagsCount: selectedSecondaryTags.length,
      hasFilters: selectedPrimaryTags.length > 0 || selectedSecondaryTags.length > 0 || selectedArticleId !== null
    }
  }, [articles, filteredArticles, selectedPrimaryTags, selectedSecondaryTags, selectedArticleId])

  // Suggestions de tags basées sur les articles filtrés
  const tagSuggestions = useMemo(() => {
    if (filteredArticles.length === 0) return []
    
    // Trouver les concepts les plus fréquents dans les articles filtrés
    const conceptCount: Record<string, number> = {}
    filteredArticles.forEach(article => {
      article.concepts.forEach(concept => {
        conceptCount[concept.name] = (conceptCount[concept.name] || 0) + 1
      })
    })
    
    return Object.entries(conceptCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([concept]) => concept)
  }, [filteredArticles])

  const state: TagNavigationState = {
    articles,
    filteredArticles,
    selectedPrimaryTags,
    selectedSecondaryTags,
    tagWeights,
    relevantSecondaryTags,
    isLoading,
    error
  }

  return {
    ...state,
    onPrimaryTagSelect,
    onSecondaryTagSelect,
    resetFilters,
    selectArticleForFilter,
    stats,
    tagSuggestions,
    reloadArticles: loadArticles
  }
}