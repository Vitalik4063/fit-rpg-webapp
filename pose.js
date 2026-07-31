let poseStage = "up";

function calculateAngle(A, B, C) {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

function resetExerciseStage() { poseStage = "up"; }

// АВТОМАТИЧЕСКИЙ АНАЛИЗ ПОЛОЖЕНИЯ ТЕЛА С КАМЕРЫ
function processPoseLandmarks(landmarks) {
  const statusEl = document.getElementById('pose-status');

  if (currentExercise === 'pushup') {
    // Точки: Плечо (11), Локоть (13), Запястье (15)
    const shoulder = landmarks[11], elbow = landmarks[13], wrist = landmarks[15];
    if (shoulder && elbow && wrist) {
      const angle = calculateAngle(shoulder, elbow, wrist);

      if (angle > 160) {
        poseStage = "up";
        statusEl.innerText = "Опускайся..."; statusEl.style.color = "#f1c40f";
      }
      // Опускание в отжимание (< 90 градусов в локте)
      if (angle < 90 && poseStage === "up") {
        poseStage = "down";
        statusEl.innerText = "ОТЖИМАНИЕ!"; statusEl.style.color = "#2ecc71";
        onRepCompleted('pushup'); // Авто-урон врагу
      }
    }
  } else if (currentExercise === 'squat') {
    // Точки: Бедро (23), Колено (25), Лодыжка (27)
    const hip = landmarks[23], knee = landmarks[25], ankle = landmarks[27];
    if (hip && knee && ankle) {
      const angle = calculateAngle(hip, knee, ankle);

      if (angle > 160) {
        poseStage = "up";
        statusEl.innerText = "Приседай..."; statusEl.style.color = "#f1c40f";
      }
      // Приседание (< 100 градусов в колене)
      if (angle < 100 && poseStage === "up") {
        poseStage = "down";
        statusEl.innerText = "ПРИСЕДАНИЕ!"; statusEl.style.color = "#2ecc71";
        onRepCompleted('squat'); // Авто-урон врагу
      }
    }
  }
}

function initCamera() {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const canvasCtx = canvasElement.getContext('2d');

  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5 });

  pose.onResults((results) => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) processPoseLandmarks(results.poseLandmarks);
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => { await pose.send({ image: videoElement }); },
    width: 640, height: 480
  });
  camera.start();
}