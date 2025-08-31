import { ulid } from 'ulid';
import type { StreamKlinesRequest } from './types.js';

export type Subscription = {
  id: string;
  key: string; // symbol|interval|hash
  params: StreamKlinesRequest;
  unsubscribe: () => void;
};

export class SubscriptionManager {
  private subs = new Map<string, Subscription>();

  add(params: StreamKlinesRequest, unsubscribe: () => void): Subscription {
    const id = ulid();
    const key = `${params.symbol}|${params.interval}`; // extend with indicator hash later
    const sub: Subscription = { id, key, params, unsubscribe };
    this.subs.set(id, sub);
    return sub;
  }

  remove(id: string) {
    const sub = this.subs.get(id);
    if (sub) {
      sub.unsubscribe();
      this.subs.delete(id);
    }
  }

  list() {
    return Array.from(this.subs.values());
  }
}

