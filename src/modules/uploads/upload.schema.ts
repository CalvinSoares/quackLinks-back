import { z } from "zod";

// Valida o corpo da requisição para criar uma URL pré-assinada
const createSignedUrlBodySchema = z.object({
  // O nome do arquivo original, ex: "meu-avatar.png"
  fileName: z.string().min(1, "O nome do arquivo é obrigatório."),
  // O tipo MIME do arquivo, ex: "image/png"
  contentType: z
    .string()
    .regex(
      /^(image|audio|video)\/.+$/,
      "Apenas arquivos de imagem ou áudio ou vídeo são permitidos."
    ),
  // Campo para distinguir o tipo de upload (avatar, background, etc.)
  uploadType: z.enum([
    "avatar",
    "background",
    "audio",
    "cursor",
    "video",
    "template_preview",
  ]),
});

export const createSignedUrlSchema = {
  body: createSignedUrlBodySchema,
};

export type CreateSignedUrlInput = z.infer<typeof createSignedUrlBodySchema>;
