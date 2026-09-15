import type { Social } from "@aecfolio/shared";
import { degreeLabelShort } from "@aecfolio/shared";
import { Envelope, MapPin, Phone, socialIcon } from "../../../../icons";
import { MarkdownInline } from "../../../../markdown";
import type { CvData } from "../../../types";
import type { StandardOptions } from "../options";
import { ContactLink } from "./primitives";

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function Header({
  data,
  options,
  socials,
}: {
  data: CvData;
  options: StandardOptions;
  socials: Social[];
}) {
  const { student, user, institution } = data;
  const location = student.location?.trim() || institution.location;

  return (
    <header className="flex cv-break-avoid items-center gap-20">
      {options.showPhoto && user.image && (
        <img
          alt={user.name}
          src={user.image}
          className="size-80 shrink-0 rounded-full object-cover"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex items-baseline gap-8">
          <h1 className="font-extrabold text-cv-accent text-xl leading-none tracking-wide">
            <MarkdownInline>{user.name}</MarkdownInline>
          </h1>
          {student.titleSought?.trim() && (
            <span className="text-cv-ink-muted text-md leading-none">
              <MarkdownInline>{student.titleSought}</MarkdownInline>
            </span>
          )}
        </div>

        <div className="flex items-center text-base text-cv-ink-muted">
          <span>{degreeLabelShort(student.course, student.branch)}</span>
          <span className="px-4">·</span>
          <span>{institution.name}</span>
        </div>

        <div
          className={
            options.contactColumns === 2
              ? "grid grid-cols-2 gap-x-8 gap-y-3 text-base"
              : "grid grid-cols-3 gap-x-8 gap-y-3 text-base"
          }
        >
          {user.email && (
            <ContactLink
              icon={Envelope}
              href={`mailto:${user.email}`}
              label={user.email}
            />
          )}
          {user.phone && (
            <ContactLink
              icon={Phone}
              href={`tel:${user.phone}`}
              label={user.phone}
            />
          )}
          {socials.map((social) => (
            <ContactLink
              key={social.id}
              icon={socialIcon(social.title)}
              href={social.url}
              label={displayUrl(social.url)}
            />
          ))}
          {options.showLocation && location && (
            <ContactLink icon={MapPin} label={location} />
          )}
        </div>
      </div>
    </header>
  );
}
