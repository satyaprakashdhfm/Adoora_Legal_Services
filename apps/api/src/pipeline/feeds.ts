import { logger } from "../logger.js";

/**
 * The legal-news feeds the trending reader watches. Only headlines, links
 * and dates are read — never the articles' text. What the firm publishes is
 * written from the judgment itself.
 */

export type FeedItem = {
  outlet: string;
  title: string;
  url: string;
  publishedAt: Date;
};

type Feed = { name: string; url: string; outletFromItem?: boolean };

const googleNews = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:2d`)}&hl=en-IN&gl=IN&ceid=IN:en`;

export const FEEDS: Feed[] = [
  { name: "LiveLaw", url: "https://www.livelaw.in/google_feeds.xml" },
  { name: "Bar & Bench", url: "https://www.barandbench.com/feed" },
  { name: "Verdictum", url: "https://www.verdictum.in/feed" },
  // Google News groups many outlets; each item names its own.
  { name: "Google News", url: googleNews('"Supreme Court" judgment'), outletFromItem: true },
  { name: "Google News", url: googleNews('"High Court" judgment'), outletFromItem: true },
  {
    name: "Google News",
    url: googleNews('"Telangana High Court" OR "Andhra Pradesh High Court" OR "Karnataka High Court" OR "Madras High Court"'),
    outletFromItem: true,
  },
  { name: "Google News", url: googleNews('"Delhi High Court" OR "Bombay High Court"'), outletFromItem: true },
];

const decode = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#822[01];/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/\s+/g, " ")
    .trim();

const tag = (block: string, name: string) => block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))?.[1];

async function readFeed(feed: Feed): Promise<FeedItem[]> {
  try {
    const response = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ADOORA Legal Services news reader)", Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      logger.warn({ feed: feed.name, status: response.status }, "Feed unavailable");
      return [];
    }
    const xml = await response.text();
    const items: FeedItem[] = [];
    for (const [block] of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
      let title = decode(tag(block, "title") ?? "");
      const url = decode(tag(block, "link") ?? "");
      const when = new Date(decode(tag(block, "pubDate") ?? tag(block, "dc:date") ?? ""));
      let outlet = feed.name;
      if (feed.outletFromItem) {
        outlet = decode(tag(block, "source") ?? "") || title.split(" - ").pop() || feed.name;
        // Google News appends " - Outlet" to every headline.
        title = title.replace(new RegExp(`\\s+-\\s+${outlet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");
      }
      if (!title || !url) continue;
      items.push({ outlet: outlet.slice(0, 80), title: title.slice(0, 300), url: url.slice(0, 1000), publishedAt: Number.isNaN(+when) ? new Date() : when });
    }
    return items;
  } catch (error) {
    logger.warn({ feed: feed.name, err: error }, "Feed could not be read");
    return [];
  }
}

export async function readAllFeeds(): Promise<FeedItem[]> {
  const results = await Promise.all(FEEDS.map(readFeed));
  return results.flat();
}
