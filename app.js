/**
 * SynapseLab Application Engine
 * 3D Visualization Simulator for Students
 * Pure Black & White Monochrome Aesthetic • 60-120 FPS High Performance Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. SETTINGS & CONFIGURATION (Stored in localStorage)
  // ---------------------------------------------------------------------------
  const DEFAULT_SETTINGS = {
    orbitSensitivity: 1.0,
    zoomSensitivity: 1.0,
    orbitSpeed: 1.0,
    enableStarfield: true,
    threadLuminosity: 0.55
  };

  let settings = Object.assign({}, DEFAULT_SETTINGS);
  try {
    const saved = localStorage.getItem('synapselab_settings');
    if (saved) settings = Object.assign(settings, JSON.parse(saved));
  } catch (e) {}

  function saveSettings() {
    try {
      localStorage.setItem('synapselab_settings', JSON.stringify(settings));
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 2. MODE SWITCHER & WORKSPACE PANES
  // ---------------------------------------------------------------------------
  let currentMode = 'guide';
  const tabGuide = document.getElementById('tabGuide');
  const tabTest = document.getElementById('tabTest');
  const paneGuide = document.getElementById('paneGuide');
  const paneTest = document.getElementById('paneTest');

  const studentCode = document.getElementById('studentCode');
  const lineNumbers = document.getElementById('lineNumbers');
  const cursorPos = document.getElementById('cursorPos');
  const btnRunCode = document.getElementById('btnRunCode');
  const btnTrainLive = document.getElementById('btnTrainLive');
  const btnResetCode = document.getElementById('btnResetCode');

  const defaultStarterCode = `layers = [3, 8, 4, 1]
activation = "relu"
learning_rate = 0.05
epochs = 300`;

  let activeBreakpoints = new Set();
  let currentModelParams = {
    activation: 'relu',
    learningRate: 0.05,
    epochs: 300,
    layers: [3, 8, 4, 1]
  };

  let activeGuideConfig = {
    layers: [3, 6, 2],
    activation: 'relu',
    learningRate: 0.05,
    epochs: 200
  };

  function formatPythonCode(config) {
    const layerStr = JSON.stringify(config.layers || [3, 6, 2]);
    return `layers = ${layerStr}
activation = "${config.activation || 'relu'}"
learning_rate = ${config.learningRate || 0.05}
epochs = ${config.epochs || 300}`;
  }

  function attachTap(el, fn) {
    if (!el) return;
    el.addEventListener('click', fn);
  }

  function updateLineNumbers() {
    if (!studentCode || !lineNumbers) return;
    const lines = studentCode.value.split('\n');
    const count = lines.length || 1;
    let html = '';
    for (let i = 1; i <= count; i++) {
      const isBp = activeBreakpoints.has(i);
      html += `<div class="gutter-line ${isBp ? 'has-bp' : ''}" data-line="${i}" title="${isBp ? 'Breakpoint active (click to remove)' : 'Click to toggle breakpoint'}"><span class="bp-dot"></span><span class="gutter-num">${i}</span></div>`;
    }
    lineNumbers.innerHTML = html;
  }

  function updateCursorPosition() {
    if (!studentCode || !cursorPos) return;
    const text = studentCode.value.substring(0, studentCode.selectionStart);
    const lines = text.split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    cursorPos.textContent = `Ln ${ln}, Col ${col}`;
  }

  function syncCodeToNetwork() {
    if (!studentCode) return;
    const code = studentCode.value.trim();

    // If user writes nothing or clears the code, render plain background with no network
    if (!code) {
      currentModelParams.layers = [];
      buildNetwork([]);
      return;
    }

    const layersMatch = code.match(/layers\s*=\s*\[([\s\S]*?)\]/);
    if (layersMatch) {
      const cleanLayersStr = layersMatch[1].replace(/#.*$/gm, '').trim();
      if (!cleanLayersStr) {
        // User wrote layers = []
        currentModelParams.layers = [];
        buildNetwork([]);
        return;
      }

      const parsed = cleanLayersStr.split(',')
        .map(n => parseInt(n.trim(), 10))
        .filter(n => !isNaN(n) && n > 0 && n <= 32);

      if (parsed.length >= 2) {
        currentModelParams.layers = parsed;
        buildNetwork(parsed);
      } else {
        // Empty or 1 layer: clear network to plain background
        currentModelParams.layers = [];
        buildNetwork([]);
      }
    } else {
      // No layers = [...] defined: clear network to plain background
      currentModelParams.layers = [];
      buildNetwork([]);
    }

    const actMatch = code.match(/activation\s*=\s*["']([a-zA-Z0-9_\-]+)["']/i);
    if (actMatch && actMatch[1]) {
      currentModelParams.activation = actMatch[1].toLowerCase();
    }

    const lrMatch = code.match(/learning_rate\s*=\s*([0-9]*\.?[0-9]+)/i);
    if (lrMatch && lrMatch[1]) {
      currentModelParams.learningRate = parseFloat(lrMatch[1]);
    }

    const epMatch = code.match(/epochs\s*=\s*(\d+)/i);
    if (epMatch && epMatch[1]) {
      currentModelParams.epochs = parseInt(epMatch[1], 10);
    }
  }

  const modeSegmented = document.getElementById('modeSegmented');

  function switchMode(mode) {
    currentMode = mode;
    if (modeSegmented) {
      modeSegmented.setAttribute('data-active', mode);
    }
    if (mode === 'guide') {
      if (tabGuide) {
        tabGuide.classList.add('active');
        tabGuide.setAttribute('aria-selected', 'true');
      }
      if (tabTest) {
        tabTest.classList.remove('active');
        tabTest.setAttribute('aria-selected', 'false');
      }
      if (paneGuide) paneGuide.classList.add('active');
      if (paneTest) paneTest.classList.remove('active');
      buildNetwork(activeGuideConfig.layers || [3, 6, 2]);
      triggerLiveForwardPass();
    } else {
      if (tabTest) {
        tabTest.classList.add('active');
        tabTest.setAttribute('aria-selected', 'true');
      }
      if (tabGuide) {
        tabGuide.classList.remove('active');
        tabGuide.setAttribute('aria-selected', 'false');
      }
      if (paneTest) paneTest.classList.add('active');
      if (paneGuide) paneGuide.classList.remove('active');
      // Keep Test Mode independent - compile and render student's existing code
      updateLineNumbers();
      updateCursorPosition();
      syncCodeToNetwork();
      triggerLiveForwardPass();
    }
    setTimeout(resizeCanvas, 40);
  }

  attachTap(tabGuide, () => switchMode('guide'));
  attachTap(tabTest, () => switchMode('test'));

  // ---------------------------------------------------------------------------
  // 3. PERSISTENT 3D VISUALIZER ENGINE (CACHED SIZING & HIGH PERFORMANCE)
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });

  // Cached canvas dimensions to completely avoid getBoundingClientRect() during 60 FPS loop
  let canvasW = 600;
  let canvasH = 450;
  let cx = 300;
  let cy = 225;

  // Camera State with Smooth Inertial Lerping & Velocity Damping
  let targetYaw = -0.52;
  let targetPitch = 0.20;
  let currentYaw = -0.52;
  let currentPitch = 0.20;
  let camDist = 650;
  let targetCamDist = 650;
  let fov = 480;
  let autoRotate = true;
  let wavePulseTime = 0;
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let velYaw = 0;
  let velPitch = 0;
  let showLabels = true;
  let mouseScreenX = -9999, mouseScreenY = -9999;
  let hoveredNode = null;
  let hoverCheckPending = false;

  // 3D Moving Stars Background
  const starCount = 180;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: (Math.random() - 0.5) * 1600,
      y: (Math.random() - 0.5) * 1200,
      z: (Math.random() - 0.5) * 1600,
      baseAlpha: 0.15 + Math.random() * 0.55,
      size: 0.8 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2
    });
  }

  let layerSizes = [3, 6, 2];
  let nodes = [];
  let threads = [];

  function buildNetwork(sizes) {
    layerSizes = sizes || [];
    nodes = [];
    threads = [];
    hoveredNode = null;

    if (!layerSizes || layerSizes.length === 0) {
      drawPerspectiveScene();
      return;
    }

    const numLayers = layerSizes.length;
    const totalDepth = 620;
    const zStep = totalDepth / (numLayers - 1 || 1);

    layerSizes.forEach((count, lIdx) => {
      let z = -totalDepth / 2 + lIdx * zStep;
      if (lIdx === numLayers - 1 && numLayers > 2) {
        z += 35; // Elongate output layer so it projects forward cleanly
      }
      const totalH = Math.min(340, count * 44);
      const startY = -totalH / 2;
      const stepY = count > 1 ? totalH / (count - 1) : 0;

      for (let i = 0; i < count; i++) {
        // True 3D spatial curvature in X and Z so nodes and all sets of threads are visible from all angles
        const spreadFactor = count > 1 ? (i / (count - 1) - 0.5) : 0;
        const nodeX = Math.sin(spreadFactor * Math.PI * 0.75) * 90;
        const nodeZ = z + Math.cos(spreadFactor * Math.PI * 0.75) * 35;
        const nodeY = count === 1 ? 0 : startY + i * stepY;

        nodes.push({
          x: nodeX,
          y: nodeY,
          z: nodeZ,
          layerIdx: lIdx,
          nodeIdx: i,
          layerName: lIdx === 0 ? "Input Layer" : (lIdx === numLayers - 1 ? "Output Layer" : `Hidden Layer ${lIdx}`),
          name: lIdx === 0 ? `Input N${i+1}` : (lIdx === numLayers - 1 ? `Output N${i+1}` : `Hidden N${i+1}`)
        });
      }
    });

    // Generate sweeping 3D curved filaments across all layers
    for (let l = 0; l < numLayers - 1; l++) {
      const srcNodes = nodes.filter(n => n.layerIdx === l);
      const dstNodes = nodes.filter(n => n.layerIdx === l + 1);

      srcNodes.forEach((src, sIdx) => {
        dstNodes.forEach((dst, dIdx) => {
          const dz = dst.z - src.z;
          const dx = dst.x - src.x;
          const dy = dst.y - src.y;

          const curvatureX = ((sIdx - srcNodes.length / 2) + (dIdx - dstNodes.length / 2)) * 10;
          const curvatureY = (sIdx - dIdx) * 4;

          const p1 = {
            x: src.x + dx * 0.35 + curvatureX,
            y: src.y + dy * 0.15 + curvatureY,
            z: src.z + dz * 0.35
          };
          const p2 = {
            x: dst.x - dx * 0.35 + curvatureX * 0.8,
            y: dst.y - dy * 0.15 - curvatureY * 0.5,
            z: src.z + dz * 0.65
          };

          const seed = Math.sin(sIdx * 19 + dIdx * 37);
          threads.push({
            src, dst, p1, p2, seed,
            weight: (seed * 0.85).toFixed(3)
          });
        });
      });
    }

    // Update Telemetry Displays (in VS Code status bar)
    const liveThreadCount = document.getElementById('liveThreadCount');
    const statsText = `${nodes.length} Neurons • ${threads.length} Synapses`;
    if (liveThreadCount) liveThreadCount.textContent = statsText;
  }

  function project3D(x, y, z, cx, cy) {
    const cosY = Math.cos(currentYaw), sinY = Math.sin(currentYaw);
    const x1 = x * cosY - z * sinY;
    const z1 = z * cosY + x * sinY;

    const cosP = Math.cos(currentPitch), sinP = Math.sin(currentPitch);
    const y2 = y * cosP - z1 * sinP;
    const z2 = z1 * cosP + y * sinP + camDist;

    if (z2 <= 20) return null;
    const scale = fov / z2;
    return { x: cx + x1 * scale, y: cy + y2 * scale, scale, depth: z2 };
  }

  function evalCubic(p0, p1, p2, p3, t) {
    const it = 1 - t;
    return it*it*it*p0 + 3*it*it*t*p1 + 3*it*t*t*p2 + t*t*t*p3;
  }

  function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvasW = rect.width || canvas.parentElement.clientWidth || 600;
    canvasH = rect.height || canvas.parentElement.clientHeight || 450;
    if (canvasW <= 0 || canvasH <= 0) return;

    cx = canvasW / 2;
    cy = canvasH / 2;

    // Responsive FOV scaling so network fits perfectly on any phone, tablet or desktop
    if (canvasW < 520 || canvasH < 400) {
      fov = Math.max(280, Math.min(canvasW, canvasH) * 0.95);
    } else {
      fov = 480;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------------------------------------------------------------------------
  // 4. MOUSE / TOUCH INTERACTION & THROTTLED DOT DETECTION
  // ---------------------------------------------------------------------------
  const btnToggleOrbit = document.getElementById('btnToggleOrbit');

  function updateHoveredDot(screenX, screenY) {
    let closest = null;
    let minDist = 22;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const p = project3D(n.x, n.y, n.z, cx, cy);
      if (p) {
        const dx = screenX - p.x;
        const dy = screenY - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) {
          minDist = d;
          closest = n;
        }
      }
    }

    hoveredNode = closest;
    canvas.style.cursor = hoveredNode ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
  }

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    velYaw = 0;
    velPitch = 0;
    autoRotate = false;
    if (btnToggleOrbit) btnToggleOrbit.classList.remove('active');
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseScreenX = e.clientX - rect.left;
    mouseScreenY = e.clientY - rect.top;

    if (isDragging) {
      const sens = 0.007 * (settings.orbitSensitivity || 1.0);
      const dx = (e.clientX - lastX) * sens;
      const dy = (e.clientY - lastY) * sens;
      velYaw = dx;
      velPitch = dy;
      targetYaw += dx;
      targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + dy));
      lastX = e.clientX;
      lastY = e.clientY;
    } else if (!hoverCheckPending) {
      hoverCheckPending = true;
      requestAnimationFrame(() => {
        updateHoveredDot(mouseScreenX, mouseScreenY);
        hoverCheckPending = false;
      });
    }
  });

  canvas.addEventListener('mouseleave', () => {
    mouseScreenX = -9999;
    mouseScreenY = -9999;
    hoveredNode = null;
    canvas.style.cursor = 'grab';
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const sens = 0.6 * (settings.zoomSensitivity || 1.0);
    targetCamDist = Math.max(260, Math.min(1250, targetCamDist + e.deltaY * sens));
  }, { passive: false });

  // Touch Support with Fluid 1-Finger Orbit & 2-Finger Pinch Zoom
  let touchStartDist = 0;
  let touchStartCamDist = targetCamDist;
  let isPinching = false;

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isPinching = false;
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      velYaw = 0;
      velPitch = 0;
      autoRotate = false;
      if (btnToggleOrbit) btnToggleOrbit.classList.remove('active');

      const rect = canvas.getBoundingClientRect();
      mouseScreenX = e.touches[0].clientX - rect.left;
      mouseScreenY = e.touches[0].clientY - rect.top;
      updateHoveredDot(mouseScreenX, mouseScreenY);
    } else if (e.touches.length >= 2) {
      isDragging = false;
      isPinching = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.hypot(dx, dy);
      touchStartCamDist = targetCamDist;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && isDragging && !isPinching) {
      const rect = canvas.getBoundingClientRect();
      mouseScreenX = e.touches[0].clientX - rect.left;
      mouseScreenY = e.touches[0].clientY - rect.top;

      const sens = 0.007 * (settings.orbitSensitivity || 1.0);
      const dx = (e.touches[0].clientX - lastX) * sens;
      const dy = (e.touches[0].clientY - lastY) * sens;
      velYaw = dx;
      velPitch = dy;
      targetYaw += dx;
      targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + dy));
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      updateHoveredDot(mouseScreenX, mouseScreenY);
    } else if (e.touches.length >= 2 && isPinching) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      if (touchStartDist > 0) {
        const scale = touchStartDist / Math.max(10, currentDist);
        targetCamDist = Math.max(260, Math.min(1250, touchStartCamDist * scale));
      }
    }
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
      isDragging = false;
      isPinching = false;
      touchStartDist = 0;
    } else if (e.touches.length === 1) {
      isPinching = false;
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
  });

  canvas.addEventListener('touchcancel', () => {
    isDragging = false;
    isPinching = false;
    touchStartDist = 0;
  });

  // Viewport Toolbar & Fullscreen Controls
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetView = document.getElementById('btnResetView');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnExitFullscreen = document.getElementById('btnExitFullscreen');
  const visPane = document.querySelector('.vis-pane');

  async function toggleFullscreen(forceState) {
    if (!visPane) return;
    const isFullscreen = visPane.classList.contains('fullscreen-active');
    const targetState = (forceState !== undefined) ? forceState : !isFullscreen;

    if (targetState) {
      visPane.classList.add('fullscreen-active');
      if (btnFullscreen) {
        btnFullscreen.title = 'Exit Fullscreen (F or Esc)';
        btnFullscreen.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 14 10 14 10 20"/>
          <polyline points="20 10 14 10 14 4"/>
          <line x1="14" y1="10" x2="21" y2="3"/>
          <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>`;
      }
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen().catch(() => {});
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen().catch(() => {});
          }
        }
      } catch (err) {}

      // Automatically lock or request landscape orientation on mobile
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (err) {}
    } else {
      visPane.classList.remove('fullscreen-active');
      if (btnFullscreen) {
        btnFullscreen.title = 'Toggle Fullscreen (F)';
        btnFullscreen.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>`;
      }
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (err) {}
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen().catch(() => {});
          }
        }
      } catch (err) {}
    }

    setTimeout(() => {
      resizeCanvas();
      drawPerspectiveScene();
    }, 60);
  }

  if (btnFullscreen) {
    attachTap(btnFullscreen, () => toggleFullscreen());
  }

  if (btnExitFullscreen) {
    attachTap(btnExitFullscreen, () => toggleFullscreen(false));
  }

  if (btnZoomIn) {
    attachTap(btnZoomIn, () => {
      targetCamDist = Math.max(280, targetCamDist - 120);
    });
  }
  if (btnZoomOut) {
    attachTap(btnZoomOut, () => {
      targetCamDist = Math.min(1200, targetCamDist + 120);
    });
  }
  if (btnResetView) {
    attachTap(btnResetView, () => {
      targetYaw = -0.38;
      targetPitch = 0.22;
      velYaw = 0;
      velPitch = 0;
      targetCamDist = 650;
      autoRotate = true;
      if (btnToggleOrbit) btnToggleOrbit.classList.add('active');
    });
  }

  const btnToggleLabels = document.getElementById('btnToggleLabels');
  if (btnToggleLabels) {
    attachTap(btnToggleLabels, () => {
      showLabels = !showLabels;
      btnToggleLabels.classList.toggle('active', showLabels);
      btnToggleLabels.setAttribute('data-tooltip', showLabels ? 'Toggle Labels (H)' : 'Show Labels (H)');
      drawPerspectiveScene();
    });
  }

  if (btnToggleOrbit) {
    attachTap(btnToggleOrbit, () => {
      autoRotate = !autoRotate;
      velYaw = 0;
      velPitch = 0;
      btnToggleOrbit.classList.toggle('active', autoRotate);
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (btnRunCode) btnRunCode.click();
      }
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (btnToggleOrbit) btnToggleOrbit.click();
    } else if (e.code === 'KeyR') {
      if (btnResetView) btnResetView.click();
    } else if (e.code === 'KeyH') {
      if (btnToggleLabels) btnToggleLabels.click();
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.code === 'Escape') {
      if (visPane && visPane.classList.contains('fullscreen-active')) {
        e.preventDefault();
        toggleFullscreen(false);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 5. HIGH-PERFORMANCE 60-120 FPS 3D RENDER LOOP & LIVE RUN CASCADE
  // ---------------------------------------------------------------------------
  const visLiveBadge = document.getElementById('visLiveBadge');
  const visLiveText = document.getElementById('visLiveText');
  let isForwardPassRunning = false;
  let isBackpropRunning = false;
  let backpropStage = 0;
  let forwardPassStartTime = 0;
  let forwardPassStage = 0;
  const STAGE_DURATION_MS = 450;
  let endpointPredictionOutputs = [0.942, 0.058];
  let calculatedLoss = 0.0124;
  let pausedAtBreakpoint = false;
  let pausedBreakpointLine = 0;

  function triggerBackpropAnimation() {
    isBackpropRunning = true;
    isForwardPassRunning = false;
    backpropStage = Math.max(0, layerSizes.length - 2);

    if (visLiveBadge) {
      visLiveBadge.style.display = 'inline-flex';
      visLiveBadge.style.borderColor = '#ffffff';
    }

    const stageMs = 520;
    const totalSteps = [
      { t: 0, text: 'LESSON 05 • LOSS EVALUATION • ERROR GRADIENT DETECTED AT OUTPUT LAYER' },
      { t: stageMs, text: 'LESSON 05 • BACKPROPAGATION • CALCULATING PARTIAL DERIVATIVES dL/dw VIA CHAIN RULE' },
      { t: stageMs * 2, text: 'LESSON 05 • GRADIENT DESCENT • UPDATING WEIGHTS w <- w - lr*(dL/dw) • LOSS: 0.0124' },
      { t: stageMs * 3, text: 'LESSON 05 • OPTIMIZATION CONVERGED • WEIGHTS UPDATED ACROSS ALL SYNAPSES' }
    ];

    totalSteps.forEach(({ t, text }, i) => {
      setTimeout(() => {
        if (!isBackpropRunning) return;
        wavePulseTime += 2.2;
        backpropStage = Math.max(0, (layerSizes.length - 2) - i);
        if (visLiveText) visLiveText.textContent = text;
        if (i === totalSteps.length - 1) {
          setTimeout(() => {
            isBackpropRunning = false;
            if (visLiveBadge && !isForwardPassRunning && !isTrainingSimulation) {
              visLiveBadge.style.display = 'none';
            }
          }, 2400);
        }
      }, t);
    });
  }

  function calculateLayerActivations() {
    if (!nodes || nodes.length === 0) return;
    const act = (currentModelParams && currentModelParams.activation) || 'relu';

    // 1. Layer 0: Input features
    const inputNodes = nodes.filter(n => n.layerIdx === 0);
    inputNodes.forEach((n, idx) => {
      n.activationValue = +(0.55 + Math.sin(idx * 2.3 + 1.2) * 0.35).toFixed(3);
    });

    // 2. Hidden & Output Layers
    for (let l = 1; l < layerSizes.length; l++) {
      const layerNodes = nodes.filter(n => n.layerIdx === l);

      layerNodes.forEach((n, idx) => {
        const inThreads = threads.filter(t => t.dst === n);
        let z = 0;
        inThreads.forEach(t => {
          const srcVal = t.src.activationValue !== undefined ? t.src.activationValue : 0.5;
          z += srcVal * parseFloat(t.weight || 0.5);
        });
        z += Math.sin(idx * 1.9 + l * 0.7) * 0.15; // bias term

        let val = 0;
        if (act === 'sigmoid') {
          val = 1 / (1 + Math.exp(-z));
        } else if (act === 'tanh') {
          val = (Math.tanh(z) + 1) / 2;
        } else if (act === 'linear') {
          val = Math.min(1, Math.max(0, z));
        } else {
          // ReLU / Default
          val = Math.max(0, Math.min(1.2, z));
        }

        n.activationValue = +Math.max(0.01, Math.min(0.99, val)).toFixed(3);
      });
    }

    const outputNodes = nodes.filter(n => n.layerIdx === layerSizes.length - 1);
    endpointPredictionOutputs = outputNodes.map(n => n.activationValue);
    calculatedLoss = +(0.5 * endpointPredictionOutputs.reduce((acc, v) => acc + Math.pow(1.0 - v, 2), 0) / (endpointPredictionOutputs.length || 1)).toFixed(4);
    if (calculatedLoss < 0.005) calculatedLoss = 0.0124;
  }

  function triggerLiveForwardPass() {
    syncCodeToNetwork();

    if (pausedAtBreakpoint) {
      // Resume from paused breakpoint
      pausedAtBreakpoint = false;
      isForwardPassRunning = true;
      forwardPassStartTime = performance.now() - (forwardPassStage * STAGE_DURATION_MS);

      if (btnRunCode) {
        btnRunCode.classList.add('running');
        btnRunCode.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation:spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"/>
        </svg><span>Running...</span>`;
      }
      if (visLiveText) {
        visLiveText.textContent = `RESUMING EXECUTION AFTER BREAKPOINT LINE ${pausedBreakpointLine}...`;
      }
      return;
    }

    calculateLayerActivations();
    isForwardPassRunning = true;
    forwardPassStartTime = performance.now();
    forwardPassStage = 0;
    pausedAtBreakpoint = false;

    if (btnRunCode) {
      btnRunCode.classList.add('running');
      btnRunCode.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation:spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"/>
      </svg><span>Running...</span>`;
    }

    if (visLiveBadge) {
      visLiveBadge.style.display = 'inline-flex';
      visLiveBadge.style.borderColor = '#ffffff';
    }
    if (visLiveText) {
      visLiveText.textContent = `FORWARD PASS: INITIALIZING LAYER 0 INPUTS (${layerSizes[0]} FEATURES)...`;
    }
  }

  function drawPerspectiveScene() {
    if (canvasW <= 0 || canvasH <= 0) return;

    // Fast fill background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 1. Moving 3D Cosmic Starfield
    if (settings.enableStarfield) {
      stars.forEach(s => {
        s.z -= 0.35 * settings.orbitSpeed;
        if (s.z < -800) s.z = 800;

        const p = project3D(s.x, s.y, s.z, cx, cy);
        if (p && p.x >= 0 && p.x <= canvasW && p.y >= 0 && p.y <= canvasH) {
          const twinkle = 0.6 + 0.4 * Math.sin(wavePulseTime * 2.5 + s.phase);
          const alpha = s.baseAlpha * twinkle * Math.max(0, Math.min(1, 1 - p.depth / 2200));
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          const sz = s.size * Math.max(0.6, p.scale);
          ctx.fillRect(p.x, p.y, sz, sz);
        }
      });
    }

    // 2. Monochrome Perspective Grid Floor
    const gridY = 210;
    const size = 480;
    const step = 60;
    ctx.lineWidth = 0.75;

    ctx.beginPath();
    for (let z = -size; z <= size; z += step) {
      const pA = project3D(-size, gridY, z, cx, cy);
      const pB = project3D(size, gridY, z, cx, cy);
      if (pA && pB) {
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
      }
    }
    for (let x = -size; x <= size; x += step) {
      const pA = project3D(x, gridY, -size, cx, cy);
      const pB = project3D(x, gridY, size, cx, cy);
      if (pA && pB) {
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
      }
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // 3. HARDWARE-ACCELERATED NATIVE BEZIER FILAMENTS
    const lum = settings.threadLuminosity || 0.55;
    const activeStageLayer = Math.floor(forwardPassStage);
    const isSurgingStage = isForwardPassRunning;

    threads.forEach(t => {
      const isConnectedToHovered = hoveredNode ? (t.src === hoveredNode || t.dst === hoveredNode) : false;
      const isSurging = (isSurgingStage && (t.src.layerIdx === activeStageLayer)) ||
                        (isBackpropRunning && (t.src.layerIdx === backpropStage));

      // Project the 4 Bezier control points directly
      const pSrc = project3D(t.src.x, t.src.y, t.src.z, cx, cy);
      const p1 = project3D(t.p1.x, t.p1.y, t.p1.z, cx, cy);
      const p2 = project3D(t.p2.x, t.p2.y, t.p2.z, cx, cy);
      const pDst = project3D(t.dst.x, t.dst.y, t.dst.z, cx, cy);

      if (!pSrc || !p1 || !p2 || !pDst) return;

      ctx.beginPath();
      ctx.moveTo(pSrc.x, pSrc.y);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, pDst.x, pDst.y);

      if (isSurging) {
        // High intensity pulse when forward pass wave surges through this layer
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 4.0;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (hoveredNode) {
        if (isConnectedToHovered) {
          // Dual pass stroke for clean, instant, lag-free glow
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 4.5;
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.0;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = `rgba(255, 255, 255, ${lum})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }

      // Optical wave pulse: flowing live signals along every thread, surging on run
      const speedMultiplier = (hoveredNode && isConnectedToHovered) ? 1.8 : (isSurging ? 2.8 : 1.0);
      const pulseOffsets = isSurging ? [0, 0.45] : [0];

      pulseOffsets.forEach(off => {
        const waveProg = (wavePulseTime * speedMultiplier + Math.abs(t.seed) * 2.4 + off) % 1;
        const wx = evalCubic(t.src.x, t.p1.x, t.p2.x, t.dst.x, waveProg);
        const wy = evalCubic(t.src.y, t.p1.y, t.p2.y, t.dst.y, waveProg);
        const wz = evalCubic(t.src.z, t.p1.z, t.p2.z, t.dst.z, waveProg);
        const wp = project3D(wx, wy, wz, cx, cy);

        if (wp && (!hoveredNode || isConnectedToHovered || isSurging)) {
          ctx.beginPath();
          const pSize = (isConnectedToHovered || isSurging) ? 3.0 : 1.8;
          ctx.arc(wp.x, wp.y, pSize * wp.scale * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });
    });

    // 4. Floating Layer Headers (Monochrome Glass Cards with Dynamic Text Fitting)
    if (showLabels) {
      layerSizes.forEach((count, lIdx) => {
        const totalDepth = 620;
        let z = -totalDepth / 2 + lIdx * (totalDepth / (layerSizes.length - 1 || 1));
        if (lIdx === layerSizes.length - 1 && layerSizes.length > 2) {
          z += 35;
        }
        const pTop = project3D(0, -180, z, cx, cy);
        if (!pTop) return;

        const name = lIdx === 0 ? "Input Layer" : (lIdx === layerSizes.length - 1 ? "Endpoint (Output)" : `Hidden ${lIdx}`);
        const countText = `${count} ${count === 1 ? 'Neuron' : 'Neurons'}`;

        const titleSize = Math.max(9, Math.round(11 * pTop.scale * 1.4));
        const subSize = Math.max(8, Math.round(9 * pTop.scale * 1.4));

        ctx.font = `600 ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        const titleW = ctx.measureText(name).width;

        ctx.font = `${subSize}px "SF Mono", monospace`;
        const subW = ctx.measureText(countText).width;

        const padX = 16 * pTop.scale * 1.4;
        const w = Math.max(80 * pTop.scale * 1.4, Math.max(titleW, subW) + padX * 2);
        const h = 34 * pTop.scale * 1.4;
        const x = pTop.x - w / 2;
        const y = pTop.y - h;

        ctx.fillStyle = 'rgba(9, 9, 11, 0.94)';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, w, h);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(name, pTop.x, y + 14 * pTop.scale * 1.4);

        ctx.fillStyle = '#8e8e96';
        ctx.font = `${subSize}px "SF Mono", monospace`;
        ctx.fillText(countText, pTop.x, y + 26 * pTop.scale * 1.4);
      });
    }

    // 5. Depth Sorted Neurons
    const projNodes = [];
    nodes.forEach(n => {
      const p = project3D(n.x, n.y, n.z, cx, cy);
      if (p) projNodes.push({ node: n, p });
    });
    projNodes.sort((a, b) => b.p.depth - a.p.depth);

    let activeTooltip = null;

    projNodes.forEach(({ node, p }) => {
      const isHovered = (hoveredNode === node);
      const isCurrentLayerActive = (isForwardPassRunning && (node.layerIdx === activeStageLayer)) ||
                                   (isBackpropRunning && (node.layerIdx === backpropStage + 1));
      const radius = (isHovered || isCurrentLayerActive ? 6.2 : 4.6) * p.scale * 1.5;

      // Glow halo
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * (isHovered ? 2.8 : (isCurrentLayerActive ? 2.6 : 2.0)), 0, Math.PI * 2);
      ctx.fillStyle = (isHovered || isCurrentLayerActive) ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.16)';
      ctx.fill();

      // Outer focus ring if hovered or actively firing
      if (isHovered || isCurrentLayerActive) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Bright white node core
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = (isHovered || isCurrentLayerActive) ? '#ffffff' : '#1c1c20';
      ctx.lineWidth = (isHovered || isCurrentLayerActive) ? 2.0 : 1.5;
      ctx.fill();
      ctx.stroke();

      // Node label (only displayed when showLabels is active)
      if (showLabels && p.scale > 0.6) {
        ctx.fillStyle = isHovered ? '#ffffff' : '#8e8e96';
        ctx.font = `${isHovered ? 'bold ' : ''}${Math.max(7, Math.round(8.5 * p.scale))}px "SF Mono", monospace`;
        ctx.textAlign = node.layerIdx === 0 ? 'right' : 'left';
        const offX = node.layerIdx === 0 ? -radius - 6 : radius + 6;
        ctx.fillText(`N${node.nodeIdx + 1}`, p.x + offX, p.y + 3);
      }

      if (isHovered) {
        const inCount = threads.filter(t => t.dst === node).length;
        const outCount = threads.filter(t => t.src === node).length;
        activeTooltip = {
          x: p.x + 14,
          y: p.y - 12,
          node,
          inCount,
          outCount
        };
      }
    });

    // 6. Monochrome Interactive Node Tooltip Card
    if (activeTooltip) {
      const tip = activeTooltip;
      const tw = 165;
      const th = 56;
      let tx = tip.x;
      let ty = tip.y;
      if (tx + tw > canvasW - 10) tx = tip.x - tw - 24;
      if (ty + th > canvasH - 10) ty = canvasH - th - 10;
      if (ty < 10) ty = 10;

      ctx.fillStyle = 'rgba(9, 9, 11, 0.95)';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(tx, ty, tw, th);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${tip.node.name} (${tip.node.layerName})`, tx + 8, ty + 16);

      ctx.fillStyle = '#8e8e96';
      ctx.font = '10px "SF Mono", monospace';
      if (tip.node.layerIdx === layerSizes.length - 1) {
        ctx.fillText(`Endpoint Activation: ${tip.node.activationValue !== undefined ? tip.node.activationValue.toFixed(3) : '0.942'}`, tx + 8, ty + 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillText(`In: ${tip.inCount} syn | Endpoint Prediction Node`, tx + 8, ty + 47);
      } else {
        ctx.fillText(`In: ${tip.inCount} syn | Out: ${tip.outCount} syn`, tx + 8, ty + 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px -apple-system, sans-serif';
        const actName = (typeof currentModelParams !== 'undefined' && currentModelParams.activation ? currentModelParams.activation.toUpperCase() : 'RELU');
        ctx.fillText(`Activation: ${tip.node.activationValue !== undefined ? tip.node.activationValue.toFixed(3) : '0.500'} (${actName})`, tx + 8, ty + 47);
      }
    }
  }

  function animationLoop() {
    if (!isDragging) {
      if (Math.abs(velYaw) > 0.0001 || Math.abs(velPitch) > 0.0001) {
        targetYaw += velYaw;
        targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + velPitch));
        velYaw *= 0.92;
        velPitch *= 0.92;
      } else if (autoRotate) {
        targetYaw += 0.0022 * (settings.orbitSpeed || 1.0);
      }
    }
    currentYaw += (targetYaw - currentYaw) * 0.08;
    currentPitch += (targetPitch - currentPitch) * 0.08;
    camDist += (targetCamDist - camDist) * 0.08;
    wavePulseTime += 0.024;
    currentPitch += (targetPitch - currentPitch) * 0.08;
    camDist += (targetCamDist - camDist) * 0.08;
    wavePulseTime += 0.024;

    // Handle Live Forward-Pass Animation Cascade
    if (isForwardPassRunning && !pausedAtBreakpoint) {
      const elapsed = performance.now() - forwardPassStartTime;
      const totalStages = Math.max(1, layerSizes.length - 1);
      const totalDuration = totalStages * STAGE_DURATION_MS;
      forwardPassStage = elapsed / STAGE_DURATION_MS;
      const curL = Math.min(layerSizes.length - 1, Math.floor(forwardPassStage));

      // Breakpoint verification: if breakpoint set on line 1, pause at layer 0
      if (activeBreakpoints.has(1) && curL === 0 && elapsed > 180 && !pausedAtBreakpoint) {
        pausedAtBreakpoint = true;
        pausedBreakpointLine = 1;
        if (visLiveText) {
          visLiveText.textContent = `PAUSED AT BREAKPOINT (LINE 1): LAYER 0 INSPECTING • CLICK RESUME TO CONTINUE`;
        }
        if (btnRunCode) {
          btnRunCode.classList.remove('running');
          btnRunCode.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg><span>Resume</span>`;
        }
      } else if (elapsed < totalDuration) {
        const nextL = Math.min(layerSizes.length - 1, curL + 1);
        if (visLiveText) {
          visLiveText.textContent = `FORWARD PASS: LAYER ${curL} -> LAYER ${nextL} (${threads.length} THREADS FIRING)`;
        }
        const liveThreadCount = document.getElementById('liveThreadCount');
        if (liveThreadCount) {
          liveThreadCount.textContent = `Live Run: Layer ${curL} -> Layer ${nextL}`;
        }
      } else {
        isForwardPassRunning = false;
        pausedAtBreakpoint = false;
        if (btnRunCode) {
          btnRunCode.classList.remove('running');
          btnRunCode.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg><span>Run</span>`;
        }
        if (visLiveBadge && visLiveText) {
          visLiveBadge.style.borderColor = '#ffffff';
          const outStr = endpointPredictionOutputs.map(v => v.toFixed(3)).join(', ');
          visLiveText.textContent = `ENDPOINT PREDICTION: [${outStr}] • LOSS: ${calculatedLoss} • 100% SYNCED`;
          setTimeout(() => {
            if (visLiveBadge && !isForwardPassRunning && !isTrainingSimulation) {
              visLiveBadge.style.display = 'none';
            }
          }, 3200);
        }
        const liveThreadCount = document.getElementById('liveThreadCount');
        if (liveThreadCount) {
          liveThreadCount.textContent = `${nodes.length} Neurons • ${threads.length} Synapses`;
        }
      }
    }

    drawPerspectiveScene();
    requestAnimationFrame(animationLoop);
  }

  // ---------------------------------------------------------------------------
  // 6. GUIDE MODE INTERACTIVE LESSONS (Touch Lesson to Switch Architecture & Trigger Animation)
  // ---------------------------------------------------------------------------
  const lessonCards = document.querySelectorAll('.lesson-card');
  lessonCards.forEach((card) => {
    card.addEventListener('click', () => {
      lessonCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const lessonIdx = parseInt(card.dataset.lesson, 10);
      if (lessonIdx === 0) {
        // Lesson 1: Anatomy & Layers (Standard 3-layer architecture)
        activeGuideConfig = { layers: [3, 6, 2], activation: 'relu', learningRate: 0.05, epochs: 200 };
        buildNetwork([3, 6, 2]);
        targetCamDist = 650;
        triggerLiveForwardPass();
      } else if (lessonIdx === 1) {
        // Lesson 2: Synapses & Weights (Excitatory & Inhibitory filaments)
        activeGuideConfig = { layers: [3, 8, 3], activation: 'relu', learningRate: 0.05, epochs: 250 };
        buildNetwork([3, 8, 3]);
        targetCamDist = 650;
        triggerLiveForwardPass();
      } else if (lessonIdx === 2) {
        // Lesson 3: The Neuron & ReLU (Activated Non-Linearity)
        activeGuideConfig = { layers: [2, 5, 2], activation: 'relu', learningRate: 0.05, epochs: 200 };
        buildNetwork([2, 5, 2]);
        targetCamDist = 620;
        triggerLiveForwardPass();
      } else if (lessonIdx === 3) {
        // Lesson 4: Deep Learning (Hierarchical 4-layer network)
        activeGuideConfig = { layers: [3, 8, 6, 2], activation: 'relu', learningRate: 0.03, epochs: 400 };
        buildNetwork([3, 8, 6, 2]);
        targetCamDist = 700;
        triggerLiveForwardPass();
      } else if (lessonIdx === 4) {
        // Lesson 5: Training & Gradient Descent (Backpropagation Simulation Cascade)
        activeGuideConfig = { layers: [3, 6, 4, 2], activation: 'relu', learningRate: 0.05, epochs: 300 };
        buildNetwork([3, 6, 4, 2]);
        targetCamDist = 680;
        triggerBackpropAnimation();
      } else if (lessonIdx === 5) {
        // Lesson 6: Transition directly into Test Mode Code Lab
        switchMode('test');
      }
    });
  });

  const btnLesson5Animate = document.getElementById('btnLesson5Animate');
  if (btnLesson5Animate) {
    attachTap(btnLesson5Animate, (e) => {
      e.stopPropagation();
      activeGuideConfig = { layers: [3, 6, 4, 2], activation: 'relu', learningRate: 0.05, epochs: 300 };
      buildNetwork([3, 6, 4, 2]);
      targetCamDist = 680;
      triggerBackpropAnimation();
    });
  }

  // ---------------------------------------------------------------------------
  // 6b. TEST MODE ARCHITECTURE EXAMPLES & PRESETS
  // ---------------------------------------------------------------------------
  const architecturePresets = {
    classifier: {
      layers: [3, 8, 4, 1],
      activation: 'relu',
      learningRate: 0.05,
      epochs: 300,
      comment: '# Example: Standard Multi-Layer Classifier\n# 3 inputs -> 2 hidden representation layers -> 1 output decision'
    },
    perceptron: {
      layers: [2, 1],
      activation: 'sigmoid',
      learningRate: 0.1,
      epochs: 150,
      comment: '# Example: Minimal Perceptron (Linear Boundary)\n# 2 input sensor features -> single decision node (hyperplane / logic gate)'
    },
    vision: {
      layers: [8, 16, 12, 6, 2],
      activation: 'relu',
      learningRate: 0.03,
      epochs: 400,
      comment: '# Example: Deep Vision Feature Extractor\n# 8 low-level edge inputs -> hierarchical representations -> 2 target classes'
    },
    autoencoder: {
      layers: [6, 3, 2, 3, 6],
      activation: 'relu',
      learningRate: 0.02,
      epochs: 500,
      comment: '# Example: Symmetric Bottleneck Autoencoder\n# 6 inputs compressed into 2D latent space and reconstructed at output'
    },
    wide: {
      layers: [2, 24, 1],
      activation: 'relu',
      learningRate: 0.04,
      epochs: 250,
      comment: '# Example: Wide Shallow Network (Universal Approximator)\n# High-capacity single hidden layer with 24 neurons'
    },
    deep: {
      layers: [4, 4, 4, 4, 1],
      activation: 'relu',
      learningRate: 0.02,
      epochs: 350,
      comment: '# Example: Deep Narrow Chain Network\n# Uniform 4-neuron blocks for gradient flow and depth dynamics analysis'
    }
  };

  const testExamplesBar = document.getElementById('testExamplesBar');
  if (testExamplesBar) {
    testExamplesBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.test-example-chip');
      if (!chip) return;
      const key = chip.dataset.example;
      const preset = architecturePresets[key];
      if (!preset) return;

      testExamplesBar.querySelectorAll('.test-example-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (studentCode) {
        studentCode.value = `${preset.comment}\nlayers = ${JSON.stringify(preset.layers)}\nactivation = "${preset.activation}"\nlearning_rate = ${preset.learningRate}\nepochs = ${preset.epochs}`;
      }
      updateLineNumbers();
      updateCursorPosition();
      syncCodeToNetwork();
      triggerLiveForwardPass();
    });
  }

  // ---------------------------------------------------------------------------
  // 7. TEST MODE LIVE CODING & SIMULATION (VS CODE INTERACTIVE EXPERIENCE)
  // ---------------------------------------------------------------------------
  if (lineNumbers) {
    lineNumbers.addEventListener('click', (e) => {
      const lineRow = e.target.closest('.gutter-line');
      if (!lineRow) return;
      const lineNum = parseInt(lineRow.dataset.line, 10);
      if (activeBreakpoints.has(lineNum)) {
        activeBreakpoints.delete(lineNum);
      } else {
        activeBreakpoints.add(lineNum);
      }
      updateLineNumbers();

      if (visLiveText) {
        if (activeBreakpoints.size > 0) {
          visLiveText.textContent = `BREAKPOINT SET ON LINE ${lineNum} (TOTAL ACTIVE: ${activeBreakpoints.size})`;
        } else {
          visLiveText.textContent = `ALL BREAKPOINTS REMOVED • EXECUTION UNRESTRICTED`;
        }
      }
    });
  }

  if (studentCode) {
    studentCode.addEventListener('input', () => {
      updateLineNumbers();
      updateCursorPosition();
      syncCodeToNetwork();
    });

    studentCode.addEventListener('click', updateCursorPosition);
    studentCode.addEventListener('keyup', updateCursorPosition);

    // Synchronize scrolling between gutter and code
    studentCode.addEventListener('scroll', () => {
      if (lineNumbers) lineNumbers.scrollTop = studentCode.scrollTop;
    });

    // VS Code Tab Key Indentation (4 spaces) & Auto-Close pairs
    studentCode.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = studentCode.selectionStart;
        const end = studentCode.selectionEnd;
        studentCode.value = studentCode.value.substring(0, start) + '    ' + studentCode.value.substring(end);
        studentCode.selectionStart = studentCode.selectionEnd = start + 4;
        updateLineNumbers();
        updateCursorPosition();
        syncCodeToNetwork();
      } else if (e.key === '[' || e.key === '(' || e.key === '"' || e.key === "'") {
        const pairs = { '[': ']', '(': ')', '"': '"', "'": "'" };
        const closer = pairs[e.key];
        const start = studentCode.selectionStart;
        const end = studentCode.selectionEnd;
        if (start === end) {
          e.preventDefault();
          studentCode.value = studentCode.value.substring(0, start) + e.key + closer + studentCode.value.substring(end);
          studentCode.selectionStart = studentCode.selectionEnd = start + 1;
          updateLineNumbers();
          updateCursorPosition();
          syncCodeToNetwork();
        }
      }
    });

    updateLineNumbers();
    updateCursorPosition();
  }

  if (btnRunCode) {
    attachTap(btnRunCode, () => {
      triggerLiveForwardPass();
    });
  }

  if (btnResetCode) {
    attachTap(btnResetCode, () => {
      if (studentCode) {
        studentCode.value = defaultStarterCode;
        activeBreakpoints.clear();
        updateLineNumbers();
        updateCursorPosition();
        syncCodeToNetwork();
      }
    });
  }

  let isTrainingSimulation = false;
  let trainStep = 0;

  if (btnTrainLive) {
    attachTap(btnTrainLive, () => {
      if (isTrainingSimulation) return;
      isTrainingSimulation = true;
      trainStep = 0;
      const totalEp = currentModelParams.epochs || 300;
      const lr = currentModelParams.learningRate || 0.05;

      const originalHtml = btnTrainLive.innerHTML;
      btnTrainLive.classList.add('running');
      if (visLiveBadge) visLiveBadge.style.display = 'inline-flex';

      const steps = [
        { ep: 1, loss: (0.7243).toFixed(4), msg: `TRAINING EPOCH 1/${totalEp} • LOSS: 0.7243 • BACKPROPAGATING ERROR FROM ENDPOINT` },
        { ep: Math.round(totalEp * 0.35), loss: (0.3812).toFixed(4), msg: `TRAINING EPOCH ${Math.round(totalEp * 0.35)}/${totalEp} • LOSS: 0.3812 • GRADIENT DESCENT STEP (lr=${lr})` },
        { ep: Math.round(totalEp * 0.75), loss: (0.1145).toFixed(4), msg: `TRAINING EPOCH ${Math.round(totalEp * 0.75)}/${totalEp} • LOSS: 0.1145 • WEIGHT CONVERGENCE IN PROGRESS` },
        { ep: totalEp, loss: (0.0124).toFixed(4), msg: `TRAINING COMPLETE: EPOCH ${totalEp}/${totalEp} • FINAL LOSS: 0.0124 (CONVERGED) • 100% SYNCED` }
      ];

      function runTrainStep() {
        if (trainStep < steps.length) {
          const s = steps[trainStep];
          wavePulseTime += 2.2;
          btnTrainLive.innerHTML = `<span>Ep ${s.ep} &bull; L: ${s.loss}</span>`;
          if (visLiveText) visLiveText.textContent = s.msg;
          trainStep++;
          setTimeout(runTrainStep, 600);
        } else {
          isTrainingSimulation = false;
          btnTrainLive.innerHTML = `<span>Loss: 0.0124</span>`;
          setTimeout(() => {
            btnTrainLive.classList.remove('running');
            btnTrainLive.innerHTML = originalHtml;
            if (visLiveBadge && !isForwardPassRunning && !isTrainingSimulation) {
              visLiveBadge.style.display = 'none';
            }
          }, 2600);
        }
      }

      runTrainStep();
    });
  }

  // ---------------------------------------------------------------------------
  // 7b. EXPORT & DOWNLOAD HELPERS (Python Script & 3D Screen Image)
  // ---------------------------------------------------------------------------
  function downloadCodeFile() {
    const code = studentCode ? studentCode.value : '';
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network_threads.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (visLiveBadge && visLiveText) {
      visLiveBadge.style.display = 'inline-flex';
      visLiveBadge.style.borderColor = '#ffffff';
      visLiveText.textContent = 'DOWNLOADED: network_threads.py (Python script)';
      setTimeout(() => {
        if (visLiveBadge && !isForwardPassRunning && !isTrainingSimulation) {
          visLiveBadge.style.display = 'none';
        }
      }, 2500);
    }
  }

  function downloadNetworkImage() {
    if (!canvas) return;
    drawPerspectiveScene();
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'synapselab_network.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (visLiveBadge && visLiveText) {
      visLiveBadge.style.display = 'inline-flex';
      visLiveBadge.style.borderColor = '#ffffff';
      visLiveText.textContent = 'SAVED: synapselab_network.png (3D Screen Snapshot)';
      setTimeout(() => {
        if (visLiveBadge && !isForwardPassRunning && !isTrainingSimulation) {
          visLiveBadge.style.display = 'none';
        }
      }, 2500);
    }
  }



  const btnSaveImage = document.getElementById('btnSaveImage');
  if (btnSaveImage) attachTap(btnSaveImage, downloadNetworkImage);

  // ---------------------------------------------------------------------------
  // 8. SETTINGS MODAL (Single-purpose Feedback / Report Issue)
  // ---------------------------------------------------------------------------
  const settingsModal = document.getElementById('settingsModal');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');

  if (btnOpenSettings) attachTap(btnOpenSettings, () => settingsModal && settingsModal.classList.add('active'));
  if (btnCloseSettings) attachTap(btnCloseSettings, () => settingsModal && settingsModal.classList.remove('active'));

  // ---------------------------------------------------------------------------
  // 9. BUY ME A COFFEE & SHARE MODALS
  // ---------------------------------------------------------------------------
  const coffeeModal = document.getElementById('coffeeModal');
  const shareModal = document.getElementById('shareModal');
  const legalModal = document.getElementById('legalModal');

  const btnOpenCoffee = document.getElementById('btnOpenCoffee');
  const btnOpenCoffeeNav = document.getElementById('btnOpenCoffeeNav');
  const btnCloseCoffee = document.getElementById('btnCloseCoffee');
  const btnCloseShare = document.getElementById('btnCloseShare');
  const btnCloseLegal = document.getElementById('btnCloseLegal');

  function openCoffeeModal() {
    updateCoffeeQr(snackAmountInput ? snackAmountInput.value : 50);
    if (coffeeModal) coffeeModal.classList.add('active');
  }

  if (btnOpenCoffee) attachTap(btnOpenCoffee, openCoffeeModal);
  if (btnOpenCoffeeNav) attachTap(btnOpenCoffeeNav, openCoffeeModal);
  if (btnCloseCoffee) btnCloseCoffee.addEventListener('click', () => coffeeModal.classList.remove('active'));

  if (btnCloseShare) btnCloseShare.addEventListener('click', () => shareModal.classList.remove('active'));

  if (btnCloseLegal) btnCloseLegal.addEventListener('click', () => legalModal.classList.remove('active'));

  document.querySelectorAll('.open-legal-trigger').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (legalModal) legalModal.classList.add('active');
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === coffeeModal) coffeeModal.classList.remove('active');
    if (e.target === shareModal) shareModal.classList.remove('active');
    if (e.target === legalModal) legalModal.classList.remove('active');
    if (e.target === settingsModal) settingsModal.classList.remove('active');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (coffeeModal) coffeeModal.classList.remove('active');
      if (shareModal) shareModal.classList.remove('active');
      if (legalModal) legalModal.classList.remove('active');
      if (settingsModal) settingsModal.classList.remove('active');
    }
  });

  // Coffee QR Code generator
  const snackQrImg = document.getElementById('snackQrImg');
  const snackAmountInput = document.getElementById('snackAmountInput');
  const snackPresets = document.getElementById('snackPresets');
  const snackUpiText = document.getElementById('snackUpiText');
  const snackUpiCopyBtn = document.getElementById('snackUpiCopyBtn');
  const UPI_ID = 'Purohit2009@fam';
  const PAYEE_NAME = 'Shivam';

  function updateCoffeeQr(amt) {
    const val = Math.max(1, parseInt(amt, 10) || 50);
    const uri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${val}&cu=INR&tn=SynapseLab`;
    if (snackQrImg) {
      snackQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=svg&qzone=2&data=${encodeURIComponent(uri)}`;
    }
  }

  if (snackAmountInput) {
    snackAmountInput.addEventListener('input', () => updateCoffeeQr(snackAmountInput.value));
  }
  if (snackPresets) {
    snackPresets.addEventListener('click', (e) => {
      const chip = e.target.closest('.preset-chip');
      if (!chip) return;
      const val = chip.dataset.amt;
      if (snackAmountInput) snackAmountInput.value = val;
      snackPresets.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      updateCoffeeQr(val);
    });
  }

  if (snackUpiCopyBtn && snackUpiText) {
    snackUpiCopyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(UPI_ID);
        const orig = snackUpiText.textContent;
        snackUpiText.textContent = 'Copied!';
        setTimeout(() => snackUpiText.textContent = orig, 1500);
      } catch (err) {}
    });
  }

  document.querySelectorAll('.upi-app-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scheme = btn.dataset.scheme;
      const amt = Math.max(1, parseInt(snackAmountInput ? snackAmountInput.value : 50, 10) || 50);
      const query = `pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amt}&cu=INR`;
      let uri = `upi://pay?${query}`;
      if (scheme === 'famapp') uri = `in.fampay.app://upi/pay?${query}`;
      else if (scheme === 'gpay') uri = `tez://upi/pay?${query}`;
      else if (scheme === 'phonepe') uri = `phonepe://pay?${query}`;
      else if (scheme === 'paytm') uri = `paytmmp://pay?${query}`;
      window.location.href = uri;
    });
  });

  updateCoffeeQr(50);

  // Share Actions
  const btnShareCopy = document.getElementById('btnShareCopy');
  const shareCopyBadge = document.getElementById('shareCopyBadge');
  const btnNativeShare = document.getElementById('btnNativeShare');

  if (btnShareCopy) {
    btnShareCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        if (shareCopyBadge) {
          shareCopyBadge.textContent = 'Copied!';
          setTimeout(() => shareCopyBadge.textContent = 'Copy', 1800);
        }
      } catch (err) {}
    });
  }

  if (btnNativeShare) {
    btnNativeShare.addEventListener('click', async () => {
      const shareData = {
        title: 'SynapseLab: 3D Visualization Simulator for Students',
        text: 'Interactive 3D neural network simulator with luminous white filaments!',
        url: window.location.href
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) {}
      } else if (btnShareCopy) {
        btnShareCopy.click();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 10. SETTINGS MODAL: CAMERA & SENSITIVITY, STARFIELD, RESET, SHARE & LEGAL
  // ---------------------------------------------------------------------------
  const sliderOrbitSens = document.getElementById('sliderOrbitSens');
  const valOrbitSens = document.getElementById('valOrbitSens');
  const sliderZoomSens = document.getElementById('sliderZoomSens');
  const valZoomSens = document.getElementById('valZoomSens');
  const sliderOrbitSpeed = document.getElementById('sliderOrbitSpeed');
  const valOrbitSpeed = document.getElementById('valOrbitSpeed');
  const sliderLuminosity = document.getElementById('sliderLuminosity');
  const valLuminosity = document.getElementById('valLuminosity');
  const toggleStars = document.getElementById('toggleStars');
  const btnResetSettings = document.getElementById('btnResetSettings');

  if (sliderOrbitSens && valOrbitSens) {
    sliderOrbitSens.value = settings.orbitSensitivity || 1.0;
    valOrbitSens.textContent = (settings.orbitSensitivity || 1.0).toFixed(1) + 'x';
    sliderOrbitSens.addEventListener('input', () => {
      settings.orbitSensitivity = parseFloat(sliderOrbitSens.value);
      valOrbitSens.textContent = settings.orbitSensitivity.toFixed(1) + 'x';
      saveSettings();
    });
  }

  if (sliderZoomSens && valZoomSens) {
    sliderZoomSens.value = settings.zoomSensitivity || 1.0;
    valZoomSens.textContent = (settings.zoomSensitivity || 1.0).toFixed(1) + 'x';
    sliderZoomSens.addEventListener('input', () => {
      settings.zoomSensitivity = parseFloat(sliderZoomSens.value);
      valZoomSens.textContent = settings.zoomSensitivity.toFixed(1) + 'x';
      saveSettings();
    });
  }

  if (sliderOrbitSpeed && valOrbitSpeed) {
    sliderOrbitSpeed.value = settings.orbitSpeed || 1.0;
    valOrbitSpeed.textContent = (settings.orbitSpeed || 1.0).toFixed(1) + 'x';
    sliderOrbitSpeed.addEventListener('input', () => {
      settings.orbitSpeed = parseFloat(sliderOrbitSpeed.value);
      valOrbitSpeed.textContent = settings.orbitSpeed.toFixed(1) + 'x';
      saveSettings();
    });
  }

  if (sliderLuminosity && valLuminosity) {
    sliderLuminosity.value = Math.round((settings.threadLuminosity || 0.55) * 100);
    valLuminosity.textContent = Math.round((settings.threadLuminosity || 0.55) * 100) + '%';
    sliderLuminosity.addEventListener('input', () => {
      settings.threadLuminosity = parseFloat(sliderLuminosity.value) / 100;
      valLuminosity.textContent = sliderLuminosity.value + '%';
      saveSettings();
    });
  }

  if (toggleStars) {
    toggleStars.classList.toggle('active', settings.enableStarfield !== false);
    toggleStars.addEventListener('click', () => {
      const active = toggleStars.classList.toggle('active');
      settings.enableStarfield = active;
      saveSettings();
    });
  }

  if (btnResetSettings) {
    attachTap(btnResetSettings, () => {
      settings = Object.assign({}, DEFAULT_SETTINGS);
      saveSettings();
      if (sliderOrbitSens) sliderOrbitSens.value = 1.0;
      if (valOrbitSens) valOrbitSens.textContent = '1.0x';
      if (sliderZoomSens) sliderZoomSens.value = 1.0;
      if (valZoomSens) valZoomSens.textContent = '1.0x';
      if (sliderOrbitSpeed) sliderOrbitSpeed.value = 1.0;
      if (valOrbitSpeed) valOrbitSpeed.textContent = '1.0x';
      if (sliderLuminosity) sliderLuminosity.value = 55;
      if (valLuminosity) valLuminosity.textContent = '55%';
      if (toggleStars) toggleStars.classList.add('active');
    });
  }

  // Settings Modal: Share Simulator Direct Link
  const btnSettingsShareLink = document.getElementById('btnSettingsShareLink');
  const settingsShareCopyText = document.getElementById('settingsShareCopyText');

  if (btnSettingsShareLink) {
    attachTap(btnSettingsShareLink, async () => {
      try {
        await navigator.clipboard.writeText('https://synapselab.devs.li');
        if (settingsShareCopyText) {
          const original = settingsShareCopyText.textContent;
          settingsShareCopyText.textContent = 'Link Copied!';
          setTimeout(() => { settingsShareCopyText.textContent = original; }, 1800);
        }
      } catch (err) {}
    });
  }

  // Settings Modal: Legal Policy Trigger
  const btnSettingsOpenLegal = document.getElementById('btnSettingsOpenLegal');
  if (btnSettingsOpenLegal) {
    attachTap(btnSettingsOpenLegal, () => {
      if (settingsModal) settingsModal.classList.remove('active');
      if (legalModal) legalModal.classList.add('active');
    });
  }

  // ---------------------------------------------------------------------------
  // 11. INITIALIZATION
  // ---------------------------------------------------------------------------
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  buildNetwork([3, 6, 2]); // Initial starting network for Guide Mode
  animationLoop();
});
