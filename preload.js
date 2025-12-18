const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const WORLDS_BASE_PATH = path.join(__dirname, 'GameData', 'Worlds');
const SETTINGS_PATH = path.join(__dirname, 'GameData', 'settings.json');
const CHARACTERS_BASE_PATH = path.join(__dirname, 'GameData', 'Characters');
const ENEMIES_PATH = path.join(__dirname, 'GameData', 'Enemies', 'enemies.json');
const NPCS_PATH = path.join(__dirname, 'GameData', 'NPCs', 'npcs.json');
const ITEMS_PATH = path.join(__dirname, 'GameData', 'Items', 'items.json');
const QUESTS_PATH = path.join(__dirname, 'GameData', 'Quests', 'quests.json');
const SAVES_DIR = path.join(__dirname, 'GameData', 'Saves');
const SAVES_PATH = path.join(SAVES_DIR, 'slots.json');
const SAVE_SLOT_IDS = Object.freeze(['slot-1', 'slot-2', 'slot-3']);
const CHARACTER_CATEGORIES = Object.freeze(['Female', 'Male']);
const DEFAULT_SETTINGS = Object.freeze({
  zoom: 1,
  lastCharacterPath: null,
  quests: {
    progress: {},
    trackedQuestId: null
  }
});

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
  textNodeName: 'text'
});

const TILED_GID_MASK = 0x1fffffff;

function ensureArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function toInt(value, fallback = null) {
  const numeric = Number.parseInt(value, 10);
  return Number.isNaN(numeric) ? fallback : numeric;
}

function toRendererAssetPath(absolutePath) {
  const relative = path.relative(__dirname, absolutePath);
  return relative.split(path.sep).join('/');
}

async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

function normalizeSaveSlotsPayload(raw) {
  const payload = {};
  for (const slotId of SAVE_SLOT_IDS) {
    const entry = raw && typeof raw === 'object' ? raw[slotId] : null;
    if (entry && typeof entry === 'object' && entry.data) {
      payload[slotId] = {
        savedAt: Number(entry.savedAt) || Date.now(),
        data: entry.data
      };
    } else {
      payload[slotId] = { savedAt: null, data: null };
    }
  }
  return payload;
}

async function readSaveSlots() {
  try {
    const raw = await fs.readFile(SAVES_PATH, 'utf-8');
    return normalizeSaveSlotsPayload(JSON.parse(raw));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return normalizeSaveSlotsPayload({});
    }
    throw error;
  }
}

async function writeSaveSlots(slots) {
  await ensureDirectory(SAVES_DIR);
  await fs.writeFile(SAVES_PATH, JSON.stringify(slots, null, 2), 'utf-8');
}

async function loadSettingsFile() {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to read settings.json:', error.message);
    }
    return { ...DEFAULT_SETTINGS };
  }
}

async function saveSettingsFile(patch = {}) {
  const current = await loadSettingsFile();
  const next = { ...current, ...patch };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

async function loadCharacterAssets() {
  const payload = {};
  for (const category of CHARACTER_CATEGORIES) {
    const categoryPath = path.join(CHARACTERS_BASE_PATH, category);
    let files = [];
    try {
      files = await fs.readdir(categoryPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`Failed to read characters in ${categoryPath}:`, error.message);
      }
      continue;
    }

    const sprites = files
      .filter((file) => file.toLowerCase().endsWith('.png'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((file) => ({
        name: path.parse(file).name,
        file: toRendererAssetPath(path.join(categoryPath, file)),
        gender: category
      }));

    if (sprites.length) {
      payload[category] = sprites;
    }
  }

  return payload;
}

async function loadEnemies() {
  try {
    const raw = await fs.readFile(ENEMIES_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to read enemies.json:', error.message);
    }
    return [];
  }
}

async function loadNpcs() {
  try {
    const raw = await fs.readFile(NPCS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to read npcs.json:', error.message);
    }
    return [];
  }
}

async function loadItems() {
  try {
    const raw = await fs.readFile(ITEMS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to read items.json:', error.message);
    }
    return [];
  }
}

async function loadQuests() {
  try {
    const raw = await fs.readFile(QUESTS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to read quests.json:', error.message);
    }
    return [];
  }
}

function parseCsvTileData(csvText, expectedCount, mapFileName, layerName) {
  if (!csvText) {
    throw new Error(`Layer ${layerName} in ${mapFileName} has no tile payload`);
  }
  const tokens = csvText
    .split(/,\s*/)
    .map(token => {
      const gid = toInt(token.trim(), 0) || 0;
      return gid & TILED_GID_MASK;
    });
  if (tokens.length < expectedCount) {
    throw new Error(`Layer ${layerName} in ${mapFileName} is missing tile data`);
  }
  return tokens.slice(0, expectedCount);
}

function parseTiledProperties(propertiesNode) {
  if (!propertiesNode) {
    return {};
  }
  const entries = ensureArray(propertiesNode.property);
  if (!entries.length) {
    return {};
  }
  const parsed = {};
  for (const entry of entries) {
    const name = entry?.name;
    if (!name) {
      continue;
    }
    const declaredType = typeof entry.type === 'string' ? entry.type.toLowerCase() : 'string';
    let value = entry.value;
    if (value === undefined && entry.text !== undefined) {
      value = entry.text;
    }
    const type = declaredType || (typeof value === 'number' ? 'float' : 'string');
    let resolved;
    switch (type) {
      case 'bool':
      case 'boolean': {
        if (typeof value === 'boolean') {
          resolved = value;
        } else if (typeof value === 'number') {
          resolved = value !== 0;
        } else if (typeof value === 'string') {
          resolved = ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
        } else {
          resolved = false;
        }
        break;
      }
      case 'int':
      case 'integer': {
        const numeric = Number.parseInt(value, 10);
        resolved = Number.isNaN(numeric) ? 0 : numeric;
        break;
      }
      case 'float':
      case 'double':
      case 'number': {
        const numeric = Number.parseFloat(value);
        resolved = Number.isNaN(numeric) ? 0 : numeric;
        break;
      }
      default: {
        resolved = value === undefined || value === null ? '' : String(value);
        break;
      }
    }
    parsed[name] = resolved;
  }
  return parsed;
}

async function buildTilesetPayload(worldName, mapDir, tilesetRef, defaults, mapFileName) {
  if (!tilesetRef) {
    throw new Error(`Missing tileset definition in ${mapFileName}`);
  }
  let tilesetNode = tilesetRef;
  let tilesetDir = mapDir;
  if (tilesetRef.source) {
    const tsxPath = path.join(mapDir, tilesetRef.source);
    let raw;
    try {
      raw = await fs.readFile(tsxPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read tileset ${tilesetRef.source} for ${mapFileName}: ${error.message}`);
    }
    const parsedTsx = xmlParser.parse(raw);
    tilesetNode = parsedTsx?.tileset;
    tilesetDir = path.dirname(tsxPath);
    if (!tilesetNode) {
      throw new Error(`Tileset ${tilesetRef.source} for ${mapFileName} is malformed`);
    }
  }

  const firstgid = toInt(tilesetRef.firstgid ?? tilesetNode.firstgid, 1) ?? 1;
  const tileWidth = toInt(tilesetNode.tilewidth, defaults.tileWidth) ?? defaults.tileWidth;
  const tileHeight = toInt(tilesetNode.tileheight, defaults.tileHeight) ?? defaults.tileHeight;
  const imageNode = tilesetNode.image;
  if (!imageNode?.source) {
    throw new Error(`Tileset ${tilesetNode.name || tilesetRef.source || firstgid} in ${mapFileName} is missing an image source`);
  }
  const imageAbsolute = path.normalize(path.join(tilesetDir, imageNode.source));
  const imageWidth = toInt(imageNode.width, tileWidth) ?? tileWidth;
  const imageHeight = toInt(imageNode.height, tileHeight) ?? tileHeight;
  const computedColumns = imageWidth && tileWidth ? Math.max(1, Math.floor(imageWidth / tileWidth)) : 1;
  const columns = toInt(tilesetNode.columns, computedColumns) || computedColumns;
  const computedRows = imageHeight && tileHeight ? Math.max(1, Math.floor(imageHeight / tileHeight)) : 1;
  const tilecount = toInt(tilesetNode.tilecount, columns * computedRows) || columns * computedRows;

  return {
    name: tilesetNode.name || `tileset-${firstgid}`,
    firstgid,
    tilecount,
    columns,
    tileWidth,
    tileHeight,
    image: toRendererAssetPath(imageAbsolute),
    imageWidth,
    imageHeight
  };
}

function parseTiledLayer(layerNode, index, defaults, mapFileName) {
  const name = layerNode.name || `layer-${index + 1}`;
  const gridWidth = toInt(layerNode.width, defaults.gridWidth) ?? defaults.gridWidth;
  const gridHeight = toInt(layerNode.height, defaults.gridHeight) ?? defaults.gridHeight;
  const expectedTiles = gridWidth * gridHeight;
  const dataNode = layerNode.data;
  const csvText = typeof dataNode === 'string' ? dataNode : dataNode?.text;
  const tiles = parseCsvTileData(csvText, expectedTiles, mapFileName, name);
  const properties = parseTiledProperties(layerNode.properties);
  return {
    id: toInt(layerNode.id, index + 1) ?? index + 1,
    name,
    tileWidth: defaults.tileWidth,
    tileHeight: defaults.tileHeight,
    gridWidth,
    gridHeight,
    tiles,
    properties
  };
}

async function parseTiledMap(worldName, mapFileName) {
  const mapPath = path.join(WORLDS_BASE_PATH, worldName, mapFileName);
  let raw;
  try {
    raw = await fs.readFile(mapPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read ${mapFileName}: ${error.message}`);
  }
  const parsed = xmlParser.parse(raw);
  const mapNode = parsed?.map;
  if (!mapNode) {
    throw new Error(`${mapFileName} is not a valid TMX map`);
  }

  const gridWidth = toInt(mapNode.width);
  const gridHeight = toInt(mapNode.height);
  const tileWidth = toInt(mapNode.tilewidth);
  const tileHeight = toInt(mapNode.tileheight);
  if ([gridWidth, gridHeight, tileWidth, tileHeight].some(value => !Number.isFinite(value))) {
    throw new Error(`${mapFileName} has invalid dimensions`);
  }

  const mapDir = path.dirname(mapPath);
  const tilesetRefs = ensureArray(mapNode.tileset);
  if (!tilesetRefs.length) {
    throw new Error(`${mapFileName} does not reference any tilesets`);
  }
  const tilesets = await Promise.all(
    tilesetRefs.map(ref => buildTilesetPayload(worldName, mapDir, ref, { tileWidth, tileHeight }, mapFileName))
  );
  tilesets.sort((a, b) => a.firstgid - b.firstgid);

  const layerNodes = ensureArray(mapNode.layer);
  if (!layerNodes.length) {
    throw new Error(`${mapFileName} does not contain any layers`);
  }
  const defaults = { gridWidth, gridHeight, tileWidth, tileHeight };
  const layers = layerNodes.map((layerNode, index) => parseTiledLayer(layerNode, index, defaults, mapFileName));
  const base = layers[0];

  return {
    tileWidth: base.tileWidth,
    tileHeight: base.tileHeight,
    gridWidth: base.gridWidth,
    gridHeight: base.gridHeight,
    tiles: base.tiles,
    layers,
    spriteSheet: tilesets[0]?.image || null,
    tilesets
  };
}

async function readFileTrimmed(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function parseWorldLine(line, index) {
  const [id, name, difficulty = 'Uncharted', biome = 'Unknown biome', summary = 'Awaiting guild intel.'] =
    line.split('|').map(part => part?.trim());
  if (!id || !name) {
    throw new Error(`Invalid world entry on line ${index + 1}`);
  }
  const numericId = Number.parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    throw new Error(`Invalid world id "${id}" on line ${index + 1}`);
  }
  return { id: numericId, name, difficulty, biome, summary };
}

function parseMapLine(line, index) {
  const parts = line.split('|').map(part => part?.trim());
  const [id, fileName, width, height, spawnX, spawnY, difficulty, threat, summary, weather, recommendation] = parts;
  if (!id || !fileName || !width || !height) {
    throw new Error(`Invalid map entry on line ${index + 1}`);
  }
  const numericId = Number.parseInt(id, 10);
  const numericWidth = Number.parseInt(width, 10);
  const numericHeight = Number.parseInt(height, 10);
  if ([numericId, numericWidth, numericHeight].some(Number.isNaN)) {
    throw new Error(`Invalid numeric value in map entry on line ${index + 1}`);
  }
  const numericSpawnX = Number.parseInt(spawnX ?? '', 10);
  const numericSpawnY = Number.parseInt(spawnY ?? '', 10);
  return {
    id: numericId,
    fileName,
    name: path.parse(fileName).name,
    width: numericWidth,
    height: numericHeight,
    spawn: {
      x: Number.isNaN(numericSpawnX) ? null : numericSpawnX,
      y: Number.isNaN(numericSpawnY) ? null : numericSpawnY
    },
    difficulty: difficulty || 'Unknown difficulty',
    threat: threat || 'Uncatalogued threat',
    summary: summary || 'Awaiting recon report.',
    weather: weather || 'Weather data unavailable',
    recommendation: recommendation || 'Standard expedition kit'
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

function parseLegacyLayerPayload(rawLayer, index, mapFileName) {
  const layerParts = rawLayer.split('|').map(part => part.trim());
  if (layerParts.length < 7) {
    throw new Error(`Map file ${mapFileName} layer ${index} is malformed`);
  }

  const layerId = Number.parseInt(layerParts[0], 10);
  const layerName = layerParts[1];
  const tileWidth = Number.parseInt(layerParts[2], 10);
  const tileHeight = Number.parseInt(layerParts[3], 10);
  const gridWidth = Number.parseInt(layerParts[4], 10);
  const gridHeight = Number.parseInt(layerParts[5], 10);
  if ([tileWidth, tileHeight, gridWidth, gridHeight].some(Number.isNaN)) {
    throw new Error(`Map file ${mapFileName} has invalid dimensions in layer ${index}`);
  }

  const tilesRaw = layerParts[6]
    .split(/,\s*/)
    .filter(Boolean)
    .map(token => {
      const numericValue = Number.parseInt(token, 10);
      return Number.isNaN(numericValue) ? -1 : numericValue;
    });
  const expectedTiles = gridWidth * gridHeight;
  if (tilesRaw.length < expectedTiles) {
    throw new Error(`Map file ${mapFileName} layer ${index} is missing tile data`);
  }

  return {
    id: Number.isNaN(layerId) ? index : layerId,
    name: layerName || `layer-${index}`,
    tileWidth,
    tileHeight,
    gridWidth,
    gridHeight,
    tiles: tilesRaw.slice(0, expectedTiles)
  };
}

function parseLegacyMapPayload(raw, worldName, mapFileName) {
  const layerChunks = raw
    .split(';')
    .map(chunk => chunk.trim())
    .filter(Boolean);
  if (!layerChunks.length) {
    throw new Error(`Map file ${mapFileName} is empty or malformed`);
  }

  const layers = layerChunks.map((chunk, index) => parseLegacyLayerPayload(chunk, index, mapFileName));
  const base = layers[0];

  return {
    tileWidth: base.tileWidth,
    tileHeight: base.tileHeight,
    gridWidth: base.gridWidth,
    gridHeight: base.gridHeight,
    tiles: base.tiles,
    layers,
    spriteSheet: `GameData/Worlds/${worldName}/${worldName}.png`
  };
}

async function loadLegacyMap(worldName, mapFileName) {
  const mapPath = path.join(WORLDS_BASE_PATH, worldName, mapFileName);
  let raw;
  try {
    raw = await fs.readFile(mapPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read ${mapFileName}: ${error.message}`);
  }
  return parseLegacyMapPayload(raw, worldName, mapFileName);
}

async function loadMap(worldName, mapFileName) {
  const ext = path.extname(mapFileName).toLowerCase();
  if (ext === '.tmx') {
    return parseTiledMap(worldName, mapFileName);
  }
  return loadLegacyMap(worldName, mapFileName);
}

async function buildInitialPayload() {
  const [worlds, settings, characters, enemies, npcs, items, quests] = await Promise.all([
    loadWorlds(),
    loadSettingsFile(),
    loadCharacterAssets(),
    loadEnemies(),
    loadNpcs(),
    loadItems(),
    loadQuests()
  ]);
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
    },
    settings,
    characters,
    enemies,
    npcs,
    items,
    quests
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

  ,
  quit: () => {
    ipcRenderer.send('amgis:quit');
  }

  ,
  listWorlds: async () => {
    try {
      const worlds = await loadWorlds();
      return { ok: true, data: worlds };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  ,
  listMaps: async (worldName) => {
    try {
      const maps = await loadMapsForWorld(worldName);
      return { ok: true, data: maps };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  ,
  loadMap: async (worldName, mapFileName) => {
    try {
      const map = await loadMap(worldName, mapFileName);
      return { ok: true, data: map };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  ,
  getSettings: async () => {
    try {
      const settings = await loadSettingsFile();
      return { ok: true, data: settings };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  ,
  saveSettings: async (patch) => {
    try {
      const settings = await saveSettingsFile(patch || {});
      return { ok: true, data: settings };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  ,
  listSaves: async () => {
    try {
      const slots = await readSaveSlots();
      const data = SAVE_SLOT_IDS.map(slotId => ({
        slotId,
        savedAt: slots[slotId]?.savedAt || null,
        data: slots[slotId]?.data || null
      }));
      return { ok: true, data };
    } catch (error) {
      console.error('Failed to list saves:', error);
      return { ok: false, error: error.message };
    }
  }

  ,
  saveSlot: async (slotId, payload) => {
    try {
      if (!SAVE_SLOT_IDS.includes(slotId)) {
        throw new Error('Invalid save slot id.');
      }
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid save payload.');
      }
      const slots = await readSaveSlots();
      slots[slotId] = {
        savedAt: Date.now(),
        data: payload
      };
      await writeSaveSlots(slots);
      return {
        ok: true,
        data: {
          slotId,
          savedAt: slots[slotId].savedAt
        }
      };
    } catch (error) {
      console.error('Failed to save slot:', error);
      return { ok: false, error: error.message };
    }
  }

  ,
  deleteSave: async (slotId) => {
    try {
      if (!SAVE_SLOT_IDS.includes(slotId)) {
        throw new Error('Invalid save slot id.');
      }
      const slots = await readSaveSlots();
      slots[slotId] = { savedAt: null, data: null };
      await writeSaveSlots(slots);
      return { ok: true };
    } catch (error) {
      console.error('Failed to delete save slot:', error);
      return { ok: false, error: error.message };
    }
  }
});
