import { env } from "../env.js";
import { logger } from "../logger.js";
import { HttpError } from "../lib/http.js";

/**
 * Article cover images from Gemini, made only when someone clicks for one.
 *
 * Two steps, so no image is paid for blind: the text model reads the article
 * and writes an image prompt (a fraction of a cent), the editor can adjust it,
 * and only then does the image model draw it (about $0.034 on the default
 * model). The prompt rules keep covers on brand and within the Bar Council's
 * limits: no text, no real or identifiable people, no emblems or logos.
 */

/** Price per million image-output tokens, from ai.google.dev/gemini-api/docs/pricing (Sept 2026). */
const IMAGE_USD_PER_MTOK: Record<string, number> = {
  "gemini-3.1-flash-lite-image": 30,
  "gemini-3.1-flash-image": 60,
  "gemini-3-pro-image": 120,
};
/** Tokens a 1K 16:9 image comes back as — what the estimate is based on. */
const TOKENS_PER_IMAGE = 1120;

export const imageModel = () => env.GEMINI_IMAGE_MODEL;

function usdPerMTok(model: string) {
  return IMAGE_USD_PER_MTOK[model] ?? IMAGE_USD_PER_MTOK["gemini-3.1-flash-image"]!;
}

/** What one cover is expected to cost, before anyone clicks. */
export function imageEstimate() {
  const model = imageModel();
  return {
    configured: Boolean(env.GEMINI_API_KEY),
    model,
    estimateUsd: Math.round(TOKENS_PER_IMAGE * usdPerMTok(model)) / 1_000_000,
  };
}

const PROMPT_SYSTEM = `You write prompts for an image model that makes the cover picture of an article on the website of ADOORA Legal Services, a law firm in Hyderabad, India.

The cover must:
- be a calm, editorial, photographic still life or place — the kind of picture a serious newspaper would run — that says what the article is about through objects and setting (e.g. files and a ledger for a tax dispute, a construction site at dusk for a real-estate case, a factory floor for a labour matter, a bank's vault door for banking law);
- feel Indian where the subject is Indian (an Indian office, street, court corridor, document style), without clichés;
- use a restrained palette of deep navy, warm gold/brass, walnut and soft daylight; 16:9 landscape; shallow depth of field;
- contain NO text of any kind: no words, letters, numbers, labels, signs, captions, file names or case numbers anywhere, including on files, books, screens and papers;
- contain NO identifiable people: no faces, no judges, no lawyers in gowns, no politicians or public figures; hands or distant blurred figures at most;
- contain NO logos, brand names, national emblems, flags, the Ashoka lion, court crests or real building names;
- avoid gavels (Indian courts do not use them), Lady Justice statues and scales of justice unless nothing else fits;
- never show anything graphic, violent or distressing, even if the article is about a crime.

Answer with the prompt only: one paragraph of 60–110 words, describing the scene, the light and the camera, ending with "No text, no people's faces, no logos."`;

type Reply = {
  candidates?: { content?: { parts?: { text?: string; inlineData?: { mimeType?: string; data?: string } }[] }; finishReason?: string }[];
  usageMetadata?: { candidatesTokenCount?: number; candidatesTokensDetails?: { modality?: string; tokenCount?: number }[] };
  error?: { message?: string };
};

async function callGemini(model: string, body: unknown, timeoutMs: number) {
  if (!env.GEMINI_API_KEY) throw new HttpError(503, "Image generation is not set up — add GEMINI_API_KEY on Railway.", "gemini_unconfigured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    logger.error({ err: error, model }, "Gemini unreachable");
    throw new HttpError(504, "The AI service did not respond. Please try again.", "gemini_unreachable");
  }
  const reply = (await response.json().catch(() => null)) as Reply | null;
  if (!response.ok || !reply) {
    logger.error({ status: response.status, model, error: reply?.error?.message?.slice(0, 200) }, "Gemini refused the request");
    throw new HttpError(502, response.status === 404 ? `The AI model "${model}" was not accepted.` : "The AI service could not do that. Please try again.", "gemini_failed");
  }
  return reply;
}

export type ArticleForPrompt = {
  title: string;
  summary?: string;
  category?: string;
  practices?: string[];
  headings?: string[];
  excerpt?: string;
};

/** The text model reads the article and writes the image prompt. */
export async function suggestCoverPrompt(article: ArticleForPrompt) {
  const brief = [
    `Title: ${article.title}`,
    article.category && `Category: ${article.category}`,
    article.practices?.length && `Practice areas: ${article.practices.join(", ")}`,
    article.summary && `Summary: ${article.summary}`,
    article.headings?.length && `Section headings: ${article.headings.join(" | ")}`,
    article.excerpt && `Opening: ${article.excerpt.slice(0, 1500)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const reply = await callGemini(
    env.GEMINI_MODEL,
    {
      systemInstruction: { parts: [{ text: PROMPT_SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: brief }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    },
    60_000,
  );
  const prompt = reply.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!prompt) throw new HttpError(502, "The AI did not suggest a prompt. Please try again, or write one yourself.", "gemini_empty");
  return prompt.replace(/^["“]|["”]$/g, "");
}

/** The image model draws the prompt. Returns the picture and what it cost. */
export async function generateCoverImage(prompt: string) {
  const model = imageModel();
  const reply = await callGemini(
    model,
    {
      contents: [{ role: "user", parts: [{ text: `${prompt}\n\nStrictly no text, letters or numbers anywhere in the image.` }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
    },
    120_000,
  );
  const part = reply.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) {
    logger.warn({ model, finishReason: reply.candidates?.[0]?.finishReason }, "Gemini returned no image");
    throw new HttpError(502, "No image came back — the model may have declined this prompt. Try rewording it.", "gemini_no_image");
  }
  const tokens =
    reply.usageMetadata?.candidatesTokensDetails?.find((d) => d.modality === "IMAGE")?.tokenCount ??
    reply.usageMetadata?.candidatesTokenCount ??
    TOKENS_PER_IMAGE;
  return {
    data: Buffer.from(part.inlineData.data, "base64"),
    mimeType: part.inlineData.mimeType ?? "image/jpeg",
    model,
    costUsd: Math.round(tokens * usdPerMTok(model)) / 1_000_000,
  };
}
