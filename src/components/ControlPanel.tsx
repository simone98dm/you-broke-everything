import React, { useState } from 'react';
import { User, Type, Palette, Sparkles, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { MemeConfig, PresetMeme } from '../types/meme';
import { ConfigUpdater } from '../hooks/useMemeStudio';
import { Tabs, TabItem, tabId, panelId } from './ui/Tabs';
import { XpWindow } from './ui/XpWindow';
import { DancerPanel } from './panels/DancerPanel';
import { TextPanel } from './panels/TextPanel';
import { ScenePanel } from './panels/ScenePanel';
import { PresetsPanel } from './panels/PresetsPanel';

export type TabKey = 'dancer' | 'text' | 'scene' | 'presets';

const TABS: TabItem<TabKey>[] = [
  { id: 'presets', label: 'Presets', icon: Sparkles },
  { id: 'dancer', label: 'Dancer', icon: User },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'scene', label: 'Scene', icon: Palette }
];

interface ControlPanelProps {
  config: MemeConfig;
  updateConfig: ConfigUpdater;
  onToggleMlg: () => void;
  onLoadPreset: (preset: PresetMeme) => void;
  onStartOver: () => void;
  isReducedMotion: boolean;
  initialTab: TabKey;
}

export function ControlPanel({ config, updateConfig, onToggleMlg, onLoadPreset, onStartOver, isReducedMotion, initialTab }: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  return (
    <XpWindow
      titleId="controls-title"
      title="Meme Controls"
      icon={<SlidersHorizontal className="w-4 h-4" />}
      statusBar={<span>Changes save automatically in this browser</span>}
    >
      <Tabs label="Meme settings" tabs={TABS} active={activeTab} onSelect={setActiveTab} />

      <div
        role="tabpanel"
        id={panelId(activeTab)}
        aria-labelledby={tabId(activeTab)}
        tabIndex={0}
        className="xp-sheet mx-2 p-3 space-y-3 focus-visible:outline-offset-[-4px]"
      >
        {activeTab === 'dancer' && <DancerPanel config={config} updateConfig={updateConfig} />}
        {activeTab === 'text' && <TextPanel config={config} updateConfig={updateConfig} />}
        {activeTab === 'scene' && (
          <ScenePanel config={config} updateConfig={updateConfig} onToggleMlg={onToggleMlg} isReducedMotion={isReducedMotion} />
        )}
        {activeTab === 'presets' && <PresetsPanel onLoadPreset={onLoadPreset} />}
      </div>

      <div className="flex justify-end p-2">
        <button type="button" onClick={onStartOver} className="xp-btn">
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Start over
        </button>
      </div>
    </XpWindow>
  );
}
