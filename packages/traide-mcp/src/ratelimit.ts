// Token-bucket limiter keyed by IP
export class RateLimiter {
  private bucket = new Map<string, { tokens: number; updated: number }>();
  constructor(private capacity: number, private refillPerSec: number) {}

  allow(key: string): boolean {
    const now = Date.now();
    let state = this.bucket.get(key);
    if (!state) {
      state = { tokens: this.capacity, updated: now };
      this.bucket.set(key, state);
    }
    const elapsed = (now - state.updated) / 1000;
    state.tokens = Math.min(this.capacity, state.tokens + elapsed * this.refillPerSec);
    state.updated = now;
    if (state.tokens >= 1) {
      state.tokens -= 1;
      return true;
    }
    return false;
  }
}

