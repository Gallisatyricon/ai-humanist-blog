import { useState, useMemo } from 'react'

interface UseVirtualizedListProps<T> {
  items: T[]
  initialPageSize?: number
  incrementSize?: number
  virtualThreshold?: number // Seuil pour activer la virtualisation
}

interface VirtualizedListState<T> {
  displayedItems: T[]
  displayedCount: number
  totalCount: number
  canLoadMore: boolean
  isShowingAll: boolean
  remainingCount: number
  nextIncrement: number
  loadProgress: number
  shouldVirtualize: boolean
}

interface VirtualizedListActions {
  loadMore: () => void
  showAll: () => void
  showLess: () => void
  reset: () => void
}

export function useVirtualizedList<T>({
  items,
  initialPageSize = 12,
  incrementSize = 12,
  virtualThreshold = 100
}: UseVirtualizedListProps<T>): [VirtualizedListState<T>, VirtualizedListActions] {
  const [displayedCount, setDisplayedCount] = useState(initialPageSize)
  
  const state = useMemo<VirtualizedListState<T>>(() => {
    const actualDisplayCount = Math.min(displayedCount, items.length)
    const remainingCount = Math.max(0, items.length - actualDisplayCount)
    const shouldVirtualize = items.length > virtualThreshold
    
    return {
      displayedItems: items.slice(0, actualDisplayCount),
      displayedCount: actualDisplayCount,
      totalCount: items.length,
      canLoadMore: remainingCount > 0,
      isShowingAll: actualDisplayCount >= items.length,
      remainingCount,
      nextIncrement: Math.min(incrementSize, remainingCount),
      loadProgress: items.length > 0 ? (actualDisplayCount / items.length) * 100 : 0,
      shouldVirtualize
    }
  }, [items, displayedCount, incrementSize, virtualThreshold])

  const actions = useMemo<VirtualizedListActions>(() => ({
    loadMore: () => {
      setDisplayedCount(prev => Math.min(prev + incrementSize, items.length))
    },
    
    showAll: () => {
      setDisplayedCount(items.length)
    },
    
    showLess: () => {
      setDisplayedCount(initialPageSize)
    },
    
    reset: () => {
      setDisplayedCount(initialPageSize)
    }
  }), [incrementSize, items.length, initialPageSize])

  // Reset quand la liste d'items change
  useMemo(() => {
    setDisplayedCount(initialPageSize)
  }, [items.length, initialPageSize])

  return [state, actions]
}

// Hook spécialisé pour les performances avec de très grandes listes
export function usePerformanceOptimizedList<T>({
  items,
  initialPageSize = 12,
  incrementSize = 12
}: Omit<UseVirtualizedListProps<T>, 'virtualThreshold'>) {
  const [state, actions] = useVirtualizedList({
    items,
    initialPageSize,
    incrementSize,
    virtualThreshold: 50 // Seuil plus bas pour activation plus précoce
  })

  // Optimisations supplémentaires pour les grandes listes
  const optimizedActions = useMemo(() => ({
    ...actions,
    
    // Chargement par chunks plus intelligent
    loadMoreOptimized: () => {
      // Utilise l'action loadMore du hook principal plusieurs fois pour simuler un gros chunk
      const optimalIncrement = state.totalCount > 200 
        ? Math.min(20, state.remainingCount) 
        : incrementSize
      
      const iterations = Math.ceil(optimalIncrement / incrementSize)
      for (let i = 0; i < iterations && state.canLoadMore; i++) {
        actions.loadMore()
      }
    },
    
    // Chargement adaptatif basé sur la taille de l'écran
    loadMoreAdaptive: () => {
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800
      const approximateCardHeight = 280 // Estimation hauteur ArticleCard
      const cardsPerScreen = Math.floor(screenHeight / approximateCardHeight) * 3 // 3 colonnes
      const adaptiveIncrement = Math.max(cardsPerScreen, incrementSize)
      
      const iterations = Math.ceil(adaptiveIncrement / incrementSize)
      for (let i = 0; i < iterations && state.canLoadMore; i++) {
        actions.loadMore()
      }
    }
  }), [actions, state, incrementSize])

  return [state, optimizedActions]
}