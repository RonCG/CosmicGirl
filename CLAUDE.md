# Cosmic Girl (GisGame)

A romantic HTML5 Canvas game where the player catches shooting stars across 10 levels, each representing a real date in Ron and Giselle's relationship. The sky on each level simulates the actual sky over Quito, Ecuador on that date.

## Architecture

Pure vanilla JS — no frameworks, no build step. Open `index.html` directly or serve with any static server.

### File structure

- `index.html` — All screens (title, level intro, HUD, level complete, level failed, finale)
- `css/style.css` — All styles, responsive for mobile
- `js/star-catalog.js` — Real star data (RA/Dec/magnitude)
- `js/astronomy.js` — Coordinate transforms: Julian Date, GMST, LST, RA/Dec → Alt/Az for Quito (-0.1807° lat)
- `js/levels.js` — 10 level definitions: dates, titles, speeds, timers, goals, completion stories
- `js/sky.js` — Canvas rendering: sky gradient, real stars with twinkle, pixel-art moon, ambient objects (comets, meteorites)
- `js/decorations.js` — Per-level pixel art at bottom of canvas (cats, wedding, violin, McDonald's M, car, TV, etc.) + title and finale scenes
- `js/game.js` — Gameplay engine: shooting star spawning/movement, snitch, catch detection, timer, audio (Web Audio API), moon Easter egg
- `js/ui.js` — Screen transitions, HUD updates, catch effects
- `js/main.js` — App init, game flow (level progression, finale sequence with 10 steps), difficulty system, render loop
- `audio/` — ambient.mp3 (background loop), firework.mp3 (unused), firework_ambient.mp3 (finale loop)

### Key concepts

- **Difficulty**: Easy (default) or Hard. Hard mode multiplies speed (1.8x), reduces intervals (0.7x), halves star life, reduces timer (0.7x), shrinks hit radii
- **Snitch**: Golden winged object that appears randomly mid-level; catching it instantly wins the level
- **Moon Easter egg**: Hold the moon for 5 seconds during gameplay to instantly win (debug/Easter egg). Triggers wobble + flash + snitch sound
- **Finale**: 10-step sequence after all levels — includes screenplay scene, Godard/Truffaut question, proposal ("¿quieres ser mi novia?"), heart animation + fireworks
- **Pixel art scaling**: Uses different divisor for mobile (<768px) vs desktop to keep decorations proportionally visible

## Development

```bash
# Serve locally
python3 -m http.server 8000
# Then open http://localhost:8000
```

No dependencies. No build. No tests.

## Language

All user-facing text is in Spanish.
