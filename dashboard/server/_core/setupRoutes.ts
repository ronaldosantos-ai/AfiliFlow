import type { Express } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function registerSetupRoutes(app: Express) {
  // Setup endpoint - executa migração e insere usuários
  app.post("/api/setup", async (req, res) => {
    try {
      // Verificar se já foi feito setup (se existir usuário com loginMethod = 'email')
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const existingUsers = await db
        .select()
        .from(users)
        .where((u) => u.loginMethod === "email")
        .limit(1);

      if (existingUsers.length > 0) {
        return res.status(400).json({
          error: "Setup já foi realizado",
          message: "O sistema já possui usuários configurados",
        });
      }

      // Inserir usuário 1: Admin
      const passwordHash = hashPassword("Senha123!");

      await db.insert(users).values({
        email: "rsmarketerltda@gmail.com",
        passwordHash,
        name: "Ronaldo Santos",
        loginMethod: "email",
        role: "admin",
        isAuthorized: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: null,
      });

      // Inserir usuário 2: User (precisa de aprovação)
      await db.insert(users).values({
        email: "rsmarketer02@gmail.com",
        passwordHash,
        name: "Usuário 2",
        loginMethod: "email",
        role: "user",
        isAuthorized: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: null,
      });

      res.json({
        success: true,
        message: "Setup realizado com sucesso!",
        users: [
          {
            email: "rsmarketerltda@gmail.com",
            role: "admin",
            isAuthorized: true,
            password: "Senha123!",
          },
          {
            email: "rsmarketer02@gmail.com",
            role: "user",
            isAuthorized: false,
            password: "Senha123!",
          },
        ],
      });
    } catch (error) {
      console.error("[Setup] Error:", error);
      res.status(500).json({
        error: "Setup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Status endpoint - verifica se setup foi feito
  app.get("/api/setup/status", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const emailUsers = await db
        .select()
        .from(users)
        .where((u) => u.loginMethod === "email");

      res.json({
        setupDone: emailUsers.length > 0,
        userCount: emailUsers.length,
        users: emailUsers.map((u) => ({
          email: u.email,
          name: u.name,
          role: u.role,
          isAuthorized: u.isAuthorized,
        })),
      });
    } catch (error) {
      console.error("[Setup Status] Error:", error);
      res.status(500).json({
        error: "Status check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
