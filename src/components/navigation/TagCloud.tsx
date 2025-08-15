import React from 'react'
import { PRIMARY_DOMAINS } from '@/data/schema'
import { TagBubble, TagChip, TagSuggestions } from './TagBubble'
import { ComplexityFilter } from './ComplexityFilter'
import { ConceptFilter } from './ConceptFilter'
import { findBridgeTags } from '@/utils/tagMatcher'

interface TagCloudProps {
  articles: any[]
  selectedPrimaryTags: string[]
  selectedSecondaryTags: string[]
  selectedComplexityLevels: string[]
  selectedConcepts: string[]
  tagWeights: Record<string, number>
  relevantSecondaryTags: any[]
  onPrimaryTagSelect: (tag: string) => void
  onSecondaryTagSelect: (tag: string) => void
  onComplexityLevelSelect: (level: string) => void
  onConceptSelect: (conceptId: string) => void
  resetFilters: () => void
  stats: any
  tagSuggestions: string[]
  isLoading: boolean
  error: string | null
}

export const TagCloud: React.FC<TagCloudProps> = ({
  articles,
  selectedPrimaryTags,
  selectedSecondaryTags,
  selectedComplexityLevels,
  selectedConcepts,
  tagWeights,
  relevantSecondaryTags,
  onPrimaryTagSelect,
  onSecondaryTagSelect,
  onComplexityLevelSelect,
  onConceptSelect,
  resetFilters,
  stats,
  tagSuggestions,
  isLoading,
  error
}) => {

  // Calculer les tags "pont" technique-éthique
  const bridgeTags = React.useMemo(() => {
    return findBridgeTags(articles)
  }, [articles])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des articles...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 font-medium">Erreur</div>
        </div>
        <div className="mt-2 text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      {/* En-tête compact avec statistiques */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-base font-medium text-gray-800">
            🏷️ Navigation par filtres
          </h3>
          <p className="text-xs text-gray-600">
            {stats.filteredCount}/{stats.totalArticles} articles affichés
          </p>
        </div>
        {stats.hasFilters && (
          <button
            onClick={resetFilters}
            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            🔄 Réinitialiser
          </button>
        )}
      </div>

      {/* Filtres compacts pour layout vertical */}
      <div className="space-y-4">
        {/* Domaines primaires */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Domaines</h4>
          <div className="flex flex-wrap gap-1">
            {PRIMARY_DOMAINS.map(domain => (
              <TagBubble
                key={domain}
                tag={domain}
                weight={tagWeights[domain] || 0.1}
                selected={selectedPrimaryTags.includes(domain)}
                onClick={() => onPrimaryTagSelect(domain)}
              />
            ))}
          </div>
        </div>

        {/* Spécialités */}
        {relevantSecondaryTags.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Spécialités</h4>
            <div className="flex flex-wrap gap-1">
                {relevantSecondaryTags.slice(0, 8).map(tag => {
                  const count = articles.filter(article =>
                    article.secondary_domains.includes(tag) &&
                    (selectedPrimaryTags.length === 0 || selectedPrimaryTags.includes(article.primary_domain))
                  ).length

                  return (
                    <TagChip
                      key={tag}
                      tag={tag}
                      selected={selectedSecondaryTags.includes(tag)}
                      onClick={() => onSecondaryTagSelect(tag)}
                      count={count}
                    />
                  )
                })}
              </div>
            </div>
          )}
          
        {/* Niveaux */}
        <div>
          <ComplexityFilter
            articles={articles}
            selectedComplexityLevels={selectedComplexityLevels}
            onComplexityLevelSelect={onComplexityLevelSelect}
          />
        </div>

        {/* Concepts */}
        <div>
          <ConceptFilter
            articles={articles}
            selectedConcepts={selectedConcepts}
            onConceptSelect={onConceptSelect}
          />
        </div>
      </div>

      {/* Tags pont technique-éthique */}
      {bridgeTags.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-red-50 rounded-lg p-4">
          <h4 className="text-base font-medium text-gray-800 mb-2 text-center">
            🌉 Ponts technique-éthique
          </h4>
          <p className="text-sm text-gray-600 text-center mb-3">
            Tags révélant les interconnexions entre innovation et responsabilité
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {bridgeTags.map(tag => (
              <TagChip
                key={`bridge-${tag}`}
                tag={tag}
                selected={selectedSecondaryTags.includes(tag)}
                onClick={() => onSecondaryTagSelect(tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions de concepts */}
      {tagSuggestions.length > 0 && (
        <TagSuggestions
          suggestions={tagSuggestions}
          title="Concepts tendance dans votre sélection"
        />
      )}

      {/* Message si aucun résultat */}
      {stats.hasFilters && stats.filteredCount === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">🔍</div>
          <p className="text-gray-600">
            Aucun article ne correspond à cette combinaison de tags.
          </p>
          <button
            onClick={resetFilters}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Essayez d'autres critères
          </button>
        </div>
      )}

      {/* Aide contextuelle */}
      {!stats.hasFilters && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">
            💡 <strong>Explorez les connexions :</strong> Sélectionnez un ou plusieurs domaines 
            pour découvrir les articles et leurs interconnexions. 
            Les tags pont révèlent les liens entre technique et éthique.
          </p>
        </div>
      )}
    </div>
  )
}