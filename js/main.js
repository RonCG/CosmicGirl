// Main game controller — ties everything together

const GisGame = {
  canvas: null,
  ctx: null,
  currentLevel: 0,
  lastTime: 0,
  running: false,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    Astronomy.init();
    Sky.init(this.canvas);
    Decorations.init(this.canvas);
    Game.init(this.canvas);
    UI.init();

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Bind events
    document.getElementById('startBtn').addEventListener('click', () => this.onStart());
    document.getElementById('playBtn').addEventListener('click', () => this.onPlay());
    document.getElementById('nextLevelBtn').addEventListener('click', () => this.onNextLevel());

    Game.onCatch((x, y, caught) => {
      UI.updateHud(caught);
      // Convert canvas coords to screen coords for catch effect
      const rect = this.canvas.getBoundingClientRect();
      const screenX = (x / this.canvas.width) * rect.width + rect.left;
      const screenY = (y / this.canvas.height) * rect.height + rect.top;
      UI.spawnCatchEffect(screenX, screenY);
    });

    Game.onComplete(() => {
      setTimeout(() => {
        UI.hideHud();
        const level = LEVELS[this.currentLevel];
        if (level.isFinalLevel) {
          this.showFinale();
        } else {
          UI.showLevelComplete(level);
        }
      }, 600);
    });

    // Show title
    Decorations.showTitle();
    UI.showScreen('title');

    // Start render loop
    this.running = true;
    requestAnimationFrame((t) => this.loop(t));
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;

    // Regenerate sky if we have a current level
    if (this.currentLevel < LEVELS.length) {
      Sky.generate(LEVELS[this.currentLevel].date);
    }
    Decorations.resize();
  },

  onStart() {
    this.currentLevel = 0;
    UI.fadeOut('title').then(() => {
      this.showLevelIntro();
    });
  },

  showLevelIntro() {
    const level = LEVELS[this.currentLevel];
    Sky.generate(level.date);
    Decorations.setLevel(this.currentLevel);
    UI.showLevelIntro(level, this.currentLevel);
  },

  onPlay() {
    UI.fadeOut('levelIntro').then(() => {
      const level = LEVELS[this.currentLevel];
      Game.startLevel(level);
      UI.showHud(level, this.currentLevel);
    });
  },

  onNextLevel() {
    this.currentLevel++;
    if (this.currentLevel >= LEVELS.length) {
      this.showFinale();
      return;
    }
    UI.fadeOut('levelComplete').then(() => {
      this.showLevelIntro();
    });
  },

  showFinale() {
    Game.stop();
    const finalLevel = LEVELS[LEVELS.length - 1];
    Sky.generate(finalLevel.date);

    // Start the finale star animation
    this.finaleStartTime = performance.now();
    this.finaleStars = this._createFinaleStars();
    this.finalePhase = 'gathering'; // gathering -> spelling -> reveal

    UI.showScreen('finale');

    // After stars gather and spell out, show the text
    setTimeout(() => {
      this.finalePhase = 'spelling';
    }, 2000);

    setTimeout(() => {
      this.finalePhase = 'reveal';
      const msg = document.getElementById('finaleMessage');
      msg.textContent = '¿Quieres ser mi novia, Giselle?';
      msg.classList.add('visible');
    }, 5000);
  },

  _createFinaleStars() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const stars = [];

    // Create stars that will form a heart shape
    const heartPoints = this._getHeartPoints(w / 2, h * 0.35, Math.min(w, h) * 0.25, 60);

    for (const point of heartPoints) {
      stars.push({
        // Start from random positions
        startX: Math.random() * w,
        startY: Math.random() * h,
        // End at heart position
        endX: point.x,
        endY: point.y,
        x: Math.random() * w,
        y: Math.random() * h,
        size: 2 + Math.random() * 2,
        brightness: 0.5 + Math.random() * 0.5,
      });
    }
    return stars;
  },

  _getHeartPoints(cx, cy, size, count) {
    const points = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      points.push({
        x: cx + x * (size / 16),
        y: cy + y * (size / 16),
      });
    }
    return points;
  },

  _renderFinaleStars(time) {
    if (!this.finaleStars) return;
    const ctx = this.ctx;
    const elapsed = (time - this.finaleStartTime) / 1000;

    for (const star of this.finaleStars) {
      let progress = 0;

      if (this.finalePhase === 'gathering' || this.finalePhase === 'spelling' || this.finalePhase === 'reveal') {
        progress = Math.min(1, elapsed / 4);
        // Ease out cubic
        progress = 1 - Math.pow(1 - progress, 3);
      }

      star.x = star.startX + (star.endX - star.startX) * progress;
      star.y = star.startY + (star.endY - star.startY) * progress;

      // Twinkle
      const twinkle = Math.sin(time * 0.003 + star.endX) * 0.2;
      const alpha = star.brightness + twinkle;

      // Glow
      const glowSize = star.size * 4;
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
      glow.addColorStop(0, `rgba(255, 230, 200, ${alpha * 0.4})`);
      glow.addColorStop(1, `rgba(255, 230, 200, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(255, 240, 220, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  loop(time) {
    if (!this.running) return;

    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Don't update with huge dt (e.g., tab was in background)
    const safeDt = Math.min(dt, 0.1);

    // Render sky
    Sky.render(time);

    // Render level decorations (during intro and gameplay, not finale)
    if (!this.finalePhase) {
      Decorations.render(time);
    }

    // Render game elements
    if (Game.isPlaying) {
      Game.update(time, safeDt);
      Game.render();
    }

    // Render finale stars
    if (this.finalePhase) {
      this._renderFinaleStars(time);
    }

    requestAnimationFrame((t) => this.loop(t));
  },
};

// Start when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  GisGame.init();
});
