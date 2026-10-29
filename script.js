const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const boardEl = document.querySelector(".board");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");

const TILE = 20;
const COLS = canvas.width / TILE;
const ROWS = canvas.height / TILE;

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake, dir, nextDir, food, score, level, timer, running, paused;
let particles = [];
let best = 0;
try {
  best = Number(localStorage.getItem("cobrinha-recorde")) || 0;
} catch (e) {}
bestEl.textContent = best;

/* ---------- lógica ---------- */

function reset() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  dir = DIRS.right;
  nextDir = dir;
  score = 0;
  level = 1;
  paused = false;
  particles = [];
  scoreEl.textContent = 0;
  levelEl.textContent = 1;
  placeFood();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
}

function speed() {
  return Math.max(60, 130 - (level - 1) * 8);
}

function startLoop() {
  clearInterval(timer);
  timer = setInterval(tick, speed());
}

function start() {
  reset();
  overlay.classList.add("hidden");
  running = true;
  startLoop();
}

function gameOver() {
  running = false;
  clearInterval(timer);
  boardEl.classList.remove("shake");
  void boardEl.offsetWidth;
  boardEl.classList.add("shake");

  const novoRecorde = score > best;
  if (novoRecorde) {
    best = score;
    bestEl.textContent = best;
    try {
      localStorage.setItem("cobrinha-recorde", best);
    } catch (e) {}
  }

  overlayTitle.textContent = novoRecorde ? "Novo recorde! 🏆" : "Fim de jogo";
  overlayText.textContent = `Você fez ${score} pontos`;
  startBtn.textContent = "↻ Jogar de novo";
  overlay.classList.remove("hidden");
}

function bump(el) {
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}

function tick() {
  if (paused) return;

  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
  const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
  if (hitWall || hitSelf) return gameOver();

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    bump(scoreEl);
    burst(food.x, food.y);

    const novoNivel = Math.floor(score / 50) + 1;
    if (novoNivel !== level) {
      level = novoNivel;
      levelEl.textContent = level;
      bump(levelEl);
      startLoop();
    }
    placeFood();
  } else {
    snake.pop();
  }
}

/* ---------- partículas ---------- */

function burst(gx, gy) {
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 1 + Math.random() * 2.5;
    particles.push({
      x: gx * TILE + TILE / 2,
      y: gy * TILE + TILE / 2,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 1,
    });
  }
}

/* ---------- desenho ---------- */

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGrid() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#162033" : "#1a2740";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

function drawFood(t) {
  const cx = food.x * TILE + TILE / 2;
  const cy = food.y * TILE + TILE / 2;
  const pulse = 1 + Math.sin(t / 180) * 0.08;
  const r = (TILE / 2 - 2) * pulse;

  ctx.save();
  ctx.shadowColor = "rgba(248, 113, 113, 0.9)";
  ctx.shadowBlur = 14;
  const g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, r);
  g.addColorStop(0, "#fca5a5");
  g.addColorStop(1, "#dc2626");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy + 1, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // folhinha
  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - r + 1, 4, 2, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  const total = snake.length;

  for (let i = total - 1; i >= 0; i--) {
    const s = snake[i];
    const t = i / Math.max(total - 1, 1);
    const light = 55 - t * 18;
    const pad = i === 0 ? 0.5 : 1.5 + t * 1.5;

    ctx.save();
    if (i === 0) {
      ctx.shadowColor = "rgba(74, 222, 128, 0.8)";
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = `hsl(${142 - t * 12}, 70%, ${light}%)`;
    roundRect(
      s.x * TILE + pad,
      s.y * TILE + pad,
      TILE - pad * 2,
      TILE - pad * 2,
      i === 0 ? 8 : 6
    );
    ctx.fill();
    ctx.restore();
  }

  drawEyes();
}

function drawEyes() {
  const h = snake[0];
  const cx = h.x * TILE + TILE / 2;
  const cy = h.y * TILE + TILE / 2;

  // olhos ficam perpendiculares à direção
  const px = -dir.y;
  const py = dir.x;
  const fx = dir.x * 3;
  const fy = dir.y * 3;

  [-1, 1].forEach((side) => {
    const ex = cx + fx + px * 4 * side;
    const ey = cy + fy + py * 4 * side;

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex, ey, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(ex + dir.x * 1, ey + dir.y * 1, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawParticles() {
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.04;
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = "#f87171";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5 * p.life + 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  particles = particles.filter((p) => p.life > 0);
}

function render(t = 0) {
  drawGrid();
  drawFood(t);
  drawSnake();
  drawParticles();
  requestAnimationFrame(render);
}

/* ---------- controles ---------- */

function setDirection(name) {
  const d = DIRS[name];
  if (d.x === -dir.x && d.y === -dir.y) return; // sem virar 180°
  nextDir = d;
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    overlayTitle.textContent = "Pausado";
    overlayText.textContent = "Pressione Espaço para continuar";
    startBtn.textContent = "▶ Continuar";
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

document.addEventListener("keydown", (e) => {
  const map = {
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
  };

  if (e.code === "Space") {
    e.preventDefault();
    return togglePause();
  }

  if (map[e.key]) {
    e.preventDefault();
    if (!running) start();
    setDirection(map[e.key]);
  }
});

startBtn.addEventListener("click", () => {
  if (paused) togglePause();
  else start();
});

document.querySelectorAll(".controls button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!running) start();
    setDirection(btn.dataset.dir);
  });
});

// deslizar o dedo no celular
let touchStart = null;
canvas.addEventListener("touchstart", (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
canvas.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (!running) start();
  if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? "right" : "left");
  else setDirection(dy > 0 ? "down" : "up");
});

reset();
render();
