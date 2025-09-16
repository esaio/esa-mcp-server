export interface PostNameParts {
  name?: string;
  category?: string;
}

export function normalizePostName(
  name?: string,
  category?: string,
): PostNameParts {
  if (!name) {
    return { name, category };
  }

  if (category !== undefined) {
    return { name, category };
  }

  if (name.includes("/")) {
    const parts = name.split("/");
    const extractedName = parts.pop();
    const extractedCategory = parts.join("/");

    return {
      name: extractedName || undefined,
      category: extractedCategory,
    };
  }

  return { name, category };
}
