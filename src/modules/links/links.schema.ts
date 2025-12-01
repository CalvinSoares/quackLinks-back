import { z } from "zod";

const linkIdParams = z.object({ linkId: z.uuid() });

const createLinkBodySchema = z.object({
  title: z.string().min(1),
  url: z.url({ message: "URL inválida." }),
  scheduledAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export const createLinkSchema = {
  body: createLinkBodySchema,
};
export type CreateLinkInput = z.infer<typeof createLinkBodySchema>;

const updateLinkBodySchema = z.object({
  title: z.string().min(1).optional(),
  url: z.url({ message: "URL inválida." }).optional(),
  scheduledAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});
export const updateLinkSchema = {
  body: updateLinkBodySchema,
  params: linkIdParams,
};
export type UpdateLinkInput = z.infer<typeof updateLinkBodySchema>;

export const deleteLinkSchema = {
  params: linkIdParams,
};

const reorderLinksBodySchema = z.array(
  z.object({
    id: z.uuid(),
    order: z.number().int(),
  })
);

export const redirectLinkSchema = {
  params: z.object({
    linkId: z.uuid(),
  }),
};

export const reorderLinksSchema = {
  body: reorderLinksBodySchema,
};
export type ReorderLinkInput = z.infer<typeof reorderLinksBodySchema>;
