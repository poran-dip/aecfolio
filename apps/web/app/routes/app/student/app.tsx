import {
  Capability,
  EXPERIENCE_TYPE_SUGGESTIONS,
  SOCIAL_TITLE_SUGGESTIONS,
  type VerificationStatus,
} from "@aecfolio/shared";
import { DateField } from "~/components/app/date-field";
import { EntryCollection } from "~/components/app/entry-collection";
import { Page } from "~/components/app/page";
import { ProofField } from "~/components/app/proof-field";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { MarkdownEditor } from "~/components/ui/markdown-editor";
import { api, unwrap } from "~/lib/api.server";
import { requireCapability } from "~/lib/guard";
import type { Route } from "./+types/app";
import { AccountSection, ProfileSection } from "./app.personal";
import { ResultsSection } from "./app.results";
import { CustomSections } from "./app.sections";

export const handle = { title: "My profile" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "My profile · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.PROFILE_WRITE_SELF);
  const client = api(request);

  const [me, profile] = await Promise.all([
    unwrap(await client.api.me.$get()),
    unwrap(await client.api.me.profile.$get()),
  ]);

  return { me, profile };
}

const SUGGESTION_LIST = "experience-types";
const SOCIAL_LIST = "social-titles";

export default function StudentAppRoute({ loaderData }: Route.ComponentProps) {
  const { me, profile } = loaderData;

  return (
    <Page description="Everything here is saved as you type. Arranging it into a CV happens on the CV builder.">
      <div className="flex flex-col gap-8">
        <AccountSection account={me} />

        <ProfileSection
          profile={{
            bio: profile.bio,
            titleSought: profile.titleSought,
            location: profile.location,
            skills: profile.skills,
            spokenLanguages: profile.spokenLanguages,
            dob: profile.dob,
            gender: profile.gender,
            caste: profile.caste,
            religion: profile.religion,
            motherName: profile.motherName,
            motherContact: profile.motherContact,
            fatherName: profile.fatherName,
            fatherContact: profile.fatherContact,
          }}
        />

        <ResultsSection
          cgpa={profile.cgpa}
          currentSemester={profile.semester}
          results={profile.results.map((row) => ({
            id: row.id,
            semester: row.semester,
            sgpa: row.sgpa,
            pendingSgpa: row.pendingSgpa,
            status: row.status as VerificationStatus,
            rejectionReason:
              "rejectionReason" in row ? row.rejectionReason : null,
          }))}
        />

        <EntryCollection
          label="Projects"
          singular="project"
          description="What you built, and what it does. The description is markdown."
          initial={profile.projects.map((row) => ({
            id: row.id,
            value: {
              title: row.title,
              description: row.description,
              link: row.link,
            },
          }))}
          blank={() => ({ title: "", description: "", link: null })}
          canSave={(value) => value.title.trim().length > 0}
          titleOf={(value) => value.title}
          subtitleOf={(value) => value.link}
          entity="projects"
          toPayload={(value) => ({
            title: value.title.trim(),
            description: value.description,
            link: value.link?.trim() || null,
          })}
          renderFields={({ value, set, blur }) => (
            <>
              <Field
                label="Title"
                required
                error={value.title.trim() ? undefined : "A title is required."}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={value.title}
                    tone={value.title.trim() ? "normal" : "invalid"}
                    onChange={(event) => set({ title: event.target.value })}
                    onBlur={blur}
                  />
                )}
              </Field>

              <Field label="Link" hint="Optional. A repository or a live demo.">
                {(props) => (
                  <Input
                    {...props}
                    type="url"
                    placeholder="https://github.com/…"
                    value={value.link ?? ""}
                    onChange={(event) => set({ link: event.target.value })}
                    onBlur={blur}
                  />
                )}
              </Field>

              <Field label="Description" hint="Optional.">
                {(props) => (
                  <MarkdownEditor
                    {...props}
                    value={value.description}
                    onChange={(description) => set({ description })}
                    onBlur={blur}
                  />
                )}
              </Field>
            </>
          )}
        />

        <EntryCollection
          label="Experience"
          singular="role"
          description="Internships, jobs, volunteering — the type is free text."
          initial={profile.experiences.map((row) => ({
            id: row.id,
            value: {
              title: row.title,
              organization: row.organization,
              type: row.type,
              description: row.description,
              date: row.date,
            },
          }))}
          blank={() => ({
            title: "",
            organization: "",
            type: "",
            description: "",
            date: null,
          })}
          canSave={(value) =>
            value.title.trim().length > 0 &&
            value.organization.trim().length > 0 &&
            value.type.trim().length > 0
          }
          titleOf={(value) => value.title}
          subtitleOf={(value) => value.organization || null}
          entity="experiences"
          toPayload={(value) => ({
            title: value.title.trim(),
            organization: value.organization.trim(),
            type: value.type.trim(),
            description: value.description,
            date: value.date,
          })}
          renderFields={({ value, set, blur }) => (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Role"
                  required
                  error={value.title.trim() ? undefined : "A role is required."}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={value.title}
                      tone={value.title.trim() ? "normal" : "invalid"}
                      onChange={(event) => set({ title: event.target.value })}
                      onBlur={blur}
                    />
                  )}
                </Field>

                <Field
                  label="Organisation"
                  required
                  error={
                    value.organization.trim()
                      ? undefined
                      : "An organisation is required."
                  }
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={value.organization}
                      tone={value.organization.trim() ? "normal" : "invalid"}
                      onChange={(event) =>
                        set({ organization: event.target.value })
                      }
                      onBlur={blur}
                    />
                  )}
                </Field>
              </div>

              <Field
                label="Type"
                required
                error={value.type.trim() ? undefined : "A type is required."}
                hint="Internship, Part-time, Volunteer — or anything else."
              >
                {(props) => (
                  <>
                    <Input
                      {...props}
                      list={SUGGESTION_LIST}
                      value={value.type}
                      tone={value.type.trim() ? "normal" : "invalid"}
                      onChange={(event) => set({ type: event.target.value })}
                      onBlur={blur}
                    />
                    <datalist id={SUGGESTION_LIST}>
                      {EXPERIENCE_TYPE_SUGGESTIONS.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>

              <DateField
                label="Dates"
                value={value.date}
                onChange={(date) => set({ date })}
                onBlur={blur}
              />

              <Field label="Description" hint="Optional.">
                {(props) => (
                  <MarkdownEditor
                    {...props}
                    value={value.description}
                    onChange={(description) => set({ description })}
                    onBlur={blur}
                  />
                )}
              </Field>
            </>
          )}
        />

        <EntryCollection
          label="Achievements"
          singular="achievement"
          description="Reviewed before they carry a verified mark. Attach the proof and a moderator can check it."
          initial={profile.achievements.map((row) => ({
            id: row.id,
            value: {
              title: row.title,
              description: row.description,
              proofKey: row.proofKey,
              status: row.status as VerificationStatus | null,
            },
          }))}
          blank={() => ({
            title: "",
            description: "",
            proofKey: null,
            status: null as VerificationStatus | null,
          })}
          canSave={(value) => value.title.trim().length > 0}
          titleOf={(value) => value.title}
          statusOf={(value) => value.status}
          entity="achievements"
          toPayload={(value) => ({
            title: value.title.trim(),
            description: value.description,
            proofKey: value.proofKey,
          })}
          renderFields={({ value, set, blur, id }) => (
            <>
              <Field
                label="Title"
                required
                error={value.title.trim() ? undefined : "A title is required."}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={value.title}
                    tone={value.title.trim() ? "normal" : "invalid"}
                    onChange={(event) => set({ title: event.target.value })}
                    onBlur={blur}
                  />
                )}
              </Field>

              <Field label="Description" hint="Optional.">
                {(props) => (
                  <MarkdownEditor
                    {...props}
                    value={value.description}
                    rows={3}
                    onChange={(description) => set({ description })}
                    onBlur={blur}
                  />
                )}
              </Field>

              <ProofField
                kind="achievements"
                entryId={id}
                proofKey={value.proofKey}
                onChange={(proofKey) => set({ proofKey })}
              />
            </>
          )}
        />

        <EntryCollection
          label="Certifications"
          singular="certification"
          description="Reviewed like achievements. The issuer is what a moderator checks first."
          initial={profile.certifications.map((row) => ({
            id: row.id,
            value: {
              name: row.name,
              issuer: row.issuer,
              issueDate: row.issueDate,
              credentialLink: row.credentialLink,
              proofKey: row.proofKey,
              status: row.status as VerificationStatus | null,
            },
          }))}
          blank={() => ({
            name: "",
            issuer: "",
            issueDate: null,
            credentialLink: null,
            proofKey: null,
            status: null as VerificationStatus | null,
          })}
          canSave={(value) =>
            value.name.trim().length > 0 && value.issuer.trim().length > 0
          }
          titleOf={(value) => value.name}
          subtitleOf={(value) => value.issuer || null}
          statusOf={(value) => value.status}
          entity="certifications"
          toPayload={(value) => ({
            name: value.name.trim(),
            issuer: value.issuer.trim(),
            issueDate: value.issueDate,
            credentialLink: value.credentialLink?.trim() || null,
            proofKey: value.proofKey,
          })}
          renderFields={({ value, set, blur, id }) => (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  required
                  error={value.name.trim() ? undefined : "A name is required."}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={value.name}
                      tone={value.name.trim() ? "normal" : "invalid"}
                      onChange={(event) => set({ name: event.target.value })}
                      onBlur={blur}
                    />
                  )}
                </Field>

                <Field
                  label="Issuer"
                  required
                  error={
                    value.issuer.trim() ? undefined : "An issuer is required."
                  }
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={value.issuer}
                      tone={value.issuer.trim() ? "normal" : "invalid"}
                      onChange={(event) => set({ issuer: event.target.value })}
                      onBlur={blur}
                    />
                  )}
                </Field>
              </div>

              <DateField
                label="Issued"
                value={value.issueDate}
                onChange={(issueDate) => set({ issueDate })}
                onBlur={blur}
              />

              <Field label="Credential link" hint="Optional.">
                {(props) => (
                  <Input
                    {...props}
                    type="url"
                    value={value.credentialLink ?? ""}
                    onChange={(event) =>
                      set({ credentialLink: event.target.value })
                    }
                    onBlur={blur}
                  />
                )}
              </Field>

              <ProofField
                kind="certifications"
                entryId={id}
                proofKey={value.proofKey}
                onChange={(proofKey) => set({ proofKey })}
              />
            </>
          )}
        />

        <EntryCollection
          label="Links"
          singular="link"
          description="GitHub, LinkedIn and the rest. A recognised title gets its own icon on the CV."
          initial={profile.socials.map((row) => ({
            id: row.id,
            value: { title: row.title, url: row.url },
          }))}
          blank={() => ({ title: "", url: "" })}
          canSave={(value) =>
            value.title.trim().length > 0 && /^https?:\/\/.+/.test(value.url)
          }
          titleOf={(value) => value.title}
          subtitleOf={(value) => value.url || null}
          entity="socials"
          toPayload={(value) => ({
            title: value.title.trim(),
            url: value.url.trim(),
          })}
          renderFields={({ value, set, blur }) => (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Title"
                required
                error={value.title.trim() ? undefined : "A title is required."}
              >
                {(props) => (
                  <>
                    <Input
                      {...props}
                      list={SOCIAL_LIST}
                      value={value.title}
                      tone={value.title.trim() ? "normal" : "invalid"}
                      onChange={(event) => set({ title: event.target.value })}
                      onBlur={blur}
                    />
                    <datalist id={SOCIAL_LIST}>
                      {SOCIAL_TITLE_SUGGESTIONS.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>

              <Field
                label="URL"
                required
                error={
                  /^https?:\/\/.+/.test(value.url)
                    ? undefined
                    : "A full URL starting with http is required."
                }
              >
                {(props) => (
                  <Input
                    {...props}
                    type="url"
                    placeholder="https://github.com/you"
                    value={value.url}
                    tone={
                      /^https?:\/\/.+/.test(value.url) ? "normal" : "invalid"
                    }
                    onChange={(event) => set({ url: event.target.value })}
                    onBlur={blur}
                  />
                )}
              </Field>
            </div>
          )}
        />

        <EntryCollection
          label="Interests"
          singular="interest"
          initial={profile.interests.map((row) => ({
            id: row.id,
            value: { title: row.title },
          }))}
          blank={() => ({ title: "" })}
          canSave={(value) => value.title.trim().length > 0}
          titleOf={(value) => value.title}
          entity="interests"
          toPayload={(value) => ({
            title: value.title.trim(),
          })}
          renderFields={({ value, set, blur }) => (
            <Field
              label="Interest"
              required
              error={value.title.trim() ? undefined : "A title is required."}
            >
              {(props) => (
                <Input
                  {...props}
                  value={value.title}
                  tone={value.title.trim() ? "normal" : "invalid"}
                  onChange={(event) => set({ title: event.target.value })}
                  onBlur={blur}
                />
              )}
            </Field>
          )}
        />

        <CustomSections
          initial={profile.customSections.map((section) => ({
            id: section.id,
            name: section.name,
            entries: section.entries.map((entry) => ({
              id: entry.id,
              value: {
                title: entry.title,
                org: entry.org,
                date: entry.date,
                body: entry.body,
              },
            })),
          }))}
        />
      </div>
    </Page>
  );
}
