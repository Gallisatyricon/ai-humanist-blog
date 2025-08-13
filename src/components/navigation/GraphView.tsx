import React, { useRef, useEffect } from 'react'
import { select } from 'd3-selection'
import { forceSimulation, forceLink, forceManyBody, forceCenter, Simulation } from 'd3-force'
import { Article, GraphNode, GraphLink } from '@/data/schema'
import { DOMAIN_COLORS, CONNECTION_COLORS } from '@/config/navigation'
import { useGraphData } from '@/hooks/useGraphData'

interface GraphViewProps {
  articles: Article[]
  filteredArticles: Article[]
  selectedArticle: Article | null
  onArticleSelect: (article: Article | null) => void
  width?: number
  height?: number
}

export const GraphView: React.FC<GraphViewProps> = ({
  articles,
  filteredArticles,
  selectedArticle,
  onArticleSelect,
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  
  const { nodes, links, stats, isGenerating } = useGraphData(
    articles,
    selectedArticle,
    filteredArticles
  )


  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous render

    // Créer les groupes
    const linkGroup = svg.append('g').attr('class', 'links')
    const nodeGroup = svg.append('g').attr('class', 'nodes')
    const labelGroup = svg.append('g').attr('class', 'labels')

    // Initialisation avec distribution plus naturelle et aléatoire
    nodes.forEach((d, i) => {
      if (d.x === undefined || d.y === undefined || isNaN(d.x) || isNaN(d.y)) {
        // Position initiale avec randomisation pour éviter l'alignement
        const angle = (i / nodes.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.8 // Ajout de bruit
        const radius = 60 + Math.random() * 40 // Rayon variable 60-100px
        const centerX = (width - 220 + 80) / 2 // Centre dans la zone utile
        const centerY = height / 2
        
        d.x = centerX + Math.cos(angle) * radius
        d.y = centerY + Math.sin(angle) * radius
        
        // Ajout de bruit supplémentaire pour casser la géométrie
        d.x += (Math.random() - 0.5) * 30
        d.y += (Math.random() - 0.5) * 30
      }
    })

    // Espacement drastiquement augmenté pour résoudre la densité excessive
    const nodeCount = nodes.length
    const baseDistance = nodeCount > 15 ? 220 : nodeCount > 8 ? 180 : 140
    const repulsionStrength = nodeCount > 15 ? -900 : nodeCount > 8 ? -700 : -500
    const linkStrengthMultiplier = nodeCount > 15 ? 0.1 : nodeCount > 8 ? 0.2 : 0.25
    const collisionDistance = nodeCount > 15 ? 150 : nodeCount > 8 ? 120 : 100
    
    // Simulation D3 avec forces plus organiques
    const simulation: Simulation<GraphNode, GraphLink> = forceSimulation(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .strength(d => d.strength * linkStrengthMultiplier)
        .distance(d => baseDistance + (80 / (d.strength + 0.1)) + Math.random() * 20) // Distance variable
      )
      .force('charge', forceManyBody().strength(repulsionStrength))
      .force('center', forceCenter((width - 220 + 80) / 2, height / 2)) // Centre dans zone utile
      .force('collision', forceManyBody().strength(-120).distanceMax(collisionDistance))
      // Ajout d'une force de bruit pour casser les alignements
      .force('noise', () => {
        nodes.forEach(d => {
          if (d.x && d.y) {
            d.x += (Math.random() - 0.5) * 0.5
            d.y += (Math.random() - 0.5) * 0.5
          }
        })
      })
      .force('boundary', () => {
        const leftMargin = 80 // Marge gauche augmentée pour éviter débordement
        const rightMargin = 220 // Marge droite ajustée pour la légende
        const topBottomMargin = 80 + (nodeCount > 15 ? 20 : 0)
        
        nodes.forEach(d => {
          if (d.x !== undefined && !isNaN(d.x)) {
            d.x = Math.max(leftMargin, Math.min(width - rightMargin, d.x))
          } else {
            d.x = (width - rightMargin + leftMargin) / 2 + (Math.random() - 0.5) * 20
          }
          if (d.y !== undefined && !isNaN(d.y)) {
            d.y = Math.max(topBottomMargin, Math.min(height - topBottomMargin, d.y))
          } else {
            d.y = height / 2 + (Math.random() - 0.5) * 20
          }
        })
      })
      .alpha(0.4)
      .alphaDecay(0.015)
      .velocityDecay(0.85)

    // Dessiner les liens
    const linkElements = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => CONNECTION_COLORS[d.type] || '#999')
      .attr('stroke-width', d => Math.max(d.strength * 4, 1))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', d => d.auto_detected ? '5,5' : 'none')
      .style('opacity', 0)
      .style('transition', 'opacity 0.8s ease')
      .style('animation', (_d, i) => `fadeInLink 0.8s ease ${i * 0.05}s forwards`)

    // Dessiner les nœuds avec animation CSS
    const nodeElements = nodeGroup
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => isNaN(d.radius) ? 10 : d.radius)
      .attr('fill', d => DOMAIN_COLORS[d.article.primary_domain] || '#999')
      .attr('stroke', d => {
        if (d.id === selectedArticle?.id) return '#000'
        return '#fff'
      })
      .attr('stroke-width', d => {
        if (d.id === selectedArticle?.id) return 3
        return 1
      })
      .attr('opacity', d => {
        if (!selectedArticle) return 1
        if (d.id === selectedArticle.id) return 1
        // Réduire l'opacité des nœuds non connectés
        const isConnected = links.some(link => 
          (link.source as any).id === selectedArticle.id && (link.target as any).id === d.id ||
          (link.target as any).id === selectedArticle.id && (link.source as any).id === d.id
        )
        return isConnected ? 1 : 0.3
      })
      .style('cursor', 'pointer')
      .attr('class', 'graph-node')
      .style('transform', 'scale(0)')
      .style('transform-origin', 'center center')
      .style('transition', 'transform 0.6s ease, stroke 0.2s ease')
      .style('animation', (_d, i) => `scaleInNode 0.6s ease ${i * 0.1}s forwards`)

    // Labels des nœuds avec animation CSS
    const labelElements = labelGroup
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text(d => {
        const title = d.article.title
        return title.length > 30 ? title.substring(0, 30) + '...' : title
      })
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .attr('pointer-events', 'none')
      .style('opacity', 0)
      .style('transition', 'opacity 0.8s ease')
      .style('animation', (_d, i) => `fadeInLabel 0.8s ease ${i * 0.12 + 0.4}s forwards`)
      .attr('opacity', d => {
        // Affichage ultra-sélectif des labels pour éviter chevauchements
        if (d.id === selectedArticle?.id) return 1
        
        // En mode sélection : seulement les nœuds connectés directs
        if (selectedArticle) {
          const isConnected = links.some(link => 
            ((link.source as any).id === selectedArticle.id && (link.target as any).id === d.id) ||
            ((link.target as any).id === selectedArticle.id && (link.source as any).id === d.id)
          )
          return isConnected ? 0.9 : 0
        }
        
        // En mode vue d'ensemble : TRES réductif - max 3-4 labels
        
        // Seulement les 3 nœuds les plus centraux
        const topNodes = nodes
          .sort((a, b) => (b.article.centrality_score || 0) - (a.article.centrality_score || 0))
          .slice(0, 3)
          .map(n => n.id)
        
        return topNodes.includes(d.id) ? 0.8 : 0
      })

    // Obtenir la sélection finale après la transition pour les interactions
    const finalNodeElements = nodeGroup.selectAll('circle')

    // Interactions des nœuds - optimisées pour éviter le flicker
    finalNodeElements
      .on('mouseover', function(event, d) {
        // Effet hover direct sans re-rendu complet
        select(this)
          .attr('stroke', '#333')
          .attr('stroke-width', 2)
        
        // Tooltip
        const tooltip = svg
          .append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${event.layerX + 10}, ${event.layerY - 10})`)
        
        const rect = tooltip
          .append('rect')
          .attr('fill', 'rgba(0,0,0,0.8)')
          .attr('rx', 4)
          .attr('ry', 4)
        
        const text = tooltip
          .append('text')
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .attr('x', 8)
          .attr('y', 16)
        
        text.append('tspan')
          .attr('x', 8)
          .attr('dy', 0)
          .attr('font-weight', 'bold')
          .text((d as any).article.title)
        
        text.append('tspan')
          .attr('x', 8)
          .attr('dy', 16)
          .text(`${(d as any).article.primary_domain} • ${(d as any).article.reading_time}min`)
        
        text.append('tspan')
          .attr('x', 8)
          .attr('dy', 14)
          .text(`Importance: ${Math.round((d as any).article.centrality_score * 100)}%`)
        
        // Ajuster la taille du rectangle
        const bbox = (text.node() as any).getBBox()
        rect
          .attr('width', bbox.width + 16)
          .attr('height', bbox.height + 8)
      })
      .on('mouseout', function(_event, d) {
        // Restaurer l'apparence originale
        select(this)
          .attr('stroke', (d as any).id === selectedArticle?.id ? '#000' : '#fff')
          .attr('stroke-width', (d as any).id === selectedArticle?.id ? 3 : 1)
        
        svg.selectAll('.tooltip').remove()
      })
      .on('click', (event, d) => {
        event.stopPropagation()
        onArticleSelect((d as any).article)
      })

    // Force de séparation simple entre nœuds seulement
    const nodeSeparationForce = () => {
      const alpha = simulation.alpha()
      if (alpha < 0.05) return
      
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          if (!a.x || !a.y || !b.x || !b.y) return
          
          const dx = b.x - a.x
          const dy = b.y - a.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const minNodeDistance = 100 // Distance minimale entre nœuds
          
          if (distance < minNodeDistance && distance > 0) {
            const force = (minNodeDistance - distance) / distance * 0.05
            const fx = dx * force
            const fy = dy * force
            
            b.x! += fx
            b.y! += fy
            a.x! -= fx
            a.y! -= fy
          }
        })
      })
    }
    
    // Animation de la simulation
    simulation.on('tick', () => {
      nodeSeparationForce() // Appliquer la séparation des nœuds
      
      linkElements
        .attr('x1', d => {
          const x = (d.source as any).x
          return isNaN(x) ? width / 2 : x
        })
        .attr('y1', d => {
          const y = (d.source as any).y
          return isNaN(y) ? height / 2 : y
        })
        .attr('x2', d => {
          const x = (d.target as any).x
          return isNaN(x) ? width / 2 : x
        })
        .attr('y2', d => {
          const y = (d.target as any).y
          return isNaN(y) ? height / 2 : y
        })

      nodeElements
        .attr('cx', d => isNaN(d.x!) ? width / 2 : d.x!)
        .attr('cy', d => isNaN(d.y!) ? height / 2 : d.y!)
      
      // Positionnement simple des labels - pas de logique complexe
      labelElements
        .attr('x', d => isNaN(d.x!) ? (width - 250 + 60) / 2 : d.x!)
        .attr('y', d => {
          const y = isNaN(d.y!) ? height / 2 : d.y!
          const radius = isNaN(d.radius) ? 10 : d.radius
          return y + radius + 18 // Position fixe sous le nœud
        })
    })

    // Click sur le fond pour désélectionner
    svg.on('click', () => {
      onArticleSelect(null)
    })

    // Cleanup
    return () => {
      simulation.stop()
    }

  }, [nodes, links, selectedArticle, width, height, onArticleSelect])

  if (isGenerating) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Génération du graphique...</p>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p>Aucun article à afficher</p>
          <p className="text-sm">Ajustez vos filtres ou sélectionnez un domaine</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Animations CSS pour le graphique */}
      <style>{`
        @keyframes fadeInLink {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleInNode {
          from { 
            transform: scale(0);
            transform-origin: center center;
          }
          to { 
            transform: scale(1);
            transform-origin: center center;
          }
        }
        
        @keyframes fadeInLabel {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
        viewBox={`0 0 ${width} ${height}`}
      />
      
      {/* Informations du graphique */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-medium">{stats.totalNodes} articles</span>
          <span>{stats.totalLinks} connexions</span>
          {selectedArticle && (
            <span className="text-blue-600">
              Mode focus: {selectedArticle.title.substring(0, 20)}...
            </span>
          )}
        </div>
      </div>

      {/* Légende des connexions - améliorée */}
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg border border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">Types de connexions</div>
        <div className="grid grid-cols-1 gap-1.5">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-1 rounded-full border"
              style={{
                backgroundColor: CONNECTION_COLORS.builds_on,
                borderColor: CONNECTION_COLORS.builds_on
              }}
            ></div>
            <span className="text-gray-700">S'appuie sur</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-1 rounded-full border"
              style={{
                backgroundColor: CONNECTION_COLORS.contradicts,
                borderColor: CONNECTION_COLORS.contradicts
              }}
            ></div>
            <span className="text-gray-700">Contredit</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-1 rounded-full border"
              style={{
                backgroundColor: CONNECTION_COLORS.implements,
                borderColor: CONNECTION_COLORS.implements
              }}
            ></div>
            <span className="text-gray-700">Implémente</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-1 rounded-full border"
              style={{
                backgroundColor: CONNECTION_COLORS.questions,
                borderColor: CONNECTION_COLORS.questions
              }}
            ></div>
            <span className="text-gray-700">Questionne</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-1 rounded-full border"
              style={{
                backgroundColor: CONNECTION_COLORS.similar_to,
                borderColor: CONNECTION_COLORS.similar_to
              }}
            ></div>
            <span className="text-gray-700">Similaire</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-4 h-0.5 bg-gray-300 border border-gray-400" style={{borderStyle: 'dashed'}}></div>
            <span>Auto-détecté</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600">
        💡 Cliquez sur un article pour explorer ses connexions
      </div>
    </div>
  )
}