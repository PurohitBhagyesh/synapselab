/**
 * SynapseLab Application Engine
 * Modes: Guide Mode (Interactive Learning) & Test Mode (Code Studio & Lab)
 * Locked 3D Luminous White Filaments • 60 FPS Orbit Canvas • OpenLid Design Architecture
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

  let currentMode = 'guide';

  function switchMode(mode) {
    currentMode = mode;
    if (mode === 'guide') {
      tabGuide.classList.add('active');
      tabTest.classList.remove('active');
      paneGuide.classList.add('active');
      paneTest.classList.remove('active');
      if (hudTitle) hudTitle.textContent = 'GUIDE MODE: 3D NEURAL VISUALIZER';
      buildNetwork([3, 6, 2]);
    } else {
      tabTest.classList.add('active');
      tabGuide.classList.remove('active');
      paneTest.classList.add('active');
      paneGuide.classList.remove('active');
      if (hudTitle) hudTitle.textContent = 'TEST MODE: ARCHITECTURE STUDIO';
      syncCodeToNetwork();
    }
    setTimeout(resizeCanvas, 40);
  }

  if (tabGuide) tabGuide.addEventListener('click', () => switchMode('guide'));
  if (tabTest) tabTest.addEventListener('click', () => switchMode('test'));

  // ---------------------------------------------------------------------------
  // 3. PERSISTENT 3D VISUALIZER ENGINE (LOCKED LUMINOUS WHITE THREADS)
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

  let layerSizes = [3, 6, 2];
  let nodes = [];
  let threads = [];

  function buildNetwork(sizes) {
    layerSizes = sizes;
    nodes = [];
    threads = [];

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
          name: lIdx === 0 ? `Input ${i+1}` : (lIdx === numLayers - 1 ? `Output ${i+1}` : `Hidden ${lIdx}_${i+1}`)
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
  // 4. MOUSE / TOUCH INTERACTION & ORBIT
  // ---------------------------------------------------------------------------
  const rotateToggleBtn = document.getElementById('btnRotateToggle');

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    autoRotate = false;
    if (rotateToggleBtn) rotateToggleBtn.classList.remove('active');
  });

  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    targetYaw += (e.clientX - lastX) * 0.007;
    targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + (e.clientY - lastY) * 0.007));
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', () => isDragging = false);

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    targetCamDist = Math.max(280, Math.min(1200, targetCamDist + e.deltaY * 0.6));
  }, { passive: false });

  // Touch controls
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      autoRotate = false;
      if (rotateToggleBtn) rotateToggleBtn.classList.remove('active');
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    if (!isDragging || e.touches.length !== 1) return;
    targetYaw += (e.touches[0].clientX - lastX) * 0.007;
    targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + (e.touches[0].clientY - lastY) * 0.007));
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', () => isDragging = false);

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
  // 5. 3D RENDER LOOP
  // ---------------------------------------------------------------------------
  function drawPerspectiveScene() {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const cx = (rect.width || 600) / 2;
    const cy = (rect.height || 450) / 2;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Perspective Grid Floor
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

    // 2. LOCKED LUMINOUS WHITE FILAMENTS
    threads.forEach(t => {
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

      // Bright, luminous white silk filaments
      ctx.strokeStyle = 'rgba(240, 249, 255, 0.44)';
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // Optical wave pulse traveling through filament
      const waveProg = (wavePulseTime + Math.abs(t.seed) * 2.4) % 1;
      const wx = evalCubic(t.src.x, t.p1.x, t.p2.x, t.dst.x, waveProg);
      const wy = evalCubic(t.src.y, t.p1.y, t.p2.y, t.dst.y, waveProg);
      const wz = evalCubic(t.src.z, t.p1.z, t.p2.z, t.dst.z, waveProg);
      const wp = project3D(wx, wy, wz, cx, cy);

      if (wp) {
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 2.0 * wp.scale * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // 3. Floating Layer Headers (Glass Cards)
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

    // 4. Depth Sorted Luminous White Neurons
    const projNodes = [];
    nodes.forEach(n => {
      const p = project3D(n.x, n.y, n.z, cx, cy);
      if (p) projNodes.push({ node: n, p });
    });
    projNodes.sort((a, b) => b.p.depth - a.p.depth);

    projNodes.forEach(({ node, p }) => {
      const radius = 4.8 * p.scale * 1.5;

      // Glow halo
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fill();

      // Solid bright white node core
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#232329';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Node label
      if (p.scale > 0.6) {
        ctx.fillStyle = '#9a9aa6';
        ctx.font = `${Math.max(7, Math.round(8.5 * p.scale))}px "SF Mono", monospace`;
        ctx.textAlign = node.layerIdx === 0 ? 'right' : 'left';
        const offX = node.layerIdx === 0 ? -radius - 6 : radius + 6;
        ctx.fillText(`N${node.nodeIdx + 1}`, p.x + offX, p.y + 3);
      }
    });
  }

  function animationLoop() {
    if (autoRotate) targetYaw += 0.0022;
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
      wavePulseTime += 1.2;
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
# 🧠 SynapseLab: Student Code & Architecture Lab
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
      wavePulseTime += 1.5;
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
  // 8. BUY ME A COFFEE & SHARE MODALS
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
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (coffeeModal) coffeeModal.classList.remove('active');
      if (shareModal) shareModal.classList.remove('active');
      if (legalModal) legalModal.classList.remove('active');
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
        title: 'SynapseLab — Interactive Neural Network Studio for Students',
        text: 'Learn neural networks in 3D with luminous white filaments!',
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
  // 9. INITIALIZATION
  // ---------------------------------------------------------------------------
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  buildNetwork([3, 6, 2]); // Initial starting network for Guide Mode
  animationLoop();
});
