/* Rendering: stats, shop, collection, tribune feed and version skins. */
(function (CC) {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const S = () => CC.State;
  const E = () => CC.Engine;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const UI = {
    refs: {},
    logs: [],
    noticeQueue: [],
    noticeBusy: false,
    shopRefs: {},
    toolRefs: {},
    fortuneById: null,
    sourceTotals: {},

    init() {
      const ids = [
        'app', 'coins', 'cps', 'power', 'clicks', 'slip-label', 'slip-meter',
        'troll-label', 'troll-meter', 'troll-scope', 'scope-bars',
        'chauve-warning', 'rebuild-warning', 'firstjeudi-warning', 'feed', 'achievements',
        'achievement-count', 'shop', 'tools', 'albums', 'latest-fortune',
        'gallery', 'toto-count', 'url-label', 'url-value', 'url-status',
        'url-post', 'url-shuffle', 'bloub-count', 'posted-count',
        'shop-hint', 'slip-toggle', 'owned-box', 'owned-shop', 'owned-count',
        'duck', 'dog', 'stage', 'version-label', 'app-name', 'rebirth',
        'rebirth-sub', 'rebirth-progress', 'rebirth-note', 'lifetime',
        'xp', 'xp-mult', 'sound-toggle', 'status', 'notice', 'diodes',
        'version-note', 'fortune-count', 'fortune-note', 'last-save',
        'wtm-block', 'wtm-stats', 'wtm-post', 'wtm-choices', 'wtm-feedback', 'wtm-next',
      ];
      for (const id of ids) this.refs[id] = $(id);
      this.refs['wtm-block'].hidden = !CC.WTM_ENABLED;
      const visibleAchievements = CC.ACHIEVEMENTS.filter((a) => CC.WTM_ENABLED || !a.wtm);
      this.refs['achievement-count'].textContent = '0 / ' + visibleAchievements.length;
      this.refs.slipMeter = this.refs['slip-meter'];
      this.refs.trollMeter = this.refs['troll-meter'];

      this.fortuneById = {};
      this.sourceTotals = {};
      if (window.FORTUNES) {
        for (const f of window.FORTUNES) {
          this.fortuneById[f.id] = f;
          this.sourceTotals[f.s] = (this.sourceTotals[f.s] || 0) + 1;
        }
      }
      this.refs['fortune-note'].textContent =
        'Fortunes historiques : @informatique, @multidesk, @tribune-linuxfr. ' +
        (window.FORTUNES ? window.FORTUNES.length : 0) +
        ' entrées, 100 % de mauvaise foi.';
      this.buildScope();
      this.updateSound();
    },

    buildScope() {
      const bars = this.refs['scope-bars'];
      bars.replaceChildren();
      for (let i = 0; i < 21; i += 1) {
        bars.append(el('i'));
      }
    },

    setVersion() {
      const level = S().versionIndex();
      const version = S().version();
      for (let i = 1; i <= CC.VERSIONS.length - 1; i += 1) {
        document.body.classList.toggle('u' + i, level >= i);
      }
      document.body.dataset.win = String(level);
      this.refs['version-label'].textContent = 'v' + version.v + ' · ' + version.title;
      this.refs['app-name'].textContent = 'wmCoinCoin ' + version.v + ' :: COINCOIN.EXE';
      this.refs['version-note'].textContent = version.note;
      document.title = 'wmCoinCoin v' + version.v + ' — CoinCoin Clicker';
      this.updateSound();
      this.render();
    },

    notice(message) {
      this.noticeQueue.push(message);
      this.pumpNotice();
    },

    pumpNotice() {
      if (this.noticeBusy) return;
      const message = this.noticeQueue.shift();
      const node = this.refs.notice;
      if (!message) {
        node.hidden = true;
        return;
      }
      this.noticeBusy = true;
      node.textContent = message;
      node.hidden = false;
      setTimeout(() => {
        node.hidden = true;
        this.noticeBusy = false;
        setTimeout(() => this.pumpNotice(), 160);
      }, 2800);
    },

    log(text, type, who) {
      const entry = {
        time: S().clock(),
        who: who || 'système<',
        text: String(text),
        type: type || '',
      };
      this.logs.push(entry);
      if (this.logs.length > 70) this.logs.shift();
      const feed = this.refs.feed;
      const row = el('div', 'entry' + (entry.type ? ' ' + entry.type : ''));
      if (entry.text.length > 220) row.title = entry.text;
      row.append(el('span', 'stamp', entry.time + ' '));
      row.append(el('span', 'who', entry.who + ' '));
      row.append(document.createTextNode(entry.text));
      feed.append(row);
      while (feed.childElementCount > 70) feed.firstElementChild.remove();
      feed.scrollTop = feed.scrollHeight;
    },

    float(text) {
      const node = el('span', 'float', text);
      node.style.left = (30 + Math.random() * 40) + '%';
      node.style.top = (36 + Math.random() * 20) + '%';
      this.refs.stage.append(node);
      setTimeout(() => node.remove(), 900);
    },

    bubble() {
      const node = el('span', 'bubble', 'bloub');
      node.style.left = (20 + Math.random() * 60) + '%';
      this.refs.stage.append(node);
      setTimeout(() => node.remove(), 1300);
    },

    showDuck(visible) {
      this.refs.duck.hidden = !visible;
    },

    showDog(visible) {
      this.refs.dog.hidden = !visible;
    },

    updateSound() {
      const on = !!S().s.settings.sound;
      this.refs['sound-toggle'].textContent = on ? '🔊 son' : '🔇 muet';
      this.refs['sound-toggle'].setAttribute('aria-pressed', String(on));
    },

    updateSlipToggle() {
      const on = !!S().s.settings.slipImpact;
      const button = this.refs['slip-toggle'];
      const mult = S().slipMult().toFixed(2).replace('.', ',');
      button.textContent = on ? '×' + mult : 'impact off';
      button.className = 'chip ' + (on ? 'on' : 'off');
      button.setAttribute('aria-pressed', String(on));
      button.title = on
        ? 'Le slip multiplie les coincoins : ×1,50 à 100 %, ×0,50 à 0 %. Cliquer pour passer en mode idle.'
        : 'Le slip ne change pas les coincoins. Cliquer pour réactiver son impact.';
    },

    updateSaveLabel() {
      const stamp = S().s.lastSave;
      this.refs['last-save'].textContent = stamp
        ? new Date(stamp).toLocaleTimeString('fr-FR', { hour12: false })
        : 'jamais';
    },

    goodieState(goodie) {
      const engine = E();
      const available = engine.goodieAvailable(goodie);
      const cost = engine.goodieCost(goodie);
      const owned = !!S().s.goodies[goodie.id];
      const locked = typeof goodie.locked === 'function' ? !!goodie.locked(S().s) : false;
      return { available, cost, owned, locked };
    },

    buildShop() {
      const shop = this.refs.shop;
      const ownedShop = this.refs['owned-shop'];
      shop.replaceChildren();
      ownedShop.replaceChildren();
      this.shopRefs = {};
      for (const b of CC.BUILDINGS) {
        const button = el('button', 'item' + (b.phantom ? ' phantom' : ''));
        button.type = 'button';
        button.dataset.buy = b.id;

        const ownedNow = S().owned(b.id) > 0;
        button.hidden = !ownedNow && !S().isBuildingVisible(b);
        const icon = el('span', 'item-icon', b.icon);
        const text = el('div', 'item-text');
        const name = el('div', 'item-name', b.name);
        const desc = el('div', 'item-desc', b.desc);
        const owned = el('div', 'item-owned');
        text.append(name, desc, owned);

        const price = el('div', 'item-price');
        button.append(icon, text, price);
        (ownedNow ? ownedShop : shop).append(button);
        this.shopRefs[b.id] = { button, price, owned };
      }
    },

    updateShopHint() {
      const hint = this.refs['shop-hint'];
      const next = S().nextUnowned();
      if (!next || S().isBuildingVisible(next)) {
        hint.hidden = true;
        return;
      }
      const at = S().buildingUnlockAt(next);
      const left = Math.max(0, at - S().s.runTotal);
      hint.hidden = false;
      hint.textContent = left > 0
        ? 'Prochaine friture dans ' + S().fmt(left) + ' ◈ produites · ' +
          S().fmt(S().s.runTotal) + ' / ' + S().fmt(at)
        : 'Nouvelle friture disponible…';
    },

    buildTools() {
      const tools = this.refs.tools;
      tools.replaceChildren();
      this.toolRefs = {};
      for (const goodie of CC.GOODIES) {
        const state = this.goodieState(goodie);
        const button = el('button', 'tool' + (state.locked ? ' locked' : ''));
        button.type = 'button';
        button.dataset.goodie = goodie.id;
        const label = typeof goodie.name === 'function' ? goodie.name(S().s) : goodie.name;
        const title = el('span', 'tool-name', goodie.icon + ' ' + label);
        const cost = el('b');
        const desc = el('span', 'tool-desc');
        button.append(title, cost, desc);
        tools.append(button);
        this.toolRefs[goodie.id] = { button, cost, desc, title, goodie };
      }
    },

    buildAlbums() {
      const albums = this.refs.albums;
      albums.replaceChildren();
      const counts = S().fortuneCounts();
      for (const key of Object.keys(CC.SOURCES)) {
        const source = CC.SOURCES[key];
        const total = this.sourceTotals[key] || 0;
        const count = counts[key] || 0;
        const tiers = CC.FORTUNE_TIERS[key] || [];
        const card = el('div', 'album');
        const head = el('div', 'album-head');
        head.append(el('span', 'album-title', source.icon + ' ' + source.label));
        head.append(el('span', 'album-count', count + ' / ' + total));
        const bar = el('div', 'album-bar');
        const fill = el('div', 'album-fill');
        fill.style.width = (total ? Math.min(100, (count / total) * 100) : 0) + '%';
        bar.append(fill);
        const tierRow = el('div', 'album-tiers');
        for (const tier of tiers) {
          const reached = count >= tier.n;
          const chip = el(
            'span',
            'tier' + (reached ? ' reached' : ''),
            (reached ? '✓ ' : '') + tier.n + ' · +' + Math.round(tier.bonus * 100) + '%'
          );
          tierRow.append(chip);
        }
        const bonus = tiers.reduce((sum, tier) => sum + (count >= tier.n ? tier.bonus : 0), 0);
        const foot = el('div', 'album-foot', 'Bonus goodies : +' + Math.round(bonus * 100) + ' % de production');
        card.append(head, bar, tierRow, foot);
        albums.append(card);
      }
    },

    renderLatestFortune() {
      const latest = this.refs['latest-fortune'];
      latest.replaceChildren();
      const ids = S().s.fortunes;
      const fortune = ids.length ? this.fortuneById[ids[ids.length - 1]] : null;
      if (!fortune) {
        latest.append(el('div', 'empty', 'Aucune fortune collectée. Le pinnipède écoute.'));
        return;
      }
      const source = CC.SOURCES[fortune.s] || { label: fortune.s, icon: '📜' };
      const head = el('div', 'latest-head');
      head.append(el('span', 'latest-source', source.icon + ' ' + source.label));
      if (fortune.a) head.append(el('span', 'latest-author', fortune.a));
      const body = el('p', 'latest-text', fortune.t);
      const count = el('div', 'latest-foot', ids.length + ' fortunes uniques dans la collection');
      latest.append(head, body, count);
    },

    buildGallery() {
      const gallery = this.refs.gallery;
      gallery.replaceChildren();
      let unlocked = 0;
      for (const toto of CC.TOTOZ) {
        const has = S().s.totoz.includes(toto.name);
        if (has) unlocked += 1;
        const card = el('div', 'toto' + (has ? '' : ' locked'));
        card.title = has ? toto.desc : '???' ;
        if (has) {
          const img = document.createElement('img');
          img.loading = 'lazy';
          img.alt = 'totoz ' + toto.name;
          img.src = 'https://totoz.eu/' + encodeURIComponent(toto.name) + '.gif';
          const fallback = el('span', 'fallback', toto.emoji);
          fallback.style.display = 'none';
          img.addEventListener('error', () => {
            img.remove();
            fallback.style.display = 'block';
          });
          card.append(img, fallback, el('b', '', ':' + toto.name + ']'));
        } else {
          card.append(el('span', 'toto-locked', '?'), el('b', '', '???'));
        }
        gallery.append(card);
      }
      this.refs['toto-count'].textContent = unlocked + ' / ' + CC.TOTOZ.length;
    },

    buildAchievements() {
      const box = this.refs.achievements;
      box.replaceChildren();
      const visible = CC.ACHIEVEMENTS.filter((a) => CC.WTM_ENABLED || !a.wtm);
      const unlocked = visible.filter((a) => S().achievement(a.id));
      this.refs['achievement-count'].textContent = unlocked.length + ' / ' + visible.length;
      if (!unlocked.length) {
        box.append(el('div', 'empty', 'Le premier clic est le plus difficile.'));
        return;
      }
      for (const a of unlocked) {
        box.append(el('span', 'achievement', a.icon + ' ' + a.name));
      }
    },

    renderWtm() {
      if (!CC.WTM_ENABLED) {
        this.refs['wtm-block'].hidden = true;
        return;
      }
      this.refs['wtm-block'].hidden = false;
      const s = S().s;
      const stats = this.refs['wtm-stats'];
      const post = this.refs['wtm-post'];
      const choices = this.refs['wtm-choices'];
      const feedback = this.refs['wtm-feedback'];
      const next = this.refs['wtm-next'];
      stats.textContent = s.wtmWins + ' V · ' + s.wtmLosses + ' D · série ' + s.wtmStreak;
      choices.replaceChildren();
      const wtm = E().wtm;
      if (!wtm) {
        post.textContent = 'Aucun post à deviner pour le moment.';
        feedback.textContent = '';
        feedback.className = 'wtm-feedback';
        next.disabled = true;
        return;
      }
      post.textContent = wtm.fortune.t;
      const source = CC.SOURCES[wtm.fortune.s] || { label: wtm.fortune.s };
      for (const choice of wtm.choices) {
        const button = el('button', 'wtm-choice', choice);
        button.type = 'button';
        button.dataset.wtmChoice = choice;
        if (wtm.answered) {
          if (choice === wtm.correct) button.classList.add('correct');
          else if (choice === wtm.selected) button.classList.add('wrong');
          button.disabled = true;
        }
        choices.append(button);
      }
      if (wtm.answered) {
        if (wtm.selected === wtm.correct) {
          feedback.textContent = 'Bien vu : c’était ' + wtm.correct +
            ' · +' + S().fmt(wtm.reward) + ' coins · ' + source.label;
          feedback.className = 'wtm-feedback good';
        } else {
          feedback.textContent = 'Raté : c’était ' + wtm.correct + ' · ' + source.label;
          feedback.className = 'wtm-feedback bad';
        }
        next.disabled = false;
      } else {
        feedback.textContent = 'Auteur masqué · 4 moules possibles';
        feedback.className = 'wtm-feedback';
        next.disabled = true;
      }
    },

    updateUrl() {
      const s = S().s;
      const entry = s.currentUrl;
      if (!entry) return;
      const posted = s.urlsPosted.includes(entry.url);
      const antibloub = S().versionIndex() >= 8;
      this.refs['url-label'].textContent = (s.goodies.https ? '🔒 ' : '') + entry.label;
      this.refs['url-value'].textContent = entry.url;
      if (posted && antibloub) {
        this.refs['url-status'].textContent =
          'déjà postée ' + this.timesPosted(entry.url) + '× — BLOUB probable';
        this.refs['url-status'].className = 'url-flag danger';
      } else if (posted) {
        this.refs['url-status'].textContent = 'prête à poster — vérification manuelle';
        this.refs['url-status'].className = 'url-flag';
      } else {
        this.refs['url-status'].textContent = 'inédite — PREUMS possible';
        this.refs['url-status'].className = 'url-flag';
      }
      this.refs['url-post'].classList.toggle('warn', posted && antibloub);
      this.refs['bloub-count'].textContent = S().fmt(s.bloubs);
      this.refs['posted-count'].textContent = s.urlsPosted.length + ' / ' + CC.URLS.length;
    },

    timesPosted(url) {
      let n = 0;
      for (const posted of S().s.urlsPosted) if (posted === url) n += 1;
      return n;
    },

    updateShop() {
      const state = S();
      const shop = this.refs.shop;
      const ownedShop = this.refs['owned-shop'];
      const next = state.nextUnowned();
      let ownedTypes = 0;
      for (const b of CC.BUILDINGS) {
        const ref = this.shopRefs[b.id];
        if (!ref) continue;
        const owned = state.owned(b.id);
        if (owned > 0) ownedTypes += 1;
        const target = owned > 0 ? ownedShop : shop;
        if (ref.button.parentElement !== target) target.append(ref.button);
        const visible = owned > 0 || state.isBuildingVisible(b);
        ref.button.hidden = !visible;
        ref.button.classList.toggle('item-next', owned === 0 && !!next && next.id === b.id);
        if (!visible) {
          ref.button.disabled = true;
          continue;
        }
        const price = state.price(b);
        if (b.phantom) {
          ref.price.textContent = '∞';
          ref.owned.textContent = 'ANNONCÉ DEPUIS 2003';
          ref.button.disabled = false;
          ref.button.classList.add('phantom');
        } else {
          ref.price.textContent = state.fmt(price) + ' ◈';
          ref.owned.textContent = '×' + owned + ' · +' + state.fmtRate(b.cps * owned);
          ref.button.disabled = state.s.coins < price;
        }
      }
      this.refs['owned-box'].hidden = ownedTypes === 0;
      this.refs['owned-count'].textContent = ownedTypes;
      this.updateShopHint();
    },

    updateTools() {
      const state = S();
      for (const goodie of CC.GOODIES) {
        const ref = this.toolRefs[goodie.id];
        if (!ref) continue;
        const { available, cost, owned, locked } = this.goodieState(goodie);
        ref.title.textContent = goodie.icon + ' ' +
          (typeof goodie.name === 'function' ? goodie.name(state.s) : goodie.name);
        const pyMaxed = goodie.id === 'pycoincoin' &&
          (state.s.pycoincoinLevel || 0) >= CC.PYCOINCOIN_VERSIONS.length;
        ref.cost.textContent = pyMaxed
          ? 'version finale'
          : owned && !goodie.repeatable
            ? 'installé'
            : locked ? 'verrouillé' : state.fmt(cost) + ' coins';
        ref.desc.textContent = typeof goodie.desc === 'function' ? goodie.desc(state.s) : goodie.desc;
        if (goodie.id === 'click') {
          ref.desc.textContent = 'Niveau clic ' + state.s.powerLevel + ' · ' + (typeof goodie.desc === 'function' ? goodie.desc(state.s) : '');
        }
        ref.button.disabled = locked || !available || state.s.coins < cost;
        ref.button.classList.toggle('installed', owned && !goodie.repeatable);
        ref.button.classList.toggle('locked', locked);
      }
    },

    updateRebirth() {
      const state = S();
      const next = state.nextVersion();
      const button = this.refs.rebirth;
      const sub = this.refs['rebirth-sub'];
      const fill = this.refs['rebirth-progress'];
      const note = this.refs['rebirth-note'];
      if (!next) {
        button.disabled = true;
        sub.textContent = 'v' + state.version().v + ' · version finale';
        fill.style.width = '100%';
        note.textContent = 'Dernière version réelle de wmCoinCoin atteinte. gcoincoin, lui, reste introuvable.';
        return;
      }
      const pct = Math.min(100, (state.s.runTotal / next.need) * 100);
      fill.style.width = pct.toFixed(1) + '%';
      const missing = Math.max(0, next.need - state.s.runTotal);
      button.disabled = state.s.runTotal < next.need;
      sub.textContent = '→ wmCoinCoin v' + next.v;
      note.textContent = state.s.runTotal >= next.need
        ? 'Prêt à recompiler : ' + next.note
        : 'Encore ' + state.fmt(missing) + ' coins sur cette tribune. Prochaine version : v' + next.v + ' (' + state.fmt(next.need) + ').';
    },

    render() {
      const state = S();
      const s = state.s;
      const r = this.refs;
      const now = Date.now();
      r.coins.textContent = state.fmt(s.coins);
      r.cps.textContent = state.fmtRate(state.cps());
      r.power.textContent = state.fmtDecimal(state.clickPower());
      r.clicks.textContent = state.fmt(s.clicks);
      r['slip-meter'].style.width = Math.max(0, Math.min(100, s.slip)) + '%';
      r['slip-meter'].style.background = s.slip < 25 ? '#e97760' : s.slip < 55 ? '#e6bb62' : '#a9d787';
      r['slip-meter'].parentElement.setAttribute('aria-valuenow', String(Math.round(s.slip)));
      const slipState = s.slip <= 0 ? 'TROUÉ !' : s.slip < 35 ? 'SALE' : 'PROPRE';
      const slipMult = state.slipMult().toFixed(2).replace('.', ',');
      r['slip-label'].textContent = Math.round(s.slip) + ' % · ' + slipState +
        (s.settings.slipImpact ? ' · ×' + slipMult : ' · impact off');
      this.updateSlipToggle();
      r['troll-meter'].style.width = Math.min(100, s.troll) + '%';
      r['troll-meter'].parentElement.setAttribute('aria-valuenow', String(Math.round(s.troll)));
      if (state.frenzyActive()) {
        const left = Math.ceil((s.frenzyUntil - now) / 1000);
        r['troll-label'].textContent = 'TROLL ×3 · ' + left + ' s';
        r['troll-label'].className = 'hot';
      } else {
        r['troll-label'].textContent = Math.floor(s.troll) + ' %';
        r['troll-label'].className = '';
      }
      const scope = r['scope-bars'];
      if (scope) {
        const lit = Math.round((Math.min(100, s.troll) / 100) * scope.childElementCount);
        for (let i = 0; i < scope.childElementCount; i += 1) {
          scope.children[i].className = i < lit ? 'on' : '';
        }
      }
      r['chauve-warning'].hidden = !state.chauveActive();
      if (state.chauveActive()) {
        r['chauve-warning'].textContent = '👴 Le chauve poste · production ÷2 · ' +
          Math.ceil((s.chauveUntil - now) / 1000) + ' s';
      }
      r['rebuild-warning'].hidden = !state.rebuilding();
      if (state.rebuilding()) {
        r['rebuild-warning'].textContent = '🦀 cargo build --release · production 0 · ' +
          Math.ceil((s.rebuildUntil - now) / 1000) + ' s';
      }
      r['firstjeudi-warning'].hidden = !state.firstJeudiActive();
      if (state.firstJeudiActive()) {
        r['firstjeudi-warning'].textContent = '🍻 First Jeudi ×' +
          (s.firstJeudiFactor === 3 ? 3 : 2) + ' · ' +
          Math.ceil((s.firstJeudiUntil - now) / 1000) + ' s';
      }
      r['lifetime'].textContent = state.fmt(s.lifetime) + ' ◈';
      r['xp'].textContent = state.fmt(s.xp);
      r['xp-mult'].textContent = '×' + state.xpMult().toFixed(2) + ' XP';
      this.updateSaveLabel();
      r['fortune-count'].textContent = s.fortunes.length + ' / ' + (window.FORTUNES ? window.FORTUNES.length : 0);
      r['bloub-count'].textContent = state.fmt(s.bloubs);
      r['posted-count'].textContent = s.urlsPosted.length + ' / ' + CC.URLS.length;
      this.updateShop();
      this.updateTools();
      this.updateRebirth();
      this.updateUrl();
    },

    refreshStatic() {
      this.buildShop();
      this.buildTools();
      this.buildAlbums();
      this.renderLatestFortune();
      this.buildGallery();
      this.buildAchievements();
      this.updateUrl();
      this.renderWtm();
      this.render();
    },
  };

  CC.UI = UI;
})(window.CC = window.CC || {});
