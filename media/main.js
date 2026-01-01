const vscode = acquireVsCodeApi();
let currentGraph = null;
let currentRoot = '';
let simulation = null;
let svg, container, node, link;

console.log('⚛️ Atomic Flow main.js loaded');

// Handle messages from extension OR test page
window.addEventListener('message', event => {
    console.log('📨 Message received:', event.data);
    const message = event.data;
    if (message && message.command === 'renderGraph') {
        console.log('✅ Calling renderGraph with', message.graph.nodes.length, 'nodes');
        renderGraph(message.graph, message.rootFile, message.currentDepth);
    } else {
        console.log('⚠️ Message ignored:', message);
    }
});

// Control handlers
document.getElementById('toggleDepth').addEventListener('click', () => {
    const btn = document.getElementById('toggleDepth');
    const isRecursive = btn.classList.contains('active');
    vscode.postMessage({ command: 'toggleDepth', depth: isRecursive ? 1 : 2 });
});

document.getElementById('searchBox').addEventListener('input', (e) => {
    filterGraph(e.target.value);
});

document.getElementById('exportBtn').addEventListener('click', exportToPNG);
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);

function renderGraph(graph, rootFile, currentDepth) {
    console.log('🎨 renderGraph called:', { nodes: graph.nodes.length, edges: graph.edges.length, rootFile });
    
    currentGraph = graph;
    currentRoot = graph.nodes[0]?.id || '';
    
    document.getElementById('title').textContent = `⚛️ ${rootFile}`;
    document.getElementById('stats').textContent = `${graph.nodes.length} nodes · ${graph.edges.length} links`;
    document.getElementById('toggleDepth').textContent = currentDepth > 1 ? 'Recursive' : 'Direct Only';
    document.getElementById('toggleDepth').className = currentDepth > 1 ? 'active' : '';
    
    if (!window.d3) {
        document.body.innerHTML += '<div style="color:red;padding:20px">Error: D3.js failed to load</div>';
        return;
    }
    
    if (graph.nodes.length === 0) {
        document.body.innerHTML = '<div style="color:#fff;padding:20px;text-align:center"><h3>No dependencies found</h3></div>';
        return;
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Clear existing
    d3.select("svg").selectAll("*").remove();
    
    svg = d3.select("svg");
    container = svg.append("g");
    
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => { container.attr("transform", event.transform); })
        .filter(event => event.type === 'wheel' || event.button === 0 || event.button === 1);
    
    svg.call(zoom).on("dblclick.zoom", null);
    
    // Arrow marker
    container.append("defs").append("marker")
        .attr("id", "arrow").attr("viewBox", "0 -5 10 10").attr("refX", 25).attr("refY", 0)
        .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#555");
    
    simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.edges).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(d => 15 + (d.imports * 3)));
    
    link = container.append("g").selectAll("line").data(graph.edges).join("line")
        .attr("class", d => d.violation ? "link violation" : "link")
        .attr("marker-end", "url(#arrow)");
    
    node = container.append("g").selectAll("g").data(graph.nodes).join("g")
        .attr("class", d => {
            let cls = "node";
            if (d.id === currentRoot) cls += " root";
            if (d.isCyclic) cls += " cyclic";
            if (d.isOrphan) cls += " orphan";
            return cls;
        })
        .call(d3.drag()
            .on("start", dragStart)
            .on("drag", dragging)
            .on("end", dragEnd))
        .on("click", handleClick)
        .on("contextmenu", handleRightClick);
    
    // Node visuals
    node.append("circle")
        .attr("r", d => 6 + (d.imports * 3))
        .attr("fill", d => getNodeColor(d));
    
    node.append("text")
        .attr("dx", d => 10 + (d.imports * 3))
        .attr("dy", 4)
        .text(d => d.name);
    
    node.append("title")
        .text(d => {
            let tooltip = `${d.id}\\nImports: ${d.imports}`;
            if (d.lines) tooltip += `\\nLines: ${d.lines}`;
            if (d.externalLibs && d.externalLibs.length > 0) {
                tooltip += `\\n📦 External: ${d.externalLibs.join(', ')}`;
            }
            if (d.isCyclic) tooltip += '\\n⚠️ CYCLIC!';
            if (d.isOrphan) tooltip += '\\n👻 Orphan';
            tooltip += '\\n(Click to Open | Alt+Click for Impact)';
            return tooltip;
        });
    
    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
}

function getNodeColor(d) {
    if (d.id === currentRoot) return "#e94560";  // Root: Red
    if (d.isCyclic) return "#ff0000";            // Cyclic: Bright Red
    if (d.isOrphan) return "#666";               // Orphan: Gray
    if (!d.lines) return "#4a90d9";              // Default: Blue
    
    // God Component Heatmap
    if (d.lines > 500) return "#ff0000";         // Red: God Component
    if (d.lines > 300) return "#ff6600";         // Orange: Warning
    if (d.lines > 200) return "#ffcc00";         // Yellow: Caution
    return "#00cc66";                             // Green: Healthy
}

function handleClick(event, d) {
    if (event.altKey) {
        highlightImpact(d);
    } else {
        vscode.postMessage({ command: 'openFile', path: d.id });
    }
}

function handleRightClick(event, d) {
    event.preventDefault();
    focusOnNode(d);
}

function highlightImpact(targetNode) {
    const impacted = new Set([targetNode.id]);
    const queue = [targetNode.id];
    
    while (queue.length) {
        const current = queue.shift();
        currentGraph.edges.forEach(e => {
            if (e.target === current && !impacted.has(e.source)) {
                impacted.add(e.source);
                queue.push(e.source);
            }
        });
    }
    
    node.classed("dimmed", d => !impacted.has(d.id));
    link.classed("highlighted", e => impacted.has(e.source) && impacted.has(e.target));
    
    // Reset after 3s
    setTimeout(() => {
        node.classed("dimmed", false);
        link.classed("highlighted", false);
    }, 3000);
}

function focusOnNode(targetNode) {
    const related = new Set([targetNode.id]);
    currentGraph.edges.forEach(e => {
        if (e.source === targetNode.id) related.add(e.target);
        if (e.target === targetNode.id) related.add(e.source);
    });
    
    node.classed("dimmed", d => !related.has(d.id));
    link.classed("dimmed", e => !related.has(e.source) || !related.has(e.target));
}

function filterGraph(query) {
    if (!query.trim()) {
        node.classed("dimmed", false);
        link.classed("dimmed", false);
        return;
    }
    
    const regex = new RegExp(query, 'i');
    const matches = new Set();
    currentGraph.nodes.forEach(n => {
        if (regex.test(n.name) || regex.test(n.id)) matches.add(n.id);
    });
    
    node.classed("dimmed", d => !matches.has(d.id));
    link.classed("dimmed", e => !matches.has(e.source) && !matches.has(e.target));
}

function exportToPNG() {
    const svgEl = document.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    img.onload = () => {
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
            vscode.postMessage({ 
                command: 'saveImage', 
                data: Array.from(new Uint8Array(blob))
            });
        });
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

function copyToClipboard() {
    const svgEl = document.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    img.onload = () => {
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const arrayBuffer = reader.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                vscode.postMessage({ 
                    command: 'copyImage', 
                    data: Array.from(uint8Array)
                });
            };
            reader.readAsArrayBuffer(blob);
        });
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

function dragStart(e) {
    if (!e.active) simulation.alphaTarget(0.3).restart();
    e.subject.fx = e.subject.x;
    e.subject.fy = e.subject.y;
}

function dragging(e) {
    e.subject.fx = e.x;
    e.subject.fy = e.y;
}

function dragEnd(e) {
    if (!e.active) simulation.alphaTarget(0);
    e.subject.fx = null;
    e.subject.fy = null;
}

// Signal readiness to extension
vscode.postMessage({ command: 'clientReady' });
