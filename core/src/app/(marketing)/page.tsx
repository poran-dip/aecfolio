import { Download, FileText, LogIn, Mail, UserPlus } from "lucide-react";
import Link from "next/link";
import { SignIn } from "@/components/auth-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";

const steps = [
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Get your college email",
    description:
      "You'll need an active @aec.ac.in email address. Only accounts on the college domain are permitted to access AECFolio.",
  },
  {
    icon: <UserPlus className="w-5 h-5" />,
    title: "Wait for your account to be created",
    description:
      "Your department faculty advisor will create your AECFolio account. You'll receive an email notification once it's ready — no action needed on your end.",
  },
  {
    icon: <LogIn className="w-5 h-5" />,
    title: "Sign in with Google",
    description:
      "Once your account is set up, sign in using your @aec.ac.in email via Google. No passwords to remember.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Build your profile",
    description:
      "Fill in your academic history, projects, skills, and internship experience. Your CGPA and academic records will be verified and locked by your faculty advisor.",
  },
  {
    icon: <Download className="w-5 h-5" />,
    title: "Download your CV in one click",
    description:
      "Pick the sections you want to include, select your experiences and projects, choose a format, and download a clean, department-branded PDF resume.",
  },
];

const faqs = [
  {
    question: "How do I get my college email?",
    answer:
      "Your @aec.ac.in email is typically issued during your first year of enrollment. If you missed it or haven't received one yet, don't worry — you can still obtain it later through the college. Reach out to your department office for assistance.",
  },
  {
    question: "How do I sign up for AECFolio?",
    answer:
      "You don't sign up yourself — your department faculty advisor creates your account for you. Once it's ready, you'll receive an email notification and can sign in immediately using your @aec.ac.in email via Google.",
  },
  {
    question: "What if I want to add something to my CV that isn't supported?",
    answer:
      "We're always looking to make AECFolio more complete. If there's a section or field you feel is missing, please contact us and let us know — we genuinely welcome suggestions from students.",
  },
];

const Home = async () => {
  const session = await auth();

  return (
    <div className="flex flex-col">
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
              <Link href="/dashboard" className="w-full">
                <Button className="cursor-pointer w-full">Dashboard</Button>
              </Link>
            ) : (
              <SignIn />
            )}

            <Link href="#how-it-works">
              <Button variant="link" className="cursor-pointer">
                Learn more
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section
        id="how-it-works"
        className="py-24 px-4 flex flex-col items-center gap-12 bg-background/60 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge>How it works</Badge>
          <p className="text-sm text-foreground max-w-md">
            Getting started with AECFolio is straightforward. Here's everything
            you need to know.
          </p>
        </div>

        <div className="flex flex-col w-full max-w-md gap-0">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              {/* Left: number + connector line */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-px flex-1 bg-border my-2" />
                )}
              </div>

              {/* Right: content */}
              <Card className="bg-background/40 backdrop-blur-sm border-border mb-6 flex-1">
                <CardContent className="px-3 py-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-foreground">
                    {step.icon}
                    <p className="text-sm font-semibold">{step.title}</p>
                  </div>
                  <p className="text-sm text-foreground/70">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Closing note */}
          <p className="text-sm text-center text-foreground/70 italic">
            All the best for your internships and placements!
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="py-24 px-4 flex flex-col items-center gap-12 bg-background/30"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge>FAQs</Badge>
          <p className="text-sm text-foreground max-w-md">
            Some common questions, answered.
          </p>
        </div>

        <div className="flex flex-col w-full max-w-md gap-0">
          {faqs.map((faq, index) => (
            <div key={index}>
              <div className="py-5 flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {faq.question}
                </p>
                <p className="text-sm text-foreground/70">{faq.answer}</p>
              </div>
              {index < faqs.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <p className="text-sm text-foreground/70 text-center">
          Still have questions? Reach out to your{" "}
          <span className="text-foreground font-medium">faculty advisor</span>.
        </p>
      </section>
    </div>
  );
};

export default Home;
