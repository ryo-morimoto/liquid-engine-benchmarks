/**
 * Database Schema
 *
 * DDL definitions for benchmark.db.
 */

/**
 * Data count limits for each scale.
 */
export const SCALE_LIMITS = {
  small: { products: 10, collections: 3, cartItems: 3, posts: 3 },
  medium: { products: 50, collections: 10, cartItems: 10, posts: 10 },
  large: { products: 200, collections: 30, cartItems: 25, posts: 30 },
  "2xl": { products: 500, collections: 50, cartItems: 50, posts: 50 },
} as const;

/**
 * DDL (Data Definition Language) for creating tables.
 */
export const DDL = `
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS variants (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    title TEXT NOT NULL,
    price INTEGER NOT NULL,
    available INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);

CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    src TEXT NOT NULL,
    alt TEXT
);
CREATE INDEX IF NOT EXISTS idx_images_product_id ON images(product_id);

CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS collection_products (
    collection_id INTEGER NOT NULL REFERENCES collections(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    position INTEGER NOT NULL,
    PRIMARY KEY (collection_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_cp_collection ON collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_cp_product ON collection_products(product_id);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    variant_id INTEGER NOT NULL REFERENCES variants(id),
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    street TEXT,
    city TEXT,
    country TEXT,
    zip TEXT
);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    author TEXT,
    published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id),
    tag_id INTEGER NOT NULL REFERENCES tags(id),
    PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_pt_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_pt_tag ON post_tags(tag_id);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);
`;
