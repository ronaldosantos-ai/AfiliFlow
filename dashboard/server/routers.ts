import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getRecentPosts,
  getMetricsSummary,
  getPipelineConfig,
  updatePipelineConfig,
  getExecutionLogs,
  createExecutionLog,
  getIntegrationStatus,
  updateIntegrationStatus,
  getCacheItems,
  removeCacheItem,
  getMetricsSnapshot,
} from "./db";
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
  }),

  // Dashboard routes
  dashboard: router({
    // Metrics
    getMetricsSummary: publicProcedure.query(async () => {
      return await getMetricsSummary();
    }),

    getRecentPosts: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await getRecentPosts(input.limit);
      }),

    // Pipeline Configuration
    getPipelineConfig: publicProcedure.query(async () => {
      return await getPipelineConfig();
    }),

    updatePipelineConfig: protectedProcedure
      .input(
        z.object({
          scheduleTimes: z.array(z.string()).optional(),
          keywords: z.record(z.string(), z.string()).optional(),
          maxPrice: z.number().optional(),
          minRating: z.number().optional(),
          activeCategories: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await updatePipelineConfig(input as any);
      }),

    // Execution Logs
    getExecutionLogs: publicProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await getExecutionLogs(input.limit);
      }),

    createExecutionLog: protectedProcedure
      .input(
        z.object({
          executionId: z.string(),
          status: z.enum(["success", "error", "partial"]),
          productFound: z.string().optional(),
          productName: z.string().optional(),
          channelsPublished: z.array(z.string()).default([]),
          errorMessage: z.string().optional(),
          executionTime: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createExecutionLog(input);
      }),

    // Integration Status
    getIntegrationStatus: publicProcedure
      .input(z.object({ integrationName: z.string().optional() }))
      .query(async ({ input }) => {
        return await getIntegrationStatus(input.integrationName);
      }),

    updateIntegrationStatus: protectedProcedure
      .input(
        z.object({
          integrationName: z.enum(["shopee", "telegram", "buffer_instagram", "gemini"]),
          status: z.enum(["healthy", "warning", "error"]),
          responseTime: z.number().optional(),
          errorMessage: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { integrationName, ...statusData } = input;
        return await updateIntegrationStatus(integrationName, statusData as any);
      }),

    // Cache Management
    getCacheItems: publicProcedure.query(async () => {
      return await getCacheItems();
    }),

    removeCacheItem: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .mutation(async ({ input }) => {
        return await removeCacheItem(input.productId);
      }),

    // Metrics Snapshots
    getMetricsSnapshots: publicProcedure
      .input(z.object({ limit: z.number().default(30) }))
      .query(async ({ input }) => {
        return await getMetricsSnapshot(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
