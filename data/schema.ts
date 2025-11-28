/**
 * Database Schema Definition
 *
 * Defines the structure of test data for Liquid benchmarks.
 * TypeScript interfaces and DDL are co-located here for easy reference.
 */

/**
 * Scale definitions for benchmark data sizes.
 * Use LIMIT clause to switch between scales.
 */
export const SCALES = {
  small: { products: 10, collections: 3, cartItems: 3, posts: 3 },
  medium: { products: 50, collections: 10, cartItems: 10, posts: 10 },
  large: { products: 200, collections: 30, cartItems: 25, posts: 30 },
  "2xl": { products: 500, collections: 50, cartItems: 50, posts: 50 },
} as const;

export type Scale = keyof typeof SCALES;

/**
 * Product data for e-commerce benchmarks.
 */
export interface Product {
  id: number;
  title: string;
  /** Price in cents (e.g., 1990 = $19.90) */
  price: number;
  description: string;
}

/**
 * Product variants (size, color, etc.)
 */
export interface Variant {
  id: number;
  product_id: number;
  title: string;
  price: number;
  /** 1 = in stock, 0 = out of stock */
  available: number;
}

/**
 * Product images
 */
export interface Image {
  id: number;
  product_id: number;
  src: string;
  alt: string;
}

/**
 * Collection (product grouping)
 */
export interface Collection {
  id: number;
  title: string;
  description: string;
}

/**
 * Collection-Product relationship (many-to-many)
 */
export interface CollectionProduct {
  collection_id: number;
  product_id: number;
  /** Display order within collection */
  position: number;
}

/**
 * Cart item
 */
export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  /** Line total in cents */
  price: number;
}

/**
 * User
 */
export interface User {
  id: number;
  name: string;
  email: string;
  street: string;
  city: string;
  country: string;
  zip: string;
}

/**
 * Blog post for Jekyll-style benchmarks.
 */
export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  /** ISO 8601 format */
  published_at: string;
}

/**
 * Tag
 */
export interface Tag {
  id: number;
  name: string;
}

/**
 * Post-Tag relationship (many-to-many)
 */
export interface PostTag {
  post_id: number;
  tag_id: number;
}

/**
 * Category
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
}

/**
 * DDL (Data Definition Language) for creating tables.
 */
export const DDL = `
-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT
);

-- Variants table (belongs to product)
CREATE TABLE IF NOT EXISTS variants (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    title TEXT NOT NULL,
    price INTEGER NOT NULL,
    available INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);

-- Images table (belongs to product)
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    src TEXT NOT NULL,
    alt TEXT
);
CREATE INDEX IF NOT EXISTS idx_images_product_id ON images(product_id);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT
);

-- Collection-Product join table
CREATE TABLE IF NOT EXISTS collection_products (
    collection_id INTEGER NOT NULL REFERENCES collections(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    position INTEGER NOT NULL,
    PRIMARY KEY (collection_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_cp_collection ON collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_cp_product ON collection_products(product_id);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    variant_id INTEGER NOT NULL REFERENCES variants(id),
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    street TEXT,
    city TEXT,
    country TEXT,
    zip TEXT
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    author TEXT,
    published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Post-Tag join table
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id),
    tag_id INTEGER NOT NULL REFERENCES tags(id),
    PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_pt_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_pt_tag ON post_tags(tag_id);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

-- Scale definitions view
CREATE VIEW IF NOT EXISTS scales AS
SELECT 'small' as name, 10 as products, 3 as collections, 3 as cart_items, 3 as posts
UNION ALL SELECT 'medium', 50, 10, 10, 10
UNION ALL SELECT 'large', 200, 30, 25, 30
UNION ALL SELECT '2xl', 500, 50, 50, 50;
`;
