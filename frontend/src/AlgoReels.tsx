import React, { useState, useEffect, useRef } from "react";

interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  x: number;
  y: number;
  status: "default" | "active" | "swapping" | "visited";
}

export const AlgoReels: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>("invert-tree");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [traversalResult, setTraversalResult] = useState<number[]>([]);
  const [stackState, setStackState] = useState<number[]>([]);
  const [queueState, setQueueState] = useState<number[]>([]);
  const [codeSnippet, setCodeSnippet] = useState<string>(
    `def invert(node):\n  if not node: return\n  node.left, node.right = node.right, node.left\n  invert(node.left)\n  invert(node.right)`
  );

  const treeRoot = useRef<TreeNode | null>(null);
  const isRunningRef = useRef<boolean>(false);

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Initialize Sample Tree (4, 2, 7, 1, 3, 6, 9)
  const initDefaultTree = () => {
    const root: TreeNode = {
      val: 4,
      status: "default",
      x: 200,
      y: 40,
      left: {
        val: 2,
        status: "default",
        x: 120,
        y: 100,
        left: { val: 1, left: null, right: null, x: 80, y: 160, status: "default" },
        right: { val: 3, left: null, right: null, x: 160, y: 160, status: "default" },
      },
      right: {
        val: 7,
        status: "default",
        x: 280,
        y: 100,
        left: { val: 6, left: null, right: null, x: 240, y: 160, status: "default" },
        right: { val: 9, left: null, right: null, x: 320, y: 160, status: "default" },
      },
    };
    treeRoot.current = root;
    renderCanvas();
  };

  useEffect(() => {
    initDefaultTree();
  }, []);

  // Canvas Drawing
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (treeRoot.current) {
      drawEdges(ctx, treeRoot.current);
      drawNodes(ctx, treeRoot.current);
    }
  };

  const drawEdges = (ctx: CanvasRenderingContext2D, node: TreeNode | null) => {
    if (!node) return;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#475569";

    if (node.left) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.left.x, node.left.y);
      ctx.stroke();
      drawEdges(ctx, node.left);
    }
    if (node.right) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.right.x, node.right.y);
      ctx.stroke();
      drawEdges(ctx, node.right);
    }
  };

  const drawNodes = (ctx: CanvasRenderingContext2D, node: TreeNode | null) => {
    if (!node) return;

    ctx.beginPath();
    ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI);

    if (node.status === "active") ctx.fillStyle = "#f59e0b"; // Reel Amber highlight
    else if (node.status === "swapping") ctx.fillStyle = "#ef4444"; // Red Swap
    else if (node.status === "visited") ctx.fillStyle = "#10b981"; // Green visited
    else ctx.fillStyle = "#0284c7"; // Default Cyan

    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.val.toString(), node.x, node.y);

    drawNodes(ctx, node.left);
    drawNodes(ctx, node.right);
  };

  // Algorithm 1: Invert Tree (Recursion)
  const handleInvertTree = async () => {
    isRunningRef.current = true;
    setIsPlaying(true);
    setCodeSnippet(
      `def invert(node):\n  # Swap left & right\n  node.left, node.right = node.right, node.left\n  invert(node.left)\n  invert(node.right)`
    );

    async function invert(node: TreeNode | null) {
      if (!node || !isRunningRef.current) return;

      node.status = "active";
      setStackState((prev) => [node.val, ...prev]);
      renderCanvas();
      await sleep(650);

      node.status = "swapping";
      // Swap pointers & coordinates
      const temp = node.left;
      node.left = node.right;
      node.right = temp;

      if (node.left) node.left.x = node.x - (node.x - (temp ? temp.x : node.x));
      renderCanvas();
      await sleep(550);

      node.status = "visited";
      renderCanvas();

      await invert(node.left);
      await invert(node.right);

      setStackState((prev) => prev.filter((v) => v !== node.val));
    }

    await invert(treeRoot.current);
    setIsPlaying(false);
    isRunningRef.current = false;
  };

  // Algorithm 2: Level Order Traversal (Queue BFS)
  const handleBFSQueue = async () => {
    if (!treeRoot.current) return;
    isRunningRef.current = true;
    setIsPlaying(true);
    setCodeSnippet(
      `queue = [root]\nwhile queue:\n  curr = queue.pop(0) # FIFO\n  if curr.left: queue.append(curr.left)\n  if curr.right: queue.append(curr.right)`
    );

    const queue: TreeNode[] = [treeRoot.current];
    const visitedVals: number[] = [];
    setQueueState([treeRoot.current.val]);

    while (queue.length > 0 && isRunningRef.current) {
      const curr = queue.shift()!;
      curr.status = "active";
      visitedVals.push(curr.val);
      setTraversalResult([...visitedVals]);
      renderCanvas();
      await sleep(700);

      curr.status = "visited";
      if (curr.left) queue.push(curr.left);
      if (curr.right) queue.push(curr.right);

      setQueueState(queue.map((n) => n.val));
      renderCanvas();
      await sleep(400);
    }

    setIsPlaying(false);
    isRunningRef.current = false;
  };

  const handleReset = () => {
    isRunningRef.current = false;
    setIsPlaying(false);
    setTraversalResult([]);
    setStackState([]);
    setQueueState([]);
    initDefaultTree();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      {/* Selector Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button
          onClick={() => { setActiveTopic("invert-tree"); handleReset(); }}
          style={{ padding: "8px 16px", borderRadius: "8px", background: activeTopic === "invert-tree" ? "#0284c7" : "#1e293b", color: "#fff", border: "1px solid #334155", cursor: "pointer" }}
        >
          🌳 Invert Tree
        </button>
        <button
          onClick={() => { setActiveTopic("bfs-queue"); handleReset(); }}
          style={{ padding: "8px 16px", borderRadius: "8px", background: activeTopic === "bfs-queue" ? "#0284c7" : "#1e293b", color: "#fff", border: "1px solid #334155", cursor: "pointer" }}
        >
          🚶 BFS Level Order (Queue)
        </button>
      </div>

      {/* Reel Card Container (Instagram Style) */}
      <div style={{ width: "420px", background: "#0b1120", borderRadius: "20px", border: "1px solid #1e293b", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.8)", position: "relative" }}>
        
        {/* Header */}
        <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b" }}>
          <span style={{ fontWeight: 800, color: "#38bdf8", fontSize: "13px" }}>
            {activeTopic === "invert-tree" ? "INVERT BINARY TREE" : "BFS LEVEL ORDER"}
          </span>
          <span style={{ fontSize: "11px", color: "#94a3b8", background: "#1e293b", padding: "3px 8px", borderRadius: "10px" }}>
            TIME O(N) | SPACE O(H)
          </span>
        </div>

        {/* Canvas Display */}
        <div style={{ background: "#030712", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          <canvas ref={canvasRef} width={400} height={210} />
          {traversalResult.length > 0 && (
            <div style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: "12px", marginBottom: "8px" }}>
              traversed: [ {traversalResult.join(", ")} ]
            </div>
          )}
        </div>

        {/* Stack & Queue Tracker */}
        <div style={{ display: "flex", gap: "10px", padding: "10px 14px", background: "#090d16" }}>
          <div style={{ flex: 1, border: "1px solid #1e293b", borderRadius: "8px", padding: "6px" }}>
            <div style={{ fontSize: "10px", color: "#64748b" }}>STACK (LIFO)</div>
            <div style={{ display: "flex", gap: "4px", minHeight: "22px", marginTop: "4px" }}>
              {stackState.map((val, idx) => (
                <span key={idx} style={{ background: "#0284c7", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>{val}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, border: "1px solid #1e293b", borderRadius: "8px", padding: "6px" }}>
            <div style={{ fontSize: "10px", color: "#64748b" }}>QUEUE (FIFO)</div>
            <div style={{ display: "flex", gap: "4px", minHeight: "22px", marginTop: "4px" }}>
              {queueState.map((val, idx) => (
                <span key={idx} style={{ background: "#10b981", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>{val}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Code Highlighting Terminal */}
        <div style={{ background: "#020617", padding: "12px 16px", borderTop: "1px solid #1e293b" }}>
          <div style={{ fontSize: "10px", color: "#475569", marginBottom: "6px" }}>● ● ● script.py</div>
          <pre style={{ margin: 0, color: "#a5f3fc", fontSize: "11px", fontFamily: "monospace", lineHeight: "1.4" }}>
            {codeSnippet}
          </pre>
        </div>

        {/* Reel Floating Action Buttons */}
        <div style={{ position: "absolute", right: "12px", bottom: "140px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={activeTopic === "invert-tree" ? handleInvertTree : handleBFSQueue}
            disabled={isPlaying}
            style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#0284c7", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}
          >
            ▶
          </button>
          <button
            onClick={handleReset}
            style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", cursor: "pointer" }}
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
};