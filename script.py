import sys

with open("src/components/command-bar.tsx", "r", encoding="utf-8") as f:
    content = f.read()
if "import { useUIStore }" not in content:
    content = content.replace("import { useInteractionStore } from \"@/stores/interaction-store\"", "import { useInteractionStore } from \"@/stores/interaction-store\"\nimport { useUIStore } from \"@/stores/ui-store\"")
with open("src/components/command-bar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/components/toolbar.tsx", "r", encoding="utf-8") as f:
    content = f.read()
if "import { useUIStore }" not in content:
    content = content.replace("import { useGraphStore } from \"@/stores/graph-store\"", "import { useGraphStore } from \"@/stores/graph-store\"\nimport { useUIStore } from \"@/stores/ui-store\"")
with open("src/components/toolbar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/components/panels/circle-detail.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("deleteNode([selectedNodeId])", "deleteNode(selectedNodeId)")
with open("src/components/panels/circle-detail.tsx", "w", encoding="utf-8") as f:
    f.write(content)
