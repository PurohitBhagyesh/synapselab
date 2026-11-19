# SynapseLab: 3D Visualization Simulator for Students

An interactive, zero-dependency, open-source 3D neural network visualizer and code studio engineered to make deep learning intuitive, visual, and tactile for students.

```
       [Input Layer]              [Hidden Layers]             [Output Layer]
          ( x1 )  ─── w11 ───>  (  h1  )  ─── w1 ───>  (  y1  )
          ( x2 )  ─── w21 ───>  (  h2  )  ─── w2 ───>  (  y2  )
          ( x3 )  ─── w31 ───>  (  h3  )
```

---

## GitHub Repository Details (Copy & Paste)

Fill these exact fields into your repository details at [github.com/PurohitBhagyesh/synapselab](https://github.com/PurohitBhagyesh/synapselab):

* **Description**: `Interactive 3D neural network visualizer & live Python code lab for students. Hardware-accelerated filaments, real-time forward pass, zero dependencies.`
* **Website**: `https://synapselab.devs.li` (or `https://synapselab.vercel.app`)
* **Topics**: `neural-networks`, `deep-learning`, `3d-visualization`, `machine-learning`, `education`, `python`, `simulator`, `canvas`, `webgl`, `students`

---

## Overview: Two Complementary Student Modes

SynapseLab provides two distinct working environments tailored for learning:

* **Guide Mode (Interactive Curriculum &bull; Read-Only)**: A structured step-by-step visual syllabus explaining artificial neural networks, synaptic filaments, numeric weights, ReLU activation functions, deep representations, and backpropagation. Students touch and hover neurons to isolate incoming and outgoing connections without worrying about code syntax.
* **Test Mode (Code Lab &bull; Write Mode)**: A full VS Code-inspired laboratory (`network_threads.py`). Students edit custom Python layer architecture (`layers = [3, 8, 4, 1]`), adjust hyperparameters, simulate training, and click **Run** to execute live multi-stage signal cascades across all 3D threads.

---

## Core Features

* **Hardware-Accelerated 3D Filaments**: Native cubic Bezier spline evaluation rendered in real-time perspective (`60-120 FPS`), with depth-sorted neurons, radiant halos, and an orientation floor grid.
* **Live Forward Pass & Signal Cascade**: Clicking **Run** (or pressing `Cmd/Ctrl + Enter`) triggers a multi-stage signal pulse across all layers, illuminating neurons sequentially from input to output.
* **Full Screen Mode & Back Navigation**: Click the Fullscreen icon in the viewport toolbar (or press `F`) to expand the visualizer across the full display. A prominent **Back** button in the top-left (or pressing `Esc`) instantly restores the split view.
* **Moving Cosmic Starfield**: Over 200 3D background stars with smooth parallax drifting, twinkle oscillation, and toggle controls.
* **Synaptic Isolation on Touch/Hover**: Touching or hovering any neuron dot immediately lights up its connected filaments with high-contrast dual-pass strokes while softly dimming the rest of the network.
* **VS Code Editing Experience (`network_threads.py`)**: Authentic editor layout with line numbers gutter, cursor position tracking (`Ln X, Col Y`), 4-space Tab indentation, bracket auto-closing, and zero tutorial banners.
* **Settings & Developer Issue Reporting**: Built-in simulator settings (orbit sensitivity, zoom sensitivity, auto-orbit speed, thread luminosity) plus a direct issue reporter prefilled with `Purohitunofficialbhagyesh@gmail.com`.
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

## Deploying to Vercel with DEVS.LI Custom Subdomain

This project includes a production-ready `vercel.json` file. Follow these steps to publish live with your free `devs.li` subdomain:

### Step 1: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import `PurohitBhagyesh/synapselab`.
3. Keep default settings (Framework Preset: **Other**, Root Directory: `./`).
4. Click **Deploy**. Vercel will deploy the site in seconds (e.g. `synapselab.vercel.app` or `synapselab-orpin.vercel.app`).

### Step 2: Configure Your Subdomain on DEVS.LI
1. Go to [devs.li/dashboard](https://devs.li/dashboard).
2. For your claimed subdomain `synapselab.devs.li`, update your DNS records:
   * **Record 1 (CNAME)**:
     * **Type**: `CNAME`
     * **Host / Name**: `synapselab`
     * **Target / Value**: `d81fd5c91ca4006a.vercel-dns-017.com.` (or `cname.vercel-dns.com`)
   * **Record 2 (TXT Ownership Verification)**:
     * Click **+ Add Record** next to `synapselab.devs.li`
     * **Type**: `TXT`
     * **Host / Name**: `_vercel`
     * **Target / Value**: `vc-domain-verify=synapselab.devs.li,3f5a05b2b72309b68d76`
3. Click **Save / Provision Domain**.

### Step 3: Verify Subdomain on Vercel
1. In your Vercel Project Dashboard, navigate to **Settings** -> **Domains**.
2. Click the **Refresh** button next to `synapselab.devs.li`.
3. Vercel will verify the TXT and CNAME records and issue a valid SSL certificate.
4. Your website is now live globally at `https://synapselab.devs.li`!

---

## Test Mode: Advanced Capabilities

* **Multiline Layer Declarations**: Format layers on a single line or across multiple indented lines:
  ```python
  layers = [
      3,  # Input layer (3 features)
      8,  # Hidden layer 1
      4,  # Hidden layer 2
      1   # Output layer (Endpoint)
  ]
  activation = "relu"
  learning_rate = 0.05
  epochs = 300
  ```
* **Interactive Code Breakpoints**: Click any line number in the gutter to toggle a breakpoint dot. Setting a breakpoint on line 1 pauses the 3D signal cascade at Layer 0 for deep inspection, with a one-click Resume action.
* **Output Endpoint Predictions & Loss**: When running inference, SynapseLab calculates real mathematical activations and outputs them at the Endpoint (e.g. `ENDPOINT PREDICTION: [0.942, 0.058] • LOSS: 0.0124`).
* **Multi-Epoch Backpropagation Simulation**: Clicking **Simulate** executes a progressive 4-epoch gradient descent cascade with reverse backpropagation signal pulses flowing backward from the Endpoint.

---

## Responsive Breakpoints & Device Support

SynapseLab is engineered to adapt fluidly across all devices:
* **Large Desktop (> 1024px)**: Full split-view layout with left curriculum/code editor and right 3D WebGL/Canvas viewport.
* **Tablet / Small Laptop (768px - 1023px)**: Responsive column flex with balanced 48%/52% vertical workspace split.
* **Mobile Landscape & Standard Mobile (< 560px & < 480px)**: Compact navigation bar (46px), icon-only controls, text ellipsis on telemetry badges, and 12px editor sizing.
* **Ultra-Compact Devices (< 380px)**: Micro brand title, tight segmented mode switcher, zero horizontal scroll.

---

## Quick Start (Local Development)

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

## Included Python Implementation Scripts

In addition to the in-browser simulator, this repository includes practical Python reference implementations:

| Script | Description |
| :--- | :--- |
| `train_nn.py` | Trains an MLP with `scikit-learn` and saves `neural_network_model.joblib`. |
| `predict_nn.py` | Runs inference using the trained joblib model. |
| `neural_network_from_scratch.py` | Pure NumPy multi-layer forward/backward pass, ReLU activation, and MSE loss. |
| `plot_network.py` | Matplotlib script producing publication-quality diagrams (`neural_network_threads.png`). |

---

## Developer Contact & Issues

* Developer: **Bhagyesh Purohit**
* Email: `Purohitunofficialbhagyesh@gmail.com`
* GitHub: [@PurohitBhagyesh](https://github.com/PurohitBhagyesh)
* Repository: [https://github.com/PurohitBhagyesh/synapselab](https://github.com/PurohitBhagyesh/synapselab)
* Issue Tracker: [https://github.com/PurohitBhagyesh/synapselab/issues](https://github.com/PurohitBhagyesh/synapselab/issues)

---

## License

MIT License. Open for educational, academic, and developer use.

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
