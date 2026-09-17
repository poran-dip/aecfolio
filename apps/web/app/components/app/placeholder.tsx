import { Construction } from "lucide-react";
import { EmptyState } from "~/components/ui/empty-state";
import { Page } from "./page";

export function Placeholder({ name }: { name: string }) {
  return (
    <Page>
      <EmptyState
        icon={Construction}
        title={`${name} is not built yet`}
        description="The route, its nav entry and its capability gate are wired up. The screen itself lands in a later slice."
      />
    </Page>
  );
}
