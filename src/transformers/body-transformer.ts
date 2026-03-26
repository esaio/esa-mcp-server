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
