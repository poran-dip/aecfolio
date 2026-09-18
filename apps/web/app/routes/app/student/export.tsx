import {
  Capability,
  type CvSectionPreference,
  type CvTemplateOptions,
} from "@aecfolio/shared";
import {
  type CvData,
  getTemplate,
  getTemplateManifest,
  listTemplateManifests,
  parseTemplateOptions,
  STANDARD_TEMPLATE_ID,
} from "@aecfolio/ui";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CvFrame } from "~/components/app/cv-frame";
import { Page } from "~/components/app/page";
import { SaveIndicator } from "~/components/app/save-indicator";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { ApiErrorWithDetails } from "~/lib/api";
import { api, unwrap } from "~/lib/api.server";
import { normalizeSections, reviveDates } from "~/lib/cv-arrange";
import { requireCapability } from "~/lib/guard";
import { studentApi } from "~/lib/student-api";
import { useAutosave } from "~/lib/use-autosave";
import type { Route } from "./+types/export";
import {
  OptionControls,
  SectionArranger,
  TemplatePicker,
} from "./export.panel";

export const handle = { title: "CV builder" };

export function meta(_: Route.MetaArgs) {
  return [{ title: "CV builder · AECFolio" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireCapability(request, Capability.CV_EXPORT_SELF);
  const client = api(request);

  const [data, preferences] = await Promise.all([
    unwrap(await client.api.cv.preview.$get()),
    unwrap(await client.api.cv.preferences.$get()),
  ]);

  return { data, preferences };
}

type Arrangement = {
  sections: CvSectionPreference[];
  options: CvTemplateOptions;
};

export default function ExportRoute({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const manifests = useMemo(() => listTemplateManifests(), []);

  const data = useMemo(
    () => reviveDates<CvData>(loaderData.data),
    [loaderData.data],
  );

  const saved = useMemo(
    () => new Map(loaderData.preferences.map((row) => [row.templateId, row])),
    [loaderData.preferences],
  );

  const [templateId, setTemplateId] = useState(() =>
    saved.has(STANDARD_TEMPLATE_ID)
      ? STANDARD_TEMPLATE_ID
      : (manifests[0]?.id ?? STANDARD_TEMPLATE_ID),
  );

  const [byTemplate, setByTemplate] = useState<Record<string, Arrangement>>({});
  const [exporting, setExporting] = useState(false);

  const manifest = getTemplateManifest(templateId);

  const current = useMemo<Arrangement>(() => {
    if (!manifest) return { sections: [], options: {} };
    const held = byTemplate[templateId];
    if (held) return held;

    const row = saved.get(templateId);
    return {
      sections: normalizeSections(
        manifest,
        data,
        row?.sections as CvSectionPreference[] | undefined,
      ),
      options: parseTemplateOptions(
        manifest,
        row?.options as CvTemplateOptions | undefined,
      ) as CvTemplateOptions,
    };
  }, [byTemplate, templateId, manifest, saved, data]);

  const auto = useAutosave<{ templateId: string } & Arrangement>({
    save: (next) =>
      studentApi.preferences({
        templateId: next.templateId,
        sections: next.sections,
        options: next.options,
      }) as Promise<void>,
  });

  function apply(change: Partial<Arrangement>) {
    const next = { ...current, ...change };
    setByTemplate((previous) => ({ ...previous, [templateId]: next }));
    auto.change({ templateId, ...next });
  }

  async function download() {
    setExporting(true);
    try {
      await auto.flush();
      const result = await studentApi.exportSelf({
        templateId,
        sections: current.sections,
        options: current.options,
      });
      toast.success(
        result.cached ? "That CV was already built." : "Your CV is ready.",
      );
      await navigate("/history");
    } catch (thrown) {
      toast.error(
        thrown instanceof ApiErrorWithDetails
          ? thrown.message
          : "That CV could not be built. Try again in a moment.",
      );
    } finally {
      setExporting(false);
    }
  }

  const template = getTemplate(templateId);

  return (
    <Page
      description="Arrange the CV on the left and watch it change on the right. Everything here is saved per template as you go."
      actions={
        <>
          <SaveIndicator
            status={auto.status}
            onRetry={() => void auto.retry()}
          />
          <Button disabled={exporting} onClick={() => void download()}>
            <Download />
            {exporting ? "Building…" : "Export PDF"}
          </Button>
        </>
      }
    >
      {!manifest || !template ? (
        <p className="rounded-xl border border-danger bg-danger-surface px-4 py-6 text-center text-sm text-danger-text">
          That template is no longer available. Pick another one.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <TemplatePicker
              manifests={manifests}
              templateId={templateId}
              onSelect={setTemplateId}
            />

            <SectionArranger
              manifest={manifest}
              data={data}
              sections={current.sections}
              onChange={(sections) => apply({ sections })}
            />

            <OptionControls
              controls={manifest.optionControls}
              options={current.options}
              onChange={(options) => apply({ options })}
            />
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 lg:sticky lg:top-20">
            <CvFrame>
              {template.render({
                data,
                sections: current.sections,
                options: current.options,
              })}
            </CvFrame>
          </div>
        </div>
      )}
    </Page>
  );
}
