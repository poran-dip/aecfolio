export type SaveState = "clean" | "dirty" | "saving" | "saved" | "error";

export type AutosaveStatus = {
  state: SaveState;
  message?: string;
};

export type AutosaveOptions<T> = {
  save: (value: T) => Promise<void>;
  canSave?: (value: T) => boolean;
  delay?: number;
  maxWait?: number;
  onStatus?: (status: AutosaveStatus) => void;
};

export const AUTOSAVE_DELAY = 800;
export const AUTOSAVE_MAX_WAIT = 5000;

export type Autosaver<T> = {
  change: (value: T) => void;
  flush: () => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
  status: () => AutosaveStatus;
  pending: () => boolean;
};

export function createAutosaver<T>({
  save,
  canSave = () => true,
  delay = AUTOSAVE_DELAY,
  maxWait = AUTOSAVE_MAX_WAIT,
  onStatus,
}: AutosaveOptions<T>): Autosaver<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let deadline: ReturnType<typeof setTimeout> | null = null;
  let queued: { value: T } | null = null;
  let inFlight = false;
  let status: AutosaveStatus = { state: "clean" };

  function setStatus(next: AutosaveStatus) {
    status = next;
    onStatus?.(next);
  }

  function clearTimers() {
    if (timer) clearTimeout(timer);
    if (deadline) clearTimeout(deadline);
    timer = null;
    deadline = null;
  }

  async function run(): Promise<void> {
    clearTimers();

    if (inFlight) return;
    if (!queued) return;
    if (!canSave(queued.value)) return;

    const value = queued.value;
    queued = null;
    inFlight = true;
    setStatus({ state: "saving" });

    try {
      await save(value);
      setStatus({ state: queued ? "dirty" : "saved" });
    } catch (error) {
      if (!queued) queued = { value };
      setStatus({
        state: "error",
        message:
          error instanceof Error ? error.message : "Could not save. Try again.",
      });
    } finally {
      inFlight = false;
    }

    if (queued && status.state !== "error") await run();
  }

  return {
    change(value) {
      queued = { value };

      if (!canSave(value)) {
        clearTimers();
        setStatus({ state: "dirty" });
        return;
      }

      setStatus({ state: "dirty" });

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void run(), delay);

      if (!deadline) {
        deadline = setTimeout(() => void run(), maxWait);
      }
    },

    async flush() {
      if (!queued || !canSave(queued.value)) {
        clearTimers();
        return;
      }
      await run();
    },

    async retry() {
      if (status.state !== "error") return;
      await run();
    },

    cancel() {
      clearTimers();
      queued = null;
      setStatus({ state: "clean" });
    },

    status() {
      return status;
    },

    pending() {
      return queued !== null || inFlight;
    },
  };
}
