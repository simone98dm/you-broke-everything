import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { MemeConfig, PresetMeme } from '../types/meme';
import {
  DEFAULT_CONFIG,
  enableMlg,
  disableMlg,
  enablePanic,
  disablePanic,
  toggleShades,
  parseStoredConfig
} from '../state/memeState';
import { ALLOWED_VALUES } from '../data/options';
import { retroAudio } from '../audio/synth';
import { readStorage, writeStorage } from './safeStorage';

const CONFIG_KEY = 'ybe:config:v1';
const NOTICE_TIMEOUT_MS = 7000;

export type ConfigUpdater = (updater: (prev: MemeConfig) => MemeConfig) => void;

export interface StudioNotice {
  id: number;
  message: string;
  undoTo?: MemeConfig;
}

export interface MemeStudio {
  config: MemeConfig;
  updateConfig: ConfigUpdater;
  toggleMlg: () => void;
  togglePanic: () => void;
  toggleShades: () => void;
  loadPreset: (preset: PresetMeme) => void;
  startOver: () => void;
  notice: StudioNotice | null;
  isFirstVisit: boolean;
  undo: () => void;
  dismissNotice: () => void;
}

export function useMemeStudio(): MemeStudio {
  const [isFirstVisit] = useState(() => readStorage(CONFIG_KEY) === null);
  const [config, setConfig] = useState<MemeConfig>(() =>
    parseStoredConfig(readStorage(CONFIG_KEY), DEFAULT_CONFIG, ALLOWED_VALUES)
  );
  const [notice, setNotice] = useState<StudioNotice | null>(null);
  const mlgSnapshot = useRef<MemeConfig | null>(null);
  const panicSnapshot = useRef<MemeConfig | null>(null);

  useEffect(() => {
    writeStorage(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // Plain notices fade on their own; ones offering Undo stay until used, dismissed or superseded (no time limit)
  useEffect(() => {
    if (!notice || notice.undoTo) return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /** Applies a big change and offers a one-step undo back to the current config */
  const replaceWithUndo = useCallback((message: string, next: MemeConfig) => {
    setNotice({ id: Date.now(), message, undoTo: config });
    setConfig(next);
  }, [config]);

  const toggleMlg = useCallback(() => {
    if (config.isMlgMode) {
      retroAudio.playScratch();
      setConfig(disableMlg(config, mlgSnapshot.current));
      mlgSnapshot.current = null;
      return;
    }
    mlgSnapshot.current = config;
    retroAudio.playMlgAirhornCombo();
    confetti({ particleCount: 90, spread: 90, origin: { y: 0.6 }, disableForReducedMotion: true });
    replaceWithUndo('MLG mode swapped your text, tempo and scene. Turn it off to get them back.', enableMlg(config));
  }, [config, replaceWithUndo]);

  const togglePanic = useCallback(() => {
    if (config.isPanicMode) {
      retroAudio.playErrorDing();
      setConfig(disablePanic(config, panicSnapshot.current));
      panicSnapshot.current = null;
      return;
    }
    panicSnapshot.current = config;
    retroAudio.playAirhorn();
    setConfig(enablePanic(config));
    setNotice({ id: Date.now(), message: 'PANIC: tempo +30 and the screen shakes. Press Panic again to calm down.' });
  }, [config]);

  const handleToggleShades = useCallback(() => {
    if (!config.glassesDropped) retroAudio.playCoinSound();
    setConfig(toggleShades(config));
  }, [config]);

  const loadPreset = useCallback((preset: PresetMeme) => {
    retroAudio.playCoinSound();
    mlgSnapshot.current = null;
    panicSnapshot.current = null;
    replaceWithUndo(`Loaded "${preset.name}".`, { ...DEFAULT_CONFIG, ...preset.config });
  }, [replaceWithUndo]);

  const startOver = useCallback(() => {
    retroAudio.playScratch();
    mlgSnapshot.current = null;
    panicSnapshot.current = null;
    replaceWithUndo('Started over with the classic meme.', DEFAULT_CONFIG);
  }, [replaceWithUndo]);

  const undo = useCallback(() => {
    if (!notice?.undoTo) return;
    setConfig(notice.undoTo);
    setNotice(null);
  }, [notice]);

  return {
    config,
    // A manual edit after a big change makes Undo stale (it would silently discard the edit), so it retires the offer
    updateConfig: updater => {
      setConfig(updater);
      setNotice(prev => (prev?.undoTo ? null : prev));
    },
    toggleMlg,
    togglePanic,
    toggleShades: handleToggleShades,
    loadPreset,
    startOver,
    notice,
    isFirstVisit,
    undo,
    dismissNotice: () => setNotice(null)
  };
}
