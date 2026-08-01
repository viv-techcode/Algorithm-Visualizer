import React, { createContext, useContext, useState, useEffect } from 'react';

interface AlgoContextType {
  array: number[];
  setArray: (arr: number[]) => void;
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
  speed: number;
  setSpeed: (val: number) => void;
  comparisons: number;
  setComparisons: React.Dispatch<React.SetStateAction<number>>;
  swaps: number;
  setSwaps: React.Dispatch<React.SetStateAction<number>>;
  currentIndices: number[];
  setCurrentIndices: (indices: number[]) => void;
  history: string[];
  addHistory: (msg: string) => void;
  resetAlgo: () => void;
  generateRandomArray: (size: number) => void;
}

const AlgoContext = createContext<AlgoContextType | undefined>(undefined);

export const AlgoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [array, setArray] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [currentIndices, setCurrentIndices] = useState<number[]>([]);
  const [history, setHistory] = useState<string[]>(['System initialized. ready for operations.']);

  const generateRandomArray = (size: number) => {
    const finalSize = Math.max(10, size);
    const newArr = Array.from({ length: finalSize }, () => Math.floor(Math.random() * 90) + 10);
    setArray(newArr);
    setComparisons(0);
    setSwaps(0);
    setCurrentIndices([]);
    addHistory(`Generated new random array of size ${size}.`);
  };

  const addHistory = (msg: string) => {
    setHistory((prev: string[]) => [msg, ...prev].slice(0, 50));
  };

  const resetAlgo = () => {
    setIsRunning(false);
    setComparisons(0);
    setSwaps(0);
    setCurrentIndices([]);
    addHistory('Algorithm reset.');
  };

  useEffect(() => {
    generateRandomArray(20);
  }, []);

  return (
    <AlgoContext.Provider value={{
      array, setArray, isRunning, setIsRunning, speed, setSpeed,
      comparisons, setComparisons, swaps, setSwaps,
      currentIndices, setCurrentIndices, history, addHistory,
      resetAlgo, generateRandomArray
    }}>
      {children}
    </AlgoContext.Provider>
  );
};

export const useAlgo = () => {
  const context = useContext(AlgoContext);
  if (!context) throw new Error('useAlgo must be used within AlgoProvider');
  return context;
};
