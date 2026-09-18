import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTOSAVE_DELAY,
  AUTOSAVE_MAX_WAIT,
  type AutosaveStatus,
  createAutosaver,
} from "./autosave";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("one timer, not two", () => {
  it("coalesces a burst of edits into a single save", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const auto = createAutosaver<string>({ save });

    for (const value of ["a", "ab", "abc", "abcd"]) {
      auto.change(value);
      await vi.advanceTimersByTimeAsync(100);
    }

    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("abcd");
  });

  it("forces a save when someone types without ever pausing", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const auto = createAutosaver<number>({ save });

    for (let i = 1; i <= 30; i++) {
      auto.change(i);
      await vi.advanceTimersByTimeAsync(200);
    }

    expect(save).toHaveBeenCalled();
    expect(save.mock.calls[0][0]).toBeLessThanOrEqual(
      Math.ceil(AUTOSAVE_MAX_WAIT / 200) + 1,
    );
  });
});

describe("an untitled entry is never sent", () => {
  it("stays local while canSave is false, and goes the moment it is true", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const auto = createAutosaver<{ title: string }>({
      save,
      canSave: (value) => value.title.trim().length > 0,
    });

    auto.change({ title: "" });
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT * 2);
    expect(save).not.toHaveBeenCalled();
    expect(auto.status().state).toBe("dirty");

    auto.change({ title: "Portfolio" });
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY);
    expect(save).toHaveBeenCalledWith({ title: "Portfolio" });
  });

  it("pauses rather than writing the blank when a title is cleared mid-edit", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const auto = createAutosaver<{ title: string }>({
      save,
      canSave: (value) => value.title.trim().length > 0,
    });

    auto.change({ title: "Portfolio" });
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY);
    expect(save).toHaveBeenCalledTimes(1);

    auto.change({ title: "" });
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT * 2);
    expect(save).toHaveBeenCalledTimes(1);

    await auto.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe("one request in flight at a time", () => {
  it("holds an edit made during a save and sends it afterwards", async () => {
    const first = deferred();
    const save = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined);

    const auto = createAutosaver<string>({ save });

    auto.change("one");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY);
    expect(save).toHaveBeenCalledTimes(1);

    auto.change("two");
    auto.change("three");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY);
    expect(save).toHaveBeenCalledTimes(1);

    first.resolve();
    await vi.advanceTimersByTimeAsync(0);

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("three");
  });
});

describe("flush", () => {
  it("sends a pending edit immediately", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const auto = createAutosaver<string>({ save });

    auto.change("draft");
    await auto.flush();

    expect(save).toHaveBeenCalledWith("draft");
  });

  it("does nothing when there is nothing pending", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const auto = createAutosaver<string>({ save });

    await auto.flush();
    expect(save).not.toHaveBeenCalled();
  });
});

describe("failure", () => {
  it("reports the error, keeps the value, and retries it", async () => {
    const statuses: AutosaveStatus[] = [];
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network unreachable"))
      .mockResolvedValue(undefined);

    const auto = createAutosaver<string>({
      save,
      onStatus: (status) => statuses.push(status),
    });

    auto.change("keep me");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY);

    expect(auto.status()).toEqual({
      state: "error",
      message: "Network unreachable",
    });
    expect(auto.pending()).toBe(true);

    await auto.retry();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("keep me");
    expect(auto.status().state).toBe("saved");

    expect(statuses.map((s) => s.state)).toEqual([
      "dirty",
      "saving",
      "error",
      "saving",
      "saved",
    ]);
  });
});
