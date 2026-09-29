"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/portal/api";
import { Button, ErrorNote, Textarea } from "@/components/portal/ui";

/**
 * Draw a cover with Gemini — never automatically. Step one writes a prompt
 * from the article (a fraction of a cent) for the editor to read and adjust;
 * step two, on its own click, draws it and states what it cost. The picture
 * lands with the article's images and becomes the cover in the editor; it is
 * kept on Save like an uploaded one.
 */

type Generator = { configured: boolean; model: string; estimateUsd: number };

export type CoverBrief = {
  title: string;
  summary?: string;
  category?: string;
  practices?: string[];
  headings?: string[];
  excerpt?: string;
};

const usd = (value: number) => `$${value < 0.1 ? value.toFixed(3) : value.toFixed(2)}`;
/** A rough rupee figure for the button; the dollar amount is what Google bills. */
const inr = (value: number) => `≈ ₹${Math.max(1, Math.round(value * 88))}`;

export function CoverGenerator({ articleId, brief, onCreated }: { articleId: string; brief: () => CoverBrief; onCreated: (imageId: string) => void }) {
  const [generator, setGenerator] = useState<Generator | null>(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<"prompt" | "image" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [spent, setSpent] = useState<{ count: number; usd: number }>({ count: 0, usd: 0 });

  useEffect(() => {
    api<Generator>("/admin/articles/cover-generator")
      .then(setGenerator)
      .catch(() => setGenerator(null));
  }, []);

  if (!generator) return null;
  if (!generator.configured) {
    return <p className="text-xs text-slate">Image generation is off: add GEMINI_API_KEY on Railway to turn it on.</p>;
  }

  async function suggest() {
    setBusy("prompt");
    setError(null);
    try {
      const result = await api<{ prompt: string }>(`/admin/articles/${articleId}/cover-prompt`, { method: "POST", body: brief() });
      setPrompt(result.prompt);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function generate() {
    setBusy("image");
    setError(null);
    try {
      const result = await api<{ id: string; costUsd: number }>(`/admin/articles/${articleId}/cover-generate`, { method: "POST", body: { prompt } });
      setSpent((current) => ({ count: current.count + 1, usd: current.usd + result.costUsd }));
      onCreated(result.id);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-gold/40 bg-gold/5 p-3">
      <p className="text-xs font-semibold text-ink">Generate with AI</p>
      <p className="mt-0.5 text-xs text-slate">
        Nothing is made until you click. Each picture costs about {usd(generator.estimateUsd)} ({inr(generator.estimateUsd)}) on Gemini ({generator.model}).
      </p>
      <Button size="sm" tone="secondary" className="mt-2" onClick={() => void suggest()} disabled={busy !== null || brief().title.trim().length < 3}>
        {busy === "prompt" ? "Reading the article…" : prompt ? "Suggest another prompt" : "1. Suggest a prompt from the article"}
      </Button>
      {prompt && (
        <>
          <Textarea
            className="mt-2 text-xs"
            rows={6}
            maxLength={3000}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            aria-label="Image prompt"
          />
          <p className="mt-1 text-[0.7rem] text-slate">Edit freely. Keep “no text, no faces, no logos” so it stays within the Bar Council’s rules.</p>
          <Button size="sm" className="mt-2" onClick={() => void generate()} disabled={busy !== null || prompt.trim().length < 20}>
            {busy === "image" ? "Drawing… (about 10 seconds)" : `2. Generate image · ${usd(generator.estimateUsd)}`}
          </Button>
        </>
      )}
      {spent.count > 0 && (
        <p className="mt-2 text-xs text-emerald-800">
          {spent.count} image{spent.count === 1 ? "" : "s"} made this session · {usd(spent.usd)} ({inr(spent.usd)}). The newest is set as the cover; Save to keep it.
        </p>
      )}
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}
