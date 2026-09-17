import { Link } from "react-router";
import { Logo } from "~/components/brand/logo";
import { Button } from "~/components/ui/button";
import { SignInButton } from "./sign-in-button";

export function Navbar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
        <Logo />
        {signedIn ? (
          <Button asChild size="sm">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <SignInButton size="sm" />
        )}
      </div>
    </header>
  );
}
