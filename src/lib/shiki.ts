/**
 * Shared Shiki highlighter instance.
 * Uses selective theme/language imports to avoid bundling the full 9MB theme set.
 * Cached for reuse across components.
 */

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

async function createHighlighter() {
  const { createHighlighterCore } = await import("@shikijs/core");
  const { createJavaScriptRegexEngine } = await import(
    "@shikijs/engine-javascript"
  );

  const [githubLight, githubDark] = await Promise.all([
    import("@shikijs/themes/github-light"),
    import("@shikijs/themes/github-dark"),
  ]);

  const [ts, js, json, tsx, css, html, md, yaml] = await Promise.all([
    import("@shikijs/langs/typescript"),
    import("@shikijs/langs/javascript"),
    import("@shikijs/langs/json"),
    import("@shikijs/langs/tsx"),
    import("@shikijs/langs/css"),
    import("@shikijs/langs/html"),
    import("@shikijs/langs/markdown"),
    import("@shikijs/langs/yaml"),
  ]);

  return await createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [ts, js, json, tsx, css, html, md, yaml],
    engine: createJavaScriptRegexEngine(),
  });
}

/**
 * Returns a cached Shiki highlighter instance.
 * Lazy-loads on first call, then reuses for subsequent calls.
 */
export function getShikiHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter();
  }
  return highlighterPromise;
}
