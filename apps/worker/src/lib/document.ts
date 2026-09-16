import { cvStylesheet } from "@aecfolio/ui";
import { fontFaceCss } from "./fonts";

export function shellDocument(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${fontFaceCss()}</style><style>${cvStylesheet}</style></head><body style="margin:0"></body></html>`;
}
