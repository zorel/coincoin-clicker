/* Poll the deployed version.json and prompt open tabs to reload.
   Silent when the file is missing, offline, or served from file://. */
(function (CC) {
  'use strict';

  const VERSION_URL = 'version.json';
  const INTERVAL = 5 * 60 * 1000;
  const TIMEOUT = 10000;

  const VersionCheck = {
    timer: null,
    busy: false,
    prompted: false,
    started: false,

    start() {
      if (this.started) return;
      this.started = true;
      this.check();
      this.timer = setInterval(() => {
        if (!document.hidden) this.check();
      }, INTERVAL);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.check();
      });
    },

    async check() {
      if (this.busy || this.prompted || !CC.APP_VERSION) return;
      this.busy = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT);
      try {
        const response = await fetch(VERSION_URL + '?t=' + Date.now(), {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data && typeof data.version === 'string' && data.version !== CC.APP_VERSION) {
          this.prompt(data.version);
        }
      } catch (err) {
        /* version.json absent, offline, or file://: nothing to do. */
      } finally {
        clearTimeout(timeout);
        this.busy = false;
      }
    },

    prompt(remoteVersion) {
      if (this.prompted) return;
      this.prompted = true;
      const banner = document.getElementById('version-banner');
      if (banner) banner.hidden = false;
      if (CC.UI) {
        CC.UI.log(
          'Nouvelle version du site disponible (' + remoteVersion +
          '). Rechargez la page pour la charger.',
          'danger', 'wmCoinCoin<'
        );
        CC.UI.notice('🔄 Nouvelle version du site disponible');
      }
    },
  };

  CC.VersionCheck = VersionCheck;
})(window.CC = window.CC || {});
