type Counter = { name: string; help?: string; value: number; labels?: Record<string, string> };
type Histogram = { name: string; help?: string; buckets: number[]; counts: number[]; sum: number; count: number };

class Registry {
  private counters = new Map<string, Counter>();
  private histograms = new Map<string, Histogram>();

  inc(name: string, labels?: Record<string, string>, by = 1) {
    const key = this.key(name, labels);
    const c = this.counters.get(key) ?? { name, value: 0, labels };
    c.value += by;
    this.counters.set(key, c);
  }

  observe(name: string, seconds: number, buckets = [0.05, 0.1, 0.25, 0.5, 1, 2, 5]) {
    const h = this.histograms.get(name) ?? { name, buckets, counts: Array(buckets.length).fill(0), sum: 0, count: 0 };
    let i = 0;
    for (; i < h.buckets.length; i++) if (seconds <= h.buckets[i]) break;
    if (i < h.counts.length) h.counts[i] += 1;
    h.sum += seconds;
    h.count += 1;
    this.histograms.set(name, h);
  }

  renderProm(): string {
    const lines: string[] = [];
    for (const c of this.counters.values()) {
      const labels = c.labels && Object.keys(c.labels).length ? `{${Object.entries(c.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : '';
      lines.push(`# TYPE ${c.name} counter`);
      lines.push(`${c.name}${labels} ${c.value}`);
    }
    for (const h of this.histograms.values()) {
      lines.push(`# TYPE ${h.name} histogram`);
      let cumulative = 0;
      for (let i = 0; i < h.buckets.length; i++) {
        cumulative += h.counts[i];
        lines.push(`${h.name}_bucket{le="${h.buckets[i]}"} ${cumulative}`);
      }
      lines.push(`${h.name}_bucket{le="+Inf"} ${h.count}`);
      lines.push(`${h.name}_sum ${h.sum}`);
      lines.push(`${h.name}_count ${h.count}`);
    }
    return lines.join('\n') + '\n';
  }

  private key(name: string, labels?: Record<string, string>) {
    return labels ? `${name}|${Object.entries(labels).sort().map(([k, v]) => `${k}=${v}`).join(',')}` : name;
  }
}

export const metrics = new Registry();

export function withTiming<T>(metric: string, fn: () => Promise<T>) {
  const start = process.hrtime.bigint();
  return fn().finally(() => {
    const end = process.hrtime.bigint();
    const seconds = Number(end - start) / 1e9;
    metrics.observe(metric, seconds);
  });
}

