import React from 'react'
import { PRIMARY_DOMAINS } from '@/data/schema'
import { TagBubble, TagChip, TagStats, TagSuggestions } from './TagBubble'
import { findBridgeTags } from '@/utils/tagMatcher'

interface TagCloudProps {
  articles: any[]
  selectedPrimaryTags: string[]
  selectedSecondaryTags: string[]
  tagWeights: Record<string, number>
  relevantSecondaryTags: any[]
  onPrimaryTagSelect: (tag: string) => void
  onSecondaryTagSelect: (tag: string) => void
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
  tagWeights,
  relevantSecondaryTags,
  onPrimaryTagSelect,
  onSecondaryTagSelect,
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* En-tête avec statistiques */}
      <div className="text-center">
        <TagStats
          totalCount={stats.totalArticles}
          filteredCount={stats.filteredCount}
          hasFilters={stats.hasFilters}
          onReset={resetFilters}
        />
      </div>

      {/* Tags primaires - navigation principale */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-800 text-center">
          Domaines d'exploration
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
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

      {/* Tags secondaires - affinement */}
      {relevantSecondaryTags.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-base font-medium text-gray-700 text-center">
            Affiner par spécialité
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            {relevantSecondaryTags.map(tag => {
              // Compter les articles pour ce tag
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