import { type NextRequest, NextResponse } from "next/server";
import React from "react";
import { templates } from "@/components/templates";
import { requireRole } from "@/lib/api-auth";
import { StudentWithRelations } from "@/types/cv";

const ReactDOMServer = await import("react-dom/server");
export const runtime = "nodejs";

const PDF_SERVICE_BULK_URL =
  process.env.CV_SERVICE_URL
    ? `${process.env.CV_SERVICE_URL}/bulk`
    : "http://localhost:3001/cv/bulk";

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireRole(["FACULTY"]);
    if (error) return error;

    const body = await req.json();
    const { template, data } = body as { template: string; data: StudentWithRelations[] };

    const Template = templates[template as keyof typeof templates];
    if (!Template) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Missing or empty data" }, { status: 400 });
    }

    const entries = data.map((d) => {
      const element = React.createElement(Template, { data: d });
      const html = ReactDOMServer.renderToStaticMarkup(element);
      return {
        name: d.user.name,
        html: `<!doctype html><html><title>${d.user.name} Resume</title><body>${html}</body></html>`,
      };
    });

    const pdfResponse = await fetch(PDF_SERVICE_BULK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });

    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "Failed to generate PDFs" }, { status: 500 });
    }

    const zipBuffer = await pdfResponse.arrayBuffer();

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="resumes.zip"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
