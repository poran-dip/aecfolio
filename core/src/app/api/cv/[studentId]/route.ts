import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import puppeteer from "puppeteer";
import { formatDate, formatExpType } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: { studentId: string } }
) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  let targetId = params.studentId;
  if (targetId === "me") {
    if (!session.user.studentId) return new NextResponse("Not a student", { status: 403 });
    targetId = session.user.studentId;
  }

  // Fetch full student data
  const student = await prisma.student.findUnique({
    where: { id: targetId },
    include: {
      user: true,
      socials: true,
      experiences: { orderBy: { startDate: "desc" } },
      projects: { orderBy: { createdAt: "desc" } },
      achievements: { where: { verified: true } }, // ONLY VERIFIED stuff goes on CV
      certifications: { where: { verified: true } }, 
      results: { where: { verified: true }, orderBy: { semester: "asc" } }, // ONLY VERIFIED SGPA
    },
  });

  if (!student) return new NextResponse("Not found", { status: 404 });

  // Generate HTML directly
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 40px;
          line-height: 1.5;
          font-size: 11pt;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .name {
          font-size: 24pt;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .contact {
          font-size: 10pt;
          color: #475569;
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .contact span { display: inline-flex; align-items: center; gap: 4px; }
        
        .section-title {
          font-size: 13pt;
          font-weight: 700;
          color: #1e3a8a;
          text-transform: uppercase;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 4px;
          margin: 20px 0 12px 0;
          letter-spacing: 0.5px;
        }

        .bio { font-size: 10.5pt; color: #334155; margin-bottom: 20px; }
        
        table.academic {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 10pt;
        }
        .academic th { text-align: left; border-bottom: 1px solid #94a3b8; padding: 6px 4px; color: #475569; font-weight: 600;}
        .academic td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; }
        .academic .official { font-weight: 700; color: #2563eb; }

        .skills { font-size: 10.5pt; margin-bottom: 20px; }
        .skills-content { display: block; line-height: 1.6; }

        .item { margin-bottom: 16px; page-break-inside: avoid; }
        .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .item-title { font-weight: 600; font-size: 11pt; color: #0f172a; }
        .item-subtitle { font-weight: 500; color: #2563eb; font-size: 10pt; }
        .item-date { font-size: 9.5pt; color: #64748b; font-weight: 500;}
        .item-desc { margin: 0; font-size: 10pt; color: #334155; }
        
        .project-tech { font-size: 9pt; color: #64748b; margin-top: 2px; font-style: italic; }

        ul.bullets { margin: 4px 0 0 0; padding-left: 20px; font-size: 10pt;}
        ul.bullets li { margin-bottom: 2px; color: #334155; }

        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 8pt;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="name">${student.user.name}</h1>
        <div class="contact">
          <span>${student.user.email}</span>
          ${student.phone ? `<span>• ${student.phone}</span>` : ""}
          ${student.socials.map(s => `<span>• ${s.url.replace(/^https?:\/\//, '')}</span>`).join("")}
        </div>
      </div>

      ${student.bio ? `<div class="bio">${student.bio}</div>` : ""}

      <div class="section-title">Education & Academic Results</div>
      <table class="academic">
        <thead>
          <tr>
            <th>Degree/Course</th>
            <th>Institution</th>
            <th>Branch</th>
            <th>Official CGPA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${student.course}</td>
            <td>Assam Engineering College</td>
            <td>${student.branch}</td>
            <td class="official">${student.cgpa ? student.cgpa.toFixed(2) : "N/A"}</td>
          </tr>
        </tbody>
      </table>
      
      ${student.results.length > 0 ? `
        <div style="font-size: 9pt; color: #64748b; margin-top:-10px; margin-bottom: 20px;">
          * Verified SGPAs: ${student.results.map(r => `Sem ${r.semester} (${r.sgpa.toFixed(2)})`).join(" • ")}
        </div>
      ` : ""}

      ${student.skills.length > 0 ? `
        <div class="section-title">Technical Skills</div>
        <div class="skills">
          <span class="skills-content">${student.skills.join(" • ")}</span>
        </div>
      ` : ""}

      ${student.experiences.length > 0 ? `
        <div class="section-title">Experience & Leadership</div>
        ${student.experiences.map(exp => `
          <div class="item">
            <div class="item-header">
              <div>
                <span class="item-title">${exp.title}</span> 
                <span style="color:#94a3b8; font-size:10pt;">at</span> 
                <span class="item-subtitle">${exp.organization}</span>
              </div>
              <span class="item-date">
                ${formatDate(exp.startDate)} – ${formatDate(exp.endDate)}
              </span>
            </div>
            <p class="item-desc">${exp.description}</p>
          </div>
        `).join("")}
      ` : ""}

      ${student.projects.length > 0 ? `
        <div class="section-title">Projects</div>
        ${student.projects.map(proj => `
          <div class="item">
            <div class="item-header">
              <span class="item-title">
                ${proj.title} ${proj.link ? `<span style="font-weight:400; font-size:9pt; color:#64748b">(${proj.link})</span>` : ""}
              </span>
            </div>
            <p class="item-desc">${proj.description}</p>
            ${proj.techStack.length > 0 ? `<div class="project-tech">Technologies: ${proj.techStack.join(", ")}</div>` : ""}
          </div>
        `).join("")}
      ` : ""}

      ${student.achievements.length > 0 || student.certifications.length > 0 ? `
        <div class="section-title">Verified Achievements & Certifications</div>
        <ul class="bullets">
          ${student.achievements.map(a => `<li><b>${a.title}</b>: ${a.description}</li>`).join("")}
          ${student.certifications.map(c => `<li><b>${c.name}</b> issued by ${c.issuer} ${c.issueDate ? `(${formatDate(c.issueDate)})` : ""}</li>`).join("")}
        </ul>
      ` : ""}

      <div class="footer">
        Generated by AEC Profiles — Student Information System<br>
        <i>Academic data marked with * is verified by authorized faculty advisors.</i>
      </div>
    </body>
    </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
    });
    
    await browser.close();

    const fileName = `${student.user.name?.replace(/\s+/g, "_")}_AEC_CV.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error("PDF Gen Error:", error);
    return new NextResponse("Internal server error generating PDF", { status: 500 });
  }
}
