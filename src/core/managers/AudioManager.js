class AudioManager {
  constructor(config = {}) {
    this.config = { ...config };
    this.state = {
      muted: false,
      tracks: new Map()
    };
  }

  setVolumes(partial) {
    this.config = { ...this.config, ...partial };
  }

  mute() {
    this.state.muted = true;
  }

  unmute() {
    this.state.muted = false;
  }

  play(trackId) {
    this.state.tracks.set(trackId, { playing: true });
  }

  stop(trackId) {
    this.state.tracks.delete(trackId);
  }
}

module.exports = { AudioManager };
