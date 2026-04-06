"use client";

import { Badge } from "./ui/Badge";

export default function PendingApprovalScreen() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <Badge variant="warning">Awaiting approval</Badge>

        <h1 className="text-2xl font-bold tracking-wide text-foreground">
          Pending account approval
        </h1>

        <p className="text-foreground/70">
          Your account has been created successfully, but it needs to be
          approved by a faculty member before you can access the dashboard.
        </p>

        <p className="text-foreground/70">
          This usually doesn't take long. You can check back later or contact a
          faculty member if it's urgent.
        </p>
      </div>
    </div>
  );
}
