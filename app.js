const tg = window.Telegram?.WebApp;
if (tg) tg.ready();

// ==================== БАЗА ДАННЫХ: 30 УРОВНЕЙ И ВРАГОВ ====================
const MONSTERS = [
  // Глава 1: Лесной Рубеж (Уровни 1-5)
  { id: 1, chapter: 1, chapterName: "Глава I: Лесной Рубеж", name: "Лесной Слизень", hp: 6, icon: "🟢", xp: 15, gold: 5 },
  { id: 2, chapter: 1, chapterName: "Глава I: Лесной Рубеж", name: "Дикий Кролик-Переросток", hp: 12, icon: "🐇", xp: 25, gold: 10 },
  { id: 3, chapter: 1, chapterName: "Глава I: Лесной Рубеж", name: "Гоблин-Разбойник", hp: 20, icon: "👺", xp: 40, gold: 18 },
  { id: 4, chapter: 1, chapterName: "Глава I: Лесной Рубеж", name: "Лесной Огр", hp: 35, icon: "👹", xp: 60, gold: 30 },
  { id: 5, chapter: 1, chapterName: "Глава I: Лесной Рубеж", name: "👑 БОСС: Древний Энтум", hp: 60, icon: "🪵", xp: 150, gold: 80 },

  // Глава 2: Скалы Железа (Уровни 6-10)
  { id: 6, chapter: 2, chapterName: "Глава II: Скалы Железа", name: "Каменный Клещ", hp: 90, icon: "🕷️", xp: 180, gold: 100 },
  { id: 7, chapter: 2, chapterName: "Глава II: Скалы Железа", name: "Горная Гарпия", hp: 130, icon: "🦅", xp: 230, gold: 130 },
  { id: 8, chapter: 2, chapterName: "Глава II: Скалы Железа", name: "Пещерный Тролль", hp: 180, icon: "🧌", xp: 300, gold: 170 },
  { id: 9, chapter: 2, chapterName: "Глава II: Скалы Железа", name: "Стальной Голем", hp: 250, icon: "🗿", xp: 400, gold: 220 },
  { id: 10, chapter: 2, chapterName: "Глава II: Скалы Железа", name: "👑 БОСС: Циклоп-Разрушитель", hp: 350, icon: "👁️", xp: 600, gold: 350 },

  // Глава 3: Выжженные Земли (Уровни 11-15)
  { id: 11, chapter: 3, chapterName: "Глава III: Выжженные Земли", name: "Огненный Саламандр", hp: 480, icon: "🦎", xp: 750, gold: 420 },
  { id: 12, chapter: 3, chapterName: "Глава III: Выжженные Земли", name: "Адский Бес", hp: 620, icon: "😈", xp: 950, gold: 520 },
  { id: 13, chapter: 3, chapterName: "Глава III: Выжженные Земли", name: "Лавовый Элементаль", hp: 800, icon: "🔥", xp: 1200, gold: 650 },
  { id: 14, chapter: 3, chapterName: "Глава III: Выжженные Земли", name: "Костяной Дракон", hp: 1050, icon: "🦴", xp: 1500, gold: 800 },
  { id: 15, chapter: 3, chapterName: "Глава III: Выжженные Земли", name: "👑 БОСС: Владыка Ифритов", hp: 1400, icon: "🌋", xp: 2200, gold: 1200 },

  // Глава 4: Ледяной Пик (Уровни 16-20)
  { id: 16, chapter: 4, chapterName: "Глава IV: Ледяной Пик", name: "Ледяной Волк", hp: 1800, icon: "🐺", xp: 2700, gold: 1500 },
  { id: 17, chapter: 4, chapterName: "Глава IV: Ледяной Пик", name: "Снежный Йети", hp: 2300, icon: "❄️", xp: 3300, gold: 1900 },
  { id: 18, chapter: 4, chapterName: "Глава IV: Ледяной Пик", name: "Ледяная Горгона", hp: 2900, icon: "🧜‍♀️", xp: 4000, gold: 2400 },
  { id: 19, chapter: 4, chapterName: "Глава IV: Ледяной Пик", name: "Морозный Гигант", hp: 3600, icon: "🥶", xp: 4800, gold: 3000 },
  { id: 20, chapter: 4, chapterName: "Глава IV: Ледяной Пик", name: "👑 БОСС: Ледяной Дракон", hp: 4500, icon: "🧊", xp: 6500, gold: 4000 },

  // Глава 5: Цитадель Тени (Уровни 21-25)
  { id: 21, chapter: 5, chapterName: "Глава V: Цитадель Тени", name: "Теневой Рыцарь", hp: 5600, icon: "🗡️", xp: 8000, gold: 5000 },
  { id: 22, chapter: 5, chapterName: "Глава V: Цитадель Тени", name: "Призрак Бездны", hp: 6800, icon: "👻", xp: 9500, gold: 6200 },
  { id: 23, chapter: 5, chapterName: "Глава V: Цитадель Тени", name: "Некромант Проклятых", hp: 8200, icon: "🧙‍♂️", xp: 11000, gold: 7500 },
  { id: 24, chapter: 5, chapterName: "Глава V: Цитадель Тени", name: "Страж Павших", hp: 9800, icon: "🛡️", xp: 13000, gold: 9000 },
  { id: 25, chapter: 5, chapterName: "Глава V: Цитадель Тени", name: "👑 БОСС: Владыка Теней", hp: 12000, icon: "👑", xp: 18000, gold: 12000 },

  // Глава 6: Бездна Хаоса (Уровни 26-30)
  { id: 26, chapter: 6, chapterName: "Глава VI: Бездна Хаоса", name: "Демон Гнева", hp: 15000, icon: "👿", xp: 22000, gold: 15000 },
  { id: 27, chapter: 6, chapterName: "Глава VI: Бездна Хаоса", name: "Древний Левиафан", hp: 19000, icon: "👾", xp: 27000, gold: 18000 },
  { id: 28, chapter: 6, chapterName: "Глава VI: Бездна Хаоса", name: "Торментор Бездны", hp: 24000, icon: "🔱", xp: 33000, gold: 22000 },
  { id: 29, chapter: 6, chapterName: "Глава VI: Бездна Хаоса", name: "Тitan Разрушения", hp: 30000, icon: "🤖", xp: 40000, gold: 28000 },
  { id: 30, chapter: 6, chapterName: "Глава VI: Бездна Хаоса", name: "👑 ФИНАЛЬНЫЙ БОСС: ВЛАДЫКА ХАОСА", hp: 40000, icon: "🐲", xp: 100000, gold: 50000 }
];

// ЭКИПИРОВКА
const SHOP_ITEMS = {
  weapons: [
    { id: "w1", name: "Деревянный Меч", damage: 1, price: 0 },
    { id: "w2", name: "Железный Гладиус", damage: 3, price: 40 },
    { id: "w3", name: "Стальной Клинок", damage: 8, price: 150 },
    { id: "w4", name: "Драконий Топор", damage: 25, price: 800 },
    { id: "w5", name: "Меч Бездны", damage: 80, price: 3500 },
    { id: "w6", name: "Божественный Клинок", damage: 250, price: 15000 }
  ],
  boots: [
    { id: "b1", name: "Кожаные Сапоги", damage: 1, price: 0 },
    { id: "b2", name: "Кованые Поножи", damage: 3, price: 40 },
    { id: "b3", name: "Сапоги Скороходы", damage: 8, price: 150 },
    { id: "b4", name: "Титановые Опоры", damage: 25, price: 800 },
    { id: "b5", name: "Поножи Хаоса", damage: 80, price: 3500 },
    { id: "b6", name: "Божественные Опоры", damage: 250, price: 15000 }
  ]
};

// Сохраняемый игровой прогресс
let gameState = JSON.parse(localStorage.getItem('fit_game_30_state')) || {
  monsterIdx: 0,
  gold: 0,
  xp: 0,
  totalPushups: 0,
  totalSquats: 0,
  equippedWeapon: "w1",
  equippedBoots: "b1",
  inventory: ["w1", "b1"]
};

let currentHP = MONSTERS[gameState.monsterIdx]?.hp || 6;
let currentExercise = 'pushup';

function saveState() {
  localStorage.setItem('fit_game_30_state', JSON.stringify(gameState));
}

// Стартовый экран
document.getElementById('health-form').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  
  loadMonster();
  renderShop();
  initCamera();
});

function loadMonster() {
  const m = MONSTERS[gameState.monsterIdx];
  if (!m) return;
  
  currentHP = m.hp;
  document.getElementById('monster-name').innerText = m.name;
  document.getElementById('monster-sprite').innerText = m.icon;
  document.getElementById('chapter-title').innerText = m.chapterName;
  document.getElementById('player-lvl').innerText = `Уровень: ${m.id} / 30`;
  
  const arenaBg = document.getElementById('arena-bg');
  arenaBg.className = `arena-bg chapter-${m.chapter}`;
  
  updateGameUI();
}

function getPushupDamage() {
  return SHOP_ITEMS.weapons.find(w => w.id === gameState.equippedWeapon)?.damage || 1;
}

function getSquatDamage() {
  return SHOP_ITEMS.boots.find(b => b.id === gameState.equippedBoots)?.damage || 1;
}

function switchExercise(type) {
  currentExercise = type;
  document.getElementById('btn-pushup').classList.toggle('active', type === 'pushup');
  document.getElementById('btn-squat').classList.toggle('active', type === 'squat');
  if (window.resetExerciseStage) window.resetExerciseStage();
}

// ВЫЗЫВАЕТСЯ АВТОМАТИЧЕСКИ ИЗ pose.js ПРИ ЗАШЕДШЕМ ОДНОМ ОТЖИМАНИИ ИЛИ ПРИСЕДАНИИ
function onRepCompleted(type) {
  let dmg = (type === 'pushup') ? getPushupDamage() : getSquatDamage();
  
  if (type === 'pushup') gameState.totalPushups++;
  if (type === 'squat') gameState.totalSquats++;
  
  gameState.gold += 1;
  currentHP = Math.max(0, currentHP - dmg);

  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');

  const sprite = document.getElementById('monster-sprite');
  sprite.classList.add('monster-hit');
  setTimeout(() => sprite.classList.remove('monster-hit'), 220);

  showDamagePopup(`-${dmg}`);
  updateGameUI();
  saveState();

  if (currentHP === 0) {
    onMonsterDefeated();
  }
}

function showDamagePopup(text) {
  const container = document.getElementById('damage-popup-container');
  const popup = document.createElement('div');
  popup.className = 'damage-popup';
  popup.innerText = text;
  container.appendChild(popup);
  setTimeout(() => popup.remove(), 750);
}

function onMonsterDefeated() {
  const m = MONSTERS[gameState.monsterIdx];
  gameState.gold += m.gold;
  gameState.xp += m.xp;

  alert(`🎉 Уровень ${m.id} пройден!\nПовержен: ${m.name}\nНаграда: +${m.gold} 🪙, +${m.xp} ✨ XP!`);

  gameState.monsterIdx++;
  if (gameState.monsterIdx < MONSTERS.length) {
    loadMonster();
  } else {
    alert("🏆 ПОЗДРАВЛЯЕМ! ВЫ ПРОШЛИ ВСЕ 30 УРОВНЕЙ И ВЛАДЫКА ХАОСА ПОВЕРЖЕН!");
  }
  saveState();
}

function updateGameUI() {
  const m = MONSTERS[gameState.monsterIdx];
  const pct = (currentHP / m.hp) * 100;
  
  document.getElementById('hp-fill').style.width = `${pct}%`;
  document.getElementById('hp-text').innerText = `${currentHP} / ${m.hp} HP`;
  
  document.getElementById('player-gold').innerText = `🪙 ${gameState.gold}`;
  document.getElementById('shop-gold').innerText = `${gameState.gold} 🪙`;
  document.getElementById('player-xp').innerText = `✨ ${gameState.xp} XP`;
  
  document.getElementById('dmg-pushup-val').innerText = getPushupDamage();
  document.getElementById('dmg-squat-val').innerText = getSquatDamage();
  
  document.getElementById('rep-count').innerText = `💪 ${gameState.totalPushups} | 🦵 ${gameState.totalSquats}`;
}

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`nav-${tabName}`).classList.add('active');
}

function renderShop() {
  const renderList = (items, containerId, equippedId, type) => {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => `
      <div class="shop-item ${equippedId === item.id ? 'equipped' : ''}">
        <div><strong>${item.name}</strong><br><small>Урон: +${item.damage}</small></div>
        <button class="btn-buy" onclick="buyItem('${item.id}', '${type}', ${item.price})" 
          ${equippedId === item.id ? 'disabled' : ''}>
          ${gameState.inventory.includes(item.id) ? 'Экипировать' : item.price + ' 🪙'}
        </button>
      </div>
    `).join('');
  };

  renderList(SHOP_ITEMS.weapons, 'weapons-list', gameState.equippedWeapon, 'weapon');
  renderList(SHOP_ITEMS.boots, 'boots-list', gameState.equippedBoots, 'boot');
}

function buyItem(id, type, price) {
  if (!gameState.inventory.includes(id)) {
    if (gameState.gold < price) return alert("Недостаточно золота!");
    gameState.gold -= price;
    gameState.inventory.push(id);
  }
  if (type === 'weapon') gameState.equippedWeapon = id;
  if (type === 'boot') gameState.equippedBoots = id;
  saveState();
  renderShop();
  updateGameUI();
}