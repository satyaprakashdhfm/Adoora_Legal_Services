"use client";

import { use, useCallback, useEffect, useState } from "react";
import { api, type ArticleDetail } from "@/lib/portal/api";
import { ArticleEditor } from "@/components/portal/article-editor";
import { ErrorNote, Spinner } from "@/components/portal/ui";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Bumped when the status changes, so the editor restarts from the saved copy. */
  const [version, setVersion] = useState(0);

  const load = useCallback(() => {
    api<ArticleDetail>(`/admin/articles/${id}`)
      .then((result) => {
        setArticle(result);
        setVersion((v) => v + 1);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [id]);

  useEffect(load, [load]);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!article) return <Spinner />;
  return <ArticleEditor key={version} article={article} onReload={load} />;
}
