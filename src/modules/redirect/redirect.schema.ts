import { z } from "zod";

export const redirectSchema = {
  params: z.object({
    linkId: z.uuid({ message: "O ID do link é inválido." }),
  }),
};
