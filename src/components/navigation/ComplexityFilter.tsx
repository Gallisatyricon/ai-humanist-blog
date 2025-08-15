import React from 'react'
import { COMPLEXITY_LABELS } from '@/config/navigation'

interface ComplexityFilterProps {
  articles: any[]
  selectedComplexityLevels: string[]
  onComplexityLevelSelect: (level: string) => void
}

export const ComplexityFilter: React.FC<ComplexityFilterProps> = ({
  articles,
  selectedComplexityLevels,
  onComplexityLevelSelect
}) => {
  // Calculer les compteurs pour chaque niveau
  const complexityCounts = React.useMemo(() => {
    const counts = { beginner: 0, intermediate: 0, advanced: 0 }
    articles.forEach(article => {
      if (article.complexity_level && Object.prototype.hasOwnProperty.call(counts, article.complexity_level)) {
        counts[article.complexity_level as keyof typeof counts]++
      }
    })
    return counts
  }, [articles])

  const complexityLevels = [
    { key: 'beginner', emoji: '🟢', color: 'bg-green-100 text-green-800 border-green-200' },
    { key: 'intermediate', emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { key: 'advanced', emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-200' }
  ] as const

  const totalSelectedLevels = selectedComplexityLevels.length

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-600">
        Niveau de complexité
        {totalSelectedLevels > 0 && (
          <span className="ml-2 bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold">
            {totalSelectedLevels}
          </span>
        )}
      </h4>
      <div className="flex flex-wrap gap-1">
        {complexityLevels.map(({ key, emoji, color }) => {
          const count = complexityCounts[key]
          const isSelected = selectedComplexityLevels.includes(key)
          const label = COMPLEXITY_LABELS[key]
          
          if (count === 0) return null // Ne pas afficher si aucun article
          
          return (
            <button
              key={key}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200
                ${isSelected 
                  ? `${color} ring-2 ring-opacity-50 ring-current` 
                  : `${color.replace('800', '600')} hover:${color} opacity-70 hover:opacity-100`
                }
              `}
              onClick={() => onComplexityLevelSelect(key)}
              aria-pressed={isSelected}
              title={`${label} (${count} article${count > 1 ? 's' : ''})`}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{label}</span>
              <span className="bg-white/30 px-1.5 py-0.5 rounded text-xs font-semibold">
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}