import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getRecentPosts,
  getMetricsSummary,
  getPipelineConfig,
  getExecutionLogs,
  getIntegrationStatus,
  getCacheItems,
  getMetricsSnapshot,
} from "./db";
import { registerUser, loginUser, getPendingUsers, authorizeUser, rejectUser } from "./auth";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string() }))
      .mutation(async ({ input }) => {
        const user = await registerUser(input.email, input.password, input.name);
        return { success: true, user };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await loginUser(input.email, input.password);
        const sessionToken = await sdk.createSessionToken(
          `email:${user.email}`,
          { name: user.name ?? "" }
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { success: true, user };
      }),
  }),

  admin: router({
    getPendingUsers: protectedProcedure.query(async () => {
      return await getPendingUsers();
    }),
    authorizeUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await authorizeUser(input.userId);
        return { success: true };
      }),
    rejectUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await rejectUser(input.userId);
        return { success: true };
      }),
  }),

  dashboard: router({
    getMetricsSummary: publicProcedure.query(async () => {
      return await getMetricsSummary();
    }),

    getRecentPosts: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await getRecentPosts(input.limit);
      }),

    getPipelineConfig: publicProcedure.query(async () => {
      return await getPipelineConfig();
    }),

    getExecutionLogs: publicProcedure.query(async () => {
      return await getExecutionLogs();
    }),

    getIntegrationStatus: publicProcedure.query(async () => {
      return await getIntegrationStatus();
    }),

    getCacheItems: publicProcedure.query(async () => {
      return await getCacheItems();
    }),

    getMetricsSnapshot: publicProcedure.query(async () => {
      return await getMetricsSnapshot();
    }),
  }),
});

export type AppRouter = typeof appRouter;
