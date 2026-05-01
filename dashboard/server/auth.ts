import crypto from "crypto";
import { getDb } from "./db";
import { authUsers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Hash password using bcrypt-like approach
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Register new user
 */
export async function registerUser(email: string, password: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already exists
  const existing = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("User already exists");
  }

  // Create new user
  const passwordHash = hashPassword(password);
  const isAdmin = email === "rsmarketerltda@gmail.com"; // Admin email

  await db.insert(authUsers).values({
    email,
    passwordHash,
    name,
    isAdmin,
    isAuthorized: isAdmin, // Auto-authorize admin
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    id: 1,
    email,
    name,
    isAdmin,
    isAuthorized: isAdmin,
  };
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const users = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.email, email))
    .limit(1);

  if (users.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = users[0];

  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid credentials");
  }

  if (!user.isAuthorized && !user.isAdmin) {
    throw new Error("User not authorized. Please wait for admin approval.");
  }

  // Update last login
  await db
    .update(authUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(authUsers.id, user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    isAuthorized: user.isAuthorized,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const users = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.id, id))
    .limit(1);

  return users[0] || null;
}

/**
 * Get pending users (for admin approval)
 */
export async function getPendingUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.isAuthorized, false));
}

/**
 * Authorize user
 */
export async function authorizeUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(authUsers)
    .set({ isAuthorized: true })
    .where(eq(authUsers.id, userId));
}

/**
 * Reject user
 */
export async function rejectUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(authUsers).where(eq(authUsers.id, userId));
}
