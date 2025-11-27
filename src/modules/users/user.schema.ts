import { z } from "zod";

const registerUserBodySchema = z.object({
  email: z.string(),
  password: z.string().min(8),
  name: z.string(),
});

const loginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const registerUserSchema = {
  body: registerUserBodySchema,
};

export const loginSchema = {
  body: loginBodySchema,
};

const updateUserBodySchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
});

// Schema para os parâmetros de rota (ex: /users/:id)
const userIdParamSchema = z.object({
  id: z.uuid({ message: "O ID do usuário deve ser um UUID válido." }),
});

// Tipos inferidos para uso no controller
export type UpdateUserInput = z.infer<typeof updateUserBodySchema>;

// Schemas completos para as rotas
export const updateUserSchema = {
  body: updateUserBodySchema,
  params: userIdParamSchema,
};

export const userIdSchema = {
  params: userIdParamSchema,
};

// Exportando os schemas que serão movidos para o módulo de auth
export * from "../auth/auth.schema";

// Isso ajuda na tipagem do request.body no controller
export type RegisterUserInput = z.infer<typeof registerUserBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;

const updateEmailBodySchema = z
  .object({
    currentPassword: z.string(),
    newEmail: z.string().email("O novo e-mail fornecido é inválido."),
    confirmNewEmail: z.string().email(),
  })
  .refine((data) => data.newEmail === data.confirmNewEmail, {
    message: "Os novos e-mails não coincidem.",
    path: ["confirmNewEmail"], // Erro será associado a este campo
  });

// Schema para atualizar senha
const updatePasswordBodySchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As novas senhas não coincidem.",
    path: ["confirmNewPassword"],
  });

export const updateEmailSchema = { body: updateEmailBodySchema };
export const updatePasswordSchema = { body: updatePasswordBodySchema };

export type UpdateEmailInput = z.infer<typeof updateEmailBodySchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordBodySchema>;
