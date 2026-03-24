/* ─── Cherry Blossom Petal Animation ─── */
(function () {
  const canvas = document.getElementById('sakura-canvas');
  const ctx    = canvas.getContext('2d');

  let W = window.innerWidth;
  let H = window.innerHeight;
  const petals = [];
  const PETAL_COUNT = 600;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Fixed petal colors (assigned once, never re-rolled per frame) ──
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

  // ── Global wind / gust system ──
  let gust      = 0;   // current extra rightward push
  let gustDecay = 0;
  let gustTimer = 0;
  let nextGust  = 180 + Math.random() * 360; // frames until next gust

  function tickGust() {
    gustTimer++;
    if (gustTimer >= nextGust) {
      gust      = 1.8 + Math.random() * 2.8;
      gustDecay = 0.96 + Math.random() * 0.02; // how quickly it fades
      nextGust  = 200 + Math.random() * 500;
      gustTimer = 0;
    }
    gust *= gustDecay;
  }

  // ── Draw a luscious thick petal ──
  // Thickness is faked with four layers:
  //   1. soft drop-shadow ellipse
  //   2. offset "underside" in a deeper hue
  //   3. main face with a directional light gradient
  //   4. specular highlight spot
  function petalOutline(w, h) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.bezierCurveTo( w * 0.95,  h * 0.55,  w * 1.00, -h * 0.10,  w * 0.62, -h * 0.62);
    ctx.quadraticCurveTo( w * 0.22, -h * 0.98,  0, -h * 0.80);
    ctx.quadraticCurveTo(-w * 0.22, -h * 0.98, -w * 0.62, -h * 0.62);
    ctx.bezierCurveTo(-w * 1.00, -h * 0.10, -w * 0.95,  h * 0.55,  0, h);
    ctx.closePath();
  }

  function drawPetal(x, y, size, rot, alpha, r, g, b) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    const w  = size * 1.08;
    const h  = size * 1.32;
    const dr = Math.max(0, r - 30);
    const dg = Math.max(0, g - 25);
    const db = Math.max(0, b - 14);

    // ── Layer 1: soft drop shadow ──
    ctx.save();
    ctx.translate(size * 0.18, size * 0.22);
    ctx.scale(1, 0.55); // flatten into ellipse
    petalOutline(w, h);
    ctx.fillStyle = `rgba(160, 80, 110, ${(alpha * 0.18).toFixed(2)})`;
    ctx.fill();
    ctx.restore();

    // ── Layer 2: underside / thickness edge ──
    ctx.save();
    ctx.translate(size * 0.09, size * 0.11);
    petalOutline(w, h);
    ctx.fillStyle = `rgba(${dr},${dg},${db},${(alpha * 0.65).toFixed(2)})`;
    ctx.fill();
    ctx.restore();

    // ── Layer 3: main face with directional gradient (light from upper-left) ──
    petalOutline(w, h);
    const light = ctx.createLinearGradient(-w * 0.55, -h * 0.75, w * 0.5, h * 0.7);
    light.addColorStop(0.00, `rgba(255, 248, 253, ${alpha.toFixed(2)})`);        // bright white-pink
    light.addColorStop(0.30, `rgba(${r},${g},${b},${alpha.toFixed(2)})`);        // true color
    light.addColorStop(1.00, `rgba(${dr},${dg},${db},${(alpha * 0.88).toFixed(2)})`); // soft shadow
    ctx.fillStyle = light;
    ctx.fill();

    // ── Layer 4: specular highlight (top-left lobe) ──
    petalOutline(w, h);
    ctx.save();
    ctx.clip();
    const spec = ctx.createRadialGradient(-w * 0.28, -h * 0.52, 0, -w * 0.28, -h * 0.52, w * 0.58);
    spec.addColorStop(0.0, `rgba(255,255,255,${(alpha * 0.55).toFixed(2)})`);
    spec.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.fillRect(-w * 1.2, -h * 1.1, w * 2.4, h * 1.5);
    ctx.restore();

    // ── Center vein ──
    ctx.strokeStyle = `rgba(${dr},${Math.max(0, dg - 10)},${db},${(alpha * 0.38).toFixed(2)})`;
    ctx.lineWidth   = 0.7;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(0,  h * 0.72);
    ctx.quadraticCurveTo(w * 0.04, 0, 0, -h * 0.62);
    ctx.stroke();

    // Two delicate side veins
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = alpha * 0.28;
    ctx.strokeStyle = `rgba(${dr},${dg},${db},1)`;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.08);  ctx.lineTo( w * 0.45, -h * 0.48);
    ctx.moveTo(0, -h * 0.08);  ctx.lineTo(-w * 0.45, -h * 0.48);
    ctx.stroke();

    ctx.restore();
  }

  // ── Petal physics ──
  class Petal {
    constructor(scattered) {
      this.reset(!scattered);
    }

    reset(fromTop) {
      // Depth (0=far, 1=near) — controls size, speed, alpha
      this.depth   = Math.random();
      const ds     = 0.40 + this.depth * 0.85;

      // Leftward drifters spawn on the right side; rightward on the left
      const spawnBias = this.driftX < 0 ? W * 0.4 : 0;
      this.x = fromTop ? spawnBias + Math.random() * (W * 0.8 + 80) : Math.random() * W;
      this.y = fromTop ? -(20 + Math.random() * 220) : Math.random() * -H;

      this.size    = (9 + Math.random() * 11) * ds;
      this.speedY  = (0.55 + Math.random() * 0.90) * ds;
      // Mix of leftward and rightward drifters so all corners stay full
      this.driftX  = (-0.45 + Math.random() * 1.10) * ds;
      this.alpha   = 0.62 + this.depth * 0.36;

      // ── Flutter: gentle rock back and forth (no full spinning) ──
      // baseRot: the "resting" tilt the petal naturally has
      this.baseRot       = -0.5 + Math.random() * 1.0;
      // flutter oscillates around baseRot
      this.flutterAmp    = 0.18 + Math.random() * 0.28; // ±10–16°
      this.flutterFreq   = 0.025 + Math.random() * 0.035;
      this.flutterOffset = Math.random() * Math.PI * 2;
      // slow creep so orientation gradually shifts
      this.rotDrift      = -0.003 + Math.random() * 0.006;

      // Side wobble (swaying as it falls)
      this.wobbleFreq    = 0.014 + Math.random() * 0.018;
      this.wobbleAmp     = 0.40  + Math.random() * 0.90;
      this.wobbleOffset  = Math.random() * Math.PI * 2;

      // Response to gusts (near petals react more)
      this.gustResponse  = 0.5 + this.depth * 0.7;

      this.age = 0;

      const col  = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
      this.r = col[0]; this.g = col[1]; this.b = col[2];
    }

    update() {
      this.age++;
      this.baseRot += this.rotDrift;

      // Flutter rotation
      const rot = this.baseRot
        + this.flutterAmp * Math.sin(this.age * this.flutterFreq + this.flutterOffset);

      // Horizontal: base breeze + wobble + gust response
      const wx = Math.sin(this.age * this.wobbleFreq + this.wobbleOffset) * this.wobbleAmp;
      this.x  += this.driftX + wx + gust * this.gustResponse;
      this.y  += this.speedY;
      this.rot = rot;

      // Fade near bottom
      if (this.y > H * 0.80) {
        this.alpha = Math.max(0, this.alpha - 0.0035);
      }
      if (this.y > H + 40 || this.alpha <= 0 || this.x < -120 || this.x > W + 120) {
        this.reset(true);
      }
    }

    draw() {
      drawPetal(this.x, this.y, this.size, this.rot, this.alpha, this.r, this.g, this.b);
    }
  }

  // Pre-scatter so screen fills immediately
  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(new Petal(true));
  }
  // Render far petals beneath near ones
  petals.sort((a, b) => a.depth - b.depth);

  function animate() {
    ctx.clearRect(0, 0, W, H);
    tickGust();
    for (const p of petals) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(animate);
  }

  animate();
})();
