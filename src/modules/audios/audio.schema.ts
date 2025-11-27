// src/modules/audios/audios.schema.ts

import { z } from "zod";

const audioIdParams = z.object({
  audioId: z.uuid("ID de áudio inválido."),
});

// Schema para criar um novo áudio
export const createAudioBodySchema = z.object({
  title: z.string().min(1, "O título é obrigatório.").max(100),
  url: z.url("URL do áudio inválida."),
  coverUrl: z.url("URL da capa inválida.").optional().nullable(),
  order: z.number().int().optional(),
});

export const createAudioSchema = {
  body: createAudioBodySchema,
};

// Schema para atualizar um áudio existente
export const updateAudioBodySchema = createAudioBodySchema.partial(); // Todos os campos são opcionais

export const updateAudioSchema = {
  params: audioIdParams,
  body: updateAudioBodySchema,
};

// Schema para deletar um áudio
export const deleteAudioSchema = {
  params: audioIdParams,
};

// Schema para definir um áudio como ativo
export const setActiveAudioSchema = {
  params: audioIdParams,
};

// Exportar os tipos para uso no controller
export type CreateAudioInput = z.infer<typeof createAudioBodySchema>;
export type UpdateAudioInput = z.infer<typeof updateAudioBodySchema>;
