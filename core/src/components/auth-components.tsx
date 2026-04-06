import { Button } from "@/components/ui/button";
import { handleSignIn } from "@/lib/actions";
import { signOut } from "@/lib/auth";

interface SignInProps {
  extended?: boolean;
}

export function SignIn({ extended = false }: SignInProps) {
  return (
    <form action={handleSignIn}>
      <Button type="submit" className="cursor-pointer">
        Sign In {extended && "to AECFolio"}
      </Button>
    </form>
  );
}

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <Button type="submit">Sign Out</Button>
    </form>
  );
}
