/**
 * SynapseLab Application Engine
 * 3D Visualization Simulator for Students
 * Modes: Guide Mode (Interactive Learning) & Test Mode (Clean Code Studio)
 * Moving Cosmic Starfield • Interactive Dot Touch & Synaptic Isolation • Locked 3D White Filaments
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. OPENLID EYE THEME SWITCHER
  // ---------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const savedTheme = localStorage.getItem('synapselab_theme') || 'dark';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('synapselab_theme', theme);
    if (themeLabel) {
      themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }
    resizeCanvas();
  }

  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = active === 'dark' ? 'light' : 'dark';
      themeToggleBtn.style.transform = 'scale(0.92)';
      setTimeout(() => {
        applyTheme(next);
        themeToggleBtn.style.transform = 'scale(1)';
      }, 100);
    });
  }

  // ---------------------------------------------------------------------------
  // 2. MODE SWITCHER: GUIDE MODE vs TEST MODE
  // ---------------------------------------------------------------------------
  const tabGuide = document.getElementById('tabGuide');
  const tabTest = document.getElementById('tabTest');
  const paneGuide = document.getElementById('paneGuide');
  const paneTest = document.getElementById('paneTest');
  const hudTitle = document.getElementById('hudTitle');
  const guidancePill = document.querySelector('.guidance-pill-bottom');

  let currentMode = 'guide';

  function switchMode(mode) {
    currentMode = mode;
    if (mode === 'guide') {
      tabGuide.classList.add('active');
      tabTest.classList.remove('active');
      paneGuide.classList.add('active');
      paneTest.classList.remove('active');
      if (hudTitle) hudTitle.textContent = 'GUIDE MODE: 3D NEURAL SIMULATOR';
      if (guidancePill) guidancePill.style.display = 'block';
      buildNetwork([3, 6, 2]);
    } else {
      tabTest.classList.add('active');
      tabGuide.classList.remove('active');
      paneTest.classList.add('active');
      paneGuide.classList.remove('active');
      if (hudTitle) hudTitle.textContent = 'TEST MODE: ARCHITECTURE LAB';
      // Test mode has zero guidance as requested
      if (guidancePill) guidancePill.style.display = 'none';
      syncCodeToNetwork();
    }
    setTimeout(resizeCanvas, 40);
  }

  if (tabGuide) tabGuide.addEventListener('click', () => switchMode('guide'));
  if (tabTest) tabTest.addEventListener('click', () => switchMode('test'));

  // ---------------------------------------------------------------------------
  // 3. 3D VISUALIZER ENGINE & MOVING STARS BACKGROUND
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById('canvas3d');
  if (!canvas) {
    console.error('Fatal: #canvas3d not found');
    return;
  }

  const ctx = canvas.getContext('2d');

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

  // Settings
  let enableStarfield = true;
  let enableUltraGlow = true;

  // Generate 3D Moving Stars Background
  const starCount = 200;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: (Math.random() - 0.5) * 1600,
      y: (Math.random() - 0.5) * 1200,
      z: (Math.random() - 0.5) * 1600,
      baseAlpha: 0.2 + Math.random() * 0.6,
      size: 0.8 + Math.random() * 1.5,
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
        nodes.push({
          x: 0,
          y: count === 1 ? 0 : startY + i * stepY,
          z: z,
          layerIdx: lIdx,
          nodeIdx: i,
          layerName: lIdx === 0 ? "Input Layer" : (lIdx === numLayers - 1 ? "Output Layer" : `Hidden Layer ${lIdx}`),
          name: lIdx === 0 ? `Input N${i+1}` : (lIdx === numLayers - 1 ? `Output N${i+1}` : `Hidden N${i+1}`)
        });
      }
    });

    // Generate sweeping, organic 3D curved white filaments
    for (let l = 0; l < numLayers - 1; l++) {
      const srcNodes = nodes.filter(n => n.layerIdx === l);
      const dstNodes = nodes.filter(n => n.layerIdx === l + 1);

      srcNodes.forEach((src, sIdx) => {
        dstNodes.forEach((dst, dIdx) => {
          const dz = dst.z - src.z;
          const spreadX = ((sIdx - srcNodes.length / 2) + (dIdx - dstNodes.length / 2)) * 7.5;
          const spreadY = (sIdx - dIdx) * 2.2;

          const p1 = { x: src.x + spreadX, y: src.y + spreadY, z: src.z + dz * 0.35 };
          const p2 = { x: dst.x + spreadX * 0.75, y: dst.y - spreadY * 0.5, z: src.z + dz * 0.65 };

          const seed = Math.sin(sIdx * 19 + dIdx * 37);
          threads.push({
            src, dst, p1, p2, seed,
            weight: (seed * 0.85).toFixed(3)
          });
        });
      });
    }

    // Update Telemetry Displays
    const hudStats = document.getElementById('hudStats');
    const liveThreadCount = document.getElementById('liveThreadCount');
    const statsText = `${layerSizes.length} Layers (${nodes.length} Neurons • ${threads.length} Synapses)`;
    if (hudStats) hudStats.textContent = statsText;
    if (liveThreadCount) liveThreadCount.textContent = `${threads.length} Synaptic Threads • ${nodes.length} Neurons`;
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
    const w = rect.width || canvas.parentElement.clientWidth || 600;
    const h = rect.height || canvas.parentElement.clientHeight || 450;
    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------------------------------------------------------------------------
  // 4. MOUSE / TOUCH INTERACTION & DOT TOUCH DETECTION
  // ---------------------------------------------------------------------------
  const rotateToggleBtn = document.getElementById('btnRotateToggle');

  function updateHoveredDot(screenX, screenY) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const cx = (rect.width || 600) / 2;
    const cy = (rect.height || 450) / 2;

    let closest = null;
    let minDist = 22; // 22px touch / hover radius for comfortable selection

    nodes.forEach(n => {
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
    });

    hoveredNode = closest;
    canvas.style.cursor = hoveredNode ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
  }

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    autoRotate = false;
    if (rotateToggleBtn) rotateToggleBtn.classList.remove('active');
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseScreenX = e.clientX - rect.left;
    mouseScreenY = e.clientY - rect.top;

    if (isDragging) {
      targetYaw += (e.clientX - lastX) * 0.007;
      targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + (e.clientY - lastY) * 0.007));
      lastX = e.clientX;
      lastY = e.clientY;
    } else {
      updateHoveredDot(mouseScreenX, mouseScreenY);
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
    targetCamDist = Math.max(280, Math.min(1200, targetCamDist + e.deltaY * 0.6));
  }, { passive: false });

  // Mobile Touch Support
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      autoRotate = false;
      if (rotateToggleBtn) rotateToggleBtn.classList.remove('active');

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
      targetYaw += (e.touches[0].clientX - lastX) * 0.007;
      targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + (e.touches[0].clientY - lastY) * 0.007));
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
    updateHoveredDot(mouseScreenX, mouseScreenY);
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Zoom Toolbar Buttons
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetView = document.getElementById('btnResetView');

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      targetCamDist = Math.max(300, targetCamDist - 120);
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      targetCamDist = Math.min(1150, targetCamDist + 120);
    });
  }
  if (btnResetView) {
    btnResetView.addEventListener('click', () => {
      targetYaw = -0.38;
      targetPitch = 0.22;
      targetCamDist = 650;
      autoRotate = true;
      if (rotateToggleBtn) rotateToggleBtn.classList.add('active');
    });
  }

  if (rotateToggleBtn) {
    rotateToggleBtn.addEventListener('click', () => {
      autoRotate = !autoRotate;
      rotateToggleBtn.classList.toggle('active', autoRotate);
    });
  }

  // ---------------------------------------------------------------------------
  // 5. 3D RENDER LOOP: MOVING STARS + LOCKED FILAMENTS + TOUCH ISOLATION
  // ---------------------------------------------------------------------------
  function drawPerspectiveScene() {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const cx = (rect.width || 600) / 2;
    const cy = (rect.height || 450) / 2;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Moving 3D Cosmic Starfield
    if (enableStarfield) {
      stars.forEach(s => {
        // Subtle drift in 3D space
        s.z -= 0.4;
        if (s.z < -800) s.z = 800;

        const p = project3D(s.x, s.y, s.z, cx, cy);
        if (p && p.x >= 0 && p.x <= rect.width && p.y >= 0 && p.y <= rect.height) {
          const twinkle = 0.6 + 0.4 * Math.sin(wavePulseTime * 2.5 + s.phase);
          const alpha = s.baseAlpha * twinkle * Math.max(0, Math.min(1, 1 - p.depth / 2200));
          ctx.beginPath();
          ctx.arc(p.x, p.y, s.size * Math.max(0.5, p.scale), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.fill();
        }
      });
    }

    // 2. Perspective Grid Floor
    const gridY = 210;
    const size = 480;
    const step = 60;
    ctx.lineWidth = 0.8;

    for (let z = -size; z <= size; z += step) {
      const pA = project3D(-size, gridY, z, cx, cy);
      const pB = project3D(size, gridY, z, cx, cy);
      if (pA && pB) {
        const alpha = Math.max(0, Math.min(0.24, 1 - (pA.depth + pB.depth) / 2200));
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    }
    for (let x = -size; x <= size; x += step) {
      const pA = project3D(x, gridY, -size, cx, cy);
      const pB = project3D(x, gridY, size, cx, cy);
      if (pA && pB) {
        const alpha = Math.max(0, Math.min(0.24, 1 - (pA.depth + pB.depth) / 2200));
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    }

    // 3. 3D WHITE FILAMENTS & TOUCH ISOLATION LIGHTING
    threads.forEach(t => {
      const isConnectedToHovered = hoveredNode ? (t.src === hoveredNode || t.dst === hoveredNode) : false;

      const segments = 12;
      let prevP = project3D(t.src.x, t.src.y, t.src.z, cx, cy);
      if (!prevP) return;

      ctx.beginPath();
      ctx.moveTo(prevP.x, prevP.y);

      for (let i = 1; i <= segments; i++) {
        const r = i / segments;
        const x = evalCubic(t.src.x, t.p1.x, t.p2.x, t.dst.x, r);
        const y = evalCubic(t.src.y, t.p1.y, t.p2.y, t.dst.y, r);
        const z = evalCubic(t.src.z, t.p1.z, t.p2.z, t.dst.z, r);
        const cp = project3D(x, y, z, cx, cy);
        if (cp) ctx.lineTo(cp.x, cp.y);
      }

      // If a dot is hovered: light up connected threads, dim non-connected threads!
      if (hoveredNode) {
        if (isConnectedToHovered) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.lineWidth = 2.4;
          if (enableUltraGlow) {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = 'rgba(240, 249, 255, 0.09)';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      } else {
        // Normal state: balanced luminous silk filaments
        ctx.strokeStyle = 'rgba(240, 249, 255, 0.44)';
        ctx.lineWidth = 1.25;
        if (enableUltraGlow) {
          ctx.shadowColor = 'rgba(56, 189, 248, 0.3)';
          ctx.shadowBlur = 4;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Optical wave pulse traveling through filament
      const speedMultiplier = (hoveredNode && isConnectedToHovered) ? 1.8 : 1.0;
      const waveProg = (wavePulseTime * speedMultiplier + Math.abs(t.seed) * 2.4) % 1;
      const wx = evalCubic(t.src.x, t.p1.x, t.p2.x, t.dst.x, waveProg);
      const wy = evalCubic(t.src.y, t.p1.y, t.p2.y, t.dst.y, waveProg);
      const wz = evalCubic(t.src.z, t.p1.z, t.p2.z, t.dst.z, waveProg);
      const wp = project3D(wx, wy, wz, cx, cy);

      if (wp) {
        if (!hoveredNode || isConnectedToHovered) {
          ctx.beginPath();
          const pSize = isConnectedToHovered ? 3.0 : 2.0;
          ctx.arc(wp.x, wp.y, pSize * wp.scale * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = isConnectedToHovered ? 14 : 7;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    });

    // 4. Floating Layer Headers (Glass Cards)
    layerSizes.forEach((count, lIdx) => {
      const totalDepth = 480;
      const z = -totalDepth / 2 + lIdx * (totalDepth / (layerSizes.length - 1 || 1));
      const pTop = project3D(0, -180, z, cx, cy);
      if (!pTop) return;

      const w = 84 * pTop.scale * 1.5;
      const h = 28 * pTop.scale * 1.5;
      const x = pTop.x - w / 2;
      const y = pTop.y - h;

      ctx.fillStyle = 'rgba(11, 11, 13, 0.9)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.max(8, Math.round(10.5 * pTop.scale * 1.5))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      const name = lIdx === 0 ? "Input Layer" : (lIdx === layerSizes.length - 1 ? "Output Layer" : `Hidden ${lIdx}`);
      ctx.fillText(name, pTop.x, y + 12 * pTop.scale * 1.5);

      ctx.fillStyle = '#9a9aa6';
      ctx.font = `${Math.max(7, Math.round(8.5 * pTop.scale * 1.5))}px "SF Mono", monospace`;
      ctx.fillText(`${count} Neurons`, pTop.x, y + 23 * pTop.scale * 1.5);
    });

    // 5. Depth Sorted Luminous White Neurons
    const projNodes = [];
    nodes.forEach(n => {
      const p = project3D(n.x, n.y, n.z, cx, cy);
      if (p) projNodes.push({ node: n, p });
    });
    projNodes.sort((a, b) => b.p.depth - a.p.depth);

    let activeTooltip = null;

    projNodes.forEach(({ node, p }) => {
      const isHovered = (hoveredNode === node);
      const radius = (isHovered ? 6.4 : 4.8) * p.scale * 1.5;

      // Glow halo
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * (isHovered ? 3.0 : 2.2), 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.22)';
      ctx.fill();

      // Outer focus ring if hovered
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Solid bright white node core
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isHovered ? '#38bdf8' : '#232329';
      ctx.lineWidth = isHovered ? 2.0 : 1.5;
      ctx.fill();
      ctx.stroke();

      // Node label
      if (p.scale > 0.6) {
        ctx.fillStyle = isHovered ? '#ffffff' : '#9a9aa6';
        ctx.font = `${isHovered ? 'bold ' : ''}${Math.max(7, Math.round(8.5 * p.scale))}px "SF Mono", monospace`;
        ctx.textAlign = node.layerIdx === 0 ? 'right' : 'left';
        const offX = node.layerIdx === 0 ? -radius - 6 : radius + 6;
        ctx.fillText(`N${node.nodeIdx + 1}`, p.x + offX, p.y + 3);
      }

      // Prepare Tooltip if hovered
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

    // 6. Draw Interactive Node Tooltip Card
    if (activeTooltip) {
      const tip = activeTooltip;
      const tw = 165;
      const th = 56;
      let tx = tip.x;
      let ty = tip.y;
      if (tx + tw > rect.width - 10) tx = tip.x - tw - 24;
      if (ty + th > rect.height - 10) ty = rect.height - th - 10;
      if (ty < 10) ty = 10;

      ctx.fillStyle = 'rgba(11, 11, 13, 0.94)';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(tx, ty, tw, th);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${tip.node.name} (${tip.node.layerName})`, tx + 8, ty + 16);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px "SF Mono", monospace';
      ctx.fillText(`In: ${tip.inCount} syn | Out: ${tip.outCount} syn`, tx + 8, ty + 32);

      ctx.fillStyle = '#9a9aa6';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText('Touch & Threads isolated', tx + 8, ty + 47);
    }
  }

  function animationLoop() {
    if (autoRotate && !isDragging) targetYaw += 0.0022;
    currentYaw += (targetYaw - currentYaw) * 0.08;
    currentPitch += (targetPitch - currentPitch) * 0.08;
    camDist += (targetCamDist - camDist) * 0.08;
    wavePulseTime += 0.024;

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
  // 7. TEST MODE LIVE CODING & SIMULATION
  // ---------------------------------------------------------------------------
  const studentCode = document.getElementById('studentCode');
  const btnRunCode = document.getElementById('btnRunCode');
  const btnTrainLive = document.getElementById('btnTrainLive');
  const btnResetCode = document.getElementById('btnResetCode');

  const defaultStarterCode = `# ==========================================================
# SynapseLab: Student Code & Architecture Lab
# Type or edit layers below to see 3D threads update live!
# ==========================================================

# 1. Define Layer Architecture [Input, Hidden..., Output]
layers = [3, 8, 4, 1]

# 2. Hyperparameters
activation = "relu"     # Non-linear activation for neurons
learning_rate = 0.05    # Gradient descent step size
epochs = 300            # Training iterations

print(f"Network initialized: {layers}")

# STUDENT EXPERIMENT:
# Change layers above to [4, 10, 6, 2] or [2, 6, 6, 1]
# The 3D filaments and neuron nodes will rebuild immediately!`;

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

  if (studentCode) studentCode.addEventListener('input', syncCodeToNetwork);
  if (btnRunCode) {
    btnRunCode.addEventListener('click', () => {
      syncCodeToNetwork();
      wavePulseTime += 1.0;
    });
  }

  if (btnResetCode) {
    btnResetCode.addEventListener('click', () => {
      if (studentCode) {
        studentCode.value = defaultStarterCode;
        syncCodeToNetwork();
      }
    });
  }

  if (btnTrainLive) {
    btnTrainLive.addEventListener('click', () => {
      wavePulseTime += 1.6;
      const originalText = btnTrainLive.textContent;
      btnTrainLive.textContent = "Simulating...";
      setTimeout(() => {
        btnTrainLive.textContent = "Loss: 0.014 (Converged)";
        setTimeout(() => {
          btnTrainLive.textContent = originalText;
        }, 2200);
      }, 900);
    });
  }

  // ---------------------------------------------------------------------------
  // 8. SETTINGS MODAL & VISUAL CONTROLS
  // ---------------------------------------------------------------------------
  const settingsModal = document.getElementById('settingsModal');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const toggleStars = document.getElementById('toggleStars');
  const toggleGlow = document.getElementById('toggleGlow');
  const toggleOrbit = document.getElementById('toggleOrbit');

  if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => settingsModal.classList.add('active'));
  if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => settingsModal.classList.remove('active'));

  if (toggleStars) {
    toggleStars.addEventListener('click', () => {
      enableStarfield = !enableStarfield;
      toggleStars.classList.toggle('active', enableStarfield);
    });
  }

  if (toggleGlow) {
    toggleGlow.addEventListener('click', () => {
      enableUltraGlow = !enableUltraGlow;
      toggleGlow.classList.toggle('active', enableUltraGlow);
    });
  }

  if (toggleOrbit) {
    toggleOrbit.addEventListener('click', () => {
      autoRotate = !autoRotate;
      toggleOrbit.classList.toggle('active', autoRotate);
      if (rotateToggleBtn) rotateToggleBtn.classList.toggle('active', autoRotate);
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

  // Legal Modal Triggers (DPDP, Privacy, Terms)
  document.querySelectorAll('.open-legal-trigger').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (legalModal) legalModal.classList.add('active');
    });
  });

  // Close modals on backdrop click or escape
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

  // Copy UPI
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

  // 1-Click UPI App Launchers
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
        title: 'SynapseLab — 3D Visualization Simulator for Students',
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
  // 10. INITIALIZATION
  // ---------------------------------------------------------------------------
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  buildNetwork([3, 6, 2]); // Initial starting network for Guide Mode
  animationLoop();
});
