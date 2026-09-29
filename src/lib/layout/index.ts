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
  iterationsMain: 300,
  iterationsLocal: 60,
  componentGap: 120,
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
  fx?: number | null
  fy?: number | null
  width: number
  height: number
  type: string
  isPinned: boolean
}

type SimLink = {
  source: string | SimNode
  target: string | SimNode
}

function getDimensions(n: Node) {
  const isCircle = n.type === "cluster"
  const width = n.measured?.width || (isCircle ? LAYOUT_CONFIG.defaultCircleWidth : LAYOUT_CONFIG.defaultPersonWidth)
  const height = n.measured?.height || (isCircle ? LAYOUT_CONFIG.defaultCircleHeight : LAYOUT_CONFIG.defaultPersonHeight)
  return { width, height }
}

export function computeLayout(nodes: Node[], edges: Edge[], options: LayoutOptions = {}): Map<string, { x: number, y: number }> {
  // 1. Map to adjacency list to find connected components
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
      components.push(comp)
    }
  })

  // Sort components by size descending, so largest is in the center
  components.sort((a, b) => b.length - a.length)

  const rng = randomLcg(LAYOUT_CONFIG.randomSeed)
  const finalPositions = new Map<string, { x: number, y: number }>()

  let nextComponentOffsetX = 0
  
  const allCircleIds = new Set(nodes.filter(n => n.type === "cluster").map(n => n.id))

  for (const comp of components) {
    if (comp.length === 1 && !options.localMode) {
      // Handle singletons in a grid later, or just lay them out simply
      // We will just let them process but maybe offset them neatly
    }

    const compNodes = nodes.filter(n => comp.includes(n.id))
    
    // Convert to SimNodes
    const simNodes: SimNode[] = compNodes.map(n => {
      const { width, height } = getDimensions(n)
      
      // Determine if pinned (user manually moved it, meaning position was saved manually)
      // For now, if resetPins is true, unpin all. Otherwise, if n.data.manuallyPositioned, pin it.
      // We'll also treat any node that lacks manuallyPositioned as unpinned, BUT we give it a warm start if it has a position.
      const isPinned = !options.resetPins && !!n.data?.manuallyPositioned
      
      let x = n.position.x + width / 2
      let y = n.position.y + height / 2

      // If it's a new node (0,0), give it a warm start near neighbors, or a deterministic start
      if (n.position.x === 0 && n.position.y === 0 && !isPinned) {
        let cx = 0, cy = 0, count = 0
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
        
        if (count > 0) {
          // Warm start near neighbors with slight deterministic offset
          const offset = (hashString(n.id) % 100) - 50
          x = (cx / count) + offset
          y = (cy / count) + offset
        } else {
          // Deterministic ring layout for completely disconnected new nodes
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
        fx: isPinned ? x : null,
        fy: isPinned ? y : null,
        isPinned
      }
    })

    const compEdges = edges.filter(e => comp.includes(e.source) && comp.includes(e.target))
    const simLinks: SimLink[] = compEdges.map(e => ({ source: e.source, target: e.target }))

    const simNodesMap = new Map(simNodes.map(n => [n.id, n]))

    // Custom Forces
    // 1. Cluster pull: people pulled to the average of their circles
    const clusterPullForce = (alpha: number) => {
      for (const n of simNodes) {
        if (n.type === "person" && !n.isPinned) {
          let cx = 0, cy = 0, count = 0
          const neighbors = adj.get(n.id) || new Set()
          neighbors.forEach(neighborId => {
            if (allCircleIds.has(neighborId)) {
              const cn = simNodesMap.get(neighborId)
              if (cn) {
                cx += cn.x
                cy += cn.y
                count++
              }
            }
          })
          if (count > 0) {
            cx /= count
            cy /= count
            n.x += (cx - n.x) * LAYOUT_CONFIG.clusterPullStrength * alpha
            n.y += (cy - n.y) * LAYOUT_CONFIG.clusterPullStrength * alpha
          }
        }
      }
    }

    // 2. Extra circle repulsion
    const circleRepulsionForce = (alpha: number) => {
      const circles = simNodes.filter(n => n.type === "cluster")
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const a = circles[i]
          const b = circles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < LAYOUT_CONFIG.circleRepulsionDistance) {
            const force = (LAYOUT_CONFIG.circleRepulsionDistance - dist) / dist * alpha * (LAYOUT_CONFIG.circleRepulsion / -1000)
            const fX = dx * force
            const fY = dy * force
            if (!a.isPinned) { a.x += fX; a.y += fY }
            if (!b.isPinned) { b.x -= fX; b.y -= fY }
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
      .stop()

    const iterations = options.localMode ? LAYOUT_CONFIG.iterationsLocal : LAYOUT_CONFIG.iterationsMain
    sim.tick(iterations)

    // Compute bounding box of this component to pack it
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    simNodes.forEach(n => {
      minX = Math.min(minX, n.x - n.width / 2)
      maxX = Math.max(maxX, n.x + n.width / 2)
      minY = Math.min(minY, n.y - n.height / 2)
      maxY = Math.max(maxY, n.y + n.height / 2)
    })
    
    // Fallback if empty
    if (minX === Infinity) { minX = 0; maxX = 0; minY = 0; maxY = 0 }

    const compWidth = maxX - minX

    // If localMode is on, we don't offset components, we just leave them where they landed
    // (since localMode implies we are just gently settling a new node into the existing space)
    const offsetX = options.localMode ? 0 : nextComponentOffsetX - minX

    simNodes.forEach(n => {
      // Convert center back to top-left
      const finalX = (n.x + offsetX) - n.width / 2
      const finalY = n.y - n.height / 2
      finalPositions.set(n.id, { x: finalX, y: finalY })
    })

    if (!options.localMode) {
      nextComponentOffsetX += compWidth + LAYOUT_CONFIG.componentGap
    }
  }

  return finalPositions
}
