class SceneManager {
  constructor() {
    this._registry = new Map();
    this._stack = [];
  }

  /**
   * Registers a scene factory function.
   * @param {string} name
   * @param {Function} factory
   */
  register(name, factory) {
    if (!name || typeof factory !== 'function') {
      throw new Error('Scene registration requires a name and factory');
    }
    this._registry.set(name, factory);
  }

  /**
   * Pushes a new scene on the stack and runs its enter hook.
   * @param {string} name
   * @param {any} params
   * @returns {object}
   */
  push(name, params = undefined) {
    const factory = this._registry.get(name);
    if (!factory) {
      throw new Error(`Scene "${name}" is not registered`);
    }
    const scene = factory(params) || {};
    if (typeof scene.enter === 'function') {
      scene.enter(params);
    }
    this._stack.push(scene);
    return scene;
  }

  pop() {
    const scene = this._stack.pop();
    if (scene && typeof scene.exit === 'function') {
      scene.exit();
    }
    return scene;
  }

  replace(name, params = undefined) {
    this.pop();
    return this.push(name, params);
  }

  update(dt) {
    const current = this.peek();
    if (current && typeof current.update === 'function') {
      current.update(dt);
    }
  }

  render(context) {
    const current = this.peek();
    if (current && typeof current.render === 'function') {
      current.render(context);
    }
  }

  peek() {
    return this._stack[this._stack.length - 1];
  }
}

module.exports = { SceneManager };
