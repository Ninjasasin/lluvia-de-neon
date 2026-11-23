export type Sfx =
  | 'key'
  | 'clear'
  | 'error'
  | 'lifeLost'
  | 'powerGain'
  | 'freeze'
  | 'slow'
  | 'lightning'
  | 'bomb'
  | 'denied'
  | 'levelUp'
  | 'gameOver'
  | 'record'
  | 'click'
  | 'tick'
  | 'go';

interface ToneOptions {
  type?: OscillatorType;
  gain?: number;
  /** Frecuencia final para un barrido de tono. */
  slideTo?: number;
  attack?: number;
}

// Música: progresión original de cuatro compases en la menor (la, fa, re, mi).
const STEP_SECONDS = 0.125; // semicorcheas a 120 pulsos por minuto
const BARS: readonly { bass: number; chord: readonly number[] }[] = [
  { bass: 110.0, chord: [220.0, 261.63, 329.63, 440.0] },
  { bass: 87.31, chord: [174.61, 220.0, 261.63, 349.23] },
  { bass: 73.42, chord: [146.83, 174.61, 220.0, 293.66] },
  { bass: 82.41, chord: [164.81, 207.65, 246.94, 329.63] },
];
const ARP_ORDER = [0, 1, 2, 3, 2, 1, 2, 3];
const BASS_STEPS = new Set([0, 3, 6, 8, 11, 14]);
const MELODY: readonly (number | null)[] = [
  659.25, null, null, 587.33, null, 523.25, null, null, 587.33, null, null, null, 659.25, null, 783.99, null,
  698.46, null, null, 659.25, null, 523.25, null, null, 440.0, null, null, null, 523.25, null, null, null,
  587.33, null, null, 698.46, null, 880.0, null, null, 783.99, null, 698.46, null, 587.33, null, null, null,
  659.25, null, null, 830.61, null, 987.77, null, null, 830.61, null, null, null, 659.25, null, null, null,
];

/**
 * Sonido generado íntegramente con Web Audio API: no hay archivos de audio.
 * El contexto se crea tras el primer gesto del usuario, como exigen los navegadores.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicVolume = 0.5;
  private sfxVolume = 0.8;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private step = 0;

  /** Crea o reanuda el contexto de audio. Debe llamarse desde un clic o una tecla. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        const ctx = new Ctor();
        const master = ctx.createDynamicsCompressor();
        master.connect(ctx.destination);
        this.sfxBus = ctx.createGain();
        this.musicBus = ctx.createGain();
        this.sfxBus.connect(master);
        this.musicBus.connect(master);
        this.ctx = ctx;

        const length = Math.floor(ctx.sampleRate * 1.2);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuffer = buffer;
        this.applyVolumes();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.sfxBus || !this.musicBus) return;
    const now = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(this.sfxVolume, now, 0.03);
    this.musicBus.gain.setTargetAtTime(this.musicVolume * 0.5, now, 0.05);
  }

  // --- Efectos ---------------------------------------------------------------

  play(sfx: Sfx): void {
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus || this.sfxVolume <= 0) return;
    const t = ctx.currentTime + 0.005;
    switch (sfx) {
      case 'key':
        this.tone(bus, 1250 + Math.random() * 250, t, 0.035, { type: 'triangle', gain: 0.1 });
        break;
      case 'click':
        this.tone(bus, 660, t, 0.06, { type: 'triangle', gain: 0.18 });
        break;
      case 'tick':
        this.tone(bus, 880, t, 0.09, { type: 'square', gain: 0.13 });
        this.tone(bus, 440, t, 0.12, { type: 'sine', gain: 0.16 });
        break;
      case 'go':
        this.tone(bus, 1318.5, t, 0.5, { type: 'square', gain: 0.15 });
        this.tone(bus, 659.25, t, 0.5, { type: 'triangle', gain: 0.2 });
        this.tone(bus, 1976, t + 0.04, 0.35, { type: 'sine', gain: 0.1 });
        break;
      case 'clear':
        this.tone(bus, 660, t, 0.09, { type: 'square', gain: 0.14 });
        this.tone(bus, 990, t + 0.06, 0.14, { type: 'square', gain: 0.14 });
        this.tone(bus, 1320, t + 0.06, 0.2, { type: 'sine', gain: 0.12 });
        break;
      case 'error':
        this.tone(bus, 170, t, 0.2, { type: 'sawtooth', gain: 0.2, slideTo: 95 });
        this.tone(bus, 120, t, 0.2, { type: 'square', gain: 0.1 });
        break;
      case 'lifeLost':
        this.tone(bus, 320, t, 0.45, { type: 'sawtooth', gain: 0.26, slideTo: 60 });
        this.noise(bus, t, 0.3, 0.28, 'lowpass', 700);
        break;
      case 'powerGain':
        [784, 988, 1175, 1568].forEach((f, i) =>
          this.tone(bus, f, t + i * 0.055, 0.14, { type: 'triangle', gain: 0.18 }),
        );
        break;
      case 'freeze':
        this.tone(bus, 2400, t, 0.7, { type: 'sine', gain: 0.16, slideTo: 700 });
        this.tone(bus, 3200, t + 0.05, 0.6, { type: 'triangle', gain: 0.08, slideTo: 1500 });
        this.noise(bus, t, 0.6, 0.12, 'highpass', 5000);
        break;
      case 'slow':
        this.tone(bus, 520, t, 0.8, { type: 'sawtooth', gain: 0.16, slideTo: 110 });
        this.tone(bus, 260, t, 0.8, { type: 'sine', gain: 0.18, slideTo: 55 });
        break;
      case 'lightning':
        this.noise(bus, t, 0.28, 0.4, 'highpass', 1800);
        this.tone(bus, 1800, t, 0.22, { type: 'sawtooth', gain: 0.16, slideTo: 120 });
        this.noise(bus, t + 0.1, 0.5, 0.22, 'lowpass', 400);
        break;
      case 'bomb':
        this.tone(bus, 160, t, 0.75, { type: 'sine', gain: 0.5, slideTo: 32 });
        this.noise(bus, t, 0.8, 0.45, 'lowpass', 900);
        break;
      case 'denied':
        this.tone(bus, 200, t, 0.07, { type: 'square', gain: 0.12 });
        this.tone(bus, 150, t + 0.09, 0.09, { type: 'square', gain: 0.12 });
        break;
      case 'levelUp':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this.tone(bus, f, t + i * 0.09, 0.22, { type: 'square', gain: 0.15 }),
        );
        this.tone(bus, 1568, t + 0.36, 0.4, { type: 'triangle', gain: 0.14 });
        break;
      case 'gameOver':
        [392, 329.63, 261.63, 196].forEach((f, i) =>
          this.tone(bus, f, t + i * 0.24, 0.42, { type: 'triangle', gain: 0.24 }),
        );
        this.tone(bus, 98, t + 0.96, 1.1, { type: 'sawtooth', gain: 0.16, slideTo: 49 });
        break;
      case 'record':
        [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
          this.tone(bus, f, t + i * 0.11, 0.24, { type: 'square', gain: 0.14 }),
        );
        this.tone(bus, 1568, t + 0.78, 0.7, { type: 'triangle', gain: 0.16 });
        break;
    }
  }

  // --- Música ----------------------------------------------------------------

  /** Inicia (o reanuda) la música de fondo. */
  startMusic(): void {
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextStepTime = this.ctx.currentTime + 0.08;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 40);
  }

  /** Detiene la música conservando la posición, para continuar tras una pausa. */
  pauseMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /** Detiene la música y vuelve al principio. */
  stopMusic(): void {
    this.pauseMusic();
    this.step = 0;
  }

  dispose(): void {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    // Si el reloj se atrasó (pestaña inactiva), se retoma desde el presente.
    if (this.nextStepTime < ctx.currentTime - 0.2) this.nextStepTime = ctx.currentTime + 0.05;
    while (this.nextStepTime < ctx.currentTime + 0.16) {
      if (this.musicVolume > 0) this.playStep(this.step, this.nextStepTime);
      this.nextStepTime += STEP_SECONDS;
      this.step = (this.step + 1) % (BARS.length * 16 * 2);
    }
  }

  private playStep(step: number, time: number): void {
    const bus = this.musicBus;
    if (!bus) return;
    const inBar = step % 16;
    const barIndex = Math.floor(step / 16) % BARS.length;
    const bar = BARS[barIndex];
    const secondPass = step >= BARS.length * 16;

    if (BASS_STEPS.has(inBar)) {
      const octave = inBar === 8 || inBar === 14 ? 2 : 1;
      this.tone(bus, bar.bass * octave, time, 0.2, { type: 'sawtooth', gain: 0.2, attack: 0.01 });
      this.tone(bus, bar.bass, time, 0.22, { type: 'sine', gain: 0.25, attack: 0.01 });
    }
    if (inBar % 2 === 0) {
      const note = bar.chord[ARP_ORDER[(inBar / 2) % ARP_ORDER.length]];
      this.tone(bus, note * 2, time, 0.11, { type: 'square', gain: 0.07 });
    }
    if (secondPass) {
      const note = MELODY[(step - BARS.length * 16) % MELODY.length];
      if (note) this.tone(bus, note, time, 0.3, { type: 'triangle', gain: 0.13, attack: 0.02 });
    }
    if (inBar % 4 === 0) this.tone(bus, 150, time, 0.12, { type: 'sine', gain: 0.5, slideTo: 42 });
    if (inBar === 4 || inBar === 12) this.noise(bus, time, 0.1, 0.13, 'bandpass', 1900);
    if (inBar % 2 === 1) this.noise(bus, time, 0.03, 0.05, 'highpass', 7500);
  }

  // --- Síntesis ---------------------------------------------------------------

  private tone(dest: AudioNode, freq: number, start: number, duration: number, options: ToneOptions = {}): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const peak = options.gain ?? 0.2;
    const attack = options.attack ?? 0.005;
    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (options.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.slideTo), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  private noise(
    dest: AudioNode,
    start: number,
    duration: number,
    peak: number,
    filterType: BiquadFilterType,
    frequency: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    source.start(start, Math.random() * 0.3);
    source.stop(start + duration + 0.03);
  }
}
