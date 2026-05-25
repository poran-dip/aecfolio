import { apiClient } from "~/lib/api-client";

export interface PendingItem {
  id: string;
  type: "Result" | "Achievement" | "Certification";
  name: string;
  proofImage: string | null;
  student: { id: string; name: string | null; rollNo: string; branch: string };
  createdAt: string;
}

export const BATCH_APPROVE = {
  Achievement: (ids: string[]) =>
    apiClient.api.achievements.verify.$patch({ json: { ids } }),
  Certification: (ids: string[]) =>
    apiClient.api.certifications.verify.$patch({ json: { ids } }),
  Result: (ids: string[]) =>
    apiClient.api.results.verify.$patch({ json: { ids } }),
};

export const SINGLE_APPROVE = {
  Achievement: (id: string) =>
    apiClient.api.achievements[":id"].verify.$patch({ param: { id } }),
  Certification: (id: string) =>
    apiClient.api.certifications[":id"].verify.$patch({ param: { id } }),
  Result: (id: string) =>
    apiClient.api.results[":id"].verify.$patch({ param: { id } }),
};
