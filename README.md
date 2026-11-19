# SynapseLab: 3D Visualization Simulator for Students

An interactive, zero-dependency, open-source 3D neural network visualizer and code studio engineered to make deep learning intuitive, visual, and tactile for students.

---

## Overview

SynapseLab provides two distinct working environments tailored for learning:

* **Guide Mode**: A structured, interactive learning curriculum explaining what an artificial neural network is, what the layers (Input, Hidden, Output) do, what the synaptic threads and weights represent, and how signals flow forward to produce predictions. Touching or hovering any neuron dot isolates its incoming and outgoing synapses with real-time HUD telemetry.
* **Test Mode**: A distraction-free code laboratory (`network_threads.py`) for students to write real Python architecture code (`layers = [3, 8, 4, 1]`), adjust hyperparameters, simulate training, trigger live multi-stage forward passes, and watch 3D white filaments adapt in real time.

---

## Core Features

* **3D Visualization Simulator**: 3D cubic Bezier filaments rendered in continuous real-time perspective, depth-sorted neurons, and an orientation floor grid at 60-120 FPS.
* **Live Run Forward Pass**: Clicking **Run** (or pressing `Cmd/Ctrl + Enter`) triggers a multi-stage sequential forward pass wave across all layers, illuminating active neurons and firing fast signal beads along all threads.
* **Fullscreen Mode & Back Navigation**: Click the Fullscreen icon in the viewport toolbar (or press `F`) to expand the 3D visualizer to 100% of the screen. A prominent **Back** button in the top-left (or pressing `Esc`) instantly restores the split-screen view.
* **Moving Cosmic Starfield**: Over 200 3D background stars with smooth parallax drifting and twinkle oscillation.
* **Synaptic Isolation on Touch/Hover**: Touching or hovering any neuron dot immediately lights up its connected threads with intense luminous glow while softly dimming the rest of the network.
* **VS Code Editing Experience (`network_threads.py`)**: Authentic editor layout with line numbers, cursor position tracking (`Ln X, Col Y`), 4-space Tab indentation, and bracket auto-closing.
* **Pure Monochrome Design**: Built adhering strictly to modern standards: zero emojis, zero em dashes, zero purple gradients, zero pill buttons, high-contrast black and white styling (`#000000`, `#ffffff`).
* **Compliance & DPDP Act 2023**: 100% in-browser client execution, zero tracking cookies, local storage strictly for UI preferences, and complete legal transparency.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle auto-orbit camera rotation |
| `R` | Reset 3D camera to default position and angle |
| `F` | Toggle fullscreen mode in 3D visualizer |
| `Esc` | Exit fullscreen mode / close modals |
| `Cmd/Ctrl + Enter` | Run code and trigger live forward pass |

---

## Quick Start

Open directly in your web browser (Safari, Chrome, Firefox, Edge):

```bash
cd ~/Desktop/neural_network_project
open index.html
```

Or run a local lightweight server:

```bash
python3 -m http.server 8000
# Then visit http://localhost:8000
```

---

## How to Publish to GitHub (PurohitBhagyesh)

To publish this project to your GitHub account (`https://github.com/PurohitBhagyesh`):

### Step 1: Create a New Repository on GitHub
1. Open your browser and go to [https://github.com/new](https://github.com/new).
2. Set **Repository name**: `synapselab` (or `3d-neural-network-simulator`).
3. Set visibility to **Public**.
4. **Important**: Leave "Add a README file" unchecked (since this project already has a full README and git history).
5. Click **Create repository**.

### Step 2: Push Your Local Repository from Terminal
Run the following commands in your Mac terminal:

```bash
cd /Users/purohitbhagyesh/Desktop/neural_network_project

# Link your local repository to your GitHub account
git remote add origin https://github.com/PurohitBhagyesh/synapselab.git

# Set branch name to main
git branch -M main

# Push all code and commits to GitHub
git push -u origin main
```

*(If you use SSH keys with GitHub, use `git remote add origin git@github.com:PurohitBhagyesh/synapselab.git` instead).*

### Step 3: Enable Free GitHub Pages Hosting (Optional)
To let students access the simulator live online:
1. In your GitHub repository, click **Settings** -> **Pages** (under Code and automation).
2. Under **Build and deployment** -> **Source**, select `Deploy from a branch`.
3. Choose branch `main` and folder `/ (root)`, then click **Save**.
4. Your website will be live in 1-2 minutes at:
   `https://purohitbhagyesh.github.io/synapselab/`

---

## Included Python Implementation Scripts

In addition to the in-browser simulator, this repository includes practical Python reference implementations:

| Script | Description |
| :--- | :--- |
| `train_nn.py` | Trains an MLP with `scikit-learn` and saves `neural_network_model.joblib`. |
| `predict_nn.py` | Runs inference using the trained joblib model. |
| `neural_network_from_scratch.py` | Pure NumPy multi-layer forward/backward pass, ReLU activation, and MSE loss. |
| `plot_network.py` | Matplotlib script producing publication-quality diagrams (`neural_network_threads.png`). |

---

## License

MIT License. Open for educational, academic, and developer use.
