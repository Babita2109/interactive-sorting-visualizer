# ⚡ AlgoSphere – Interactive Sorting Visualizer & Learning Suite

An interactive, full-stack web platform built with **React (TypeScript)** and **Python (Flask)** to visualize, simulate, and teach foundational sorting algorithms and array operations.

---

## 🚀 Key Features

- **🎬 Video-Style Playback Controls**: Interactive scrubber slider, Play/Pause, Step Forward (⏩), Step Backward (⏪), and speed adjustment.
- **💻 English Explanations & Pseudocode**: Real-time subtitle frame banner displaying human-readable logic alongside algorithmic pseudocode syntax.
- **🛠️ Dynamic Array Operations**: Custom element insertion at specific indices and interactive deletion triggers.
- **📊 Supported Algorithms**:
  - Bubble Sort
  - Selection Sort
  - Insertion Sort
  - Merge Sort (Divide & Conquer)
- **📚 Asymptotic Notations & Big-O Guide**: Dedicated theoretical cheat sheet covering Worst Case (O), Best Case (Ω), and Average Case (Θ) scenarios.
- **🎨 Glassmorphism Dark UI**: Modern responsive interface with dynamic color-coded state indicators (Default, Comparing, Swapping, Sorted).

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Vanilla CSS (Glassmorphism design)
- **Backend**: Python, Flask, Flask-CORS
- **Version Control**: Git & GitHub

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone [https://github.com/Babita2109/interactive-sorting-visualizer.git](https://github.com/Babita2109/interactive-sorting-visualizer.git)
cd interactive-sorting-visualizer

2.cd backend
python -m venv venv
# Windows activate:
venv\Scripts\activate
pip install -r requirements.txt
python app.py

3.cd ../frontend
npm install
npm run dev

Open http://localhost:5173 in your browser.
