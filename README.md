# 🧠 SynapseLab — 3D Neural Network Studio for Students

> **An interactive, zero-dependency, open-source 3D neural network visualizer and code studio engineered to make deep learning intuitive, visual, and tactile for students.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)]()
[![Pure Canvas 3D](https://img.shields.io/badge/Engine-Vanilla%20Canvas%203D-cyan.svg)]()
[![Python 3](https://img.shields.io/badge/Python-3.10%2B-blue.svg)]()
[![60 FPS](https://img.shields.io/badge/Performance-60%20FPS-emerald.svg)]()

---

## 🌟 Why SynapseLab? (Unslop Pedagogy)

Traditional machine learning education presents neural networks in one of two extremes:
1. **Abstract Matrix Math**: Dense linear algebra with symbols like $W^{[l]}A^{[l-1]} + b^{[l]}$ that leave students struggling to develop spatial intuition.
2. **Static 2D Diagrams**: Flat circles connected by straight lines that fail to communicate the biological-inspired beauty of multi-layer architectures and optical signal propagation.

**SynapseLab bridges this gap.** Built with a strict **unslop philosophy** (zero marketing bloat, high information density, instant 60 FPS performance, and pure offline web technologies), it turns neural networks into an interactive 3D universe.

---

## ✨ Core Features

### 🌐 1. The 3D Neural Universe
* **Curved Fiber Filaments**: Hundreds of organic 3D cubic Bezier splines fanning out like silk or optical fibers between layers.
* **The "HL 4" 27-Neuron Hero Column**: A towering vertical column of glowing neurons ($N_1$ to $N_{27}$) with individual index tags, depth-sorted rendering, and halos.
* **Perspective 3D Grid Floor**: A glowing cyan wireframe perspective plane receding into the horizon.
* **Optical Signal Waves**: Animated wave packets that travel through the curved synaptic threads, illustrating forward propagation in real time.
* **360° Orbit Camera**: Click/touch-and-drag to orbit around the network in 3D, scroll to zoom.

### ⚡ 2. Live Code & Architecture Studio
* **In-Browser Code Editor**: Write real Python layer arrays like `layers = [3, 8, 4, 1]` or choose presets (*Student Score Predictor*, *Binary Classifier*, *Deep Bottleneck*).
* **Live Dynamic Rebuilding**: The 3D network recalculates node coordinates, layers, and threads on the fly.
* **Training Simulation Engine**: Click **Train Live** to watch Mean Squared Error (MSE) drop epoch by epoch on a live canvas loss chart.

### 🔍 3. 2D Synapse Inspector
* **Thread Hover & Touch Detection**: Move your cursor or finger over any individual thread.
* **Anchor Waypoint Highlights**:
  * 🟡 **Start Dot** (Amber): Highlights the source neuron with exact coordinates $(x_1, y_1)$.
  * 🟣 **Midway Dot** (Purple): Marks the exact mathematical midpoint of the synapse.
  * 🟢 **End Dot** (Emerald): Highlights the destination neuron $(x_2, y_2)$.
* **HUD Telemetry**: Displays the exact numerical synaptic weight ($W$) and signal direction.

### 📚 4. Student Interactive Curriculum
Four concise, interactive lessons built directly into the app:
1. **The Artificial Neuron & Synapse**: With a live interactive slider calculator for $z = w_1x_1 + w_2x_2 + b$.
2. **Activation Functions**: Visual breakdown of ReLU ($\max(0, z)$), Sigmoid, and Tanh.
3. **The Power of Hidden Layers**: Explaining hierarchical feature abstraction.
4. **Backpropagation & Gradient Descent**: How networks calculate errors and update weights ($W := W - \eta \cdot \frac{\partial \mathcal{L}}{\partial W}$).

---

## 🚀 Quick Start (Zero Setup Needed)

Because SynapseLab uses vanilla HTML5, CSS3, and ES6 JavaScript, **no npm install or bundler is required**.

### Option A: Open Directly in Your Browser
Simply double-click `index.html` in your file explorer, or run in Terminal (macOS):
```bash
cd ~/Desktop/neural_network_project
open index.html
```

### Option B: Local Web Server (Optional)
```bash
# Using Python's built-in web server
python3 -m http.server 8000
# Then visit http://localhost:8000 in Safari, Chrome, or Firefox
```

---

## 🐍 Python Machine Learning Scripts Included

Along with the web studio, this repository includes practical Python implementations:

| Script | Description |
| :--- | :--- |
| [`train_nn.py`](train_nn.py) | Trains a Multi-Layer Perceptron using `scikit-learn` with `StandardScaler` and saves `neural_network_model.joblib`. |
| [`predict_nn.py`](predict_nn.py) | Loads the saved model and runs inference for custom inputs. |
| [`neural_network_from_scratch.py`](neural_network_from_scratch.py) | Pure NumPy implementation with raw forward pass, ReLU, MSE loss, and backpropagation math. |
| [`plot_network.py`](plot_network.py) | Matplotlib script that draws publication-quality thread diagrams and exports `neural_network_threads.png`. |

To run the Python scripts:
```bash
source ~/.venv/bin/activate  # or your virtualenv
python train_nn.py
python predict_nn.py
```

---

## 📐 Mathematical Architecture

$$\begin{aligned}
\text{Linear Combination:} \quad & Z^{[l]} = A^{[l-1]} W^{[l]} + b^{[l]} \\
\text{Activation (ReLU):} \quad & A^{[l]} = \max\left(0, Z^{[l]}\right) \\
\text{Mean Squared Error:} \quad & \mathcal{L}(y, \hat{y}) = \frac{1}{N} \sum_{i=1}^{N} \left(y_i - \hat{y}_i\right)^2 \\
\text{Weight Update:} \quad & W \leftarrow W - \eta \cdot \frac{\partial \mathcal{L}}{\partial W}
\end{aligned}$$

---

## 📁 Repository Structure

```
neural_network_project/
├── index.html                    # Main SynapseLab Web Studio (3D, Studio, Inspector, Lessons)
├── 3d_neural_universe.html       # Standalone full-screen 3D Universe viewer
├── live_thread_designer.html     # Standalone 2D thread inspector with code input
├── visualize_network.html        # Lightweight 2D pulse visualizer
├── train_nn.py                   # Scikit-learn MLP training script
├── predict_nn.py                 # Prediction inference script
├── neural_network_from_scratch.py# Pure NumPy educational neural net
├── plot_network.py               # Matplotlib 2D high-res renderer
├── neural_network_threads.png    # 300 DPI exported thread diagram
├── architecture_design.md        # Technical architectural specification
├── guide.txt                     # Quick reference guide
├── .gitignore                    # Standard Python/OS ignore rules
└── README.md                     # Project documentation
```

---

## 📄 License

Distributed under the **MIT License**. Free for students, educators, and developers worldwide.
