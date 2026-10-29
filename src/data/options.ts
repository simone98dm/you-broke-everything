import {
  MemeConfig,
  CharacterId,
  DanceMoveId,
  BackgroundId,
  TextEffectId,
  AccessoryId
} from '../types/meme';
import type { AllowedValues } from '../state/memeState';

export interface Choice<T extends string> {
  id: T;
  label: string;
  hint?: string;
  swatch?: string;
}

export const CHARACTERS: Choice<CharacterId>[] = [
  { id: 'sysadmin', label: 'SysAdmin Bob', hint: 'Messy hair, flying red tie & frantic panic' },
  { id: 'froggy', label: 'Froggy Vibing', hint: 'Caramelldansen green frog with happy groove' },
  { id: 'cat', label: 'Server Cat', hint: 'Orange tabby with helicopter tail boogie' },
  { id: 'stickman', label: 'Derp Guy', hint: '2000s Newgrounds stickman with 404 tee' },
  { id: 'serverbot', label: 'ServerBot 3000', hint: 'Beige CRT monitor head with green glitch' },
  { id: 'polyguy', label: 'Low-Poly Tech Support', hint: 'PS2-era 3D IT guy: dark tee, jeans, stubble' }
];

export const DANCE_MOVES: Choice<DanceMoveId>[] = [
  { id: 'noodle', label: 'The Noodle Flail', hint: 'Rubber-hose flailing arms' },
  { id: 'caramell', label: 'Caramelldansen', hint: 'Hip sways, bunny-ear hands' },
  { id: 'russian', label: 'Russian Squat-Kick', hint: 'Deep squat, high kicks' },
  { id: 'disco', label: 'Disco Fever & Thrust', hint: 'Finger point & thrust' },
  { id: 'headbang', label: 'Server Meltdown', hint: 'Metal headbang & horns' },
  { id: 'robot', label: 'The Robot', hint: 'Stiff 90° pops on every 8th note' },
  { id: 'floss', label: 'The Floss', hint: 'Arms one way, hips the other' },
  { id: 'dab', label: 'Dab on the Haters', hint: 'Snap dab, then mirror it' },
  { id: 'sprinkler', label: 'The Sprinkler', hint: 'Hand behind head, arm ticks out' },
  { id: 'running_man', label: 'The Running Man', hint: 'Knees pop up on every beat' }
];

export const BACKGROUNDS: Choice<BackgroundId>[] = [
  { id: 'disco_grid', label: 'Retro Disco Grid', swatch: 'from-pink-500 to-indigo-700' },
  { id: 'xp_bliss', label: 'Windows XP Bliss', swatch: 'from-sky-400 to-emerald-600' },
  { id: 'server_fire', label: 'Server Inferno', swatch: 'from-red-600 to-amber-600' },
  { id: 'ytmnd_hypno', label: 'YTMND Hypno Rays', swatch: 'from-rose-500 to-yellow-400' },
  { id: 'matrix_rain', label: 'Matrix Code Rain', swatch: 'from-emerald-900 to-green-500' },
  { id: 'bsod', label: 'Blue Screen (BSOD)', swatch: 'from-blue-700 to-blue-900' },
  { id: 'mlg_rave', label: 'MLG Rave Dancefloor', swatch: 'from-emerald-400 via-pink-500 to-indigo-600' },
  { id: 'illuminati_void', label: 'Illuminati Void', swatch: 'from-emerald-950 to-green-600' },
  { id: 'transparent', label: 'Transparent (Discord/Slack)', swatch: 'from-slate-300 to-slate-400' }
];

export const TEXT_EFFECTS: Choice<TextEffectId>[] = [
  { id: 'impact_slam', label: 'Classic Impact Slam', hint: 'White, thick black outline' },
  { id: 'rainbow_wave', label: 'WordArt Rainbow Wave', hint: '3D extruded rainbow wave' },
  { id: 'xp_error_box', label: 'Windows XP Error Dialog', hint: 'A 2004 crash popup' },
  { id: 'arcade_flash', label: '8-Bit Arcade Hazard', hint: 'Flashing yellow & red' },
  { id: 'matrix_glitch', label: 'Matrix Terminal Glitch', hint: 'Green prompt with cursor' },
  { id: 'mlg_dubstep', label: 'MLG 360 Chromatic Glitch', hint: 'RGB split with bass bounce' }
];

export const ACCESSORIES: Choice<AccessoryId>[] = [
  { id: 'none', label: 'No Accessories' },
  { id: 'sunglasses', label: 'Deal With It Shades' },
  { id: 'party_hat', label: 'Party Cone Hat' },
  { id: 'siren', label: 'Emergency Siren' },
  { id: 'fire_server', label: 'Burning Server Rack' },
  { id: 'glowsticks', label: 'Neon Glowsticks' },
  { id: 'laser_eyes', label: 'Fiery Laser Eyes' },
  { id: 'mlg_shades_blunt', label: 'MLG Shades & Blunt' }
];

export const SAMPLE_TEXTS = [
  'YOU BROKE EVERYTHING',
  'DROP DATABASE PROD;',
  "IT'S ALWAYS DNS",
  'WORKS ON MY MACHINE',
  'GIT PUSH --FORCE',
  'WHO PUSHED TO MAIN?',
  'PRODUCTION IS ON FIRE',
  'LGTM SHIP IT!',
  '360 NO SCOPE',
  'GET REKT'
];

const ids = <T extends string>(choices: Choice<T>[]) => choices.map(c => c.id);

/** Valid ids per field, used to validate configs restored from localStorage */
export const ALLOWED_VALUES: AllowedValues = {
  characterId: ids(CHARACTERS),
  danceMoveId: ids(DANCE_MOVES),
  backgroundId: ids(BACKGROUNDS),
  textEffectId: ids(TEXT_EFFECTS),
  accessory: ids(ACCESSORIES)
} satisfies Partial<Record<keyof MemeConfig, readonly string[]>>;
