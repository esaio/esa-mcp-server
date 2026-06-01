export interface BodyTransformOptions {
  truncateBody?: number;
  omitBody?: boolean;
}

export function processBodyMd(
  bodyMd: string | undefined,
  options: BodyTransformOptions,
): string | undefined {
  if (options.omitBody) {
    return undefined;
  }
  if (options.truncateBody && bodyMd && bodyMd.length > options.truncateBody) {
    return `${bodyMd.slice(0, options.truncateBody)}\n\n... (truncated)`;
  }
  return bodyMd;
}

export interface BodyMdStats {
  /**
   * Number of characters, counted by grapheme cluster ("user-perceived
   * characters") so emoji sequences (skin tones, flags, ZWJ families) and
   * combining marks each count as one.
   */
  characters: number;
  /** Number of lines (newline-separated segments). */
  lines: number;
}

// Grapheme segmentation is locale-independent, so leave the locale unset.
// Reused across calls to avoid paying the construction cost per post.
const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

/**
 * Compute `wc`-like metadata for the full body_md, regardless of whether the
 * returned body is truncated. Lets the agent gauge the document size and how
 * much was cut off after truncation.
 */
export function computeBodyMdStats(
  bodyMd: string | undefined,
): BodyMdStats | undefined {
  if (bodyMd === undefined || bodyMd === null) {
    return undefined;
  }
  let characters = 0;
  for (const _ of graphemeSegmenter.segment(bodyMd)) {
    characters++;
  }
  // Newlines need no grapheme segmentation, so count them with a cheap scan.
  let lines = bodyMd.length === 0 ? 0 : 1;
  for (let i = 0; i < bodyMd.length; i++) {
    if (bodyMd.charCodeAt(i) === 10) {
      lines++;
    }
  }
  return { characters, lines };
}
