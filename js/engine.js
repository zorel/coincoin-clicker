/* Simulation: production, random tribune events, bloub, ducks, dogs, chauve. */
(function (CC) {
  'use strict';

  const S = () => CC.State;
  const U = () => CC.UI;
  const now = () => Date.now();
  const rand = (a, b) => a + Math.random() * (b - a);

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function shortWtmAuthor(value) {
    let author = String(value).split(' - ')[0].replace(/\s+/g, ' ').trim();
    if (author.length > 34) author = author.slice(0, 33).trim() + '…';
    return author;
  }

  const Engine = {
    lastTick: now(),
    lastSave: now(),
    lastCheck: now(),
    duckShown: false,
    dogShown: false,
    started: false,
    wtm: null,
    nextBlower: 0,

    init() {
      const offline = S().load();
      const s = S().s;
      if (!s.nextGlitch) S().schedule();
      if (!s.currentUrl) s.currentUrl = S().randomUrl();
      this.nextBlower = now() + rand(25000, 50000);
      this.bindVisibility();
      if (offline) {
        U().log(
          'Les moules ont produit ' + S().fmt(offline.earned) +
          ' coins pendant votre absence (' + Math.round(offline.elapsed / 60) + ' min, 50 %).',
          'system', 'pinnipède<'
        );
        U().notice('Absence : +' + S().fmt(offline.earned) + ' coins moisis');
      }
      U().setVersion();
      U().log('Bienvenue sur le bouchot. Appuyez sur le gros bouton rouge.', 'system');
      U().log('[:totoz] prêt pour le moulage. gcoincoin, lui, toujours pas.', '', 'moule<');
      this.revealBuildings();
      this.newWtmRound();
      U().refreshStatic();
      U().render();
      this.start();
    },

    start() {
      if (this.started) return;
      this.started = true;
      this.lastTick = now();
      setInterval(() => this.tick(), 200);
    },

    applyState() {
      const s = S().s;
      if (!s.nextGlitch) S().schedule();
      if (!s.currentUrl) s.currentUrl = S().randomUrl();
      this.lastTick = now();
      this.lastCheck = now();
      this.nextBlower = now() + rand(25000, 50000);
      this.duckShown = !!(s.duckUntil && now() < s.duckUntil);
      this.dogShown = !!(s.dogUntil && now() < s.dogUntil);
      U().showDuck(this.duckShown);
      U().showDog(this.dogShown);
      U().setVersion();
      this.revealBuildings();
      this.newWtmRound();
      U().refreshStatic();
      U().render();
    },

    reloadState() {
      if (!S().hasSave()) {
        U().notice('Aucune sauvegarde locale à recharger.');
        return false;
      }
      const offline = S().load();
      this.applyState();
      U().log('État rechargé depuis la sauvegarde locale.', 'system', 'wmCoinCoin<');
      U().notice('📂 Sauvegarde rechargée');
      if (offline) {
        U().log(
          'Les moules ont produit ' + S().fmt(offline.earned) +
          ' coins pendant votre absence (' + Math.round(offline.elapsed / 60) + ' min, 50 %).',
          'system', 'pinnipède<'
        );
      }
      return true;
    },

    importState(raw) {
      const result = S().importSave(raw);
      if (!result.ok) {
        U().log('Import impossible : ' + result.error, 'danger', 'wmCoinCoin<');
        U().notice('❌ ' + result.error);
        return false;
      }
      this.applyState();
      S().save();
      U().log('Sauvegarde importée depuis un fichier JSON.', 'system', 'wmCoinCoin<');
      U().notice('📥 Sauvegarde importée');
      return true;
    },

    newWtmRound() {
      if (!CC.WTM_ENABLED) {
        this.wtm = null;
        return null;
      }
      const pool = (window.FORTUNES || []).filter(
        (f) => f.a && f.t.length >= 30 && f.t.length <= 500
      );
      if (!pool.length) {
        this.wtm = null;
        U().renderWtm();
        return null;
      }
      const fortune = pick(pool);
      const correct = shortWtmAuthor(fortune.a) || 'moule anonyme';
      const names = [...new Set(
        pool.map((f) => shortWtmAuthor(f.a)).filter((name) => name && name !== correct)
      )];
      const choices = [correct];
      while (choices.length < 4 && names.length) {
        const index = Math.floor(Math.random() * names.length);
        const name = names.splice(index, 1)[0];
        if (!choices.includes(name)) choices.push(name);
      }
      for (const name of CC.WTM_FALLBACK) {
        if (choices.length >= 4) break;
        if (name && !choices.includes(name)) choices.push(name);
      }
      this.wtm = {
        fortune,
        correct,
        choices: shuffle(choices.slice()),
        answered: false,
        selected: null,
        reward: 0,
      };
      U().renderWtm();
      return this.wtm;
    },

    answerWtm(choice) {
      const wtm = this.wtm;
      if (!wtm || wtm.answered) return;
      wtm.answered = true;
      wtm.selected = choice;
      const s = S().s;
      if (choice === wtm.correct) {
        s.wtmWins += 1;
        s.wtmStreak += 1;
        s.wtmBest = Math.max(s.wtmBest, s.wtmStreak);
        const bonus = Math.max(25, Math.floor(S().cps() * 10));
        wtm.reward = bonus;
        this.gain(bonus);
        U().log(
          'WhatTheMoule : bien vu, c’était ' + wtm.correct +
          '. +' + S().fmt(bonus) + ' coins. Série ' + s.wtmStreak + '.',
          'system', 'wtm<'
        );
        U().notice('🕵️ Bonne moule ! +' + S().fmt(bonus) + ' coins');
      } else {
        s.wtmLosses += 1;
        s.wtmStreak = 0;
        S().addSlip(s.goodies.https ? -1 : -2);
        U().log(
          'WhatTheMoule : raté, c’était ' + wtm.correct + '. −' +
          (s.goodies.https ? '1' : '2') + ' % de slip.',
          'danger', 'wtm<'
        );
        U().notice('🕵️ Raté ! C’était ' + wtm.correct);
      }
      this.progress();
      U().renderWtm();
      U().render();
      S().save();
    },

    wtmNext() {
      this.newWtmRound();
      U().renderWtm();
      U().render();
    },

    bindVisibility() {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) S().save();
        else this.lastTick = now();
      });
      window.addEventListener('pagehide', () => S().save());
    },

    gain(amount) {
      if (!Number.isFinite(amount) || amount <= 0) return;
      const s = S().s;
      s.coins += amount;
      s.runTotal += amount;
      s.lifetime += amount;
    },

    revealBuildings() {
      const fresh = S().unlockBuildings();
      for (const b of fresh) {
        const price = b.phantom ? 'prix ∞' : S().fmt(S().price(b)) + ' ◈';
        U().log('Nouvelle friture débloquée : ' + b.name + ' · ' + price, 'system', 'apt<');
        U().notice('🔓 ' + b.icon + ' ' + b.name + ' disponible');
      }
      return fresh;
    },

    click() {
      const s = S().s;
      const amount = S().clickPower();
      this.gain(amount);
      s.clicks += 1;
      s.troll = Math.min(100, s.troll + 3.5);
      U().float('+' + S().fmtDecimal(amount));
      if (s.clicks === 1) U().log('\\_o<', '', 'vous<');
      if (s.clicks % 50 === 0) {
        U().log('Le décideur pressé a appuyé ' + s.clicks + ' fois.', '', 'wmCoinCoin<');
      }
      if (s.troll >= 100) this.frenzy();
      this.progress();
      U().render();
    },

    frenzy() {
      const [a, b] = pick(CC.FLAMEWARS);
      S().addFrenzy(15);
      const line = pick(CC.TROLL_LINES).replace('%A', a).replace('%B', b);
      U().log(line, 'system', 'troll<');
      U().notice('⚔️ ' + a + ' contre ' + b + ' : production ×3 pendant 15 s');
      U().render();
    },

    progress() {
      const s = S().s;
      const totoz = S().evaluateTotoz();
      for (const t of totoz) {
        const bonus = Math.max(20, Math.floor(S().cps() * 20));
        this.gain(bonus);
        U().log('[:' + t.name + '] débloqué · +' + S().fmt(bonus) + ' coins', 'system', 'totoz<');
        U().notice('🖼️ Totoz [:' + t.name + '] +' + S().fmt(bonus));
      }
      const achievements = S().evaluateAchievements();
      for (const a of achievements) {
        U().log('🏆 Haut fait : ' + a.name, 'system', 'wmCoinCoin<');
        U().notice('🏆 ' + a.icon + ' ' + a.name);
      }
      if (totoz.length || achievements.length) U().refreshStatic();
    },

    buyBuilding(id) {
      const b = CC.BUILDINGS.find((item) => item.id === id);
      if (!b) return;
      const s = S().s;
      if (b.phantom) {
        s.gcoincoinClicks += 1;
        const excuse = pick(CC.GCOINCOIN_EXCUSES);
        U().log(excuse, 'danger', 'gcoincoin<');
        U().notice('💾 ' + excuse);
        this.progress();
        U().render();
        return;
      }
      const price = S().price(b);
      if (s.coins < price) return;
      s.coins -= price;
      s.owned[b.id] = S().owned(b.id) + 1;
      U().log(
        'Installé : ' + b.name + ' ×' + s.owned[b.id] +
        ' (+' + S().fmtRate(b.cps) + ')', 'system', 'apt<'
      );
      if (s.owned[b.id] === 1) U().notice(b.icon + ' ' + b.name + ' opérationnel !');
      if (b.id === 'souffleuse') {
        if (CC.Audio && CC.Audio.blower) CC.Audio.blower();
        U().notice('🍂 BRRRR ! La souffleuse à feuilles est en marche.');
      }
      if (b.id === 'table-volante') {
        U().notice('🪑 La table volante décolle. Personne ne sait pourquoi.');
      }
      this.progress();
      U().refreshStatic();
      U().render();
      S().save();
    },

    goodieCost(goodie) {
      try {
        const cost = typeof goodie.cost === 'function' ? goodie.cost(S().s) : goodie.cost;
        return Number.isFinite(cost) ? Math.ceil(cost) : Infinity;
      } catch (err) {
        return Infinity;
      }
    },

    goodieAvailable(goodie) {
      if (typeof goodie.locked === 'function' && goodie.locked(S().s)) return false;
      if (goodie.id === 'pycoincoin' &&
          (S().s.pycoincoinLevel || 0) >= CC.PYCOINCOIN_VERSIONS.length) {
        return false;
      }
      if (goodie.repeatable) return true;
      if (S().s.goodies[goodie.id]) return false;
      if (typeof goodie.available === 'function') return goodie.available(S().s);
      return true;
    },

    buyGoodie(id) {
      const goodie = CC.GOODIES.find((item) => item.id === id);
      if (!goodie) return;
      const s = S().s;
      if (!this.goodieAvailable(goodie)) return;
      const cost = this.goodieCost(goodie);
      if (!Number.isFinite(cost) || s.coins < cost) return;
      s.coins -= cost;
      if (goodie.id === 'click') {
        s.powerLevel += 1;
        U().log('Doigt du décideur pressé niveau ' + s.powerLevel, 'system');
      } else if (goodie.id === 'repair') {
        S().addSlip(50);
        U().log('Slip reprisé : parser XML opérationnel.', 'system');
        U().notice('🪡 Slip réparé');
      } else if (goodie.id === 'pycoincoin') {
        const level = s.pycoincoinLevel || 0;
        const version = CC.PYCOINCOIN_VERSIONS[level];
        s.pycoincoinLevel = level + 1;
        s.goodies.pycoincoin = true;
        U().log(
          'pyCoinCoin ' + version.v + ' installé · +' +
          Math.round(version.bonus * 100) + ' % de production.', 'system', 'python<'
        );
        U().notice(
          '🐍 pyCoinCoin ' + version.v + ' · +' +
          Math.round(version.bonus * 100) + ' %'
        );
      } else {
        s.goodies[goodie.id] = true;
        if (goodie.id === 'rust') {
          s.rebuildUntil = now() + 20000;
          U().log('make clean && cargo build --release. Recompilation du bouchot…', 'system', 'rust<');
          U().notice('🦀 Recompilation en cours : production à zéro pendant 20 s.');
        } else {
          U().log('Goodie installé : ' + goodie.name, 'system', 'apt<');
          U().notice(goodie.icon + ' ' + goodie.name + ' installé');
        }
      }
      this.progress();
      U().refreshStatic();
      U().render();
      S().save();
    },

    randomFortune(source) {
      const pool = window.FORTUNES.filter((f) => !source || f.s === source);
      return pool.length ? pick(pool) : null;
    },

    sourceWeights() {
      const weights = {};
      for (const key of Object.keys(CC.SOURCES)) weights[key] = 1;
      for (const b of CC.BUILDINGS) {
        if (b.source) weights[b.source] += S().owned(b.id) * 2;
      }
      return weights;
    },

    pickSource() {
      const weights = this.sourceWeights();
      let total = 0;
      for (const key of Object.keys(weights)) total += weights[key];
      let roll = Math.random() * total;
      for (const key of Object.keys(weights)) {
        roll -= weights[key];
        if (roll <= 0) return key;
      }
      return 'tribune-linuxfr';
    },

    dropFortune() {
      const s = S().s;
      const source = this.pickSource();
      const fortune = this.randomFortune(source);
      if (!fortune) return;
      const beforeAlbum = S().albumBonus();
      const known = s.fortunes.includes(fortune.id);
      if (!known) {
        s.fortunes.push(fortune.id);
        const bonus = Math.max(5, Math.floor(S().cps() * 4));
        this.gain(bonus);
        const author = fortune.a ? ' — ' + fortune.a : '';
        U().log('Friture ' + CC.SOURCES[source].label + ' : ' + fortune.t + author, 'fortune', 'pinnipède<');
        U().notice('📜 Nouvelle fortune ' + CC.SOURCES[source].label + ' +' + S().fmt(bonus));
        const afterAlbum = S().albumBonus();
        if (afterAlbum > beforeAlbum) {
          const reward = Math.max(100, Math.floor(S().cps() * 30));
          this.gain(reward);
          U().log('Album ' + CC.SOURCES[source].label + ' : palier atteint · +' + S().fmt(reward) + ' coins', 'system', 'goodies<');
          U().notice('🏆 Palier de goodies ' + CC.SOURCES[source].label + ' : +' + S().fmt(reward));
        }
      } else {
        const bonus = Math.max(1, Math.floor(S().cps()));
        this.gain(bonus);
        U().log('Fortune déjà en collection : ' + fortune.t.slice(0, 120), '', 'pinnipède<');
      }
      U().refreshStatic();
      this.progress();
    },

    postUrl() {
      const s = S().s;
      if (!s.currentUrl) s.currentUrl = S().randomUrl();
      const entry = s.currentUrl;
      if (s.urlsPosted.includes(entry.url)) {
        s.bloubs += 1;
        s.troll = Math.min(100, s.troll + 12);
        S().addSlip(s.goodies.https ? -1 : -2);
        U().log('BLOUB ! « ' + entry.label + ' » avait déjà été postée. Le bouchot fait des bulles.', 'danger', 'vous<');
        U().notice('💦 BLOUB… URL déjà postée');
        U().bubble();
        CC.Audio.bloub();
      } else {
        s.urlsPosted.push(entry.url);
        const bonus = Math.max(10, Math.floor(S().cps() * 4) + 5);
        this.gain(bonus);
        s.troll = Math.min(100, s.troll + 3);
        U().log('URL postée : ' + entry.label + ' · +' + S().fmt(bonus) + ' coins (PREUMS ?)', 'system', 'vous<');
        U().notice('🔗 URL postée · +' + S().fmt(bonus) + ' coins');
        CC.Audio.pan();
      }
      if (s.troll >= 100) this.frenzy();
      this.progress();
      U().updateUrl();
      U().render();
      S().save();
    },

    shuffleUrl() {
      const current = S().s.currentUrl;
      let next = S().randomUrl();
      for (let i = 0; i < 6 && next === current; i += 1) next = S().randomUrl();
      S().s.currentUrl = next;
      U().updateUrl();
    },

    shootDuck() {
      const s = S().s;
      if (!s.duckUntil || now() > s.duckUntil) return;
      s.duckUntil = 0;
      s.nextDuck = now() + rand(24000, 42000);
      this.duckShown = false;
      U().showDuck(false);
      if (Math.random() < 0.17) {
        this.gain(1);
        U().log('clic-clic… Fusil enrayé. Le canard se moque de vous.', '', 'canard<');
        U().notice('🔫 CLIC-CLIC ! +1 coin, beaucoup de honte');
      } else {
        const bonus = Math.max(25, Math.floor(S().cps() * 5 + 20));
        this.gain(bonus);
        s.duckKills += 1;
        U().log('PAN ! PAN ! +' + S().fmt(bonus) + ' coins', 'system', 'vous<');
        U().notice('🦆 PAN ! PAN ! +' + S().fmt(bonus) + ' coins');
        CC.Audio.quack();
      }
      this.progress();
      U().render();
    },

    petDog() {
      const s = S().s;
      if (!s.dogUntil || now() > s.dogUntil) return;
      s.dogUntil = 0;
      s.nextDog = now() + rand(45000, 80000);
      this.dogShown = false;
      U().showDog(false);
      const bonus = Math.max(10, Math.floor(S().cps() * 3 + 15));
      this.gain(bonus);
      s.dogPets += 1;
      const line = pick(CC.DOG_LINES).replace('%N', S().fmt(bonus));
      U().log(line, 'system', 'Fabien Poutrelle<');
      U().notice('🐕 ' + line);
      this.progress();
      U().render();
    },

    chauveEvent() {
      const s = S().s;
      if (s.goodies.casque) {
        s.nextChauve = now() + rand(120000, 240000);
        return;
      }
      s.chauveEvents += 1;
      s.chauveUntil = now() + 20000;
      s.nextChauve = now() + rand(80000, 140000);
      const longOnes = window.FORTUNES.filter((f) => f.s !== 'informatique' && f.t.length > 150);
      const pavé = longOnes.length ? pick(longOnes) : this.randomFortune('multidesk');
      U().log('Le chauve raconte sa jeunesse (pavé de 14 000 caractères) : ' + (pavé ? pavé.t : 'de mon temps, on moulait en 80 colonnes…'), 'danger', 'le_chauve<');
      U().notice('👴 Le chauve poste. Production ÷2 pendant 20 s. (Casque anti-chauve conseillé.)');
      U().render();
    },

    triggerDuck() {
      const s = S().s;
      if (s.duckUntil) return;
      s.duckUntil = now() + 7500;
      s.nextDuck = now() + rand(26000, 45000);
      this.duckShown = true;
      U().showDuck(true);
      CC.Audio.quack();
      U().log('Un canard traverse la tribune ASCII. Il a l’air content.', '', 'canard<');
    },

    triggerDog() {
      const s = S().s;
      if (s.dogUntil) return;
      s.dogUntil = now() + 9000;
      s.nextDog = now() + rand(55000, 90000);
      this.dogShown = true;
      U().showDog(true);
      U().log('Le toutou de Fabien Poutrelle apparaît. Il remue la queue.', '', 'toutou<');
    },

    botUrl() {
      const s = S().s;
      s.nextBotUrl = now() + rand(40000, 70000);
      const bot = pick(['DaPlopBot', 'Alice', 'le_chauve', 'Fabien Poutrelle', 'gcoincoin']);
      let entry = Math.random() < 0.45 ? s.currentUrl : S().randomUrl();
      if (!entry) entry = S().randomUrl();
      if (s.urlsPosted.includes(entry.url)) {
        U().log('BLOUB (' + bot + ') : « ' + entry.label + ' » déjà postée. Il/elle ne lit décidément pas.', '', bot + '<');
      } else {
        s.urlsPosted.push(entry.url);
        U().log('a posté ' + entry.label + ' (personne ne clique)', '', bot + '<');
        U().updateUrl();
      }
    },

    glitch() {
      const s = S().s;
      s.nextGlitch = now() + rand(26000, 44000);
      const error = pick(CC.ERRORS);
      if (s.goodies.ultime) {
        U().log('Slip ultime : « ' + error + ' » absorbé sans une égratignure.', 'system', 'parser<');
        return;
      }
      let damage = rand(15, 30);
      if (s.goodies.kevlar) damage /= 2;
      if (s.goodies.https) damage /= 2;
      S().addSlip(-damage);
      U().log('SLIP SALE : ' + error + ' · −' + Math.round(damage) + ' %', 'danger', 'parser<');
      if (s.slip <= 0) U().notice('🩲 SLIP TROUÉ ! Production ralentie. Reprisez.');
    },

    tick() {
      const t = now();
      const s = S().s;
      const dt = Math.min(2, Math.max(0, (t - this.lastTick) / 1000));
      this.lastTick = t;

      if (dt > 0) {
        this.gain(S().cps() * dt);
        if (s.goodies.kevlar && s.slip < 100 && !s.goodies.ultime) {
          S().addSlip(dt * 0.11);
        }
        if (s.goodies.ultime && s.slip < 100) S().addSlip(dt * 2);
        if (S().cps() > 0) {
          s.troll = Math.min(100, s.troll + dt * Math.min(0.45, 0.02 + S().cps() * 0.0002));
        }
        if (s.troll >= 100) this.frenzy();
      }

      if (t >= s.nextGlitch) this.glitch();
      if (t >= s.nextChatter) {
        s.nextChatter = t + rand(9000, 20000);
        const line = pick(CC.CHATTER);
        U().log(line.text, '', line.who);
      }
      if (t >= s.nextFortune) {
        s.nextFortune = t + Math.max(8000, 23000 - this.fritureCount() * 400) + rand(0, 8000);
        this.dropFortune();
      }
      if (t >= s.nextDuck) this.triggerDuck();
      if (s.duckUntil && t > s.duckUntil) {
        s.duckUntil = 0;
        if (this.duckShown) {
          this.duckShown = false;
          U().showDuck(false);
        }
      }
      if (t >= s.nextDog) this.triggerDog();
      if (s.dogUntil && t > s.dogUntil) {
        s.dogUntil = 0;
        if (this.dogShown) {
          this.dogShown = false;
          U().showDog(false);
        }
        S().addSlip(-3);
        U().log('Le toutou de Fabien a mangé le backend. −3 % de slip.', '', 'toutou<');
      }
      if (t >= s.nextChauve) this.chauveEvent();
      if (t >= s.nextBotUrl) this.botUrl();

      if (S().owned('souffleuse') > 0) {
        if (!this.nextBlower) this.nextBlower = t + rand(25000, 50000);
        if (t >= this.nextBlower) {
          this.nextBlower = t + rand(45000, 90000);
          if (s.settings.sound) {
            CC.Audio.blower();
            U().log('BRRRR ! La souffleuse à feuilles se met en route. Les feuilles volent.', '', 'souffleuse<');
          }
        }
      } else {
        this.nextBlower = t + 30000;
      }

      if (s.rebuildUntil && t >= s.rebuildUntil) {
        s.rebuildUntil = 0;
        if (s.goodies.rust) {
          U().log('Recompilation terminée : le bouchot tourne en Rust, +400 % de production.', 'system', 'rust<');
          U().notice('🦀 Recompilation terminée : +400 % de production');
        }
      }

      const date = new Date();
      if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 1) {
        const day = date.toDateString();
        if (s.lastPreums !== day) {
          s.lastPreums = day;
          const bonus = Math.max(100, Math.floor(S().cps() * 120));
          this.gain(bonus);
          U().log('00:00:01 — PREUMS ! Premier post du jour · +' + S().fmt(bonus) + ' coins', 'system', 'pinnipède<');
          U().notice('⏱️ 00:00:01 — PREUMS ! +' + S().fmt(bonus) + ' coins');
        }
      }

      this.revealBuildings();

      if (t - this.lastCheck > 1000) {
        this.lastCheck = t;
        this.progress();
      }
      if (t - this.lastSave > 5000) {
        this.lastSave = t;
        S().save();
      }
      U().render();
    },

    fritureCount() {
      let n = 0;
      for (const b of CC.BUILDINGS) if (b.source) n += S().owned(b.id);
      return n;
    },

    rebirth() {
      const next = S().nextVersion();
      if (!next || !S().canRebirth()) return null;
      const result = S().rebirth();
      if (!result) return null;
      U().setVersion();
      U().log(
        'Recompilation du bouchot : wmCoinCoin v' + result.version.v +
        ' · +' + result.gain + ' XP de moule.', 'system', 'wmCoinCoin<'
      );
      U().log(next.note, 'system', 'interface<');
      U().notice('♻️ wmCoinCoin v' + result.version.v + ' · +' + result.gain + ' XP de moule');
      U().refreshStatic();
      U().render();
      S().save();
      return result;
    },
  };

  CC.Engine = Engine;
})(window.CC = window.CC || {});
