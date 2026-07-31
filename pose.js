let poseState = {
  stage: "UP",
  exercise: "pushup"
};

// Сложность трекинга подстраивается под ранг воина, выбранный на онбординге:
// новичкам — более мягкий угол опускания, продвинутым — требуется более глубокая амплитуда.
const savedSettings = (() => {
  try { return JSON.parse(localStorage.getItem('fit_dark_settings') || '{}'); }
  catch (e) { return {}; }
})();
const DIFFICULTY_ADJUST = { beginner: 10, medium: 0, pro: -10 }[savedSettings.fitnessLevel] || 0;
const FLOOR_ADJUST = savedSettings.fitnessLevel === 'beginner' ? 10 : 0;

const CONFIG = {
  pushup: { downAngle: 90 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 40 + FLOOR_ADJUST },
  squat:  { downAngle: 100 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 50 + FLOOR_ADJUST }
};

function resetExerciseStage() {
  poseState.stage = "UP";
}

function calculateAngle(A, B, C) {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle);
}

function drawBone(ctx, p1, p2, color = "#c9a050", width = 3) {
  if (!p1 || !p2 || p1.visibility < 0.4 || p2.visibility < 0.4) return;
  ctx.beginPath();
  ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
  ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawJointPoint(ctx, p, color = "#c93b3b", radius = 5) {
  if (!p || p.visibility < 0.4) return;
  ctx.beginPath();
  ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawAngleArc(ctx, B, angle, targetAngle) {
  if (!B || B.visibility < 0.4) return;
  const x = B.x * ctx.canvas.width;
  const y = B.y * ctx.canvas.height;
  const isReached = angle <= targetAngle;
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, (angle * Math.PI) / 180, false);
  ctx.strokeStyle = isReached ? "#2ecc71" : "#c93b3b";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = "bold 13px Georgia";
  ctx.fillStyle = isReached ? "#2ecc71" : "#c9a050";
  ctx.fillText(`${angle}°`, x + 12, y - 12);
  ctx.restore();
}

// ОХВАТЫВАЕТ ВЕСЬ СКЕЛЕТ (РУКИ, НОГИ, ТОРС)
function drawFullSkeleton(ctx, lm, activeColor) {
  // Плечи и Торс
  drawBone(ctx, lm[11], lm[12], "#c9a050", 3);
  drawBone(ctx, lm[11], lm[23], "#c9a050", 3);
  drawBone(ctx, lm[12], lm[24], "#c9a050", 3);
  drawBone(ctx, lm[23], lm[24], "#c9a050", 3);

  // Руки
  const armColor = currentExercise === 'pushup' ? activeColor : "#c9a050";
  drawBone(ctx, lm[11], lm[13], armColor, 4);
  drawBone(ctx, lm[13], lm[15], armColor, 4);
  drawBone(ctx, lm[12], lm[14], armColor, 4);
  drawBone(ctx, lm[14], lm[16], armColor, 4);

  // Ноги
  const legColor = currentExercise === 'squat' ? activeColor : "#c9a050";
  drawBone(ctx, lm[23], lm[25], legColor, 4);
  drawBone(ctx, lm[25], lm[27], legColor, 4);
  drawBone(ctx, lm[24], lm[26], legColor, 4);
  drawBone(ctx, lm[26], lm[28], legColor, 4);

  // Суставы
  [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(idx => {
    drawJointPoint(ctx, lm[idx], "#c93b3b", 4);
  });
}

function updateAngleHUD(angle, targetAngle, floorDistPct) {
  const liveVal = document.getElementById('live-angle-val');
  const floorVal = document.getElementById('floor-dist-val');
  if (liveVal) liveVal.innerText = angle;
  if (floorVal) floorVal.innerText = floorDistPct;

  const fillEl = document.getElementById('angle-meter-fill');
  const pct = Math.min(100, Math.max(0, (angle / 180) * 100));
  if (fillEl) {
    fillEl.style.width = `${pct}%`;
    fillEl.style.backgroundColor = angle <= targetAngle ? "#2ecc71" : "#c93b3b";
  }

  const markerEl = document.getElementById('angle-target-marker');
  if (markerEl) markerEl.style.left = `${(targetAngle / 180) * 100}%`;
}

function processPose(landmarks, ctx) {
  const statusEl = document.getElementById('pose-status');
  const cfg = CONFIG[currentExercise];

  let A, B, C;
  if (currentExercise === 'pushup') {
    A = landmarks[11]; B = landmarks[13]; C = landmarks[15];
  } else {
    A = landmarks[23]; B = landmarks[25]; C = landmarks[27];
  }

  if (!A || !B || !C || A.visibility < 0.4 || B.visibility < 0.4 || C.visibility < 0.4) {
    statusEl.innerText = "ВСТАНЬТЕ В КАДР";
    statusEl.style.color = "#c93b3b";
    drawFullSkeleton(ctx, landmarks, "#666666");
    return;
  }

  const currentAngle = calculateAngle(A, B, C);
  const nose = landmarks[0];
  const floorDistPct = nose ? Math.round((1 - nose.y) * 100) : 100;

  if (currentExercise === 'pushup') {
    const hip = landmarks[23];
    const isPlank = Math.abs(A.y - hip.y) < 0.40;
    if (!isPlank) {
      statusEl.innerText = "ПРИНЯТЬ УПОР ЛЁЖА!";
      statusEl.style.color = "#c9a050";
      drawFullSkeleton(ctx, landmarks, "#c9a050");
      return;
    }
  }

  const activeColor = currentAngle <= cfg.downAngle ? "#2ecc71" : "#c9a050";
  drawFullSkeleton(ctx, landmarks, activeColor);
  drawAngleArc(ctx, B, currentAngle, cfg.downAngle);
  updateAngleHUD(currentAngle, cfg.downAngle, floorDistPct);

  if (currentAngle >= cfg.upAngle) {
    poseState.stage = "UP";
    statusEl.innerText = "ГОТОВ (ОПУСКАЙСЯ)";
    statusEl.style.color = "#c9a050";
  }

  if (currentAngle <= cfg.downAngle && floorDistPct <= cfg.maxFloorDistPct && poseState.stage === "UP") {
    poseState.stage = "DOWN";
    statusEl.innerText = "ОТЛИЧНО! ВСТАВАЙ!";
    statusEl.style.color = "#2ecc71";
    onRepCompleted(currentExercise);
  }
}

// НАДЕЖНАЯ ИНИЦИАЛИЗАЦИЯ КАМЕРЫ ДЛЯ MOBILE & TELEGRAM
function initCamera() {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const canvasCtx = canvasElement.getContext('2d');
  const statusEl = document.getElementById('pose-status');

  const setStatus = (text, color) => {
    if (!statusEl) return;
    statusEl.innerText = text;
    statusEl.style.color = color;
  };

  // Проверка, что скрипты MediaPipe вообще успели загрузиться с CDN
  // (в РФ jsdelivr.net иногда режется ТСПУ/DPI — тогда Pose/Camera будут undefined)
  if (typeof Pose === 'undefined' || typeof Camera === 'undefined') {
    setStatus("ОШИБКА ЗАГРУЗКИ MEDIAPIPE (CDN)", "#c93b3b");
    console.error("MediaPipe Pose/Camera не определены — не загрузились скрипты с cdn.jsdelivr.net");
    return;
  }

  // Проверка контекста безопасности — getUserMedia требует HTTPS (кроме localhost)
  if (!window.isSecureContext) {
    setStatus("ТРЕБУЕТСЯ HTTPS ДЛЯ КАМЕРЫ", "#c93b3b");
    console.error("Страница открыта не по HTTPS — доступ к камере заблокирован браузером");
    return;
  }

  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  let canvasSized = false;

  pose.onResults((results) => {
    // Размер канваса выставляем один раз, когда реально известны размеры видео,
    // а не на каждом кадре — постоянный resize сбрасывал состояние канваса и грузил CPU
    if (!canvasSized && videoElement.videoWidth) {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      canvasSized = true;
    } else if (!canvasElement.width) {
      canvasElement.width = 640;
      canvasElement.height = 480;
    }

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Обрабатываем повторы и рисуем скелет только когда открыта вкладка "Бой" —
    // так в лагере/лавке/трофеях повторения не засчитываются в фоне и не тратится CPU.
    if (results.poseLandmarks && window.__arenaActive) {
      processPose(results.poseLandmarks, canvasCtx);
    }
  });

  setStatus("ЗАПРОС ДОСТУПА К КАМЕРЕ...", "#c9a050");

  // ВАЖНО: единственная точка запроса медиапотока — через утилиту Camera из MediaPipe.
  // Раньше здесь ДОПОЛНИТЕЛЬНО вручную вызывался navigator.mediaDevices.getUserMedia(),
  // а затем ещё раз создавался Camera(...), который сам внутри себя тоже делает
  // getUserMedia() и переустанавливает videoElement.srcObject. Два параллельных запроса
  // потока — частая причина чёрного экрана/зависания камеры именно в WebView Telegram.
  // Поэтому весь захват потока отдан ТОЛЬКО объекту Camera.
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      try {
        await pose.send({ image: videoElement });
      } catch (err) {
        console.error("Ошибка обработки кадра pose:", err);
      }
    },
    facingMode: 'user',
    width: 640,
    height: 480
  });

  camera.start()
    .then(() => {
      setStatus("ИНИЦИАЛИЗАЦИЯ...", "#c9a050");
    })
    .catch((err) => {
      console.error("Ошибка запуска камеры:", err);
      setStatus("ОШИБКА ДОСТУПА К КАМЕРЕ", "#c93b3b");
      alert("Не удалось получить доступ к камере.\nПроверьте разрешения камеры в настройках Telegram / браузера и перезапустите приложение.");
    });

  // Останавливаем поток при закрытии/сворачивании WebApp, чтобы камера
  // не оставалась захваченной и не мешала повторному запуску
  window.addEventListener('beforeunload', () => {
    try { camera.stop(); } catch (e) {}
    const stream = videoElement.srcObject;
    if (stream && stream.getTracks) {
      stream.getTracks().forEach(track => track.stop());
    }
  });

  window.__activeCamera = camera;
}
