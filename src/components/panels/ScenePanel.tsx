import React from 'react';
import { MemeConfig } from '../../types/meme';
import { BACKGROUNDS } from '../../data/options';
import { SHAKE_MAX } from '../../state/memeState';
import { ConfigUpdater } from '../../hooks/useMemeStudio';
import { OptionGroup } from '../ui/OptionGroup';
import { CheckOption } from '../ui/CheckOption';
import { RangeField } from '../ui/RangeField';

interface ScenePanelProps {
  config: MemeConfig;
  updateConfig: ConfigUpdater;
  onToggleMlg: () => void;
  isReducedMotion: boolean;
}

type MlgExtra = 'showSweepingLasers' | 'showLaserEyes' | 'showDoritosDew' | 'showHitmarkers' | 'showIlluminati';

const MLG_EXTRAS: { key: MlgExtra; label: string }[] = [
  { key: 'showSweepingLasers', label: 'Sweeping lasers' },
  { key: 'showLaserEyes', label: 'Fiery laser eyes' },
  { key: 'showDoritosDew', label: 'Doritos & Dew' },
  { key: 'showHitmarkers', label: '360 hitmarkers' },
  { key: 'showIlluminati', label: 'Illuminati pyramid' }
];

export function ScenePanel({ config, updateConfig, onToggleMlg, isReducedMotion }: ScenePanelProps) {
  return (
    <>
      <OptionGroup
        name="background"
        legend="Background"
        options={BACKGROUNDS}
        value={config.backgroundId}
        onChange={id => updateConfig(prev => ({ ...prev, backgroundId: id }))}
      />

      <RangeField
        id="shake"
        label="Screen shake"
        min={0}
        max={SHAKE_MAX}
        step={1}
        value={config.shakeIntensity}
        ticks={['0 Still', '5 Wobble', '10 Earthquake']}
        note={isReducedMotion ? 'Your system asks for reduced motion, so the preview stays still. The exported file still shakes.' : undefined}
        onChange={shakeIntensity => updateConfig(prev => ({ ...prev, shakeIntensity }))}
      />

      <fieldset className="xp-group">
        <legend>Atmosphere</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <CheckOption
            label="CRT scanlines"
            checked={config.showScanlines}
            onChange={showScanlines => updateConfig(prev => ({ ...prev, showScanlines }))}
          />
          <CheckOption
            label="Confetti stream"
            checked={config.showConfetti}
            onChange={showConfetti => updateConfig(prev => ({ ...prev, showConfetti }))}
          />
        </div>
      </fieldset>

      <details className="xp-details" open={config.isMlgMode || undefined}>
        <summary>MLG extras: mix and match, or go full MLG</summary>
        <div className="xp-group space-y-2">
          <button type="button" aria-pressed={config.isMlgMode} onClick={onToggleMlg} className="xp-btn w-full font-bold">
            {config.isMlgMode ? 'MLG mode is on: turn off and restore my meme' : 'Turn on full MLG mode'}
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {MLG_EXTRAS.map(extra => (
              <CheckOption
                key={extra.key}
                label={extra.label}
                checked={config[extra.key]}
                onChange={checked => updateConfig(prev => ({ ...prev, [extra.key]: checked }))}
              />
            ))}
          </div>
        </div>
      </details>
    </>
  );
}
