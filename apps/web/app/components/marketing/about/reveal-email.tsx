import { Envelope } from "@aecfolio/ui/icons";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { decodeContact } from "~/lib/contact";

export function RevealEmail({ encoded }: { encoded: string }) {
  const [address, setAddress] = useState<string | null>(null);

  if (!address) {
    return (
      <Button
        variant="secondary"
        onClick={() => setAddress(decodeContact(encoded))}
      >
        <Envelope />
        Show email
      </Button>
    );
  }

  return (
    <Button asChild variant="secondary">
      <a href={`mailto:${address}`}>
        <Envelope />
        {address}
      </a>
    </Button>
  );
}
