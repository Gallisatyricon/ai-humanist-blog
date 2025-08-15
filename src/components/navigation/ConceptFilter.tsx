import React from 'react'
import { Article } from '@/data/schema'

interface ConceptFilterProps {
  articles: Article[]
  selectedConcepts: string[]
  onConceptSelect: (conceptType: string) => void
}

interface ConceptType {
  type: 'technical' | 'philosophical' | 'methodological'
  emoji: string
  label: string
  count: number
  color: string
}

export const ConceptFilter: React.FC<ConceptFilterProps> = ({
  articles,
  selectedConcepts,
  onConceptSelect
}) => {
  // Calculer les compteurs par type de concept
  const conceptTypes = React.useMemo(() => {
    const typeCounts = { technical: 0, philosophical: 0, methodological: 0 }
    
    articles.forEach(article => {
      if (article.concepts && Array.isArray(article.concepts)) {
        const articleTypes = new Set<string>()
        article.concepts.forEach(concept => {
          articleTypes.add(concept.type)
        })
        // Compter l'article pour chaque type de concept qu'il contient
        articleTypes.forEach(type => {
          if (type in typeCounts) {
            typeCounts[type as keyof typeof typeCounts]++
          }
        })
      }
    })

    const types: ConceptType[] = [
      {
        type: 'technical',
        emoji: '🔧',
        label: 'Techniques',
        count: typeCounts.technical,
        color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
      },
      {
        type: 'philosophical', 
        emoji: '🧠',
        label: 'Théoriques',
        count: typeCounts.philosophical,
        color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
      },
      {
        type: 'methodological',
        emoji: '📊', 
        label: 'Méthodologiques',
        count: typeCounts.methodological,
        color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      }
    ]

    return types.filter(type => type.count > 0)
  }, [articles])

  const totalSelectedConcepts = selectedConcepts.length

  if (conceptTypes.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-600">
        Concepts avancés
        {totalSelectedConcepts > 0 && (
          <span className="ml-2 bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold">
            {totalSelectedConcepts}
          </span>
        )}
      </h4>
      <div className="flex flex-wrap gap-1">
        {conceptTypes.map(type => {
          const isSelected = selectedConcepts.includes(type.type)
          
          return (
            <button
              key={type.type}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200
                ${isSelected 
                  ? `${type.color} ring-2 ring-opacity-50 ring-current` 
                  : `${type.color.replace('800', '600')} opacity-70 hover:opacity-100`
                }
              `}
              onClick={() => onConceptSelect(type.type)}
              aria-pressed={isSelected}
              title={`${type.label} (${type.count} article${type.count > 1 ? 's' : ''})`}
            >
              <span aria-hidden="true">{type.emoji}</span>
              <span>{type.label}</span>
              <span className="bg-white/30 px-1.5 py-0.5 rounded text-xs font-semibold">
                {type.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}