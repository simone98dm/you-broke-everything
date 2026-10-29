import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Glasses, PartyPopper, Flame, Zap, Music2, MonitorPlay } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MemeConfig } from '../types/meme';
import { CHARACTERS, DANCE_MOVES } from '../data/options';
import { renderMemeFrame } from '../renderer/canvasRenderer';
import { retroAudio } from '../audio/synth';
import { XpWindow } from './ui/XpWindow';

interface MemePreviewProps {
  config: MemeConfig;
  isPlaying: boolean;
  isReducedMotion: boolean;
  onTogglePlay: () => void;
  onToggleShades: () => void;
  onToggleMlg: () => void;
  onTogglePanic: () => void;
}

const MINI_SIZE = 112;

const SOUNDS = [
  { label: 'Hitmarker', play: () => retroAudio.playHitmarker() },
  { label: 'Dubstep drop', play: () => retroAudio.playDubstepDrop() },
  { label: 'Airhorn', play: () => retroAudio.playMlgAirhornCombo() }
];

function describeMeme(config: MemeConfig): string {
  const dancer = CHARACTERS.find(c => c.id === config.characterId)?.label ?? 'A dancer';
  const move = DANCE_MOVES.find(m => m.id === config.danceMoveId)?.label ?? 'dancing';
  const text = config.showText ? ` Text: "${config.primaryText}" ${config.secondaryText ? `/ "${config.secondaryText}"` : ''}` : '';
  return `Live preview: ${dancer} doing ${move} at ${config.bpm} BPM.${text}`;
}

export function MemePreview({ config, isPlaying, isReducedMotion, onTogglePlay, onToggleShades, onToggleMlg, onTogglePanic }: MemePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isStageInView, setIsStageInView] = useState(true);
  const lastTimeRef = useRef<number>(performance.now());
  const elapsedRef = useRef<number>(0);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);

  useEffect(() => {
    retroAudio.setBpm(config.bpm);
  }, [config.bpm]);

  useEffect(() => {
    let frame = 0;
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      if (isPlaying) elapsedRef.current += now - lastTimeRef.current;
      lastTimeRef.current = now;
      if (canvasRef.current) {
        renderMemeFrame({ canvas: canvasRef.current, config, timeMs: elapsedRef.current, reduceMotion: isReducedMotion });
        miniRef.current?.getContext('2d')?.drawImage(canvasRef.current, 0, 0, MINI_SIZE, MINI_SIZE);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [config, isPlaying, isReducedMotion]);

  // Phones stack the controls under the stage; a pinned mini copy keeps the result visible while editing
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => setIsStageInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const handleConfetti = () => {
    retroAudio.playCoinSound();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true });
  };

  return (
    <XpWindow
      titleId="stage-title"
      title={`Stage — ${config.bpm} BPM`}
      icon={<MonitorPlay className="w-4 h-4" />}
      statusBar={
        <>
          <span>{isPlaying ? 'Looping' : 'Paused'}</span>
          <span>{config.showText ? 'Text on' : 'Dance only'}</span>
          <span className="hidden sm:inline">Space: pause · E: export</span>
        </>
      }
    >
      <div className="p-2">
        <div ref={stageRef} className={`relative aspect-square w-full bg-black border-2 ${config.isMlgMode ? 'border-mlg' : 'border-edge'} ${config.showScanlines ? 'crt-overlay' : ''}`}>
          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            role="img"
            aria-label={describeMeme(config)}
            className="w-full h-full pixelated block"
          />
        </div>

        <div role="toolbar" aria-label="Stage controls" className="flex flex-wrap gap-1 mt-2">
          <button type="button" onClick={onTogglePlay} className="xp-btn">
            {isPlaying ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" aria-pressed={config.glassesDropped} onClick={onToggleShades} title="Drop the Deal With It shades" className="xp-btn">
            <Glasses className="w-4 h-4" aria-hidden="true" />
            <span>Shades</span>
          </button>
          <button type="button" onClick={handleConfetti} className="xp-btn">
            <PartyPopper className="w-4 h-4" aria-hidden="true" />
            <span>Confetti</span>
          </button>
          <button
            type="button"
            aria-pressed={config.isMlgMode}
            onClick={onToggleMlg}
            title="Full MLG montage: lasers, airhorns, 360 NO SCOPE. Press again to restore your meme."
            className={`xp-btn font-bold ${config.isMlgMode ? '!bg-mlg !text-ink' : ''}`}
          >
            <Zap className="w-4 h-4" aria-hidden="true" />
            <span>MLG</span>
          </button>
          <button
            type="button"
            aria-pressed={config.isPanicMode}
            onClick={onTogglePanic}
            title="Speed up and shake the screen. Press again to calm down."
            className={`xp-btn font-bold ${config.isPanicMode ? '!bg-panic !text-white' : 'text-panic'}`}
          >
            <Flame className="w-4 h-4" aria-hidden="true" />
            <span>Panic</span>
          </button>
          <button
            type="button"
            aria-expanded={isSoundboardOpen}
            aria-controls="soundboard"
            onClick={() => setIsSoundboardOpen(open => !open)}
            className="xp-btn ml-auto"
          >
            <Music2 className="w-4 h-4" aria-hidden="true" />
            <span>Sounds</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => stageRef.current?.scrollIntoView({ behavior: isReducedMotion ? 'auto' : 'smooth', block: 'center' })}
          aria-label="Back to the stage"
          className={`lg:hidden fixed top-2 right-2 z-30 p-1 bg-face border-2 border-title shadow-[0_6px_16px_rgb(0_0_0/0.35)] ${isStageInView ? 'hidden' : ''}`}
        >
          <canvas ref={miniRef} width={MINI_SIZE} height={MINI_SIZE} aria-hidden="true" className="block w-28 h-28 pixelated bg-black" />
        </button>

        {isSoundboardOpen && (
          <div id="soundboard" role="group" aria-label="Soundboard" className="flex flex-wrap gap-1 mt-1">
            {SOUNDS.map(sound => (
              <button key={sound.label} type="button" onClick={sound.play} className="xp-btn flex-1">
                {sound.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </XpWindow>
  );
}
