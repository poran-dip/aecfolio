import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Autosaver,
  type AutosaveStatus,
  createAutosaver,
} from "./autosave";

export type UseAutosave<T> = {
  status: AutosaveStatus;
  change: (value: T) => void;
  flush: () => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
};

export function useAutosave<T>({
  save,
  canSave,
}: {
  save: (value: T) => Promise<void>;
  canSave?: (value: T) => boolean;
}): UseAutosave<T> {
  const [status, setStatus] = useState<AutosaveStatus>({ state: "clean" });

  const saveRef = useRef(save);
  const canSaveRef = useRef(canSave);
  saveRef.current = save;
  canSaveRef.current = canSave;

  const auto: Autosaver<T> = useMemo(
    () =>
      createAutosaver<T>({
        save: (value) => saveRef.current(value),
        canSave: (value) => canSaveRef.current?.(value) ?? true,
        onStatus: setStatus,
      }),
    [],
  );

  useEffect(() => {
    const onUnload = () => void auto.flush();
    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      void auto.flush();
    };
  }, [auto]);

  return {
    status,
    change: auto.change,
    flush: auto.flush,
    retry: auto.retry,
    cancel: auto.cancel,
  };
}
