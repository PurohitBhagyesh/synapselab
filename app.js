/**
 * SynapseLab Application Engine — Inspired by OpenLid (openlid.devs.li)
 * Features:
 *   - The Eye Theme Switcher (Dark & Light)
 *   - 3D Synaptic Thread Canvas (Starts with 2 layers & 4 dots only)
 *   - Zoom In, Zoom Out, Rotate Controls
 *   - Persistent Task Labels beside each dot
 *   - Live Student Code Synchronization
 *   - Buy Me a Coffee & Share Widgets
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. THE EYE THEME SWITCHER (Dark & Light Mode)
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
    // Redraw canvas with theme-adaptive colors
    if (typeof resizeCanvas === 'function') resizeCanvas();
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
  // 3. GUIDED INSTRUCTIONS (Follow the Instruction)
  // ---------------------------------------------------------------------------
  const stepBadge = document.getElementById('stepBadge');
  const stepInstruction = document.getElementById('stepInstruction');
  const btnNextStep = document.getElementById('btnNextStep');

  let currentStep = 1;
  const steps = [
    {
      badge: "STEP 1 OF 3",
      text: "Start here: Click or hover on any of the <strong>4 dots</strong> to see what task each neuron performs.",
      btnText: "Next Task &rarr;"
    },
    {
      badge: "STEP 2 OF 3",
      text: "Click <strong>'Fire Signals'</strong> in the top nav to watch signal pulses travel across the 4 connecting threads.",
      btnText: "Next Task &rarr;"
    },
    {
      badge: "STEP 3 OF 3",
      text: "In the code editor on the left, change <code>layers = [2, 2]</code> to <code>layers = [2, 3, 2]</code> to add a hidden layer with 3 dots!",
      btnText: "Restart &orarr;"
    }
  ];

  function updateStepUI() {
    const s = steps[currentStep - 1];
    stepBadge.textContent = s.badge;
    stepInstruction.innerHTML = s.text;
    btnNextStep.innerHTML = s.btnText;
  }

  btnNextStep.addEventListener('click', () => {
    currentStep = (currentStep % steps.length) + 1;
    updateStepUI();
    if (currentStep === 2) fireWavePulses();
  });

  // ---------------------------------------------------------------------------
  // 4. 3D VISUALIZATION ENGINE (Starts with 2 layers & 4 dots only!)
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById('canvas3d');
  const ctx = canvas.getContext('2d');
  const hudTopology = document.getElementById('hudTopology');

  // Camera coordinates with smooth lerp damping
  let targetYaw = -0.32;
  let targetPitch = 0.22;
  let currentYaw = -0.32;
  let currentPitch = 0.22;
  let camDist = 620;
  let targetCamDist = 620;
  let fov = 460;
  let autoRotate = false;
  let wavePulseTime = 0;
  let isDragging = false;
  let lastX = 0, lastY = 0;

  // The 4-dot starter network
  let layerSizes = [2, 2];
  let nodes = [];
  let threads = [];
  let hoveredNode = null;

  const defaultDotTasks = [
    { name: "Input 1", task: "Reads Study Hours", formula: "x1 = 6.5h" },
    { name: "Input 2", task: "Reads Practice Tests", formula: "x2 = 2 tests" },
    { name: "Output 1", task: "Pass Probability", formula: "y1 = 88.5%" },
    { name: "Output 2", task: "Distinction Score", formula: "y2 = 74.0%" }
  ];

  function buildNetwork(sizes) {
    layerSizes = sizes;
    nodes = [];
    threads = [];

    const numLayers = layerSizes.length;
    const totalDepth = 420;
    const zStep = totalDepth / (numLayers - 1 || 1);
    let globalNodeIdx = 0;

    layerSizes.forEach((count, lIdx) => {
      const z = -totalDepth / 2 + lIdx * zStep;
      const totalH = Math.min(260, count * 70);
      const startY = -totalH / 2;
      const stepY = count > 1 ? totalH / (count - 1) : 0;

      for (let i = 0; i < count; i++) {
        let taskInfo = { name: `Dot ${globalNodeIdx + 1}`, task: "Intermediate Signal", formula: "f(w*x+b)" };
        if (lIdx === 0 && i < 2) {
          taskInfo = defaultDotTasks[i];
        } else if (lIdx === numLayers - 1 && i < 2) {
          taskInfo = defaultDotTasks[2 + i];
        }

        nodes.push({
          x: 0,
          y: count === 1 ? 0 : startY + i * stepY,
          z: z,
          layerIdx: lIdx,
          nodeIdx: i,
          globalIdx: globalNodeIdx,
          name: taskInfo.name,
          task: taskInfo.task,
          formula: taskInfo.formula
        });
        globalNodeIdx++;
      }
    });

    // Connecting threads
    for (let l = 0; l < numLayers - 1; l++) {
      const srcNodes = nodes.filter(n => n.layerIdx === l);
      const dstNodes = nodes.filter(n => n.layerIdx === l + 1);

      srcNodes.forEach((src, sIdx) => {
        dstNodes.forEach((dst, dIdx) => {
          const dz = dst.z - src.z;
          const spreadX = ((sIdx - srcNodes.length / 2) + (dIdx - dstNodes.length / 2)) * 8.0;
          const spreadY = (sIdx - dIdx) * 2.5;

          const p1 = { x: src.x + spreadX, y: src.y + spreadY, z: src.z + dz * 0.35 };
          const p2 = { x: dst.x + spreadX * 0.75, y: dst.y - spreadY * 0.5, z: src.z + dz * 0.65 };

          threads.push({
            src, dst, p1, p2,
            seed: Math.sin(sIdx * 19 + dIdx * 37),
            weight: (sIdx === dIdx ? 0.82 : -0.45)
          });
        });
      });
    }

    if (hudTopology) {
      hudTopology.textContent = layerSizes.map((c, i) => `L${i+1}: ${c} Dots`).join(" • ") + ` (${nodes.length} Dots Total)`;
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
  // 5. ZOOM, UNZOOM & ROTATE CONTROLS
  // ---------------------------------------------------------------------------
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnRotate = document.getElementById('btnRotate');
  const btnReset = document.getElementById('btnReset');

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => targetCamDist = Math.max(300, targetCamDist - 100));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => targetCamDist = Math.min(1100, targetCamDist + 100));
  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      autoRotate = !autoRotate;
      btnRotate.style.color = autoRotate ? 'var(--accent-brand)' : 'var(--text)';
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      targetYaw = -0.32;
      targetPitch = 0.22;
      targetCamDist = 620;
      autoRotate = false;
      if (btnRotate) btnRotate.style.color = 'var(--text)';
    });
  }

  // Mouse & Touch Drag
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', () => isDragging = false);

  canvas.addEventListener('mousemove', e => {
    if (isDragging) {
      targetYaw += (e.clientX - lastX) * 0.007;
      targetPitch = Math.max(-0.6, Math.min(0.85, targetPitch + (e.clientY - lastY) * 0.007));
      lastX = e.clientX;
      lastY = e.clientY;
    }
    checkNodeHover(e.clientX, e.clientY);
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    targetCamDist = Math.max(300, Math.min(1100, targetCamDist + e.deltaY * 0.6));
  }, { passive: false });

  // Touch Support
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    if (!isDragging || e.touches.length !== 1) return;
    targetYaw += (e.touches[0].clientX - lastX) * 0.007;
    targetPitch = Math.max(-0.6, Math.min(0.85, targetPitch + (e.touches[0].clientY - lastY) * 0.007));
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    checkNodeHover(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  canvas.addEventListener('touchend', () => isDragging = false);

  // Dot Hover Check
  const dotTaskCard = document.getElementById('dotTaskCard');
  const dotCardTitle = document.getElementById('dotCardTitle');
  const dotCardTask = document.getElementById('dotCardTask');
  const dotCardFormula = document.getElementById('dotCardFormula');

  function checkNodeHover(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.x;
    const py = clientY - rect.y;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    let closest = null;
    let minD = 22;

    nodes.forEach(n => {
      const p = project3D(n.x, n.y, n.z, cx, cy);
      if (p) {
        const d = Math.hypot(px - p.x, py - p.y);
        if (d < minD) {
          minD = d;
          closest = n;
        }
      }
    });

    hoveredNode = closest;
    if (closest && dotTaskCard) {
      dotCardTitle.textContent = closest.name;
      dotCardTask.textContent = `Task: ${closest.task}`;
      dotCardFormula.textContent = closest.formula;
      dotTaskCard.style.display = 'flex';
    } else if (dotTaskCard) {
      dotTaskCard.style.display = 'none';
    }
  }

  // ---------------------------------------------------------------------------
  // 6. RENDER LOOP (60 FPS)
  // ---------------------------------------------------------------------------
  function drawGridFloor(cx, cy, isDark) {
    const gridY = 190;
    const size = 380;
    const step = 60;
    ctx.lineWidth = 0.8;

    for (let z = -size; z <= size; z += step) {
      const pA = project3D(-size, gridY, z, cx, cy);
      const pB = project3D(size, gridY, z, cx, cy);
      if (pA && pB) {
        const alpha = Math.max(0, Math.min(isDark ? 0.2 : 0.12, 1 - (pA.depth + pB.depth) / 2200));
        ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
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
        const alpha = Math.max(0, Math.min(isDark ? 0.2 : 0.12, 1 - (pA.depth + pB.depth) / 2200));
        ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    }
  }

  function renderLoop() {
    if (autoRotate) targetYaw += 0.002;
    currentYaw += (targetYaw - currentYaw) * 0.08;
    currentPitch += (targetPitch - currentPitch) * 0.08;
    camDist += (targetCamDist - camDist) * 0.08;
    wavePulseTime += 0.025;

    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Floor
    drawGridFloor(cx, cy, isDark);

    // Connecting Threads
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

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Wave pulse
      const waveProg = (wavePulseTime + Math.abs(t.seed) * 2.2) % 1;
      const wx = evalCubic(t.src.x, t.p1.x, t.p2.x, t.dst.x, waveProg);
      const wy = evalCubic(t.src.y, t.p1.y, t.p2.y, t.dst.y, waveProg);
      const wz = evalCubic(t.src.z, t.p1.z, t.p2.z, t.dst.z, waveProg);
      const wp = project3D(wx, wy, wz, cx, cy);

      if (wp) {
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 2.2 * wp.scale * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#ffffff' : '#09090b';
        ctx.fill();
      }
    });

    // Layer Headers
    layerSizes.forEach((count, lIdx) => {
      const totalDepth = 420;
      const z = -totalDepth / 2 + lIdx * (totalDepth / (layerSizes.length - 1 || 1));
      const pTop = project3D(0, -165, z, cx, cy);
      if (!pTop) return;

      const w = 84 * pTop.scale * 1.5;
      const h = 28 * pTop.scale * 1.5;
      const x = pTop.x - w / 2;
      const y = pTop.y - h;

      ctx.fillStyle = isDark ? 'rgba(11, 11, 13, 0.88)' : 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = isDark ? '#ffffff' : '#09090b';
      ctx.font = `600 ${Math.max(8, Math.round(10.5 * pTop.scale * 1.5))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      const layerName = lIdx === 0 ? "Input Layer" : (lIdx === layerSizes.length - 1 ? "Output Layer" : `Hidden ${lIdx}`);
      ctx.fillText(layerName, pTop.x, y + 12 * pTop.scale * 1.5);

      ctx.fillStyle = isDark ? '#9a9aa6' : '#5a5a66';
      ctx.font = `${Math.max(7, Math.round(8.5 * pTop.scale * 1.5))}px "SF Mono", monospace`;
      ctx.fillText(`${count} Dots`, pTop.x, y + 23 * pTop.scale * 1.5);
    });

    // Depth Sorted Dots with Persistent Task Labels
    const projNodes = [];
    nodes.forEach(n => {
      const p = project3D(n.x, n.y, n.z, cx, cy);
      if (p) projNodes.push({ node: n, p });
    });
    projNodes.sort((a, b) => b.p.depth - a.p.depth);

    projNodes.forEach(({ node, p }) => {
      const isHovered = (node === hoveredNode);
      const radius = (isHovered ? 7.5 : 5.5) * p.scale * 1.5;
      const isInput = node.layerIdx === 0;

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 2.0, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#ffffff' : '#09090b');
      ctx.strokeStyle = isDark ? '#232329' : '#e4e4e9';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Persistent Task Label
      ctx.font = `600 ${Math.max(8, Math.round(9.5 * p.scale))}px -apple-system, sans-serif`;
      ctx.textAlign = isInput ? 'right' : 'left';
      const offX = isInput ? -radius - 8 : radius + 8;

      ctx.fillStyle = isDark ? '#ffffff' : '#09090b';
      ctx.fillText(node.name, p.x + offX, p.y - 3);

      ctx.fillStyle = isDark ? '#9a9aa6' : '#5a5a66';
      ctx.font = `${Math.max(7, Math.round(8.5 * p.scale))}px "SF Mono", monospace`;
      ctx.fillText(node.task, p.x + offX, p.y + 10);
    });

    requestAnimationFrame(renderLoop);
  }

  // ---------------------------------------------------------------------------
  // 7. STUDENT CODE & REBUILD LOGIC
  // ---------------------------------------------------------------------------
  const studentCode = document.getElementById('studentCode');
  const btnRunCode = document.getElementById('btnRunCode');
  const btnFireSignal = document.getElementById('btnFireSignal');

  function syncCode() {
    const match = studentCode.value.match(/layers\s*=\s*\[(.*?)\]/);
    if (match && match[1]) {
      const parsed = match[1].split(',')
        .map(n => parseInt(n.trim(), 10))
        .filter(n => !isNaN(n) && n > 0 && n <= 10);

      if (parsed.length >= 2) {
        buildNetwork(parsed);
        if (parsed.length > 2 && currentStep === 3) {
          stepBadge.textContent = "SUCCESS";
          stepInstruction.innerHTML = "Hidden layer added: <strong>" + nodes.length + " dots</strong> connected by <strong>" + threads.length + " synapses</strong>.";
        }
      }
    }
  }

  studentCode.addEventListener('input', syncCode);
  btnRunCode.addEventListener('click', syncCode);

  function fireWavePulses() {
    wavePulseTime += 0.5;
  }
  btnFireSignal.addEventListener('click', fireWavePulses);

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
        text: 'Learn neural networks step-by-step with 3D threads and interactive code!',
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
  buildNetwork([2, 2]); // 2 layers with 4 dots only
  renderLoop();
});
