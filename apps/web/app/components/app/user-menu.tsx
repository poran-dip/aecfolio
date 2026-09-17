import type { User } from "@aecfolio/shared";
import { ChevronsUpDown, LogOut, UserCog } from "lucide-react";
import { Link } from "react-router";
import { UserAvatar } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { signOut } from "~/lib/auth-client";
import { accountPathFor, ROLE_LABELS } from "~/lib/nav";
import { cn } from "~/lib/utils";

type UserMenuProps = {
  user: User;
  collapsed?: boolean;
};

export function UserMenu({ user, collapsed = false }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex cursor-pointer items-center rounded-md text-left transition-colors hover:bg-surface-sunken",
            collapsed ? "size-9 justify-center" : "w-full gap-2.5 p-1.5",
          )}
        >
          <UserAvatar
            userId={user.id}
            name={user.name}
            hasImage={Boolean(user.image)}
            size="sm"
          />
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-ink">
                  {user.name}
                </span>
                <span className="truncate text-xs text-ink-faint">
                  {ROLE_LABELS[user.role]}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-ink-faint" />
            </>
          )}
          <span className="sr-only">Account menu</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">{user.name}</span>
          <span className="truncate text-xs text-ink-faint">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={accountPathFor(user.role)}>
            <UserCog />
            My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={() => void signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
