import type { ReactNode } from "react";
import type { IconComponent } from "../../../../icons";
import { Check, ExternalLink } from "../../../../icons";
import { MarkdownInline } from "../../../../markdown";
import type { CvMark } from "../../../types";

export function VerifiedMark({ mark }: { mark: CvMark | null }) {
  if (!mark) return null;

  const icon = <Check className="size-10 stroke-3 text-cv-mark" />;

  if (!mark.proofUrl) {
    return (
      <span
        className="inline-flex shrink-0 items-center"
        title="Verified by the college"
      >
        {icon}
      </span>
    );
  }

  return (
    <a
      href={mark.proofUrl}
      className="inline-flex shrink-0 items-center"
      title="Verified by the college — open the proof"
    >
      {icon}
    </a>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-8">
      <h2 className="mb-2 cv-break-after-avoid border-cv-rule border-b-2 pb-2 font-extrabold text-base text-cv-accent uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function EntryList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-(--cv-entry-gap)">{children}</div>;
}

export function Entry({ children }: { children: ReactNode }) {
  return (
    <article className="flex cv-break-avoid flex-col gap-2">{children}</article>
  );
}

export function EntryHeader({
  title,
  href,
  subtitle,
  mark,
  meta,
}: {
  title: string;
  href?: string | null;
  subtitle?: string | null;
  mark?: CvMark | null;
  meta?: ReactNode;
}) {
  const heading = (
    <span className="inline-flex items-center gap-4 font-bold text-base">
      <MarkdownInline>{title}</MarkdownInline>
      {href && <ExternalLink className="size-10 text-cv-ink-subtle" />}
    </span>
  );

  return (
    <header className="flex items-start justify-between gap-12">
      <div className="flex min-w-0 flex-col">
        <span className="inline-flex items-center gap-4">
          {href ? <a href={href}>{heading}</a> : heading}
          <VerifiedMark mark={mark ?? null} />
        </span>
        {subtitle && (
          <span className="text-base text-cv-ink-muted italic">
            <MarkdownInline>{subtitle}</MarkdownInline>
          </span>
        )}
      </div>
      {meta && (
        <div className="flex shrink-0 flex-col items-end gap-1">{meta}</div>
      )}
    </header>
  );
}

export function EntryDate({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <span className="pr-3 text-base text-cv-ink-muted italic">
      <MarkdownInline>{children}</MarkdownInline>
    </span>
  );
}

export function EntryKind({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <span className="text-base text-cv-ink-muted uppercase">
      <MarkdownInline>{children}</MarkdownInline>
    </span>
  );
}

export function ContactLink({
  icon: Icon,
  href,
  label,
}: {
  icon: IconComponent;
  href?: string;
  label: string;
}) {
  const body = (
    <>
      <Icon className="size-12 shrink-0 text-cv-ink-subtle" />
      <span className="truncate">{label}</span>
    </>
  );

  return href ? (
    <a href={href} className="flex min-w-0 items-center gap-5 text-cv-ink">
      {body}
    </a>
  ) : (
    <span className="flex min-w-0 items-center gap-5 text-cv-ink">{body}</span>
  );
}
