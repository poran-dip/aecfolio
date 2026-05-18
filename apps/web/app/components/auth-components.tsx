import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

interface SignInProps {
  extended?: boolean;
}

export function SignIn({ extended = false }: SignInProps) {
  return (
    <Button
      onClick={() =>
        authClient.signIn.social({
          provider: "google",
          callbackURL: "/dashboard",
        })
      }
      className="cursor-pointer"
    >
      Sign In {extended && "to AECFolio"}
    </Button>
  );
}

export function SignOut() {
  return (
    <Button
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/";
            },
          },
        });
      }}
    >
      Sign Out
    </Button>
  );
}
