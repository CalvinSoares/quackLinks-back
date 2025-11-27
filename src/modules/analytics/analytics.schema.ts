import { z } from "zod";

// Define os períodos de tempo permitidos
export const timePeriodSchema = z.enum(["7d", "30d", "90d", "all"]);
export type TimePeriod = z.infer<typeof timePeriodSchema>;

// Schema para a query string da nossa rota
export const getAnalyticsSchema = {
  querystring: z.object({
    period: timePeriodSchema.default("30d"), // Define '30d' como padrão se nada for enviado
  }),
};
