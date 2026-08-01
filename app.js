const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// Защита экрана от выключения
let wakeLock = null;
async function requestWakeLock() { try { if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); } } catch (err) {} }

// Логика переключения видимости
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') requestWakeLock();
  
  if (document.visibilityState === 'visible') {
    if (window.__arenaActive && typeof restartCamera === 'function') {
      // Даем браузеру 500мс, чтобы полностью "проснуться" после блокировки
      setTimeout(restartCamera, 500);
    }
  } else {
    if (typeof stopCamera === 'function') stopCamera();
  }
});

function toRomanNum(n) { return ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || String(n); }

const CHAPTERS = [
  { num: 1, name: "Шепчущий Лес", cls: "chapter-1" }, { num: 2, name: "Затопленные Пещеры", cls: "chapter-2" },
  { num: 3, name: "Руины Храма", cls: "chapter-3" }, { num: 4, name: "Ледяные Пустоши", cls: "chapter-4" },
  { num: 5, name: "Огненные Шахты", cls: "chapter-5" }, { num: 6, name: "Сердце Бездны", cls: "chapter-6" },
  { num: 7, name: "Царство Пустоты", cls: "chapter-7" }, { num: 8, name: "Кладбище Богов", cls: "chapter-8" },
  { num: 9, name: "Измерение Хаоса", cls: "chapter-9" }, { num: 10, name: "Конец Времен", cls: "chapter-10" }
];

const MONSTERS_RAW = [];
const baseHp = [30, 200, 800, 2500, 8000, 25000, 80000, 250000, 1000000, 5000000];
const baseGold = [5, 20, 80, 250, 800, 2500, 8000, 25000, 100000, 500000];
const icons = [
  ["🧟", "👹", "🧙‍♂️", "🧌", "👑"], ["🐌", "🧟‍♂️", "👺", "🧙‍♀️", "🐊"], ["💀", "🗿", "👻", "🦇", "🐉"],
  ["❄️", "🐺", "🧊", "🦣", "🐻‍❄️"], ["🦎", "🌋", "😈", "🔥", "🐲"], ["👿", "🛡️", "🕷️", "🐙", "🔱"],
  ["👁️", "🌌", "🌑", "💫", "🕳️"], ["🪦", "🧟‍♀️", "🧛‍♂️", "🧟", "☠️"], ["🌪️", "⚡️", "☄️", "💥", "👹"],
  ["⏳", "👁️‍🗨️", "🧿", "💠", "♾️"]
];
const names = [
  ["Гоблин", "Орк", "Шаман", "Огр", "Вождь"], ["Слизень", "Утопленник", "Тролль", "Ведьма", "Владыка"],
  ["Скелет", "Голем", "Жрец", "Гаргулья", "Хранитель"], ["Дух", "Волк", "Колдунья", "Йети", "Король"],
  ["Саламандра", "Магма", "Кузнец", "Элементаль", "Дракон"], ["Демон", "Рыцарь", "Пожиратель", "Страж", "Повелитель"],
  ["Слепец", "Сущность", "Тень", "Искра", "Аватар Пустоты"], ["Упырь", "Банши", "Вампир", "Лич", "Смерть"],
  ["Вихрь", "Искра", "Метеор", "Взрыв", "Лорд Хаоса"], ["Миг", "Исказитель", "Око", "Творец", "Абсолют"]
];

for(let i=0; i<10; i++) {
  for(let j=0; j<5; j++) {
    const isBoss = (j === 4); const multiplier = 1 + (j * 0.5) + (isBoss ? 2 : 0);
    MONSTERS_RAW.push({
      chapter: i+1, name: names[i][j], hp: Math.floor(baseHp[i] * multiplier),
      icon: icons[i][j], gold: Math.floor(baseGold[i] * multiplier), atk: Math.floor((baseHp[i]/10)*multiplier), isBoss
    });
  }
}
const MONSTERS = MONSTERS_RAW.map((m, idx) => ({
  id: idx + 1, chapter: m.chapter, chapterName: `ВРАТА ${toRomanNum(m.chapter)} · ${CHAPTERS[m.chapter - 1].name.toUpperCase()}`,
  chapterCls: CHAPTERS[m.chapter - 1].cls,
  name: m.isBoss ? `👑 БОСС: ${m.name}` : `${m.name} · ${idx+1}/50`, baseName: m.name,
  hp: m.hp, maxHp: m.hp, icon: m.icon, gold: m.gold, atk: m.atk, isBoss: !!m.isBoss
}));

const SHOP_ITEMS = {
  armors: [ 
    { id: "a1", name: "Рваная Накидка", hp: 0, price: 0, icon: "🧥", rarity: "common" },
    { id: "a2", name: "Кольчуга Тьмы", hp: 50, price: 100, icon: "👕", rarity: "rare" },
    { id: "a3", name: "Стальной Нагрудник", hp: 200, price: 500, icon: "🦺", rarity: "epic" },
    { id: "a4", name: "Панцирь Дракона", hp: 1000, price: 4000, icon: "🐉", rarity: "legendary" },
    { id: "a5", name: "Доспех Титана", hp: 5000, price: 25000, icon: "🗿", rarity: "mythic" },
    { id: "a6", name: "Эгида Богов", hp: 50000, price: 200000, icon: "🛡️", rarity: "divine" },
    { id: "a7", name: "Рудный Панцирь", hp: 150000, price: 900000, icon: "<img src='assets/minerals/Icons_01.png' style='width:100%; height:100%; object-fit:contain;'>", rarity: "divine" }
  ],
  weapons: [ 
    { id: "w1", name: "Ржавый Меч", damage: 10, price: 0, icon: "🗡️", rarity: "common" },
    { id: "w2", name: "Рубиновый Клинок", damage: 30, price: 60, icon: "♦️", rarity: "rare" },
    { id: "w3", name: "Изумрудный Топор", damage: 150, price: 400, icon: "❇️", rarity: "epic" },
    { id: "w4", name: "Алмазный Секач", damage: 800, price: 3000, icon: "💎", rarity: "legendary" },
    { id: "w5", name: "Раскалыватель", damage: 4000, price: 20000, icon: "🌋", rarity: "mythic" },
    { id: "w6", name: "Коса Смерти", damage: 25000, price: 150000, icon: "🪓", rarity: "divine" },
    { id: "w7", name: "Коготь Гоблина", damage: 100000, price: 900000, icon: "<img src='assets/goblins/Icons_01.png' style='width:100%; height:100%; object-fit:contain;'>", rarity: "divine" }
  ],
  boots: [ 
    { id: "b1", name: "Старые Сапоги", damage: 10, price: 0, icon: "🥾", rarity: "common" },
    { id: "b2", name: "Тяжелые Поножи", damage: 30, price: 60, icon: "⚙️", rarity: "rare" },
    { id: "b3", name: "Мифриловые Поножи", damage: 150, price: 400, icon: "🌟", rarity: "epic" },
    { id: "b4", name: "Шаги Землетрясения", damage: 800, price: 3000, icon: "🌍", rarity: "legendary" },
    { id: "b5", name: "Ледяные Сапоги", damage: 4000, price: 20000, icon: "❄️", rarity: "mythic" },
    { id: "b6", name: "Поступь Хаоса", damage: 25000, price: 150000, icon: "🌌", rarity: "divine" },
    { id: "b7", name: "Шахтёрские Сапоги", damage: 100000, price: 900000, icon: "<img src='assets/mine/Icons_01.png' style='width:100%; height:100%; object-fit:contain;'>", rarity: "divine" }
  ]
};

const ACHIEVEMENTS = [
  { id: "a1", name: "Первая Кровь", desc: "Сделайте 1 отжимание в бою", type: "pushups", target: 1, reward: 10, icon: "🩸" },
  { id: "a2", name: "Стальные Руки", desc: "Сделайте 50 отжиманий", type: "pushups", target: 50, reward: 50, icon: "💪" },
  { id: "a3", name: "Сотня Ударов", desc: "Сделайте 100 отжиманий", type: "pushups", target: 100, reward: 100, icon: "🥊" },
  { id: "a4", name: "Воин", desc: "Сделайте 500 отжиманий", type: "pushups", target: 500, reward: 300, icon: "⚔️" },
  { id: "a5", name: "Легенда Рук", desc: "Сделайте 1,000 отжиманий", type: "pushups", target: 1000, reward: 800, icon: "🏋️" },
  { id: "a6", name: "Титан", desc: "Сделайте 5,000 отжиманий", type: "pushups", target: 5000, reward: 3000, icon: "🦾" },
  { id: "a7", name: "Бог Войны", desc: "Сделайте 10,000 отжиманий", type: "pushups", target: 10000, reward: 8000, icon: "🌋" },
  { id: "a8", name: "Абсолют (Руки)", desc: "Сделайте 50,000 отжиманий", type: "pushups", target: 50000, reward: 50000, icon: "🌌" },
  { id: "a9", name: "Первый Шаг", desc: "Сделайте 1 приседание в бою", type: "squats", target: 1, reward: 10, icon: "🦵" },
  { id: "a10", name: "Крепкие Ноги", desc: "Сделайте 50 приседаний", type: "squats", target: 50, reward: 50, icon: "🦿" },
  { id: "a11", name: "Сотня Шагов", desc: "Сделайте 100 приседаний", type: "squats", target: 100, reward: 100, icon: "🚶" },
  { id: "a12", name: "Скала", desc: "Сделайте 500 приседаний", type: "squats", target: 500, reward: 300, icon: "🪨" },
  { id: "a13", name: "Легенда Ног", desc: "Сделайте 1,000 приседаний", type: "squats", target: 1000, reward: 800, icon: "⛰️" },
  { id: "a14", name: "Землетрясение", desc: "Сделайте 5,000 приседаний", type: "squats", target: 5000, reward: 3000, icon: "🌍" },
  { id: "a15", name: "Атлант", desc: "Сделайте 10,000 приседаний", type: "squats", target: 10000, reward: 8000, icon: "🔱" },
  { id: "a16", name: "Абсолют (Ноги)", desc: "Сделайте 50,000 приседаний", type: "squats", target: 50000, reward: 50000, icon: "🌠" },
  { id: "c1", name: "Выход из Леса", desc: "Пройди Главу 1", type: "chapter", target: 1, reward: 100, icon: "🌲" },
  { id: "c2", name: "Сухопутный", desc: "Пройди Главу 2", type: "chapter", target: 2, reward: 200, icon: "🐊" },
  { id: "c3", name: "Расхититель", desc: "Пройди Главу 3", type: "chapter", target: 3, reward: 500, icon: "🏛️" },
  { id: "c4", name: "Выживший", desc: "Пройди Главу 4", type: "chapter", target: 4, reward: 1000, icon: "❄️" },
  { id: "c5", name: "Пожарный", desc: "Пройди Главу 5", type: "chapter", target: 5, reward: 2500, icon: "🔥" },
  { id: "c6", name: "Сердцеед", desc: "Пройди Главу 6", type: "chapter", target: 6, reward: 5000, icon: "🖤" },
  { id: "c7", name: "Прыжок в Бездну", desc: "Пройди Главу 7", type: "chapter", target: 7, reward: 10000, icon: "🕳️" },
  { id: "c8", name: "Могильщик", desc: "Пройди Главу 8", type: "chapter", target: 8, reward: 25000, icon: "🪦" },
  { id: "c9", name: "Порядок", desc: "Пройди Главу 9", type: "chapter", target: 9, reward: 50000, icon: "⚖️" },
  { id: "c10", name: "Конец Времен", desc: "Пройди Главу 10", type: "chapter", target: 10, reward: 150000, icon: "♾️" },
  { id: "g1", name: "Копилка", desc: "Собери 100 золота", type: "gold", target: 100, reward: 20, icon: "🪙" },
  { id: "g2", name: "Мешок Монет", desc: "Собери 1,000 золота", type: "gold", target: 1000, reward: 200, icon: "💰" },
  { id: "g3", name: "Богач", desc: "Собери 10,000 золота", type: "gold", target: 10000, reward: 2000, icon: "🏦" },
  { id: "g4", name: "Аристократ", desc: "Собери 100,000 золота", type: "gold", target: 100000, reward: 20000, icon: "👑" },
  { id: "g5", name: "Дракон", desc: "Собери 1,000,000 золота", type: "gold", target: 1000000, reward: 200000, icon: "🐉" }
];

let gameState = JSON.parse(localStorage.getItem('fit_dark_state')) || {
  monsterIdx: 0, playerHp: 100, gold: 0, totalPushups: 0, totalSquats: 0, totalGoldEarned: 0,
  equippedWeapon: "w1", equippedBoots: "b1", equippedArmor: "a1", inventory: ["w1", "b1", "a1"],
  claimedAchievements: [], gameCompleted: false
};
let currentMonsterHp = MONSTERS[gameState.monsterIdx]?.hp || MONSTERS[MONSTERS.length - 1].hp;
let currentExercise = 'pushup';
let monsterAttackTimer = null, restRegenTimer = null;
window.__arenaActive = false;

// --- ФИШКА: КОМБО-СИСТЕМА ---
// Повторения подряд без паузы дольше 4с наращивают множитель урона.
let comboCount = 0;
let comboResetTimer = null;
const COMBO_WINDOW_MS = 4000;
function getComboMultiplier(count) {
  if (count >= 10) return 2.0;
  if (count >= 5) return 1.5;
  if (count >= 3) return 1.2;
  return 1;
}
function resetCombo() { comboCount = 0; clearTimeout(comboResetTimer); comboResetTimer = null; }

function saveState() { localStorage.setItem('fit_dark_state', JSON.stringify(gameState)); }
function addGold(amount) { gameState.gold += amount; gameState.totalGoldEarned += amount; }

function showBanner(title, subtitle, duration = 2200) {
  const el = document.getElementById('event-banner'); if(!el) return;
  el.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${subtitle}</div>`;
  el.className = 'banner-overlay show';
  el.onclick = () => el.classList.remove('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

function showToast(text) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = text;
  c.appendChild(t); setTimeout(() => t.remove(), 2800);
}

window.showAchDesc = (name, desc) => { showToast(`ℹ️ <b>${name}</b><br><span style="font-size:11px; font-weight:normal;">${desc}</span>`); };

document.addEventListener('DOMContentLoaded', () => {
  renderShop(); renderAchievements(); updateTopBar(); updateGameUI(); updateDailyStreak();
  if (gameState.totalPushups > 0 || gameState.monsterIdx > 0) {
    document.getElementById('health-form').style.display = 'none';
    document.getElementById('continue-panel').style.display = 'block';
  }
});

// --- ФИШКА: ЕЖЕДНЕВНАЯ СЕРИЯ ---
// Значок 🔥 в шапке раньше был просто картинкой "0 дн." и никогда не обновлялся.
// Теперь он реально считает дни подряд с открытием игры и даёт бонус руды.
function daysWord(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня';
  return 'дней';
}

function renderStreakUI(count) {
  const el = document.getElementById('top-streak');
  if (el) el.innerText = `${count} ${daysWord(count)}`;
}

function updateDailyStreak() {
  const todayStr = new Date().toISOString().slice(0, 10);
  let streak = JSON.parse(localStorage.getItem('fit_dark_streak') || 'null') || { lastDate: null, count: 0 };

  if (streak.lastDate === todayStr) { renderStreakUI(streak.count); return; }

  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  streak.count = (streak.lastDate === yesterdayStr) ? streak.count + 1 : 1;
  streak.lastDate = todayStr;
  localStorage.setItem('fit_dark_streak', JSON.stringify(streak));
  renderStreakUI(streak.count);

  if (streak.count > 1) {
    const bonus = Math.min(200, streak.count * 10);
    addGold(bonus); saveState(); updateGameUI();
    showToast(`🔥 Серия ${streak.count} ${daysWord(streak.count)} подряд! +${bonus} 💎`);
  }
}

function enterGame() {
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  requestWakeLock(); loadMonster(); showTab('arena');
}
document.getElementById('health-form').addEventListener('submit', (e) => { e.preventDefault(); enterGame(); });
document.getElementById('btn-continue').addEventListener('click', enterGame);

document.getElementById('btn-restart-link').addEventListener('click', resetAll);
document.getElementById('btn-full-reset').addEventListener('click', resetAll);
function resetAll() { if(confirm('Сбросить весь прогресс? Это необратимо.')) { localStorage.removeItem('fit_dark_state'); location.reload(); } }

function switchExercise(type) {
  currentExercise = type;
  if (typeof poseState !== 'undefined') { poseState.exercise = type; poseState.stage = "UP"; }
  
  document.getElementById('btn-pushup').classList.toggle('active', type === 'pushup');
  document.getElementById('btn-squat').classList.toggle('active', type === 'squat');

  const statusEl = document.getElementById('pose-status');
  if (statusEl) {
    statusEl.innerText = type === 'pushup' ? "Режим: Отжимания" : "Режим: Приседания";
    statusEl.style.color = "#00e5ff";
    statusEl.style.animation = "none";
    setTimeout(() => statusEl.style.animation = "bannerPop 0.3s ease", 10);
  }
  if (window.resetExerciseStage) window.resetExerciseStage();
}

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`nav-${tabName}`).classList.add('active');
  window.__arenaActive = (tabName === 'arena');
  
  if(tabName === 'arena') { 
    startCombatTimer(); 
    if (typeof restartCamera === 'function') restartCamera();
  } else { 
    stopCombatTimer(); 
    if (typeof stopCamera === 'function') stopCamera();
    resetCombo();
  }
  if(tabName === 'camp') startRestRegen(); else stopRestRegen();
}

function switchShopTab(tabId) {
  document.querySelectorAll('.shop-container').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.shop-nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`shop-container-${tabId}`).classList.add('active');
  event.currentTarget.classList.add('active');
}
window.switchShopTab = switchShopTab;

function retreatToCamp() { showTab('camp'); showBanner("ВРАТА", "Вы в безопасности."); }

function startCombatTimer() {
  stopCombatTimer();
  monsterAttackTimer = setInterval(() => {
    const m = MONSTERS[gameState.monsterIdx];
    if(!m || currentMonsterHp <= 0 || gameState.playerHp <= 0) return;
    gameState.playerHp = Math.max(0, gameState.playerHp - m.atk);
    const flash = document.getElementById('damage-flash');
    if(flash) { flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 150); }
    if(tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    updateGameUI(); saveState();
    if(gameState.playerHp <= 0) {
      stopCombatTimer(); gameState.playerHp = getMaxHp(); saveState(); updateGameUI();
      showBanner("СМЕРТЬ", "Врата вернули вас."); showTab('camp');
    }
  }, 6000);
}
function stopCombatTimer() { if(monsterAttackTimer) { clearInterval(monsterAttackTimer); monsterAttackTimer = null; } }

function startRestRegen() {
  stopRestRegen();
  restRegenTimer = setInterval(() => {
    const max = getMaxHp();
    if(gameState.playerHp < max) {
      gameState.playerHp = Math.min(max, gameState.playerHp + Math.max(5, max * 0.05));
      updateGameUI(); saveState();
    } else stopRestRegen();
  }, 1000);
}
function stopRestRegen() { if(restRegenTimer) { clearInterval(restRegenTimer); restRegenTimer = null; } }

function loadMonster() {
  const m = MONSTERS[gameState.monsterIdx]; if (!m) return;
  currentMonsterHp = m.hp;
  document.getElementById('monster-name').innerText = m.name;
  document.getElementById('monster-sprite').innerHTML = m.icon;
  document.getElementById('chapter-title').innerText = m.chapterName;
  updateTopBar(); updateGameUI();
}

function getMaxHp() { const armor = SHOP_ITEMS.armors.find(a => a.id === gameState.equippedArmor); return 100 + (armor ? armor.hp : 0); }
function getDamagePushup() { const w = SHOP_ITEMS.weapons.find(w => w.id === gameState.equippedWeapon); return w ? w.damage : 10; }
function getDamageSquat() { const b = SHOP_ITEMS.boots.find(b => b.id === gameState.equippedBoots); return b ? b.damage : 10; }

function updateTopBar() {
  let rank = "E"; const chap = Math.floor(gameState.monsterIdx / 5) + 1;
  if(chap > 2) rank = "D"; if(chap > 4) rank = "C"; if(chap > 6) rank = "B"; if(chap > 8) rank = "A"; if(chap > 9) rank = "S";
  document.getElementById('top-rank').innerText = rank;
  document.getElementById('top-level').innerText = gameState.monsterIdx + 1;
}

function onRepCompleted(type) {
  if (gameState.gameCompleted) return;

  // Комбо: повторения без пауз дольше 4с наращивают множитель урона
  comboCount++;
  clearTimeout(comboResetTimer);
  comboResetTimer = setTimeout(resetCombo, COMBO_WINDOW_MS);
  const comboMult = getComboMultiplier(comboCount);

  // Шанс крита 15%
  const isCrit = Math.random() < 0.15;

  const baseDmg = type === 'pushup' ? getDamagePushup() : getDamageSquat();
  const dmg = Math.max(1, Math.round(baseDmg * comboMult * (isCrit ? 2 : 1)));
  
  if(type === 'pushup') gameState.totalPushups++; else gameState.totalSquats++;

  addGold(5 + Math.floor(dmg * 0.02)); 
  currentMonsterHp = Math.max(0, currentMonsterHp - dmg);
  
  if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(isCrit ? 'rigid' : 'heavy');
  const sprite = document.getElementById('monster-sprite');
  if(sprite) { sprite.classList.add('monster-hit-anim'); setTimeout(()=>sprite.classList.remove('monster-hit-anim'), 220); }
  
  showDamagePopup(isCrit ? `КРИТ! -${dmg}` : `-${dmg}`, isCrit);
  if (comboMult > 1) showComboPopup(comboCount);

  renderAchievements(); updateGameUI(); saveState();
  if (currentMonsterHp === 0) onMonsterDefeated();
}

function showDamagePopup(text, crit = false) {
  const c = document.getElementById('damage-popup-container');
  const p = document.createElement('div'); p.className = 'damage-popup' + (crit ? ' crit' : ''); p.innerText = text;
  c.appendChild(p); setTimeout(() => p.remove(), 750);
}

function showComboPopup(count) {
  const c = document.getElementById('damage-popup-container');
  const p = document.createElement('div'); p.className = 'combo-popup'; p.innerText = `🔥 КОМБО x${count}`;
  c.appendChild(p); setTimeout(() => p.remove(), 700);
}

function onMonsterDefeated() {
  const defeated = MONSTERS[gameState.monsterIdx];
  addGold(defeated.gold);
  gameState.playerHp = Math.min(getMaxHp(), gameState.playerHp + (getMaxHp()*0.3));
  gameState.monsterIdx++; saveState(); updateGameUI(); renderAchievements();
  showToast(`Враг повержен! +${defeated.gold} 💎`);

  if (gameState.monsterIdx >= MONSTERS.length) {
    gameState.gameCompleted = true; stopCombatTimer(); saveState(); updateGameUI();
    showBanner("АБСОЛЮТ", "Вы покорили Бездну."); showTab('camp'); return;
  }
  const next = MONSTERS[gameState.monsterIdx];
  setTimeout(() => {
    loadMonster(); if(window.__arenaActive) startCombatTimer();
    if(next.chapter !== defeated.chapter) showBanner(`ВРАТА ${toRomanNum(next.chapter)}`, CHAPTERS[next.chapter-1].name.toUpperCase());
  }, 1500);
}

function updateGameUI() {
  const m = MONSTERS[gameState.monsterIdx]; const maxHp = getMaxHp();
  if (gameState.playerHp > maxHp) gameState.playerHp = maxHp;

  if (m) {
    document.getElementById('monster-hp-fill').style.width = `${(currentMonsterHp/m.hp)*100}%`;
    document.getElementById('monster-hp-text').innerText = `${currentMonsterHp} / ${m.hp} HP`;
  }
  document.getElementById('player-hp-fill').style.width = `${(gameState.playerHp/maxHp)*100}%`;
  document.getElementById('player-hp-text').innerText = `${Math.floor(gameState.playerHp)} / ${maxHp} HP`;
  
  const campFill = document.getElementById('camp-hp-fill'); if(campFill) campFill.style.width = `${(gameState.playerHp/maxHp)*100}%`;
  const campText = document.getElementById('camp-hp-text'); if(campText) campText.innerText = `${Math.floor(gameState.playerHp)} / ${maxHp} HP`;

  document.getElementById('shop-gold').innerText = `${gameState.gold} 💎`;
  document.getElementById('camp-gold').innerText = gameState.gold;
  document.getElementById('camp-hp-val').innerText = Math.floor(gameState.playerHp);
  document.getElementById('camp-level').innerText = gameState.monsterIdx + 1;
  document.getElementById('camp-reps').innerText = gameState.totalPushups + gameState.totalSquats;

  document.getElementById('dmg-pushup-val').innerText = getDamagePushup();
  document.getElementById('dmg-squat-val').innerText = getDamageSquat();
  document.getElementById('rep-count').innerText = `${gameState.totalPushups} | ${gameState.totalSquats}`;
}

function renderShop() {
  const renderList = (items, containerId, equippedId, type) => {
    document.getElementById(containerId).innerHTML = items.map(item => `
      <div class="shop-item ${equippedId === item.id ? 'equipped' : ''} rarity-${item.rarity || 'common'}">
        <div class="shop-item-info">
          <div class="shop-icon-frame">${item.icon}</div>
          <div>
            <strong class="shop-item-name">${item.name}</strong><br>
            <span class="shop-item-stat">${type === 'armor' ? `+${item.hp} HP` : `+${item.damage} Урон`}</span>
          </div>
        </div>
        <button class="shop-btn-buy" onclick="buyItem('${item.id}', '${type}', ${item.price})" ${equippedId === item.id ? 'disabled' : ''}>
          ${gameState.inventory.includes(item.id) ? 'НАДЕТО' : (item.price + ' 💎')}
        </button>
      </div>
    `).join('');
  };
  
  renderList(SHOP_ITEMS.armors, 'armors-list', gameState.equippedArmor, 'armor');
  renderList(SHOP_ITEMS.weapons, 'weapons-list', gameState.equippedWeapon, 'weapon');
  renderList(SHOP_ITEMS.boots, 'boots-list', gameState.equippedBoots, 'boot');
}

function buyItem(id, type, price) {
  if (!gameState.inventory.includes(id)) {
    if (gameState.gold < price) return showToast("❌ Мало руды!");
    gameState.gold -= price; gameState.inventory.push(id); showToast("✨ Получено!");
  }
  if (type === 'weapon') gameState.equippedWeapon = id;
  if (type === 'boot') gameState.equippedBoots = id;
  if (type === 'armor') gameState.equippedArmor = id;
  saveState(); renderShop(); updateGameUI();
}

function renderAchievements() {
  const evalAch = (a) => {
    let cur = 0, t = a.target;
    if(a.type==='pushups') cur = gameState.totalPushups;
    if(a.type==='squats') cur = gameState.totalSquats;
    if(a.type==='chapter') cur = Math.floor(gameState.monsterIdx/5);
    if(a.type==='gold') cur = gameState.totalGoldEarned || gameState.gold;
    return { cur, t, unl: cur >= t };
  };
  document.getElementById('achievements-list').innerHTML = ACHIEVEMENTS.map(ach => {
    const { cur, t, unl } = evalAch(ach); const clmd = gameState.claimedAchievements.includes(ach.id);
    return `<div class="achieve-card ${unl?'unlocked':''} ${clmd?'claimed':''}" onclick="showAchDesc('${ach.name}', '${ach.desc}')">
      <div class="achieve-icon">${ach.icon}</div>
      <div class="achieve-name">${ach.name}</div>
      <div class="achieve-progress-bar"><div class="achieve-progress-fill" style="width:${Math.min(100, (cur/t)*100)}%"></div></div>
      <div class="achieve-text">${Math.min(cur, t).toLocaleString()} / ${t.toLocaleString()}</div>
      ${unl ? (clmd ? `<span style="color:var(--neon-cyan); font-size:10px; font-weight:800; margin-top:4px;">✓ ПОЛУЧЕНО</span>` : `<button class="btn-claim" onclick="event.stopPropagation(); window.claimAch('${ach.id}')">ЗАБРАТЬ +${ach.reward}💎</button>`) : ''}
    </div>`;
  }).join('');
}
window.claimAch = (id) => {
  if(gameState.claimedAchievements.includes(id)) return;
  const ach = ACHIEVEMENTS.find(a=>a.id===id); gameState.claimedAchievements.push(id);
  addGold(ach.reward); saveState(); renderAchievements(); updateGameUI(); showToast(`🏆 +${ach.reward} 💎`);
};
