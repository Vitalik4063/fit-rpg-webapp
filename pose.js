let poseState = { stage: "UP", exercise: "pushup" };
const savedSettings = (() => { try { return JSON.parse(localStorage.getItem('fit_dark_settings') || '{}'); } catch(e) { return {}; } })();
const DIFFICULTY_ADJUST = { beginner: 10, medium: 0, pro: -10 }[savedSettings.fitnessLevel] || 0;
const FLOOR_ADJUST = savedSettings.fitnessLevel === 'beginner' ? 10 : 0;

const CONFIG = {
  pushup: { downAngle: 90 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 40 + FLOOR_ADJUST },
  squat:  { downAngle: 100 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 50 + FLOOR_ADJUST }
};

// --- СОСТОЯНИЕ КАМЕРЫ ---
// Раньше onFrame слал новый кадр в pose.send() на каждый rAF-тик, не дожидаясь,
// пока обработается предыдущий. Если устройство не успевало (слабый телефон,
// фон/сворачивание Telegram и т.п.), запросы копились друг на друга — и картинка
// "залипала" на последнем удачном кадре. Плюс камера пересоздавалась заново при
// каждом входе, что тоже могло подвесить старый поток.
// Теперь: доступ к камере запрашивается ОДИН раз за сессию (при входе в игру),
// поток остаётся жить постоянно, а обрабатываем/рисуем кадры только пока идёт
// бой (window.__arenaActive) — без остановки и пересоздания самой камеры.
let globalPose = null;
let activeCamera = null;
let isProcessing = false;
let cameraRequested = false; // защищает от повторных запросов доступа к камере

function resetExerciseStage() { poseState.stage = "UP"; }

function calculateAngle(A, B, C) {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle);
}

// Отрисовка скелета
function drawBone(ctx, p1, p2, color = "#ffef9f", width = 4) {
  if (!p1 || !p2 || p1.visibility < 0.3 || p2.visibility < 0.3) return;
  ctx.beginPath();
  ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
  ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawJointPoint(ctx, p, color = "#f02a2a", radius = 5) {
  if (!p || p.visibility < 0.3) return;
  ctx.beginPath();
  ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFullSkeleton(ctx, lm, activeColor) {
  // Торс
  drawBone(ctx, lm[11], lm[12], "#d4af37", 3);
  drawBone(ctx, lm[11], lm[23], "#d4af37", 3);
  drawBone(ctx, lm[12], lm[24], "#d4af37", 3);
  drawBone(ctx, lm[23], lm[24], "#d4af37", 3);

  // Руки (выделяются при отжиманиях)
  const armColor = currentExercise === 'pushup' ? activeColor : "#d4af37";
  drawBone(ctx, lm[11], lm[13], armColor, 5); drawBone(ctx, lm[13], lm[15], armColor, 5);
  drawBone(ctx, lm[12], lm[14], armColor, 5); drawBone(ctx, lm[14], lm[16], armColor, 5);

  // Ноги (выделяются при приседаниях)
  const legColor = currentExercise === 'squat' ? activeColor : "#d4af37";
  drawBone(ctx, lm[23], lm[25], legColor, 5); drawBone(ctx, lm[25], lm[27], legColor, 5);
  drawBone(ctx, lm[24], lm[26], legColor, 5); drawBone(ctx, lm[26], lm[28], legColor, 5);

  // Суставы
  [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(idx => drawJointPoint(ctx, lm[idx]));
}

function processPose(landmarks, ctx) {
  const statusEl = document.getElementById('pose-status');
  const cfg = CONFIG[currentExercise];
  let A, B, C;
  if (currentExercise === 'pushup') { A = landmarks[11]; B = landmarks[13]; C = landmarks[15]; } 
  else { A = landmarks[23]; B = landmarks[25]; C = landmarks[27]; }

  if (!A || !B || !C || A.visibility < 0.4) {
    statusEl.innerText = "ВСТАНЬТЕ В КАДР"; statusEl.style.color = "#f02a2a";
    drawFullSkeleton(ctx, landmarks, "#555"); // Отрисовка серым, если игрок вне позиции
    return;
  }
  
  const currentAngle = calculateAngle(A, B, C);
  const floorDistPct = landmarks[0] ? Math.round((1 - landmarks[0].y) * 100) : 100;
  
  document.getElementById('live-angle-val').innerText = currentAngle;
  document.getElementById('angle-meter-fill').style.width = `${Math.min(100, (currentAngle/180)*100)}%`;

  // Подсветка скелета
  const activeColor = currentAngle <= cfg.downAngle ? "#39e079" : "#ffef9f";
  drawFullSkeleton(ctx, landmarks, activeColor);

  if (currentAngle >= cfg.upAngle) { poseState.stage = "UP"; statusEl.innerText = "ГОТОВ (ОПУСКАЙСЯ)"; statusEl.style.color = "#ffef9f"; }
  if (currentAngle <= cfg.downAngle && floorDistPct <= cfg.maxFloorDistPct && poseState.stage === "UP") {
    poseState.stage = "DOWN"; statusEl.innerText = "ОТЛИЧНО! ВСТАВАЙ!"; statusEl.style.color = "#39e079";
    if (typeof onRepCompleted === 'function') onRepCompleted(currentExercise);
  }
}

// Запрашивает доступ к камере и один раз поднимает поток + модель.
// Безопасно вызывать много раз — реально отработает только первый вызов за сессию.
function initCamera() {
  if (cameraRequested) return; // камеру уже просили — не спрашиваем повторно
  cameraRequested = true;

  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const canvasCtx = canvasElement.getContext('2d');

  if (typeof Pose === 'undefined' || typeof Camera === 'undefined') {
    console.error("MediaPipe не загружен");
    const statusEl = document.getElementById('pose-status');
    if (statusEl) { statusEl.innerText = "Сбой загрузки ядра"; statusEl.style.color = "#f02a2a"; }
    cameraRequested = false; // даём шанс попробовать снова
    return;
  }

  globalPose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
  globalPose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

  globalPose.onResults((results) => {
    if (!window.__arenaActive) return; // не тратим время на отрисовку вне боя

    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
      processPose(results.poseLandmarks, canvasCtx);
    }
  });

  activeCamera = new Camera(videoElement, {
    onFrame: async () => {
      // Пока пользователь не на вкладке "Бой" — не гоняем кадры через модель,
      // это экономит батарею. Сам видеопоток при этом НЕ останавливаем и НЕ
      // пересоздаём, поэтому при возврате на вкладку камера включается мгновенно,
      // без повторного запроса разрешения и без пересоздания источника.
      if (!window.__arenaActive) return;
      // ГЛАВНЫЙ ФИКС: не отправляем следующий кадр, пока не обработан предыдущий —
      // именно отсутствие этой защиты раньше приводило к зависанию картинки.
      if (isProcessing) return;
      isProcessing = true;
      try {
        await globalPose.send({ image: videoElement });
      } catch (err) {
        console.error("Ошибка ИИ:", err);
      } finally {
        isProcessing = false;
      }
    },
    facingMode: 'user', width: 640, height: 480
  });

  activeCamera.start().catch(err => {
    console.error("Камера недоступна:", err);
    const statusEl = document.getElementById('pose-status');
    if (statusEl) { statusEl.innerText = "Доступ к камере закрыт"; statusEl.style.color = "#f02a2a"; }
    cameraRequested = false; // разрешаем повторную попытку (например, по кнопке рестарта)
  });
}

window.initCamera = initCamera;

// Заглушки для совместимости, если где-то в app.js ещё остались вызовы
// stopCamera()/restartCamera() из старой логики с пересозданием потока —
// теперь поток камеры не разрушается и не пересоздаётся при переключении вкладок,
// поэтому эти функции ничего не ломают и просто не нужны по сути.
window.stopCamera = function() {};
window.restartCamera = function() { initCamera(); };
