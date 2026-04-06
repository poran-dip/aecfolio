import { Button } from "@/components/ui/button";
import { handleSignIn, handleSignOut } from "@/lib/actions";

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
    <form action={handleSignOut}>
      <Button type="submit">Sign Out</Button>
    </form>
  );
}
