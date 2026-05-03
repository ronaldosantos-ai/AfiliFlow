#!/usr/bin/env node
/**
 * Migration script: create the `integrationSettings` table.
 *
 * Creates the `integrationSettings` table if it doesn't already exist,
 * then verifies the result with SHOW TABLES.  Safe to run multiple times.
 *
 * Usage:
 *   node scripts/create-integration-settings.cjs
 *
 * Requires the DATABASE_URL environment variable to be set.
 */

"use strict";

const mysql = require("mysql2/promise");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "[create-integration-settings] ERROR: DATABASE_URL environment variable is not set."
  );
  process.exit(1);
}

async function run() {
  console.log("[create-integration-settings] Connecting to database…");

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // ------------------------------------------------------------------
    // 1. Create the integrationSettings table if it doesn't exist yet.
    // ------------------------------------------------------------------
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`integrationSettings\` (
        \`id\`                     INT            NOT NULL AUTO_INCREMENT,
        \`integrationName\`        VARCHAR(64)    NOT NULL,
        \`metaAppId\`              VARCHAR(255)   NULL,
        \`metaAppSecret\`          VARCHAR(255)   NULL,
        \`metaPageAccessToken\`    VARCHAR(255)   NULL,
        \`metaPageId\`             VARCHAR(255)   NULL,
        \`metaInstagramAccountId\` VARCHAR(255)   NULL,
        \`telegramBotToken\`       VARCHAR(255)   NULL,
        \`telegramChatId\`         VARCHAR(255)   NULL,
        \`shopeeApiKey\`           VARCHAR(255)   NULL,
        \`shopeePartnerId\`        VARCHAR(255)   NULL,
        \`gtmId\`                  VARCHAR(255)   NULL,
        \`isActive\`               BOOLEAN        NOT NULL DEFAULT true,
        \`createdAt\`              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\`              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`integrationSettings_integrationName_unique\` (\`integrationName\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log(
      "[create-integration-settings] ✓ integrationSettings table exists (created or already present)."
    );

    // ------------------------------------------------------------------
    // 2. Verify the table is visible in the current database.
    // ------------------------------------------------------------------
    const [tables] = await connection.execute("SHOW TABLES LIKE 'integrationSettings'");

    if (tables.length > 0) {
      console.log(
        "[create-integration-settings] ✓ Verification passed: 'integrationSettings' found in SHOW TABLES."
      );
    } else {
      console.error(
        "[create-integration-settings] ERROR: Verification failed — 'integrationSettings' not found in SHOW TABLES."
      );
      process.exit(1);
    }

    console.log("[create-integration-settings] Migration completed successfully.");
  } catch (err) {
    console.error("[create-integration-settings] Migration failed:", err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
