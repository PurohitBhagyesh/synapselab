# Contributing to SynapseLab

Thank you for your interest in contributing to SynapseLab! This project is an open-source, zero-dependency 3D neural network visualizer and code studio engineered to make deep learning intuitive and visual for students worldwide.

---

## Core Design Principles

When submitting pull requests, please ensure all contributions align with the project design architecture:

1. **Zero External Dependencies**: The core visualizer operates exclusively on vanilla HTML5, CSS3, and JavaScript Canvas API without external frameworks, 3D bundles, or third-party runtime scripts.
2. **Strict Monochrome Aesthetic**: Maintain the clean, high-contrast black-and-white theme (`#000000`, `#ffffff`).
3. **Capsule Pill Controls**: Interactive buttons, segmented switchers, and action chips adhere to the capsule pill geometry (`border-radius: 9999px`).
4. **Editorial Standards**:
   - Zero emojis anywhere in source code, user interface text, comments, or documentation.
   - Zero em dashes in all prose, labels, and commit messages (use hyphens, colons, or parentheses instead).
5. **Privacy First**: Zero cookies, zero trackers, and zero telemetry collection.

---

## Local Development Workflow

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/PurohitBhagyesh/synapselab.git
   cd synapselab
   ```

2. **Launch a Local Server**:
   You can serve the files using Python built-in HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

3. **Verify Syntax and Quality**:
   Run syntax checks before committing:
   ```bash
   node --check app.js
   ```

---

## Submitting Contributions

1. Create a feature branch: `git checkout -b feature/your-improvement`.
2. Commit your modifications with descriptive commit messages.
3. Push to your branch and submit a Pull Request to `main`.
