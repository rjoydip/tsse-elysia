/**
 * LLMO Blog service.
 * Handles blog data fetching and schema.org transformation.
 */

import { blogPosts, getBlogPost } from "~/features/landing/data/blog/data";
import { API_PREFIX } from "~/config";

export interface BlogPostResponse {
  "@context": "https://schema.org";
  "@type": "Article" | "ItemList";
  headline?: string;
  description?: string;
  datePublished?: string;
  author?: { "@type": "Person"; name: string };
  numberOfItems?: number;
  itemListElement?: Array<{
    "@type": "ListItem";
    position: number;
    url: string;
    name: string;
    description?: string;
  }>;
}

export interface BlogQuery {
  slug?: string | null;
  limit?: string | null;
}

export async function getBlogData(query: BlogQuery): Promise<BlogPostResponse> {
  const { slug, limit } = query;
  const limitNum = parseInt(limit || "10", 10);

  if (slug) {
    const post = getBlogPost(slug);
    if (!post) {
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Not Found",
      };
    }

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      author: { "@type": "Person", name: post.author.name },
    };
  }

  const posts = blogPosts.slice(0, limitNum);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${API_PREFIX}/blog/${post.slug}`,
      name: post.title,
      description: post.excerpt,
    })),
  };
}