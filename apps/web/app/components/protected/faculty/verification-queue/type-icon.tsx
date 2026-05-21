import { Award, FileBadge, FileText } from "lucide-react";

export function TypeIcon({ type }: { type: string }) {
  if (type === "Result")
    return <FileText size={18} className="text-blue-500" />;
  if (type === "Achievement")
    return <Award size={18} className="text-purple-500" />;
  if (type === "Certification")
    return <FileBadge size={18} className="text-green-500" />;
  return null;
}
