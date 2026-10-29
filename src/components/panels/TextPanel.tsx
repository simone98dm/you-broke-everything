import React from 'react';
import { MemeConfig } from '../../types/meme';
import { TEXT_EFFECTS, SAMPLE_TEXTS } from '../../data/options';
import { PRIMARY_TEXT_MAX, SECONDARY_TEXT_MAX } from '../../state/memeState';
import { ConfigUpdater } from '../../hooks/useMemeStudio';
import { OptionGroup } from '../ui/OptionGroup';
import { CheckOption } from '../ui/CheckOption';

interface TextPanelProps {
  config: MemeConfig;
  updateConfig: ConfigUpdater;
}

export function TextPanel({ config, updateConfig }: TextPanelProps) {
  return (
    <>
      <CheckOption
        label="Show meme text"
        hint="Draw the headline and punchline on top of the dance"
        checked={config.showText}
        onChange={showText => updateConfig(prev => ({ ...prev, showText }))}
      />

      <fieldset className="xp-group space-y-3" disabled={!config.showText}>
        <legend>Words</legend>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="primary-text" className="font-bold">Headline</label>
            <span id="primary-count" className="text-xs text-ink-soft">
              {config.primaryText.length}/{PRIMARY_TEXT_MAX}
            </span>
          </div>
          <input
            id="primary-text"
            type="text"
            maxLength={PRIMARY_TEXT_MAX}
            value={config.primaryText}
            aria-describedby="primary-count"
            onChange={e => updateConfig(prev => ({ ...prev, primaryText: e.target.value }))}
            placeholder="Type your headline"
            className="xp-field mt-1 font-meme text-xl tracking-wide uppercase"
          />
        </div>

        <details className="xp-details">
          <summary>Need an idea? Pick a classic</summary>
          <div className="flex flex-wrap gap-1 pt-1">
            {SAMPLE_TEXTS.map(text => (
              <button
                key={text}
                type="button"
                aria-pressed={config.primaryText === text}
                onClick={() => updateConfig(prev => ({ ...prev, primaryText: text }))}
                className="xp-btn text-xs"
              >
                {text}
              </button>
            ))}
          </div>
        </details>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="secondary-text" className="font-bold">Punchline <span className="font-normal text-ink-soft">(optional)</span></label>
            <span id="secondary-count" className="text-xs text-ink-soft">
              {config.secondaryText.length}/{SECONDARY_TEXT_MAX}
            </span>
          </div>
          <input
            id="secondary-text"
            type="text"
            maxLength={SECONDARY_TEXT_MAX}
            value={config.secondaryText}
            aria-describedby="secondary-count"
            onChange={e => updateConfig(prev => ({ ...prev, secondaryText: e.target.value }))}
            placeholder="Leave empty for no punchline"
            className="xp-field mt-1"
          />
        </div>
      </fieldset>

      {/* Bare wrapper so "Show meme text" off also disables the style choices */}
      <fieldset disabled={!config.showText} className="m-0 p-0 border-0 min-w-0">
        <OptionGroup
          name="text-effect"
          legend="Text style"
          options={TEXT_EFFECTS}
          value={config.textEffectId}
          onChange={id => updateConfig(prev => ({ ...prev, textEffectId: id }))}
        />
      </fieldset>
    </>
  );
}
