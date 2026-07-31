let poseState = { stage: "UP", exercise: "pushup" };
const savedSettings = (() => { try { return JSON.parse(localStorage.getItem('fit_dark_settings') || '{}'); } catch(e) { return {}; } })();
const DIFFICULTY_ADJUST = { beginner: 10, medium: 0, pro: -10 }[savedSettings.fitnessLevel] || 0;
const FLOOR_ADJUST = savedSettings.fitnessLevel === 'beginner' ? 10 : 0;

const CONFIG = {
  pushup: { downAngle: 90 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 40 + FLOOR_ADJUST },
  squat:  { downAngle: 100 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 50 + FLOOR_ADJUST }
};

function resetExerciseStage() { poseState.stage = "UP"; }

function calculateAngle(A, B, C) {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle);
}

function processPose(landmarks, ctx) {
  const statusEl = document.getElementById('pose-status');
  const cfg = CONFIG[currentExercise];
  let A, B, C;
  if (currentExercise === 'pushup') { A = landmarks[11]; B = landmarks[13]; C = landmarks[15]; } 
  else { A = landmarks[23]; B = landmarks[25]; C = landmarks[27]; }

  if (!A || !B || !C || A.visibility < 0.4) {
    statusEl.innerText = "ВСТАНЬТЕ В КАДР"; statusEl.style.color = "#c93b3b"; return;
  }
  const currentAngle = calculateAngle(A, B, C);
  const floorDistPct = landmarks[0] ? Math.round((1 - landmarks[0].y) * 100) : 100;
  
  document.getElementById('live-angle-val').innerText = currentAngle;
  document.getElementById('angle-meter-fill').style.width = `${Math.min(100, (currentAngle/180)*100)}%`;

  if (currentAngle >= cfg.upAngle) { poseState.stage = "UP"; statusEl.innerText = "ГОТОВ (ОПУСКАЙСЯ)"; statusEl.style.color = "#ffdf73"; }
  if (currentAngle <= cfg.downAngle && floorDistPct <= cfg.maxFloorDistPct && poseState.stage === "UP") {
    poseState.stage = "DOWN"; statusEl.innerText = "ОТЛИЧНО! ВСТАВАЙ!"; statusEl.style.color = "#2ecc71";
    if (typeof onRepCompleted === 'function') onRepCompleted(currentExercise);
  }
}

function initCamera() {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const canvasCtx = canvasElement.getContext('2d');
  if (typeof Pose === 'undefined' || typeof Camera === 'undefined') return;
  const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
  pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  pose.onResults((results) => {
    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.poseLandmarks && window.__arenaActive) processPose(results.poseLandmarks, canvasCtx);
  });
  const camera = new Camera(videoElement, { onFrame: async () => { await pose.send({ image: videoElement }); }, facingMode: 'user', width: 640, height: 480 });
  camera.start();
}
