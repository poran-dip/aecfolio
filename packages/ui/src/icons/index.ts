import type { SocialPlatformKey } from "@aecfolio/shared";
import { matchSocialPlatform } from "@aecfolio/shared";
import { Check } from "./check";
import { Codeforces } from "./codeforces";
import { Envelope } from "./envelope";
import { ExternalLink } from "./external-link";
import { Github } from "./github";
import { Globe } from "./globe";
import { Leetcode } from "./leetcode";
import { Link } from "./link";
import { Linkedin } from "./linkedin";
import { MapPin } from "./map-pin";
import { Phone } from "./phone";
import type { IconProps } from "./types";

export type { IconProps };
export {
  Check,
  Codeforces,
  Envelope,
  ExternalLink,
  Github,
  Globe,
  Leetcode,
  Link,
  Linkedin,
  MapPin,
  Phone,
};

export type IconComponent = (props: IconProps) => React.ReactElement;

const SOCIAL_ICONS: Record<SocialPlatformKey, IconComponent> = {
  linkedin: Linkedin,
  github: Github,
  leetcode: Leetcode,
  codeforces: Codeforces,
  portfolio: Globe,
  email: Envelope,
};

export function socialIcon(title: string): IconComponent {
  const key = matchSocialPlatform(title);
  return key ? SOCIAL_ICONS[key] : Link;
}
