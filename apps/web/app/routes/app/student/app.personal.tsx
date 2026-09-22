import { useState } from "react";
import { AvatarField } from "~/components/app/avatar-field";
import { SaveIndicator } from "~/components/app/save-indicator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { MarkdownEditor } from "~/components/ui/markdown-editor";
import { TagInput } from "~/components/ui/tag-input";
import { studentApi } from "~/lib/student-api";
import { useAutosave } from "~/lib/use-autosave";

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
};

export function AccountSection({ account }: { account: Account }) {
  const [value, setValue] = useState({
    name: account.name,
    phone: account.phone ?? "",
  });

  const auto = useAutosave<typeof value>({
    canSave: (next) => next.name.trim().length > 0,
    initial: value,
    save: (next) =>
      studentApi.me({
        name: next.name.trim(),
        phone: next.phone.trim() || null,
      }) as Promise<void>,
  });

  function set(patch: Partial<typeof value>) {
    const next = { ...value, ...patch };
    setValue(next);
    auto.change(next);
  }

  const nameMissing = value.name.trim().length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>You</CardTitle>
          <SaveIndicator
            status={auto.status}
            onRetry={() => void auto.retry()}
          />
        </div>
        <CardDescription>
          This is the header of every CV you export. Your college account sets
          your email; the rest is yours to correct.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <AvatarField
          userId={account.id}
          name={account.name}
          hasImage={Boolean(account.image)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            required
            error={nameMissing ? "A name is required." : undefined}
          >
            {(props) => (
              <Input
                {...props}
                value={value.name}
                tone={nameMissing ? "invalid" : "normal"}
                onChange={(event) => set({ name: event.target.value })}
                onBlur={() => void auto.flush()}
              />
            )}
          </Field>

          <Field label="Phone" hint="Printed on the CV when set.">
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={value.phone}
                onChange={(event) => set({ phone: event.target.value })}
                onBlur={() => void auto.flush()}
              />
            )}
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

type Profile = {
  bio: string | null;
  titleSought: string | null;
  location: string | null;
  skills: string[];
  spokenLanguages: string[];
  dob: string | null;
  gender: string | null;
  caste: string | null;
  religion: string | null;
  motherName: string | null;
  motherContact: string | null;
  fatherName: string | null;
  fatherContact: string | null;
};

export function ProfileSection({ profile }: { profile: Profile }) {
  const [value, setValue] = useState(profile);

  const auto = useAutosave<Profile>({
    initial: value,
    save: (next) =>
      studentApi.profile({
        bio: next.bio?.trim() || null,
        titleSought: next.titleSought?.trim() || null,
        location: next.location?.trim() || null,
        skills: next.skills,
        spokenLanguages: next.spokenLanguages,
        dob: next.dob?.trim() || null,
        gender: next.gender?.trim() || null,
        caste: next.caste?.trim() || null,
        religion: next.religion?.trim() || null,
        motherName: next.motherName?.trim() || null,
        motherContact: next.motherContact?.trim() || null,
        fatherName: next.fatherName?.trim() || null,
        fatherContact: next.fatherContact?.trim() || null,
      }) as Promise<void>,
  });

  function set(patch: Partial<Profile>) {
    const next = { ...value, ...patch };
    setValue(next);
    auto.change(next);
  }

  const blur = () => void auto.flush();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Profile</CardTitle>
          <SaveIndicator
            status={auto.status}
            onRetry={() => void auto.retry()}
          />
        </div>
        <CardDescription>
          Your summary, skills and the details some application forms ask for.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title sought" hint="For example, Backend Engineer.">
            {(props) => (
              <Input
                {...props}
                value={value.titleSought ?? ""}
                onChange={(event) => set({ titleSought: event.target.value })}
                onBlur={blur}
              />
            )}
          </Field>

          <Field label="Location">
            {(props) => (
              <Input
                {...props}
                value={value.location ?? ""}
                placeholder="Guwahati, Assam"
                onChange={(event) => set({ location: event.target.value })}
                onBlur={blur}
              />
            )}
          </Field>
        </div>

        <Field label="Summary" hint="A few lines at the top of the CV.">
          {(props) => (
            <MarkdownEditor
              {...props}
              value={value.bio ?? ""}
              rows={4}
              placeholder="Final-year computer science student interested in distributed systems…"
              onChange={(bio) => set({ bio })}
              onBlur={blur}
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Skills">
            {(props) => (
              <TagInput
                {...props}
                value={value.skills}
                onChange={(skills) => set({ skills })}
                onBlur={blur}
                placeholder="TypeScript, Postgres…"
              />
            )}
          </Field>

          <Field label="Languages spoken">
            {(props) => (
              <TagInput
                {...props}
                value={value.spokenLanguages}
                onChange={(spokenLanguages) => set({ spokenLanguages })}
                onBlur={blur}
                placeholder="Assamese, English…"
              />
            )}
          </Field>
        </div>

        <details className="rounded-lg border border-line bg-surface px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-ink">
            Details for government and PSU forms
          </summary>

          <p className="mt-2 text-xs text-ink-subtle">
            None of this prints on the CV templates available today. It is kept
            for the biodata format some applications require.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                ["dob", "Date of birth", "12 Aug 2003"],
                ["gender", "Gender", ""],
                ["caste", "Caste", ""],
                ["religion", "Religion", ""],
                ["motherName", "Mother's name", ""],
                ["motherContact", "Mother's contact", ""],
                ["fatherName", "Father's name", ""],
                ["fatherContact", "Father's contact", ""],
              ] as const
            ).map(([key, label, placeholder]) => (
              <Field key={key} label={label}>
                {(props) => (
                  <Input
                    {...props}
                    value={value[key] ?? ""}
                    placeholder={placeholder || undefined}
                    onChange={(event) => set({ [key]: event.target.value })}
                    onBlur={blur}
                  />
                )}
              </Field>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
