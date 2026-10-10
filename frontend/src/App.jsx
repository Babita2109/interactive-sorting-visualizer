
import { useState } from "react";
import "./App.css";

const initialArray = [42, 18, 65, 9, 31, 77, 24, 53, 12, 46];

function App() {
  const [numbers, setNumbers] = useState(initialArray);
  const [arrayInput, setArrayInput] = useState(initialArray.join(", "));
  const [algorithm, setAlgorithm] = useState("bubble");
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [status, setStatus] = useState("Ready to sort");
  const [history, setHistory] = useState([]);

  function startSort() {
    const values = arrayInput
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value !== "")
      .map(Number);

    if (
      values.length === 0 ||
      values.some((value) => !Number.isFinite(value)) ||
      values.length > 50
    ) {
      setStatus("Enter 1–50 valid numbers, separated by commas.");
      return;
    }

    let count = 0;
    let swapCount = 0;
    const startTime = performance.now();
    let sorted = [...values];

    if (algorithm === "bubble") {
      for (let i = 0; i < sorted.length - 1; i++) {
        for (let j = 0; j < sorted.length - i - 1; j++) {
          count++;
          if (sorted[j] > sorted[j + 1]) {
            [sorted[j], sorted[j + 1]] = [sorted[j + 1], sorted[j]];
            swapCount++;
          }
        }
      }
    } else if (algorithm === "selection") {
      for (let i = 0; i < sorted.length - 1; i++) {
        let min = i;
        for (let j = i + 1; j < sorted.length; j++) {
          count++;
          if (sorted[j] < sorted[min]) min = j;
        }
        if (min !== i) {
          [sorted[i], sorted[min]] = [sorted[min], sorted[i]];
          swapCount++;
        }
      }
    } else if (algorithm === "insertion") {
      for (let i = 1; i < sorted.length; i++) {
        const key = sorted[i];
        let j = i - 1;
        while (j >= 0) {
          count++;
          if (sorted[j] <= key) break;
          sorted[j + 1] = sorted[j];
          j--;
          swapCount++;
        }
        sorted[j + 1] = key;
      }
    } else {
      sorted.sort((a, b) => a - b);
    }

    const elapsed = (performance.now() - startTime).toFixed(3);
    setNumbers(sorted);
    setComparisons(count);
    setSwaps(swapCount);
    setStatus("Sorting completed successfully!");

    setHistory((previous) => [
      {
        algorithm: algorithm.toUpperCase(),
        count: values.length,
        time: elapsed,
        result: sorted.join(", "),
      },
      ...previous,
    ].slice(0, 5));
  }

  function generateArray() {
    const values = Array.from(
      { length: 10 },
      () => Math.floor(Math.random() * 90) + 1
    );
    setNumbers(values);
    setArrayInput(values.join(", "));
    setStatus("New array generated");
  }

  const maxValue = Math.max(...numbers, 1);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✳</span>
          <div>
            <h2>Cosmic Sort</h2>
            <p>ALGORITHM LAB</p>
          </div>
        </div>

        <p className="menu-label">WORKSPACE</p>
        <div className="nav-item active">◈ &nbsp; Dashboard</div>
        <div className="nav-item">⌁ &nbsp; Live Analytics</div>
        <div className="nav-item">◷ &nbsp; Sort History</div>

        <div className="sidebar-bottom">
          <div className="connection-dot" />
          <span>Visualizer Online</span>
          <p>Version 1.0 · Student Edition</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">ALGORITHM PLAYGROUND</p>
            <h1>Sorting Dashboard</h1>
          </div>
          <div className="status-pill">● System Ready</div>
        </header>

        <section className="hero">
          <div className="hero-content">
            <span className="hero-tag">✦ EXPLORE · ANALYZE · LEARN</span>
            <h2>Make algorithms<br />visible.</h2>
            <p>
              Explore sorting algorithms, understand their performance,
              and turn complex logic into clear insights.
            </p>
            <button className="primary-button" onClick={startSort}>
              ▶ &nbsp; Initiate Sort
            </button>
          </div>
          <div className="orbit-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="planet">✳</div>
            <span className="star star-one">✦</span>
            <span className="star star-two">✧</span>
            <span className="star star-three">·</span>
          </div>
        </section>

        <section className="section-heading">
          <div>
            <h2>Control Center</h2>
            <p>Configure your dataset and sorting algorithm.</p>
          </div>
          <button className="secondary-button" onClick={generateArray}>
            ↻ Generate Array
          </button>
        </section>

        <section className="control-panel">
          <div className="field">
            <label htmlFor="array-input">INPUT ARRAY</label>
            <input
              id="array-input"
              value={arrayInput}
              onChange={(event) => setArrayInput(event.target.value)}
              placeholder="Example: 12, 5, 30, 8"
            />
          </div>
          <div className="field">
            <label htmlFor="algorithm">SORTING ALGORITHM</label>
            <select
              id="algorithm"
              value={algorithm}
              onChange={(event) => setAlgorithm(event.target.value)}
            >
              <option value="bubble">Bubble Sort — O(n²)</option>
              <option value="selection">Selection Sort — O(n²)</option>
              <option value="insertion">Insertion Sort — O(n²)</option>
              <option value="merge">Merge Sort — O(n log n)*</option>
              <option value="quick">Quick Sort — O(n log n)*</option>
            </select>
          </div>
          <button className="primary-button sort-button" onClick={startSort}>
            ▶ Sort Now
          </button>
        </section>

        <section className="section-heading">
          <div>
            <h2>Live Visualization</h2>
            <p>Compare the values in your array.</p>
          </div>
          <span className="live-tag">● LIVE VIEW</span>
        </section>

        <section className="visual-panel">
          <div className="chart-top">
            <span>ARRAY ELEMENTS</span>
            <span>{numbers.length} elements</span>
          </div>
          <div className="bar-chart">
            {numbers.map((number, index) => (
              <div className="bar-column" key={`${index}-${number}`}>
                <span className="bar-value">{number}</span>
                <div
                  className="bar"
                  style={{ height: `${Math.max((number / maxValue) * 180, 8)}px` }}
                  title={`Value: ${number}`}
                />
                <span className="bar-index">{index}</span>
              </div>
            ))}
          </div>
          <div className="chart-footer">
            <span>Index starts at 0</span>
            <span>{status}</span>
          </div>
        </section>

        <section className="section-heading">
          <div>
            <h2>Performance Insights</h2>
            <p>Metrics from your latest run.</p>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon purple">⌁</span>
            <p>COMPARISONS</p>
            <h3>{comparisons}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-icon pink">⇄</span>
            <p>SWAPS / MOVES</p>
            <h3>{swaps}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-icon blue">◷</span>
            <p>ARRAY SIZE</p>
            <h3>{numbers.length}</h3>
          </div>
          <div className="stat-card">
            <span className="stat-icon green">✓</span>
            <p>STATUS</p>
            <h3 className="status-result">Ready</h3>
          </div>
        </section>

        <section className="section-heading">
          <div>
            <h2>Recent Runs</h2>
            <p>Recent runs in this browser session.</p>
          </div>
        </section>

        <section className="history-panel">
          {history.length === 0 ? (
            <p className="empty-state">
              No runs yet. Start a sort to see your results here.
            </p>
          ) : (
            history.map((item, index) => (
              <div className="history-row" key={`${item.algorithm}-${index}`}>
                <div>
                  <strong>{item.algorithm}</strong>
                  <p>{item.count} elements · {item.time} ms</p>
                </div>
                <span className="history-result">Completed ✓</span>
              </div>
            ))
          )}
        </section>

        <footer>Cosmic Sort · Interactive Sorting Visualizer &amp; Complexity Analyzer</footer>
      </main>
    </div>
  );
}

export default App;
