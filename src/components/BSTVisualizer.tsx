import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, Trash2, ArrowRight, X, Search, Wand2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TreeNode {
  value: number;
  left?: TreeNode;
  right?: TreeNode;
}

export const BSTVisualizer: React.FC = () => {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [deleteValue, setDeleteValue] = useState('');
  const [highlightedNode, setHighlightedNode] = useState<number | null>(null);
  const [traversalPath, setTraversalPath] = useState<number[]>([]);
  const [traversalOutput, setTraversalOutput] = useState<number[]>([]);
  const [operationType, setOperationType] = useState<'insert' | 'delete' | 'traverse' | null>(null);
  const [isTraversing, setIsTraversing] = useState(false);
  const [activeMessage, setActiveMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTraversalType, setActiveTraversalType] = useState<'pre' | 'in' | 'post' | null>(null);
  const [currentNodeRole, setCurrentNodeRole] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const modalSvgRef = useRef<SVGSVGElement>(null);
  const traversalIdRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const treeDepth = useMemo(() => {
    if (!root) return 0;
    return d3.hierarchy<TreeNode>(root, d => [d.left, d.right].filter(Boolean) as TreeNode[]).height;
  }, [root]);

  const insertNodeRecursive = (node: TreeNode | null, val: number): TreeNode => {
    if (!node) return { value: val };
    if (val < node.value) {
      node.left = insertNodeRecursive(node.left || null, val);
    } else if (val > node.value) {
      node.right = insertNodeRecursive(node.right || null, val);
    }
    return node;
  };

  const deleteNodeRecursive = (node: TreeNode | null, val: number): TreeNode | null => {
    if (!node) return null;
    if (val < node.value) {
      const updatedLeft = deleteNodeRecursive(node.left || null, val);
      node.left = updatedLeft === null ? undefined : updatedLeft;
    } else if (val > node.value) {
      const updatedRight = deleteNodeRecursive(node.right || null, val);
      node.right = updatedRight === null ? undefined : updatedRight;
    } else {
      if (!node.left) return node.right || null;
      if (!node.right) return node.left || null;
      let minNode = node.right;
      while (minNode.left) minNode = minNode.left;
      node.value = minNode.value;
      const fixedUpdatedRight = deleteNodeRecursive(node.right || null, minNode.value);
      node.right = fixedUpdatedRight === null ? undefined : fixedUpdatedRight;
    }
    return node;
  };

  useEffect(() => {
    const defaultElements = [50, 30, 70, 20, 40, 60, 80, 15, 25, 35];
    let newRoot: TreeNode | null = null;
    defaultElements.forEach(val => {
      newRoot = insertNodeRecursive(newRoot, val);
    });
    setRoot(newRoot);
  }, []);

  const handleInsert = async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    setInputValue('');
    setOperationType('insert');

    let curr = root;
    const path: number[] = [];
    while (curr) {
      path.push(curr.value);
      setTraversalPath([...path]);
      await new Promise(r => setTimeout(r, 300));
      if (val < curr.value) {
        if (!curr.left) break;
        curr = curr.left;
      } else if (val > curr.value) {
        if (!curr.right) break;
        curr = curr.right;
      } else {
        setActiveMessage({ text: "Already exists", type: 'error' });
        setTimeout(() => setTraversalPath([]), 1000);
        return;
      }
    }
    setRoot(prev => ({ ...insertNodeRecursive(prev, val) }));
    setHighlightedNode(val);
    setActiveMessage({ text: `Inserted ${val}`, type: 'success' });
    setTimeout(() => {
      setHighlightedNode(null);
      setTraversalPath([]);
      setOperationType(null);
      setActiveMessage(null);
    }, 2000);
  };

  const handleDelete = async () => {
    const val = parseInt(deleteValue);
    if (isNaN(val)) return;
    setHighlightedNode(val);
    setOperationType('delete');
    await new Promise(r => setTimeout(r, 400));
    setRoot(prev => {
      if (!prev) return null;
      const updatedRoot = deleteNodeRecursive({ ...prev }, val);
      return updatedRoot ? { ...updatedRoot } : null;
    });
    setActiveMessage({ text: `Deleted ${val}`, type: 'error' });
    setDeleteValue('');
    setTimeout(() => {
      setHighlightedNode(null);
      setOperationType(null);
      setActiveMessage(null);
    }, 1000);
  };

  const handleTraverse = async (type: 'pre' | 'in' | 'post') => {
    if (!root) {
      setActiveMessage({ text: "Tree is empty", type: 'error' });
      setTimeout(() => setActiveMessage(null), 2000);
      return;
    }
    setTraversalOutput([]);
    setTraversalPath([]);
    setHighlightedNode(null);
    setOperationType('traverse');
    setActiveTraversalType(type);
    setShowModal(true);
    setIsTraversing(true);
    const result: number[] = [];
    const currentId = ++traversalIdRef.current;

    const visit = async (node: TreeNode | null, role: string = 'ROOT') => {
      if (!node || currentId !== traversalIdRef.current) return;

      setHighlightedNode(node.value);
      setCurrentNodeRole(role);

      if (type === 'pre') {
        result.push(node.value);
        setTraversalOutput([...result]);
        await new Promise(r => setTimeout(r, 600));
      }

      await visit(node.left || null, 'LEFT');

      if (type === 'in') {
        result.push(node.value);
        setHighlightedNode(node.value);
        setCurrentNodeRole('ROOT');
        setTraversalOutput([...result]);
        await new Promise(r => setTimeout(r, 600));
      }

      await visit(node.right || null, 'RIGHT');

      if (type === 'post') {
        result.push(node.value);
        setHighlightedNode(node.value);
        setCurrentNodeRole('ROOT');
        setTraversalOutput([...result]);
        await new Promise(r => setTimeout(r, 600));
      }
    };

    await visit(root, 'ROOT');
    setCurrentNodeRole(null);
    setIsTraversing(false);
    setActiveMessage({ text: `${type.toUpperCase()}ORDER Complete`, type: 'info' });
    setTimeout(() => {
      setOperationType(null);
      setHighlightedNode(null);
      setActiveMessage(null);
    }, 3000);
  };

  const handleGenerate = () => {
    const values = new Set<number>();
    while (values.size < 10) {
      values.add(Math.floor(Math.random() * 90) + 10);
    }

    let newRoot: TreeNode | null = null;
    Array.from(values).forEach(val => {
      newRoot = insertNodeRecursive(newRoot, val);
    });

    setRoot(newRoot);
    setTraversalOutput([]);
    setActiveMessage({ text: "Generated 10 Nodes", type: 'success' });
    setTimeout(() => setActiveMessage(null), 2000);
  };

  const handleReset = () => {
    setRoot(null);
    setTraversalOutput([]);
    setActiveMessage({ text: "Tree Reset", type: 'info' });
    setTimeout(() => setActiveMessage(null), 2000);
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!root) return;

    const hierarchy = d3.hierarchy<TreeNode>(root, d => {
      const children = [];
      if (d.left) children.push(d.left);
      if (d.right) children.push(d.right);
      return children;
    });

    const height = Math.max(svgRef.current.clientHeight, hierarchy.height * 100 + 200);
    const width = Math.max(svgRef.current.clientWidth, hierarchy.height * 160);
    const margin = { top: 60, right: 60, bottom: 240, left: 60 };
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const treeLayout = d3.tree<TreeNode>()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
      .separation((a, b) => a.parent === b.parent ? 1.2 : 2);
    const treeData = treeLayout(hierarchy);

    // Links
    g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y)
      .attr("stroke", (d: any) => {
        const targetVal = d.target.data.value;
        const sourceVal = d.source.data.value;
        const targetIdx = traversalPath.indexOf(targetVal);
        const sourceIdx = traversalPath.indexOf(sourceVal);
        if (targetIdx !== -1 && sourceIdx !== -1 && targetIdx === sourceIdx + 1) {
          return operationType === 'delete' ? "#a855f7" : "#fbbf24";
        }
        return "rgba(255,255,255,0.15)";
      })
      .attr("stroke-width", (d: any) => {
        const targetVal = d.target.data.value;
        const sourceVal = d.source.data.value;
        const targetIdx = traversalPath.indexOf(targetVal);
        const sourceIdx = traversalPath.indexOf(sourceVal);
        return (targetIdx !== -1 && sourceIdx !== -1 && targetIdx === sourceIdx + 1) ? 5 : 2.5;
      })
      .style("filter", (d: any) => {
        const targetVal = d.target.data.value;
        const sourceVal = d.source.data.value;
        const targetIdx = traversalPath.indexOf(targetVal);
        const sourceIdx = traversalPath.indexOf(sourceVal);
        if (targetIdx !== -1 && sourceIdx !== -1 && targetIdx === sourceIdx + 1) {
          return `drop-shadow(0 0 12px ${operationType === 'delete' ? "#a855f7" : "#fbbf24"})`;
        }
        return "none";
      })
      .style("transition", "all 0.4s ease");

    // Nodes
    const nodeGroups = g.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle")
      .attr("r", 28)
      .attr("fill", "#0f172a")
      .attr("stroke", (d: any) => {
        if (d.data.value === highlightedNode) {
          if (operationType === 'traverse') return "#10b981";
          return operationType === 'delete' ? "#a855f7" : "#fbbf24";
        }
        if (traversalPath.includes(d.data.value)) return "#fbbf24";
        return "#06b6d4"; // Brighter Cyan
      })
      .attr("stroke-width", (d: any) => (d.data.value === highlightedNode || traversalPath.includes(d.data.value)) ? 4 : 3)
      .style("filter", (d: any) => {
        if (d.data.value === highlightedNode || traversalPath.includes(d.data.value)) {
          let color = "rgba(251,191,36,0.5)";
          if (operationType === 'delete') color = "rgba(168,85,247,0.5)";
          if (operationType === 'traverse') color = "rgba(6,182,212,0.5)";
          return `drop-shadow(0 0 12px ${color})`;
        }
        return "drop-shadow(0 0 6px rgba(6,182,212,0.2))";
      })
      .style("transition", "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)");

    nodeGroups.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "22px")
      .attr("font-weight", "900")
      .text((d: any) => d.data.value);

  }, [root, highlightedNode, traversalPath, operationType, showModal, treeDepth]);

  // Modal Tree Rendering
  useEffect(() => {
    if (!modalSvgRef.current || !showModal) return;
    const svg = d3.select(modalSvgRef.current);
    svg.selectAll("*").remove();
    if (!root) return;

    const hierarchy = d3.hierarchy<TreeNode>(root, d => {
      const children = [];
      if (d.left) children.push(d.left);
      if (d.right) children.push(d.right);
      return children;
    });

    const width = Math.max(500, hierarchy.height * 100);
    const height = Math.max(400, hierarchy.height * 70 + 150);
    const margin = { top: 70, right: 30, bottom: 40, left: 30 };
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const treeLayout = d3.tree<TreeNode>()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
      .separation((a, b) => a.parent === b.parent ? 1.1 : 1.5);
    const treeData = treeLayout(hierarchy);

    // Links
    g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y)
      .attr("stroke", (d: any) => {
        const targetVal = d.target.data.value;
        const sourceVal = d.source.data.value;
        const targetIdx = traversalPath.indexOf(targetVal);
        const sourceIdx = traversalPath.indexOf(sourceVal);
        if (targetIdx !== -1 && sourceIdx !== -1 && targetIdx === sourceIdx + 1) return "#06b6d4";
        return "rgba(255,255,255,0.1)";
      })
      .attr("stroke-width", (d: any) => (traversalPath.includes(d.target.data.value)) ? 4 : 2)
      .style("filter", (d: any) => (traversalPath.includes(d.target.data.value)) ? "drop-shadow(0 0 10px #06b6d4)" : "none");

    // Nodes
    const nodeGroups = g.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle")
      .attr("r", 32)
      .attr("fill", (d: any) => d.data.value === highlightedNode ? "rgba(6,182,212,0.15)" : "#020617")
      .attr("stroke", (d: any) => d.data.value === highlightedNode ? "#06b6d4" : (traversalOutput.includes(d.data.value) ? "#3b82f6" : "rgba(255,255,255,0.15)"))
      .attr("stroke-width", (d: any) => d.data.value === highlightedNode ? 4 : 2)
      .style("filter", (d: any) => {
        if (d.data.value === highlightedNode) {
          return "drop-shadow(0 0 12px rgba(6,182,212,0.5)) drop-shadow(0 0 20px rgba(6,182,212,0.2))";
        }
        if (traversalOutput.includes(d.data.value)) {
          return "drop-shadow(0 0 8px rgba(59,130,246,0.2))";
        }
        return "none";
      })
      .style("transition", "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)");

    nodeGroups.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "24px")
      .attr("font-weight", "900")
      .text((d: any) => d.data.value);

    // Role Label
    nodeGroups.filter((d: any) => d.data.value === highlightedNode && !!currentNodeRole)
      .append("g")
      .attr("transform", "translate(0, -55)")
      .each(function (this: SVGGElement) {
        const g = d3.select(this);
        g.append("rect")
          .attr("x", -25)
          .attr("y", -12)
          .attr("width", 50)
          .attr("height", 24)
          .attr("rx", 6)
          .attr("fill", "#06b6d4")
          .style("filter", "drop-shadow(0 0 10px #06b6d4)");

        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "5")
          .attr("fill", "black")
          .attr("font-size", "10px")
          .attr("font-weight", "950")
          .attr("letter-spacing", "1px")
          .text(currentNodeRole || "");
      });

  }, [root, highlightedNode, traversalPath, traversalOutput, showModal, treeDepth, currentNodeRole]);

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex flex-wrap gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md">
        {/* Standard Operations */}
        <div className="flex gap-2 items-center bg-black/40 p-2 rounded-2xl border border-white/10">
          <input
            type="number"
            placeholder="Value"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-24 bg-transparent px-3 py-1 text-sm focus:outline-none text-cyan-400 font-bold placeholder:text-gray-600"
          />
          <button onClick={handleInsert} className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-xl transition-all border border-cyan-500/30 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg">
            <Plus className="w-4 h-4" /> Insert
          </button>
        </div>

        <div className="flex gap-2 items-center bg-black/40 p-2 rounded-2xl border border-white/10">
          <input
            type="number"
            placeholder="Delete"
            value={deleteValue}
            onChange={(e) => setDeleteValue(e.target.value)}
            className="w-24 bg-transparent px-3 py-1 text-sm focus:outline-none text-rose-400 font-bold placeholder:text-gray-600"
          />
          <button onClick={handleDelete} className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/30 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        {/* Traversal Operations */}
        <div className="flex gap-3 bg-black/40 p-2 rounded-2xl border border-white/10">
          <button onClick={() => handleTraverse('pre')} className="px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-xl transition-all border border-cyan-500/20 text-[11px] font-black tracking-widest uppercase active:scale-95 shadow-lg shadow-cyan-500/5">PREORDER</button>
          <button onClick={() => handleTraverse('in')} className="px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-xl transition-all border border-cyan-500/20 text-[11px] font-black tracking-widest uppercase active:scale-95 shadow-lg shadow-cyan-500/5">INORDER</button>
          <button onClick={() => handleTraverse('post')} className="px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-xl transition-all border border-cyan-500/20 text-[11px] font-black tracking-widest uppercase active:scale-95 shadow-lg shadow-cyan-500/5">POSTORDER</button>
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={handleGenerate} className="p-3 bg-white/5 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 rounded-2xl transition-all border border-white/10 active:scale-95 group" title="Generate Random Tree">
            <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
          <button onClick={handleReset} className="p-3 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-2xl transition-all border border-white/10 active:scale-95" title="Reset Tree">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-black/40 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-inner backdrop-blur-sm">
        {/* Floating Message */}
        <AnimatePresence>
          {activeMessage && (
            <motion.div
              initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className={`absolute top-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl border backdrop-blur-xl shadow-2xl z-50 flex items-center gap-3 font-bold text-xs uppercase tracking-widest
                ${activeMessage.type === 'success' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                  activeMessage.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'}`}
            >
              {activeMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-full overflow-auto custom-scrollbar flex items-start justify-center">
          <svg
            ref={svgRef}
            className="transition-all duration-500 mx-auto block"
            style={{
              width: root ? Math.max(600, treeDepth * 160) : '100%',
              height: root ? Math.max(400, treeDepth * 100 + 200) : '100%',
              minWidth: '100%',
              minHeight: '100%'
            }}
          />
        </div>

        {!root && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-black uppercase tracking-[0.2em] italic">Tree is empty.</div>
        )}

        {/* Traversal Result Modal using Portal */}
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
                      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.15)]">
                        <Search className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                          {activeTraversalType}order <span className="text-cyan-400 not-italic">Traversal</span>
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => activeTraversalType && handleTraverse(activeTraversalType)}
                        disabled={isTraversing}
                        className="p-6 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-3xl border border-cyan-500/20 transition-all active:scale-90 group shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Restart Traversal"
                      >
                        <RotateCcw className={cn("w-8 h-8 transition-transform duration-700", isTraversing ? "animate-spin-slow" : "group-hover:rotate-180")} />
                      </button>

                      <button
                        onClick={() => {
                          traversalIdRef.current++;
                          setShowModal(false);
                          setIsTraversing(false);
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
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className={cn(
                          "absolute top-32 left-1/2 -translate-x-1/2 px-8 py-3 rounded-2xl border backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[10000] flex items-center gap-4 font-black text-xs uppercase tracking-[0.4em]",
                          activeMessage.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-cyan-500/10'
                        )}
                      >
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {activeMessage.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Modal Content */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Tree */}
                    <div className="w-1/2 border-r border-white/5 flex flex-col bg-black/20">
                      <div className="px-12 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent backdrop-blur-md">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-8 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.3)]" />
                          <div>
                            <h3 className="text-lg font-black tracking-tighter text-white uppercase italic">
                              BST <span className="text-cyan-400 not-italic">Visualization</span>
                            </h3>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto custom-scrollbar pt-2 px-16 pb-16 flex items-start justify-center bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)]">
                        <svg
                          ref={modalSvgRef}
                          className="mx-auto block"
                          style={{
                            width: root ? Math.max(600, treeDepth * 120) : '100%',
                            height: root ? Math.max(500, treeDepth * 100 + 250) : '100%',
                            minHeight: 'min-content'
                          }}
                        />
                      </div>
                    </div>

                    {/* Right Panel: Output */}
                    <div className="w-1/2 flex flex-col bg-[#020617]">
                      <div className="px-12 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent backdrop-blur-md">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-8 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.3)]" />
                          <div>
                            <h3 className="text-lg font-black tracking-tighter text-white uppercase italic">
                              Execution <span className="text-cyan-400 not-italic">Output</span>
                            </h3>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                        <div className="flex flex-col gap-8">
                          <div className="flex flex-wrap gap-4 justify-center">
                            {traversalOutput.map((val, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                  "relative w-20 h-20 rounded-xl border flex items-center justify-center transition-all duration-500",
                                  val === highlightedNode
                                    ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] z-10"
                                    : "bg-white/[0.03] border-white/5"
                                )}
                              >
                                <div className="absolute top-1.5 left-2 text-[7px] font-black text-gray-600 uppercase">#{i + 1}</div>
                                <span className={cn(
                                  "text-xl font-black transition-all duration-500",
                                  val === highlightedNode ? "text-cyan-400" : "text-white/80"
                                )}>
                                  {val}
                                </span>

                                {i < traversalOutput.length - 1 && (
                                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                                    <ArrowRight className={cn(
                                      "w-3 h-3",
                                      traversalOutput[i + 1] === highlightedNode ? "text-cyan-500 animate-pulse" : "text-white/10"
                                    )} />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
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
    </div>
  );
};
