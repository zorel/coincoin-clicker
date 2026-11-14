/* Lore, buildings, goodies, totoz, trolls and chatter.
   Loaded after js/fortunes.js, before the state/engine/ui modules. */
(function (CC) {
  'use strict';

  CC.SOURCES = {
    informatique: { label: '@informatique', short: 'informatique', icon: '🧠' },
    multidesk: { label: '@multidesk', short: 'multidesk', icon: '💿' },
    'tribune-linuxfr': { label: '@tribune-linuxfr', short: 'tribune', icon: '💬' },
  };

  // Version ladder based on the real wmCoinCoin history, capped at the
  // latest upstream version (2.6.5). Never invent a 2.6.6 or a 3.0.
  CC.VERSIONS = [
    { v: '0.1', title: 'alpha textuelle', need: 0, note: 'Fenêtre brute. Aucune fioriture, comme en 2001.' },
    { v: '1.0', title: 'la 1.0', need: 1500, note: 'Barre de titre et diodes du dock Window Maker.' },
    { v: '2.0', title: 'compatibilité KDE', need: 8000, note: 'Panneaux, couleurs et sections lisibles.' },
    { v: '2.1beta', title: 'troll-o-scope', need: 40000, note: 'Le troll-o-scope couleur multiprecision arrive.' },
    { v: '2.2beta', title: 'sans libwraster', need: 180000, note: 'Ombres, diodes et applet allégée.' },
    { v: '2.3.5', title: 'nhorloges', need: 800000, note: 'Dégradés, mise en page stable, interface qui respire.' },
    { v: '2.4.2a', title: 'balltrap', need: 3500000, note: 'Transitions douces. Les canards tremblent.' },
    { v: '2.5.0-a', title: 'XMLCoinCoin', need: 15000000, note: 'Cartes de friture, typographie et parser respectable.' },
    { v: '2.5.1-a', title: 'antibloub', need: 70000000, note: 'Antibloub : le palmipède signale les URLs déjà postées.' },
    { v: '2.6.0', title: 'UTF-8', need: 350000000, note: 'Gouttières, respiration, finition premium.' },
    { v: '2.6.1', title: 'la version Debian', need: 1800000000, note: 'Version réelle packagée. Presque gcoincoin.' },
    { v: '2.6.5', title: 'dernière version réelle', need: 9000000000, note: 'Tout est poli. gcoincoin reste introuvable.' },
  ];

  // Prices and base CPS are derived from Cookie Clicker's own balance curves
  // (main.js v2.058): first 13 real tiers (Cursor → Antimatter Condenser),
  // plus the gcoincoin phantom. Copy price increase is 1.15.
  // CPS values are halved on top, as requested.
  CC.BUILDINGS = [
    {
      id: 'moule', icon: '🦪', name: 'Moule bénévole', cost: 15, cps: 0.05,
      desc: 'Une moule qui moule en silence depuis 2001.',
    },
    {
      id: 'refresh', icon: '↻', name: 'Refresh compulsif', cost: 100, cps: 0.5,
      desc: '500 rafraîchissements par jour. Le backend vous remercie.',
    },
    {
      id: 'pinnipede', icon: '📟', name: 'Pinnipède téléscripteur', cost: 1100, cps: 4,
      desc: 'Lit la tribune à votre place, avec un slip propre.',
    },
    {
      id: 'friture-info', icon: '🧠', name: 'Friture @informatique', cost: 12000, cps: 23.5,
      desc: 'Des citations, des trolls et des divisions de processeur.',
      source: 'informatique',
    },
    {
      id: 'daplopbot', icon: '🤖', name: 'DaPlopBot', cost: 130000, cps: 130,
      desc: 'Plop. Plop. Plop. Il ne sait dire que ça, mais il le dit vite.',
    },
    {
      id: 'friture-multidesk', icon: '💿', name: 'Friture @multidesk', cost: 1400000, cps: 700,
      desc: 'Jayce a promis de livrer. En attendant, ça produit.',
      source: 'multidesk',
    },
    {
      id: 'totoz', icon: '🖼️', name: 'Usine à Totoz', cost: 20000000, cps: 3900,
      desc: '[:totoz] [:aloy] [:haha] — la friture à images.',
    },
    {
      id: 'alice', icon: '👩‍💻', name: 'Alice la bot', cost: 330000000, cps: 22000,
      desc: "Elle ne comprend pas, mais elle poste. Parfois l'URL en double.",
    },
    {
      id: 'friture-tribune', icon: '💬', name: 'Friture @tribune-linuxfr', cost: 5100000000, cps: 130000,
      desc: '308 fortunes, 0 modération, 100 % de mauvaise foi.',
      source: 'tribune-linuxfr',
    },
    {
      id: 'bouchot', icon: '🕸️', name: 'Bouchot multi-tribune', cost: 75000000000, cps: 800000,
      desc: 'Des moules partout. Beaucoup. Même sur IRC.',
    },
    {
      id: 'chenil', icon: '🐕', name: 'Chenil de Fabien Poutrelle', cost: 1000000000000, cps: 5000000,
      desc: 'Le créateur de la tribune aime les chiens. Beaucoup. Trop ?',
    },
    {
      id: 'souffleuse', icon: '🍂', name: 'Souffleuse à feuilles', cost: 14000000000000, cps: 32500000,
      desc: 'Ça fait du bruit. Les feuilles et les moules décollent.',
    },
    {
      id: 'table-volante', icon: '🪑', name: 'Table volante', cost: 170000000000000, cps: 215000000,
      desc: 'Une table qui vole. On ne pose rien dessus, surtout pas le backend.',
    },
    {
      id: 'gcoincoin', icon: '💾', name: 'gcoincoin 0.1', cost: Infinity, cps: 0,
      desc: 'Annoncé. Maintenant. Depuis 2003. Toujours pas sorti.',
      phantom: true, unlockAt: 6000000,
    },
  ];

  CC.PYCOINCOIN_VERSIONS = [
    { v: '0.2', bonus: 0.02, cost: 5000 },
    { v: '0.3', bonus: 0.03, cost: 15000 },
    { v: '0.4', bonus: 0.04, cost: 45000 },
    { v: '0.5', bonus: 0.05, cost: 120000 },
    { v: '0.6', bonus: 0.06, cost: 300000 },
    { v: '0.6f', bonus: 0.07, cost: 750000 },
    { v: '0.7.17', bonus: 0.10, cost: 1800000 },
  ];

  CC.GOODIES = [
    {
      id: 'click', icon: '☝️', name: 'Muscler le clic', repeatable: true,
      cost: (s) => Math.ceil(20 * Math.pow(2.15, s.powerLevel)),
      desc: () => '+1 coin de base par clic (échelle ×0,5). Le doigt du décideur pressé.',
    },
    {
      id: 'repair', icon: '🪡', name: 'Repriser le slip', cost: () => 20,
      desc: () => 'Rend 50 % de slip. Le parser XML vous dit merci.',
      available: (s) => s.slip < 99.9,
    },
    {
      id: 'kevlar', icon: '🛡️', name: 'Slip en kevlar', cost: () => 180,
      desc: () => 'Divise par deux les dégâts des balises non fermées.',
      available: (s) => !s.goodies.kevlar,
    },
    {
      id: 'ultime', icon: '✨', name: 'Slip ultime', cost: () => 50000,
      desc: () => 'Indestructible. Même <marquee><blink> ne peut plus rien.',
      available: (s) => !s.goodies.ultime,
      locked: (s) => s.rebirths < 2,
    },
    {
      id: 'casque', icon: '🎧', name: 'Casque anti-chauve', cost: () => 2500,
      desc: () => 'Met le chauve en sourdine. Sa jeunesse reste à 14 000 caractères.',
      available: (s) => !s.goodies.casque,
    },
    {
      id: 'pycoincoin', icon: '🐍', repeatable: true,
      name: (s) => {
        const level = Math.min(s.pycoincoinLevel || 0, CC.PYCOINCOIN_VERSIONS.length);
        const version = CC.PYCOINCOIN_VERSIONS[Math.max(0, level - 1)];
        return 'pyCoinCoin ' + version.v;
      },
      cost: (s) => {
        const level = Math.min(s.pycoincoinLevel || 0, CC.PYCOINCOIN_VERSIONS.length);
        return level < CC.PYCOINCOIN_VERSIONS.length
          ? CC.PYCOINCOIN_VERSIONS[level].cost : Infinity;
      },
      desc: (s) => {
        const level = Math.min(s.pycoincoinLevel || 0, CC.PYCOINCOIN_VERSIONS.length);
        const current = level ? CC.PYCOINCOIN_VERSIONS[level - 1] : null;
        const next = level < CC.PYCOINCOIN_VERSIONS.length
          ? CC.PYCOINCOIN_VERSIONS[level] : null;
        const cur = current
          ? 'Version ' + current.v + ' · +' + Math.round(current.bonus * 100) + ' %.' : '';
        const nxt = next
          ? ' Prochaine : ' + next.v + ' · +' + Math.round(next.bonus * 100) + ' %.'
          : ' Version finale atteinte.';
        return (cur + nxt + ' Compatible Python 2.3, à peu près.').trim();
      },
      available: (s) => (s.pycoincoinLevel || 0) < CC.PYCOINCOIN_VERSIONS.length,
    },
    {
      id: 'quteqoin', icon: '🐧', name: 'quteqoin', cost: () => 25000,
      desc: () => '+8 % de production. Une interface Qt pour mouler avec classe.',
      available: (s) => !s.goodies.quteqoin,
    },
    {
      id: 'rails', icon: '💎', name: 'LinuxFR en Ruby on Rails', cost: () => 250000,
      desc: () => '+12 % de production. Migrations, ORM, assets : la tribune est moderne.',
      available: (s) => !s.goodies.rails,
    },
    {
      id: 'https', icon: '🔒', name: 'HTTPS sur la tribune', cost: () => 400000,
      desc: () => 'Cadenas vert : dégâts de slip ÷2 et bloub moins douloureux.',
      available: (s) => !s.goodies.https,
    },
    {
      id: 'pull', icon: '👕', name: 'Pull « Je bande pour Emacs »', cost: () => 12000,
      desc: () => '+10 % de production. Le service, pas les sources.',
      available: (s) => !s.goodies.pull,
    },
    {
      id: 'mug', icon: '☕', name: 'Mug « Mandrake-gouin »', cost: () => 45000,
      desc: () => '+10 % de production. Contient du café et de la mauvaise foi.',
      available: (s) => !s.goodies.mug,
    },
    {
      id: 'sticker', icon: '🏷️', name: 'Autocollant totóz', cost: () => 150000,
      desc: () => '+15 % de production. Colle au slip.',
      available: (s) => !s.goodies.sticker,
    },
    {
      id: 'coincoin-ultime', icon: '👑', name: 'coincoin ultime', cost: () => 750000,
      desc: () => '+20 % de production. Le client mythique, pas encore gcoincoin.',
      available: (s) => !s.goodies['coincoin-ultime'],
      locked: (s) => s.rebirths < 6,
    },
    {
      id: 'rust', icon: '🦀', name: 'Réécrire le bouchot en Rust', cost: () => 2000000,
      desc: () => '+400 % de production après 20 s de recompilation. Promis.',
      available: (s) => !s.goodies.rust,
      locked: (s) => s.rebirths < 8,
    },
  ];

  CC.TOTOZ = [
    { name: 'totoz', emoji: '👀', desc: 'Le regard qui juge ton slip.', check: (s) => s.clicks >= 8 },
    { name: 'aloy', emoji: '😆', desc: 'Rire de friture.', check: (s) => s.clicks >= 25 },
    { name: 'haha', emoji: '😂', desc: 'Rire de tribune.', check: (s) => s.clicks >= 60 },
    { name: 'mpk', emoji: '🤪', desc: 'Mauvais goût assumé.', check: (s) => s.clicks >= 120 },
    { name: 'kizmir', emoji: '🐸', desc: 'Grenouille de service.', check: (s) => s.clicks >= 220 },
    { name: 'coincoin', emoji: '🦆', desc: 'Le vrai canard.', check: (s) => s.clicks >= 400 },
    { name: 'preums', emoji: '⏱️', desc: '00:00:01, premier post.', check: (s) => s.duckKills >= 3 },
    { name: 'plop', emoji: '🫧', desc: 'DaPlopBot approuve.', check: (s) => s.owned.daplopbot > 0 },
    { name: 'bloub', emoji: '💦', desc: 'URL déjà postée.', check: (s) => s.bloubs >= 1 },
    { name: 'chauve', emoji: '👴', desc: 'Très vieux, très lourd.', check: (s) => s.chauveEvents >= 1 },
    { name: 'toutou', emoji: '🐕', desc: 'Le chien de Fabien.', check: (s) => s.dogPets >= 1 },
    { name: 'gcoincoin', emoji: '💾', desc: 'Annoncé, jamais sorti.', check: (s) => s.gcoincoinClicks >= 5 },
    { name: 'moule', emoji: '🦪', desc: 'La revanche des moules.', check: (s) => s.owned.moule >= 10 },
    { name: 'troll', emoji: '🔥', desc: 'Troll-o-scope certifié.', check: (s) => s.trolls >= 10 },
  ];

  CC.FLAMEWARS = [
    ['Emacs', 'vi'], ['Debian', 'Mandrake'], ['le C', 'le Pascal'],
    ['GNOME', 'KDE'], ['Slackware', 'Red Hat'], ['BSD', 'Linux'],
    ['Rust', 'tout le monde'], ['PHP', 'la dignité'], ['les tabulations', 'les espaces'],
    ['Window Maker', 'AfterStep'], ['Python 2', 'Python 3'], ['systemd', 'les init scripts'],
  ];

  CC.TROLL_LINES = [
    'Troll-o-mètre critique : %A contre %B. Production ×3 pendant 15 s.',
    'FLAME ! %A contre %B. Le bouchot prend feu, ×3 pendant 15 s.',
    'Guerre sainte : %A contre %B. Les moules produisent ×3 pendant 15 s.',
  ];

  CC.CHATTER = [
    { who: 'moule<', text: "C'est vendredi, on moule." },
    { who: 'moule_du_fond<', text: '42.' },
    { who: 'root<', text: 'Le backend fonctionne. Ne touchez à rien.' },
    { who: 'troll<', text: 'vi est évidemment supérieur à Emacs.' },
    { who: 'autre_moule<', text: 'Objection : Emacs est un système d’exploitation.' },
    { who: 'DaPlopBot<', text: 'plop.' },
    { who: 'DaPlopBot<', text: 'Plop ! Plop ! Plop !' },
    { who: 'DaPlopBot<', text: 'plop (réponse automatique)' },
    { who: 'Alice<', text: 'Alice ne comprend pas.' },
    { who: 'Alice<', text: 'Alice a déjà posté cette URL. BLOUB.' },
    { who: 'Alice<', text: "Alice : ceci n'est pas une réponse." },
    { who: 'gcoincoin<', text: 'gcoincoin 0.1 sort demain. Promis.' },
    { who: 'gcoincoin<', text: 'La sortie de gcoincoin est reportée à dans deux semaines.' },
    { who: 'gcoincoin<', text: 'gcoincoin : recompilation en cours depuis 2003.' },
    { who: 'le_chauve<', text: 'De mon temps, on moulait en 80 colonnes et on aimait ça.' },
    { who: 'le_chauve<', text: 'Je corrige la grammaire de la tribune depuis 1998. Ça avance.' },
    { who: 'Fabien Poutrelle<', text: 'Le chien dit bonjour. C’est tout.' },
    { who: 'Fabien Poutrelle<', text: 'Encore une photo de toutou dans les news.' },
    { who: 'toutou<', text: 'woof.' },
    { who: 'canard<', text: 'PAN ! PAN !' },
    { who: 'canard<', text: 'clic-clic…' },
    { who: 'pinnipède<', text: '00:00:01 — PREUMS.' },
    { who: 'pinnipède<', text: 'Les nhorloges sont réglées sur 00:00:01. Ne me demandez pas comment.' },
    { who: 'root<', text: 'Ne touchez pas aux nhorloges, elles sont purement décoratives.' },
    { who: 'brouteur<', text: "C'est pas un bug, c'est une friture." },
    { who: 'troll<', text: 'On réécrit coincoin en Pascal ou en Rust ?' },
    { who: 'le_chauve<', text: 'La jeunesse, c’était mieux. Surtout la mienne.' },
    { who: 'stagiaire<', text: '[:totoz]' },
    { who: 'autre_moule<', text: 'Mandrake > Debian. Change my mind.' },
    { who: 'root<', text: 'Ne relancez pas make. Sérieusement.' },
    { who: 'moule<', text: 'Quelqu’un a un miroir pour gcoincoin ?' },
    { who: 'troll<', text: 'Windows, ça plante. Linux, ça compile. Balances.' },
    { who: 'root<', text: 'LinuxFR est passé sous Rails. Les migrations sont dans le slip.' },
    { who: 'pinnipède<', text: 'HTTPS activé : le cadenas est vert, le slip est sauvé.' },
    { who: 'souffleuse<', text: 'BRRRRRR… (la souffleuse à feuilles est en marche)' },
    { who: 'table-volante<', text: 'La table vole. Elle ne rendra pas le backend.' },
  ];

  // Hidden for now: the fortune-author game is too easy.
  CC.WTM_ENABLED = false;
  CC.WTM_FALLBACK = ['moule_du_fond', 'root', 'troll', 'le_chauve', 'DaPlopBot', 'Alice'];

  CC.DOG_LINES = [
    'Le toutou de Fabien Poutrelle remue la queue. +%N coins.',
    'Bon toutou. Le chien de Fabien a mangé un backend. +%N coins.',
    'Le chien rapporte une moule. Fabien est fier. +%N coins.',
    'Woof. Le créateur de la tribune approuve. +%N coins.',
  ];

  CC.URLS = [
    { url: 'https://linuxfr.org/', label: 'linuxfr.org' },
    { url: 'https://totoz.eu/', label: 'totoz.eu' },
    { url: 'http://hules.free.fr/', label: 'hules.free.fr' },
    { url: 'https://github.com/seeschloss/wmcoincoin', label: 'wmcoincoin (GitHub)' },
    { url: 'https://web.archive.org/web/20070204022730/http://chrisix.free.fr/pycoincoin/index_old.html', label: 'pyCoinCoin (archive)' },
    { url: 'https://qa.debian.org/cgi-bin/watch?pkg=wmcoincoin', label: 'pkg wmcoincoin (Debian)' },
    { url: 'http://hules.free.fr/wmcoincoin/wmcoincoin.html', label: 'la maison du canard' },
    { url: 'https://linuxfr.org/board/', label: 'la tribune libre' },
    { url: 'https://totoz.eu/coincoin.gif', label: '[:coincoin]' },
    { url: 'https://totoz.eu/aloy.gif', label: '[:aloy]' },
    { url: 'https://totoz.eu/moules.gif', label: '[:moules]' },
    { url: 'ftp://127.0.0.1/divx', label: 'ftp://127.0.0.1/divx' },
    { url: 'http://www.lame.org/images/alan2.jpg', label: 'alan2.jpg' },
    { url: 'http://merguez.com', label: 'merguez.com' },
    { url: 'https://gcoincoin.example/', label: 'gcoincoin (bientôt)' },
    { url: 'https://fr.wikipedia.org/wiki/Moule', label: 'Moule (Wikipédia)' },
  ];

  CC.GCOINCOIN_EXCUSES = [
    'gcoincoin 0.1 sort demain. Promis.',
    'Il manque juste le backend. Et le frontend. Et l’auteur.',
    'La compilation est à 99 %. Depuis 2003.',
    'gcoincoin sera livré avec la 2.7. Patience.',
    'Le binaire est prêt, il attend juste un slip propre.',
    'Une moule a mangé l’archive. On recommence.',
    'Annoncé sur la tribune. Donc officiellement presque sorti.',
    'gcoincoin ne sortira pas avant la fin de ce troll.',
  ];

  CC.ERRORS = [
    '<marquee><blink> CATASTROPHE',
    '</font><div',
    'Erreur XML : entité &nbsp; non définie',
    '<b><i>balise non fermée',
    'Warning: Cannot modify header information',
    "<table><tr><td>Word 97</td></tr></table>",
    'unexpected end of file while parsing slip.xml',
    'fatal error: all your base are belong to XML',
  ];

  CC.ACHIEVEMENTS = [
    { id: 'first-click', icon: '🔴', name: 'Le gros bouton rouge', check: (s) => s.clicks >= 1 },
    { id: 'manual-ddos', icon: '🖱️', name: 'Manual DDoS', check: (s) => s.clicks >= 100 },
    { id: 'answer', icon: '🧮', name: 'La réponse : 42', check: (s) => s.lifetime >= 42 },
    { id: 'buy-first', icon: '🦪', name: 'Mytiliculture intensive', check: (s) => Object.values(s.owned).some((n) => n > 0) },
    { id: 'ten-buildings', icon: '🏭', name: 'Friture industrielle', check: (s) => Object.values(s.owned).reduce((a, b) => a + b, 0) >= 10 },
    { id: 'first-bloub', icon: '💦', name: 'BLOUB.', check: (s) => s.bloubs >= 1 },
    { id: 'ten-bloub', icon: '🌊', name: 'Récidiviste du bloub', check: (s) => s.bloubs >= 10 },
    { id: 'first-duck', icon: '🦆', name: 'PAN ! PAN !', check: (s) => s.duckKills >= 1 },
    { id: 'duck-ten', icon: '🔫', name: 'Chasseur de canards', check: (s) => s.duckKills >= 10 },
    { id: 'dog', icon: '🐕', name: 'Bon toutou', check: (s) => s.dogPets >= 1 },
    { id: 'dog-ten', icon: '🦴', name: 'Ami des chiens de Fabien', check: (s) => s.dogPets >= 10 },
    { id: 'chauve-muted', icon: '🎧', name: 'Le chauve en sourdine', check: (s) => !!s.goodies.casque },
    { id: 'gcoincoin', icon: '💾', name: 'gcoincoin, bientôt', check: (s) => s.gcoincoinClicks >= 5 },
    { id: 'rust', icon: '🦀', name: 'Réécrit en Rust', check: (s) => !!s.goodies.rust },
    { id: 'first-rebirth', icon: '♻️', name: 'XP de moule', check: (s) => s.rebirths >= 1 },
    { id: 'final-version', icon: '🏁', name: 'Dernière version réelle', check: (s) => s.rebirths >= CC.VERSIONS.length - 1 },
    { id: 'fortunes-25', icon: '📜', name: 'Petit friture', check: (s) => s.fortunes.length >= 25 },
    { id: 'fortunes-100', icon: '📚', name: 'Archiviste du bouchot', check: (s) => s.fortunes.length >= 100 },
    { id: 'fortunes-all', icon: '🗃️', name: 'Les 308 fortunes', check: (s) => s.fortunes.length >= (window.FORTUNES ? window.FORTUNES.length : 308) },
    { id: 'troll-ten', icon: '🔥', name: 'Troll-o-scope certifié', check: (s) => s.trolls >= 10 },
    { id: 'totoz-all', icon: '🖼️', name: 'Collectionneur de totoz', check: (s) => s.totoz.length >= CC.TOTOZ.length },
    { id: 'slip-zero', icon: '🩲', name: 'Slip troué', check: (s) => s.slip <= 0 },
    { id: 'rails', icon: '💎', name: 'Rails migration', check: (s) => !!s.goodies.rails },
    { id: 'https', icon: '🔒', name: 'Cadenas vert', check: (s) => !!s.goodies.https },
    { id: 'souffleuse', icon: '🍂', name: 'BRRRR', check: (s) => (s.owned.souffleuse || 0) > 0 },
    { id: 'table-volante', icon: '🪑', name: 'Meuble volant', check: (s) => (s.owned['table-volante'] || 0) > 0 },
    { id: 'wtm-first', icon: '🕵️', name: 'WhatTheMoule', wtm: true, check: (s) => (s.wtmWins || 0) >= 1 },
    { id: 'wtm-ten', icon: '🕵️‍♀️', name: 'Moule détective', wtm: true, check: (s) => (s.wtmWins || 0) >= 10 },
    { id: 'wtm-streak', icon: '🎯', name: 'Série de moules', wtm: true, check: (s) => (s.wtmBest || 0) >= 5 },
  ];

  CC.FORTUNE_TIERS = {};
  if (window.FORTUNES) {
    const counts = {};
    for (const f of window.FORTUNES) counts[f.s] = (counts[f.s] || 0) + 1;
    for (const key of Object.keys(CC.SOURCES)) {
      const total = counts[key] || 0;
      CC.FORTUNE_TIERS[key] = [
        { n: Math.max(1, Math.ceil(total * 0.25)), bonus: 0.05 },
        { n: Math.max(1, Math.ceil(total * 0.5)), bonus: 0.10 },
        { n: total, bonus: 0.20 },
      ];
    }
  }
})(window.CC = window.CC || {});
