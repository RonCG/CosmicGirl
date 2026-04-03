// Level-specific pixel art decorations
// Rendered at the bottom of the canvas during level intro and gameplay

const Decorations = {
  canvas: null,
  ctx: null,
  currentLevel: -1,
  ps: 4, // pixel size, recalculated on init/resize

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
  },

  resize() {
    this.ps = Math.max(2, Math.floor(this.canvas.width / 320));
  },

  setLevel(index) {
    this.currentLevel = index;
    this.resize();
  },

  showTitle() {
    this.currentLevel = -2; // special title mode
    this.resize();
  },

  render(time) {
    if (this.currentLevel === -2) {
      this._renderTitle(time);
      return;
    }
    if (this.currentLevel < 0 || this.currentLevel > 9) return;
    const renderers = [
      this._renderCats,
      this._renderWedding,
      this._renderBirthday,
      this._renderViolin,
      this._renderCosmic,
      this._renderRobo,
      this._renderMemoria,
      this._renderBloqueo,
      this._renderTV,
      this._renderAventura,
    ];
    renderers[this.currentLevel].call(this, time);
  },

  // --- Drawing helpers ---

  drawSprite(sprite, palette, x, y, scale) {
    const ctx = this.ctx;
    const s = (scale || 1) * this.ps;
    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        const ch = sprite[row][col];
        if (ch === ' ' || ch === '.') continue;
        const color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x + col * s, y + row * s, s, s);
      }
    }
  },

  drawRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w * this.ps, h * this.ps);
  },

  // --- Level 1: Three cats in a coffee shop ---
  _catSprite1: [
    ' 1  1 ',
    '111111 ',
    '1W1W1  ',
    '111111 ',
    ' 1111  ',
    ' 1  1  ',
    '  11   ',
  ],
  _catSprite2: [
    ' 1  1 ',
    '111111 ',
    '1W1W1  ',
    '111111 ',
    ' 1111  ',
    '  1  1 ',
    '  11   ',
  ],

  _renderCats(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    // Coffee shop counter
    const counterY = h - ps * 22;
    const counterH = ps * 3;
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(0, counterY, w, counterH);
    ctx.fillStyle = '#7A4E2D';
    ctx.fillRect(0, counterY, w, ps);

    // Floor
    ctx.fillStyle = '#3A2512';
    ctx.fillRect(0, counterY + counterH, w, h - counterY - counterH);

    // Legs of counter
    for (let i = 0; i < 6; i++) {
      const lx = w * 0.1 + i * (w * 0.16);
      ctx.fillStyle = '#5C3A1E';
      ctx.fillRect(lx, counterY + counterH, ps * 2, ps * 8);
    }

    // 3 cats on counter, different colors
    const catColors = [
      { '1': '#222', 'W': '#aaa' },       // Black cat
      { '1': '#E87E24', 'W': '#fff' },     // Orange cat
      { '1': '#ccc', 'W': '#888' },        // Gray cat
    ];

    const frame = Math.floor(t * 2) % 2 === 0 ? this._catSprite1 : this._catSprite2;

    for (let i = 0; i < 3; i++) {
      const baseX = w * (0.25 + i * 0.22);
      const bob = Math.sin(t * 1.5 + i * 2) * ps;
      const catY = counterY - ps * 7 + bob;

      this.drawSprite(frame, catColors[i], baseX, catY, 1);

      // Tail — wagging sine wave
      const tailX = baseX + ps * 5;
      const tailBaseY = catY + ps * 4;
      for (let j = 0; j < 5; j++) {
        const tx = tailX + j * ps;
        const ty = tailBaseY - Math.sin(t * 3 + i + j * 0.8) * ps * 1.5 - j * ps * 0.3;
        ctx.fillStyle = catColors[i]['1'];
        ctx.fillRect(tx, ty, ps, ps);
      }
    }

    // Coffee cups
    const cupPalette = { 'C': '#ddd', 'D': '#8B4513', 'S': '#999' };
    const cupSprite = [
      ' DD ',
      'CCCC',
      'CCCC',
      ' CC ',
    ];
    this.drawSprite(cupSprite, cupPalette, w * 0.18, counterY - ps * 4, 0.8);
    this.drawSprite(cupSprite, cupPalette, w * 0.72, counterY - ps * 4, 0.8);
  },

  // --- Level 2: Wedding rings ---
  _renderWedding(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const centerX = w * 0.5;
    const baseY = h - ps * 18;

    // Two interlocked rings
    const ringRadius = ps * 6;
    const offset = ps * 4;

    ctx.lineWidth = ps * 1.5;
    ctx.strokeStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX - offset, baseY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FFC200';
    ctx.beginPath();
    ctx.arc(centerX + offset, baseY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Diamond on top of left ring
    const dSize = ps * 2;
    ctx.fillStyle = '#E0F0FF';
    ctx.beginPath();
    ctx.moveTo(centerX - offset, baseY - ringRadius - dSize);
    ctx.lineTo(centerX - offset + dSize, baseY - ringRadius);
    ctx.lineTo(centerX - offset, baseY - ringRadius + dSize * 0.5);
    ctx.lineTo(centerX - offset - dSize, baseY - ringRadius);
    ctx.closePath();
    ctx.fill();

    // Floating hearts
    for (let i = 0; i < 5; i++) {
      const hx = centerX + Math.sin(t * 0.8 + i * 1.3) * ps * 15;
      const hy = baseY - ps * 12 - ((t * 15 + i * 40) % (ps * 30));
      const alpha = 1 - ((t * 15 + i * 40) % (ps * 30)) / (ps * 30);
      this._drawPixelHeart(hx, hy, ps * 0.6, `rgba(255,150,180,${alpha * 0.7})`);
    }
  },

  _drawPixelHeart(x, y, s, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    // Simple pixel heart shape
    const heart = [
      ' ## ## ',
      '#######',
      '#######',
      ' ##### ',
      '  ###  ',
      '   #   ',
    ];
    for (let r = 0; r < heart.length; r++) {
      for (let c = 0; c < heart[r].length; c++) {
        if (heart[r][c] === '#') {
          ctx.fillRect(x + c * s, y + r * s, s, s);
        }
      }
    }
  },

  // --- Level 3: Birthday cake ---
  _renderBirthday(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const cx = w * 0.5;
    const baseY = h - ps * 8;

    // Cake body
    ctx.fillStyle = '#F5D0A9';
    ctx.fillRect(cx - ps * 10, baseY - ps * 8, ps * 20, ps * 8);
    // Frosting
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(cx - ps * 10, baseY - ps * 10, ps * 20, ps * 3);
    // Frosting drips
    for (let i = 0; i < 5; i++) {
      const dx = cx - ps * 8 + i * ps * 4;
      const dh = ps * (2 + Math.sin(i * 1.5) * 1);
      ctx.fillRect(dx, baseY - ps * 7, ps * 2, dh);
    }

    // Plate
    ctx.fillStyle = '#ddd';
    ctx.fillRect(cx - ps * 12, baseY, ps * 24, ps * 2);

    // Candle
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(cx - ps, baseY - ps * 14, ps * 2, ps * 4);

    // Flame - flickers
    const flicker = Math.sin(t * 10) * ps * 0.5;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(cx - ps * 1.5 + flicker, baseY - ps * 17, ps * 3, ps * 3);
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(cx - ps * 0.5 + flicker, baseY - ps * 16, ps * 1, ps * 2);

    // Confetti
    const confettiColors = ['#FF6B6B', '#FFD700', '#7BD4FF', '#C78BFF', '#6BFF8E'];
    for (let i = 0; i < 12; i++) {
      const seed = i * 137.5;
      const cx2 = w * 0.3 + (seed * 7.31 % (w * 0.4));
      const fallSpeed = 20 + (seed % 15);
      const cy = (t * fallSpeed + seed) % (h * 0.4) + h * 0.55;
      const wobble = Math.sin(t * 2 + seed) * ps * 2;
      ctx.fillStyle = confettiColors[i % confettiColors.length];
      ctx.fillRect(cx2 + wobble, cy, ps * 1.5, ps * 1.5);
    }
  },

  // --- Level 4: Violin with music notes ---
  _renderViolin(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const cx = w * 0.5;
    const baseY = h - ps * 8;

    // Violin — scroll/pegbox at top, body at bottom (correct orientation)
    const violinPalette = { 'S': '#A0522D', 'B': '#8B4513', 'N': '#222', 'H': '#DAA520', 'P': '#6B3410' };
    const violinSprite = [
      '   HH     ',  // Scroll
      '   NH     ',
      '   NN     ',  // Pegbox
      '  NNNN    ',
      '   NN     ',  // Neck
      '   NN     ',
      '   NN     ',
      '   NN     ',
      '  SSSS    ',  // Upper bout
      ' SSSSSS   ',
      ' SBBBBSS  ',
      '  SBBBS   ',  // Waist (C-bout)
      '   SBBS   ',
      '  SBBBS   ',
      ' SBBBBSS  ',  // Lower bout
      ' SSSSSS   ',
      '  SSSS    ',
    ];
    this.drawSprite(violinSprite, violinPalette, cx - ps * 5, baseY - ps * 18, 1);

    // Strings on body
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const sx = cx - ps * 2 + i * ps;
      ctx.beginPath();
      ctx.moveTo(sx, baseY - ps * 14);
      ctx.lineTo(sx, baseY - ps * 4);
      ctx.stroke();
    }

    // Tailpiece
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - ps * 2, baseY - ps * 3, ps * 3, ps * 2);

    // Chin rest
    ctx.fillStyle = '#333';
    ctx.fillRect(cx + ps * 1, baseY - ps * 4, ps * 2, ps * 3);

    // Floating music notes
    const noteChar = ['♪', '♫', '♩'];
    ctx.font = `${ps * 4}px 'Press Start 2P', cursive`;
    for (let i = 0; i < 6; i++) {
      const nx = cx + ps * 8 + Math.sin(t * 0.7 + i * 1.1) * ps * 12;
      const ny = baseY - ps * 5 - ((t * 20 + i * 35) % (ps * 35));
      const alpha = 1 - ((t * 20 + i * 35) % (ps * 35)) / (ps * 35);
      ctx.fillStyle = `rgba(255,215,100,${alpha * 0.7})`;
      ctx.fillText(noteChar[i % 3], nx, ny);
    }
  },

  // --- Level 5: McDonald's cosmic (first kiss) ---
  _renderCosmic(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const cx = w * 0.5;
    const baseY = h - ps * 8;

    // Golden arches (M shape)
    const archColor = '#FFD700';
    const archW = ps * 3;
    ctx.fillStyle = archColor;

    // Left leg (full height)
    ctx.fillRect(cx - ps * 12, baseY - ps * 15, archW, ps * 23);
    // Left arch curve
    ctx.fillRect(cx - ps * 9, baseY - ps * 17, archW, archW);
    ctx.fillRect(cx - ps * 6, baseY - ps * 18, archW, archW);

    // Left diagonal down to center
    ctx.fillRect(cx - ps * 3, baseY - ps * 16, archW, archW);
    ctx.fillRect(cx - ps * 1, baseY - ps * 13, archW, archW);

    // Center V point (extended down)
    ctx.fillRect(cx + ps * 0.5, baseY - ps * 10, ps * 2, archW);
    ctx.fillRect(cx - ps * 0.5, baseY - ps * 8, ps * 3, archW);

    // Right diagonal up from center
    ctx.fillRect(cx + ps * 1, baseY - ps * 13, archW, archW);
    ctx.fillRect(cx + ps * 3, baseY - ps * 16, archW, archW);

    // Right arch curve
    ctx.fillRect(cx + ps * 6, baseY - ps * 18, archW, archW);
    ctx.fillRect(cx + ps * 9, baseY - ps * 17, archW, archW);

    // Right leg (full height)
    ctx.fillRect(cx + ps * 9, baseY - ps * 15, archW, ps * 23);

    // Extra sparkles radiating outward — the magic
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + t * 0.3;
      const dist = ps * 15 + Math.sin(t * 2 + i) * ps * 5;
      const sx = cx + Math.cos(angle) * dist;
      const sy = baseY - ps * 10 + Math.sin(angle) * dist * 0.6;
      const sparkleSize = ps * (0.8 + Math.sin(t * 3 + i * 0.7) * 0.4);
      const alpha = 0.4 + Math.sin(t * 2.5 + i) * 0.3;
      ctx.fillStyle = `rgba(255, 230, 150, ${alpha})`;
      ctx.fillRect(sx, sy, sparkleSize, sparkleSize);
    }

    // Pixel hearts floating up
    for (let i = 0; i < 3; i++) {
      const hx = cx - ps * 5 + i * ps * 5;
      const hy = baseY - ps * 20 - ((t * 12 + i * 25) % (ps * 20));
      const alpha = 1 - ((t * 12 + i * 25) % (ps * 20)) / (ps * 20);
      this._drawPixelHeart(hx, hy, ps * 0.5, `rgba(255,100,150,${alpha * 0.6})`);
    }
  },

  // --- Level 6: The car "robbery" ---
  _renderRobo(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const cx = w * 0.5;
    const baseY = h - ps * 8;

    // Road
    ctx.fillStyle = '#333';
    ctx.fillRect(0, baseY, w, ps * 8);
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(w * 0.05 + i * w * 0.1, baseY + ps * 3.5, w * 0.05, ps);
    }

    // White car
    const carX = cx - ps * 12;
    const carY = baseY - ps * 10;
    // Body
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(carX, carY + ps * 3, ps * 24, ps * 6);
    // Roof
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(carX + ps * 5, carY, ps * 14, ps * 4);
    // Windows
    ctx.fillStyle = '#6BA3D6';
    ctx.fillRect(carX + ps * 6, carY + ps, ps * 5, ps * 2);
    ctx.fillRect(carX + ps * 13, carY + ps, ps * 5, ps * 2);
    // Wheels
    ctx.fillStyle = '#222';
    ctx.fillRect(carX + ps * 3, carY + ps * 8, ps * 4, ps * 4);
    ctx.fillRect(carX + ps * 17, carY + ps * 8, ps * 4, ps * 4);
    // Hubcaps
    ctx.fillStyle = '#999';
    ctx.fillRect(carX + ps * 4, carY + ps * 9, ps * 2, ps * 2);
    ctx.fillRect(carX + ps * 18, carY + ps * 9, ps * 2, ps * 2);

    // Pixel figure sneaking with keys (right side, moving)
    const figX = cx + ps * 18 + Math.sin(t * 1.5) * ps * 3;
    const figY = baseY - ps * 10;
    // Body
    ctx.fillStyle = '#333';
    ctx.fillRect(figX, figY + ps * 2, ps * 4, ps * 5);
    // Head
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(figX + ps * 0.5, figY, ps * 3, ps * 3);
    // Eye mask
    ctx.fillStyle = '#111';
    ctx.fillRect(figX + ps * 0.5, figY + ps, ps * 3, ps);
    // Keys dangling
    const keyBob = Math.sin(t * 4) * ps;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(figX + ps * 4, figY + ps * 3 + keyBob, ps * 2, ps);
    ctx.fillRect(figX + ps * 5, figY + ps * 4 + keyBob, ps, ps * 2);

    // "?" floating above car
    const qBob = Math.sin(t * 2) * ps * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `${ps * 5}px 'Press Start 2P', cursive`;
    ctx.fillText('?', cx - ps * 2, carY - ps * 4 + qBob);
  },

  // --- Level 7: USB memory (Valentine's) ---
  _renderMemoria(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const cx = w * 0.5;
    const baseY = h - ps * 10;

    // USB drive body
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(cx - ps * 4, baseY - ps * 10, ps * 8, ps * 14);
    // USB connector
    ctx.fillStyle = '#999';
    ctx.fillRect(cx - ps * 3, baseY - ps * 13, ps * 6, ps * 4);
    // Connector metal
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(cx - ps * 2, baseY - ps * 12, ps * 4, ps * 2);
    // LED light (blinking)
    const ledOn = Math.sin(t * 3) > 0;
    ctx.fillStyle = ledOn ? '#00FF00' : '#003300';
    ctx.fillRect(cx - ps, baseY - ps * 6, ps * 2, ps);
    // Label
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(cx - ps * 3, baseY - ps * 4, ps * 6, ps * 3);
    // Heart on label
    this._drawPixelHeart(cx - ps * 1.5, baseY - ps * 3.5, ps * 0.4, '#fff');

    // Photos floating out
    const photoColors = ['#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98'];
    for (let i = 0; i < 6; i++) {
      const px = cx + Math.sin(t * 0.6 + i * 1.2) * ps * 20;
      const py = baseY - ps * 15 - ((t * 18 + i * 30) % (ps * 30));
      const alpha = 1 - ((t * 18 + i * 30) % (ps * 30)) / (ps * 30);
      const rot = Math.sin(t + i) * 0.2;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha * 0.8;
      // Photo frame
      ctx.fillStyle = '#fff';
      ctx.fillRect(-ps * 3, -ps * 3, ps * 6, ps * 6);
      // Photo content
      ctx.fillStyle = photoColors[i % photoColors.length];
      ctx.fillRect(-ps * 2.5, -ps * 2.5, ps * 5, ps * 4);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  },

  // --- Level 8: El bloqueo — two hearts, wall, light ---
  _renderBloqueo(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const cx = w * 0.5;
    const baseY = h - ps * 16;

    // Wall in center
    const wallW = ps * 3;
    const wallH = ps * 16;
    const wallX = cx - wallW / 2;
    const wallY = baseY - ps * 2;

    // Wall bricks
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 2; col++) {
        const bx = wallX + col * ps * 1.5 + (row % 2) * ps * 0.75 - ps * 0.3;
        const by = wallY + row * ps * 2;
        ctx.fillStyle = row % 2 === 0 ? '#8B7355' : '#7A6348';
        ctx.fillRect(bx, by, ps * 1.8, ps * 1.8);
        ctx.strokeStyle = '#5C4A32';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, ps * 1.8, ps * 1.8);
      }
    }

    // Crack in the wall — light leaking through
    const crackGlow = 0.4 + Math.sin(t * 1.5) * 0.2;
    ctx.fillStyle = `rgba(255, 230, 180, ${crackGlow})`;
    // Jagged crack line
    const crackPoints = [
      [0, -ps * 2], [ps * 0.5, ps], [-ps * 0.3, ps * 3],
      [ps * 0.4, ps * 5], [-ps * 0.2, ps * 7], [ps * 0.3, ps * 9],
      [-ps * 0.4, ps * 11], [0, ps * 13],
    ];
    for (const [dx, dy] of crackPoints) {
      ctx.fillRect(cx + dx - ps * 0.4, wallY + dy, ps * 0.8, ps * 2.5);
    }

    // Light rays from crack
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI - Math.PI / 2;
      const rayLen = ps * (6 + Math.sin(t * 2 + i) * 2);
      const rx = cx + Math.cos(angle) * rayLen;
      const ry = baseY + ps * 5 + Math.sin(angle) * rayLen * 0.5;
      const alpha = 0.08 + Math.sin(t * 1.5 + i * 0.5) * 0.04;
      ctx.strokeStyle = `rgba(255, 230, 180, ${alpha})`;
      ctx.lineWidth = ps * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, baseY + ps * 5);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }

    // Left heart (slightly moving toward wall)
    const leftPulse = Math.sin(t * 1.2) * ps;
    this._drawPixelHeart(cx - ps * 14 + leftPulse, baseY + ps, ps * 1, 'rgba(255,120,160,0.7)');

    // Right heart (slightly moving toward wall)
    const rightPulse = Math.sin(t * 1.2 + Math.PI) * ps;
    this._drawPixelHeart(cx + ps * 9 + rightPulse, baseY + ps, ps * 1, 'rgba(255,120,160,0.7)');

    // Small stars near the crack — hope
    for (let i = 0; i < 5; i++) {
      const sx = cx + Math.sin(t * 0.8 + i * 1.5) * ps * 3;
      const sy = wallY + ps * 3 + i * ps * 2.5 + Math.cos(t + i) * ps;
      const sa = 0.3 + Math.sin(t * 2 + i) * 0.2;
      ctx.fillStyle = `rgba(255, 255, 200, ${sa})`;
      ctx.fillRect(sx, sy, ps * 0.8, ps * 0.8);
    }
  },

  // --- Level 9: TV day — static TV ---
  _renderTV(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const baseY = h - ps * 8;
    const cx = w * 0.5;

    // TV body
    const tvX = cx - ps * 10;
    const tvY = baseY - ps * 16;
    ctx.fillStyle = '#222';
    ctx.fillRect(tvX, tvY, ps * 20, ps * 14);
    // Bezel highlight
    ctx.fillStyle = '#333';
    ctx.fillRect(tvX, tvY, ps * 20, ps);
    ctx.fillRect(tvX, tvY, ps, ps * 14);
    // Screen
    ctx.fillStyle = '#4488CC';
    ctx.fillRect(tvX + ps * 2, tvY + ps * 2, ps * 16, ps * 10);
    // Screen shine
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(tvX + ps * 3, tvY + ps * 3, ps * 5, ps * 2);
    // Static/scan line effect
    const scanY = tvY + ps * 2 + ((t * 8) % (ps * 10));
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(tvX + ps * 2, scanY, ps * 16, ps * 2);
    // Stand
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - ps * 2, tvY + ps * 14, ps * 4, ps * 3);
    ctx.fillRect(cx - ps * 6, tvY + ps * 16, ps * 12, ps * 2);
  },

  // --- Level 10: Adventure — two figures walking toward heart ---
  _renderAventura(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    const baseY = h - ps * 8;

    // Path
    ctx.fillStyle = '#4A3A2A';
    ctx.fillRect(0, baseY, w, ps * 8);

    // Dotted path leading to horizon
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 15; i++) {
      const dx = w * 0.3 + i * ps * 5;
      ctx.fillRect(dx, baseY + ps * 3, ps * 2, ps);
    }

    // Heart on the horizon (pulsing)
    const heartScale = 1 + Math.sin(t * 2) * 0.15;
    const heartX = w * 0.82;
    const heartY = baseY - ps * 6;
    this._drawPixelHeart(heartX, heartY, ps * heartScale, 'rgba(255,120,160,0.8)');

    // Glow around heart
    const glowAlpha = 0.15 + Math.sin(t * 2) * 0.08;
    const glow = ctx.createRadialGradient(heartX + ps * 2, heartY + ps * 2, 0, heartX + ps * 2, heartY + ps * 2, ps * 15);
    glow.addColorStop(0, `rgba(255,150,180,${glowAlpha})`);
    glow.addColorStop(1, 'rgba(255,150,180,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(heartX - ps * 13, heartY - ps * 13, ps * 30, ps * 30);

    // Two pixel figures walking
    const walkOffset = Math.sin(t * 3) * ps;
    const figBaseX = w * 0.25 + ((t * 5) % (w * 0.05));

    // Figure 1 (him — green clothes)
    const f1x = figBaseX;
    const f1y = baseY - ps * 10;
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(f1x, f1y + ps * 3, ps * 4, ps * 5);
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(f1x + ps * 0.5, f1y, ps * 3, ps * 3);
    // Legs walking
    ctx.fillStyle = '#1B5E3A';
    ctx.fillRect(f1x + ps, f1y + ps * 8, ps, ps * 2 + walkOffset);
    ctx.fillRect(f1x + ps * 2, f1y + ps * 8, ps, ps * 2 - walkOffset);

    // Figure 2 (her — yellow clothes, dark black hair)
    const f2x = figBaseX + ps * 6;
    const f2y = baseY - ps * 10;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(f2x, f2y + ps * 3, ps * 4, ps * 5);
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(f2x + ps * 0.5, f2y, ps * 3, ps * 3);
    // Dark black hair — longer
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(f2x - ps * 0.5, f2y - ps * 1.5, ps * 5, ps * 2);
    ctx.fillRect(f2x + ps * 3, f2y, ps * 2, ps * 4);
    ctx.fillRect(f2x - ps * 0.5, f2y, ps * 1, ps * 3);
    // Legs
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(f2x + ps, f2y + ps * 8, ps, ps * 2 - walkOffset);
    ctx.fillRect(f2x + ps * 2, f2y + ps * 8, ps, ps * 2 + walkOffset);

    // Holding hands — line between them
    ctx.strokeStyle = '#DEB887';
    ctx.lineWidth = ps * 0.8;
    ctx.beginPath();
    ctx.moveTo(f1x + ps * 4, f1y + ps * 5);
    ctx.lineTo(f2x, f2y + ps * 5);
    ctx.stroke();

    // Small hearts trail behind them
    for (let i = 0; i < 3; i++) {
      const hx = figBaseX - ps * 3 - i * ps * 5;
      const hy = f1y - ps * 2 - Math.sin(t * 1.5 + i) * ps * 2;
      const alpha = 0.6 - i * 0.15;
      this._drawPixelHeart(hx, hy, ps * 0.4, `rgba(255,150,180,${alpha})`);
    }
  },

  // --- Title screen: couple on a hill + Quito skyline ---
  _renderTitle(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ps = this.ps;
    const t = time * 0.001;

    // --- Quito mountain silhouette (background layer) ---
    ctx.fillStyle = '#0e0e20';
    ctx.beginPath();
    ctx.moveTo(0, h);
    // Left mountain range (Pichincha-like)
    ctx.lineTo(0, h - ps * 25);
    ctx.lineTo(w * 0.05, h - ps * 30);
    ctx.lineTo(w * 0.10, h - ps * 38);
    ctx.lineTo(w * 0.15, h - ps * 42);
    ctx.lineTo(w * 0.20, h - ps * 35);
    ctx.lineTo(w * 0.25, h - ps * 30);
    ctx.lineTo(w * 0.30, h - ps * 25);
    // Valley dip
    ctx.lineTo(w * 0.35, h - ps * 20);
    ctx.lineTo(w * 0.40, h - ps * 18);
    // Central hill (where couple sits)
    ctx.lineTo(w * 0.43, h - ps * 20);
    ctx.lineTo(w * 0.47, h - ps * 24);
    ctx.lineTo(w * 0.50, h - ps * 26);
    ctx.lineTo(w * 0.53, h - ps * 24);
    ctx.lineTo(w * 0.57, h - ps * 20);
    // Right side valley
    ctx.lineTo(w * 0.60, h - ps * 18);
    ctx.lineTo(w * 0.65, h - ps * 20);
    // Right mountains (Cotopaxi-like)
    ctx.lineTo(w * 0.70, h - ps * 28);
    ctx.lineTo(w * 0.75, h - ps * 36);
    ctx.lineTo(w * 0.78, h - ps * 40);
    ctx.lineTo(w * 0.82, h - ps * 36);
    ctx.lineTo(w * 0.87, h - ps * 28);
    ctx.lineTo(w * 0.92, h - ps * 22);
    ctx.lineTo(w * 0.96, h - ps * 18);
    ctx.lineTo(w, h - ps * 15);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Snow caps on taller peaks
    ctx.fillStyle = 'rgba(200, 210, 230, 0.15)';
    // Left peak
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h - ps * 39);
    ctx.lineTo(w * 0.15, h - ps * 42);
    ctx.lineTo(w * 0.18, h - ps * 37);
    ctx.closePath();
    ctx.fill();
    // Right peak
    ctx.beginPath();
    ctx.moveTo(w * 0.75, h - ps * 37);
    ctx.lineTo(w * 0.78, h - ps * 40);
    ctx.lineTo(w * 0.81, h - ps * 37);
    ctx.closePath();
    ctx.fill();

    // --- City lights (tiny dots along the valley) ---
    const cityY = h - ps * 16;
    for (let i = 0; i < 40; i++) {
      const cx = w * 0.08 + (i * w * 0.022);
      // Skip the hill area where the couple sits
      if (cx > w * 0.42 && cx < w * 0.58) continue;
      const cy = cityY + Math.sin(i * 0.7) * ps * 3 - ps * 2;
      const flicker = Math.sin(t * 2 + i * 1.7) * 0.15;
      const alpha = 0.15 + flicker;
      // Mix of warm and cool lights
      if (i % 3 === 0) {
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
      } else if (i % 3 === 1) {
        ctx.fillStyle = `rgba(255, 240, 200, ${alpha * 0.7})`;
      } else {
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.5})`;
      }
      ctx.fillRect(cx, cy, ps * 0.8, ps * 0.8);
    }

    // --- Foreground hill (darker, where couple sits) ---
    ctx.fillStyle = '#0a0a18';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h - ps * 8);
    ctx.lineTo(w * 0.2, h - ps * 8);
    ctx.lineTo(w * 0.35, h - ps * 10);
    ctx.lineTo(w * 0.42, h - ps * 14);
    ctx.lineTo(w * 0.47, h - ps * 17);
    ctx.lineTo(w * 0.50, h - ps * 18);
    ctx.lineTo(w * 0.53, h - ps * 17);
    ctx.lineTo(w * 0.58, h - ps * 14);
    ctx.lineTo(w * 0.65, h - ps * 10);
    ctx.lineTo(w * 0.80, h - ps * 8);
    ctx.lineTo(w, h - ps * 8);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Grass texture hints
    ctx.fillStyle = 'rgba(30, 60, 30, 0.15)';
    for (let i = 0; i < 25; i++) {
      const gx = w * 0.35 + i * ps * 2.5;
      const gy = h - ps * 12 - Math.sin(i * 0.5) * ps * 4;
      ctx.fillRect(gx, gy, ps * 0.5, ps * 1.5);
    }

    // --- Two figures sitting on the hilltop ---
    const coupleX = w * 0.5 - ps * 5;
    const coupleY = h - ps * 20;

    // Him (green) — sitting
    const hx = coupleX;
    const hy = coupleY;
    // Body
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(hx, hy + ps * 2, ps * 4, ps * 4);
    // Head
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(hx + ps * 0.5, hy - ps, ps * 3, ps * 3);
    // Legs (sitting, extended forward)
    ctx.fillStyle = '#1B5E3A';
    ctx.fillRect(hx - ps, hy + ps * 5, ps * 3, ps * 1.5);
    ctx.fillRect(hx + ps * 2, hy + ps * 5, ps * 3, ps * 1.5);
    // Arm reaching toward her
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(hx + ps * 3, hy + ps * 3, ps * 2, ps);

    // Her (yellow, black hair) — sitting
    const sx = coupleX + ps * 6;
    const sy = coupleY;
    // Body
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(sx, sy + ps * 2, ps * 4, ps * 4);
    // Head
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(sx + ps * 0.5, sy - ps, ps * 3, ps * 3);
    // Dark black hair — long
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(sx, sy - ps * 1.5, ps * 4, ps * 2);
    ctx.fillRect(sx + ps * 3, sy - ps, ps * 1.5, ps * 4);
    ctx.fillRect(sx - ps * 0.5, sy - ps, ps * 1, ps * 3);
    // Legs (sitting)
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(sx - ps, sy + ps * 5, ps * 3, ps * 1.5);
    ctx.fillRect(sx + ps * 2, sy + ps * 5, ps * 3, ps * 1.5);
    // Arm reaching toward him
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(sx - ps, sy + ps * 3, ps * 2, ps);

    // Holding hands (connecting their arms)
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(hx + ps * 4.5, hy + ps * 3, ps * 2, ps);

    // Small heart floating above them
    const heartBob = Math.sin(t * 1.5) * ps * 1.5;
    const heartAlpha = 0.5 + Math.sin(t * 1.2) * 0.2;
    this._drawPixelHeart(
      coupleX + ps * 3.5,
      coupleY - ps * 5 + heartBob,
      ps * 0.6,
      `rgba(255, 130, 170, ${heartAlpha})`
    );

    // A few tiny firefly-like particles around the hill
    for (let i = 0; i < 6; i++) {
      const fx = w * 0.38 + i * ps * 6 + Math.sin(t * 0.8 + i * 2) * ps * 2;
      const fy = h - ps * 14 - Math.sin(i * 1.3) * ps * 5 + Math.cos(t * 0.6 + i) * ps;
      const fa = 0.15 + Math.sin(t * 2 + i * 1.5) * 0.1;
      ctx.fillStyle = `rgba(255, 240, 150, ${fa})`;
      ctx.fillRect(fx, fy, ps * 0.6, ps * 0.6);
    }
  },
};
