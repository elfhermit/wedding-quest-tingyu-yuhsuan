const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export function playTypingSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

export function playVictorySound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const freqs = [440, 554.37, 659.25, 880];
    const startTime = audioCtx.currentTime;

    freqs.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;

        const noteStartTime = startTime + index * 0.1;
        gainNode.gain.setValueAtTime(0.08, noteStartTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteStartTime + 0.3);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(noteStartTime);
        osc.stop(noteStartTime + 0.3);
    });
}
