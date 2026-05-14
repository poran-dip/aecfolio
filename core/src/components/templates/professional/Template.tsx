import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import {
  faCheck,
  faEnvelope,
  faExternalLink,
  faLink,
  faMapPin,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/utils/date";
import { Props } from "@/types/cv";
import { iconSvg } from "@/lib/cv-icon";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .cv-page * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .cv-page {
    width: 210mm;
    min-height: 297mm;
    padding: 10mm 12mm;
    --surface: #ffffff;
    --border: #d6d3d1;
    --accent: #054e16;
    --text-primary: #1c1917;
    --text-secondary: #2c2b29;
    --text-muted: #a8a29e;
    --verified: #16a34a;
    --tag-bg: #e7e5e4;
    --tag-text: #292524;

    background: var(--surface);
    color: var(--text-primary);

    background: var(--surface);
    color: var(--text-primary);
    font-size: 11px;
    font-family: 'Outfit', Arial, sans-serif;
    line-height: 1.4;
  }

  .cv-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Header */
  .cv-header {
    display: flex;
    gap: 20px;
    align-items: center;
    break-inside: avoid;
  }

  .cv-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .cv-header-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cv-name {
    color: var(--accent);
    font-weight: 800;
    letter-spacing: 0.05em;
    font-size: 16px;
    line-height: 1;
  }

  .cv-subtitle {
    font-size: 11px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .cv-dot {
    padding: 0 4px;
  }

  .cv-contacts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3px 8px;
    font-size: 11px;
  }

  .cv-contact-link {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-primary);
    text-decoration: none;
    transition: color 0.15s;
  }

  .cv-contact-link:hover {
    color: var(--text-secondary);
  }

  .cv-contact-icon,
  .cv-badge-icon,
  .cv-link-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .cv-contact-icon svg {
    width: 12px;
    height: 12px;
    display: block;
  }

  .cv-link-icon svg {
    width: 10px;
    height: 10px;
    display: block;
  }

  .cv-badge-icon svg {
    width: 9px;
    height: 9px;
    display: block;
  }

  /* Section */
  .cv-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    break-inside: avoid;
  }

  .cv-section-title {
    font-size: 11px;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 800;
    border-bottom: 2px solid var(--accent);
    padding-bottom: 2px;
    margin-bottom: 2px;
  }

  /* Bio */
  .cv-bio {
    font-size: 11px;
    line-height: 1.6;
    color: var(--text-primary);
  }

  /* Items list (projects, experience, achievements, certs) */
  .cv-items {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .cv-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cv-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .cv-item-title-link {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 700;
    font-size: 11px;
  }

  .cv-item-title {
    font-weight: 700;
    font-size: 11px;
  }

  .cv-item-org {
    font-style: italic;
    font-size: 11px;
    color: var(--text-secondary);
  }

  .cv-item-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
  }

  .cv-item-date {
    font-size: 11px;
    color: var(--text-secondary);
    font-style: italic;
  }

  .cv-item-type {
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .cv-item-desc {
    font-size: 11px;
    color: var(--text-primary);
    line-height: 1.5;
  }

  .cv-item-tech {
    font-size: 11px;
    color: var(--text-muted);
  }

  /* Skills */
  .cv-skills-text {
    font-size: 11px;
    color: var(--text-primary);
  }

  /* Education */
  .cv-edu-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .cv-edu-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
  }

  .cv-edu-cgpa {
    list-style: disc;
    padding-left: 16px;
  }

  .cv-edu-cgpa li {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }

  .cv-verified {
    color: var(--verified);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }

  /* Certs */
  .cv-cert-meta {
    font-size: 11px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0;
    flex-wrap: wrap;
  }

  .cv-cert-sep {
    padding: 0 6px;
  }
`;

export function ProfessionalTemplate({ data }: Props) {
  const linkedin = data.socials.find((s) => s.type === "LINKEDIN");
  const github = data.socials.find((s) => s.type === "GITHUB");
  const otherSocials = data.socials.filter((s) => s.type === "OTHER");

  return (
    <div className="cv-page">
      <style>{css}</style>
      <div className="cv-root">

        {/* Header */}
        <div className="cv-header">
          {data.user.image && (
            // biome-ignore lint/performance/noImgElement: static markup, Next image not applicable
            <img
              alt={data.user.name ?? "Profile photo"}
              src={data.user.image}
              className="cv-avatar"
            />
          )}
          <div className="cv-header-info">
            <h1 className="cv-name">{data.user.name}</h1>
            <div className="cv-subtitle">
              <span>{data.course} {data.branch}</span>
              <span className="cv-dot">·</span>
              <span>Assam Engineering College, Guwahati</span>
            </div>
            <div className="cv-contacts">
              {data.user.email && (
                <a href={`mailto:${data.user.email}`} className="cv-contact-link">
                  <span
                    className="cv-contact-icon"
                    dangerouslySetInnerHTML={{
                      __html: iconSvg(faEnvelope),
                    }}
                  />
                  <span>{data.user.email}</span>
                </a>
              )}
              {data.user.phone && (
                <a href={`tel:${data.user.phone}`} className="cv-contact-link">
                  <span
                    className="cv-contact-icon"
                    dangerouslySetInnerHTML={{
                      __html: iconSvg(faPhone),
                    }}
                  />
                  <span>{data.user.phone}</span>
                </a>
              )}
              {linkedin && (
                <a href={linkedin.url} className="cv-contact-link">
                  <span
                    className="cv-contact-icon"
                    dangerouslySetInnerHTML={{
                      __html: iconSvg(faLinkedin),
                    }}
                  />
                  <span>{linkedin.url.replace("https://", "")}</span>
                </a>
              )}
              {github && (
                <a href={github.url} className="cv-contact-link">
                  <span
                    className="cv-contact-icon"
                    dangerouslySetInnerHTML={{
                      __html: iconSvg(faGithub),
                    }}
                  />
                  <span>{github.url.replace("https://", "")}</span>
                </a>
              )}
              {otherSocials.map((s) => (
                <a key={s.id} href={s.url} className="cv-contact-link">
                  <span
                    className="cv-contact-icon"
                    dangerouslySetInnerHTML={{
                      __html: iconSvg(faLink),
                    }}
                  />
                  <span>{s.url.replace("https://", "")}</span>
                </a>
              ))}
              <span className="cv-contact-link">
                <span
                  className="cv-contact-icon"
                  dangerouslySetInnerHTML={{
                    __html: iconSvg(faMapPin),
                  }}
                />
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
                    <a href={project.link ?? "#"} className="cv-item-title-link">
                      <span>{project.title}</span>
                      {project.link && (
                        <span
                          className="cv-link-icon"
                          dangerouslySetInnerHTML={{
                            __html: iconSvg(faExternalLink),
                          }}
                        />
                      )}
                    </a>
                  </div>
                  <p className="cv-item-desc">{project.description}</p>
                  {project.techStack.length > 0 && (
                    <p className="cv-item-tech">{project.techStack.join(", ")}</p>
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
                      <span
                        className="cv-badge-icon"
                        dangerouslySetInnerHTML={{
                          __html: iconSvg(faCheck),
                        }}
                      />
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
                        <span
                          className="cv-badge-icon"
                          dangerouslySetInnerHTML={{
                            __html: iconSvg(faCheck),
                          }}
                        />
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
                          <span
                            className="cv-badge-icon"
                            dangerouslySetInnerHTML={{
                              __html: iconSvg(faCheck),
                            }}
                          />
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
