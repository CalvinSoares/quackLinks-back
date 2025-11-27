import { z } from "zod";

const linkIdParams = z.object({ linkId: z.uuid() });

// Schema para criar um novo link
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

// Schema para atualizar um link
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

// Schema para deletar um link
export const deleteLinkSchema = {
  params: linkIdParams,
};

// Schema para reordenar links
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
