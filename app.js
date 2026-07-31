const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// Блокировка отключения экрана (Wake Lock API)
let wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Экран защищен от затухания');
    }
  } catch (err) { console.log('Wake Lock error:', err); }
}

// Восстановление при разблокировке/сворачивании
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    requestWakeLock();
  }
  if (document.visibilityState === 'visible' && window.__arenaActive) {
    if (window.__activeCamera) {
      window.__activeCamera.start();
    } else {
      if (typeof initCamera === 'function') initCamera();
    }
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
  id: idx + 1, chapter: m.chapter, chapterName: `ГЛАВА ${toRomanNum(m.chapter)}: ${CHAPTERS[m.chapter - 1].name.toUpperCase()}`,
  chapterCls: CHAPTERS[m.chapter - 1].cls, name: m.isBoss ? `👑 БОСС: ${m.name}` : m.name, baseName: m.name,
  hp: m.hp, maxHp: m.hp, icon: m.icon, gold: m.gold, atk: m.atk, isBoss: !!m.isBoss
}));

// ===== МАГАЗИН (Разделение логики) =====
const SHOP_ITEMS = {
  armors: [ // Увеличивают МАКСИМАЛЬНОЕ HP
    { id: "a1", name: "Рваная Накидка", hp: 0, price: 0, icon: "🧥", rarity: "common" },
    { id: "a2", name: "Кольчуга Тьмы", hp: 50, price: 100, icon: "👕", rarity: "rare" },
    { id: "a3", name: "Стальной Нагрудник", hp: 200, price: 500, icon: "🦺", rarity: "epic" },
    { id: "a4", name: "Панцирь Дракона", hp: 1000, price: 4000, icon: "🐉", rarity: "legendary" },
    { id: "a5", name: "Доспех Титана", hp: 5000, price: 25000, icon: "🗿", rarity: "mythic" },
    { id: "a6", name: "Эгида Богов", hp: 50000, price: 200000, icon: "🛡️", rarity: "divine" }
  ],
  weapons: [ // Урон от ОТЖИМАНИЙ
    { id: "w1", name: "Ржавый Меч", damage: 10, price: 0, icon: "🗡️", rarity: "common" },
    { id: "w2", name: "Рубиновый Клинок", damage: 30, price: 60, icon: "♦️", rarity: "rare" },
    { id: "w3", name: "Изумрудный Топор", damage: 150, price: 400, icon: "❇️", rarity: "epic" },
    { id: "w4", name: "Алмазный Секач", damage: 800, price: 3000, icon: "💎", rarity: "legendary" },
    { id: "w5", name: "Раскалыватель", damage: 4000, price: 20000, icon: "🌋", rarity: "mythic" },
    { id: "w6", name: "Коса Смерти", damage: 25000, price: 150000, icon: "🪓", rarity: "divine" }
  ],
  boots: [ // Урон от ПРИСЕДАНИЙ
    { id: "b1", name: "Старые Сапоги", damage: 10, price: 0, icon: "🥾", rarity: "common" },
    { id: "b2", name: "Тяжелые Поножи", damage: 30, price: 60, icon: "⚙️", rarity: "rare" },
    { id: "b3", name: "Мифриловые Поножи", damage: 150, price: 400, icon: "🌟", rarity: "epic" },
    { id: "b4", name: "Шаги Землетрясения", damage: 800, price: 3000, icon: "🌍", rarity: "legendary" },
    { id: "b5", name: "Ледяные Сапоги", damage: 4000, price: 20000, icon: "❄️", rarity: "mythic" },
    { id: "b6", name: "Поступь Хаоса", damage: 25000, price: 150000, icon: "🌌", rarity: "divine" }
  ]
};

// 37 ДОСТИЖЕНИЙ
const ACHIEVEMENTS = [
  { id: "a1", name: "Первая Кровь", desc: "1 отжимание", type: "pushups", target: 1, reward: 10 },
  { id: "a2", name: "Стальные Руки", desc: "50 отжиманий", type: "pushups", target: 50, reward: 50 },
  { id: "a3", name: "Сотня Ударов", desc: "100 отжиманий", type: "pushups", target: 100, reward: 100 },
  { id: "a4", name: "Воин", desc: "500 отжиманий", type: "pushups", target: 500, reward: 300 },
  { id: "a5", name: "Легенда Рук", desc: "1,000 отжиманий", type: "pushups", target: 1000, reward: 800 },
  { id: "a6", name: "Титан", desc: "5,000 отжиманий", type: "pushups", target: 5000, reward: 3000 },
  { id: "a7", name: "Бог Войны", desc: "10,000 отжиманий", type: "pushups", target: 10000, reward: 8000 },
  { id: "a8", name: "Абсолют (Руки)", desc: "50,000 отжиманий", type: "pushups", target: 50000, reward: 50000 },
  
  { id: "a9", name: "Первый Шаг", desc: "1 приседание", type: "squats", target: 1, reward: 10 },
  { id: "a10", name: "Крепкие Ноги", desc: "50 приседаний", type: "squats", target: 50, reward: 50 },
  { id: "a11", name: "Сотня Шагов", desc: "100 приседаний", type: "squats", target: 100, reward: 100 },
  { id: "a12", name: "Скала", desc: "500 приседаний", type: "squats", target: 500, reward: 300 },
  { id: "a13", name: "Легенда Ног", desc: "1,000 приседаний", type: "squats", target: 1000, reward: 800 },
  { id: "a14", name: "Землетрясение", desc: "5,000 приседаний", type: "squats", target: 5000, reward: 3000 },
  { id: "a15", name: "Атлант", desc: "10,000 приседаний", type: "squats", target: 10000, reward: 8000 },
  { id: "a16", name: "Абсолют (Ноги)", desc: "50,000 приседаний", type: "squats", target: 50000, reward: 50000 },
  
  { id: "c1", name: "Выход из Леса", desc: "Пройди Главу 1", type: "chapter", target: 1, reward: 100 },
  { id: "c2", name: "Сухопутный", desc: "Пройди Главу 2", type: "chapter", target: 2, reward: 200 },
  { id: "c3", name: "Расхититель", desc: "Пройди Главу 3", type: "chapter", target: 3, reward: 500 },
  { id: "c4", name: "Выживший", desc: "Пройди Главу 4", type: "chapter", target: 4, reward: 1000 },
  { id: "c5", name: "Пожарный", desc: "Пройди Главу 5", type: "chapter", target: 5, reward: 2500 },
  { id: "c6", name: "Сердцеед", desc: "Пройди Главу 6", type: "chapter", target: 6, reward: 5000 },
  { id: "c7", name: "Прыжок в Бездну", desc: "Пройди Главу 7", type: "chapter", target: 7, reward: 10000 },
  { id: "c8", name: "Могильщик", desc: "Пройди Главу 8", type: "chapter", target: 8, reward: 25000 },
  { id: "c9", name: "Порядок", desc: "Пройди Главу 9", type: "chapter", target: 9, reward: 50000 },
  { id: "c10", name: "Конец Времен", desc: "Пройди Главу 10", type: "chapter", target: 10, reward: 150000 },
  
  { id: "g1", name: "Копилка", desc: "Собери 100 золота", type: "gold", target: 100, reward: 20 },
  { id: "g2", name: "Мешок Монет", desc: "Собери 1,000 золота", type: "gold", target: 1000, reward: 200 },
  { id: "g3", name: "Богач", desc: "Собери 10,000 золота", type: "gold", target: 10000, reward: 2000 },
  { id: "g4", name: "Аристократ", desc: "Собери 100,000 золота", type: "gold", target: 100000, reward: 20000 },
  { id: "g5", name: "Дракон", desc: "Собери 1,000,000 золота", type: "gold", target: 1000000, reward: 200000 }
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

function saveState() { localStorage.setItem('fit_dark_state', JSON.stringify(gameState)); }
function addGold(amount) { gameState.gold += amount; gameState.totalGoldEarned += amount; }

function showBanner(title, subtitle, duration = 2200) {
  const el = document.getElementById('event-banner');
  if(!el) return;
  el.innerHTML = `<div class="banner-title">${title}</div><div class="banner-sub">${subtitle}</div>`;
  el.className = 'banner-overlay show';
  el.onclick = () => el.classList.remove('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

function showToast(text) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div'); t.className = 'toast'; t.innerText = text;
  c.appendChild(t); setTimeout(() => t.remove(), 2700);
}

document.addEventListener('DOMContentLoaded', () => {
  renderShop(); renderAchievements(); updateGameUI();
  if (gameState.totalPushups > 0 || gameState.monsterIdx > 0) {
    document.getElementById('health-form').style.display = 'none';
    document.getElementById('continue-panel').style.display = 'block';
  }
});

function enterGame() {
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  requestWakeLock();
  loadMonster(); initCamera(); showTab('arena');
}
document.getElementById('health-form').addEventListener('submit', (e) => { e.preventDefault(); enterGame(); });
document.getElementById('btn-continue').addEventListener('click', enterGame);

document.getElementById('btn-restart-link').addEventListener('click', resetAll);
document.getElementById('btn-full-reset').addEventListener('click', resetAll);
function resetAll() {
  if(confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие необратимо.')) {
    localStorage.removeItem('fit_dark_state'); location.reload();
  }
}

function switchExercise(type) {
  currentExercise = type;
  if (typeof poseState !== 'undefined') { poseState.exercise = type; poseState.stage = "UP"; }
  document.getElementById('btn-pushup').classList.toggle('active', type === 'pushup');
  document.getElementById('btn-squat').classList.toggle('active', type === 'squat');

  const statusEl = document.getElementById('pose-status');
  if (statusEl) {
    statusEl.innerText = type === 'pushup' ? "⚔️ РЕЖИМ: ОТЖИМАНИЯ" : "🛡️ РЕЖИМ: ПРИСЕДАНИЯ";
    statusEl.style.color = "#ffef9f";
    statusEl.style.animation = "none";
    setTimeout(() => statusEl.style.animation = "bannerPop 0.3s ease", 10);
  }
  if (window.resetExerciseStage) window.resetExerciseStage();
}

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`nav-${tabName}`).classList.add('active');
  window.__arenaActive = (tabName === 'arena');
  if(tabName==='arena') startCombatTimer(); else stopCombatTimer();
  if(tabName==='camp') startRestRegen(); else stopRestRegen();
}

function retreatToCamp() { showTab('camp'); showBanner("🏃 ВЫ ОТСТУПИЛИ", "Залечите раны у костра."); }

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
      showBanner("💀 ВЫ ПАЛИ", "Свет костра вернул вас к жизни."); showTab('camp');
    }
  }, 6000);
}
function stopCombatTimer() { if(monsterAttackTimer) { clearInterval(monsterAttackTimer); monsterAttackTimer = null; } }

function startRestRegen() {
  stopRestRegen();
  restRegenTimer = setInterval(() => {
    const max = getMaxHp();
    if(gameState.playerHp < max) {
      gameState.playerHp = Math.min(max, gameState.playerHp + Math.max(5, max * 0.05)); // 5% от макс хп в секунду
      updateGameUI(); saveState();
    } else stopRestRegen();
  }, 1000);
}
function stopRestRegen() { if(restRegenTimer) { clearInterval(restRegenTimer); restRegenTimer = null; } }

function loadMonster() {
  const m = MONSTERS[gameState.monsterIdx];
  if (!m) return;
  currentMonsterHp = m.hp;
  document.getElementById('monster-name').innerText = m.name;
  document.getElementById('monster-sprite').innerText = m.icon;
  document.getElementById('chapter-title').innerText = m.chapterName;
  document.getElementById('chapter-mini').innerText = `ГЛАВА ${toRomanNum(m.chapter)}`;
  document.getElementById('arena-bg').className = 'arena-viewport ' + m.chapterCls + (m.isBoss ? ' boss-active' : '');
  const monsterFrame = document.querySelector('.monster-frame');
  if(monsterFrame) monsterFrame.classList.toggle('boss-frame', m.isBoss);
  updateGameUI();
}

function getMaxHp() {
  const armor = SHOP_ITEMS.armors.find(a => a.id === gameState.equippedArmor);
  return 100 + (armor ? armor.hp : 0);
}
function getDamagePushup() {
  const w = SHOP_ITEMS.weapons.find(w => w.id === gameState.equippedWeapon); return w ? w.damage : 10;
}
function getDamageSquat() {
  const b = SHOP_ITEMS.boots.find(b => b.id === gameState.equippedBoots); return b ? b.damage : 10;
}

function onRepCompleted(type) {
  if (gameState.gameCompleted) return;
  let dmg = type === 'pushup' ? getDamagePushup() : getDamageSquat();
  
  if(type === 'pushup') gameState.totalPushups++; else gameState.totalSquats++;
  addGold(5 + Math.floor(dmg * 0.02)); 
  currentMonsterHp = Math.max(0, currentMonsterHp - dmg);
  
  if(tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
  const sprite = document.getElementById('monster-sprite');
  if(sprite) { sprite.classList.add('monster-hit-anim'); setTimeout(()=>sprite.classList.remove('monster-hit-anim'), 220); }
  
  showDamagePopup(`-${dmg}`);
  renderAchievements(); updateGameUI(); saveState();
  if (currentMonsterHp === 0) onMonsterDefeated();
}

function showDamagePopup(text) {
  const c = document.getElementById('damage-popup-container');
  const p = document.createElement('div'); p.className = 'damage-popup'; p.innerText = text;
  c.appendChild(p); setTimeout(() => p.remove(), 750);
}

function onMonsterDefeated() {
  const defeated = MONSTERS[gameState.monsterIdx];
  addGold(defeated.gold);
  gameState.playerHp = Math.min(getMaxHp(), gameState.playerHp + (getMaxHp()*0.3));
  gameState.monsterIdx++; saveState(); updateGameUI(); renderAchievements();
  showToast(`Победа! +${defeated.gold} 💎`);

  if (gameState.monsterIdx >= MONSTERS.length) {
    gameState.gameCompleted = true; stopCombatTimer(); saveState(); updateGameUI();
    showBanner("🔱 БЕЗДНА ПОКОРЕНА", "Вы Абсолют."); showTab('camp'); return;
  }
  const next = MONSTERS[gameState.monsterIdx];
  setTimeout(() => {
    loadMonster();
    if(window.__arenaActive) startCombatTimer();
    if(next.chapter !== defeated.chapter) showBanner(`ГЛАВА ${toRomanNum(next.chapter)}`, CHAPTERS[next.chapter-1].name.toUpperCase());
  }, 1500);
}

function updateGameUI() {
  const m = MONSTERS[gameState.monsterIdx];
  const maxHp = getMaxHp();
  
  // Корректировка HP при смене брони
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
  document.getElementById('dmg-pushup-val').innerText = getDamagePushup();
  document.getElementById('dmg-squat-val').innerText = getDamageSquat();
  document.getElementById('rep-count').innerText = `💪 ${gameState.totalPushups} | 🦵 ${gameState.totalSquats}`;
  document.getElementById('camp-gold').innerText = `${gameState.gold} 💎`;
  document.getElementById('camp-reps').innerText = `${gameState.totalPushups + gameState.totalSquats}`;
  
  if(m) {
    document.getElementById('camp-chapter').innerText = `${toRomanNum(m.chapter)} / X`;
    document.getElementById('camp-level').innerText = `${m.id} / 50`;
  }
}

function renderShop() {
  const renderList = (items, containerId, equippedId, type) => {
    document.getElementById(containerId).innerHTML = items.map(item => `
      <div class="shop-item ${equippedId === item.id ? 'equipped' : ''} rarity-${item.rarity || 'common'}">
        <div class="shop-item-info">
          <div class="icon-frame shop-icon-frame">${item.icon}</div>
          <div>
            <strong style="color:var(--gold-bright);">${item.name}</strong><br>
            <small style="color: #2ecc71;">${type === 'armor' ? `Здоровье: +${item.hp}` : `Урон: +${item.damage}`}</small>
          </div>
        </div>
        <button class="btn-buy" onclick="buyItem('${item.id}', '${type}', ${item.price})" ${equippedId === item.id ? 'disabled' : ''}>
          ${gameState.inventory.includes(item.id) ? 'Надеть' : (item.price + ' 💎')}
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
    if (gameState.gold < price) return showToast("❌ Недостаточно золота!");
    gameState.gold -= price;
    gameState.inventory.push(id);
    showToast("✨ Приобретено!");
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
    return `<div class="achieve-card ${unl?'unlocked':''} ${clmd?'claimed':''}">
      <div class="icon-frame shop-icon-frame" style="font-size: 20px; width:40px; height:40px;">${ach.icon}</div>
      <strong style="font-size:11px; color:${unl?'var(--gold-bright)':'#666'}">${ach.name}</strong>
      <div class="ach-progress"><div class="ach-progress-fill" style="width:${Math.min(100, (cur/t)*100)}%"></div></div>
      <small style="font-size:10px; color:#888;">${Math.min(cur, t).toLocaleString()} / ${t.toLocaleString()}</small>
      ${unl ? (clmd ? `<span style="color:#2ecc71; font-size:10px; margin-top:5px;">✓ Забрано</span>` : `<button class="btn-claim" onclick="claimAch('${ach.id}')">Забрать +${ach.reward}💎</button>`) : ''}
    </div>`;
  }).join('');
}
window.claimAch = (id) => {
  if(gameState.claimedAchievements.includes(id)) return;
  const ach = ACHIEVEMENTS.find(a=>a.id===id);
  gameState.claimedAchievements.push(id);
  addGold(ach.reward); saveState(); renderAchievements(); updateGameUI(); showToast(`🏆 Трофей! +${ach.reward}💎`);
};
