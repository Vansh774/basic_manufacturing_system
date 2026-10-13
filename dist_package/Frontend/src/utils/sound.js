/**
 * Plays an alert beep/ring sound when a machine stops.
 * Tries the HTML5 Audio element first with /alert.mp3,
 * and falls back to Web Audio API synthesized chime.
 */
export const playAlertSound = () => {
    try {
        const audio = new Audio('/alert.mp3');
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                console.log('Audio file play prevented, using Web Audio synthesizer chime:', err.message);
                playSynthChime();
            });
        }
    } catch (e) {
        playSynthChime();
    }
};

export const playSynthChime = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Tone 1: 880 Hz (A5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.25);

        // Tone 2: 1174 Hz (D6)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174, ctx.currentTime + 0.18);
        gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.18);
        osc2.stop(ctx.currentTime + 0.55);
    } catch (err) {
        console.warn('Audio synthesis error:', err);
    }
};
