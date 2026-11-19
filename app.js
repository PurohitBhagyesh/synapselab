/**
 * SynapseLab Core Engine
 * Locked Luminous White Threads • Realtime Live Coding • OpenLid Design Architecture
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
  // 2. MOBILE RESPONSIVE SWITCHER
  // ---------------------------------------------------------------------------
  const mainWorkspace = document.getElementById('mainWorkspace');
  const btnMobCode = document.getElementById('btnMobCode');
  const btnMobVis = document.getElementById('btnMobVis');

  if (btnMobCode && btnMobVis) {
    btnMobCode.addEventListener('click', () => {
      btnMobCode.classList.add('active');
      btnMobVis.classList.remove('active');
      mainWorkspace.classList.remove('show-vis');
    });

    btnMobVis.addEventListener('click', () => {
      btnMobVis.classList.add('active');
      btnMobCode.classList.remove('active');
      mainWorkspace.classList.add('show-vis');
      resizeCanvas();
    });
  }

  // ---------------------------------------------------------------------------
  // 3. STUDENT GUIDANCE SYSTEM
  // ---------------------------------------------------------------------------
  const guideStepTag = document.getElementById('guideStepTag');
  const guideMessage = document.getElementById('guideMessage');
  const btnNextGuide = document.getElementById('btnNextGuide');

  let currentGuide = 1;
  const guideSteps = [
    {
      tag: "GUIDE 1/3",
      msg: "Welcome Student! Look at the <strong>white curved filaments</strong>: they carry data signals from layer to layer in 3D.",
      btn: "Next Guide &rarr;"
    },
    {
      tag: "GUIDE 2/3",
      msg: "Notice the moving pulses: that is <strong>Forward Propagation</strong> running in real time!",
      btn: "Next Guide &rarr;"
    },
    {
      tag: "GUIDE 3/3",
      msg: "Try <strong>Live Coding</strong>: Edit <code>layers = [3, 8, 4, 1]</code> on the left to watch new threads appear live!",
      btn: "Restart &orarr;"
    }
  ];

  function updateGuideUI() {
    const g = guideSteps[currentGuide - 1];
    if (guideStepTag) guideStepTag.textContent = g.tag;
    if (guideMessage) guideMessage.innerHTML = g.msg;
    if (btnNextGuide) btnNextGuide.innerHTML = g.btn;
  }

  if (btnNextGuide) {
    btnNextGuide.addEventListener('click', () => {
      currentGuide = (currentGuide % guideSteps.length) + 1;
      updateGuideUI();
    });
  }

  // ---------------------------------------------------------------------------
  // 4. LOCKED 3D WHITE THREADS VISUALIZER (Realtime Running)
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById('canvas3d');
  const ctx = canvas.getContext('2d');
  const hudLayerInfo = document.getElementById('hudLayerInfo');
  const liveThreadCount = document.getElementById('liveThreadCount');

  // Camera state with smooth inertial lerp
  let targetYaw = -0.36;
  let targetPitch = 0.26;
  let currentYaw = -0.36;
  let currentPitch = 0.26;
  let camDist = 680;
  let targetCamDist = 680;
  let fov = 480;
  let autoRotate = true; // Rotates smoothly by default
  let wavePulseTime = 0;
  let isDragging = false;
  let lastX = 0, lastY = 0;

  // Simple, elegant, student-friendly starting network: [3, 8, 4, 1]
  let layerSizes = [3, 8, 4, 1];
  let nodes = [];
  let threads = [];

  function build3DNetwork(sizes) {
    layerSizes = sizes;
    nodes = [];
    threads = [];

    const numLayers = layerSizes.length;
    const totalDepth = 480;
    const zStep = totalDepth / (numLayers - 1 || 1);

    layerSizes.forEach((count, lIdx) => {
      const z = -totalDepth / 2 + lIdx * zStep;
      const totalH = Math.min(340, count * 42);
      const startY = -totalH / 2;
      const stepY = count > 1 ? totalH / (count - 1) : 0;

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: 0,
          y: count === 1 ? 0 : startY + i * stepY,
          z: z,
          layerIdx: lIdx,
          nodeIdx: i,
          layerName: lIdx === 0 ? "Input" : (lIdx === numLayers - 1 ? "Output" : `Hidden ${lIdx}`)
        });
      }
    });

    // Generate sweeping, curved white filaments
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

    if (hudLayerInfo) {
      hudLayerInfo.textContent = `${layerSizes.length} Layers (${nodes.length} Neurons)`;
    }
    if (liveThreadCount) {
      liveThreadCount.textContent = `${threads.length} Synaptic Threads`;
    }
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
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------------------------------------------------------------------------
  // 5. ROTATE SYMBOL & ZOOM CONTROLS
  // ---------------------------------------------------------------------------
  const btnRotateToggle = document.getElementById('btnRotateToggle');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnResetView = document.getElementById('btnResetView');

  if (btnRotateToggle) {
    btnRotateToggle.addEventListener('click', () => {
      autoRotate = !autoRotate;
      btnRotateToggle.classList.toggle('active', autoRotate);
    });
  }

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
      targetYaw = -0.36;
      targetPitch = 0.26;
      targetCamDist = 680;
      autoRotate = true;
      if (btnRotateToggle) btnRotateToggle.classList.add('active');
    });
  }

  // Mouse / Touch Drag Orbit
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    autoRotate = false;
    if (btnRotateToggle) btnRotateToggle.classList.remove('active');
  });

  window.addEventListener('mouseup', () => isDragging = false);

  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    targetYaw += (e.clientX - lastX) * 0.007;
    targetPitch = Math.max(-0.65, Math.min(0.85, targetPitch + (e.clientY - lastY) * 0.007));
    lastX = e.clientX;
    lastY = e.clientY;
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
      if (btnRotateToggle) btnRotateToggle.classList.remove('active');
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

  // ---------------------------------------------------------------------------
  // 6. PERSPECTIVE 3D RENDER LOOP (LOCKED WHITE THREADS)
  // ---------------------------------------------------------------------------
  function drawGridFloor(cx, cy) {
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
  }

  function renderLoop() {
    if (autoRotate) targetYaw += 0.0022;
    currentYaw += (targetYaw - currentYaw) * 0.08;
    currentPitch += (targetPitch - currentPitch) * 0.08;
    camDist += (targetCamDist - camDist) * 0.08;
    wavePulseTime += 0.024; // Realtime continuous signal flow

    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Grid Floor
    drawGridFloor(cx, cy);

    // 2. LOCKED WHITE CURVED FILAMENTS (Luminous Silk Fibers)
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

      // Pure glowing white threads with subtle ethereal translucency
      ctx.strokeStyle = 'rgba(240, 249, 255, 0.42)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Realtime Optical Wave Pulse traveling across the thread
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
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // 3. Floating Layer Indicator Banners (Glassmorphism)
    layerSizes.forEach((count, lIdx) => {
      const totalDepth = 480;
      const z = -totalDepth / 2 + lIdx * (totalDepth / (layerSizes.length - 1 || 1));
      const pTop = project3D(0, -180, z, cx, cy);
      if (!pTop) return;

      const w = 84 * pTop.scale * 1.5;
      const h = 28 * pTop.scale * 1.5;
      const x = pTop.x - w / 2;
      const y = pTop.y - h;

      ctx.fillStyle = 'rgba(11, 11, 13, 0.88)';
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

    // 4. Depth Sorted Glowing White Nodes
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
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

    requestAnimationFrame(renderLoop);
  }

  // ---------------------------------------------------------------------------
  // 7. LIVE CODING ENGINE (Instant Realtime Synchronisation)
  // ---------------------------------------------------------------------------
  const studentCode = document.getElementById('studentCode');
  const btnResetCode = document.getElementById('btnResetCode');

  function parseAndSyncCode() {
    const match = studentCode.value.match(/layers\s*=\s*\[(.*?)\]/);
    if (match && match[1]) {
      const parsed = match[1].split(',')
        .map(n => parseInt(n.trim(), 10))
        .filter(n => !isNaN(n) && n > 0 && n <= 18);

      if (parsed.length >= 2) {
        build3DNetwork(parsed);
      }
    }
  }

  // Synchronizes on every single keystroke live
  studentCode.addEventListener('input', parseAndSyncCode);

  if (btnResetCode) {
    btnResetCode.addEventListener('click', () => {
      studentCode.value = `# ==========================================================
# SynapseLab: Student Neural Network
# Live Coding: Edit layers below and watch threads update!
# ==========================================================

layers = [3, 8, 4, 1]
activation = "relu"
learning_rate = 0.05
epochs = 300

print(f"Network initialized: {layers}")
`;
      parseAndSyncCode();
    });
  }

  // ---------------------------------------------------------------------------
  // 8. BUY ME A COFFEE (From openlid)
  // ---------------------------------------------------------------------------
  const snackWidget = document.getElementById('snackWidget');
  const snackPillBtn = document.getElementById('snackPillBtn');
  const snackCard = document.getElementById('snackCard');
  const snackCloseBtn = document.getElementById('snackCloseBtn');
  const snackAmountInput = document.getElementById('snackAmountInput');
  const snackPresets = document.getElementById('snackPresets');
  const snackQrImg = document.getElementById('snackQrImg');
  const snackUpiCopyBtn = document.getElementById('snackUpiCopyBtn');
  const snackUpiText = document.getElementById('snackUpiText');

  const UPI_ID = 'Purohit2009@fam';
  const PAYEE_NAME = 'Shivam';

  function updateSnackQr(amount) {
    const amt = Math.max(1, parseInt(amount, 10) || 50);
    const uri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amt}&cu=INR`;
    if (snackQrImg) {
      snackQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=svg&data=${encodeURIComponent(uri)}`;
    }
  }

  if (snackPillBtn && snackCard) {
    snackPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const active = snackCard.classList.toggle('active');
      snackPillBtn.setAttribute('aria-expanded', String(active));
      if (active && snackAmountInput) updateSnackQr(snackAmountInput.value || 50);
    });

    if (snackCloseBtn) {
      snackCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        snackCard.classList.remove('active');
        snackPillBtn.setAttribute('aria-expanded', 'false');
      });
    }

    document.addEventListener('click', (e) => {
      if (snackWidget && !snackWidget.contains(e.target) && snackCard.classList.contains('active')) {
        snackCard.classList.remove('active');
        snackPillBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (snackPresets && snackAmountInput) {
    snackPresets.addEventListener('click', (e) => {
      const chip = e.target.closest('.preset-chip');
      if (!chip) return;
      const amt = chip.getAttribute('data-amt');
      snackAmountInput.value = amt;
      snackPresets.querySelectorAll('.preset-chip').forEach(b => b.classList.remove('active'));
      chip.classList.add('active');
      updateSnackQr(amt);
    });

    snackAmountInput.addEventListener('input', () => {
      const val = snackAmountInput.value;
      snackPresets.querySelectorAll('.preset-chip').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-amt') === val);
      });
      updateSnackQr(val);
    });
  }

  if (snackUpiCopyBtn && snackUpiText) {
    snackUpiCopyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(UPI_ID);
        const orig = snackUpiText.textContent;
        snackUpiText.textContent = 'Copied!';
        setTimeout(() => snackUpiText.textContent = orig, 1500);
      } catch (err) {}
    });
  }

  const upiAppButtons = document.querySelectorAll('.upi-app-btn');
  upiAppButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scheme = btn.dataset.scheme;
      const amt = Math.max(1, parseInt(snackAmountInput ? snackAmountInput.value : 50, 10) || 50);
      const query = `pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amt}&cu=INR`;
      let uri = `upi://pay?${query}`;
      if (scheme === 'famapp') uri = `in.fampay.app://upi/pay?${query}`;
      else if (scheme === 'gpay') uri = `tez://upi/pay?${query}`;
      else if (scheme === 'phonepe') uri = `phonepe://pay?${query}`;
      else if (scheme === 'paytm') uri = `paytmmp://pay?${query}`;
      else if (scheme === 'amazonpay') uri = `amazonpay://upi/pay?${query}`;
      else if (scheme === 'whatsapp') uri = `whatsapp://pay?${query}`;
      window.location.href = uri;
    });
  });

  updateSnackQr(50);

  // ---------------------------------------------------------------------------
  // 9. SHARE WIDGET (From openlid)
  // ---------------------------------------------------------------------------
  const shareWidget = document.getElementById('shareWidget');
  const sharePillBtn = document.getElementById('sharePillBtn');
  const shareCard = document.getElementById('shareCard');
  const shareCloseBtn = document.getElementById('shareCloseBtn');
  const btnShareCopy = document.getElementById('btnShareCopy');
  const shareCopyBadge = document.getElementById('shareCopyBadge');
  const btnNativeShare = document.getElementById('btnNativeShare');

  if (sharePillBtn && shareCard) {
    sharePillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const active = shareCard.classList.toggle('active');
      sharePillBtn.setAttribute('aria-expanded', String(active));
    });

    if (shareCloseBtn) {
      shareCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareCard.classList.remove('active');
        sharePillBtn.setAttribute('aria-expanded', 'false');
      });
    }

    document.addEventListener('click', (e) => {
      if (shareWidget && !shareWidget.contains(e.target) && shareCard.classList.contains('active')) {
        shareCard.classList.remove('active');
        sharePillBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (btnShareCopy) {
    btnShareCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        if (shareCopyBadge) {
          const orig = shareCopyBadge.textContent;
          shareCopyBadge.textContent = 'Copied!';
          shareCopyBadge.style.color = 'var(--emerald)';
          setTimeout(() => {
            shareCopyBadge.textContent = orig;
            shareCopyBadge.style.color = '';
          }, 1800);
        }
      } catch (err) {}
    });
  }

  if (btnNativeShare) {
    btnNativeShare.addEventListener('click', async () => {
      const shareData = {
        title: 'SynapseLab — Interactive Neural Network Lab for Students',
        text: 'Live 3D white filaments and realtime coding for neural networks!',
        url: window.location.href
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) {}
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          alert('Link copied to clipboard!');
        } catch (err) {}
      }
    });
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  build3DNetwork([3, 8, 4, 1]); // Elegant, student-friendly starter network
  renderLoop();
});
