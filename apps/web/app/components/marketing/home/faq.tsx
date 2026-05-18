import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

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

const FAQSection = () => {
  return (
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
          <div key={faq.question}>
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
  );
};

export default FAQSection;
