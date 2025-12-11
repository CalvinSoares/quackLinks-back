import { z } from "zod";

const audioIdParams = z.object({
  audioId: z.uuid("ID de áudio inválido."),
});

export const createAudioBodySchema = z.object({
  title: z.string().min(1, "O título é obrigatório.").max(100),
  url: z.url("URL do áudio inválida."),
  type: z.enum(["DIRECT", "SPOTIFY", "SOUNDCLOUD"]),
  coverUrl: z.url("URL da capa inválida.").optional().nullable(),
  order: z.number().int().optional(),
});

export const createAudioSchema = {
  body: createAudioBodySchema,
};

export const updateAudioBodySchema = createAudioBodySchema.partial();

export const updateAudioSchema = {
  params: audioIdParams,
  body: updateAudioBodySchema,
};

export const deleteAudioSchema = {
  params: audioIdParams,
};

export const setActiveAudioSchema = {
  params: audioIdParams,
};

export type CreateAudioInput = z.infer<typeof createAudioBodySchema>;
export type UpdateAudioInput = z.infer<typeof updateAudioBodySchema>;
