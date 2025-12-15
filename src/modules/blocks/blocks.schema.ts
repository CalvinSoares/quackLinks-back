import { z } from "zod";

// Enum deve bater com o do Prisma, mas no Zod
const blockTypeEnum = z.enum([
  "LINK",
  "HEADER",
  "TEXT",
  "DIVIDER",
  "VIDEO",
  "SOCIAL",
  "IMAGE",
  "AUDIO",
]);

// Criar Bloco
export const createBlockSchema = {
  body: z.object({
    type: blockTypeEnum,
    content: z.record(z.string(), z.any()).optional(), // JSON content flexível
    isVisible: z.boolean().default(true),
  }),
};

// Atualizar Bloco
export const updateBlockSchema = {
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    content: z.record(z.string(), z.any()).optional(),
    isVisible: z.boolean().optional(),
    type: blockTypeEnum.optional(), // Caso queira mudar o tipo
  }),
};

// Reordenar Blocos (Batch)
export const reorderBlocksSchema = {
  body: z.object({
    blocks: z.array(
      z.object({
        id: z.uuid(),
        order: z.number().int().min(0),
      })
    ),
  }),
};

// Deletar Bloco
export const deleteBlockSchema = {
  params: z.object({
    id: z.uuid(),
  }),
};

export type CreateBlockInput = z.infer<typeof createBlockSchema.body>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema.body>;
export type ReorderBlocksInput = z.infer<typeof reorderBlocksSchema.body>;
