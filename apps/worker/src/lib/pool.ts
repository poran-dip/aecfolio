import type { Browser, Page } from "puppeteer";

export class QueueFullError extends Error {
  constructor() {
    super("Render queue is full");
  }
}

export type PoolOptions = {
  size: number;
  queueMax: number;
  recycleAfter?: number;
  launch: () => Promise<Browser>;
  prepare: (page: Page) => Promise<void>;
};

type Slot = { page: Page; uses: number };

export class PagePool {
  private browser: Promise<Browser> | null = null;
  private idle: Slot[] = [];
  private busy = 0;
  private waiters: ((slot: Slot | null) => void)[] = [];
  private created = 0;
  private closed = false;

  constructor(private readonly options: PoolOptions) {}

  stats() {
    return {
      size: this.options.size,
      busy: this.busy,
      idle: this.idle.length,
      queued: this.waiters.length,
      created: this.created,
    };
  }

  async warm(): Promise<void> {
    await this.run(async () => {});
  }

  async run<T>(task: (page: Page) => Promise<T>): Promise<T> {
    const slot = await this.acquire();
    let healthy = true;
    try {
      return await task(slot.page);
    } catch (err) {
      healthy = false;
      throw err;
    } finally {
      slot.uses += 1;
      this.release(slot, healthy);
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const resolve of this.waiters.splice(0)) resolve(null);
    this.idle = [];
    const browser = await this.browser?.catch(() => null);
    this.browser = null;
    await browser?.close().catch(() => {});
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const launching = this.options.launch().then((browser) => {
        browser.on("disconnected", () => {
          if (this.browser === launching) this.browser = null;
          this.idle = [];
        });
        return browser;
      });
      launching.catch(() => {
        if (this.browser === launching) this.browser = null;
      });
      this.browser = launching;
    }
    return this.browser;
  }

  private async acquire(woken = false): Promise<Slot> {
    if (this.closed) throw new Error("Pool is closed");

    const idle = this.idle.pop();
    if (idle) {
      this.busy += 1;
      return idle;
    }

    if (this.busy < this.options.size) {
      this.busy += 1;
      try {
        return await this.openSlot();
      } catch (err) {
        this.busy -= 1;
        this.wakeNext();
        throw err;
      }
    }

    if (!woken && this.waiters.length >= this.options.queueMax)
      throw new QueueFullError();

    const slot = await new Promise<Slot | null>((resolve) => {
      if (woken) this.waiters.unshift(resolve);
      else this.waiters.push(resolve);
    });
    return slot ?? this.acquire(true);
  }

  private release(slot: Slot, healthy: boolean) {
    const recycle =
      !healthy ||
      this.closed ||
      !slot.page.browser().connected ||
      slot.uses >= (this.options.recycleAfter ?? 250);

    if (recycle) {
      this.busy -= 1;
      slot.page.close().catch(() => {});
      this.wakeNext();
      return;
    }

    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(slot);
      return;
    }
    this.busy -= 1;
    this.idle.push(slot);
  }

  private wakeNext() {
    const waiter = this.waiters.shift();
    if (waiter) waiter(null);
  }

  private async openSlot(): Promise<Slot> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await this.options.prepare(page);
    } catch (err) {
      await page.close().catch(() => {});
      throw err;
    }
    this.created += 1;
    return { page, uses: 0 };
  }
}
