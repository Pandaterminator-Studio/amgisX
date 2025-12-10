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

  console.log('All core scaffolding tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
