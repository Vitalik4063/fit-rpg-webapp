const tg = window.Telegram?.WebApp;
if (tg) tg.ready();

// 30 DARK FANTASY BOT BOSSES & MONSTERS (С ИСПОЛЬЗОВАНИЕМ ВАШИХ АВАТАРОВ)
const MONSTERS = [
  { id: 1, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "Гоблин-Разведчик", hp: 30, maxHp: 30, imgSrc: "assets/goblins/Icon49.png", xp: 15, gold: 5, atk: 4 },
  { id: 2, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "Гоблин-Воин", hp: 45, maxHp: 45, imgSrc: "assets/goblins/Icon50.png", xp: 25, gold: 10, atk: 7 },
  { id: 3, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "Орк-Берсерк", hp: 65, maxHp: 65, imgSrc: "assets/goblins/Icon49.png", xp: 40, gold: 18, atk: 10 },
  { id: 4, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "Шаман Тьмы", hp: 95, maxHp: 95, imgSrc: "assets/goblins/Icon50.png", xp: 60, gold: 30, atk: 12 },
  { id: 5, chapter: 1, chapterName: "ГЛАВА I: ШЕПЧУЩИЙ ЛЕС", name: "👑 БОСС: Вождь Гоблинов", hp: 150, maxHp: 150, imgSrc: "assets/goblins/Icon49.png", xp: 150, gold: 80, atk: 18 }
];

// Авто-генерация остальных уровней до 30 с чередованием аватарок
for (let i = 6; i <= 30; i++) {
  const ch = Math.ceil(i / 5);
  const iconName = i % 2 === 0 ? "Icon50.png" : "Icon49.png";
  MONSTERS.push({
    id: i, chapter: ch, chapterName: `ГЛАВА ${ch}: ПОДЗЕМЕЛЬЯ БЕЗДНЫ`,
    name: `Страж Бездны LVL ${i}`, hp: i * 130, maxHp: i * 130,
    imgSrc: `assets/goblins/${iconName}`, xp: i * 200, gold: i * 100, atk: i * 3
  });
}

// МАГАЗИН ОРУЖИЯ И МИНЕРАЛОВ ИЗ ВАШЕГО АРХИВА
const SHOP_ITEMS = {
  weapons: [
    { id: "w1", name: "Железный Клин", damage: 10, price: 0, icon: "assets/minerals/Icon1.png" },
    { id: "w2", name: "Рубиновый Меч", damage: 25, price: 50, icon: "assets/minerals/Icon2.png" },
    { id: "w3", name: "Изумрудный Клинок", damage: 60, price: 200, icon: "assets/minerals/Icon3.png" },
    { id: "w4", name: "Алмазный Секач", damage: 180, price: 800, icon: "assets/minerals/Icon4.png" }
  ],
  boots: [
    { id: "b1", name: "Кожаная Броня", damage: 10, price: 0, icon: "assets/minerals/Icon10.png" },
    { id: "b2", name: "Пластинчатый Доспех", damage: 25, price: 50, icon: "assets/minerals/Icon11.png" },
    { id: "b3", name: "Мифриловая Броня", damage: 60, price: 200, icon: "assets/minerals/Icon12.png" },
    { id: "b4", name: "Доспех Бездны", damage: 180, price: 800, icon: "assets/minerals/Icon13.png" }
  ]
};

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

document.getElementById('health-form').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('screen-onboarding').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  
  loadMonster();
  renderShop();
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
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 150);
    
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
  document.getElementById('monster-img').src = m.imgSrc;
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
  sprite.classList.add('monster-hit-anim');
  setTimeout(() => sprite.classList.remove('monster-hit-anim'), 220);

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
    container.innerHTML = items.map(item => `
      <div class="shop-item ${equippedId === item.id ? 'equipped' : ''}">
        <div>
          <img src="${item.icon}" class="mineral-icon" />
          <strong>${item.name}</strong><br>
          <small>Урон: +${item.damage}</small>
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

function buyItem(id, type, price) {
  if (!gameState.inventory.includes(id)) {
    if (gameState.gold < price) return alert("Недостаточно минералов!");
    gameState.gold -= price;
    gameState.inventory.push(id);
  }
  if (type === 'weapon') gameState.equippedWeapon = id;
  if (type === 'boot') gameState.equippedBoots = id;
  saveState();
  renderShop();
  updateGameUI();
}
