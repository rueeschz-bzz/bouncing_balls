const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");

const gravitySlider = document.getElementById("gravitySlider");
const gravityValue = document.getElementById("gravityValue");
const radiusSlider = document.getElementById("radiusSlider");
const radiusValue = document.getElementById("radiusValue");
const bounceSlider = document.getElementById("bounceSlider");
const bounceValue = document.getElementById("bounceValue");
const chargeStrengthSlider = document.getElementById("chargeStrengthSlider");
const chargeStrengthValue = document.getElementById("chargeStrengthValue");
const electricToggle = document.getElementById("electricForceToggle");
const fieldLinesToggle = document.getElementById("fieldLinesToggle");
const collisionCountDisplay = document.getElementById("collisionCount");
const pauseBtn = document.getElementById("pauseBtn");

let balls = [];
let g = parseFloat(gravitySlider.value);
let currentRadius = parseInt(radiusSlider.value);
let bounceFactor = parseFloat(bounceSlider.value);
let chargeStrength = parseFloat(chargeStrengthSlider.value);
let collisionCount = 0;
let isPaused = false;

gravitySlider.oninput = () => {
    g = parseFloat(gravitySlider.value);
    gravityValue.textContent = g.toFixed(2);
};

radiusSlider.oninput = () => {
    currentRadius = parseInt(radiusSlider.value);
    radiusValue.textContent = currentRadius;
    balls.forEach(b => b.radius = currentRadius);
};

bounceSlider.oninput = () => {
    bounceFactor = parseFloat(bounceSlider.value);
    bounceValue.textContent = bounceFactor.toFixed(1);
};

chargeStrengthSlider.oninput = () => {
    chargeStrength = parseFloat(chargeStrengthSlider.value);
    chargeStrengthValue.textContent = chargeStrength;
};

pauseBtn.onclick = () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Fortsetzen" : "Pause";
};

function initBalls() {
    const total = parseInt(document.getElementById("ballCount").value);
    const half = Math.floor(total / 2);
    const posCount = total % 2 === 0 ? half : half + 1;
    const negCount = total - posCount;

    balls = [];
    collisionCount = 0;
    updateCollisionDisplay();

    const charges = [
        ...Array(posCount).fill(1),
        ...Array(negCount).fill(-1)
    ];

    for (let i = charges.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [charges[i], charges[j]] = [charges[j], charges[i]];
    }

    for (let charge of charges) {
        balls.push({
            x: Math.random() * (canvas.width - 2 * currentRadius) + currentRadius,
            y: Math.random() * (canvas.height - 2 * currentRadius) + currentRadius,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: currentRadius,
            charge: charge,
            color: charge > 0 ? "#ff4444" : "#4488ff"
        });
    }
}

function updateCollisionDisplay() {
    collisionCountDisplay.textContent = collisionCount;
}

function draw() {
    if (isPaused) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const k = chargeStrength;
    const minR = 10;
    const forces = balls.map(() => ({ fx: 0, fy: 0 }));

    if (fieldLinesToggle.checked) {
        const steps = 200;
        const step = 6;
        for (const b of balls) {
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
                let x = b.x + Math.cos(a) * b.radius;
                let y = b.y + Math.sin(a) * b.radius;
                context.beginPath();
                context.moveTo(x, y);
                for (let i = 0; i < steps; i++) {
                    let fx = 0, fy = 0;
                    for (const other of balls) {
                        const dx = x - other.x;
                        const dy = y - other.y;
                        const r = Math.max(Math.hypot(dx, dy), minR);
                        const f = (k * other.charge) / (r * r);
                        fx += f * dx / r;
                        fy += f * dy / r;
                    }
                    x += fx * step;
                    y += fy * step;
                    context.lineTo(x, y);
                }
                context.strokeStyle = b.charge > 0 ? "#ffcccc55" : "#ccccff55";
                context.lineWidth = 0.5;
                context.stroke();
            }
        }
    }

    if (electricToggle.checked) {
        for (let i = 0; i < balls.length; i++) {
            for (let j = 0; j < balls.length; j++) {
                if (i === j) continue;
                const b1 = balls[i], b2 = balls[j];
                const dx = b2.x - b1.x, dy = b2.y - b1.y;
                const r = Math.max(Math.hypot(dx, dy), minR);
                const f = (k * b1.charge * b2.charge) / (r * r);
                forces[i].fx += f * dx / r;
                forces[i].fy += f * dy / r;
            }
        }
    }

    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i], b2 = balls[j];
            const dx = b2.x - b1.x, dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b1.radius + b2.radius;
            if (dist < minDist) {
                const angle = Math.atan2(dy, dx);
                const overlap = 0.5 * (minDist - dist + 0.1);
                const cos = Math.cos(angle), sin = Math.sin(angle);
                b1.x -= overlap * cos;
                b1.y -= overlap * sin;
                b2.x += overlap * cos;
                b2.y += overlap * sin;
                [b1.vx, b2.vx] = [b2.vx * bounceFactor, b1.vx * bounceFactor];
                [b1.vy, b2.vy] = [b2.vy * bounceFactor, b1.vy * bounceFactor];
                collisionCount++;
                updateCollisionDisplay();
            }
        }
    }

    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        ball.vx += forces[i].fx;
        ball.vy += forces[i].fy + g;
        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.radius < 0) {
            ball.vx = Math.abs(ball.vx) * bounceFactor;
            ball.x = ball.radius;
        }
        if (ball.x + ball.radius > canvas.width) {
            ball.vx = -Math.abs(ball.vx) * bounceFactor;
            ball.x = canvas.width - ball.radius;
        }
        if (ball.y - ball.radius < 0) {
            ball.vy = Math.abs(ball.vy) * bounceFactor;
            ball.y = ball.radius;
        }
        if (ball.y + ball.radius > canvas.height) {
            ball.vy = -Math.abs(ball.vy) * bounceFactor;
            ball.y = canvas.height - ball.radius;
        }

        context.beginPath();
        context.fillStyle = ball.color;
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fill();

        if (electricToggle.checked && ball.charge !== 0) {
            const fx = forces[i].fx * 100;
            const fy = forces[i].fy * 100;
            context.beginPath();
            context.moveTo(ball.x, ball.y);
            context.lineTo(ball.x + fx, ball.y + fy);
            context.strokeStyle = "#ffff00";
            context.lineWidth = 2;
            context.stroke();
        }
    }
}
//
setInterval(draw, 16);
