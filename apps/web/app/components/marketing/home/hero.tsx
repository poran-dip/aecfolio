import { Link, useRouteLoaderData } from "react-router";
import { SignIn } from "~/components/auth-components";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { loader } from "~/routes/marketing/route";

const HeroSection = () => {
  const data = useRouteLoaderData<typeof loader>("routes/marketing/route");
  const session = data?.session;

  return (
    <section
      id="hero"
      className="relative h-screen pt-16 flex flex-col items-center justify-center gap-6 p-4 bg-background/30"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-wide">AECFolio</h1>
        <p className="text-sm text-foreground/70 max-w-xl">
          The student information and portfolio system for Assam Engineering
          College — streamlining academic records and placement-ready CVs.
        </p>
      </div>

      <Card className="bg-background/70 backdrop-blur-sm border-border w-full max-w-md">
        <CardContent className="px-4 sm:py-2 flex flex-col items-center gap-4">
          <p className="text-foreground/70 text-center">
            Welcome back! Log in with your{" "}
            <span className="text-foreground font-medium">@aec.ac.in</span>{" "}
            email.
          </p>

          {session ? (
            <Link to="/dashboard" className="w-full">
              <Button className="cursor-pointer w-full">Dashboard</Button>
            </Link>
          ) : (
            <SignIn />
          )}

          <Link to="#how-it-works">
            <Button variant="link" className="cursor-pointer">
              Learn more
            </Button>
          </Link>
        </CardContent>
      </Card>
    </section>
  );
};

export default HeroSection;
