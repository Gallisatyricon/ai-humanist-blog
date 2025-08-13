import React from 'react'
import { Article } from '@/data/schema'
import { highlightSearchTerm } from '@/hooks/useSearch'

interface SearchSectionProps {
  title: string
  results: Article[]
  query: string
  onArticleSelect: (article: Article) => void
  maxDisplayed?: number
  className?: string
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  title,
  results,
  query,
  onArticleSelect,
  maxDisplayed = 5,
  className = ""
}) => {
  if (results.length === 0) return null

  const displayedResults = results.slice(0, maxDisplayed)
  const hasMore = results.length > maxDisplayed

  return (
    <div className={`search-section ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-800 text-sm">
          {title}
        </h4>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {results.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {displayedResults.map(article => (
          <SearchResultItem
            key={article.id}
            article={article}
            query={query}
            onSelect={() => onArticleSelect(article)}
          />
        ))}
        
        {hasMore && (
          <div className="text-xs text-gray-500 text-center py-2 border-t border-gray-100">
            + {results.length - maxDisplayed} autres résultats
          </div>
        )}
      </div>
    </div>
  )
}

interface SearchResultItemProps {
  article: Article
  query: string
  onSelect: () => void
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  article,
  query,
  onSelect
}) => {
  // Trouve le premier concept/outil qui correspond à la recherche
  const matchingConcept = article.concepts.find(c => 
    c.name.toLowerCase().includes(query.toLowerCase())
  )
  
  const matchingTool = article.tools_mentioned.find(t => 
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  const getDomainColor = (domain: string) => {
    const colors = {
      technique: 'bg-blue-100 text-blue-800',
      ethique: 'bg-red-100 text-red-800',
      usage_professionnel: 'bg-green-100 text-green-800',
      recherche: 'bg-purple-100 text-purple-800',
      philosophie: 'bg-orange-100 text-orange-800',
      frugalite: 'bg-gray-100 text-gray-800'
    }
    return colors[domain as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div 
      onClick={onSelect}
      className="search-result-item p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Titre avec surlignage */}
          <h5 
            className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: highlightSearchTerm(article.title, query)
            }}
          />
          
          {/* Correspondance spécifique */}
          {matchingConcept && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">Concept :</span>
              <span 
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full"
                dangerouslySetInnerHTML={{
                  __html: highlightSearchTerm(matchingConcept.name, query)
                }}
              />
            </div>
          )}
          
          {matchingTool && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">Outil :</span>
              <span 
                className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full"
                dangerouslySetInnerHTML={{
                  __html: highlightSearchTerm(matchingTool.name, query)
                }}
              />
            </div>
          )}
          
          {/* Résumé avec surlignage (tronqué) */}
          <p 
            className="text-xs text-gray-600 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: highlightSearchTerm(
                article.summary.length > 120 
                  ? article.summary.substring(0, 120) + '...'
                  : article.summary,
                query
              )
            }}
          />
        </div>
        
        {/* Métadonnées à droite */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Badge domaine */}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDomainColor(article.primary_domain)}`}>
            {article.primary_domain}
          </span>
          
          {/* Indicateurs */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {article.interest_level && (
              <div className="flex items-center">
                <span>⭐</span>
                <span className="ml-1">{article.interest_level}</span>
              </div>
            )}
            {article.centrality_score > 0.6 && (
              <span title="Article central">🌟</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchSection