import { z } from "zod";

const getAnalyticsQuerystringSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
});

export type GetAnalyticsQuery = z.infer<typeof getAnalyticsQuerystringSchema>;

export const getAnalyticsSchema = {
  querystring: getAnalyticsQuerystringSchema,
};

export type TimePeriod = z.infer<
  typeof getAnalyticsQuerystringSchema.shape.period
>;
