const { TokenBucket, SlidingWindow, createLimiter } = require('../src');

describe('TokenBucket', () => {
  let bucket;

  beforeEach(() => {
    bucket = new TokenBucket({ capacity: 10, refillRate: 2, refillInterval: 1000 });
  });

  test('starts with full capacity', () => {
    expect(bucket.peek()).toBe(10);
  });

  test('consumes tokens', () => {
    const result = bucket.consume(3);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
  });

  test('rejects when insufficient tokens', () => {
    bucket.consume(10);
    const result = bucket.consume(1);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test('refills over time', async () => {
    bucket.consume(10);
    bucket.lastRefill = Date.now() - 2000;
    const result = bucket.consume(1);
    expect(result.allowed).toBe(true);
  });

  test('does not exceed capacity on refill', () => {
    bucket.lastRefill = Date.now() - 100000;
    bucket._refill();
    expect(bucket.tokens).toBe(10);
  });

  test('reset restores full capacity', () => {
    bucket.consume(8);
    bucket.reset();
    expect(bucket.peek()).toBe(10);
  });

  test('throws on invalid capacity', () => {
    expect(() => new TokenBucket({ capacity: 0 })).toThrow(RangeError);
    expect(() => new TokenBucket({ capacity: -1 })).toThrow(RangeError);
  });

  test('throws on invalid refillRate', () => {
    expect(() => new TokenBucket({ refillRate: 0 })).toThrow(RangeError);
  });
});

describe('SlidingWindow', () => {
  let window;

  beforeEach(() => {
    window = new SlidingWindow({ capacity: 5, windowSize: 1000 });
  });

  test('allows requests within capacity', () => {
    for (let i = 0; i < 5; i++) {
      expect(window.consume().allowed).toBe(true);
    }
  });

  test('rejects beyond capacity', () => {
    for (let i = 0; i < 5; i++) window.consume();
    expect(window.consume().allowed).toBe(false);
  });

  test('peek returns remaining without consuming', () => {
    window.consume(2);
    expect(window.peek()).toBe(3);
  });

  test('reset clears all timestamps', () => {
    window.consume(5);
    window.reset();
    expect(window.peek()).toBe(5);
  });
});

describe('createLimiter', () => {
  test('defaults to token-bucket', () => {
    const limiter = createLimiter();
    expect(limiter).toBeInstanceOf(TokenBucket);
  });

  test('creates sliding-window when specified', () => {
    const limiter = createLimiter({ algorithm: 'sliding-window' });
    expect(limiter).toBeInstanceOf(SlidingWindow);
  });
});
