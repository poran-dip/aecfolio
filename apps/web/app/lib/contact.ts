export const MAINTAINER_CONTACT = "aGVsbG9AcG9yYW4uZGV2";

export function decodeContact(encoded: string) {
  return atob(encoded);
}
