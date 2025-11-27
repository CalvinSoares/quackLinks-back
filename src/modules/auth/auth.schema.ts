import { z } from "zod";

// Schema do corpo de registro
const registerUserBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string(),
  role: z.enum(["FREE", "PREMIUM"]).optional(),
});

// Schema do corpo de login
const loginBodySchema = z.object({
  email: z.email(),
  password: z.string(),
});

// Tipos inferidos
export type RegisterUserInput = z.infer<typeof registerUserBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;

// Schemas para as rotas
export const registerUserSchema = { body: registerUserBodySchema };
export const loginSchema = { body: loginBodySchema };

const verifyEmailBodySchema = z.object({
  email: z.email(),
  token: z.string().length(6, "O código deve ter 6 dígitos."),
});

export const verifyEmailSchema = { body: verifyEmailBodySchema };
export type VerifyEmailInput = z.infer<typeof verifyEmailBodySchema>;
