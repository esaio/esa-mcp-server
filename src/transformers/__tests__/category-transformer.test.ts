import { describe, expect, it } from "vitest";
import {
  transformCategory,
  transformCategoryList,
} from "../category-transformer.js";

describe("transformCategory", () => {
  it("should transform category with all properties", () => {
    const category = {
      name: "api",
      full_name: "dev/docs/api",
      count: 15,
      has_child: true,
      selected: true,
    };

    const result = transformCategory(category);

    expect(result).toEqual({
      full_name: "dev/docs/api",
      count: 15,
      has_child: true,
    });
  });

  it("should transform category with minimal properties", () => {
    const category = {
      name: "simple",
      count: 5,
    };

    const result = transformCategory(category);

    expect(result).toEqual({
      full_name: undefined,
      count: 5,
      has_child: false,
    });
  });
});

describe("transformCategoryList", () => {
  it("should transform category list with all properties", () => {
    const categoryList = {
      current_category: "dev/docs",
      categories: [
        {
          name: "api",
          full_name: "dev/docs/api",
          count: 10,
          has_child: true,
        },
        {
          name: "guides",
          full_name: "dev/docs/guides",
          count: 5,
          has_child: false,
        },
      ],
      parent_categories: [
        {
          current_category: "dev",
          categories: [
            {
              name: "docs",
              full_name: "dev/docs",
              count: 15,
              has_child: true,
            },
          ],
        },
      ],
      no_category: {
        name: "no_category",
        count: 3,
      },
      descendant_posts: true,
      total_count: 2,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    };

    const result = transformCategoryList(categoryList);

    expect(result).toEqual({
      current_category: "dev/docs",
      categories: [
        {
          full_name: "dev/docs/api",
          count: 10,
          has_child: true,
        },
        {
          full_name: "dev/docs/guides",
          count: 5,
          has_child: false,
        },
      ],
      parent_categories: [
        {
          current_category: "dev",
          categories: [
            {
              full_name: "dev/docs",
              count: 15,
              has_child: true,
            },
          ],
        },
      ],
      readme: undefined,
      no_category: {
        full_name: undefined,
        count: 3,
        has_child: false,
      },
      descendant_posts: true,
      posts: undefined,
      total_count: 2,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    });
  });

  it("should transform category list with minimal properties", () => {
    const categoryList = {
      current_category: "",
      categories: [],
      total_count: 0,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    };

    const result = transformCategoryList(categoryList);

    expect(result).toEqual({
      current_category: "",
      categories: [],
      parent_categories: undefined,
      readme: undefined,
      no_category: undefined,
      descendant_posts: undefined,
      posts: undefined,
      total_count: 0,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    });
  });
});
