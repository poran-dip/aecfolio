import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "~/components/brand/logo";
import { REPO_URL } from "~/lib/links";

type FooterLink = { label: string; to: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "AECFolio",
    links: [
      { label: "Home", to: "/" },
      { label: "About", to: "/about" },
      { label: "Source code", to: REPO_URL, external: true },
    ],
  },
  {
    title: "College",
    links: [
      {
        label: "Assam Engineering College",
        to: "https://aec.ac.in",
        external: true,
      },
      {
        label: "Training & Placement Cell",
        to: "https://placement.aec.ac.in",
        external: true,
      },
    ],
  },
];

function FooterAnchor({ link }: { link: FooterLink }) {
  const className =
    "text-sm text-ink transition-colors hover:text-primary-text";
  const content: ReactNode = (
    <>
      {link.label}
      {link.external && (
        <ArrowUpRight className="ml-1 inline size-3.5 align-[-2px] text-ink-subtle" />
      )}
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.to}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
      >
        {content}
      </a>
    );
  }
  return (
    <Link to={link.to} className={className}>
      {content}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[3fr_1fr_1fr]">
          <div className="flex flex-col gap-3 md:col-span-1">
            <Logo />
            <p className="max-w-md text-sm leading-relaxed text-ink-muted">
              The student portfolio and records system of Assam Engineering
              College, Guwahati.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterAnchor link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AECFolio</p>
          <p>
            Built and maintained by{" "}
            <Link
              to="/about#credits"
              className="font-medium text-ink transition-colors hover:text-primary-text"
            >
              Poran Dip Boruah
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
