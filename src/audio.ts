const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
let currentBGM: { oscs: OscillatorNode[], gainNodes: GainNode[] } | null = null;

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
    stopBGM(); // 播放勝利音效時先停掉 BGM

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

// 動態合成 BGM，模擬轉場氛圍
export function playBGM(type: string) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (currentBGM) {
        // 如果已經在播放同一種，則不重複播放 (這部分簡單假設，以後可以最佳化)
        return; 
    }

    const oscs: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];

    if (type === 'town') {
        // 簡單溫馨節奏
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        createLoop(notes, 0.4, 'sine', 0.03, oscs, gainNodes);
    } else if (type === 'wedding') {
        // 莊嚴進行節奏
        const notes = [349.23, 440.00, 523.25, 587.33]; // F4, A4, C5, D5
        createLoop(notes, 0.6, 'triangle', 0.04, oscs, gainNodes);
    }

    currentBGM = { oscs, gainNodes };
}

function createLoop(freqs: number[], speed: number, type: OscillatorType, volume: number, oscs: OscillatorNode[], gainNodes: GainNode[]) {
    freqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        // 透過 LFO 模擬簡單節奏，這裡簡單用 gain 循環
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        
        // 模擬簡單循環播放
        const now = audioCtx.currentTime;
        for(let j=0; j<20; j++) {
            const time = now + j * speed * freqs.length + i * speed;
            gain.gain.setTargetAtTime(volume, time, 0.05);
            gain.gain.setTargetAtTime(0, time + speed * 0.8, 0.05);
        }
        
        oscs.push(osc);
        gainNodes.push(gain);
    });
}

export function stopBGM() {
    if (currentBGM) {
        currentBGM.oscs.forEach(o => o.stop());
        currentBGM.gainNodes.forEach(g => g.disconnect());
        currentBGM = null;
    }
}
