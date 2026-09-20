type SafariAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let scannerAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor = window.AudioContext
    ?? (window as SafariAudioWindow).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  scannerAudioContext ??= new AudioContextConstructor();
  return scannerAudioContext;
}

export function primeScanSuccessSound() {
  try {
    const context = getAudioContext();
    if (context?.state === "suspended") void context.resume().catch(() => undefined);
  } catch {
    // Visual feedback remains the fallback when Web Audio is unavailable.
  }
}

export async function playScanSuccessSound() {
  try {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") await context.resume();

    const startedAt = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, startedAt);
    oscillator.frequency.exponentialRampToValueAtTime(1_176, startedAt + 0.09);
    gain.gain.setValueAtTime(0.0001, startedAt);
    gain.gain.exponentialRampToValueAtTime(0.16, startedAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.13);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startedAt);
    oscillator.stop(startedAt + 0.14);
  } catch {
    // Sound is optional; never interrupt a successful scan.
  }
}
