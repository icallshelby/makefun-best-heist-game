export function createInput(canvas) {
  const keys = Object.create(null);
  let prevCoin = false;
  const state = {
    x: 0,
    y: 0,
    sneak: false,
    interactPressed: false,
    coinPressed: false,
    actionPressed: false,
    mousePos: { x: 0, y: 0 },
    clicked: false
  };

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      // prevent default scroll
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    state.mousePos.x = (e.clientX - rect.left) * scaleX;
    state.mousePos.y = (e.clientY - rect.top) * scaleY;
  });

  canvas.addEventListener('mousedown', (e) => {
    state.clicked = true;
    state.actionPressed = true;
  });

  return {
    poll() {
      let dx = 0;
      let dy = 0;
      if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      state.x = dx;
      state.y = dy;
      state.sneak = !!(keys['ShiftLeft'] || keys['ShiftRight']);
      state.interactPressed = !!(keys['KeyE'] || keys['KeyX'] || keys['Space']);
      
      const currentCoin = !!(keys['KeyC'] || keys['KeyQ']);
      state.coinPressed = currentCoin && !prevCoin;
      prevCoin = currentCoin;
      
      const clicked = state.clicked;
      const action = state.actionPressed;
      state.clicked = false;
      state.actionPressed = false;

      return {
        x: state.x,
        y: state.y,
        sneak: state.sneak,
        interact: state.interactPressed,
        coin: state.coinPressed,
        clicked,
        action,
        mousePos: { ...state.mousePos }
      };
    }
  };
}
