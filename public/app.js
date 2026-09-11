(() => {
  const STARTING_SPINS = 1000;
  const STORAGE_KEY = "casino-vlad-spins";
  const BASE_SIZE = 560;

  const REWARDS = [
    {
      id: "backshots",
      label: "Back Shots",
      color: "#c41e3a",
      text: "#fff3d6",
      image: "/assets/rewards/backshots.png",
      copy: "Jackpotul clasic. Colectează Back Shots.",
    },
    {
      id: "lap-dance",
      label: "Lap Dance",
      color: "#1a6b4a",
      text: "#fff3d6",
      image: "/assets/rewards/lap-dance.png",
      copy: "Show privat pe scaun. Lap Dance unlocked.",
    },
    {
      id: "big-hug",
      label: "Bear Hug",
      color: "#2a3d8f",
      text: "#fff3d6",
      image: "/assets/rewards/big-hug.png",
      copy: "Îmbrățișare epică. Bear Hug unlocked.",
    },
    {
      id: "handshake",
      label: "Hand Sacke",
      color: "#7a1fa2",
      text: "#fff3d6",
      image: "/assets/rewards/handshake.png",
      copy: "Respect. Hand Sacke oficial.",
    },
    {
      id: "threesome",
      label: "3 Some",
      color: "#b85c00",
      text: "#fff3d6",
      image: "/assets/rewards/threesome.png",
      copy: "Party de trei. 3 Some confirmat.",
    },
    {
      id: "suguluta",
      label: "o Suguluta",
      color: "#8b1e3f",
      text: "#fff3d6",
      image: "/assets/rewards/suguluta.png",
      copy: "Premiu special: o Suguluță.",
    },
    {
      id: "gangbang",
      label: "Gang Bang",
      color: "#0e5c5c",
      text: "#fff3d6",
      image: "/assets/rewards/gangbang.png",
      copy: "Full lobby. Gang Bang activat.",
    },
    {
      id: "sexposition",
      label: "SexPosition.club",
      color: "#4a148c",
      text: "#fff3d6",
      image: "/assets/rewards/sexposition.png",
      copy: "Catalog VIP de pe SexPosition.club.",
    },
    {
      id: "romantic-date",
      label: "Romantic Date",
      color: "#a61b4a",
      text: "#fff3d6",
      image: "/assets/rewards/romantic-date.png",
      copy: "Cină la lumina lumânărilor. Romantic Date.",
    },
    {
      id: "sabiutele",
      label: "Sabiutele cy Pula",
      color: "#1b4f72",
      text: "#fff3d6",
      image: "/assets/rewards/sabiutele.png",
      copy: "Duel legendar: Sabiutele cy Pula.",
    },
  ];

  const SEGMENTS = REWARDS.slice();
  const ARC = (Math.PI * 2) / SEGMENTS.length;
  const CONFETTI_COLORS = ["#f5c842", "#ff2d55", "#00f5d4", "#ff4ecd", "#ffffff", "#ffe566"];

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const rotator = document.getElementById("wheelRotator");
  const spinBtn = document.getElementById("spinBtn");
  const spinsDisplay = document.querySelector(".spins-chip__value");
  const winModal = document.getElementById("winModal");
  const winTitle = document.getElementById("winTitle");
  const winImage = document.getElementById("winImage");
  const winCopy = document.getElementById("winCopy");
  const claimBtn = document.getElementById("claimBtn");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const rewardRail = document.getElementById("rewardRail");
  const confettiLayer = document.getElementById("confetti");

  let spins = loadSpins();
  let rotationDeg = 0;
  let spinning = false;
  let audioCtx = null;
  /** @type {Record<string, HTMLImageElement>} */
  const images = {};

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

  function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(BASE_SIZE * dpr);
    canvas.height = Math.round(BASE_SIZE * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loadImages() {
    return Promise.all(
      REWARDS.map(
        (r) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              images[r.id] = img;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = r.image;
          })
      )
    );
  }

  /** Fit full image inside box — no cropping */
  function drawContainImage(img, dx, dy, dw, dh) {
    const ir = img.width / img.height;
    const tr = dw / dh;
    let w = dw;
    let h = dh;
    let x = dx;
    let y = dy;
    if (ir > tr) {
      h = dw / ir;
      y = dy + (dh - h) / 2;
    } else {
      w = dh * ir;
      x = dx + (dw - w) / 2;
    }
    ctx.drawImage(img, x, y, w, h);
  }

  function paintWheel() {
    const size = BASE_SIZE;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;
    const hub = 54;

    ctx.fillStyle = "#1a0a12";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < SEGMENTS.length; i++) {
      const seg = SEGMENTS[i];
      const start = i * ARC;
      const end = start + ARC;
      const mid = start + ARC / 2;
      const img = images[seg.id];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = seg.color;
      ctx.fill();

      if (img) {
        // Full photo in the wedge — contain, no crop
        const photoR = radius * 0.58;
        const px = cx + Math.cos(mid) * photoR;
        const py = cy + Math.sin(mid) * photoR;
        const boxW = radius * 0.5;
        const boxH = radius * 0.38;

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(px - boxW / 2, py - boxH / 2, boxW, boxH);
        drawContainImage(img, px - boxW / 2, py - boxH / 2, boxW, boxH);

        ctx.strokeStyle = "#f5c842";
        ctx.lineWidth = 2;
        ctx.strokeRect(px - boxW / 2, py - boxH / 2, boxW, boxH);
      }

      // dark strip near rim for text readability
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, end);
      ctx.arc(cx, cy, radius * 0.78, end, start, true);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fill();

      ctx.restore();

      // segment border
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.strokeStyle = "#f5c842";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // full name along segment
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const fontSize = seg.label.length > 14 ? 11 : seg.label.length > 10 ? 12 : 13;
      ctx.font = `700 ${fontSize}px Oswald, sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(seg.label, radius - 10, 0);
      ctx.fillStyle = "#fff3d6";
      ctx.fillText(seg.label, radius - 10, 0);
      ctx.restore();
    }

    // center hub
    ctx.beginPath();
    ctx.arc(cx, cy, hub, 0, Math.PI * 2);
    ctx.fillStyle = "#12080f";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f5c842";
    ctx.stroke();
  }

  function setRotator(deg, withTransition, durationMs) {
    if (!withTransition) {
      rotator.style.transition = "none";
    } else {
      rotator.style.transition = `transform ${durationMs}ms cubic-bezier(0.15, 0.85, 0.05, 1)`;
    }
    rotator.style.transform = `rotate(${deg}deg)`;
  }

  function getWinningIndex(deg) {
    const rad = ((deg % 360) * Math.PI) / 180;
    const normalized =
      (((Math.PI * 1.5 - rad) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return Math.floor(normalized / ARC) % SEGMENTS.length;
  }

  function ensureAudio() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    return audioCtx;
  }

  function playWinFanfare() {
    try {
      const a = ensureAudio();
      if (!a) return;
      if (a.state === "suspended") a.resume();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "triangle";
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(a.destination);
        const t = a.currentTime + i * 0.1;
        o.start(t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.stop(t + 0.25);
      });
    } catch (_) {
      /* ignore */
    }
  }

  function renderRewardRail() {
    rewardRail.innerHTML = REWARDS.map(
      (r) => `
      <article class="reward-tile" data-id="${r.id}">
        <img class="reward-tile__img" src="${r.image}" alt="${r.label}" loading="lazy" />
        <span class="reward-tile__name">${r.label}</span>
      </article>`
    ).join("");
  }

  function spin() {
    if (spinning || spins <= 0) return;

    spins -= 1;
    saveSpins();
    spinning = true;
    document.body.classList.add("is-spinning");
    updateSpinsUI();

    const targetIndex = Math.floor(Math.random() * SEGMENTS.length);
    const extraTurns = 6 + Math.floor(Math.random() * 4);
    const duration = 4200 + Math.floor(Math.random() * 800);

    const segmentCenterDeg = ((targetIndex + 0.5) * 360) / SEGMENTS.length;
    const desiredMod = (((-90 - segmentCenterDeg) % 360) + 360) % 360;
    const currentMod = ((rotationDeg % 360) + 360) % 360;
    let delta = desiredMod - currentMod;
    if (delta < 0) delta += 360;
    const totalDelta = extraTurns * 360 + delta;
    const finalDeg = rotationDeg + totalDelta;

    setRotator(rotationDeg, false, 0);
    void rotator.offsetWidth;
    setRotator(finalDeg, true, duration);

    const onEnd = (e) => {
      if (e.propertyName !== "transform") return;
      rotator.removeEventListener("transitionend", onEnd);
      rotationDeg = finalDeg;
      spinning = false;
      document.body.classList.remove("is-spinning");
      updateSpinsUI();
      showWin(SEGMENTS[getWinningIndex(rotationDeg)]);
    };

    rotator.addEventListener("transitionend", onEnd);
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
    burstConfetti();
  }

  function hideWin() {
    winModal.hidden = true;
    confettiLayer.replaceChildren();
  }

  function burstConfetti() {
    confettiLayer.replaceChildren();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 36; i++) {
      const el = document.createElement("span");
      el.className = "confetti-piece";
      el.style.left = `${Math.random() * 100}%`;
      el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      el.style.setProperty("--dx", `${-40 + Math.random() * 80}px`);
      el.style.setProperty("--rot", `${200 + Math.random() * 520}deg`);
      el.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
      el.style.animationDelay = `${Math.random() * 0.25}s`;
      frag.appendChild(el);
    }
    confettiLayer.appendChild(frag);
    window.setTimeout(() => confettiLayer.replaceChildren(), 2800);
  }

  spinBtn.addEventListener("click", spin);
  claimBtn.addEventListener("click", hideWin);
  modalBackdrop.addEventListener("click", hideWin);

  setupCanvas();
  setRotator(0, false, 0);
  renderRewardRail();
  updateSpinsUI();
  spinBtn.disabled = true;

  loadImages().then(() => {
    paintWheel();
    updateSpinsUI();
  });
})();
