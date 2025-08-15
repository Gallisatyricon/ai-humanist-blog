import React, { useState, useEffect } from 'react'
import { Article } from '@/data/schema'
import { TagCloud } from '@/components/navigation/TagCloud'
import { GraphView } from '@/components/navigation/GraphView'
import { ArticleList, ArticleDetail } from '@/components/articles/ArticleCard'
import SearchBar from '@/components/navigation/SearchBar'
import { useTagNavigation } from '@/hooks/useTagNavigation'
import { useEnrichedArticles } from '@/hooks/useEnrichedArticles'

interface MainLayoutProps {
  selectedArticle: Article | null
  onArticleSelect: (article: Article | null) => void
}

const MainLayout: React.FC<MainLayoutProps> = () => {
  const [selectedArticleForGraph, setSelectedArticleForGraph] = useState<Article | null>(null)
  const [showArticleDetail, setShowArticleDetail] = useState<Article | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)
  
  // Hook unique partagé
  const tagNavigationData = useTagNavigation()
  
  const {
    articles: baseArticles,
    filteredArticles: baseFilteredArticles,
    stats,
    selectArticleForFilter,
    selectedPrimaryTags,
    selectedSecondaryTags, 
    selectedComplexityLevels,
    selectedConcepts,
    error
  } = tagNavigationData

  // Synchroniser le graphe avec les changements de filtres
  useEffect(() => {
    // Si des filtres changent ET qu'un article est sélectionné, revenir en vue globale
    if (selectedArticleForGraph && (
      selectedPrimaryTags.length > 0 ||
      selectedSecondaryTags.length > 0 ||
      selectedComplexityLevels.length > 0 ||
      selectedConcepts.length > 0
    )) {
      // Vérifier si l'article sélectionné respecte les nouveaux filtres
      const focusArticle = selectedArticleForGraph
      const respectsFilters = 
        (selectedPrimaryTags.length === 0 || selectedPrimaryTags.includes(focusArticle.primary_domain)) &&
        (selectedSecondaryTags.length === 0 || selectedSecondaryTags.some(tag => focusArticle.secondary_domains.includes(tag as any))) &&
        (selectedComplexityLevels.length === 0 || selectedComplexityLevels.includes(focusArticle.complexity_level)) &&
        (selectedConcepts.length === 0 || (focusArticle.concepts && focusArticle.concepts.some(concept => selectedConcepts.includes(concept.type))))
      
      // Si l'article focus n'est plus compatible avec les filtres, revenir en vue globale
      if (!respectsFilters) {
        setSelectedArticleForGraph(null)
      }
    }
  }, [selectedPrimaryTags, selectedSecondaryTags, selectedComplexityLevels, selectedConcepts, selectedArticleForGraph])

  // Articles enrichis avec connexions
  const { articles: enrichedArticles } = useEnrichedArticles(baseArticles)
  
  // Articles filtrés enrichis
  const { articles: enrichedFilteredArticles } = useEnrichedArticles(baseFilteredArticles)
  
  // Gestion des erreurs au niveau du composant
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    )
  }


  const handleArticleSelect = (article: Article | null) => {
    setSelectedArticleForGraph(article)
    // Activer le filtrage par article dans la section suivante
    if (article) {
      selectArticleForFilter(article.id)
    } else {
      selectArticleForFilter(null)
    }
  }

  const handleArticleDetail = (article: Article) => {
    // Trouve l'article enrichi correspondant
    const enrichedArticle = enrichedArticles.find(a => a.id === article.id) || article
    setShowArticleDetail(enrichedArticle)
  }

  const handleSearchStateChange = (isSearching: boolean, _hasResults: boolean) => {
    setIsSearchActive(isSearching)
    // _hasResults pourrait être utilisé pour des statistiques futures
  }

  const handleSearchArticleSelect = (article: Article) => {
    // Trouve l'article enrichi correspondant
    const enrichedArticle = enrichedArticles.find(a => a.id === article.id) || article
    setShowArticleDetail(enrichedArticle)
    setSelectedArticleForGraph(enrichedArticle)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Blog IA - Raphaël Thiollier
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Explorez les interconnexions entre technique et éthique
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Barre de recherche */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                🔍 Recherche Intelligente
              </h3>
              <p className="text-sm text-gray-600">
                Trouvez des articles par concept, outil, titre ou domaine d'expertise
              </p>
            </div>
            <SearchBar
              articles={enrichedArticles}
              onArticleSelect={handleSearchArticleSelect}
              onSearchStateChange={handleSearchStateChange}
              className="max-w-2xl mx-auto"
            />
            {isSearchActive && (
              <div className="mt-3 text-center">
                <p className="text-xs text-blue-600">
                  💡 La recherche fonctionne en complément du filtrage par tags
                </p>
              </div>
            )}
          </div>
          
          {/* Layout Desktop : Filtres 33% + Graphe 67% */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Navigation par Tags - Colonne Gauche (33%) */}
            <div className="lg:col-span-4 bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <TagCloud {...tagNavigationData} />
            </div>
            
            {/* Visualisation Graphique - Colonne Droite (67%) */}
            <div className="lg:col-span-8 bg-white p-3 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
              <h3 className="text-base sm:text-lg font-medium text-center sm:text-left">
                🕸️ Graphique des Connexions
              </h3>
              {selectedArticleForGraph && (
                <button
                  onClick={() => {
                    setSelectedArticleForGraph(null)
                    selectArticleForFilter(null)
                  }}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline self-center sm:self-auto px-2 py-1 sm:px-0 sm:py-0"
                >
                  ← Retour vue globale
                </button>
              )}
            </div>
            
            {/* Graph responsive avec priorité mobile */}
            <div className="w-full">
              <div className="flex justify-center">
                <GraphView
                  articles={enrichedArticles}
                  filteredArticles={enrichedFilteredArticles}
                  selectedArticle={selectedArticleForGraph}
                  onArticleSelect={handleArticleSelect}
                  width={typeof window !== 'undefined' ? 
                    window.innerWidth < 640 ? window.innerWidth - 40 : // Mobile: pleine largeur - padding
                    window.innerWidth < 1024 ? window.innerWidth - 80 : // Tablet
                    Math.floor((window.innerWidth * 0.67) - 120) // Desktop: 67% - marges (UX optimal)
                    : 600
                  }
                  height={typeof window !== 'undefined' ? 
                    window.innerWidth < 640 ? 400 : 
                    window.innerWidth < 1024 ? 500 :
                    600 // Desktop: hauteur UX optimale pour analyse graphe
                    : 600
                  }
                />
              </div>
            </div>
            
            {/* Aide contextuelle mobile */}
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-xs sm:text-sm text-gray-500">
                💡 <span className="hidden sm:inline">Cliquez sur un nœud pour explorer ses connexions • </span>
                <span className="sm:hidden">Touchez un nœud • </span>
                Utilisez les filtres pour affiner la vue
              </p>
            </div>
          </div>
          </div>

          {/* Articles à afficher selon les filtres - LOGIC SIMPLIFIÉE */}
          {enrichedArticles.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Affichage conditionnel direct */}
              {stats.hasFilters ? (
                // Mode filtré
                <>
                  <div className="mb-4 p-2 bg-blue-50 rounded">
                    <span className="text-blue-800 font-medium">
                      🔍 Mode filtré actif
                    </span>
                  </div>
                  {enrichedFilteredArticles.length > 0 ? (
                    <ArticleList
                      articles={enrichedFilteredArticles}
                      selectedArticle={selectedArticleForGraph}
                      onArticleSelect={handleArticleDetail}
                      title={`Articles correspondants (${enrichedFilteredArticles.length})`}
                      initialDisplayed={enrichedFilteredArticles.length <= 24 ? enrichedFilteredArticles.length : 12}
                      incrementSize={12}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔍</div>
                      <h3 className="text-lg font-medium mb-2">Aucun article trouvé</h3>
                      <p className="mb-4">Cette combinaison de tags ne correspond à aucun article.</p>
                    </div>
                  )}
                </>
              ) : (
                // Mode tous les articles
                <>
                  <div className="mb-4 p-2 bg-gray-50 rounded">
                    <span className="text-gray-700 font-medium">
                      📚 Vue d'ensemble
                    </span>
                  </div>
                  <ArticleList
                    articles={enrichedArticles}
                    selectedArticle={selectedArticleForGraph}
                    onArticleSelect={handleArticleDetail}
                    title="Tous les articles"
                    initialDisplayed={12}
                    incrementSize={enrichedArticles.length > 100 ? 20 : 12}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de détail d'article */}
      {showArticleDetail && (
        <ArticleDetail
          article={showArticleDetail}
          onClose={() => setShowArticleDetail(null)}
        />
      )}
    </div>
  )
}

export default MainLayout