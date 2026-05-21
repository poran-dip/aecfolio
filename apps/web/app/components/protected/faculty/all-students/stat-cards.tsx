import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

interface StatsCardsProps {
  pendingOverall: number;
  pendingUsers: number;
}

export function StatsCards({ pendingOverall, pendingUsers }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="relative p-4">
        {pendingOverall > 0 && (
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        )}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">
              Pending Verifications
            </p>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{pendingOverall}</p>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/faculty/verify">Review & Verify</Link>
          </Button>
        </div>
      </Card>

      <Card className="relative p-4">
        {pendingUsers > 0 && (
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">
              Pending User Approvals
            </p>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{pendingUsers}</p>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/faculty/users">Review & Approve</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
