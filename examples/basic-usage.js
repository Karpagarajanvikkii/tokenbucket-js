const { createLimiter, rateLimit } = require('../src');

// Standalone usage
const limiter = createLimiter({
  algorithm: 'token-bucket',
  capacity: 100,
  refillRate: 10,
  refillInterval: 1000,
});

for (let i = 0; i < 5; i++) {
  const result = limiter.consume();
  console.log(`Request ${i + 1}: ${result.allowed ? 'OK' : 'RATE LIMITED'} (remaining: ${result.remaining})`);
}

// Express middleware example
// const express = require('express');
// const app = express();
//
// app.use(rateLimit({
//   capacity: 100,
//   refillRate: 10,
//   keyBy: req => req.headers['x-forwarded-for'] || req.ip,
// }));
//
// app.get('/api/data', (req, res) => {
//   res.json({ ok: true });
// });
//
// app.listen(3000);
