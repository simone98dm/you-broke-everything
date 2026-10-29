# You Broke Everything — Pixel Dance Meme Studio

Make ridiculous pixel-art dancing loops with authentic mid-2000s meme energy, slap "YOU BROKE EVERYTHING" on them in Impact font, and export them as GIFs, videos, or WhatsApp stickers. Perfect for `#incidents`.

Everything runs in the browser: no backend, no accounts, no API keys.

## Features

- **6 dancers**: SysAdmin Bob, Froggy Vibing, Server Cat, Derp Guy, ServerBot 3000, and a PS2-era Low-Poly Tech Support guy
- **10 dance moves**: Noodle Flail, Caramelldansen, Russian Squat-Kick, Disco Fever, Server Meltdown, The Robot, The Floss, Dab, The Sprinkler, The Running Man
- **9 scenes**: Retro Disco Grid, Windows XP Bliss, Server Inferno, YTMND Hypno Rays, Matrix Code Rain, BSOD, MLG Rave, Illuminati Void, and a transparent background for Discord or Slack
- **6 text effects**: Classic Impact Slam, WordArt Rainbow Wave, XP Error Dialog, 8-Bit Arcade Hazard, Matrix Terminal Glitch, MLG Chromatic Glitch
- **Accessories and modes**: Deal With It shades, party hat, siren, burning server rack, glowsticks, laser eyes, plus Panic Mode and MLG Mode (hitmarkers, Doritos & Dew, Illuminati, sweeping lasers)
- **12 presets**: `DROP DATABASE prod;`, It's Always DNS, Works On My Machine, `git push --force`, Friday 5PM Deploy, and more
- **Tempo and shake controls**: set the BPM and screen-shake intensity, with optional CRT scanlines and confetti
- **Chiptune soundtrack**: a Eurodance loop synthesized live with the Web Audio API (muted until you turn it on)
- **Windows XP–style UI** with keyboard shortcuts and `prefers-reduced-motion` support
- Your settings are saved in `localStorage` between visits

## Export formats

| Format | Details |
| --- | --- |
| **GIF** | 128, 320 or 480 px at 12, 16 or 24 fps. Plays everywhere: Slack, Discord, email, forums. |
| **WebM video** | Smallest file. Recorded in real time at 30 fps. |
| **WhatsApp sticker** | Animated 512×512 WebP, automatically compressed to fit under 500 KB. Needs Chrome, Edge or Firefox. |

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause the animation |
| `E` | Open the export dialog |
| `Ctrl/⌘ + Z` | Undo the last preset or mode change |

## Getting started

**Prerequisites:** Node.js 22.18 or newer (the self-check runs `.ts` files directly in Node).

```bash
npm install
npm run dev       # http://localhost:3000
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `node src/state/memeState.check.ts` | Run the state-logic self-check |

## Tech stack

- [React 19](https://react.dev) + TypeScript
- [Vite](https://vite.dev) + [Tailwind CSS 4](https://tailwindcss.com)
- Canvas 2D renderer with hand-drawn pixel and low-poly sprites
- [gifenc](https://github.com/mattdesl/gifenc) for GIF encoding, a custom muxer for animated WebP, and `MediaRecorder` for WebM
- [canvas-confetti](https://github.com/catdad/canvas-confetti) and [lucide-react](https://lucide.dev)

## Project structure

```
src/
├── App.tsx              # App shell, keyboard shortcuts, audio wiring
├── audio/synth.ts       # Web Audio chiptune engine and sound effects
├── components/          # XP-style windows, control panels, preview, export modal
├── data/                # Characters, moves, scenes, text effects, presets
├── export/              # GIF, WebM and WhatsApp sticker (WebP) exporters
├── hooks/               # Studio state, reduced-motion, safe localStorage
├── renderer/            # Canvas renderer, dance engine, sprites
├── state/               # Pure state transitions and their self-check
└── types/               # Shared types
```

## Contributing

Issues and pull requests are welcome. Before opening a PR, make sure `npm run lint`, `npm run build` and the self-check all pass.

## License

[MIT](LICENSE) © 2026 Simone Dalmas
