import React from 'react'
import { Article } from '@/data/schema'
import { DOMAIN_COLORS, DOMAIN_LABELS, COMPLEXITY_LABELS, SOURCE_LABELS } from '@/config/navigation'
import { useVirtualizedList } from '@/hooks/useVirtualizedList'

interface ArticleCardProps {
  article: Article
  onClick?: () => void
  showConnections?: boolean
  isSelected?: boolean
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onClick,
  showConnections = true,
  isSelected = false
}) => {
  const domainColor = DOMAIN_COLORS[article.primary_domain]
  const domainLabel = DOMAIN_LABELS[article.primary_domain]
  const complexityLabel = COMPLEXITY_LABELS[article.complexity_level]
  const sourceLabel = SOURCE_LABELS[article.source_type]

  return (
    <div
      className={`article-card cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      {/* En-tête avec domaine */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: domainColor }}
            title={domainLabel}
          />
          <span className="text-sm font-medium text-gray-700">
            {domainLabel}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{sourceLabel}</span>
          <span>•</span>
          <span>{article.reading_time}min</span>
        </div>
      </div>

      {/* Titre */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {article.title}
      </h3>

      {/* Résumé */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
        {article.summary}
      </p>

      {/* Perspective */}
      <div className="bg-blue-50 border-l-4 border-blue-200 p-2 mb-3">
        <p className="text-xs text-blue-800 italic">
          💭 {article.perspective}
        </p>
      </div>

      {/* Tags secondaires */}
      {article.secondary_domains.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {article.secondary_domains.slice(0, 3).map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs
                         bg-gray-100 text-gray-700"
            >
              {domain.replace(/_/g, ' ')}
            </span>
          ))}
          {article.secondary_domains.length > 3 && (
            <span className="text-xs text-gray-500">
              +{article.secondary_domains.length - 3} autres
            </span>
          )}
        </div>
      )}

      {/* Concepts clés */}
      {article.concepts.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Concepts :</h4>
          <div className="flex flex-wrap gap-1">
            {article.concepts.slice(0, 2).map((concept) => (
              <span
                key={concept.id}
                className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                  concept.controversy_level >= 2
                    ? 'bg-red-100 text-red-700'
                    : concept.controversy_level === 1
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {concept.name}
                {concept.controversy_level >= 2 && ' ⚠️'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Outils mentionnés */}
      {article.tools_mentioned.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Outils :</h4>
          <div className="flex flex-wrap gap-1">
            {article.tools_mentioned.slice(0, 3).map((tool) => (
              <span
                key={tool.id}
                className="inline-flex items-center px-2 py-1 rounded text-xs
                           bg-indigo-100 text-indigo-700"
              >
                {tool.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Métadonnées bas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-100 gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>Niveau:</span>
            <span className="font-medium">{complexityLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Intérêt:</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    i < article.interest_level ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>

        {showConnections && article.connected_articles.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-blue-600 self-start sm:self-auto">
            <span>🔗</span>
            <span className="whitespace-nowrap">{article.connected_articles.length} connexions</span>
          </div>
        )}
      </div>

      {/* Indicateur de centralité */}
      {article.centrality_score > 0.7 && (
        <div className="absolute top-2 right-2 connection-indicator bg-blue-500"
             title="Article hub - très connecté">
        </div>
      )}

    </div>
  )
}

interface ArticleListProps {
  articles: Article[]
  selectedArticle?: Article | null
  onArticleSelect?: (article: Article) => void
  title?: string
  initialDisplayed?: number
  incrementSize?: number
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  selectedArticle,
  onArticleSelect,
  title = "Articles",
  initialDisplayed = 12, // Augmenté de 6 à 12 pour plus de contenu initial
  incrementSize = 12 // Taille des incréments
}) => {
  // Hook de virtualisation optimisée
  const [listState, listActions] = useVirtualizedList({
    items: articles,
    initialPageSize: initialDisplayed,
    incrementSize,
    virtualThreshold: 100 // Active la virtualisation pour >100 articles
  })
  
  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-2xl mb-2">📚</div>
        <p>Aucun article trouvé</p>
      </div>
    )
  }

  const handleShowLess = () => {
    listActions.showLess()
    // Smooth scroll vers le début de la liste
    document.querySelector('[data-article-list]')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    })
  }

  return (
    <div className="space-y-4" data-article-list>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{listState.displayedCount} sur {listState.totalCount}</span>
          {listState.shouldVirtualize && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
              🚀 Mode optimisé
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listState.displayedItems.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onClick={() => onArticleSelect?.(article)}
            isSelected={selectedArticle?.id === article.id}
          />
        ))}
      </div>
      
      {/* Pagination intelligente optimisée */}
      {(listState.canLoadMore || listState.displayedCount > initialDisplayed) && (
        <div className="flex flex-col items-center space-y-3 pt-4 border-t border-gray-100">
          {listState.canLoadMore && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={listActions.loadMore}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg 
                           hover:bg-blue-700 transition-colors duration-200 font-medium
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           shadow-sm hover:shadow-md"
              >
                <span>📖</span>
                <span>Voir {listState.nextIncrement} articles de plus</span>
                <span className="text-blue-200">({listState.remainingCount} restants)</span>
              </button>
              
              {/* Bouton "Tout afficher" adaptatif */}
              {listState.remainingCount <= 24 && !listState.shouldVirtualize && (
                <button
                  onClick={listActions.showAll}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 
                           hover:bg-blue-50 rounded-lg transition-colors duration-200
                           text-sm font-medium border border-blue-200 hover:border-blue-300"
                >
                  Tout afficher ({listState.totalCount})
                </button>
              )}
              
              {/* Message pour grandes collections */}
              {listState.shouldVirtualize && (
                <div className="text-xs text-gray-500 max-w-xs text-center">
                  💡 Chargement progressif activé pour optimiser les performances
                </div>
              )}
            </div>
          )}
          
          {listState.displayedCount > initialDisplayed && (
            <button
              onClick={handleShowLess}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 
                         hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              <span>⬆️</span>
              <span>Réduire à {initialDisplayed} articles</span>
            </button>
          )}
          
          {/* Indicateur de progression visuel amélioré */}
          {listState.totalCount > initialDisplayed && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Articles affichés</span>
                <span>{Math.round(listState.loadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full 
                             transition-all duration-500 ease-out"
                  style={{ width: `${listState.loadProgress}%` }}
                />
              </div>
              {listState.shouldVirtualize && (
                <div className="text-xs text-center text-gray-400 mt-1">
                  Performance optimisée • {listState.totalCount} articles
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ArticleDetailProps {
  article: Article
  onClose: () => void
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: DOMAIN_COLORS[article.primary_domain] }}
              />
              <span className="text-sm font-medium text-gray-700">
                {DOMAIN_LABELS[article.primary_domain]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {article.title}
          </h2>
          
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 mb-4">{article.summary}</p>
            
            <div className="bg-blue-50 border-l-4 border-blue-200 p-3 mb-4">
              <p className="text-blue-800 italic">
                <strong>Perspective :</strong> {article.perspective}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Informations</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Source :</strong> {SOURCE_LABELS[article.source_type]}</li>
                  <li><strong>Date :</strong> {new Date(article.date).toLocaleDateString('fr-FR')}</li>
                  <li><strong>Lecture :</strong> {article.reading_time} minutes</li>
                  <li><strong>Complexité :</strong> {COMPLEXITY_LABELS[article.complexity_level]}</li>
                  {article.author && <li><strong>Auteur :</strong> {article.author}</li>}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Métriques</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Intérêt :</strong> {article.interest_level}/5</li>
                  <li><strong>Centralité :</strong> {Math.round(article.centrality_score * 100)}%</li>
                  <li><strong>Connexions :</strong> {article.connected_articles.length}</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700
                           transition-colors duration-200 text-sm font-medium"
              >
                Lire l'article →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}