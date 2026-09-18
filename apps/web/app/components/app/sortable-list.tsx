import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import type { ReactNode } from "react";
import { IconButton } from "~/components/ui/icon-button";
import { cn } from "~/lib/utils";

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn("flex flex-col gap-2", className)}
    >
      {items.map((item, index) => (
        <SortableRow
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          onMove={(to) => onReorder(moveItem(items, index, to))}
        >
          {renderItem(item, index)}
        </SortableRow>
      ))}
    </Reorder.Group>
  );
}

function SortableRow<T extends { id: string }>({
  item,
  index,
  total,
  onMove,
  children,
}: {
  item: T;
  index: number;
  total: number;
  onMove: (to: number) => void;
  children: ReactNode;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised px-2 py-1.5 shadow-xs"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        onPointerDown={(event) => controls.start(event)}
        className="inline-flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-ink-faint hover:text-ink active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1">{children}</div>

      <div className="flex shrink-0 flex-col">
        <IconButton
          label="Move up"
          size="sm"
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
          className="size-5"
        >
          <ChevronUp />
        </IconButton>
        <IconButton
          label="Move down"
          size="sm"
          disabled={index === total - 1}
          onClick={() => onMove(index + 1)}
          className="size-5"
        >
          <ChevronDown />
        </IconButton>
      </div>
    </Reorder.Item>
  );
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
