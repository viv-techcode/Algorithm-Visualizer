import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import { Plus, RotateCcw, Share2, Trash2, ArrowRight, X, Search,  Wand2 } from 'lucide-react';
import { useAlgo } from '../context/AlgoContext';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  highlighted?: boolean;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

export const GraphVisualizer: React.FC = () => {
  const { addHistory } = useAlgo();
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' },
    { id: '4', label: '4' }, { id: '5', label: '5' }, { id: '6', label: '6' },
    { id: '7', label: '7' }, { id: '8', label: '8' }, { id: '9', label: '9' },
    { id: '10', label: '10' }
  ]);
  const [links, setLinks] = useState<Link[]>([
    { source: '1', target: '2' }, { source: '1', target: '3' }, { source: '2', target: '4' },
    { source: '2', target: '5' }, { source: '3', target: '6' }, { source: '3', target: '7' },
    { source: '4', target: '8' }, { source: '5', target: '9' }, { source: '6', target: '10' },
    { source: '8', target: '9' }, { source: '9', target: '10' }, { source: '5', target: '7' }
  ]);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [deleteNodeId, setDeleteNodeId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  
  // Traversal States
  const [isTraversing, setIsTraversing] = useState(false);
  const [traversalOutput, setTraversalOutput] = useState<string[]>([]);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [traversalEdges, setTraversalEdges] = useState<Set<string>>(new Set());
  const [startNodeId, setStartNodeId] = useState('');
  const [goalNodeId, setGoalNodeId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTraversalType, setActiveTraversalType] = useState<'BFS' | 'DFS' | null>(null);
  const [mounted, setMounted] = useState(false);
  const traversalIdRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeMessage, setActiveMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const modalSvgRef = useRef<SVGSVGElement>(null);

  const handleAddNode = () => {
    if (!newNodeLabel) return;
    if (nodes.find(n => n.id === newNodeLabel)) {
      setActiveMessage({ text: "Node already exists", type: 'error' });
      setTimeout(() => setActiveMessage(null), 2000);
      return;
    }
    setNodes([...nodes, { id: newNodeLabel, label: newNodeLabel }]);
    addHistory(`Added node ${newNodeLabel}.`);
    setActiveMessage({ text: `Added Node ${newNodeLabel}`, type: 'success' });
    setTimeout(() => setActiveMessage(null), 2000);
    setNewNodeLabel('');
  };

  const handleAddEdge = () => {
    if (!sourceId || !targetId) return;
    if (sourceId === targetId) return;
    if (!nodes.find(n => n.id === sourceId) || !nodes.find(n => n.id === targetId)) {
      setActiveMessage({ text: "Node not found", type: 'error' });
      setTimeout(() => setActiveMessage(null), 2000);
      return;
    }
    if (links.find(l => 
      (l.source === sourceId && l.target === targetId) || 
      (l.source === targetId && l.target === sourceId)
    )) {
      setActiveMessage({ text: "Edge already exists", type: 'error' });
      setTimeout(() => setActiveMessage(null), 2000);
      return;
    }

    setLinks([...links, { source: sourceId, target: targetId }]);
    addHistory(`Added edge between ${sourceId} and ${targetId}.`);
    setActiveMessage({ text: `Added Edge ${sourceId}-${targetId}`, type: 'success' });
    setTimeout(() => setActiveMessage(null), 2000);
    setSourceId('');
    setTargetId('');
  };

  const handleDeleteNode = () => {
    if (!deleteNodeId) return;
    if (!nodes.find(n => n.id === deleteNodeId)) {
      setActiveMessage({ text: "Node not found", type: 'error' });
      setTimeout(() => setActiveMessage(null), 2000);
      return;
    }
    
    setNodes(nodes.filter(n => n.id !== deleteNodeId));
    setLinks(links.filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return srcId !== deleteNodeId && tgtId !== deleteNodeId;
    }));
    addHistory(`Deleted node ${deleteNodeId}.`);
    setActiveMessage({ text: `Deleted Node ${deleteNodeId}`, type: 'error' });
    setTimeout(() => setActiveMessage(null), 2000);
    setDeleteNodeId('');
  };

  const handleReset = () => {
    setNodes([]);
    setLinks([]);
    setTraversalOutput([]);
    setVisitedNodes(new Set());
    setTraversalEdges(new Set());
    setIsTraversing(false);
    setHighlightedNode(null);
    addHistory('Graph reset.');
    setActiveMessage({ text: "Graph Reset", type: 'info' });
    setTimeout(() => setActiveMessage(null), 2000);
  };

  const handleGenerate = () => {
    const numNodes = 10;
    const newNodes: Node[] = [];
    const usedIds = new Set<number>();
    
    while (newNodes.length < numNodes) {
      const val = Math.floor(Math.random() * 90) + 10;
      if (!usedIds.has(val)) {
        usedIds.add(val);
        newNodes.push({ id: val.toString(), label: val.toString() });
      }
    }

    const newLinks: Link[] = [];
    // Ensure basic connectivity
    for (let i = 0; i < numNodes - 1; i++) {
      newLinks.push({ source: newNodes[i].id, target: newNodes[i+1].id });
    }
    // Add some random cross-edges
    for (let i = 0; i < 5; i++) {
      const s = Math.floor(Math.random() * numNodes);
      const t = Math.floor(Math.random() * numNodes);
      if (s !== t && !newLinks.find(l => (l.source === newNodes[s].id && l.target === newNodes[t].id) || (l.source === newNodes[t].id && l.target === newNodes[s].id))) {
        newLinks.push({ source: newNodes[s].id, target: newNodes[t].id });
      }
    }

    setNodes(newNodes);
    setLinks(newLinks);
    setTraversalOutput([]);
    setVisitedNodes(new Set());
    setTraversalEdges(new Set());
    setIsTraversing(false);
    addHistory(`Generated random 10-node graph.`);
    setActiveMessage({ text: "Random Graph Generated", type: 'success' });
    setTimeout(() => setActiveMessage(null), 2000);
  };

  // Algorithm Helpers
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const getAdjacencyList = () => {
    const adj = new Map<string, string[]>();
    nodes.forEach(n => adj.set(n.id, []));
    links.forEach(l => {
      const src = typeof l.source === 'object' ? (l.source as Node).id : l.source as string;
      const tgt = typeof l.target === 'object' ? (l.target as Node).id : l.target as string;
      adj.get(src)?.push(tgt);
      adj.get(tgt)?.push(src); // Undirected graph
    });
    // Sort for deterministic traversal order
    adj.forEach(neighbors => neighbors.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    }));
    return adj;
  };

  const startTraversal = () => {
    const start = startNodeId;
    if (!start) {
      setActiveMessage({ text: "Add source node", type: 'error' });
      setTimeout(() => setActiveMessage(null), 2000);
      return null;
    }
    if (!nodes.find(n => n.id === start)) {
      setActiveMessage({ text: "Source node does not exist", type: 'error' });
      setTimeout(() => setActiveMessage(null), 2000);
      return null;
    }
    if (goalNodeId && !nodes.find(n => n.id === goalNodeId)) {
      setActiveMessage({ text: "Goal node does not exist", type: 'error' });
      setTimeout(() => setActiveMessage(null), 2000);
      return null;
    }
    setIsTraversing(true);
    setTraversalOutput([]);
    setVisitedNodes(new Set());
    setTraversalEdges(new Set());
    return start;
  };

  const handleBFS = async () => {
    if (isTraversing) return;
    const start = startTraversal();
    if (!start) return;

    setActiveTraversalType('BFS');
    setShowModal(true);
    const currentId = ++traversalIdRef.current;
    
    const adj = getAdjacencyList();
    const queue: string[] = [start];
    const visited = new Set<string>([start]);
    const output: string[] = [];
    const tEdges = new Set<string>();

    addHistory(`Started BFS from node ${start}`);

    while (queue.length > 0 && currentId === traversalIdRef.current) {
      const curr = queue.shift()!;
      setHighlightedNode(curr);
      await delay(600);
      
      output.push(curr);
      setTraversalOutput([...output]);
      setVisitedNodes(new Set(visited));
      
      if (goalNodeId && curr === goalNodeId) {
        addHistory(`Goal node ${curr} reached!`);
        break;
      }
      
      await delay(400);

      const neighbors = adj.get(curr) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          tEdges.add(`${curr}-${neighbor}`);
          tEdges.add(`${neighbor}-${curr}`);
          setTraversalEdges(new Set(tEdges));
          
          setHighlightedNode(neighbor);
          await delay(400);
        }
      }
    }

    setHighlightedNode(null);
    setIsTraversing(false);
    const reachedGoal = goalNodeId && output.includes(goalNodeId);
    setActiveMessage({ 
      text: reachedGoal ? "Goal Reached!" : "BFS Complete", 
      type: reachedGoal ? 'success' : 'info' 
    });
    setTimeout(() => setActiveMessage(null), 3000);
  };

  const handleDFS = async () => {
    if (isTraversing) return;
    const start = startTraversal();
    if (!start) return;

    setActiveTraversalType('DFS');
    setShowModal(true);
    const currentId = ++traversalIdRef.current;

    const adj = getAdjacencyList();
    const visited = new Set<string>();
    const output: string[] = [];
    const tEdges = new Set<string>();

    addHistory(`Started DFS from node ${start}`);

    let goalReached = false;
    const dfs = async (curr: string, parent: string | null) => {
      if (currentId !== traversalIdRef.current || goalReached) return;
      visited.add(curr);
      
      if (parent) {
        tEdges.add(`${parent}-${curr}`);
        tEdges.add(`${curr}-${parent}`);
        setTraversalEdges(new Set(tEdges));
      }

      setHighlightedNode(curr);
      await delay(600);
      
      output.push(curr);
      setTraversalOutput([...output]);
      setVisitedNodes(new Set(visited));

      if (goalNodeId && curr === goalNodeId) {
        addHistory(`Goal node ${curr} reached!`);
        goalReached = true;
        return;
      }

      await delay(400);

      const neighbors = adj.get(curr) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && !goalReached) {
          await dfs(neighbor, curr);
          
          if (!goalReached) {
            setHighlightedNode(curr);
            await delay(400);
          }
        }
      }
    };

    await dfs(start, null);

    setHighlightedNode(null);
    setIsTraversing(false);
    const reachedGoal = goalNodeId && output.includes(goalNodeId);
    setActiveMessage({ 
      text: reachedGoal ? "Goal Reached!" : "DFS Complete", 
      type: reachedGoal ? 'success' : 'info' 
    });
    setTimeout(() => setActiveMessage(null), 3000);
  };

  // Base D3 Simulation
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const g = svg.append("g");

    const nodeRadius = 28; // match the circle radius
    const padding = nodeRadius + 4;

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<Node>(nodeRadius + 10))
      .on("tick", () => {
        // Clamp all nodes within SVG bounds
        nodes.forEach((d: any) => {
          d.x = Math.max(padding, Math.min(width - padding, d.x));
          d.y = Math.max(padding, Math.min(height - padding, d.y));
        });

        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node
          .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 2.5);

    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 24)
      .attr("fill", "#0f172a")
      .attr("stroke", "#06b6d4")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0 0 10px rgba(6,182,212,0.4))")
      .style("transition", "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)");

    node.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "15px")
      .attr("font-weight", "900")
      .text(d => d.label);

    // Floating Markers (Source/Goal)
    const markerGroup = node.append("g")
      .attr("class", "marker-group")
      .attr("transform", "translate(0, -45)");

    markerGroup.append("rect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("x", -30)
      .attr("y", -10)
      .attr("width", 60)
      .attr("height", 20)
      .attr("fill", (d: any) => d.id === startNodeId ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)")
      .attr("stroke", (d: any) => d.id === startNodeId ? "#10b981" : "#f59e0b")
      .attr("stroke-width", 1.5)
      .style("display", (d: any) => (d.id === startNodeId || (goalNodeId && d.id === goalNodeId)) ? "block" : "none")
      .style("backdrop-filter", "blur(4px)");

    markerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "5")
      .attr("fill", (d: any) => d.id === startNodeId ? "#10b981" : "#f59e0b")
      .attr("font-size", "10px")
      .attr("font-weight", "900")
      .attr("letter-spacing", "1px")
      .text((d: any) => d.id === startNodeId ? "SOURCE" : "GOAL")
      .style("display", (d: any) => (d.id === startNodeId || (goalNodeId && d.id === goalNodeId)) ? "block" : "none");

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => { simulation.stop(); };
  }, [nodes, links]);

  // Dynamic Highlighting Update Effect
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.select(".links").selectAll("line")
      .transition()
      .duration(400)
      .attr("stroke", (d: any) => {
        const src = typeof d.source === 'object' ? d.source.id : d.source;
        const tgt = typeof d.target === 'object' ? d.target.id : d.target;
        return traversalEdges.has(`${src}-${tgt}`) ? "#10b981" : "rgba(255,255,255,0.15)";
      })
      .attr("stroke-width", (d: any) => {
        const src = typeof d.source === 'object' ? d.source.id : d.source;
        const tgt = typeof d.target === 'object' ? d.target.id : d.target;
        return traversalEdges.has(`${src}-${tgt}`) ? 5 : 2.5;
      });

    svg.select(".nodes").selectAll("circle")
      .transition()
      .duration(400)
      .attr("stroke", (d: any) => {
        if (d.id === highlightedNode) return "#10b981"; 
        if (visitedNodes.has(d.id)) return "#34d399";
        return "#06b6d4"; 
      })
      .attr("stroke-width", (d: any) => (d.id === highlightedNode || visitedNodes.has(d.id)) ? 4 : 3)
      .style("filter", (d: any) => {
        if (d.id === highlightedNode) return "drop-shadow(0 0 20px #10b981)";
        if (visitedNodes.has(d.id)) return "drop-shadow(0 0 12px rgba(52,211,153,0.6))";
        return "drop-shadow(0 0 10px rgba(6,182,212,0.4))";
      });

  }, [highlightedNode, visitedNodes, traversalEdges]);
  
  // Modal Graph Rendering
  useEffect(() => {
    if (!modalSvgRef.current || !showModal || nodes.length === 0) return;

    const width = modalSvgRef.current.clientWidth || 800;
    const height = modalSvgRef.current.clientHeight || 600;

    const svg = d3.select(modalSvgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");
    const nodeRadius = 32;

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<Node>(nodeRadius + 5))
      .on("tick", () => {
        // Clamp all nodes within SVG bounds
        const padding = nodeRadius + 10;
        nodes.forEach((d: any) => {
          d.x = Math.max(padding, Math.min(width - padding, d.x));
          d.y = Math.max(padding, Math.min(height - padding, d.y));
        });

        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d: any) => {
        const src = typeof d.source === 'object' ? d.source.id : d.source;
        const tgt = typeof d.target === 'object' ? d.target.id : d.target;
        return traversalEdges.has(`${src}-${tgt}`) ? "#a855f7" : "rgba(255,255,255,0.05)";
      })
      .attr("stroke-width", (d: any) => {
        const src = typeof d.source === 'object' ? d.source.id : d.source;
        const tgt = typeof d.target === 'object' ? d.target.id : d.target;
        return traversalEdges.has(`${src}-${tgt}`) ? 5 : 2;
      })
      .style("filter", (d: any) => {
        const src = typeof d.source === 'object' ? d.source.id : d.source;
        const tgt = typeof d.target === 'object' ? d.target.id : d.target;
        return traversalEdges.has(`${src}-${tgt}`) ? "drop-shadow(0 0 12px #a855f7)" : "none";
      });

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }) as any);

    node.append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d: any) => d.id === highlightedNode ? "rgba(168,85,247,0.15)" : "#020617")
      .attr("stroke", (d: any) => {
        if (d.id === highlightedNode) return "#a855f7";
        if (visitedNodes.has(d.id)) return "#d8b4fe";
        return "rgba(255,255,255,0.1)";
      })
      .attr("stroke-width", (d: any) => d.id === highlightedNode ? 4 : 2)
      .style("filter", (d: any) => {
        if (d.id === highlightedNode) return "drop-shadow(0 0 15px rgba(168,85,247,0.6))";
        if (visitedNodes.has(d.id)) return "drop-shadow(0 0 8px rgba(168,85,247,0.3))";
        return "none";
      });

    node.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "18px")
      .attr("font-weight", "900")
      .text(d => d.label);

    // Floating Markers (Modal View)
    const modalMarkerGroup = node.append("g")
      .attr("class", "modal-marker-group")
      .attr("transform", "translate(0, -55)");

    modalMarkerGroup.append("rect")
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("x", -40)
      .attr("y", -12)
      .attr("width", 80)
      .attr("height", 24)
      .attr("fill", (d: any) => d.id === startNodeId ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)")
      .attr("stroke", (d: any) => d.id === startNodeId ? "#10b981" : "#f59e0b")
      .attr("stroke-width", 2)
      .style("display", (d: any) => (d.id === startNodeId || (goalNodeId && d.id === goalNodeId)) ? "block" : "none")
      .style("backdrop-filter", "blur(8px)");

    modalMarkerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "6")
      .attr("fill", (d: any) => d.id === startNodeId ? "#10b981" : "#f59e0b")
      .attr("font-size", "11px")
      .attr("font-weight", "900")
      .attr("letter-spacing", "2px")
      .text((d: any) => d.id === startNodeId ? "SOURCE" : "GOAL")
      .style("display", (d: any) => (d.id === startNodeId || (goalNodeId && d.id === goalNodeId)) ? "block" : "none");

    return () => { simulation.stop(); };
  }, [showModal, nodes, links, highlightedNode, visitedNodes, traversalEdges]);

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex flex-wrap gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md items-center">
        
        {/* Insert Node */}
        <div className="flex gap-2 items-center bg-black/40 p-2 rounded-2xl border border-white/10">
          <input 
            type="text" 
            placeholder="Node ID"
            value={newNodeLabel}
            onChange={(e) => setNewNodeLabel(e.target.value)}
            disabled={isTraversing}
            className="w-20 bg-transparent px-3 py-1 text-sm focus:outline-none text-cyan-400 font-bold placeholder:text-gray-600 disabled:opacity-50"
          />
          <button disabled={isTraversing} onClick={handleAddNode} className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-xl transition-all border border-cyan-500/30 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
            <Plus className="w-3.5 h-3.5" /> Node
          </button>
        </div>

        {/* Insert Edge */}
        <div className="flex gap-2 items-center bg-black/40 p-2 rounded-2xl border border-white/10">
          <input 
            type="text" 
            placeholder="From"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            disabled={isTraversing}
            className="w-16 bg-transparent px-3 py-1 text-sm focus:outline-none text-purple-400 font-bold placeholder:text-gray-600 disabled:opacity-50"
          />
          <input 
            type="text" 
            placeholder="To"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={isTraversing}
            className="w-16 bg-transparent px-3 py-1 text-sm focus:outline-none text-purple-400 font-bold placeholder:text-gray-600 disabled:opacity-50 border-l border-white/10"
          />
          <button disabled={isTraversing} onClick={handleAddEdge} className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-black rounded-xl transition-all border border-purple-500/30 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
            <Share2 className="w-3.5 h-3.5" /> Edge
          </button>
        </div>

        {/* Delete Node */}
        <div className="flex gap-2 items-center bg-black/40 p-2 rounded-2xl border border-white/10">
          <input 
            type="text" 
            placeholder="Delete ID"
            value={deleteNodeId}
            onChange={(e) => setDeleteNodeId(e.target.value)}
            disabled={isTraversing}
            className="w-28 bg-transparent px-3 py-1 text-sm focus:outline-none text-rose-400 font-bold placeholder:text-gray-600 disabled:opacity-50"
          />
          <button disabled={isTraversing} onClick={handleDeleteNode} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black rounded-xl transition-all border border-rose-500/30 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
            <Trash2 className="w-3.5 h-3.5" /> Del
          </button>
        </div>

        <div className="w-px h-8 bg-white/10 mx-2" />

        {/* Traversal Controls */}
        <div className="flex gap-2 items-center bg-emerald-500/5 p-2 rounded-2xl border border-emerald-500/20">
          <div className="flex flex-col gap-1">
            <input 
              type="text" 
              placeholder="Source Node"
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              disabled={isTraversing}
              className="w-32 bg-transparent px-3 py-1 text-sm focus:outline-none text-emerald-400 font-black placeholder:text-emerald-900/50 disabled:opacity-50 border-b border-emerald-500/10"
            />
            <input 
              type="text" 
              placeholder="Goal (Optional)"
              value={goalNodeId}
              onChange={(e) => setGoalNodeId(e.target.value)}
              disabled={isTraversing}
              className="w-32 bg-transparent px-3 py-1 text-sm focus:outline-none text-amber-400 font-black placeholder:text-amber-900/50 disabled:opacity-50"
            />
          </div>
          <button 
            disabled={isTraversing} 
            onClick={handleBFS} 
            className="px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded-xl transition-all border border-emerald-500/30 text-xs font-black tracking-widest uppercase active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.15)] whitespace-nowrap"
          >
            BFS (Breadth First Search)
          </button>
          <button 
            disabled={isTraversing} 
            onClick={handleDFS} 
            className="px-6 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-black rounded-xl transition-all border border-indigo-500/30 text-xs font-black tracking-widest uppercase active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_15px_rgba(99,102,241,0.15)] whitespace-nowrap"
          >
            DFS (Depth First Search)
          </button>
        </div>

        <div className="flex gap-2 ml-auto">
          <button disabled={isTraversing} onClick={handleGenerate} className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-black rounded-xl transition-all border border-purple-500/30 text-[10px] font-black tracking-widest uppercase active:scale-95 disabled:opacity-50 disabled:pointer-events-none group" title="Generate Random Graph">
            <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </button>

          <button disabled={isTraversing} onClick={handleReset} className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black rounded-xl transition-all border border-red-500/30 text-[10px] font-black tracking-widest uppercase active:scale-95 disabled:opacity-50 disabled:pointer-events-none" title="Reset Graph">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#020617] rounded-[2rem] border border-white/5 overflow-hidden shadow-inner">
        {/* Floating Message */}
        <AnimatePresence>
          {activeMessage && (
            <motion.div
              initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className={`absolute top-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl border backdrop-blur-xl shadow-2xl z-50 flex items-center gap-3 font-bold text-xs uppercase tracking-widest
                ${activeMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 
                  activeMessage.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'}`}
            >
              {activeMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        <svg ref={svgRef} className="w-full h-full" />
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-black uppercase tracking-[0.2em] italic">
            Graph is empty. Add nodes and edges to begin.
          </div>
        )}

        {/* Deep Obsidian Traversal Dashboard - moved OUTSIDE graph container */}
      </div>

      {/* Traversal Modal using Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-3xl bg-[#020617]/95"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="w-full h-full flex flex-col relative overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-16 py-10 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.15)]">
                      <Search className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                        {activeTraversalType === 'BFS' ? 'BFS (Breadth First Search)' : 'DFS (Depth First Search)'} <span className="text-purple-400 not-italic">Traversal</span>
                      </h2>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => activeTraversalType && (activeTraversalType === 'BFS' ? handleBFS() : handleDFS())}
                      disabled={isTraversing}
                      className="p-6 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-black rounded-3xl border border-purple-500/20 transition-all active:scale-90 group shadow-xl flex items-center gap-3 disabled:opacity-50"
                      title="Restart Traversal"
                    >
                      <RotateCcw className={cn("w-8 h-8 transition-transform duration-700", isTraversing ? "animate-spin-slow" : "group-hover:rotate-180")} />
                    </button>

                    <button 
                      onClick={() => { 
                        traversalIdRef.current++;
                        setShowModal(false); 
                        setIsTraversing(false); 
                        setVisitedNodes(new Set());
                        setTraversalEdges(new Set());
                        setHighlightedNode(null);
                        setTraversalOutput([]);
                      }}
                      className="p-6 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-3xl border border-white/10 transition-all active:scale-90 group shadow-xl"
                    >
                      <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                  </div>
                </div>

                {/* Modal Floating Message */}
                <AnimatePresence>
                  {activeMessage && (
                    <motion.div
                      initial={{ y: -20, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                      className={cn(
                        "absolute top-32 left-1/2 -translate-x-1/2 px-8 py-3 rounded-2xl border backdrop-blur-3xl shadow-2xl z-[10000] flex items-center gap-4 font-black text-xs uppercase tracking-[0.4em]",
                        activeMessage.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                      )}
                    >
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      {activeMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal Content */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Panel: Graph */}
                  <div className="w-1/2 border-r border-white/5 flex flex-col bg-black/20">
                    <div className="px-12 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-transparent to-transparent backdrop-blur-md">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-8 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.3)]" />
                        <h3 className="text-lg font-black tracking-tighter text-white uppercase italic">Graph Visualization</h3>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden p-4 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.03)_0%,transparent_70%)]">
                      <svg ref={modalSvgRef} className="w-full h-full" />
                    </div>
                  </div>

                  {/* Right Panel: Output */}
                  <div className="w-1/2 flex flex-col bg-[#020617]">
                    <div className="px-12 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-transparent to-transparent backdrop-blur-md">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-8 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.3)]" />
                        <h3 className="text-lg font-black tracking-tighter text-white uppercase italic">Execution Output</h3>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                      <div className="flex flex-wrap gap-4 justify-center">
                        {traversalOutput.map((val, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                              "relative w-20 h-20 rounded-xl border flex items-center justify-center transition-all duration-500",
                              val === highlightedNode ? "bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]" : "bg-white/[0.03] border-white/5"
                            )}
                          >
                            <div className="absolute top-1.5 left-2 text-[7px] font-black text-gray-600 uppercase">#{i+1}</div>
                            <span className={cn("text-xl font-black", val === highlightedNode ? "text-purple-400" : "text-white/80")}>{val}</span>
                            {i < traversalOutput.length - 1 && (
                              <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                                <ArrowRight className={cn("w-3 h-3", traversalOutput[i+1] === highlightedNode ? "text-purple-500 animate-pulse" : "text-white/10")} />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body!
      )}
    </div>
  );
};

