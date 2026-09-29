import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
} from "d3-force"
import { randomLcg } from "d3-random"
import type { Node, Edge } from "@xyflow/react"

export const LAYOUT_CONFIG = {
  forceLinkDistance: 170,
  forceLinkStrength: 0.6,
  forceManyBodyStrength: -700,
  forceManyBodyDistanceMax: 600,
  forceCollidePadding: 24,
  gravityStrength: 0.05,
  clusterPullStrength: 0.08,
  circleRepulsion: -800,
  circleRepulsionDistance: 600,
  dirMinDx: 220,
  dirStrength: 0.3,
  iterationsMain: 300,
  iterationsLocal: 60,
  componentGap: 90,
  randomSeed: 42,
  defaultPersonWidth: 120,
  defaultPersonHeight: 46,
  defaultCircleWidth: 130,
  defaultCircleHeight: 50,
}

// Simple hash for deterministic initial placement
function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0
  }
  return hash
}

export type LayoutOptions = {
  resetPins?: boolean
  localMode?: boolean
}

type SimNode = {
  id: string
  x: number
  y: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
  width: number
  height: number
  type: string
  isPinned: boolean
}

type SimLink = {
  source: SimNode | string
  target: SimNode | string
}

function getDimensions(n: Node) {
  const isCircle = n.type === "cluster"
  const width = n.measured?.width || (isCircle ? LAYOUT_CONFIG.defaultCircleWidth : LAYOUT_CONFIG.defaultPersonWidth)
  const height = n.measured?.height || (isCircle ? LAYOUT_CONFIG.defaultCircleHeight : LAYOUT_CONFIG.defaultPersonHeight)
  return { width, height }
}

export function computeLayout(originalNodes: Node[], originalEdges: Edge[], options: LayoutOptions = {}): Map<string, { x: number, y: number }> {
  // Determinism: Sort inputs by ID
  const nodes = [...originalNodes].sort((a, b) => a.id.localeCompare(b.id))
  const edges = [...originalEdges].sort((a, b) => a.id.localeCompare(b.id))

  const adj = new Map<string, Set<string>>()
  nodes.forEach(n => adj.set(n.id, new Set()))
  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.add(e.target)
      adj.get(e.target)!.add(e.source)
    }
  })

  const visited = new Set<string>()
  const components: string[][] = []

  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      const comp: string[] = []
      const queue = [n.id]
      visited.add(n.id)
      while (queue.length > 0) {
        const curr = queue.shift()!
        comp.push(curr)
        const neighbors = adj.get(curr) || new Set()
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
          }
        })
      }
      comp.sort((a, b) => a.localeCompare(b))
      components.push(comp)
    }
  })

  // Tie-break component sorting by first node ID
  components.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]))

  const rng = randomLcg(LAYOUT_CONFIG.randomSeed)
  const finalPositions = new Map<string, { x: number, y: number }>()
  const allCircleIds = new Set(nodes.filter(n => n.type === "cluster").map(n => n.id))

  const compBoxes: { id: string; minX: number; maxX: number; minY: number; maxY: number; nodes: SimNode[] }[] = []

  for (const comp of components) {
    const compNodes = nodes.filter(n => comp.includes(n.id))
    
    const simNodes: SimNode[] = compNodes.map(n => {
      const { width, height } = getDimensions(n)
      
      const isPinned = !options.resetPins && !!n.data?.manuallyPositioned
      
      let x = n.position.x + width / 2
      let y = n.position.y + height / 2

      // If resetPins, ignore current positions completely and use seeded start
      if (options.resetPins || (n.position.x === 0 && n.position.y === 0 && !isPinned)) {
        let cx = 0, cy = 0, count = 0
        if (!options.resetPins) {
          const neighbors = adj.get(n.id) || new Set()
          neighbors.forEach(neighborId => {
            const neighbor = nodes.find(x => x.id === neighborId)
            if (neighbor && (neighbor.position.x !== 0 || neighbor.position.y !== 0)) {
              const dim = getDimensions(neighbor)
              cx += neighbor.position.x + dim.width / 2
              cy += neighbor.position.y + dim.height / 2
              count++
            }
          })
        }
        
        if (count > 0 && !options.resetPins) {
          const offset = (hashString(n.id) % 100) - 50
          x = (cx / count) + offset
          y = (cy / count) + offset
        } else {
          const angle = (hashString(n.id) % 360) * (Math.PI / 180)
          x = Math.cos(angle) * 200
          y = Math.sin(angle) * 200
        }
      }

      return {
        id: n.id,
        type: n.type || "person",
        width,
        height,
        x,
        y,
        vx: 0,
        vy: 0,
        fx: isPinned ? x : null,
        fy: isPinned ? y : null,
        isPinned
      }
    })

    const compEdges = edges.filter(e => comp.includes(e.source) && comp.includes(e.target))
    const simLinks: SimLink[] = compEdges.map(e => ({ source: e.source, target: e.target }))
    const simNodesMap = new Map(simNodes.map(n => [n.id, n]))

    const clusterPullForce = (alpha: number) => {
      for (const n of simNodes) {
        if (n.type === "person" && !n.isPinned) {
          let cx = 0, cy = 0, count = 0
          const neighbors = adj.get(n.id) || new Set()
          neighbors.forEach(neighborId => {
            if (allCircleIds.has(neighborId)) {
              const cn = simNodesMap.get(neighborId)
              if (cn) { cx += cn.x; cy += cn.y; count++ }
            }
          })
          if (count > 0) {
            cx /= count; cy /= count
            n.vx! += (cx - n.x) * LAYOUT_CONFIG.clusterPullStrength * alpha
            n.vy! += (cy - n.y) * LAYOUT_CONFIG.clusterPullStrength * alpha
          }
        }
      }
    }

    const circleRepulsionForce = (alpha: number) => {
      const circles = simNodes.filter(n => n.type === "cluster")
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const a = circles[i], b = circles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < LAYOUT_CONFIG.circleRepulsionDistance) {
            const force = (LAYOUT_CONFIG.circleRepulsionDistance - dist) / dist * alpha * (LAYOUT_CONFIG.circleRepulsion / -1000)
            const fX = dx * force, fY = dy * force
            if (!a.isPinned) { a.vx! += fX; a.vy! += fY }
            if (!b.isPinned) { b.vx! -= fX; b.vy! -= fY }
          }
        }
      }
    }

    const directionForce = (alpha: number) => {
      for (const link of simLinks) {
        const s = typeof link.source === 'string' ? simNodesMap.get(link.source) : link.source
        const t = typeof link.target === 'string' ? simNodesMap.get(link.target) : link.target
        if (s && t) {
          const dx = t.x - s.x
          if (dx < LAYOUT_CONFIG.dirMinDx) {
            const force = (LAYOUT_CONFIG.dirMinDx - dx) * alpha * LAYOUT_CONFIG.dirStrength
            if (!s.isPinned) s.vx! -= force
            if (!t.isPinned) t.vx! += force
          }
        }
      }
    }

    const sim = forceSimulation<SimNode>(simNodes)
      .randomSource(rng)
      .force("link", forceLink(simLinks).id((d: any) => d.id).distance(LAYOUT_CONFIG.forceLinkDistance).strength(LAYOUT_CONFIG.forceLinkStrength))
      .force("charge", forceManyBody().strength(LAYOUT_CONFIG.forceManyBodyStrength).distanceMax(LAYOUT_CONFIG.forceManyBodyDistanceMax))
      .force("collide", forceCollide<SimNode>().radius(d => Math.sqrt(d.width * d.width + d.height * d.height) / 2 + LAYOUT_CONFIG.forceCollidePadding).iterations(2))
      .force("x", forceX(0).strength(LAYOUT_CONFIG.gravityStrength))
      .force("y", forceY(0).strength(LAYOUT_CONFIG.gravityStrength))
      .force("clusterPull", clusterPullForce)
      .force("circleRepulsion", circleRepulsionForce)
      .force("direction", directionForce)
      .stop()

    // Tidy uses lower alpha to refine without destroying layout, Reset uses full alpha
    const isFirstLoad = !options.resetPins && !options.localMode && nodes.some(n => n.position.x === 0 && n.position.y === 0 && !n.data?.manuallyPositioned)
    const startAlpha = options.resetPins || isFirstLoad ? 1 : 0.3
    
    sim.alpha(startAlpha)

    const iterations = options.localMode ? LAYOUT_CONFIG.iterationsLocal : LAYOUT_CONFIG.iterationsMain
    sim.tick(iterations)

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    simNodes.forEach(n => {
      minX = Math.min(minX, n.x - n.width / 2)
      maxX = Math.max(maxX, n.x + n.width / 2)
      minY = Math.min(minY, n.y - n.height / 2)
      maxY = Math.max(maxY, n.y + n.height / 2)
    })
    
    if (minX === Infinity) { minX = 0; maxX = 0; minY = 0; maxY = 0 }
    compBoxes.push({ id: comp[0], minX, maxX, minY, maxY, nodes: simNodes })
  }

  // 16:9 Packing
  if (options.localMode) {
    compBoxes.forEach(box => {
      box.nodes.forEach(n => {
        finalPositions.set(n.id, { x: n.x - n.width / 2, y: n.y - n.height / 2 })
      })
    })
  } else {
    // Pack components in rows aiming for a 16:9 ratio
    const totalArea = compBoxes.reduce((sum, b) => sum + (b.maxX - b.minX) * (b.maxY - b.minY), 0)
    const targetWidth = Math.max(800, Math.sqrt(totalArea * (16 / 9)))
    
    let currentX = 0
    let currentY = 0
    let currentRowHeight = 0
    
    compBoxes.forEach((box, i) => {
      const compWidth = box.maxX - box.minX
      const compHeight = box.maxY - box.minY
      
      if (i > 0 && currentX + compWidth > targetWidth) {
        currentX = 0
        currentY += currentRowHeight + LAYOUT_CONFIG.componentGap
        currentRowHeight = 0
      }
      
      const offsetX = currentX - box.minX
      const offsetY = currentY - box.minY
      
      box.nodes.forEach(n => {
        finalPositions.set(n.id, {
          x: n.x + offsetX - n.width / 2,
          y: n.y + offsetY - n.height / 2
        })
      })
      
      currentX += compWidth + LAYOUT_CONFIG.componentGap
      currentRowHeight = Math.max(currentRowHeight, compHeight)
    })
  }

  return finalPositions
}
