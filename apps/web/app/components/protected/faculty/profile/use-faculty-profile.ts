import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseApi } from "~/lib/api";
import { apiClient } from "~/lib/api-client";

export interface FacultyProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  faculty: {
    employeeId: string;
    designation: string;
    department: string;
    createdAt: string;
  };
}

export function useFacultyProfile() {
  const [data, setData] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.api.me
      .$get()
      .then((res) => parseApi<FacultyProfile>(res))
      .then((data) => setData(data))
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to load profile",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
