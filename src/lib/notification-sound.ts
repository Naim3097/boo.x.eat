export function playNotificationSound() {
  const audio = new Audio("/notification.mp3");
  audio.play().catch(() => {
    // Fallback: Web Audio API beep
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // ignore if AudioContext is unavailable
    }
  });
}
