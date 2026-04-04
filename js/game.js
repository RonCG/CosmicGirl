// Game engine — shooting star spawning, movement, and catch detection

const Game = {
  shootingStars: [],
  caught: 0,
  goal: 0,
  isPlaying: false,
  level: null,
  lastSpawn: 0,
  canvas: null,
  ctx: null,
  catchCallbacks: [],
  completeCallbacks: [],
  failCallbacks: [],
  startTime: 0,
  timeRemaining: 0,

  audioCtx: null,

  // Moon easter egg
  _moonHoldTimer: null,
  _moonHolding: false,
  moonWobble: 0,
  moonFlash: 0,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._setupInput();
    this._setupMoonEasterEgg();
  },

  _getAudioCtx() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  playCatchSound() {
    try {
      const ctx = this._getAudioCtx();
      const now = ctx.currentTime;

      // Short sparkle chime — two quick tones
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.35, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.3);
      });
    } catch (e) { /* ignore audio errors */ }
  },

  playSnitchSound() {
    try {
      const ctx = this._getAudioCtx();
      const now = ctx.currentTime;

      // Magical ascending arpeggio
      [660, 880, 1100, 1320, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = i * 0.08;
        gain.gain.setValueAtTime(0.4, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.55);
      });
    } catch (e) { /* ignore audio errors */ }
  },

  startLevel(level) {
    this.level = level;
    this.shootingStars = [];
    this.caught = 0;
    this.goal = level.goal;
    this.isPlaying = true;
    this.lastSpawn = 0;
    this.startTime = 0;
    this.timeRemaining = level.timeLimit;
    this.snitch = null;
    this.snitchSpawned = false;
    // Random time between 30%-70% of the level to spawn snitch
    this.snitchSpawnAt = level.timeLimit * (0.3 + Math.random() * 0.4);
  },

  stop() {
    this.isPlaying = false;
    this.shootingStars = [];
    this.snitch = null;
  },

  onCatch(cb) {
    this.catchCallbacks.push(cb);
  },

  onComplete(cb) {
    this.completeCallbacks.push(cb);
  },

  onFail(cb) {
    this.failCallbacks.push(cb);
  },

  _setupInput() {
    const handleInput = (x, y) => {
      if (!this.isPlaying) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const cx = (x - rect.left) * scaleX;
      const cy = (y - rect.top) * scaleY;

      // Check snitch first
      if (this.snitch) {
        const s = this.snitch;
        const dx = s.x - cx;
        const dy = s.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const snitchHitRadius = this.level.hard ? 30 : 45;
        if (dist < snitchHitRadius) {
          // Caught the snitch — instant win!
          this.playSnitchSound();
          for (const cb of this.catchCallbacks) cb(s.x, s.y, this.goal, true);
          this.snitch = null;
          this.caught = this.goal;
          this.isPlaying = false;
          for (const cb of this.completeCallbacks) cb();
          return;
        }
      }

      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const star = this.shootingStars[i];
        const dx = star.x - cx;
        const dy = star.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = this.level.hard ? Math.max(star.size * 2.5, 22) : Math.max(star.size * 4, 35);

        if (dist < hitRadius) {
          // Caught!
          this.playCatchSound();
          this.shootingStars.splice(i, 1);
          this.caught++;

          for (const cb of this.catchCallbacks) cb(star.x, star.y, this.caught);

          if (this.caught >= this.goal) {
            this.isPlaying = false;
            for (const cb of this.completeCallbacks) cb();
          }
          return;
        }
      }
    };

    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        handleInput(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    // Mouse
    this.canvas.addEventListener('click', (e) => {
      handleInput(e.clientX, e.clientY);
    });
  },

  _setupMoonEasterEgg() {
    const getMoonPos = () => {
      const w = this.canvas.width;
      const h = this.canvas.height;
      return {
        x: w * 0.85,
        y: h * 0.15,
        r: Math.min(w, h) * 0.04,
      };
    };

    const isOnMoon = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const cx = (clientX - rect.left) * scaleX;
      const cy = (clientY - rect.top) * scaleY;
      const moon = getMoonPos();
      const dx = cx - moon.x;
      const dy = cy - moon.y;
      return Math.sqrt(dx * dx + dy * dy) < moon.r * 2.5;
    };

    const startHold = () => {
      if (!this.isPlaying) return;
      this._moonHolding = true;
      this._moonHoldStart = performance.now();
      // Resume AudioContext now (user gesture) so it's ready when the timer fires
      this._getAudioCtx();
      this._moonHoldTimer = setTimeout(() => {
        if (!this._moonHolding || !this.isPlaying) return;
        // Easter egg triggered — instant win
        this.playSnitchSound();
        this.moonFlash = 1.0;
        this.caught = this.goal;
        this.isPlaying = false;
        for (const cb of this.completeCallbacks) cb();
        this._moonHolding = false;
      }, 5000);
    };

    const cancelHold = () => {
      this._moonHolding = false;
      this._moonHoldStart = null;
      if (this._moonHoldTimer) {
        clearTimeout(this._moonHoldTimer);
        this._moonHoldTimer = null;
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (isOnMoon(e.clientX, e.clientY)) startHold();
    });
    this.canvas.addEventListener('mouseup', cancelHold);
    this.canvas.addEventListener('mouseleave', cancelHold);

    this.canvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      if (touch && isOnMoon(touch.clientX, touch.clientY)) startHold();
    }, { passive: true });
    this.canvas.addEventListener('touchend', cancelHold);
    this.canvas.addEventListener('touchcancel', cancelHold);
  },

  _spawnShootingStar(time) {
    if (!this.level) return;

    const elapsed = time - this.lastSpawn;
    if (elapsed < this.level.shootingStarInterval) return;
    if (this.shootingStars.length >= this.level.maxActiveStars) return;

    this.lastSpawn = time;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Determine spawn edge and direction
    const edge = Math.random();
    let x, y, angle;

    if (edge < 0.25) {
      // From top
      x = Math.random() * w;
      y = -20;
      angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5;
    } else if (edge < 0.45) {
      // From left
      x = -20;
      y = Math.random() * h * 0.75;
      angle = -Math.PI * 0.2 + Math.random() * Math.PI * 0.5;
    } else if (edge < 0.65) {
      // From right
      x = w + 20;
      y = Math.random() * h * 0.75;
      angle = Math.PI * 0.55 + Math.random() * Math.PI * 0.5;
    } else if (edge < 0.75) {
      // From bottom (moving up)
      x = w * 0.15 + Math.random() * w * 0.7;
      y = h + 20;
      angle = -Math.PI * 0.25 - Math.random() * Math.PI * 0.5;
    } else if (edge < 0.875) {
      // From bottom-left (moving up-right)
      x = Math.random() * w * 0.4;
      y = h * 0.7 + Math.random() * h * 0.3;
      angle = -Math.PI * 0.15 + Math.random() * Math.PI * 0.3;
    } else {
      // From bottom-right (moving up-left)
      x = w * 0.6 + Math.random() * w * 0.4;
      y = h * 0.7 + Math.random() * h * 0.3;
      angle = Math.PI * 0.65 + Math.random() * Math.PI * 0.3;
    }

    const speed = this.level.shootingStarSpeed * (0.8 + Math.random() * 0.4);
    const size = 4 + Math.random() * 3;

    // Golden yellow palette — her favorite color
    const colors = [
      { r: 255, g: 215, b: 0 },   // gold
      { r: 255, g: 200, b: 30 },   // warm gold
      { r: 255, g: 230, b: 50 },   // bright yellow
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.shootingStars.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      color,
      trail: [],
      life: 0,
      maxLife: (this.level.starMaxLife || 300) + Math.random() * 100,
      sparkleOffset: Math.random() * Math.PI * 2,
    });
  },

  update(time, dt) {
    if (!this.isPlaying) return;

    // Init start time on first update
    if (this.startTime === 0) this.startTime = time;

    // Update timer
    const elapsed = (time - this.startTime) / 1000;
    this.timeRemaining = Math.max(0, this.level.timeLimit - elapsed);

    // Check time's up
    if (this.timeRemaining <= 0 && this.caught < this.goal) {
      this.isPlaying = false;
      for (const cb of this.failCallbacks) cb();
      return;
    }

    // Moon wobble when holding
    if (this._moonHolding && this._moonHoldStart) {
      const holdTime = (performance.now() - this._moonHoldStart) / 1000;
      this.moonWobble = Math.sin(holdTime * 8) * (holdTime / 5) * 6;
    } else {
      this.moonWobble *= 0.9; // ease back
    }

    this._spawnShootingStar(time);
    this._updateSnitch(time, dt);

    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const star = this.shootingStars[i];

      // Store trail
      star.trail.push({ x: star.x, y: star.y });
      if (star.trail.length > 20) star.trail.shift();

      // Move
      star.x += star.vx * dt * 60;
      star.y += star.vy * dt * 60;
      star.life++;

      // Remove if off screen or expired
      if (star.x < -50 || star.x > w + 50 || star.y < -50 || star.y > h + 50 || star.life > star.maxLife) {
        this.shootingStars.splice(i, 1);
      }
    }
  },

  _updateSnitch(time, dt) {
    const elapsed = (time - this.startTime) / 1000;

    // Spawn snitch once at the scheduled time
    if (!this.snitchSpawned && elapsed >= this.snitchSpawnAt) {
      this.snitchSpawned = true;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const hard = this.level.hard;
      this.snitch = {
        x: w * 0.5,
        y: h * 0.3,
        vx: (Math.random() - 0.5) * (hard ? 12 : 8),
        vy: (Math.random() - 0.5) * (hard ? 12 : 8),
        born: time,
        life: hard ? 3000 : 4500,
        nextDirChange: time + (hard ? 150 : 300),
        wingPhase: 0,
        hard,
      };
    }

    if (!this.snitch) return;
    const s = this.snitch;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Erratic direction changes
    if (time > s.nextDirChange) {
      const jerk = s.hard ? 18 : 12;
      s.vx += (Math.random() - 0.5) * jerk;
      s.vy += (Math.random() - 0.5) * jerk;
      // Clamp speed
      const maxSpeed = s.hard ? 14 : 10;
      const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (spd > maxSpeed) {
        s.vx = (s.vx / spd) * maxSpeed;
        s.vy = (s.vy / spd) * maxSpeed;
      }
      s.nextDirChange = time + (s.hard ? 80 + Math.random() * 120 : 150 + Math.random() * 250);
    }

    // Move
    s.x += s.vx * dt * 60;
    s.y += s.vy * dt * 60;

    // Bounce off edges (keep it on screen)
    const margin = 40;
    if (s.x < margin) { s.x = margin; s.vx = Math.abs(s.vx); }
    if (s.x > w - margin) { s.x = w - margin; s.vx = -Math.abs(s.vx); }
    if (s.y < margin) { s.y = margin; s.vy = Math.abs(s.vy); }
    if (s.y > h - margin) { s.y = h - margin; s.vy = -Math.abs(s.vy); }

    // Wing flutter
    s.wingPhase = time * 0.02;

    // Remove after lifespan
    if (time - s.born > s.life) {
      this.snitch = null;
    }
  },

  render() {
    const ctx = this.ctx;
    const time = performance.now();

    for (const star of this.shootingStars) {
      const { r, g, b } = star.color;

      // Trail — warm gold fading to red
      for (let i = 0; i < star.trail.length; i++) {
        const t = star.trail[i];
        const progress = i / star.trail.length;
        const alpha = progress * 0.6;
        const trailSize = star.size * progress * 0.7;
        // Shift from red at tail to gold at head
        const tr = 255;
        const tg = Math.round(80 + progress * (g - 80));
        const tb = Math.round(0 + progress * b);
        ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer red/warm glow
      const outerGlow = star.size * 8;
      const og = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, outerGlow);
      og.addColorStop(0, `rgba(255, 150, 30, 0.25)`);
      og.addColorStop(0.4, `rgba(255, 80, 20, 0.08)`);
      og.addColorStop(1, `rgba(255, 50, 10, 0)`);
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(star.x, star.y, outerGlow, 0, Math.PI * 2);
      ctx.fill();

      // Inner gold glow
      const glowSize = star.size * 4;
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.7)`);
      glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.2)`);
      glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // 4-point sparkle
      const sparkle = Math.sin(time * 0.005 + star.sparkleOffset) * 0.3 + 0.7;
      const spikeLen = star.size * 3 * sparkle;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.lineWidth = 1.5;
      for (let a = 0; a < 4; a++) {
        const angle = (a * Math.PI) / 2 + time * 0.001;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x + Math.cos(angle) * spikeLen, star.y + Math.sin(angle) * spikeLen);
        ctx.stroke();
      }

      // Bright core
      ctx.fillStyle = `rgba(255, 255, 220, 1)`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Gold ring
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render snitch
    this._renderSnitch(time);
  },

  _renderSnitch(time) {
    if (!this.snitch) return;
    const ctx = this.ctx;
    const s = this.snitch;
    const age = time - s.born;

    // Fade in/out
    let alpha = 1;
    if (age < 400) alpha = age / 400;
    if (age > s.life - 600) alpha = Math.max(0, (s.life - age) / 600);

    const sz = 8;

    // Outer golden aura
    const aura = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, sz * 6);
    aura.addColorStop(0, `rgba(255, 215, 0, ${0.3 * alpha})`);
    aura.addColorStop(0.5, `rgba(255, 180, 0, ${0.1 * alpha})`);
    aura.addColorStop(1, `rgba(255, 150, 0, 0)`);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(s.x, s.y, sz * 6, 0, Math.PI * 2);
    ctx.fill();

    // Wings — two curved shapes that flutter
    const wingFlap = Math.sin(s.wingPhase) * 0.6;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.globalAlpha = alpha * 0.85;

    // Left wing
    ctx.save();
    ctx.rotate(-0.3 + wingFlap);
    ctx.translate(-sz * 1.2, 0);
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 1.8, sz * 0.6, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.rotate(0.3 - wingFlap);
    ctx.translate(sz * 1.2, 0);
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 1.8, sz * 0.6, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = alpha;

    // Golden sphere body
    const bodyGrad = ctx.createRadialGradient(-sz * 0.3, -sz * 0.3, 0, 0, 0, sz);
    bodyGrad.addColorStop(0, '#FFF8DC');
    bodyGrad.addColorStop(0.4, '#FFD700');
    bodyGrad.addColorStop(0.8, '#DAA520');
    bodyGrad.addColorStop(1, '#B8860B');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sz, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
    ctx.beginPath();
    ctx.arc(-sz * 0.3, -sz * 0.3, sz * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },
};
