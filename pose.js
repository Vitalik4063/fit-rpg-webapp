let poseState = { stage: "UP", exercise: "pushup" };
const savedSettings = (() => { try { return JSON.parse(localStorage.getItem('fit_dark_settings') || '{}'); } catch(e) { return {}; } })();
const DIFFICULTY_ADJUST = { beginner: 10, medium: 0, pro: -10 }[savedSettings.fitnessLevel] || 0;
const FLOOR_ADJUST = savedSettings.fitnessLevel === 'beginner' ? 10 : 0;

const CONFIG = {
  pushup: { downAngle: 90 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 40 + FLOOR_ADJUST },
  squat:  { downAngle: 100 + DIFFICULTY_ADJUST, upAngle: 155, maxFloorDistPct: 50 + FLOOR_ADJUST }
};

let globalPose = null; // Глобальный инстанс сети

function resetExerciseStage() { poseState.stage = "UP"; }

function calculateAngle(A, B, C) {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle);
}

function drawBone(ctx, p1, p2, color = "#00e5ff", width = 4) {
  if (!p1 || !p2 || p1.visibility < 0.3 || p2.visibility < 0.3) return;
  ctx.beginPath();
  ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
  ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawJointPoint(ctx, p, color = "#9d4edd", radius = 5) {
  if (!p || p.visibility < 0.3) return;
  ctx.beginPath();
  ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFullSkeleton(ctx, lm, activeColor) {
  drawBone(ctx, lm[11], lm[12], "#5a189a", 3);
  drawBone(ctx, lm[11], lm[23], "#5a189a", 3);
  drawBone(ctx, lm[12], lm[24], "#5a189a", 3);
  drawBone(ctx, lm[23], lm[24], "#5a189a", 3);

  const armColor = currentExercise === 'pushup' ? activeColor : "#5a189a";
  drawBone(ctx, lm[11], lm[13], armColor, 5); drawBone(ctx, lm[13], lm[15], armColor, 5);
  drawBone(ctx, lm[12], lm[14], armColor, 5); drawBone(ctx, lm[14], lm[16], armColor, 5);

  const legColor = currentExercise === 'squat' ? activeColor : "#5a189a";
  drawBone(ctx, lm[23], lm[25], legColor, 5); drawBone(ctx, lm[25], lm[27], legColor, 5);
  drawBone(ctx, lm[24], lm[26], legColor, 5); drawBone(ctx, lm[26], lm[28], legColor, 5);

  [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(idx => drawJointPoint(ctx, lm[idx]));
}

function processPose(landmarks, ctx) {
  const statusEl = document.getElementById('pose-status');
  const cfg = CONFIG[currentExercise];
  let A, B, C;
  if (currentExercise === 'pushup') { A = landmarks[11]; B = landmarks[13]; C = landmarks[15]; } 
  else { A = landmarks[23]; B = landmarks[25]; C = landmarks[27]; }

  if (!A || !B || !C || A.visibility < 0.4) {
    statusEl.innerText = "Ищу тебя в кадре..."; statusEl.style.color = "#8888a0";
    drawFullSkeleton(ctx, landmarks, "#333"); 
    return;
  }
  
  const currentAngle = calculateAngle(A, B, C);
  const floorDistPct = landmarks[0] ? Math.round((1 - landmarks[0].y) * 100) : 100;
  
  document.getElementById('live-angle-val').innerText = currentAngle;
  document.getElementById('angle-meter-fill').style.width = `${Math.min(100, (currentAngle/180)*100)}%`;

  const activeColor = currentAngle <= cfg.downAngle ? "#00e5ff" : "#9d4edd";
  drawFullSkeleton(ctx, landmarks, activeColor);

  if (currentAngle >= cfg.upAngle) { poseState.stage = "UP"; statusEl.innerText = "Опускайся"; statusEl.style.color = "#9d4edd"; }
  if (currentAngle <= cfg.downAngle && floorDistPct <= cfg.maxFloorDistPct && poseState.stage === "UP") {
    poseState.stage = "DOWN"; statusEl.innerText = "Вставай!"; statusEl.style.color = "#00e5ff";
    if (typeof onRepCompleted === 'function') onRepCompleted(currentExercise);
  }
}

// Функции управления камерой
window.stopCamera = function() {
  if (window.__activeCamera) {
    window.__activeCamera.stop();
    window.__activeCamera = null;
  }
  const videoElement = document.getElementById('webcam');
  if (videoElement && videoElement.srcObject) {
    videoElement.srcObject.getTracks().forEach(track => track.stop());
    videoElement.srcObject = null;
  }
}

window.restartCamera = function() {
  const statusEl = document.getElementById('pose-status');
  if(statusEl) { statusEl.innerText = "Запуск камеры..."; statusEl.style.color = "#00e5ff"; }
  stopCamera();
  setTimeout(initCamera, 400);
}

function initCamera() {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const canvasCtx = canvasElement.getContext('2d');
  
  if (typeof Pose === 'undefined' || typeof Camera === 'undefined') {
    console.error("MediaPipe не загружен"); return;
  }
  
  if (!globalPose) {
    globalPose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    globalPose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    
    globalPose.onResults((results) => {
      canvasElement.width = videoElement.videoWidth || 640;
      canvasElement.height = videoElement.videoHeight || 480;
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      
      if (results.poseLandmarks && window.__arenaActive) {
        processPose(results.poseLandmarks, canvasCtx);
      }
    });
  }

  window.__activeCamera = new Camera(videoElement, { 
    onFrame: async () => { 
      if (window.__arenaActive && videoElement.readyState >= 2) {
        await globalPose.send({ image: videoElement }); 
      }
    }, 
    facingMode: 'user', width: 640, height: 480 
  });
  
  window.__activeCamera.start().catch(err => {
    const statusEl = document.getElementById('pose-status');
    if(statusEl) { statusEl.innerText = "Камера заблокирована"; statusEl.style.color = "#ff2a40"; }
  });
}
