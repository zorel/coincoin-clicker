/* Bootstrap: DOM is already parsed, scripts are loaded at the end of <body>. */
(function (CC) {
  'use strict';

  function bind() {
    const UI = CC.UI;
    const Engine = CC.Engine;

    document.addEventListener('pointerdown', () => CC.Audio.init(), { once: true });

    document.getElementById('button').addEventListener('click', () => {
      CC.Audio.init();
      Engine.click();
    });

    document.getElementById('app').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-buy]');
      if (button) Engine.buyBuilding(button.dataset.buy);
    });

    document.getElementById('tools').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-goodie]');
      if (button) Engine.buyGoodie(button.dataset.goodie);
    });

    document.getElementById('duck').addEventListener('click', () => Engine.shootDuck());
    document.getElementById('dog').addEventListener('click', () => Engine.petDog());
    document.getElementById('url-post').addEventListener('click', () => Engine.postUrl());
    document.getElementById('url-shuffle').addEventListener('click', () => Engine.shuffleUrl());

    document.getElementById('rebirth').addEventListener('click', () => {
      const state = CC.State;
      const next = state.nextVersion();
      if (!next || !state.canRebirth()) return;
      const gain = Math.max(1, Math.floor(Math.sqrt(state.s.runTotal / 250)));
      const message = [
        'Recommencer une nouvelle tribune ?',
        '',
        'wmCoinCoin v' + state.version().v + ' → v' + next.v,
        'XP de moule gagné : +' + gain,
        'Les coins, bâtiments et goodies de cette tribune seront perdus.',
        'Les fortunes, totoz et hauts faits sont conservés.',
        '',
        'Interface : ' + next.note,
      ].join('\n');
      if (!window.confirm(message)) return;
      Engine.rebirth();
    });

    document.getElementById('sound-toggle').addEventListener('click', () => {
      const s = CC.State.s;
      s.settings.sound = !s.settings.sound;
      UI.updateSound();
      CC.State.save();
      if (s.settings.sound) {
        CC.Audio.init();
        CC.Audio.bloub();
      }
    });

    document.getElementById('save-game').addEventListener('click', () => {
      const ok = CC.State.save();
      UI.updateSaveLabel();
      UI.render();
      UI.log(
        ok ? 'Partie sauvegardée localement.' : 'Sauvegarde impossible : localStorage indisponible.',
        ok ? 'system' : 'danger', 'wmCoinCoin<'
      );
      UI.notice(ok ? '💾 Partie sauvegardée' : '❌ Sauvegarde impossible');
    });

    document.getElementById('load-game').addEventListener('click', () => {
      if (!CC.State.hasSave()) {
        UI.notice('Aucune sauvegarde locale à recharger.');
        return;
      }
      const message = 'Recharger la dernière sauvegarde locale ?\n\nLa progression non sauvegardée sera perdue.';
      if (!window.confirm(message)) return;
      CC.Engine.reloadState();
    });

    document.getElementById('slip-toggle').addEventListener('click', () => {
      const s = CC.State.s;
      s.settings.slipImpact = !s.settings.slipImpact;
      UI.updateSlipToggle();
      UI.render();
      CC.State.save();
      const on = s.settings.slipImpact;
      UI.log(
        on ? 'Impact du slip activé : ×1,50 à 100 %, ×0,50 à 0 %.' : 'Impact du slip désactivé : mode idle, les coincoins ignorent le slip.',
        'system', 'slip<'
      );
      UI.notice(on ? '🩲 Impact du slip activé (×1,50 à 100 %)' : '🩲 Mode idle : le slip ne change plus les coincoins');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      const tag = (event.target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select', 'button', 'a'].includes(tag)) return;
      if (event.key === 'Enter' && event.target.isContentEditable) return;
      event.preventDefault();
      CC.Audio.init();
      Engine.click();
    });

    document.getElementById('app').addEventListener('click', (event) => {
      if (event.target.closest('button, a, input, select, textarea')) return;
      if (event.target.closest('#feed')) return;
      CC.Audio.init();
    });

    window.addEventListener('beforeunload', () => CC.State.save());
  }

  CC.UI.init();
  CC.Engine.init();
  bind();

  // Small accessibility/e2e hook for manual testing in a browser console.
  window.coincoin = CC;
})(window.CC = window.CC || {});
