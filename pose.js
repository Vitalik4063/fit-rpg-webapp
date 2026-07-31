let poseState = {
  stage: "UP",      // "UP" (extension) or "DOWN" (flexion)
  exercise: "pushup"
};

const THRESHOLDS = {
  pushup: { down: 90, up: 150 },
  squat:  { down: 100, up: 155 }
};

function resetExerciseStage() {
  poseState.stage = "UP";
}

// Calculate angle between three joint coordinates (A-B-C)
function calculateAngle(A, B, C) {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return Math.round(angle);
}

// Draw skeleton bone lines on canvas
function drawLine(ctx, p1, p2, color = "#00ff00", width = 3) {
  ctx.beginPath();
  ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
  ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// Draw joint point circle on canvas
function drawJoint(ctx, p, color = "#ff0000", radius = 5) {
  ctx.beginPath();
  ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function updateAngleHUD(currentAngle, targetThreshold) {
  const liveValEl = document.getElementById('live-angle-val');
  const fillEl = document.getElementById('angle-meter-fill');
  const labelEl = document.getElementById('angle-target-label');
  const targetLineEl = document.getElementById('angle-target-line');

  if (liveValEl) liveValEl.innerText = currentAngle;
  
  // Percentage calculation (0 to 180 deg)
  const pct = Math.min(100, Math.max(0, (currentAngle / 180) * 100));
  if (fillEl) {
    fillEl.style.width = `${pct}%`;
    fillEl.style.backgroundColor = currentAngle <= targetThreshold ? "#00ff00" : "#ff9900";
  }

  const targetPct = (targetThreshold / 180) * 100;
  if (targetLineEl) targetLineEl.style.left = `${targetPct}%`;
  if (labelEl) labelEl.innerText = `ЦЕЛЬ: ≤ ${targetThreshold}°`;
}

function processPose(landmarks, ctx) {
  const statusEl = document.getElementById('pose-status');
  const targetThreshold = THRESHOLDS[currentExercise].down;
  const upThreshold = THRESHOLDS[currentExercise].up;

  let A, B, C;

  if (currentExercise === 'pushup') {
    // Left arm: 11 (Shoulder), 13 (Elbow), 15 (Wrist)
    A = landmarks[11]; B = landmarks[13]; C = landmarks[15];
  } else {
    // Left leg: 23 (Hip), 25 (Knee), 27 (Ankle)
    A = landmarks[23]; B = landmarks[25]; C = landmarks[27];
  }

  // 1. STRICT VISIBILITY CHECK (Ignore movement if confidence < 0.6)
  if (!A || !B || !C || A.visibility < 0.6 || B.visibility < 0.6 || C.visibility < 0.6) {
    statusEl.innerText = "ВСТАНЬТЕ В КАДР";
    statusEl.style.color = "#ff0000";
    return;
  }

  // 2. DRAW SKELETON OVERLAY
  const boneColor = poseState.stage === "DOWN" ? "#00ff00" : "#ffcc00";
  drawLine(ctx, A, B, boneColor, 4);
  drawLine(ctx, B, C, boneColor, 4);
  drawJoint(ctx, A, "#ffffff", 6);
  drawJoint(ctx, B, "#ff0000", 7);
  drawJoint(ctx, C, "#ffffff", 6);

  // 3. ANGLE CALCULATIONS
  const currentAngle = calculateAngle(A, B, C);
  updateAngleHUD(currentAngle, targetThreshold);

  // 4. STRICT FINITE STATE MACHINE (UP -> DOWN -> UP)
  if (currentAngle >= upThreshold) {
    poseState.stage = "UP";
    statusEl.innerText = "ГОТОВ (ОПУСКАЙСЯ)";
    statusEl.style.color = "#ffcc00";
  }

  if (currentAngle <= targetThreshold && poseState.stage === "UP") {
    poseState.stage = "DOWN";
    statusEl.innerText = "ГЛУБОКО! ВСТАВАЙ!";
    statusEl.style.color = "#00ff00";
    
    // Register hit ONLY when valid depth reached
    onRepCompleted(currentExercise);
  }
}

function initCamera() {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('canvas');
  const canvasCtx = canvasElement.getContext('2d');

  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.65
  });

  pose.onResults((results) => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Render raw video stream
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
      processPose(results.poseLandmarks, canvasCtx);
    }
  });

  const camera = new Camera(videoElement, {
    onFrame: async () => { await pose.send({ image: videoElement }); },
    width: 640,
    height: 480
  });
  camera.start();
}
