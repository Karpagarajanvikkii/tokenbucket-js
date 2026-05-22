'use strict';

const { TokenBucket } = require('./token-bucket');
const { SlidingWindow } = require('./sliding-window');

function createLimiter(opts = {}) {
  const {
    algorithm = 'token-bucket',
    capacity = 100,
    refillRate = 10,
    refillInterval = 1000,
    windowSize = 60000,
  } = opts;

  if (algorithm === 'sliding-window') {
    return new SlidingWindow({ capacity, windowSize });
  }

  return new TokenBucket({ capacity, refillRate, refillInterval });
}

function rateLimit(opts = {}) {
  const limiter = createLimiter(opts);
  const keyFn = opts.keyBy || (req => req.ip || req.socket?.remoteAddress || 'unknown');
  const limiters = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const key = keyFn(req);

    if (!limiters.has(key)) {
      limiters.set(key, createLimiter(opts));
    }

    const bucket = limiters.get(key);
    const result = bucket.consume(opts.cost || 1);

    res.setHeader('X-RateLimit-Limit', bucket.capacity);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt);

    if (!result.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil(result.retryAfter / 1000),
      });
      return;
    }

    next();
  };
}

module.exports = { createLimiter, rateLimit, TokenBucket, SlidingWindow };
