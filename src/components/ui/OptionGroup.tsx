import React from 'react';
import { Choice } from '../../data/options';

const COLUMNS = {
  one: 'grid-cols-1',
  two: 'grid-cols-1 sm:grid-cols-2',
  three: 'grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-3'
} as const;

interface OptionGroupProps<T extends string> {
  name: string;
  legend: string;
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: keyof typeof COLUMNS;
}

/** Pick-one list built on native radios: arrow keys, focus and screen-reader state come from the browser */
export function OptionGroup<T extends string>({ name, legend, options, value, onChange, columns = 'two' }: OptionGroupProps<T>) {
  return (
    <fieldset className="xp-group">
      <legend>{legend}</legend>
      <div className={`grid gap-1 ${COLUMNS[columns]}`}>
        {options.map(option => (
          <label key={option.id} className="xp-option">
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            {option.swatch && (
              <span aria-hidden="true" className={`w-6 h-6 shrink-0 bg-gradient-to-br ${option.swatch} border border-black/40`} />
            )}
            <span className="min-w-0">
              <span className="block font-bold">{option.label}</span>
              {option.hint && <span className="xp-hint">{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
