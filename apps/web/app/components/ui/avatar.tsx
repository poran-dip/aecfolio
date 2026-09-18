import { Avatar as AvatarPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { usePublicApiUrl, userAvatarUrl } from "~/lib/public-env";
import { cn } from "~/lib/utils";

const sizes = {
  xs: "size-6 text-[0.625rem]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
} as const;

export type AvatarSize = keyof typeof sizes;

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AvatarProps = ComponentProps<typeof AvatarPrimitive.Root> & {
  src?: string;
  name: string;
  size?: AvatarSize;
};

export function Avatar({
  src,
  name,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-surface-sunken select-none",
        sizes[size],
        className,
      )}
      {...props}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="aspect-square size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        delayMs={src ? 300 : 0}
        className="flex size-full items-center justify-center font-medium text-ink-subtle"
      >
        {initialsOf(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/**
 * API redirects the image key to a presigned Garage URL.
 * Avoid `crossOrigin` — Garage doesn't expose CORS headers.
 */
export function UserAvatar({
  userId,
  name,
  hasImage = true,
  ...props
}: Omit<AvatarProps, "src"> & { userId: string; hasImage?: boolean }) {
  const apiUrl = usePublicApiUrl();

  return (
    <Avatar
      name={name}
      src={hasImage ? userAvatarUrl(apiUrl, userId) : undefined}
      {...props}
    />
  );
}
