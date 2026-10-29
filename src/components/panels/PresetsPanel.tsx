import React from 'react';
import { PresetMeme } from '../../types/meme';
import { MEME_PRESETS } from '../../data/presets';

interface PresetsPanelProps {
  onLoadPreset: (preset: PresetMeme) => void;
}

export function PresetsPanel({ onLoadPreset }: PresetsPanelProps) {
  return (
    <>
      <p className="text-ink-soft">
        Load a ready-made meme, then tweak it. It replaces what you have now, and you can undo it.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {MEME_PRESETS.map(preset => (
          <li key={preset.id}>
            <button type="button" onClick={() => onLoadPreset(preset)} className="xp-option w-full h-full flex-col text-left">
              <span className="font-bold">{preset.name}</span>
              <span className="xp-hint">{preset.tagline}</span>
              <span className="mt-auto pt-1 font-meme tracking-wide text-legend">"{preset.config.primaryText}"</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
