import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Download, Copy, RefreshCw, Save } from 'lucide-react';
import { MemeConfig, ExportSettings } from '../types/meme';
import { generateGif, generateVideo, ExportProgress, ExportResult } from '../export/gifExporter';
import { generateWhatsAppSticker } from '../export/stickerExporter';
import { retroAudio } from '../audio/synth';

type ExportFormat = ExportResult['format'];

interface FormatInfo {
  label: string;
  hint: string;
  readyNote: string;
  generate: typeof generateGif;
}

const RERENDER_DELAY_MS = 300;

const FORMATS: Record<ExportFormat, FormatInfo> = {
  gif: {
    label: 'GIF',
    hint: 'Plays everywhere: Slack, Discord, email, forums.',
    readyNote: 'Go drop it in #incidents.',
    generate: generateGif
  },
  webm: {
    label: 'WebM video',
    hint: 'Smallest file. Records in real time at 30 fps, so it takes a few seconds.',
    readyNote: 'Attach it anywhere that plays video.',
    generate: generateVideo
  },
  webp: {
    label: 'WhatsApp sticker',
    hint: 'Animated 512×512 WebP under 500 KB. Add it with a sticker-maker app on your phone. Needs Chrome, Edge or Firefox.',
    readyNote: 'Send it to your phone and add it with a sticker-maker app.',
    generate: generateWhatsAppSticker
  }
};

const FORMAT_ORDER: ExportFormat[] = ['gif', 'webm', 'webp'];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MemeConfig;
}

export function ExportModal({ isOpen, onClose, config }: ExportModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [format, setFormat] = useState<ExportFormat>('gif');
  const [settings, setSettings] = useState<ExportSettings>({ resolution: 320, fps: 16, loopCycles: 1, quality: 'high' });
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const info = FORMATS[format];

  const replaceResult = useCallback((next: ExportResult | null) => {
    setResult(prev => {
      if (prev) URL.revokeObjectURL(prev.url);
      return next;
    });
  }, []);

  const showPending = () => {
    setIsExporting(true);
    setError(null);
    setStatusMessage('');
    setProgress({ currentFrame: 0, totalFrames: 1, percent: 0, status: 'Warming up the encoder…' });
  };

  /** Encodes the current format; a newer render aborts this one so controls never need locking */
  const render = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    showPending();
    try {
      const res = await info.generate(config, settings, p => {
        if (!controller.signal.aborted) setProgress(p);
      }, controller.signal);
      if (controller.signal.aborted) return URL.revokeObjectURL(res.url);
      replaceResult(res);
      setStatusMessage(`Your ${info.label} is ready: ${res.formattedSize}. ${info.readyNote}`);
      retroAudio.playCoinSound();
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(`${info.label} export failed`, err);
      const reason = err instanceof Error ? err.message : 'Something went wrong while encoding.';
      setError(`Couldn't make the ${info.label}. ${reason}`);
    } finally {
      if (abortRef.current === controller) setIsExporting(false);
    }
  }, [config, settings, info, replaceResult]);

  // Open/close the native dialog (focus trap, Esc and inert background come for free)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // Render on open and after format/settings changes settle (quick arrow-key hops only encode once)
  useEffect(() => {
    if (!isOpen) return;
    showPending();
    const timer = window.setTimeout(render, RERENDER_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, format, settings]);

  // Closing aborts any in-flight run and frees the last file
  useEffect(() => {
    if (isOpen) return;
    abortRef.current?.abort();
    setIsExporting(false);
    replaceResult(null);
  }, [isOpen, replaceResult]);

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    a.click();
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [result.blob.type]: result.blob })]);
      setStatusMessage(`Copied the ${info.label}. Paste it anywhere.`);
    } catch {
      handleDownload();
      setStatusMessage(`Your browser can't copy animated ${info.label}s, so it was downloaded instead.`);
    }
  };

  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const isSticker = format === 'webp';
  const isVideo = format === 'webm';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="export-title"
      onClose={onClose}
      onClick={e => { if (e.target === dialogRef.current) onClose(); }}
      className="xp-dialog xp-window m-auto"
    >
      <div className="flex flex-col max-h-[calc(100dvh-2rem)]">
        <div className="xp-titlebar min-h-12">
          <Save className="w-4 h-4" aria-hidden="true" />
          <h2 id="export-title" className="text-[14px] font-bold">Export: {info.label}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto w-11 h-11 flex items-center justify-center rounded bg-[#e0533a] border border-white/70 hover:bg-[#f06a50]"
          >
            <X className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3 space-y-3 overflow-y-auto">
          <div className="aspect-square w-full max-w-[18rem] mx-auto bg-black border-2 border-edge flex items-center justify-center overflow-hidden">
            {isExporting && (
              <div className="w-full p-4 text-center text-white">
                <p className="font-bold">Encoding…</p>
                <p className="mt-1 text-xs">{progress?.status}</p>
                <div
                  role="progressbar"
                  aria-label={`Encoding ${info.label}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress?.percent ?? 0}
                  className="mt-3 h-5 bg-white border border-edge p-0.5"
                >
                  {/* XP block progress bar */}
                  <div
                    className="h-full bg-[repeating-linear-gradient(90deg,#2fb52f_0_8px,transparent_8px_10px)]"
                    style={{ width: `${progress?.percent ?? 0}%` }}
                  />
                </div>
              </div>
            )}
            {!isExporting && error && (
              <div className="p-4 text-center text-white">
                <p>{error}</p>
                <button type="button" onClick={render} className="xp-btn mt-3">
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Try again
                </button>
              </div>
            )}
            {!isExporting && !error && result && (
              result.format === 'webm'
                ? <video src={result.url} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                : <img src={result.url} alt={`Exported ${info.label} preview`} className="w-full h-full object-contain pixelated" />
            )}
          </div>

          {/* Fixed-height result rows keep the dialog from jumping between states */}
          <dl className="flex justify-center gap-x-5 gap-y-1 flex-wrap text-sm min-h-6">
            {result && !isExporting && !error && (
              <>
                <div className="flex gap-1"><dt className="text-ink-soft">Format</dt><dd className="font-bold uppercase">{result.format}</dd></div>
                <div className="flex gap-1"><dt className="text-ink-soft">Size</dt><dd className="font-bold">{result.width}×{result.height}</dd></div>
                <div className="flex gap-1"><dt className="text-ink-soft">File</dt><dd className="font-readout text-xl leading-none">{result.formattedSize}</dd></div>
              </>
            )}
          </dl>

          <p role="status" aria-live="polite" className="text-center font-bold text-legend min-h-10">{statusMessage}</p>

          <fieldset className="xp-group">
            <legend>Format</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              {FORMAT_ORDER.map(id => (
                <label key={id} className="xp-option items-center">
                  <input type="radio" name="export-format" checked={format === id} onChange={() => setFormat(id)} />
                  <span className="font-bold">{FORMATS[id].label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-soft">{info.hint}</p>
          </fieldset>

          <fieldset className="xp-group grid grid-cols-1 sm:grid-cols-3 gap-2">
            <legend>Settings</legend>
            <div>
              <label htmlFor="export-size" className="block font-bold mb-1">Size</label>
              <select
                id="export-size"
                value={isSticker ? 512 : settings.resolution}
                disabled={isSticker}
                onChange={e => updateSetting('resolution', parseInt(e.target.value, 10) as ExportSettings['resolution'])}
                className="xp-field"
              >
                {isSticker && <option value={512}>512 px (fixed)</option>}
                <option value={128}>128 px · emoji</option>
                <option value={320}>320 px · chat</option>
                <option value={480}>480 px · large</option>
              </select>
            </div>
            <div>
              <label htmlFor="export-fps" className="block font-bold mb-1">Frame rate</label>
              <select
                id="export-fps"
                value={isVideo ? 30 : settings.fps}
                disabled={isVideo}
                onChange={e => updateSetting('fps', parseInt(e.target.value, 10) as ExportSettings['fps'])}
                className="xp-field"
              >
                {isVideo && <option value={30}>30 fps (fixed)</option>}
                <option value={12}>12 fps · lightest</option>
                <option value={16}>16 fps · smooth</option>
                <option value={24}>24 fps · smoothest</option>
              </select>
            </div>
            <div>
              <label htmlFor="export-length" className="block font-bold mb-1">Length</label>
              <select
                id="export-length"
                value={settings.loopCycles}
                onChange={e => updateSetting('loopCycles', parseInt(e.target.value, 10) as ExportSettings['loopCycles'])}
                className="xp-field"
              >
                <option value={1}>1 bar · shortest</option>
                <option value={2}>2 bars</option>
              </select>
            </div>
            <p className="sm:col-span-3 text-xs text-ink-soft">Smaller size, lower frame rate and 1 bar all make a smaller file.</p>
          </fieldset>

        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 p-3 border-t border-edge-soft">
          {!isVideo && (
            <button type="button" onClick={handleCopy} disabled={isExporting || !result} className="xp-btn">
              <Copy className="w-4 h-4" aria-hidden="true" />
              Copy
            </button>
          )}
          <button type="button" onClick={handleDownload} disabled={isExporting || !result} className="xp-btn xp-btn-go">
            <Download className="w-4 h-4" aria-hidden="true" />
            Download .{format.toUpperCase()}
          </button>
        </div>
      </div>
    </dialog>
  );
}
