/**
 * Complete Canvas Meme Renderer
 * Draws background environments, dancing pixel characters, particle effects,
 * and mid-2000s meme typography.
 */

import { MemeConfig, CharacterId, AccessoryId, TextEffectId, BackgroundId } from '../types/meme';
import { computePose } from './danceEngine';
import { POLY_HEAD_Y, POLY_HEAD_SCALE } from './polySprite';
import { 
  renderCharacter, 
  drawPixel,
  renderLaserEyes,
  renderDoritoBag,
  renderMountainDewCan,
  renderHitmarker,
  renderIlluminatiPyramid,
  renderSniperCrosshair
} from './pixelSprites';

export interface RenderContextOptions {
  canvas: HTMLCanvasElement;
  config: MemeConfig;
  timeMs: number;
  width?: number;
  height?: number;
  isExporting?: boolean;
  reduceMotion?: boolean;
}

export function renderMemeFrame(options: RenderContextOptions) {
  const { canvas, config, timeMs } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = options.width || canvas.width;
  const h = options.height || canvas.height;

  // Set crisp pixelation
  ctx.imageSmoothingEnabled = false;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Compute dance loop phase (0.0 to 1.0)
  // Measure length in ms based on BPM (4 beats = 1 measure)
  const measureDurationMs = (60 / config.bpm) * 4 * 1000;
  const phase = (timeMs % measureDurationMs) / measureDurationMs;

  // Screen shake (Panic mode, MLG mode, or intensity)
  // Live preview skips shake for prefers-reduced-motion; exports keep it so the file matches the settings
  const shakeBase = options.reduceMotion
    ? 0
    : config.isMlgMode ? 8 : (config.isPanicMode ? Math.max(config.shakeIntensity, 6) : config.shakeIntensity);
  let shakeX = 0;
  let shakeY = 0;
  if (shakeBase > 0) {
    shakeX = (Math.random() - 0.5) * shakeBase * 1.5;
    shakeY = (Math.random() - 0.5) * shakeBase * 1.5;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // 1. Draw Background (default to mlg_rave if MLG mode is active and background was default)
  const activeBg = config.isMlgMode && config.backgroundId === 'disco_grid' ? 'mlg_rave' : config.backgroundId;
  renderBackground(ctx, activeBg, w, h, phase, timeMs, config.isPanicMode || config.isMlgMode);

  // 1b. MLG Illuminati in background
  if (config.isMlgMode || config.showIlluminati) {
    const pyramidX = w * 0.82;
    const pyramidY = h * 0.26;
    const pyramidRot = Math.sin(timeMs * 0.002) * 0.25;
    renderIlluminatiPyramid(ctx, pyramidX, pyramidY, (w / 320) * 1.4, pyramidRot, timeMs);
  }

  // 1c. Sweeping Rave Lasers (Background layer)
  if (config.isMlgMode || config.showSweepingLasers) {
    renderSweepingLasers(ctx, w, h, timeMs);
  }

  // 1d. Tumbling Doritos and Mountain Dew cans
  if (config.isMlgMode || config.showDoritosDew) {
    renderDoritosAndDew(ctx, w, h, timeMs);
  }

  // 2. Draw Confetti (if enabled)
  if (config.showConfetti) {
    renderConfetti(ctx, w, h, timeMs);
  }

  // 3. Compute Pose and Draw Character
  const pose = computePose(config.danceMoveId, phase, config.glassesDropped || config.isMlgMode, config.isPanicMode || config.isMlgMode);
  // Scale character based on canvas size (default scale ~3.5 for 320x320)
  const charScale = (w / 320) * 3.4;
  const charCenterX = w * 0.5;
  const charCenterY = h * 0.62;

  renderCharacter(
    ctx,
    config.characterId,
    pose,
    config.isMlgMode ? (config.accessory === 'none' ? 'mlg_shades_blunt' : config.accessory) : config.accessory,
    charCenterX,
    charCenterY,
    charScale
  );

  // 3b. MLG Fiery Red Eye Lasers
  if (config.isMlgMode || config.showLaserEyes || config.accessory === 'laser_eyes') {
    const isPoly = config.characterId === 'polyguy';
    const headAbsX = charCenterX + (pose.bodyX + pose.headX) * charScale;
    const headAbsY = charCenterY + (pose.bodyY + (isPoly ? POLY_HEAD_Y : -18) + pose.headY) * charScale;
    renderLaserEyes(ctx, headAbsX, headAbsY, pose.rotation + pose.headAngle, isPoly ? charScale * POLY_HEAD_SCALE : charScale, w, timeMs);
  }

  // 3c. MLG Sniper Crosshair & Hitmarkers
  if (config.isMlgMode || config.showHitmarkers) {
    renderSniperAndHitmarkers(ctx, charCenterX, charCenterY - 10, w, h, timeMs);
  }

  // 4. Draw Meme Text Overlay
  if (config.showText) {
    const textEffect = config.isMlgMode ? 'mlg_dubstep' : config.textEffectId;
    renderMemeText(
      ctx,
      config.primaryText || (config.isMlgMode ? '360 NO SCOPE' : 'YOU BROKE EVERYTHING'),
      config.secondaryText || (config.isMlgMode ? 'GET REKT' : ''),
      textEffect,
      w,
      h,
      phase,
      timeMs,
      config.isPanicMode || config.isMlgMode
    );
  }

  // 5. Draw CRT Scanlines (if enabled and canvas rendering)
  if (config.showScanlines) {
    renderScanlines(ctx, w, h);
  }

  ctx.restore();
}

/**
 * Backgrounds
 */
function renderBackground(
  ctx: CanvasRenderingContext2D,
  bgId: BackgroundId,
  w: number,
  h: number,
  phase: number,
  timeMs: number,
  isPanic: boolean
) {
  switch (bgId) {
    case 'transparent':
      // Nothing drawn; transparent
      break;

    case 'mlg_rave':
      renderMLGRaveBg(ctx, w, h, phase, timeMs);
      break;

    case 'illuminati_void':
      renderIlluminatiVoidBg(ctx, w, h, timeMs);
      break;

    case 'disco_grid':
      renderDiscoGridBg(ctx, w, h, phase, isPanic);
      break;

    case 'xp_bliss':
      renderXPBlissBg(ctx, w, h, timeMs, isPanic);
      break;

    case 'server_fire':
      renderServerFireBg(ctx, w, h, timeMs, isPanic);
      break;

    case 'ytmnd_hypno':
      renderYTMNDHypnoBg(ctx, w, h, timeMs, isPanic);
      break;

    case 'matrix_rain':
      renderMatrixRainBg(ctx, w, h, timeMs);
      break;

    case 'bsod':
      renderBSODBg(ctx, w, h);
      break;
  }
}

/**
 * 1. Retro Disco Grid Floor
 */
function renderDiscoGridBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: number,
  isPanic: boolean
) {
  // Dark party backdrop
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#09090b');
  grad.addColorStop(0.6, '#18181b');
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Spotlight cones from top corners
  ctx.save();
  const spotAngle = Math.sin(phase * Math.PI * 2) * 0.4;
  ctx.fillStyle = isPanic ? 'rgba(239, 68, 68, 0.25)' : 'rgba(236, 72, 153, 0.2)';
  ctx.beginPath();
  ctx.moveTo(w * 0.2, 0);
  ctx.lineTo(w * 0.5 + Math.sin(spotAngle) * w * 0.4, h * 0.7);
  ctx.lineTo(w * 0.5 + Math.sin(spotAngle + 0.3) * w * 0.4, h * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isPanic ? 'rgba(245, 158, 11, 0.25)' : 'rgba(6, 182, 212, 0.2)';
  ctx.beginPath();
  ctx.moveTo(w * 0.8, 0);
  ctx.lineTo(w * 0.5 - Math.sin(spotAngle) * w * 0.4, h * 0.7);
  ctx.lineTo(w * 0.5 - Math.sin(spotAngle - 0.3) * w * 0.4, h * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Perspective Disco Dance Floor
  const horizonY = h * 0.65;
  const numRows = 7;
  const numCols = 8;
  const beatStep = Math.floor(phase * 8);

  const colors = isPanic
    ? ['#dc2626', '#991b1b', '#f97316', '#7f1d1d']
    : ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  for (let r = 0; r < numRows; r++) {
    const rowY1 = horizonY + Math.pow(r / numRows, 1.8) * (h - horizonY);
    const rowY2 = horizonY + Math.pow((r + 1) / numRows, 1.8) * (h - horizonY);

    for (let c = 0; c < numCols; c++) {
      const colX1 = (c / numCols) * w;
      const colX2 = ((c + 1) / numCols) * w;

      const colorIdx = (c + r + beatStep) % colors.length;
      ctx.fillStyle = colors[colorIdx];
      ctx.fillRect(colX1, rowY1, colX2 - colX1 - 1, rowY2 - rowY1 - 1);
    }
  }
}

/**
 * 2. Windows XP Bliss Hill + Cascading Error Boxes
 */
function renderXPBlissBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeMs: number,
  isPanic: boolean
) {
  // Cyan Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  skyGrad.addColorStop(0, '#0ea5e9');
  skyGrad.addColorStop(1, '#7dd3fc');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Pixel Sun
  drawPixel(ctx, w * 0.8, h * 0.1, 24, 24, '#fef08a');

  // Fluffy clouds
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(w * 0.25, h * 0.2, 18, 0, Math.PI * 2);
  ctx.arc(w * 0.32, h * 0.18, 24, 0, Math.PI * 2);
  ctx.arc(w * 0.4, h * 0.2, 18, 0, Math.PI * 2);
  ctx.fill();

  // Rolling Green Hill
  const hillGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
  hillGrad.addColorStop(0, '#65a30d');
  hillGrad.addColorStop(1, '#365314');
  ctx.fillStyle = hillGrad;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.65);
  ctx.quadraticCurveTo(w * 0.45, h * 0.48, w, h * 0.62);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Cascading Windows XP Error Dialogs in background
  const numWindows = isPanic ? 7 : 4;
  for (let i = 0; i < numWindows; i++) {
    const ox = ((i * 38 + timeMs * 0.02) % (w * 0.75)) + 10;
    const oy = h * 0.12 + (i * 26) % (h * 0.4);
    renderMiniXPErrorBox(ctx, ox, oy, 110, 46, i);
  }
}

function renderMiniXPErrorBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bw: number,
  bh: number,
  idx: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Bevel outer
  ctx.fillStyle = '#ece9d8';
  ctx.fillRect(0, 0, bw, bh);
  ctx.strokeStyle = '#0055ea';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, bw, bh);

  // Blue Title bar
  const titleGrad = ctx.createLinearGradient(0, 0, bw, 0);
  titleGrad.addColorStop(0, '#0055ea');
  titleGrad.addColorStop(1, '#3a93fc');
  ctx.fillStyle = titleGrad;
  ctx.fillRect(1, 1, bw - 2, 12);

  // White Title text
  ctx.fillStyle = '#ffffff';
  ctx.font = '7px sans-serif';
  ctx.fillText(`Error 0x8000400${idx}`, 4, 9);

  // Red X button
  ctx.fillStyle = '#e81123';
  ctx.fillRect(bw - 11, 2, 9, 9);
  ctx.fillStyle = '#ffffff';
  ctx.font = '6px sans-serif';
  ctx.fillText('x', bw - 8, 8);

  // Red Error Circle (X) icon
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(10, 26, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('X', 7, 29);

  // Body text
  ctx.fillStyle = '#000000';
  ctx.font = '6px sans-serif';
  ctx.fillText('Fatal crash occurred.', 20, 24);
  ctx.fillText('Memory dump failed.', 20, 31);

  ctx.restore();
}

/**
 * 3. Server Room Inferno
 */
function renderServerFireBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeMs: number,
  isPanic: boolean
) {
  // Dark smoky background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // Flashing red emergency alarm
  const alarmFlash = Math.sin(timeMs * 0.01) > 0;
  if (alarmFlash) {
    ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
    ctx.fillRect(0, 0, w, h);
  }

  // Server rack silhouettes in background
  const numRacks = 5;
  const rackW = w / numRacks;
  for (let i = 0; i < numRacks; i++) {
    const rx = i * rackW;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rx + 4, h * 0.35, rackW - 8, h * 0.65);

    // Blinking rack lights
    for (let r = 0; r < 5; r++) {
      const ry = h * 0.4 + r * 14;
      const isRed = (i + r + Math.floor(timeMs / 200)) % 2 === 0;
      ctx.fillStyle = isRed ? '#ef4444' : '#22c55e';
      ctx.fillRect(rx + 8, ry, 3, 2);
    }

    // The racks themselves are burning: ember glow on the front, flames licking off the top, smoke above
    const rackTop = h * 0.35;
    ctx.fillStyle = 'rgba(249, 115, 22, 0.18)';
    ctx.fillRect(rx + 4, rackTop, rackW - 8, h * 0.2);
    const tongues = 3;
    const tongueW = (rackW - 8) / tongues;
    for (let t = 0; t < tongues; t++) {
      const tx = rx + 4 + t * tongueW;
      const flick = Math.sin(timeMs * 0.02 + i * 1.7 + t * 2.3);
      const tongueH = h * 0.09 + flick * h * 0.035 + (t === 1 ? h * 0.03 : 0);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(tx, rackTop - tongueH, tongueW, tongueH);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(tx + 2, rackTop - tongueH * 0.7, tongueW - 4, tongueH * 0.7);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(tx + 4, rackTop - tongueH * 0.35, Math.max(1, tongueW - 8), tongueH * 0.35);
    }
    for (let p = 0; p < 3; p++) {
      const rise = ((timeMs * 0.03 + p * 40 + i * 25) % 120);
      ctx.fillStyle = `rgba(100, 116, 139, ${0.35 * (1 - rise / 120)})`;
      const puff = 6 + rise * 0.12;
      ctx.fillRect(rx + rackW / 2 - puff / 2 + Math.sin(rise * 0.05 + i) * 6, rackTop - h * 0.1 - rise, puff, puff);
    }
  }

  // Flames at bottom
  const flameH = 45;
  const numFlames = 16;
  const stepW = w / numFlames;
  for (let i = 0; i < numFlames; i++) {
    const fx = i * stepW;
    const fHeight = flameH + Math.sin(timeMs * 0.015 + i) * 12;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(fx, h - fHeight, stepW, fHeight);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(fx + 2, h - fHeight + 8, stepW - 4, fHeight - 8);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(fx + 4, h - fHeight + 16, stepW - 8, fHeight - 16);
  }
}

/**
 * 4. YTMND Hypnotic Sunburst Spiral (Peak 2005)
 */
function renderYTMNDHypnoBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeMs: number,
  isPanic: boolean
) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const numRays = 16;
  const rot = (timeMs * 0.002) % (Math.PI * 2);

  const col1 = isPanic ? '#ef4444' : '#f43f5e';
  const col2 = isPanic ? '#7f1d1d' : '#facc15';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  const radius = Math.max(w, h) * 1.5;
  for (let i = 0; i < numRays; i++) {
    const a1 = (i / numRays) * Math.PI * 2;
    const a2 = ((i + 0.5) / numRays) * Math.PI * 2;

    ctx.fillStyle = i % 2 === 0 ? col1 : col2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, a1, a2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 5. Matrix Code Rain
 */
function renderMatrixRainBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeMs: number
) {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);

  const colWidth = 14;
  const cols = Math.floor(w / colWidth);
  const glyphs = '0123456789ABCDEF!@#$%&*<>{}[]=';

  ctx.font = '10px monospace';
  for (let c = 0; c < cols; c++) {
    const speed = 0.08 + (c % 4) * 0.02;
    const streamY = ((timeMs * speed + c * 35) % (h + 80)) - 40;

    for (let r = 0; r < 8; r++) {
      const gy = streamY - r * 12;
      if (gy > 0 && gy < h) {
        const glyphChar = glyphs[(c + r + Math.floor(timeMs / 100)) % glyphs.length];
        if (r === 0) {
          ctx.fillStyle = '#ffffff'; // Leading bright head
        } else if (r < 3) {
          ctx.fillStyle = '#4ade80';
        } else {
          ctx.fillStyle = 'rgba(22, 163, 74, 0.4)';
        }
        ctx.fillText(glyphChar, c * colWidth + 2, gy);
      }
    }
  }
}

/**
 * 6. BSOD (Blue Screen of Death)
 */
function renderBSODBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0000aa';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.font = '8px monospace';
  ctx.fillText('A problem has been detected and Windows has been shut down.', 12, 22);
  ctx.fillText('to prevent damage to your computer.', 12, 34);
  ctx.fillText('*** STOP: 0x000000D1 (0x0000000C,0x00000002,0x00000000)', 12, 54);
  ctx.fillText('*** YOU_BROKE_EVERYTHING.SYS - Address F86B5A89 base at F86B5000', 12, 68);
  ctx.fillText('Beginning dump of physical memory...', 12, 88);
  ctx.fillText('Physical memory dump complete.', 12, 100);
  ctx.fillText('Contact your system administrator or technical support group.', 12, 114);
}

/**
 * Confetti Particles
 */
function renderConfetti(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeMs: number
) {
  const numPieces = 28;
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#fde047'];

  for (let i = 0; i < numPieces; i++) {
    const x = (i * 37 + Math.sin(timeMs * 0.003 + i) * 20) % w;
    const y = ((timeMs * 0.12 + i * 29) % (h + 30)) - 10;
    const color = colors[i % colors.length];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(timeMs * 0.005 * ((i % 2 === 0) ? 1 : -1));
    drawPixel(ctx, -2, -2, 5, 5, color);
    ctx.restore();
  }
}

/**
 * CRT Scanline Raster Lines
 */
function renderScanlines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
}

/**
 * Meme Text Rendering
 */
function renderMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  secondaryText: string,
  effectId: TextEffectId,
  w: number,
  h: number,
  phase: number,
  timeMs: number,
  isPanic: boolean
) {
  ctx.save();
  const upper = text.toUpperCase();
  const subUpper = (secondaryText || '').toUpperCase();

  switch (effectId) {
    case 'impact_slam':
      renderImpactSlam(ctx, upper, subUpper, w, h, phase, isPanic);
      break;

    case 'rainbow_wave':
      renderRainbowWave(ctx, upper, subUpper, w, h, timeMs);
      break;

    case 'xp_error_box':
      renderXPErrorDialog(ctx, upper, subUpper, w, h, phase);
      break;

    case 'arcade_flash':
      renderArcadeFlash(ctx, upper, subUpper, w, h, timeMs);
      break;

    case 'matrix_glitch':
      renderMatrixGlitchText(ctx, upper, subUpper, w, h, timeMs);
      break;

    case 'mlg_dubstep':
      renderMLGDubstepText(ctx, upper, subUpper, w, h, timeMs);
      break;
  }

  ctx.restore();
}

/**
 * A. Classic Meme Impact Text with Slam Bounce
 */
function renderImpactSlam(
  ctx: CanvasRenderingContext2D,
  text: string,
  sub: string,
  w: number,
  h: number,
  phase: number,
  isPanic: boolean
) {
  // Slam bounce on beat 0
  const bounce = Math.sin(phase * Math.PI * 4);
  const scale = 1 + (bounce > 0 ? bounce * 0.08 : 0);

  ctx.save();
  ctx.translate(w * 0.5, h * 0.18);
  ctx.scale(scale, scale);

  const fontSize = Math.max(16, Math.floor(w * 0.085));
  ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 4px Black border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(4, fontSize * 0.2);
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 2;
  ctx.strokeText(text, 0, 0);

  // White text fill (or flashing yellow if panic)
  ctx.fillStyle = isPanic && Math.sin(phase * Math.PI * 4) > 0 ? '#facc15' : '#ffffff';
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // Secondary text on bottom
  if (sub) {
    ctx.save();
    ctx.translate(w * 0.5, h * 0.88);
    const subFontSize = Math.max(12, Math.floor(w * 0.055));
    ctx.font = `900 ${subFontSize}px Impact, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(3, subFontSize * 0.2);
    ctx.strokeText(sub, 0, 0);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
}

/**
 * B. 2000s WordArt Rainbow Wave
 */
function renderRainbowWave(
  ctx: CanvasRenderingContext2D,
  text: string,
  sub: string,
  w: number,
  h: number,
  timeMs: number
) {
  ctx.save();
  const fontSize = Math.max(14, Math.floor(w * 0.075));
  ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = w * 0.5;
  const cy = h * 0.17;

  // 3D Extrusion Shadow
  for (let s = 5; s >= 1; s--) {
    ctx.fillStyle = '#0f172a';
    ctx.fillText(text, cx + s, cy + s);
  }

  // Rainbow linear gradient
  const rainbowGrad = ctx.createLinearGradient(cx - w * 0.4, cy, cx + w * 0.4, cy);
  const hueShift = (timeMs * 0.1) % 360;
  rainbowGrad.addColorStop(0, `hsl(${hueShift}, 100%, 55%)`);
  rainbowGrad.addColorStop(0.33, `hsl(${(hueShift + 90) % 360}, 100%, 55%)`);
  rainbowGrad.addColorStop(0.66, `hsl(${(hueShift + 180) % 360}, 100%, 55%)`);
  rainbowGrad.addColorStop(1, `hsl(${(hueShift + 270) % 360}, 100%, 55%)`);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeText(text, cx, cy);

  ctx.fillStyle = rainbowGrad;
  ctx.fillText(text, cx, cy);

  if (sub) {
    ctx.font = `900 ${Math.floor(fontSize * 0.7)}px "Arial Black", Impact, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeText(sub, cx, h * 0.88);
    ctx.fillText(sub, cx, h * 0.88);
  }

  ctx.restore();
}

/**
 * C. Authentic Windows XP Critical Error Box
 */
function renderXPErrorDialog(
  ctx: CanvasRenderingContext2D,
  text: string,
  sub: string,
  w: number,
  h: number,
  phase: number
) {
  const boxW = Math.min(w * 0.9, 290);
  const boxH = sub ? 74 : 64;
  const bx = (w - boxW) * 0.5;
  const by = h * 0.08;

  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(bx + 4, by + 4, boxW, boxH);

  // Dialog Body
  ctx.fillStyle = '#ece9d8';
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeStyle = '#0055ea';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, boxW, boxH);

  // XP Blue Gradient Title Bar
  const tGrad = ctx.createLinearGradient(bx, by, bx + boxW, by);
  tGrad.addColorStop(0, '#0055ea');
  tGrad.addColorStop(1, '#3a93fc');
  ctx.fillStyle = tGrad;
  ctx.fillRect(bx + 2, by + 2, boxW - 4, 16);

  // Title Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Critical Error: System Halt', bx + 6, by + 13);

  // Red Close X
  ctx.fillStyle = '#e81123';
  ctx.fillRect(bx + boxW - 16, by + 3, 13, 13);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('×', bx + boxW - 13, by + 12);

  // Red Error (X) Circle Icon
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(bx + 22, by + 38, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', bx + 22, by + 43);

  // Main text
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.font = 'bold 10px Tahoma, sans-serif';
  ctx.fillText(text, bx + 40, by + 34);

  if (sub) {
    ctx.font = '9px Tahoma, sans-serif';
    ctx.fillText(sub, bx + 40, by + 48);
  }

  // Windows XP Button [OK]
  const btnW = 48;
  const btnH = 17;
  const btnX = bx + boxW - btnW - 8;
  const btnY = by + boxH - btnH - 6;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#0055ea';
  ctx.lineWidth = 1;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = '#000000';
  ctx.font = '9px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OK', btnX + btnW * 0.5, btnY + 12);

  ctx.restore();
}

/**
 * D. 8-Bit Arcade Warning Flash
 */
function renderArcadeFlash(
  ctx: CanvasRenderingContext2D,
  text: string,
  sub: string,
  w: number,
  h: number,
  timeMs: number
) {
  const isFlash = Math.sin(timeMs * 0.012) > 0;
  const textColor = isFlash ? '#facc15' : '#ef4444';
  const fontSize = Math.max(10, Math.floor(w * 0.046));

  ctx.save();
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Hazard stripe bar behind text
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, h * 0.12, w, fontSize * 2.2);

  ctx.fillStyle = textColor;
  ctx.fillText(text, w * 0.5, h * 0.12 + fontSize * 1.1);

  if (sub) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, h * 0.85, w, fontSize * 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, w * 0.5, h * 0.85 + fontSize * 0.9);
  }

  ctx.restore();
}

/**
 * E. Matrix Terminal Glitch
 */
function renderMatrixGlitchText(
  ctx: CanvasRenderingContext2D,
  text: string,
  sub: string,
  w: number,
  h: number,
  timeMs: number
) {
  const fontSize = Math.max(12, Math.floor(w * 0.065));
  ctx.save();
  ctx.font = `bold ${fontSize}px "VT323", monospace`;
  ctx.textAlign = 'center';

  // Terminal box
  ctx.fillStyle = 'rgba(2, 44, 34, 0.85)';
  ctx.fillRect(w * 0.05, h * 0.1, w * 0.9, fontSize * 2.2);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(w * 0.05, h * 0.1, w * 0.9, fontSize * 2.2);

  // Blinking green text
  const blink = Math.sin(timeMs * 0.01) > 0 ? '_' : ' ';
  ctx.fillStyle = '#4ade80';
  ctx.fillText(`> ${text} ${blink}`, w * 0.5, h * 0.1 + fontSize * 1.5);

  if (sub) {
    ctx.fillStyle = 'rgba(2, 44, 34, 0.85)';
    ctx.fillRect(w * 0.05, h * 0.84, w * 0.9, fontSize * 1.8);
    ctx.strokeRect(w * 0.05, h * 0.84, w * 0.9, fontSize * 1.8);
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`[STATUS: ${sub}]`, w * 0.5, h * 0.84 + fontSize * 1.2);
  }

  ctx.restore();
}

/**
 * MLG Rave Dancefloor Background with Pulsing Strobes & Lasers
 */
function renderMLGRaveBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: number,
  timeMs: number
) {
  // Dark void background with subtle strobe
  const strobe = Math.sin(timeMs * 0.02) > 0.85;
  ctx.fillStyle = strobe ? '#1e1b4b' : '#030712';
  ctx.fillRect(0, 0, w, h);

  // Expanding bass shockwave rings from center
  const ringPhase = (timeMs * 0.003) % 1;
  const ringRadius = ringPhase * (w * 0.8);
  ctx.strokeStyle = `rgba(34, 197, 94, ${1 - ringPhase})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.55, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Perspective Neon Rave Grid Floor
  const horizonY = h * 0.62;
  const numRows = 7;
  const numCols = 8;
  const beatStep = Math.floor(phase * 8);

  const neonColors = ['#22c55e', '#ec4899', '#06b6d4', '#eab308', '#a855f7', '#ef4444'];

  for (let r = 0; r < numRows; r++) {
    const rowY1 = horizonY + Math.pow(r / numRows, 1.8) * (h - horizonY);
    const rowY2 = horizonY + Math.pow((r + 1) / numRows, 1.8) * (h - horizonY);

    for (let c = 0; c < numCols; c++) {
      const colX1 = (c / numCols) * w;
      const colX2 = ((c + 1) / numCols) * w;

      const colorIdx = (c + r + beatStep) % neonColors.length;
      ctx.fillStyle = neonColors[colorIdx];
      ctx.fillRect(colX1, rowY1, colX2 - colX1 - 1, rowY2 - rowY1 - 1);
    }
  }
}

/**
 * MLG Illuminati Void Background
 */
function renderIlluminatiVoidBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeMs: number
) {
  // Deep dark emerald void
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w);
  bgGrad.addColorStop(0, '#022c22');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Large rotating wireframe pyramid in background
  ctx.save();
  ctx.translate(w * 0.5, h * 0.45);
  ctx.rotate(timeMs * 0.001);

  ctx.strokeStyle = 'rgba(74, 222, 128, 0.18)';
  ctx.lineWidth = 2;
  const pSize = w * 0.38;
  ctx.beginPath();
  ctx.moveTo(0, -pSize);
  ctx.lineTo(pSize * 0.9, pSize * 0.8);
  ctx.lineTo(-pSize * 0.9, pSize * 0.8);
  ctx.closePath();
  ctx.stroke();

  // Inner rings
  ctx.beginPath();
  ctx.arc(0, pSize * 0.15, pSize * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Floating green matrix particles
  const numDots = 20;
  for (let i = 0; i < numDots; i++) {
    const dx = (i * 47 + Math.sin(timeMs * 0.002 + i) * 30) % w;
    const dy = (h - (timeMs * 0.05 + i * 33) % (h + 40));
    drawPixel(ctx, dx, dy, 3, 3, '#4ade80');
  }
}

/**
 * Sweeping Rave Lasers across the viewport
 */
function renderSweepingLasers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeMs: number
) {
  ctx.save();

  // 4 sweeping lasers
  const lasers = [
    { color: '#ef4444', speed: 0.0025, phase: 0, startX: 0, startY: 0 },
    { color: '#22c55e', speed: 0.003, phase: 1.5, startX: w, startY: 0 },
    { color: '#06b6d4', speed: 0.002, phase: 3.14, startX: 0, startY: h * 0.4 },
    { color: '#ec4899', speed: 0.0035, phase: 4.5, startX: w, startY: h * 0.4 }
  ];

  lasers.forEach(laser => {
    const sweepAngle = Math.sin(timeMs * laser.speed + laser.phase) * 0.8 + 0.4;
    const endX = laser.startX === 0 ? w : 0;
    const endY = (Math.sin(timeMs * laser.speed * 1.5 + laser.phase) * 0.5 + 0.5) * h;

    // Translucent outer bloom
    ctx.strokeStyle = laser.color;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(laser.startX, laser.startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Medium bright core
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(laser.startX, laser.startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // White blinding beam center
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(laser.startX, laser.startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Laser emitter flare
    drawPixel(ctx, laser.startX - 3, laser.startY - 3, 6, 6, '#ffffff');
  });

  ctx.restore();
}

/**
 * Tumbling Doritos Bags and Mountain Dew Cans
 */
function renderDoritosAndDew(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeMs: number
) {
  const t = timeMs * 0.002;
  const s = (w / 320) * 0.95;

  // Dorito Bag 1 (Top Left)
  renderDoritoBag(
    ctx,
    w * 0.16 + Math.sin(t) * 12,
    h * 0.26 + Math.cos(t * 1.3) * 15,
    s,
    Math.sin(t * 0.8) * 0.4
  );

  // Mountain Dew Can 1 (Top Right)
  renderMountainDewCan(
    ctx,
    w * 0.82 + Math.cos(t * 1.1) * 10,
    h * 0.32 + Math.sin(t * 1.2) * 16,
    s,
    Math.cos(t * 0.9) * 0.5
  );

  // Dorito Bag 2 (Bottom Right)
  renderDoritoBag(
    ctx,
    w * 0.84 + Math.sin(t * 1.2) * 10,
    h * 0.76 + Math.cos(t) * 12,
    s * 0.85,
    -0.5 + Math.sin(t) * 0.3
  );

  // Mountain Dew Can 2 (Bottom Left)
  renderMountainDewCan(
    ctx,
    w * 0.18 + Math.cos(t * 0.9) * 12,
    h * 0.78 + Math.sin(t * 1.4) * 10,
    s * 0.85,
    0.4 + Math.cos(t * 1.1) * 0.3
  );
}

/**
 * Sniper Crosshair 360 & Hitmarkers
 */
function renderSniperAndHitmarkers(
  ctx: CanvasRenderingContext2D,
  charCenterX: number,
  charCenterY: number,
  w: number,
  h: number,
  timeMs: number
) {
  // 360 rotating sniper crosshair over character
  const crosshairAngle = (timeMs * 0.006) % (Math.PI * 2);
  const crosshairRadius = Math.max(18, Math.floor(w * 0.085));
  renderSniperCrosshair(ctx, charCenterX, charCenterY - 12, crosshairRadius, crosshairAngle);

  // Periodic popping hitmarkers
  const hitStep = Math.floor(timeMs / 220) % 4;
  if (hitStep < 3) {
    const offsets = [
      { x: -28, y: -22 },
      { x: 30, y: -16 },
      { x: 0, y: 18 }
    ];
    const off = offsets[hitStep];
    renderHitmarker(ctx, charCenterX + off.x, charCenterY + off.y, 16);
  }
}

/**
 * MLG Dubstep Text with Chromatic RGB Glitch
 */
function renderMLGDubstepText(
  ctx: CanvasRenderingContext2D,
  text: string,
  sub: string,
  w: number,
  h: number,
  timeMs: number
) {
  ctx.save();
  const fontSize = Math.max(16, Math.floor(w * 0.085));
  ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = w * 0.5;
  const cy = h * 0.17;
  const bounce = Math.sin(timeMs * 0.02) * 4;

  // Red Channel Shift
  ctx.fillStyle = '#ef4444';
  ctx.fillText(text, cx - 4, cy + bounce);

  // Cyan Channel Shift
  ctx.fillStyle = '#06b6d4';
  ctx.fillText(text, cx + 4, cy + bounce);

  // Solid White with heavy Black border on top
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(4, fontSize * 0.22);
  ctx.strokeText(text, cx, cy + bounce);

  // Rainbow flashing fill
  const hue = (timeMs * 0.2) % 360;
  ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
  ctx.fillText(text, cx, cy + bounce);

  // Subtitle (GET REKT / 360 NO SCOPE)
  if (sub) {
    const subFontSize = Math.max(12, Math.floor(w * 0.055));
    ctx.font = `900 ${subFontSize}px Impact, "Arial Black", sans-serif`;
    const subY = h * 0.88;

    ctx.fillStyle = '#ef4444';
    ctx.fillText(sub, cx - 3, subY);
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(sub, cx + 3, subY);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.strokeText(sub, cx, subY);

    ctx.fillStyle = '#fef08a';
    ctx.fillText(sub, cx, subY);
  }

  ctx.restore();
}
