export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

const PX_PER_MM = 96 / 25.4;

export type PageMargins = { blockMm: number; inlineMm: number };

export type PageBox = {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
};

export function pageBox({ blockMm, inlineMm }: PageMargins): PageBox {
  const width = PAGE_WIDTH_MM * PX_PER_MM;
  const height = PAGE_HEIGHT_MM * PX_PER_MM;
  return {
    width,
    height,
    contentWidth: width - 2 * inlineMm * PX_PER_MM,
    contentHeight: Math.ceil(height - 2 * blockMm * PX_PER_MM),
  };
}
