import React, { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface TabsProps<T extends string> {
  label: string;
  tabs: TabItem<T>[];
  active: T;
  onSelect: (id: T) => void;
}

export const tabId = (id: string) => `tab-${id}`;
export const panelId = (id: string) => `panel-${id}`;

/** WAI-ARIA tablist with roving focus: arrows, Home and End move between tabs */
export function Tabs<T extends string>({ label, tabs, active, onSelect }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const wrapped = (index + tabs.length) % tabs.length;
    onSelect(tabs[wrapped].id);
    refs.current[wrapped]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    focusTab(moves[e.key]);
  };

  return (
    <div role="tablist" aria-label={label} className="flex gap-0.5 px-2 pt-2 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((tab, index) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={el => { refs.current[index] = el; }}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            aria-selected={isActive}
            aria-controls={panelId(tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={e => handleKeyDown(e, index)}
            className="xp-tab flex items-center gap-1.5"
          >
            <Icon className="hidden sm:block w-4 h-4" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
