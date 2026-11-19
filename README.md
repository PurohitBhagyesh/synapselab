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
├── LICENSE                      # MIT Open Source License
├── CONTRIBUTING.md              # Open source contribution guidelines
├── SECURITY.md                  # Security and privacy policy
├── google5fefb455a4f252a7.html  # Google Search Console domain verification
├── robots.txt                   # Search crawler directives
├── sitemap.xml                  # Search engine XML sitemap
├── vercel.json                  # Production headers & clean routing config
├── README.md                    # Project documentation
├── .github/                     # GitHub automated workflows
│   └── workflows/ci.yml         # Continuous integration validation pipeline
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

SynapseLab provides two distinct working environments tailored for learning, designed to maintain complete independence without overwriting student work:

* **Guide Mode (Interactive Curriculum &bull; Read-Only)**: A structured step-by-step visual syllabus explaining artificial neural networks, synaptic filaments, numeric weights, ReLU activation functions, deep representations, and backpropagation. Students touch and hover neurons to isolate incoming and outgoing connections without worrying about code syntax. Lesson 5 features a full interactive Backpropagation & Gradient Descent simulation cascade showing error flows in reverse.
* **Test Mode (Code Lab &bull; Write Mode)**: A full VS Code-inspired laboratory (`network_threads.py`). Students can write custom Python code from scratch or load one of several real-world architecture examples using quick-load capsule chips. The student code remains persistent and is never overwritten when switching modes.

---

## Test Mode Architecture Examples

Students can quickly load and explore classic deep learning architectures with a single click:

| Preset Name | Architecture | Purpose & Learning Concept |
| :--- | :--- | :--- |
| **Classifier** | `[3, 8, 4, 1]` | Standard multi-layer perceptron for tabular classification & regression |
| **Perceptron** | `[2, 1]` | Minimal single-layer linear classifier (decision hyperplane & logic gates) |
| **Deep Vision** | `[8, 16, 12, 6, 2]` | Deep hierarchical feature extraction for multi-class computer vision |
| **Autoencoder** | `[6, 3, 2, 3, 6]` | Symmetric compression bottleneck for 2D latent representation learning |
| **Wide Network** | `[2, 24, 1]` | High-capacity shallow hidden layer demonstrating universal approximation |
| **Deep Chain** | `[4, 4, 4, 4, 1]` | Uniform residual-style chain for gradient flow and depth dynamics analysis |

---

## Core Features

* **Hardware-Accelerated 3D Filaments**: Native cubic Bezier spline evaluation rendered in real-time perspective (`60-120 FPS`), with depth-sorted neurons, radiant halos, and an orientation floor grid.
* **macOS-Inspired Capsule Mode Switcher**: Centered in the top header navbar on PC, and pinned as a sleek floating capsule dock at the bottom of the screen on mobile (`border-radius: 9999px`) to maximize workspace height from top to bottom.
* **Dedicated PC and Mobile UI Architectures**: Custom-tailored layouts for desktop (horizontal split, top-centered mode switcher, bottom status bar with Coffee button) and mobile (vertical stack, top header with Coffee trigger, bottom floating mode dock, zero wasted space).
* **Capsule Pill Aesthetics Across All Triggers**: All action buttons, navigation triggers, viewport tools, preset chips, and modal actions follow a cohesive, modern capsule pill aesthetic (`border-radius: 9999px`).
* **Elongated 3D Output & Expansive Perspective**: Increased depth separation between layers and expansive 3D canvas allocation on mobile and desktop so layer cards never collide and the output layer projects forward cleanly.
* **High-Contrast UPI QR Code Card**: Solid white 204px card with 180x180 vector SVG QR code and quiet zone margins (`Purohit2009@fam`) scan-tested for immediate recognition by Google Pay, PhonePe, Paytm, and FamApp camera scanners.
* **Touchscreen Gestures**: One-finger swipe to rotate with inertial deceleration, and two-finger pinch to zoom in and zoom out smoothly.
* **Interactive Light-Up Guides**: Touching any curriculum lesson loads that architecture immediately and illuminates the 3D network with forward pass or backpropagation cascades.
* **Compact Viewport Controls**: Sleek, non-intrusive floating control bar on mobile with essential tools (Auto-Orbit, Center View, Labels Toggle, Snapshot, Fullscreen) that never obstruct network layers.
* **Focused Test Mode Toolbar**: Streamlined editor actions containing only Run and Simulate for focused student coding and live visual feedback.
* **Dynamic Label Formatting**: Floating layer cards dynamically measure and pad text so titles and neuron counts always remain cleanly inside boxes.
* **Hide Labels Toggle (`H`)**: One-click button in viewport toolbar to toggle text boxes and neuron labels on/off for a pure, cinematic view of 3D threads.
* **Instant Hover Tooltips**: Instant dark-mode hover labels on all viewport controls (Auto Orbit, Reset, Toggle Labels, Save Image, Fullscreen).
* **Live Forward Pass & Signal Cascade**: Clicking **Run** (or pressing `Cmd/Ctrl + Enter`) triggers a multi-stage signal pulse across all layers, illuminating neurons sequentially from input to output.
* **Automatic Mobile Landscape on Fullscreen**: Entering Fullscreen on smartphones automatically locks orientation to landscape for maximum visual immersion.
* **Streamlined Settings Modal**: Orbit, zoom, auto-orbit speed, and thread luminosity sliders, moving starfield toggle, reset to defaults, direct link share copy, and privacy policy & terms.
* **Support Developer Modal**: Live UPI QR code generator (`Purohit2009@fam`) with instant payment links for FamApp, Google Pay, PhonePe, and Paytm.
* **Zero Cookies Architecture**: 100% cookie-free execution, zero tracking pixels or analytics scripts.
* **Pure Monochrome Design**: Built adhering strictly to modern standards: zero emojis, zero em dashes, zero purple gradients, high-contrast black and white styling (`#000000`, `#ffffff`).

---

## Gestures & Keyboard Shortcuts

| Gesture / Shortcut | Action |
| :--- | :--- |
| `1-Finger Drag` | Orbit / rotate 3D neural network with inertial momentum |
| `2-Finger Pinch` | Zoom in and zoom out 3D perspective |
| `Space` | Toggle auto-orbit camera rotation |
| `R` | Reset 3D camera to default position and angle |
| `H` | Toggle layer labels and neuron text on/off |
| `F` | Toggle fullscreen mode in 3D visualizer |
| `Esc` | Exit fullscreen mode / close modals |
| `Cmd/Ctrl + Enter` | Run code and trigger live forward pass |

---

## Contributing & Security

* **Contribution Guidelines**: Please review [CONTRIBUTING.md](CONTRIBUTING.md) for code style, development guidelines, and pull request procedures.
* **Security & Privacy**: Read our [SECURITY.md](SECURITY.md) policy detailing zero-cookie client-side isolation and disclosure guidelines.

---

## License

[MIT License](LICENSE). Copyright (c) 2026 [Bhagyesh Purohit](https://github.com/PurohitBhagyesh).
