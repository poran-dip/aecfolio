import { Link, useRouteLoaderData } from "react-router";
import { SignIn } from "~/components/auth-components";
import { Button } from "~/components/ui/button";
import type { loader } from "~/routes/marketing/route";

const HeroSection = () => {
  const data = useRouteLoaderData<typeof loader>("routes/marketing/route");
  const session = data?.session;

  return (
    <section
      id="hero"
      className="relative min-h-screen pt-16 bg-background/30 flex flex-col items-center justify-center gap-10 px-4"
    >
      {/* Main content */}
      <div className="flex flex-col items-center gap-5 text-center max-w-2xl">
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Your academic
            <br />
            portfolio, <span className="text-primary">verified.</span>
          </h1>
          <p className="text-foreground max-w-md">
            The student information and placement system for Assam Engineering
            College — where your records are locked, trusted, and ready to
            share.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <div className="w-full rounded-xl bg-background/50 backdrop-blur-md border border-border/60 px-5 py-4 flex flex-col gap-3 shadow-sm">
            <p className="text-sm text-foreground text-center leading-snug">
              Sign in with your{" "}
              <span className="font-semibold text-foreground">@aec.ac.in</span>{" "}
              Google account to continue.
            </p>
            {session ? (
              <Link to="/dashboard" className="w-full">
                <Button className="cursor-pointer w-full">
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <SignIn />
            )}
          </div>

          <Link to="#how-it-works">
            <Button
              variant="link"
              className="cursor-pointer text-foreground hover:text-foreground text-sm"
            >
              How does it work? ↓
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
