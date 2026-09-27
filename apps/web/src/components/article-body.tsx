/* eslint-disable @next/next/no-img-element -- article images come from the
   API (uploaded in the console), sized by the writer; the plain element keeps
   them out of the image optimiser, which cannot reach the private API. */
import type { Block } from "@/content/insights";
import { anchorFor } from "@/lib/anchor";

/**
 * Renders an article body. Used by the public article page and by the
 * console editor's preview, so what the writer previews is what is published.
 * Wrap it in `.prose-adoora` for the article typography.
 */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={index} id={anchorFor(block.text)} style={{ scrollMarginTop: "var(--header-h, 4.5rem)" }}>
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} className="mb-2 mt-7 font-serif text-lg font-semibold tracking-tight text-ink">
                {block.text}
              </h3>
            );
          case "p":
            return <p key={index}>{block.text}</p>;
          case "ul":
            return (
              <ul key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={index} className="my-8 border-l-2 border-gold pl-6 font-serif text-xl leading-relaxed text-ink">
                {block.text}
              </blockquote>
            );
          case "image":
            return (
              <figure key={index} className="my-8">
                <img src={block.src} alt={block.alt} loading="lazy" className="w-full rounded-lg border border-line" />
                {block.caption && <figcaption className="mt-2 text-center text-sm text-slate">{block.caption}</figcaption>}
              </figure>
            );
        }
      })}
    </>
  );
}
