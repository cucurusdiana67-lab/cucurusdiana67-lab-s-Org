// Utility for barcode scanning beeps, chimes, and Indonesian text-to-speech voice announcements

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a high-pitched scanner beep
 */
export function playBeep(freq = 950, duration = 0.12) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

/**
 * Play pleasant success double chime
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [660, 990].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.15);
    });
  } catch {}
}

/**
 * Play low error/warning buzz tone
 */
export function playErrorTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch {}
}

// Pre-warm Indonesian voice cache
let cachedIndonesianVoice: SpeechSynthesisVoice | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      const voices = window.speechSynthesis.getVoices();
      cachedIndonesianVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('id') ||
            v.lang.toLowerCase().includes('id-id') ||
            v.name.toLowerCase().includes('indonesia')
        ) || null;
    } catch {}
  };

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Speak text in Indonesian using Web Speech API
 */
export function speakText(text: string, options?: { rate?: number; pitch?: number }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    // Cancel previous ongoing utterance to speak newly scanned item immediately
    window.speechSynthesis.cancel();

    // Clean text: remove raw URLs, heavy punctuation or code patterns
    const cleanText = text
      .replace(/[_\-*#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? 1.0;

    if (!cachedIndonesianVoice) {
      const voices = window.speechSynthesis.getVoices();
      cachedIndonesianVoice =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('id') ||
            v.lang.toLowerCase().includes('id-id') ||
            v.name.toLowerCase().includes('indonesia')
        ) || null;
    }

    if (cachedIndonesianVoice) {
      utterance.voice = cachedIndonesianVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
  }
}

/**
 * Announce scanned product: plays a quick beep then speaks product name in Indonesian
 */
export function announceScannedProduct(productName: string) {
  // Beep first for instant feedback
  playSuccessChime();

  // Speak product name
  speakText(productName);
}
