import { type NextRequest, NextResponse } from "next/server";
import React from "react";
import { templates } from "@/components/templates";
import { requireRole } from "@/lib/api-auth";

const ReactDOMServer = await import("react-dom/server");
export const runtime = "nodejs";

const PDF_SERVICE_URL = "http://localhost:3001/cv";

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireRole(["STUDENT"]);
    if (error) return error;

    const body = await req.json();
    const { template, data } = body;
    const Template = templates[template as keyof typeof templates];

    if (!Template) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }

    const element = React.createElement(Template, { data });
    const html = ReactDOMServer.renderToStaticMarkup(element);
    const fullHtml = `<!doctype html><html><body>${html}</body></html>`;

    const pdfResponse = await fetch(PDF_SERVICE_URL, {
      method: "POST",
      body: JSON.stringify({
        html: fullHtml,
      }),
    });

    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 },
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
