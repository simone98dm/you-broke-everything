// Self-check for memeState. Run: node src/state/memeState.check.ts
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG,
  enableMlg,
  disableMlg,
  enablePanic,
  disablePanic,
  toggleShades,
  parseStoredConfig
} from './memeState.ts';

const custom = { ...DEFAULT_CONFIG, primaryText: 'WHO PUSHED TO MAIN?', bpm: 100, backgroundId: 'bsod' as const };

// MLG round-trip restores the user's text, tempo and scene, and keeps edits to untouched fields
const mlg = enableMlg(custom);
assert.equal(mlg.primaryText, '360 NO SCOPE');
assert.equal(custom.primaryText, 'WHO PUSHED TO MAIN?', 'enableMlg must not mutate');
const back = disableMlg({ ...mlg, characterId: 'cat' }, custom);
assert.equal(back.primaryText, 'WHO PUSHED TO MAIN?');
assert.equal(back.bpm, 100);
assert.equal(back.backgroundId, 'bsod');
assert.equal(back.characterId, 'cat');
assert.equal(back.isMlgMode, false);
assert.equal(disableMlg(mlg, null).showLaserEyes, false);

// PANIC caps at the slider max and restores the previous tempo
assert.equal(enablePanic({ ...custom, bpm: 230 }).bpm, 240);
assert.equal(disablePanic(enablePanic(custom), custom).bpm, 100);

// Shades keep a non-shades accessory when taken off
assert.equal(toggleShades(toggleShades({ ...custom, accessory: 'siren' })).accessory, 'none');
assert.equal(toggleShades({ ...custom, glassesDropped: true, accessory: 'siren' }).accessory, 'siren');

// Stored config: garbage, wrong types, unknown ids and out-of-range values all fall back safely
const allowed = { backgroundId: ['disco_grid', 'bsod'] };
assert.deepEqual(parseStoredConfig('not json', DEFAULT_CONFIG, allowed), DEFAULT_CONFIG);
assert.deepEqual(parseStoredConfig('[1,2]', DEFAULT_CONFIG, allowed), DEFAULT_CONFIG);
const parsed = parseStoredConfig(
  JSON.stringify({ backgroundId: 'evil', bpm: 9999, showText: 'yes', primaryText: 'X'.repeat(99), extra: 1 }),
  DEFAULT_CONFIG,
  allowed
);
assert.equal(parsed.backgroundId, 'disco_grid');
assert.equal(parsed.bpm, 240);
assert.equal(parsed.showText, true);
assert.equal(parsed.primaryText.length, 40);
assert.ok(!('extra' in parsed));
assert.equal(parseStoredConfig(JSON.stringify({ backgroundId: 'bsod' }), DEFAULT_CONFIG, allowed).backgroundId, 'bsod');

console.log('memeState: all checks passed');
