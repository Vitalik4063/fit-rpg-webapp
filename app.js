const tg = window.Telegram?.WebApp;
if (tg) tg.ready();

// 30 DOOM-INSPIRED MONSTERS ACROSS 6 CHAPTERS
const MONSTERS = [
  // Chapter 1: Hellish Outpost (1-5)
  { id: 1, chapter: 1, chapterName: "ГЛАВА I: АДСКИЙ РУБЕЖ", name: "Зомби-Солдат", hp: 30, maxHp: 30, icon: "🧟", xp: 15, gold: 5, atk: 5 },
  { id: 2, chapter: 1, chapterName: "ГЛАВА I: АДСКИЙ РУБЕЖ", name: "Адская Гончая", hp: 45, maxHp: 45, icon: "🐕", xp: 25, gold: 10, atk: 8 },
  { id: 3, chapter: 1, chapterName: "ГЛАВА I: АДСКИЙ РУБЕЖ", name: "Бес (Imp)", hp: 60, maxHp: 60, icon: "😈", xp: 40, gold: 18, atk: 10 },
  { id: 4, chapter: 1, chapterName: "ГЛАВА I: АДСКИЙ РУБЕЖ", name: "Демон-Пинки", hp: 90, maxHp: 90, icon: "🐗", xp: 60, gold: 30, atk: 12 },
  { id: 5, chapter: 1, chapterName: "ГЛАВА I: АДСКИЙ РУБЕЖ", name: "👑 БОСС: Рыцарь Ада", hp: 150, maxHp: 150, icon: "👹", xp: 150, gold: 80, atk: 18 },

  // Chapter 2: Iron Citadel (6-10)
  { id: 6, chapter: 2, chapterName: "ГЛАВА II: ЦИТАДЕЛЬ ЖЕЛЕЗА", name: "Арахнотрон", hp: 200, maxHp: 200, icon: "🕷️", xp: 180, gold: 100, atk: 15 },
  { id: 7, chapter: 2, chapterName: "ГЛАВА II: ЦИТАДЕЛЬ ЖЕЛЕЗА", name: "Какодемон", hp: 280, maxHp: 280, icon: "👁️", xp: 230, gold: 130, atk: 18 },
  { id: 8, chapter: 2, chapterName: "ГЛАВА II: ЦИТАДЕЛЬ ЖЕЛЕЗА", name: "Пехотинец-Ревенант", hp: 360, maxHp: 360, icon: "💀", xp: 300, gold: 170, atk: 22 },
  { id: 9, chapter: 2, chapterName: "ГЛАВА II: ЦИТАДЕЛЬ ЖЕЛЕЗА", name: "Манкубус", hp: 450, maxHp: 450, icon: "🧌", xp: 400, gold: 220, atk: 25 },
  { id: 10, chapter: 2, chapterName: "ГЛАВА II: ЦИТАДЕЛЬ ЖЕЛЕЗА", name: "👑 БОСС: Кибердемон", hp: 600, maxHp: 600, icon: "🤖", xp: 600, gold: 350, atk: 30 },

  // Chapter 3: Scorched Earth (11-15)
  { id: 11, chapter: 3, chapterName: "ГЛАВА III: ВЫЖЖЕННЫЕ ЗЕМЛИ", name: "Огненный Элементаль", hp: 750, maxHp: 750, icon: "🔥", xp: 750, gold: 420, atk: 28 },
  { id: 12, chapter: 3, chapterName: "ГЛАВА III: ВЫЖЖЕННЫЕ ЗЕМЛИ", name: "Адский Жнец", hp: 900, maxHp: 900, icon: "🦴", xp: 950, gold: 520, atk: 32 },
  { id: 13, chapter: 3, chapterName: "ГЛАВА III: ВЫЖЖЕННЫЕ ЗЕМЛИ", name: "Арчвайл", hp: 1100, maxHp: 1100, icon: "🧙‍♂️", xp: 1200, gold: 650, atk: 35 },
  { id: 14, chapter: 3, chapterName: "ГЛАВА III: ВЫЖЖЕННЫЕ ЗЕМЛИ", name: "Барон Ада", hp: 1400, maxHp: 1400, icon: "👺", xp: 1500, gold: 800, atk: 40 },
  { id: 15, chapter: 3, chapterName: "ГЛАВА III: ВЫЖЖЕННЫЕ ЗЕМЛИ", name: "👑 БОСС: Паук-Вождь", hp: 1800, maxHp: 1800, icon: "🕷️", xp: 2200, gold: 1200, atk: 45 },

  // Chapters 4-6 generated programmatically for brevity...
];

// Fill remaining levels up to 30
for (let i = 16; i <= 30; i++) {
  const ch = i <= 20 ? 4 : (i <= 25 ? 5 : 6);
  MONSTERS.push({
    id: i, chapter: ch, chapterName: `ГЛАВА ${ch}: БЕЗДНА ХАОСА`,
    name: `Титан Бездны LVL ${i}`, hp: i * 150, maxHp: i * 150,
    icon: i % 2 === 0 ? "🐲" : "👾", xp: i * 300, gold: i * 150, atk: i * 3
  });
}

const SHOP_ITEMS = {
  weapons: [
    { id: "w1", name: "Бензопила", damage: 10, price: 0 },
    { id: "w2", name: "Двустволка", damage: 25, price: 60 },
    { id: "w3", name: "Плазмоган", damage: 60, price: 250 },
    { id: "w4", name: "BFG 9000", damage: 180, price: 1000 }
  ],
  boots: [
    { id: "b1", name: "Кожаный Жилет", damage: 10, price: 0 },
    { id: "b2", name: "Броня Претора", damage: 25, price: 60 },
    { id: "b3", name: "Титановый Экзоскелет", damage: 60, price: 250 },
    { id: "b4", name: "Божественная Броня", damage: 180, price: 1000 }
  ]
};

let gameState = JSON.parse(localStorage.getItem('fit_doom_state')) || {
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
  localStorage.setItem('fit_doom_state', JSON.stringify(gameState));
}

document.getElementById('health-form').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  
  loadMonster();
  renderShop();
  initCamera();
  startMonsterAttackLoop();
});

// ENEMY COUNTER-ATTACK AI LOOP
function startMonsterAttackLoop() {
  if (monsterAttackTimer) clearInterval(monsterAttackTimer);
  
  // Monster attacks player every 6 seconds if player is idling
  monsterAttackTimer = setInterval(() => {
    const monster = MONSTERS[gameState.monsterIdx];
    if (!monster || currentMonsterHp <= 0 || gameState.playerHp <= 0) return;

    // Deal damage to player
    gameState.playerHp = Math.max(0, gameState.playerHp - monster.atk);
    
    // Screen Flash Effect & Vibration
    const flash = document.getElementById('damage-flash');
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 150);
    
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');

    updateGameUI();

    if (gameState.playerHp <= 0) {
      alert("💀 ВЫ ПОГИБЛИ! Здоровье восстановлено, попробуйте снова.");
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
  
  const arenaBg = document.getElementById('arena-bg');
  arenaBg.className = `arena-viewport chapter-${m.chapter}`;
  
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

// TRIGGERED STRICTLY BY VALID MOTION CYCLE IN POSE.JS
function onRepCompleted(type) {
  let dmg = (type === 'pushup') ? getPushupDamage() : getSquatDamage();
  
  if (type === 'pushup') gameState.totalPushups++;
  if (type === 'squat') gameState.totalSquats++;
  
  gameState.gold += 2;
  currentMonsterHp = Math.max(0, currentMonsterHp - dmg);

  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');

  const sprite = document.getElementById('monster-sprite');
  sprite.classList.add('monster-hit-anim');
  setTimeout(() => sprite.classList.remove('monster-hit-anim'), 200);

  showDamagePopup(`-${dmg} HP`);
  updateGameUI();
  saveState();

  if (currentMonsterHp === 0) {
    onMonsterDefeated();
  }
}

function showDamagePopup(text) {
  const container = document.getElementById('damage-popup-container');
  const popup = document.createElement('div');
  popup.className = 'damage-popup';
  popup.innerText = text;
  container.appendChild(popup);
  setTimeout(() => popup.remove(), 700);
}

function onMonsterDefeated() {
  const m = MONSTERS[gameState.monsterIdx];
  gameState.gold += m.gold;
  gameState.xp += m.xp;
  
  // Heal player slightly upon victory
  gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + 25);

  alert(`⚔️ ДЕМОН ${m.name} УНИЧТОЖЕН!\nПолучено: +${m.gold} 🪙 | +${m.xp} XP`);

  gameState.monsterIdx++;
  if (gameState.monsterIdx < MONSTERS.length) {
    loadMonster();
  } else {
    alert("🏆 ВЫ ОЧИСТИЛИ АД И ПРОШЛИ ВСЕ 30 УРОВНЕЙ!");
  }
  saveState();
}

function updateGameUI() {
  const m = MONSTERS[gameState.monsterIdx];
  
  // Monster HP
  const monsterPct = (currentMonsterHp / m.hp) * 100;
  document.getElementById('monster-hp-fill').style.width = `${monsterPct}%`;
  document.getElementById('monster-hp-text').innerText = `${currentMonsterHp} / ${m.hp} HP`;

  // Player HP
  const playerPct = (gameState.playerHp / gameState.playerMaxHp) * 100;
  document.getElementById('player-hp-fill').style.width = `${playerPct}%`;
  document.getElementById('player-hp-text').innerText = `${gameState.playerHp} / ${gameState.playerMaxHp} HP`;
  
  document.getElementById('shop-gold').innerText = `${gameState.gold} 🪙`;
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
