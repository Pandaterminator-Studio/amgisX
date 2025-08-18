const fs = require('fs');
const path = require('path');

window.addEventListener('DOMContentLoaded', () => {
  const basePath = path.join(__dirname, 'GameData', 'Worlds');

  // Load worlds metadata
  const worldsRaw = fs.readFileSync(path.join(basePath, 'Worlds.wrld'), 'utf-8')
    .trim()
    .split('\n');
  const worlds = worldsRaw.map(line => {
    const [id, name] = line.split('|');
    return { id: parseInt(id, 10), name: name.trim() };
  });
  const world = worlds[0];

  // Load maps metadata for the selected world
  const mapsRaw = fs.readFileSync(path.join(basePath, world.name, `${world.name}.maps`), 'utf-8')
    .trim()
    .split('\n');
  const mapInfo = mapsRaw[0].split('|');
  const mapFileName = mapInfo[1].trim();
  const mapWidth = parseInt(mapInfo[2], 10);
  const mapHeight = parseInt(mapInfo[3], 10);

  // Load map data
  const mapRaw = fs.readFileSync(path.join(basePath, world.name, mapFileName), 'utf-8');
  const mapParts = mapRaw.split('|');
  const tileWidth = parseInt(mapParts[2], 10);
  const tileHeight = parseInt(mapParts[3], 10);
  const gridWidth = parseInt(mapParts[4], 10);
  const gridHeight = parseInt(mapParts[5], 10);
  const tiles = mapParts[6]
    .split(/,\s*/)
    .filter(Boolean)
    .map(n => parseInt(n, 10))
    .slice(0, gridWidth * gridHeight);

  const canvas = document.getElementById('map');
  canvas.width = gridWidth * tileWidth;
  canvas.height = gridHeight * tileHeight;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.src = path.join('GameData', 'Worlds', world.name, `${world.name}.png`);

  // Simple game state object; will expand as features are added
  const state = {
    lastFrameTime: 0,
    player: {
      x: 0,
      y: 0,
      width: tileWidth,
      height: tileHeight,
      speed: 0.2 // pixels per ms
    },
    keys: {}
  };

  window.addEventListener('keydown', e => {
    state.keys[e.key] = true;
  });

  window.addEventListener('keyup', e => {
    delete state.keys[e.key];
  });

  function update(delta) {
    const p = state.player;
    if (state.keys.ArrowUp) {
      p.y = Math.max(0, p.y - p.speed * delta);
    }
    if (state.keys.ArrowDown) {
      p.y = Math.min(canvas.height - p.height, p.y + p.speed * delta);
    }
    if (state.keys.ArrowLeft) {
      p.x = Math.max(0, p.x - p.speed * delta);
    }
    if (state.keys.ArrowRight) {
      p.x = Math.min(canvas.width - p.width, p.x + p.speed * delta);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tilesPerRow = 8;
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const sx = (tile % tilesPerRow) * tileWidth;
      const sy = Math.floor(tile / tilesPerRow) * tileHeight;
      const dx = (i % gridWidth) * tileWidth;
      const dy = Math.floor(i / gridWidth) * tileHeight;
      ctx.drawImage(img, sx, sy, tileWidth, tileHeight, dx, dy, tileWidth, tileHeight);
    }

    // Draw player
    const p = state.player;
    ctx.fillStyle = 'red';
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }

  function gameLoop(timestamp) {
    const delta = timestamp - state.lastFrameTime;
    state.lastFrameTime = timestamp;
    update(delta);
    render();
    requestAnimationFrame(gameLoop);
  }

  img.onload = () => {
    requestAnimationFrame(gameLoop);
  };
});
