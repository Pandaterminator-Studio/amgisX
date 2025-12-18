const assert = require('node:assert');
const path = require('path');
const { GameApp } = require('../src/core/GameApp');

(async () => {
  const app = new GameApp({ rootPath: path.join(__dirname, '..') });
  const managers = app.initialize();

  assert.ok(managers.assets, 'AssetManager missing');
  assert.ok(managers.audio, 'AudioManager missing');
  assert.ok(managers.input, 'InputManager missing');
  assert.ok(managers.saves, 'SaveSystem missing');
  assert.ok(managers.world, 'WorldLoader missing');
  assert.ok(managers.scene, 'SceneManager missing');

  app.registerScene('stub', () => ({
    enter() {},
    update() {},
    render() {}
  }));

  managers.scene.push('stub');
  managers.scene.update(0);
  managers.scene.render({});

  await managers.assets.preloadAll();
  await managers.saves.save('slot-1', { level: 1 });
  const saved = await managers.saves.load('slot-1');
  assert.strictEqual(saved.level, 1, 'SaveSystem failed to persist payload');

  // Smoke check: parse default world snapshot from on-disk GameData
  const snapshot = await managers.world.loadDefaultWorldSnapshot();
  assert.ok(snapshot.worlds.length > 0, 'WorldLoader failed to parse worlds');
  assert.ok(snapshot.world.name, 'WorldLoader missing world name');
  assert.ok(snapshot.map.gridWidth > 0, 'WorldLoader missing map dimensions');
  assert.ok(snapshot.map.tiles.length > 0, 'WorldLoader missing tile data');

  console.log('All core scaffolding tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
