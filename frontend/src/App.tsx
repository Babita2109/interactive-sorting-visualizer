import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './style.css';

type Algorithm = 'bubble' | 'selection' | 'insertion' | 'merge';
type ActiveTab = 'visualizer' | 'operations' | 'notations';

interface Frame {
  array: { val: number; status: 'default' | 'compare' | 'swap' | 'sorted' }[];
  explanation: string;
  comparisons: number;
  swaps: number;
}

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

  // Operations states
  const [insertVal, setInsertVal] = useState<string>('');
  const [insertIdx, setInsertIdx] = useState<string>('');
  const [deleteIdx, setDeleteIdx] = useState<string>('');

  // Playback / Timeline states
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Generate Frame Timeline with English Explanations and Pseudocode
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
            explanation: `Comparing arr[${j}] (${arr[j]}) and arr[${j + 1}] (${arr[j + 1]}) | Pseudocode: if (arr[${j}] > arr[${j + 1}])`,
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
              explanation: `Swapping values ${temp} and ${arr[j]} | Pseudocode: swap(arr[${j}], arr[${j + 1}])`,
              comparisons: comp,
              swaps: swp,
            });
          }
        }
        statusArr[n - i - 1] = 'sorted';
        generatedFrames.push({
          array: makeBars(arr, [...statusArr]),
          explanation: `Element ${arr[n - i - 1]} placed at correct index [${n - i - 1}] | Pseudocode: mark_sorted(arr[${n - i - 1}])`,
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
          explanation: `Setting initial minimum index to [${i}] with value ${arr[i]} | Pseudocode: min_index = ${i}`,
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
            explanation: `Comparing candidate (${arr[minIdx]}) with arr[${j}] (${arr[j]}) | Pseudocode: if (arr[${j}] < arr[min_index])`,
            comparisons: comp,
            swaps: swp,
          });

          if (arr[j] < arr[minIdx]) {
            minIdx = j;
            generatedFrames.push({
              array: makeBars(arr, currentStatuses),
              explanation: `Found smaller element ${arr[minIdx]} at index [${minIdx}] | Pseudocode: min_index = ${minIdx}`,
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
            explanation: `Swapped minimum element ${arr[i]} into index [${i}] | Pseudocode: swap(arr[${i}], arr[min_index])`,
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
          explanation: `Selected key element ${key} at index [${i}] | Pseudocode: key = arr[${i}], j = ${i} - 1`,
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
            explanation: `Shifting element: ${temp} < ${arr[j]}, moved to index [${j - 1}] | Pseudocode: arr[j + 1] = arr[j]; j--`,
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
        explanation: `Array is fully sorted | Pseudocode: TERMINATE_SORT()`,
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
          explanation: `Divide: Subarrays [${start}..${mid}] and [${mid + 1}..${end}] | Pseudocode: MERGE(arr, ${start}, ${mid}, ${end})`,
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
            explanation: `Merged element ${arr[k]} into position [${k}] | Pseudocode: arr[k] = min(left[i], right[j]); k++`,
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
            explanation: `Copying remaining left elements | Pseudocode: arr[k] = left[i]; i++; k++`,
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
            explanation: `Copying remaining right elements | Pseudocode: arr[k] = right[j]; j++; k++`,
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
        explanation: `Array merged and sorted successfully | Pseudocode: MERGE_SORT_COMPLETE()`,
        comparisons: comp,
        swaps: swp,
      });
    }

    setFrames(generatedFrames);
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    generateFrames(rawNumbers, algorithm);
  }, [rawNumbers, algorithm]);

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
            🎬 Visualizer
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
        </div>

        <div className="nav-right">
          <span className="pill-algo">{algorithm.toUpperCase()}</span>
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

      {/* ================= PAGE 1: VISUALIZER ================= */}
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
              {(['bubble', 'selection', 'insertion', 'merge'] as Algorithm[]).map((alg) => (
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
                {currentFrame.explanation.includes('| Pseudocode:') ? (
                  <>
                    <span>{currentFrame.explanation.split('| Pseudocode:')[0]}</span>
                    <code className="pseudocode-tag">
                      {currentFrame.explanation.split('| Pseudocode:')[1]}
                    </code>
                  </>
                ) : (
                  currentFrame.explanation
                )}
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

      {/* ================= PAGE 2: OPERATIONS ================= */}
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

      {/* ================= PAGE 3: NOTATIONS ================= */}
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
                </tbody>
              </table>
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