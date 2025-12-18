const fs = require('fs/promises');
const path = require('path');

class WorldLoader {
  constructor(config = {}) {
    this.config = config;
    this.cache = new Map();
  }

  async _readLines(filePath) {
    const raw = await fs.readFile(filePath, 'utf-8');
    return raw
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  }

  async listWorlds() {
    const worldsPath = path.join(this.config.basePath, 'Worlds.wrld');
    const lines = await this._readLines(worldsPath);
    return lines.map((line, index) => {
      const [id, name] = line.split('|').map(part => part?.trim());
      if (id == null || name == null) {
        throw new Error(`Malformed world entry on line ${index + 1}`);
      }
      const numericId = Number.parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        throw new Error(`Invalid world id on line ${index + 1}`);
      }
      return {
        id: numericId,
        name
      };
    });
  }

  async listMaps(worldName) {
    const mapsPath = path.join(this.config.basePath, worldName, `${worldName}.maps`);
    const lines = await this._readLines(mapsPath);
    return lines.map((line, index) => {
      const [id, fileName, width, height] = line.split('|').map(part => part?.trim());
      if (!id || !fileName) {
        throw new Error(`Malformed map entry on line ${index + 1}`);
      }
      const numericId = Number.parseInt(id, 10);
      const numericWidth = Number.parseInt(width || '0', 10);
      const numericHeight = Number.parseInt(height || '0', 10);
      if (Number.isNaN(numericId)) {
        throw new Error(`Invalid map id on line ${index + 1}`);
      }
      return {
        id: numericId,
        fileName,
        width: numericWidth,
        height: numericHeight
      };
    });
  }

  _parseLayerPayload(rawLayer, index, mapFileName) {
    const parts = rawLayer.split('|').map(part => part.trim());
    if (parts.length < 7) {
      throw new Error(`Map file ${mapFileName} layer ${index} is malformed.`);
    }

    const layerId = Number.parseInt(parts[0], 10);
    const layerName = parts[1];
    const tileWidth = Number.parseInt(parts[2], 10);
    const tileHeight = Number.parseInt(parts[3], 10);
    const gridWidth = Number.parseInt(parts[4], 10);
    const gridHeight = Number.parseInt(parts[5], 10);

    const tileTokens = parts[6]
      .split(/,\s*/)
      .filter(Boolean)
      .map(token => {
        const numericValue = Number.parseInt(token, 10);
        return Number.isNaN(numericValue) ? -1 : numericValue;
      });

    const expected = gridWidth * gridHeight;
    if (tileTokens.length < expected) {
      throw new Error(`Map file ${mapFileName} layer ${index} is missing tile data.`);
    }

    return {
      id: Number.isNaN(layerId) ? index : layerId,
      name: layerName || `layer-${index}`,
      tileWidth,
      tileHeight,
      gridWidth,
      gridHeight,
      tiles: tileTokens.slice(0, expected)
    };
  }

  async loadMap(worldName, mapFileName) {
    const mapPath = path.join(this.config.basePath, worldName, mapFileName);
    const raw = await fs.readFile(mapPath, 'utf-8');
    const layerChunks = raw
      .split(';')
      .map(chunk => chunk.trim())
      .filter(Boolean);
    if (!layerChunks.length) {
      throw new Error(`Map file ${mapFileName} is malformed.`);
    }

    const layers = layerChunks.map((chunk, index) => this._parseLayerPayload(chunk, index, mapFileName));
    const base = layers[0];

    return {
      tileWidth: base.tileWidth,
      tileHeight: base.tileHeight,
      gridWidth: base.gridWidth,
      gridHeight: base.gridHeight,
      tiles: base.tiles,
      layers,
      spriteSheet: path.join(this.config.basePath, worldName, `${worldName}.png`)
    };
  }

  async loadWorld(worldName) {
    const maps = await this.listMaps(worldName);
    const world = {
      id: maps[0]?.id ?? 0,
      name: worldName,
      maps
    };
    this.cache.set(worldName, world);
    return world;
  }

  async loadDefaultWorldSnapshot() {
    const worlds = await this.listWorlds();
    if (!worlds.length) {
      throw new Error('No worlds defined in Worlds.wrld');
    }
    const defaultWorld = await this.loadWorld(worlds[0].name);
    const defaultMap = defaultWorld.maps[0];
    if (!defaultMap) {
      throw new Error(`World ${defaultWorld.name} has no maps.`);
    }
    const mapData = await this.loadMap(defaultWorld.name, defaultMap.fileName);
    return {
      worlds,
      world: defaultWorld,
      map: {
        ...defaultMap,
        ...mapData
      }
    };
  }
}

module.exports = { WorldLoader };
