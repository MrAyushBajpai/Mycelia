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
  forceLinkDistance: 200,
  forceCollidePadding: 24,
  gravityStrength: 0.05,
  componentGap: 90,
  randomSeed: 42,
  defaultPersonWidth: 120,
  defaultPersonHeight: 46,
  defaultCircleWidth: 130,
  defaultCircleHeight: 50,
  targetAspect: 16 / 9,
  columnGap: 260
}

function getDimensions(n: Node) {
  const isCircle = n.type === "circle"
  const w = n.measured?.width || (isCircle ? LAYOUT_CONFIG.defaultCircleWidth : LAYOUT_CONFIG.defaultPersonWidth)
  const h = n.measured?.height || (isCircle ? LAYOUT_CONFIG.defaultCircleHeight : LAYOUT_CONFIG.defaultPersonHeight)
  return { w, h }
}

export function computeLayout(
  nodes: Node[],
  edges: Edge[],
  options: { resetPins?: boolean; localMode?: boolean; seed?: number } = {}
): Node[] {
  if (nodes.length === 0) return []
  const { resetPins = false, localMode = false, seed = LAYOUT_CONFIG.randomSeed } = options
  const randomSource = randomLcg(seed)

  // 1. Sort for determinism
  const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id))
  const sortedEdges = [...edges].sort((a, b) => a.id.localeCompare(b.id) || a.source.localeCompare(b.source) || a.target.localeCompare(b.target))

  // 2. Component extraction
  const undirectedAdj = new Map<string, string[]>()
  sortedNodes.forEach(n => undirectedAdj.set(n.id, []))
  sortedEdges.forEach(e => {
    if (undirectedAdj.has(e.source) && undirectedAdj.has(e.target)) {
      undirectedAdj.get(e.source)!.push(e.target)
      undirectedAdj.get(e.target)!.push(e.source)
    }
  })

  const components: { id: string; nodes: Node[] }[] = []
  const visited = new Set<string>()
  for (const n of sortedNodes) {
    if (visited.has(n.id)) continue
    const compNodes: Node[] = []
    const q = [n.id]
    visited.add(n.id)
    while (q.length > 0) {
      const u = q.shift()!
      compNodes.push(sortedNodes.find(sn => sn.id === u)!)
      for (const v of undirectedAdj.get(u) || []) {
        if (!visited.has(v)) {
          visited.add(v)
          q.push(v)
        }
      }
    }
    components.push({
      id: compNodes.sort((a, b) => a.id.localeCompare(b.id))[0].id,
      nodes: compNodes
    })
  }
  components.sort((a, b) => a.id.localeCompare(b.id))

  // 3. Ranks via DFS (per component)
  const ranks = new Map<string, number>()
  for (const comp of components) {
    const compAdj = new Map<string, string[]>()
    comp.nodes.forEach(n => compAdj.set(n.id, []))
    sortedEdges.forEach(e => {
      if (compAdj.has(e.source) && compAdj.has(e.target)) {
        compAdj.get(e.source)!.push(e.target)
      }
    })

    const state = new Map<string, number>()
    const validEdges: { source: string; target: string }[] = []
    function breakCycles(u: string) {
      state.set(u, 1)
      for (const v of compAdj.get(u) || []) {
        if (state.get(v) === 1) continue
        validEdges.push({ source: u, target: v })
        if (state.get(v) !== 2) breakCycles(v)
      }
      state.set(u, 2)
    }
    comp.nodes.forEach(n => { if (state.get(n.id) !== 2) breakCycles(n.id) })

    const inDegree = new Map<string, number>()
    const dagAdj = new Map<string, string[]>()
    comp.nodes.forEach(n => {
      dagAdj.set(n.id, [])
      inDegree.set(n.id, 0)
      ranks.set(n.id, 0)
    })
    validEdges.forEach(e => {
      dagAdj.get(e.source)!.push(e.target)
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
    })

    const queue: string[] = []
    comp.nodes.forEach(n => { if (inDegree.get(n.id) === 0) queue.push(n.id) })
    while (queue.length > 0) {
      const u = queue.shift()!
      const r = ranks.get(u)!
      for (const v of dagAdj.get(u)!) {
        ranks.set(v, Math.max(ranks.get(v)!, r + 1))
        const deg = inDegree.get(v)! - 1
        inDegree.set(v, deg)
        if (deg === 0) queue.push(v)
      }
    }

    comp.nodes.forEach(n => {
      if ((inDegree.get(n.id) || 0) === 0) {
        const targets = dagAdj.get(n.id)!
        if (targets.length > 0) {
          let minT = Infinity
          targets.forEach(t => minT = Math.min(minT, ranks.get(t)!))
          ranks.set(n.id, minT - 1)
        }
      }
    })

    let minR = Infinity
    comp.nodes.forEach(n => minR = Math.min(minR, ranks.get(n.id)!))
    if (minR === Infinity) minR = 0
    comp.nodes.forEach(n => ranks.set(n.id, ranks.get(n.id)! - minR))
  }

  // 4. Force Simulation Setup
  const simNodes = sortedNodes.map(n => {
    const isPinned = !resetPins && n.data?.manuallyPositioned
    const rank = ranks.get(n.id) || 0
    const dim = getDimensions(n)
    return {
      id: n.id,
      x: resetPins ? rank * LAYOUT_CONFIG.columnGap : n.position.x,
      y: resetPins ? 0 : n.position.y,
      w: dim.w,
      h: dim.h,
      fx: isPinned ? n.position.x : null,
      fy: isPinned ? n.position.y : null,
      rank,
      isPinned,
      compId: components.find(c => c.nodes.some(cn => cn.id === n.id))!.id
    }
  })

  // Determine base offsets per component so forceX doesn't stretch/collapse them globally
  const compBaseX = new Map<string, number>()
  for (const comp of components) {
    if (resetPins) {
      compBaseX.set(comp.id, 0)
    } else {
      const cNodes = simNodes.filter(sn => sn.compId === comp.id)
      const pinned = cNodes.filter(sn => sn.isPinned)
      const referenceNodes = pinned.length > 0 ? pinned : cNodes
      let minBaseX = Infinity
      referenceNodes.forEach(sn => {
        const impliedBase = sn.x - sn.rank * LAYOUT_CONFIG.columnGap
        minBaseX = Math.min(minBaseX, impliedBase)
      })
      if (minBaseX === Infinity) minBaseX = 0
      compBaseX.set(comp.id, minBaseX)
    }
  }

  // Barycenter initialization for Y if resetting
  if (resetPins) {
    const maxR = Math.max(...simNodes.map(n => n.rank), 0)
    for (let r = 0; r <= maxR; r++) {
      const rNodes = simNodes.filter(n => n.rank === r)
      rNodes.sort((a, b) => {
        let aSum = 0, aCount = 0
        let bSum = 0, bCount = 0
        sortedEdges.forEach(e => {
          if (e.target === a.id) { const s = simNodes.find(sn => sn.id === e.source); if (s && s.rank < r) { aSum += s.y; aCount++; } }
          if (e.target === b.id) { const s = simNodes.find(sn => sn.id === e.source); if (s && s.rank < r) { bSum += s.y; bCount++; } }
        })
        const aAvg = aCount > 0 ? aSum / aCount : 0
        const bAvg = bCount > 0 ? bSum / bCount : 0
        return aAvg - bAvg || a.id.localeCompare(b.id)
      })
      rNodes.forEach((n, idx) => { n.y = (idx - Math.floor(rNodes.length / 2)) * 120 })
    }
  }

  const simEdges = sortedEdges.map(e => ({ source: e.source, target: e.target }))

  // Backup directional force
  const directionForce = (alpha: number) => {
    simEdges.forEach(e => {
      const s = simNodes.find(n => n.id === (e.source as any).id || n.id === e.source)
      const t = simNodes.find(n => n.id === (e.target as any).id || n.id === e.target)
      if (s && t && !t.isPinned) {
        if (t.x < s.x + LAYOUT_CONFIG.columnGap * 0.8) {
          ;(t as any).vx += (s.x + LAYOUT_CONFIG.columnGap * 0.8 - t.x) * alpha * 0.3
        }
      }
    })
  }

  const alpha = resetPins ? 1 : 0.3
  const sim = forceSimulation(simNodes as any)
    .randomSource(randomSource)
    .alpha(alpha)
    .force("link", forceLink(simEdges).id((d: any) => d.id).distance(LAYOUT_CONFIG.forceLinkDistance).strength(0.1))
    .force("x", forceX((d: any) => compBaseX.get(d.compId)! + d.rank * LAYOUT_CONFIG.columnGap).strength(0.6))
    .force("y", forceY((d: any) => resetPins ? 0 : d.y).strength(LAYOUT_CONFIG.gravityStrength))
    .force("collide", forceCollide((d: any) => Math.max(d.w, d.h) / 1.5 + LAYOUT_CONFIG.forceCollidePadding).iterations(3))
    .force("direction", directionForce)
    .stop()

  const ticks = resetPins ? 300 : (localMode ? 50 : 150)
  for (let i = 0; i < ticks; ++i) sim.tick()

  const posMap = new Map<string, {x: number, y: number, w: number, h: number, isPinned: boolean}>()
  simNodes.forEach(n => posMap.set(n.id, { x: n.x, y: n.y, w: n.w, h: n.h, isPinned: !!n.isPinned }))

  // 5. Pack Components (Shelf Packing)
  const compBounds = components.map(comp => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    let hasPinned = false
    comp.nodes.forEach(n => {
      const p = posMap.get(n.id)!
      if (p.isPinned) hasPinned = true
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x + p.w)
      maxY = Math.max(maxY, p.y + p.h)
    })
    return { 
      id: comp.id, nodes: comp.nodes, 
      x: minX, y: minY, w: maxX - minX, h: maxY - minY,
      area: (maxX - minX) * (maxY - minY), hasPinned
    }
  })

  let baseMaxX = 0, baseMinY = Infinity
  compBounds.forEach(c => {
    if (c.hasPinned) {
      baseMaxX = Math.max(baseMaxX, c.x + c.w)
      baseMinY = Math.min(baseMinY, c.y)
    }
  })
  if (baseMinY === Infinity) baseMinY = 0

  const unanchored = compBounds.filter(c => !c.hasPinned)
  unanchored.sort((a, b) => b.area - a.area || a.id.localeCompare(b.id))

  const totalArea = unanchored.reduce((sum, c) => sum + c.area, 0)
  const targetW = Math.max(800, Math.sqrt(totalArea * LAYOUT_CONFIG.targetAspect) * 1.2)

  const startX = compBounds.some(c => c.hasPinned) ? baseMaxX + LAYOUT_CONFIG.componentGap : 0
  let currentX = startX
  let currentY = baseMinY
  let shelfHeight = 0

  unanchored.forEach(c => {
    if (currentX - startX + c.w > targetW && currentX > startX) {
      currentX = startX
      currentY += shelfHeight + LAYOUT_CONFIG.componentGap
      shelfHeight = 0
    }
    const dx = currentX - c.x
    const dy = currentY - c.y
    c.nodes.forEach(n => {
      const p = posMap.get(n.id)!
      p.x += dx; p.y += dy
    })
    currentX += c.w + LAYOUT_CONFIG.componentGap
    shelfHeight = Math.max(shelfHeight, c.h)
  })

  const outNodes = sortedNodes.map(n => {
    const p = posMap.get(n.id)!
    return { ...n, position: { x: p.x, y: p.y } }
  })

  // 6. Dev Log Hash
  const hashStr = [...outNodes].sort((a,b)=>a.id.localeCompare(b.id))
    .map(n => `${n.id}:${Math.round(n.position.x)},${Math.round(n.position.y)}`)
    .join('|')
  let hash = 0
  for (let i = 0; i < hashStr.length; i++) {
    hash = ((hash << 5) - hash) + hashStr.charCodeAt(i)
    hash = Math.trunc(hash)
  }
  console.log(`[layout-hash] ${Math.abs(hash).toString(16)} | nodes: ${nodes.length}`)

  return outNodes
}
