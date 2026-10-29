/**
 * Mid-2000s Eurodance / Chiptune Synthesizer Engine
 * Uses Web Audio API to create authentic 8-bit/FM dance loops and meme sound FX.
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.5;
  private bpm = 135;
  private timerId: number | null = null;
  private currentStep = 0;
  private gainNode: GainNode | null = null;

  // Classic mid-2000s Eurodance chord progression (Am - F - C - G) in semitones (A3=220)
  // 16-step melody loop (frequencies in Hz)
  private melodyNotes: (number | null)[] = [
    440.0, 523.25, 659.25, 523.25, // A4, C5, E5, C5
    349.23, 440.0, 523.25, 440.0,  // F4, A4, C5, A4
    523.25, 659.25, 783.99, 659.25, // C5, E5, G5, E5
    392.0, 493.88, 587.33, 493.88   // G4, B4, D5, B4
  ];

  // 16-step bassline (Am - F - C - G) root notes with octave bounce
  private bassNotes: number[] = [
    110.0, 220.0, 110.0, 220.0, // A2, A3
    87.31, 174.61, 87.31, 174.61, // F2, F3
    130.81, 261.63, 130.81, 261.63, // C3, C4
    98.0, 196.0, 98.0, 196.0 // G2, G3
  ];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(60, Math.min(260, newBpm));
    if (this.isPlaying) {
      this.restartLoop();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx?.currentTime || 0);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public start() {
    this.initContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextStep();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private restartLoop() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.isPlaying) {
      this.scheduleNextStep();
    }
  }

  private scheduleNextStep() {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;

    // 16th note duration in ms
    const stepDuration = (60 / this.bpm / 4) * 1000;
    const now = this.ctx.currentTime;

    // Trigger step instruments
    this.playStep(this.currentStep, now);

    this.currentStep = (this.currentStep + 1) % 16;
    this.timerId = window.setTimeout(() => this.scheduleNextStep(), stepDuration);
  }

  private playStep(step: number, time: number) {
    if (!this.ctx || !this.gainNode) return;

    // 1. Four-on-the-floor Kick drum on steps 0, 4, 8, 12
    if (step % 4 === 0) {
      this.playKick(time);
    }

    // 2. Snare / Clap on beats 2 & 4 (steps 4 and 12)
    if (step === 4 || step === 12) {
      this.playSnare(time);
    }

    // 3. Upbeat Hi-hat on offbeats (steps 2, 6, 10, 14)
    if (step % 4 === 2) {
      this.playHiHat(time);
    }

    // 4. Bass synth (bouncing octave 16ths)
    const bassFreq = this.bassNotes[step];
    if (bassFreq) {
      this.playBass(bassFreq, time, (60 / this.bpm / 4) * 0.9);
    }

    // 5. Lead Eurodance synth
    const leadFreq = this.melodyNotes[step];
    if (leadFreq) {
      this.playLead(leadFreq, time, (60 / this.bpm / 4) * 0.85);
    }
  }

  private playKick(time: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.gainNode) return;
    
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + 0.12);
  }

  private playHiHat(time: number) {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private playBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + duration);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playLead(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Hilarious Sound Effects
  public playErrorDing() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    
    // Windows XP Critical Error chord (low brassy clang)
    const freqs = [180, 225, 270];
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.gainNode!);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  public playAirhorn() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    
    // Reggae / MLG airhorn triplet blast
    const blasts = [0, 0.12, 0.24, 0.36];
    blasts.forEach(offset => {
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(466.16, now + offset); // Bb4
      osc2.frequency.setValueAtTime(472.0, now + offset); // slightly detuned

      gain.gain.setValueAtTime(0.35, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.1);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.gainNode!);

      osc1.start(now + offset);
      osc1.stop(now + offset + 0.1);
      osc2.start(now + offset);
      osc2.stop(now + offset + 0.1);
    });
  }

  public playCoinSound() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playScratch() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // MLG Signature Hitmarker Click Sound
  public playHitmarker() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;

    // Ultra-crisp high-passed click/tick
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.035);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  // MLG Dubstep Drop & Sub Wobble
  public playDubstepDrop() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;

    // Sub-bass sweep
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.7);

    // LFO Wobble effect on filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.value = 8;
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // MLG Multi Airhorn Fanfare
  public playMlgAirhornCombo() {
    this.playAirhorn();
    setTimeout(() => this.playHitmarker(), 200);
    setTimeout(() => this.playHitmarker(), 350);
    setTimeout(() => this.playDubstepDrop(), 450);
  }
}

export const retroAudio = new RetroAudioEngine();
