import React from 'react';

interface CheckOptionProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/** On/off setting as a native checkbox, so its state is announced and keyboard-togglable */
export function CheckOption({ label, hint, checked, onChange, className = '' }: CheckOptionProps) {
  return (
    <label className={`xp-option ${className}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="min-w-0">
        <span className="block font-bold">{label}</span>
        {hint && <span className="xp-hint">{hint}</span>}
      </span>
    </label>
  );
}
