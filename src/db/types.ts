/**
 * Benchmark Data Types
 *
 * Type definitions for data structures used in Liquid templates.
 */

export interface Variant {
  id: number;
  title: string;
  price: number;
  available: boolean;
}

export interface Image {
  id: number;
  src: string;
  alt: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  variants: Variant[];
  images: Image[];
}

export interface Collection {
  id: number;
  title: string;
  description: string;
  products: Product[];
}

export interface CartItem {
  id: number;
  product: Product;
  variant: Variant;
  quantity: number;
  line_price: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  street: string;
  city: string;
  country: string;
  zip: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  published_at: string;
  tags: string[];
}

/**
 * Complete benchmark data.
 * Index signature allows assignment to Record<string, unknown>.
 */
export interface BenchmarkData {
  products: Product[];
  collections: Collection[];
  cart_items: CartItem[];
  user: User;
  posts: Post[];
  [key: string]: Product[] | Collection[] | CartItem[] | User | Post[];
}
