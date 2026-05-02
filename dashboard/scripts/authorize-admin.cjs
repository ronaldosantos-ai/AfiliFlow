#!/usr/bin/env node
/**
 * One-time admin authorization fix script.
 *
 * Updates the admin user record for rsmarketerltda@gmail.com to set
 * isAuthorized = true and role = 'admin', correcting a record that was
 * created before the auto-authorization logic was in place.
 *
 * Usage:
 *   node scripts/authorize-admin.cjs
 *
 * Requires the DATABASE_URL environment variable to be set.
 */

"use strict";

const mysql = require("mysql2/promise");

const ADMIN_EMAIL = "rsmarketerltda@gmail.com";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[authorize-admin] ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

async function run() {
  console.log("[authorize-admin] Connecting to database…");

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    const [result] = await connection.execute(
      "UPDATE `users` SET `isAuthorized` = 1, `role` = 'admin', `updatedAt` = NOW() WHERE `email` = ?",
      [ADMIN_EMAIL]
    );

    if (result.affectedRows === 0) {
      console.warn(
        `[authorize-admin] WARNING: No user found with email '${ADMIN_EMAIL}'. Nothing was updated.`
      );
    } else {
      console.log(
        `[authorize-admin] ✓ Successfully authorized admin user '${ADMIN_EMAIL}' (${result.affectedRows} row updated).`
      );
    }
  } catch (err) {
    console.error("[authorize-admin] ERROR: Failed to update admin user:", err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
