/* Two tiny synthesized sounds: a swimming-pool bloub and a duck pan. */
(function (CC) {
  'use strict';

  const Audio = {
    ctx: null,
    quackAudio: null,

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

    quack() {
      if (!this.enabled()) return;
      if (!this.quackAudio) {
        // Duck quack by Bosnow, downloaded from Uppbeat.
        this.quackAudio = new window.Audio('assets/duck-quack.mp3');
        this.quackAudio.preload = 'auto';
        this.quackAudio.volume = 0.65;
      }
      try {
        this.quackAudio.currentTime = 0;
        const playing = this.quackAudio.play();
        if (playing && playing.catch) playing.catch(() => {});
      } catch (err) {
        /* Autoplay policy: the next user gesture will retry. */
      }
    },

    crowd() {
      if (!this.enabled()) return;
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const duration = 1.6;
      const t0 = ctx.currentTime;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        const time = i / ctx.sampleRate;
        const voices = 0.6 + 0.4 * Math.sin(time * 23) + 0.15 * Math.sin(time * 71);
        data[i] = (Math.random() * 2 - 1) * voices;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(850, t0);
      filter.Q.setValueAtTime(0.7, t0);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start(t0);
      source.stop(t0 + duration + 0.02);
    },

    blower() {
      if (!this.enabled()) return;
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const duration = 1.1;
      const t0 = ctx.currentTime;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        const wobble = 0.55 + 0.45 * Math.sin((i / ctx.sampleRate) * 37);
        data[i] = (Math.random() * 2 - 1) * wobble;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, t0);
      filter.frequency.exponentialRampToValueAtTime(240, t0 + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.045, t0 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start(t0);
      source.stop(t0 + duration + 0.02);
    },
  };

  CC.Audio = Audio;
})(window.CC = window.CC || {});
