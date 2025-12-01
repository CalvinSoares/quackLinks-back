import { z } from "zod";

export const getPageBySlugSchema = {
  params: z.object({
    slug: z.string(),
  }),
};

const hexColorRegex = /^#([0-9a-f]{3}){1,2}$/i;
const hexColorRegexWithAlpha = /^#([0-9a-f]{3,4}){1,2}$/i;
const titleEffectsEnum = z.enum([
  "none",
  "typewriter",
  "rainbow",
  "neon",
  "outline",
  "glitch",
]);

const updatePageBodySchema = z.object({
  slug: z
    .string()
    .min(3)
    .regex(
      /^[a-z0-9-]+$/,
      "O slug pode conter apenas letras minúsculas, números e hifens."
    )
    .optional(),
  title: z.string().optional(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.url().optional().nullable(),
  theme: z.string().optional(),
  backgroundType: z.enum(["solid", "gradient", "image", "video"]).optional(),
  gradientDirection: z.string().optional().nullable(),
  gradientColorA: z.string().regex(hexColorRegex).optional().nullable(),
  gradientColorB: z.string().regex(hexColorRegex).optional().nullable(),
  backgroundUrl: z
    .url({ message: "URL da imagem de fundo inválida." })
    .optional()
    .nullable(),
  backgroundColor: z
    .string()
    .regex(hexColorRegex, {
      message:
        "Cor de fundo inválida. Use o formato hexadecimal (ex: #ffffff).",
    })
    .optional()
    .nullable(),
  backgroundVideoUrl: z
    .url({ message: "URL do vídeo de fundo inválida." })
    .optional()
    .nullable(),
  location: z.string().optional().nullable(),
  audioUrl: z.url({ message: "URL do áudio inválida." }).optional().nullable(),
  cursorUrl: z
    .url({ message: "URL do cursor inválida." })
    .optional()
    .nullable(),
  showAudioButton: z.boolean().optional(),
  textColor: z
    .string()
    .regex(hexColorRegex, {
      message: "Cor do texto inválida. Use o formato hexadecimal.",
    })
    .optional()
    .nullable(),
  iconColor: z
    .string()
    .regex(hexColorRegex, {
      message: "Cor do ícone inválida. Use o formato hexadecimal.",
    })
    .optional()
    .nullable(),
  showProfileCard: z.boolean().optional(),
  profileCardColor: z
    .string()
    .regex(hexColorRegexWithAlpha, {
      message:
        "Cor do card inválida. Use o formato hexadecimal (ex: #RRGGBBAA).",
    })
    .optional()
    .nullable(),
  profileCardOpacity: z.number().min(0).max(1).optional(),
  showViewCount: z.boolean().optional(),
  linkStyle: z
    .enum(["classic", "minimal", "brutalist", "spotlight"])
    .optional(),
  layoutLinkStyle: z.enum(["list", "grid", "icons_only", "stacked"]).optional(),
  titleEffect: titleEffectsEnum.optional(),

  layoutType: z.enum(["list", "grid", "icons_only", "stacked"]).optional(),
  useStandardIconColors: z.boolean().optional(),
  glowEffect: z.enum(["none", "title", "icons", "both"]).optional(),
  profileRingType: z
    .enum(["none", "solid", "gradient", "animated"])
    .optional()
    .nullable(),
  profileRingColors: z
    .array(
      z.string().regex(hexColorRegex, { message: "Cor inválida na borda." })
    )
    .max(3, "Você pode ter no máximo 3 cores na borda.")
    .optional(),
});

export const updatePageSchema = {
  body: updatePageBodySchema,
};

export type UpdatePageInput = z.infer<typeof updatePageBodySchema>;
