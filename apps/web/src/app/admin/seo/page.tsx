"use client";

import { useEffect, useState } from "react";
import { api, type ArticleRow } from "@/lib/portal/api";
import { SeoPanel } from "@/components/portal/seo-panel";
import { ErrorNote, PageTitle } from "@/components/portal/ui";

/** The SEO panel on its own page. The console reaches it as Articles → SEO & Google. */
export default function SeoAnalytics() {
  const [rows, setRows] = useState<ArticleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: ArticleRow[] }>("/admin/articles")
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, []);

  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Website" title="SEO & Analytics" description="How each published article is doing in Google, and the searches the firm's articles target." />
      <ErrorNote>{error}</ErrorNote>
      <SeoPanel rows={rows} />
    </div>
  );
}
