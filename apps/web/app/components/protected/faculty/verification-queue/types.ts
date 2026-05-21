export interface PendingItem {
  id: string;
  type: "Result" | "Achievement" | "Certification";
  name: string;
  proofImage: string | null;
  student: { id: string; name: string | null; rollNo: string; branch: string };
  createdAt: string;
}

export const BATCH_ENDPOINTS: Record<string, string> = {
  Achievement: "/api/achievements/verify",
  Certification: "/api/certifications/verify",
  Result: "/api/results/verify",
};

export const SINGLE_ENDPOINTS: Record<string, string> = {
  Achievement: "achievements",
  Certification: "certifications",
  Result: "results",
};
