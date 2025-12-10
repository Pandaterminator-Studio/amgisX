const fs = require('fs/promises');
const EventEmitter = require('events');

class AssetManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this._manifest = [];
    this._cache = new Map();
  }

  async loadManifest() {
    if (!this.config.manifestPath) {
      throw new Error('Asset manifest path is not configured.');
    }
    const raw = await fs.readFile(this.config.manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);
    if (!Array.isArray(manifest)) {
      throw new Error('Asset manifest must be an array.');
    }
    this._manifest = manifest;
    this.emit('manifest:loaded', manifest);
    return manifest;
  }

  /**
   * Placeholder preload routine. Extend with real asset loading later.
   * Emits `progress` events while iterating through the manifest.
   * @returns {Promise<void>}
   */
  async preloadAll() {
    const total = this._manifest.length || 1;
    let loaded = 0;
    for (const entry of this._manifest) {
      this._cache.set(entry.id, { status: 'loaded', entry });
      loaded += 1;
      this.emit('progress', {
        loaded,
        total,
        ratio: loaded / total,
        entry
      });
    }
  }

  get(assetId) {
    return this._cache.get(assetId) || null;
  }

  clear() {
    this._cache.clear();
  }
}

module.exports = { AssetManager };
