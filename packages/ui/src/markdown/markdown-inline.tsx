import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const INLINE_ELEMENTS = ["em", "strong", "del", "code", "a", "br"];

export type MarkdownInlineProps = {
  children: string | null | undefined;
  className?: string;
};

export function MarkdownInline({ children, className }: MarkdownInlineProps) {
  if (!children?.trim()) return null;

  return (
    <span
      className={className ? `cv-prose-inline ${className}` : "cv-prose-inline"}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={INLINE_ELEMENTS}
        unwrapDisallowed
      >
        {children}
      </ReactMarkdown>
    </span>
  );
}
