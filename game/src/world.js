import { CONFIG } from './config.js';

export function createWorld() {
  const obstacles = [
    { x: 250, y: 150, w: 120, h: 180 },
    { x: 910, y: 150, w: 120, h: 180 },
    { x: 520, y: 440, w: 240, h: 100 },
    { x: 150, y: 480, w: 100, h: 140 },
    { x: 1030, y: 480, w: 100, h: 140 }
  ];

  const walls = [
    { x: 40, y: 40, w: 1200, h: 40 }, // top wall
    { x: 40, y: 640, w: 1200, h: 40 }, // bottom wall
    { x: 40, y: 80, w: 40, h: 560 }, // left wall
    { x: 1200, y: 80, w: 40, h: 560 } // right wall
  ];

  const exit = { x: 1120, y: 40, w: 90, h: 50 };

  let audioCtx = null;
  function playBeep(freq = 440, duration = 0.08, type = 'sine') {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      if (audioCtx) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      }
    } catch (e) {
      // Audio not allowed yet or not supported
    }
  }

  function getBestScore() {
    try {
      const val = localStorage.getItem('vaultlight.best');
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  function setBestScore(score) {
    try {
      const current = getBestScore();
      if (score > current) {
        localStorage.setItem('vaultlight.best', score.toString());
      }
    } catch (e) {}
  }

  return {
    state: {
      screen: 'title', // title, play, pause, gameover, victory
      player: {
        x: 100,
        y: 600,
        r: 14,
        speed: 220,
        sneakSpeed: 110
      },
      maskCollected: false,
      score: 0,
      bestScore: getBestScore(),
      alarm: 0,
      coins: 3,
      coinDrops: [], // {x, y, timer}
      lootItems: [
        { id: 'ruby', x: 200, y: 200, w: 30, h: 30, name: 'Ruby Brooch', value: 1200, collected: false },
        { id: 'sapphire', x: 1070, y: 200, w: 30, h: 30, name: 'Sapphire Ring', value: 1500, collected: false },
        { id: 'mask', x: 620, y: 240, w: 40, h: 40, name: 'The Gilded Mask', value: 5000, collected: false }
      ],
      guards: [
        {
          id: 1,
          x: 350,
          y: 380,
          r: 14,
          speed: 80,
          patrol: [
            { x: 350, y: 380 },
            { x: 350, y: 620 },
            { x: 180, y: 620 },
            { x: 180, y: 380 }
          ],
          patrolIndex: 0,
          visionRange: 200,
          visionAngle: 0.8,
          angle: 0,
          distractedTimer: 0,
          distractTarget: null,
          alerted: false
        },
        {
          id: 2,
          x: 930,
          y: 380,
          r: 14,
          speed: 85,
          patrol: [
            { x: 930, y: 380 },
            { x: 930, y: 620 },
            { x: 1100, y: 620 },
            { x: 1100, y: 380 }
          ],
          patrolIndex: 0,
          visionRange: 200,
          visionAngle: 0.8,
          angle: 0,
          distractedTimer: 0,
          distractTarget: null,
          alerted: false
        },
        {
          id: 3,
          x: 640,
          y: 120,
          r: 14,
          speed: 75,
          patrol: [
            { x: 450, y: 120 },
            { x: 830, y: 120 }
          ],
          patrolIndex: 0,
          visionRange: 220,
          visionAngle: 0.9,
          angle: Math.PI / 2,
          distractedTimer: 0,
          distractTarget: null,
          alerted: false
        }
      ],
      cameras: [
        {
          id: 1,
          x: 120,
          y: 70,
          sweepCenter: 0.5,
          sweepRange: 0.7,
          speed: 0.8,
          angle: 0.5,
          visionRange: 240,
          visionAngle: 0.5
        },
        {
          id: 2,
          x: 1160,
          y: 70,
          sweepCenter: Math.PI - 0.5,
          sweepRange: 0.7,
          speed: -0.8,
          angle: Math.PI - 0.5,
          visionRange: 240,
          visionAngle: 0.5
        }
      ],
      messages: []
    },

    reset() {
      const st = this.state;
      st.screen = 'play';
      st.player.x = 100;
      st.player.y = 600;
      st.maskCollected = false;
      st.score = 0;
      st.alarm = 0;
      st.coins = 3;
      st.coinDrops = [];
      st.bestScore = getBestScore();
      st.lootItems.forEach(item => { item.collected = false; });
      st.guards.forEach((g, idx) => {
        g.x = g.patrol[0].x;
        g.y = g.patrol[0].y;
        g.patrolIndex = 0;
        g.distractedTimer = 0;
        g.distractTarget = null;
        g.alerted = false;
      });
    },

    checkRayObstacle(x1, y1, x2, y2) {
      // Sample 10 points along ray
      const steps = 10;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const rx = x1 + (x2 - x1) * t;
        const ry = y1 + (y2 - y1) * t;
        for (const obs of obstacles) {
          if (rx >= obs.x && rx <= obs.x + obs.w && ry >= obs.y && ry <= obs.y + obs.h) {
            return true; // blocked
          }
        }
      }
      return false; // clear
    },

    throwCoin(input) {
      const st = this.state;
      if (st.coins <= 0 || st.screen !== 'play') return;
      st.coins--;
      playBeep(880, 0.1, 'triangle');
      // throw toward mouse or forward
      const p = st.player;
      let tx = input.mousePos.x;
      let ty = input.mousePos.y;
      // limit throw distance to 250px
      const dx = tx - p.x;
      const dy = ty - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 250) {
        tx = p.x + (dx / dist) * 250;
        ty = p.y + (dy / dist) * 250;
      }
      st.coinDrops.push({ x: tx, y: ty, timer: 5.0 });

      // alert nearest guard
      let nearest = null;
      let minDist = Infinity;
      for (const g of st.guards) {
        const d = Math.hypot(g.x - tx, g.y - ty);
        if (d < minDist) {
          minDist = d;
          nearest = g;
        }
      }
      if (nearest) {
        nearest.distractTarget = { x: tx, y: ty };
        nearest.distractedTimer = 4.0;
        nearest.alerted = false;
      }
    },

    step(dt, input) {
      const st = this.state;

      if (st.screen === 'title') {
        if (input.clicked || input.interact || (input.x !== 0 || input.y !== 0)) {
          playBeep(523.25, 0.1);
          this.reset();
        }
        return;
      }

      if (st.screen === 'gameover' || st.screen === 'victory') {
        if (input.clicked || input.interact) {
          playBeep(523.25, 0.1);
          this.reset();
        }
        return;
      }

      if (input.action && (input.mousePos.x || input.mousePos.y)) {
        // check pause toggle or restart or coin
      }

      // Handle pause (P or Esc)
      // We can handle pause in main.js or here

      // Player movement
      const p = st.player;
      const speed = input.sneak ? p.sneakSpeed : p.speed;
      let nx = p.x + input.x * speed * dt;
      let ny = p.y + input.y * speed * dt;

      // Wall collisions (room bounds)
      const minX = 40 + p.r + 20;
      const maxX = 1240 - p.r - 20;
      const minY = 40 + p.r + 20;
      const maxY = 680 - p.r - 20;

      if (nx < minX) nx = minX;
      if (nx > maxX) nx = maxX;
      if (ny < minY) ny = minY;
      if (ny > maxY) ny = maxY;

      // Obstacle collisions
      for (const obs of obstacles) {
        // AABB check with player circle
        const closestX = Math.max(obs.x, Math.min(nx, obs.x + obs.w));
        const closestY = Math.max(obs.y, Math.min(ny, obs.y + obs.h));
        const distX = nx - closestX;
        const distY = ny - closestY;
        if (Math.hypot(distX, distY) < p.r) {
          // push out or restrict
          // simple clamp to previous position on axis
          const prevClosestX = Math.max(obs.x, Math.min(p.x, obs.x + obs.w));
          const prevClosestY = Math.max(obs.y, Math.min(ny, obs.y + obs.h));
          if (Math.hypot(p.x - prevClosestX, ny - prevClosestY) >= p.r) {
            nx = p.x;
          } else {
            ny = p.y;
          }
        }
      }

      p.x = nx;
      p.y = ny;

      // Coin drop input
      if (input.coin) {
        this.throwCoin(input);
      }

      // Loot interaction (E key or click near item)
      if (input.interact) {
        for (const item of st.lootItems) {
          if (!item.collected) {
            const dist = Math.hypot(p.x - (item.x + item.w / 2), p.y - (item.y + item.h / 2));
            if (dist < 50) {
              item.collected = true;
              st.score += item.value;
              playBeep(784, 0.15, 'triangle');
              if (item.id === 'mask') {
                st.maskCollected = true;
                playBeep(1046.5, 0.25, 'triangle');
              }
            }
          }
        }
      }

      // Check Exit
      if (st.maskCollected) {
        if (p.x >= exit.x && p.x <= exit.x + exit.w && p.y >= exit.y && p.y <= exit.y + exit.h) {
          st.score += 2000; // escape bonus
          setBestScore(st.score);
          st.bestScore = getBestScore();
          st.screen = 'victory';
          playBeep(1046.5, 0.4, 'sine');
          return;
        }
      }

      // Update coin drops timers
      for (let i = st.coinDrops.length - 1; i >= 0; i--) {
        st.coinDrops[i].timer -= dt;
        if (st.coinDrops[i].timer <= 0) {
          st.coinDrops.splice(i, 1);
        }
      }

      let playerVisible = false;
      let alertIncrement = 0;

      // Update Cameras
      for (const cam of st.cameras) {
        cam.angle += cam.speed * dt;
        if (cam.angle > cam.sweepCenter + cam.sweepRange || cam.angle < cam.sweepCenter - cam.sweepRange) {
          cam.speed *= -1;
        }

        // Check vision cone against player
        const distToPlayer = Math.hypot(p.x - cam.x, p.y - cam.y);
        if (distToPlayer <= cam.visionRange) {
          const angleToPlayer = Math.atan2(p.y - cam.y, p.x - cam.x);
          let angleDiff = angleToPlayer - cam.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          if (Math.abs(angleDiff) <= cam.visionAngle / 2) {
            if (!this.checkRayObstacle(cam.x, cam.y, p.x, p.y)) {
              playerVisible = true;
              const rate = input.sneak ? 25 : 50;
              alertIncrement = Math.max(alertIncrement, rate * dt);
            }
          }
        }
      }

      // Update Guards
      for (const g of st.guards) {
        let targetX, targetY;
        if (g.distractedTimer > 0 && g.distractTarget) {
          g.distractedTimer -= dt;
          targetX = g.distractTarget.x;
          targetY = g.distractTarget.y;
          if (Math.hypot(g.x - targetX, g.y - targetY) < 15) {
            g.distractedTimer = 0;
            g.distractTarget = null;
          }
        } else {
          const wp = g.patrol[g.patrolIndex];
          targetX = wp.x;
          targetY = wp.y;
          if (Math.hypot(g.x - targetX, g.y - targetY) < 10) {
            g.patrolIndex = (g.patrolIndex + 1) % g.patrol.length;
          }
        }

        const angleToTarget = Math.atan2(targetY - g.y, targetX - g.x);
        g.angle = angleToTarget;
        g.x += Math.cos(g.angle) * g.speed * dt;
        g.y += Math.sin(g.angle) * g.speed * dt;

        // Check direct touch / game over collision
        const touchDist = Math.hypot(p.x - g.x, p.y - g.y);
        if (touchDist < p.r + g.r) {
          st.alarm = 100;
          setBestScore(st.score);
          st.bestScore = getBestScore();
          st.screen = 'gameover';
          playBeep(150, 0.5, 'sawtooth');
          return;
        }

        // Check guard vision cone
        const distToPlayer = Math.hypot(p.x - g.x, p.y - g.y);
        if (distToPlayer <= g.visionRange) {
          const angleToPlayer = Math.atan2(p.y - g.y, p.x - g.x);
          let angleDiff = angleToPlayer - g.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          if (Math.abs(angleDiff) <= g.visionAngle / 2) {
            if (!this.checkRayObstacle(g.x, g.y, p.x, p.y)) {
              g.alerted = true;
              playerVisible = true;
              const rate = input.sneak ? 30 : 60;
              alertIncrement = Math.max(alertIncrement, rate * dt);
            } else {
              g.alerted = false;
            }
          } else {
            g.alerted = false;
          }
        } else {
          g.alerted = false;
        }
      }

      // Alarm meter logic
      if (playerVisible) {
        st.alarm += alertIncrement;
      } else {
        st.alarm -= 15 * dt;
      }
      if (st.alarm < 0) st.alarm = 0;
      if (st.alarm >= 100) {
        st.alarm = 100;
        setBestScore(st.score);
        st.bestScore = getBestScore();
        st.screen = 'gameover';
        playBeep(150, 0.5, 'sawtooth');
      }
    }
  };
}
