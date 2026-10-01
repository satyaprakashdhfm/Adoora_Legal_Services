"use client";

import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Documentation pages are Markdown (with tables). Pictures are stored by the
 * API and written as `docimg:<id>`; everything else is ordinary Markdown,
 * rendered without raw HTML.
 */

/** The anchor a heading gets, from its plain text. Shared with the sidebar. */
export function headingId(text: string) {
  return (
    "h-" +
    text
      .toLowerCase()
      .replace(/[*_`[\]()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

/** The ## and ### headings of a chapter, in order, for its contents list. */
export function headingsOf(body: string) {
  const headings: { level: 2 | 3; text: string; id: string }[] = [];
  let fenced = false;
  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    if (fenced) continue;
    const match = /^(##|###)\s+(.+?)\s*#*$/.exec(line);
    if (match) {
      const text = match[2].replace(/\*\*|__|`/g, "");
      headings.push({ level: match[1].length as 2 | 3, text, id: headingId(text) });
    }
  }
  return headings;
}

export const docImageUrl = (id: string) => `/api/admin/docs/images/${encodeURIComponent(id)}?area=admin`;

function textOf(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : ""))
    .join("");
}

const components: Components = {
  h1: ({ children }) => <h2 className="mt-10 font-serif text-2xl font-semibold tracking-tight text-ink">{children}</h2>,
  h2: ({ children }) => (
    <h2 id={headingId(textOf(children))} className="mt-10 scroll-mt-6 border-b border-line pb-2 font-serif text-[1.45rem] font-semibold tracking-tight text-ink first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={headingId(textOf(children))} className="mt-7 scroll-mt-6 font-serif text-lg font-semibold text-ink">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="mt-3 leading-relaxed text-ink-soft">{children}</p>,
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-relaxed text-ink-soft marker:text-gold">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-6 leading-relaxed text-ink-soft marker:font-semibold marker:text-gold-deep">{children}</ol>,
  li: ({ children }) => <li className="pl-1 [&>ul]:mt-1.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} className="font-semibold text-gold-deep underline underline-offset-2" {...(href?.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-4 rounded-r-lg border-l-4 border-gold bg-gold/[0.07] px-4 py-1 text-sm italic [&_p]:text-ink-soft">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-paper-tint px-1.5 py-0.5 font-mono text-[0.85em] text-ink">{children}</code>,
  hr: () => <hr className="my-8 border-line" />,
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-line bg-ink px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-3 py-2 align-top text-ink-soft">{children}</td>,
  img: ({ src, alt }) => {
    const url = typeof src === "string" ? src : "";
    const resolved = url.startsWith("docimg:") ? docImageUrl(url.slice("docimg:".length)) : url;
    return (
      <span className="mt-5 block text-center">
        {/* Served by the API to signed-in console users only. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolved} alt={alt ?? ""} loading="lazy" className="mx-auto max-h-[46rem] w-auto max-w-full rounded-lg border border-line shadow-sm" />
        {alt && <span className="mt-2 block text-xs italic text-slate">{alt}</span>}
      </span>
    );
  },
};

/** `docimg:` is the documentation's own picture scheme; every other URL goes through the safe default. */
const urlTransform = (url: string) => (url.startsWith("docimg:") ? url : defaultUrlTransform(url));

export function DocMarkdown({ body }: { body: string }) {
  return (
    <div className="text-[0.975rem]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={urlTransform}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
