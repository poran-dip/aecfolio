import { ExternalLink, Users } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

const originalAuthors = [
  {
    name: "Poran Dip Boruah",
    role: "Lead Developer",
    url: "https://github.com/poran-dip",
  },
  {
    name: "Ankur Jyoti Das",
    role: "Developer",
    url: "https://github.com/Ankurjtydas",
  },
  {
    name: "Jhaiklong Basumatary",
    role: "Ideation",
    url: "https://github.com/jhaiklong123",
  },
];

export default function ContributorsSection() {
  return (
    <section
      id="contributors"
      className="py-16 px-4 flex flex-col items-center gap-6 bg-background/60"
    >
      <div className="w-full max-w-lg flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-foreground/70" />
          <p className="text-xs font-bold tracking-widest text-foreground/70 uppercase">
            Credits
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {originalAuthors.map((author) => (
            <Link
              key={author.name}
              to={author.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Card className="bg-background/40 backdrop-blur-sm border-border hover:bg-background/60 transition-colors cursor-pointer">
                <CardContent className="px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-medium">{author.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      CSE '27
                    </Badge>
                    <ExternalLink className="w-3.5 h-3.5 text-foreground/70" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Button
          variant="secondary"
          className="w-fit cursor-pointer gap-2"
          asChild
        >
          <Link
            to="https://github.com/poran-dip/aecfolio/graphs/contributors"
            target="_blank"
            rel="noreferrer noopener"
          >
            <ExternalLink className="w-4 h-4" />
            View all contributors on GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
