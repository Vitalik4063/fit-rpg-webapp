let poseStage = "up";
let currentAngle = 0;

// Расчет угла между 3 точками
function calculateAngle(A, B, C) {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return Math.round(angle);
}

function resetExerciseStage() { poseStage = "up"; }

// Отрисовка скелета и угломера на Canvas
function drawSkeletonAndAngle(ctx, landmarks, width, height) {
  let p1, p2, p3, targetAngleName;

  if (currentExercise === 'pushup') {
    // 11: Плечо, 13: Локоть, 15: Запястье
    p1 = landmarks[11]; p2 = landmarks[13]; p3 = landmarks[15];
    targetAngleName = "Локоть";
  } else {
    // 23: Бедро, 25: Колено, 27: Лодыжка
    p1 = landmarks[23]; p2 = landmarks[25]; p3 = landmarks[27];
    targetAngleName = "Колено";
  }

  // Проверка видимости суставов (исключает ложные срабатывания при движении камеры)
  if (!p1 || !p2 || !p3 || p1.visibility < 0.65 || p2.visibility < 0.65 || p3.visibility < 0.65) {
    document.getElementById('angle-display').innerText = "Ищите кадр...";
    document.getElementById('angle-display').style.color = "#ff3333";
    return;
  }

  // Расчет текущего угла
  currentAngle = calculateAngle(p1, p2, p3);
  document.getElementById('angle-display').innerText = `${currentAngle}° (${targetAngleName})`;

  // Координаты на Canvas
  const x1 = p1.x * width, y1 = p1.y * height;
  const x2 = p2.x * width, y2 = p2.y * height;
  const x3 = p3.x * width, y3 = p3.y * height;

  // 1. Отрисовка линий суставов
  ctx.lineWidth = 5;
  ctx.strokeStyle = (poseStage === "down") ? "#00ff00" : "#ffcc00"; // Зеленый при сгибании
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.stroke();

  // 2. Отрисовка суставных точек
  [p1, p2, p3].forEach(p => {
    ctx.fillStyle = "#ff2200";
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, 7, 0, 2 * Math.PI);
    ctx.fill();
  });

  // 3. Отрисовка Дуги и Значения Угла над центральным суставом
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Courier New";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 5;
  ctx.fillText(`${currentAngle}°`, x2 + 15, y2 - 15);

  // 4. Логика фиксации отжиманий / приседаний
  const targetMinAngle = (currentExercise === 'pushup') ? 90 : 100;
  
  if (currentAngle > 155) {
    poseStage = "up";
    document.getElementById('angle-display').style.color = "#f1c40f";
  }
  
  // Четкое достижение нужного угла
  if (currentAngle <= targetMinAngle && poseStage === "up") {
    poseStage = "down";
    document.getElementById('angle-display').style.color = "#00ff00";
    onRepCompleted(currentExercise); // Вызов нанесения урона
  }
}

function initCamera() {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const canvasCtx = canvasElement.getContext('2d');

  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.65 });

  pose.onResults((results) => {
    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
      drawSkeletonAndAngle(canvasCtx, results.poseLandmarks, canvasElement.width, canvasElement.height);
    }
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => { await pose.send({ image: videoElement }); },
    width: 640, height: 480
  });
  camera.start();
}
