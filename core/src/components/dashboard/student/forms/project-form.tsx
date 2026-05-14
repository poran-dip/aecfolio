"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FormActions from "./form-actions";

type ProjectDraft = {
  title: string;
  description: string;
  techStack: string[];
  link: string | null;
};

export default function ProjectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ProjectDraft;
  onSave: (data: ProjectDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [techInput, setTechInput] = useState("");

  return (
    <div className="space-y-3 mt-3 p-3 border rounded-md bg-muted/30">
      <div className="space-y-1">
        <Label className="text-xs">Title</Label>
        <Input
          className="h-8 text-xs"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea
          className="text-xs resize-none"
          rows={3}
          value={draft.description}
          onChange={(e) =>
            setDraft((d) => ({ ...d, description: e.target.value }))
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tech Stack</Label>
        <Input
          className="h-8 text-xs"
          placeholder="Add technology and press Enter..."
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && techInput.trim()) {
              e.preventDefault();
              setDraft((d) => ({
                ...d,
                techStack: [...d.techStack, techInput.trim()],
              }));
              setTechInput("");
            }
          }}
        />
        {draft.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {draft.techStack.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded-full"
              >
                {t}
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      techStack: d.techStack.filter((x) => x !== t),
                    }))
                  }
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Link (optional)</Label>
        <Input
          className="h-8 text-xs"
          value={draft.link ?? ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, link: e.target.value || null }))
          }
        />
      </div>
      <FormActions onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  );
}
