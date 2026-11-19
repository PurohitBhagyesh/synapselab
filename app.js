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
  // 2. MODE SWITCHER: GUIDE MODE vs TEST MODE
  // ---------------------------------------------------------------------------
  const tabGuide = document.getElementById('tabGuide');
  const tabTest = document.getElementById('tabTest');
  const paneGuide = document.getElementById('paneGuide');
  const paneTest = document.getElementById('paneTest');
  function switchMode(mode) {
    currentMode = mode;
    if (mode === 'guide') {
      tabGuide.classList.add('active');
      tabTest.classList.remove('active');
      paneGuide.classList.add('active');
      paneTest.classList.remove('active');
      buildNetwork([3, 6, 2]);
    } else {
      tabTest.classList.add('active');
      tabGuide.classList.remove('active');
      paneTest.classList.add('active');
      paneGuide.classList.remove('active');
      syncCodeToNetwork();
    }
    setTimeout(resizeCanvas, 40);
  }

  if (tabGuide) tabGuide.addEventListener('click', () => switchMode('guide'));
  if (tabTest) tabTest.addEventListener('click', () => switchMode('test'));

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

  // Camera State with Smooth Inertial Lerping
  let targetYaw = -0.38;
  let targetPitch = 0.22;
  let currentYaw = -0.38;
  let currentPitch = 0.22;
  let camDist = 650;
  let targetCamDist = 650;
  let fov = 480;
  let autoRotate = true;
  let wavePulseTime = 0;
  let isDragging = false;
  let lastX = 0, lastY = 0;
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
    layerSizes = sizes;
    nodes = [];
    threads = [];
    hoveredNode = null;

    const numLayers = layerSizes.length;
    const totalDepth = 480;
    const zStep = totalDepth / (numLayers - 1 || 1);

    layerSizes.forEach((count, lIdx) => {
      const z = -totalDepth / 2 + lIdx * zStep;
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

    // Update Telemetry Displays (in VS Code status bar and Guide header)
    const hudGuideStats = document.getElementById('hudGuideStats');
    const liveThreadCount = document.getElementById('liveThreadCount');
    const statsText = `${layerSizes.length} Layers • ${nodes.length} Neurons • ${threads.length} Synapses`;
    if (hudGuideStats) hudGuideStats.textContent = statsText;
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
    autoRotate = false;
    if (btnToggleOrbit) btnToggleOrbit.classList.remove('active');
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseScreenX = e.clientX - rect.left;
    mouseScreenY = e.clientY - rect.top;

    if (isDragging) {
      const sens = settings.orbitSensitivity * 0.007;
      targetYaw += (e.clientX - lastX) * sens;
      targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + (e.clientY - lastY) * sens));
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
    const sens = settings.zoomSensitivity * 0.6;
    targetCamDist = Math.max(260, Math.min(1250, targetCamDist + e.deltaY * sens));
  }, { passive: false });

  // Touch Support
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      autoRotate = false;
      if (btnToggleOrbit) btnToggleOrbit.classList.remove('active');

      const rect = canvas.getBoundingClientRect();
      mouseScreenX = e.touches[0].clientX - rect.left;
      mouseScreenY = e.touches[0].clientY - rect.top;
      updateHoveredDot(mouseScreenX, mouseScreenY);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    if (e.touches.length !== 1) return;
    const rect = canvas.getBoundingClientRect();
    mouseScreenX = e.touches[0].clientX - rect.left;
    mouseScreenY = e.touches[0].clientY - rect.top;

    if (isDragging) {
      const sens = settings.orbitSensitivity * 0.007;
      targetYaw += (e.touches[0].clientX - lastX) * sens;
      targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + (e.touches[0].clientY - lastY) * sens));
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
    updateHoveredDot(mouseScreenX, mouseScreenY);
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Viewport Toolbar & Fullscreen Controls
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetView = document.getElementById('btnResetView');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnExitFullscreen = document.getElementById('btnExitFullscreen');
  const visPane = document.querySelector('.vis-pane');

  function toggleFullscreen(forceState) {
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
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
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
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (err) {}
    }

    setTimeout(() => {
      resizeCanvas();
      drawPerspectiveScene();
    }, 40);
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => toggleFullscreen());
  }

  if (btnExitFullscreen) {
    btnExitFullscreen.addEventListener('click', () => toggleFullscreen(false));
  }

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      targetCamDist = Math.max(280, targetCamDist - 120 * settings.zoomSensitivity);
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      targetCamDist = Math.min(1200, targetCamDist + 120 * settings.zoomSensitivity);
    });
  }
  if (btnResetView) {
    btnResetView.addEventListener('click', () => {
      targetYaw = -0.38;
      targetPitch = 0.22;
      targetCamDist = 650;
      autoRotate = true;
      if (btnToggleOrbit) btnToggleOrbit.classList.add('active');
    });
  }

  if (btnToggleOrbit) {
    btnToggleOrbit.addEventListener('click', () => {
      autoRotate = !autoRotate;
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
  let forwardPassStartTime = 0;
  let forwardPassStage = 0;
  const STAGE_DURATION_MS = 450;

  function triggerLiveForwardPass() {
    syncCodeToNetwork();
    isForwardPassRunning = true;
    forwardPassStartTime = performance.now();
    forwardPassStage = 0;

    if (btnRunCode) {
      btnRunCode.classList.add('running');
      btnRunCode.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation:spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"/>
      </svg><span>Running...</span>`;
    }

    if (visLiveBadge && visLiveText) {
      visLiveBadge.style.borderColor = '#ffffff';
      visLiveText.textContent = `FORWARD PASS: INITIALIZING LAYER 0 INPUTS...`;
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
      const isSurging = isSurgingStage && (t.src.layerIdx === activeStageLayer);

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

    // 4. Floating Layer Headers (Monochrome Glass Cards)
    layerSizes.forEach((count, lIdx) => {
      const totalDepth = 480;
      const z = -totalDepth / 2 + lIdx * (totalDepth / (layerSizes.length - 1 || 1));
      const pTop = project3D(0, -180, z, cx, cy);
      if (!pTop) return;

      const w = 84 * pTop.scale * 1.5;
      const h = 28 * pTop.scale * 1.5;
      const x = pTop.x - w / 2;
      const y = pTop.y - h;

      ctx.fillStyle = 'rgba(9, 9, 11, 0.92)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.max(8, Math.round(10.5 * pTop.scale * 1.5))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      const name = lIdx === 0 ? "Input Layer" : (lIdx === layerSizes.length - 1 ? "Output Layer" : `Hidden ${lIdx}`);
      ctx.fillText(name, pTop.x, y + 12 * pTop.scale * 1.5);

      ctx.fillStyle = '#8e8e96';
      ctx.font = `${Math.max(7, Math.round(8.5 * pTop.scale * 1.5))}px "SF Mono", monospace`;
      ctx.fillText(`${count} Neurons`, pTop.x, y + 23 * pTop.scale * 1.5);
    });

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
      const isCurrentLayerActive = isForwardPassRunning && (node.layerIdx === activeStageLayer);
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

      // Node label
      if (p.scale > 0.6) {
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
      ctx.fillText(`In: ${tip.inCount} syn | Out: ${tip.outCount} syn`, tx + 8, ty + 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText('Connected threads active', tx + 8, ty + 47);
    }
  }

  function animationLoop() {
    if (autoRotate && !isDragging) targetYaw += 0.0022 * settings.orbitSpeed;
    currentYaw += (targetYaw - currentYaw) * 0.08;
    currentPitch += (targetPitch - currentPitch) * 0.08;
    camDist += (targetCamDist - camDist) * 0.08;
    wavePulseTime += 0.024;

    // Handle Live Forward-Pass Animation Cascade
    if (isForwardPassRunning) {
      const elapsed = performance.now() - forwardPassStartTime;
      const totalStages = Math.max(1, layerSizes.length - 1);
      const totalDuration = totalStages * STAGE_DURATION_MS;
      forwardPassStage = elapsed / STAGE_DURATION_MS;

      if (elapsed < totalDuration) {
        const curL = Math.min(layerSizes.length - 1, Math.floor(forwardPassStage));
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
        if (btnRunCode) {
          btnRunCode.classList.remove('running');
          btnRunCode.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg><span>Run</span>`;
        }
        if (visLiveBadge && visLiveText) {
          visLiveBadge.style.borderColor = 'var(--border-strong)';
          visLiveText.textContent = `LIVE SIGNAL FLOW: ${threads.length} THREADS ACTIVE`;
        }
        const liveThreadCount = document.getElementById('liveThreadCount');
        if (liveThreadCount) {
          liveThreadCount.textContent = `${layerSizes.length} Layers • ${nodes.length} Neurons • ${threads.length} Synapses`;
        }
      }
    }

    drawPerspectiveScene();
    requestAnimationFrame(animationLoop);
  }

  // ---------------------------------------------------------------------------
  // 6. GUIDE MODE INTERACTIVE LESSONS
  // ---------------------------------------------------------------------------
  const lessonCards = document.querySelectorAll('.lesson-card');
  lessonCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      lessonCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      if (idx === 0) {
        buildNetwork([3, 6, 2]);
        targetCamDist = 650;
      } else if (idx === 1) {
        buildNetwork([3, 8, 3]);
        wavePulseTime += 1.0;
      } else if (idx === 2) {
        buildNetwork([2, 5, 2]);
      } else if (idx === 3) {
        buildNetwork([3, 8, 6, 2]);
      }
    });
  });

  const btnPulseGuide = document.getElementById('btnPulseGuide');
  if (btnPulseGuide) {
    btnPulseGuide.addEventListener('click', (e) => {
      e.stopPropagation();
      wavePulseTime += 1.4;
    });
  }

  // ---------------------------------------------------------------------------
  // 7. TEST MODE LIVE CODING & SIMULATION (VS CODE INTERACTIVE EXPERIENCE)
  // ---------------------------------------------------------------------------
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

  function updateLineNumbers() {
    if (!studentCode || !lineNumbers) return;
    const count = (studentCode.value.split('\n').length) || 1;
    let html = '';
    for (let i = 1; i <= count; i++) {
      html += `${i}<br>`;
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
    const match = studentCode.value.match(/layers\s*=\s*\[(.*?)\]/);
    if (match && match[1]) {
      const parsed = match[1].split(',')
        .map(n => parseInt(n.trim(), 10))
        .filter(n => !isNaN(n) && n > 0 && n <= 18);

      if (parsed.length >= 2) {
        buildNetwork(parsed);
      }
    }
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
    btnRunCode.addEventListener('click', () => {
      triggerLiveForwardPass();
    });
  }

  if (btnResetCode) {
    btnResetCode.addEventListener('click', () => {
      if (studentCode) {
        studentCode.value = defaultStarterCode;
        updateLineNumbers();
        updateCursorPosition();
        syncCodeToNetwork();
      }
    });
  }

  if (btnTrainLive) {
    btnTrainLive.addEventListener('click', () => {
      wavePulseTime += 1.6;
      const originalHtml = btnTrainLive.innerHTML;
      btnTrainLive.innerHTML = '<span>Simulating...</span>';
      setTimeout(() => {
        btnTrainLive.innerHTML = '<span>Loss: 0.014</span>';
        setTimeout(() => {
          btnTrainLive.innerHTML = originalHtml;
        }, 2200);
      }, 900);
    });
  }

  // ---------------------------------------------------------------------------
  // 8. SETTINGS MODAL & SLIDERS (Sensitivity & Visual Tuning)
  // ---------------------------------------------------------------------------
  const settingsModal = document.getElementById('settingsModal');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');

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

  function syncSettingsUI() {
    if (sliderOrbitSens) {
      sliderOrbitSens.value = settings.orbitSensitivity;
      if (valOrbitSens) valOrbitSens.textContent = `${Number(settings.orbitSensitivity).toFixed(1)}x`;
    }
    if (sliderZoomSens) {
      sliderZoomSens.value = settings.zoomSensitivity;
      if (valZoomSens) valZoomSens.textContent = `${Number(settings.zoomSensitivity).toFixed(1)}x`;
    }
    if (sliderOrbitSpeed) {
      sliderOrbitSpeed.value = settings.orbitSpeed;
      if (valOrbitSpeed) valOrbitSpeed.textContent = `${Number(settings.orbitSpeed).toFixed(1)}x`;
    }
    if (sliderLuminosity) {
      sliderLuminosity.value = Math.round(settings.threadLuminosity * 100);
      if (valLuminosity) valLuminosity.textContent = `${Math.round(settings.threadLuminosity * 100)}%`;
    }
    if (toggleStars) {
      toggleStars.classList.toggle('active', settings.enableStarfield);
    }
  }

  syncSettingsUI();

  if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => settingsModal.classList.add('active'));
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => settingsModal.classList.remove('active'));

  if (sliderOrbitSens) {
    sliderOrbitSens.addEventListener('input', () => {
      settings.orbitSensitivity = parseFloat(sliderOrbitSens.value);
      if (valOrbitSens) valOrbitSens.textContent = `${settings.orbitSensitivity.toFixed(1)}x`;
      saveSettings();
    });
  }

  if (sliderZoomSens) {
    sliderZoomSens.addEventListener('input', () => {
      settings.zoomSensitivity = parseFloat(sliderZoomSens.value);
      if (valZoomSens) valZoomSens.textContent = `${settings.zoomSensitivity.toFixed(1)}x`;
      saveSettings();
    });
  }

  if (sliderOrbitSpeed) {
    sliderOrbitSpeed.addEventListener('input', () => {
      settings.orbitSpeed = parseFloat(sliderOrbitSpeed.value);
      if (valOrbitSpeed) valOrbitSpeed.textContent = `${settings.orbitSpeed.toFixed(1)}x`;
      saveSettings();
    });
  }

  if (sliderLuminosity) {
    sliderLuminosity.addEventListener('input', () => {
      settings.threadLuminosity = parseInt(sliderLuminosity.value, 10) / 100;
      if (valLuminosity) valLuminosity.textContent = `${sliderLuminosity.value}%`;
      saveSettings();
    });
  }

  if (toggleStars) {
    toggleStars.addEventListener('click', () => {
      settings.enableStarfield = !settings.enableStarfield;
      toggleStars.classList.toggle('active', settings.enableStarfield);
      saveSettings();
    });
  }

  if (btnResetSettings) {
    btnResetSettings.addEventListener('click', () => {
      settings = Object.assign({}, DEFAULT_SETTINGS);
      saveSettings();
      syncSettingsUI();
    });
  }

  // ---------------------------------------------------------------------------
  // 9. BUY ME A COFFEE & SHARE MODALS
  // ---------------------------------------------------------------------------
  const coffeeModal = document.getElementById('coffeeModal');
  const shareModal = document.getElementById('shareModal');
  const legalModal = document.getElementById('legalModal');

  const btnOpenCoffee = document.getElementById('btnOpenCoffee');
  const btnOpenShare = document.getElementById('btnOpenShare');
  const btnCloseCoffee = document.getElementById('btnCloseCoffee');
  const btnCloseShare = document.getElementById('btnCloseShare');
  const btnCloseLegal = document.getElementById('btnCloseLegal');

  if (btnOpenCoffee) btnOpenCoffee.addEventListener('click', () => coffeeModal.classList.add('active'));
  if (btnCloseCoffee) btnCloseCoffee.addEventListener('click', () => coffeeModal.classList.remove('active'));

  if (btnOpenShare) btnOpenShare.addEventListener('click', () => shareModal.classList.add('active'));
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
    const uri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${val}&cu=INR`;
    if (snackQrImg) {
      snackQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=svg&data=${encodeURIComponent(uri)}`;
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
  // 10. COOKIE & DPDP CONSENT BANNER
  // ---------------------------------------------------------------------------
  const cookieConsentBanner = document.getElementById('cookieConsentBanner');
  const btnAcceptCookies = document.getElementById('btnAcceptCookies');
  const btnCookieLearnMore = document.getElementById('btnCookieLearnMore');

  if (localStorage.getItem('synapselab_cookie_consent') === 'true') {
    if (cookieConsentBanner) cookieConsentBanner.classList.add('hidden');
  }

  if (btnAcceptCookies && cookieConsentBanner) {
    btnAcceptCookies.addEventListener('click', () => {
      localStorage.setItem('synapselab_cookie_consent', 'true');
      cookieConsentBanner.classList.add('hidden');
    });
  }

  if (btnCookieLearnMore) {
    btnCookieLearnMore.addEventListener('click', (e) => {
      e.preventDefault();
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
