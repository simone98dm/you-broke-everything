import React from 'react';
import { Download, Volume2, VolumeX, X } from 'lucide-react';
import { StudioNotice } from '../hooks/useMemeStudio';

interface TaskbarProps {
  onExport: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  notice: StudioNotice | null;
  onUndo: () => void;
  onDismissNotice: () => void;
  isAudioHintVisible: boolean;
  onDismissAudioHint: () => void;
}

function Balloon({ title, children, onDismiss }: { title: string; children: React.ReactNode; onDismiss: () => void }) {
  return (
    <div data-balloon className="xp-balloon p-3 pr-11 text-ink">
      <p className="font-bold">{title}</p>
      {children}
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center">
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Bottom taskbar: the one primary action (Export) sits in the thumb zone; tray holds music and notifications */
export function Taskbar({ onExport, isMuted, onToggleMute, notice, onUndo, onDismissNotice, isAudioHintVisible, onDismissAudioHint }: TaskbarProps) {
  return (
    <>
      <div role="status" aria-live="polite" className="fixed right-2 bottom-[4.25rem] z-40 w-[min(22rem,calc(100vw-1rem))]">
        {notice ? (
          <Balloon key={notice.id} title="Done" onDismiss={onDismissNotice}>
            <p className="mt-1">{notice.message}</p>
            {notice.undoTo && (
              <button type="button" onClick={onUndo} className="xp-btn mt-2">Undo</button>
            )}
          </Balloon>
        ) : isAudioHintVisible && (
          <Balloon title="Turn on the beat?" onDismiss={onDismissAudioHint}>
            <p className="mt-1">A 2005 Eurodance chiptune plays in time with the dance.</p>
            <button type="button" onClick={onToggleMute} className="xp-btn mt-2">
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Play music
            </button>
          </Balloon>
        )}
      </div>

      <footer aria-label="Taskbar" className="fixed inset-x-0 bottom-0 z-40 h-14 flex items-stretch bg-gradient-to-b from-[#3168d5] via-task to-[#1941a5] border-t border-[#0c2f8a] shadow-[0_-2px_8px_rgb(0_0_0/0.25)]">
        <button
          type="button"
          onClick={onExport}
          className="xp-btn xp-btn-go !min-h-0 !rounded-none !rounded-r-2xl px-5 sm:px-7 text-lg"
        >
          <Download className="w-5 h-5 not-italic" aria-hidden="true" />
          Export
        </button>

        <div className="ml-auto flex items-center gap-1 px-2 bg-tray border-l border-[#0b5fa8] shadow-[inset_1px_0_0_rgb(255_255_255/0.3)]">
          <button
            type="button"
            aria-pressed={!isMuted}
            onClick={onToggleMute}
            className="h-11 px-3 flex items-center gap-2 text-white rounded hover:bg-white/15"
          >
            {isMuted ? <VolumeX className="w-5 h-5" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
            <span>Music</span>
          </button>
        </div>
      </footer>
    </>
  );
}
