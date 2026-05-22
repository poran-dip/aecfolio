import type {
  Achievement,
  Certification,
  Experience,
  Project,
  Result,
  Social,
  Student,
  UpdateStudentInput,
  UpdateUserInput,
  User,
} from "@aecfolio/shared";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchApi } from "~/lib/api";
import type { UserWithStudent } from "./types";

export function useProfile() {
  const [user, setUser] = useState<UserWithStudent | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [userDraft, setUserDraft] = useState<UpdateUserInput>({});
  const [studentDraft, setStudentDraft] = useState<UpdateStudentInput>({});
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
        const [usr, exp, proj, ach, cert, soc, res] = await Promise.all([
          fetchApi<UserWithStudent>("/api/me"),
          fetchApi<Experience[]>("/api/experiences"),
          fetchApi<Project[]>("/api/projects"),
          fetchApi<Achievement[]>("/api/achievements"),
          fetchApi<Certification[]>("/api/certifications"),
          fetchApi<Social[]>("/api/socials"),
          fetchApi<Result[]>("/api/results"),
        ]);
        setUser(usr);
        setExperiences(exp);
        setProjects(proj);
        setAchievements(ach);
        setCertifications(cert);
        setSocials(soc);
        setResults(res);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load profile",
        );
      }
    }
    load();
  }, []);

  async function updateUser() {
    try {
      const updated = await fetchApi<User>("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userDraft),
      });
      setUser((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    }
  }

  async function updateStudent() {
    console.log("studentDraft", studentDraft);
    try {
      const updated = await fetchApi<Student>("/api/me/student", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentDraft),
      });
      setUser((prev) =>
        prev ? { ...prev, student: { ...prev.student, ...updated } } : prev,
      );
      toast.success("Profile updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    }
  }

  async function saveProfile() {
    await Promise.all([updateUser(), updateStudent()]);
    setEditingProfile(false);
  }

  return {
    user,
    editingProfile,
    setEditingProfile,
    userDraft,
    setUserDraft,
    studentDraft,
    setStudentDraft,
    skillInput,
    setSkillInput,
    experiences,
    setExperiences,
    projects,
    setProjects,
    achievements,
    setAchievements,
    certifications,
    setCertifications,
    socials,
    setSocials,
    results,
    setResults,
    editingExp,
    setEditingExp,
    editingProj,
    setEditingProj,
    editingAch,
    setEditingAch,
    editingCert,
    setEditingCert,
    editingSoc,
    setEditingSoc,
    editingRes,
    setEditingRes,
    saveProfile,
  };
}
