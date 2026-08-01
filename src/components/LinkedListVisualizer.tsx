import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Search, Trash2 } from 'lucide-react';
import { useAlgo } from '../context/AlgoContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LinkedListVisualizer: React.FC<{ mode?: 'singly' | 'doubly' | 'circular' }> = ({ mode = 'singly' }) => {
  const { array, setArray, addHistory } = useAlgo();
  const [inputValue, setInputValue] = useState('');
  const [indexInputValue, setIndexInputValue] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [activeMessage, setActiveMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [targetIndex, setTargetIndex] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const arrowHeadRef = useRef<SVGPathElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      if (mode !== 'circular' || array.length < 2) {
        if (svgContainerRef.current) svgContainerRef.current.style.display = 'none';
        return;
      }
      
      if (!containerRef.current || !pathRef.current || !arrowHeadRef.current || !svgContainerRef.current) return;

      const container = containerRef.current;
      const heads = Array.from(container.querySelectorAll('[data-node-type="head"]'));
      const tails = Array.from(container.querySelectorAll('[data-node-type="tail"]'));

      // Filter out exiting nodes (framer-motion usually adds pointer-events: none or we can just pick the last one which is newly entered)
      const head = heads[heads.length - 1];
      const tail = tails[tails.length - 1];

      if (!head || !tail) {
        svgContainerRef.current.style.display = 'none';
        return;
      }

      svgContainerRef.current.style.display = 'block';

      const cRect = container.getBoundingClientRect();
      const hRect = head.getBoundingClientRect();
      const tRect = tail.getBoundingClientRect();

      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      const hx = hRect.left - cRect.left + scrollLeft + hRect.width / 2;
      const hy = hRect.top - cRect.top + scrollTop + hRect.height / 2;
      
      const tx = tRect.left - cRect.left + scrollLeft + tRect.width / 2;
      const ty = tRect.top - cRect.top + scrollTop + tRect.height / 2;

      const bottomY = ty + hRect.height / 2 + 32; 
      const leftX = 32; 

      const path = `M ${tx} ${ty + 32} L ${tx} ${bottomY} L ${leftX} ${bottomY} L ${leftX} ${hy} L ${hx - 40} ${hy}`;
      const arrowhead = `M ${hx - 48} ${hy - 6} L ${hx - 40} ${hy} L ${hx - 48} ${hy + 6}`;

      pathRef.current.setAttribute('d', path);
      arrowHeadRef.current.setAttribute('d', arrowhead);

      // Set height based strictly on the required drawing area to prevent infinite scrollHeight growth
      svgContainerRef.current.style.width = `${Math.max(container.scrollWidth, container.clientWidth)}px`;
      svgContainerRef.current.style.height = `${bottomY + 50}px`;
    };

    renderLoop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [mode, array.length]);

  const handleInsert = (position: 'head' | 'tail' | 'index') => {
    const val = position === 'index' ? parseInt(indexInputValue) : parseInt(inputValue);
    if (isNaN(val)) return;

    if (position === 'head') {
      setArray([val, ...array]);
      addHistory(`Inserted ${val} at Head.`);
      setActiveMessage({ text: `Inserted ${val} at Head`, type: 'success' });
    } else if (position === 'tail') {
      setArray([...array, val]);
      addHistory(`Inserted ${val} at Tail.`);
      setActiveMessage({ text: `Inserted ${val} at Tail`, type: 'success' });
    } else {
      const idx = parseInt(targetIndex);
      if (isNaN(idx) || idx < 0 || idx > array.length) {
        setActiveMessage({ text: "Invalid Index", type: 'error' });
        return;
      }
      const newArr = [...array];
      newArr.splice(idx, 0, val);
      setArray(newArr);
      addHistory(`Inserted ${val} at index ${idx}.`);
      setActiveMessage({ text: `Inserted ${val} at [${idx}]`, type: 'success' });
    }
    
    setTimeout(() => setActiveMessage(null), 2000);
    if (position === 'index') {
      setIndexInputValue('');
      setTargetIndex('');
    } else {
      setInputValue('');
    }
  };

  const handleDelete = (index: number | 'head' | 'tail') => {
    if (array.length === 0) return;
    
    let targetIdx: number;
    if (index === 'head') targetIdx = 0;
    else if (index === 'tail') targetIdx = array.length - 1;
    else targetIdx = index;

    const val = array[targetIdx];
    const newArr = array.filter((_: number, i: number) => i !== targetIdx);
    setArray(newArr);
    addHistory(`Deleted node ${val} at ${typeof index === 'string' ? index : `index ${index}`}.`);
    setActiveMessage({ text: `Deleted ${val}`, type: 'error' });
    setTimeout(() => setActiveMessage(null), 2000);
  };

  const handleSearch = async () => {
    const val = parseInt(searchVal);
    if (isNaN(val)) return;

    addHistory(`Searching for ${val}...`);
    let found = false;
    for (let i = 0; i < array.length; i++) {
      setHighlightIdx(i);
      await new Promise(r => setTimeout(r, 400));
      if (array[i] === val) {
        addHistory(`Found ${val} at index ${i}.`);
        setActiveMessage({ text: `Found ${val} at index ${i}`, type: 'success' });
        setTimeout(() => setActiveMessage(null), 3000);
        found = true;
        break;
      }
    }
    setHighlightIdx(null);
    if (!found) {
      addHistory(`${val} not found in list.`);
      setActiveMessage({ text: `Element ${val} not found`, type: 'error' });
      setTimeout(() => setActiveMessage(null), 3000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 -mt-2 lg:-mt-6">
      {/* List Operations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-3xl bg-black/20 border border-white/5">
        {/* Basic Insert/Delete */}
        <div className="flex flex-col gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/10 shadow-inner">
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-gray-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleInsert('head')} className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-xl transition-all border border-cyan-500/30 text-[9px] font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95">
              <Plus className="w-3 h-3" /> Head
            </button>
            <button onClick={() => handleInsert('tail')} className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-black rounded-xl transition-all border border-purple-500/30 text-[9px] font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95">
              <Plus className="w-3 h-3" /> Tail
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleDelete('head')} className="px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/30 text-[9px] font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95">
              <Trash2 className="w-3 h-3" /> Head
            </button>
            <button onClick={() => handleDelete('tail')} className="px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/30 text-[9px] font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95">
              <Trash2 className="w-3 h-3" /> Tail
            </button>
          </div>
        </div>

        {/* Index Based Operations */}
        <div className="flex flex-col gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/10 shadow-inner">
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Value"
              value={indexInputValue}
              onChange={(e) => setIndexInputValue(e.target.value)}
              className="w-1/2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600"
            />
            <input 
              type="number" 
              placeholder="Index"
              value={targetIndex}
              onChange={(e) => setTargetIndex(e.target.value)}
              className="w-1/2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600"
            />
          </div>
          <button 
            onClick={() => handleInsert('index')} 
            className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded-xl transition-all border border-emerald-500/30 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> Insert at Index
          </button>
        </div>

        {/* Search Operations */}
        <div className="flex flex-col gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/10 shadow-inner h-full justify-center">
          <div className="flex gap-2 items-center flex-nowrap">
            <input 
              type="number" 
              placeholder="Search Value"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-gray-600"
            />
            <button 
              onClick={handleSearch} 
              className="shrink-0 w-12 h-10 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black rounded-xl transition-all border border-amber-500/30 shadow-lg active:scale-95"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visualizer Area */}
      <div className="flex-1 relative w-full flex flex-col min-h-0">
        {/* Floating Notification */}
        <AnimatePresence>
          {activeMessage && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <motion.div
                key={activeMessage.text}
                initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, scale: 0.8, filter: 'blur(10px)' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "border px-8 py-2.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-xl tracking-widest uppercase flex items-center gap-3",
                  activeMessage.type === 'error' 
                    ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/20" 
                    : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-cyan-500/10"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  activeMessage.type === 'error' ? "bg-red-500" : "bg-cyan-400"
                )} />
                {activeMessage.text}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div 
          ref={containerRef}
          className={cn(
            "flex-1 w-full flex flex-wrap content-start px-16 pt-24 pb-16 gap-y-20 gap-x-12 overflow-y-auto overflow-x-hidden custom-scrollbar relative",
            array.length === 0 ? "justify-center items-center" : "justify-center"
          )}
        >
          {/* Global SVG Overlay for Circular Arrow */}
          {mode === 'circular' && array.length > 1 && (
            <div ref={svgContainerRef} className="absolute top-0 left-0 pointer-events-none z-0">
              <svg className="w-full h-full overflow-visible">
                <path 
                  ref={pathRef}
                  fill="none" 
                  stroke="#22d3ee" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-70 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"
                />
                <path
                  ref={arrowHeadRef}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-70 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"
                />
              </svg>
            </div>
          )}

          <AnimatePresence>
          {array.map((val: number, idx: number) => (
            <motion.div 
              key={`${idx}-${val}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center shrink-0"
            >
              <div className="relative group">
                 {/* Node Labels (Head/Tail) */}
                 <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                    {idx === 0 && (
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]">Head</span>
                    )}
                    {idx === array.length - 1 && (
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">Tail</span>
                    )}
                 </div>

                 {/* Node Body */}
                 <div 
                   data-node-type={idx === 0 ? 'head' : (idx === array.length - 1 ? 'tail' : 'node')}
                   className={cn(
                     "w-16 h-16 rounded-2xl border flex flex-col items-center justify-center bg-black/60 shadow-xl transition-all duration-300 relative group z-10",
                    highlightIdx === idx 
                      ? 'border-amber-400 shadow-amber-400/30 scale-110 z-10' 
                      : 'border-white/10 group-hover:border-white/30'
                 )}>
                    <span className="text-[11px] text-gray-500 font-black mb-0.5 tracking-widest">[{idx}]</span>
                    <span className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{val}</span>
                    
                    {/* Delete Action Overlay */}
                    <button 
                      onClick={() => handleDelete(idx)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white hover:scale-110 shadow-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Doubly Prev Pointer */}
                    {mode === 'doubly' && idx > 0 && (
                      <div className="absolute top-[60%] -left-10 -translate-y-1/2 flex items-center drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: 40 }}
                          className="h-[2px] bg-purple-400 relative rounded-full"
                        >
                          <ArrowRight className="w-4 h-4 text-purple-400 absolute -left-2 top-1/2 -translate-y-1/2 rotate-180 stroke-[2px]" />
                        </motion.div>
                      </div>
                    )}
                 </div>

                 {/* Next Pointer Arrow */}
                 {idx < array.length - 1 && (
                   <div className={cn("absolute -right-10 -translate-y-1/2 flex items-center", mode === 'doubly' ? "top-[40%]" : "top-1/2", highlightIdx === idx ? "drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" : "drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]")}>
                     <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 40 }}
                        className={cn("h-[2px] relative rounded-full", highlightIdx === idx ? "bg-amber-400" : "bg-cyan-400")}
                      >
                        <ArrowRight className={cn(
                          "w-4 h-4 absolute -right-2 top-1/2 -translate-y-1/2 transition-colors stroke-[2px]",
                          highlightIdx === idx ? "text-amber-400" : "text-cyan-400"
                        )} />
                      </motion.div>
                   </div>
                 )}


              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {array.length === 0 && (
          <div className="flex flex-col items-center gap-4 text-gray-600">
            <div className="p-8 rounded-full bg-white/5 border border-white/5 animate-pulse">
               <Plus className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em] italic">List is empty</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
