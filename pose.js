let poseState = { stage: "UP", exercise: "pushup" };
const savedSettings = (() => { try { return JSON.parse(localStorage.getItem('fit_dark_settings') || '{}'); } catch(e) { return {}; } })();
const DIFFICULTY_ADJUST = { beginner: 10, medium: 0, pro: -10 }[savedSettings.fitnessLevel] || 0;
const FLOOR_ADJUST = savedSettings.fitnessLevel === 'beginner' ? 10 : 0;

const CONFIG = {
  pushup: { downAngle: 90 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 40 + FLOOR_ADJUST },
  squat:  { downAngle: 100 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 50 + FLOOR_ADJUST }
};

// --- КАМЕРА: ПОЛНОСТЬЮ РУЧНАЯ РЕАЛИЗАЦИЯ ---
// Раньше поток запускался через класс Camera из @mediapipe/camera_utils.
// Это старая, давно не обновлявшаяся обёртка, у которой есть известные проблемы
// именно внутри мобильных WebView (в т.ч. Telegram): она может не поднять поток
// без внятной ошибки, использовать constraints, которые устройство не поддерживает
// (OverconstrainedError), и не даёт понятной диагностики.
// Здесь мы получаем поток сами через getUserMedia, с постепенным ослаблением
// требований к камере, и гоним кадры в модель через собственный requestAnimationFrame
// цикл с защитой от параллельной обработки. Плюс любая ошибка на любом этапе
// теперь пишется прямо в статус на экране, а не тонет в консоли. Тупил жёстко здесь, надо обдумать!!!
let globalPose = null;
let isProcessing = false;
let cameraRequested = false; // защищает от повторных попыток за один и тот же "заход"
let rafId = null;

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
    if (typeof onRepCompleted === 'function') onRepCompleted(currentExercise, currentAngle, cfg.downAngle);
  }
}

function setStatus(text, color) {
  const statusEl = document.getElementById('pose-status');
  if (statusEl) { statusEl.innerText = text; statusEl.style.color = color; }
}

// Пробуем получить поток камеры, постепенно ослабляя требования — некоторые
// устройства/вебвью не поддерживают "точные" constraints и падают с
// OverconstrainedError, хотя камера у них есть и прекрасно работает.
async function getCameraStream() {
  const attempts = [
    { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
    { video: { facingMode: 'user' }, audio: false },
    { video: true, audio: false }
  ];
  let lastErr = null;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// Ждём, пока библиотека Pose реально проинициализируется в window.
// Раньше здесь была мгновенная проверка typeof Pose === 'undefined', и если
// скрипт библиотеки по любой причине ещё не успел выполниться (гонка загрузки,
// особенности сети/WebView), запрос камеры прерывался ДО показа системного
// диалога разрешения — из-за этого разрешение спрашивалось не с первого раза.
async function waitForPose(timeoutMs = 6000) {
  const start = Date.now();
  while (typeof Pose === 'undefined') {
    if (Date.now() - start > timeoutMs) return false;
    await new Promise(r => setTimeout(r, 100));
  }
  return true;
}

// Запрашивает доступ к камере и поднимает поток + модель. (Для себя чтобы не забыть
// Безопасно вызывать много раз — при успехе повторные вызовы ничего не делают,
// при неудаче следующий вызов (например, при повторном заходе на вкладку "Бой")
// честно пробует снова.
async function initCamera() {
  if (cameraRequested) return;
  cameraRequested = true;

  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const canvasCtx = canvasElement.getContext('2d');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus("Браузер не поддерживает камеру", "#f02a2a");
    cameraRequested = false;
    return;
  }

  // Сначала — разрешение камеры. Это самый важный шаг с системным диалогом,
  // и он не должен зависеть от того, успела ли уже прогрузиться модель.
  setStatus("Запрашиваем доступ к камере...", "#ffef9f");

  let stream;
  try {
    stream = await getCameraStream();
  } catch (err) {
    console.error("getUserMedia error:", err);
    if (err && err.name === 'NotAllowedError') setStatus("Доступ к камере запрещён. Разрешите в настройках", "#f02a2a");
    else if (err && err.name === 'NotFoundError') setStatus("Камера не найдена на устройстве", "#f02a2a");
    else if (err && err.name === 'NotReadableError') setStatus("Камера занята другим приложением", "#f02a2a");
    else setStatus("Не удалось включить камеру", "#f02a2a");
    cameraRequested = false;
    return;
  }

  videoElement.srcObject = stream;
  try { await videoElement.play(); } catch (e) { /* некоторые браузеры сами запускают autoplay */ }

  setStatus("Загружаем ИИ-модель...", "#ffef9f");

  const poseReady = await waitForPose();
  if (!poseReady) {
    setStatus("Не удалось загрузить ИИ-модель. Проверьте интернет", "#f02a2a");
    cameraRequested = false;
    return;
  }

  try {
    globalPose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    globalPose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  } catch (err) {
    console.error("Pose init error:", err);
    setStatus("Сбой загрузки ИИ-ядра", "#f02a2a");
    cameraRequested = false;
    return;
  }

  globalPose.onResults((results) => {
    if (!window.__arenaActive) return; // не трчу время на отрисовку вне боя

    // ЗАЩИТА: раньше ошибка в игровой логике (processPose -> onRepCompleted -> ...)
    // могла прервать этот колбэк исключением ПРЯМО ВНУТРИ обработки MediaPipe —
    // тогда promise от send() мог никогда не завершиться, isProcessing навсегда
    // оставался true, и камера "замирала" именно в момент засчитывания повтора.
    // Теперь любая ошибка здесь только логируется, но не вырывается наружу.
    try {
      canvasElement.width = videoElement.videoWidth || 640;
      canvasElement.height = videoElement.videoHeight || 480;
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.poseLandmarks) {
        processPose(results.poseLandmarks, canvasCtx);
      }
    } catch (err) {
      console.error("Ошибка обработки кадра (не блокирует камеру):", err);
    }
  });

  setStatus("Ищу тебя в кадре...", "#ffef9f");

  // Собственный цикл кадров вместо класса Camera. Защита isProcessing —
  // ГЛАВНЫЙ фикс: без неё кадры отправлялись в модель быстрее, чем она успевала
  // их обрабатывать, запросы копились друг на друга, и картинка "залипала".
  let lastSendStarted = 0;
  function frameLoop() {
    rafId = requestAnimationFrame(frameLoop);
    if (!window.__arenaActive) return;

    // ПОСЛЕДНИЙ ПРЕДОХРАНИТЕЛЬ: если кадр "завис" в обработке дольше 3с
    // (по любой причине — даже незамеченной сейчас), сами снимаем блокировку,
    // чтобы камера не могла зависнуть навсегда.
    if (isProcessing && lastSendStarted && (Date.now() - lastSendStarted > 3000)) {
      isProcessing = false;
    }
    if (isProcessing) return;
    if (videoElement.readyState < 2) return; // видео ещё не готово отдавать кадры

    isProcessing = true;
    lastSendStarted = Date.now();
    globalPose.send({ image: videoElement })
      .catch(err => console.error("Ошибка ИИ:", err))
      .finally(() => { isProcessing = false; });
  }
  if (rafId) cancelAnimationFrame(rafId);
  frameLoop();
}

window.initCamera = initCamera;

// Заглушки для совместимости со старым кодом, если где-то ещё вызываются
// stopCamera()/restartCamera() — поток камеры больше не разрушается и не
// пересоздаётся при переключении вкладок, поэтому реального действия не требуется.
window.stopCamera = function() {};
window.restartCamera = function() { initCamera(); };
