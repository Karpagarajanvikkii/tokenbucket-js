export interface LimiterOptions {
  algorithm?: 'token-bucket' | 'sliding-window';
  capacity?: number;
  refillRate?: number;
  refillInterval?: number;
  windowSize?: number;
}

export interface ConsumeResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

export interface MiddlewareOptions extends LimiterOptions {
  keyBy?: (req: any) => string;
  cost?: number;
}

export class TokenBucket {
  constructor(opts?: Pick<LimiterOptions, 'capacity' | 'refillRate' | 'refillInterval'>);
  readonly capacity: number;
  consume(count?: number): ConsumeResult;
  peek(): number;
  reset(): void;
}

export class SlidingWindow {
  constructor(opts?: Pick<LimiterOptions, 'capacity' | 'windowSize'>);
  readonly capacity: number;
  consume(count?: number): ConsumeResult;
  peek(): number;
  reset(): void;
}

export function createLimiter(opts?: LimiterOptions): TokenBucket | SlidingWindow;
export function rateLimit(opts?: MiddlewareOptions): (req: any, res: any, next: () => void) => void;
