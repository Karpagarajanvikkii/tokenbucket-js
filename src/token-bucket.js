'use strict';

class TokenBucket {
  constructor({ capacity = 100, refillRate = 10, refillInterval = 1000 } = {}) {
    if (capacity <= 0) throw new RangeError('capacity must be positive');
    if (refillRate <= 0) throw new RangeError('refillRate must be positive');

    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;
    this.lastRefill = Date.now();
  }

  _refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillInterval) * this.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  consume(count = 1) {
    this._refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return {
        allowed: true,
        remaining: this.tokens,
        resetAt: this.lastRefill + this.refillInterval,
        retryAfter: 0,
      };
    }

    const deficit = count - this.tokens;
    const intervalsNeeded = Math.ceil(deficit / this.refillRate);
    const retryAfter = intervalsNeeded * this.refillInterval;

    return {
      allowed: false,
      remaining: 0,
      resetAt: this.lastRefill + retryAfter,
      retryAfter,
    };
  }

  peek() {
    this._refill();
    return this.tokens;
  }

  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

module.exports = { TokenBucket };
