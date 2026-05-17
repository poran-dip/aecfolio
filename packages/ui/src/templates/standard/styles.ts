export const styles = `
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
    font-size: 11px;
    font-family: 'Outfit', Arial, sans-serif;
    line-height: 1.4;
  }

  .cv-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

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
    width: 12px;
    height: 12px;
  }

  .cv-link-icon {
    width: 10px;
    height: 10px;
  }

  .cv-badge-icon {
    width: 9px;
    height: 9px;
  }

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

  .cv-bio {
    font-size: 11px;
    line-height: 1.6;
    color: var(--text-primary);
  }

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

  .cv-skills-text {
    font-size: 11px;
    color: var(--text-primary);
  }

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
