// Main game controller — ties everything together

const GisGame = {
  canvas: null,
  ctx: null,
  currentLevel: 0,
  lastTime: 0,
  running: false,
  ambientAudio: null,
  audioStarted: false,

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
    document.getElementById('retryBtn').addEventListener('click', () => this.onRetry());

    const infoModal = document.getElementById('infoModal');
    document.getElementById('infoBtn').addEventListener('click', () => {
      infoModal.classList.remove('hidden');
    });
    document.getElementById('infoCloseBtn').addEventListener('click', () => {
      infoModal.classList.add('hidden');
    });
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) infoModal.classList.add('hidden');
    });

    Game.onCatch((x, y, caught, isSnitch) => {
      UI.updateHud(isSnitch ? Game.goal : caught);
      // Convert canvas coords to screen coords for catch effect
      const rect = this.canvas.getBoundingClientRect();
      const screenX = (x / this.canvas.width) * rect.width + rect.left;
      const screenY = (y / this.canvas.height) * rect.height + rect.top;
      UI.spawnCatchEffect(screenX, screenY, isSnitch);
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

    Game.onFail(() => {
      setTimeout(() => {
        UI.hideHud();
        UI.showLevelFailed(LEVELS[this.currentLevel]);
      }, 400);
    });

    // Setup ambient audio
    this.ambientAudio = new Audio('audio/ambient.mp3');
    this.ambientAudio.loop = true;
    this.ambientAudio.volume = 0;

    // Start audio on first user interaction (browsers require a gesture)
    const startAudioOnce = () => {
      this.startAudio();
      document.removeEventListener('click', startAudioOnce);
      document.removeEventListener('touchstart', startAudioOnce);
    };
    document.addEventListener('click', startAudioOnce);
    document.addEventListener('touchstart', startAudioOnce);

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

  startAudio() {
    if (this.audioStarted) return;
    this.audioStarted = true;
    this.ambientAudio.play();
    // Fade in over 3 seconds
    let vol = 0;
    const fadeIn = setInterval(() => {
      vol += 0.02;
      if (vol >= 0.4) {
        vol = 0.4;
        clearInterval(fadeIn);
      }
      this.ambientAudio.volume = vol;
    }, 60);
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

  onRetry() {
    UI.fadeOut('levelFailed').then(() => {
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
        div.querySelector('#finGodard').addEventListener('click', () => {
          this._finaleChoice = 'godard';
          this._finaleStep(5);
        });
        div.querySelector('#finTruffaut').addEventListener('click', () => {
          this._finaleChoice = 'truffaut';
          this._finaleStep(5);
        });
        break;
      }

      // Step 5: Reaction to her choice
      case 5: {
        if (this._finaleChoice === 'godard') {
          div.innerHTML = `
            <p class="finale-step-text">¡Totalmente de acuerdo!</p>
            <p class="finale-step-subtext">Godard reinventó el lenguaje del cine. Los jump cuts de "Sin Aliento", la mezcla de documental y ficción, su cine como filosofía... Tarantino, Terrence Malick, todos le deben algo. Truffaut era un gran narrador, pero Godard empujó el cine más lejos que nadie.</p>
            <button class="cosmic-btn" id="finNext5">...</button>
          `;
        } else {
          div.innerHTML = `
            <p class="finale-step-text">Mmm, no estoy de acuerdo...</p>
            <p class="finale-step-subtext">Sí, "Los 400 Golpes" es una obra maestra y Truffaut ganó el Oscar con "La Noche Americana". Pero Godard reinventó el lenguaje del cine. Los jump cuts, el cine como ensayo filosófico... Tarantino, Malick, todos le deben algo. Truffaut contaba historias hermosas, pero Godard cambió las reglas del juego.</p>
            <button class="cosmic-btn" id="finNext5">...</button>
          `;
        }
        div.querySelector('#finNext5').addEventListener('click', () => this._finaleStep(6));
        break;
      }

      // Step 6: "That's not the question"
      case 6: {
        div.innerHTML = `
          <p class="finale-step-text">Bueno, en realidad...</p>
          <p class="finale-step-text">Esa no era la pregunta.</p>
          <button class="cosmic-btn" id="finNext6">¿Entonces?</button>
        `;
        div.querySelector('#finNext6').addEventListener('click', () => this._finaleStep(7));
        break;
      }

      // Step 7: Transition to screenplay
      case 7: {
        div.innerHTML = `
          <p class="finale-step-text">La verdadera pregunta<br>merece su propia escena.</p>
          <p class="finale-step-text">¿Lista para actuar?</p>
          <button class="cosmic-btn" id="finNext7">ACCIÓN</button>
        `;
        div.querySelector('#finNext7').addEventListener('click', () => this._finaleStep(8));
        break;
      }

      // Step 8: Screenplay scene
      case 8: {
        const lines = [
          { type: 'heading', text: 'DORMITORIO DE RON - MEDIODÍA' },
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
          { type: 'action', text: 'Ron prende la nueva TV. Aparece un video: "Descubre qué clase de empanada eres según tu signo zodiacal".' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(se rie nerviosamente)' },
          { type: 'dialogue', text: 'No, no, ese no.' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'parenthetical', text: '(riéndose)' },
          { type: 'dialogue', text: 'Justo lo que necesitaba saber...' },
          { type: 'character', text: 'RON' },
          { type: 'dialogue', text: 'Son cosas importantes que hay que conocer ah, cultura genral... Pero no es lo que quería ponerte.' },
          { type: 'action', text: 'Ron cambia el video. Aparece un cielo estrellado que se mueve lentamente. Música suave.' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'parenthetical', text: '(mirando la TV)' },
          { type: 'dialogue', text: 'Qué bonito... estrellas a mediodía en la TV.' },
          { type: 'character', text: 'RON' },
          { type: 'dialogue', text: '¿Sabías que desde Quito puedes ver casi todas las constelaciones del mundo?' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'dialogue', text: 'Eso no lo sabía.' },
          { type: 'character', text: 'RON' },
          { type: 'dialogue', text: 'Es por la latitud. Estamos justo en la mitad, entonces podemos ver las del norte y las del sur.' },
          { type: 'action', text: 'Pausa. Los dos miran la TV en silencio por un momento.' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'parenthetical', text: '(sonriendo)' },
          { type: 'dialogue', text: 'O sea que tenemos un cielo cósmico.' },
          { type: 'action', text: 'Los dos exhalan una risa por la nariz. De esas que no son risa pero casi.' },
          { type: 'action', text: 'Otro silencio. Pero cómodo. De los buenos.' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(de repente serio)' },
          { type: 'dialogue', text: 'Pues si. Oye...' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'dialogue', text: '¿Qué?' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(mirándola, ya no la TV)' },
          { type: 'dialogue', text: 'Hay algo más que quería decirte... Oh bueno, en realidad preguntarte' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'parenthetical', text: '(un poco nerviosa, lo mira)' },
          { type: 'dialogue', text: 'Creo que sé lo que me vas a preguntar...' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(un poco nervioso también, se sienta junto a ella y la mira a los ojos)' },
          { type: 'dialogue', text: 'Creo que sé lo que crees saber...' },
          { type: 'action', text: 'Silencio. Las estrellas del video siguen brillando. Él toma aire.' },
          { type: 'character', text: 'COSMIC GIRL' },
          { type: 'parenthetical', text: '(sonriendo)' },
          { type: 'dialogue', text: 'Entonces pregunta.' },
          { type: 'character', text: 'RON' },
          { type: 'parenthetical', text: '(mirándola a los ojos)' },
          { type: 'dialogue', text: 'Haz click en continuar...' },
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
        btnWrap.innerHTML = `<button class="cosmic-btn" id="finNext8">CONTINUAR</button>`;
        sp.appendChild(btnWrap);

        // Start scrolled to top
        sp.scrollTop = 0;

        btnWrap.querySelector('#finNext8').addEventListener('click', () => {
          this._finaleStep(9);
        });
        break;
      }

      // Step 9: The real question — Yes / escaping No
      case 9: {
        div.innerHTML = `
          <p class="finale-question">Cosmic Girl,<br>¿quieres ser mi novia?</p>
          <div class="finale-buttons">
            <button class="cosmic-btn finale-yes-btn" id="finYesFinal">¡Sí!</button>
            <button class="no-btn" id="finNoFinal">No</button>
          </div>
        `;
        const yesBtn = div.querySelector('#finYesFinal');
        const noBtn = div.querySelector('#finNoFinal');
        let noAttempts = 0;

        yesBtn.addEventListener('click', () => this._finaleStep(10));

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

      // Step 10: Heart animation + fireworks
      case 10: {
        div.remove();
        msg.textContent = '';
        msg.classList.remove('visible');

        this.finaleStartTime = performance.now();
        this.finaleStars = this._createFinaleStars();
        this.finaleFireworks = [];
        this.finalePhase = 'gathering';

        setTimeout(() => {
          this.finalePhase = 'reveal';
          this._startFireworks();
        }, 3500);
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

  _startFireworks() {
    this._fireworkInterval = setInterval(() => {
      if (this.finalePhase !== 'reveal') {
        clearInterval(this._fireworkInterval);
        return;
      }
      this._spawnFirework();
    }, 800);
    // Spawn a few immediately
    this._spawnFirework();
    setTimeout(() => this._spawnFirework(), 300);
  },

  _spawnFirework() {
    if (!this.finaleFireworks) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Launch from bottom area
    const x = w * 0.15 + Math.random() * w * 0.7;
    const burstY = h * 0.5 + Math.random() * h * 0.3;

    const colors = [
      { r: 255, g: 215, b: 0 },   // gold
      { r: 255, g: 100, b: 100 },  // red
      { r: 255, g: 180, b: 50 },   // orange
      { r: 200, g: 150, b: 255 },  // purple
      { r: 100, g: 220, b: 255 },  // cyan
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const particleCount = 20 + Math.floor(Math.random() * 15);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 1.5 + Math.random() * 2.5;
      particles.push({
        x, y: burstY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: 2 + Math.random() * 2,
      });
    }

    this.finaleFireworks.push({
      color,
      particles,
      born: performance.now(),
      life: 1500 + Math.random() * 800,
    });
  },

  _renderFinaleStars(time) {
    if (!this.finaleStars) return;
    const ctx = this.ctx;
    const elapsed = (time - this.finaleStartTime) / 1000;

    for (const star of this.finaleStars) {
      let progress = Math.min(1, elapsed / 3.5);
      progress = 1 - Math.pow(1 - progress, 3);

      star.x = star.startX + (star.endX - star.startX) * progress;
      star.y = star.startY + (star.endY - star.startY) * progress;

      // Twinkle
      const twinkle = Math.sin(time * 0.003 + star.endX) * 0.2;
      const alpha = star.brightness + twinkle;

      // Golden glow
      const glowSize = star.size * 4;
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
      glow.addColorStop(0, `rgba(255, 215, 80, ${alpha * 0.4})`);
      glow.addColorStop(1, `rgba(255, 215, 80, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(255, 240, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render fireworks
    this._renderFireworks(time);
  },

  _renderFireworks(time) {
    if (!this.finaleFireworks) return;
    const ctx = this.ctx;

    for (let i = this.finaleFireworks.length - 1; i >= 0; i--) {
      const fw = this.finaleFireworks[i];
      const age = time - fw.born;
      const { r, g, b } = fw.color;

      if (age > fw.life) {
        this.finaleFireworks.splice(i, 1);
        continue;
      }

      const fadeProgress = age / fw.life;

      for (const p of fw.particles) {
        // Gravity + drag
        p.vy += 0.03;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, 1 - fadeProgress);

        if (p.alpha <= 0) continue;

        // Glow
        const gs = p.size * 3;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gs);
        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.3})`);
        glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, gs, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
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
      UI.updateTimer(Game.timeRemaining);
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
