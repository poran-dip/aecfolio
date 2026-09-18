import { UploadPurpose } from "@aecfolio/shared";
import { ImageUp, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRevalidator } from "react-router";
import { UserAvatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { ApiErrorWithDetails, parseApi } from "~/lib/api";
import { apiBase } from "~/lib/config";
import { uploadFile } from "~/lib/upload";

async function attachImage(image: string | null) {
  const res = await fetch(`${apiBase}/api/me`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  await parseApi(res);
}

export function AvatarField({
  userId,
  name,
  hasImage,
}: {
  userId: string;
  name: string;
  hasImage: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const revalidator = useRevalidator();
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  async function run(work: () => Promise<void>, done: string) {
    setBusy(true);
    try {
      await work();
      setVersion((v) => v + 1);
      revalidator.revalidate();
      toast.success(done);
    } catch (error) {
      toast.error(
        error instanceof ApiErrorWithDetails
          ? error.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        key={version}
        userId={userId}
        name={name}
        hasImage={hasImage}
        size="xl"
      />

      <div className="flex flex-col items-start gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <ImageUp />
            {hasImage ? "Replace" : "Upload"}
          </Button>
          {hasImage && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => run(() => attachImage(null), "Photo removed")}
            >
              <Trash2 />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-ink-subtle">
          JPEG, PNG or WebP, up to 2 MB.
        </p>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          void run(async () => {
            const key = await uploadFile(file, UploadPurpose.AVATAR);
            await attachImage(key);
          }, "Photo updated");
        }}
      />
    </div>
  );
}
