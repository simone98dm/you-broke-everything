/**
 * Client-Side GIF and Video Exporter
 * Encodes looping animated GIF89a files and WebM video clips directly in the browser.
 */

import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { MemeConfig, ExportSettings } from '../types/meme';
import { renderMemeFrame } from '../renderer/canvasRenderer';

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percent: number;
  status: string;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
  fileSizeBytes: number;
  formattedSize: string;
  width: number;
  height: number;
  format: 'gif' | 'webm' | 'webp';
}

/**
 * Format bytes into readable KB / MB
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Encodes the current meme animation into a looping animated GIF
 */
export async function generateGif(
  config: MemeConfig,
  settings: ExportSettings,
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<ExportResult> {
  const width = settings.resolution;
  const height = settings.resolution;

  // Offscreen canvas for rendering frames
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create canvas 2D context');

  // Compute loop parameters
  // 1 measure = (60 / bpm) * 4 seconds
  const measureDurationMs = (60 / config.bpm) * 4 * 1000;
  const totalDurationMs = measureDurationMs * settings.loopCycles;

  const fps = settings.fps;
  const totalFrames = Math.max(12, Math.round((totalDurationMs / 1000) * fps));
  const frameDelayMs = Math.round(1000 / fps);

  // Initialize GIFEncoder
  const gif = GIFEncoder();

  // Quantization colors (max 256 for GIF)
  const maxColors = settings.quality === 'high' ? 256 : 128;
  const isTransparent = config.backgroundId === 'transparent';

  for (let f = 0; f < totalFrames; f++) {
    signal?.throwIfAborted();
    const timeMs = (f / totalFrames) * totalDurationMs;

    // Render exact frame
    renderMemeFrame({
      canvas: offscreen,
      config,
      timeMs,
      width,
      height,
      isExporting: true
    });

    const imageData = ctx.getImageData(0, 0, width, height);

    // Quantize palette
    let palette = quantize(imageData.data, maxColors, {
      format: isTransparent ? 'rgba4444' : 'rgb565'
    });

    let transparentIndex: number | undefined = undefined;

    if (isTransparent) {
      // Find transparent color index or reserve one
      const index = applyPalette(imageData.data, palette, 'rgba4444');
      // Look for transparent color in palette
      for (let i = 0; i < palette.length; i++) {
        const col = palette[i];
        if (Array.isArray(col) && col.length >= 4 && col[3] === 0) {
          transparentIndex = i;
          break;
        }
      }
      gif.writeFrame(index, width, height, {
        palette,
        delay: frameDelayMs,
        transparent: transparentIndex !== undefined,
        transparentIndex
      });
    } else {
      const index = applyPalette(imageData.data, palette, 'rgb565');
      gif.writeFrame(index, width, height, {
        palette,
        delay: frameDelayMs,
        repeat: 0 // Infinite loop
      });
    }

    if (onProgress) {
      const percent = Math.round(((f + 1) / totalFrames) * 100);
      onProgress({
        currentFrame: f + 1,
        totalFrames,
        percent,
        status: `Rendering & encoding frame ${f + 1}/${totalFrames}...`
      });
    }

    // Allow UI thread to breathe for smooth progress bar updates
    if (f % 2 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);

  // Clean filename: you-broke-everything-meme.gif
  const safeName = (config.primaryText || 'you-broke-everything')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  const filename = `${safeName}-${config.characterId}-${width}px.gif`;

  return {
    blob,
    url,
    filename,
    fileSizeBytes: blob.size,
    formattedSize: formatBytes(blob.size),
    width,
    height,
    format: 'gif'
  };
}

/**
 * Record WebM video alternative using MediaRecorder
 */
export async function generateVideo(
  config: MemeConfig,
  settings: ExportSettings,
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<ExportResult> {
  const width = settings.resolution;
  const height = settings.resolution;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;

  const measureDurationMs = (60 / config.bpm) * 4 * 1000;
  const totalDurationMs = measureDurationMs * settings.loopCycles;
  const fps = 30;
  const totalFrames = Math.round((totalDurationMs / 1000) * fps);

  const stream = offscreen.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  mediaRecorder.start();

  for (let f = 0; f < totalFrames; f++) {
    if (signal?.aborted) {
      mediaRecorder.stop();
      signal.throwIfAborted();
    }
    const timeMs = (f / totalFrames) * totalDurationMs;
    renderMemeFrame({
      canvas: offscreen,
      config,
      timeMs,
      width,
      height,
      isExporting: true
    });

    if (onProgress) {
      onProgress({
        currentFrame: f + 1,
        totalFrames,
        percent: Math.round(((f + 1) / totalFrames) * 100),
        status: `Recording video frame ${f + 1}/${totalFrames}...`
      });
    }

    await new Promise(r => setTimeout(r, 1000 / fps));
  }

  mediaRecorder.stop();
  const blob = await recordingPromise;
  const url = URL.createObjectURL(blob);

  const safeName = (config.primaryText || 'you-broke-everything')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  const filename = `${safeName}.webm`;

  return {
    blob,
    url,
    filename,
    fileSizeBytes: blob.size,
    formattedSize: formatBytes(blob.size),
    width,
    height,
    format: 'webm'
  };
}
