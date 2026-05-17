import { formatDate } from "@aecfolio/shared";
import {
  Check,
  Envelope,
  ExternalLink,
  Github,
  Link,
  Linkedin,
  MapPin,
  Phone,
} from "../../icons";
import type { CVProps } from "../../types";
import { styles } from "./styles";

export function StandardTemplate({ data }: CVProps) {
  const linkedin = data.socials.find((s) => s.type === "LINKEDIN");
  const github = data.socials.find((s) => s.type === "GITHUB");
  const otherSocials = data.socials.filter((s) => s.type === "OTHER");

  return (
    <div className="cv-page">
      <style>{styles}</style>
      <div className="cv-root">
        {/* Header */}
        <div className="cv-header">
          {data.user.image && (
            <img
              alt={data.user.name ?? "Profile photo"}
              src={data.user.image}
              className="cv-avatar"
            />
          )}
          <div className="cv-header-info">
            <h1 className="cv-name">{data.user.name}</h1>
            <div className="cv-subtitle">
              <span>
                {data.course} {data.branch}
              </span>
              <span className="cv-dot">·</span>
              <span>Assam Engineering College, Guwahati</span>
            </div>
            <div className="cv-contacts">
              {data.user.email && (
                <a
                  href={`mailto:${data.user.email}`}
                  className="cv-contact-link"
                >
                  <span className="cv-contact-icon">
                    <Envelope />
                  </span>
                  <span>{data.user.email}</span>
                </a>
              )}
              {data.user.phone && (
                <a href={`tel:${data.user.phone}`} className="cv-contact-link">
                  <span className="cv-contact-icon">
                    <Phone />
                  </span>
                  <span>{data.user.phone}</span>
                </a>
              )}
              {linkedin && (
                <a href={linkedin.url} className="cv-contact-link">
                  <span className="cv-contact-icon">
                    <Linkedin />
                  </span>
                  <span>{linkedin.url.replace("https://", "")}</span>
                </a>
              )}
              {github && (
                <a href={github.url} className="cv-contact-link">
                  <span className="cv-contact-icon">
                    <Github />
                  </span>
                  <span>{github.url.replace("https://", "")}</span>
                </a>
              )}
              {otherSocials.map((s) => (
                <a key={s.id} href={s.url} className="cv-contact-link">
                  <span className="cv-contact-icon">
                    <Link />
                  </span>
                  <span>{s.url.replace("https://", "")}</span>
                </a>
              ))}
              <span className="cv-contact-link">
                <span className="cv-contact-icon">
                  <MapPin />
                </span>
                <span>Guwahati, Assam, India</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {data.bio && (
          <div className="cv-section">
            <h2 className="cv-section-title">Summary</h2>
            <p className="cv-bio">{data.bio}</p>
          </div>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <div className="cv-section">
            <h2 className="cv-section-title">Projects</h2>
            <div className="cv-items">
              {data.projects.map((project) => (
                <div key={project.id} className="cv-item">
                  <div className="cv-item-header">
                    <a
                      href={project.link ?? "#"}
                      className="cv-item-title-link"
                    >
                      <span>{project.title}</span>
                      {project.link && (
                        <span className="cv-link-icon">
                          <ExternalLink />
                        </span>
                      )}
                    </a>
                  </div>
                  <p className="cv-item-desc">{project.description}</p>
                  {project.techStack.length > 0 && (
                    <p className="cv-item-tech">
                      {project.techStack.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {data.experiences.length > 0 && (
          <div className="cv-section">
            <h2 className="cv-section-title">Experience</h2>
            <div className="cv-items">
              {data.experiences.map((exp) => (
                <div key={exp.id} className="cv-item">
                  <div className="cv-item-header">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="cv-item-title">{exp.title}</span>
                      <span className="cv-item-org">{exp.organization}</span>
                    </div>
                    <div className="cv-item-meta">
                      <span className="cv-item-date">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </span>
                      <span className="cv-item-type">{exp.type}</span>
                    </div>
                  </div>
                  <p className="cv-item-desc">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="cv-section">
            <h2 className="cv-section-title">Skills</h2>
            <p className="cv-skills-text">{data.skills.join(", ")}</p>
          </div>
        )}

        {/* Education */}
        <div className="cv-section">
          <h2 className="cv-section-title">Education</h2>
          <div className="cv-edu-row">
            <div className="cv-edu-left">
              <span>B.Tech in {data.branch}</span>
              <span>Assam Engineering College</span>
              {data.cgpa && (
                <ul className="cv-edu-cgpa">
                  <li>
                    <span>CGPA: {data.cgpa.toFixed(2)}</span>
                    <span className="cv-verified">
                      <span className="cv-badge-icon">
                        <Check />
                      </span>
                      Verified
                    </span>
                  </li>
                </ul>
              )}
            </div>
            <div className="cv-item-meta">
              <span className="cv-item-date">
                {new Date(data.createdAt).getFullYear()} - Present
              </span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {data.achievements.length > 0 && (
          <div className="cv-section">
            <h2 className="cv-section-title">Achievements</h2>
            <div className="cv-items">
              {data.achievements.map((a) => (
                <div key={a.id} className="cv-item">
                  <div className="cv-item-header">
                    <span className="cv-item-title">{a.title}</span>
                    {a.verified && (
                      <span className="cv-verified">
                        <span className="cv-badge-icon">
                          <Check />
                        </span>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="cv-item-desc">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <div className="cv-section">
            <h2 className="cv-section-title">Certifications</h2>
            <div className="cv-items">
              {data.certifications.map((cert) => (
                <div key={cert.id} className="cv-item">
                  <span className="cv-item-title">{cert.name}</span>
                  <div className="cv-cert-meta">
                    <span>{cert.issuer}</span>
                    {cert.issueDate && (
                      <>
                        <span className="cv-cert-sep">·</span>
                        <span>Issued {formatDate(cert.issueDate)}</span>
                      </>
                    )}
                    {cert.verified && (
                      <>
                        <span className="cv-cert-sep">·</span>
                        <span className="cv-verified">
                          <span className="cv-badge-icon">
                            <Check />
                          </span>
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
