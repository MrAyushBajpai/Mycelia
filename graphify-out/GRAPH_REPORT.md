# Graph Report - Mycelia  (2026-09-29)

## Corpus Check
- Corpus is ~5,535 words - fits in a single context window. You may not need a graph.

## Summary
- 205 nodes · 372 edges · 16 communities (11 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dialogs & Forms
- UI Components
- Command Bar & State
- Supabase Database
- TypeScript Config
- Project Dependencies
- React Flow Graph
- Dev Dependencies
- App Layout
- README & Logos
- Database Types
- PostCSS Config
- File Icon
- Globe Icon
- Window Icon

## God Nodes (most connected - your core abstractions)
1. `cn()` - 18 edges
2. `useGraphStore` - 17 edges
3. `Button()` - 16 edges
4. `compilerOptions` - 16 edges
5. `react` - 13 edges
6. `AddEdgeLabelDialog()` - 13 edges
7. `ContactDetail()` - 13 edges
8. `DialogContent()` - 13 edges
9. `AddClusterDialog()` - 12 edges
10. `AddPersonDialog()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Logo` --semantically_similar_to--> `Next.js`  [INFERRED] [semantically similar]
  public/next.svg → README.md
- `Vercel Logo` --semantically_similar_to--> `Vercel Platform`  [INFERRED] [semantically similar]
  public/vercel.svg → README.md
- `CommandBar()` --calls--> `Dialog()`  [EXTRACTED]
  src/components/command-bar.tsx → src/components/ui/dialog.tsx
- `CommandBar()` --calls--> `DialogContent()`  [EXTRACTED]
  src/components/command-bar.tsx → src/components/ui/dialog.tsx
- `CommandBar()` --calls--> `DialogTitle()`  [EXTRACTED]
  src/components/command-bar.tsx → src/components/ui/dialog.tsx

## Import Cycles
- None detected.

## Communities (16 total, 5 thin omitted)

### Community 0 - "Dialogs & Forms"
Cohesion: 0.17
Nodes (23): @base-ui/react, class-variance-authority, react, AddClusterDialog(), COLORS, Props, AddEdgeLabelDialog(), Props (+15 more)

### Community 1 - "UI Components"
Cohesion: 0.06
Nodes (26): eslintConfig, nextConfig, name, private, scripts, build, dev, lint (+18 more)

### Community 2 - "Command Bar & State"
Cohesion: 0.14
Nodes (16): lucide-react, zustand, Home(), SEED_EDGES, SEED_NODES, CommandBar(), GraphCanvas(), ContactDetail() (+8 more)

### Community 3 - "Supabase Database"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 4 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "Project Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, @base-ui/react, chrono-node, class-variance-authority, clsx, cn, lucide-react, next (+10 more)

### Community 6 - "React Flow Graph"
Cohesion: 0.22
Nodes (9): clsx, tailwind-merge, @xyflow/react, ClusterNode(), ClusterNodeData, defaultEdgeOptions, nodeTypes, PersonNode() (+1 more)

### Community 7 - "Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 8 - "App Layout"
Cohesion: 0.28
Nodes (7): @tanstack/react-query, src_app_globals, geistMono, geistSans, metadata, RootLayout(), Providers()

### Community 9 - "README & Logos"
Cohesion: 0.33
Nodes (6): Next.js Logo, Vercel Logo, create-next-app, Geist Font, Next.js, Vercel Platform

### Community 10 - "Database Types"
Cohesion: 0.33
Nodes (5): Cluster, Contact, ContactCluster, Edge, Interaction

## Knowledge Gaps
- **110 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 127 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Dialogs & Forms` to `App Layout`, `UI Components`, `Command Bar & State`, `React Flow Graph`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Project Dependencies` to `UI Components`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `@xyflow/react` connect `React Flow Graph` to `Dialogs & Forms`, `UI Components`, `Command Bar & State`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06439393939393939 - nodes in this community are weakly interconnected._
- **Should `Command Bar & State` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._
- **Should `Supabase Database` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._