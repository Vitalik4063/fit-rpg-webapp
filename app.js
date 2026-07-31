const tg = window.Telegram?.WebApp;
if (tg) tg.ready();

// 30 DARK FANTASY МОНСТРОВ
const MONSTERS = [
  { id: 1, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "Гоблин-Разведчик", hp: 30, maxHp: 30, icon: "🧟", xp: 15, gold: 5, atk: 4 },
  { id: 2, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "Лесной Орк", hp: 45, maxHp: 45, icon: "👹", xp: 25, gold: 10, atk: 7 },
  { id: 3, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "Шаман Тьмы", hp: 65, maxHp: 65, icon: "🧙‍♂️", xp: 40, gold: 18, atk: 10 },
  { id: 4, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "Пещерный Огр", hp: 95, maxHp: 95, icon: "🧌", xp: 60, gold: 30, atk: 12 },
  { id: 5, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "👑 БОСС: Вождь Гоблинов", hp: 150, maxHp: 150, icon: "👑", xp: 150, gold: 80, atk: 18 }
];

for (let i = 6; i <= 30; i++) {
  const ch = Math.ceil(i / 5);
  MONSTERS.push({
    id: i, chapter: ch, chapterName: `ГЛАВА ${ch}: ПОДЗЕМЕЛЬЯ БЕЗДНЫ`,
    name: `Страж Бездны LVL ${i}`, hp: i * 130, maxHp: i * 130,
    icon: i % 2 === 0 ? "🐉" : "👾", xp: i * 200, gold: i * 100, atk: i * 3
  });
}

// МАГАЗИН ОРУЖИЯ И БРОНИ
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

// СПИСОК ДОСТИЖЕНИЙ
const ACHIEVEMENTS = [
  { id: "a1", name: "Первая Кровь", desc: "Сделать 1 отжимание", icon: "🩸", reqPushups: 1 },
  { id: "a2", name: "Железные Ноги", desc: "Сделать 10 приседаний", icon: "🦵", reqSquats: 10 },
  { id: "a3", name: "Убийца Тварей", desc: "Пройти 5 уровней", icon: "⚔️", reqLevel: 5 },
  { id: "a4", name: "Мастер Бездны", desc: "Сделать 100 отжиманий", icon: "🏆", reqPushups: 100 }
];

let gameState = JSON.parse(localStorage.getItem('fit_dark_state')) || {
  monsterIdx: 0,
  playerHp: 100,
  playerMaxHp: 100,
  gold: 0,
  xp: 0,
  totalPushups: 0,
  totalSquats: 0,
  equippedWeapon: "w1",
  equippedBoots: "b1",
  inventory: ["w1", "b1"]
};

let currentMonsterHp = MONSTERS[gameState.monsterIdx]?.hp || 30;
let currentExercise = 'pushup';
let monsterAttackTimer = null;

function saveState() {
  localStorage.setItem('fit_dark_state', JSON.stringify(gameState));
}

// Запуск при старте
document.addEventListener('DOMContentLoaded', () => {
  renderShop();
  renderAchievements();
  updateGameUI();
});

document.getElementById('health-form').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  
  loadMonster();
  renderShop();
  renderAchievements();
  initCamera();
  startMonsterAttackLoop();
});

function startMonsterAttackLoop() {
  if (monsterAttackTimer) clearInterval(monsterAttackTimer);
  
  monsterAttackTimer = setInterval(() => {
    const monster = MONSTERS[gameState.monsterIdx];
    if (!monster || currentMonsterHp <= 0 || gameState.playerHp <= 0) return;

    gameState.playerHp = Math.max(0, gameState.playerHp - monster.atk);
    
    const flash = document.getElementById('damage-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 150);
    }
    
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');

    updateGameUI();

    if (gameState.playerHp <= 0) {
      alert("💀 ВЫ ПОГИБЛИ В БОЮ! Здоровье восстановлено.");
      gameState.playerHp = gameState.playerMaxHp;
      updateGameUI();
    }
  }, 6000);
}

function loadMonster() {
  const m = MONSTERS[gameState.monsterIdx];
  if (!m) return;
  
  currentMonsterHp = m.hp;
  document.getElementById('monster-name').innerText = m.name;
  document.getElementById('monster-sprite').innerText = m.icon;
  document.getElementById('chapter-title').innerText = m.chapterName;
  
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
  let dmg = (type === 'pushup') ? getPushupDamage() : getSquatDamage();
  
  if (type === 'pushup') gameState.totalPushups++;
  if (type === 'squat') gameState.totalSquats++;
  
  gameState.gold += 3;
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
  const m = MONSTERS[gameState.monsterIdx];
  gameState.gold += m.gold;
  gameState.xp += m.xp;
  gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + 35);

  alert(`⚔️ ТВАРЬ ${m.name} ПОВЕРЖЕНА!\nПолучено: +${m.gold} 💎 Руд | +${m.xp} XP`);

  gameState.monsterIdx++;
  if (gameState.monsterIdx < MONSTERS.length) {
    loadMonster();
  } else {
    alert("🏆 ВЫ ВЫЖИЛИ И ОЧИСТИЛИ ВСЕ 30 УРОВНЕЙ БЕЗДНЫ!");
  }
  saveState();
}

function updateGameUI() {
  const m = MONSTERS[gameState.monsterIdx];
  if (!m) return;
  
  const monsterPct = (currentMonsterHp / m.hp) * 100;
  document.getElementById('monster-hp-fill').style.width = `${monsterPct}%`;
  document.getElementById('monster-hp-text').innerText = `${currentMonsterHp} / ${m.hp} HP`;

  const playerPct = (gameState.playerHp / gameState.playerMaxHp) * 100;
  document.getElementById('player-hp-fill').style.width = `${playerPct}%`;
  document.getElementById('player-hp-text').innerText = `${gameState.playerHp} / ${gameState.playerMaxHp} HP`;
  
  document.getElementById('shop-gold').innerText = `${gameState.gold} 💎`;
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
    if (!container) return;
    container.innerHTML = items.map(item => `
      <div class="shop-item ${equippedId === item.id ? 'equipped' : ''}">
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

function renderAchievements() {
  const container = document.getElementById('achievements-list');
  if (!container) return;

  container.innerHTML = ACHIEVEMENTS.map(ach => {
    let unlocked = false;
    if (ach.reqPushups && gameState.totalPushups >= ach.reqPushups) unlocked = true;
    if (ach.reqSquats && gameState.totalSquats >= ach.reqSquats) unlocked = true;
    if (ach.reqLevel && (gameState.monsterIdx + 1) >= ach.reqLevel) unlocked = true;

    return `
      <div class="achieve-card ${unlocked ? 'unlocked' : ''}">
        <div class="icon-frame shop-icon-frame" style="margin:0 auto;">${ach.icon}</div>
        <strong style="font-size: 12px; color: ${unlocked ? '#c9a050' : '#666'};">${ach.name}</strong>
        <small style="font-size: 10px; color: #888;">${ach.desc}</small>
      </div>
    `;
  }).join('');
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
  updateGameUI();
}
