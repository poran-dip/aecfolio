import { cvStylesheet, type PageMargins, pageBox } from "@aecfolio/ui";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_GAP = 16;
const COLUMN_GAP = 40;

const FONTS =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap";

const HOST_STYLES = `
  html { background: transparent; }
  body { margin: 0; }
  .cv-pages { display: flex; flex-direction: column; align-items: center; gap: ${PAGE_GAP}px; }
  .cv-leaf { position: relative; box-sizing: border-box; overflow: hidden; background: #fff; box-shadow: 0 1px 12px rgba(0,0,0,.12); }
  .cv-window { position: relative; overflow: hidden; }
  .cv-strip { position: absolute; top: 0; column-fill: auto; }
`;

export function CvFrame({
  children,
  margins,
}: {
  children: ReactNode;
  margins: PageMargins;
}) {
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
    root.className = "cv-pages";
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
      {mount &&
        createPortal(<Pages margins={margins}>{children}</Pages>, mount)}
    </div>
  );
}

function Pages({
  margins,
  children,
}: {
  margins: PageMargins;
  children: ReactNode;
}) {
  const box = pageBox(margins);
  const pitch = box.contentWidth + COLUMN_GAP;
  const [count, setCount] = useState(1);
  const probe = useRef<HTMLDivElement>(null);

  const measure = () => {
    const strip = probe.current;
    if (!strip) return;
    const columns = Math.round((strip.scrollWidth + COLUMN_GAP) / pitch);
    setCount(Math.max(1, columns));
  };

  useLayoutEffect(measure);

  useEffect(() => {
    const strip = probe.current;
    const fonts = strip?.ownerDocument.fonts;
    if (!strip || !fonts) return;

    fonts.addEventListener("loadingdone", measure);
    strip.addEventListener("load", measure, true);
    void fonts.ready.then(measure);
    return () => {
      fonts.removeEventListener("loadingdone", measure);
      strip.removeEventListener("load", measure, true);
    };
  });

  return (
    <>
      {Array.from({ length: count }, (_, page) => (
        <div
          key={page}
          className="cv-leaf"
          aria-hidden={page > 0 ? true : undefined}
          style={{
            width: box.width,
            height: box.height,
            padding: `${margins.blockMm}mm ${margins.inlineMm}mm`,
          }}
        >
          <div
            className="cv-window"
            style={{ width: box.contentWidth, height: box.contentHeight }}
          >
            <div
              ref={page === 0 ? probe : undefined}
              className="cv-strip"
              style={{
                left: -page * pitch,
                width: box.contentWidth,
                height: box.contentHeight,
                columnWidth: box.contentWidth,
                columnGap: COLUMN_GAP,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
