import React, { useState } from 'react'
import { Article } from '@/data/schema'
import { TagCloud } from '@/components/navigation/TagCloud'
import { GraphView } from '@/components/navigation/GraphView'
import { ArticleList, ArticleDetail } from '@/components/articles/ArticleCard'
import SearchBar from '@/components/navigation/SearchBar'
import { useTagNavigation } from '@/hooks/useTagNavigation'

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
    articles,
    filteredArticles,
    stats,
    selectArticleForFilter,
    error
  } = tagNavigationData
  
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
    setShowArticleDetail(article)
  }

  const handleSearchStateChange = (isSearching: boolean, _hasResults: boolean) => {
    setIsSearchActive(isSearching)
    // _hasResults pourrait être utilisé pour des statistiques futures
  }

  const handleSearchArticleSelect = (article: Article) => {
    setShowArticleDetail(article)
    setSelectedArticleForGraph(article)
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
              articles={articles}
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
          
          {/* Navigation par Tags */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <TagCloud {...tagNavigationData} />
          </div>
          
          {/* Visualisation Graphique */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <h3 className="text-lg font-medium">
                Graphique des Connexions
              </h3>
              {selectedArticleForGraph && (
                <button
                  onClick={() => {
                    setSelectedArticleForGraph(null)
                    selectArticleForFilter(null)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline self-start sm:self-auto"
                >
                  ← Retour vue globale
                </button>
              )}
            </div>
            
            <div className="w-full overflow-x-auto">
              <div className="flex justify-center min-w-[600px]">
                <GraphView
                  articles={articles}
                  filteredArticles={filteredArticles}
                  selectedArticle={selectedArticleForGraph}
                  onArticleSelect={handleArticleSelect}
                  width={Math.min(800, typeof window !== 'undefined' ? window.innerWidth - 100 : 800)}
                  height={500}
                />
              </div>
            </div>
          </div>


          {/* Articles à afficher selon les filtres - LOGIC SIMPLIFIÉE */}
          {articles.length > 0 && (
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
                  {filteredArticles.length > 0 ? (
                    <ArticleList
                      articles={filteredArticles}
                      selectedArticle={selectedArticleForGraph}
                      onArticleSelect={handleArticleDetail}
                      title={`Articles correspondants (${filteredArticles.length})`}
                      maxDisplayed={6}
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
                    articles={articles}
                    selectedArticle={selectedArticleForGraph}
                    onArticleSelect={handleArticleDetail}
                    title="Tous les articles"
                    maxDisplayed={6}
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