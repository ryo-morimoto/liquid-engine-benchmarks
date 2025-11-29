/**
 * Database Seed Script
 *
 * Creates benchmark.db and populates it with test data.
 * Run with: bun run src/db/seed.ts
 */

import { Database } from "bun:sqlite";
import { faker } from "@faker-js/faker";
import { existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DDL } from "./schema";

faker.seed(42);

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../../data/benchmark.db");

if (existsSync(DB_PATH)) {
  unlinkSync(DB_PATH);
  console.log("Deleted existing database");
}

const db = new Database(DB_PATH);

// Execute DDL
const statements = DDL.split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  db.run(stmt);
}

console.log(`Database created: ${DB_PATH}`);

const MAX_PRODUCTS = 500;
const MAX_COLLECTIONS = 50;
const MAX_CART_ITEMS = 50;
const MAX_POSTS = 50;
const MAX_CATEGORIES = 10;
const MAX_TAGS = 30;

function seedProducts(): void {
  console.log("Seeding products...");

  const insertProduct = db.prepare(
    "INSERT INTO products (id, title, price, description) VALUES (?, ?, ?, ?)"
  );
  const insertVariant = db.prepare(
    "INSERT INTO variants (id, product_id, title, price, available) VALUES (?, ?, ?, ?, ?)"
  );
  const insertImage = db.prepare(
    "INSERT INTO images (id, product_id, src, alt) VALUES (?, ?, ?, ?)"
  );

  let variantId = 1;
  let imageId = 1;

  const categories = [
    { name: "Clothing", variants: ["Small", "Medium", "Large", "XL"] },
    { name: "Shoes", variants: ["US 7", "US 8", "US 9", "US 10", "US 11"] },
    { name: "Accessories", variants: ["Black", "Brown", "Navy", "White"] },
    { name: "Electronics", variants: ["64GB", "128GB", "256GB"] },
    { name: "Home", variants: ["Standard", "Deluxe", "Premium"] },
  ];

  for (let i = 1; i <= MAX_PRODUCTS; i++) {
    const category = categories[i % categories.length];
    if (!category) throw new Error(`Category not found for index ${i}`);
    const basePrice = faker.number.int({ min: 990, max: 49990 });

    insertProduct.run(
      i,
      faker.commerce.productName(),
      basePrice,
      faker.commerce.productDescription()
    );

    const variantCount = faker.number.int({ min: 2, max: 4 });
    const selectedVariants = faker.helpers.arrayElements(category.variants, variantCount);

    for (const variantTitle of selectedVariants) {
      const variantPrice = basePrice + faker.number.int({ min: -500, max: 1000 });
      const available = faker.datatype.boolean({ probability: 0.8 }) ? 1 : 0;
      insertVariant.run(variantId++, i, variantTitle, variantPrice, available);
    }

    const imageCount = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < imageCount; j++) {
      const imageName = j === 0 ? "main" : `angle-${j}`;
      insertImage.run(
        imageId++,
        i,
        `/images/product-${i}-${imageName}.jpg`,
        `${faker.commerce.productName()} - ${imageName}`
      );
    }
  }

  console.log(`  Created ${MAX_PRODUCTS} products`);
  console.log(`  Created ${variantId - 1} variants`);
  console.log(`  Created ${imageId - 1} images`);
}

function seedCollections(): void {
  console.log("Seeding collections...");

  const insertCollection = db.prepare(
    "INSERT INTO collections (id, title, description) VALUES (?, ?, ?)"
  );
  const insertCollectionProduct = db.prepare(
    "INSERT INTO collection_products (collection_id, product_id, position) VALUES (?, ?, ?)"
  );

  const collectionNames = [
    "Featured",
    "New Arrivals",
    "Best Sellers",
    "Sale",
    "Summer Collection",
    "Winter Essentials",
    "Gift Ideas",
    "Trending Now",
    "Staff Picks",
    "Limited Edition",
    "Eco-Friendly",
    "Premium Selection",
    "Budget Friendly",
    "Top Rated",
    "Seasonal Favorites",
  ];

  for (let i = 1; i <= MAX_COLLECTIONS; i++) {
    const baseName = collectionNames[(i - 1) % collectionNames.length];
    if (!baseName) throw new Error(`Collection name not found for index ${i}`);
    const title =
      i <= collectionNames.length
        ? baseName
        : `${baseName} ${Math.ceil(i / collectionNames.length)}`;

    insertCollection.run(i, title, faker.commerce.productDescription());

    const productCount = faker.number.int({ min: 5, max: 15 });
    const productIds = faker.helpers.arrayElements(
      Array.from({ length: MAX_PRODUCTS }, (_, j) => j + 1),
      productCount
    );

    productIds.forEach((productId: number, position: number) => {
      insertCollectionProduct.run(i, productId, position + 1);
    });
  }

  console.log(`  Created ${MAX_COLLECTIONS} collections`);
}

function seedCartItems(): void {
  console.log("Seeding cart items...");

  const insertCartItem = db.prepare(
    "INSERT INTO cart_items (id, product_id, variant_id, quantity, price) VALUES (?, ?, ?, ?, ?)"
  );

  const variants = db.query("SELECT id, product_id, price FROM variants").all() as {
    id: number;
    product_id: number;
    price: number;
  }[];

  for (let i = 1; i <= MAX_CART_ITEMS; i++) {
    const variant = faker.helpers.arrayElement(variants);
    const quantity = faker.number.int({ min: 1, max: 5 });
    const lineTotal = variant.price * quantity;
    insertCartItem.run(i, variant.product_id, variant.id, quantity, lineTotal);
  }

  console.log(`  Created ${MAX_CART_ITEMS} cart items`);
}

function seedUsers(): void {
  console.log("Seeding users...");

  const insertUser = db.prepare(
    "INSERT INTO users (id, name, email, street, city, country, zip) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  insertUser.run(
    1,
    faker.person.fullName(),
    faker.internet.email(),
    faker.location.streetAddress(),
    faker.location.city(),
    faker.location.country(),
    faker.location.zipCode()
  );

  console.log("  Created 1 user");
}

function seedCategoriesAndTags(): void {
  console.log("Seeding categories and tags...");

  const insertCategory = db.prepare("INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)");
  const insertTag = db.prepare("INSERT INTO tags (id, name) VALUES (?, ?)");

  const categoryNames = [
    "News",
    "Tutorials",
    "Reviews",
    "Guides",
    "Updates",
    "Tips",
    "Announcements",
    "Behind the Scenes",
    "Community",
    "Events",
  ];

  for (let i = 0; i < MAX_CATEGORIES; i++) {
    const name = categoryNames[i];
    if (!name) throw new Error(`Category name not found for index ${i}`);
    insertCategory.run(i + 1, name, name.toLowerCase().replace(/\s+/g, "-"));
  }

  const tagNames = [
    "featured",
    "trending",
    "new",
    "sale",
    "popular",
    "recommended",
    "exclusive",
    "limited",
    "bestseller",
    "seasonal",
    "eco-friendly",
    "handmade",
    "organic",
    "vegan",
    "sustainable",
    "premium",
    "budget",
    "gift",
    "holiday",
    "summer",
    "winter",
    "spring",
    "fall",
    "classic",
    "modern",
    "vintage",
    "minimalist",
    "bold",
    "elegant",
    "casual",
  ];

  for (let i = 0; i < MAX_TAGS; i++) {
    const tagName = tagNames[i];
    if (!tagName) throw new Error(`Tag name not found for index ${i}`);
    insertTag.run(i + 1, tagName);
  }

  console.log(`  Created ${MAX_CATEGORIES} categories`);
  console.log(`  Created ${MAX_TAGS} tags`);
}

function seedPosts(): void {
  console.log("Seeding posts...");

  const insertPost = db.prepare(
    "INSERT INTO posts (id, title, content, author, published_at) VALUES (?, ?, ?, ?, ?)"
  );
  const insertPostTag = db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)");

  for (let i = 1; i <= MAX_POSTS; i++) {
    const dateStr = faker.date.past({ years: 2 }).toISOString().split("T")[0];
    if (!dateStr) throw new Error(`Failed to generate date for post ${i}`);

    insertPost.run(
      i,
      faker.lorem.sentence({ min: 4, max: 10 }),
      faker.lorem.paragraphs({ min: 3, max: 8 }),
      faker.person.fullName(),
      dateStr
    );

    const tagCount = faker.number.int({ min: 2, max: 5 });
    const tagIds = faker.helpers.arrayElements(
      Array.from({ length: MAX_TAGS }, (_, j) => j + 1),
      tagCount
    );

    for (const tagId of tagIds) {
      insertPostTag.run(i, tagId);
    }
  }

  console.log(`  Created ${MAX_POSTS} posts`);
}

// Main
console.log("Starting database seeding...\n");

db.run("BEGIN TRANSACTION");

try {
  seedProducts();
  seedCollections();
  seedCartItems();
  seedUsers();
  seedCategoriesAndTags();
  seedPosts();

  db.run("COMMIT");
  console.log("\nDatabase seeding completed!");
} catch (error) {
  db.run("ROLLBACK");
  console.error("Error seeding database:", error);
  process.exit(1);
}

// Stats
console.log("\n--- Statistics ---");
const tables = ["products", "variants", "images", "collections", "cart_items", "posts", "tags"];
for (const table of tables) {
  const result = db.query(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number };
  console.log(`  ${table}: ${result.c}`);
}

db.close();
