import type { components } from "../generated/api-types.js";

export function transformCategory(category: components["schemas"]["Category"]) {
  return {
    full_name: category.full_name,
    count: category.count,
    has_child: category.has_child || false,
  };
}

export function transformCategoryList(
  categoryList: components["schemas"]["CategoryList"],
) {
  return {
    current_category: categoryList.current_category,
    categories: categoryList.categories?.map(transformCategory) || [],
    parent_categories: categoryList.parent_categories?.map(
      (parentCategory) => ({
        current_category: parentCategory.current_category,
        categories: parentCategory.categories?.map(transformCategory) || [],
      }),
    ),
    readme: categoryList.readme,
    no_category: categoryList.no_category
      ? transformCategory(categoryList.no_category)
      : undefined,
    descendant_posts: categoryList.descendant_posts,
    posts: categoryList.posts,
    total_count: categoryList.total_count,
    per_page: categoryList.per_page,
    page: categoryList.page,
    prev_page: categoryList.prev_page,
    next_page: categoryList.next_page,
    max_per_page: categoryList.max_per_page,
  };
}
