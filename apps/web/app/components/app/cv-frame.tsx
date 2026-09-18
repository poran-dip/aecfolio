import { cvStylesheet } from "@aecfolio/ui";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

const FONTS =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap";

const HOST_STYLES = `
  html { background: transparent; }
  body { margin: 0; }
  .cv-sheet .cv-page { box-shadow: 0 1px 12px rgba(0,0,0,.12); }
`;

export function CvFrame({ children }: { children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(PAGE_HEIGHT);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(
      `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
        `<link rel="stylesheet" href="${FONTS}">` +
        `</head><body></body></html>`,
    );
    doc.close();

    const sheet = doc.createElement("style");
    sheet.textContent = `${cvStylesheet}\n${HOST_STYLES}`;
    doc.head.append(sheet);

    const root = doc.createElement("div");
    root.className = "cv-sheet";
    doc.body.append(root);
    setMount(root);

    const observer = new ResizeObserver(() => {
      setHeight(root.getBoundingClientRect().height || PAGE_HEIGHT);
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
      setMount(null);
    };
  }, []);

  useEffect(() => {
    const node = wrapper.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / PAGE_WIDTH));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="w-full">
      <div style={{ height: height * scale }} className="overflow-hidden">
        <iframe
          ref={frame}
          title="CV preview"
          tabIndex={-1}
          scrolling="no"
          style={{
            width: PAGE_WIDTH,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="border-0"
        />
      </div>
      {mount && createPortal(children, mount)}
    </div>
  );
}
