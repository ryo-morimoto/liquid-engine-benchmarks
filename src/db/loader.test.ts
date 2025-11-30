/**
 * Data Loader Unit Tests
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DataLoader, loadData } from "./loader";
import { SCALE_LIMITS } from "./schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../../.generated/benchmark.db");

describe("SCALE_LIMITS", () => {
  test("defines all scales", () => {
    expect(SCALE_LIMITS).toHaveProperty("small");
    expect(SCALE_LIMITS).toHaveProperty("medium");
    expect(SCALE_LIMITS).toHaveProperty("large");
    expect(SCALE_LIMITS).toHaveProperty("2xl");
  });

  test("small has correct limits", () => {
    expect(SCALE_LIMITS.small).toEqual({
      products: 10,
      collections: 3,
      cartItems: 3,
      posts: 3,
    });
  });

  test("scales increase in size", () => {
    expect(SCALE_LIMITS.small.products).toBeLessThan(SCALE_LIMITS.medium.products);
    expect(SCALE_LIMITS.medium.products).toBeLessThan(SCALE_LIMITS.large.products);
    expect(SCALE_LIMITS.large.products).toBeLessThan(SCALE_LIMITS["2xl"].products);
  });
});

describe("DataLoader", () => {
  let loader: DataLoader;

  beforeAll(() => {
    loader = new DataLoader(DB_PATH);
  });

  afterAll(() => {
    loader.close();
  });

  describe("load with small scale", () => {
    test("returns correct product count", () => {
      const data = loader.load("small");
      expect(data.products.length).toBe(SCALE_LIMITS.small.products);
    });

    test("returns correct collection count", () => {
      const data = loader.load("small");
      expect(data.collections.length).toBe(SCALE_LIMITS.small.collections);
    });

    test("returns correct cart_items count", () => {
      const data = loader.load("small");
      expect(data.cart_items.length).toBe(SCALE_LIMITS.small.cartItems);
    });

    test("returns correct posts count", () => {
      const data = loader.load("small");
      expect(data.posts.length).toBe(SCALE_LIMITS.small.posts);
    });

    test("returns a user", () => {
      const data = loader.load("small");
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(1);
    });
  });

  describe("load with medium scale", () => {
    test("returns correct product count", () => {
      const data = loader.load("medium");
      expect(data.products.length).toBe(SCALE_LIMITS.medium.products);
    });
  });

  describe("product structure", () => {
    test("has required fields", () => {
      const data = loader.load("small");
      const product = data.products[0];

      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("title");
      expect(product).toHaveProperty("price");
      expect(product).toHaveProperty("description");
      expect(product).toHaveProperty("variants");
      expect(product).toHaveProperty("images");
    });

    test("has variants", () => {
      const data = loader.load("small");
      const product = data.products[0];
      expect(product).toBeDefined();

      expect(Array.isArray(product?.variants)).toBe(true);
      expect(product?.variants.length).toBeGreaterThan(0);
    });

    test("variant has required fields", () => {
      const data = loader.load("small");
      const product = data.products[0];
      expect(product).toBeDefined();
      const variant = product?.variants[0];
      expect(variant).toBeDefined();

      expect(variant).toHaveProperty("id");
      expect(variant).toHaveProperty("title");
      expect(variant).toHaveProperty("price");
      expect(variant).toHaveProperty("available");
      expect(typeof variant?.available).toBe("boolean");
    });

    test("has images", () => {
      const data = loader.load("small");
      const product = data.products[0];
      expect(product).toBeDefined();

      expect(Array.isArray(product?.images)).toBe(true);
      expect(product?.images.length).toBeGreaterThan(0);
    });

    test("image has required fields", () => {
      const data = loader.load("small");
      const product = data.products[0];
      expect(product).toBeDefined();
      const image = product?.images[0];
      expect(image).toBeDefined();

      expect(image).toHaveProperty("id");
      expect(image).toHaveProperty("src");
      expect(image).toHaveProperty("alt");
    });
  });

  describe("collection structure", () => {
    test("has required fields", () => {
      const data = loader.load("small");
      const collection = data.collections[0];

      expect(collection).toHaveProperty("id");
      expect(collection).toHaveProperty("title");
      expect(collection).toHaveProperty("description");
      expect(collection).toHaveProperty("products");
    });

    test("has products", () => {
      const data = loader.load("small");
      const collection = data.collections[0];
      expect(collection).toBeDefined();

      expect(Array.isArray(collection?.products)).toBe(true);
      expect(collection?.products.length).toBeGreaterThan(0);
    });
  });

  describe("cart_item structure", () => {
    test("has required fields", () => {
      const data = loader.load("small");
      const item = data.cart_items[0];

      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("product");
      expect(item).toHaveProperty("variant");
      expect(item).toHaveProperty("quantity");
      expect(item).toHaveProperty("line_price");
    });

    test("has product with basic fields", () => {
      const data = loader.load("small");
      const cartItem = data.cart_items[0];
      expect(cartItem).toBeDefined();
      const product = cartItem?.product;

      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("title");
      expect(product).toHaveProperty("price");
    });

    test("has variant with required fields", () => {
      const data = loader.load("small");
      const cartItem = data.cart_items[0];
      expect(cartItem).toBeDefined();
      const variant = cartItem?.variant;

      expect(variant).toHaveProperty("id");
      expect(variant).toHaveProperty("title");
      expect(variant).toHaveProperty("price");
      expect(variant).toHaveProperty("available");
    });
  });

  describe("user structure", () => {
    test("has required fields", () => {
      const data = loader.load("small");
      const user = data.user;

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("street");
      expect(user).toHaveProperty("city");
      expect(user).toHaveProperty("country");
      expect(user).toHaveProperty("zip");
    });
  });

  describe("post structure", () => {
    test("has required fields", () => {
      const data = loader.load("small");
      const post = data.posts[0];

      expect(post).toHaveProperty("id");
      expect(post).toHaveProperty("title");
      expect(post).toHaveProperty("content");
      expect(post).toHaveProperty("author");
      expect(post).toHaveProperty("published_at");
      expect(post).toHaveProperty("tags");
    });

    test("has tags", () => {
      const data = loader.load("small");
      const post = data.posts[0];
      expect(post).toBeDefined();

      expect(Array.isArray(post?.tags)).toBe(true);
      expect(post?.tags.length).toBeGreaterThan(0);
      const firstTag = post?.tags[0];
      expect(firstTag).toBeDefined();
      expect(typeof firstTag).toBe("string");
    });
  });
});

describe("loadData helper", () => {
  test("loads data and closes connection", () => {
    const data = loadData("small", DB_PATH);

    expect(data.products.length).toBe(SCALE_LIMITS.small.products);
    expect(data.user).toBeDefined();
  });

  test("works with different scales", () => {
    const smallData = loadData("small", DB_PATH);
    const mediumData = loadData("medium", DB_PATH);

    expect(smallData.products.length).toBeLessThan(mediumData.products.length);
  });
});
