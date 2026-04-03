// Sky renderer — renders the real night sky as seen from Quito
// Uses Astronomy module for star positions and STAR_CATALOG for data

const Sky = {
  stars: [],
  backgroundStars: [],
  ambientObjects: [],   // shooting stars, comets, meteorites
  canvas: null,
  ctx: null,
  twinkleTime: 0,
  lastAmbientSpawn: 0,

  // Simple seeded PRNG (mulberry32) — used for faint background fill stars
  _seed: 0,
  seed(s) {
    this._seed = s | 0;
  },
  random() {
    let t = (this._seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },
  dateToSeed(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const ch = dateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return hash;
  },

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  },

  generate(dateStr) {
    this.stars = [];
    this.backgroundStars = [];

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Get real visible stars from the astronomy engine
    const visibleStars = Astronomy.getVisibleStars(dateStr);

    for (const star of visibleStars) {
      const pos = this.altAzToCanvas(star.alt, star.az, w, h);
      if (pos.x < -20 || pos.x > w + 20 || pos.y < -20 || pos.y > h + 20) continue;

      const color = this.bvToColor(star.bv);
      const size = this.magToSize(star.mag);
      const brightness = this.magToBrightness(star.mag);

      this.stars.push({
        x: pos.x,
        y: pos.y,
        size,
        brightness,
        color,
        twinkleSpeed: 1 + (star.mag + 2) * 0.3,
        twinkleOffset: (star.alt * 1000 + star.az * 500) % (Math.PI * 2),
      });
    }

    // Add faint random background stars for atmosphere/fill
    this.seed(this.dateToSeed(dateStr));
    const bgCount = 180;
    for (let i = 0; i < bgCount; i++) {
      this.backgroundStars.push({
        x: this.random() * w,
        y: this.random() * h * 0.92,
        size: this.random() * 0.8 + 0.2,
        brightness: this.random() * 0.12 + 0.03,
        twinkleSpeed: this.random() * 2 + 0.5,
        twinkleOffset: this.random() * Math.PI * 2,
      });
    }
  },

  // Project alt/az onto canvas
  altAzToCanvas(alt, az, w, h) {
    const minAlt = 10 * Math.PI / 180;
    const maxAlt = Math.PI / 2;
    const yNorm = 1 - (alt - minAlt) / (maxAlt - minAlt);

    let azOffset = az - Math.PI;
    if (azOffset > Math.PI) azOffset -= 2 * Math.PI;
    if (azOffset < -Math.PI) azOffset += 2 * Math.PI;

    const halfFov = 110 * Math.PI / 180;
    const xNorm = 0.5 + (azOffset / halfFov) * 0.5;

    return { x: xNorm * w, y: yNorm * h };
  },

  // B-V color index to RGB
  bvToColor(bv) {
    const t = Math.max(-0.4, Math.min(2.0, bv));
    let r, g, b;

    if (t < 0.0) {
      r = 162 + t * 100;
      g = 185 + t * 100;
      b = 255;
    } else if (t < 0.4) {
      r = 255;
      g = 255 - t * 28;
      b = 255 - t * 55;
    } else if (t < 0.8) {
      r = 255;
      g = 244 - (t - 0.4) * 90;
      b = 233 - (t - 0.4) * 190;
    } else {
      r = 255;
      g = 208 - (t - 0.8) * 60;
      b = 157 - (t - 0.8) * 120;
    }

    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b))),
    };
  },

  magToSize(mag) {
    return Math.max(0.6, 3.8 - (mag + 1.5) * 0.45);
  },

  magToBrightness(mag) {
    return Math.max(0.12, 1.0 - (mag + 1.5) * 0.13);
  },

  // --- Night sky gradient ---
  drawBackground() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.3, '#0d0d24');
    gradient.addColorStop(0.7, '#111133');
    gradient.addColorStop(1, '#1a1a2e');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  },

  // --- Moon ---
  drawMoon(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const moonX = w * 0.85;
    const moonY = h * 0.15;
    const moonR = Math.min(w, h) * 0.04;

    // Moon glow (large soft)
    const outerGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 8);
    outerGlow.addColorStop(0, 'rgba(200, 210, 230, 0.06)');
    outerGlow.addColorStop(0.4, 'rgba(180, 190, 220, 0.03)');
    outerGlow.addColorStop(1, 'rgba(180, 190, 220, 0)');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(moonX - moonR * 8, moonY - moonR * 8, moonR * 16, moonR * 16);

    // Inner glow
    const innerGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3);
    innerGlow.addColorStop(0, 'rgba(220, 225, 240, 0.15)');
    innerGlow.addColorStop(1, 'rgba(220, 225, 240, 0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2);
    ctx.fill();

    // Moon disc
    ctx.fillStyle = '#E8E4D8';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Crescent shadow (make it a waxing crescent)
    ctx.fillStyle = '#0d0d24';
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.5, moonY, moonR * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Subtle crater details on the lit part
    ctx.fillStyle = 'rgba(180, 175, 160, 0.3)';
    ctx.beginPath();
    ctx.arc(moonX - moonR * 0.35, moonY - moonR * 0.2, moonR * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX - moonR * 0.2, moonY + moonR * 0.35, moonR * 0.08, 0, Math.PI * 2);
    ctx.fill();
  },

  // --- Ambient shooting stars, comets, meteorites ---
  _spawnAmbient(time) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const elapsed = time - this.lastAmbientSpawn;

    // Spawn frequently — interval between 200ms and 600ms
    if (elapsed < 200 + Math.random() * 400) return;
    if (this.ambientObjects.length >= 15) return;

    this.lastAmbientSpawn = time;

    // Pick type: 70% shooting star, 15% meteorite, 15% comet
    const roll = Math.random();
    let type, speed, size, tailLen, color, life;

    if (roll < 0.70) {
      // Shooting star — fast, thin, white/blue
      type = 'star';
      speed = 3 + Math.random() * 4;
      size = 1.5 + Math.random() * 1.5;
      tailLen = 15 + Math.random() * 15;
      const c = Math.random() < 0.5 ? { r: 255, g: 255, b: 255 } : { r: 200, g: 220, b: 255 };
      color = c;
      life = 800 + Math.random() * 1200;
    } else if (roll < 0.85) {
      // Meteorite — medium, thicker, orange/warm
      type = 'meteorite';
      speed = 2 + Math.random() * 3;
      size = 3 + Math.random() * 2;
      tailLen = 10 + Math.random() * 10;
      color = { r: 255, g: 180 + Math.random() * 50, b: 80 + Math.random() * 60 };
      life = 1000 + Math.random() * 1500;
    } else {
      // Comet — slow, large, long glowing tail
      type = 'comet';
      speed = 0.8 + Math.random() * 1.2;
      size = 4 + Math.random() * 3;
      tailLen = 30 + Math.random() * 30;
      color = { r: 180, g: 220, b: 255 };
      life = 3000 + Math.random() * 3000;
    }

    // Spawn from edges — mostly top and sides
    const edge = Math.random();
    let x, y, angle;
    if (edge < 0.5) {
      // Top
      x = Math.random() * w;
      y = -20;
      angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.6;
    } else if (edge < 0.75) {
      // Left
      x = -20;
      y = Math.random() * h * 0.5;
      angle = -Math.PI * 0.1 + Math.random() * Math.PI * 0.4;
    } else {
      // Right
      x = w + 20;
      y = Math.random() * h * 0.5;
      angle = Math.PI * 0.6 + Math.random() * Math.PI * 0.4;
    }

    this.ambientObjects.push({
      type,
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      color,
      tailLen,
      trail: [],
      born: time,
      life,
      alpha: 0, // fade in
    });
  },

  _updateAmbient(time) {
    this._spawnAmbient(time);

    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = this.ambientObjects.length - 1; i >= 0; i--) {
      const obj = this.ambientObjects[i];
      const age = time - obj.born;

      // Fade in over first 200ms, fade out over last 300ms
      if (age < 200) {
        obj.alpha = age / 200;
      } else if (age > obj.life - 300) {
        obj.alpha = Math.max(0, (obj.life - age) / 300);
      } else {
        obj.alpha = 1;
      }

      // Store trail
      obj.trail.push({ x: obj.x, y: obj.y });
      if (obj.trail.length > obj.tailLen) obj.trail.shift();

      // Move
      obj.x += obj.vx;
      obj.y += obj.vy;

      // Remove if expired or way off screen
      if (age > obj.life || obj.x < -100 || obj.x > w + 100 || obj.y < -100 || obj.y > h + 100) {
        this.ambientObjects.splice(i, 1);
      }
    }
  },

  _renderAmbient() {
    const ctx = this.ctx;

    for (const obj of this.ambientObjects) {
      const { r, g, b } = obj.color;
      const a = obj.alpha;
      if (a <= 0) continue;

      // Trail
      for (let i = 0; i < obj.trail.length; i++) {
        const t = obj.trail[i];
        const progress = i / obj.trail.length;
        const trailAlpha = progress * 0.4 * a;
        const trailSize = obj.size * progress * 0.5;

        if (obj.type === 'comet') {
          // Comet has a wider, more diffuse tail
          const cometGlow = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, trailSize * 3);
          cometGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${trailAlpha * 0.5})`);
          cometGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = cometGlow;
          ctx.beginPath();
          ctx.arc(t.x, t.y, trailSize * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailAlpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head glow
      const glowSize = obj.type === 'comet' ? obj.size * 5 : obj.size * 3;
      const glow = ctx.createRadialGradient(obj.x, obj.y, 0, obj.x, obj.y, glowSize);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.5 * a})`);
      glow.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${0.15 * a})`);
      glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Meteorite ember particles
      if (obj.type === 'meteorite') {
        for (let p = 0; p < 3; p++) {
          const px = obj.x - obj.vx * (p + 1) * 2 + (Math.random() - 0.5) * obj.size * 4;
          const py = obj.y - obj.vy * (p + 1) * 2 + (Math.random() - 0.5) * obj.size * 4;
          const pa = a * (0.3 - p * 0.08);
          ctx.fillStyle = `rgba(255, ${150 + Math.random() * 80}, 50, ${pa})`;
          ctx.beginPath();
          ctx.arc(px, py, 1 + Math.random(), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Core
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Bright center for comets
      if (obj.type === 'comet') {
        ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.8})`;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  // --- Stars ---
  drawStars(time) {
    const ctx = this.ctx;
    this.twinkleTime = time * 0.001;

    // Background fill stars
    for (const star of this.backgroundStars) {
      const twinkle = Math.sin(this.twinkleTime * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.brightness + twinkle * 0.08;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.02, alpha)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Real catalog stars with glow
    for (const star of this.stars) {
      const twinkle = Math.sin(this.twinkleTime * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.brightness + twinkle * 0.15;
      const { r, g, b } = star.color;

      // Glow (only for brighter stars)
      if (star.size > 1.2) {
        const glowSize = star.size * 3;
        const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
        glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0.1, alpha)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  render(time) {
    this.drawBackground();
    this.drawMoon(time);
    this.drawStars(time);
    this._updateAmbient(time);
    this._renderAmbient();
  },
};
