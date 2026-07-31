const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

function toRomanNum(n) { return ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || String(n); }

// ===== 10 ГЛАВ =====
const CHAPTERS = [
  { num: 1, name: "Шепчущий Лес", cls: "chapter-1" },
  { num: 2, name: "Затопленные Пещеры", cls: "chapter-2" },
  { num: 3, name: "Руины Забытого Храма", cls: "chapter-3" },
  { num: 4, name: "Ледяные Пустоши", cls: "chapter-4" },
  { num: 5, name: "Огненные Шахты", cls: "chapter-5" },
  { num: 6, name: "Сердце Бездны", cls: "chapter-6" },
  { num: 7, name: "Царство Пустоты", cls: "chapter-7" },
  { num: 8, name: "Кладбище Богов", cls: "chapter-8" },
  { num: 9, name: "Измерение Хаоса", cls: "chapter-9" },
  { num: 10, name: "Конец Времен", cls: "chapter-10" }
];

// ===== 50 УНИКАЛЬНЫХ ВРАГОВ (ЭКСПОНЕНЦИАЛЬНЫЙ РОСТ) =====
const MONSTERS_RAW = [];
const baseHp = [30, 200, 800, 2500, 8000, 25000, 80000, 250000, 1000000, 5000000];
const baseGold = [5, 20, 80, 250, 800, 2500, 8000, 25000, 100000, 500000];
const icons = [
  ["🧟", "👹", "🧙‍♂️", "🧌", "👑"], ["🐌", "🧟‍♂️", "👺", "🧙‍♀️", "🐊"], 
  ["💀", "🗿", "👻", "🦇", "🐉"], ["❄️", "🐺", "🧊", "🦣", "🐻‍❄️"], 
  ["🦎", "🌋", "😈", "🔥", "🐲"], ["👿", "🛡️", "🕷️", "🐙", "🔱"],
  ["👁️", "🌌", "🌑", "💫", "🕳️"], ["🪦", "🧟‍♀️", "🧛‍♂️", "🧟", "☠️"],
  ["🌪️", "⚡️", "☄️", "💥", "👹"], ["⏳", "👁️‍🗨️", "🧿", "💠", "♾️"]
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
    const isBoss = (j === 4);
    const multiplier = 1 + (j * 0.5) + (isBoss ? 2 : 0);
    MONSTERS_RAW.push({
      chapter: i+1, name: names[i][j], hp: Math.floor(baseHp[i] * multiplier),
      icon: icons[i][j], gold: Math.floor(baseGold[i] * multiplier), atk: Math.floor((baseHp[i]/10)*multiplier), isBoss
    });
  }
}

const MONSTERS = MONSTERS_RAW.map((m, idx) => ({
  id: idx + 1, chapter: m.chapter,
  chapterName: `ГЛАВА ${toRomanNum(m.chapter)}: ${CHAPTERS[m.chapter - 1].name.toUpperCase()}`,
  chapterCls: CHAPTERS[m.chapter - 1].cls,
  name: m.isBoss ? `👑 БОСС: ${m.name}` : m.name,
  baseName: m.name, hp: m.hp, maxHp: m.hp, icon: m.icon, gold: m.gold, atk: m.atk, isBoss: !!m.isBoss
}));

// ===== МАГАЗИН (ЦЕНЫ УВЕЛИЧИВАЮТСЯ ДО ОГРОМНЫХ ЗНАЧЕНИЙ) =====
const SHOP_ITEMS = {
  premium: [ // Эти предметы стоят Telegram Stars
    { id: "p1", name: "Коса Смерти (Оружие)", damage: 500000, price: 2, icon: "🪓", type: "weapon" },
    { id: "p2", name: "Пожиратель Миров (Оружие)", damage: 1500000, price: 2, icon: "🌌", type: "weapon" },
    { id: "p3", name: "Эскалибур Истины (Оружие)", damage: 5000000, price: 2, icon: "⚔️", type: "weapon" },
    { id: "p4", name: "Крылья Пустоты (Броня)", damage: 500000, price: 2, icon: "🦇", type: "boot" },
    { id: "p5", name: "Эгида Бессмертия (Броня)", damage: 1500000, price: 2, icon: "🛡️", type: "boot" },
    { id: "p6", name: "Корона Хаоса (Броня)", damage: 5000000, price: 2, icon: "👑", type: "boot" },
    { id: "p7", name: "Око Абсолюта (Универсал)", damage: 15000000, price: 5, icon: "👁️", type: "weapon" }
  ],
  weapons: [
    { id: "w1", name: "Железный Меч", damage: 10, price: 0, icon: "🗡️", rarity: "common" },
    { id: "w2", name: "Рубиновый Клинок", damage: 25, price: 50, icon: "♦️", rarity: "rare" },
    { id: "w3", name: "Изумрудный Топор", damage: 100, price: 300, icon: "❇️", rarity: "epic" },
    { id: "w4", name: "Алмазный Секач", damage: 500, price: 2000, icon: "💎", rarity: "legendary" },
    { id: "w5", name: "Меч Дракона", damage: 2500, price: 15000, icon: "🐉", rarity: "mythic" },
    { id: "w6", name: "Клинок Титана", damage: 15000, price: 100000, icon: "⚡", rarity: "divine" },
    { id: "w7", name: "Раскалыватель", damage: 80000, price: 750000, icon: "🌋", rarity: "divine" }
  ],
  boots: [
    { id: "b1", name: "Кожаный Доспех", damage: 10, price: 0, icon: "🦺", rarity: "common" },
    { id: "b2", name: "Пластинчатая Броня", damage: 25, price: 50, icon: "⚙️", rarity: "rare" },
    { id: "b3", name: "Мифриловые Поножи", damage: 100, price: 300, icon: "🌟", rarity: "epic" },
    { id: "b4", name: "Доспех Бездны", damage: 500, price: 2000, icon: "🔱", rarity: "legendary" },
    { id: "b5", name: "Чешуя Дракона", damage: 2500, price: 15000, icon: "🐲", rarity: "mythic" },
    { id: "b6", name: "Броня Богов", damage: 15000, price: 100000, icon: "👼", rarity: "divine" },
    { id: "b7", name: "Аура Хаоса", damage: 80000, price: 750000, icon: "🌌", rarity: "divine" }
  ]
};

// ДОСТИЖЕНИЯ
const ACHIEVEMENTS = [
  { id: "a1", name: "Первая Кровь", desc: "1 отжимание", icon: "🩸", type: "pushups", target: 1, reward: 10 },
  { id: "a2", name: "Стальные Руки", desc: "50 отжиманий", icon: "💪", type: "pushups", target: 50, reward: 30 },
  { id: "a3", name: "Легенда", desc: "1000 отжиманий", icon: "🏋️", type: "pushups", target: 1000, reward: 400 },
  { id: "a4", name: "Первый Присед", desc: "1 приседание", icon: "🦵", type: "squats", target: 1, reward: 10 },
  { id: "a5", name: "Легенда Ног", desc: "1000 приседаний", icon: "⛰️", type: "squats", target: 1000, reward: 400 },
  { id: "a6", name: "Победитель Леса", desc: "Пройди Главу I", icon: "🌲", type: "chapter", target: 1, reward: 50 },
  { id: "a7", name: "Конец Времен", desc: "Пройди Главу X", icon: "♾️", type: "chapter", target: 10, reward: 5000 }
];

let gameState = JSON.parse(localStorage.getItem('fit_dark_state')) || {
  monsterIdx: 0, playerHp: 100, playerMaxHp: 100, gold: 0, totalPushups: 0, totalSquats: 0,
  equippedWeapon: "w1", equippedBoots: "b1", inventory: ["w1", "b1"], claimedAchievements: [], gameCompleted: false
};
let currentMonsterHp = MONSTERS[gameState.monsterIdx]?.hp || MONSTERS[MONSTERS.length - 1].hp;
let currentExercise = 'pushup';
let monsterAttackTimer = null, restRegenTimer = null;
window.__arenaActive = false;

function saveState() { localStorage.setItem('fit_dark_state', JSON.stringify(gameState)); }
function addGold(amount) { gameState.gold += amount; }

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
  loadMonster(); initCamera(); showTab('arena');
}
document.getElementById('health-form').addEventListener('submit', (e) => { e.preventDefault(); enterGame(); });
document.getElementById('btn-continue').addEventListener('click', enterGame);
document.getElementById('btn-restart-link').addEventListener('click', () => { if(confirm('Сбросить всё?')) { localStorage.removeItem('fit_dark_state'); location.reload(); } });

function switchExercise(type) {
  currentExercise = type;
  if (typeof poseState !== 'undefined') { poseState.exercise = type; poseState.stage = "UP"; }
  document.getElementById('btn-pushup').classList.toggle('active', type === 'pushup');
  document.getElementById('btn-squat').classList.toggle('active', type === 'squat');

  const statusEl = document.getElementById('pose-status');
  if (statusEl) {
    statusEl.innerText = type === 'pushup' ? "⚔️ РЕЖИМ: ОТЖИМАНИЯ" : "🛡️ РЕЖИМ: ПРИСЕДАНИЯ";
    statusEl.style.color = "#ffdf73";
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

function retreatToCamp() { showTab('camp'); showBanner("🏃 ВЫ ОТСТУПИЛИ", "Отдохните у костра."); }

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
      stopCombatTimer(); gameState.playerHp = gameState.playerMaxHp; saveState(); updateGameUI();
      showBanner("💀 ВЫ ПАЛИ", "Вас вернуло в лагерь."); showTab('camp');
    }
  }, 6000);
}
function stopCombatTimer() { if(monsterAttackTimer) { clearInterval(monsterAttackTimer); monsterAttackTimer = null; } }

function startRestRegen() {
  stopRestRegen();
  restRegenTimer = setInterval(() => {
    if(gameState.playerHp < gameState.playerMaxHp) {
      gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + 5);
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

function getDamage(type) {
  const id = type === 'pushup' ? gameState.equippedWeapon : gameState.equippedBoots;
  let item = SHOP_ITEMS.weapons.find(w => w.id === id) || SHOP_ITEMS.boots.find(b => b.id === id) || SHOP_ITEMS.premium.find(p => p.id === id);
  return item ? item.damage : 10;
}

function onRepCompleted(type) {
  if (gameState.gameCompleted) return;
  let dmg = getDamage(type);
  if(type === 'pushup') gameState.totalPushups++; else gameState.totalSquats++;
  
  addGold(5 + Math.floor(dmg * 0.01)); // Даем чуть больше золота с крутым шмотом
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
  gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + (gameState.playerMaxHp*0.3));
  gameState.monsterIdx++; saveState(); updateGameUI(); renderAchievements();
  showToast(`${defeated.baseName} повержен! +${defeated.gold} 💎`);

  if (gameState.monsterIdx >= MONSTERS.length) {
    gameState.gameCompleted = true; stopCombatTimer(); saveState(); updateGameUI();
    showBanner("🔱 БЕЗДНА ПОКОРЕНА", "Вы прошли 50 испытаний!"); showTab('camp'); return;
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
  if (m) {
    document.getElementById('monster-hp-fill').style.width = `${(currentMonsterHp/m.hp)*100}%`;
    document.getElementById('monster-hp-text').innerText = `${currentMonsterHp} / ${m.hp} HP`;
  }
  document.getElementById('player-hp-fill').style.width = `${(gameState.playerHp/gameState.playerMaxHp)*100}%`;
  document.getElementById('player-hp-text').innerText = `${Math.floor(gameState.playerHp)} / ${gameState.playerMaxHp} HP`;
  
  const campFill = document.getElementById('camp-hp-fill'); if(campFill) campFill.style.width = `${(gameState.playerHp/gameState.playerMaxHp)*100}%`;
  const campText = document.getElementById('camp-hp-text'); if(campText) campText.innerText = `${Math.floor(gameState.playerHp)} / ${gameState.playerMaxHp} HP`;

  document.getElementById('shop-gold').innerText = `${gameState.gold} 💎`;
  document.getElementById('dmg-pushup-val').innerText = getDamage('pushup');
  document.getElementById('dmg-squat-val').innerText = getDamage('squat');
  document.getElementById('rep-count').innerText = `💪 ${gameState.totalPushups} | 🦵 ${gameState.totalSquats}`;
  document.getElementById('camp-gold').innerText = `${gameState.gold} 💎`;
  document.getElementById('camp-reps').innerText = `${gameState.totalPushups + gameState.totalSquats}`;
  
  if(m) {
    document.getElementById('camp-chapter').innerText = `${toRomanNum(m.chapter)} / X`;
    document.getElementById('camp-level').innerText = `${m.id} / 50`;
  }
}

function renderShop() {
  const renderList = (items, containerId, equippedId, type, isPremium=false) => {
    document.getElementById(containerId).innerHTML = items.map(item => `
      <div class="shop-item ${equippedId === item.id ? 'equipped' : ''} rarity-${item.rarity || 'mythic'} ${isPremium ? 'premium-item' : ''}">
        <div class="shop-item-info">
          <div class="icon-frame shop-icon-frame">${item.icon}</div>
          <div><strong>${item.name}</strong><br><small style="color: #2ecc71;">Урон: +${item.damage}</small></div>
        </div>
        <button class="btn-buy ${isPremium ? 'btn-star' : ''}" onclick="buyItem('${item.id}', '${item.type || type}', ${item.price}, ${isPremium})" ${equippedId === item.id ? 'disabled' : ''}>
          ${gameState.inventory.includes(item.id) ? 'Надеть' : (item.price + (isPremium ? ' ⭐️' : ' 💎'))}
        </button>
      </div>
    `).join('');
  };
  
  renderList(SHOP_ITEMS.premium, 'premium-list', gameState.equippedWeapon, 'weapon', true);
  renderList(SHOP_ITEMS.weapons, 'weapons-list', gameState.equippedWeapon, 'weapon', false);
  renderList(SHOP_ITEMS.boots, 'boots-list', gameState.equippedBoots, 'boot', false);
}

function buyItem(id, type, price, isPremium) {
  if (!gameState.inventory.includes(id)) {
    if (isPremium) {
      // ИНТЕГРАЦИЯ С БЭКЕНДОМ ДЛЯ ПОКУПКИ ЗА ЗВЕЗДЫ
      buyPremiumWithStars(id, type, price);
      return;
    } else {
      if (gameState.gold < price) return showToast("❌ Недостаточно золота!");
      gameState.gold -= price;
      gameState.inventory.push(id);
    }
  }
  if (type === 'weapon') gameState.equippedWeapon = id;
  if (type === 'boot') gameState.equippedBoots = id;
  saveState(); renderShop(); updateGameUI();
}

// ==== МОНЕТИЗАЦИЯ (TELEGRAM STARS / API) ====
function buyPremiumWithStars(itemId, itemType, price) {
  if (tg && tg.openInvoice) {
    // В реальном продакшене:
    // fetch(`/api/create-invoice?itemId=${itemId}`).then(r => r.json()).then(data => tg.openInvoice(data.url, (status) => {
    //    if(status === 'paid') { gameState.inventory.push(itemId); ... saveState(); }
    // }));
    
    // Эмуляция успешного ответа от нашего Python бэкенда:
    tg.showConfirm(`Вы уверены, что хотите купить этот артефакт за ${price} ⭐️? (Счет выставляется через бэкенд)`, (ok) => {
      if(ok) {
        // Симулируем успешную оплату для примера
        showToast("✨ Артефакт приобретен!");
        gameState.inventory.push(itemId);
        if (itemType === 'weapon') gameState.equippedWeapon = itemId;
        if (itemType === 'boot') gameState.equippedBoots = itemId;
        saveState(); renderShop(); updateGameUI();
      }
    });
  } else {
    alert("Покупка за ⭐️ доступна только внутри мобильного приложения Telegram.");
  }
}

function renderAchievements() {
  const evalAch = (a) => {
    let cur = 0, t = a.target;
    if(a.type==='pushups') cur = gameState.totalPushups;
    if(a.type==='squats') cur = gameState.totalSquats;
    if(a.type==='chapter') cur = Math.floor(gameState.monsterIdx/5);
    return { cur, t, unl: cur >= t };
  };
  document.getElementById('achievements-list').innerHTML = ACHIEVEMENTS.map(ach => {
    const { cur, t, unl } = evalAch(ach); const clmd = gameState.claimedAchievements.includes(ach.id);
    return `<div class="achieve-card ${unl?'unlocked':''} ${clmd?'claimed':''}">
      <div class="icon-frame shop-icon-frame">${ach.icon}</div>
      <strong style="font-size:12px; color:${unl?'#c9a050':'#666'}">${ach.name}</strong>
      <div class="ach-progress"><div class="ach-progress-fill" style="width:${Math.min(100, (cur/t)*100)}%"></div></div>
      <small style="font-size:9px">${Math.min(cur, t)}/${t}</small>
      ${unl ? (clmd ? `<span style="color:#2ecc71; font-size:10px">✓ Забрано</span>` : `<button class="btn-claim" onclick="claimAch('${ach.id}')">Забрать +${ach.reward}💎</button>`) : ''}
    </div>`;
  }).join('');
}
window.claimAch = (id) => {
  if(gameState.claimedAchievements.includes(id)) return;
  const ach = ACHIEVEMENTS.find(a=>a.id===id);
  gameState.claimedAchievements.push(id);
  addGold(ach.reward); saveState(); renderAchievements(); updateGameUI(); showToast(`🏆 ${ach.name} +${ach.reward}💎`);
};
