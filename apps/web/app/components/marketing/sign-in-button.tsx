import { useState } from "react";
import { GoogleIcon } from "~/components/brand/google-icon";
import { Button, type ButtonProps } from "~/components/ui/button";
import { signInWithGoogle } from "~/lib/auth-client";

type SignInButtonProps = Omit<ButtonProps, "onClick" | "children"> & {
  label?: string;
  withIcon?: boolean;
};

export function SignInButton({
  label = "Sign in",
  withIcon = false,
  disabled,
  ...props
}: SignInButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await signInWithGoogle();
    } catch {
      setPending(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || pending}
      aria-busy={pending}
      {...props}
    >
      {withIcon && (
        <span className="grid size-5 place-items-center rounded-full bg-white">
          <GoogleIcon className="size-3.5" />
        </span>
      )}
      {pending ? "Redirecting…" : label}
    </Button>
  );
}
