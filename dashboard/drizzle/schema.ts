import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table - supports both OAuth and email/password authentication
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Optional for email/password auth
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }), // For email/password auth
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth' or 'email'
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isAuthorized: boolean("isAuthorized").default(false).notNull(), // For email/password: needs admin approval
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"), // Nullable - only set on actual login
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts table: stores published affiliate products
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull(),
  productName: text("productName").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  affiliateUrl: varchar("affiliateUrl", { length: 512 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["published", "failed", "pending"]).default("pending").notNull(),
  publishedChannels: json("publishedChannels").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Pipeline configuration table
 */
export const pipelineConfig = mysqlTable("pipelineConfig", {
  id: int("id").autoincrement().primaryKey(),
  scheduleTimes: json("scheduleTimes").$type<string[]>().default(["09:00", "15:00", "21:00"]).notNull(),
  keywords: json("keywords").$type<Record<string, string>>().default({}).notNull(),
  maxPrice: decimal("maxPrice", { precision: 10, scale: 2 }).default("1000.00").notNull(),
  minRating: decimal("minRating", { precision: 3, scale: 1 }).default("3.5").notNull(),
  activeCategories: json("activeCategories").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PipelineConfig = typeof pipelineConfig.$inferSelect;
export type InsertPipelineConfig = typeof pipelineConfig.$inferInsert;

/**
 * Execution logs table
 */
export const executionLogs = mysqlTable("executionLogs", {
  id: int("id").autoincrement().primaryKey(),
  executionId: varchar("executionId", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["success", "error", "partial"]).notNull(),
  productFound: varchar("productFound", { length: 64 }),
  productName: text("productName"),
  channelsPublished: json("channelsPublished").$type<string[]>().default([]).notNull(),
  errorMessage: text("errorMessage"),
  executionTime: int("executionTime"), // milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = typeof executionLogs.$inferInsert;

/**
 * Integration status table
 */
export const integrationStatus = mysqlTable("integrationStatus", {
  id: int("id").autoincrement().primaryKey(),
  integrationName: mysqlEnum("integrationName", ["shopee", "telegram", "buffer_instagram", "gemini"]).notNull().unique(),
  status: mysqlEnum("status", ["healthy", "warning", "error"]).default("healthy").notNull(),
  lastCheck: timestamp("lastCheck").defaultNow().notNull(),
  errorMessage: text("errorMessage"),
  responseTime: int("responseTime"), // milliseconds
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrationStatus = typeof integrationStatus.$inferSelect;
export type InsertIntegrationStatus = typeof integrationStatus.$inferInsert;

/**
 * Cache items table: tracks published products to avoid duplicates
 */
export const cacheItems = mysqlTable("cacheItems", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull().unique(),
  productName: text("productName").notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CacheItem = typeof cacheItems.$inferSelect;
export type InsertCacheItem = typeof cacheItems.$inferInsert;

/**
 * Metrics snapshot table: stores historical metrics for trending
 */
export const metricsSnapshots = mysqlTable("metricsSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  totalPublished: int("totalPublished").default(0).notNull(),
  telegramSuccess: int("telegramSuccess").default(0).notNull(),
  instagramSuccess: int("instagramSuccess").default(0).notNull(),
  facebookSuccess: int("facebookSuccess").default(0).notNull(),
  totalFailed: int("totalFailed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MetricsSnapshot = typeof metricsSnapshots.$inferSelect;
export type InsertMetricsSnapshot = typeof metricsSnapshots.$inferInsert;
