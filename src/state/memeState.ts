/**
 * Pure state transitions for the meme config.
 * No React, no audio: everything here returns a new config and is covered by memeState.check.ts.
 */

import type { MemeConfig } from '../types/meme';

export const BPM_MIN = 70;
export const BPM_MAX = 240;
export const SHAKE_MAX = 10;
export const PRIMARY_TEXT_MAX = 40;
export const SECONDARY_TEXT_MAX = 45;

const PANIC_BPM_BOOST = 30;
const PANIC_MIN_SHAKE = 6;

export const DEFAULT_CONFIG: MemeConfig = {
  characterId: 'sysadmin',
  danceMoveId: 'noodle',
  backgroundId: 'disco_grid',
  textEffectId: 'impact_slam',
  primaryText: 'YOU BROKE EVERYTHING',
  secondaryText: "AND I'M JUST VIBING",
  showText: true,
  accessory: 'none',
  bpm: 135,
  shakeIntensity: 0,
  showScanlines: false,
  showConfetti: true,
  isPanicMode: false,
  glassesDropped: false,
  isMlgMode: false,
  showLaserEyes: false,
  showHitmarkers: false,
  showDoritosDew: false,
  showIlluminati: false,
  showSweepingLasers: false
};

// Everything MLG mode overrides; turning it off restores exactly these fields.
const MLG_OVERRIDES = {
  backgroundId: 'mlg_rave',
  showLaserEyes: true,
  showHitmarkers: true,
  showDoritosDew: true,
  showIlluminati: true,
  showSweepingLasers: true,
  accessory: 'mlg_shades_blunt',
  textEffectId: 'mlg_dubstep',
  primaryText: '360 NO SCOPE',
  secondaryText: 'GET REKT',
  bpm: 155,
  shakeIntensity: 5
} as const satisfies Partial<MemeConfig>;

type MlgField = keyof typeof MLG_OVERRIDES;
const MLG_FIELDS = Object.keys(MLG_OVERRIDES) as MlgField[];

export function enableMlg(prev: MemeConfig): MemeConfig {
  return { ...prev, ...MLG_OVERRIDES, isMlgMode: true };
}

/** Restores the fields MLG replaced from the pre-MLG snapshot; without one, just switches the MLG extras off */
export function disableMlg(prev: MemeConfig, snapshot: MemeConfig | null): MemeConfig {
  if (!snapshot) {
    return {
      ...prev,
      isMlgMode: false,
      showLaserEyes: false,
      showHitmarkers: false,
      showDoritosDew: false,
      showIlluminati: false,
      showSweepingLasers: false
    };
  }
  const restored = Object.fromEntries(MLG_FIELDS.map(key => [key, snapshot[key]])) as Pick<MemeConfig, MlgField>;
  return { ...prev, ...restored, isMlgMode: false };
}

export function enablePanic(prev: MemeConfig): MemeConfig {
  return {
    ...prev,
    isPanicMode: true,
    bpm: Math.min(BPM_MAX, prev.bpm + PANIC_BPM_BOOST),
    shakeIntensity: Math.max(prev.shakeIntensity, PANIC_MIN_SHAKE)
  };
}

/** Puts tempo and shake back to what they were before PANIC */
export function disablePanic(prev: MemeConfig, snapshot: MemeConfig | null): MemeConfig {
  return {
    ...prev,
    isPanicMode: false,
    bpm: snapshot?.bpm ?? prev.bpm,
    shakeIntensity: snapshot?.shakeIntensity ?? prev.shakeIntensity
  };
}

/** Drops the "Deal With It" shades; taking them off keeps any other accessory the user picked */
export function toggleShades(prev: MemeConfig): MemeConfig {
  const nextDropped = !prev.glassesDropped;
  if (nextDropped) return { ...prev, glassesDropped: true, accessory: 'sunglasses' };
  return { ...prev, glassesDropped: false, accessory: prev.accessory === 'sunglasses' ? 'none' : prev.accessory };
}

export type AllowedValues = Partial<Record<keyof MemeConfig, readonly string[]>>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Rebuilds a config from untrusted localStorage JSON: unknown keys are dropped,
 * wrong types and unknown ids fall back to defaults, numbers and text are clamped.
 */
export function parseStoredConfig(raw: string | null, defaults: MemeConfig, allowed: AllowedValues): MemeConfig {
  if (!raw) return defaults;
  let stored: unknown;
  try {
    stored = JSON.parse(raw);
  } catch {
    return defaults;
  }
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return defaults;
  const source = stored as Record<string, unknown>;

  const entries = (Object.keys(defaults) as (keyof MemeConfig)[]).map(key => {
    const value = source[key];
    const fallback = defaults[key];
    if (typeof value !== typeof fallback) return [key, fallback];
    const allowedIds = allowed[key];
    if (allowedIds && !allowedIds.includes(value as string)) return [key, fallback];
    return [key, value];
  });
  const merged = Object.fromEntries(entries) as MemeConfig;

  return {
    ...merged,
    bpm: Number.isFinite(merged.bpm) ? clamp(Math.round(merged.bpm), BPM_MIN, BPM_MAX) : defaults.bpm,
    shakeIntensity: Number.isFinite(merged.shakeIntensity) ? clamp(Math.round(merged.shakeIntensity), 0, SHAKE_MAX) : defaults.shakeIntensity,
    primaryText: merged.primaryText.slice(0, PRIMARY_TEXT_MAX),
    secondaryText: merged.secondaryText.slice(0, SECONDARY_TEXT_MAX)
  };
}
