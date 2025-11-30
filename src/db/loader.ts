/**
 * Data Loader
 *
 * Loads benchmark data from SQLite and transforms it
 * into structures suitable for Liquid templates.
 */

import { Database } from "bun:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Scale } from "../types";
import { SCALE_LIMITS } from "./schema";
import type {
  BenchmarkData,
  CartItem,
  Collection,
  Image,
  Post,
  Product,
  User,
  Variant,
} from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = join(__dirname, "../../.generated/benchmark.db");

/**
 * Data Loader Class
 *
 * Loads data from SQLite and transforms it into object structures
 * suitable for Liquid templates.
 */
export class DataLoader {
  private db: Database;

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    this.db = new Database(dbPath, { readonly: true });
  }

  /**
   * Execute a query and return all rows.
   */
  private queryAll<T>(
    sql: string,
    ...params: (string | number | bigint | boolean | null | Uint8Array)[]
  ): T[] {
    return this.db.query(sql).all(...params) as T[];
  }

  /**
   * Execute a query and return a single row.
   */
  private queryGet<T>(
    sql: string,
    ...params: (string | number | bigint | boolean | null | Uint8Array)[]
  ): T | null {
    return this.db.query(sql).get(...params) as T | null;
  }

  /**
   * Load data for the specified scale.
   */
  load(scale: Scale): BenchmarkData {
    const limits = SCALE_LIMITS[scale];

    return {
      products: this.loadProducts(limits.products),
      collections: this.loadCollections(limits.collections, limits.products),
      cart_items: this.loadCartItems(limits.cartItems),
      user: this.loadUser(),
      posts: this.loadPosts(limits.posts),
    };
  }

  private loadProducts(limit: number): Product[] {
    interface ProductRow {
      id: number;
      title: string;
      price: number;
      description: string;
    }
    const products = this.queryAll<ProductRow>(
      "SELECT id, title, price, description FROM products LIMIT ?",
      limit
    );

    return products.map((p) => ({
      ...p,
      variants: this.loadVariants(p.id),
      images: this.loadImages(p.id),
    }));
  }

  private loadVariants(productId: number): Variant[] {
    interface VariantRow {
      id: number;
      title: string;
      price: number;
      available: number;
    }
    const variants = this.queryAll<VariantRow>(
      "SELECT id, title, price, available FROM variants WHERE product_id = ?",
      productId
    );

    return variants.map((v) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      available: v.available === 1,
    }));
  }

  private loadImages(productId: number): Image[] {
    return this.queryAll<Image>("SELECT id, src, alt FROM images WHERE product_id = ?", productId);
  }

  private loadCollections(limit: number, productLimit: number): Collection[] {
    interface CollectionRow {
      id: number;
      title: string;
      description: string;
    }
    const collections = this.queryAll<CollectionRow>(
      "SELECT id, title, description FROM collections LIMIT ?",
      limit
    );

    const allProducts = this.loadProducts(productLimit);
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    return collections.map((c) => {
      interface ProductIdRow {
        product_id: number;
      }
      const productIds = this.queryAll<ProductIdRow>(
        "SELECT product_id FROM collection_products WHERE collection_id = ? ORDER BY position",
        c.id
      );

      const products = productIds
        .map((row) => productMap.get(row.product_id))
        .filter((p): p is Product => p !== undefined);

      return { ...c, products };
    });
  }

  private loadCartItems(limit: number): CartItem[] {
    interface CartItemRow {
      id: number;
      quantity: number;
      line_price: number;
      product_id: number;
      product_title: string;
      product_price: number;
      product_description: string;
      variant_id: number;
      variant_title: string;
      variant_price: number;
      variant_available: number;
    }
    const items = this.queryAll<CartItemRow>(
      `SELECT
        ci.id, ci.quantity, ci.price as line_price,
        p.id as product_id, p.title as product_title, p.price as product_price, p.description as product_description,
        v.id as variant_id, v.title as variant_title, v.price as variant_price, v.available as variant_available
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN variants v ON ci.variant_id = v.id
      LIMIT ?`,
      limit
    );

    return items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      line_price: item.line_price,
      product: {
        id: item.product_id,
        title: item.product_title,
        price: item.product_price,
        description: item.product_description,
        variants: [],
        images: [],
      },
      variant: {
        id: item.variant_id,
        title: item.variant_title,
        price: item.variant_price,
        available: item.variant_available === 1,
      },
    }));
  }

  private loadUser(): User {
    const user = this.queryGet<User>(
      "SELECT id, name, email, street, city, country, zip FROM users LIMIT 1"
    );

    if (!user) {
      throw new Error("No user found in database");
    }

    return user;
  }

  private loadPosts(limit: number): Post[] {
    interface PostRow {
      id: number;
      title: string;
      content: string;
      author: string;
      published_at: string;
    }
    const posts = this.queryAll<PostRow>(
      "SELECT id, title, content, author, published_at FROM posts ORDER BY published_at DESC LIMIT ?",
      limit
    );

    return posts.map((post) => ({
      ...post,
      tags: this.loadPostTags(post.id),
    }));
  }

  private loadPostTags(postId: number): string[] {
    interface TagRow {
      name: string;
    }
    const tags = this.queryAll<TagRow>(
      "SELECT t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?",
      postId
    );

    return tags.map((t) => t.name);
  }

  close(): void {
    this.db.close();
  }
}

/**
 * Load benchmark data for the specified scale.
 */
export function loadData(scale: Scale, dbPath?: string): BenchmarkData {
  const loader = new DataLoader(dbPath);
  try {
    return loader.load(scale);
  } finally {
    loader.close();
  }
}
