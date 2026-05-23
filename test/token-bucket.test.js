const assert = require('assert');
const { TokenBucket, SlidingWindow, createLimiter } = require('../src');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

console.log('\nTokenBucket');

test('starts with full capacity', () => {
  const b = new TokenBucket({ capacity: 10, refillRate: 2, refillInterval: 1000 });
  assert.strictEqual(b.peek(), 10);
});

test('consumes tokens', () => {
  const b = new TokenBucket({ capacity: 10, refillRate: 2, refillInterval: 1000 });
  const r = b.consume(3);
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.remaining, 7);
});

test('rejects when insufficient tokens', () => {
  const b = new TokenBucket({ capacity: 10, refillRate: 2, refillInterval: 1000 });
  b.consume(10);
  const r = b.consume(1);
  assert.strictEqual(r.allowed, false);
  assert.strictEqual(r.remaining, 0);
  assert.ok(r.retryAfter > 0);
});

test('refills over time', () => {
  const b = new TokenBucket({ capacity: 10, refillRate: 2, refillInterval: 1000 });
  b.consume(10);
  b.lastRefill = Date.now() - 2000;
  const r = b.consume(1);
  assert.strictEqual(r.allowed, true);
});

test('does not exceed capacity on refill', () => {
  const b = new TokenBucket({ capacity: 10, refillRate: 2, refillInterval: 1000 });
  b.lastRefill = Date.now() - 100000;
  b._refill();
  assert.strictEqual(b.tokens, 10);
});

test('reset restores full capacity', () => {
  const b = new TokenBucket({ capacity: 10, refillRate: 2, refillInterval: 1000 });
  b.consume(8);
  b.reset();
  assert.strictEqual(b.peek(), 10);
});

test('throws on invalid capacity', () => {
  assert.throws(() => new TokenBucket({ capacity: 0 }), RangeError);
  assert.throws(() => new TokenBucket({ capacity: -1 }), RangeError);
});

test('throws on invalid refillRate', () => {
  assert.throws(() => new TokenBucket({ refillRate: 0 }), RangeError);
});

console.log('\nSlidingWindow');

test('allows requests within capacity', () => {
  const w = new SlidingWindow({ capacity: 5, windowSize: 1000 });
  for (let i = 0; i < 5; i++) assert.strictEqual(w.consume().allowed, true);
});

test('rejects beyond capacity', () => {
  const w = new SlidingWindow({ capacity: 5, windowSize: 1000 });
  for (let i = 0; i < 5; i++) w.consume();
  assert.strictEqual(w.consume().allowed, false);
});

test('peek returns remaining without consuming', () => {
  const w = new SlidingWindow({ capacity: 5, windowSize: 1000 });
  w.consume(2);
  assert.strictEqual(w.peek(), 3);
});

test('reset clears all timestamps', () => {
  const w = new SlidingWindow({ capacity: 5, windowSize: 1000 });
  w.consume(5);
  w.reset();
  assert.strictEqual(w.peek(), 5);
});

console.log('\ncreateLimiter');

test('defaults to token-bucket', () => {
  const l = createLimiter();
  assert.ok(l instanceof TokenBucket);
});

test('creates sliding-window when specified', () => {
  const l = createLimiter({ algorithm: 'sliding-window' });
  assert.ok(l instanceof SlidingWindow);
});

console.log(`\n${passed} passing, ${failed} failing\n`);
process.exit(failed > 0 ? 1 : 0);
