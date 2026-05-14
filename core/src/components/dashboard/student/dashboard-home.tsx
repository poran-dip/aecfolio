"use client";

import { Check, FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import AchievementForm from "./forms/achievement-form";
import CertificationForm from "./forms/certification-form";
import ExperienceForm from "./forms/experience-form";
import ProjectForm from "./forms/project-form";
import ResultForm from "./forms/result-form";
import SocialForm from "./forms/social-form";
import type {
  Achievement,
  Certification,
  Experience,
  Project,
  Result,
  Social,
  User,
  UserDraft,
} from "./student-dashboard.types";

export default function StudentPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [userDraft, setUserDraft] = useState<UserDraft>({});
  const [skillInput, setSkillInput] = useState("");

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [socials, setSocials] = useState<Social[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const [editingExp, setEditingExp] = useState<string | null>(null);
  const [editingProj, setEditingProj] = useState<string | null>(null);
  const [editingAch, setEditingAch] = useState<string | null>(null);
  const [editingCert, setEditingCert] = useState<string | null>(null);
  const [editingSoc, setEditingSoc] = useState<string | null>(null);
  const [editingRes, setEditingRes] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [usrRes, expRes, projRes, achRes, certRes, socRes, resRes] =
          await Promise.all([
            fetch("/api/me"),
            fetch("/api/experience"),
            fetch("/api/project"),
            fetch("/api/achievement"),
            fetch("/api/certification"),
            fetch("/api/social"),
            fetch("/api/result"),
          ]);
        const [usr, exp, proj, ach, cert, soc, res] = await Promise.all([
          usrRes.json(),
          expRes.json(),
          projRes.json(),
          achRes.json(),
          certRes.json(),
          socRes.json(),
          resRes.json(),
        ]);
        setUser(usr);
        setExperiences(exp);
        setProjects(proj);
        setAchievements(ach);
        setCertifications(cert);
        setSocials(soc);
        setResults(res);
      } catch {
        toast.error("Failed to load profile");
      }
    }
    load();
  }, []);

  async function saveProfile() {
    try {
      const [updatedUser, updatedStudent] = await Promise.all([
        fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userDraft.name,
            phone: userDraft.phone,
          }),
        }).then((r) => r.json()),
        fetch(`/api/student/${user?.student.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bio: userDraft.bio,
            skills: userDraft.skills,
          }),
        }).then((r) => r.json()),
      ]);
      setUser((prev) => ({
        ...prev,
        ...updatedUser,
        student: { ...prev?.student, ...updatedStudent },
      }));
      setEditingProfile(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  }

  async function createEntry<T>(
    url: string,
    body: object,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    resetEditing: () => void,
  ) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const created = await res.json();
      setter((prev) => [...prev, created]);
      resetEditing();
      toast.success("Added");
    } catch {
      toast.error("Failed to add");
    }
  }

  async function updateEntry<T extends { id: string }>(
    url: string,
    id: string,
    body: object,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    resetEditing: () => void,
  ) {
    try {
      const res = await fetch(`${url}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      setter((prev) => prev.map((e) => (e.id === id ? updated : e)));
      resetEditing();
      toast.success("Updated");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function deleteEntry<T extends { id: string }>(
    url: string,
    id: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
  ) {
    try {
      await fetch(`${url}/${id}`, { method: "DELETE" });
      setter((prev) => prev.filter((e) => e.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{user.student.rollNo}</h1>
          <p className="text-sm text-muted-foreground">
            {user.student.course} · {user.student.branch} · Semester{" "}
            {user.student.semester}
          </p>
        </div>
        <Button onClick={() => router.push("/student/cv")}>
          <FileText className="h-4 w-4 mr-2" /> Generate CV
        </Button>
      </div>

      <Separator />

      {/* Basic Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Basic Info</h2>
          {!editingProfile ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                setUserDraft({
                  name: user.name,
                  phone: user.phone,
                  bio: user.student.bio,
                  skills: user.student.skills,
                });
                setEditingProfile(true);
              }}
            >
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setEditingProfile(false)}
              >
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={saveProfile}>
                <Check className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          )}
        </div>

        {!editingProfile ? (
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
              <Label className="text-xs">Bio</Label>
              <Textarea
                className="text-xs resize-none"
                rows={3}
                value={userDraft.bio ?? ""}
                onChange={(e) =>
                  setUserDraft((d) => ({ ...d, bio: e.target.value || null }))
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
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && skillInput.trim()) {
                      e.preventDefault();
                      setUserDraft((d) => ({
                        ...d,
                        skills: [...(d.skills ?? []), skillInput.trim()],
                      }));
                      setSkillInput("");
                    }
                  }}
                />
              </div>
              {(userDraft.skills ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(userDraft.skills ?? []).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded-full"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() =>
                          setUserDraft((d) => ({
                            ...d,
                            skills: (d.skills ?? []).filter((x) => x !== s),
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
          </div>
        )}
      </div>

      <Separator />

      {/* Accordion sections */}
      <Accordion type="multiple" className="space-y-2">
        {/* Results */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <h2 className="text-sm font-medium">Results</h2>
            <Separator />
            <Accordion type="single" collapsible className="space-y-2">
              {results.map((r) => (
                <AccordionItem
                  key={r.id}
                  value={r.id}
                  className="border rounded-md px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-2">
                    <span className="text-sm font-medium">
                      Semester {r.semester}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-2">
                    <ResultForm
                      initial={{
                        semester: r.semester,
                        pendingSgpa: r.pendingSgpa,
                      }}
                      onSave={(data) =>
                        updateEntry("/api/result", r.id, data, setResults, () =>
                          setEditingRes(null),
                        )
                      }
                      onCancel={() => setEditingRes(null)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() =>
                        deleteEntry("/api/student/results", r.id, setResults)
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {editingRes === "new" ? (
              <ResultForm
                initial={{ semester: 0, pendingSgpa: 0.0 }}
                onSave={(data) =>
                  createEntry("/api/result", data, setResults, () =>
                    setEditingRes(null),
                  )
                }
                onCancel={() => setEditingRes(null)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setEditingRes("new");
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Result
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Experiences */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <h2 className="text-sm font-medium">Experience</h2>
            <Separator />
            <Accordion type="single" collapsible className="space-y-2">
              {experiences.map((e) => (
                <AccordionItem
                  key={e.id}
                  value={e.id}
                  className="border rounded-md px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{e.title}</span>
                      <span className="text-xs text-muted-foreground">
                        · {e.organization}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-2">
                    <ExperienceForm
                      initial={{
                        type: e.type,
                        title: e.title,
                        organization: e.organization,
                        description: e.description,
                        startDate: e.startDate,
                        endDate: e.endDate,
                      }}
                      onSave={(data) =>
                        updateEntry(
                          "/api/experience",
                          e.id,
                          data,
                          setExperiences,
                          () => {},
                        )
                      }
                      onCancel={() => {}}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() =>
                        deleteEntry("/api/experience", e.id, setExperiences)
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {editingExp === "new" ? (
              <ExperienceForm
                initial={{
                  type: "INTERNSHIP",
                  title: "",
                  organization: "",
                  description: "",
                  startDate: null,
                  endDate: null,
                }}
                onSave={(data) =>
                  createEntry("/api/experience", data, setExperiences, () =>
                    setEditingExp(null),
                  )
                }
                onCancel={() => setEditingExp(null)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setEditingExp("new");
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Experience
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <h2 className="text-sm font-medium">Projects</h2>
            <Separator />
            <Accordion type="single" collapsible className="space-y-2">
              {projects.map((p) => (
                <AccordionItem
                  key={p.id}
                  value={p.id}
                  className="border rounded-md px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-2">
                    <span className="text-sm font-medium">{p.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-2">
                    <ProjectForm
                      initial={{
                        title: p.title,
                        description: p.description,
                        techStack: p.techStack,
                        link: p.link,
                      }}
                      onSave={(data) =>
                        updateEntry(
                          "/api/project",
                          p.id,
                          data,
                          setProjects,
                          () => {},
                        )
                      }
                      onCancel={() => {}}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() =>
                        deleteEntry("/api/student/projects", p.id, setProjects)
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {editingProj === "new" ? (
              <ProjectForm
                initial={{
                  title: "",
                  description: "",
                  techStack: [],
                  link: null,
                }}
                onSave={(data) =>
                  createEntry("/api/project", data, setProjects, () =>
                    setEditingProj(null),
                  )
                }
                onCancel={() => setEditingProj(null)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setEditingProj("new");
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Project
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <h2 className="text-sm font-medium">Achievements</h2>
            <Separator />
            <Accordion type="single" collapsible className="space-y-2">
              {achievements.map((a) => (
                <AccordionItem
                  key={a.id}
                  value={a.id}
                  className="border rounded-md px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{a.title}</span>
                      {a.verified && (
                        <span className="text-xs text-green-600">
                          · Verified
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-2">
                    <AchievementForm
                      initial={{
                        title: a.title,
                        description: a.description,
                        proofImage: a.proofImage,
                      }}
                      onSave={(data) =>
                        updateEntry(
                          "/api/achievement",
                          a.id,
                          data,
                          setAchievements,
                          () => setEditingAch(null),
                        )
                      }
                      onCancel={() => setEditingAch(null)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() =>
                        deleteEntry(
                          "/api/student/achievements",
                          a.id,
                          setAchievements,
                        )
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {editingAch === "new" ? (
              <AchievementForm
                initial={{ title: "", description: "", proofImage: null }}
                onSave={(data) =>
                  createEntry("/api/achievement", data, setAchievements, () =>
                    setEditingAch(null),
                  )
                }
                onCancel={() => setEditingAch(null)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setEditingAch("new");
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Achievement
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <h2 className="text-sm font-medium">Certifications</h2>
            <Separator />
            <Accordion type="single" collapsible className="space-y-2">
              {certifications.map((c) => (
                <AccordionItem
                  key={c.id}
                  value={c.id}
                  className="border rounded-md px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        · {c.issuer}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-2">
                    <CertificationForm
                      initial={{
                        name: c.name,
                        issuer: c.issuer,
                        issueDate: c.issueDate,
                        proofImage: c.proofImage,
                      }}
                      onSave={(data) =>
                        updateEntry(
                          "/api/certification",
                          c.id,
                          data,
                          setCertifications,
                          () => setEditingCert(null),
                        )
                      }
                      onCancel={() => setEditingCert(null)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() =>
                        deleteEntry(
                          "/api/student/certifications",
                          c.id,
                          setCertifications,
                        )
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {editingCert === "new" ? (
              <CertificationForm
                initial={{
                  name: "",
                  issuer: "",
                  issueDate: null,
                  proofImage: null,
                }}
                onSave={(data) =>
                  createEntry(
                    "/api/certification",
                    data,
                    setCertifications,
                    () => setEditingCert(null),
                  )
                }
                onCancel={() => setEditingCert(null)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setEditingCert("new");
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Certification
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Socials */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <h2 className="text-sm font-medium">Socials</h2>
            <Separator />
            <Accordion type="single" collapsible className="space-y-2">
              {socials.map((s) => (
                <AccordionItem
                  key={s.id}
                  value={s.id}
                  className="border rounded-md px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-2">
                    <span className="text-sm font-medium">{s.type}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-2">
                    <SocialForm
                      initial={{ type: s.type, url: s.url }}
                      onSave={(data) =>
                        updateEntry("/api/social", s.id, data, setSocials, () =>
                          setEditingSoc(null),
                        )
                      }
                      onCancel={() => setEditingSoc(null)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() =>
                        deleteEntry("/api/student/socials", s.id, setSocials)
                      }
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {editingSoc === "new" ? (
              <SocialForm
                initial={{ type: "OTHER", url: "" }}
                onSave={(data) =>
                  createEntry("/api/social", data, setSocials, () =>
                    setEditingSoc(null),
                  )
                }
                onCancel={() => setEditingSoc(null)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setEditingSoc("new");
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Social
              </Button>
            )}
          </CardContent>
        </Card>
      </Accordion>
    </div>
  );
}
