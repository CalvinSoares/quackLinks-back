import { z } from "zod";

export const timePeriodSchema = z.enum(["7d", "30d", "90d", "all"]);
export type TimePeriod = z.infer<typeof timePeriodSchema>;

export const getAnalyticsSchema = {
  querystring: z.object({
    period: timePeriodSchema.default("30d"),
  }),
};
