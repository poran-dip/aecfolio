import type {
  Achievement,
  Certification,
  Experience,
  Project,
  Result,
  Social,
} from "@aecfolio/shared";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import AchievementForm from "./forms/achievement-form";
import CertificationForm from "./forms/certification-form";
import ExperienceForm from "./forms/experience-form";
import ProjectForm from "./forms/project-form";
import ResultForm from "./forms/result-form";
import SocialForm from "./forms/social-form";
import { ProfileBasicInfo } from "./profile-basic-info";
import { ProfileHeader } from "./profile-header";
import { ProfileSection } from "./profile-section";
import { useProfile } from "./use-profile";
import { createSaveHandler, deleteEntry } from "./use-profile-entries";

export default function StudentProfile() {
  const {
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
  } = useProfile();

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const getResultInitialData = (item: Result | null) => ({
    semester: item?.semester ?? 1,
    pendingSgpa: item?.pendingSgpa ?? null,
  });

  const getExperienceInitialData = (item: Experience | null) => ({
    type: item?.type ?? "INTERNSHIP",
    title: item?.title ?? "",
    organization: item?.organization ?? "",
    description: item?.description ?? "",
    startDate: item?.startDate?.toISOString() ?? null,
    endDate: item?.endDate?.toISOString() ?? null,
  });

  const getProjectInitialData = (item: Project | null) => ({
    title: item?.title ?? "",
    description: item?.description ?? "",
    techStack: item?.techStack ?? [],
    link: item?.link ?? null,
  });

  const getAchievementInitialData = (item: Achievement | null) => ({
    title: item?.title ?? "",
    description: item?.description ?? "",
    proofImage: item?.proofImage ?? null,
  });

  const getCertificationInitialData = (item: Certification | null) => ({
    name: item?.name ?? "",
    issuer: item?.issuer ?? "",
    issueDate: item?.issueDate?.toISOString() ?? null,
    proofImage: item?.proofImage ?? null,
  });

  const getSocialInitialData = (item: Social | null) => ({
    type: item?.type ?? "OTHER",
    url: item?.url ?? "",
  });

  const handleResultSave = createSaveHandler<Result>({
    endpoint: "/api/results",
    setItems: setResults,
    clearEditing: () => setEditingRes(null),
  });

  const handleExperienceSave = createSaveHandler<Experience>({
    endpoint: "/api/experiences",
    setItems: setExperiences,
    clearEditing: () => setEditingExp(null),
  });

  const handleProjectSave = createSaveHandler<Project>({
    endpoint: "/api/projects",
    setItems: setProjects,
    clearEditing: () => setEditingProj(null),
  });

  const handleAchievementSave = createSaveHandler<Achievement>({
    endpoint: "/api/achievements",
    setItems: setAchievements,
    clearEditing: () => setEditingAch(null),
  });

  const handleCertificationSave = createSaveHandler<Certification>({
    endpoint: "/api/certifications",
    setItems: setCertifications,
    clearEditing: () => setEditingCert(null),
  });

  const handleSocialSave = createSaveHandler<Social>({
    endpoint: "/api/socials",
    setItems: setSocials,
    clearEditing: () => setEditingSoc(null),
  });

  return (
    <div className="space-y-6">
      <ProfileHeader
        rollNo={user.student.rollNo}
        course={user.student.course}
        branch={user.student.branch}
        semester={user.student.semester}
      />

      <Separator />

      <ProfileBasicInfo
        user={user}
        isEditing={editingProfile}
        onStartEdit={() => {
          setUserDraft({
            name: user.name ?? undefined,
            phone: user.phone ?? undefined,
          });
          setStudentDraft({
            bio: user.student.bio ?? undefined,
            skills: user.student.skills,
          });
          setEditingProfile(true);
        }}
        onCancel={() => setEditingProfile(false)}
        onSave={saveProfile}
        userDraft={userDraft}
        onUserDraftChange={setUserDraft}
        studentDraft={studentDraft}
        onStudentDraftChange={setStudentDraft}
        skillInput={skillInput}
        onSkillInputChange={setSkillInput}
      />

      <Separator />

      <div className="space-y-4">
        <ProfileSection
          title="Results"
          items={results}
          FormComponent={ResultForm}
          renderTrigger={(r) => (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Semester {r.semester}</span>
              {r.verified && (
                <span className="text-xs text-green-600">· Verified</span>
              )}
            </div>
          )}
          editingId={editingRes}
          onAddClick={() => setEditingRes("new")}
          onCancel={() => setEditingRes(null)}
          getFormInitialData={getResultInitialData}
          getFormOnSave={handleResultSave}
          onItemDelete={(id) => () =>
            deleteEntry("/api/results", id, setResults)
          }
        />

        <ProfileSection
          title="Experience"
          items={experiences}
          FormComponent={ExperienceForm}
          renderTrigger={(e) => (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{e.title}</span>
              <span className="text-xs text-muted-foreground">
                · {e.organization}
              </span>
            </div>
          )}
          editingId={editingExp}
          onAddClick={() => setEditingExp("new")}
          onCancel={() => setEditingExp(null)}
          getFormInitialData={getExperienceInitialData}
          getFormOnSave={handleExperienceSave}
          onItemDelete={(id) => () =>
            deleteEntry("/api/experiences", id, setExperiences)
          }
        />

        <ProfileSection
          title="Projects"
          items={projects}
          FormComponent={ProjectForm}
          renderTrigger={(p) => (
            <span className="text-sm font-medium">{p.title}</span>
          )}
          editingId={editingProj}
          onAddClick={() => setEditingProj("new")}
          onCancel={() => setEditingProj(null)}
          getFormInitialData={getProjectInitialData}
          getFormOnSave={handleProjectSave}
          onItemDelete={(id) => () =>
            deleteEntry("/api/projects", id, setProjects)
          }
        />

        <ProfileSection
          title="Achievements"
          items={achievements}
          FormComponent={AchievementForm}
          renderTrigger={(a) => (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{a.title}</span>
              {a.verified && (
                <span className="text-xs text-green-600">· Verified</span>
              )}
            </div>
          )}
          editingId={editingAch}
          onAddClick={() => setEditingAch("new")}
          onCancel={() => setEditingAch(null)}
          getFormInitialData={getAchievementInitialData}
          getFormOnSave={handleAchievementSave}
          onItemDelete={(id) => () =>
            deleteEntry("/api/achievements", id, setAchievements)
          }
        />

        <ProfileSection
          title="Certifications"
          items={certifications}
          FormComponent={CertificationForm}
          renderTrigger={(c) => (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                · {c.issuer}
              </span>
              {c.verified && (
                <span className="text-xs text-green-600">· Verified</span>
              )}
            </div>
          )}
          editingId={editingCert}
          onAddClick={() => setEditingCert("new")}
          onCancel={() => setEditingCert(null)}
          getFormInitialData={getCertificationInitialData}
          getFormOnSave={handleCertificationSave}
          onItemDelete={(id) => () =>
            deleteEntry("/api/certifications", id, setCertifications)
          }
        />

        <ProfileSection
          title="Socials"
          items={socials}
          FormComponent={SocialForm}
          renderTrigger={(s) => (
            <span className="text-sm font-medium">{s.type}</span>
          )}
          editingId={editingSoc}
          onAddClick={() => setEditingSoc("new")}
          onCancel={() => setEditingSoc(null)}
          getFormInitialData={getSocialInitialData}
          getFormOnSave={handleSocialSave}
          onItemDelete={(id) => () =>
            deleteEntry("/api/socials", id, setSocials)
          }
        />
      </div>
    </div>
  );
}
