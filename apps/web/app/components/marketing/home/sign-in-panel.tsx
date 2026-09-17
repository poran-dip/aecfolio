import { ArrowRight, CircleAlert } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { COLLEGE_EMAIL_DOMAIN } from "~/lib/links";
import { SignInButton } from "../sign-in-button";

const SIGN_IN_ERRORS: Record<string, { title: string; body: string }> = {
  account_not_provisioned: {
    title: "This Google account is not registered",
    body: `AECFolio accounts are created by the college. Sign in with your @${COLLEGE_EMAIL_DOMAIN} account, or contact your department if you should have access.`,
  },
};

const FALLBACK_ERROR = {
  title: "Sign-in could not be completed",
  body: "Something went wrong while signing you in. Please try again.",
};

export function SignInError({ code }: { code: string }) {
  const message = SIGN_IN_ERRORS[code] ?? FALLBACK_ERROR;
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl gap-3 rounded-lg border border-danger-line bg-danger-surface p-3.5"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger-text" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-danger-text">
          {message.title}
        </p>
        <p className="text-sm text-ink">{message.body}</p>
      </div>
    </div>
  );
}

export function SignInPanel({ userName }: { userName: string | null }) {
  if (userName) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-ink-muted">
          Signed in as <span className="font-medium text-ink">{userName}</span>
        </p>
        <Button asChild>
          <Link to="/dashboard">
            Go to dashboard
            <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <SignInButton withIcon label="Continue with Google" />
      <p className="text-sm text-ink-subtle">
        Use your @{COLLEGE_EMAIL_DOMAIN} Google account.
      </p>
    </div>
  );
}
