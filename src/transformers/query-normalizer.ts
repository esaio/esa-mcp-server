export function normalizeSearchQuery(query: string): string {
  let normalized = query;

  // Convert wildcard "*" to empty string (for "all posts" queries)
  if (normalized === "*") {
    normalized = "";
  }

  // Convert common date syntax patterns from other services to esa format
  // GitHub/Gmail style: after:YYYY-MM-DD -> created:>YYYY-MM-DD
  normalized = normalized.replace(
    /\bafter:(\d{4}-\d{2}-\d{2})\b/gi,
    "created:>$1",
  );

  // GitHub/Gmail style: before:YYYY-MM-DD -> created:<YYYY-MM-DD
  normalized = normalized.replace(
    /\bbefore:(\d{4}-\d{2}-\d{2})\b/gi,
    "created:<$1",
  );

  // Alternative patterns that might be used
  // since:YYYY-MM-DD -> created:>YYYY-MM-DD
  normalized = normalized.replace(
    /\bsince:(\d{4}-\d{2}-\d{2})\b/gi,
    "created:>$1",
  );

  // until:YYYY-MM-DD -> created:<YYYY-MM-DD
  normalized = normalized.replace(
    /\buntil:(\d{4}-\d{2}-\d{2})\b/gi,
    "created:<$1",
  );

  return normalized;
}
