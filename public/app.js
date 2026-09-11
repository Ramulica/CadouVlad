(() => {
  const STARTING_SPINS = 1000;
  const STORAGE_KEY = "casino-vlad-spins";

  const REWARDS = [
    {
      id: "pupic",
      label: "Pupic",
      color: "#c41e3a",
      text: "#fff3d6",
      image: "/assets/rewards/pupic.svg",
      copy: "Un pupic meritat. Colectează imediat.",
    },
    {
      id: "imbratisare",
      label: "Îmbrățișare",
      color: "#1a6b4a",
      text: "#fff3d6",
      image: "/assets/rewards/imbratisare.svg",
      copy: "O îmbrățișare caldă — jackpot emoțional.",
    },
    {
      id: "mangaiere",
      label: "Mângâiere",
      color: "#2a3d8f",
      text: "#fff3d6",
      image: "/assets/rewards/mangaiere.svg",
      copy: "Mângâiere premium. Limită zilnică: unlimited.",
    },
    {
      id: "backshots",
      label: "Backshots",
      color: "#7a1fa2",
      text: "#fff3d6",
      image: "/assets/rewards/backshots.svg",
      copy: "Premiul VIP. Ai lovit jackpotul.",
    },
  ];

  // 8 segments — each reward twice for a fuller casino wheel
  const SEGMENTS = [
    REWARDS[0],
    REWARDS[1],
    REWARDS[2],
    REWARDS[3],
    REWARDS[0],
    REWARDS[1],
    REWARDS[2],
    REWARDS[3],
  ];

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");
  const spinsDisplay = document.querySelector(".spins-chip__value");
  const winModal = document.getElementById("winModal");
  const winTitle = document.getElementById("winTitle");
  const winImage = document.getElementById("winImage");
  const winCopy = document.getElementById("winCopy");
  const claimBtn = document.getElementById("claimBtn");
  const rewardRail = document.getElementById("rewardRail");
  const confettiCanvas = document.getElementById("confetti");
  const confettiCtx = confettiCanvas.getContext("2d");
  const sparkles = document.getElementById("sparkles");
  const wheelLights = document.getElementById("wheelLights");

  let spins = loadSpins();
  let rotation = 0;
  let spinning = false;
  let confettiPieces = [];
  let confettiRaf = null;

  function loadSpins() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, String(STARTING_SPINS));
      return STARTING_SPINS;
    }
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : STARTING_SPINS;
  }

  function saveSpins() {
    localStorage.setItem(STORAGE_KEY, String(spins));
  }

  function updateSpinsUI() {
    spinsDisplay.textContent = String(spins);
    spinBtn.disabled = spinning || spins <= 0;
  }

  function makeSparkles() {
    const count = 40;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.setProperty("--dur", `${1.8 + Math.random() * 2.5}s`);
      s.style.setProperty("--delay", `${Math.random() * 3}s`);
      sparkles.appendChild(s);
    }
  }

  function makeLights() {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const bulb = document.createElement("span");
      bulb.className = "wheel-light";
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const r = 48.5;
      bulb.style.left = `${50 + Math.cos(angle) * r}%`;
      bulb.style.top = `${50 + Math.sin(angle) * r}%`;
      wheelLights.appendChild(bulb);
    }
  }

  function renderRewardRail() {
    rewardRail.innerHTML = REWARDS.map(
      (r) => `
      <article class="reward-tile" data-id="${r.id}">
        <img class="reward-tile__img" src="${r.image}" alt="${r.label}" />
        <span class="reward-tile__name">${r.label}</span>
      </article>`
    ).join("");
  }

  function drawWheel() {
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const arc = (Math.PI * 2) / SEGMENTS.length;

    ctx.clearRect(0, 0, size, size);

    SEGMENTS.forEach((seg, i) => {
      const start = rotation + i * arc;
      const end = start + arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      ctx.strokeStyle = "rgba(245, 200, 66, 0.85)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // inner shine wedge
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.clip();
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius);
      grad.addColorStop(0, "rgba(255,255,255,0.18)");
      grad.addColorStop(0.55, "rgba(255,255,255,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = seg.text;
      ctx.font = "bold 28px Oswald, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 6;
      ctx.fillText(seg.label.toUpperCase(), radius - 28, 8);
      ctx.restore();
    });

    // center hub ring
    ctx.beginPath();
    ctx.arc(cx, cy, 58, 0, Math.PI * 2);
    ctx.fillStyle = "#12080f";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f5c842";
    ctx.stroke();
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function getWinningIndex(finalRotation) {
    const arc = (Math.PI * 2) / SEGMENTS.length;
    // pointer is at top (-π/2). Normalize so segment under pointer wins.
    const normalized = ((Math.PI * 1.5 - (finalRotation % (Math.PI * 2))) + Math.PI * 2) % (Math.PI * 2);
    return Math.floor(normalized / arc) % SEGMENTS.length;
  }

  function playTick() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!playTick.ctx) playTick.ctx = new AudioCtx();
      const ctxA = playTick.ctx;
      const o = ctxA.createOscillator();
      const g = ctxA.createGain();
      o.type = "square";
      o.frequency.value = 880 + Math.random() * 220;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctxA.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.05);
      o.stop(ctxA.currentTime + 0.05);
    } catch (_) {
      /* ignore audio errors */
    }
  }

  function playWinFanfare() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctxA = playTick.ctx || new AudioCtx();
      playTick.ctx = ctxA;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const o = ctxA.createOscillator();
        const g = ctxA.createGain();
        o.type = "triangle";
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctxA.destination);
        const t = ctxA.currentTime + i * 0.12;
        o.start(t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.stop(t + 0.3);
      });
    } catch (_) {
      /* ignore */
    }
  }

  function spin() {
    if (spinning || spins <= 0) return;

    spins -= 1;
    saveSpins();
    updateSpinsUI();
    spinning = true;
    spinBtn.classList.add("is-spinning");

    const arc = (Math.PI * 2) / SEGMENTS.length;
    const targetIndex = Math.floor(Math.random() * SEGMENTS.length);
    const extraTurns = 5 + Math.floor(Math.random() * 4);
    // Align segment center under pointer at -π/2
    const targetAngle =
      Math.PI * 1.5 - (targetIndex * arc + arc / 2) - (rotation % (Math.PI * 2));
    const normalizedTarget = ((targetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const totalDelta = extraTurns * Math.PI * 2 + normalizedTarget;

    const start = rotation;
    const duration = 4500 + Math.random() * 1200;
    const t0 = performance.now();
    let lastSeg = -1;

    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = easeOutCubic(t);
      rotation = start + totalDelta * eased;
      drawWheel();

      const currentSeg = Math.floor(
        (((Math.PI * 1.5 - (rotation % (Math.PI * 2))) + Math.PI * 2) % (Math.PI * 2)) / arc
      );
      if (currentSeg !== lastSeg) {
        lastSeg = currentSeg;
        playTick();
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        spinning = false;
        spinBtn.classList.remove("is-spinning");
        const winIndex = getWinningIndex(rotation);
        const reward = SEGMENTS[winIndex];
        showWin(reward);
        updateSpinsUI();
      }
    }

    requestAnimationFrame(frame);
  }

  function highlightReward(id) {
    document.querySelectorAll(".reward-tile").forEach((el) => {
      el.classList.toggle("is-hot", el.dataset.id === id);
    });
  }

  function showWin(reward) {
    winTitle.textContent = reward.label;
    winImage.src = reward.image;
    winImage.alt = reward.label;
    winCopy.textContent = reward.copy;
    winModal.hidden = false;
    highlightReward(reward.id);
    playWinFanfare();
    launchConfetti();
  }

  function hideWin() {
    winModal.hidden = true;
    stopConfetti();
  }

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function launchConfetti() {
    resizeConfetti();
    const colors = ["#f5c842", "#ff2d55", "#00f5d4", "#ff4ecd", "#ffffff", "#ffe566"];
    confettiPieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * confettiCanvas.height * 0.4,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    if (confettiRaf) cancelAnimationFrame(confettiRaf);

    function tick() {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiPieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rot += p.vr;
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rot);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confettiCtx.restore();
      });
      confettiPieces = confettiPieces.filter((p) => p.y < confettiCanvas.height + 40);
      if (confettiPieces.length) {
        confettiRaf = requestAnimationFrame(tick);
      }
    }
    confettiRaf = requestAnimationFrame(tick);
  }

  function stopConfetti() {
    if (confettiRaf) cancelAnimationFrame(confettiRaf);
    confettiRaf = null;
    confettiPieces = [];
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  // Placeholder SVG generators — replace files in /assets/rewards/ later
  // (already shipping as static SVGs)

  spinBtn.addEventListener("click", spin);
  claimBtn.addEventListener("click", hideWin);
  winModal.querySelector(".modal__backdrop").addEventListener("click", hideWin);
  window.addEventListener("resize", () => {
    if (!winModal.hidden) resizeConfetti();
  });

  makeSparkles();
  makeLights();
  renderRewardRail();
  drawWheel();
  updateSpinsUI();
})();
