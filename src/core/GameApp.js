const path = require('path');
const defaults = require('../config/defaults.json');
const { AssetManager } = require('./managers/AssetManager');
const { AudioManager } = require('./managers/AudioManager');
const { InputManager } = require('./managers/InputManager');
const { SaveSystem } = require('./managers/SaveSystem');
const { WorldLoader } = require('./managers/WorldLoader');
const { SceneManager } = require('./managers/SceneManager');

function mergeDeep(base, extra) {
  if (!extra) {
    return { ...base };
  }
  const output = { ...base };
  for (const key of Object.keys(extra)) {
    const baseValue = base[key];
    const extraValue = extra[key];
    if (baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
      output[key] = mergeDeep(baseValue, extraValue);
    } else {
      output[key] = extraValue;
    }
  }
  return output;
}

class GameApp {
  constructor(options = {}) {
    const resolvedConfig = mergeDeep(defaults, options.config || {});
    this.rootPath = options.rootPath || process.cwd();
    this.config = {
      ...resolvedConfig,
      world: {
        ...resolvedConfig.world,
        basePath: path.resolve(this.rootPath, resolvedConfig.world.basePath)
      },
      assets: {
        ...resolvedConfig.assets,
        manifestPath: path.resolve(this.rootPath, resolvedConfig.assets.manifestPath)
      }
    };
    this.managers = {
      assets: new AssetManager(this.config.assets),
      audio: new AudioManager(this.config.audio),
      input: new InputManager(this.config.input),
      saves: new SaveSystem(this.config.saves),
      world: new WorldLoader(this.config.world),
      scene: new SceneManager()
    };
  }

  initialize() {
    return this.managers;
  }

  registerScene(name, factory) {
    this.managers.scene.register(name, factory);
  }

  startScene(name, params) {
    return this.managers.scene.replace(name, params);
  }

  getManager(name) {
    return this.managers[name];
  }
}

module.exports = { GameApp };
