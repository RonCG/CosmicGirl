# Cosmic Girl

A web game where you catch shooting stars under the real sky of Quito.

## About

Cosmic Girl is a 10-level game built with HTML5 Canvas. Each level represents a special date, and the sky you see is a simulation of the real sky over Quito, Ecuador on that night — with real stars and constellations.

### How to play

- Tap the golden shooting stars to catch them
- You need to catch 7 per level before time runs out
- Stars move faster as you progress through levels
- A golden snitch appears randomly — catch it to instantly win the level
- Each level has unique pixel art at the bottom of the screen

### Difficulty

Two modes: **Easy** and **Hard**. Hard mode increases speed, reduces time, and makes stars harder to catch.

## Tech

- HTML5 Canvas for all rendering
- Real astronomy engine (RA/Dec → Alt/Az) to simulate Quito's sky
- Web Audio API for sound effects
- Procedural pixel art for level decorations
- Vanilla JS — no frameworks, no dependencies

## Run locally

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

No install, no build, no dependencies. Just open `index.html`.

---

*All in-game text is in Spanish.*
