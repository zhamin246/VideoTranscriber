"use client";

import MDEditor from "@uiw/react-md-editor";
import "@/components/markdown/markdown.css";
import "./blog-article.css";
import { slugifyHeading } from "@/lib/blog/toc";
import { Children, type ReactNode } from "react";

function headingText(children: ReactNode): string {
  return Children.toArray(children)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : ""))
    .join("")
    .trim();
}

export default function BlogMarkdown({ content }: { content: string }) {
  return (
    <MDEditor.Markdown
      className="blog-article-content blog-markdown wmde-markdown-color"
      source={content}
      components={{
        a: ({ children, href, ...props }) => {
          const isInternal = href?.startsWith("/");
          if (isInternal) {
            return (
              <a href={href} {...props}>
                {children}
              </a>
            );
          }
          return (
            <a href={href} {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
        h2: ({ children, ...props }) => {
          const text = headingText(children);
          const id = slugifyHeading(text);
          return (
            <h2 {...props} id={id}>
              {children}
            </h2>
          );
        },
        h3: ({ children, ...props }) => {
          const text = headingText(children);
          const id = slugifyHeading(text);
          return (
            <h3 {...props} id={id}>
              {children}
            </h3>
          );
        },
      }}
    />
  );
}
