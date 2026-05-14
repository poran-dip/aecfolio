import { icon, IconDefinition } from "@fortawesome/fontawesome-svg-core";

export function iconSvg (i: IconDefinition) {
  return icon(i).html[0];
}
