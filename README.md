# SynapseLab: 3D Visualization Simulator for Students

An interactive, zero-dependency, open-source 3D neural network visualizer and code studio engineered to make deep learning intuitive, visual, and tactile for students.

```
       [Input Layer]              [Hidden Layers]             [Output Layer]
          ( x1 )  ─── w11 ───>  (  h1  )  ─── w1 ───>  (  y1  )
          ( x2 )  ─── w21 ───>  (  h2  )  ─── w2 ───>  (  y2  )
          ( x3 )  ─── w31 ───>  (  h3  )
```

---

## Live Website & Repository Details

* **Live Deployment**: [https://synapselab.devs.li](https://synapselab.devs.li)
* **GitHub Repository**: [github.com/PurohitBhagyesh/synapselab](https://github.com/PurohitBhagyesh/synapselab)
* **Developer Email**: `Purohitunofficialbhagyesh@gmail.com`
* **Description**: `Interactive 3D neural network visualizer & live Python code lab for students. Hardware-accelerated filaments, real-time forward pass, zero dependencies.`
* **Topics**: `neural-networks`, `deep-learning`, `3d-visualization`, `machine-learning`, `education`, `python`, `simulator`, `canvas`, `webgl`, `students`

---

## Project Structure

```
synapselab/
├── index.html                   # Core web application (pure HTML5 & Canvas)
├── style.css                    # Monochrome dark-mode stylesheet (#000000, #ffffff)
├── app.js                       # 3D math projection engine & interactive editor
├── banner.png                   # High-resolution social media card (1200x630, og:image)
├── network_threads.py           # Starter Python code for students
├── google5fefb455a4f252a7.html  # Google Search Console domain verification
├── robots.txt                   # Search crawler directives
├── sitemap.xml                  # Search engine XML sitemap
├── vercel.json                  # Production headers & clean routing config
├── README.md                    # Project documentation
├── python/                      # Standalone Python neural network scripts
│   ├── network_threads.py       # Architecture specification
│   ├── neural_network_from_scratch.py  # Pure NumPy forward & backpropagation
│   ├── plot_network.py          # Matplotlib 2D architecture visualizer
│   ├── train_nn.py              # Model training script
│   ├── predict_nn.py            # Model inference runner
│   └── neural_network_model.joblib # Serialized model weights
├── docs/                        # Specifications and design diagrams
│   ├── architecture_design.md   # Mathematical equations & system architecture
│   ├── guide.txt                # Curriculum notes
│   └── neural_network_threads.png # Reference render
└── archive/                     # Early prototypes and legacy exploration files
```

---

## Overview: Two Complementary Student Modes

SynapseLab provides two distinct working environments tailored for learning:

* **Guide Mode (Interactive Curriculum &bull; Read-Only)**: A structured step-by-step visual syllabus explaining artificial neural networks, synaptic filaments, numeric weights, ReLU activation functions, deep representations, and backpropagation. Students touch and hover neurons to isolate incoming and outgoing connections without worrying about code syntax.
* **Test Mode (Code Lab &bull; Write Mode)**: A full VS Code-inspired laboratory (`network_threads.py`). Students edit custom Python layer architecture (`layers = [3, 8, 4, 1]`), adjust hyperparameters, simulate training, and click **Run** to execute live multi-stage signal cascades across all 3D threads.

---

## Core Features

* **Hardware-Accelerated 3D Filaments**: Native cubic Bezier spline evaluation rendered in real-time perspective (`60-120 FPS`), with depth-sorted neurons, radiant halos, and an orientation floor grid.
* **Mobile Bottom Mode Slider**: Floating bottom thumb-accessible switcher with hardware-accelerated sliding indicator for instant switching between Guide Mode and Test Mode.
* **Interactive Light-Up Guides**: Selecting any curriculum lesson or clicking interactive actions illuminates the 3D network with real-time forward pass signal pulses.
* **Fluid Touch Swipe & Inertial Momentum**: Natural deceleration physics when dragging or swiping the 3D network on touchscreens and desktop mice.
* **Dynamic Label Formatting**: Floating layer cards dynamically measure and pad text so titles and neuron counts always remain cleanly inside boxes.
* **Hide Labels Toggle (`H`)**: One-click button in viewport toolbar to toggle text boxes and neuron labels on/off for a pure, cinematic view of 3D threads.
* **Instant Hover Tooltips**: Instant dark-mode hover labels on all viewport controls (Auto Orbit, Zoom In, Zoom Out, Reset, Toggle Labels, Fullscreen).
* **Live Forward Pass & Signal Cascade**: Clicking **Run** (or pressing `Cmd/Ctrl + Enter`) triggers a multi-stage signal pulse across all layers, illuminating neurons sequentially from input to output.
* **Automatic Mobile Landscape on Fullscreen**: Entering Fullscreen on smartphones automatically locks orientation to landscape for maximum visual immersion.
* **Unified Settings Modal**: Sensitivity sliders (orbit, zoom, speed), starfield toggle, developer contact email (`Purohitunofficialbhagyesh@gmail.com`), direct sharing, UPI tip support, and combined privacy & terms.
* **Zero Cookies Architecture**: 100% cookie-free execution, zero tracking pixels or analytics scripts, local device storage strictly for camera and starfield preferences.
* **Pure Monochrome Design**: Built adhering strictly to modern standards: zero emojis, zero em dashes, zero purple gradients, high-contrast black and white styling (`#000000`, `#ffffff`).

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle auto-orbit camera rotation |
| `R` | Reset 3D camera to default position and angle |
| `H` | Toggle layer labels and neuron text on/off |
| `F` | Toggle fullscreen mode in 3D visualizer |
| `Esc` | Exit fullscreen mode / close modals |
| `Cmd/Ctrl + Enter` | Run code and trigger live forward pass |

---

## License

MIT License. Designed and engineered by [Bhagyesh Purohit](https://github.com/PurohitBhagyesh).
