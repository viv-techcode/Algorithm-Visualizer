export type SortingStep = {
  array: number[];
  indices: number[];
  type: 'compare' | 'swap' | 'done' | 'pivot' | 'min' | 'insert' | 'heapify' | 'extract';
  message: string;
  specialIndices?: {
    pivot?: number;
    minIdx?: number;
    sortedIdx?: number;
    heapIdx?: number;
    mid?: number;
    low?: number;
    high?: number;
  };
};

export const bubbleSortSteps = (arr: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const n = [...arr];
  const len = n.length;

  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i - 1; j++) {
      steps.push({
        array: [...n],
        indices: [j, j + 1],
        type: 'compare',
        message: `Comparing indices ${j} and ${j + 1}`
      });

      if (n[j] > n[j + 1]) {
        [n[j], n[j + 1]] = [n[j + 1], n[j]];
        steps.push({
          array: [...n],
          indices: [j, j + 1],
          type: 'swap',
          message: `Swapping indices ${j} and ${j + 1}`
        });
      }
    }
  }
  steps.push({ array: [...n], indices: [], type: 'done', message: 'Bubble Sort completed.' });
  return steps;
};

export const selectionSortSteps = (arr: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const n = [...arr];
  const len = n.length;

  for (let i = 0; i < len - 1; i++) {
    let minIdx = i;
    steps.push({
      array: [...n],
      indices: [i],
      type: 'min',
      message: `Setting initial minimum at index ${i}`,
      specialIndices: { minIdx }
    });

    for (let j = i + 1; j < len; j++) {
      steps.push({
        array: [...n],
        indices: [j, minIdx],
        type: 'compare',
        message: `Comparing index ${j} with current minimum`,
        specialIndices: { minIdx }
      });

      if (n[j] < n[minIdx]) {
        minIdx = j;
        steps.push({
          array: [...n],
          indices: [minIdx],
          type: 'min',
          message: `Found new minimum at index ${minIdx}`,
          specialIndices: { minIdx }
        });
      }
    }

    if (minIdx !== i) {
      [n[i], n[minIdx]] = [n[minIdx], n[i]];
      steps.push({
        array: [...n],
        indices: [i, minIdx],
        type: 'swap',
        message: `Swapping index ${i} with minimum at ${minIdx}`,
        specialIndices: { minIdx }
      });
    }
  }
  steps.push({ array: [...n], indices: [], type: 'done', message: 'Selection Sort completed.' });
  return steps;
};

export const insertionSortSteps = (arr: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const n = [...arr];
  const len = n.length;

  for (let i = 1; i < len; i++) {
    let key = n[i];
    let j = i - 1;

    steps.push({
      array: [...n],
      indices: [i],
      type: 'insert',
      message: `Taking element ${key} at index ${i}`,
      specialIndices: { sortedIdx: i }
    });

    while (j >= 0 && n[j] > key) {
      steps.push({
        array: [...n],
        indices: [j, j + 1],
        type: 'compare',
        message: `Comparing ${n[j]} > ${key}`,
        specialIndices: { sortedIdx: i }
      });

      n[j + 1] = n[j];
      steps.push({
        array: [...n],
        indices: [j, j + 1],
        type: 'swap',
        message: `Shifting ${n[j]} to index ${j + 1}`,
        specialIndices: { sortedIdx: i }
      });
      j = j - 1;
    }
    n[j + 1] = key;
    steps.push({
      array: [...n],
      indices: [j + 1],
      type: 'insert',
      message: `Inserting ${key} at index ${j + 1}`,
      specialIndices: { sortedIdx: i }
    });
  }
  steps.push({ array: [...n], indices: [], type: 'done', message: 'Insertion Sort completed.' });
  return steps;
};

export const quickSortSteps = (arr: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const n = [...arr];

  const partition = (low: number, high: number) => {
    const pivot = n[high];
    steps.push({
      array: [...n],
      indices: [high],
      type: 'pivot',
      message: `Picking ${pivot} as pivot`,
      specialIndices: { pivot: high }
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      steps.push({
        array: [...n],
        indices: [j, high],
        type: 'compare',
        message: `Comparing ${n[j]} with pivot ${pivot}`,
        specialIndices: { pivot: high, low, high }
      });

      if (n[j] < pivot) {
        i++;
        [n[i], n[j]] = [n[j], n[i]];
        steps.push({
          array: [...n],
          indices: [i, j],
          type: 'swap',
          message: `Swapping ${n[i]} and ${n[j]}`,
          specialIndices: { pivot: high, low, high }
        });
      }
    }
    [n[i + 1], n[high]] = [n[high], n[i + 1]];
    steps.push({
      array: [...n],
      indices: [i + 1, high],
      type: 'swap',
      message: `Placing pivot ${pivot} at index ${i + 1}`,
      specialIndices: { pivot: i + 1 }
    });
    return i + 1;
  };

  const sort = (low: number, high: number) => {
    if (low < high) {
      const pi = partition(low, high);
      sort(low, pi - 1);
      sort(pi + 1, high);
    }
  };

  sort(0, n.length - 1);
  steps.push({ array: [...n], indices: [], type: 'done', message: 'Quick Sort completed.' });
  return steps;
};

export const mergeSortSteps = (arr: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const n = [...arr];

  const merge = (l: number, m: number, r: number) => {
    const n1 = m - l + 1;
    const n2 = r - m;
    const L = n.slice(l, m + 1);
    const R = n.slice(m + 1, r + 1);

    let i = 0, j = 0, k = l;

    while (i < n1 && j < n2) {
      steps.push({
        array: [...n],
        indices: [l + i, m + 1 + j],
        type: 'compare',
        message: `Comparing halves`,
        specialIndices: { mid: m, low: l, high: r }
      });

      if (L[i] <= R[j]) {
        n[k] = L[i];
        i++;
      } else {
        n[k] = R[j];
        j++;
      }
      steps.push({
        array: [...n],
        indices: [k],
        type: 'swap',
        message: `Merging into index ${k}`,
        specialIndices: { mid: m, low: l, high: r }
      });
      k++;
    }

    while (i < n1) {
      n[k] = L[i];
      steps.push({ array: [...n], indices: [k], type: 'swap', message: `Merging left tail`, specialIndices: { mid: m, low: l, high: r } });
      i++;
      k++;
    }

    while (j < n2) {
      n[k] = R[j];
      steps.push({ array: [...n], indices: [k], type: 'swap', message: `Merging right tail`, specialIndices: { mid: m, low: l, high: r } });
      j++;
      k++;
    }
  };

  const sort = (l: number, r: number) => {
    if (l >= r) return;
    const m = l + Math.floor((r - l) / 2);
    sort(l, m);
    sort(m + 1, r);
    merge(l, m, r);
  };

  sort(0, n.length - 1);
  steps.push({ array: [...n], indices: [], type: 'done', message: 'Merge Sort completed.' });
  return steps;
};

export const heapSortSteps = (arr: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const n = [...arr];
  const len = n.length;

  const heapify = (size: number, i: number) => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    steps.push({
      array: [...n],
      indices: [i],
      type: 'heapify',
      message: `Heapifying at index ${i}`,
      specialIndices: { heapIdx: i }
    });

    if (left < size) {
      steps.push({ array: [...n], indices: [left, largest], type: 'compare', message: `Comparing with left child` });
      if (n[left] > n[largest]) largest = left;
    }

    if (right < size) {
      steps.push({ array: [...n], indices: [right, largest], type: 'compare', message: `Comparing with right child` });
      if (n[right] > n[largest]) largest = right;
    }

    if (largest !== i) {
      [n[i], n[largest]] = [n[largest], n[i]];
      steps.push({
        array: [...n],
        indices: [i, largest],
        type: 'swap',
        message: `Swapping to restore heap property`
      });
      heapify(size, largest);
    }
  };

  // Build heap
  for (let i = Math.floor(len / 2) - 1; i >= 0; i--) {
    heapify(len, i);
  }

  // Extract elements
  for (let i = len - 1; i > 0; i--) {
    [n[0], n[i]] = [n[i], n[0]];
    steps.push({
      array: [...n],
      indices: [0, i],
      type: 'extract',
      message: `Extracting max ${n[i]} to sorted position ${i}`,
      specialIndices: { sortedIdx: i }
    });
    heapify(i, 0);
  }

  steps.push({ array: [...n], indices: [], type: 'done', message: 'Heap Sort completed.' });
  return steps;
};
