const { contextBridge } = require('electron');
const fs = require('fs/promises');
const path = require('path');

const WORLDS_BASE_PATH = path.join(__dirname, 'GameData', 'Worlds');

async function readFileTrimmed(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function parseWorldLine(line, index) {
  const [id, name] = line.split('|').map(part => part?.trim());
  if (!id || !name) {
    throw new Error(`Invalid world entry on line ${index + 1}`);
  }
  const numericId = Number.parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    throw new Error(`Invalid world id "${id}" on line ${index + 1}`);
  }
  return { id: numericId, name };
}

function parseMapLine(line, index) {
  const [id, fileName, width, height] = line.split('|').map(part => part?.trim());
  if (!id || !fileName || !width || !height) {
    throw new Error(`Invalid map entry on line ${index + 1}`);
  }
  const numericId = Number.parseInt(id, 10);
  const numericWidth = Number.parseInt(width, 10);
  const numericHeight = Number.parseInt(height, 10);
  if ([numericId, numericWidth, numericHeight].some(Number.isNaN)) {
    throw new Error(`Invalid numeric value in map entry on line ${index + 1}`);
  }
  return {
    id: numericId,
    fileName,
    name: path.parse(fileName).name,
    width: numericWidth,
    height: numericHeight
  };
}

async function loadWorlds() {
  const lines = await readFileTrimmed(path.join(WORLDS_BASE_PATH, 'Worlds.wrld'));
  if (!lines.length) {
    throw new Error('Worlds.wrld is empty');
  }
  return lines.map(parseWorldLine);
}

async function loadMapsForWorld(worldName) {
  const mapsPath = path.join(WORLDS_BASE_PATH, worldName, `${worldName}.maps`);
  const lines = await readFileTrimmed(mapsPath);
  if (!lines.length) {
    throw new Error(`${worldName}.maps is empty`);
  }
  return lines.map(parseMapLine);
}

function parseMapPayload(raw, worldName, mapFileName) {
  const mapParts = raw.split('|').map(part => part.trim());
  if (mapParts.length < 7) {
    throw new Error(`Map file ${mapFileName} is malformed`);
  }
  const tileWidth = Number.parseInt(mapParts[2], 10);
  const tileHeight = Number.parseInt(mapParts[3], 10);
  const gridWidth = Number.parseInt(mapParts[4], 10);
  const gridHeight = Number.parseInt(mapParts[5], 10);
  if ([tileWidth, tileHeight, gridWidth, gridHeight].some(Number.isNaN)) {
    throw new Error(`Map file ${mapFileName} has invalid dimensions`);
  }
  const tilesRaw = mapParts[6]
    .split(/,\s*/)
    .filter(Boolean)
    .map(token => {
      const numericValue = Number.parseInt(token, 10);
      return Number.isNaN(numericValue) ? -1 : numericValue;
    });
  const expectedTiles = gridWidth * gridHeight;
  if (tilesRaw.length < expectedTiles) {
    throw new Error(`Map file ${mapFileName} is missing tile data`);
  }
  return {
    tileWidth,
    tileHeight,
    gridWidth,
    gridHeight,
    tiles: tilesRaw.slice(0, expectedTiles),
    spriteSheet: `GameData/Worlds/${worldName}/${worldName}.png`
  };
}

async function loadMap(worldName, mapFileName) {
  const mapPath = path.join(WORLDS_BASE_PATH, worldName, mapFileName);
  let raw;
  try {
    raw = await fs.readFile(mapPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read ${mapFileName}: ${error.message}`);
  }
  return parseMapPayload(raw, worldName, mapFileName);
}

async function buildInitialPayload() {
  const worlds = await loadWorlds();
  const selectedWorld = worlds[0];
  const maps = await loadMapsForWorld(selectedWorld.name);
  const selectedMap = maps[0];
  const mapData = await loadMap(selectedWorld.name, selectedMap.fileName);
  return {
    worlds,
    selectedWorld,
    mapsByWorld: {
      [selectedWorld.name]: maps
    },
    currentMap: {
      ...selectedMap,
      ...mapData
    }
  };
}

contextBridge.exposeInMainWorld('amgis', {
  loadInitialData: async () => {
    try {
      const data = await buildInitialPayload();
      return { ok: true, data };
    } catch (error) {
      console.error('Amgis data load failed:', error);
      return { ok: false, error: error.message };
    }
  }
});
