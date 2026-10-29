import React from 'react';

interface RangeFieldProps {
  id: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  ticks: [string, string, string];
  note?: string;
  onChange: (value: number) => void;
}

export function RangeField({ id, label, unit, min, max, step, value, ticks, note, onChange }: RangeFieldProps) {
  const noteId = note ? `${id}-note` : undefined;
  return (
    <div className="xp-group">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-bold text-legend">{label}</label>
        <output htmlFor={id} className="font-readout text-2xl leading-none text-ink">
          {value}{unit && ` ${unit}`}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={noteId}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="w-full h-11 cursor-pointer"
      />
      <div aria-hidden="true" className="flex justify-between text-xs text-ink-soft">
        {ticks.map(tick => <span key={tick}>{tick}</span>)}
      </div>
      {note && <p id={noteId} className="mt-2 text-xs text-ink-soft">{note}</p>}
    </div>
  );
}
