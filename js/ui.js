// UI controller — manages screen transitions and HUD

const UI = {
  screens: {},
  currentScreen: null,

  init() {
    this.screens = {
      title: document.getElementById('titleScreen'),
      levelIntro: document.getElementById('levelIntro'),
      hud: document.getElementById('gameHud'),
      levelComplete: document.getElementById('levelComplete'),
      levelFailed: document.getElementById('levelFailed'),
      finale: document.getElementById('finaleScreen'),
    };
  },

  showScreen(name, immediate) {
    // Hide all screens
    for (const [key, el] of Object.entries(this.screens)) {
      if (key === name) continue;
      if (key === 'hud') {
        el.classList.add('hidden');
      } else {
        el.classList.add('hidden');
        el.classList.remove('fading');
      }
    }

    const screen = this.screens[name];
    if (!screen) return;

    screen.classList.remove('hidden');
    screen.classList.remove('fading');
    this.currentScreen = name;
  },

  fadeOut(name) {
    return new Promise((resolve) => {
      const screen = this.screens[name];
      if (!screen) { resolve(); return; }

      screen.classList.add('fading');
      setTimeout(() => {
        screen.classList.add('hidden');
        screen.classList.remove('fading');
        resolve();
      }, 800);
    });
  },

  showLevelIntro(level, levelIndex) {
    document.getElementById('levelDate').textContent = formatDateSpanish(level.date);
    document.getElementById('levelTitle').textContent = `"${level.title}"`;
    document.getElementById('levelDescription').textContent = level.description || '';
    this.showScreen('levelIntro');
  },

  showHud(level, levelIndex) {
    document.getElementById('hudLevel').textContent = `NIVEL ${levelIndex + 1} / ${LEVELS.length}`;
    document.getElementById('hudCaught').textContent = '0';
    document.getElementById('hudGoal').textContent = level.goal;
    this.screens.hud.classList.remove('hidden');
  },

  hideHud() {
    this.screens.hud.classList.add('hidden');
  },

  updateHud(caught) {
    document.getElementById('hudCaught').textContent = caught;
  },

  updateTimer(seconds) {
    const el = document.getElementById('hudTimer');
    const s = Math.ceil(seconds);
    el.textContent = s;
    el.classList.toggle('timer-low', s <= 5);
  },

  showLevelFailed(level) {
    document.getElementById('failedTitle').textContent = `"${level.title}"`;
    this.showScreen('levelFailed');
  },

  showLevelComplete(level) {
    document.getElementById('completeTitle').textContent = `"${level.title}"`;
    document.getElementById('completeMessage').textContent = '¡Nivel completado!';
    document.getElementById('completeStory').textContent = level.completionText || '';
    this.showScreen('levelComplete');
  },

  showFinale() {
    this.showScreen('finale');
    const msg = document.getElementById('finaleMessage');
    msg.innerHTML = '';
    msg.classList.remove('visible');

    // Build the message with a delay
    setTimeout(() => {
      msg.textContent = '¿Quieres ser mi novia, Giselle?';
      msg.classList.add('visible');
    }, 2000);
  },

  // Catch effect — brief sparkle at catch position
  spawnCatchEffect(screenX, screenY, isSnitch) {
    const el = document.createElement('div');
    el.className = isSnitch ? 'catch-effect snitch-catch' : 'catch-effect';
    el.style.left = (screenX - 20) + 'px';
    el.style.top = (screenY - 20) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), isSnitch ? 1000 : 500);
  },
};
