/**
 * Engineering Memory Agent (EMA) — Visual Memory Graph SPA Template
 *
 * Self-contained Single Page Application (zero external npm build step).
 * Features:
 *   - Force-directed Canvas graph layout with physics simulation.
 *   - Dynamic node coloring (Emerald = Canonical, Amber = Candidate, Red = Contradiction/Stale, Slate = Historical).
 *   - Directional relationship arrows & red flashing contradiction links.
 *   - Search & multi-dimensional filtering (scope, authority, contradictions).
 *   - Interactive slide-over inspection drawer with evidence anchors & one-click promotion.
 */

export function renderHtml() {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EMA Memory Graph — Visual Knowledge Network</title>
  <style>
    :root {
      --bg: #090d16;
      --panel-bg: rgba(15, 23, 42, 0.85);
      --border: rgba(51, 65, 85, 0.6);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --canonical: #10b981;
      --candidate: #f59e0b;
      --contradiction: #ef4444;
      --historical: #64748b;
      --accent: #38bdf8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }

    /* Top Nav Bar */
    header {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      height: 56px;
      background: var(--panel-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 20;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: -0.02em;
    }
    .brand .dot {
      width: 10px;
      height: 10px;
      background: var(--canonical);
      border-radius: 50%;
      box-shadow: 0 0 12px var(--canonical);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.85); }
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-input {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      width: 220px;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
      width: 260px;
    }

    .btn-group {
      display: flex;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .btn-filter {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-filter:hover {
      color: var(--text);
    }
    .btn-filter.active {
      background: #334155;
      color: #fff;
      font-weight: 600;
    }

    .btn-action {
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-action:hover { background: #1d4ed8; }

    /* Main Canvas */
    #graph-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
    }
    #graph-canvas:active { cursor: grabbing; }

    /* Legend Overlay */
    .legend {
      position: absolute;
      bottom: 24px;
      left: 24px;
      background: var(--panel-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 10;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-color {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    /* Slide-over Inspection Drawer */
    .drawer {
      position: absolute;
      top: 84px;
      right: 16px;
      bottom: 16px;
      width: 440px;
      background: var(--panel-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 12px;
      z-index: 30;
      display: flex;
      flex-direction: column;
      transform: translateX(470px);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
    }
    .drawer.open {
      transform: translateX(0);
    }

    .drawer-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .drawer-title {
      font-size: 16px;
      font-weight: 700;
      line-height: 1.3;
    }
    .drawer-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
    }
    .drawer-close:hover { color: var(--text); }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-size: 13px;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-canonical { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-candidate { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-contradiction { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-scope { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }

    .section-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .evidence-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .evidence-item {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border);
      padding: 8px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 11px;
      word-break: break-all;
    }

    .markdown-view {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border);
      padding: 12px;
      border-radius: 8px;
      line-height: 1.6;
      white-space: pre-wrap;
      font-size: 12px;
      color: #cbd5e1;
      max-height: 240px;
      overflow-y: auto;
    }

    .drawer-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 10px;
    }

    /* Tooltip */
    #tooltip {
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      pointer-events: none;
      z-index: 40;
      display: none;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="dot"></div>
      <span>EMA Memory Graph</span>
      <span style="color: var(--text-muted); font-weight: 400; font-size: 13px;" id="stats-badge">Loading...</span>
    </div>

    <div class="controls">
      <input type="text" id="search" class="search-input" placeholder="Search knowledge or tags...">
      
      <div class="btn-group">
        <button class="btn-filter active" data-filter="all">All</button>
        <button class="btn-filter" data-filter="canonical">Canonical</button>
        <button class="btn-filter" data-filter="candidate">Candidates</button>
        <button class="btn-filter" data-filter="contradiction">Conflicts ⚠</button>
      </div>

      <button id="btn-recenter" class="btn-filter" style="background:#1e293b; border-radius:8px; border:1px solid var(--border);">Reset View</button>
    </div>
  </header>

  <canvas id="graph-canvas"></canvas>

  <div class="legend">
    <div class="legend-item">
      <div class="legend-color" style="background: var(--canonical); box-shadow: 0 0 8px var(--canonical);"></div>
      <span>Canonical (Verified)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: var(--candidate); box-shadow: 0 0 8px var(--candidate);"></div>
      <span>Candidate (Queue)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: var(--contradiction); box-shadow: 0 0 8px var(--contradiction);"></div>
      <span>Contradiction / Conflict</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: var(--historical);"></div>
      <span>Historical / Superseded</span>
    </div>
  </div>

  <div id="drawer" class="drawer">
    <div class="drawer-header">
      <div>
        <div id="drawer-id" style="font-size: 11px; font-family: monospace; color: var(--text-muted);"></div>
        <div id="drawer-title" class="drawer-title"></div>
      </div>
      <button id="drawer-close" class="drawer-close">&times;</button>
    </div>

    <div class="drawer-body">
      <div class="badge-row" id="drawer-badges"></div>

      <div>
        <div class="section-label">Source File</div>
        <div id="drawer-source" style="font-family: monospace; font-size: 12px; color: var(--accent);"></div>
      </div>

      <div>
        <div class="section-label">Grounded Evidence (<span id="drawer-evidence-count">0</span>)</div>
        <div id="drawer-evidence" class="evidence-list"></div>
      </div>

      <div>
        <div class="section-label">Content Preview</div>
        <div id="drawer-content" class="markdown-view"></div>
      </div>
    </div>

    <div class="drawer-footer" id="drawer-actions"></div>
  </div>

  <div id="tooltip"></div>

  <script>
    let graphData = { nodes: [], edges: [], stats: {} };
    let nodes = [];
    let edges = [];
    let selectedNode = null;
    let hoveredNode = null;
    let filterMode = 'all';
    let searchQuery = '';

    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    const drawer = document.getElementById('drawer');
    const tooltip = document.getElementById('tooltip');

    let camera = { x: 0, y: 0, zoom: 1 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let draggedNode = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (camera.x === 0 && camera.y === 0) {
        camera.x = canvas.width / 2;
        camera.y = canvas.height / 2;
      }
    }
    window.addEventListener('resize', resize);
    resize();

    // Fetch Graph Data
    async function loadGraph() {
      try {
        const res = await fetch('/api/graph');
        graphData = await res.json();
        document.getElementById('stats-badge').innerText = 
          \`\${graphData.stats.total_nodes} nodes · \${graphData.stats.total_edges} relations · \${graphData.stats.candidate_count} candidates\`;

        // Initialize node physics positions
        const width = canvas.width;
        const height = canvas.height;
        nodes = graphData.nodes.map((n, i) => {
          const angle = (i / graphData.nodes.length) * Math.PI * 2;
          const radius = 120 + Math.random() * 200;
          return {
            ...n,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
            radius: n.is_candidate ? 14 : 18,
          };
        });

        // Resolve edge references to node objects
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        edges = graphData.edges.map(e => ({
          ...e,
          sourceNode: nodeMap.get(e.source),
          targetNode: nodeMap.get(e.target)
        })).filter(e => e.sourceNode && e.targetNode);

      } catch (err) {
        document.getElementById('stats-badge').innerText = 'Failed to load graph';
      }
    }
    loadGraph();

    // Force Simulation Physics Loop
    function simulate() {
      const repulsion = 450;
      const attraction = 0.04;
      const damping = 0.85;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 500) {
            const force = repulsion / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      for (const e of edges) {
        const dx = e.targetNode.x - e.sourceNode.x;
        const dy = e.targetNode.y - e.sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 140) * attraction;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        e.sourceNode.vx += fx;
        e.sourceNode.vy += fy;
        e.targetNode.vx -= fx;
        e.targetNode.vy -= fy;
      }

      for (const n of nodes) {
        if (n === draggedNode) continue;
        // Gravity to center
        n.vx -= n.x * 0.005;
        n.vy -= n.y * 0.005;

        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    // Render Canvas Loop
    function render() {
      simulate();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);

      // Draw Edges
      for (const e of edges) {
        const isConflict = e.is_contradiction || e.type === 'contradicts';
        ctx.beginPath();
        ctx.moveTo(e.sourceNode.x, e.sourceNode.y);
        ctx.lineTo(e.targetNode.x, e.targetNode.y);
        
        if (isConflict) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 4]);
        } else {
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Relationship label on edge center
        if (camera.zoom > 0.8) {
          const midX = (e.sourceNode.x + e.targetNode.x) / 2;
          const midY = (e.sourceNode.y + e.targetNode.y) / 2;
          ctx.font = '9px monospace';
          ctx.fillStyle = isConflict ? '#f87171' : 'rgba(148, 163, 184, 0.6)';
          ctx.textAlign = 'center';
          ctx.fillText(e.label, midX, midY - 4);
        }
      }

      // Draw Nodes
      for (const n of nodes) {
        let isVisible = true;
        if (filterMode === 'canonical' && n.is_candidate) isVisible = false;
        if (filterMode === 'candidate' && !n.is_candidate) isVisible = false;
        if (filterMode === 'contradiction' && n.validation_state !== 'Invalid' && !edges.some(e => e.is_contradiction && (e.sourceNode === n || e.targetNode === n))) isVisible = false;
        if (searchQuery && !n.title.toLowerCase().includes(searchQuery) && !n.tags.some(t => t.toLowerCase().includes(searchQuery))) isVisible = false;

        const alpha = isVisible ? 1.0 : 0.15;
        ctx.globalAlpha = alpha;

        // Node Color Logic
        let color = '#10b981'; // canonical green
        if (n.is_candidate) color = '#f59e0b'; // candidate amber
        if (n.status === 'Historical' || n.status === 'Superseded') color = '#64748b'; // historical
        if (n.validation_state === 'Invalid' || n.validation_state === 'Quarantined') color = '#ef4444';

        // Outer glow on hover or selection
        if (n === selectedNode || n === hoveredNode) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.25;
          ctx.fill();
          ctx.globalAlpha = alpha;
        }

        // Main circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node Title Label
        if (camera.zoom > 0.6 || n === selectedNode || n === hoveredNode) {
          ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillStyle = '#f1f5f9';
          ctx.textAlign = 'center';
          ctx.fillText(n.title.slice(0, 24), n.x, n.y + n.radius + 14);
        }
      }

      ctx.globalAlpha = 1.0;
      ctx.restore();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Mouse Interaction
    function getMousePos(e) {
      return {
        x: (e.clientX - camera.x) / camera.zoom,
        y: (e.clientY - camera.y) / camera.zoom
      };
    }

    function findNodeAt(pos) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dist = Math.hypot(n.x - pos.x, n.y - pos.y);
        if (dist <= n.radius + 4) return n;
      }
      return null;
    }

    canvas.addEventListener('mousedown', (e) => {
      const pos = getMousePos(e);
      const hit = findNodeAt(pos);
      if (hit) {
        draggedNode = hit;
      } else {
        isDragging = true;
        dragStart = { x: e.clientX - camera.x, y: e.clientY - camera.y };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (draggedNode) {
        const pos = getMousePos(e);
        draggedNode.x = pos.x;
        draggedNode.y = pos.y;
        draggedNode.vx = 0;
        draggedNode.vy = 0;
      } else if (isDragging) {
        camera.x = e.clientX - dragStart.x;
        camera.y = e.clientY - dragStart.y;
      } else {
        const pos = getMousePos(e);
        hoveredNode = findNodeAt(pos);
        if (hoveredNode) {
          tooltip.style.display = 'block';
          tooltip.style.left = (e.clientX + 14) + 'px';
          tooltip.style.top = (e.clientY + 14) + 'px';
          tooltip.innerHTML = \`<strong>\${hoveredNode.title}</strong><br><span style="color:var(--text-muted)">Scope: \${hoveredNode.scope} | Status: \${hoveredNode.status}</span>\`;
        } else {
          tooltip.style.display = 'none';
        }
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      draggedNode = null;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      camera.zoom = Math.max(0.2, Math.min(3.0, camera.zoom * zoomFactor));
    });

    canvas.addEventListener('click', (e) => {
      const pos = getMousePos(e);
      const hit = findNodeAt(pos);
      if (hit) {
        openDrawer(hit);
      }
    });

    // Drawer Inspector
    async function openDrawer(node) {
      selectedNode = node;
      document.getElementById('drawer-id').innerText = node.id;
      document.getElementById('drawer-title').innerText = node.title;
      document.getElementById('drawer-source').innerText = node.source_path || node.id;
      document.getElementById('drawer-evidence-count').innerText = node.evidence_count;

      const badgeRow = document.getElementById('drawer-badges');
      badgeRow.innerHTML = \`
        <span class="badge badge-canonical">\${node.status}</span>
        <span class="badge \${node.is_candidate ? 'badge-candidate' : 'badge-canonical'}">\${node.authority_level}</span>
        <span class="badge badge-scope">\${node.scope}</span>
        <span class="badge" style="background:#334155; color:#cbd5e1">\${node.validation_state}</span>
      \`;

      // Fetch node full details from API
      try {
        const res = await fetch('/api/nodes/' + encodeURIComponent(node.id));
        const details = await res.json();
        
        // Render evidence
        const evContainer = document.getElementById('drawer-evidence');
        if (details.evidence && details.evidence.length > 0) {
          evContainer.innerHTML = details.evidence.map(ev => 
            \`<div class="evidence-item">\${typeof ev === 'string' ? ev : (ev.uri || ev.path || JSON.stringify(ev))}</div>\`
          ).join('');
        } else {
          evContainer.innerHTML = '<div style="color:var(--text-muted); font-size:11px;">No explicit evidence anchors attached.</div>';
        }

        // Render content
        document.getElementById('drawer-content').innerText = details.content || details.body_text || 'No body content available.';

        // Action Buttons
        const actionRow = document.getElementById('drawer-actions');
        actionRow.innerHTML = '';
        if (node.is_candidate) {
          const promoteBtn = document.createElement('button');
          promoteBtn.className = 'btn-action';
          promoteBtn.innerText = 'Promote to Project Canonical';
          promoteBtn.onclick = async () => {
            promoteBtn.disabled = true;
            promoteBtn.innerText = 'Promoting...';
            const pRes = await fetch('/api/promote/' + encodeURIComponent(node.id), { method: 'POST' });
            if (pRes.ok) {
              alert('Candidate promoted successfully!');
              loadGraph();
              closeDrawer();
            } else {
              alert('Promotion failed');
            }
          };
          actionRow.appendChild(promoteBtn);
        }
      } catch {
        document.getElementById('drawer-content').innerText = 'Could not load details.';
      }

      drawer.classList.add('open');
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      selectedNode = null;
    }
    document.getElementById('drawer-close').onclick = closeDrawer;

    // Filter controls
    document.querySelectorAll('.btn-filter[data-filter]').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.btn-filter[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterMode = btn.dataset.filter;
      };
    });

    document.getElementById('search').oninput = (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
    };

    document.getElementById('btn-recenter').onclick = () => {
      camera = { x: canvas.width / 2, y: canvas.height / 2, zoom: 1 };
    };
  </script>
</body>
</html>`;
}
