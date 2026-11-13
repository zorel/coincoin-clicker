/* Two tiny synthesized sounds: a swimming-pool bloub and a duck pan. */
(function (CC) {
  'use strict';

  const Audio = {
    ctx: null,

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      try {
        this.ctx = new Ctx();
      } catch (err) {
        this.ctx = null;
      }
    },

    enabled() {
      return !!(CC.State && CC.State.s.settings.sound);
    },

    tone(startFreq, endFreq, duration, type, volume) {
      if (!this.enabled()) return;
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + duration);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    },

    bloub() {
      this.tone(340, 70, 0.32, 'sine', 0.08);
      setTimeout(() => this.tone(220, 55, 0.25, 'sine', 0.045), 90);
    },

    pan() {
      this.tone(180, 880, 0.12, 'square', 0.045);
      setTimeout(() => this.tone(900, 160, 0.18, 'square', 0.035), 110);
    },
  };

  CC.Audio = Audio;
})(window.CC = window.CC || {});
