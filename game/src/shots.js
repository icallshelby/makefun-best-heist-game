export function stageShot(world, shotName, seed) {
  world.state.bestScore = 5000;
  if (shotName === 'start') {
    world.state.screen = 'title';
  } else if (shotName === 'play') {
    world.reset();
    // Simulate 180 frames (3 seconds) of movement towards center/pedestal
    const dummyInput = { x: 0.8, y: -0.5, sneak: true, interact: false, coin: false };
    for (let i = 0; i < 180; i++) {
      world.step(1 / 60, dummyInput);
    }
    world.state.screen = 'play';
  } else if (shotName === 'alarm') {
    world.reset();
    const dummyInput = { x: 0, y: -1, sneak: false, interact: false, coin: false };
    for (let i = 0; i < 120; i++) {
      world.step(1 / 60, dummyInput);
    }
    world.state.alarm = 78;
    world.state.screen = 'play';
  } else if (shotName === 'end') {
    world.reset();
    world.state.maskCollected = true;
    world.state.score = 6500;
    world.state.bestScore = 6500;
    world.state.player.x = 1140;
    world.state.player.y = 80;
    world.state.screen = 'victory';
  }
}
