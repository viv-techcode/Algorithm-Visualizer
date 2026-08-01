import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlgo } from '../context/AlgoContext';
import { Layers, RotateCcw, Share2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const StackQueueVisualizer: React.FC<{ mode: 'stack' | 'queue' | 'circular-queue' | 'deque' }> = ({ mode }) => {
  const { array, setArray, addHistory } = useAlgo();
  const [inputValue, setInputValue] = useState('');
  const [activeMessage, setActiveMessage] = useState<{ text: string, type: 'push' | 'pop' } | null>(null);
  const [peekedIdx, setPeekedIdx] = useState<number | null>(null);
  
  // Circular Queue specific state
  const CIRCULAR_CAPACITY = 10;
  
  const [circularBuffer, setCircularBuffer] = useState<(number | null)[]>(() => {
    const initial = Array(CIRCULAR_CAPACITY).fill(null);
    for (let i = 0; i < CIRCULAR_CAPACITY; i++) {
      initial[i] = Math.floor(Math.random() * 90) + 10;
    }
    return initial;
  });
  const [fIdx, setFIdx] = useState(0);
  const [rIdx, setRIdx] = useState(CIRCULAR_CAPACITY - 1);

  // Constants
  const MAX_SIZE = 20;

  const handlePush = (side: 'back' | 'front' = 'back') => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;

    if (mode === 'circular-queue') {
      const nextRear = (rIdx + 1) % CIRCULAR_CAPACITY;
      if (nextRear === fIdx) {
        addHistory("Circular Queue Full!");
        return;
      }
      
      const newBuffer = [...circularBuffer];
      newBuffer[nextRear] = val;
      setCircularBuffer(newBuffer);
      if (fIdx === -1) setFIdx(0);
      setRIdx(nextRear);
      addHistory(`Enqueued ${val} at index ${nextRear}`);
      setActiveMessage({ text: `Enqueued ${val}`, type: 'push' });
    } else {
      if (array.length >= MAX_SIZE) {
        addHistory(`${mode.replace('-', ' ')} Full! Cannot add more elements.`);
        return;
      }

      if (side === 'front') {
        setArray([val, ...array]);
        addHistory(`Added ${val} to front.`);
      } else {
        setArray([...array, val]);
        addHistory(`${mode === 'stack' ? 'Pushed' : 'Added to back'} ${val}.`);
      }
      setActiveMessage({ 
        text: `${mode === 'stack' ? 'Pushed' : 'Added'} ${val}`, 
        type: 'push' 
      });
    }
    setTimeout(() => setActiveMessage(null), 2000);
    setInputValue('');
  };

  const handlePop = (side: 'back' | 'front' = 'front') => {
    if (mode === 'circular-queue') {
      if (fIdx === -1) {
        addHistory("Circular Queue Underflow!");
        return;
      }
      const popped = circularBuffer[fIdx];
      const newBuffer = [...circularBuffer];
      newBuffer[fIdx] = null;
      setCircularBuffer(newBuffer);
      
      if (fIdx === rIdx) {
        setFIdx(-1);
        setRIdx(-1);
      } else {
        setFIdx((fIdx + 1) % CIRCULAR_CAPACITY);
      }
      addHistory(`Dequeued ${popped} from index ${fIdx}`);
      setActiveMessage({ text: `Dequeued ${popped}`, type: 'pop' });
    } else {
      if (array.length === 0) {
        addHistory("Underflow! Structure is empty.");
        return;
      }
      
      let popped;
      let newArr;

      if (side === 'back') {
        popped = array[array.length - 1];
        newArr = array.slice(0, -1);
      } else {
        popped = array[0];
        newArr = array.slice(1);
      }

      setArray(newArr);
      addHistory(`${mode === 'stack' ? 'Popped' : 'Removed from ' + side} ${popped}.`);
      
      setActiveMessage({ 
        text: `${mode === 'stack' ? 'Popped' : 'Removed'} ${popped}`, 
        type: 'pop' 
      });
    }
    setTimeout(() => setActiveMessage(null), 2000);
  };

  const handlePeek = (side: 'back' | 'front' = 'front') => {
    if (mode === 'circular-queue') {
      if (fIdx === -1) return;
      const idx = side === 'back' ? rIdx : fIdx;
      setPeekedIdx(idx);
      addHistory(`Peeked ${side === 'back' ? 'Rear' : 'Front'}: ${circularBuffer[idx]}`);
      setTimeout(() => setPeekedIdx(null), 1000);
    } else {
      if (array.length === 0) return;
      const idx = side === 'back' ? array.length - 1 : 0;
      setPeekedIdx(idx);
      addHistory(`Peeked ${side === 'back' ? 'Top/Rear' : 'Front'}: ${array[idx]}`);
      setTimeout(() => setPeekedIdx(null), 1000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-8 relative">
      {/* Floating Message Notification */}
      <AnimatePresence>
        {activeMessage && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full flex justify-center">
            <motion.div
              key={activeMessage.text}
              initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, scale: 0.8, filter: 'blur(10px)' }}
              transition={{ type: "spring", stiffness: 400, damping: 30, opacity: { duration: 0.2 } }}
              className={cn(
                "border px-8 py-2.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-xl tracking-widest uppercase flex items-center gap-3",
                activeMessage.type === 'pop' 
                  ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/20" 
                  : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-cyan-500/10"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                activeMessage.type === 'pop' ? "bg-red-500" : "bg-cyan-400"
              )} />
              {activeMessage.text}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 p-6 rounded-3xl bg-black/20 border border-white/5">
        <div className="flex-1 flex flex-wrap items-center gap-4 bg-white/[0.03] p-2.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              placeholder="Value"
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
              className="w-24 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium text-cyan-400 placeholder:text-gray-600 shadow-inner"
            />
            {mode === 'deque' ? (
              <div className="flex gap-2">
                <button onClick={() => handlePush('front')} className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-black border border-purple-500/30 rounded-xl text-[10px] font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-500/5">
                  PUSH FRONT
                </button>
                <button onClick={() => handlePush('back')} className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/30 rounded-xl text-[10px] font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-cyan-500/5">
                  PUSH BACK
                </button>
              </div>
            ) : (
              <button onClick={() => handlePush('back')} className="px-8 py-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/30 rounded-xl text-xs font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-cyan-500/5">
                {mode === 'stack' ? 'PUSH' : 'ENQUEUE'}
              </button>
            )}
          </div>

          <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block" />

          <div className="flex gap-2">
            {mode === 'deque' ? (
              <>
                <button onClick={() => handlePeek('front')} className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl text-[10px] font-black tracking-widest hover:bg-white/20 transition-all shadow-lg">PEEK FRONT</button>
                <button onClick={() => handlePeek('back')} className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl text-[10px] font-black tracking-widest hover:bg-white/20 transition-all shadow-lg">PEEK BACK</button>
              </>
            ) : (
              <button onClick={() => handlePeek(mode === 'stack' ? 'back' : 'front')} className="px-6 py-2 bg-white/10 text-white border border-white/20 rounded-xl text-[10px] font-black tracking-widest hover:bg-white/20 transition-all shadow-lg">
                PEEK {mode === 'stack' ? 'TOP' : 'FRONT'}
              </button>
            )}
          </div>

          <div className="ml-auto flex gap-2">
            {mode === 'deque' ? (
              <>
                <button onClick={() => handlePop('front')} className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-red-500/5">
                  POP FRONT
                </button>
                <button onClick={() => handlePop('back')} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all active:scale-95">
                  POP BACK
                </button>
              </>
            ) : (
              <button onClick={() => handlePop(mode === 'stack' ? 'back' : 'front')} className="px-8 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black tracking-widest shadow-xl shadow-red-600/30 active:scale-95 transition-all">
                {mode === 'stack' ? 'POP' : 'DEQUEUE'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={cn(
        "flex-1 p-10 overflow-auto relative flex",
        mode === 'stack' ? "flex-col-reverse justify-start items-center" : (mode === 'circular-queue' ? "justify-center items-center" : "justify-start items-center")
      )}>


        <AnimatePresence mode="wait">
          {array.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-5 text-gray-400 select-none mx-auto"
            >
              <div className="p-8 rounded-full bg-white/5 border border-white/10 shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]">
                <Layers className="w-10 h-10 text-cyan-400/40" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-white">
                  {mode.replace('-', ' ')} is Empty
                </p>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                  Insert elements to begin visualization
                </p>
              </div>
            </motion.div>
          ) : mode === 'circular-queue' ? (
            <div className="flex flex-col items-center gap-12 mx-auto min-w-max">
              <div className="relative w-[400px] h-[400px]">
                {/* Circular Track Background */}
                <div className="absolute inset-0 rounded-full border-[16px] border-white/5 shadow-inner" />
                
                {circularBuffer.map((val, i) => {
                  const angle = (i * 360) / CIRCULAR_CAPACITY - 90;
                  const radius = 160;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  const isFront = i === fIdx;
                  const isRear = i === rIdx;
                  const isPeeked = peekedIdx === i;
                  
                  return (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: isPeeked ? 1.1 : 1,
                        borderColor: isPeeked ? 'rgba(6,182,212,0.5)' : (val !== null ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'),
                        backgroundColor: isPeeked ? 'rgba(6,182,212,0.1)' : (val !== null ? 'rgba(255,255,255,0.05)' : 'transparent'),
                      }}
                      className="absolute w-20 h-20 rounded-2xl border flex flex-col items-center justify-center shadow-2xl transition-all"
                      style={{ 
                        left: `calc(50% + ${x}px - 40px)`, 
                        top: `calc(50% + ${y}px - 40px)` 
                      }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Idx {i}
                      </div>

                      {val !== null ? (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex flex-col items-center"
                        >
                          <span className="text-xl font-bold text-cyan-400">{val}</span>
                        </motion.div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-800 opacity-30" />
                      )}

                      {/* Head/Tail Markers */}
                      {(isFront || isRear) && (
                        <div className="absolute -bottom-10 flex flex-col items-center gap-1">
                          {isFront && (
                            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-md text-[9px] font-black text-cyan-400 uppercase tracking-tighter shadow-lg shadow-cyan-500/10">FRONT</span>
                          )}
                          {isRear && (
                            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-md text-[9px] font-black text-amber-400 uppercase tracking-tighter shadow-lg shadow-amber-500/10">REAR</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Center Info Panel */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-full w-40 h-40 justify-center text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Status</p>
                    <p className={cn(
                      "text-sm font-black uppercase tracking-tight",
                      fIdx === -1 ? "text-gray-400" : (rIdx + 1) % CIRCULAR_CAPACITY === fIdx ? "text-red-400" : "text-emerald-400"
                    )}>
                      {fIdx === -1 ? 'Empty' : (rIdx + 1) % CIRCULAR_CAPACITY === fIdx ? 'Full' : 'Available'}
                    </p>
                    <div className="h-px w-12 bg-white/10 my-3" />
                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">MAX CAPACITY: {CIRCULAR_CAPACITY}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              key="list-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex items-center gap-4 min-w-max mx-auto",
                mode === 'stack' ? "flex-col-reverse" : "px-10"
              )}
            >
              {array.map((val: number, idx: number) => {
                const isPeeked = peekedIdx === idx;
                return (
                  <motion.div 
                    key={`${idx}-${val}`}
                    layout
                    initial={{ scale: 0, y: mode === 'stack' ? 50 : 0, x: mode === 'deque' || mode === 'queue' ? -50 : 0 }}
                    animate={{ 
                      scale: isPeeked ? 1.1 : 1,
                      y: 0, x: 0,
                      borderColor: isPeeked ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.1)',
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={cn(
                      "w-48 h-12 rounded-xl border bg-gradient-to-r from-white/5 to-white/10 flex items-center justify-between px-6 shadow-lg mb-2 group transition-all",
                      isPeeked && "shadow-cyan-500/20"
                    )}
                  >
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span className="absolute left-0 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                        {mode === 'stack' 
                          ? (idx === array.length - 1 ? 'Top' : `[${idx}]`) 
                          : (idx === 0 ? 'Front' : (idx === array.length - 1 ? 'Rear' : `[${idx}]`))}
                      </span>
                      
                      <span className={cn(
                        "font-bold text-lg transition-colors z-10",
                        isPeeked ? "text-white" : "text-cyan-400"
                      )}>{val}</span>

                      {mode !== 'stack' && array.length === 1 && (
                        <span className="absolute right-0 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                          Rear
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
