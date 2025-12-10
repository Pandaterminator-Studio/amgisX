class SaveSystem {
  constructor(config = {}) {
    this.config = config;
    this.adapter = null;
    this.slots = new Map();
  }

  setAdapter(adapter) {
    this.adapter = adapter;
  }

  async save(slotId, payload) {
    this.slots.set(slotId, { ...payload, updatedAt: Date.now() });
    if (this.adapter && typeof this.adapter.save === 'function') {
      await this.adapter.save(slotId, payload);
    }
  }

  async load(slotId) {
    if (this.adapter && typeof this.adapter.load === 'function') {
      return this.adapter.load(slotId);
    }
    return this.slots.get(slotId) || null;
  }

  async listSlots() {
    if (this.adapter && typeof this.adapter.list === 'function') {
      return this.adapter.list();
    }
    return Array.from(this.slots.entries()).map(([id, payload]) => ({ id, ...payload }));
  }
}

module.exports = { SaveSystem };
