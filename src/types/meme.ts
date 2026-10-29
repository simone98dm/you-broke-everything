export type CharacterId = 'sysadmin' | 'froggy' | 'cat' | 'stickman' | 'serverbot' | 'polyguy';

export type DanceMoveId = 
  | 'noodle' 
  | 'caramell' 
  | 'russian' 
  | 'disco' 
  | 'headbang' 
  | 'robot'
  | 'floss'
  | 'dab'
  | 'sprinkler'
  | 'running_man';

export type BackgroundId = 
  | 'disco_grid' 
  | 'xp_bliss' 
  | 'server_fire' 
  | 'ytmnd_hypno' 
  | 'matrix_rain' 
  | 'bsod' 
  | 'transparent'
  | 'mlg_rave'
  | 'illuminati_void';

export type TextEffectId = 
  | 'impact_slam' 
  | 'rainbow_wave' 
  | 'xp_error_box' 
  | 'arcade_flash' 
  | 'matrix_glitch'
  | 'mlg_dubstep';

export type AccessoryId = 
  | 'none' 
  | 'sunglasses' 
  | 'party_hat' 
  | 'siren' 
  | 'fire_server' 
  | 'glowsticks'
  | 'mlg_shades_blunt'
  | 'laser_eyes';

export interface MemeConfig {
  characterId: CharacterId;
  danceMoveId: DanceMoveId;
  backgroundId: BackgroundId;
  textEffectId: TextEffectId;
  primaryText: string;
  secondaryText: string;
  showText: boolean;
  accessory: AccessoryId;
  bpm: number; // 60 to 240
  shakeIntensity: number; // 0 to 10
  showScanlines: boolean;
  showConfetti: boolean;
  isPanicMode: boolean;
  glassesDropped: boolean;
  isMlgMode: boolean;
  showLaserEyes: boolean;
  showHitmarkers: boolean;
  showDoritosDew: boolean;
  showIlluminati: boolean;
  showSweepingLasers: boolean;
}

export interface ExportSettings {
  resolution: 128 | 320 | 480;
  fps: 12 | 16 | 24;
  loopCycles: 1 | 2;
  quality: 'fast' | 'high';
}

export interface PresetMeme {
  id: string;
  name: string;
  tagline: string;
  config: Partial<MemeConfig>;
}
