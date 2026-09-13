/**
 * Procedural Web Audio API Synthesizer for Authentic LEGO Sounds
 * Zero external audio assets required; 100% offline & instantaneous
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Authentic LEGO Brick "Snap / Click" sound
 * High frequency burst followed by resonant ABS plastic body click
 */
export function playLegoSnapSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;

    // 1. Sharp transient click (stud engaging clutch-power tube)
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(1200, t);
    oscClick.frequency.exponentialRampToValueAtTime(240, t + 0.025);

    gainClick.gain.setValueAtTime(0.40, t);
    gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    oscClick.connect(gainClick);
    gainClick.connect(ctx.destination);
    oscClick.start(t);
    oscClick.stop(t + 0.035);

    // 2. ABS Plastic resonance body 'thump'
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();
    oscBody.type = 'sine';
    oscBody.frequency.setValueAtTime(320, t);
    oscBody.frequency.exponentialRampToValueAtTime(140, t + 0.05);

    gainBody.gain.setValueAtTime(0.25, t);
    gainBody.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    oscBody.connect(gainBody);
    gainBody.connect(ctx.destination);
    oscBody.start(t);
    oscBody.stop(t + 0.06);
  } catch (e) {
    // Gracefully ignore audio if browser policy blocks it
  }
}

/**
 * Soft aerodynamic whoosh sound for Disassemble / Knolling animation
 */
export function playDisassembleSlideSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.6);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.65);
  } catch (e) {}
}
