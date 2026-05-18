import { Mail } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

const currentMaintainers = [
  {
    name: "Poran Dip Boruah",
    role: "Current Maintainer & Point of Contact",
    email: "porandip4@gmail.com",
  },
];

export default function GetInTouchSection() {
  return (
    <section
      id="get-in-touch"
      className="py-16 px-4 flex flex-col items-center gap-6 bg-background/30 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-foreground/70" />
          <p className="text-xs font-bold tracking-widest text-foreground/70 uppercase">
            Get in Touch
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {currentMaintainers.map((maintainer) => (
            <Card
              key={maintainer.name}
              className="bg-background/40 backdrop-blur-sm border-border"
            >
              <CardContent className="px-4 py-1 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">{maintainer.name}</p>
                  <p className="text-xs text-foreground/70">
                    {maintainer.role}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer text-xs gap-1.5"
                  asChild
                >
                  <Link to={`mailto:${maintainer.email}`}>
                    <Mail className="w-3.5 h-3.5" />
                    {maintainer.email}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-foreground/70">
          For academic or account-related issues, your department faculty
          advisor is your first stop.
        </p>
      </div>
    </section>
  );
}
