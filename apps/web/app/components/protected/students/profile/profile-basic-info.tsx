import type { UpdateStudentInput, UpdateUserInput } from "@aecfolio/shared";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface ProfileBasicInfoProps {
  user: {
    name: string | null;
    phone: string | null;
    student: {
      bio: string | null;
      skills: string[];
      cgpa: number | null;
    };
  };
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  userDraft: UpdateUserInput;
  onUserDraftChange: (draft: UpdateUserInput) => void;
  studentDraft: UpdateStudentInput;
  onStudentDraftChange: (draft: UpdateStudentInput) => void;
  skillInput: string;
  onSkillInputChange: (value: string) => void;
}

export function ProfileBasicInfo({
  user,
  isEditing,
  onStartEdit,
  onCancel,
  onSave,
  userDraft,
  onUserDraftChange,
  studentDraft,
  onStudentDraftChange,
  skillInput,
  onSkillInputChange,
}: ProfileBasicInfoProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Basic Info</h2>
        {!isEditing ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={onStartEdit}
          >
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={onCancel}
            >
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={onSave}>
              <Check className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {user.student.bio ?? "No bio yet."}
          </p>
          {user.student.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {user.student.skills.map((s) => (
                <span
                  key={s}
                  className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {user.student.cgpa !== null && (
            <p className="text-xs text-muted-foreground">
              CGPA: {user.student.cgpa}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              className="h-8 text-xs"
              value={userDraft.name ?? ""}
              onChange={(e) =>
                onUserDraftChange({
                  ...userDraft,
                  name: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input
              className="h-8 text-xs"
              value={userDraft.phone ?? ""}
              onChange={(e) =>
                onUserDraftChange({
                  ...userDraft,
                  phone: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bio</Label>
            <Textarea
              className="text-xs resize-none"
              rows={3}
              value={studentDraft.bio ?? ""}
              onChange={(e) =>
                onStudentDraftChange({
                  ...studentDraft,
                  bio: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Skills</Label>
            <div className="flex gap-2">
              <Input
                className="h-8 text-xs"
                placeholder="Add skill and press Enter..."
                value={skillInput}
                onChange={(e) => onSkillInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && skillInput.trim()) {
                    e.preventDefault();
                    onStudentDraftChange({
                      ...studentDraft,
                      skills: [
                        ...(studentDraft.skills ?? []),
                        skillInput.trim(),
                      ],
                    });
                    onSkillInputChange("");
                  }
                }}
              />
            </div>
            {(studentDraft.skills ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {(studentDraft.skills ?? []).map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded-full"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() =>
                        onStudentDraftChange({
                          ...studentDraft,
                          skills: (studentDraft.skills ?? []).filter(
                            (x) => x !== s,
                          ),
                        })
                      }
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
