import React from 'react'
import { DOMAIN_COLORS, DOMAIN_LABELS } from '@/config/navigation'
import { PrimaryDomain } from '@/data/schema'
import { calculateTagSize, calculateTagOpacity } from '@/utils/tagMatcher'

interface TagBubbleProps {
  tag: string
  weight: number
  selected: boolean
  onClick: () => void
  color?: string
  label?: string
}

export const TagBubble: React.FC<TagBubbleProps> = ({
  tag,
  weight,
  selected,
  onClick,
  color,
  label
}) => {
  const bubbleColor = color || DOMAIN_COLORS[tag as PrimaryDomain] || '#6B7280'
  const displayLabel = label || DOMAIN_LABELS[tag as PrimaryDomain] || tag
  const fontSize = calculateTagSize(weight, 14, 18)
  const opacity = calculateTagOpacity(weight, 0.7)
  
  return (
    <button
      className={`tag-bubble tag-bubble-primary ${selected ? 'tag-bubble-selected' : ''}`}
      style={{
        backgroundColor: bubbleColor,
        fontSize: `${fontSize}px`,
        opacity: selected ? 1 : opacity,
      }}
      onClick={onClick}
      aria-pressed={selected}
      title={`${displayLabel} (${Math.round(weight * 100)}% d'importance)`}
    >
      <span className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full bg-white/30"
          aria-hidden="true"
        />
        {displayLabel}
        {weight > 0.8 && (
          <span className="text-xs opacity-75" aria-label="Tag très important">
            ⭐
          </span>
        )}
      </span>
    </button>
  )
}

interface TagChipProps {
  tag: string
  selected: boolean
  onClick: () => void
  count?: number
}

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  selected,
  onClick,
  count
}) => {
  // Convertir snake_case en format lisible
  const displayLabel = tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return (
    <button
      className={`tag-chip ${selected ? 'tag-chip-selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
      title={count ? `${displayLabel} (${count} articles)` : displayLabel}
    >
      {displayLabel}
      {count && count > 0 && (
        <span className="ml-1 text-xs opacity-60">
          {count}
        </span>
      )}
    </button>
  )
}

interface TagStatsProps {
  totalCount: number
  filteredCount: number
  hasFilters: boolean
  onReset: () => void
}

export const TagStats: React.FC<TagStatsProps> = ({
  totalCount,
  filteredCount,
  hasFilters,
  onReset
}) => {
  if (!hasFilters) {
    return (
      <div className="text-sm text-gray-600">
        {totalCount} articles disponibles
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-gray-600">
        {filteredCount} sur {totalCount} articles
      </span>
      {filteredCount !== totalCount && (
        <button
          onClick={onReset}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}

interface TagSuggestionsProps {
  suggestions: string[]
  title?: string
}

export const TagSuggestions: React.FC<TagSuggestionsProps> = ({
  suggestions,
  title = "Concepts populaires"
}) => {
  if (suggestions.length === 0) return null

  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <h4 className="text-sm font-medium text-blue-800 mb-2">
        {title}
      </h4>
      <div className="flex flex-wrap gap-1">
        {suggestions.map((suggestion, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded text-xs
                       bg-blue-100 text-blue-700 border border-blue-200"
          >
            {suggestion}
          </span>
        ))}
      </div>
    </div>
  )
}