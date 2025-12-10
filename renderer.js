const TILES_PER_ROW = 8; // TODO: derive from metadata once available

function renderMap(canvas, mapData, onError) {
  const ctx = canvas.getContext('2d');
  canvas.width = mapData.gridWidth * mapData.tileWidth;
  canvas.height = mapData.gridHeight * mapData.tileHeight;

  const img = new Image();
  img.src = mapData.spriteSheet;
  img.onload = () => {
    for (let i = 0; i < mapData.tiles.length; i++) {
      const tile = mapData.tiles[i];
      if (tile < 0) {
        continue;
      }
      const sx = (tile % TILES_PER_ROW) * mapData.tileWidth;
      const sy = Math.floor(tile / TILES_PER_ROW) * mapData.tileHeight;
      const dx = (i % mapData.gridWidth) * mapData.tileWidth;
      const dy = Math.floor(i / mapData.gridWidth) * mapData.tileHeight;
      ctx.drawImage(
        img,
        sx,
        sy,
        mapData.tileWidth,
        mapData.tileHeight,
        dx,
        dy,
        mapData.tileWidth,
        mapData.tileHeight
      );
    }
  };

  img.onerror = () => {
    const error = new Error(`Failed to load sprite sheet at ${mapData.spriteSheet}`);
    if (typeof onError === 'function') {
      onError(error);
    } else {
      console.error(error);
    }
  };
}

function showStatus(statusEl, message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

async function bootstrap() {
  const canvas = document.getElementById('map');
  const statusEl = document.getElementById('status');

  if (!window.amgis || typeof window.amgis.loadInitialData !== 'function') {
    showStatus(statusEl, 'Data layer unavailable.', true);
    return;
  }

  showStatus(statusEl, 'Loading world data...');
  const result = await window.amgis.loadInitialData();

  if (!result.ok) {
    showStatus(statusEl, `Error: ${result.error}`, true);
    return;
  }

  const { selectedWorld, currentMap } = result.data;
  showStatus(statusEl, `World: ${selectedWorld.name} | Map: ${currentMap.name}`);
  renderMap(canvas, currentMap, error => showStatus(statusEl, `Error: ${error.message}`, true));
}

window.addEventListener('DOMContentLoaded', bootstrap);
