import React, { useState, useEffect, useRef } from 'react'
import { Article } from '@/data/schema'
import { useSearch, extractSearchKeywords } from '@/hooks/useSearch'
import SearchSection from './SearchSection'

interface SearchBarProps {
  articles: Article[]
  onArticleSelect: (article: Article) => void
  onSearchStateChange?: (isSearching: boolean, hasResults: boolean) => void
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  articles,
  onArticleSelect,
  onSearchStateChange,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  
  // Hook de recherche avec la requête debouncée
  const searchHook = useSearch(articles)
  const { searchResults, hasResults, clearSearch } = searchHook
  
  // Utilisation de la requête debouncée
  useEffect(() => {
    searchHook.setQuery(debouncedQuery)
  }, [debouncedQuery, searchHook])

  // Debouncing de l'input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue])

  // Gestion de l'état de recherche
  useEffect(() => {
    const isSearching = Boolean(debouncedQuery.trim())
    onSearchStateChange?.(isSearching, hasResults)
    setShowResults(isSearching && isExpanded)
  }, [debouncedQuery, hasResults, isExpanded, onSearchStateChange])

  // Gestion des clics extérieurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    if (value.trim()) {
      setIsExpanded(true)
    }
  }

  const handleInputFocus = () => {
    setIsExpanded(true)
    if (debouncedQuery.trim()) {
      setShowResults(true)
    }
  }

  const handleClearSearch = () => {
    setInputValue('')
    setDebouncedQuery('')
    clearSearch()
    setIsExpanded(false)
    setShowResults(false)
    inputRef.current?.focus()
  }

  const handleArticleSelect = (article: Article) => {
    onArticleSelect(article)
    setIsExpanded(false)
    setShowResults(false)
    // Optionnel: garder la recherche ou la vider
    // handleClearSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false)
      setShowResults(false)
      inputRef.current?.blur()
    }
  }

  const keywords = extractSearchKeywords(inputValue)
  const totalResults = searchResults.totalCount

  return (
    <div ref={searchContainerRef} className={`search-bar-container relative ${className}`}>
      {/* Barre de recherche */}
      <div className={`relative transition-all duration-300 ${
        isExpanded ? 'transform scale-105' : ''
      }`}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher par concept, outil, titre..."
            className={`w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              transition-all duration-200 text-sm
              ${isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
            `}
          />
          
          {/* Icône de recherche */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Bouton clear/loader */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {inputValue && (
              <button
                onClick={handleClearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Effacer la recherche"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Indicateur de recherche active */}
        {debouncedQuery && (
          <div className="absolute top-full left-0 right-0 mt-1 flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-700">🔍</span>
              <span className="text-blue-800 font-medium">
                {totalResults} résultat{totalResults !== 1 ? 's' : ''} 
                {keywords.length > 0 && (
                  <span className="text-blue-600"> pour : {keywords.slice(0, 3).join(', ')}</span>
                )}
              </span>
            </div>
            {showResults && (
              <button
                onClick={() => setShowResults(false)}
                className="text-blue-600 hover:text-blue-800 text-xs underline"
              >
                Masquer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Résultats de recherche */}
      {showResults && totalResults > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 space-y-4">
            <SearchSection
              title="🎯 Correspondances exactes"
              results={searchResults.exact}
              query={debouncedQuery}
              onArticleSelect={handleArticleSelect}
              maxDisplayed={3}
            />
            
            <SearchSection
              title="🔗 Concepts liés"
              results={searchResults.related}
              query={debouncedQuery}
              onArticleSelect={handleArticleSelect}
              maxDisplayed={4}
            />
            
            <SearchSection
              title="📂 Même domaine"
              results={searchResults.domain}
              query={debouncedQuery}
              onArticleSelect={handleArticleSelect}
              maxDisplayed={3}
            />
          </div>
          
          {/* Footer des résultats */}
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              💡 Astuce : Essayez des termes comme "attention", "bias", "GPT" ou "éthique"
            </p>
          </div>
        </div>
      )}
      
      {/* Pas de résultats */}
      {showResults && totalResults === 0 && debouncedQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">🤔</div>
            <h4 className="font-medium text-gray-800 mb-2">Aucun résultat trouvé</h4>
            <p className="text-sm text-gray-600 mb-4">
              Essayez avec d'autres termes : concepts techniques, outils, ou domaines
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['attention', 'bias', 'transformer', 'éthique', 'IA frugale'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInputValue(suggestion)}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar