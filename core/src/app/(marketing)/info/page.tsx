import { ExternalLink, Mail, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const originalAuthors = [
  {
    name: "Poran Dip Boruah",
    role: "Author",
    url: "https://github.com/poran-dip",
  },
  {
    name: "Ankur Jyoti Das",
    role: "Author",
    url: "https://github.com/Ankurjtydas",
  },
  {
    name: "Jhaiklong Basumatary",
    role: "Author",
    url: "https://github.com/jhaiklong123",
  },
];

const currentMaintainers = [
  {
    name: "Poran Dip Boruah",
    role: "Current Maintainer & Point of Contact",
    email: "porandip4@gmail.com",
  },
];

export default function InfoPage() {
  return (
    <div className="min-h-screen pt-16">
      {/* Story */}
      <section className="py-16 px-4 flex flex-col items-center gap-6 bg-background/30 backdrop-blur-sm">
        <div className="w-full max-w-lg flex flex-col gap-4">
          <Badge className="w-fit">About AECFolio</Badge>
          <h1 className="text-2xl font-bold tracking-wide">
            Built at AEC, for AEC.
          </h1>
          <div className="flex flex-col gap-3 text-sm text-foreground/70 leading-relaxed">
            <p>
              AECFolio started as a mini project for the 6th semester CSE
              curriculum at Assam Engineering College. The goal was
              straightforward: build a centralized system where students could
              maintain verified academic records and generate placement-ready
              CVs without the chaos of outdated spreadsheets and manually
              formatted resumes.
            </p>
            <p>
              But we built it with the hope that it wouldn't stop there.
              AECFolio is designed to be a system the college can genuinely
              adopt and use long-term — one that grows with each batch, with
              maintainers passing the baton forward while the platform continues
              to serve students and faculty.
            </p>
            <p>
              If you're a student or faculty member and have feedback or found a
              bug, we'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Contributors */}
      <section className="py-16 px-4 flex flex-col items-center gap-6 bg-background/60">
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
                href={author.url}
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
              href="https://github.com/poran-dip/aec-profiles/graphs/contributors"
              target="_blank"
              rel="noreferrer noopener"
            >
              <ExternalLink className="w-4 h-4" />
              View all contributors on GitHub
            </Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* Get in Touch */}
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
                    <Link href={`mailto:${maintainer.email}`}>
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
    </div>
  );
}
