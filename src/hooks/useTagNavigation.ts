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
  selectedComplexityLevels: string[]
  selectedConcepts: string[]
  tagWeights: Record<string, number>
  relevantSecondaryTags: SecondaryDomain[]
  isLoading: boolean
  error: string | null
}

export function useTagNavigation() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedPrimaryTags, setSelectedPrimaryTags] = useState<string[]>([])
  const [selectedSecondaryTags, setSelectedSecondaryTags] = useState<string[]>([])
  const [selectedComplexityLevels, setSelectedComplexityLevels] = useState<string[]>([])
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])
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

  // Filtrer les articles selon les tags sélectionnés ET l'article spécifique
  const filteredArticles = useMemo(() => {
    try {
      let filtered = filterArticlesByTags(articles, selectedPrimaryTags, selectedSecondaryTags)
      
      // Filtre par niveau de complexité
      if (selectedComplexityLevels.length > 0) {
        filtered = filtered.filter(article => 
          selectedComplexityLevels.includes(article.complexity_level)
        )
      }
      
      // Filtre par types de concepts
      if (selectedConcepts.length > 0) {
        filtered = filtered.filter(article => 
          article.concepts && article.concepts.some(concept => 
            selectedConcepts.includes(concept.type)
          )
        )
      }

      // Si un article est sélectionné pour focus, ne garder que celui-ci
      // MAIS respecter les autres filtres pour la bi-directionnalité
      if (selectedArticleId) {
        const focusArticle = articles.find(article => article.id === selectedArticleId)
        if (focusArticle) {
          // Vérifier si l'article focus respecte les filtres actifs
          const respectsFilters = 
            (selectedPrimaryTags.length === 0 || selectedPrimaryTags.includes(focusArticle.primary_domain)) &&
            (selectedSecondaryTags.length === 0 || selectedSecondaryTags.some(tag => focusArticle.secondary_domains.includes(tag as any))) &&
            (selectedComplexityLevels.length === 0 || selectedComplexityLevels.includes(focusArticle.complexity_level)) &&
            (selectedConcepts.length === 0 || (focusArticle.concepts && focusArticle.concepts.some(concept => selectedConcepts.includes(concept.type))))
          
          if (respectsFilters) {
            return [focusArticle] // Article focus compatible avec filtres
          } else {
            return [] // Article focus incompatible avec filtres
          }
        }
      }
      
      return filtered
    } catch (error) {
      console.error('❌ Erreur filtrage articles:', error)
      return articles
    }
  }, [articles, selectedPrimaryTags, selectedSecondaryTags, selectedComplexityLevels, selectedConcepts, selectedArticleId])

  // Gestion de la sélection des tags primaires
  function onPrimaryTagSelect(tag: string) {
    setSelectedArticleId(null) // Revenir en vue globale quand on change les filtres
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
    setSelectedArticleId(null) // Revenir en vue globale quand on change les filtres
    setSelectedSecondaryTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  // Gestion des filtres par niveau de complexité
  function onComplexityLevelSelect(level: string) {
    setSelectedArticleId(null) // Revenir en vue globale quand on change les filtres
    setSelectedComplexityLevels(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level)
      } else {
        return [...prev, level]
      }
    })
  }

  // Gestion des filtres par types de concepts
  function onConceptSelect(conceptType: string) {
    setSelectedArticleId(null) // Revenir en vue globale quand on change les filtres
    setSelectedConcepts(prev => {
      if (prev.includes(conceptType)) {
        return prev.filter(c => c !== conceptType)
      } else {
        return [...prev, conceptType]
      }
    })
  }

  // Réinitialiser tous les filtres
  function resetFilters() {
    setSelectedPrimaryTags([])
    setSelectedSecondaryTags([])
    setSelectedComplexityLevels([])
    setSelectedConcepts([])
    setSelectedArticleId(null) // Revenir en vue globale
  }

  // Sélectionner un article spécifique (pour le graphique)
  function selectArticleForFilter(articleId: string | null) {
    // GARDONS les filtres existants pour la bi-directionnalité
    setSelectedArticleId(articleId)
    // Les filtres restent actifs et continuent de fonctionner
  }

  // Statistiques pour l'interface
  const stats = useMemo(() => {
    return {
      totalArticles: articles.length,
      filteredCount: filteredArticles.length,
      primaryTagsCount: selectedPrimaryTags.length,
      secondaryTagsCount: selectedSecondaryTags.length,
      complexityLevelsCount: selectedComplexityLevels.length,
      conceptsCount: selectedConcepts.length,
      hasFilters: selectedPrimaryTags.length > 0 || selectedSecondaryTags.length > 0 || selectedComplexityLevels.length > 0 || selectedConcepts.length > 0 || selectedArticleId !== null
    }
  }, [articles, filteredArticles, selectedPrimaryTags, selectedSecondaryTags, selectedComplexityLevels, selectedConcepts, selectedArticleId])

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
    selectedComplexityLevels,
    selectedConcepts,
    tagWeights,
    relevantSecondaryTags,
    isLoading,
    error
  }

  return {
    ...state,
    selectedComplexityLevels,
    selectedConcepts,
    onPrimaryTagSelect,
    onSecondaryTagSelect,
    onComplexityLevelSelect,
    onConceptSelect,
    resetFilters,
    selectArticleForFilter,
    stats,
    tagSuggestions,
    reloadArticles: loadArticles
  }
}