import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createWorld } from './world.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const input = createInput(canvas);
const world = createWorld();
const renderer = createRenderer(canvas);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10);

if (shot) {
  stageShot(world, shot, seed);
  renderer.render(world.state, input.poll());
  // Signal runner that screenshot is ready after 2 frames
  requestAnimationFrame(() => {
    renderer.render(world.state, input.poll());
    requestAnimationFrame(() => {
      renderer.render(world.state, input.poll());
      window.__shotReady = true;
    });
  });
} else {
  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    const poll = input.poll();
    world.step(dt, poll);
    renderer.render(world.state, poll);

    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}
