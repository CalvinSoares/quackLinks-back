import { z } from "zod";

export const addDomainBodySchema = z.object({
  domain: z.string(),
});

export const addDomainSchema = {
  body: addDomainBodySchema,
};
