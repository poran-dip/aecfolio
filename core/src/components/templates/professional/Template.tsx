import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import {
  faCheck,
  faEnvelope,
  faExternalLink,
  faLink,
  faMapPin,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type {
  Achievement,
  Certification,
  Experience,
  Project,
  Result,
  Social,
  Student,
  User,
} from "@/generated/prisma/client";
import type { CVOptions, CVSections } from "@/types/cv";
import "./styles.css";
import Image from "next/image";

type StudentWithRelations = Student & {
  user: User;
  experiences: Experience[];
  projects: Project[];
  achievements: Achievement[];
  certifications: Certification[];
  socials: Social[];
  results: Result[];
};

type Props = {
  data: {
    student: StudentWithRelations;
    sections: CVSections;
    options: CVOptions;
  };
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "Present";
  return date
    .toLocaleDateString("en-GB", { month: "2-digit", year: "numeric" })
    .replace("/", "/");
}

export function ProfessionalTemplate({ data }: Props) {
  const { student, sections, options } = data;

  const user = student.user;
  const linkedin = student.socials.find((s) => s.type === "LINKEDIN");
  const github = student.socials.find((s) => s.type === "GITHUB");
  const otherSocials = sections.socials
    ? student.socials.filter(
        (s) => sections.socials?.includes(s.id) && s.type === "OTHER",
      )
    : [];

  const selectedProjects = sections.projects
    ? student.projects.filter((p) => sections.projects?.includes(p.id))
    : [];
  const selectedExperience = sections.experience
    ? student.experiences.filter((e) => sections.experience?.includes(e.id))
    : [];
  const selectedAchievements = sections.achievements
    ? student.achievements.filter((a) => sections.achievements?.includes(a.id))
    : [];
  const selectedCertifications = sections.certifications
    ? student.certifications.filter((c) =>
        sections.certifications?.includes(c.id),
      )
    : [];

  return (
    <div className="page">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div
          data-section
          className="flex gap-6 items-center break-inside-avoid"
        >
          {sections.image && user.image && (
            <div className="w-22 h-22 shrink-0">
              <Image
                alt={user.name ?? "Profile photo"}
                src={user.image}
                fill
                className="object-cover rounded-full"
              />
            </div>
          )}
          <div className="flex-1 flex flex-col gap-2">
            <h1 className="text-accent font-extrabold tracking-wide text-lg leading-none">
              {user.name}
            </h1>
            <div className="flex items-center text-xs">
              <span>
                {student.course} {student.branch}
              </span>
              <span className="px-1.5">·</span>
              <span>Assam Engineering College, Guwahati</span>
            </div>
            <div className="grid grid-cols-3 text-xs gap-1">
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-1.5 hover:text-slate-600 transition-all"
                >
                  <FontAwesomeIcon icon={faEnvelope} size="sm" />
                  <span>{user.email}</span>
                </a>
              )}
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="flex items-center gap-1.5 hover:text-slate-600 transition-all"
                >
                  <FontAwesomeIcon icon={faPhone} size="sm" />
                  <span>{user.phone}</span>
                </a>
              )}
              {sections.socials && linkedin && (
                <a
                  href={linkedin.url}
                  className="flex items-center gap-1.5 hover:text-slate-600 transition-all"
                >
                  <FontAwesomeIcon icon={faLinkedin} className="w-3 h-3" />
                  <span>{linkedin.url.replace("https://", "")}</span>
                </a>
              )}
              {sections.socials && github && (
                <a
                  href={github.url}
                  className="flex items-center gap-1.5 hover:text-slate-600 transition-all"
                >
                  <FontAwesomeIcon icon={faGithub} className="w-3 h-3" />
                  <span>{github.url.replace("https://", "")}</span>
                </a>
              )}
              {otherSocials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  className="flex items-center gap-1.5 hover:text-slate-600 transition-all"
                >
                  <FontAwesomeIcon icon={faLink} className="w-3 h-3" />
                  <span>{s.url.replace("https://", "")}</span>
                </a>
              ))}
              <span className="flex items-center gap-1.5 hover:text-slate-600 transition-all">
                <FontAwesomeIcon icon={faMapPin} size="sm" />
                <span>Guwahati, Assam, India</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {sections.bio && student.bio && (
          <div
            data-section
            className="flex flex-col gap-2.5 break-inside-avoid"
          >
            <h2 className="text-sm text-accent uppercase tracking-wide font-extrabold border-b-2 border-accent">
              Summary
            </h2>
            <p className="text-xs-plus leading-relaxed">{student.bio}</p>
          </div>
        )}

        {/* Projects */}
        {selectedProjects.length > 0 && (
          <div data-section className="flex flex-col gap-3 break-inside-avoid">
            <h2 className="text-sm text-accent uppercase tracking-wide font-extrabold border-b-2 border-accent">
              Projects
            </h2>
            <div className="flex flex-col gap-5">
              {selectedProjects.map((project) => (
                <div key={project.id} className="flex flex-col">
                  <div className="flex justify-between">
                    <a
                      href={project.link ?? "#"}
                      className="flex items-center gap-1 self-start"
                    >
                      <span className="text-xs-plus font-bold">
                        {project.title}
                      </span>
                      {project.link && (
                        <FontAwesomeIcon icon={faExternalLink} size="2xs" />
                      )}
                    </a>
                  </div>
                  <div className="text-xs-plus">
                    <p>{project.description}</p>
                    {project.techStack.length > 0 && (
                      <p className="text-muted">
                        {project.techStack.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {selectedExperience.length > 0 && (
          <div
            data-section
            className="flex flex-col gap-2.5 break-inside-avoid"
          >
            <h2 className="text-sm text-accent uppercase tracking-wide font-extrabold border-b-2 border-accent">
              Experience
            </h2>
            <div className="flex flex-col gap-5">
              {selectedExperience.map((exp) => (
                <div key={exp.id} className="flex flex-col">
                  <div className="flex justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs-plus font-bold">
                        {exp.title}
                      </span>
                      <span className="text-xs-plus italic">
                        {exp.organization}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-xs text-secondary italic">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </p>
                      <p className="text-xs text-secondary uppercase">
                        {exp.type}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs-plus">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {sections.skills && student.skills.length > 0 && (
          <div
            data-section
            className="flex flex-col gap-2.5 break-inside-avoid"
          >
            <h2 className="text-sm text-accent uppercase tracking-wide font-extrabold border-b-2 border-accent">
              Skills
            </h2>
            <p className="text-xs-plus">{student.skills.join(", ")}</p>
          </div>
        )}

        {/* Education */}
        <div data-section className="flex flex-col gap-2.5 break-inside-avoid">
          <h2 className="text-sm text-accent uppercase tracking-wide font-extrabold border-b-2 border-accent">
            Education
          </h2>
          <div className="flex justify-between">
            <div className="flex flex-col text-xs-plus">
              <p>B.Tech in {student.branch}</p>
              <p>Assam Engineering College</p>
              {options.showCGPA && student.cgpa && (
                <ul className="list-disc pl-4">
                  <li className="flex items-center gap-1">
                    <span>CGPA: {student.cgpa.toFixed(2)}</span>
                    {options.showVerificationTick && (
                      <>
                        <FontAwesomeIcon
                          icon={faCheck}
                          size="2xs"
                          className="mx-2"
                        />
                        <span className="text-green-500 uppercase font-bold tracking-wide">
                          Verified
                        </span>
                      </>
                    )}
                  </li>
                </ul>
              )}
            </div>
            <div className="flex flex-col items-end">
              <p className="text-xs text-secondary italic">
                {new Date(student.createdAt).getFullYear()} - Present
              </p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {selectedAchievements.length > 0 && (
          <div
            data-section
            className="flex flex-col gap-2.5 break-inside-avoid"
          >
            <h2 className="text-sm text-accent uppercase tracking-wide font-extrabold border-b-2 border-accent">
              Achievements
            </h2>
            <div className="flex flex-col gap-5">
              {selectedAchievements.map((a) => (
                <div key={a.id} className="flex flex-col">
                  <div className="flex justify-between">
                    <span className="text-xs-plus font-bold">{a.title}</span>
                    {options.showVerificationTick && a.verified && (
                      <span className="text-green-500 uppercase font-bold tracking-wide text-xs flex items-center gap-1">
                        <FontAwesomeIcon icon={faCheck} size="2xs" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs-plus">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {selectedCertifications.length > 0 && (
          <div
            data-section
            className="flex flex-col gap-2.5 break-inside-avoid"
          >
            <h2 className="text-sm text-accent uppercase tracking-wide font-extrabold border-b-2 border-accent">
              Certifications
            </h2>
            <div className="flex flex-col gap-5">
              {selectedCertifications.map((cert) => (
                <div key={cert.id} className="flex flex-col">
                  <span className="text-xs-plus font-bold">{cert.name}</span>
                  <div className="text-xs-plus text-secondary">
                    <span>{cert.issuer}</span>
                    {cert.issueDate && (
                      <>
                        <span className="px-2">·</span>
                        <span>Issued {formatDate(cert.issueDate)}</span>
                      </>
                    )}
                    {options.showVerificationTick && cert.verified && (
                      <>
                        <span className="px-2">·</span>
                        <span className="text-green-500 uppercase font-bold tracking-wide items-center gap-1 inline-flex">
                          <FontAwesomeIcon icon={faCheck} size="2xs" />
                          Verified
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
