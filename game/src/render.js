import { CONFIG } from './config.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const P = CONFIG.PALETTE;

  function drawCone(cx, cy, angle, span, range, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const startAngle = angle - span / 2;
    const endAngle = angle + span / 2;
    ctx.arc(cx, cy, range, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  return {
    render(state, input) {
      canvas.width = CONFIG.WIDTH;
      canvas.height = CONFIG.HEIGHT;

      // 1. Backdrop
      ctx.fillStyle = P.backdrop;
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

      // 2. Floor (dark marble + subtle grid)
      ctx.fillStyle = P.floor;
      ctx.fillRect(40, 40, 1200, 600);

      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let x = 40; x <= 1240; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, 640);
        ctx.stroke();
      }
      for (let y = 40; y <= 640; y += 40) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(1240, y);
        ctx.stroke();
      }

      // 3. Walls
      ctx.fillStyle = P.wall;
      ctx.fillRect(40, 40, 1200, 40); // top
      ctx.fillRect(40, 600, 1200, 40); // bottom
      ctx.fillRect(40, 80, 40, 520); // left
      ctx.fillRect(1200, 80, 40, 520); // right

      // Exit Door (1120, 40, 90, 50)
      ctx.fillStyle = state.maskCollected ? '#00e676' : '#555555';
      ctx.fillRect(1120, 40, 90, 40);
      ctx.fillStyle = P.text;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.maskCollected ? 'ESCAPES' : 'LOCKED', 1165, 60);

      // 4. Obstacles / Cover
      const obstacles = [
        { x: 250, y: 150, w: 120, h: 180 },
        { x: 910, y: 150, w: 120, h: 180 },
        { x: 520, y: 440, w: 240, h: 100 },
        { x: 150, y: 480, w: 100, h: 140 },
        { x: 1030, y: 480, w: 100, h: 140 }
      ];
      ctx.fillStyle = P.cover;
      for (const obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }

      // 5. Loot Items & Pedestal
      for (const item of state.lootItems) {
        if (!item.collected) {
          if (item.id === 'mask') {
            // Pedestal underneath
            ctx.fillStyle = P.pedestal;
            ctx.fillRect(item.x - 5, item.y + 10, item.w + 10, item.h + 15);
            // Mask
            ctx.fillStyle = P.mask;
            ctx.beginPath();
            ctx.arc(item.x + item.w / 2, item.y + item.h / 2, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            ctx.fillStyle = P.loot;
            ctx.beginPath();
            ctx.arc(item.x + item.w / 2, item.y + item.h / 2, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      // Coin drops
      for (const c of state.coinDrops) {
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f57f17';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 6. Cameras & Vision Cones
      for (const cam of state.cameras) {
        drawCone(cam.x, cam.y, cam.angle, cam.visionAngle, cam.visionRange, P.cameraCone);
        ctx.fillStyle = P.camera;
        ctx.beginPath();
        ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 7. Guards & Vision Cones
      for (const g of state.guards) {
        const coneColor = g.alerted ? P.guardAlertCone : P.guardCone;
        drawCone(g.x, g.y, g.angle, g.visionAngle, g.visionRange, coneColor);
        
        ctx.fillStyle = P.guard;
        ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
      }

      // 8. Player (Wren)
      const p = state.player;
      ctx.fillStyle = input.sneak ? P.playerSneak : P.player;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 9. HUD (Score, Alarm Bar, Coins, Mask status)
      // Top Left: Score
      ctx.fillStyle = P.text;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`SCORE: ${state.score}`, 60, 12);
      ctx.fillStyle = P.muted;
      ctx.font = '12px sans-serif';
      ctx.fillText(`BEST: ${state.bestScore}`, 60, 32);

      // Top Center: Alarm Meter
      const barW = 300;
      const barH = 16;
      const barX = (CONFIG.WIDTH - barW) / 2;
      const barY = 16;
      ctx.fillStyle = P.panel;
      ctx.fillRect(barX, barY, barW, barH);
      const fillW = (state.alarm / 100) * barW;
      let alarmColor = P.alarmLow;
      if (state.alarm >= 70) alarmColor = P.alarmHigh;
      else if (state.alarm >= 40) alarmColor = P.alarmMed;
      ctx.fillStyle = alarmColor;
      ctx.fillRect(barX, barY, fillW, barH);
      ctx.strokeStyle = P.muted;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = P.text;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`ALARM: ${Math.round(state.alarm)}%`, barX + barW / 2, barY + barH / 2);

      // Top Right: Coins & Mask status
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = P.text;
      ctx.fillText(`COINS: ${'🪙 '.repeat(state.coins)}`, CONFIG.WIDTH - 60, 16);
      ctx.fillText(`MASK: ${state.maskCollected ? 'SECURED' : 'STOLEN SOON'}`, CONFIG.WIDTH - 60, 36);

      // 10. Screens (Title, GameOver, Victory)
      if (state.screen === 'title') {
        ctx.fillStyle = 'rgba(11, 15, 23, 0.85)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        ctx.fillStyle = P.panel;
        ctx.fillRect(CONFIG.WIDTH / 2 - 320, CONFIG.HEIGHT / 2 - 180, 640, 360);
        ctx.strokeStyle = P.pedestal;
        ctx.lineWidth = 3;
        ctx.strokeRect(CONFIG.WIDTH / 2 - 320, CONFIG.HEIGHT / 2 - 180, 640, 360);

        ctx.fillStyle = P.mask;
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VAULTLIGHT', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 100);

        ctx.fillStyle = P.text;
        ctx.font = 'italic 18px sans-serif';
        ctx.fillText('"The Gilded Hour"', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 60);

        ctx.font = '14px sans-serif';
        ctx.fillStyle = P.muted;
        ctx.fillText('Steal The Gilded Mask and escape without tripping the alarm.', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 10);
        ctx.fillText('WASD / Arrows to Move | HOLD SHIFT to Sneak | E to Loot | Q / C to Throw Coin', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 25);

        ctx.fillStyle = P.player;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Press Space or Click to Start', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 100);
      } else if (state.screen === 'gameover') {
        ctx.fillStyle = 'rgba(11, 15, 23, 0.9)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        ctx.fillStyle = P.panel;
        ctx.fillRect(CONFIG.WIDTH / 2 - 250, CONFIG.HEIGHT / 2 - 140, 500, 280);
        ctx.strokeStyle = P.alarmHigh;
        ctx.lineWidth = 3;
        ctx.strokeRect(CONFIG.WIDTH / 2 - 250, CONFIG.HEIGHT / 2 - 140, 500, 280);

        ctx.fillStyle = P.alarmHigh;
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CAUGHT — ALARM TRIPPED', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 70);

        ctx.fillStyle = P.text;
        ctx.font = '16px sans-serif';
        ctx.fillText(`Final Score: ${state.score} (Best: ${state.bestScore})`, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 20);

        ctx.fillStyle = P.player;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Press Space or Click to Retry', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 60);
      } else if (state.screen === 'victory') {
        ctx.fillStyle = 'rgba(11, 15, 23, 0.9)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        ctx.fillStyle = P.panel;
        ctx.fillRect(CONFIG.WIDTH / 2 - 320, CONFIG.HEIGHT / 2 - 160, 640, 320);
        ctx.strokeStyle = P.loot;
        ctx.lineWidth = 3;
        ctx.strokeRect(CONFIG.WIDTH / 2 - 320, CONFIG.HEIGHT / 2 - 160, 640, 320);

        ctx.fillStyle = P.loot;
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HEIST SUCCESS — THE GILDED MASK IS YOURS!', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 80);

        ctx.fillStyle = P.text;
        ctx.font = '16px sans-serif';
        ctx.fillText(`Final Score: ${state.score} (Best: ${state.bestScore})`, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 30);
        ctx.fillStyle = P.muted;
        ctx.font = 'italic 14px sans-serif';
        ctx.fillText('You vanished into the night like a ghost.', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 10);

        ctx.fillStyle = P.player;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Press Space or Click to Play Again', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 80);
      }
    }
  };
}
