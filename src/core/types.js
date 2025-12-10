/**
 * @typedef {Object} AssetDescriptor
 * @property {string} id
 * @property {string} type
 * @property {string} source
 */

/**
 * @typedef {Object} AudioConfig
 * @property {number} masterVolume
 * @property {number} musicVolume
 * @property {number} sfxVolume
 */

/**
 * @typedef {Object} InputBindings
 * @property {string} moveUp
 * @property {string} moveDown
 * @property {string} moveLeft
 * @property {string} moveRight
 * @property {string} interact
 * @property {string} menu
 */

/**
 * @typedef {Object} SaveConfig
 * @property {string} directory
 */

/**
 * @typedef {Object} WorldConfig
 * @property {string} basePath
 */

/**
 * @typedef {Object} AssetConfig
 * @property {string} manifestPath
 */

/**
 * @typedef {Object} GameConfig
 * @property {AssetConfig} assets
 * @property {AudioConfig} audio
 * @property {InputBindings} input
 * @property {SaveConfig} saves
 * @property {WorldConfig} world
 */

module.exports = {};
