/* Persistent state, derived production values and rebirth logic. */
(function (CC) {
  'use strict';

  const KEY = 'coincoin-clicker-local-v2';
  const SAVE_SCHEMA = 3;
  const MAX_OFFLINE = 8 * 3600;

  const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

  function zeroOwned() {
    const owned = {};
    for (const b of CC.BUILDINGS) owned[b.id] = 0;
    return owned;
  }



  function defaults() {
    return {
      schema: SAVE_SCHEMA,
      coins: 0,
      runTotal: 0,
      lifetime: 0,
      clicks: 0,
      powerLevel: 0,
      slip: 100,
      owned: zeroOwned(),
      goodies: {},
      totoz: [],
      fortunes: [],
      achievements: [],
      seenBuildings: ['moule'],
      xp: 0,
      rebirths: 0,
      bloubs: 0,
      duckKills: 0,
      dogPets: 0,
      chauveEvents: 0,
      gcoincoinClicks: 0,
      trolls: 0,
      troll: 0,
      frenzyUntil: 0,
      chauveUntil: 0,
      rebuildUntil: 0,
      urlsPosted: [],
      currentUrl: null,
      nextGlitch: 0,
      nextChatter: 0,
      nextFortune: 0,
      nextDuck: 0,
      duckUntil: 0,
      nextDog: 0,
      dogUntil: 0,
      nextChauve: 0,
      nextBotUrl: 0,
      lastPreums: '',
      lastSave: 0,
      pycoincoinLevel: 0,
      wtmWins: 0,
      wtmLosses: 0,
      wtmStreak: 0,
      wtmBest: 0,
      settings: { sound: true, slipImpact: true },
    };
  }

  function normalizeSave(data) {
    const fresh = defaults();
    const base = defaults();
    for (const key of Object.keys(base)) {
      if (Object.prototype.hasOwnProperty.call(data, key)) base[key] = data[key];
    }
    base.schema = SAVE_SCHEMA;

    base.owned = {};
    for (const b of CC.BUILDINGS) {
      const n = Number(data.owned && data.owned[b.id]);
      base.owned[b.id] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }

    base.goodies = {};
    for (const g of CC.GOODIES) {
      if (data.goodies && data.goodies[g.id]) base.goodies[g.id] = true;
    }

    base.settings = {
      sound: !data.settings || data.settings.sound !== false,
      slipImpact: !data.settings || data.settings.slipImpact !== false,
    };

    const numeric = [
      'coins', 'runTotal', 'lifetime', 'clicks', 'powerLevel', 'slip', 'xp',
      'rebirths', 'bloubs', 'duckKills', 'dogPets', 'chauveEvents',
      'gcoincoinClicks', 'trolls', 'troll', 'frenzyUntil', 'chauveUntil',
      'rebuildUntil', 'nextGlitch', 'nextChatter', 'nextFortune', 'nextDuck',
      'duckUntil', 'nextDog', 'dogUntil', 'nextChauve', 'nextBotUrl',
      'lastSave', 'pycoincoinLevel', 'wtmWins', 'wtmLosses', 'wtmStreak', 'wtmBest',
    ];
    for (const key of numeric) {
      const n = Number(base[key]);
      base[key] = Number.isFinite(n) ? n : fresh[key];
    }

    base.slip = Math.max(0, Math.min(100, base.slip));
    for (const key of [
      'clicks', 'rebirths', 'bloubs', 'duckKills', 'dogPets', 'chauveEvents',
      'gcoincoinClicks', 'trolls', 'wtmWins', 'wtmLosses', 'wtmStreak', 'wtmBest',
    ]) {
      base[key] = Math.max(0, Math.floor(base[key] || 0));
    }
    base.wtmBest = Math.max(base.wtmBest, base.wtmStreak);

    const pyVersions = CC.PYCOINCOIN_VERSIONS.length;
    let pyLevel = Math.max(0, Math.min(pyVersions, Math.floor(base.pycoincoinLevel || 0)));
    if (pyLevel === 0 && data.goodies && data.goodies.pycoincoin) {
      // Old saves had the single 0.7.17 goodie: keep its final version.
      pyLevel = pyVersions;
    }
    base.pycoincoinLevel = pyLevel;
    if (pyLevel > 0) base.goodies.pycoincoin = true;
    else delete base.goodies.pycoincoin;

    for (const key of ['totoz', 'fortunes', 'achievements', 'urlsPosted', 'seenBuildings']) {
      base[key] = Array.isArray(data[key])
        ? data[key].filter((v) => typeof v === 'string')
        : [];
    }

    const knownBuildings = new Set(CC.BUILDINGS.map((b) => b.id));
    const seen = new Set(base.seenBuildings.filter((id) => knownBuildings.has(id)));
    seen.add('moule');
    for (const b of CC.BUILDINGS) if (base.owned[b.id] > 0) seen.add(b.id);
    base.seenBuildings = [...seen];

    if (data.currentUrl && typeof data.currentUrl.url === 'string') {
      base.currentUrl = {
        url: data.currentUrl.url,
        label: typeof data.currentUrl.label === 'string' ? data.currentUrl.label : data.currentUrl.url,
      };
    } else {
      base.currentUrl = null;
    }
    if (typeof data.lastPreums !== 'string') base.lastPreums = '';

    return base;
  }

  const State = {
    s: defaults(),

    key: KEY,

    fmt(n) {
      if (!Number.isFinite(n)) return '∞';
      const abs = Math.abs(n);
      if (abs >= 1e15) return nf1.format(n / 1e15) + 'P';
      if (abs >= 1e12) return nf1.format(n / 1e12) + 'T';
      if (abs >= 1e9) return nf1.format(n / 1e9) + 'G';
      if (abs >= 1e6) return nf1.format(n / 1e6) + 'M';
      if (abs >= 1e4) return nf1.format(n / 1e3) + 'k';
      return nf.format(Math.floor(n));
    },

    fmtRate(n) {
      if (!Number.isFinite(n)) return '∞';
      if (n >= 1000) return this.fmt(n) + '/s';
      return nf2.format(n) + '/s';
    },

    fmtDecimal(n) {
      if (!Number.isFinite(n)) return '∞';
      if (Math.abs(n) >= 1000) return this.fmt(n);
      return nf2.format(n);
    },

    clock() {
      return new Date().toLocaleTimeString('fr-FR', { hour12: false });
    },

    owned(id) {
      return this.s.owned[id] || 0;
    },

    price(building) {
      if (building.phantom) return Infinity;
      const n = this.owned(building.id);
      const base = building.cost;
      if (!Number.isFinite(base)) return Infinity;
      return Math.ceil(base * Math.pow(1.15, n));
    },

    buildingUnlockAt(building) {
      if (building.phantom) {
        return Number.isFinite(building.unlockAt) ? building.unlockAt : 6000000;
      }
      return Math.max(1, Math.floor(building.cost * 0.5));
    },

    nextUnowned() {
      return CC.BUILDINGS.find((b) => this.owned(b.id) === 0) || null;
    },

    isBuildingVisible(building) {
      if (this.owned(building.id) > 0) return true;
      const next = this.nextUnowned();
      if (!next || next.id !== building.id) return false;
      if (next.id === CC.BUILDINGS[0].id) return true;
      return this.s.runTotal >= this.buildingUnlockAt(next);
    },

    unlockBuildings() {
      const next = this.nextUnowned();
      if (!next || !this.isBuildingVisible(next)) return [];
      if (!Array.isArray(this.s.seenBuildings)) this.s.seenBuildings = [];
      if (this.s.seenBuildings.includes(next.id)) return [];
      this.s.seenBuildings.push(next.id);
      return [next];
    },

    version() {
      return CC.VERSIONS[Math.min(this.s.rebirths, CC.VERSIONS.length - 1)];
    },

    nextVersion() {
      return CC.VERSIONS[this.s.rebirths + 1] || null;
    },

    versionIndex() {
      return this.s.rebirths;
    },

    canRebirth() {
      const next = this.nextVersion();
      return !!next && this.s.runTotal >= next.need;
    },

    xpMult() {
      return 1 + this.s.xp * 0.02;
    },

    versionMult() {
      return 1 + this.s.rebirths * 0.35;
    },

    totozMult() {
      return 1 + this.s.totoz.length * 0.01;
    },

    fortuneCounts() {
      const counts = { informatique: 0, multidesk: 0, 'tribune-linuxfr': 0 };
      for (const id of this.s.fortunes) {
        const source = id.split(':')[0];
        if (counts[source] !== undefined) counts[source] += 1;
      }
      return counts;
    },

    albumBonus() {
      const counts = this.fortuneCounts();
      let bonus = 0;
      for (const source of Object.keys(CC.SOURCES)) {
        const tiers = CC.FORTUNE_TIERS[source] || [];
        for (const tier of tiers) if (counts[source] >= tier.n) bonus += tier.bonus;
      }
      return bonus;
    },

    fortuneMult() {
      return 1 + this.s.fortunes.length * 0.0025 + this.albumBonus();
    },

    goodieMult() {
      let mult = 1;
      const pyLevel = Math.min(
        Math.max(0, this.s.pycoincoinLevel || 0),
        CC.PYCOINCOIN_VERSIONS.length
      );
      if (pyLevel > 0) mult += CC.PYCOINCOIN_VERSIONS[pyLevel - 1].bonus;
      if (this.s.goodies.quteqoin) mult += 0.08;
      if (this.s.goodies.rails) mult += 0.12;
      if (this.s.goodies.pull) mult += 0.10;
      if (this.s.goodies.mug) mult += 0.10;
      if (this.s.goodies.sticker) mult += 0.15;
      if (this.s.goodies['coincoin-ultime']) mult += 0.20;
      if (this.s.goodies.rust && Date.now() >= this.s.rebuildUntil) mult += 4;
      return mult;
    },

    globalMult() {
      return this.xpMult() * this.versionMult() * this.fortuneMult() *
        this.goodieMult() * this.totozMult();
    },

    slipMult() {
      if (!this.s.settings.slipImpact) return 1;
      const slip = Math.max(0, Math.min(100, this.s.slip));
      return 0.5 + slip / 100;
    },

    frenzyActive() {
      return Date.now() < this.s.frenzyUntil;
    },

    boost() {
      return this.frenzyActive() ? 3 : 1;
    },

    chauveActive() {
      return Date.now() < this.s.chauveUntil;
    },

    chauveFactor() {
      return this.chauveActive() ? 0.5 : 1;
    },

    rebuilding() {
      return Date.now() < this.s.rebuildUntil;
    },

    cps() {
      if (this.rebuilding()) return 0;
      let base = 0;
      for (const b of CC.BUILDINGS) base += b.cps * this.owned(b.id);
      return base * this.globalMult() * this.slipMult() * this.boost() *
        this.chauveFactor();
    },

    clickPower() {
      // All repeatable coin gains are halved for the slower balance.
      return (1 + this.s.powerLevel * 2) * this.globalMult() * this.slipMult() *
        this.boost() * 0.5;
    },

    achievement(id) {
      return this.s.achievements.includes(id);
    },

    evaluateAchievements() {
      const fresh = [];
      for (const a of CC.ACHIEVEMENTS) {
        if (!this.achievement(a.id) && a.check(this.s)) {
          this.s.achievements.push(a.id);
          fresh.push(a);
        }
      }
      return fresh;
    },

    evaluateTotoz() {
      const fresh = [];
      for (const t of CC.TOTOZ) {
        if (!this.s.totoz.includes(t.name) && t.check(this.s)) {
          this.s.totoz.push(t.name);
          fresh.push(t);
        }
      }
      return fresh;
    },

    runTier() {
      return Math.min(this.s.rebirths, CC.VERSIONS.length - 1);
    },

    resetRun() {
      const keep = {
        xp: this.s.xp,
        rebirths: this.s.rebirths,
        lifetime: this.s.lifetime,
        achievements: this.s.achievements,
        fortunes: this.s.fortunes,
        totoz: this.s.totoz,
        seenBuildings: Array.isArray(this.s.seenBuildings) && this.s.seenBuildings.length
          ? this.s.seenBuildings : ['moule'],
        bloubs: this.s.bloubs,
        duckKills: this.s.duckKills,
        dogPets: this.s.dogPets,
        chauveEvents: this.s.chauveEvents,
        gcoincoinClicks: this.s.gcoincoinClicks,
        trolls: this.s.trolls,
        wtmWins: this.s.wtmWins,
        wtmLosses: this.s.wtmLosses,
        wtmStreak: this.s.wtmStreak,
        wtmBest: this.s.wtmBest,
        lastPreums: this.s.lastPreums,
        settings: this.s.settings,
      };
      Object.assign(this.s, defaults(), keep);
      this.s.coins = 0;
      this.s.runTotal = 0;
      this.s.clicks = 0;
      this.s.slip = 100;
      this.s.currentUrl = null;
      this.s.urlsPosted = [];
      this.s.lastSave = Date.now();
      this.schedule();
    },

    rebirth() {
      const next = this.nextVersion();
      if (!next || this.s.runTotal < next.need) return null;
      const gain = Math.max(1, Math.floor(Math.sqrt(this.s.runTotal / 250)));
      this.s.xp += gain;
      this.s.rebirths += 1;
      this.resetRun();
      this.save();
      return { gain, version: this.version() };
    },

    schedule(now = Date.now()) {
      this.s.nextGlitch = now + 24000;
      this.s.nextChatter = now + 7000;
      this.s.nextFortune = now + 12000;
      this.s.nextDuck = now + 22000;
      this.s.duckUntil = 0;
      this.s.nextDog = now + 40000;
      this.s.dogUntil = 0;
      this.s.nextChauve = now + 55000;
      this.s.nextBotUrl = now + 30000;
    },

    save() {
      try {
        this.s.lastSave = Date.now();
        localStorage.setItem(KEY, JSON.stringify(this.s));
        return true;
      } catch (err) {
        /* localStorage peut être indisponible (file://, mode privé). */
        return false;
      }
    },

    hasSave() {
      try {
        return localStorage.getItem(KEY) !== null;
      } catch (err) {
        return false;
      }
    },

    exportSave() {
      return JSON.stringify({
        game: 'coincoin-clicker',
        schema: SAVE_SCHEMA,
        exportedAt: new Date().toISOString(),
        state: this.s,
      }, null, 2);
    },

    importSave(raw) {
      let data;
      try {
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (err) {
        return { ok: false, error: 'JSON invalide.' };
      }
      if (data && data.state && typeof data.state === 'object') data = data.state;
      if (!data || typeof data.coins !== 'number' || !Number.isFinite(data.coins)) {
        return { ok: false, error: 'Ce fichier ne contient pas une sauvegarde CoinCoin valide.' };
      }
      this.s = normalizeSave(data);
      this.s.lastSave = Date.now();
      this.schedule();
      if (!this.s.currentUrl) this.s.currentUrl = this.randomUrl();
      return { ok: true };
    },

    load() {
      this.offline = null;
      let data = null;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) data = JSON.parse(raw);
      } catch (err) {
        data = null;
      }
      const fresh = defaults();
      if (data && typeof data.coins === 'number') {
        this.s = normalizeSave(data);
        const savedAt = Number(data.lastSave);
        const lastSeen = Number.isFinite(savedAt) && savedAt > 0 ? savedAt : Date.now();
        const elapsed = Math.min(MAX_OFFLINE, Math.max(0, (Date.now() - lastSeen) / 1000));
        const rate = this.cps();
        const earned = rate * elapsed * 0.5;
        if (earned > 1) {
          this.s.coins += earned;
          this.s.runTotal += earned;
          this.s.lifetime += earned;
          this.offline = { earned, elapsed };
        }
        if (elapsed > 60) this.schedule();
      } else {
        this.s = fresh;
        this.schedule();
      }
      this.s.schema = SAVE_SCHEMA;
      if (!this.s.currentUrl || !this.s.currentUrl.url) this.s.currentUrl = this.randomUrl();
      return this.offline || null;
    },

    randomUrl() {
      return CC.URLS[Math.floor(Math.random() * CC.URLS.length)];
    },

    addFrenzy(seconds) {
      this.s.frenzyUntil = Math.max(this.s.frenzyUntil, Date.now()) + seconds * 1000;
      this.s.troll = 0;
      this.s.trolls += 1;
    },

    addSlip(delta) {
      this.s.slip = Math.max(0, Math.min(100, this.s.slip + delta));
    },
  };

  CC.State = State;
})(window.CC = window.CC || {});
