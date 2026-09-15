import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DISALLOWED = ["img"];

export type MarkdownProps = {
  children: string | null | undefined;
  className?: string;
};

export function Markdown({ children, className }: MarkdownProps) {
  if (!children?.trim()) return null;

  return (
    <div className={className ? `cv-prose ${className}` : "cv-prose"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={DISALLOWED}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
