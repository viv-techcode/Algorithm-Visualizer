import React, { useState, useRef } from 'react'
import { Activity, Layers, Share2, Play, Pause, RotateCcw, BarChart3, ChevronDown, GitBranch, Database, Network, ArrowDownNarrowWide } from 'lucide-react'
import { useAlgo } from './context/AlgoContext'
import { 
  bubbleSortSteps, selectionSortSteps, insertionSortSteps, 
  quickSortSteps, mergeSortSteps, heapSortSteps, SortingStep 
} from './algorithms/sorting'
import { motion } from 'framer-motion'
import { LinkedListVisualizer } from './components/LinkedListVisualizer'
import { StackQueueVisualizer } from './components/StackQueueVisualizer'
import { BSTVisualizer } from './components/BSTVisualizer'
import { GraphVisualizer } from './components/GraphVisualizer'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function App() {
  const {
    array, setArray, isRunning, setIsRunning, speed, setSpeed,
    comparisons, setComparisons, swaps, setSwaps,
    currentIndices, setCurrentIndices, history, addHistory,
    resetAlgo, generateRandomArray
  } = useAlgo();

  const [selectedSorting, setSelectedSorting] = useState('Bubble Sort');
  const [selectedDS, setSelectedDS] = useState('Linked List');
  const [viewMode, setViewMode] = useState<'sorting' | 'ds'>('sorting');
  const selectedAlgo = viewMode === 'sorting' ? selectedSorting : selectedDS;
  const [arraySize, setArraySize] = useState(20);
  const [isPaused, setIsPaused] = useState(false);
  const cancelRef = useRef(false);
  const isPausedRef = useRef(false); // Using ref for immediate access in loop
  const [currentStep, setCurrentStep] = useState<SortingStep | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const handleManualLoad = () => {
    const nums = manualInput.split(',')
      .map(n => n.trim())
      .filter(n => n !== '')
      .map(n => parseInt(n))
      .filter(n => !isNaN(n));

    if (nums.length < 10) {
      addHistory("Error: Minimum 10 numbers required for manual input.");
      return;
    }

    // Clamp numbers to valid range for visualization
    const clampedNums = nums.map(n => Math.min(100, Math.max(1, n)));
    
    setArray(clampedNums);
    setArraySize(clampedNums.length);
    resetAlgo();
    setCurrentStep(null);
    addHistory(`Loaded manual array of ${clampedNums.length} elements.`);
    setManualInput('');
  };

  // Improved runSorting with AbortController for better control
  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    isPausedRef.current = !isPaused;
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
  };

  const handlePlay = async () => {
    if (isRunning) {
      handlePauseToggle();
      return;
    }
    
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    cancelRef.current = false;
    setComparisons(0);
    setSwaps(0);
    addHistory(`Executing ${selectedAlgo}...`);
    
    let steps: SortingStep[] = [];
    if (selectedAlgo === 'Bubble Sort') steps = bubbleSortSteps(array);
    if (selectedAlgo === 'Selection Sort') steps = selectionSortSteps(array);
    if (selectedAlgo === 'Insertion Sort') steps = insertionSortSteps(array);
    if (selectedAlgo === 'Quick Sort') steps = quickSortSteps(array);
    if (selectedAlgo === 'Merge Sort') steps = mergeSortSteps(array);
    if (selectedAlgo === 'Heap Sort') steps = heapSortSteps(array);
    
    for (const step of steps) {
      if (cancelRef.current) break;

      while (isPausedRef.current) {
        if (cancelRef.current) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (cancelRef.current) break;

      setArray(step.array);
      setCurrentIndices(step.indices);
      setCurrentStep(step);
      if (step.type === 'compare') setComparisons((prev: number) => prev + 1);
      if (step.type === 'swap') setSwaps((prev: number) => prev + 1);
      
      await new Promise(resolve => setTimeout(resolve, Math.max(10, Math.pow((101 - speed) / 100, 2) * 2000)));
    }
    
    if (cancelRef.current) {
      addHistory(`${selectedAlgo} cancelled.`);
    } else {
      addHistory(`${selectedAlgo} completed.`);
    }

    setIsRunning(false);
    setIsPaused(false);
    isPausedRef.current = false;
    cancelRef.current = false;
    setCurrentIndices([]);
    setCurrentStep(null);
  };

  const complexities: Record<string, { best: string, avg: string, worst: string }> = {
    'Bubble Sort': { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)' },
    'Selection Sort': { best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)' },
    'Insertion Sort': { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)' },
    'Quick Sort': { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)' },
    'Merge Sort': { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' },
    'Heap Sort': { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' },
  };

  // Data structure operation complexities
  const dsComplexities: Record<string, { label: string, value: string, color: string }[]> = {
    'Linked List': [
      { label: 'Insert (Head)', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Insert (Tail)', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Delete (Head)', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Delete (Tail)', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Search', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Traversal', value: 'O(n)', color: 'text-amber-400' },
    ],
    'Doubly Linked List': [
      { label: 'Insert (Head)', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Insert (Tail)', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Delete (Head)', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Delete (Tail)', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Search', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Traversal', value: 'O(n)', color: 'text-amber-400' },
    ],
    'Circular Linked List': [
      { label: 'Insert (Head)', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Insert (Tail)', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Delete (Head)', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Delete (Tail)', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Search', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Traversal', value: 'O(n)', color: 'text-amber-400' },
    ],
    'Stack': [
      { label: 'Push', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Pop', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Peek', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Search', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Space', value: 'O(n)', color: 'text-amber-400' },
    ],
    'Queue': [
      { label: 'Enqueue', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Dequeue', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Peek', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Search', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Space', value: 'O(n)', color: 'text-amber-400' },
    ],
    'Circular Queue': [
      { label: 'Enqueue', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Dequeue', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Peek', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Search', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Space', value: 'O(n)', color: 'text-amber-400' },
    ],
    'Deque': [
      { label: 'Insert Front/Rear', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Delete Front/Rear', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Peek', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Search', value: 'O(n)', color: 'text-amber-400' },
      { label: 'Space', value: 'O(n)', color: 'text-amber-400' },
    ],
    'BST': [
      { label: 'Insert (avg)', value: 'O(log n)', color: 'text-emerald-400' },
      { label: 'Insert (worst)', value: 'O(n)', color: 'text-red-400' },
      { label: 'Delete (avg)', value: 'O(log n)', color: 'text-emerald-400' },
      { label: 'Delete (worst)', value: 'O(n)', color: 'text-red-400' },
      { label: 'Search (avg)', value: 'O(log n)', color: 'text-emerald-400' },
      { label: 'Search (worst)', value: 'O(n)', color: 'text-red-400' },
      { label: 'Inorder / Preorder / Postorder', value: 'O(n)', color: 'text-amber-400' },
    ],
    'Graph': [
      { label: 'Add Node', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Add Edge', value: 'O(1)', color: 'text-emerald-400' },
      { label: 'Delete Node', value: 'O(V+E)', color: 'text-red-400' },
      { label: 'BFS Traversal', value: 'O(V+E)', color: 'text-amber-400' },
      { label: 'DFS Traversal', value: 'O(V+E)', color: 'text-amber-400' },
      { label: 'Space (Adj. List)', value: 'O(V+E)', color: 'text-amber-400' },
    ],
  };

  const complexity = complexities[selectedAlgo] || { best: 'N/A', avg: 'N/A', worst: 'N/A' };
  const isDSMode = viewMode === 'ds';
  const dsOps = dsComplexities[selectedAlgo] || [];

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-cyan-500/30 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-r from-white to-gray-400">
              AlgoVision <span className="text-cyan-400 font-black tracking-tighter">VISUAL DSA</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => {
                setViewMode('sorting');
                generateRandomArray(arraySize);
                setCurrentStep(null);
              }}
              className={cn(
                "px-4 py-2 rounded-lg transition-all text-sm font-semibold",
                viewMode === 'sorting' ? "bg-white/5 border border-white/10 text-white" : "text-gray-500 hover:text-white"
              )}
            >Sorting</button>
            <button 
               onClick={() => {
                 setViewMode('ds');
                 if (['Linked List', 'Doubly Linked List', 'Circular Linked List', 'Queue', 'Circular Queue', 'Deque'].includes(selectedDS)) {
                   setArraySize(10);
                   generateRandomArray(10);
                 } else {
                   setArray([10, 20, 30, 40]);
                 }
                 setCurrentStep(null);
               }}
               className={cn(
                "px-4 py-2 rounded-lg transition-all text-sm font-semibold",
                viewMode === 'ds' ? "bg-white/5 border border-white/10 text-white" : "text-gray-500 hover:text-white"
              )}
            >Data Structures</button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Controls Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Configuration</h2>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Algorithm / Data Structures</label>
                  
                  {/* Custom Dropdown Trigger */}
                  <div 
                    onClick={() => !isRunning && setIsDropdownOpen(!isDropdownOpen)}
                    className={cn(
                      "w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-all hover:bg-black/60",
                      isRunning && "opacity-50 cursor-not-allowed",
                      isDropdownOpen && "ring-2 ring-cyan-500/50 border-cyan-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-cyan-400">
                        {selectedAlgo === 'Bubble Sort' || selectedAlgo === 'Quick Sort' || selectedAlgo === 'Merge Sort' ? (
                          <ArrowDownNarrowWide className="w-4 h-4" />
                        ) : selectedAlgo === 'Linked List' ? (
                          <Layers className="w-4 h-4" />
                        ) : selectedAlgo === 'Stack' || selectedAlgo === 'Queue' ? (
                          <Database className="w-4 h-4" />
                        ) : selectedAlgo === 'BST' ? (
                          <GitBranch className="w-4 h-4" />
                        ) : (
                          <Network className="w-4 h-4" />
                        )}
                      </div>
                      <span className="font-medium text-gray-200">{selectedAlgo}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      {/* Backdrop for closing */}
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsDropdownOpen(false)} />
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute top-full left-0 right-0 mt-2 z-[70] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[320px] py-2"
                      >
                        <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sorting</div>
                        {['Bubble Sort', 'Selection Sort', 'Insertion Sort', 'Quick Sort', 'Merge Sort', 'Heap Sort'].map((algo) => (
                          <button
                            key={algo}
                            onClick={() => {
                              setSelectedSorting(algo);
                              setViewMode('sorting');
                              generateRandomArray(arraySize);
                              setCurrentStep(null);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors hover:bg-white/5",
                              selectedAlgo === algo ? "text-cyan-400 bg-cyan-500/5" : "text-gray-400"
                            )}
                          >
                            <ArrowDownNarrowWide className="w-4 h-4 opacity-50" />
                            {algo}
                          </button>
                        ))}
                        
                        <div className="h-px bg-white/5 my-2 mx-3" />
                        
                        <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Data Structures</div>
                        {[
                          { name: 'Linked List', icon: <Layers className="w-4 h-4 opacity-50" /> },
                          { name: 'Doubly Linked List', icon: <Layers className="w-4 h-4 opacity-50" /> },
                          { name: 'Circular Linked List', icon: <Layers className="w-4 h-4 opacity-50" /> },
                          { name: 'Circular Queue', icon: <RotateCcw className="w-4 h-4 opacity-50" /> },
                          { name: 'Deque', icon: <Share2 className="w-4 h-4 opacity-50" /> },
                          { name: 'Stack', icon: <Database className="w-4 h-4 opacity-50" /> },
                          { name: 'Queue', icon: <Database className="w-4 h-4 opacity-50" /> },
                          { name: 'BST', icon: <GitBranch className="w-4 h-4 opacity-50" /> },
                          { name: 'Graph', icon: <Network className="w-4 h-4 opacity-50" /> }
                        ].map((ds) => (
                          <button
                            key={ds.name}
                            onClick={() => {
                              setSelectedDS(ds.name);
                              setViewMode('ds');
                              if (['Linked List', 'Doubly Linked List', 'Circular Linked List', 'Queue', 'Circular Queue', 'Deque'].includes(ds.name)) {
                                setArraySize(10);
                                generateRandomArray(10);
                              } else {
                                setArray([10, 20, 30, 40]);
                              }
                              setCurrentStep(null);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors hover:bg-white/5",
                              selectedAlgo === ds.name ? "text-cyan-400 bg-cyan-500/5" : "text-gray-400"
                            )}
                          >
                            {ds.icon}
                            {ds.name}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Array Size</label>
                    <input 
                      type="number" 
                      min="10" 
                      max="100" 
                      value={arraySize === 0 ? '' : arraySize}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          setArraySize(val);
                        } else {
                          // If empty or NaN, we can keep it as is to allow user to type
                          setArraySize(0); 
                        }
                      }}
                      onBlur={() => {
                        if (arraySize < 10) {
                          window.alert("Minimum 10 numbers are required");
                          setArraySize(10);
                        } else if (arraySize > 100) {
                          setArraySize(100);
                        }
                      }}
                      disabled={isRunning}
                      className="w-20 bg-black/40 border border-white/10 rounded-xl py-2 text-sm font-mono text-cyan-400 text-center focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={arraySize === 0 ? 10 : arraySize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = parseInt(e.target.value);
                      setArraySize(val);
                    }}
                    disabled={isRunning}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50" 
                  />
                </div>

                {viewMode === 'sorting' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Manual Input</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value.replace(/\s+/g, ','))}
                        placeholder="10+ numbers: 12, 45, 67..."
                        disabled={isRunning}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-cyan-200 placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50"
                      />
                      <button 
                        onClick={handleManualLoad}
                        disabled={isRunning || !manualInput.trim()}
                        className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-xl border border-cyan-500/30 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95 disabled:opacity-30 whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Speed</label>
                    <div className="relative w-20 group">
                      <input 
                        type="number" 
                        min="1" 
                        max="100" 
                        value={speed}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            setSpeed(Math.min(100, Math.max(1, val)));
                          } else {
                            setSpeed(0);
                          }
                        }}
                        onBlur={() => {
                          if (speed < 1) setSpeed(1);
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pr-6 text-sm font-mono text-purple-400 text-center focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-purple-400/60 pointer-events-none group-focus-within:text-purple-400">
                        %
                      </span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={speed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpeed(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" 
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button 
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePlay}
                    className={cn(
                      "flex-[2] h-14 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all relative overflow-hidden group/main shadow-2xl",
                      !isRunning 
                        ? "bg-gradient-to-br from-cyan-400 to-cyan-600 text-black shadow-cyan-500/40" 
                        : isPaused 
                          ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-emerald-500/40" 
                          : "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-amber-500/40"
                    )}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/main:opacity-100 transition-opacity" />
                    {!isRunning ? (
                      <Play className="w-5 h-5 fill-current" />
                    ) : isPaused ? (
                      <Play className="w-5 h-5 fill-current" />
                    ) : (
                      <Pause className="w-5 h-5 fill-current" />
                    )}
                    
                    <span className="tracking-tight uppercase text-xs">
                      {!isRunning ? 'Start Viz' : isPaused ? 'Resume' : 'Pause'}
                    </span>
                  </motion.button>

                  {isRunning ? (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCancel}
                      className="flex-1 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all shadow-xl shadow-red-500/10 group/cancel"
                    >
                      <span className="tracking-tight uppercase text-xs font-bold">Cancel</span>
                    </motion.button>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const finalSize = Math.min(100, Math.max(10, arraySize));
                        setArraySize(finalSize);
                        resetAlgo();
                        generateRandomArray(finalSize);
                        setCurrentStep(null);
                      }}
                      className="flex-1 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 flex items-center justify-center transition-all hover:border-purple-500/40 text-purple-400 hover:text-white shadow-xl hover:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]"
                    >
                      <span className="tracking-tight uppercase text-xs font-bold drop-shadow-md">Generate</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Complexity Table */}
            <div className="p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Big O Complexity</h2>
              </div>
              {isDSMode ? (
                <div className="space-y-2">
                  {dsOps.map((op, i) => (
                    <div key={i} className="flex justify-between text-[11px] py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-gray-400">{op.label}</span>
                      <span className={`font-mono font-bold ${op.color}`}>{op.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] py-1 border-b border-white/5">
                    <span className="text-gray-400">Best Case</span>
                    <span className="text-emerald-400 font-mono font-bold">{complexity.best}</span>
                  </div>
                  <div className="flex justify-between text-[11px] py-1 border-b border-white/5">
                    <span className="text-gray-400">Average Case</span>
                    <span className="text-amber-400 font-mono font-bold">{complexity.avg}</span>
                  </div>
                  <div className="flex justify-between text-[11px] py-1">
                    <span className="text-gray-400">Worst Case</span>
                    <span className="text-red-400 font-mono font-bold">{complexity.worst}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Metrics Dashboard */}
            <div className="p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Live Metrics</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Comparisons</p>
                  <p className="text-xl font-mono font-bold text-cyan-400">{viewMode === 'sorting' ? comparisons : '-'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Swaps</p>
                  <p className="text-xl font-mono font-bold text-purple-400">{viewMode === 'sorting' ? swaps : '-'}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Visualization Area */}
          <section className="lg:col-span-3 space-y-6">

            {/* Premium Active Title Banner */}
            <motion.div
              key={selectedAlgo}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col gap-3 px-1"
            >
              <div className="flex items-center gap-5">
                <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${isDSMode ? 'bg-gradient-to-b from-emerald-400 to-cyan-500 shadow-[0_0_16px_rgba(16,185,129,0.7)]' : 'bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_16px_rgba(6,182,212,0.7)]'}`} />
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">{isDSMode ? 'Data Structure' : 'Sorting Algorithm'}</p>
                  <h2 className="text-4xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/30">
                    {selectedAlgo}
                    {selectedAlgo === 'BST' && (
                      <span className="text-xl font-semibold text-white/30 ml-3 tracking-normal normal-case">(Binary Search Tree)</span>
                    )}
                  </h2>
                </div>
              </div>
              {/* Fading separator line */}
              <div className={`h-px w-full bg-gradient-to-r ${isDSMode ? 'from-emerald-500/40 via-white/5 to-transparent' : 'from-cyan-500/40 via-white/5 to-transparent'}`} />
            </motion.div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className={cn(
                "relative p-6 lg:p-10 rounded-[2.2rem] border border-white/10 bg-black/40 shadow-2xl overflow-hidden flex flex-col items-center justify-center transition-all",
                (selectedAlgo === 'Circular Queue' || selectedAlgo === 'BST' || selectedAlgo === 'Graph') ? "lg:h-[700px] w-full" : "aspect-[16/9] lg:h-[540px]"
              )}>
                
                {viewMode === 'sorting' ? (
                  <div className="w-full h-full flex items-end justify-center gap-1 lg:gap-1.5">
                    {array.map((value: number, i: number) => {
                      const isCurrent = currentIndices.includes(i);
                      const special = currentStep?.specialIndices;
                      const isPivot = special?.pivot === i;
                      const isMin = special?.minIdx === i;
                      const isSorted = special?.sortedIdx === i;
                      const isHeap = special?.heapIdx === i;
                      const isMid = special?.mid === i;
                      const isLow = special?.low === i;
                      const isHigh = special?.high === i;

                      return (
                        <motion.div 
                          key={i} 
                          layout
                          initial={false}
                          animate={{
                            height: `${value}%`,
                            backgroundColor: isPivot ? '#f43f5e' : 
                                           isMin ? '#fbbf24' : 
                                           isSorted ? '#10b981' : 
                                           isHeap ? '#8b5cf6' : 
                                           isMid ? '#3b82f6' :
                                           isLow || isHigh ? '#f97316' :
                                           isCurrent ? '#22d3ee' : '#1e1b4b',
                          }}
                          className={cn(
                            "flex-1 rounded-full min-w-[2px] relative group/bar",
                            (isCurrent || isPivot || isMin || isSorted || isMid || isLow || isHigh) && "shadow-[0_0_15px_-3px_rgba(34,211,238,0.5)]"
                          )}
                        >
                          {/* Value Number */}
                          <div className={cn(
                            "absolute left-1/2 -translate-x-1/2 font-bold z-10 transition-colors drop-shadow-md",
                            array.length > 50 ? "text-[9px] -top-4 text-white/50" : 
                            array.length > 30 ? "text-[11px] -top-5 text-white/70" : 
                            "text-sm -top-6 text-white"
                          )}>
                            {value}
                          </div>

                          {/* Marker Tag */}
                          {(isCurrent || isPivot || isMin || isSorted || isHeap || isMid || isLow || isHigh) && (
                            <div className={cn(
                              "absolute left-1/2 -translate-x-1/2 font-black whitespace-nowrap uppercase tracking-tight rounded-md border z-20 backdrop-blur-md shadow-lg",
                              array.length > 50 ? "-top-8 text-[8px] px-1.5 py-0.5" : 
                              array.length > 30 ? "-top-11 text-[10px] px-2 py-0.5" : 
                              "-top-14 text-xs px-2.5 py-1",
                              isPivot ? "bg-rose-500/20 border-rose-500/30 text-rose-300" :
                              isMin ? "bg-amber-500/20 border-amber-500/30 text-amber-300" :
                              isSorted ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                              isHeap ? "bg-violet-500/20 border-violet-500/30 text-violet-300" :
                              isMid ? "bg-blue-500/20 border-blue-500/30 text-blue-300" :
                              isLow ? "bg-orange-500/20 border-orange-500/30 text-orange-300" :
                              isHigh ? "bg-orange-500/20 border-orange-500/30 text-orange-300" :
                              "bg-cyan-500/20 border-cyan-500/30 text-cyan-300"
                            )}>
                              {isPivot ? 'Pivot' : isMin ? 'Min' : isSorted ? 'Sorted' : isHeap ? 'Heap' : isMid ? 'Mid' : isLow ? 'Low' : isHigh ? 'High' : 'Active'}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {selectedAlgo === 'Linked List' && <LinkedListVisualizer mode="singly" />}
                    {selectedAlgo === 'Doubly Linked List' && <LinkedListVisualizer mode="doubly" />}
                    {selectedAlgo === 'Circular Linked List' && <LinkedListVisualizer mode="circular" />}
                    {selectedAlgo === 'Stack' && <StackQueueVisualizer mode="stack" />}
                    {selectedAlgo === 'Queue' && <StackQueueVisualizer mode="queue" />}
                    {selectedAlgo === 'Circular Queue' && <StackQueueVisualizer mode="circular-queue" />}
                    {selectedAlgo === 'Deque' && <StackQueueVisualizer mode="deque" />}
                    {selectedAlgo === 'BST' && <BSTVisualizer />}
                    {selectedAlgo === 'Graph' && <GraphVisualizer />}
                  </>
                )}

                {/* Legend/Empty State Overlay */}
                {viewMode === 'sorting' && array.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium pointer-events-none">
                    Initialize an array to begin
                  </div>
                )}
              </div>
            </div>

            {/* History Log */}
            <div className="p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Execution Log</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <div className="space-y-1 h-36 overflow-y-auto pr-2 custom-scrollbar flex flex-col-reverse">
                {history.map((log: string, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className="flex items-start gap-4 text-[11px] text-gray-400 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors group"
                  >
                    <span className="text-gray-600 font-mono mt-0.5">{history.length - idx}.</span>
                    <span className="group-hover:text-gray-300 transition-colors uppercase tracking-tight">{log}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
