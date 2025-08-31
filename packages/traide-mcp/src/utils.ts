export function intervalToMs(interval: string): number {
  const m = interval.match(/^(\d+)([smhdw])$/i);
  if (!m) throw new Error(`invalid_interval:${interval}`);
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : unit === 'd' ? 86_400_000 : 604_800_000;
  return n * mult;
}

export class Backoff {
  private attempt = 0;
  constructor(private baseMs = 500, private maxMs = 30_000) {}
  next(): number {
    const jitter = Math.random() * this.baseMs;
    const ms = Math.min(this.maxMs, this.baseMs * Math.pow(2, this.attempt)) + jitter;
    this.attempt++;
    return Math.floor(ms);
  }
  reset() { this.attempt = 0; }
}

