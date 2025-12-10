class InputManager {
  constructor(defaultBindings = {}, overrides = {}) {
    this.defaultBindings = { ...defaultBindings };
    this.bindings = { ...defaultBindings, ...overrides };
    this.listeners = new Map();
  }

  bind(action, key) {
    this.bindings[action] = key;
  }

  reset(action) {
    if (action && this.defaultBindings[action]) {
      this.bindings[action] = this.defaultBindings[action];
      return;
    }
    this.bindings = { ...this.defaultBindings };
  }

  on(action, handler) {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set());
    }
    this.listeners.get(action).add(handler);
  }

  off(action, handler) {
    const handlers = this.listeners.get(action);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  dispatch(action, payload) {
    const handlers = this.listeners.get(action);
    if (handlers) {
      handlers.forEach(fn => fn(payload));
    }
  }
}

module.exports = { InputManager };
