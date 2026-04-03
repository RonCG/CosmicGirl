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
    Decorations.setLevel(-1); // hide level decorations
    const finalLevel = LEVELS[LEVELS.length - 1];
    Sky.generate(finalLevel.date);

    UI.showScreen('finale');
    this._finaleStep(0);
  },

  _finaleStep(step) {
    const content = document.getElementById('finaleContent');
    const msg = document.getElementById('finaleMessage');
    msg.textContent = '';
    msg.classList.remove('visible');

    // Clear any previous step content (but keep finaleMessage div)
    const old = content.querySelector('.finale-step');
    if (old) old.remove();

    const div = document.createElement('div');
    div.className = 'finale-step';
    content.insertBefore(div, msg);

    switch (step) {
      // Step 0: "Did you enjoy the game?"
      case 0: {
        div.innerHTML = `
          <p class="finale-step-text">¿Te gustó el juego?</p>
          <div class="finale-buttons">
            <button class="cosmic-btn" id="finYes">¡Sí!</button>
            <button class="no-btn" id="finNo">No</button>
          </div>
        `;
        const yesBtn = div.querySelector('#finYes');
        const noBtn = div.querySelector('#finNo');
        let noAttempts = 0;

        yesBtn.addEventListener('click', () => this._finaleStep(1));

        // No button: escapes on mouse, funny message on touch
        const escapeNo = () => {
          noAttempts++;
          if (noAttempts >= 3) {
            noBtn.textContent = '¡Selecciona Sí!';
            noBtn.style.pointerEvents = 'none';
            noBtn.style.opacity = '0.2';
            return;
          }
          noBtn.classList.add('escaping');
          const maxX = window.innerWidth - 120;
          const maxY = window.innerHeight - 60;
          noBtn.style.left = (Math.random() * maxX) + 'px';
          noBtn.style.top = (Math.random() * maxY) + 'px';
        };

        noBtn.addEventListener('mouseenter', escapeNo);
        noBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          escapeNo();
        });
        break;
      }

      // Step 1: "Thanks for playing"
      case 1: {
        div.innerHTML = `
          <p class="finale-step-text">Gracias por jugar este juego<br>hecho con mucho cariño por Ron.</p>
          <p class="finale-step-subtext">~ Fin ~</p>
          <button class="cosmic-btn" id="finNext1">...</button>
        `;
        div.querySelector('#finNext1').addEventListener('click', () => this._finaleStep(2));
        break;
      }

      // Step 2: "Oh wait..."
      case 2: {
        div.innerHTML = `
          <p class="finale-step-text">Oh, espera...</p>
          <p class="finale-step-text">Una última cosa.</p>
          <button class="cosmic-btn" id="finNext2">¿Qué?</button>
        `;
        div.querySelector('#finNext2').addEventListener('click', () => this._finaleStep(3));
        break;
      }

      // Step 3: "Important question, prepare yourself"
      case 3: {
        div.innerHTML = `
          <p class="finale-step-text">Antes de que se me olvide,<br>tengo que hacerte una pregunta<br>MUY importante.</p>
          <p class="finale-step-text">Prepárate.</p>
          <button class="cosmic-btn" id="finNext3">Estoy lista</button>
        `;
        div.querySelector('#finNext3').addEventListener('click', () => this._finaleStep(4));
        break;
      }

      // Step 4: Fake question — Godard vs Truffaut
      case 4: {
        div.innerHTML = `
          <p class="finale-step-text">¿Crees que Jean-Luc Godard<br>fue mejor director que<br>François Truffaut?</p>
          <div class="finale-buttons">
            <button class="cosmic-btn" id="finGodard">Godard</button>
            <button class="cosmic-btn" id="finTruffaut">Truffaut</button>
          </div>
        `;
        div.querySelector('#finGodard').addEventListener('click', () => this._finaleStep(5));
        div.querySelector('#finTruffaut').addEventListener('click', () => this._finaleStep(5));
        break;
      }

      // Step 5: "That's not the question"
      case 5: {
        div.innerHTML = `
          <p class="finale-step-text">No, espera...</p>
          <p class="finale-step-text">Esa no era la pregunta.</p>
          <button class="cosmic-btn" id="finNext5">¿Entonces?</button>
        `;
        div.querySelector('#finNext5').addEventListener('click', () => this._finaleStep(6));
        break;
      }

      // Step 6: Transition to screenplay
      case 6: {
        div.innerHTML = `
          <p class="finale-step-text">La verdadera pregunta<br>merece su propia escena.</p>
          <p class="finale-step-text">¿Lista para actuar?</p>
          <button class="cosmic-btn" id="finNext6">ACCIÓN</button>
        `;
        div.querySelector('#finNext6').addEventListener('click', () => this._finaleStep(7));
        break;
      }

      // Step 7: Screenplay scene
      case 7: {
        const lines = [
          { type: 'heading', text: 'INT. DORMITORIO DE RON - MEDIODÍA' },
          { type: 'action', text: 'Los dos están acostados en la cama. Se sientan derechos.' },
          { type: 'action', text: 'La luz del sol entra por la ventana. Ron se levanta.' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(cierra las cortinas)' },
          { type: 'action', text: 'La habitación se oscurece un poco, pero la luz del mediodía aún se cuela por los bordes. Todavía se nota que es de día.' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'dialogue', text: '¿Qué haces?' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(con falsa casualidad)' },
          { type: 'dialogue', text: 'Espera, quiero ponerte algo.' },
          { type: 'action', text: 'Ron prende la nueva TV. Aparece un cielo estrellado que se mueve lentamente. Música suave.' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'parenthetical', text: '(mirando la TV)' },
          { type: 'dialogue', text: 'Qué bonito... estrellas a mediodía en la TV.' },
          { type: 'character', text: 'RON' },
          { type: 'dialogue', text: '¿Sabías que desde Quito puedes ver casi todas las constelaciones del mundo?' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'dialogue', text: 'Eso no lo sabía.' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(mirándola, ya no la TV)' },
          { type: 'dialogue', text: 'Hay algo más que quería decirte...' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'parenthetical', text: '(un poco nerviosa, lo mira)' },
          { type: 'dialogue', text: 'Creo que sé lo que me vas a preguntar...' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(mirándola a los ojos)' },
          { type: 'dialogue', text: 'Esa era la idea...' },
          { type: 'action', text: 'Silencio. Las estrellas del video siguen brillando. Él toma aire.' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'parenthetical', text: '(sonriendo)' },
          { type: 'dialogue', text: 'Entonces pregunta.' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(mirándola a los ojos)' },
          { type: 'dialogue', text: 'Dale continuar.' },
        ];

        const sp = document.createElement('div');
        sp.className = 'screenplay';
        div.appendChild(sp);

        // Show all lines immediately
        lines.forEach((line) => {
          const el = document.createElement('div');
          el.className = line.type === 'heading' ? 'scene-heading' : line.type;
          el.textContent = line.text;
          sp.appendChild(el);
        });

        // Continue button at the end
        const btnWrap = document.createElement('div');
        btnWrap.className = 'screenplay-continue';
        btnWrap.innerHTML = `<button class="cosmic-btn" id="finNext7">CONTINUAR</button>`;
        sp.appendChild(btnWrap);

        // Start scrolled to top
        sp.scrollTop = 0;

        btnWrap.querySelector('#finNext7').addEventListener('click', () => {
          this._finaleStep(8);
        });
        break;
      }

      // Step 8: The real proposal — heart animation
      case 8: {
        div.remove();

        this.finaleStartTime = performance.now();
        this.finaleStars = this._createFinaleStars();
        this.finalePhase = 'gathering';

        setTimeout(() => {
          this.finalePhase = 'spelling';
        }, 2000);

        setTimeout(() => {
          this.finalePhase = 'reveal';
          msg.textContent = 'Cosmic Girl, ¿quieres ser mi novia?';
          msg.classList.add('visible');
        }, 5000);
        break;
      }
    }
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
