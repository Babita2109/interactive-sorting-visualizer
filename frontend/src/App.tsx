import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './style.css';

type Algorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';
type ActiveTab = 'visualizer' | 'searching' | 'operations' | 'notations' | 'trees_graphs_ll';
type SearchAlgorithm = 'linear' | 'binary';

interface Frame {
  array: { val: number; status: 'default' | 'compare' | 'swap' | 'sorted' }[];
  explanation: string;
  comparisons: number;
  swaps: number;
}

// Data Structure Interfaces
interface TreeNode {
  val: number;
  status: 'default' | 'active' | 'swapping' | 'visited';
  x: number;
  y: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  status: 'default' | 'active' | 'visited';
}

interface ListNode {
  val: number;
  status: 'default' | 'active' | 'visited' | 'delete';
}

// ================= C CODE SNIPPETS =================
const cCodeSnippets: Record<string, string> = {
  bubble: `void bubbleSort(int arr[], int n) {\n  for (int i = 0; i < n - 1; i++) {\n    for (int j = 0; j < n - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        // Swap elements\n        int temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n}`,
  selection: `void selectionSort(int arr[], int n) {\n  for (int i = 0; i < n - 1; i++) {\n    int min_idx = i;\n    for (int j = i + 1; j < n; j++) {\n      if (arr[j] < arr[min_idx])\n        min_idx = j;\n    }\n    // Swap minimum element with first element\n    int temp = arr[min_idx];\n    arr[min_idx] = arr[i];\n    arr[i] = temp;\n  }\n}`,
  insertion: `void insertionSort(int arr[], int n) {\n  for (int i = 1; i < n; i++) {\n    int key = arr[i];\n    int j = i - 1;\n    // Move elements greater than key to one position ahead\n    while (j >= 0 && arr[j] > key) {\n      arr[j + 1] = arr[j];\n      j = j - 1;\n    }\n    arr[j + 1] = key;\n  }\n}`,
  merge: `void merge(int arr[], int l, int m, int r) {\n  // Merge logic...\n}\n\nvoid mergeSort(int arr[], int l, int r) {\n  if (l < r) {\n    int m = l + (r - l) / 2;\n    mergeSort(arr, l, m);\n    mergeSort(arr, m + 1, r);\n    merge(arr, l, m, r);\n  }\n}`,
  quick: `int partition(int arr[], int low, int high) {\n  int pivot = arr[high];\n  int i = (low - 1);\n  for (int j = low; j < high; j++) {\n    if (arr[j] < pivot) {\n      i++;\n      int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;\n    }\n  }\n  int temp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = temp;\n  return (i + 1);\n}\n\nvoid quickSort(int arr[], int low, int high) {\n  if (low < high) {\n    int pi = partition(arr, low, high);\n    quickSort(arr, low, pi - 1);\n    quickSort(arr, pi + 1, high);\n  }\n}`,
  linear: `int linearSearch(int arr[], int n, int x) {\n  for (int i = 0; i < n; i++) {\n    if (arr[i] == x)\n      return i; // Target found\n  }\n  return -1; // Target not found\n}`,
  binary: `int binarySearch(int arr[], int l, int r, int x) {\n  while (l <= r) {\n    int m = l + (r - l) / 2;\n    if (arr[m] == x) \n      return m;\n    if (arr[m] < x) \n      l = m + 1;\n    else \n      r = m - 1;\n  }\n  return -1;\n}`
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');

  // Auth states
  const [user, setUser] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  // Main visualizer states
  const [rawNumbers, setRawNumbers] = useState<number[]>([45, 12, 89, 34, 70, 23, 95, 15, 60, 38]);
  const [customInput, setCustomInput] = useState<string>('45, 12, 89, 34, 70, 23, 95, 15, 60, 38');
  const [algorithm, setAlgorithm] = useState<Algorithm>('bubble');
  const [speed, setSpeed] = useState<number>(400);

  // Searching states
  const [searchAlgo, setSearchAlgo] = useState<SearchAlgorithm>('linear');
  const [searchTarget, setSearchTarget] = useState<string>('');

  // Operations states
  const [insertVal, setInsertVal] = useState<string>('');
  const [insertIdx, setInsertIdx] = useState<string>('');
  const [deleteIdx, setDeleteIdx] = useState<string>('');

  // Playback / Timeline states
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // ================= TREES, GRAPHS & LINKED LIST STATES =================
  const reelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dsTopic, setDsTopic] = useState<'invert' | 'inorder' | 'bfs-queue' | 'graph-bfs' | 'linked-list'>('invert');
  const [reelPlaying, setReelPlaying] = useState<boolean>(false);
  const [reelStack, setReelStack] = useState<string[]>([]);
  const [reelQueue, setReelQueue] = useState<string[]>([]);
  const [traversalOutput, setTraversalOutput] = useState<string[]>([]);
  const [activeCodeLine, setActiveCodeLine] = useState<number>(0);
  const reelCancelled = useRef<boolean>(false);

  // Custom array/nodes input state
  const [customTreeInput, setCustomTreeInput] = useState<string>('4, 2, 7, 1, 3, 6, 9');

  // Linked List State
  const [linkedList, setLinkedList] = useState<ListNode[]>([
    { val: 12, status: 'default' },
    { val: 45, status: 'default' },
    { val: 78, status: 'default' },
    { val: 99, status: 'default' },
  ]);
  const [llInputVal, setLlInputVal] = useState<string>('');

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Default Tree Root Ref
  const treeRoot = useRef<TreeNode | null>(null);

  // BST Insertion helper
  const insertIntoBST = (rootNode: TreeNode | null, val: number): TreeNode => {
    if (!rootNode) {
      return { val, status: 'default', x: 220, y: 40, left: null, right: null };
    }
    if (val < rootNode.val) {
      rootNode.left = insertIntoBST(rootNode.left, val);
    } else if (val > rootNode.val) {
      rootNode.right = insertIntoBST(rootNode.right, val);
    }
    return rootNode;
  };

  // Node position recalculation
  const updateTreeCoordinates = (node: TreeNode | null, x: number, y: number, gap: number) => {
    if (!node) return;
    node.x = x;
    node.y = y;
    updateTreeCoordinates(node.left, x - gap, y + 55, gap / 1.85);
    updateTreeCoordinates(node.right, x + gap, y + 55, gap / 1.85);
  };

  const handleBuildCustomArray = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = customTreeInput
      .split(',')
      .map((item) => parseInt(item.trim(), 10))
      .filter((n) => !isNaN(n));

    if (parsed.length === 0) {
      alert('Kripya valid numbers enter karein (jaise: 45, 20, 75, 10, 30)');
      return;
    }

    if (dsTopic === 'linked-list') {
      setLinkedList(parsed.slice(0, 6).map((n) => ({ val: n, status: 'default' })));
      handleResetReel();
      return;
    }

    let newRoot: TreeNode | null = null;
    parsed.forEach((val) => {
      newRoot = insertIntoBST(newRoot, val);
    });

    updateTreeCoordinates(newRoot, 220, 40, 85);
    treeRoot.current = newRoot;
    handleResetReel();
    drawReelCanvas();
  };

  const initTreeData = () => {
    treeRoot.current = {
      val: 4,
      status: 'default',
      x: 220,
      y: 40,
      left: {
        val: 2, status: 'default', x: 130, y: 100,
        left: { val: 1, status: 'default', x: 85, y: 160, left: null, right: null },
        right: { val: 3, status: 'default', x: 175, y: 160, left: null, right: null },
      },
      right: {
        val: 7, status: 'default', x: 310, y: 100,
        left: { val: 6, status: 'default', x: 265, y: 160, left: null, right: null },
        right: { val: 9, status: 'default', x: 355, y: 160, left: null, right: null },
      },
    };
    drawReelCanvas();
  };

  // Graph Data
  const graphNodes = useRef<GraphNode[]>([
    { id: '1', x: 100, y: 60, status: 'default' },
    { id: '2', x: 220, y: 40, status: 'default' },
    { id: '3', x: 340, y: 60, status: 'default' },
    { id: '4', x: 140, y: 160, status: 'default' },
    { id: '5', x: 300, y: 160, status: 'default' },
  ]);
  const graphEdges = [
    ['1', '2'], ['2', '3'], ['1', '4'], ['2', '5'], ['4', '5'], ['3', '5']
  ];

  // Draw Tree on Canvas
  const drawTreeOnCanvas = (ctx: CanvasRenderingContext2D, node: TreeNode | null) => {
    if (!node) return;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#475569';

    if (node.left) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.left.x, node.left.y);
      ctx.stroke();
      drawTreeOnCanvas(ctx, node.left);
    }
    if (node.right) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.right.x, node.right.y);
      ctx.stroke();
      drawTreeOnCanvas(ctx, node.right);
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI);
    if (node.status === 'active') ctx.fillStyle = '#f59e0b';
    else if (node.status === 'swapping') ctx.fillStyle = '#ef4444';
    else if (node.status === 'visited') ctx.fillStyle = '#10b981';
    else ctx.fillStyle = '#0284c7';
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.val.toString(), node.x, node.y);
  };

  // Draw Graph on Canvas
  const drawGraphOnCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#475569';
    graphEdges.forEach(([u, v]) => {
      const n1 = graphNodes.current.find((n) => n.id === u);
      const n2 = graphNodes.current.find((n) => n.id === v);
      if (n1 && n2) {
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }
    });

    graphNodes.current.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 18, 0, 2 * Math.PI);
      if (node.status === 'active') ctx.fillStyle = '#f59e0b';
      else if (node.status === 'visited') ctx.fillStyle = '#10b981';
      else ctx.fillStyle = '#6366f1';
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y);
    });
  };

  // Draw Linked List on Canvas
  const drawLinkedListOnCanvas = (ctx: CanvasRenderingContext2D) => {
    let startX = 35;
    const startY = 95;
    const boxW = 50;
    const boxH = 34;

    linkedList.forEach((node, idx) => {
      ctx.fillStyle = node.status === 'active' ? '#f59e0b' : node.status === 'visited' ? '#10b981' : node.status === 'delete' ? '#ef4444' : '#1e293b';
      ctx.fillRect(startX, startY, boxW, boxH);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX, startY, boxW, boxH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.val.toString(), startX + boxW / 2, startY + boxH / 2);

      if (idx < linkedList.length - 1) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX + boxW, startY + boxH / 2);
        ctx.lineTo(startX + boxW + 24, startY + boxH / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(startX + boxW + 24, startY + boxH / 2);
        ctx.lineTo(startX + boxW + 17, startY + boxH / 2 - 4);
        ctx.lineTo(startX + boxW + 17, startY + boxH / 2 + 4);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('-> NULL', startX + boxW + 6, startY + boxH / 2);
      }

      startX += boxW + 30;
    });
  };

  const drawReelCanvas = () => {
    const canvas = reelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dsTopic === 'graph-bfs') {
      drawGraphOnCanvas(ctx);
    } else if (dsTopic === 'linked-list') {
      drawLinkedListOnCanvas(ctx);
    } else {
      drawTreeOnCanvas(ctx, treeRoot.current);
    }
  };

  useEffect(() => {
    if (activeTab === 'trees_graphs_ll') {
      if (!treeRoot.current) {
        initTreeData();
      } else {
        drawReelCanvas();
      }
    }
  }, [activeTab, dsTopic, linkedList]);

  // Tree Invert Algorithm (Recursion)
  const runInvertReel = async () => {
    reelCancelled.current = false;
    setReelPlaying(true);
    setTraversalOutput([]);

    async function invert(node: TreeNode | null) {
      if (!node || reelCancelled.current) {
        setActiveCodeLine(2);
        return;
      }
      setActiveCodeLine(1);
      node.status = 'active';
      setReelStack((prev) => [`invert(${node.val})`, ...prev]);
      drawReelCanvas();
      await sleep(600);

      setActiveCodeLine(3);
      node.status = 'swapping';
      const temp = node.left;
      node.left = node.right;
      node.right = temp;

      if (node.left && node.right) {
        const tempX = node.left.x;
        node.left.x = node.right.x;
        node.right.x = tempX;
      }
      drawReelCanvas();
      await sleep(600);

      node.status = 'visited';
      drawReelCanvas();

      setActiveCodeLine(4);
      await invert(node.left);

      setActiveCodeLine(5);
      await invert(node.right);

      setReelStack((prev) => prev.filter((s) => s !== `invert(${node.val})`));
    }

    await invert(treeRoot.current);
    setActiveCodeLine(6);
    setReelPlaying(false);
  };

  // ================= BACKEND INTEGRATED INORDER TRAVERSAL =================
  const runInorderReelWithBackend = async () => {
    reelCancelled.current = false;
    setReelPlaying(true);
    setTraversalOutput([]);

    const parsedNodes = customTreeInput
      .split(',')
      .map((item) => parseInt(item.trim(), 10))
      .filter((n) => !isNaN(n));

    const nodesToSend = parsedNodes.length > 0 ? parsedNodes : [4, 2, 7, 1, 3, 6, 9];

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/tree/inorder', {
        nodes: nodesToSend,
      });

      const steps = res.data.steps;
      const visited: string[] = [];

      for (let step of steps) {
        if (reelCancelled.current) break;

        setActiveCodeLine(step.code_line);
        setReelStack(step.call_stack);
        visited.push(step.val.toString());
        setTraversalOutput([...visited]);

        const highlightNode = (node: TreeNode | null, val: number) => {
          if (!node) return;
          node.status = node.val === val ? 'active' : 'visited';
          highlightNode(node.left, val);
          highlightNode(node.right, val);
        };

        highlightNode(treeRoot.current, step.val);
        drawReelCanvas();
        await sleep(700);
      }
    } catch (err) {
      console.warn('Backend connection failed, running locally:', err);
      const visitedFallback: string[] = [];
      async function inorder(node: TreeNode | null) {
        if (!node || reelCancelled.current) return;
        setReelStack((prev) => [`inorder(${node.val})`, ...prev]);
        setActiveCodeLine(2);
        await inorder(node.left);

        node.status = 'active';
        setActiveCodeLine(3);
        visitedFallback.push(node.val.toString());
        setTraversalOutput([...visitedFallback]);
        drawReelCanvas();
        await sleep(700);

        node.status = 'visited';
        drawReelCanvas();

        setActiveCodeLine(4);
        await inorder(node.right);
        setReelStack((prev) => prev.filter((s) => s !== `inorder(${node.val})`));
      }
      await inorder(treeRoot.current);
    } finally {
      setReelPlaying(false);
    }
  };

  const runBFSQueueReel = async () => {
    if (!treeRoot.current) return;
    reelCancelled.current = false;
    setReelPlaying(true);
    const queue: TreeNode[] = [treeRoot.current];
    const visited: string[] = [];
    setReelQueue([treeRoot.current.val.toString()]);
    setTraversalOutput([]);

    while (queue.length > 0 && !reelCancelled.current) {
      setActiveCodeLine(3);
      const curr = queue.shift()!;
      curr.status = 'active';
      visited.push(curr.val.toString());
      setTraversalOutput([...visited]);
      drawReelCanvas();
      await sleep(700);

      curr.status = 'visited';
      if (curr.left) {
        queue.push(curr.left);
        setActiveCodeLine(4);
      }
      if (curr.right) {
        queue.push(curr.right);
        setActiveCodeLine(5);
      }
      setReelQueue(queue.map((n) => n.val.toString()));
      drawReelCanvas();
      await sleep(400);
    }
    setReelPlaying(false);
  };

  const runGraphBFSReel = async () => {
    reelCancelled.current = false;
    setReelPlaying(true);
    graphNodes.current.forEach((n) => (n.status = 'default'));
    const visitedSet = new Set<string>();
    const queue: string[] = ['1'];
    visitedSet.add('1');
    setReelQueue(['1']);
    setTraversalOutput([]);
    const result: string[] = [];

    while (queue.length > 0 && !reelCancelled.current) {
      setActiveCodeLine(3);
      const currId = queue.shift()!;
      const node = graphNodes.current.find((n) => n.id === currId);
      if (node) node.status = 'active';
      result.push(currId);
      setTraversalOutput([...result]);
      drawReelCanvas();
      await sleep(700);

      if (node) node.status = 'visited';

      graphEdges.forEach(([u, v]) => {
        let nbr = '';
        if (u === currId && !visitedSet.has(v)) nbr = v;
        if (v === currId && !visitedSet.has(u)) nbr = u;

        if (nbr) {
          visitedSet.add(nbr);
          queue.push(nbr);
          setActiveCodeLine(4);
        }
      });

      setReelQueue([...queue]);
      drawReelCanvas();
      await sleep(400);
    }
    setReelPlaying(false);
  };

  // ================= BACKEND INTEGRATED LINKED LIST =================
  const runLinkedListWithBackend = async () => {
    reelCancelled.current = false;
    setReelPlaying(true);
    setTraversalOutput([]);

    const listNodes = linkedList.map((n) => n.val);

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/ds/traverse', {
        topic: 'linked-list',
        nodes: listNodes,
      });

      const nodesFromBackend = res.data.nodes;
      const visited: string[] = [];

      for (let i = 0; i < nodesFromBackend.length; i++) {
        if (reelCancelled.current) break;
        setActiveCodeLine(2);
        setLinkedList((prev) =>
          prev.map((item, idx) => ({
            ...item,
            status: idx === i ? 'active' : idx < i ? 'visited' : 'default',
          }))
        );
        visited.push(nodesFromBackend[i].toString());
        setTraversalOutput([...visited]);
        setActiveCodeLine(3);
        await sleep(700);
      }
      setLinkedList((prev) => prev.map((item) => ({ ...item, status: 'visited' })));
      setActiveCodeLine(4);
    } catch (err) {
      console.warn('Backend connection failed, running locally:', err);
      // Fallback
      const visited: string[] = [];
      for (let i = 0; i < linkedList.length; i++) {
        if (reelCancelled.current) break;
        setActiveCodeLine(2);
        setLinkedList((prev) =>
          prev.map((item, idx) => ({
            ...item,
            status: idx === i ? 'active' : idx < i ? 'visited' : 'default',
          }))
        );
        visited.push(linkedList[i].val.toString());
        setTraversalOutput([...visited]);
        setActiveCodeLine(3);
        await sleep(700);
      }
      setLinkedList((prev) => prev.map((item) => ({ ...item, status: 'visited' })));
      setActiveCodeLine(4);
    } finally {
      setReelPlaying(false);
    }
  };

  const handleAddLLNode = () => {
    const val = parseInt(llInputVal, 10);
    if (isNaN(val)) return;
    if (linkedList.length >= 6) {
      alert('Maximum 6 nodes allowed in demo canvas viewport!');
      return;
    }
    setLinkedList((prev) => [...prev, { val, status: 'default' }]);
    setLlInputVal('');
  };

  const handleDeleteLLNode = () => {
    if (linkedList.length <= 1) {
      alert('Linked list must contain at least 1 node.');
      return;
    }
    setLinkedList((prev) => prev.slice(0, prev.length - 1));
  };

  const handleResetReel = () => {
    reelCancelled.current = true;
    setReelPlaying(false);
    setReelStack([]);
    setReelQueue([]);
    setTraversalOutput([]);
    setActiveCodeLine(0);
    if (dsTopic === 'graph-bfs') {
      graphNodes.current.forEach((n) => (n.status = 'default'));
    } else if (dsTopic === 'linked-list') {
      setLinkedList((prev) => prev.map((n) => ({ ...n, status: 'default' })));
    } else {
      if (treeRoot.current) {
        const resetStatus = (node: TreeNode | null) => {
          if (!node) return;
          node.status = 'default';
          resetStatus(node.left);
          resetStatus(node.right);
        };
        resetStatus(treeRoot.current);
      }
    }
    drawReelCanvas();
  };

  // Generate Frame Timeline for Sorting
  const generateFrames = (baseNums: number[], algo: Algorithm) => {
    const generatedFrames: Frame[] = [];
    const n = baseNums.length;

    const makeBars = (arr: number[], statuses?: ('default' | 'compare' | 'swap' | 'sorted')[]) => {
      return arr.map((num, i) => ({
        val: num,
        status: statuses ? statuses[i] : 'default',
      }));
    };

    let comp = 0;
    let swp = 0;
    const arr = [...baseNums];

    generatedFrames.push({
      array: makeBars(arr),
      explanation: `State: Initialized array [${arr.join(', ')}] | Pseudocode: START_ALGORITHM(${algo.toUpperCase()})`,
      comparisons: 0,
      swaps: 0,
    });

    if (algo === 'bubble') {
      const statusArr: ('default' | 'compare' | 'swap' | 'sorted')[] = new Array(n).fill('default');

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          comp++;
          const currentStatuses = [...statusArr];
          currentStatuses[j] = 'compare';
          currentStatuses[j + 1] = 'compare';

          generatedFrames.push({
            array: makeBars(arr, currentStatuses),
            explanation: `Comparing arr[${j}] (${arr[j]}) and arr[${j + 1}] (${arr[j + 1]})`,
            comparisons: comp,
            swaps: swp,
          });

          if (arr[j] > arr[j + 1]) {
            swp++;
            const swapStatuses = [...statusArr];
            swapStatuses[j] = 'swap';
            swapStatuses[j + 1] = 'swap';

            const temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;

            generatedFrames.push({
              array: makeBars(arr, swapStatuses),
              explanation: `Swapping values ${temp} and ${arr[j]}`,
              comparisons: comp,
              swaps: swp,
            });
          }
        }
        statusArr[n - i - 1] = 'sorted';
        generatedFrames.push({
          array: makeBars(arr, [...statusArr]),
          explanation: `Element ${arr[n - i - 1]} placed at correct index [${n - i - 1}]`,
          comparisons: comp,
          swaps: swp,
        });
      }
    } else if (algo === 'selection') {
      const statusArr: ('default' | 'compare' | 'swap' | 'sorted')[] = new Array(n).fill('default');

      for (let i = 0; i < n; i++) {
        let minIdx = i;
        generatedFrames.push({
          array: makeBars(arr, [...statusArr]),
          explanation: `Setting initial minimum index to [${i}] with value ${arr[i]}`,
          comparisons: comp,
          swaps: swp,
        });

        for (let j = i + 1; j < n; j++) {
          comp++;
          const currentStatuses = [...statusArr];
          currentStatuses[minIdx] = 'swap';
          currentStatuses[j] = 'compare';

          generatedFrames.push({
            array: makeBars(arr, currentStatuses),
            explanation: `Comparing candidate (${arr[minIdx]}) with arr[${j}] (${arr[j]})`,
            comparisons: comp,
            swaps: swp,
          });

          if (arr[j] < arr[minIdx]) {
            minIdx = j;
            generatedFrames.push({
              array: makeBars(arr, currentStatuses),
              explanation: `Found smaller element ${arr[minIdx]} at index [${minIdx}]`,
              comparisons: comp,
              swaps: swp,
            });
          }
        }

        if (minIdx !== i) {
          swp++;
          const temp = arr[i];
          arr[i] = arr[minIdx];
          arr[minIdx] = temp;
          generatedFrames.push({
            array: makeBars(arr, [...statusArr]),
            explanation: `Swapped minimum element ${arr[i]} into index [${i}]`,
            comparisons: comp,
            swaps: swp,
          });
        }
        statusArr[i] = 'sorted';
      }
    } else if (algo === 'insertion') {
      const statusArr: ('default' | 'compare' | 'swap' | 'sorted')[] = new Array(n).fill('default');
      statusArr[0] = 'sorted';

      for (let i = 1; i < n; i++) {
        let j = i;
        const key = arr[i];

        generatedFrames.push({
          array: makeBars(arr, [...statusArr]),
          explanation: `Selected key element ${key} at index [${i}]`,
          comparisons: comp,
          swaps: swp,
        });

        while (j > 0 && arr[j] < arr[j - 1]) {
          comp++;
          swp++;
          const compStatuses = [...statusArr];
          compStatuses[j] = 'swap';
          compStatuses[j - 1] = 'compare';

          const temp = arr[j];
          arr[j] = arr[j - 1];
          arr[j - 1] = temp;

          generatedFrames.push({
            array: makeBars(arr, compStatuses),
            explanation: `Shifting element: ${temp} < ${arr[j]}, moved to index [${j - 1}]`,
            comparisons: comp,
            swaps: swp,
          });
          j--;
        }
        statusArr[i] = 'sorted';
      }
      statusArr.fill('sorted');
      generatedFrames.push({
        array: makeBars(arr, statusArr),
        explanation: `Array is fully sorted`,
        comparisons: comp,
        swaps: swp,
      });
    } else if (algo === 'merge') {
      const statusArr: ('default' | 'compare' | 'swap' | 'sorted')[] = new Array(n).fill('default');

      const mergeHelper = (start: number, mid: number, end: number) => {
        const left = arr.slice(start, mid + 1);
        const right = arr.slice(mid + 1, end + 1);

        generatedFrames.push({
          array: makeBars(arr, [...statusArr]),
          explanation: `Divide: Subarrays [${start}..${mid}] and [${mid + 1}..${end}]`,
          comparisons: comp,
          swaps: swp,
        });

        let i = 0, j = 0, k = start;
        while (i < left.length && j < right.length) {
          comp++;
          const activeStatuses = [...statusArr];
          activeStatuses[k] = 'compare';

          if (left[i] <= right[j]) {
            arr[k] = left[i];
            i++;
          } else {
            arr[k] = right[j];
            j++;
            swp++;
          }
          activeStatuses[k] = 'swap';
          generatedFrames.push({
            array: makeBars(arr, activeStatuses),
            explanation: `Merged element ${arr[k]} into position [${k}]`,
            comparisons: comp,
            swaps: swp,
          });
          k++;
        }

        while (i < left.length) {
          arr[k] = left[i];
          i++;
          k++;
          generatedFrames.push({
            array: makeBars(arr, [...statusArr]),
            explanation: `Copying remaining left elements`,
            comparisons: comp,
            swaps: swp,
          });
        }

        while (j < right.length) {
          arr[k] = right[j];
          j++;
          k++;
          generatedFrames.push({
            array: makeBars(arr, [...statusArr]),
            explanation: `Copying remaining right elements`,
            comparisons: comp,
            swaps: swp,
          });
        }

        for (let idx = start; idx <= end; idx++) {
          statusArr[idx] = 'sorted';
        }
      };

      const divide = (start: number, end: number) => {
        if (start >= end) return;
        const mid = Math.floor((start + end) / 2);
        divide(start, mid);
        divide(mid + 1, end);
        mergeHelper(start, mid, end);
      };

      divide(0, n - 1);
      statusArr.fill('sorted');
      generatedFrames.push({
        array: makeBars(arr, statusArr),
        explanation: `Array merged and sorted successfully`,
        comparisons: comp,
        swaps: swp,
      });
    } else if (algo === 'quick') {
      const statusArr: ('default' | 'compare' | 'swap' | 'sorted')[] = new Array(n).fill('default');

      const partition = (low: number, high: number) => {
        const pivot = arr[high];
        let i = low - 1;

        generatedFrames.push({
          array: makeBars(arr, [...statusArr]),
          explanation: `Selected pivot ${pivot} at index [${high}]`,
          comparisons: comp,
          swaps: swp,
        });

        for (let j = low; j < high; j++) {
          comp++;
          const compStatuses = [...statusArr];
          compStatuses[high] = 'compare'; // Pivot ko yellow dikhane ke liye
          compStatuses[j] = 'compare';

          generatedFrames.push({
            array: makeBars(arr, compStatuses),
            explanation: `Comparing arr[${j}] (${arr[j]}) with pivot (${pivot})`,
            comparisons: comp,
            swaps: swp,
          });

          if (arr[j] < pivot) {
            i++;
            swp++;
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;

            const swapStatuses = [...statusArr];
            swapStatuses[i] = 'swap';
            swapStatuses[j] = 'swap';
            swapStatuses[high] = 'compare';

            generatedFrames.push({
              array: makeBars(arr, swapStatuses),
              explanation: `Swapped arr[${i}] and arr[${j}] (Element < Pivot)`,
              comparisons: comp,
              swaps: swp,
            });
          }
        }
        swp++;
        const temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;

        const swapPivotStatuses = [...statusArr];
        swapPivotStatuses[i + 1] = 'swap';
        swapPivotStatuses[high] = 'swap';

        generatedFrames.push({
          array: makeBars(arr, swapPivotStatuses),
          explanation: `Placed pivot ${pivot} at its correct sorted position [${i + 1}]`,
          comparisons: comp,
          swaps: swp,
        });

        statusArr[i + 1] = 'sorted';
        return i + 1;
      };

      const quickSortHelper = (low: number, high: number) => {
        if (low < high) {
          const pi = partition(low, high);
          quickSortHelper(low, pi - 1);
          quickSortHelper(pi + 1, high);
        } else if (low === high && low >= 0 && low < n) {
          statusArr[low] = 'sorted';
        }
      };

      quickSortHelper(0, n - 1);
      statusArr.fill('sorted');
      generatedFrames.push({
        array: makeBars(arr, statusArr),
        explanation: `Array is fully sorted`,
        comparisons: comp,
        swaps: swp,
      });
    }

    setFrames(generatedFrames);
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (activeTab === 'visualizer') {
      generateFrames(rawNumbers, algorithm);
    }
  }, [rawNumbers, algorithm, activeTab]);

  const handleStartSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(searchTarget, 10);
    if (isNaN(target)) {
      alert('Please enter a target number to search.');
      return;
    }

    const generatedFrames: Frame[] = [];
    let comp = 0;
    let arr = [...rawNumbers];

    const makeBars = (currentArr: number[], statuses?: ('default' | 'compare' | 'swap' | 'sorted')[]) => {
      return currentArr.map((num, i) => ({ val: num, status: statuses ? statuses[i] : 'default' }));
    };

    if (searchAlgo === 'linear') {
      const statusArr: ('default' | 'compare' | 'swap' | 'sorted')[] = new Array(arr.length).fill('default');
      let found = false;

      for (let i = 0; i < arr.length; i++) {
        comp++;
        const currentStatuses = [...statusArr];
        currentStatuses[i] = 'compare';

        generatedFrames.push({
          array: makeBars(arr, currentStatuses),
          explanation: `Checking if arr[${i}] (${arr[i]}) == ${target}`,
          comparisons: comp,
          swaps: 0,
        });

        if (arr[i] === target) {
          currentStatuses[i] = 'sorted'; // Found (Green)
          generatedFrames.push({
            array: makeBars(arr, currentStatuses),
            explanation: `Target ${target} found at index [${i}]! 🎉`,
            comparisons: comp,
            swaps: 0,
          });
          found = true;
          break;
        }
      }
      if (!found) generatedFrames.push({ array: makeBars(arr, statusArr), explanation: `Target ${target} not found in array.`, comparisons: comp, swaps: 0 });

    } else if (searchAlgo === 'binary') {
      arr = [...rawNumbers].sort((a, b) => a - b);
      const statusArr: ('default' | 'compare' | 'swap' | 'sorted')[] = new Array(arr.length).fill('default');

      generatedFrames.push({
        array: makeBars(arr),
        explanation: `Binary Search requires a sorted array. Target: ${target}`,
        comparisons: comp, swaps: 0,
      });

      let low = 0;
      let high = arr.length - 1;
      let found = false;

      while (low <= high) {
        comp++;
        let mid = Math.floor((low + high) / 2);
        const currentStatuses = [...statusArr];
        
        for (let k = low; k <= high; k++) currentStatuses[k] = 'swap'; // Active Search Space (Red)
        currentStatuses[mid] = 'compare'; // Mid Element (Yellow)

        generatedFrames.push({
          array: makeBars(arr, currentStatuses),
          explanation: `Search space [${low}..${high}]. Mid index = ${mid}, arr[mid] = ${arr[mid]}`,
          comparisons: comp, swaps: 0,
        });

        if (arr[mid] === target) {
          currentStatuses.fill('default');
          currentStatuses[mid] = 'sorted';
          generatedFrames.push({
            array: makeBars(arr, currentStatuses),
            explanation: `Target ${target} found at mid index [${mid}]! 🎉`,
            comparisons: comp, swaps: 0,
          });
          found = true;
          break;
        } else if (arr[mid] < target) {
          generatedFrames.push({ array: makeBars(arr, currentStatuses), explanation: `${arr[mid]} < ${target}. Go Right. low = ${mid + 1}`, comparisons: comp, swaps: 0 });
          low = mid + 1;
        } else {
          generatedFrames.push({ array: makeBars(arr, currentStatuses), explanation: `${arr[mid]} > ${target}. Go Left. high = ${mid - 1}`, comparisons: comp, swaps: 0 });
          high = mid - 1;
        }
      }
      if (!found) generatedFrames.push({ array: makeBars(arr, statusArr), explanation: `Target ${target} not found.`, comparisons: comp, swaps: 0 });
    }

    setFrames(generatedFrames);
    setCurrentFrameIdx(0);
    setIsPlaying(true); // Automatically play animation
  };

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentFrameIdx((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            if (timerRef.current !== null) clearInterval(timerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [isPlaying, frames.length, speed]);

  const togglePlay = () => {
    if (currentFrameIdx >= frames.length - 1) {
      setCurrentFrameIdx(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    if (currentFrameIdx < frames.length - 1) {
      setCurrentFrameIdx((prev) => prev + 1);
    }
  };

  const handleStepPrev = () => {
    setIsPlaying(false);
    if (currentFrameIdx > 0) {
      setCurrentFrameIdx((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(0);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customInput
      .split(',')
      .map((item) => parseInt(item.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    if (parsed.length < 2) {
      alert('Please enter at least 2 comma-separated numbers (e.g. 50, 20, 80, 10)');
      return;
    }

    setRawNumbers(parsed);

    try {
      axios.post(`http://127.0.0.1:5000/api/sort/${algorithm}`, {
        array: parsed,
        user: user || 'guest',
      }).catch(() => {});
    } catch (e) {}
  };

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(insertVal, 10);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }

    const updated = [...rawNumbers];
    const idx = insertIdx !== '' ? parseInt(insertIdx, 10) : updated.length;

    if (isNaN(idx) || idx < 0 || idx > updated.length) {
      alert(`Invalid Index! Index must be between 0 and ${updated.length}.`);
      return;
    }

    updated.splice(idx, 0, val);
    setRawNumbers(updated);
    setCustomInput(updated.join(', '));
    setInsertVal('');
    setInsertIdx('');
    alert(`Value ${val} inserted at index [${idx}]!`);
  };

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    const idx = parseInt(deleteIdx, 10);
    if (isNaN(idx) || idx < 0 || idx >= rawNumbers.length) {
      alert(`Invalid Index! Index must be between 0 and ${rawNumbers.length - 1}.`);
      return;
    }

    if (rawNumbers.length <= 2) {
      alert('Array must contain at least 2 elements.');
      return;
    }

    const removed = rawNumbers[idx];
    const updated = rawNumbers.filter((_, i) => i !== idx);
    setRawNumbers(updated);
    setCustomInput(updated.join(', '));
    setDeleteIdx('');
    alert(`Value ${removed} deleted from index [${idx}]!`);
  };

  const currentFrame = frames[currentFrameIdx] || {
    array: rawNumbers.map((v) => ({ val: v, status: 'default' as const })),
    explanation: 'Generating frames...',
    comparisons: 0,
    swaps: 0,
  };

  const maxBarValue = Math.max(...rawNumbers, 1);

  return (
    <div className="algo-app">
      {/* Top Navbar */}
      <header className="glass-box app-nav">
        <div className="brand-area">
          <div className="brand-badge">⚡</div>
          <div className="brand-text">
            <h1>AlgoSphere</h1>
            <p>Interactive Video-Style Algorithm & Data Structure Suite</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'visualizer' ? 'active' : ''}`}
            onClick={() => setActiveTab('visualizer')}
          >
            🎬 Sorting Visualizer
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'searching' ? 'active' : ''}`}
            onClick={() => { setActiveTab('searching'); setFrames([]); }}
          >
            🔍 Searching Visualizer
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'operations' ? 'active' : ''}`}
            onClick={() => setActiveTab('operations')}
          >
            🛠️ Insert & Delete
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'notations' ? 'active' : ''}`}
            onClick={() => setActiveTab('notations')}
          >
            📚 Notations Guide
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'trees_graphs_ll' ? 'active' : ''}`}
            onClick={() => setActiveTab('trees_graphs_ll')}
            style={{
              background: activeTab === 'trees_graphs_ll' ? '#0284c7' : undefined,
              color: '#fff',
            }}
          >
            🌳 Trees, Graphs & Linked List
          </button>
        </div>

        <div className="nav-right">
          <span className="pill-algo">{activeTab === 'visualizer' ? algorithm.toUpperCase() : activeTab === 'searching' ? searchAlgo.toUpperCase() : ''}</span>
          {user ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px' }}>👤 {user}</span>
              <button
                className="v-btn"
                style={{ padding: '4px 10px', fontSize: '11px', color: '#f87171' }}
                onClick={() => setUser(null)}
              >
                Logout
              </button>
            </div>
          ) : (
            <button className="btn-auth-nav" onClick={() => setShowAuthModal(true)}>
              Login / Sign Up
            </button>
          )}
        </div>
      </header>

      {/* ================= PAGE 1: SORTING VISUALIZER ================= */}
      {activeTab === 'visualizer' && (
        <>
          <section className="glass-box toolbar">
            <form onSubmit={handleCustomSubmit} className="input-bar-form">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. 45, 12, 89, 34, 70"
              />
              <button type="submit" className="btn-set">Set Array</button>
            </form>

            <div className="algo-tabs">
              {(['bubble', 'selection', 'insertion', 'merge', 'quick'] as Algorithm[]).map((alg) => (
                <button
                  key={alg}
                  className={`tab-btn ${algorithm === alg ? 'active' : ''}`}
                  onClick={() => setAlgorithm(alg)}
                >
                  {alg.toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          <div className="stats-grid">
            <div className="glass-box stat-card">
              <span>Total Comparisons</span>
              <strong>{currentFrame.comparisons}</strong>
            </div>
            <div className="glass-box stat-card">
              <span>Total Swaps / Shifts</span>
              <strong>{currentFrame.swaps}</strong>
            </div>
            <div className="glass-box legend-card">
              <div className="leg-item"><span className="dot-indicator dot-def"></span>Default</div>
              <div className="leg-item"><span className="dot-indicator dot-cmp"></span>Comparing</div>
              <div className="leg-item"><span className="dot-indicator dot-swp"></span>Swapping</div>
              <div className="leg-item"><span className="dot-indicator dot-srt"></span>Sorted</div>
            </div>
          </div>

          <section className="glass-box video-player-stage">
            <div className="video-explanation-banner">
              <span className="step-pill-video">Step #{currentFrameIdx + 1}</span>
              <div className="step-caption">
                {currentFrame.explanation}
              </div>
            </div>

            <div className="canvas-area">
              {currentFrame.array.map((bar, i) => (
                <div key={i} className="bar-col">
                  <div
                    className={`bar-block ${bar.status}`}
                    style={{
                      height: `${Math.round((bar.val / maxBarValue) * 220) + 30}px`,
                      width: `${Math.max(12, Math.min(36, 650 / currentFrame.array.length))}px`,
                    }}
                  />
                  <span className="bar-val-lbl">{bar.val}</span>
                </div>
              ))}
            </div>

            <div className="video-control-bar">
              <input
                type="range"
                min="0"
                max={Math.max(0, frames.length - 1)}
                value={currentFrameIdx}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrameIdx(Number(e.target.value));
                }}
                className="scrub-timeline"
              />

              <div className="controls-row">
                <div className="playback-buttons">
                  <button className="v-btn" onClick={handleRestart} title="Restart tutorial">
                    ⏮ Restart
                  </button>
                  <button className="v-btn" onClick={handleStepPrev} title="Previous step">
                    ⏪ Step Prev
                  </button>
                  <button className="v-btn v-btn-play" onClick={togglePlay}>
                    {isPlaying ? '⏸ Pause' : '▶ Play Tutorial'}
                  </button>
                  <button className="v-btn" onClick={handleStepNext} title="Next step">
                    Step Next ⏩
                  </button>
                </div>

                <span className="frame-counter">
                  Frame {currentFrameIdx + 1} of {frames.length}
                </span>

                <div className="speed-slider">
                  <span>Speed:</span>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={1100 - speed}
                    onChange={(e) => setSpeed(1100 - Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* C CODE DISPLAY FOR SORTING */}
            <div className="glass-box code-display" style={{ marginTop: '16px', background: '#090d16', border: '1px solid #1e293b', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '14px' }}>💻 C Language Code: {algorithm.toUpperCase()} SORT</h4>
                <span style={{ fontSize: '10px', background: '#161b22', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>algorithm.c</span>
              </div>
              <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' }}>
                {cCodeSnippets[algorithm]}
              </pre>
            </div>
          </section>

          <section className="glass-box arranged-section">
            <div className="arranged-header">
              <h3>
                {currentFrame.array.every((b) => b.status === 'sorted')
                  ? '✨ Final Sorted Array Result:'
                  : '⚡ Current Arranged State:'}
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {currentFrame.array.length} Elements
              </span>
            </div>

            <div className="chips-list">
              {currentFrame.array.map((item, idx) => (
                <div
                  key={idx}
                  className={`val-badge ${item.status === 'sorted' ? 'is-sorted' : ''}`}
                >
                  <span className="idx-tag">[{idx}]</span>
                  <strong className="num-val">{item.val}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ================= PAGE 2: SEARCHING VISUALIZER ================= */}
      {activeTab === 'searching' && (
        <>
          <section className="glass-box toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <form onSubmit={handleStartSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="number" placeholder="Enter Target Value" value={searchTarget} onChange={(e) => setSearchTarget(e.target.value)} required style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff' }} />
              <button type="submit" className="btn-set" style={{ background: '#10b981' }}>Start Search</button>
            </form>
            <div className="algo-tabs">
              <button className={`tab-btn ${searchAlgo === 'linear' ? 'active' : ''}`} onClick={() => setSearchAlgo('linear')}>LINEAR SEARCH</button>
              <button className={`tab-btn ${searchAlgo === 'binary' ? 'active' : ''}`} onClick={() => setSearchAlgo('binary')}>BINARY SEARCH</button>
            </div>
          </section>

          {frames.length > 0 ? (
            <section className="glass-box video-player-stage">
              <div className="video-explanation-banner">
                <span className="step-pill-video">Step #{currentFrameIdx + 1}</span>
                <div className="step-caption">{currentFrame.explanation}</div>
              </div>
              <div className="canvas-area">
                {currentFrame.array.map((bar, i) => (
                  <div key={i} className="bar-col">
                    <div className={`bar-block ${bar.status}`} style={{ height: `${Math.round((bar.val / maxBarValue) * 220) + 30}px`, width: `${Math.max(12, Math.min(36, 650 / currentFrame.array.length))}px` }} />
                    <span className="bar-val-lbl">{bar.val}</span>
                  </div>
                ))}
              </div>
              <div className="video-control-bar">
                <div className="controls-row" style={{ justifyContent: 'center' }}>
                  <button className="v-btn" onClick={handleStepPrev}>⏪ Prev</button>
                  <button className="v-btn v-btn-play" onClick={togglePlay}>{isPlaying ? '⏸ Pause' : '▶ Play Search'}</button>
                  <button className="v-btn" onClick={handleStepNext}>Next ⏩</button>
                </div>
              </div>

              {/* C CODE DISPLAY FOR SEARCHING */}
              <div className="glass-box code-display" style={{ marginTop: '16px', background: '#090d16', border: '1px solid #1e293b', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#10b981', fontSize: '14px' }}>💻 C Language Code: {searchAlgo.toUpperCase()} SEARCH</h4>
                  <span style={{ fontSize: '10px', background: '#161b22', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>search.c</span>
                </div>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' }}>
                  {cCodeSnippets[searchAlgo]}
                </pre>
              </div>
            </section>
          ) : (
            <div className="glass-box" style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
              <h3>Enter a Target Value and click "Start Search"</h3>
            </div>
          )}
        </>
      )}

      {/* ================= PAGE 3: OPERATIONS ================= */}
      {activeTab === 'operations' && (
        <div className="operations-page">
          <div className="ops-grid">
            <div className="glass-box op-card">
              <div className="op-title-row">
                <span className="op-icon add-icon">➕</span>
                <h3>Insert Value into Array</h3>
              </div>
              <p className="op-desc">
                Add any value into the array. Leaving index empty will append it to the end.
              </p>
              <form onSubmit={handleInsert} className="op-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Value to Insert *</label>
                    <input
                      type="number"
                      placeholder="e.g. 55"
                      required
                      value={insertVal}
                      onChange={(e) => setInsertVal(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Index (0 to {rawNumbers.length})</label>
                    <input
                      type="number"
                      placeholder={`0 - ${rawNumbers.length}`}
                      value={insertIdx}
                      onChange={(e) => setInsertIdx(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-op btn-insert">
                  Insert Element
                </button>
              </form>
            </div>

            <div className="glass-box op-card">
              <div className="op-title-row">
                <span className="op-icon del-icon">🗑️</span>
                <h3>Delete Value from Array</h3>
              </div>
              <p className="op-desc">
                Remove an element from any specified index in the current array.
              </p>
              <form onSubmit={handleDelete} className="op-form">
                <div className="form-group">
                  <label>Index to Remove (0 to {rawNumbers.length - 1}) *</label>
                  <input
                    type="number"
                    placeholder={`e.g. 0 to ${rawNumbers.length - 1}`}
                    required
                    value={deleteIdx}
                    onChange={(e) => setDeleteIdx(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-op btn-delete">
                  Delete Element
                </button>
              </form>
            </div>
          </div>

          <section className="glass-box arranged-section">
            <div className="arranged-header">
              <h3>Array Elements & Real-Time Indices</h3>
              <span style={{ fontSize: '12px', color: '#38bdf8' }}>{rawNumbers.length} Total Elements</span>
            </div>
            <div className="chips-list">
              {rawNumbers.map((val, idx) => (
                <div key={idx} className="val-badge">
                  <span className="idx-tag">Index [{idx}]</span>
                  <strong className="num-val">{val}</strong>
                  <button
                    className="quick-del-btn"
                    title={`Delete index ${idx}`}
                    onClick={() => {
                      if (rawNumbers.length <= 2) {
                        alert('Array must contain at least 2 elements.');
                        return;
                      }
                      const updated = rawNumbers.filter((_, i) => i !== idx);
                      setRawNumbers(updated);
                      setCustomInput(updated.join(', '));
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ================= PAGE 4: NOTATIONS ================= */}
      {activeTab === 'notations' && (
        <div className="notations-page">
          <div className="glass-box not-intro-card">
            <h2>Asymptotic Notations (Which notation occurs when?)</h2>
            <p>
              In algorithm analysis, efficiency and runtime growth are measured using three primary mathematical bounds:
            </p>
            <div className="notation-cards-row">
              <div className="notation-box">
                <span className="symbol-pill">Big-O (O)</span>
                <h4>Worst Case (Upper Bound)</h4>
                <p>The maximum time an algorithm takes. Occurs when input is in the most unfavorable order (e.g., Reverse sorted array).</p>
              </div>
              <div className="notation-box">
                <span className="symbol-pill omega-pill">Big-Omega (Ω)</span>
                <h4>Best Case (Lower Bound)</h4>
                <p>The minimum time required. Occurs under ideal input conditions (e.g., Array is already sorted).</p>
              </div>
              <div className="notation-box">
                <span className="symbol-pill theta-pill">Big-Theta (Θ)</span>
                <h4>Average Case (Tight Bound)</h4>
                <p>Expected typical performance under normal conditions with randomly ordered input elements.</p>
              </div>
            </div>
          </div>

          <div className="glass-box table-card">
            <h3>Algorithm Time & Space Complexities</h3>
            <div className="table-responsive">
              <table className="complexity-table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Best Case (Ω)</th>
                    <th>Average Case (Θ)</th>
                    <th>Worst Case (O)</th>
                    <th>Space Complexity</th>
                    <th>Condition / Scenario</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Bubble Sort</strong></td>
                    <td><span className="badge-green">O(N)</span></td>
                    <td><span className="badge-orange">O(N²)</span></td>
                    <td><span className="badge-red">O(N²)</span></td>
                    <td>O(1)</td>
                    <td><strong>Best:</strong> Already Sorted Array.<br /><strong>Worst:</strong> Reverse Sorted Array.</td>
                  </tr>
                  <tr>
                    <td><strong>Selection Sort</strong></td>
                    <td><span className="badge-orange">O(N²)</span></td>
                    <td><span className="badge-orange">O(N²)</span></td>
                    <td><span className="badge-red">O(N²)</span></td>
                    <td>O(1)</td>
                    <td><strong>Always O(N²):</strong> Scans the entire unsorted partition to find the minimum element every pass.</td>
                  </tr>
                  <tr>
                    <td><strong>Insertion Sort</strong></td>
                    <td><span className="badge-green">O(N)</span></td>
                    <td><span className="badge-orange">O(N²)</span></td>
                    <td><span className="badge-red">O(N²)</span></td>
                    <td>O(1)</td>
                    <td><strong>Best:</strong> Array is already sorted.<br /><strong>Worst:</strong> Array is in descending reverse order.</td>
                  </tr>
                  <tr>
                    <td><strong>Merge Sort</strong></td>
                    <td><span className="badge-blue">O(N log N)</span></td>
                    <td><span className="badge-blue">O(N log N)</span></td>
                    <td><span className="badge-blue">O(N log N)</span></td>
                    <td>O(N)</td>
                    <td><strong>Guaranteed O(N log N):</strong> Consistently divides array into equal halves using Divide & Conquer.</td>
                  </tr>
                  <tr>
                    <td><strong>Quick Sort</strong></td>
                    <td><span className="badge-blue">O(N log N)</span></td>
                    <td><span className="badge-blue">O(N log N)</span></td>
                    <td><span className="badge-red">O(N²)</span></td>
                    <td>O(log N)</td>
                    <td><strong>Worst:</strong> Pivot is always smallest/largest element (e.g. Sorted Array).</td>
                  </tr>
                  <tr>
                    <td><strong>Linear Search</strong></td>
                    <td><span className="badge-green">O(1)</span></td>
                    <td><span className="badge-orange">O(N)</span></td>
                    <td><span className="badge-red">O(N)</span></td>
                    <td>O(1)</td>
                    <td><strong>Best:</strong> Target is at the first index.</td>
                  </tr>
                  <tr>
                    <td><strong>Binary Search</strong></td>
                    <td><span className="badge-green">O(1)</span></td>
                    <td><span className="badge-blue">O(log N)</span></td>
                    <td><span className="badge-blue">O(log N)</span></td>
                    <td>O(1)</td>
                    <td><strong>Requirement:</strong> Array must be sorted before performing Binary Search.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAGE 5: TREES, GRAPHS & LINKED LIST ================= */}
      {activeTab === 'trees_graphs_ll' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
          {/* Concept Switcher */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="tab-btn"
              style={{ background: dsTopic === 'invert' ? '#0284c7' : '#1e293b' }}
              onClick={() => { setDsTopic('invert'); handleResetReel(); }}
            >
              🌳 Invert Binary Tree
            </button>
            <button
              className="tab-btn"
              style={{ background: dsTopic === 'inorder' ? '#0284c7' : '#1e293b' }}
              onClick={() => { setDsTopic('inorder'); handleResetReel(); }}
            >
              🔁 Inorder Traversal (BST)
            </button>
            <button
              className="tab-btn"
              style={{ background: dsTopic === 'bfs-queue' ? '#0284c7' : '#1e293b' }}
              onClick={() => { setDsTopic('bfs-queue'); handleResetReel(); }}
            >
              🚶 Level Order (Queue)
            </button>
            <button
              className="tab-btn"
              style={{ background: dsTopic === 'graph-bfs' ? '#0284c7' : '#1e293b' }}
              onClick={() => { setDsTopic('graph-bfs'); handleResetReel(); }}
            >
              🕸️ Graph BFS Traversal
            </button>
            <button
              className="tab-btn"
              style={{ background: dsTopic === 'linked-list' ? '#0284c7' : '#1e293b' }}
              onClick={() => { setDsTopic('linked-list'); handleResetReel(); }}
            >
              🔗 Singly Linked List
            </button>
          </div>

          {/* ================= CUSTOM ARRAY / TREE INPUT TOOLBAR ================= */}
          <form
            onSubmit={handleBuildCustomArray}
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              width: '440px',
              maxWidth: '95vw',
            }}
          >
            <input
              type="text"
              value={customTreeInput}
              onChange={(e) => setCustomTreeInput(e.target.value)}
              placeholder={
                dsTopic === 'linked-list'
                  ? 'Enter list e.g. 10, 20, 30, 40'
                  : 'Enter tree array e.g. 45, 20, 75, 10, 30'
              }
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                color: '#f0f6fc',
                fontFamily: 'monospace',
                fontSize: '13px',
              }}
            />
            <button type="submit" className="btn-set" style={{ cursor: 'pointer', padding: '10px 16px' }}>
              {dsTopic === 'linked-list' ? 'Set List' : 'Set Tree (BST)'}
            </button>
          </form>

          {/* Main Frame Viewport */}
          <div
            className="glass-box"
            style={{
              width: '440px',
              borderRadius: '24px',
              border: '1px solid #334155',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              position: 'relative',
              background: '#090d16',
            }}
          >
            {/* Header */}
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
              <div>
                <span style={{ fontSize: '10px', background: '#0284c7', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontWeight: 'bold' }}>
                  DATA STRUCTURE
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#38bdf8', letterSpacing: '0.5px' }}>
                  {dsTopic === 'invert' && 'INVERT BINARY TREE'}
                  {dsTopic === 'inorder' && 'IN-ORDER TRAVERSAL (BST)'}
                  {dsTopic === 'bfs-queue' && 'BREADTH FIRST SEARCH (TREE)'}
                  {dsTopic === 'graph-bfs' && 'GRAPH BFS TRAVERSAL'}
                  {dsTopic === 'linked-list' && 'SINGLY LINKED LIST'}
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '4px 8px', borderRadius: '8px', fontFamily: 'monospace' }}>
                {dsTopic === 'graph-bfs' ? 'TIME O(V+E)' : dsTopic === 'linked-list' ? 'INSERT: O(1) | SEARCH: O(N)' : 'TIME O(N)'}
              </span>
            </div>

            {/* Canvas Viewport */}
            <div style={{ background: '#030712', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <canvas ref={reelCanvasRef} width={440} height={210} />
              <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', minHeight: '20px', marginBottom: '8px' }}>
                {traversalOutput.length > 0 ? `output: [ ${traversalOutput.join(', ')} ]` : ''}
              </div>
            </div>

            {/* Linked List Interactive Input Row */}
            {dsTopic === 'linked-list' && (
              <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: '#0d131f', borderTop: '1px solid #1e293b', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Val"
                  value={llInputVal}
                  onChange={(e) => setLlInputVal(e.target.value)}
                  style={{ width: '80px', padding: '6px 8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
                />
                <button className="v-btn" onClick={handleAddLLNode} style={{ padding: '6px 10px', fontSize: '11px' }}>
                  + Add Node
                </button>
                <button className="v-btn" onClick={handleDeleteLLNode} style={{ padding: '6px 10px', fontSize: '11px', color: '#f87171' }}>
                  - Delete End
                </button>
              </div>
            )}

            {/* Live Stack & Queue Trackers (for Tree & Graph) */}
            {dsTopic !== 'linked-list' && (
              <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: '#0d131f', borderTop: '1px solid #1e293b' }}>
                <div style={{ flex: 1, border: '1px solid #1e293b', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>CALL STACK (LIFO)</div>
                  <div style={{ display: 'flex', gap: '4px', minHeight: '24px', marginTop: '4px', overflowX: 'auto' }}>
                    {reelStack.map((item, idx) => (
                      <span key={idx} style={{ background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, border: '1px solid #1e293b', borderRadius: '8px', padding: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>QUEUE (FIFO)</div>
                  <div style={{ display: 'flex', gap: '4px', minHeight: '24px', marginTop: '4px', overflowX: 'auto' }}>
                    {reelQueue.map((item, idx) => (
                      <span key={idx} style={{ background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', whiteSpace: 'nowrap' }}>
                        Node({item})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Code Highlighting Window */}
            <div style={{ background: '#020617', padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
              <div style={{ fontSize: '10px', color: '#475569', marginBottom: '6px' }}>● ● ● algorithm.py</div>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.5' }}>
                {dsTopic === 'invert' && (
                  <>
                    <div style={{ color: activeCodeLine === 1 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 1 ? 'bold' : 'normal' }}>1: def invert(node):</div>
                    <div style={{ color: activeCodeLine === 2 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 2 ? 'bold' : 'normal' }}>2:     if node is None: return None</div>
                    <div style={{ color: activeCodeLine === 3 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 3 ? 'bold' : 'normal' }}>3:     node.left, node.right = node.right, node.left</div>
                    <div style={{ color: activeCodeLine === 4 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 4 ? 'bold' : 'normal' }}>4:     invert(node.left)</div>
                    <div style={{ color: activeCodeLine === 5 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 5 ? 'bold' : 'normal' }}>5:     invert(node.right)</div>
                  </>
                )}
                {dsTopic === 'inorder' && (
                  <>
                    <div style={{ color: activeCodeLine === 1 ? '#38bdf8' : '#64748b' }}>1: def inorder(node):</div>
                    <div style={{ color: activeCodeLine === 2 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 2 ? 'bold' : 'normal' }}>2:     inorder(node.left) # Recurse Left</div>
                    <div style={{ color: activeCodeLine === 3 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 3 ? 'bold' : 'normal' }}>3:     visit(node.val)    # Print In Sorted Order</div>
                    <div style={{ color: activeCodeLine === 4 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 4 ? 'bold' : 'normal' }}>4:     inorder(node.right)# Recurse Right</div>
                  </>
                )}
                {dsTopic === 'bfs-queue' && (
                  <>
                    <div style={{ color: '#64748b' }}>1: queue = [root]</div>
                    <div style={{ color: '#64748b' }}>2: while queue:</div>
                    <div style={{ color: activeCodeLine === 3 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 3 ? 'bold' : 'normal' }}>3:     curr = queue.pop(0) # FIFO Dequeue</div>
                    <div style={{ color: activeCodeLine === 4 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 4 ? 'bold' : 'normal' }}>4:     if curr.left: queue.append(curr.left)</div>
                    <div style={{ color: activeCodeLine === 5 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 5 ? 'bold' : 'normal' }}>5:     if curr.right: queue.append(curr.right)</div>
                  </>
                )}
                {dsTopic === 'graph-bfs' && (
                  <>
                    <div style={{ color: '#64748b' }}>1: visited = Set([start])</div>
                    <div style={{ color: '#64748b' }}>2: queue = [start]</div>
                    <div style={{ color: activeCodeLine === 3 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 3 ? 'bold' : 'normal' }}>3: curr = queue.pop(0) # Explore Node</div>
                    <div style={{ color: activeCodeLine === 4 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 4 ? 'bold' : 'normal' }}>4: for neighbor in graph[curr]: queue.push(neighbor)</div>
                  </>
                )}
                {dsTopic === 'linked-list' && (
                  <>
                    <div style={{ color: '#64748b' }}>1: curr = head</div>
                    <div style={{ color: activeCodeLine === 2 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 2 ? 'bold' : 'normal' }}>2: while curr is not None:</div>
                    <div style={{ color: activeCodeLine === 3 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 3 ? 'bold' : 'normal' }}>3:     visit(curr.data)</div>
                    <div style={{ color: activeCodeLine === 4 ? '#38bdf8' : '#64748b', fontWeight: activeCodeLine === 4 ? 'bold' : 'normal' }}>4:     curr = curr.next # Move to next node</div>
                  </>
                )}
              </pre>
            </div>

            {/* Floating Action Controls */}
            <div style={{ position: 'absolute', right: '14px', bottom: dsTopic === 'linked-list' ? '180px' : '130px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="v-btn v-btn-play"
                style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0 }}
                onClick={() => {
                  if (reelPlaying) {
                    handleResetReel();
                  } else {
                    if (dsTopic === 'invert') runInvertReel();
                    else if (dsTopic === 'inorder') runInorderReelWithBackend();
                    else if (dsTopic === 'bfs-queue') runBFSQueueReel();
                    else if (dsTopic === 'graph-bfs') runGraphBFSReel();
                    else if (dsTopic === 'linked-list') runLinkedListWithBackend();
                  }
                }}
              >
                {reelPlaying ? '⏸' : '▶'}
              </button>
              <button
                className="v-btn"
                style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0 }}
                onClick={handleResetReel}
                title="Reset animation"
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="glass-box modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowAuthModal(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!usernameInput) return;
                setUser(usernameInput);
                setShowAuthModal(false);
              }}
              className="modal-form"
            >
              <input
                type="text"
                placeholder="Username"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              <button type="submit" className="v-btn v-btn-play btn-full">
                {isLoginMode ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="switch-link">
              {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
              <span onClick={() => setIsLoginMode(!isLoginMode)}>
                {isLoginMode ? 'Sign Up' : 'Log In'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}