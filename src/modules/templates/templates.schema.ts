import { z } from "zod";

// --- Parâmetros ---
export const templateIdParamSchema = z.object({
  id: z.string().uuid("ID de template inválido."),
});

// --- Body ---
export const createTemplateBodySchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres.").max(50),
  previewImageUrl: z.string().url("URL da imagem de preview inválida."),
  tags: z
    .array(z.string().min(2).max(20))
    .min(1, "Adicione pelo menos uma tag.")
    .max(5, "Você pode adicionar no máximo 5 tags."),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
});

// --- Query (para a rota de listagem/busca) ---
export const listTemplatesQuerySchema = z.object({
  search: z.string().optional(), // Pesquisar por nome do template
  creatorName: z.string().optional(), // Pesquisar por nome do criador
  tags: z.string().optional(), // tags separadas por vírgula, ex: "dark,minimalist"
  sortBy: z.enum(["popular", "newest", "oldest"]).default("popular"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(12),
});

// --- Tipos Inferidos ---
export type CreateTemplateInput = z.infer<typeof createTemplateBodySchema>;
export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;

// --- Schemas para Fastify ---
export const createTemplateSchema = {
  body: createTemplateBodySchema,
};

export const getTemplateSchema = {
  params: templateIdParamSchema,
};

export const listTemplatesSchema = {
  querystring: listTemplatesQuerySchema,
};

export const applyTemplateSchema = {
  params: templateIdParamSchema,
};

export const favoriteTemplateSchema = {
  params: templateIdParamSchema,
};
