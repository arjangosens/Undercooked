/**
 * Sound Manager - Handles playing sound effects for game events
 */

type SoundKey = 'order_created' | 'order_fulfilled' | 'order_failed' | 'countdown';

interface SoundConfig {
  src: string;
  loop?: boolean;
  volume?: number;
}

class SoundManager {
  private sounds: Map<SoundKey, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private audioContextUnlocked: boolean = false;
  private baseVolumes: Map<SoundKey, number> = new Map();
  private masterVolume = 1.0;
  private audioCtx: AudioContext | null = null;
  private buffers: Map<SoundKey, AudioBuffer> = new Map();
  private sources: Map<SoundKey, AudioBufferSourceNode | null> = new Map();
  private gains: Map<SoundKey, GainNode> = new Map();
  private isFirefox = /firefox/i.test(navigator.userAgent);

  constructor() {
    this.initializeSounds();
    // Listen for any user interaction to unlock audio context
    this.setupAudioUnlock();
  }

  /**
   * Unlock audio context on first user interaction
   * This is required by most browsers' autoplay policies
   */
  private setupAudioUnlock() {
    const unloadAudio = () => {
      if (this.audioContextUnlocked) return;

      console.log('🔓 Unlocking audio context on user interaction');
      
      // Try to play a silent sound to unlock audio context
      const unlocker = new Audio();
      unlocker.muted = true;
      
      const playPromise = unlocker.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✓ Audio context unlocked');
            this.audioContextUnlocked = true;
            // Stop the unlocking audio
            unlocker.pause();
          })
          .catch((err) => {
            console.warn('⚠️ Failed to unlock audio context:', err.name);
          });
      }

      // Remove listeners
      document.removeEventListener('click', unloadAudio);
      document.removeEventListener('keydown', unloadAudio);
      document.removeEventListener('touchstart', unloadAudio);
    };

    document.addEventListener('click', unloadAudio, { once: true });
    document.addEventListener('keydown', unloadAudio, { once: true });
    document.addEventListener('touchstart', unloadAudio, { once: true });
  }

  /**
   * Initialize all sound effects
   */
  private initializeSounds() {
    const soundConfigs: Record<SoundKey, SoundConfig> = {
      order_created: {
        src: '/sounds/order_created.mp3',
        volume: 0.7,
      },
      order_fulfilled: {
        src: '/sounds/order_fulfilled.mp3',
        volume: 0.7,
      },
      order_failed: {
        src: '/sounds/order_failed.mp3',
        volume: 0.7,
      },
      countdown: {
        src: '/sounds/countdown.mp3',
        loop: true,
        volume: 1.0,
      },
    };

    Object.entries(soundConfigs).forEach(([key, config]) => {
      const audio = new Audio(config.src);
      audio.loop = config.loop ?? false;
      const baseVol = config.volume ?? 0.5;
      this.baseVolumes.set(key as SoundKey, baseVol);
      audio.volume = Math.max(0, Math.min(1, baseVol * this.masterVolume));
      
      // Log loading state
      audio.addEventListener('canplay', () => {
        console.log(`✓ Sound loaded: ${key}`);
      });
      audio.addEventListener('error', (e) => {
        console.error(`✗ Error loading sound ${key}:`, e, `Path: ${config.src}`);
      });
      
      // Preload
      audio.load();
      
      this.sounds.set(key as SoundKey, audio);
    });

    // Optionally start preloading Web Audio buffers for looped sounds
    this.preloadBuffer('countdown').catch(() => {});
  }

  private ensureAudioContext(): AudioContext {
    if (!this.audioCtx) {
      // @ts-ignore for webkit fallback
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new Ctor();
    }
    return this.audioCtx;
  }

  private async preloadBuffer(key: SoundKey): Promise<void> {
    if (this.buffers.has(key)) return;
    const audio = this.sounds.get(key);
    if (!audio) return;
    try {
      const ctx = this.ensureAudioContext();
      const res = await fetch(audio.src);
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr.slice(0));
      this.buffers.set(key, buf);
    } catch (e) {
      console.warn(`⚠️ Failed to preload buffer for ${key}:`, e);
    }
  }

  /**
   * Set master volume (0.0 - 1.0) applied on top of per-sound base
   */
  setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    // Recompute volumes for all sounds
    this.sounds.forEach((audio, key) => {
      const base = this.baseVolumes.get(key as SoundKey) ?? 0.5;
      audio.volume = Math.max(0, Math.min(1, base * this.masterVolume));
    });
    // Update Web Audio gains
    this.gains.forEach((gain, key) => {
      const base = this.baseVolumes.get(key as SoundKey) ?? 0.5;
      gain.gain.value = Math.max(0, Math.min(2, base * this.masterVolume));
    });
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Play a sound effect
   */
  play(soundKey: SoundKey) {
    if (!this.enabled) {
      console.log(`Sound disabled, skipping: ${soundKey}`);
      return;
    }

    const audio = this.sounds.get(soundKey);
    if (audio) {
      console.log(`🔊 Playing: ${soundKey}`);
      // Reset and play
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`⚠️ Autoplay policy blocked ${soundKey}:`, err.name);
          // Fallback: try muted, then unmute on next tick
          const prevMuted = audio.muted;
          audio.muted = true;
          audio.currentTime = 0;
          audio.play()
            .then(() => {
              // Unmute shortly after starting
              setTimeout(() => {
                audio.muted = prevMuted;
              }, 0);
            })
            .catch((innerErr) => {
              console.error(`✗ Failed to play sound ${soundKey} even muted:`, innerErr);
              audio.muted = prevMuted;
            });
        });
      }
    } else {
      console.error(`✗ Sound not found: ${soundKey}`);
    }
  }

  /**
   * Stop a looping sound
   */
  stop(soundKey: SoundKey) {
    const audio = this.sounds.get(soundKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Start the countdown loop for a specific order
   * Returns a cleanup function to stop the sound
   */
  startCountdownSound(): () => void {
    if (!this.enabled) return () => {};

    const playWebAudio = async () => {
      await this.preloadBuffer('countdown');
      const ctx = this.ensureAudioContext();
      if (ctx.state !== 'running') await ctx.resume();
      const existing = this.sources.get('countdown');
      if (existing) { try { existing.stop(); } catch {} }
      const buf = this.buffers.get('countdown');
      if (!buf) throw new Error('No buffer for countdown');
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      let gain = this.gains.get('countdown');
      if (!gain) {
        gain = ctx.createGain();
        gain.connect(ctx.destination);
        this.gains.set('countdown', gain);
      }
      const base = this.baseVolumes.get('countdown') ?? 1.0;
      gain.gain.value = Math.max(0, Math.min(2, base * this.masterVolume));
      source.connect(gain);
      source.start(0);
      this.sources.set('countdown', source);
      console.log('🎧 WebAudio: countdown started');
    };

    playWebAudio().catch((err) => {
      console.warn('⚠️ WebAudio failed for countdown, fallback to HTMLAudio:', err);
      const audio = this.sounds.get('countdown');
      if (!audio) return () => {};
      audio.pause();
      audio.muted = false;
      audio.loop = true;
      const base = this.baseVolumes.get('countdown') ?? audio.volume;
      audio.volume = Math.max(0, Math.min(1, base * this.masterVolume));
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });

    return () => {
      this.stop('countdown');
    };
  }

  /**
   * Stop the countdown sound
   */
  stopCountdownSound() {
    const src = this.sources.get('countdown');
    if (src) { try { src.stop(); } catch {} }
    this.sources.set('countdown', null);
    this.stop('countdown');
  }

  /**
   * Set whether sound effects are enabled
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      // Stop all sounds
      this.sounds.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }

  /**
   * Check if sound effects are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Returns true if we've successfully unlocked audio via user gesture
   */
  isReady(): boolean {
    return this.audioContextUnlocked;
  }

  /**
   * Explicitly unlock audio by playing each sound muted briefly.
   * Call this from a user gesture (e.g., button click).
   */
  async requestUnlock(): Promise<void> {
    if (this.audioContextUnlocked) {
      if (this.audioCtx && this.audioCtx.state !== 'running') {
        try { await this.audioCtx.resume(); } catch {}
      }
      return;
    }
    const tasks: Promise<any>[] = [];
    this.sounds.forEach((audio) => {
      const prevMuted = audio.muted;
      const prevTime = audio.currentTime;
      audio.muted = true;
      audio.currentTime = 0;
      const p = audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = prevTime;
          audio.muted = prevMuted;
        })
        .catch(() => {
          // Ignore; some browsers still restrict without src interaction.
          audio.muted = prevMuted;
        });
      tasks.push(p);
    });
    await Promise.allSettled(tasks);
    // Ensure AudioContext resumed
    const ctx = this.ensureAudioContext();
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch (e) { console.warn('⚠️ Failed to resume AudioContext:', e); }
    }
    this.audioContextUnlocked = true;
    console.log('✓ Audio unlocked via requestUnlock');
  }

  /**
   * Preload all sounds (useful to avoid delays on first play)
   */
  preload() {
    this.sounds.forEach((audio) => {
      audio.load();
    });
  }
}

export const soundManager = new SoundManager();
