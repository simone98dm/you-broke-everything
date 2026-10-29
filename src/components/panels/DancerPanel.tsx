import React from 'react';
import { MemeConfig } from '../../types/meme';
import { CHARACTERS, DANCE_MOVES, ACCESSORIES } from '../../data/options';
import { BPM_MIN, BPM_MAX } from '../../state/memeState';
import { ConfigUpdater } from '../../hooks/useMemeStudio';
import { OptionGroup } from '../ui/OptionGroup';
import { RangeField } from '../ui/RangeField';

interface DancerPanelProps {
  config: MemeConfig;
  updateConfig: ConfigUpdater;
}

export function DancerPanel({ config, updateConfig }: DancerPanelProps) {
  const accessoryLabel = ACCESSORIES.find(a => a.id === config.accessory)?.label ?? 'No Accessories';

  return (
    <>
      <OptionGroup
        name="character"
        legend="Dancer"
        options={CHARACTERS}
        value={config.characterId}
        onChange={id => updateConfig(prev => ({ ...prev, characterId: id }))}
      />

      <OptionGroup
        name="dance-move"
        legend="Dance move"
        columns="three"
        options={DANCE_MOVES}
        value={config.danceMoveId}
        onChange={id => updateConfig(prev => ({ ...prev, danceMoveId: id }))}
      />

      <RangeField
        id="tempo"
        label="Tempo"
        unit="BPM"
        min={BPM_MIN}
        max={BPM_MAX}
        step={5}
        value={config.bpm}
        ticks={['70 Slow vibe', '135 Eurodance', '240 Hyper-speed']}
        onChange={bpm => updateConfig(prev => ({ ...prev, bpm }))}
      />

      <details className="xp-details">
        <summary>Props: {accessoryLabel}</summary>
        <OptionGroup
          name="accessory"
          legend="Prop"
          options={ACCESSORIES}
          value={config.accessory}
          onChange={id => updateConfig(prev => ({ ...prev, accessory: id, glassesDropped: id === 'sunglasses' }))}
        />
      </details>
    </>
  );
}
