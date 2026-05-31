// src/lib/audio.ts
let audioContext: AudioContext | null = null;
let initialized = false;

export function initAudio(): boolean {
  if (initialized) return true;
  try {
    audioContext = new AudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

export function isAudioReady(): boolean {
  return initialized && audioContext !== null && audioContext.state !== 'closed';
}

export function playOrderAlert(): void {
  if (!isAudioReady()) {
    console.warn('[Audio] AudioContext nao inicializado — usuario precisa clicar em Iniciar turno');
    return;
  }
  const audio = new Audio('/sounds/new-order.mp3');
  audio.play().catch(() => {
    console.warn('[Audio] Falha ao reproduzir alerta de novo pedido');
  });
}
