import { toast } from "sonner";
import { fetchApi } from "~/lib/api";

export function createSaveHandler<T extends { id: string }>({
  endpoint,
  setItems,
  clearEditing,
}: {
  endpoint: string;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  clearEditing: () => void;
}) {
  return (itemId: string) => (data: object) => {
    if (itemId === "new") {
      void createEntry(endpoint, data, setItems, clearEditing);
    } else {
      void updateEntry(endpoint, itemId, data, setItems, clearEditing);
    }
  };
}

export async function createEntry<T extends { id: string }>(
  url: string,
  body: object,
  setter: React.Dispatch<React.SetStateAction<T[]>>,
  resetEditing: () => void,
) {
  try {
    const created = await fetchApi<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setter((prev) => [...prev, created]);
    resetEditing();
    toast.success("Added");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to add");
  }
}

export async function updateEntry<T extends { id: string }>(
  url: string,
  id: string,
  body: object,
  setter: React.Dispatch<React.SetStateAction<T[]>>,
  resetEditing: () => void,
) {
  try {
    const updated = await fetchApi<T>(`${url}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setter((prev) => prev.map((e) => (e.id === id ? updated : e)));
    resetEditing();
    toast.success("Updated");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to update");
  }
}

export async function deleteEntry<T extends { id: string }>(
  url: string,
  id: string,
  setter: React.Dispatch<React.SetStateAction<T[]>>,
) {
  try {
    await fetchApi(`${url}/${id}`, { method: "DELETE" });
    setter((prev) => prev.filter((e) => e.id !== id));
    toast.success("Deleted");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to delete");
  }
}
