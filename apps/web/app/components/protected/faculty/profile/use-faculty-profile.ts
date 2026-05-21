import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchApi } from "~/lib/api";

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
    fetchApi<FacultyProfile>("/api/me")
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
