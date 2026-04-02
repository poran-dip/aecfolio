"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { Code2, X, Plus, Info } from "lucide-react";
import toast from "react-hot-toast";

const SUGGESTED_SKILLS = [
  "Python", "Java", "C++", "JavaScript", "TypeScript", "React", "Node.js",
  "Next.js", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Git", "Docker",
  "Machine Learning", "Deep Learning", "DSA", "Linux", "REST API", "GraphQL",
];

export default function SkillsPage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/student/skills")
      .then((r) => r.json())
      .then((d) => setSkills(d.skills ?? []))
      .finally(() => setLoading(false));
  }, []);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(input);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/student/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });
      if (res.ok) toast.success("Skills saved!");
      else toast.error("Failed to save skills");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const suggestions = SUGGESTED_SKILLS.filter(
    (s) => !skills.includes(s) && s.toLowerCase().includes(input.toLowerCase()),
  ).slice(0, 8);

  if (loading) return <PageLoader />;

  return (
    <div>
      <Navbar
        title="Skills"
        subtitle="Technical and soft skills for your profile"
        actions={
          <Button onClick={handleSave} loading={saving}>
            Save Skills
          </Button>
        }
      />

      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader
            title="Add Skills"
            icon={<Code2 size={18} />}
            description="Type a skill and press Enter or comma to add"
          />

          {/* Input */}
          <div className="relative">
            <div className="flex flex-wrap gap-2 p-3 border-2 border-slate-200 rounded-xl min-h-14 focus-within:border-blue-400 transition-colors bg-white">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={skills.length === 0 ? "Type a skill and press Enter..." : "Add more..."}
                className="flex-1 min-w-37.5 outline-none text-sm text-slate-700 bg-transparent py-1"
              />
            </div>

            {/* Auto-suggestions dropdown */}
            {input && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} className="text-slate-400" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Info size={12} />
            Press Enter or comma to add each skill. Click × to remove.
          </p>

          {/* Skill count */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">{skills.length} skills added</span>
            {skills.length > 0 && (
              <button
                onClick={() => setSkills([])}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </Card>

        {/* Suggested Skills */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Suggested Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-full hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all group"
              >
                <Plus size={11} className="text-slate-400 group-hover:text-blue-500" />
                {s}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
