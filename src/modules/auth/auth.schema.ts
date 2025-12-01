import { z } from "zod";

const registerUserBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string(),
  role: z.enum(["FREE", "PREMIUM"]).optional(),
});

const loginBodySchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type RegisterUserInput = z.infer<typeof registerUserBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;

export const registerUserSchema = { body: registerUserBodySchema };
export const loginSchema = { body: loginBodySchema };

const verifyEmailBodySchema = z.object({
  email: z.email(),
  token: z.string().length(6, "O código deve ter 6 dígitos."),
});

export const verifyEmailSchema = { body: verifyEmailBodySchema };
export type VerifyEmailInput = z.infer<typeof verifyEmailBodySchema>;
