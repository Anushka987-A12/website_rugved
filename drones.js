document.querySelectorAll('.particle-canvas').forEach(canvas => {
  const container = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let drones = [];
  let ugv = null;
  let width = 0;
  let height = 0;

  const THEME = '36, 95, 153';

  function randBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, width * dpr);
    canvas.height = Math.max(1, height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const starCount = Math.min(90, Math.max(30, Math.floor(width / 14)));
    stars = Array.from({ length: starCount }, () => {
      const big = Math.random() < .18;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: big ? randBetween(1.5, 2.6) : randBetween(.5, 1.3),
        phase: Math.random() * Math.PI * 2,
        speed: randBetween(.008, .03),
        flare: big && Math.random() < .6
      };
    });

    const droneCount = Math.max(4, Math.min(8, Math.round(width / 200)));

    const buildGroup = (count, dir) => Array.from({ length: count }, (_, index) => {
      const lane = (index + 1) / (count + 1);
      return {
        dir,
        x: dir > 0 ? -160 - randBetween(0, 420) : width + 160 + randBetween(0, 420),
        y: height * .05 + lane * height * .56 + randBetween(-10, 10),
        speed: randBetween(.5, .95) * dir,
        scale: randBetween(.34, .58),
        bob: Math.random() * Math.PI * 2,
        bobSpeed: randBetween(.012, .022),
        propAngle: Math.random() * Math.PI * 2,
        propSpeed: randBetween(.3, .55),
        tilt: randBetween(-.12, .12) * dir,
        lightPhase: Math.random() * Math.PI * 2
      };
    });

    const rightCount = Math.ceil(droneCount / 2);
    drones = buildGroup(rightCount, 1).concat(buildGroup(droneCount - rightCount, -1));

    for (let i = drones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [drones[i], drones[j]] = [drones[j], drones[i]];
    }

    ugv = {
      x: width + 40,
      speed: -.8,
      scale: Math.max(.7, Math.min(1.1, width / 1100)),
      track: 0,
      radar: 0,
      bob: 0,
      lightPhase: Math.random() * Math.PI * 2
    };
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      star.phase += star.speed;

      const twinkle = (Math.sin(star.phase) + 1) / 2;
      const alpha = .12 + twinkle * .78;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * .85})`;

      if (star.flare) {
        const len = star.r * (3 + twinkle * 5);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = .8;
        ctx.beginPath();
        ctx.moveTo(star.x - len, star.y);
        ctx.lineTo(star.x + len, star.y);
        ctx.moveTo(star.x, star.y - len);
        ctx.lineTo(star.x, star.y + len);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDrone(drone) {
    drone.x += drone.speed;
    drone.bob += drone.bobSpeed;
    drone.propAngle += drone.propSpeed;

    if (drone.dir > 0 && drone.x > width + 140) {
      drone.x = -140;
      drone.y = randBetween(height * .08, height * .56);
      drone.speed = randBetween(.5, .95);
      drone.scale = randBetween(.34, .58);
    } else if (drone.dir < 0 && drone.x < -140) {
      drone.x = width + 140;
      drone.y = randBetween(height * .08, height * .56);
      drone.speed = -randBetween(.5, .95);
      drone.scale = randBetween(.34, .58);
    }

    const bobY = Math.sin(drone.bob) * 10;
    const scale = drone.scale;

    ctx.save();
    ctx.translate(drone.x, drone.y + bobY);
    ctx.rotate(drone.tilt + Math.cos(drone.bob) * .04);
    ctx.scale(scale * drone.dir, scale);

    ctx.fillStyle = 'rgba(0, 0, 0, .3)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 40, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const ARM = [[-30, -18], [30, -18], [-30, 20], [30, 20]];

    ctx.strokeStyle = '#2f4a5c';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ARM.forEach(([ax, ay]) => {
      ctx.moveTo(ax * .18, ay * .3);
      ctx.lineTo(ax, ay);
    });
    ctx.stroke();

    ctx.strokeStyle = `rgba(120, 160, 200, .45)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = '#3d6079';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ARM.forEach(([ax, ay]) => {
      ctx.moveTo(ax * .18, ay * .3);
      ctx.lineTo(ax, ay);
    });
    ctx.stroke();

    const body = ctx.createLinearGradient(0, -12, 0, 12);
    body.addColorStop(0, '#33495a');
    body.addColorStop(.45, '#1d2b35');
    body.addColorStop(1, '#101a21');
    ctx.fillStyle = body;
    ctx.strokeStyle = 'rgba(120, 165, 205, .75)';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(16, -8, 4, -10);
    ctx.lineTo(-12, -9);
    ctx.quadraticCurveTo(-18, -6, -18, 0);
    ctx.quadraticCurveTo(-18, 6, -12, 9);
    ctx.lineTo(4, 10);
    ctx.quadraticCurveTo(16, 8, 18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const canopy = ctx.createLinearGradient(-6, -9, 10, -2);
    canopy.addColorStop(0, 'rgba(140, 200, 235, .5)');
    canopy.addColorStop(1, 'rgba(30, 50, 65, .2)');
    ctx.fillStyle = canopy;
    ctx.beginPath();
    ctx.ellipse(-2, -4, 9, 3.4, -.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0b1218';
    ctx.strokeStyle = 'rgba(120, 165, 205, .6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(12, 3, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(90, 190, 230, .55)';
    ctx.beginPath();
    ctx.arc(13, 3, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2f4a5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 9);
    ctx.lineTo(-9, 16);
    ctx.moveTo(6, 10);
    ctx.lineTo(7, 16);
    ctx.stroke();

    ARM.forEach(([rx, ry], index) => {
      ctx.fillStyle = '#16222b';
      ctx.strokeStyle = 'rgba(120, 165, 205, .7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rx, ry, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const propAlpha = index % 2 === 0 ? .3 : .22;
      ctx.fillStyle = `rgba(170, 205, 235, ${propAlpha})`;
      ctx.beginPath();
      ctx.ellipse(rx, ry - 1.5, 13, 2.4, drone.propAngle + index * .4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(170, 205, 235, ${propAlpha * .55})`;
      ctx.beginPath();
      ctx.ellipse(rx, ry - 1.5, 13, 5.5, -drone.propAngle * .7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(210, 235, 250, .3)';
      ctx.beginPath();
      ctx.ellipse(rx, ry - 1.5, 4, 1.1, -drone.propAngle, 0, Math.PI * 2);
      ctx.fill();
    });

    const blink = (Math.sin(drone.bob * 2.2 + drone.lightPhase) + 1) / 2;
    ctx.fillStyle = `rgba(109, 245, 154, ${.2 + blink * .8})`;
    ctx.beginPath();
    ctx.arc(-6, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(245, 109, 109, ${.2 + (1 - blink) * .8})`;
    ctx.beginPath();
    ctx.arc(6, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const trailLength = 110 * scale;
    const trailX = drone.x - trailLength * drone.dir;
    const trail = ctx.createLinearGradient(trailX, drone.y + bobY, drone.x, drone.y + bobY);
    trail.addColorStop(0, `rgba(${THEME}, 0)`);
    trail.addColorStop(1, `rgba(${THEME}, ${.1 + blink * .08})`);
    ctx.strokeStyle = trail;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trailX, drone.y + bobY + Math.sin(drone.bob - .8) * 8);
    ctx.lineTo(drone.x, drone.y + bobY);
    ctx.stroke();
  }

  function drawUgv() {
    if (!ugv) return;

    ugv.x += ugv.speed;
    ugv.track += ugv.speed * .9;
    ugv.radar += .04;
    ugv.bob += .06;

    const groundY = height - Math.max(30, Math.min(46, height * .08));
    if (ugv.x < -220) {
      ugv.x = width + 200;
    }

    const scale = ugv.scale;
    const bounce = Math.sin(ugv.bob) * 1.2;

    ctx.save();
    ctx.translate(ugv.x, groundY + bounce);
    ctx.scale(-scale, scale);

    ctx.fillStyle = 'rgba(0, 0, 0, .35)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 66, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const trackGrad = ctx.createLinearGradient(0, 10, 0, 34);
    trackGrad.addColorStop(0, '#26333b');
    trackGrad.addColorStop(1, '#0d1418');
    ctx.fillStyle = trackGrad;
    ctx.strokeStyle = 'rgba(120, 165, 205, .6)';
    ctx.lineWidth = 1.5;

    [-34, 34].forEach(wx => {
      ctx.beginPath();
      ctx.roundRect(wx - 20, 8, 40, 26, 8);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(90, 130, 165, .4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const offset = ((i * 6 + ugv.track) % 28) + wx - 13;
        ctx.beginPath();
        ctx.moveTo(offset, 10);
        ctx.lineTo(offset, 32);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(120, 165, 205, .6)';
      ctx.lineWidth = 1.5;
    });

    const hull = ctx.createLinearGradient(0, -18, 0, 12);
    hull.addColorStop(0, '#3a5061');
    hull.addColorStop(.5, '#1e2c36');
    hull.addColorStop(1, '#101a21');
    ctx.fillStyle = hull;
    ctx.strokeStyle = 'rgba(130, 175, 215, .8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-50, 8);
    ctx.lineTo(-44, -14);
    ctx.lineTo(20, -18);
    ctx.lineTo(50, -12);
    ctx.lineTo(54, 2);
    ctx.lineTo(46, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const panel = ctx.createLinearGradient(-10, -14, 20, 6);
    panel.addColorStop(0, 'rgba(140, 200, 235, .35)');
    panel.addColorStop(1, 'rgba(30, 50, 65, .1)');
    ctx.fillStyle = panel;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(18, -15);
    ctx.lineTo(30, -4);
    ctx.lineTo(2, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#16222b';
    ctx.strokeStyle = 'rgba(130, 175, 215, .8)';
    ctx.beginPath();
    ctx.roundRect(30, -16, 12, 9, 2);
    ctx.fill();
    ctx.stroke();

    const lensGlow = (Math.sin(ugv.bob * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(90, 200, 235, ${.4 + lensGlow * .4})`;
    ctx.beginPath();
    ctx.arc(40, -11.5, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#16222b';
    ctx.strokeStyle = 'rgba(130, 175, 215, .8)';
    ctx.beginPath();
    ctx.roundRect(-24, -34, 30, 17, 3);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.rect(-24, -34, 30, 17);
    ctx.clip();
    ctx.translate(-9, -25.5);
    ctx.strokeStyle = 'rgba(109, 245, 154, .5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ugv.radar) * 20, Math.sin(ugv.radar) * 20);
    ctx.stroke();
    const sweep = ctx.createLinearGradient(0, 0, Math.cos(ugv.radar) * 20, Math.sin(ugv.radar) * 20);
    sweep.addColorStop(0, 'rgba(109, 245, 154, .35)');
    sweep.addColorStop(1, 'rgba(109, 245, 154, 0)');
    ctx.strokeStyle = sweep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ugv.radar - .5) * 20, Math.sin(ugv.radar - .5) * 20);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(109, 245, 154, .25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#2f4a5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, -17);
    ctx.lineTo(-9, -24);
    ctx.stroke();

    const blink = (Math.sin(ugv.bob * 1.8 + ugv.lightPhase) + 1) / 2;
    ctx.fillStyle = `rgba(245, 109, 109, ${.2 + blink * .8})`;
    ctx.beginPath();
    ctx.arc(-46, -2, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(109, 245, 154, ${.2 + (1 - blink) * .8})`;
    ctx.beginPath();
    ctx.arc(52, -2, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const trailLength = 130 * scale;
    const trail = ctx.createLinearGradient(
      ugv.x + trailLength,
      groundY,
      ugv.x,
      groundY
    );
    trail.addColorStop(0, `rgba(${THEME}, 0)`);
    trail.addColorStop(1, `rgba(120, 165, 205, .14)`);
    ctx.strokeStyle = trail;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ugv.x + trailLength, groundY + 20 + bounce);
    ctx.lineTo(ugv.x + 40 * scale, groundY + 20 + bounce);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawStars();
    drones.forEach(drawDrone);
    drawUgv();
    requestAnimationFrame(draw);
  }

  resize();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  const containerObserver = new ResizeObserver(() => resize());
  containerObserver.observe(container);
});