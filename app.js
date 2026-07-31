const tg = window.Telegram?.WebApp;
if (tg) tg.ready();

function toRomanNum(n) {
  return ["", "I", "II", "III", "IV", "V", "VI"][n] || String(n);
}

// ===== 6 ГЛАВ =====
const CHAPTERS = [
  { num: 1, name: "Шепчущий Лес", cls: "chapter-1" },
  { num: 2, name: "Затопленные Пещеры", cls: "chapter-2" },
  { num: 3, name: "Руины Забытого Храма", cls: "chapter-3" },
  { num: 4, name: "Ледяные Пустоши Бездны", cls: "chapter-4" },
  { num: 5, name: "Огненные Шахты", cls: "chapter-5" },
  { num: 6, name: "Сердце Бездны", cls: "chapter-6" }
];

// ===== 30 УНИКАЛЬНЫХ ВРАГОВ =====
const MONSTERS_RAW = [
  // Глава 1: Шепчущий Лес
  { chapter: 1, name: "Гоблин-Разведчик", hp: 30, icon: "🧟", xp: 15, gold: 5, atk: 4 },
  { chapter: 1, name: "Лесной Орк", hp: 45, icon: "👹", xp: 25, gold: 10, atk: 7 },
  { chapter: 1, name: "Шаман Тьмы", hp: 65, icon: "🧙‍♂️", xp: 40, gold: 18, atk: 10 },
  { chapter: 1, name: "Пещерный Огр", hp: 95, icon: "🧌", xp: 60, gold: 30, atk: 12 },
  { chapter: 1, name: "Вождь Гоблинов", hp: 150, icon: "👑", xp: 150, gold: 80, atk: 18, isBoss: true },

  // Глава 2: Затопленные Пещеры
  { chapter: 2, name: "Болотный Слизень", hp: 180, icon: "🐌", xp: 90, gold: 45, atk: 14 },
  { chapter: 2, name: "Утопленник", hp: 220, icon: "🧟‍♂️", xp: 110, gold: 55, atk: 17 },
  { chapter: 2, name: "Пещерный Тролль", hp: 270, icon: "👺", xp: 140, gold: 70, atk: 20 },
  { chapter: 2, name: "Ведьма Трясины", hp: 330, icon: "🧙‍♀️", xp: 180, gold: 90, atk: 24 },
  { chapter: 2, name: "Повелитель Трясины", hp: 500, icon: "🐊", xp: 400, gold: 220, atk: 32, isBoss: true },

  // Глава 3: Руины Забытого Храма
  { chapter: 3, name: "Скелет-Страж", hp: 420, icon: "💀", xp: 220, gold: 110, atk: 26 },
  { chapter: 3, name: "Каменный Голем", hp: 500, icon: "🗿", xp: 260, gold: 130, atk: 30 },
  { chapter: 3, name: "Проклятый Жрец", hp: 580, icon: "👻", xp: 300, gold: 150, atk: 34 },
  { chapter: 3, name: "Гаргулья", hp: 660, icon: "🦇", xp: 340, gold: 170, atk: 38 },
  { chapter: 3, name: "Хранитель Храма", hp: 900, icon: "🐉", xp: 650, gold: 350, atk: 46, isBoss: true },

  // Глава 4: Ледяные Пустоши Бездны
  { chapter: 4, name: "Ледяной Дух", hp: 760, icon: "❄️", xp: 380, gold: 190, atk: 42 },
  { chapter: 4, name: "Морозный Волк", hp: 860, icon: "🐺", xp: 420, gold: 210, atk: 46 },
  { chapter: 4, name: "Снежная Ведьма", hp: 960, icon: "🧊", xp: 460, gold: 230, atk: 50 },
  { chapter: 4, name: "Йети Бездны", hp: 1080, icon: "🦣", xp: 510, gold: 260, atk: 55 },
  { chapter: 4, name: "Король Морозного Трона", hp: 1500, icon: "🐻‍❄️", xp: 900, gold: 480, atk: 68, isBoss: true },

  // Глава 5: Огненные Шахты
  { chapter: 5, name: "Саламандра", hp: 1250, icon: "🦎", xp: 560, gold: 290, atk: 60 },
  { chapter: 5, name: "Магма-Голем", hp: 1400, icon: "🌋", xp: 620, gold: 320, atk: 65 },
  { chapter: 5, name: "Кузнец Демонов", hp: 1580, icon: "😈", xp: 690, gold: 360, atk: 70 },
  { chapter: 5, name: "Огненный Элементаль", hp: 1750, icon: "🔥", xp: 760, gold: 400, atk: 76 },
  { chapter: 5, name: "Владыка Пламени", hp: 2200, icon: "🐲", xp: 1300, gold: 700, atk: 92, isBoss: true },

  // Глава 6: Сердце Бездны
  { chapter: 6, name: "Демон Низшего Круга", hp: 1900, icon: "👿", xp: 900, gold: 470, atk: 85 },
  { chapter: 6, name: "Падший Рыцарь", hp: 2100, icon: "🛡️", xp: 980, gold: 510, atk: 90 },
  { chapter: 6, name: "Пожиратель Душ", hp: 2350, icon: "🕷️", xp: 1080, gold: 560, atk: 96 },
  { chapter: 6, name: "Страж Врат Бездны", hp: 2650, icon: "🐙", xp: 1200, gold: 620, atk: 103 },
  { chapter: 6, name: "Повелитель Бездны", hp: 4000, icon: "🔱", xp: 3000, gold: 1800, atk: 130, isBoss: true }
];

const MONSTERS = MONSTERS_RAW.map((m, idx) => ({
  id: idx + 1,
  chapter: m.chapter,
  chapterName: `ГЛАВА ${toRomanNum(m.chapter)}: ${CHAPTERS[m.chapter - 1].name.toUpperCase()}`,
  chapterCls: CHAPTERS[m.chapter - 1].cls,
  name: m.isBoss ? `👑 БОСС: ${m.name}` : m.name,
  baseName: m.name,
  hp: m.hp, maxHp: m.hp,
  icon: m.icon, xp: m.xp, gold: m.gold, atk: m.atk,
  isBoss: !!m.isBoss
}));

// ===== МАГАЗИН =====
const SHOP_ITEMS = {
  weapons: [
    { id: "w1", name: "Железный Меч", damage: 10, price: 0, icon: "🗡️" },
    { id: "w2", name: "Рубиновый Клинок", damage: 25, price: 50, icon: "♦️" },
    { id: "w3", name: "Изумрудный Топор", damage: 60, price: 200, icon: "❇️" },
    { id: "w4", name: "Алмазный Секач", damage: 180, price: 800, icon: "💎" }
  ],
  boots: [
    { id: "b1", name: "Кожаный Доспех", damage: 10, price: 0, icon: "🛡️" },
    { id: "b2", name: "Пластинчатая Броня", damage: 25, price: 50, icon: "⚙️" },
    { id: "b3", name: "Мифриловые Поножи", damage: 60, price: 200, icon: "🌟" },
    { id: "b4", name: "Доспех Бездны", damage: 180, price: 800, icon: "🔱" }
  ]
};

function rarityClass(price) {
  if (price === 0) return "rarity-common";
  if (price <= 50) return "rarity-rare";
  if (price <= 200) return "rarity-epic";
  return "rarity-legendary";
}

// ===== ДОСТИЖЕНИЯ =====
const ACHIEVEMENTS = [
  { id: "a1", name: "Первая Кровь", desc: "Сделай 1 отжимание", icon: "🩸", type: "pushups", target: 1, reward: 10 },
  { id: "a2", name: "Стальные Руки", desc: "Сделай 50 отжиманий", icon: "💪", type: "pushups", target: 50, reward: 30 },
  { id: "a3", name: "Несокрушимый", desc: "Сделай 250 отжиманий", icon: "🦾", type: "pushups", target: 250, reward: 100 },
  { id: "a4", name: "Легенда Отжиманий", desc: "Сделай 1000 отжиманий", icon: "🏋️", type: "pushups", target: 1000, reward: 400 },
  { id: "a5", name: "Первый Присед", desc: "Сделай 1 приседание", icon: "🦵", type: "squats", target: 1, reward: 10 },
  { id: "a6", name: "Железные Ноги", desc: "Сделай 50 приседаний", icon: "🦿", type: "squats", target: 50, reward: 30 },
  { id: "a7", name: "Гранитные Колени", desc: "Сделай 250 приседаний", icon: "🗻", type: "squats", target: 250, reward: 100 },
  { id: "a8", name: "Легенда Приседаний", desc: "Сделай 1000 приседаний", icon: "⛰️", type: "squats", target: 1000, reward: 400 },
  { id: "a9", name: "Победитель Леса", desc: "Пройди Главу I", icon: "🌲", type: "chapter", target: 1, reward: 50 },
  { id: "a10", name: "Покоритель Трясины", desc: "Пройди Главу II", icon: "🐊", type: "chapter", target: 2, reward: 80 },
  { id: "a11", name: "Разрушитель Руин", desc: "Пройди Главу III", icon: "🏛️", type: "chapter", target: 3, reward: 120 },
  { id: "a12", name: "Повелитель Льда", desc: "Пройди Главу IV", icon: "❄️", type: "chapter", target: 4, reward: 180 },
  { id: "a13", name: "Укротитель Пламени", desc: "Пройди Главу V", icon: "🔥", type: "chapter", target: 5, reward: 260 },
  { id: "a14", name: "Спаситель Бездны", desc: "Пройди Главу VI и заверши игру", icon: "🔱", type: "chapter", target: 6, reward: 500 },
  { id: "a15", name: "Коллекционер Клинков", desc: "Собери всё оружие", icon: "🗡️", type: "allWeapons", reward: 150 },
  { id: "a16", name: "Мастер Брони", desc: "Собери всю броню", icon: "🛡️", type: "allBoots", reward: 150 },
  { id: "a17", name: "Золотой Магнат", desc: "Заработай 5000 золота за игру", icon: "💰", type: "totalGold", target: 5000, reward: 200 },
  { id: "a18", name: "Ветеран Боя", desc: "Сделай 500 повторений всего", icon: "⚔️", type: "totalReps", target: 500, reward: 150 }
];

// ===== СОСТОЯНИЕ =====
let gameState = JSON.parse(localStorage.getItem('fit_dark_state')) || {
  monsterIdx: 0,
  playerHp: 100,
  playerMaxHp: 100,
  gold: 0,
  totalGoldEarned: 0,
  xp: 0,
  totalPushups: 0,
  totalSquats: 0,
  equippedWeapon: "w1",
  equippedBoots: "b1",
  inventory: ["w1", "b1"],
  claimedAchievements: [],
  gameCompleted: false
};
// Совместимость со старыми сохранениями
if (gameState.totalGoldEarned === undefined) gameState.totalGoldEarned = gameState.gold || 0;
if (!gameState.claimedAchievements) gameState.claimedAchievements = [];
if (gameState.gameCompleted === undefined) gameState.gameCompleted = false;

let currentMonsterHp = MONSTERS[gameState.monsterIdx]?.hp || MONSTERS[MONSTERS.length - 1].hp;
let currentExercise = 'pushup';
let monsterAttackTimer = null;
let restRegenTimer = null;
window.__arenaActive = false;

function saveState() {
  localStorage.setItem('fit_dark_state', JSON.stringify(gameState));
}

function addGold(amount) {
  gameState.gold += amount;
  if (amount > 0) gameState.totalGoldEarned += amount;
}

// ===== БАННЕРЫ И ТОСТЫ =====
let bannerTimeout = null;
function showBanner(title, subtitle, duration = 2200, variant = '') {
  const el = document.getElementById('event-banner');
  if (!el) return;
  el.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${subtitle}</div><div class="banner-hint">нажмите, чтобы закрыть</div>`;
  el.className = 'banner-overlay show' + (variant ? ' ' + variant : '');
  el.onclick = () => el.classList.remove('show');
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => el.classList.remove('show'), duration);
}

function showToast(text) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = text;
  container.appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

// ===== СТАРТ ИГРЫ =====
document.addEventListener('DOMContentLoaded', () => {
  renderShop();
  renderAchievements();
  updateGameUI();

  const hasProgress = gameState.totalPushups > 0 || gameState.totalSquats > 0 || gameState.monsterIdx > 0;
  if (hasProgress) {
    document.getElementById('health-form').style.display = 'none';
    const panel = document.getElementById('continue-panel');
    panel.style.display = 'block';
    const m = MONSTERS[gameState.monsterIdx] || MONSTERS[MONSTERS.length - 1];
    document.getElementById('continue-info').innerText =
      `Глава ${toRomanNum(m.chapter)} · Уровень ${Math.min(gameState.monsterIdx + 1, MONSTERS.length)}/${MONSTERS.length} · 💎 ${gameState.gold}`;
  }
});

function enterGame() {
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  loadMonster();
  renderShop();
  renderAchievements();
  initCamera();
  showTab('arena');
}

document.getElementById('health-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const level = document.getElementById('fitness-level').value;
  const issues = document.getElementById('health-issues').value;
  localStorage.setItem('fit_dark_settings', JSON.stringify({ fitnessLevel: level, healthIssues: issues }));
  enterGame();
});

document.getElementById('btn-continue').addEventListener('click', enterGame);
document.getElementById('btn-restart-link').addEventListener('click', () => {
  if (confirm('Точно начать заново? Весь прогресс будет удалён безвозвратно.')) {
    localStorage.removeItem('fit_dark_state');
    localStorage.removeItem('fit_dark_settings');
    location.reload();
  }
});

// ===== ТАБЫ / ПАУЗА БОЯ =====
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`nav-${tabName}`).classList.add('active');

  window.__arenaActive = (tabName === 'arena');

  if (tabName === 'arena') {
    stopRestRegen();
    startCombatTimer();
  } else if (tabName === 'camp') {
    stopCombatTimer();
    startRestRegen();
  } else {
    // Лавка / Достижения — бой безопасно на паузе, урона нет
    stopCombatTimer();
    stopRestRegen();
  }
}

function retreatToCamp() {
  if (gameState.gameCompleted) return;
  showTab('camp');
  const m = MONSTERS[gameState.monsterIdx];
  showBanner("🏃 ВЫ ОТСТУПИЛИ", `${m ? m.baseName : 'Тварь'} остаётся в подземелье. Отдохните у костра и возвращайтесь в бой, когда будете готовы.`, 2400, 'banner-chapter');
}

// ===== БОЙ / ТАЙМЕР АТАКИ =====
function stopCombatTimer() {
  if (monsterAttackTimer) { clearInterval(monsterAttackTimer); monsterAttackTimer = null; }
}

function startCombatTimer() {
  stopCombatTimer();
  const monster = MONSTERS[gameState.monsterIdx];
  if (!monster || currentMonsterHp <= 0 || gameState.playerHp <= 0 || gameState.gameCompleted) return;

  monsterAttackTimer = setInterval(() => {
    const m = MONSTERS[gameState.monsterIdx];
    if (!m || currentMonsterHp <= 0 || gameState.playerHp <= 0 || gameState.gameCompleted) return;

    gameState.playerHp = Math.max(0, gameState.playerHp - m.atk);

    const flash = document.getElementById('damage-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 150);
    }

    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');

    updateGameUI();
    saveState();

    if (gameState.playerHp <= 0) {
      stopCombatTimer();
      gameState.playerHp = gameState.playerMaxHp;
      saveState();
      updateGameUI();
      showBanner("💀 ВЫ ПАЛИ В БОЮ", "Раны исцелены у костра в лагере. Соберитесь с силами и возвращайтесь, когда будете готовы.", 3200, 'banner-death');
      showTab('camp');
    }
  }, 6000);
}

// ===== ЛАГЕРЬ / РЕГЕН =====
function stopRestRegen() {
  if (restRegenTimer) { clearInterval(restRegenTimer); restRegenTimer = null; }
}
function startRestRegen() {
  stopRestRegen();
  if (gameState.playerHp >= gameState.playerMaxHp) return;
  restRegenTimer = setInterval(() => {
    if (gameState.playerHp < gameState.playerMaxHp) {
      gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + 4);
      updateGameUI();
      saveState();
      if (gameState.playerHp >= gameState.playerMaxHp) stopRestRegen();
    } else {
      stopRestRegen();
    }
  }, 1500);
}

// ===== МОНСТРЫ =====
function loadMonster() {
  const m = MONSTERS[gameState.monsterIdx];
  if (!m) return;

  currentMonsterHp = m.hp;
  document.getElementById('monster-name').innerText = m.name;
  document.getElementById('monster-sprite').innerText = m.icon;
  document.getElementById('chapter-title').innerText = m.chapterName;
  document.getElementById('chapter-mini').innerText = `ГЛАВА ${toRomanNum(m.chapter)} · ${m.chapter}/6`;

  const arenaBg = document.getElementById('arena-bg');
  arenaBg.className = 'arena-viewport ' + m.chapterCls + (m.isBoss ? ' boss-active' : '');

  const monsterFrame = document.querySelector('.monster-frame');
  if (monsterFrame) monsterFrame.classList.toggle('boss-frame', m.isBoss);

  updateGameUI();
}

function getPushupDamage() {
  return SHOP_ITEMS.weapons.find(w => w.id === gameState.equippedWeapon)?.damage || 10;
}
function getSquatDamage() {
  return SHOP_ITEMS.boots.find(b => b.id === gameState.equippedBoots)?.damage || 10;
}

function switchExercise(type) {
  currentExercise = type;
  document.getElementById('btn-pushup').classList.toggle('active', type === 'pushup');
  document.getElementById('btn-squat').classList.toggle('active', type === 'squat');
  if (window.resetExerciseStage) window.resetExerciseStage();
}

function onRepCompleted(type) {
  if (gameState.gameCompleted) return;
  let dmg = (type === 'pushup') ? getPushupDamage() : getSquatDamage();

  if (type === 'pushup') gameState.totalPushups++;
  if (type === 'squat') gameState.totalSquats++;

  addGold(3);
  currentMonsterHp = Math.max(0, currentMonsterHp - dmg);

  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');

  const sprite = document.getElementById('monster-sprite');
  if (sprite) {
    sprite.classList.add('monster-hit-anim');
    setTimeout(() => sprite.classList.remove('monster-hit-anim'), 220);
  }

  showDamagePopup(`-${dmg} HP`);
  renderAchievements();
  updateGameUI();
  saveState();

  if (currentMonsterHp === 0) {
    onMonsterDefeated();
  }
}

function showDamagePopup(text) {
  const container = document.getElementById('damage-popup-container');
  if (!container) return;
  const popup = document.createElement('div');
  popup.className = 'damage-popup';
  popup.innerText = text;
  container.appendChild(popup);
  setTimeout(() => popup.remove(), 750);
}

function onMonsterDefeated() {
  const defeated = MONSTERS[gameState.monsterIdx];
  addGold(defeated.gold);
  gameState.xp += defeated.xp;
  gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + 35);
  gameState.monsterIdx++;

  renderAchievements();
  saveState();
  updateGameUI();

  showToast(`${defeated.baseName} повержен! +${defeated.gold} 💎 · +${defeated.xp} XP`);

  if (gameState.monsterIdx >= MONSTERS.length) {
    gameState.gameCompleted = true;
    stopCombatTimer();
    saveState();
    updateGameUI();
    setTimeout(() => {
      showBanner("🔱 БЕЗДНА ПОКОРЕНА", "Вы прошли все 30 испытаний Бездны. Легенда о Рыцаре будет жить вечно.", 5000, 'banner-victory');
      showTab('camp');
    }, 1600);
    return;
  }

  const next = MONSTERS[gameState.monsterIdx];
  const chapterChanged = next.chapter !== defeated.chapter;

  setTimeout(() => {
    loadMonster();
    if (window.__arenaActive) startCombatTimer();

    if (chapterChanged) {
      showBanner(`ГЛАВА ${toRomanNum(next.chapter)}`, CHAPTERS[next.chapter - 1].name.toUpperCase(), 2600, 'banner-chapter');
      if (next.isBoss) {
        setTimeout(() => showBanner("⚠️ БОСС ГЛАВЫ ⚠️", next.baseName, 2400, 'banner-boss'), 2700);
      }
    } else if (next.isBoss) {
      showBanner("⚠️ БОСС ГЛАВЫ ⚠️", next.baseName, 2400, 'banner-boss');
    }
  }, 1500);
}

// ===== NEW GAME+ / RESET =====
function newGamePlus() {
  gameState.monsterIdx = 0;
  gameState.playerHp = gameState.playerMaxHp;
  gameState.gameCompleted = false;
  saveState();
  loadMonster();
  updateGameUI();
  renderAchievements();
  showBanner("🔄 НОВАЯ ИГРА+", "Бездна возрождается заново. Ваше снаряжение и трофеи сохранены.", 2600, 'banner-chapter');
  showTab('camp');
}
document.getElementById('btn-new-game-plus').addEventListener('click', newGamePlus);
document.getElementById('btn-full-reset').addEventListener('click', () => {
  if (confirm('Это сотрёт весь прогресс безвозвратно. Продолжить?')) {
    localStorage.removeItem('fit_dark_state');
    localStorage.removeItem('fit_dark_settings');
    location.reload();
  }
});

// ===== UI =====
function updateGameUI() {
  const m = MONSTERS[gameState.monsterIdx];

  if (m) {
    const monsterPct = (currentMonsterHp / m.hp) * 100;
    document.getElementById('monster-hp-fill').style.width = `${monsterPct}%`;
    document.getElementById('monster-hp-text').innerText = `${currentMonsterHp} / ${m.hp} HP`;
  }

  const playerPct = (gameState.playerHp / gameState.playerMaxHp) * 100;
  document.getElementById('player-hp-fill').style.width = `${playerPct}%`;
  document.getElementById('player-hp-text').innerText = `${gameState.playerHp} / ${gameState.playerMaxHp} HP`;

  const campFill = document.getElementById('camp-hp-fill');
  const campText = document.getElementById('camp-hp-text');
  if (campFill) campFill.style.width = `${playerPct}%`;
  if (campText) campText.innerText = `${gameState.playerHp} / ${gameState.playerMaxHp} HP`;

  const lowHp = gameState.playerHp <= gameState.playerMaxHp * 0.3;
  document.getElementById('player-hud-card')?.classList.toggle('low-hp', lowHp);
  document.getElementById('camp-hp-card')?.classList.toggle('low-hp', lowHp);

  document.getElementById('shop-gold').innerText = `${gameState.gold} 💎`;
  document.getElementById('dmg-pushup-val').innerText = getPushupDamage();
  document.getElementById('dmg-squat-val').innerText = getSquatDamage();
  document.getElementById('rep-count').innerText = `💪 ${gameState.totalPushups} | 🦵 ${gameState.totalSquats}`;

  const curChapter = m ? m.chapter : 6;
  const campChapter = document.getElementById('camp-chapter');
  const campLevel = document.getElementById('camp-level');
  const campGold = document.getElementById('camp-gold');
  const campReps = document.getElementById('camp-reps');
  if (campChapter) campChapter.innerText = `${toRomanNum(curChapter)} / VI`;
  if (campLevel) campLevel.innerText = `${Math.min(gameState.monsterIdx + 1, MONSTERS.length)} / ${MONSTERS.length}`;
  if (campGold) campGold.innerText = `${gameState.gold} 💎`;
  if (campReps) campReps.innerText = `${gameState.totalPushups + gameState.totalSquats}`;

  const victoryPanel = document.getElementById('camp-victory-panel');
  if (victoryPanel) victoryPanel.style.display = gameState.gameCompleted ? 'block' : 'none';
  const returnBtn = document.getElementById('btn-return-battle');
  if (returnBtn) returnBtn.style.display = gameState.gameCompleted ? 'none' : 'block';
}

function renderShop() {
  const renderList = (items, containerId, equippedId, type) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map(item => `
      <div class="shop-item ${equippedId === item.id ? 'equipped' : ''} ${rarityClass(item.price)}">
        <div class="shop-item-info">
          <div class="icon-frame shop-icon-frame">${item.icon}</div>
          <div>
            <strong>${item.name}</strong><br>
            <small style="color: #2ecc71;">Урон: +${item.damage}</small>
          </div>
        </div>
        <button class="btn-buy" onclick="buyItem('${item.id}', '${type}', ${item.price})"
          ${equippedId === item.id ? 'disabled' : ''}>
          ${gameState.inventory.includes(item.id) ? 'Экипировать' : item.price + ' 💎'}
        </button>
      </div>
    `).join('');
  };

  renderList(SHOP_ITEMS.weapons, 'weapons-list', gameState.equippedWeapon, 'weapon');
  renderList(SHOP_ITEMS.boots, 'boots-list', gameState.equippedBoots, 'boot');
}

function evalAchievement(ach) {
  let current = 0, target = ach.target || 1, unlocked = false;
  switch (ach.type) {
    case 'pushups': current = gameState.totalPushups; unlocked = current >= target; break;
    case 'squats': current = gameState.totalSquats; unlocked = current >= target; break;
    case 'chapter': current = Math.floor(gameState.monsterIdx / 5); unlocked = current >= target; break;
    case 'allWeapons': current = SHOP_ITEMS.weapons.every(w => gameState.inventory.includes(w.id)) ? 1 : 0; target = 1; unlocked = current === 1; break;
    case 'allBoots': current = SHOP_ITEMS.boots.every(b => gameState.inventory.includes(b.id)) ? 1 : 0; target = 1; unlocked = current === 1; break;
    case 'totalGold': current = gameState.totalGoldEarned; unlocked = current >= target; break;
    case 'totalReps': current = gameState.totalPushups + gameState.totalSquats; unlocked = current >= target; break;
  }
  return { current, target, unlocked };
}

function renderAchievements() {
  const container = document.getElementById('achievements-list');
  if (!container) return;

  container.innerHTML = ACHIEVEMENTS.map(ach => {
    const { current, target, unlocked } = evalAchievement(ach);
    const claimed = gameState.claimedAchievements.includes(ach.id);
    const pct = Math.min(100, Math.round((current / target) * 100));

    return `
      <div class="achieve-card ${unlocked ? 'unlocked' : ''} ${claimed ? 'claimed' : ''}">
        <div class="icon-frame shop-icon-frame" style="margin:0 auto;">${ach.icon}</div>
        <strong style="font-size: 12px; color: ${unlocked ? '#c9a050' : '#666'};">${ach.name}</strong>
        <small style="font-size: 10px; color: #888;">${ach.desc}</small>
        <div class="ach-progress"><div class="ach-progress-fill" style="width:${pct}%;"></div></div>
        <small class="ach-progress-text">${Math.min(current, target)} / ${target}</small>
        ${unlocked
          ? (claimed
              ? `<span class="ach-claimed-label">✓ Получено</span>`
              : `<button class="btn-claim" onclick="claimAchievement('${ach.id}')">Забрать +${ach.reward}💎</button>`)
          : ''}
      </div>
    `;
  }).join('');
}

function claimAchievement(id) {
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return;
  const { unlocked } = evalAchievement(ach);
  if (!unlocked || gameState.claimedAchievements.includes(id)) return;

  gameState.claimedAchievements.push(id);
  addGold(ach.reward);
  saveState();
  updateGameUI();
  renderAchievements();
  showToast(`🏆 ${ach.name} · +${ach.reward} 💎`);
}

function buyItem(id, type, price) {
  if (!gameState.inventory.includes(id)) {
    if (gameState.gold < price) return alert("Недостаточно руды/золота!");
    gameState.gold -= price;
    gameState.inventory.push(id);
  }
  if (type === 'weapon') gameState.equippedWeapon = id;
  if (type === 'boot') gameState.equippedBoots = id;
  saveState();
  renderShop();
  renderAchievements();
  updateGameUI();
}
