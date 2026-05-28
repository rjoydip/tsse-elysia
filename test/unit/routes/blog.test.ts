/**
 * Unit tests for src/lib/blog/data.ts
 * Tests: blogPosts array, getBlogPost, getFeaturedPost, getRecentPosts
 */

import { describe, expect, it } from "bun:test";
import {
  blogPosts,
  getBlogPost,
  getFeaturedPost,
  getRecentPosts,
} from "~/features/landing/data/blog/data";

describe("blogPosts", () => {
  it("should be a non-empty array", () => {
    expect(Array.isArray(blogPosts)).toBe(true);
    expect(blogPosts.length).toBeGreaterThan(0);
  });

  it("should have posts with all required fields", () => {
    for (const post of blogPosts) {
      expect(typeof post.id).toBe("string");
      expect(post.id.length).toBeGreaterThan(0);
      expect(typeof post.slug).toBe("string");
      expect(post.slug.length).toBeGreaterThan(0);
      expect(typeof post.title).toBe("string");
      expect(post.title.length).toBeGreaterThan(0);
      expect(typeof post.excerpt).toBe("string");
      expect(post.excerpt.length).toBeGreaterThan(0);
      expect(typeof post.content).toBe("string");
      expect(post.content.length).toBeGreaterThan(0);
      expect(typeof post.author.name).toBe("string");
      expect(post.author.name.length).toBeGreaterThan(0);
      expect(typeof post.author.avatar).toBe("string");
      expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof post.readTime).toBe("string");
      expect(Array.isArray(post.tags)).toBe(true);
      expect(post.tags.length).toBeGreaterThan(0);
    }
  });

  it("should have unique ids", () => {
    const ids = blogPosts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique slugs", () => {
    const slugs = blogPosts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("should have exactly one featured post", () => {
    const featured = blogPosts.filter((p) => p.featured);
    expect(featured).toHaveLength(1);
  });

  it("should have posts sorted by date descending", () => {
    for (let i = 1; i < blogPosts.length; i++) {
      expect(blogPosts[i - 1].publishedAt >= blogPosts[i].publishedAt).toBe(true);
    }
  });

  it("should have avatar URLs", () => {
    for (const post of blogPosts) {
      expect(post.author.avatar).toMatch(/^https?:\/\//);
    }
  });
});

describe("getBlogPost", () => {
  it("should return post for valid slug", () => {
    const post = getBlogPost("introducing-tsse-elysia");
    expect(post).toBeDefined();
    expect(post!.slug).toBe("introducing-tsse-elysia");
    expect(post!.title).toContain("TSS Elysia");
  });

  it("should return undefined for non-existent slug", () => {
    expect(getBlogPost("non-existent-slug")).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    expect(getBlogPost("")).toBeUndefined();
  });

  it("should be case-sensitive", () => {
    expect(getBlogPost("Introducing-tsse-elysia")).toBeUndefined();
  });

  it("should return the correct post for each slug", () => {
    for (const expected of blogPosts) {
      const actual = getBlogPost(expected.slug);
      expect(actual).toBeDefined();
      expect(actual!.id).toBe(expected.id);
    }
  });
});

describe("getFeaturedPost", () => {
  it("should return a post", () => {
    const featured = getFeaturedPost();
    expect(featured).toBeDefined();
  });

  it("should return the post marked as featured", () => {
    const featured = getFeaturedPost();
    expect(featured!.featured).toBe(true);
  });

  it("should return the first featured post", () => {
    const featured = getFeaturedPost();
    const firstFeatured = blogPosts.find((p) => p.featured);
    expect(featured!.id).toBe(firstFeatured!.id);
  });
});

describe("getRecentPosts", () => {
  it("should return 3 posts by default", () => {
    const recent = getRecentPosts();
    expect(recent).toHaveLength(3);
  });

  it("should return the first N posts", () => {
    const recent = getRecentPosts(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].id).toBe(blogPosts[0].id);
    expect(recent[1].id).toBe(blogPosts[1].id);
  });

  it("should return 1 post when count is 1", () => {
    const recent = getRecentPosts(1);
    expect(recent).toHaveLength(1);
    expect(recent[0].id).toBe(blogPosts[0].id);
  });

  it("should return all posts when count exceeds total", () => {
    const recent = getRecentPosts(100);
    expect(recent.length).toBe(blogPosts.length);
  });

  it("should return empty array when count is 0", () => {
    const recent = getRecentPosts(0);
    expect(recent).toHaveLength(0);
  });

  it("should not modify the original array", () => {
    const originalLength = blogPosts.length;
    getRecentPosts(2);
    expect(blogPosts.length).toBe(originalLength);
  });
});