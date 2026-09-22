import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { withParams } from "~/lib/query";
import { cn } from "~/lib/utils";

export function useFilterNavigation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  return {
    params,
    set(changes: Record<string, string | number | boolean | null | undefined>) {
      navigate(withParams(params, changes), { replace: true });
    },
  };
}

export function SearchField({
  paramKey = "q",
  placeholder = "Search",
  className,
}: {
  paramKey?: string;
  placeholder?: string;
  className?: string;
}) {
  const { params, set } = useFilterNavigation();
  const current = params.get(paramKey) ?? "";

  return (
    <SearchFieldInput
      key={current}
      initialValue={current}
      placeholder={placeholder}
      className={className}
      onSubmit={(value) => set({ [paramKey]: value.trim() || null })}
    />
  );
}

function SearchFieldInput({
  initialValue,
  placeholder,
  className,
  onSubmit,
}: {
  initialValue: string;
  placeholder: string;
  className?: string;
  onSubmit: (value: string) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(initialValue);

  return (
    <form
      className={cn("relative flex-1 sm:max-w-xs", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-faint" />
      <Input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        className="pl-8"
      />
    </form>
  );
}

export function FilterBar({
  children,
  onClear,
  activeCount = 0,
  className,
}: {
  children: ReactNode;
  onClear?: () => void;
  activeCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2 sm:gap-3",
        className,
      )}
    >
      {children}
      {activeCount > 0 && onClear && (
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X />
          Clear {activeCount === 1 ? "filter" : `${activeCount} filters`}
        </Button>
      )}
    </div>
  );
}
