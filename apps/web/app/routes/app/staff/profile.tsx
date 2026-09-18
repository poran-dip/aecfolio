import { BRANCH_LABELS } from "@aecfolio/shared";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { Form, useNavigation } from "react-router";
import { AvatarField } from "~/components/app/avatar-field";
import { Page } from "~/components/app/page";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { toast } from "~/components/ui/toast";
import { api, attempt, unwrap } from "~/lib/api.server";
import { requireStaff } from "~/lib/guard";
import { ROLE_LABELS } from "~/lib/nav";
import type { Route } from "./+types/profile";

export const handle = { title: "My account" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "My account · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireStaff(request);
  const client = api(request);
  const me = await unwrap(await client.api.me.$get());

  return { me };
}

export async function action({ request }: Route.ActionArgs) {
  await requireStaff(request);
  const form = await request.formData();

  const name = String(form.get("name") ?? "").trim();
  if (!name) {
    return {
      ok: false as const,
      message: "A name is required",
      code: "VALIDATION",
    };
  }

  const phone = String(form.get("phone") ?? "").trim();
  const client = api(request);

  return attempt(async () =>
    unwrap(
      await client.api.me.$patch({ json: { name, phone: phone || null } }),
    ),
  );
}

export default function ProfileRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { me } = loaderData;
  const navigation = useNavigation();
  const saving = navigation.state === "submitting";

  useEffect(() => {
    if (!actionData) return;
    if (actionData.ok) toast.success("Account updated");
    else toast.error(actionData.message);
  }, [actionData]);

  const faculty = me.faculty;

  return (
    <Page
      description="Your name, photo and phone number. Everything else about your staff record is set by an administrator."
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
            <CardDescription>
              Shown beside your name across the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarField
              userId={me.id}
              name={me.name}
              hasImage={Boolean(me.image)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              Your email address comes from your college account and cannot be
              changed here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="flex flex-col gap-4">
              <Field label="Name" required>
                {(props) => (
                  <Input
                    {...props}
                    name="name"
                    defaultValue={me.name}
                    required
                    autoComplete="name"
                  />
                )}
              </Field>

              <Field label="Phone" hint="Optional.">
                {(props) => (
                  <Input
                    {...props}
                    name="phone"
                    type="tel"
                    defaultValue={me.phone ?? ""}
                    autoComplete="tel"
                  />
                )}
              </Field>

              <Field label="Email">
                {(props) => (
                  <Input {...props} value={me.email} readOnly disabled />
                )}
              </Field>

              <div>
                <Button type="submit" disabled={saving}>
                  <Save />
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff record</CardTitle>
            <CardDescription>
              Set by an administrator. Ask one to correct anything here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              <Detail label="Role">{ROLE_LABELS[me.role]}</Detail>
              <Detail label="Employee ID">{faculty?.employeeId ?? "—"}</Detail>
              <Detail label="Designation">{faculty?.designation ?? "—"}</Detail>
              <Detail label="Department">
                {faculty?.department ? BRANCH_LABELS[faculty.department] : "—"}
              </Detail>
            </dl>
            {!faculty && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-ink-muted">
                  Your account has no staff record attached. An administrator
                  needs to create one before you appear under Faculty.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}
