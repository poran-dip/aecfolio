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
import { parseApi } from "~/lib/api";
import { apiClient } from "~/lib/api-client";
import type { StudentWithRelations } from "../cv/types";
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
        const res = await apiClient.api.cv.me.$get();
        const data = await parseApi<StudentWithRelations>(res);

        setUser({ ...data.user, student: data } as UserWithStudent);
        setExperiences(data.experiences);
        setProjects(data.projects);
        setAchievements(data.achievements);
        setCertifications(data.certifications);
        setSocials(data.socials);
        setResults(data.results);
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
      const res = await apiClient.api.me.$patch({ json: userDraft });
      const updated = await parseApi<User>(res);
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
      const res = await apiClient.api.me.student.$patch({ json: studentDraft });
      const updated = await parseApi<Student>(res);
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
