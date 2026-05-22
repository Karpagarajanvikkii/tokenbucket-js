'use strict';

class SlidingWindow {
  constructor({ capacity = 100, windowSize = 60000 } = {}) {
    if (capacity <= 0) throw new RangeError('capacity must be positive');
    if (windowSize <= 0) throw new RangeError('windowSize must be positive');

    this.capacity = capacity;
    this.windowSize = windowSize;
    this.timestamps = [];
  }

  _prune() {
    const cutoff = Date.now() - this.windowSize;
    while (this.timestamps.length > 0 && this.timestamps[0] <= cutoff) {
      this.timestamps.shift();
    }
  }

  consume(count = 1) {
    this._prune();

    if (this.timestamps.length + count <= this.capacity) {
      const now = Date.now();
      for (let i = 0; i < count; i++) {
        this.timestamps.push(now);
      }

      return {
        allowed: true,
        remaining: this.capacity - this.timestamps.length,
        resetAt: this.timestamps[0] + this.windowSize,
        retryAfter: 0,
      };
    }

    const oldestExpiry = this.timestamps[0] + this.windowSize;
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestExpiry,
      retryAfter: oldestExpiry - Date.now(),
    };
  }

  peek() {
    this._prune();
    return this.capacity - this.timestamps.length;
  }

  reset() {
    this.timestamps = [];
  }
}

module.exports = { SlidingWindow };
