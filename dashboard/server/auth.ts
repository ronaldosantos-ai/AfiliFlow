import crypto from "crypto";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Hash password using SHA256
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
 * Register new user with email/password
 */
export async function registerUser(email: string, password: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate inputs
  if (!email || !password || !name) {
    throw new Error("Email, password, and name are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("User already exists");
  }

  // Create new user
  const passwordHash = hashPassword(password);
  const isAdmin = email === "rsmarketerltda@gmail.com"; // Admin email

  const result = await db.insert(users).values({
    email,
    passwordHash,
    name,
    loginMethod: "email",
    role: isAdmin ? "admin" : "user",
    isAuthorized: isAdmin, // Auto-authorize admin, others need approval
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    email,
    name,
    role: isAdmin ? "admin" : "user",
    isAuthorized: isAdmin,
  };
}

/**
 * Login user with email/password
 */
export async function loginUser(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate inputs
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const userList = await db
    .select()
    .from(users)
    .where(and(
      eq(users.email, email),
      eq(users.loginMethod, "email")
    ))
    .limit(1);

  if (userList.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = userList[0];

  // Check if password hash exists
  if (!user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid credentials");
  }

  // Check if user is authorized (except admins)
  if (!user.isAuthorized && user.role !== "admin") {
    throw new Error("User not authorized. Please wait for admin approval.");
  }

  // Update last login
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isAuthorized: user.isAuthorized,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userList = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return userList[0] || null;
}

/**
 * Get pending users (for admin approval)
 */
export async function getPendingUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(users)
    .where(and(
      eq(users.isAuthorized, false),
      eq(users.loginMethod, "email")
    ));
}

/**
 * Authorize user
 */
export async function authorizeUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ isAuthorized: true })
    .where(eq(users.id, userId));
}

/**
 * Reject user
 */
export async function rejectUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(users).where(eq(users.id, userId));
}
