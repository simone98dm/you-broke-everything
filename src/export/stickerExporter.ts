/**
 * WhatsApp Sticker Exporter
 * Encodes the meme loop as a 512x512 animated WebP within WhatsApp's 500 KB sticker limit.
 * Each frame is encoded by the browser's native WebP encoder, then muxed into an animated WebP.
 */

import { MemeConfig, ExportSettings } from '../types/meme';
import { renderMemeFrame } from '../renderer/canvasRenderer';
import { ExportProgress, ExportResult, formatBytes } from './gifExporter';

const STICKER_SIZE = 512;
const MAX_STICKER_BYTES = 500 * 1024;

// Tried in order until the sticker fits under MAX_STICKER_BYTES
const ENCODE_ATTEMPTS = [
  { quality: 0.8, maxFps: 24 },
  { quality: 0.6, maxFps: 16 },
  { quality: 0.45, maxFps: 12 },
  { quality: 0.3, maxFps: 10 }
];

interface EncodedFrame {
  chunks: Uint8Array[]; // ALPH (optional) + VP8/VP8L chunks, headers included
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Frame encoding failed'));
      // Safari silently falls back to PNG when it cannot encode WebP
      if (blob.type !== 'image/webp') {
        return reject(new Error('This browser cannot encode WebP. Try Chrome, Edge or Firefox.'));
      }
      resolve(blob);
    }, 'image/webp', quality);
  });
}

function readFourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

/** Pulls the image chunks (ALPH, VP8, VP8L) out of a single-frame WebP file */
function extractImageChunks(bytes: Uint8Array): EncodedFrame {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: Uint8Array[] = [];
  let offset = 12; // skip "RIFF" + size + "WEBP"
  while (offset + 8 <= bytes.length) {
    const fourCC = readFourCC(bytes, offset);
    const size = view.getUint32(offset + 4, true);
    const paddedEnd = offset + 8 + size + (size & 1);
    if (fourCC === 'ALPH' || fourCC === 'VP8 ' || fourCC === 'VP8L') {
      chunks.push(bytes.subarray(offset, paddedEnd));
    }
    offset = paddedEnd;
  }
  if (chunks.length === 0) throw new Error('Encoded frame contained no image data');
  return { chunks };
}

function chunk(fourCC: string, payload: Uint8Array): Uint8Array {
  const padded = payload.length + (payload.length & 1);
  const out = new Uint8Array(8 + padded);
  for (let i = 0; i < 4; i++) out[i] = fourCC.charCodeAt(i);
  new DataView(out.buffer).setUint32(4, payload.length, true);
  out.set(payload, 8);
  return out;
}

function writeUint24(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
  target[offset + 2] = (value >> 16) & 0xff;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** Builds an infinitely looping animated WebP (RIFF/VP8X/ANIM/ANMF) from encoded frames */
export function muxAnimatedWebp(frames: EncodedFrame[], width: number, height: number, frameDurationMs: number): Uint8Array {
  const vp8x = new Uint8Array(10);
  vp8x[0] = 0x10 | 0x02; // alpha + animation flags
  writeUint24(vp8x, 4, width - 1);
  writeUint24(vp8x, 7, height - 1);

  const anim = new Uint8Array(6); // transparent background, loop count 0 = forever

  const anmfChunks = frames.map(frame => {
    const header = new Uint8Array(16);
    writeUint24(header, 6, width - 1);
    writeUint24(header, 9, height - 1);
    writeUint24(header, 12, frameDurationMs);
    header[15] = 0x02; // do not blend: each frame fully replaces the last (needed for transparency)
    return chunk('ANMF', concat([header, ...frame.chunks]));
  });

  const body = concat([
    new TextEncoder().encode('WEBP'),
    chunk('VP8X', vp8x),
    chunk('ANIM', anim),
    ...anmfChunks
  ]);
  return chunk('RIFF', body);
}

async function encodeSticker(
  config: MemeConfig,
  settings: ExportSettings,
  attempt: (typeof ENCODE_ATTEMPTS)[number],
  attemptLabel: string,
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = STICKER_SIZE;
  canvas.height = STICKER_SIZE;

  const measureDurationMs = (60 / config.bpm) * 4 * 1000;
  const totalDurationMs = measureDurationMs * settings.loopCycles;
  const fps = Math.min(settings.fps, attempt.maxFps);
  const totalFrames = Math.max(12, Math.round((totalDurationMs / 1000) * fps));
  const frameDurationMs = Math.round(totalDurationMs / totalFrames);

  const frames: EncodedFrame[] = [];
  for (let f = 0; f < totalFrames; f++) {
    signal?.throwIfAborted();
    renderMemeFrame({
      canvas,
      config,
      timeMs: (f / totalFrames) * totalDurationMs,
      width: STICKER_SIZE,
      height: STICKER_SIZE,
      isExporting: true
    });
    const blob = await canvasToWebp(canvas, attempt.quality);
    frames.push(extractImageChunks(new Uint8Array(await blob.arrayBuffer())));

    onProgress?.({
      currentFrame: f + 1,
      totalFrames,
      percent: Math.round(((f + 1) / totalFrames) * 100),
      status: `${attemptLabel}Encoding sticker frame ${f + 1}/${totalFrames}...`
    });
  }

  return muxAnimatedWebp(frames, STICKER_SIZE, STICKER_SIZE, frameDurationMs);
}

/**
 * Generates a WhatsApp-ready animated sticker, lowering quality/fps until it fits in 500 KB
 */
export async function generateWhatsAppSticker(
  config: MemeConfig,
  settings: ExportSettings,
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<ExportResult> {
  for (let i = 0; i < ENCODE_ATTEMPTS.length; i++) {
    const label = i === 0 ? '' : `Shrinking (pass ${i + 1}) — `;
    const bytes = await encodeSticker(config, settings, ENCODE_ATTEMPTS[i], label, onProgress, signal);
    if (bytes.length > MAX_STICKER_BYTES) continue;

    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/webp' });
    const safeName = (config.primaryText || 'you-broke-everything')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);

    return {
      blob,
      url: URL.createObjectURL(blob),
      filename: `${safeName}-${config.characterId}-whatsapp-sticker.webp`,
      fileSizeBytes: blob.size,
      formattedSize: formatBytes(blob.size),
      width: STICKER_SIZE,
      height: STICKER_SIZE,
      format: 'webp'
    };
  }
  throw new Error('Sticker is over WhatsApp\'s 500 KB limit. Try 1 beat cycle or a simpler background.');
}
