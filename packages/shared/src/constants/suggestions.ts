export const EXPERIENCE_TYPE_SUGGESTIONS = [
  "Internship",
  "Volunteer",
  "Club",
  "Freelance",
  "Other",
] as const;

export const SOCIAL_PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", match: ["linkedin"] },
  { key: "github", label: "GitHub", match: ["github"] },
  { key: "leetcode", label: "LeetCode", match: ["leetcode"] },
  { key: "codeforces", label: "Codeforces", match: ["codeforces"] },
  { key: "portfolio", label: "Portfolio", match: ["portfolio", "website"] },
  { key: "email", label: "Email", match: ["email", "mail"] },
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

export const SOCIAL_TITLE_SUGGESTIONS = SOCIAL_PLATFORMS.map((p) => p.label);

export function matchSocialPlatform(title: string): SocialPlatformKey | null {
  const needle = title.trim().toLowerCase();
  if (!needle) return null;
  for (const platform of SOCIAL_PLATFORMS) {
    if (platform.match.some((m) => needle.includes(m))) return platform.key;
  }
  return null;
}
