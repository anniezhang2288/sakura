/* ─── Cherry Blossom Petal Animation ─── */
(function () {
  const canvas = document.getElementById('sakura-canvas');
  const ctx = canvas.getContext('2d');

  let W = window.innerWidth;
  let H = window.innerHeight;
  const petals = [];
  const PETAL_COUNT = 220;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Fixed colors assigned per petal — never randomized at draw time
  const PETAL_COLORS = [
    [255, 183, 197],
    [255, 209, 220],
    [255, 232, 238],
    [250, 200, 215],
    [252, 244, 247],
    [238, 162, 182],
    [255, 248, 251],
    [245, 175, 196],
    [255, 220, 232],
  ];

  // ── Petal shape: rounded oval with characteristic cherry blossom notch at tip ──
  function drawPetal(x, y, size, rot, alpha, r, g, b) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    const w = size * 1.05; // half-width
    const h = size * 1.30; // half-height (taller than wide)

    ctx.beginPath();
    // Base — narrow stem end at bottom
    ctx.moveTo(0, h);
    // Sweep up the right side
    ctx.bezierCurveTo(
      w * 0.95,  h * 0.55,
      w * 1.00, -h * 0.10,
      w * 0.62, -h * 0.62
    );
    // Notch: curve to center dip (the cleft all sakura petals have)
    ctx.quadraticCurveTo(w * 0.22, -h * 0.98, 0, -h * 0.80);
    // Notch: center dip to upper-left
    ctx.quadraticCurveTo(-w * 0.22, -h * 0.98, -w * 0.62, -h * 0.62);
    // Sweep back down the left side
    ctx.bezierCurveTo(
      -w * 1.00, -h * 0.10,
      -w * 0.95,  h * 0.55,
      0, h
    );
    ctx.closePath();

    // Gradient: bright center fading to translucent edge — same color both stops
    const grad = ctx.createRadialGradient(0, -h * 0.1, 0, 0, 0, h * 1.1);
    grad.addColorStop(0.0, `rgba(${r},${g},${b},${(alpha).toFixed(2)})`);
    grad.addColorStop(1.0, `rgba(${r},${g},${b},${(alpha * 0.35).toFixed(2)})`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle center vein
    ctx.strokeStyle = `rgba(200, 130, 155, ${(alpha * 0.28).toFixed(2)})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(0, -h * 0.55);
    ctx.stroke();

    ctx.restore();
  }

  class Petal {
    constructor(scattered) {
      this.reset(!scattered);
    }

    reset(fromTop) {
      // Start from top; if recycling from off-screen bottom, spawn from top-left area
      // so the rightward breeze carries them across the screen naturally
      this.x = fromTop
        ? -80 + Math.random() * (W + 80)   // spread across full top
        : Math.random() * W;
      this.y = fromTop
        ? -(15 + Math.random() * 180)
        : Math.random() * -H;

      this.size = 8 + Math.random() * 10;         // bigger petals

      // Steady rightward breeze + slight random variation
      this.breezeX = 0.45 + Math.random() * 0.55;
      this.speedY  = 0.80 + Math.random() * 1.20; // gentle fall

      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (-0.015 + Math.random() * 0.03); // slow, lazy spin

      this.alpha = 0.70 + Math.random() * 0.30;

      // Gentle secondary wobble (small, on top of the breeze drift)
      this.wobbleFreq   = 0.012 + Math.random() * 0.016;
      this.wobbleAmp    = 0.40  + Math.random() * 0.80;
      this.wobbleOffset = Math.random() * Math.PI * 2;

      this.age = 0;

      // Pick a color once — never changes until petal resets
      const col = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
      this.r = col[0];
      this.g = col[1];
      this.b = col[2];
    }

    update() {
      this.age++;
      this.y += this.speedY;
      this.x += this.breezeX + Math.sin(this.age * this.wobbleFreq + this.wobbleOffset) * this.wobbleAmp;
      this.rotation += this.rotSpeed;

      // Fade out near the bottom
      if (this.y > H * 0.80) {
        this.alpha = Math.max(0, this.alpha - 0.004);
      }

      if (this.y > H + 40 || this.alpha <= 0) {
        this.reset(true);
      }
    }

    draw() {
      drawPetal(this.x, this.y, this.size, this.rotation, this.alpha, this.r, this.g, this.b);
    }
  }

  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(new Petal(true));
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (const p of petals) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(animate);
  }

  animate();
})();
