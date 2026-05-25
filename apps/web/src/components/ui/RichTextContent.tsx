"use client";
import { cn } from "@/lib/utils";

interface Props {
  html: string;
  className?: string;
}

const ALLOWED_TAGS = ["p","b","i","u","strong","em","ul","ol","li","a","h2","h3","h4","br","hr","blockquote","s"];
const ALLOWED_ATTRS: Record<string, string[]> = { a: ["href", "target", "rel"] };

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]+>/g, " ");
  // Use DOMParser for safe sanitization
  const doc = new DOMParser().parseFromString(html, "text/html");
  function clean(node: Element) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        if (!ALLOWED_TAGS.includes(tag)) {
          el.replaceWith(...Array.from(el.childNodes));
          continue;
        }
        // Remove disallowed attributes
        for (const attr of Array.from(el.attributes)) {
          const allowed = ALLOWED_ATTRS[tag] ?? [];
          if (!allowed.includes(attr.name)) el.removeAttribute(attr.name);
        }
        // Force safe link attributes
        if (tag === "a") {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        }
        clean(el);
      }
    }
  }
  clean(doc.body);
  return doc.body.innerHTML;
}

export function RichTextContent({ html, className }: Props) {
  const clean = sanitizeHtml(html ?? "");
  return (
    <div
      className={cn("rte-content text-sm text-foreground/80 leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
