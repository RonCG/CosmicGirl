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

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._setupInput();
  },

  startLevel(level) {
    this.level = level;
    this.shootingStars = [];
    this.caught = 0;
    this.goal = level.goal;
    this.isPlaying = true;
    this.lastSpawn = 0;
  },

  stop() {
    this.isPlaying = false;
    this.shootingStars = [];
  },

  onCatch(cb) {
    this.catchCallbacks.push(cb);
  },

  onComplete(cb) {
    this.completeCallbacks.push(cb);
  },

  _setupInput() {
    const handleInput = (x, y) => {
      if (!this.isPlaying) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const cx = (x - rect.left) * scaleX;
      const cy = (y - rect.top) * scaleY;

      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const star = this.shootingStars[i];
        const dx = star.x - cx;
        const dy = star.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = Math.max(star.size * 4, 35);

        if (dist < hitRadius) {
          // Caught!
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

    if (edge < 0.4) {
      // From top
      x = Math.random() * w;
      y = -20;
      angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5;
    } else if (edge < 0.7) {
      // From left
      x = -20;
      y = Math.random() * h * 0.5;
      angle = -Math.PI * 0.15 + Math.random() * Math.PI * 0.4;
    } else {
      // From right
      x = w + 20;
      y = Math.random() * h * 0.5;
      angle = Math.PI * 0.6 + Math.random() * Math.PI * 0.4;
    }

    const speed = this.level.shootingStarSpeed * (0.8 + Math.random() * 0.4);
    const size = 3 + Math.random() * 3;

    // Warm white to soft gold color palette
    const colors = [
      { r: 255, g: 255, b: 240 },
      { r: 255, g: 245, b: 200 },
      { r: 230, g: 220, b: 255 },
      { r: 200, g: 220, b: 255 },
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
      maxLife: 300 + Math.random() * 200,
    });
  },

  update(time, dt) {
    if (!this.isPlaying) return;

    this._spawnShootingStar(time);

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

  render() {
    const ctx = this.ctx;

    for (const star of this.shootingStars) {
      const { r, g, b } = star.color;

      // Trail
      for (let i = 0; i < star.trail.length; i++) {
        const t = star.trail[i];
        const alpha = (i / star.trail.length) * 0.5;
        const trailSize = star.size * (i / star.trail.length) * 0.6;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glow
      const glowSize = star.size * 4;
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
      glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.15)`);
      glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
