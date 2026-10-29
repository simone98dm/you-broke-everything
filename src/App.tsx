import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MemePreview } from './components/MemePreview';
import { ControlPanel } from './components/ControlPanel';
import { ExportModal } from './components/ExportModal';
import { Taskbar } from './components/Taskbar';
import { useMemeStudio } from './hooks/useMemeStudio';
import { useReducedMotion } from './hooks/useReducedMotion';
import { readStorage, writeStorage } from './hooks/safeStorage';
import { retroAudio } from './audio/synth';

const AUDIO_HINT_KEY = 'ybe:audio-hint-dismissed';

const TEXT_ENTRY = 'textarea, select, [contenteditable="true"], input:not([type="radio"]):not([type="checkbox"]):not([type="range"])';
// Space already activates these, so the pause shortcut must not hijack it
const SPACE_OWNERS = 'button, a, summary, input, select, textarea, [role="tab"], [tabindex]';

function matches(target: EventTarget | null, selector: string): boolean {
  return target instanceof HTMLElement && target.closest(selector) !== null;
}

export default function App() {
  const isReducedMotion = useReducedMotion();
  const studio = useMemeStudio();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [isAudioHintDismissed, setIsAudioHintDismissed] = useState(() => readStorage(AUDIO_HINT_KEY) === '1');
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleToggleMute = () => {
    if (!hasStartedAudio) {
      retroAudio.start();
      setHasStartedAudio(true);
      setIsMuted(false);
      return;
    }
    setIsMuted(retroAudio.toggleMute());
  };

  const dismissAudioHint = () => {
    setIsAudioHintDismissed(true);
    writeStorage(AUDIO_HINT_KEY, '1');
  };

  // The audio balloon steps aside after the first interaction elsewhere; the tray Music button stays
  useEffect(() => {
    if (hasInteracted) return;
    const onInteract = (e: Event) => {
      if (!matches(e.target, '[data-balloon]')) setHasInteracted(true);
    };
    window.addEventListener('pointerdown', onInteract);
    window.addEventListener('keydown', onInteract);
    return () => {
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, [hasInteracted]);

  // Shortcuts: Space pauses, E exports, Ctrl/Cmd+Z undoes the last big change (text fields keep their own undo)
  const { undo, notice } = studio;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isExportOpen || e.altKey || matches(e.target, TEXT_ENTRY)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && notice?.undoTo) {
        e.preventDefault();
        undo();
        return;
      }
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === ' ' && !matches(e.target, SPACE_OWNERS)) {
        e.preventDefault();
        setIsPlaying(playing => !playing);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsExportOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExportOpen, undo, notice]);

  return (
    <div className="min-h-dvh flex flex-col pb-20">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="lg:sticky lg:top-4">
          <MemePreview
            config={studio.config}
            isPlaying={isPlaying}
            isReducedMotion={isReducedMotion}
            onTogglePlay={() => setIsPlaying(playing => !playing)}
            onToggleShades={studio.toggleShades}
            onToggleMlg={studio.toggleMlg}
            onTogglePanic={studio.togglePanic}
          />
        </div>

        <ControlPanel
          config={studio.config}
          updateConfig={studio.updateConfig}
          onToggleMlg={studio.toggleMlg}
          onLoadPreset={studio.loadPreset}
          onStartOver={studio.startOver}
          isReducedMotion={isReducedMotion}
          initialTab={studio.isFirstVisit ? 'presets' : 'dancer'}
        />
      </main>

      <Taskbar
        onExport={() => setIsExportOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        notice={studio.notice}
        onUndo={studio.undo}
        onDismissNotice={studio.dismissNotice}
        isAudioHintVisible={!hasStartedAudio && !isAudioHintDismissed && !hasInteracted}
        onDismissAudioHint={dismissAudioHint}
      />

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} config={studio.config} />
    </div>
  );
}
